// Phase 2.6b/3a — legacy → round_definitions backfill.
//
// Synthesizes a `RoundDefinition` from the pre-compiler tables
// (participants / participant_players / round_format_slots + course & tee
// snapshots), runs it through the RoundCompiler, and persists v1 rows into
// the seven compiler-output tables created in migration 018.
//
// Called from migration 019 for every round without a `round_definitions`
// row. Also exposed as a helper for dev-tool re-runs (fresh seed DBs
// create rounds after the migration ran — this lets us replay the same
// logic without dropping the DB).
//
// Contract:
//   - Per-round work is inside a savepoint transaction; if synthesis or
//     compilation produce diagnostics, the savepoint rolls back and we
//     record the round as skipped without breaking the caller.
//   - Gender for players is inferred by reversing the stored
//     `participant_players.course_handicap_snapshot` against both M/F
//     rating rows on the player's tee — whichever matches wins. Falls
//     back to `M` when the snapshot is missing or neither rating fits.
//     Guests carry gender directly on `guest_players.gender`.

import type { Kysely } from 'kysely';

import { compile } from '../../domain/compiler/compile';
import { persistCompiledRound } from '../../domain/compiler/persist';
import {
    synthesizeRoundDefinition,
    type LegacyFormatSlot,
    type LegacyParticipant,
    type LegacyParticipantPlayer,
    type LegacyRoundInput,
} from '../../domain/compiler/synthesize-legacy';
import type {
    CompilerInput,
    CompilerTeeContext,
    Gender,
} from '../../domain/compiler/types';
import { courseHandicap } from '../../domain/handicap';
import type { Database } from '../schema';

export interface BackfillDiagnostic {
    roundId: string;
    stage: 'synthesis' | 'compile' | 'persist';
    messages: string[];
}

export interface BackfillResult {
    roundsTouched: number;
    roundsSkipped: number;
    diagnostics: BackfillDiagnostic[];
}

type TeeRating = { courseRating: number; slope: number; teePar: number };

export async function backfillRoundDefinitions(
    db: Kysely<Database>,
): Promise<BackfillResult> {
    const result: BackfillResult = { roundsTouched: 0, roundsSkipped: 0, diagnostics: [] };

    const rounds = await db
        .selectFrom('rounds')
        .leftJoin('round_definitions', 'round_definitions.round_id', 'rounds.id')
        .select(['rounds.id', 'rounds.course_id', 'rounds.date'])
        .where('round_definitions.round_id', 'is', null)
        .execute();

    if (rounds.length === 0) return result;

    const ctx = await loadGlobalContext(db);

    for (const round of rounds) {
        const diag = await backfillOne(db, round, ctx);
        if (diag) {
            result.roundsSkipped += 1;
            result.diagnostics.push(diag);
        } else {
            result.roundsTouched += 1;
        }
    }
    return result;
}

interface GlobalContext {
    playerDisplayById: Map<string, string>;
    guestById: Map<string, { displayName: string; gender: Gender }>;
    teeNameById: Map<string, string>;
    ratingsByTee: Map<string, { M?: TeeRating; F?: TeeRating }>;
}

async function loadGlobalContext(db: Kysely<Database>): Promise<GlobalContext> {
    const [players, guests, tees, ratings] = await Promise.all([
        db.selectFrom('players').select(['id', 'display_name']).execute(),
        db.selectFrom('guest_players').select(['id', 'display_name', 'gender']).execute(),
        db.selectFrom('tees').select(['id', 'name']).execute(),
        db
            .selectFrom('tee_ratings')
            .select(['tee_id', 'gender', 'course_rating', 'slope', 'par'])
            .execute(),
    ]);

    const ratingsByTee = new Map<string, { M?: TeeRating; F?: TeeRating }>();
    for (const r of ratings) {
        const bucket = ratingsByTee.get(r.tee_id) ?? {};
        bucket[r.gender] = { courseRating: r.course_rating, slope: r.slope, teePar: r.par };
        ratingsByTee.set(r.tee_id, bucket);
    }

    return {
        playerDisplayById: new Map(players.map((p) => [p.id, p.display_name])),
        guestById: new Map(
            guests.map((g) => [g.id, { displayName: g.display_name, gender: g.gender }]),
        ),
        teeNameById: new Map(tees.map((t) => [t.id, t.name])),
        ratingsByTee,
    };
}

