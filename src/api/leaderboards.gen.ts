// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface RoundResult {
    slots: SlotResultView[];
    routeSections: RouteSectionRef[];
    posting: { eligible: boolean; reason: null | string };
}

export interface SlotResultView {
    slotIndex: number;
    slotDefId: string;
    formatId: string;
    formatLabel: string;
    scoringMode: string;
    teamShape: string;
    allowanceLabel: string;
    cards: ScoreGridSection[];
    leaderboard: (RankedSection | MatchSummarySection)[];
}

export interface RouteSectionRef {
    id: string;
    label: string;
    fromCanonicalOrdinal: number;
    toCanonicalOrdinal: number;
}

export interface ScoreGridSection {
    kind: 'score_grid';
    title: { groups: string[][]; joiner: string };
    subjectBallIds: string[];
    holes: HoleRef[];
    subtitleFacts: string[];
    rows: GridRow[];
    footnotes: string[];
    caption?: string;
    totals: ({ label: string; value: null | number })[];
}

export interface RankedSection {
    kind: 'ranked';
    metricId: string;
    metricLabel: string;
    entries: RankedEntry[];
}

export interface MatchSummarySection {
    kind: 'match_summary';
    title: string;
    lines: MatchLine[];
}

export interface HoleRef {
    holeNumber: number;
    playHoleId: string;
    courseHoleNumber: number;
    canonicalOrdinal: number;
    occurrenceLabel: string;
}

export interface GridRow {
    label: string;
    subjectBallId?: string;
    kind: 'par' | 'si' | 'given' | 'gross' | 'net' | 'points' | 'running' | 'status' | 'category' | 'free';
    cells: GridCell[];
    aggregate: 'sum' | 'last' | 'none';
    emphasis?: boolean;
    team?: 'a' | 'b';
}

export interface RankedEntry {
    ballIds: string[];
    total: null | number;
    holesPlayed: number;
    position: number;
}

export interface MatchLine {
    segments: ({ text: string } | { ballIds: string[] })[];
    result: 'won' | 'lost' | 'halved' | 'in_progress';
}

export interface GridCell {
    playHoleId: string;
    holeNumber: number;
    value: null | number;
    display?: string;
    title?: string;
    mark?: 'win' | 'win2' | 'win5';
}

export interface LeaderboardsApi {
    forRound(input: { roundId: string }): Promise<RoundResult>;
}

export function createLeaderboardsClient(baseUrl: string): LeaderboardsApi {
    return {
        async forRound(input) {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/leaderboards/for-round${qs ? '?' + qs : ''}` });
        },
    };
}
