# Friends on the course — presence, and seeing friends' rounds

Status: **accepted design, v1 in build** (2026-07-30).

Related:

- `server/services/friend.service.ts` — the existing one-directional contact
  list (migration 033), and the frecency signals the create flow sorts on
- `server/api/friendly-rounds-events.ts` — the Phase 9a SSE stream this
  feature gets a session-scoped sibling of
- `server/api/dashboard.api.ts` — the caller-scoped "my rounds" this feature
  is the outward-facing counterpart to
- [ADR-0005: Identity, credentials and native auth](../adr/0005-identity-credentials-and-native-auth.md)

## Context

Today a player sees only rounds they created or produced a ball in. There is
no way to know a friend is out on the course right now, and no way to browse
what they played last week. The data is already there — per AGENTS.md, round
*reads* are open; what is missing is **discovery**, not access.

Two features hide inside the one request, and they are deliberately kept
apart:

- **Presence** — "who is out on the course right now." Ambient, ephemeral,
  glanceable. This is the one people actually want.
- **Feed** — "rounds my friends played." Retrospective, browsable, low
  urgency.

Presence ships first.

## Principles

- **Discovery is the feature, not access.** Visibility governs whether a
  round *appears* in someone's feed and whether the session-scoped spectate
  path answers. Raw id/token-addressed reads keep today's open semantics —
  see [Known gaps](#known-gaps).
- **A contact is not a friend.** Adding is unilateral and stays that way; it
  is what makes the create flow's roster picker fast. Visibility flows only
  on the **mutual** edge.
- **Watching is never silent.** If A can see B's rounds, B can see A in their
  own friends list. Asymmetric watching is designed out, not policed.
- **Read-only means read-only.** A player who is not in a round can never
  edit it — no scores, no setup, no metadata. Not a disabled button: the
  affordance is absent.
- **You are added, you do not join.** Membership only ever arrives by
  someone already in the round adding you. Once added, you have the round's
  full write powers, including adding others.
- **No push in v1.** Ambient only. "Anna just started a round" as a
  notification is the fastest way to make people switch the feature off.
- **Empty means invisible.** The presence strip renders only when non-empty.
  It never occupies home-screen space to say nothing is happening.

## Contact vs. friend

`friendships` stays exactly as it is: a one-directional row, unilateral add,
idempotent, no approval flow. The distinction is **derived**, not stored:

| Term | Meaning | Powers |
|---|---|---|
| **Contact** | I added them; they have not added me | One-tap add to a round roster; frecency sort |
| **Friend** | Both rows exist (mutual edge) | Everything a contact has, plus visibility of `friends`-visibility rounds |

No friend-request inbox, no accept/decline, no notification. The friends list
simply shows connection status, so an unreciprocated contact is visible and
can be nudged in person — which is how golf actually works.

Wording in the UI is plain and non-judgmental. A mutual row reads as a
friend with no annotation; a one-way row carries a quiet subtitle along the
lines of "hasn't added you back". Never a warning colour, never an icon that
reads as an error.

## Round visibility

New column on `rounds` (migration **049**):

```
visibility TEXT NOT NULL DEFAULT 'friends'
  CHECK (visibility IN ('private', 'friends', 'link'))
```

| Value | Appears in friends' feeds | Session-scoped spectate |
|---|---|---|
| `friends` (default) | Mutual friends of any round participant | Mutual friends of any participant |
| `private` | Never | Participants only |
| `link` | Never (not a discovery channel) | Anyone signed in with the round id |

`friends` is the default deliberately. A default of `private` makes the
feature dead on arrival — nobody discovers a social feature they must first
opt into.

`private` is a **semi-hidden opt-in**: not a step in the create flow, not a
line in the collapsed summary. It lives in round settings, one level in,
found by the player who goes looking for it on the day they are shooting 112.
Changing it mid-round is allowed and takes effect immediately.

**Word the toggle honestly.** `private` removes the round from friends' feeds
and from the spectate path; it does not make the round secret, because
id-addressed reads stay open (see [Known gaps](#known-gaps)). The control is
therefore labelled in terms of what it actually does — hiding the round from
friends — never with wording that implies nobody can reach it. A label that
over-promises is worse than no toggle.

**Competition rounds are excluded** from both the feed and the spectate path,
regardless of their `visibility` value. They carry a friendly wrapper whose
creator is whichever admin materialised them, so without an explicit
exclusion a round of a competition still in `setup` would surface in that
admin's friends' feeds before the competition is public. Competition
discovery stays admin-gated; `server/services/friendly-round.service.ts`
already excludes them from the creator's own list for the same reason.

Participation for visibility purposes = produced a ball in the round
(`ball_players.player_id`) **or** created it (`friendly_rounds.creator_player_id`).
A round is visible to the union of every participant's mutual friends —
seeing a round because your friend is in it, not only because your friend
organised it.

## Presence — what "on the course" means

Friendly rounds never lock; `status` is therefore not a liveness signal (see
the standing rule that scores and setup stay editable forever). Presence is
derived from **activity recency**:

> A round is live for presence when its most recent score event is within
> **3 hours**, its status is not `complete`, and it has unplayed holes
> remaining.

A round drops out of the strip silently when it goes stale. No "abandoned
round" wording, no prompt to the host, no tombstone. It simply moves into
the recent feed.

## Surfaces

### Home — "Out now" strip

Renders only when non-empty. One line of context above ("2 friends on the
course"), then a horizontal row of chips, one per live round:

- friend avatar/initials + live dot
- `Thru 7 · +3` — holes played and score to par, nothing finer

Tapping a chip opens the read-only live view. A friend's individual bad hole
never appears on the home screen; the full scorecard is one tap behind.

### Read-only live view (spectate)

The existing round result/leaderboard renderer with every entry affordance
absent. Header states the relationship plainly — "Watching · Anna's round at
Linköping". Live via a session-scoped SSE stream.

**The viewer never receives the round's share token.** The token is a write
credential; handing it to a spectator would silently promote them to a
participant. Same reasoning AGENTS.md applies to `/api/admin/rounds`. The
spectate path is authorized by session + visibility, and returns a payload
with the token stripped.

Guest players inside a friend's round render as display names only — no
links, no stats, nothing resembling a profile.

### Friends tab

Each row gains a live dot while that friend is playing, and its subtitle
carries last-round context ("Played Linköping · 3 days ago") alongside the
existing frecency wording. Connection status (mutual / one-way) shows here.

Friend detail page — recent rounds, shared-round count, and their stats once
those are opted-in — is **post-v1**.

### History

A segmented control `Mine / Friends`, not an interleaved list. Mixing other
people's rounds into "All rounds" puts foreign rows next to a delete button.
Post-v1.

## Joining

There is no join. A player enters a round only by being added by someone
already in it. Once added, they hold the round's ordinary write powers and
can add others in turn.

This is a deliberate omission, not a missing feature: a request-to-join flow
needs an inbox, notifications, and a race against a round already underway.
The UI communicates it by simply not offering the affordance — no "request to
join" button in a disabled state.

## v1 slice

1. Mutual-edge derivation on `FriendService`; `visibility` column on `rounds`
   (migration 049), defaulted and enforced, **with a participant-gated write
   path** — a default the owner cannot change is not a default, it is a
   policy.
2. `GET /dashboard/friends-activity` → `{ live: [...], recent: [...] }`,
   session-scoped.
3. Home "Out now" strip.
4. Read-only spectate view + session-scoped SSE.

Build order: **server → iOS → web**, web starting once iOS is judged good.

A control that reports its own state is part of the toggle, not polish: the
round payload carries `visibility`, so the switch reads the truth rather than
a device-local guess. The share token is held by every participant, so a
guessed state is not merely stale — it lets one participant silently undo
another's opt-out.

Deferred: friend detail page, History `Friends` tab, per-round visibility
editing beyond the round-settings toggle, stats on the friend page,
notifications of any kind, and the Friends-tab last-round subtitle ("Played
Linköping · 3 days ago") — `FriendProfile` carries only *shared*-round
counts, so that one needs a server field it does not have yet.

## Known gaps

- **`private` does not retroactively close id/token-addressed reads.** Round
  reads are open by design today; visibility gates the new discovery and
  spectate paths only. Closing the older paths is a separate, larger change
  with its own migration of client assumptions.
- **No blocking.** Removing a contact removes the mutual edge and therefore
  the visibility, which covers the ordinary case. A true block list is not
  in scope.
- **Presence has no manual override.** A player cannot mark themselves
  invisible for one round except by setting that round `private`.
