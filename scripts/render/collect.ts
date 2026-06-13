// Collect data from services + the compiler tables (`balls`, `ball_players`,
// `slots`, `slot_balls`, `slot_ball_teams`, `round_ball_strategies`) into
// the ball-native shape the rendering code consumes.
//
// Phase 2.6b/3c.2 dropped the participant-keyed view layer — domain
// leaderboard / scorecards / events flow through unchanged, and each ball
// carries its producers + per-slot PH + team grouping in `BallInfo`.

import type { Course } from '../../server/services/course.service';
import type { Club } from '../../server/services/club.service';
import type { Player } from '../../server/services/player.service';
import type { GuestPlayer } from '../../server/services/guest-player.service';
import type { Tee } from '../../server/services/tee.service';
import type {
    BallInfo,
    BallProducerInfo,
    IndexRow,
    RoundCourseHoleSnapshot,
    RoundRenderContext,
    RoundTeeHoleSnapshot,
    Services,
} from './types';

export async function collectIndexRows(svc: Services): Promise<IndexRow[]> {
    const rounds = await svc.roundService.list();
    const courseById = new Map<string, Course>();
    const clubById = new Map<string, Club>();
    const rows: IndexRow[] = [];
    for (const r of rounds) {
        let course = courseById.get(r.courseId) ?? null;
        if (!course) {
            course = await svc.courseService.getById(r.courseId);
            if (course) courseById.set(r.courseId, course);
        }
        if (!course) continue;
        let club = clubById.get(course.clubId) ?? null;
        if (!club) {
            club = (await svc.clubService.list()).find((c) => c.id === course.clubId) ?? null;
            if (club) clubById.set(course.clubId, club);
        }
        const ballCount = await svc.db
            .selectFrom('balls')
            .where('round_id', '=', r.id)
            .select((eb) => eb.fn.countAll<number>().as('c'))
            .executeTakeFirst();
        const events = await svc.scoreEventService.listByRound(r.id);
        rows.push({
            round: r,
            course,
            club,
            ballCount: Number(ballCount?.c ?? 0),
            eventCount: events.length,
        });
    }
    return rows;
}

