// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface FormatDescriptor {
    id: string;
    label: string;
    description: string;
    scoringMode: string;
    teamShape: string;
    requirements: FormatRequirements;
    defaults: { allowanceConfig: { type: 'flat'; pct: number } | { type: 'split'; bands: ({ pct: number; upToCh: null | number })[] } };
    metrics: FormatMetric[];
    resultDisplay?: { runningTotals?: 'normalized'; scoreGridComponentId?: 'default-score-grid' | 'compact-match-grid' | 'category-matrix-grid' };
    scoresAnyBall?: boolean;
    clientAdapterId: null | string;
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

export interface FormatsApi {
    list(): Promise<FormatDescriptor[]>;
}

export function createFormatsClient(baseUrl: string): FormatsApi {
    return {
        async list() {
            return apiFetch({ method: 'GET', url: `${baseUrl}/formats` });
        },
    };
}
