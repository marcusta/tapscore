# Create-round flow — behavior/UX contract

Status: proposal / contract. Scope: the **create a friendly round** flow.
Audience: implementing agents (iOS) and reviewing agents. This document is the
contract; where it and an implementation disagree, this document wins until the
arbiter amends it.

This spec is **implementation-free**. It names screens, controls, values,
orderings and wire shapes. It never names a UI framework, a state primitive, a
view type or a file.

Every requirement below is stated in three parts:

- **WEB TODAY** — what the shipped web client actually does (verified by reading
  the source and by driving the live app at `:5183` against the dev server at
  `:3030`).
- **iOS MUST** — the required native behavior.
- **CONVERGE** — where the two differ, the target both should reach. A CONVERGE
  item that the web lacks entirely is an **invention** and is listed in §12.

Terms used throughout:

- **draft** — the `RoundSetupDraft` document POSTed to the friendly-rounds front
  door. It is the only thing the server sees; every UI decision is judged by the
  draft it produces.
- **producer** — one scoring participant in the draft (`producers[]`), addressed
  by `producerDefId` (`p1..pN` positionally in create mode).
- **format slot** — one entry of the draft's `formats[]`.
- **route** — the played-holes description (`roundType`, optional `route`).
- **chip** — a pill in an always-visible row; the whole option set is on screen.
- **dropdown** — a collapsed field showing the ANSWER, which opens an overlay
  list of the options.
- **annotation** — a row-level qualifier inside a dropdown list, written as
  words in a muted or danger tone.

---

## 0. Control shapes (normative, whole flow)

The web is the reference, and on every long choice the web already uses a
collapsed dropdown: its course select, its start-hole select and its tee selects
are all `<select>`-alikes with a raised list. This section makes that binding so
the question is not re-litigated per control.

**B0.1** WHEN a choice offers **at most 3–4 short options that are worth having
permanently on screen** THEN it MAY be rendered as chips or a segmented row.
The rule is the test, not a headcount — but for orientation, the sets that pass
it today are the **route preset** (Full 18 / Front 9 / Back 9), the **holes
toggle**, the **format template cards**, the per-row **gender toggle**
(Men / Women), the per-slot **config knobs** a format declares (each a handful
of short options), and the **step bar** (Course / Players / Format), which is
navigation drawn in the same chip. Anything not on that list is B0.2's until an
owner says otherwise; adding to it means showing the choice meets the test
above, not that the list had room.

§0 governs choosing ONE of a set. Multi-select ticks — the custom slot's "who
this game scores" — are not dropdown candidates at all: a collapsed field can
show one answer, and the question there is which subset, asked of a roster the
user is already looking at.

**B0.2** WHEN a choice offers **more than that, or options whose labels are long
or unbounded in number** THEN it MUST be rendered as a **collapsed dropdown
field** — at least 44pt, showing the selected value (or a muted placeholder),
with a chevron — that opens an overlay list. This binds, at minimum: the
**course**, the **start hole**, the **round's tee defaults**, and the
**per-player tee override**. A wrapped wall of chips for any of these is a
deviation, not a style choice: eighteen start-hole chips in three rows push the
questions below them off the screen and re-ask a question already answered.

**B0.3** WHEN a dropdown option needs qualifying (a missing rating, a handicap
consequence) THEN the qualifier is an **annotation on that row** — WORDS, in a
muted or danger tone, e.g. `Orange — no men's rating` — and never an emoji or a
symbol appended to the option's label. An emoji has no accessible name, no
theme token and no room to say what it meant. When the qualified option is the
selected one, the collapsed field repeats the annotation.

**B0.4** WHEN two dropdowns exist anywhere in this flow THEN they are the SAME
control: one primitive, one overlay anatomy (optional search, optional
non-selectable group headers, rows with title + optional annotation + a
checkmark on the selection, tap ⇒ select and dismiss).

---

## 1. Step order and navigation

### 1.1 WEB TODAY

The web create screen is **one long scrolling page**, not a stepped wizard. The
sections appear in this DOM order:

1. Course (course select + tee select live in the course block)
2. Route (Full 18 / Front 9 / Back 9 chips + start-hole select)
3. Players
4. Playing groups
5. "What are we playing?" — game cards + one panel per picked game
6. Teams — **hidden** unless the flexible sections are open
7. Formats — **hidden** unless the flexible sections are open
8. Create round / Cancel

Nothing is gated: a user can touch any section in any order. Sections 6–7 appear
only once `+ Custom game` has been used, or a custom slot/team already exists.

### 1.2 iOS MUST

**B1.1** WHEN the create flow opens THEN the user is placed on step **Course**,
and the steps are ordered **Course → Players → Format**.

**B1.2** WHEN the user is on step Course THEN advancing to Players is blocked
until a course is selected; the block is expressed as a disabled advance control
with a reason, never as a silent no-op.

**B1.3** WHEN the user is on step Players THEN advancing to Format is blocked
until the roster satisfies §5.10 (at least one player, every row complete).

**B1.4** WHEN the user is on any step after the first THEN a back affordance
returns to the previous step **without discarding any entered data** — course,
route, start hole, roster rows, tee overrides, picked formats and format config
all survive a full back/forward traversal unchanged.

**B1.5** WHEN the user returns to an earlier step and changes the course THEN
the resets in §2.6 apply, and only those; the roster is **not** cleared.

**B1.6** Route + start hole (§3) live on the **Course** step. Tee default
selection (§4) is decided on the Course step but is only *visible* per row on
the Players step.

**B1.7** Format slots (§6) live entirely on the **Format** step, which is the
final step and carries the submit action.

### 1.3 CONVERGE

Both clients should converge on **Course → Players → Format**. The web's single
scroll is not wrong for a wide viewport, but its *section order* (format before
players is not the case — players already precede formats) already matches
except that route sits between course and players. Recorded decision:

- iOS: stepped, order Course → Players → Format, route folded into Course.
- Web: follow-up (not in this change) to re-order so the flow reads
  Course(+route+tees) → Players → Format and to gate submit the same way.

Divergence permitted for now: web stays a single scroll. This is a **web gap**,
not an iOS deviation.

---

## 2. Course selection

### 2.1 WEB TODAY

- Courses come from `GET /api/setup/courses` (no auth).
- The **server** orders them `clubs.name ASC, courses.name ASC`. The client does
  no re-sorting; it relies on that ordering.
- The client builds a flat option list and injects a **non-selectable header
  row** each time `clubName` changes, with value `__club:<clubName>` and
  `disabled: true`.
- The control is a styled overlay dropdown with a `Select a course` placeholder.
  **There is no search field.** Verified live: the listbox rendered
  `HALMSTAD GK` (header) → `North`, `LINKÖPINGS GOLFKLUBB` (header) →
  `Linköping`, `Linköpings Golfklubb 1-18`, and the only way to a course is
  manual scroll.
