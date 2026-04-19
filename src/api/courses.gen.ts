// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface Course {
    id: string;
    clubId: string;
    name: string;
    holeCount: number;
    holes: Hole[];
}

export interface Hole {
    holeNumber: number;
    par: number;
    strokeIndex: number;
}

export interface CoursesApi {
    list(): Promise<Course[]>;
    listByClub(input: { clubId: string }): Promise<Course[]>;
    get(input: { id: string }): Promise<null | Course>;
    create(input: { name: string; clubId: string; holeCount: 9 | 18; holes: { holeNumber: number; par: number; strokeIndex: number }[] }): Promise<Course>;
    update(input: { name?: string; holeCount?: 9 | 18; holes?: { holeNumber: number; par: number; strokeIndex: number }[]; id: string }): Promise<Course>;
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
        async remove(input) {
            return apiFetch({ method: 'DELETE', url: `${baseUrl}/courses/${input.id}` });
        },
    };
}
