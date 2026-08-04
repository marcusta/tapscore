// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface ClubListItem {
    id: string;
    name: string;
    location: null | string;
    logoUrl: null | string;
    courseCount: number;
}

export interface SetupCourse {
    id: string;
    clubId: string;
    name: string;
    holeCount: number;
    latitude: null | number;
    longitude: null | number;
    holes: Hole[];
    clubName: string;
}

export interface Tee {
    id: string;
    courseId: string;
    name: string;
    colour: null | string;
    holeLengths: TeeHoleLength[];
    ratings: TeeRating[];
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

export interface FormatDescriptor {
    id: string;
    label: string;
    labels: FormatLabels;
    description: string;
    scoringMode: string;
    teamShape: string;
    requirements: FormatRequirements;
    defaults: { allowanceConfig: { type: 'flat'; pct: number } | { type: 'split'; bands: ({ upToCh: null | number; pct: number })[] }; formatConfig?: Record<string, string> };
    configFields?: FormatConfigField[];
    preset?: FormatPreset;
    metrics: FormatMetric[];
    resultDisplay?: { runningTotals?: 'normalized'; scoreGridComponentId?: 'default-score-grid' | 'compact-match-grid' | 'category-matrix-grid' };
    scoresAnyBall?: boolean;
    clientAdapterId: null | string;
}

export interface AggregationDescriptor {
    id: string;
    label: string;
    labels: AggregationLabels;
    description: string;
    configFields?: ({ kind: 'select'; key: string; label: string; options: { value: string; label: string }[]; default: string } | { kind: 'integer'; key: string; label: string; default: number; min?: number })[];
}

export interface FormationDescriptor {
    id: string;
    labels: FormationLabels;
    size: FormationSize;
    allowancesBySize: Record<string, number[]>;
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

export interface FormatLabels {
    en: string;
    sv?: string;
}

export interface FormatRequirements {
    balls: FormatBallRequirement;
    scoreEntry?: ScoreEntryCapabilities;
    holeCoordinate?: 'played_ordinal' | 'canonical_ordinal' | 'course_hole_number';
    allowSegmentOverlap?: boolean;
}

export interface FormatConfigField {
    kind: 'select';
    key: string;
    labels: FormatLabels;
    options: FormatConfigOption[];
    default: string;
}

export interface FormatPreset {
    tagline: FormatLabels;
    rank?: number;
}

export interface FormatMetric {
    id: string;
    label: string;
    direction: 'high' | 'low';
    pace?: 'par' | { perHole: number };
}

export interface AggregationLabels {
    en: string;
    sv?: string;
}

export interface FormationLabels {
    en: string;
    sv?: string;
}

export interface FormationSize {
    min: number;
    max: number;
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

export interface FormatConfigOption {
    value: string;
    labels: FormatLabels;
    hint?: FormatLabels;
}

export interface MetadataInput {
    key: string;
    label: string;
    kind: 'number' | 'boolean';
    appliesWhen?: MetadataApplies;
    min?: number;
    max?: number;
}

export interface MetadataApplies {
    minPar?: number;
    maxPar?: number;
    pars?: number[];
    holes?: number[];
}

export interface SetupApi {
    clubs(): Promise<ClubListItem[]>;
    courses(): Promise<SetupCourse[]>;
    teesByCourse(input: { courseId: string }): Promise<Tee[]>;
    teeRoleCatalog(): Promise<TeeRole[]>;
    teeRolesByCourse(input: { courseId: string }): Promise<CourseTeeRole[]>;
    formats(): Promise<FormatDescriptor[]>;
    aggregations(): Promise<AggregationDescriptor[]>;
    formations(): Promise<FormationDescriptor[]>;
}

export function createSetupClient(baseUrl: string): SetupApi {
    return {
        async clubs() {
            return apiFetch({ method: 'GET', url: `${baseUrl}/setup/clubs` });
        },
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
        async teeRoleCatalog() {
            return apiFetch({ method: 'GET', url: `${baseUrl}/setup/tee-roles/catalog` });
        },
        async teeRolesByCourse(input) {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/setup/tee-roles/by-course${qs ? '?' + qs : ''}` });
        },
        async formats() {
            return apiFetch({ method: 'GET', url: `${baseUrl}/setup/formats` });
        },
        async aggregations() {
            return apiFetch({ method: 'GET', url: `${baseUrl}/setup/aggregations` });
        },
        async formations() {
            return apiFetch({ method: 'GET', url: `${baseUrl}/setup/formations` });
        },
    };
}