async function backfillOne(
    db: Kysely<Database>,
    round: { id: string; course_id: string; date: string },
    global: GlobalContext,
): Promise<BackfillDiagnostic | null> {
    const [participants, participantPlayers, formatSlots, courseHoles, teeHoles] =
        await Promise.all([
            db
                .selectFrom('participants')
                .selectAll()
                .where('round_id', '=', round.id)
                .execute(),
            db
                .selectFrom('participant_players')
                .innerJoin(
                    'participants',
                    'participants.id',
                    'participant_players.participant_id',
                )
                .select([
                    'participant_players.id',
                    'participant_players.participant_id',
                    'participant_players.player_id',
                    'participant_players.guest_player_id',
                    'participant_players.handicap_index_snapshot',
                    'participant_players.course_handicap_snapshot',
                ])
                .where('participants.round_id', '=', round.id)
                .execute(),
            db
                .selectFrom('round_format_slots')
                .selectAll()
                .where('round_id', '=', round.id)
                .execute(),
            db
                .selectFrom('round_course_holes')
                .selectAll()
                .where('round_id', '=', round.id)
                .execute(),
            db
                .selectFrom('round_tee_holes')
                .selectAll()
                .where('round_id', '=', round.id)
                .execute(),
        ]);

    if (participants.length === 0) {
        return {
            roundId: round.id,
            stage: 'synthesis',
            messages: ['round has no participants'],
        };
    }
    if (formatSlots.length === 0) {
        return {
            roundId: round.id,
            stage: 'synthesis',
            messages: ['round has no format slots'],
        };
    }
    if (courseHoles.length === 0) {
        return {
            roundId: round.id,
            stage: 'synthesis',
            messages: ['round has no round_course_holes — run 2.6a backfill first'],
        };
    }

    const legacyParticipants: LegacyParticipant[] = participants.map((p) => ({
        id: p.id,
        teamLabel: p.team_label,
        teeIdSnapshot: p.tee_id_snapshot,
        handicapIndexSnapshot: p.handicap_index_snapshot,
        categorySnapshot: p.category_snapshot,
    }));

    const legacyParticipantPlayers: LegacyParticipantPlayer[] = participantPlayers.map(
        (pp) => ({
            id: pp.id,
            participantId: pp.participant_id,
            playerId: pp.player_id,
            guestPlayerId: pp.guest_player_id,
            handicapIndexSnapshot: pp.handicap_index_snapshot,
        }),
    );

    const legacyFormatSlots: LegacyFormatSlot[] = formatSlots.map((s) => ({
        slotIndex: s.slot_index,
        scoringMode: s.scoring_mode,
        teamShape: s.team_shape,
        allowancePct: s.allowance_pct,
        scopeConfig: s.scope_config,
    }));

    const handicapFallback = (_ref: { kind: 'player' | 'guest'; id: string }): number | null => {
        // Legacy seeds always stamp a snapshot onto participant_players;
        // the fallback only fires for rows missing one, which we treat
        // as a synthesis error later.
        return null;
    };

    // Map participant_player.id → its owning participant (needed for tee lookup
    // during gender inference). Build once, reuse in genderFor.
    const participantByPp = new Map(
        participantPlayers.map((pp) => [pp.id, participants.find((p) => p.id === pp.participant_id)!]),
    );
    const ppByPersonRef = new Map<string, string>();
    for (const pp of participantPlayers) {
        const key = pp.player_id ? `player:${pp.player_id}` : `guest:${pp.guest_player_id}`;
        ppByPersonRef.set(key, pp.id);
    }

    const genderFor = (ref: { kind: 'player' | 'guest'; id: string }): Gender | undefined => {
        if (ref.kind === 'guest') {
            return global.guestById.get(ref.id)?.gender;
        }
        const ppId = ppByPersonRef.get(`player:${ref.id}`);
        if (!ppId) return undefined;
        const participant = participantByPp.get(ppId);
        if (!participant?.tee_id_snapshot) return 'M';
        const ratings = global.ratingsByTee.get(participant.tee_id_snapshot);
        if (!ratings) return 'M';
        const pp = participantPlayers.find((x) => x.id === ppId)!;
        const hi = pp.handicap_index_snapshot ?? participant.handicap_index_snapshot;
        const chSnap =
            pp.course_handicap_snapshot ?? participant.course_handicap_snapshot ?? null;
        return inferGender(hi, chSnap, ratings);
    };

    const legacyInput: LegacyRoundInput = {
        roundId: round.id,
        courseId: round.course_id,
        playedAt: round.date,
        participants: legacyParticipants,
        participantPlayers: legacyParticipantPlayers,
        formatSlots: legacyFormatSlots,
        handicapFallback,
        genderFor,
    };

    const synth = synthesizeRoundDefinition(legacyInput);
    if (synth.diagnostics.length > 0) {
        return { roundId: round.id, stage: 'synthesis', messages: synth.diagnostics };
    }

    // Build CompilerInput.
    const teeIdsUsed = new Set(
        legacyParticipants
            .map((p) => p.teeIdSnapshot)
            .filter((v): v is string => v !== null),
    );

    const tees = new Map<string, CompilerTeeContext>();
    for (const teeId of teeIdsUsed) {
        const teeName =
            teeHoles.find((t) => t.tee_id === teeId)?.tee_name_snapshot ??
            global.teeNameById.get(teeId) ??
            `tee:${teeId.slice(0, 8)}`;
        const holes = teeHoles
            .filter((t) => t.tee_id === teeId)
            .map((t) => ({
                holeNumber: t.hole_number,
                lengthM: t.length_m,
                strokeIndexOverride: t.stroke_index_override,
            }));
        if (holes.length === 0) {
            return {
                roundId: round.id,
                stage: 'compile',
                messages: [`no round_tee_holes for tee '${teeId}'`],
            };
        }
        const ratingsBucket = global.ratingsByTee.get(teeId);
        if (!ratingsBucket || (!ratingsBucket.M && !ratingsBucket.F)) {
            return {
                roundId: round.id,
                stage: 'compile',
                messages: [`tee '${teeId}' has no rating rows`],
            };
        }
        const ratings = new Map<Gender, TeeRating>();
        if (ratingsBucket.M) ratings.set('M', ratingsBucket.M);
        if (ratingsBucket.F) ratings.set('F', ratingsBucket.F);
        tees.set(teeId, { teeName, holes, ratings });
    }

    const playerProfiles = new Map<
        string,
        { displayName: string; gender?: Gender; category?: string }
    >();
    const guestProfiles = new Map<
        string,
        { displayName: string; gender?: Gender; category?: string }
    >();
    for (const pp of participantPlayers) {
        if (pp.player_id) {
            const dn = global.playerDisplayById.get(pp.player_id);
            if (!dn) {
                return {
                    roundId: round.id,
                    stage: 'compile',
                    messages: [`player '${pp.player_id}' not found`],
                };
            }
            playerProfiles.set(pp.player_id, {
                displayName: dn,
                gender: genderFor({ kind: 'player', id: pp.player_id }),
            });
        } else if (pp.guest_player_id) {
            const g = global.guestById.get(pp.guest_player_id);
            if (!g) {
                return {
                    roundId: round.id,
                    stage: 'compile',
                    messages: [`guest_player '${pp.guest_player_id}' not found`],
                };
            }
            guestProfiles.set(pp.guest_player_id, {
                displayName: g.displayName,
                gender: g.gender,
            });
        }
    }

    const compilerInput: CompilerInput = {
        roundId: round.id,
        definition: synth.definition,
        courseHoles: courseHoles.map((h) => ({
            holeNumber: h.hole_number,
            par: h.par,
            baseStrokeIndex: h.base_stroke_index,
        })),
        tees,
        playerProfiles,
        guestProfiles,
    };

    const res = compile(compilerInput);
    if (!res.ok) {
        return {
            roundId: round.id,
            stage: 'compile',
            messages: res.diagnostics.map((d) => `${d.code}: ${d.message}`),
        };
    }

    try {
        await persistCompiledRound(db, res.compiled);
    } catch (e) {
        return {
            roundId: round.id,
            stage: 'persist',
            messages: [(e as Error).message],
        };
    }

    return null;
}

function inferGender(
    handicapIndex: number | null,
    chSnapshot: number | null,
    ratings: { M?: TeeRating; F?: TeeRating },
): Gender {
    const defaultGender: Gender = ratings.M ? 'M' : 'F';
    if (handicapIndex === null || chSnapshot === null) return defaultGender;
    if (ratings.M) {
        const ch = courseHandicap({
            handicapIndex,
            slope: ratings.M.slope,
            courseRating: ratings.M.courseRating,
            par: ratings.M.teePar,
        });
        if (ch === chSnapshot) return 'M';
    }
    if (ratings.F) {
        const ch = courseHandicap({
            handicapIndex,
            slope: ratings.F.slope,
            courseRating: ratings.F.courseRating,
            par: ratings.F.teePar,
        });
        if (ch === chSnapshot) return 'F';
    }
    return defaultGender;
}