export async function collectRoundContext(
    svc: Services,
    roundId: string,
    dbPath: string,
): Promise<RoundRenderContext> {
    const round = await svc.roundService.getById(roundId);
    if (!round) throw new Error(`round ${roundId} not found`);
    const course = await svc.courseService.getById(round.courseId);
    if (!course) throw new Error(`course ${round.courseId} not found`);

    const events = await svc.scoreEventService.listByRound(roundId);
    const roundResult = await svc.leaderboardService.resultForRound(roundId);

    // --- ball-native context -------------------------------------------------

    const ballRows = await svc.db
        .selectFrom('balls as b')
        .leftJoin('round_ball_strategies as rbs', 'rbs.id', 'b.round_ball_strategy_id')
        .where('b.round_id', '=', roundId)
        .select([
            'b.id as id',
            'b.label as label',
            'b.course_handicap_snapshot as course_handicap_snapshot',
            'rbs.strategy_id as strategy_id',
        ])
        .execute();

    if (ballRows.length === 0) {
        // Legacy rounds that pre-date migration 019 (ball-backfill) cannot
        // be rendered under the ball-native pipeline. Clean-break per
        // Phase 2.6b/3c.2 — fail loudly rather than silently falling back.
        throw new Error(
            `render-lib: round ${roundId} has no balls — legacy fixture outside the ball-native pipeline. Re-seed or run the 019 backfill.`,
        );
    }

    const ballIds = ballRows.map((b) => b.id);

    const ballPlayerRows = await svc.db
        .selectFrom('ball_players')
        .where('ball_id', 'in', ballIds)
        .select([
            'ball_id',
            'producer_def_id',
            'player_id',
            'guest_player_id',
            'display_name_snapshot',
            'handicap_index_snapshot',
            'course_handicap_snapshot',
            'tee_id',
            'tee_name_snapshot',
        ])
        .execute();

    const producersByBall = new Map<string, BallProducerInfo[]>();
    for (const bp of ballPlayerRows) {
        const arr = producersByBall.get(bp.ball_id) ?? [];
        arr.push({
            producerDefId: bp.producer_def_id,
            playerId: bp.player_id,
            guestPlayerId: bp.guest_player_id,
            displayName: bp.display_name_snapshot,
            handicapIndexSnapshot: bp.handicap_index_snapshot,
            courseHandicapSnapshot: bp.course_handicap_snapshot,
            teeId: bp.tee_id,
            teeNameSnapshot: bp.tee_name_snapshot,
        });
        producersByBall.set(bp.ball_id, arr);
    }

    const slotRows = await svc.db
        .selectFrom('slots')
        .where('round_id', '=', roundId)
        .select(['id', 'slot_def_id'])
        .execute();
    const slotIds = slotRows.map((s) => s.id);

    const slotBallRows =
        slotIds.length > 0
            ? await svc.db
                  .selectFrom('slot_balls')
                  .where('slot_id', 'in', slotIds)
                  .where('ball_id', 'in', ballIds)
                  .select(['slot_id', 'ball_id', 'playing_handicap_snapshot'])
                  .execute()
            : [];

    const slotBallTeamRows =
        slotIds.length > 0
            ? await svc.db
                  .selectFrom('slot_ball_teams')
                  .where('slot_id', 'in', slotIds)
                  .where('ball_id', 'in', ballIds)
                  .select(['slot_id', 'ball_id', 'team_label'])
                  .execute()
            : [];

    const balls: BallInfo[] = ballRows.map((br) => {
        const producers = producersByBall.get(br.id) ?? [];
        const teamLabelBySlot = new Map<string, string>();
        const playingHandicapBySlot = new Map<string, number | null>();
        const mySlotIds: string[] = [];
        for (const sb of slotBallRows) {
            if (sb.ball_id !== br.id) continue;
            playingHandicapBySlot.set(sb.slot_id, sb.playing_handicap_snapshot);
            mySlotIds.push(sb.slot_id);
        }
        for (const st of slotBallTeamRows) {
            if (st.ball_id !== br.id) continue;
            teamLabelBySlot.set(st.slot_id, st.team_label);
        }
        return {
            id: br.id,
            label: br.label,
            strategyId: br.strategy_id,
            courseHandicapSnapshot: br.course_handicap_snapshot,
            producers,
            teamLabelBySlot,
            playingHandicapBySlot,
            slotIds: mySlotIds,
        };
    });

    // --- lookup caches -------------------------------------------------------

    const playerIds = new Set<string>();
    const guestIds = new Set<string>();
    const teeIds = new Set<string>();
    for (const b of balls) {
        for (const p of b.producers) {
            if (p.playerId) playerIds.add(p.playerId);
            if (p.guestPlayerId) guestIds.add(p.guestPlayerId);
            if (p.teeId) teeIds.add(p.teeId);
        }
    }
    for (const e of events) if (e.recordedByPlayerId) playerIds.add(e.recordedByPlayerId);

    const playersById = new Map<string, Player>();
    for (const id of playerIds) {
        const p = await svc.playerService.getById(id);
        if (p) playersById.set(id, p);
    }
    const guestsById = new Map<string, GuestPlayer>();
    for (const id of guestIds) {
        const g = await svc.guestPlayerService.findById(id);
        if (g) guestsById.set(id, g);
    }
    const teesById = new Map<string, Tee>();
    for (const id of teeIds) {
        const t = await svc.teeService.getById(id);
        if (t) teesById.set(id, t);
    }

    // --- snapshots -----------------------------------------------------------

    const courseHolesSnapshotRows = await svc.db
        .selectFrom('round_course_holes')
        .select(['hole_number', 'par', 'base_stroke_index'])
        .where('round_id', '=', roundId)
        .orderBy('hole_number')
        .execute();
    const courseHolesSnapshot: RoundCourseHoleSnapshot[] = courseHolesSnapshotRows.map((r) => ({
        holeNumber: r.hole_number,
        par: r.par,
        baseStrokeIndex: r.base_stroke_index,
    }));

    const teeHolesSnapshotRows = await svc.db
        .selectFrom('round_tee_holes')
        .select([
            'tee_id',
            'tee_name_snapshot',
            'hole_number',
            'length_m',
            'stroke_index_override',
        ])
        .where('round_id', '=', roundId)
        .orderBy('tee_name_snapshot')
        .orderBy('hole_number')
        .execute();
    const teeHolesSnapshot: RoundTeeHoleSnapshot[] = teeHolesSnapshotRows.map((r) => ({
        teeId: r.tee_id,
        teeNameSnapshot: r.tee_name_snapshot,
        holeNumber: r.hole_number,
        lengthM: r.length_m,
        strokeIndexOverride: r.stroke_index_override,
    }));

    return {
        round,
        course,
        balls,
        events,
        roundResult,
        playersById,
        guestsById,
        teesById,
        courseHolesSnapshot,
        teeHolesSnapshot,
        dbPath,
    };
}
