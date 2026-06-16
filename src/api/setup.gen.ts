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

export interface FormatDescriptor {
    id: string;
    label: string;
    description: string;
    scoringMode: string;
    teamShape: string;
    requirements: FormatRequirements;
    defaults: { allowanceConfig: { type: 'flat'; pct: number } | { type: 'split'; bands: ({ pct: number; upToCh: null | number })[] } };
    metrics: FormatMetric[];
    resultDisplay?: { runningTotals?: 'normalized' };
    scoresAnyBall?: boolean;
    clientAdapterId: null | string;
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

export interface FormatRequirements {
    balls: FormatBallRequirement;
    scoreEntry?: ScoreEntryCapabilities;
    holeCoordinate?: 'played_ordinal' | 'canonical_ordinal' | 'course_hole_number';
    allowSegmentOverlap?: boolean;
}

export interface FormatMetric {
    id: string;
    label: string;
    direction: 'high' | 'low';
}

export interface FormatBallRequirement {
    producerCount: { min: number; max: number };
    ballMode: 'own' | 'team' | 'any';
    topology?: 'static' | 'scheduled' | 'dynamic';
    requiresSlotTeamGrouping?: boolean;
    slotBallCount?: { min?: number; max?: number; multipleOf?: number };
    slotTeamGrouping?: { teamCount?: { min?: number; max?: number }; teamSize?: { min?: number; max?: number } };
}

export interface ScoreEntryCapabilities {
    strokes: boolean;
    metadata?: MetadataInput[];
}

export interface MetadataInput {
    key: string;
    label: string;
    kind: 'number' | 'boolean';
    appliesWhen?: MetadataApplies;
}

export interface MetadataApplies {
    minPar?: number;
    maxPar?: number;
    pars?: number[];
    holes?: number[];
}

export interface SetupApi {
    courses(): Promise<Course[]>;
    teesByCourse(input: { courseId: string }): Promise<Tee[]>;
    formats(): Promise<FormatDescriptor[]>;
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
        async formats() {
            return apiFetch({ method: 'GET', url: `${baseUrl}/setup/formats` });
        },
    };
}
