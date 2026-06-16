// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface Course {
    id: string;
    clubId: string;
    name: string;
    holeCount: number;
    holes: Hole[];
}

export interface Tee {
    id: string;
    courseId: string;
    name: string;
    colour: null | string;
    holeLengths: TeeHoleLength[];
    ratings: TeeRating[];
}

export interface Hole {
    holeNumber: number;
    par: number;
    strokeIndex: number;
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

export interface SetupApi {
    courses(): Promise<Course[]>;
    teesByCourse(input: { courseId: string }): Promise<Tee[]>;
}

export function createSetupClient(baseUrl: string): SetupApi {
    return {
        async courses() {
            return apiFetch({ method: 'GET', url: `${baseUrl}/setup/courses` });
        },
        async teesByCourse(input) {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/setup/tees/by-course${qs ? '?' + qs : ''}` });
        },
    };
}
