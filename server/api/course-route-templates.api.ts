import { Type, type Static } from '@sinclair/typebox';
import { requireAuth } from '@basics/core/server/auth';
import {
    CourseRouteTemplateService,
    RouteTemplateValidationError,
    type CourseRouteTemplate,
} from '../services/course-route-template.service';
import { CourseRouteTemplateRoute } from '../domain/course-route-template';
import type { CompilerDiagnostic } from '../domain/compiler/types';

// --- Input schemas ---
//
// Phase 2.6b-final / Slice 5. Authorization note: every route is
// authenticated. Finer-grained authorization — club/course admins manage
// shared templates, a round creator only reads + (where round policy permits)
// overrides — lands with the dedicated authorization phase, the same stage the
// clubs/courses write paths gain admin enforcement. Until then these mirror
// the courses API (requireAuth only).

const IdInput = Type.Object({ id: Type.String() });
const ByCourseInput = Type.Object({ courseId: Type.String() });

const CreateInput = Type.Object({
    courseId: Type.String(),
    name: Type.String({ minLength: 1 }),
    route: CourseRouteTemplateRoute,
});

const UpdateInput = Type.Object({
    id: Type.String(),
    name: Type.Optional(Type.String({ minLength: 1 })),
    route: Type.Optional(CourseRouteTemplateRoute),
});

const ValidateInput = Type.Object({
    courseId: Type.String(),
    route: CourseRouteTemplateRoute,
});

// --- API descriptor ---

/** Create/update response: the saved template, or structured route diagnostics. */
type SaveResult =
    | { ok: true; template: CourseRouteTemplate }
    | { ok: false; diagnostics: CompilerDiagnostic[] };

export function createCourseRouteTemplatesApi(svc: CourseRouteTemplateService) {
    const mw = [requireAuth()];

    // A route that fails the pure route compiler returns a structured
    // `{ ok: false, diagnostics }` the wizard attaches to the route control —
    // not a 500. (The mount layer maps only framework error classes to status
    // codes, so a thrown validation error would otherwise surface as 500.)
    async function save(fn: () => Promise<CourseRouteTemplate>): Promise<SaveResult> {
        try {
            return { ok: true, template: await fn() };
        } catch (e) {
            if (e instanceof RouteTemplateValidationError) {
                return { ok: false, diagnostics: e.diagnostics };
            }
            throw e;
        }
    }

    return {
        listByCourse: { method: 'GET' as const, path: '/course-route-templates', fn: (input: Static<typeof ByCourseInput>) => svc.list(input.courseId), schema: ByCourseInput, middleware: mw },
        get: { method: 'GET' as const, path: '/course-route-templates/get', fn: (input: Static<typeof IdInput>) => svc.getById(input.id), schema: IdInput, middleware: mw },
        validate: { method: 'POST' as const, path: '/course-route-templates/validate', fn: (input: Static<typeof ValidateInput>) => svc.validateRoute(input.courseId, input.route), schema: ValidateInput, middleware: mw },
        create: { method: 'POST' as const, path: '/course-route-templates', fn: (input: Static<typeof CreateInput>) => save(() => svc.create(input)), schema: CreateInput, middleware: mw },
        update: { method: 'POST' as const, path: '/course-route-templates/update', fn: (input: Static<typeof UpdateInput>) => save(() => svc.update(input.id, { name: input.name, route: input.route })), schema: UpdateInput, middleware: mw },
        remove: { method: 'DELETE' as const, path: '/course-route-templates/:id', fn: (input: Static<typeof IdInput>) => svc.remove(input.id), schema: IdInput, middleware: mw },
    };
}
