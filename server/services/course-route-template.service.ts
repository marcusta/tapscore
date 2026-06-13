import type { Kysely, Selectable } from 'kysely';
import type { Database, CourseRouteTemplatesTable } from '../db/schema';
import type { CourseRouteTemplateRoute } from '../domain/course-route-template';
import type { DraftRoute } from '../domain/round-setup/draft';
import type { CompilerDiagnostic } from '../domain/compiler/types';
import { compileRoute } from '../domain/compiler/route-compiler';
import type { PlayHoleInput } from '../domain/round-definition';

// --- Output types ---

export interface CourseRouteTemplate {
    id: string;
    courseId: string;
    name: string;
    route: CourseRouteTemplateRoute;
    createdAt: string;
    updatedAt: string;
}

export interface CreateCourseRouteTemplateInput {
    courseId: string;
    name: string;
    route: CourseRouteTemplateRoute;
}

export interface UpdateCourseRouteTemplateInput {
    name?: string;
    route?: CourseRouteTemplateRoute;
}

/** Thrown when a template's route fails the pure route compiler. */
export class RouteTemplateValidationError extends Error {
    constructor(public diagnostics: CompilerDiagnostic[]) {
        super(`invalid route template: ${diagnostics.map((d) => `${d.code}: ${d.message}`).join('; ')}`);
        this.name = 'RouteTemplateValidationError';
    }
}

type Row = Selectable<CourseRouteTemplatesTable>;

function toTemplate(row: Row): CourseRouteTemplate {
    return {
        id: row.id,
        courseId: row.course_id,
        name: row.name,
        route: JSON.parse(row.definition_json) as CourseRouteTemplateRoute,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export class CourseRouteTemplateService {
    constructor(private db: Kysely<Database>) {}

    private async courseHoles(
        courseId: string,
    ): Promise<{ holeNumber: number; par: number; baseStrokeIndex: number }[]> {
        const rows = await this.db
            .selectFrom('course_holes')
            .select(['hole_number', 'par', 'stroke_index'])
            .where('course_id', '=', courseId)
            .execute();
        return rows.map((h) => ({
            holeNumber: h.hole_number,
            par: h.par,
            baseStrokeIndex: h.stroke_index,
        }));
    }

    /**
     * Validate a route template against a course's holes through the SAME pure
     * route compiler `RoundSetupDraft` uses. Returns structured diagnostics
     * (empty = valid) so the wizard can attach them to the offending control.
     */
    async validateRoute(
        courseId: string,
        route: CourseRouteTemplateRoute,
    ): Promise<CompilerDiagnostic[]> {
        const courseHoles = await this.courseHoles(courseId);
        const { diagnostics } = compileRoute({
            courseHoles,
            playHoles: route.playHoles,
            routeSi: route.routeSi,
            routeHandicapPolicy: route.routeHandicapPolicy,
            routeSections: route.routeSections,
        });
        return diagnostics;
    }

    async list(courseId: string): Promise<CourseRouteTemplate[]> {
        const rows = await this.db
            .selectFrom('course_route_templates')
            .selectAll()
            .where('course_id', '=', courseId)
            .orderBy('name')
            .execute();
        return rows.map(toTemplate);
    }

    async getById(id: string): Promise<CourseRouteTemplate | null> {
        const row = await this.db
            .selectFrom('course_route_templates')
            .selectAll()
            .where('id', '=', id)
            .executeTakeFirst();
        return row ? toTemplate(row) : null;
    }

    async create(input: CreateCourseRouteTemplateInput): Promise<CourseRouteTemplate> {
        const diagnostics = await this.validateRoute(input.courseId, input.route);
        if (diagnostics.length > 0) throw new RouteTemplateValidationError(diagnostics);

        const id = crypto.randomUUID();
        await this.db
            .insertInto('course_route_templates')
            .values({
                id,
                course_id: input.courseId,
                name: input.name,
                definition_json: JSON.stringify(input.route),
            })
            .execute();

        const created = await this.getById(id);
        if (!created) throw new Error(`route template ${id} not found after create`);
        return created;
    }

    async update(id: string, input: UpdateCourseRouteTemplateInput): Promise<CourseRouteTemplate> {
        const existing = await this.getById(id);
        if (!existing) throw new Error(`route template ${id} not found`);

        if (input.route !== undefined) {
            const diagnostics = await this.validateRoute(existing.courseId, input.route);
            if (diagnostics.length > 0) throw new RouteTemplateValidationError(diagnostics);
        }

        const patch: Record<string, unknown> = { updated_at: '2026-06-13T00:00:00.000Z' };
        if (input.name !== undefined) patch.name = input.name;
        if (input.route !== undefined) patch.definition_json = JSON.stringify(input.route);
        await this.db
            .updateTable('course_route_templates')
            .set(patch)
            .where('id', '=', id)
            .execute();

        const updated = await this.getById(id);
        if (!updated) throw new Error(`route template ${id} not found after update`);
        return updated;
    }

    async remove(id: string): Promise<void> {
        await this.db.deleteFrom('course_route_templates').where('id', '=', id).execute();
    }

    /**
     * Resolve a template into explicit `DraftRoute` fields, FROZEN so a later
     * template edit never rewrites a round that already copied it. The resolved
     * occurrences (explicit def-ids + frozen par/SI) become `parOverride` /
     * `baseStrokeIndexOverride` play-hole inputs; the resolved SI/policy/sections
     * are copied verbatim. Throws if the (re-)validation fails.
     */
    async resolveForRound(id: string): Promise<DraftRoute> {
        const template = await this.getById(id);
        if (!template) throw new Error(`route template ${id} not found`);
        const courseHoles = await this.courseHoles(template.courseId);
        const { route, diagnostics } = compileRoute({
            courseHoles,
            playHoles: template.route.playHoles,
            routeSi: template.route.routeSi,
            routeHandicapPolicy: template.route.routeHandicapPolicy,
            routeSections: template.route.routeSections,
        });
        if (diagnostics.length > 0) throw new RouteTemplateValidationError(diagnostics);

        const playHoles: PlayHoleInput[] = route.playHoles.map((ph) => ({
            id: ph.id,
            courseHoleNumber: ph.courseHoleNumber,
            parOverride: ph.par,
            baseStrokeIndexOverride: ph.baseStrokeIndex,
            ...(ph.teeOverrides ? { teeOverrides: ph.teeOverrides } : {}),
        }));
        return {
            playHoles,
            routeSi: {
                mode: route.routeSi.mode,
                ...(route.routeSi.sourceLabel ? { sourceLabel: route.routeSi.sourceLabel } : {}),
                ...(route.routeSi.sourceVersion ? { sourceVersion: route.routeSi.sourceVersion } : {}),
                allocationCycleSize: route.routeSi.allocationCycleSize,
            },
            routeHandicapPolicy: route.routeHandicapPolicy,
            routeSections: route.routeSections,
        };
    }
}
