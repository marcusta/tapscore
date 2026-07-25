# Format templates — a game preset ships with its format

Status: **draft proposal** (2026-07-25). Supersedes the throwaway prototype
described in §10.

Related:

- [ADR-0001: Format plugins are self-contained and registry-driven](../adr/0001-format-plugins-are-self-contained.md)
- [ADR-0003: Balls are subjects; formats rank a chosen set of balls](../adr/0003-balls-as-subjects.md)
- [ADR-0004: Sides are subjects; any ball format ranks a side](../adr/0004-sides-as-subjects.md)

## Context

The setup flow is fully general: a round declares producers, optional
round-level teams, and 1..N format slots, each ranking an explicit subject set.
That generality is the north star — *any format × any composition, composed as
data, never a new format per combination*.

The cost lands on the person setting up a friendly round. The complexity they
face is **composition**, not rules: the only per-format knob the wizard exposes
today is an allowance percentage plus Taliban's gross/net toggle. Everything
hard is in the Teams step (single-ball vs side, formation, per-member
allowance) and in hand-ticking the resulting teams into a format's subject
checklist.

A prototype (§10) confirmed the shape of the fix: a card picker of named games
that generates the composition, collapsing Teams + Formats for the common case
while leaving the full form one tap away. It also surfaced two design defects
worth fixing before this becomes real, which are the substance of this
proposal:

1. The prototype kept its preset list in a **client-side registry**
   (`src/create/templates.ts`) keyed by format id. Adding a format meant
   editing the client. That is precisely the per-format branching the format
   plugin architecture exists to prevent.
2. The prototype made each game **own its teams**. Picking Taliban and then
   Umbrella (4-ball) minted two identical, independent pairs. Round-level teams
   already exist in the data model (ADR-0003); game-owned teams were a
   deviation, and they make "play the same pairs in a second game" impossible.

## Principles

- **A preset ships with its format.** New format = new strategy file +
  registration. Its card, its ball shape, its knobs, and its defaults come
  along; the client learns them from the descriptor.
- **No new persistence.** A template is a generator, not a stored entity. What
  is saved is an ordinary `RoundSetupDraft`. No template id on the round, no
  server-side template table, nothing to migrate. Dropping out to the flexible
  form must remain lossless because there is nothing to lose.
- **Teams are round-level** (ADR-0003) and shared between games.
- **The declaration already exists.** `ballRequirement()` drives compiler
  validation, the client's soft editor, and the "here's what to build" refusal
  text. It should drive the preset too, rather than a parallel description.

## 1. The preset declaration

Add one optional field to `BuiltinMeta` / `FormatDescriptor`:

```ts
preset?: {
    /** Short "what is this game" line for the card. */
    tagline: { en: string; sv: string };
    /** Curation: lower sorts first; absent sorts last. */
    rank?: number;
};
```

Absent ⇒ the format is not offered as a card. It stays fully reachable through
"Custom game", so opting in is a curation decision, not a capability gate.
This is the **only** hand-authored per-format preset data.

### The ball shape is derived, not declared

The picker needs to know what a game is contested between. That is already in
`requirements.balls`. Derive it in `format-catalog.service.ts` alongside the
existing `classify()`:

```ts
playableShape(d): { count: { min: number; max?: number }; size: { min: number; max: number } }
```

| Descriptor shape | Derived | Example |
|---|---|---|
| `requiresSlotTeamGrouping` | count = `slotTeamGrouping.teamCount`, size = `slotTeamGrouping.teamSize` | Taliban, Umbrella 4-ball → 2 balls × 2 players |
| `slotBallCount`, no grouping | count = `slotBallCount`, size = `{ min: 1, max: acceptsSideSubjects(d) ? MAX_TEAM_SIZE : 1 }` | Köpenhamnare → 3 balls × 1–N |
| neither | individual: every player is their own ball | Stableford, stroke play |

`acceptsSideSubjects()` already exists and already encodes the ADR-0004 rule
(no side aggregation for metadata-consuming formats such as Umbrella). So
Köpenhamnare gets "a ball may be a pair" for free, and Umbrella individual
correctly does not.

