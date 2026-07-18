// Phase 4 Slice 2 — the shape of `competitions.default_config_json`.
//
// A Competition holds DEFAULTS (format slots, category→tee map, start-list
// mode) that round materialisation COPIES into each new round's own
// `RoundSetupDraft` (PHASES.md Phase 4 design decision #1: inheritance is
// setup-time copying, not runtime lookup). After the copy, the round's draft
// is edited freely through the existing round-edit machinery; the Round
// engine never reads competition state.
//
// The slot shape is the wizard's own `DraftFormatSelection` — deliberately NOT
// a parallel shape. Whatever a draft's `formats[]` can express, the defaults
// can express; materialisation copies the array verbatim into the new draft.
// (Producer-scoped fields — `producerDefIds`, `teams`, `subjects` — reference
// def-ids that only exist once a roster is materialised, so a sane default
// config leaves them out; they are copied as-is if present and the compiler's
// existing diagnostics catch dangling references.)

import { Type, type Static } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import { DraftFormatSelection } from '../domain/round-setup/draft';
import { StartListPolicy } from '../domain/round-setup/start-list-policy';

/**
 * How a category resolves to a tee. An object (not a bare tee id) so a later
 * selector kind (e.g. by tee name across courses) can join the union without
 * reshaping stored configs. Tee EXISTENCE and course membership are validated
 * at materialisation time against the round's chosen course — a config can be
 * authored before the round's course is decided.
 */
export const CompetitionTeeSelector = Type.Object({
    teeId: Type.String({ minLength: 1 }),
});

/**
 * Default GROUP PARTITIONING for a materialised round's draft:
 *   - `single_group` (default): no draft `playingGroups` — the compiler's
 *     conventional default puts the whole roster in one group; the admin
 *     partitions afterwards in the wizard.
 *   - `foursomes`: pre-partition the roster (in roster order) into playing
 *     groups of at most four.
 *
 * Phase 5.5 note: this pre-5.5 stub was named `startList`, but it only ever
 * decided the INITIAL GROUP LAYOUT the roster is copied into. The real
 * start-list POLICY (who may self-join / build groups / claim seats) is the
 * separate `startListPolicy` object below — the two are orthogonal (an
 * organized round can still default to foursomes) so the stub keeps its field
 * name and exact behaviour; stored configs stay valid unchanged.
 */
export const CompetitionStartListMode = Type.Union([
    Type.Literal('single_group'),
    Type.Literal('foursomes'),
]);

export const CompetitionDefaultConfig = Type.Object({
    /** Default format slots — the SAME shape a round draft's `formats[]` uses. */
    slots: Type.Array(DraftFormatSelection, { minItems: 1 }),
    /** category string → tee selector, resolved per participant on materialise. */
    categoryTees: Type.Optional(Type.Record(Type.String(), CompetitionTeeSelector)),
    /** Fallback for a participant with no category (or an unmapped one). */
    fallbackTee: Type.Optional(CompetitionTeeSelector),
    /** Initial group layout for a materialised round (see the mode's doc). */
    startList: Type.Optional(CompetitionStartListMode),
    /**
     * Default start-list POLICY copied into each materialised round's draft
     * (`draft.startList`) — setup-time copy, per-round override through the
     * normal edit path, like every other default here. Absent ⇒ the
     * `organized` preset: a competition round's start list is built by the
     * admin unless the competition explicitly opts into self-service — this
     * is what closes the pre-5.5 open-join-card leak on competition rounds.
     */
    startListPolicy: Type.Optional(StartListPolicy),
});

export type CompetitionTeeSelector = Static<typeof CompetitionTeeSelector>;
export type CompetitionStartListMode = Static<typeof CompetitionStartListMode>;
export type CompetitionDefaultConfig = Static<typeof CompetitionDefaultConfig>;

/**
 * Structural validation problems for a candidate default config, humanized
 * enough to render inline ("/slots: Expected array …"). Empty ⇒ valid. The
 * update path refuses on any problem, so a STORED config is always valid;
 * materialisation re-checks defensively (rows may predate validation).
 */
export function defaultConfigProblems(value: unknown): string[] {
    if (Value.Check(CompetitionDefaultConfig, value)) return [];
    return [...Value.Errors(CompetitionDefaultConfig, value)]
        .slice(0, 5)
        .map((e) => `${e.path || '/'}: ${e.message}`);
}