- On load, when no course is selected, the client **auto-selects the first
  course** in the list.

### 2.2 iOS MUST

**B2.1** WHEN the course list loads THEN it is presented **grouped by club**,
each group introduced by a club header that is **not selectable**, and the
courses inside a group appear in the order the server returned them.

**B2.2** WHEN group and course ordering is computed THEN the client preserves
the server's order (club name ascending, then course name ascending) and does
**not** re-sort. If a future server changes the order, the client follows it.

**B2.3** WHEN the Course step is shown THEN the course selector is a
**collapsed dropdown field per §0 B0.2** — never chips, never an inline list.
One control, field-styled, at least 44pt,
showing the selected course's name (placeholder per B2.7 until there is one) and
a chevron affording "this opens". The grouped list of B2.1 is **not** rendered
inline on the step: it exists only inside the overlay B2.3a describes. An
always-expanded list of clubs and courses does not satisfy this clause — it
pushes the route, start-hole and tee controls (B1.6, §3, §4.4) off the screen
they belong to, and it re-asks a question that has already been answered every
time the step is revisited.

**B2.3a** WHEN the collapsed selector is tapped THEN an **overlay picker**
(sheet) opens containing, in this order: a **search field at the top, focused on
open**, then the grouped list of B2.1 — uppercase, muted, non-interactive club
headers with their courses beneath — with a **checkmark on the currently
selected course**. Choosing a course selects it (B2.8) and **closes the
overlay** in the same act; no separate confirm step. Dismissing without choosing
leaves the selection unchanged.

**B2.4** WHEN the user types `q` into the search field THEN the list shows every
course whose **course name OR club name** contains `q`, case-insensitively and
diacritic-insensitively (so `linkoping` matches `Linköpings Golfklubb`), and a
club header is shown only when at least one of its courses survives the filter.

**B2.5** WHEN the search field is non-empty and no course matches THEN an empty
state is shown ("No courses match …"), not a blank list.

**B2.6** WHEN the search field is cleared THEN the full grouped list is restored
with grouping intact.

**B2.7** WHEN nothing is selected yet THEN the collapsed selector of B2.3 shows
a placeholder in muted text ("Choose course"; the web's wording is "Select a
course"). iOS **does not** auto-select the first course — an
auto-selected course is indistinguishable from a chosen one and silently ships a
wrong `courseId`. Selection is an explicit act.

**B2.8** WHEN a course is selected THEN the draft carries
`courseId: "<selected course id>"`.

### 2.3 CONVERGE

- Grouping and ordering: identical, and identical to the server's order.
- Searchable selector: **invention** (§12.1) — the web has none. Target for both.
- Auto-select-first: web behavior is a **web gap** (§13.2); the convergence
  target is B2.7 (explicit selection, placeholder until chosen).

### 2.4 Reference data (dev)

Three courses exist in the dev DB and are useful as fixtures:

| Club | Course | Holes |
|---|---|---|
| Halmstad GK | North | 18 |
| Linköpings Golfklubb | Linköping | 18 |
| Linköpings Golfklubb | Linköpings Golfklubb 1-18 | 18 |

### 2.5 Tee loading

**B2.9** WHEN a course is selected THEN the tee list is fetched for exactly that
course (`/setup/tees/by-course`, input `{courseId}`), and no tee from any other
course is ever offered.

### 2.6 Resets on course change

**B2.10** WHEN the selected course changes THEN, and only then:

- the route preset resets to **Full 18**;
- the start hole resets to **1**;
- the tee list is replaced by the new course's tees;
- every player whose current `teeId` is not in the new tee list is re-assigned
  the **default tee for that player's gender** per §4.5 (the web re-assigns the
  first tee; iOS uses the gender default);
- the roster, names, handicap indices, genders, picked formats and format config
  are **unchanged**.

---

## 3. Route and start hole

### 3.1 WEB TODAY

- Three route chips: `Full 18`, `Front 9`, `Back 9`. Default `Full 18`.
- Hole sets are derived from the **course's actual holes**, sorted ascending:
  front = holes ≤ 9, back = holes ≥ 10, full = all.
- The start-hole control is a plain dropdown whose options are exactly the
  route's hole set. Observed live: Full 18 ⇒ `1..18` (default `1`); Front 9 ⇒
  `1..9` (default `1`); Back 9 ⇒ `10..18` (default `10`).
- Changing the route keeps the current start hole **if it is still in the new
  hole set**, otherwise it becomes the first hole of the new set.
- Draft encoding, exactly:
  - start hole **is** the first hole of the route's hole set ⇒ emit only
    `roundType: "full_18" | "front_9" | "back_9"`, no `route` key.
  - start hole is **not** the first hole ⇒ emit
    `roundType: "custom_holes"` plus a `route` object holding the hole set
    **rotated** so play starts at the chosen hole, plus an explicit handicap
    policy marking the round non-posting.

### 3.2 iOS MUST

**B3.1** WHEN the route control is shown THEN it offers exactly `Full 18`,
`Front 9`, `Back 9`, defaulting to `Full 18`.

**B3.2** WHEN a route is chosen THEN the start-hole picker offers exactly the
holes of that route, ascending, derived from the selected course's hole list —
never a hardcoded 1..18.

**B3.3** WHEN the route is `full_18` THEN permitted start holes are all the
course's holes (typically 1–18) and the default is the lowest (typically 1).
WHEN the route is `front_9` THEN permitted start holes are holes ≤ 9 and the
default is the lowest (typically 1). WHEN the route is `back_9` THEN permitted
start holes are holes ≥ 10 and the default is the lowest (typically 10).

**B3.4** WHEN the route changes AND the current start hole is still permitted
THEN the start hole is kept. WHEN it is no longer permitted THEN it becomes the
first permitted hole.

**B3.5** WHEN the start hole equals the first hole of the route THEN the draft
emits **only** `roundType` and **no** `route` key:

```json
{ "roundType": "back_9" }
```

**B3.6** WHEN the start hole is not the first hole of the route THEN the draft
emits:

```json
{
  "roundType": "custom_holes",
  "route": {
    "playHoles": [
      { "courseHoleNumber": 10 }, { "courseHoleNumber": 11 }, { "courseHoleNumber": 12 },
      { "courseHoleNumber": 13 }, { "courseHoleNumber": 14 }, { "courseHoleNumber": 15 },
      { "courseHoleNumber": 16 }, { "courseHoleNumber": 17 }, { "courseHoleNumber": 18 },
      { "courseHoleNumber": 1 },  { "courseHoleNumber": 2 },  { "courseHoleNumber": 3 },
      { "courseHoleNumber": 4 },  { "courseHoleNumber": 5 },  { "courseHoleNumber": 6 },
      { "courseHoleNumber": 7 },  { "courseHoleNumber": 8 },  { "courseHoleNumber": 9 }
    ],
    "routeHandicapPolicy": { "type": "explicit", "postingEligible": false }
  }
}
```

