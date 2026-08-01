// Phase 3.5 — the REVERSE of SetupService's forms→draft assembly.
//
// SetupService is one-directional: form signals → a `RoundSetupDraft` on submit
// (`buildTeams` / `buildFormats` / `buildGroups` / `buildRoute`). Editing a live
// round needs the other direction — a stored draft (from `friendlyRounds.setup`)
// back into the exact form-signal shapes so the create flow can prefill every
// control. This module is that inverse, kept PURE (no signals, no service, no
// DOM) so the round-trip is unit-testable in isolation.
//
// Identity-stability contract (what MUST survive an edit unchanged, so scored
// balls keep their content-addressed ids and their append-only score events):
//   - Producer def-ids (`p1`, `p2`, …): a ball's `ball_players.producer_def_id`
//     is what the server's `producer_has_scores` guard reads. Threading the
//     ORIGINAL def-id through each row keeps an unchanged producer's def-id
//     stable, so the guard never mis-fires. New rows get no def-id here and the
//     submit path mints a positional one.
//   - Guest player ids (`playerRef {kind:'guest', id}`): a ball id is hashed
//     from the format's strategy def-id + the SET of playerRefs — so a guest's
//     ball survives only if the SAME guest id is re-submitted. Threading
//     `guestPlayerId` onto the row means the submit path re-uses it instead of
//     minting a NEW guest (which would orphan every scored ball that guest was in).
//   - Registered-player refs (`playerRef {kind:'player', id}`) → a `playerId`
//     row, same as an "Add me" / "From friends" row.
// Format strategy def-ids (`strat-N`) are NOT carried on the draft — the builder
// re-derives them deterministically from the format shape (strategyId +
// derivation + team composition) in draft order, so emitting the same formats in
// the same order reproduces the same strat-ids (hence the same ball ids). The
// mapping therefore only has to preserve format ORDER and per-format shape.

import type {
    AllowanceConfig,
    FormatSlotForm,
    Gender,
    GroupForm,
    PlayerForm,
    RoutePreset,
    TeamForm,
} from './setup.service';
import { formatHandicapIndex } from './hcp-input';

// --- The stored-draft shape we consume (a structural subset of the server's
//     `RoundSetupDraft`; mirrors `friendlyRounds.setup().draft`). Kept local so
//     the module has no server import and stays a pure client util. ---

export interface StoredProducer {
    producerDefId: string;
    playerRef: { kind: 'player' | 'guest'; id: string };
    handicapIndex: number;
    gender?: Gender;
    teeId: string;
    category?: string;
}

export interface StoredTeamMemberPlayer {
    producerDefId: string;
    allowancePct: number;
}
export interface StoredTeamMemberTeam {
    teamId: string;
}
export type StoredTeamMember = StoredTeamMemberPlayer | StoredTeamMemberTeam;

export interface StoredRoundTeam {
    id: string;
    label?: string;
    formation?: string;
    kind?: 'single_ball' | 'multi_ball';
    members: StoredTeamMember[];
}

export type StoredBallSubject =
    | { kind: 'player'; producerDefId: string }
    | { kind: 'team'; teamId: string };

export interface StoredFormat {
    formatId: string;
    allowanceConfig?: AllowanceConfig;
    producerDefIds?: string[];
    subjects?: StoredBallSubject[];
    formatConfig?: unknown;
}

export interface StoredPlayingGroup {
    members: string[];
    startTime?: string;
    startHole?: number;
}

export interface StoredRoute {
    playHoles?: { courseHoleNumber: number }[];
}

export interface StoredDraft {
    courseId: string;
    roundType?: RoutePreset | 'custom_holes';
    route?: StoredRoute;
    producers: StoredProducer[];
    teams?: StoredRoundTeam[];
    formats: StoredFormat[];
    playingGroups?: StoredPlayingGroup[];
}

/** The fully-prefilled form state a stored draft maps to. `nextKey` etc. are the
 * counters the service must resume from so freshly-added rows never collide with
 * a prefilled key. `displayNameByPlayerId` names registered rows (the draft
 * carries only the ref id; the label is resolved by the caller from balls). */
export interface PrefilledForms {
    courseId: string;
    preset: RoutePreset;
    startHole: number;
    players: PlayerForm[];
    teams: TeamForm[];
    groups: GroupForm[];
    formatSlots: FormatSlotForm[];
    /** Resume points for the service's key counters (max used key + 1). */
    nextKey: number;
    nextTeamKey: number;
    nextGroupKey: number;
    nextSlotKey: number;
}

/**
 * Resolve the flat allowance % a slot's control shows. The form's allowance
 * input is a single flat % (`buildFormats` only ever emits `{ type: 'flat' }`);
 * a split band config is preserved on submit only when untouched — but the
 * simple flat path covers what the create UI produces. A split config's first
 * band % is surfaced so the control isn't blank; the caller keeps the raw
 * config for lossless re-emit when unchanged.
 */
