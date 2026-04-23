// Collect data from services into the participant-keyed shapes the
// rendering code consumes. The ball-keyed domain reads get bridged to
// participants here via `ball_players → participant_players`.

import type { Course } from '../../server/services/course.service';
import type { Club } from '../../server/services/club.service';
import type { Player } from '../../server/services/player.service';
import type { GuestPlayer } from '../../server/services/guest-player.service';
import type { Tee } from '../../server/services/tee.service';
import type {
    IndexRow,
    Leaderboard,
    RenderedEvent,
    RoundCourseHoleSnapshot,
    RoundRenderContext,
    RoundTeeHoleSnapshot,
    Scorecard,
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
        const participants = await svc.participantService.listByRound(r.id);
        const events = await svc.scoreEventService.listByRound(r.id);
        rows.push({ round: r, course, club, participantCount: participants.length, eventCount: events.length });
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
    const participants = await svc.participantService.listByRound(roundId);
    const events = await svc.scoreEventService.listByRound(roundId);
    const ballLeaderboard = await svc.leaderboardService.forRound(roundId);
    const ballScorecards = await svc.scorecardService.forRound(roundId);

    // Bridge: ball_id → participant_id via ball_players → participant_players.
    // Topology guarantees one participant per ball (compiler + seed helper
    // both uphold this), so a single scalar projection is enough.
    const bridgeRows = await svc.db
        .selectFrom('ball_players as bp')
        .innerJoin('participant_players as pp', 'pp.id', 'bp.producer_def_id')
        .innerJoin('balls as b', 'b.id', 'bp.ball_id')
        .where('b.round_id', '=', roundId)
        .select(['bp.ball_id', 'pp.participant_id'])
        .distinct()
        .execute();
    const participantIdByBallId = new Map<string, string>();
    for (const r of bridgeRows) participantIdByBallId.set(r.ball_id, r.participant_id);

    const toParticipantId = (ballId: string): string => {
        const pid = participantIdByBallId.get(ballId);
        if (!pid) throw new Error(`render-lib: no participant bridge for ball ${ballId}`);
        return pid;
    };

    const leaderboard: Leaderboard = {
        byScoringType: ballLeaderboard.byScoringType.map((b) => ({
            slotIndex: b.slotIndex,
            scoringType: b.scoringType,
            entries: b.entries.map((e) => ({
                participantId: toParticipantId(e.ballId),
                position: e.position,
                total: e.total,
                holesPlayed: e.holesPlayed,
            })),
        })),
        participantResults: ballLeaderboard.ballResults.map((r) => ({
            participantId: toParticipantId(r.ballId),
            slotIndex: r.slotIndex,
            holes: r.holes,
            totals: r.totals,
            holesPlayed: r.holesPlayed,
        })),
        pairResults: ballLeaderboard.pairResults.map((pr) => ({
            slotIndex: pr.slotIndex,
            participants: [
                toParticipantId(pr.balls[0]),
                toParticipantId(pr.balls[1]),
            ] as [string, string],
            holes: pr.holes,
            summary: pr.summary,
            result: pr.result,
            winner: pr.winner === null ? null : toParticipantId(pr.winner),
        })),
    };
    const scorecards: Scorecard[] = ballScorecards.map((sc) => ({
        participantId: toParticipantId(sc.ballId),
        holes: sc.holes,
    }));
    const renderedEvents: RenderedEvent[] = events.map((e) => {
        const { ballId, ...rest } = e;
        return { ...rest, participantId: toParticipantId(ballId) };
    });

    const playerIds = new Set<string>();
    const guestIds = new Set<string>();
    const teeIds = new Set<string>();
    for (const p of participants) {
        if (p.teeIdSnapshot) teeIds.add(p.teeIdSnapshot);
        for (const link of p.players) {
            if (link.playerId) playerIds.add(link.playerId);
            if (link.guestPlayerId) guestIds.add(link.guestPlayerId);
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

    return { round, course, participants, events: renderedEvents, leaderboard, scorecards, playersById, guestsById, teesById, courseHolesSnapshot, teeHolesSnapshot, dbPath };
}