(the example is Full 18 starting at hole 10 — the hole set rotated left to the
chosen start, wrapping. Each entry is an OBJECT `{ courseHoleNumber }`, not a
bare integer — the shape `src/create/setup.service.ts` emits.)

**B3.7** WHEN the start hole is not the first hole THEN the UI states that the
round is **not handicap-posting**, because the draft says so. A silent
`postingEligible: false` is a deviation.

**B3.8** WHEN the start-hole control is shown THEN it is a **collapsed dropdown
field per §0 B0.2** — a 44pt field reading the chosen hole ("Start hole — 1"),
opening a list of exactly the route's permitted holes, one row each, with a
checkmark on the current one. **No search field** (eighteen rows scroll in one
flick) and **no chips**: a wrapped grid of eighteen hole pills is the rejected
shape, and it buries the tee controls below it.

**B3.9** WHEN a start-hole row would rotate the route (any hole that is not the
route's first — B3.6) THEN that row carries the B3.7 disclosure as a **muted
annotation** ("Won't count for handicap"), so the consequence is readable
**before** the choice, not only after it. The route's own head (1 on full_18 /
front_9, 10 on back_9) carries no annotation. The step-level sentence of B3.7
stays: the annotation announces, the sentence confirms.

**B3.10** The route preset itself (Full 18 / Front 9 / Back 9) REMAINS chips —
three short options, §0 B0.1.

### 3.3 Start-hole test vectors

| Course holes | Route | Start | `roundType` | `route.playHoles` |
|---|---|---|---|---|
| 1..18 | full_18 | 1 | `full_18` | — (absent) |
| 1..18 | full_18 | 10 | `custom_holes` | 10..18,1..9 |
| 1..18 | full_18 | 7 | `custom_holes` | 7..18,1..6 |
| 1..18 | front_9 | 1 | `front_9` | — |
| 1..18 | front_9 | 4 | `custom_holes` | 4..9,1..3 |
| 1..18 | back_9 | 10 | `back_9` | — |
| 1..18 | back_9 | 14 | `custom_holes` | 14..18,10..13 |

### 3.4 CONVERGE

Identical. The web's behavior is already correct; iOS matches it exactly,
including the "bare roundType when starting at the head" rule (this is a
parity-relevant wire shape).

---

## 4. Tees

### 4.1 WEB TODAY

- Tees come from `/setup/tees/by-course`, **ordered by `name` ascending** by the
  server. That is alphabetical, not a golf ordering: Linköping returns
  `Blå, Gul, Orange, Röd, Vit`.
- The client does not re-sort. Every tee dropdown (round-level and per row) uses
  the raw server order, with placeholder `Tee`.
- Default tee is **the first tee in that list** — i.e. alphabetically first, per
  player, with **no gender awareness at all**.
- Each player row has its own tee dropdown, so per-player overrides exist.
- A tee may carry a rating row for one gender only. Observed in the dev DB:
  Linköping's `Orange` has an **F rating only**, `Vit` has an **M rating only**.
- WHEN a player's gender has no rating on their tee THEN the course-handicap
  line silently renders **empty** — no inline error, no warning. Verified live:
  gender `F` on tee `Vit` produced an empty CH line and an empty row error. The
  failure only appears at submit, as a raw server message:
  `tee '9459f965-2a19-4523-aec2-4a4e370f6a75' has no 'F' rating row`.

### 4.2 iOS MUST — sorting

**B4.1** WHEN tees are displayed anywhere (round default picker or a player row
override) THEN they are displayed in the order produced by the deterministic
pure sort defined in §4.3, applied client-side to the server's list. The server
order is **not** used for display.

### 4.3 The tee sort (normative, pure, deterministic)

Input: a list of tees, each with a display `name` (and optional `colour`).
Output: the same tees, reordered. The function is pure — same input, same
output, no locale/clock/network dependence.

**Step 1 — classify each tee** by its name, trimmed and lowercased, with
diacritics preserved for matching the Swedish canon (matching is on the trimmed,
case-folded name; `colour` is used as a fallback when the name yields no class):

