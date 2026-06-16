// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface CourseRouteTemplate {
    id: string;
    courseId: string;
    name: string;
    route: { routeSi?: { sourceLabel?: string; sourceVersion?: string; allocationCycleSize?: number; mode: 'official' | 'difficulty' | 'custom' }; routeHandicapPolicy?: { postingIneligibleReason?: string; type: 'official_route' | 'full_course_casual' | 'prorated_casual' | 'explicit'; postingEligible: boolean }; routeSections?: { id: string; label: string; fromCanonicalOrdinal: number; toCanonicalOrdinal: number }[]; playHoles: { id?: string; parOverride?: number; baseStrokeIndexOverride?: number; teeOverrides?: { lengthM?: number; strokeIndexOverride?: number; teeId: string }[]; courseHoleNumber: number }[] };
    createdAt: string;
    updatedAt: string;
}

export interface CompilerDiagnostic {
    code: string;
    message: string;
    path?: string;
}

export interface CourseRouteTemplatesApi {
    listByCourse(input: { courseId: string }): Promise<CourseRouteTemplate[]>;
    get(input: { id: string }): Promise<null | CourseRouteTemplate>;
    validate(input: { courseId: string; route: { routeSi?: { sourceLabel?: string; sourceVersion?: string; allocationCycleSize?: number; mode: 'official' | 'difficulty' | 'custom' }; routeHandicapPolicy?: { postingIneligibleReason?: string; type: 'official_route' | 'full_course_casual' | 'prorated_casual' | 'explicit'; postingEligible: boolean }; routeSections?: { id: string; label: string; fromCanonicalOrdinal: number; toCanonicalOrdinal: number }[]; playHoles: { id?: string; parOverride?: number; baseStrokeIndexOverride?: number; teeOverrides?: { lengthM?: number; strokeIndexOverride?: number; teeId: string }[]; courseHoleNumber: number }[] } }): Promise<CompilerDiagnostic[]>;
    create(input: { name: string; courseId: string; route: { routeSi?: { sourceLabel?: string; sourceVersion?: string; allocationCycleSize?: number; mode: 'official' | 'difficulty' | 'custom' }; routeHandicapPolicy?: { postingIneligibleReason?: string; type: 'official_route' | 'full_course_casual' | 'prorated_casual' | 'explicit'; postingEligible: boolean }; routeSections?: { id: string; label: string; fromCanonicalOrdinal: number; toCanonicalOrdinal: number }[]; playHoles: { id?: string; parOverride?: number; baseStrokeIndexOverride?: number; teeOverrides?: { lengthM?: number; strokeIndexOverride?: number; teeId: string }[]; courseHoleNumber: number }[] } }): Promise<{ ok: true; template: CourseRouteTemplate } | { ok: false; diagnostics: CompilerDiagnostic[] }>;
    update(input: { name?: string; route?: { routeSi?: { sourceLabel?: string; sourceVersion?: string; allocationCycleSize?: number; mode: 'official' | 'difficulty' | 'custom' }; routeHandicapPolicy?: { postingIneligibleReason?: string; type: 'official_route' | 'full_course_casual' | 'prorated_casual' | 'explicit'; postingEligible: boolean }; routeSections?: { id: string; label: string; fromCanonicalOrdinal: number; toCanonicalOrdinal: number }[]; playHoles: { id?: string; parOverride?: number; baseStrokeIndexOverride?: number; teeOverrides?: { lengthM?: number; strokeIndexOverride?: number; teeId: string }[]; courseHoleNumber: number }[] }; id: string }): Promise<{ ok: true; template: CourseRouteTemplate } | { ok: false; diagnostics: CompilerDiagnostic[] }>;
    remove(input: { id: string }): Promise<{ ok: boolean }>;
}

export function createCourseRouteTemplatesClient(baseUrl: string): CourseRouteTemplatesApi {
    return {
        async listByCourse(input) {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/course-route-templates${qs ? '?' + qs : ''}` });
        },
        async get(input) {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/course-route-templates/get${qs ? '?' + qs : ''}` });
        },
        async validate(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/course-route-templates/validate`, body: input });
        },
        async create(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/course-route-templates`, body: input });
        },
        async update(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/course-route-templates/update`, body: input });
        },
        async remove(input) {
            return apiFetch({ method: 'DELETE', url: `${baseUrl}/course-route-templates/${input.id}` });
        },
    };
}
