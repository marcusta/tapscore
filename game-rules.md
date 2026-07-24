- **One `players` table** for logged-in people. Fields live together (auth + identity + handicap_index). Handicap history goes in its own append-only table. Guest players (FriendlyRound, no login) go in a separate `guest_players` table. Role grants are a junction table. In app code, the word "user" only appears inside framework auth plumbing; everywhere else, say "player".
- **Rounds are ball-native.** A round definition declares producers; compilation
  creates `balls` and `ball_players`. Each `ball_players` identity uses two
  nullable FKs (`player_id` xor `guest_player_id`), never a discriminator string.
  Do not reintroduce the retired `participant_players` model; its remaining
  mentions are migration-history bridges only.
- **Snapshot at time of play** — `ball_players` carries frozen copies of identity,
  handicap index, course handicap, tee, and category; per-slot `slot_balls`
  carries the frozen playing handicap. Results never recompute from live player
  data.
- **Score events are source of truth** — `score_events` is append-only;
  `scorecards` is a materialised view. The event log replays exact state; client
  writes are idempotent via `client_event_id`.
- **Format strategies are pluggable** — scoring mode × team shape axes. New format = new strategy file + registration. No schema change.
- **Result render vocabulary is closed + presentation-only, and is wired.**
  `server/domain/strategies/result-vocabulary.ts` defines the closed tones,
  markers, grid-component ids, and smart constructors used by the live
  `result-sections.ts` contract. Format presenters emit these hints (for example
  `marker.diamond(...)`), and both static and client renderers consume them
  without format-id branching. Golf meaning belongs in labels, never token names
  such as `birdie` or `win5`. `result-sections-vnext.ts` is now only an
  unreferenced Phase-0 design artifact; do not mistake it for the live contract.
  The live types are the source of truth; do not restate the token list in docs.
- **Setup refusals must be actionable — never a bare "Validation failed".**
  The wizard's error pipeline is data-driven; keep every format on it:
  - A new format declares its full shape in the strategy's `ballRequirement()`
    (producer count, ball mode, `slotTeamGrouping` team count/size bounds).
    That single declaration drives the compiler's generic validation, the
    client's soft editor (`format-catalog.service.ts` `classify()`), AND the
    generated "here's what to build" guidance — a correctly-declared format
    needs zero per-format error code anywhere.
  - Any compiler diagnostic a setup UI can trigger must carry the structured
    fields on `CompilerDiagnostic` (`formatId`, `actual`,
    `allowedMin`/`allowedMax`, `teamLabel` where relevant), never
    message-prose alone — and needs a matching humanizer case in
    `src/create/diagnostics.ts` plus a test in
    `tests/create/diagnostics.test.ts`. The raw-`message` fallback is a safety
    net for unknown codes, not a presentation path.
  - The TypeBox schema 400 (the framework's literal "Validation failed") must
    be unreachable from the wizard: any draft shape the UI can produce that
    would violate the schema needs a local pre-check in
    `setup.service.ts` `submit()` (pattern: the `no_subjects` check /
    `slotSubjectCount`) whose message says what to DO, not what failed.
  - Error text speaks the setup UI's vocabulary — "One combined ball",
    "Separate balls (a side)", "Teams", "Scores" — never engine jargon
    (slot, ball mode, producer, grouping).
- **Format verification uses the canonical fixture workflow** — when working on formats, do not rely on whatever happens to already be in `data/app.sqlite`. Rebuild the dedicated fixture DB with `bun run seed:formats`, then render from that same fixture set with `bun run render:formats`.
- **Phase order is fixed** — see `PHASES.md`. Stop and hand-test between phases; do not skip ahead.
- **FK-target migrations precede dependents, regardless of phase narrative.** SQLite runs with `PRAGMA foreign_keys = ON`, which validates the parent table's existence on *every write* to the referencing table — even when the FK column is NULL. If a phase's narrative order puts an entity before the one it references, land the referenced table's migration first (it can ship with an empty service and fill out later). Example: Phase 1b extends `players` with `home_club_id` → `clubs(id)`, but `clubs` isn't introduced until 1c; the clubs migration lands as `002_create_clubs.ts` before the extend-players migration.
- **Reserved columns are not added twice.** If an earlier migration reserved a
  plain nullable TEXT column for a later FK (currently
  `competitions.point_template_id`), the later phase must create the parent and
  then rebuild the SQLite table with the FK or install an explicit equivalent
  integrity mechanism. Never attempt `ADD COLUMN` with the same name.