function allowancePctText(cfg: AllowanceConfig | undefined): string {
    if (!cfg) return '100';
    if (cfg.type === 'flat') return String(cfg.pct);
    return cfg.bands.length > 0 ? String(cfg.bands[0]!.pct) : '100';
}

/**
 * Restore a slot's format-config knobs (`FormatSlotForm.config`) from the
 * stored draft. This module is PURE — it has no catalog, so it cannot ask which
 * keys the format declares; it copies every STRING-valued entry instead. That
 * is both lossless (a knob the client can render round-trips) and safe (the
 * strategy's `validateConfig` remains the authority, and re-emitting exactly
 * what was stored cannot invalidate a draft that already compiled). Non-string
 * values are dropped: the form's controls are string-valued selects, and a
 * future non-string knob would need a form shape this can't invent.
 */
function configOf(raw: unknown): Record<string, string> {
    const out: Record<string, string> = {};
    if (!raw || typeof raw !== 'object') return out;
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
        if (typeof v === 'string') out[k] = v;
    }
    return out;
}

/**
 * Invert `SetupService.buildRoute`: a bare `roundType` preset starts at the head
 * of that preset's holes; a `custom_holes` route was a preset rotated so its
 * FIRST played hole is the chosen start hole. `presetHoles` (front/back/full)
 * are contiguous ranges, so the rotation's first courseHoleNumber IS the start
 * hole, and the preset is recovered from the hole set's span.
 */
function routeToPresetStart(draft: StoredDraft): { preset: RoutePreset; startHole: number } {
    const rt = draft.roundType;
    if (rt === 'full_18' || rt === 'front_9' || rt === 'back_9') {
        return { preset: rt, startHole: firstStartHole(draft) };
    }
    // custom_holes: recover the preset from the played hole set, start = first hole.
    const holes = (draft.route?.playHoles ?? []).map((h) => h.courseHoleNumber);
    const start = holes[0] ?? 1;
    const set = new Set(holes);
    const preset: RoutePreset =
        holes.length <= 9 && [...set].every((n) => n <= 9)
            ? 'front_9'
            : holes.length <= 9 && [...set].every((n) => n >= 10)
              ? 'back_9'
              : 'full_18';
    return { preset, startHole: start };
}

/** For a bare preset (non-rotated), the start hole is the preset head — but a
 * group may still carry an explicit startHole. The route head is preset-derived,
 * so a bare preset always starts at its first hole (1 / 1 / 10 respectively). */
function firstStartHole(draft: StoredDraft): number {
    switch (draft.roundType) {
        case 'back_9':
            return 10;
        default:
            return 1;
    }
}

/**
 * Map a stored draft back into form state. Producer def-ids and guest/player
 * refs are threaded onto each row (identity-stability contract above). Team ids
 * and format order are preserved; internal `key`s are freshly assigned in draft
 * order and a def-id→key map keeps subjects / nested teams / group members
 * pointing at the right rows.
 *
 * `nameFor` resolves a producer's display name (the draft carries only the ref);
 * the caller supplies it from the round's balls, defaulting to '' (a guest row's
 * name field is then empty until the caller fills it — the caller always can).
 *
 * `knownFormations` are the formation ids the loaded catalog knows. A stored
 * `single_ball` team of players whose formation is one of them is CLAIMED by
 * the players step's ball teams section (ball-teams-composition.md); anything
 * else — a `custom` formation, a nested team, an unknown id, an empty set
 * because the catalog fetch failed — stays in the flexible Teams editor.
 * Claiming never changes what the team IS, only which surface edits it, so a
 * failed fetch costs presentation and never data.
 */