- **COLOR** if the name matches one of the canon entries below (exact match on
  the whole trimmed name, or the name's first whitespace-separated word).
- **NUMERIC** if the trimmed name parses as a positive number, optionally
  followed by a unit word (`58`, `53`, `6120 m`, `5.8`).
- **OTHER** otherwise.

**Step 2 — canon rank for COLOR** (Swedish canon, longest to shortest course,
lower rank sorts first):

| rank | canon name | accepted aliases (case-insensitive) |
|---|---|---|
| 0 | svart | black |
| 1 | vit | white |
| 2 | gul | yellow |
| 3 | blå | bla, blue |
| 4 | röd | rod, red |
| 5 | orange | — |

A COLOR tee whose name is a canon entry gets that rank. Compound names take the
rank of the canon word they contain (`gul herr` ⇒ rank 2).

**Step 3 — order within class**

- NUMERIC: descending by numeric value (**longest first**: `58` before `53`
  before `47`).
- COLOR: ascending by canon rank.
- OTHER: ascending by name, case-insensitive, Swedish collation, base
  sensitivity.

**Step 4 — order between classes (mixed sets)**

`NUMERIC` block first, then `COLOR` block, then `OTHER` block.
(Numeric/length-named tees are the "serious" tee sets and belong at the top;
colors follow in canon; anything unclassified lands last.)

**Step 5 — stability**

Ties (two tees with the same class and the same key) preserve the input order.

#### 4.3.1 Test vectors (normative — implementations must pass all of these)

| # | Input (server order) | Required output |
|---|---|---|
| T1 | `Blå, Gul, Orange, Röd, Vit` | `Vit, Gul, Blå, Röd, Orange` |
| T2 | `Red, Yellow` | `Yellow, Red` |
| T3 | `Svart, Vit, Gul, Blå, Röd, Orange` | `Svart, Vit, Gul, Blå, Röd, Orange` |
| T4 | `47, 53, 58` | `58, 53, 47` |
| T5 | `53, Gul, 58, Röd` | `58, 53, Gul, Röd` |
| T6 | `Gul, Junior, 58` | `58, Gul, Junior` |
| T7 | `Gul herr, Gul dam` | `Gul herr, Gul dam` (tie ⇒ input order) |
| T8 | `` (empty) | `` (empty) |
| T9 | `Orange, Blue, black` | `black, Blue, Orange` |
| T10 | `6120 m, 5540 m, Röd` | `6120 m, 5540 m, Röd` |

### 4.4 iOS MUST — round default tees by gender

**B4.2** WHEN a course's tees have loaded THEN the flow holds **two** round-level
defaults: a **default tee for male players** and a **default tee for female
players**. Both are user-changeable on the Course step, both are shown with the
sorted tee list of §4.3.

**B4.2a** WHEN either gender default is shown THEN it is a **collapsed dropdown
field per §0 B0.2**, labelled with the gender ("Men", "Women"), reading the
chosen tee, opening the §4.3-ordered list. Two rows of tee chips per gender is
the rejected shape.

**B4.2b** WHEN a tee has **no rating row for the gender of the picker it appears
in** THEN that row carries a **danger annotation in words** — "No men's rating" /
"No women's rating" (§0 B0.3) — and REMAINS selectable (B4.13). A warning emoji
appended to the tee's name is a deviation: it cannot be read out, cannot be
translated, and does not say which gender it meant. When such a tee is the
selection, the collapsed field repeats the annotation.

**B4.3** WHEN the defaults are first computed for a course THEN, for each gender
G ∈ {M, F}, the default is chosen by this deterministic rule:

1. Consider only tees that **have a rating row for gender G**. (A tee with no
   G-rating can never be a G default — that is the silent-failure class §4.1
   describes.)
2. Among those, apply the §4.3 sort and pick:
   - for **M**: the first tee at canon rank ≥ 2 (i.e. `gul`/yellow or shorter);
     if none, the last tee in sorted order.
   - for **F**: the first tee at canon rank ≥ 4 (i.e. `röd`/red or shorter);
     if none, the last tee in sorted order.
   - for a NUMERIC-only set: **M** takes the longest, **F** takes the shortest.
3. If no tee has a G-rating at all, the G default is **unset** and §4.7 applies.

**B4.4** WHEN the user changes a gender default THEN every player row of that
gender that is **still on the previous default** (i.e. has no explicit override)
follows the change; rows the user explicitly overrode do not move.

**B4.5** WHEN a player's gender changes THEN that player's tee becomes the new
gender's default, unless the user had explicitly overridden that row's tee, in
which case the override is kept.

### 4.5 iOS MUST — per-player override

**B4.6** WHEN a player row is shown THEN it carries its own tee control — the
**same dropdown primitive** as the gender defaults (§0 B0.4), with the same
§4.3-sorted list and the same B4.2b annotations — showing the tee that row
plays off and whether it is still following its gender default.

**B4.7** WHEN the user picks a tee in a row THEN that row is marked **overridden**
and no longer follows gender-default changes (B4.4/B4.5).

**B4.8** WHEN a player row's tee is set THEN the draft's corresponding producer
carries that exact `teeId`. Tees are **per producer** in the draft — there is no
round-level tee on the wire.

### 4.6 Course handicap display

**B4.9** WHEN a player has a parseable handicap index AND a tee AND that tee has
a rating row for that player's gender THEN the row shows the course handicap and
its derivation, in the web's exact arithmetic:

```
raw = index × (slope / 113) + (courseRating − par)
CH  = round(raw)          // half-up, matching the web
```

displayed as `Course handicap <CH>  ·  <index> × <slope>/113 + (<CR> − <par>) = <raw to 1dp>`.

**B4.10** Plus handicaps are negative. Verified live: index `+2,4` on Red/M
(slope 124, CR 68.4, par 72) renders
`Course handicap -6  ·  +2,4 × 124/113 + (68.4 − 72) = -6.2`.

### 4.7 Missing gender rating — the fix

**B4.11** WHEN a player's tee has **no rating row for that player's gender**
THEN the row shows an inline, actionable diagnostic naming the tee and the
gender — e.g. `Vit has no rating for F — pick another tee.` — and the course
handicap area shows that reason rather than nothing.

**B4.12** WHEN any row is in the state of B4.11 THEN submit is blocked
client-side with that row-scoped message. The raw server refusal
(`tee '<uuid>' has no 'F' rating row`) must never be the first the user hears of
it, and a raw id must never be shown.

**B4.13** WHEN a tee has no rating for a gender THEN that tee is still listed in
that player's tee control but is marked as unavailable for that gender (it may
be selected only if the app then shows B4.11) — the list is not silently
filtered, because a filtered list makes a real data gap look like a missing tee.

### 4.8 CONVERGE

| Aspect | Web today | Target |
|---|---|---|
| Tee ordering | server alphabetical | §4.3 sort, client-side, both clients |
| Default tee | first tee, gender-blind | §4.4 gender defaults, both clients |
| Per-player override | yes | yes (unchanged) |
| Gender/tee rating mismatch | silent, raw server error at submit | §4.7 inline diagnostic, both clients |

§4.3 (the sort), §4.4 (gender defaults) and §4.7 (the mismatch diagnostic) are
**inventions** — see §12.

---

## 5. Players

### 5.1 WEB TODAY — starting roster

- On a fresh create flow, the client adds **exactly one empty player row** (it
  adds a row on course selection only when the roster is empty). Verified live:
  one empty row, no bulk prefill.
- A new empty row is `{name:'', handicapIndex:'', gender:'M', teeId:<first tee>}`.
- `+ Add me (<display name>)` appears only when the user is **signed in**, the
  profile has loaded, and that player is not already on the roster.
- `+ From friends` appears only when signed in and the friend list is non-empty.
- Signed out, both controls are **hidden**. Verified live (session signed out,
  `/api/friends` ⇒ 401): both buttons had `hidden`.

### 5.2 WEB TODAY — friends picker

- Roster source: `GET /friends` (auth required). Each entry carries
  `id, username, displayName, gender (null|M|F), handicapIndex (null|number),
  homeClubName, sharedRoundCount, lastPlayedAt, frecency`.
- The picker lists friends **not already on the roster**, sorted by **frecency**:
  players you have played with first, by frecency descending, ties by
  `lastPlayedAt` descending then by name; never-played friends last, alphabetical
  (Swedish collation, base sensitivity).
- Each row shows display name, `@username`, and the handicap index to 1 decimal
  or `–` when unknown.
- **There is no search box in the picker.**
- Picking a friend adds a row prefilled with: name (read-only), formatted
  handicap index, `gender: friend.gender ?? 'M'`, and — critically —
  `genderKnown = friend.gender != null`. When `genderKnown` is true the row's
  gender control is **disabled** (gender lock).
- Adding is idempotent: a friend already on the roster (matched by player id) is
  not added twice.

### 5.3 WEB TODAY — the HCP keypad

The handicap-index field is **read-only**; touching it opens a modal numeric pad.
Pad contents, verified in the DOM:

- Header: the player's name, a live course-handicap line, and the current value
  (placeholder `HCP index` when empty).
