import { type Kysely } from 'kysely';
import { courseHandicap, playingHandicap } from '../../domain/handicap';

interface ParticipantPlayerRow {
    id: string;
    participant_id: string;
    player_id: string | null;
    guest_player_id: string | null;
}

interface ParticipantRow {
    id: string;
    round_id: string;
    tee_id_snapshot: string | null;
    handicap_index_snapshot: number | null;
    course_handicap_snapshot: number | null;
}

interface TeeRatingRow {
    tee_id: string;
    gender: 'M' | 'F';
    course_rating: number;
    slope: number;
    par: number;
}

interface HandicapHistoryRow {
    player_id: string;
    handicap_index: number;
    effective_date: string;
    created_at: string;
}

interface GuestPlayerRow {
    id: string;
    handicap_index: number | null;
}

interface RoundFormatSlotRow {
    round_id: string;
    slot_index: number;
    allowance_pct: number;
    scope_config: string | null;
}

interface LinkSnapshot {
    handicapIndex: number | null;
    courseHandicap: number | null;
    playingHandicap: number | null;
}

function nullSnapshot(): LinkSnapshot {
    return {
        handicapIndex: null,
        courseHandicap: null,
        playingHandicap: null,
    };
}

function inferParticipantGender(
    participant: ParticipantRow,
    ratings: TeeRatingRow[],
): 'M' | 'F' | null {
    if (
        participant.handicap_index_snapshot === null ||
        participant.course_handicap_snapshot === null
    ) {
        return ratings.length === 1 ? ratings[0]!.gender : null;
    }
    const matching = ratings.filter((r) => {
        const raw =
            participant.handicap_index_snapshot! * (r.slope / 113) +
            (r.course_rating - r.par);
        return Math.round(raw) === participant.course_handicap_snapshot;
    });
    if (matching.length === 1) return matching[0]!.gender;
    if (matching.length > 1) return matching[0]!.gender;
    return ratings.length === 1 ? ratings[0]!.gender : null;
}

function allowancePctForParticipant(
    participantId: string,
    slots: RoundFormatSlotRow[],
): number | null {
    if (slots.length === 0) return null;
    if (
        slots.length === 1 &&
        (slots[0]!.scope_config === null ||
            ((JSON.parse(slots[0]!.scope_config) as { scope?: { participantIds?: string[] } }).scope
                ?.participantIds ?? null) === null)
    ) {
        return slots[0]!.allowance_pct;
    }
    const matches = slots.filter((slot) => {
        if (slot.scope_config === null) return false;
        const parsed = JSON.parse(slot.scope_config) as {
            scope?: { participantIds?: string[] };
        };
        return parsed.scope?.participantIds?.includes(participantId) ?? false;
    });
    return matches.length === 1 ? matches[0]!.allowance_pct : null;
}

function computeSnapshot(
    handicapIndexValue: number | null,
    rating: TeeRatingRow | undefined,
    allowancePct: number | null,
): LinkSnapshot {
    if (handicapIndexValue === null || rating === undefined || allowancePct === null) {
        return nullSnapshot();
    }
    const ch = courseHandicap({
        handicapIndex: handicapIndexValue,
        slope: rating.slope,
        courseRating: rating.course_rating,
        par: rating.par,
    });
    return {
        handicapIndex: handicapIndexValue,
        courseHandicap: ch,
        playingHandicap: playingHandicap(ch, allowancePct),
    };
}

/**
 * Per-player handicap snapshots for team participants.
 *
 * `participant_players` grows the same three frozen values that previously
 * only existed on `participants`: handicap index, course handicap, and
 * playing handicap. Team formats (better-ball, Taliban, Umbrella) need
 * these numbers per linked player; reusing the team's single snapshot made
 * both players appear to play off the same handicap.
 *
 * Backfill for existing rows is best-effort:
 *   - player links use the latest handicap_history value
 *   - guest links use guest_players.handicap_index
 *   - tee comes from participants.tee_id_snapshot
 *   - gender is inferred from the participant's existing frozen CH against
 *     the tee ratings (same heuristic as the render uses)
 *   - allowance comes from the participant's slot (single-slot default or
 *     explicit scopeConfig participantIds on multi-slot rounds)
 *
 * If any ingredient is missing, the new per-link snapshots stay null and the
 * read path may still fall back to the participant-level snapshot.
 */
