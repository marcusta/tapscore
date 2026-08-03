// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface Course {
    id: string;
    clubId: string;
    name: string;
    holeCount: number;
    latitude: null | number;
    longitude: null | number;
    holes: Hole[];
}

export interface ClubCourse {
    id: string;
    clubId: string;
    name: string;
    holeCount: number;
    latitude: null | number;
    longitude: null | number;
    holes: Hole[];
    teeCount: number;
}

export interface TeeRole {
    roleKey: string;
    displayName: string;
    sortOrder: number;
}

export interface CourseTeeRole {
    courseId: string;
    roleKey: string;
    gender: 'M' | 'F';
    teeId: string;
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
    severity: 'warning' | 'error';
    code: 'missing_holes' | 'unexpected_holes' | 'duplicate_stroke_index' | 'missing_stroke_indices' | 'stroke_index_out_of_range' | 'unusual_par';
    message: string;
    holeNumbers?: number[];
}

export interface CoursesApi {
    list(): Promise<Course[]>;
    listByClub(input: { clubId: string }): Promise<ClubCourse[]>;
    get(input: { id: string }): Promise<null | Course>;
    teeRoleCatalog(): Promise<TeeRole[]>;
    teeRoles(input: { courseId: string }): Promise<CourseTeeRole[]>;
    create(input: { clubId: string; name: string; holeCount: 9 | 18; holes?: { holeNumber: number; par: number; strokeIndex: number }[]; latitude?: null | number; longitude?: null | number }): Promise<Course>;
    update(input: { id: string; name?: string; holeCount?: 9 | 18; holes?: { holeNumber: number; par: number; strokeIndex: number }[]; latitude?: null | number; longitude?: null | number }): Promise<Course>;
    updateHole(input: { courseId: string; holeNumber: number; par?: number; strokeIndex?: number }): Promise<Course>;
    setTeeRole(input: { courseId: string; roleKey: string; gender: 'M' | 'F'; teeId: string }): Promise<CourseTeeRole>;
    clearTeeRole(input: { courseId: string; roleKey: string; gender: 'M' | 'F' }): Promise<{ ok: boolean }>;
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
        async teeRoleCatalog() {
            return apiFetch({ method: 'GET', url: `${baseUrl}/courses/tee-roles/catalog` });
        },
        async teeRoles(input) {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/courses/tee-roles${qs ? '?' + qs : ''}` });
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
        async setTeeRole(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/courses/tee-roles`, body: input });
        },
        async clearTeeRole(input) {
            return apiFetch({ method: 'DELETE', url: `${baseUrl}/courses/tee-roles/${input.courseId}/${input.roleKey}/${input.gender}` });
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
