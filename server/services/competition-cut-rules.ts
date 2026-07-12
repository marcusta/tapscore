// Phase 4 Slice 4 — the shape of `competitions.cut_rules_json`.
//
// Spec §5 "Cut": one rule per competition — `{ after_round, cut_type,
// cut_value }`. Stored camelCase (`afterRound`/`cutType`/`cutValue`) like every
// other service-boundary JSON document in this app (defaultConfig,
// aggregation); the spec names map 1:1.
//
// `cut_type` semantics (implemented by CompetitionCutService.applyCut):
//   - `top_n`          — the best `cutValue` participants advance; everyone
//                        TIED AT the line advances too (golf convention).
//   - `top_percent`    — `ceil(field × cutValue/100)` advance (field = ranked,
//                        non-withdrawn entries); same tie-at-the-line rule.
//   - `within_strokes` — participants within `cutValue` of the LEADER advance
//                        (the PGA "10-shot rule" reference point — the spec
//                        left leader-vs-nth open; leader is the documented
//                        choice here).
//
// The spec also names a `custom` cut type; it has no defined semantics yet and
// is deliberately NOT accepted — a rule nobody can evaluate must not persist.
// It joins the union when a phase gives it meaning.

import { Type, type Static } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';

export const CompetitionCutRule = Type.Object({
    /** The cut is applied once rounds 1..afterRound are all complete. */
    afterRound: Type.Integer({ minimum: 1 }),
    cutType: Type.Union([
        Type.Literal('top_n'),
        Type.Literal('top_percent'),
        Type.Literal('within_strokes'),
    ]),
    /** top_n: how many advance; top_percent: 1..100; within_strokes: strokes
     *  (metric units) behind the leader that still advance. */
    cutValue: Type.Integer({ minimum: 1 }),
});

export type CompetitionCutRule = Static<typeof CompetitionCutRule>;

/**
 * Structural validation problems for a candidate cut rule, humanized enough to
 * render inline. Empty ⇒ valid. The update path refuses on any problem, so a
 * STORED rule is always valid; `applyCut` re-checks defensively (rows may
 * predate validation).
 */
export function cutRuleProblems(value: unknown): string[] {
    if (Value.Check(CompetitionCutRule, value)) {
        const rule = value as CompetitionCutRule;
        if (rule.cutType === 'top_percent' && rule.cutValue > 100) {
            return ['/cutValue: a top_percent cut takes a percentage (1–100)'];
        }
        return [];
    }
    return [...Value.Errors(CompetitionCutRule, value)]
        .slice(0, 5)
        .map((e) => `${e.path || '/'}: ${e.message}`);
}