- Keys, in grid order: `1 2 3 4 5 6 7 8 9`, then `+` (captioned **plus hcp**),
  then `0`, then the locale decimal separator (`,` for `sv`, `.` otherwise).
- A `⌫` delete key.
- Actions: `Cancel` and `Done`.
- Hardware keyboard while open: digits, `,`/`.`, `+`/`-` toggle the plus,
  Backspace deletes, Enter commits, Escape closes.

Semantics, verified by driving the pad:

| Action | Rule | Observed |
|---|---|---|
| digit | max **2** integer digits; max **1** decimal digit | `1,2,3` ⇒ `12` (third rejected) |
| separator on empty | inserts a leading zero | `,` ⇒ `0,` |
| second separator | ignored | `0,4` + `,` ⇒ `0,4` |
| decimal overflow | ignored | `0,4` + `5` ⇒ `0,4` |
| `+` | toggles the plus prefix | `0,4` ⇄ `+0,4` |
| `⌫` | deletes one character | `12` ⇒ `1` ⇒ `` |
| Done, empty value | **enabled**; commits a **clear** | field becomes empty |
| Done, lone `+` | **disabled** | cannot commit |
| Cancel | discards, field unchanged | — |

Parsing (`"+2,4"` ⇒ `-2.4`): trim; `,` → `.`; empty ⇒ null; a leading `+`
negates; non-finite ⇒ null. Formatting is the inverse: a negative value renders
with a leading `+`.

### 5.4 iOS MUST — starting roster

**B5.1** WHEN the create flow opens AND the user is **signed in** THEN the
roster starts with **exactly one row: the signed-in player**, prefilled with
their name (read-only), handicap index and gender, with gender locked when
known.

**B5.2** WHEN the create flow opens AND the user is **signed out** THEN the
roster starts with **exactly one empty row**.

**B5.3** WHEN the roster is displayed THEN there is **never** a bank of empty
pre-filled rows. Rows are added one at a time, by explicit user action.

**B5.4** WHEN the user adds a row THEN the new row is
`{name: "", handicapIndex: unset, gender: M, tee: <M gender default per §4.4>}`
and receives keyboard focus on the name field.

**B5.5** WHEN a row is removed THEN the remaining rows keep their data and the
draft's producer numbering re-derives positionally (§10.2).

### 5.5 iOS MUST — friends

**B5.6** WHEN the user is signed in THEN the Players step offers **Add from
friends**. WHEN the user is signed out THEN that control is **absent** (not
disabled-with-a-login-prompt inside the flow).

**B5.7** WHEN the friends picker opens THEN it lists friends **not already on
the roster**, sorted exactly by §5.2's frecency rule: played-before by frecency
descending, ties by `lastPlayedAt` descending then display name; never-played
last, alphabetical with Swedish collation and base sensitivity.

**B5.8** WHEN the friends picker is open THEN a **search field** filters the
roster by display name **or** username, case- and diacritic-insensitively,
preserving the §5.7 order within the filtered set.

**B5.9** WHEN each friend row is shown THEN it shows display name, `@username`,
and the handicap index to one decimal, or `–` when the friend has no index.

