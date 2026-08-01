# Scoring view — format-scoped handicap and result

Status: **draft for review** (2026-08-01).

Related:

- [docs/scorecard-presentation.md](../scorecard-presentation.md) — the
  server-presenter → client-renderer pipeline this extends
- `server/domain/strategies/formats/_shared.ts` — allowance derivation and
  `normalizeMatchPlayPHs`, the transforms this proposal surfaces
- `server/domain/strategies/ball-creation/team-ball.ts` — team-ball CH
  combination (ADR-0003), the scramble/foursome step of the derivation
- `server/domain/handicap.ts` — the WHS course-handicap formula and the
  single stroke allocator

## Context

The scoring view (iOS `ScoreEntryView`, web `score-entry.component.ts`) shows
three numbers per ball row today, and none of them respect the round's
formats:

1. **The loud to-par figure ("+12", "E")** is gross vs par, computed
   client-side from raw strokes. It is gross-to-par even when the round's
   only format is Poängbogey or a match format.
2. **The "HCP 7" caption** is the raw course-handicap snapshot
   (`course_handicap_snapshot`) — before the slot's allowance percentage and
   before any format-level transform.
3. **The stroke hint in the unscored circle** is the only per-format number:
   it uses the selected slot's `playing_handicap_snapshot` (allowance
   applied), but deliberately skips format-level PH transforms — match play
   and Taliban normalise off the low ball server-side
   (`normalizeMatchPlayPHs`), and the client shows strokes off the ball's own
   PH instead. The mismatch is documented in `RoundStore.swift` ~line 1099.

The format chips above the tab panel currently *navigate*: tapping one on
the scoring tab yanks the user to that format's leaderboard. The leaderboard
already has its own tab, so the chips' navigation role is redundant — and on
the scoring tab it is a misfeature.

## Design

### 1. Chips become a selector, not navigation

On the scoring tab, tapping a chip selects that slot and stays put. The
selected chip is shown highlighted on both platforms (today web hides the
selection outside the leaderboard tab; iOS shows it always — iOS behaviour
wins). On the leaderboard tab the chip keeps its current
select-and-show-that-format behaviour.

The selected slot becomes the **presentation context** for the whole scoring
view: the handicap line, the stroke hints, and (phase 2) the row result
figure all follow it. Default selection stays "first slot by `slotIndex`" —
no new primary-format concept.

### 2. Handicap line shows the effective playing handicap for the selected slot

The "HCP 7" caption becomes the **effective PH under the selected format** —
allowance applied *and* format transform applied. A scratch player giving
strokes in match play sees the number they actually play off, not their CH.

Next to it, a small ⓘ opens the derivation popup (§4).

The unscored-circle stroke hint switches to the same effective PH, which
retires the documented client/server mismatch: the client allocator
(`strokesReceivedForStrokeIndex` mirror) stays, but is now fed the
server-computed effective PH instead of the pre-transform snapshot.

### 3. Server: `HandicapDerivation` on the round payload

This is setup-derived data — static once the round compiles, no score events
involved — so it rides the **round payload** (per ball × slot), not the
result payload. Every input is already snapshotted: `handicap_index_snapshot`,
`slope_snapshot`, `rating_snapshot`, `tee_par_snapshot`,
`course_handicap_snapshot` per seat; per-producer CH + percentages for team
balls; `playing_handicap_snapshot` per slot-ball.

Closed vocabulary, same philosophy as `result-sections.ts` — the server
sends structured numbers, never prose:

```ts
interface HandicapDerivation {
    /** What the ball actually plays off in this slot — the number the UI shows. */
    effectivePh: number;
    steps: DerivationStep[];
}

type DerivationStep =
    // One per producer. WHS: round(HI × slope/113 + (CR − par)).
    | { kind: 'course_handicap'; producerLabel: string;
        handicapIndex: number | null; slope: number | null;
        courseRating: number | null; par: number | null; result: number }
    // Team balls only. ball_CH = round(Σ memberCH × pct).
    | { kind: 'team_combination';
        parts: { producerLabel: string; ch: number; pct: number }[];
        result: number }
    // Slot allowance. PH = round(ballCH × pct).
    | { kind: 'allowance'; pct: number; source: 'flat' | 'split'; result: number }
    // Format-level transform (match play / Taliban / kopenhamnare / umbrella):
    // low ball plays 0, others the difference.
    | { kind: 'match_delta'; lowestPh: number; ownPh: number; result: number };
```

