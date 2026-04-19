// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface Tee {
    id: string;
    courseId: string;
    name: string;
    colour: null | string;
    holeLengths: TeeHoleLength[];
    ratings: TeeRating[];
}

export interface TeeHoleLength {
    holeNumber: number;
    lengthM: number;
    strokeIndexOverride: null | number;
}

export interface TeeRating {
    gender: 'M' | 'F';
    courseRating: number;
    slope: number;
    par: number;
    totalLengthM: number;
}

export interface TeesApi {
    listByCourse(input: { courseId: string }): Promise<Tee[]>;
    get(input: { id: string }): Promise<null | Tee>;
    create(input: { colour?: null | string; name: string; courseId: string; holeLengths: ({ holeNumber: number; lengthM: number; strokeIndexOverride: null | number })[]; ratings: ({ gender: 'M' | 'F'; par: number; courseRating: number; slope: number; totalLengthM: number })[] }): Promise<Tee>;
    update(input: { name?: string; colour?: null | string; holeLengths?: ({ holeNumber: number; lengthM: number; strokeIndexOverride: null | number })[]; ratings?: ({ gender: 'M' | 'F'; par: number; courseRating: number; slope: number; totalLengthM: number })[]; id: string }): Promise<Tee>;
    remove(input: { id: string }): Promise<{ ok: boolean }>;
}

export function createTeesClient(baseUrl: string): TeesApi {
    return {
        async listByCourse(input) {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/tees/by-course${qs ? '?' + qs : ''}` });
        },
        async get(input) {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/tees/get${qs ? '?' + qs : ''}` });
        },
        async create(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/tees`, body: input });
        },
        async update(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/tees/update`, body: input });
        },
        async remove(input) {
            return apiFetch({ method: 'DELETE', url: `${baseUrl}/tees/${input.id}` });
        },
    };
}