export function draftToForms(
    draft: StoredDraft,
    nameFor: (producerDefId: string) => string = () => '',
    knownFormations: ReadonlySet<string> = new Set(),
): PrefilledForms {
    let key = 1;
    let teamKey = 1;
    let groupKey = 1;
    let slotKey = 1;

    // Producer def-id → form key, so every ref (subjects, team members, groups)
    // resolves to the row it belongs to.
    const keyByDefId = new Map<string, number>();
    const players: PlayerForm[] = draft.producers.map((p) => {
        const k = key++;
        keyByDefId.set(p.producerDefId, k);
        const isGuest = p.playerRef.kind === 'guest';
        return {
            key: k,
            name: nameFor(p.producerDefId),
            handicapIndex: formatHandicapIndex(p.handicapIndex),
            gender: p.gender ?? 'M',
            teeId: p.teeId,
            // Preserve the ORIGINAL def-id so an unchanged row keeps its ball.
            producerDefId: p.producerDefId,
            ...(isGuest
                // `guestOriginalName` is the rename baseline: submit renames
                // the stored guest iff the row's name has drifted from it.
                ? { guestPlayerId: p.playerRef.id, guestOriginalName: nameFor(p.producerDefId) }
                : { playerId: p.playerRef.id, genderKnown: p.gender != null }),
        };
    });

    // Teams: fresh keys in draft order; draft team id → form key.
    const teamKeyByDraftId = new Map<string, number>();
    (draft.teams ?? []).forEach((tm) => {
        teamKeyByDraftId.set(tm.id, teamKey++);
    });
    const teams: TeamForm[] = (draft.teams ?? []).map((tm) => {
        const k = teamKeyByDraftId.get(tm.id)!;
        const pctByPlayer: Record<number, string> = {};
        const memberTeams: Record<number, boolean> = {};
        const memberOrder: number[] = [];
        for (const m of tm.members) {
            if ('producerDefId' in m) {
                const pk = keyByDefId.get(m.producerDefId);
                if (pk !== undefined) {
                    pctByPlayer[pk] = String(m.allowancePct);
                    memberOrder.push(pk);
                }
            } else {
                const mk = teamKeyByDraftId.get(m.teamId);
                if (mk !== undefined) memberTeams[mk] = true;
            }
        }
        const kind = tm.kind ?? 'single_ball';
        const section =
            kind === 'single_ball' &&
            tm.formation !== undefined &&
            knownFormations.has(tm.formation) &&
            Object.keys(memberTeams).length === 0 &&
            memberOrder.length >= 2;
        return {
            key: k,
            kind,
            formation: tm.formation ?? 'scramble',
            pctByPlayer,
            memberTeams,
            // A stored draft records COMPOSITION, not the cards that produced
            // it (§6): every prefilled team is the user's from here on and is
            // never garbage-collected.
            autoCreated: false,
            // A hydrated ball team is ALWAYS customized: its percentages are
            // the round's decided handicaps, and re-seeding them because the
            // setup screen happened to open would rewrite the round's rules.
            ...(section
                ? { section: true, customized: true, memberOrder, pctTextByPlayer: {} }
                : {}),
        };
    });

    // Groups: exclusive members by def-id → key. `startHole` is a course hole
    // number (or absent → null = route head). `startTime` defaults to ''.
    const groups: GroupForm[] = (draft.playingGroups ?? []).map((g) => {
        const members: Record<number, boolean> = {};
        for (const defId of g.members) {
            const pk = keyByDefId.get(defId);
            if (pk !== undefined) members[pk] = true;
        }
        return {
            key: groupKey++,
            startTime: g.startTime ?? '',
            startHole: g.startHole ?? null,
            members,
        };
    });

    // Format slots. Subjects invert to the tick maps: a player subject present
    // ⇒ included (the form treats a missing key as included, so we only need to
    // record the EXCLUDED players — but recording included as `true` is
    // equally faithful and clearer). A team subject present ⇒ ticked.
    const formatSlots: FormatSlotForm[] = draft.formats.map((f) => {
        const subjectPlayers: Record<number, boolean> = {};
        const subjectTeams: Record<number, boolean> = {};
        const subjects = f.subjects;
        if (subjects) {
            const included = new Set<number>();
            for (const s of subjects) {
                if (s.kind === 'player') {
                    const pk = keyByDefId.get(s.producerDefId);
                    if (pk !== undefined) included.add(pk);
                } else {
                    const tk = teamKeyByDraftId.get(s.teamId);
                    if (tk !== undefined) subjectTeams[tk] = true;
                }
            }
            // A player NOT in the subject set must be explicitly excluded (the
            // form defaults a missing key to included).
            for (const p of players) {
                subjectPlayers[p.key] = included.has(p.key);
            }
        }
        // Same for teams, and for the same reason: a SHARED-BALL team the form
        // would otherwise default into every ball format must stay out of a
        // format the stored round deliberately did not score it in. Written
        // even when the stored format carries NO subjects at all (a plain
        // `producerDefIds` format scores the producers, never a team) —
        // otherwise the absence would grow a team subject back on the next save.
        for (const tk of teamKeyByDraftId.values()) {
            if (subjectTeams[tk] === undefined) subjectTeams[tk] = false;
        }
        return {
            key: slotKey++,
            formatId: f.formatId,
            allowancePct: allowancePctText(f.allowanceConfig),
            subjectPlayers,
            subjectTeams,
            config: configOf(f.formatConfig),
        };
    });

    const { preset, startHole } = routeToPresetStart(draft);

    return {
        courseId: draft.courseId,
        preset,
        startHole,
        players,
        teams,
        groups,
        formatSlots,
        nextKey: key,
        nextTeamKey: teamKey,
        nextGroupKey: groupKey,
        nextSlotKey: slotKey,
    };
}