The nullable fields on `course_handicap` cover placeholder seats and legacy
rounds where an input was not snapshotted — the popup then starts the chain
at the CH result.

**Who computes the transform step:** the format strategy. New optional
strategy hook, mirroring how `deriveSlotBalls` already works:

```ts
presentEffectivePhs?(balls: { ballId: string; ph: number }[]):
    { ballId: string; effectivePh: number; step?: DerivationStep }[];
```

Formats without a transform (stroke, Stableford, Poängbogey, scramble slot)
omit the hook — effective PH = slot PH, no extra step. The match-flavoured
strategies implement it with the same `normalizeMatchPlayPHs` call their
scoring path uses, so the presented number can never drift from the scored
one. `round.service.ts` assembles the generic steps (course_handicap from
seat snapshots, team_combination from `perProducerCh` + the persisted
`per_producer_pct` config, allowance from the slot config) and appends the
strategy's step.

### 4. The ⓘ popup — explaining the number

iOS sheet / web dialog. One card per step, top to bottom, with the player's
real numbers substituted into plain-language sentences. The prose lives
client-side keyed on `DerivationStep.kind` (tone + future localisation);
the server never sends sentences.

Sketch for a scramble ball in a match-flavoured slot:

> **Course handicap** — Anna: exact handicap 7.4, adjusted for these tees
> (slope 132, rating 71.2, par 72) → **7**. *The WHS formula scales your
> exact handicap by tee difficulty: 7.4 × 132 ÷ 113 + (71.2 − 72), rounded.*
>
> **Team handicap** — 25% of Anna's 7 + 15% of Björn's 12 → **4**. *A
> scramble team plays off a share of each member's handicap.*
>
> **Allowance** — Taliban plays at 90% → **4**.
>
> **Match difference** — the lowest ball plays off 0; you get the
> difference: 4 − 2 → **2**. *In match formats only the difference between
> the sides matters.*

Each card shows the arithmetic in small print under the sentence; the
formula is shown, but the sentence carries the meaning — most players do
not know the WHS formula and should not need to.

Team balls need no special casing in the UI: the row *is* the team ball, so
the popup naturally shows member `course_handicap` steps followed by the
`team_combination` step.

### 5. Phase 2 — format-scoped result figure (shipped)

The gross-to-par "+12" becomes the selected format's standing, joined from
the result payload by ballId — no server change needed, the sections already
carry everything:

- **Ranked metric with pace** (stroke play gross-vs-par, Stableford
  points-vs-2-per-hole): the pace delta, sign-normalised to golf convention
  (`E` / `+3` / `−1`), tinted by the existing over/under tones. The primary
  metric is the FIRST ranked section, the same convention the boards use.
- **Paceless ranked metric** (köpenhamnare/umbrella points, field-relative):
  the plain total, neutral tone.
- **Match formats** (no ranked section): the ball's side of its panel —
  `2 UP` / `2 DN` / `AS`, one size down because words are not a scalar.
- **Fallback** — result not loaded, ball not in the slot, nothing scored —
  is the old locally-computed gross-to-par, which also keeps the figure
  optimistic-instant on plain stroke play where the two agree.

The join lives once per client (`slotStandingFor` in `round.service.ts`,
`slotStanding(forBallId:in:)` in `Domain/SlotStanding.swift`), resolves
ADR-0004 virtual subject ids through `subjectLabels`, and the scoring tab now
fetches the result on round load (live score events already kept it fresh on
every tab via `pollResult`).

## Edge cases

- **Plus handicaps**: CH/PH can be negative end-to-end; the allocator
  already handles PH < 0 (strokes given back). Popup sentences must not
  assume "you receive strokes".
- **Placeholder seats**: null snapshots → `course_handicap` step with null
  inputs; if even CH is missing the derivation is omitted and the UI shows
  today's fallback.
- **Multi-format rounds**: one `HandicapDerivation` per slot; switching
  chips switches the whole chain (allowance and transform differ per slot).
- **Guests**: same seat-snapshot path as members; nothing special.

## Rollout

1. Server: wire type + strategy hook + assembly in `round.service.ts`,
   `bun run generate`, server tests (one per transform family).
2. Clients: chip behaviour change, handicap line + ⓘ popup, stroke hint
   switched to `effectivePh` — iOS first, then web, same slice shape as
   friends-activity.
3. Phase 2 (result figure) as its own proposal section once this lands.