**B5.10** WHEN a friend is picked THEN a row is added with:
- name prefilled and **read-only** (a friend row's name is not editable);
- handicap index prefilled from the friend, still editable via the keypad;
- gender from the friend when known; when the friend's gender is known the
  row's gender control is **locked** (read-only, visibly so);
  when unknown, gender defaults to `M` and stays editable;
- tee = the gender default per §4.4;
- an identity reference to that friend's player id.

**B5.11** WHEN a friend already on the roster is picked THEN nothing is added
(idempotent) — and such friends are excluded from the picker list to begin with.

**B5.12** WHEN the user is signed in and not on the roster THEN an **Add me**
affordance is offered, behaving as B5.10 for the signed-in player.

### 5.6 iOS MUST — guests

**B5.13** WHEN the user adds a guest row THEN name and handicap index are both
free to edit, gender is free to edit, and no player identity is attached; the
draft's producer for that row carries a guest reference, not a player id.

**B5.14** WHEN the user is signed out THEN **every** row is a guest row; there
is no friends path and no player-identity path.

### 5.7 iOS MUST — the HCP keypad

**B5.15** WHEN the handicap-index field of a row is touched THEN a modal numeric
pad opens for that row, and the field itself is **never** directly text-editable
(no system keyboard).

**B5.16** WHEN the pad is open THEN it presents exactly these keys, in this
order: `1 2 3 4 5 6 7 8 9`, then `+` labelled **plus hcp**, then `0`, then the
locale decimal separator (`,` under Swedish, `.` otherwise); plus a delete key
(`⌫`), a `Cancel` action and a `Done` action.

**B5.17** WHEN the pad is open THEN its header shows the player's name, the
current value (with an `HCP index` placeholder when empty), and the **live**
course handicap for the value being typed, using the row's tee and gender.

**B5.18** Digit entry obeys: **at most two integer digits**, **at most one
decimal digit**; keys beyond those limits are **ignored** (not an error, not a
truncation of earlier input).

**B5.19** WHEN the separator is pressed on an empty value THEN the value becomes
`0` + separator. WHEN a separator is already present THEN the separator key is
ignored.

**B5.20** WHEN `+` is pressed THEN the plus prefix toggles on/off, preserving
the digits.

**B5.21** WHEN `Done` is pressed with an empty value THEN the row's handicap
index is **cleared** and the pad closes (Done is enabled for the empty value).

**B5.22** WHEN the value is a lone `+` (no digits) THEN `Done` is **disabled**.

**B5.23** WHEN `Cancel` is pressed THEN the row's value is unchanged.

**B5.24** The committed value parses as: `,`→`.`; leading `+` ⇒ **negate**. So
`"+2,4"` ⇒ `-2.4` and `"12"` ⇒ `12.0`. A stored negative index redisplays with
a leading `+`.

#### 5.7.1 Keypad test vectors

| # | Key sequence | Displayed value | Committed |
|---|---|---|---|
| K1 | `1 2` | `12` | `12.0` |
| K2 | `1 2 3` | `12` | `12.0` |
| K3 | `1 8 , 4` | `18,4` | `18.4` |
| K4 | `1 8 , 4 5` | `18,4` | `18.4` |
| K5 | `,` | `0,` | `0.0` |
| K6 | `, 4` | `0,4` | `0.4` |
| K7 | `, 4 ,` | `0,4` | `0.4` |
| K8 | `+ 2 , 4` | `+2,4` | `-2.4` |
| K9 | `2 , 4 +` | `+2,4` | `-2.4` |
| K10 | `+ 2 , 4 + ` | `2,4` | `2.4` |
| K11 | `+` then Done | `+` | Done **disabled** |
| K12 | (nothing) then Done | `` | index **cleared** |
| K13 | `1 2 ⌫ ⌫` | `` | index cleared |
| K14 | `1 2` then Cancel | — | previous value kept |

### 5.8 iOS MUST — gender

**B5.25** WHEN a player row is shown THEN it carries a gender control with
exactly two values, `M` and `F`.

**B5.26** WHEN the row came from a friend (or "add me") whose gender is known
THEN the gender control is **locked** and shows that gender.

**B5.27** WHEN gender changes THEN the row's tee follows §4.5 (B4.5) and the
course-handicap line recomputes against the new gender's rating row.

### 5.9 iOS MUST — per-row completeness

**B5.28** A row is **complete** when it has a non-empty name, a parseable
handicap index, a tee, a gender, and that tee has a rating row for that gender.

### 5.10 iOS MUST — roster gate

**B5.29** WHEN the roster is empty THEN the Players step cannot be left forward
and states `Add at least one player.`

**B5.30** WHEN any row is incomplete THEN the Players step cannot be left
forward, and **each offending row** shows its own reason (§9).

### 5.11 CONVERGE

| Aspect | Web today | Target |
|---|---|---|
| Starting roster | 1 empty row (signed in too) | signed in ⇒ 1 row = me; signed out ⇒ 1 empty row |
| Bulk prefill | none | none (unchanged) |
| Friends picker | frecency list, no search | same list + **search** |
| Gender lock | yes, when friend gender known | same |
| Keypad | as §5.3 | identical, keys and semantics |
| Per-row tee | yes | yes |
| Signed out | friends controls hidden | same |

Inventions here: friends-picker **search** (§12.4) and the signed-in
**"start with me"** roster (§12.5).

---

## 6. Formats

### 6.1 WEB TODAY

**Catalog.** `/setup/formats` returns the format descriptors. Those declaring a
`preset` become **game cards**, sorted by `preset.rank` ascending (missing rank
last), ties broken by localized label. Dev catalog:

| rank | id |
|---|---|
| 1 | `stableford_individual` |
| 2 | `taliban_better_ball` |
| 3 | `kopenhamnare_individual` |
| 4 | `stroke_play_individual` |
| 5 | `match_play_individual` |
| 6 | `stableford_better_ball` |
| 7 | `umbrella_individual` |
| 8 | `umbrella_4_ball` |

`match_play_better_ball` declares **no preset** ⇒ it has no card and is
reachable only through the flexible Formats section.

**Default.** On load, the flow ensures a default game: `stableford_individual`
is pre-picked, producing one format slot and one game panel.

**Multiple formats.** Tapping another card **adds** a slot: verified live,
tapping `Slagspel` produced picked `[Poängbogey, Slagspel]` and two panels.
Tapping a picked card removes it and its slot.

**Ineligibility is discovery, not a gate.** A card whose player-count
requirements the roster cannot satisfy renders **disabled with a reason
subtitle** ("needs at least 4 players") rather than disappearing.

**Slot shape.** A new slot is
`{formatId, allowancePct: "100", subjects…, config: <format defaults>}`.
Changing a slot's format **re-seeds** its config from the new format's defaults
(stale knob values are never carried across).

**Config knobs** exist only where a descriptor declares them. In the dev
catalog: `kopenhamnare_individual.handicapMode` ∈ {`standard`,
`delta_from_min`} (default `standard`) and `taliban_better_ball.bonusRule` ∈
{`gross`, `net`} (default `gross`).

**Custom game.** `+ Custom game` spans the card grid. It adds a slot for the
**first descriptor not already used by a slot** and **reveals** the Teams and
Formats sections. Verified live: with `[Poängbogey, Slagspel]` picked,
`+ Custom game` added a third panel (`Köpenhamnare`) and the Teams + Formats
sections became visible. From there the user can change the slot's format
(including to no-preset formats like `match_play_better_ball`), set its allowance
percentage, edit its config knobs, and choose its subjects — individual players
and/or teams — and build teams by hand.

**Adjusting a preset game** converts it into a custom slot: the shared sides are
forked, auto-created teams lose their auto flag, the slot loses its game key, the
card is un-picked, and the flexible sections open.

**Draft emission per slot:**

```json
{
  "formatId": "taliban_better_ball",
  "allowanceConfig": { "type": "flat", "pct": 100 },
  "subjects": [ { "kind": "team", "teamId": "1" }, { "kind": "team", "teamId": "2" } ]
}
```

with `formatConfig` present **only** when the slot's config is non-empty. A
**side format** (kind `team_grouping`) emits **team subjects only** — never the
individual players as well.

**Teams emission:** only live teams (≥ 2 members) reach the draft, as
`{id, label: "Team A"…, formation, kind, members}`. An under-filled ball is
**dropped**, not shipped as a one-member team.

### 6.2 iOS MUST

**B6.1** WHEN the Format step opens THEN the games are presented as cards
ordered by `preset.rank` ascending, missing rank last, ties by localized label.
The order is derived from the catalog, never hardcoded.

**B6.2** WHEN the Format step opens for the first time in a flow THEN
`stableford_individual` is pre-picked as one slot. If it is absent from the
catalog, the first card is picked instead.

**B6.3** WHEN a card is tapped and not currently picked THEN a **new slot** is
appended, and the round now has one more format. Multiple slots per round are
supported; there is no single-format restriction.

**B6.4** WHEN a picked card is tapped THEN its slot is removed. WHEN the last
slot would be removed THEN removal is allowed but submit is then blocked by
§6.9.

**B6.5** WHEN a card's requirements cannot be met by the current roster THEN the
card is shown **disabled with the reason** ("needs at least 4 players"), never
hidden.

**B6.6** WHEN a slot is created THEN its allowance is `100` and its config is
seeded from that format's declared defaults. WHEN a slot's format changes THEN
its config is **re-seeded** from the new format's defaults.

**B6.7** WHEN a picked format declares config knobs THEN the slot's panel
exposes exactly those knobs with exactly those option sets and defaults, read
from the descriptor — never a hardcoded knob list.

**B6.8** WHEN a format needs teams THEN the flow derives the playable shape
(`count` and `size` bounds) from the descriptor's declared ball requirements —
never from a client-side table of format names — and seeds teams to satisfy it.

**B6.9** WHEN there are zero slots THEN submit is blocked with
`Add at least one format.`

### 6.3 iOS MUST — custom format creation

**B6.10** WHEN the user chooses **Custom game** THEN a slot is added for the
first catalog descriptor **not already used by a slot**, and the advanced
(flexible) surfaces — manual Teams and per-slot Formats editing — become
available.

**B6.11** WHEN a custom slot is edited THEN the user can change: its **format**
(the full catalog, including formats with no preset card), its **allowance
percentage**, its **config knobs**, and its **subjects** (individual players
and/or teams).

**B6.12** WHEN the advanced Teams surface is available THEN the user can create
teams, name/label them, assign players, and choose the team kind (a combined
single-ball team vs. a side of separate balls) as the chosen formats permit.

**B6.13** WHEN a preset game is "adjusted" THEN it becomes a custom slot: the
card un-picks, the slot keeps its format and subjects, its shared teams are
forked so editing them no longer affects other games, and the advanced surfaces
open.

**B6.14** WHEN advanced surfaces have never been opened AND no custom slot or
custom team exists THEN they stay hidden — the default path is cards only.

### 6.4 CONVERGE

Identical to the web, including which formats are cards, ineligible-but-visible
cards, config re-seeding on format change, and the custom path. iOS's current
single-format model is the deviation being removed.

---

## 7. Playing groups

**B7.1** Playing groups are **out of scope** for this rework. WHEN no playing
group is configured THEN the draft omits `playingGroups` entirely. A draft with
an empty `playingGroups: []` is a deviation.

---

## 8. Signed-out (anonymous) create

**B8.1** WHEN the user is signed out THEN the entire create flow remains usable:
courses, tees and formats all come from **no-auth** endpoints
(`/setup/clubs`, `/setup/courses`, `/setup/tees/by-course`, `/setup/formats`,
`/setup/aggregations`).

**B8.2** WHEN the user is signed out THEN **Add from friends** and **Add me** are
absent, and every roster row is a guest.

**B8.3** WHEN the user is signed out THEN no request to `/friends` is made (it
requires auth and returns 401).

**B8.4** WHEN the user is signed out THEN submitting still works: the round is
created through the no-auth friendly-rounds front door and the flow lands on the
created round.

**B8.5** WHEN the user signs in mid-flow (if the app permits it) THEN the roster
is not rewritten; friends controls simply become available.

---

## 9. Diagnostics surfacing

### 9.1 WEB TODAY

Three local pre-checks run **before any network call**:

- no course ⇒ `Pick a course first.`
- empty roster ⇒ `Add at least one player.`
- no slots ⇒ `Add at least one format.`

Then per-row checks produce structured diagnostics:

| code | path |
|---|---|
| `missing_name` | `producers[i].name` |
| `missing_index` | `producers[i].handicapIndex` |
| `missing_tee` | `producers[i].teeId` |

and per-slot `no_subjects` with `formatIndex: i`, `path: formats[i]`.

Server/compiler refusals are routed by **structured index, never by parsing
`path`**: `formatIndex` (draft `formats[]` position) or `slotIndex` (compiled
`slots[]` position) — both name the same card, because the builder emits one
slot per draft format in draft order. A diagnostic with neither, and whose path
is not a producer/route/playing-group path, is a **general** diagnostic and goes
to the banner.

Known refusal codes are **humanized** into user vocabulary using the format's
display label. Unknown codes fall back to the raw server message.

Verified live:

- empty name ⇒ row error `Name required`, banner empty, no navigation;
- an under-filled custom slot ⇒ slot error
  `1 player in Köpenhamnare — it needs at least 3.`, no navigation;
- gender F on an M-only tee ⇒ raw server text on the row:
  `tee '9459f965-2a19-4523-aec2-4a4e370f6a75' has no 'F' rating row` — the
  un-humanized fallback, leaking a uuid (this is the gap §4.7 closes).

### 9.2 iOS MUST

**B9.1** WHEN a diagnostic carries a producer path (`producers[i]…`) THEN it is
rendered on **player row i**, inline, on the Players step.

**B9.2** WHEN a diagnostic carries `formatIndex` or `slotIndex` = i THEN it is
rendered on **format card/slot i**, inline, on the Format step. Routing is by
those structured fields; the client **never parses `path`** to find a card.

**B9.3** WHEN a diagnostic carries the route path (`route`) THEN it is rendered
on the route control on the Course step.

**B9.4** WHEN a diagnostic is attributable to none of the above THEN it is
rendered in a general error banner on the step that owns submit.

**B9.5** WHEN a diagnostic's code is one the client recognises THEN it is
rendered as a humanized sentence built from the diagnostic's **structured
fields** (counts, bounds, team label, format label) — matching the web's
wording, e.g.
`<team> has <n> players — <format> allows at most <max> per team.`,
`<n> players in <format> — it needs at least <min>.`,
`<format> pairs its balls, so it needs an even number — <n> players won't pair up.`

**B9.6** WHEN a diagnostic's code is unrecognised (or a known code arrives
without its structured fields) THEN the raw server `message` is shown in the same
inline slot. **A refusal is never dropped silently.**