**Payoff.** A correctly-declared `ballRequirement()` plus a tagline yields a
working card with correct eligibility, correct participant defaults, and
correct refusal text — with no client change. That is the open-closed property
this proposal exists to buy.

**Unbounded counts.** `slotTeamGrouping.teamCount` may declare `{ min: 2 }`
with no max (the better-ball family). V1 seeds `count.min` balls and offers an
"add a ball" control; formats with a fixed count get a fixed set of buttons.

## 2. Format config knobs — the last switch to delete

Today the client hardcodes which format has which knob:

```ts
// setup.service.ts — the exact anti-pattern this proposal removes
formatTakesBonusRule(formatId: string): boolean {
    return formatId === 'taliban_better_ball';
}
```

Meanwhile `kopenhamnare_individual` accepts `handicapMode: 'standard' |
'delta_from_min'` that **no UI can currently reach**, because nobody added a
second branch.

The codebase already solved this for the other pluggable axis.
`AggregationDescriptor` declares `configFields` — pure data, rendered
generically by `competition-setup.component.ts`:

```ts
configFields: [
    { kind: 'select', key: 'metric', label: 'Metric',
      options: [{ value: 'gross', label: 'Gross strokes' },
                { value: 'net',   label: 'Net strokes' }],
      default: 'gross' },
]
```

**Decision: give `FormatDescriptor` the same `configFields`**, declared in the
strategy module next to the `score()` that reads the config and the
`validateConfig()` that guards it (ADR-0001 co-location). The strategy stays
the validation authority; the schema supplies presentation and defaults.

Consequences:

- `formatTakesBonusRule` is deleted. The card and the Formats section render
  whatever knobs the descriptor declares.
- `FormatSlotForm.bonusRule` becomes a generic `config: Record<string, string>`.
- Köpenhamnare's `handicapMode` becomes settable with no client work — the
  proof that the pattern holds.
- The draft carries `formatConfig` exactly as it does now.

Descriptor `defaults` should also grow `formatConfig`, so the seeded value
comes from the strategy rather than a client literal.

## 3. Teams are round-level and reused

Round teams are ADR-0003 entities. A game **references** them; it does not own
them.

**Resolution when a game that needs sides is picked:**

1. Look at the round's existing `multi_ball` teams.
2. If their number satisfies the game's `count` bounds and every team's size
   satisfies its `size` bounds → adopt them as this game's subjects. This is
   the default.
3. Otherwise mint a new set from the participant defaults.

**Sharing is explicit and visible.** A card whose sides came from step 2 says
so: *"Sides: Team A vs Team B — shared with Taliban."* Editing membership there
edits the round team, so both games follow. An explicit *"use separate sides
for this game"* forks a private copy.

This is the behaviour asked for: set up your pairs once for Taliban, pick
Umbrella, and it is the same two pairs.

**Lifecycle.** A team records whether it was auto-created. An auto-created team
is removed when the last format referencing it goes away; a user-created team
never is. Removing a game must never delete a team another game still uses.

**Rejected alternative — identity by membership** (dedupe teams whose member
sets match, fork on edit). Simpler to implement, but editing a pairing would
silently stop propagating, and "the same teams" is exactly what the user is
reasoning about. Explicit references model the domain; membership-hashing
models the implementation.

## 4. Participants

Each picked game carries a per-player ball assignment: a ball index, or
sitting this game out. This is the whole residual decision a template leaves.

- A ball with one player → a `player` subject.
- A ball with two or more → a `team` subject, resolved per §3.
- Eligibility: roster ≥ `count.min × size.min`. Never an exact fit — four
  players can play a three-ball game with one sitting out, and sitting out one
  game does not affect the others.
- Defaults: fill balls evenly when the roster divides by the ball count,
  otherwise `size.min` per ball with the remainder sitting out.
- A new player fills a ball still below its minimum; once every ball is
  satisfied they sit out, visible on the card rather than silently scored.

