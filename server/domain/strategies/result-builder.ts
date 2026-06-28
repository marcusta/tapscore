// Phase 2.6b-final / Slice 2b — pure StrategyResult → SlotResultView builder.
//
// TRANSITIONAL: this was the default builder for formats not yet migrated to
// their own presenter. Every PRODUCTION format now owns a `renderResult`, so the
// only remaining fallback users are test-only canary plugins that deliberately
// omit `renderResult` to exercise the dispatch fallback. Those canaries are all
// individual point formats, so `buildSlotResult` now just DELEGATES to the moved
// generic individual-grid composition — the card/row/leaderboard logic lives in
// ONE place (`formats/default-grid.presenter.ts`), never copied here. Phase G
// deletes the default presenter and this file outright.

import type { SlotResultView } from './result-sections';
import type { FormatResultInput } from './result-presenter';
import { defaultGridPresenter } from './formats/default-grid.presenter';

export type { ResultColumn } from './result-presenter-helpers';

export type { FormatResultInput } from './result-presenter';

/** @deprecated use FormatResultInput */
export type BuildSlotInput = FormatResultInput;

const gridPresenter = defaultGridPresenter();

/**
 * Transitional fallback. No production format reaches it (all have their own
 * `renderResult`); the remaining callers are individual-grid test canaries, so
 * it reuses the moved generic individual-grid presenter rather than carrying a
 * second copy of the card composition. Do NOT add format behavior here.
 */
export function buildSlotResult(input: BuildSlotInput): SlotResultView {
    return gridPresenter(input);
}