**B9.7** WHEN submit is attempted and any client-side check fails THEN **no
network request is made** and the user is taken to the earliest step carrying an
error.

**B9.8** WHEN diagnostics exist THEN the step indicators show which steps carry
errors, so an error on a step the user has navigated away from is still
discoverable.

**B9.9** WHEN the user edits the field a diagnostic points at THEN that
diagnostic clears (stale errors do not linger).

### 9.3 CONVERGE

Identical routing and identical humanized wording. The one change both clients
need is §4.7: catch the gender/tee rating mismatch **client-side**, so the raw
uuid-bearing server message becomes unreachable in normal use.

---

## 10. Draft-shape invariants (pinned by parity fixtures)

These are already asserted by the generated web fixtures and the native parity
tests. They are **not negotiable** and must survive this rework.

**B10.1** The draft's top-level shape:

```json
{
  "courseId": "<course id>",
  "playedAt": "2026-01-02",
  "roundType": "full_18",
  "producers": [ … ],
  "formats": [ … ]
}
```

with `route` present only per §3, `teams` present only when at least one live
team exists, and `playingGroups` present only when at least one group exists.
**Absent keys, never empty arrays or nulls.**

**B10.2** `playedAt` is the **UTC** date (`YYYY-MM-DD`), not the device's local
day. (`2026-01-02T23:30Z` ⇒ `"2026-01-02"` even in CET.)

**B10.3** Producers are addressed positionally as `p1..pN` in create mode, in
roster order. Format subjects reference those ids.

**B10.4** A **side format** emits **team subjects only**. Four players in a
better-ball produce subject kinds `["team","team"]` — never four player
subjects as well. This is the double-scoring trap; it is the single most
expensive parity break.

**B10.5** A ball holding **one** player is **dropped**, not shipped as a
one-member team. (4 players, one stranded on their own ball ⇒ `teams.count == 1`
and `formats[0].subjects.count == 1`.)

**B10.6** A format with no config knobs emits **no `formatConfig` key at all** —
not `{}`.

**B10.7** Allowance is emitted as `{"type":"flat","pct":100}` by default.

