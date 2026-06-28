import type { FormatMetric } from '../formats/plugin';
import type { ScoreGridComponentId } from './result-vocabulary';
import type { SlotResultView } from './result-sections';
import type {
    SlotBall,
    SlotTeamGrouping,
    StrategyResult,
} from './types';
import type { ResultColumn } from './result-presenter-helpers';

export interface FormatResultInput {
    slotIndex: number;
    slotDefId: string;
    formatId: string;
    formatLabel: string;
    scoringMode: string;
    teamShape: string;
    allowanceLabel: string;
    metrics: FormatMetric[];
    runningNormalized: boolean;
    scoreGridComponentId?: ScoreGridComponentId;
    /** Drop the card-footer total when it only duplicates other surfaces. */
    hideCardTotals?: boolean;
    result: StrategyResult;
    slotBalls: SlotBall[];
    slotTeamGroupings: SlotTeamGrouping[];
    /** Played itinerary occurrences, in canonical ordinal order — the grid columns. */
    columns: ResultColumn[];
    /**
     * Per-ball effective SI (ballId → playHoleId → SI), for single-producer
     * cards on mixed-tee rounds so the displayed SI matches each ball's own-tee
     * stroke allocation. Omit for team/pair cards and single-tee rounds.
     */
    effectiveSi?: Map<string, Map<string, number>>;
}

export type FormatResultPresenter = (input: FormatResultInput) => SlotResultView;
