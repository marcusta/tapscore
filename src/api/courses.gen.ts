// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface Course {
    id: string;
    clubId: string;
    name: string;
    holeCount: number;
    holes: Hole[];
}

export interface CourseValidation {
    ok: boolean;
    issues: CourseIssue[];
}

export interface Hole {
    holeNumber: number;
    par: number;
    strokeIndex: number;
}

export interface CourseIssue {
    severity: 'error' | 'warning';
    code: 'missing_holes' | 'unexpected_holes' | 'duplicate_stroke_index' | 'missing_stroke_indices' | 'stroke_index_out_of_range' | 'unusual_par';
    message: string;
    holeNumbers?: number[];
}

export interface CoursesApi {
    list(): Promise<Course[]>;
    listByClub(input: { clubId: string }): Promise<Course[]>;
    get(input: { id: string }): Promise<null | Course>;
    create(input: { holes?: { par: number; holeNumber: number; strokeIndex: number }[]; name: string; clubId: string; holeCount: 9 | 18 }): Promise<Course>;
    update(input: { name?: string; holeCount?: 9 | 18; holes?: { par: number; holeNumber: number; strokeIndex: number }[]; id: string }): Promise<Course>;
    updateHole(input: { par?: number; strokeIndex?: number; courseId: string; holeNumber: number }): Promise<Course>;
    validate(input: { id: string }): Promise<CourseValidation>;
    remove(input: { id: string }): Promise<{ ok: boolean }>;
}

export function createCoursesClient(baseUrl: string): CoursesApi {
    return {
        async list() {
            return apiFetch({ method: 'GET', url: `${baseUrl}/courses` });
        },
        async listByClub(input) {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/courses/by-club${qs ? '?' + qs : ''}` });
        },
        async get(input) {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/courses/get${qs ? '?' + qs : ''}` });
        },
        async create(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/courses`, body: input });
        },
        async update(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/courses/update`, body: input });
        },
        async updateHole(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/courses/holes/update`, body: input });
        },
        async validate(input) {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/courses/validate${qs ? '?' + qs : ''}` });
        },
        async remove(input) {
            return apiFetch({ method: 'DELETE', url: `${baseUrl}/courses/${input.id}` });
        },
    };
}