**B10.8** Teams carry `{id, label, formation, kind, members}` with labels
`Team A`, `Team B`, … in order.

**B10.9** The parity fixtures are generated by driving the **real web** setup
service; a diff in the generated fixture file **is** the parity break and must be
explained in review, never regenerated to make a test pass.

**B10.10** Scenarios currently pinned (must keep passing):
`stableford_individual`×3, `taliban_better_ball`×4, `stableford_better_ball`×4,
`kopenhamnare_individual`×4, `umbrella_individual`×3, `match_play_individual`×2,
`match_play_better_ball`×4, `umbrella_4_ball`×4.

**B10.11** Any behavior in this spec that would change bytes on the wire for one
of those scenarios is **out of scope** and must be raised with the arbiter
first. In particular: §4 changes which `teeId` a row *defaults* to, but the
fixtures pin explicit tee ids, so the draft shape is untouched.

---

## 11. Deviations from web (summary table)

| # | Behavior | Web today | iOS must | Kind |
|---|---|---|---|---|
| D1 | Step structure | one scrolling page, no gating | stepped Course → Players → Format, gated | deviation (web follow-up) |
| D2 | Route placement | its own section after course | folded into the Course step | deviation |
| D3 | Course selector | grouped, **no search** | grouped **+ search** | invention |
| D4 | Course auto-select | first course auto-selected on load | placeholder until user chooses | deviation (web gap) |
| D5 | Tee ordering | server alphabetical | §4.3 deterministic sort | invention |
| D6 | Default tee | first tee, gender-blind | gender defaults M and F, §4.4 | invention |
| D7 | Gender/tee rating mismatch | silent; raw uuid error at submit | inline row diagnostic, submit blocked | invention |
| D8 | Starting roster | 1 empty row even when signed in | signed in ⇒ me; signed out ⇒ 1 empty row | deviation |
| D9 | Bulk prefill | none | none (iOS's current 2 empty rows removed) | iOS regression fix |
| D10 | Friends picker | frecency-sorted, **no search** | same order **+ search** | invention |
| D11 | Formats per round | multiple slots | multiple slots (iOS's single format removed) | iOS regression fix |
| D12 | Custom format path | full flexible Teams/Formats surfaces | same | iOS regression fix |
| D13 | Per-player tee | yes | yes (iOS's round-level tee removed) | iOS regression fix |
| D14 | Keypad | as §5.3 | identical | parity |
| D15 | Diagnostics routing | structured index, humanized | identical | parity |

---

## 12. Inventions (behaviors the web does not have)

Each of these is **new**. The arbiter should confirm each before it is treated
as required, and each should be filed as a web follow-up so the two clients do
not diverge permanently.

**I1 — Searchable course selector (§2.2, B2.3–B2.6).** The web's selector is a
plain scrolling overlay with club headers and no filter. With three dev courses
this is fine; with a real course database it is not. Invented: a search field
matching course name or club name, case- and diacritic-insensitively, preserving
grouping.

**I2 — Deterministic tee sort (§4.3).** The web renders tees in the server's
alphabetical order. Invented: the Swedish canon
svart→vit→gul→blå→röd→orange for colour-named tees, numeric/length-named tees
descending (longest first), numerics before colours before unclassified, stable
on ties — with the ten test vectors in §4.3.1 as the contract.

**I3 — Gender-defaulted tees (§4.4).** The web has no gender awareness in tee
selection at all: every row gets the first tee. Invented: two round-level
defaults (male, female), each restricted to tees that actually carry a rating
row for that gender, chosen by canon rank (M ⇒ first at rank ≥ gul; F ⇒ first
at rank ≥ röd; numeric sets ⇒ M longest, F shortest), with per-row overrides
that stop following the default once set.

**I4 — Gender/tee rating-mismatch diagnostic (§4.7).** The web shows an empty
course-handicap line and no warning; the user only learns at submit, via a raw
server string containing a tee uuid. Invented: an inline, client-side,
row-scoped diagnostic naming the tee and the gender, blocking submit.

**I5 — Friends-picker search (§5.5, B5.8).** The web's picker is an unfiltered
frecency list. Invented: a search field over display name and username,
preserving frecency ordering within the filtered set.

**I6 — Signed-in roster starts with "me" (§5.4, B5.1).** The web starts with one
empty row regardless of session and offers "Add me" as a separate action.
Invented: when signed in, the single starting row **is** the signed-in player.

**I7 — Explicit step gating (§1.2, B1.2–B1.3).** The web gates nothing until
submit. Invented: forward navigation blocked with a stated reason at each step.

**I8 — Non-posting round disclosure (§3.2, B3.7).** Both clients already emit
`postingEligible: false` for a rotated route; neither says so. Invented:
surfacing it.

**I9 — Step-level error indicators (§9.2, B9.8).** Invented: marking which step
carries a diagnostic, which a single-page layout does not need.

---

## 13. Web gaps (recorded, not fixed here)

These are places where the **web** falls short of the owner's ask. They are
recorded for a follow-up; this change does not fix them.

**W1 — Unsearchable course selector.** Manual scroll only (§2.1). Owner
explicitly calls this wrong.

**W2 — Auto-selected first course.** A course the user never chose is
indistinguishable from one they did, and it silently ships in the draft.

**W3 — Tees sorted alphabetically.** `Blå, Gul, Orange, Röd, Vit` is a
meaningless order to a golfer; no colour canon and no length ordering exists
anywhere in the web client.

**W4 — No gender defaults for tees.** Every player, male or female, gets the
first tee. Every mixed-gender round starts wrong and must be fixed by hand row
by row.

**W5 — Silent gender/tee rating mismatch.** An F player on an M-only tee shows
an **empty** course-handicap line and **no** inline error; the only feedback is
a submit-time raw server message that leaks a tee uuid
(`tee '9459f965-…' has no 'F' rating row`). Both the silence and the raw leak
are defects.

**W6 — Friends picker has no search.** Fine at ten friends, not at a hundred.

**W7 — No step order / no gating.** One long scroll; a user can reach the submit
button having touched nothing, and only then learns what is missing.

**W8 — `postingEligible: false` is never disclosed.** Choosing a non-standard
start hole silently makes the round non-posting.

**W9 — Web section order.** Route sits between Course and Players; the owner's
mandated reading is Course (with route and tees) → Players → Format.

---

## 14. Out of scope

- Edit mode (`editSetup`) — its producer-identity rules (`p-<key>` for new rows),
  its edit locks (`producer_has_scores`, `edit_locked_course_route`,
  `round_complete`) and the draft→forms inverse are untouched by this rework.
- Playing groups (§7).
- Any change to the format catalog, the compiler, or the server's tee ordering.
- Any change to the wire shape of the eight pinned parity scenarios (§10.10).