export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .alterTable('participant_players')
        .addColumn('handicap_index_snapshot', 'real')
        .execute();

    await db.schema
        .alterTable('participant_players')
        .addColumn('course_handicap_snapshot', 'integer')
        .execute();

    await db.schema
        .alterTable('participant_players')
        .addColumn('playing_handicap_snapshot', 'integer')
        .execute();

    const links = (await db
        .selectFrom('participant_players')
        .select([
            'id',
            'participant_id',
            'player_id',
            'guest_player_id',
        ])
        .execute()) as ParticipantPlayerRow[];

    if (links.length === 0) return;

    const participants = (await db
        .selectFrom('participants')
        .select([
            'id',
            'round_id',
            'tee_id_snapshot',
            'handicap_index_snapshot',
            'course_handicap_snapshot',
        ])
        .execute()) as ParticipantRow[];
    const participantById = new Map(participants.map((p) => [p.id, p]));

    const ratings = (await db
        .selectFrom('tee_ratings')
        .select([
            'tee_id',
            'gender',
            'course_rating',
            'slope',
            'par',
        ])
        .execute()) as TeeRatingRow[];
    const ratingsByTeeId = new Map<string, TeeRatingRow[]>();
    for (const rating of ratings) {
        const bucket = ratingsByTeeId.get(rating.tee_id);
        if (bucket) bucket.push(rating);
        else ratingsByTeeId.set(rating.tee_id, [rating]);
    }

    const historyRows = (await db
        .selectFrom('handicap_history')
        .select(['player_id', 'handicap_index', 'effective_date', 'created_at'])
        .orderBy('effective_date', 'desc')
        .orderBy('created_at', 'desc')
        .execute()) as HandicapHistoryRow[];
    const latestHandicapByPlayerId = new Map<string, number>();
    for (const row of historyRows) {
        if (!latestHandicapByPlayerId.has(row.player_id)) {
            latestHandicapByPlayerId.set(row.player_id, row.handicap_index);
        }
    }

    const guests = (await db
        .selectFrom('guest_players')
        .select(['id', 'handicap_index'])
        .execute()) as GuestPlayerRow[];
    const guestHandicapById = new Map(guests.map((g) => [g.id, g.handicap_index]));

    const slotRows = (await db
        .selectFrom('round_format_slots')
        .select(['round_id', 'slot_index', 'allowance_pct', 'scope_config'])
        .orderBy('round_id')
        .orderBy('slot_index')
        .execute()) as RoundFormatSlotRow[];
    const slotsByRoundId = new Map<string, RoundFormatSlotRow[]>();
    for (const row of slotRows) {
        const bucket = slotsByRoundId.get(row.round_id);
        if (bucket) bucket.push(row);
        else slotsByRoundId.set(row.round_id, [row]);
    }

    for (const link of links) {
        const participant = participantById.get(link.participant_id);
        if (!participant || !participant.tee_id_snapshot) continue;

        const ratingsForTee = ratingsByTeeId.get(participant.tee_id_snapshot) ?? [];
        const gender = inferParticipantGender(participant, ratingsForTee);
        const rating =
            gender === null
                ? undefined
                : ratingsForTee.find((r) => r.gender === gender);
        const allowancePct = allowancePctForParticipant(
            participant.id,
            slotsByRoundId.get(participant.round_id) ?? [],
        );

        const handicapIndexValue =
            link.player_id !== null
                ? (latestHandicapByPlayerId.get(link.player_id) ?? null)
                : link.guest_player_id !== null
                  ? (guestHandicapById.get(link.guest_player_id) ?? null)
                  : null;

        const snapshot = computeSnapshot(handicapIndexValue, rating, allowancePct);

        await db
            .updateTable('participant_players')
            .set({
                handicap_index_snapshot: snapshot.handicapIndex,
                course_handicap_snapshot: snapshot.courseHandicap,
                playing_handicap_snapshot: snapshot.playingHandicap,
            })
            .where('id', '=', link.id)
            .execute();
    }
}
