# Design guidelines

Cross-surface UI rules. These are **owner rulings**, not preferences — each one
was written after a specific screen was rejected on sight, and the rejected
version is named so the same shape does not come back.

Scope: both clients. The web app (`src/`) is the visual reference and iOS
(`ios/TapScore/`) mirrors it; a rule here is binding on both. Token vocabulary,
`bridgeLegacyControls` and the ADR-005 recipe-ordering discipline live in
[AGENTS.md](../AGENTS.md) "Theme and CSS" — that is *implementation* discipline,
this is what the thing should look like.

Two existing documents hold the same rules in narrower scopes and stay
authoritative there: [ios/AGENTS.md](../ios/AGENTS.md) "Chips vs dropdowns"
(iOS primitives) and
[docs/proposals/create-flow-behavior.md](proposals/create-flow-behavior.md) §0
(the create flow, normatively, B0.1–B0.4). Neither is cross-surface, and
neither covered §1 or §2 below.

## 1. Picking a control for a bounded choice

By option count and label length, in this order:

| Options | Labels | Control |
| --- | --- | --- |
| 2 | short | **Track segmented control** — §2 |
| 3–4 | short | Chip / segmented row, always visible |
| 5+, or long, or unbounded | any | **Collapsed dropdown field** |

"Short" means one or two words. A label that needs a clause is not short, and
shortening it is §3's job — not a reason to reach for a dropdown.

**Two-way choices are their own case (owner ruling, 2026-08-01).** A binary is
the one shape where both answers fit on screen *and* the control can show which
one is live without shouting. Gross/net, full-handicap/match-style,
on/off-flavoured pairs: all of them get the track control, never a dropdown and
never two full-width buttons.

The dropdown side of the table is the twice-made ruling recorded in
ios/AGENTS.md: courses, start hole, tee defaults and per-player tee overrides
are collapsed fields. Eighteen start-hole chips in three wrapped rows was the
rejected version.

**Exception — per-hole entry during play.** Mid-round score and stat entry
yields the option-count rule to tap count: a chip is one tap, a dropdown is
open-scroll-tap, repeated every hole. `First putt` ships five chips in one row.
Setup and configuration surfaces keep the rule.

## 2. Selection reads by elevation, not saturation

A track segmented control is:

- one **sunken** container (`surface-sunken`), hairline `border`, pill radius,
  ~3px of padding;
- options inside it are transparent, no border of their own, muted text;
- the selected option is a **raised pill** — `surface` background, hairline
  border, `text` colour, slightly heavier weight.

Solid `primary` fill is reserved for **primary actions** — the thing you press
to move forward. A knob that merely records a preference must not look like a
Save button. The rejected version here was the umbrella config card
(2026-08-01): three stacked knobs, each two full-bleed buttons, the live one
filled solid fairway green. Six saturated slabs to express three binaries.

**Size to content.** A two-word option does not get half the card. The track
sizes to its labels; when every option in a field is short, the whole field
goes on **one row — label left, track right**, instead of a stacked label +
full-width control.

## 3. Labels are labels; explanation goes underneath

An option label is what the option *is*, in one or two words. It is never a
sentence explaining what the option *does*.

When an option needs explaining, the explanation is a **muted line under the
control describing the selected option** — not text crammed into the button.
The handicap-allowance field is the pattern: a small input, then
"of each player's course handicap" beneath it.

Rejected version (2026-08-01): a two-option control whose buttons read
`Full slagtilldelning för alla` and `Lägsta handicappet spelar utan slag`.
Correct version: `Fullt hcp` / `Matchspel`, with
"Lägsta handicappet spelar utan slag, övriga får skillnaden." underneath.

On the format-config axis this is carried in data — `FormatConfigOption.hint`
alongside `labels`, both `FormatLabels` — so the generic renderer on either
client shows it without knowing which format it belongs to
([ADR-0001](adr/0001-format-plugins-are-self-contained.md)).

## 4. Words, not symbols

- **Annotations are worded**, in `text-muted` or `danger`: "No men's rating",
  "Won't count for handicap". **Never an emoji.** `⚠` glued to a label has no
  accessible name, no theme token, and no room to say which gender or which
  hole it meant. When an annotated option is the selection, the collapsed field
  repeats the annotation.
- **Primary actions are text, not icons.** The dock's "Play golf" FAB is a
  worded pill with no glyph. Same instinct: words over symbols for anything the
  owner reads as a control.

## 5. Before adding a control

Check what the other client already does for the same question. The two
surfaces drifting apart is the failure this document exists to prevent, and the
web is the reference when they disagree.