**The double-scoring trap must stay covered by tests.** A ball format includes
every unticked player by default, so generating sides without explicitly
unticking their members would score six players *and* their three pairs — nine
subjects where the format allows three. The compiler counts one subject per
aggregated side (`compile.ts`, ADR-0004), which is what makes Köpenhamnare as
three pairs legal in the first place.

## 5. Games are additive

A round is a set of games. Cards multi-select; each picked game has its own
participants and knobs and generates its own format slot. Custom games sit
alongside picked ones rather than replacing them — the flexible Teams and
Formats sections appear when something exists that no card owns, and list only
those. "Adjust details" hands one game to the form, leaving the others
tracking the roster.

Provenance (which card owns a slot/team) is **client-side setup state only**.
It never reaches the draft.

## 6. Client architecture

- `src/create/templates.ts` (the registry) is **not** rebuilt. Its role moves
  to derivations in `format-catalog.service.ts`.
- `SetupService` gains: picked games, per-game participant assignment, generic
  config values, team resolution per §3, and provenance tagging.
- Diagnostics stay on the existing data-driven pipeline. A game card surfaces
  its slot's humanized diagnostics; the local pre-checks in `submit()` are
  unchanged.
- Edit mode (`?token=`) opens the flexible form with no games picked — a stored
  draft records composition, not the cards that produced it.

## 7. Out of scope

- Saving user-defined templates, and "same as last time".
- Any template identity persisted on a round.
- Server-side template entities or endpoints.
- Changing the draft schema. This proposal adds descriptor fields only.

## 8. Phasing

Hand-test at each gate, per PHASES.md.

| Phase | Work | Gate |
|---|---|---|
| A | `FormatDescriptor.configFields` + `defaults.formatConfig`, declared for Taliban (`bonusRule`) and Köpenhamnare (`handicapMode`). Generic knob rendering in the existing Formats section. Delete `formatTakesBonusRule`. | Both knobs settable through the current wizard; `handicapMode` reaches the strategy. |
| B | `preset` field + `playableShape()` derivation + catalog tests asserting every builtin either declares a preset or is deliberately excluded. | Derivation matches each builtin's real requirement. |
| C | Card picker: multi-select, per-game participants, eligibility and refusal text, additive custom games. | A four-player round plays Poängbogey + Taliban + Köpenhamnare at once. |
| D | Team reuse, sharing indicator, fork control, auto-created-team lifecycle. | Pick Taliban, then Umbrella; same two pairs, edited in one place. |
| E | Curation: taglines in both locales, ordering, card copy. | — |

## 9. Open questions

- **Ball labels.** Per-game letters (A/B within Taliban) versus the global
  `Team A…H` labels a detached game inherits. Confusing with several detached
  games.
- **Re-picking a removed game.** Should it recover its previous participants,
  or start from defaults?
- **Playing groups.** Games and groups are orthogonal today. Worth surfacing
  when a shared side spans two groups (a single-ball team already warns).
- **Multi-game leaderboards.** Three format chips on one round is now easy to
  create; confirm the round view scales past that.

## 10. Prototype (reference only)

A working throwaway prototype was built and verified end-to-end on 2026-07-25,
then reverted. It validated: the card picker, roster-driven eligibility as
discovery, generated composition, the collapsed summary, gradual drop-out into
a pre-filled flexible form, additive multi-game rounds, and per-game
participant selection (Köpenhamnare with four players, one sitting out; with
six, three aggregated pairs). Verified against stored drafts in SQLite, not
just the UI.

It is recoverable from the git stash labelled
`prototype: game templates (docs/proposals/format-templates.md)` — useful as a
sketch of the UI, **not** as an implementation to resume: its client-side
registry and game-owned teams are the two things this proposal replaces.

Incidental findings worth folding into whichever phase touches them:

- `create.component.ts` carries dead CSS for banded-allowance editing
  (`.fslot__bands`, `.brow`) that no template renders.
- `formatCard()` captured its slot's draft index at creation time; with games
  added and removed above it, the index must be read lazily.
