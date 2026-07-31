// Statistics dogfood seed — 25 realistic full rounds for Marcus, a 1.0
// handicap player, over the two months ending 2026-07-31.
//
// The seed writes through the real friendly-round, score-event, and player
// stats services. That matters here: the statistics views are projections over
// per-hole events joined to scorecards, so summary rows would not exercise the
// same path as the app.
//
// The seed is self-contained and idempotent. It also applies the Linköping
// course seed because the dev boot fixture has a different Linköping course
// name. Re-running this seed replays stable client event ids and is therefore a
// no-op for already-created rounds.

import type { StatEventInput } from '../../server/services/player-stats.service';
import type { RoundSetupDraft } from '../../server/domain/round-setup/draft';
import type { Scenario, PlayerRef } from '../scenario';
import { apply as applyLinkopings } from './linkopings';

const CLUB_NAME = 'Linköpings Golfklubb';
const COURSE_NAME = 'Linköpings Golfklubb 1-18';
const ROUND_NAME_PREFIX = 'Marcus statistics test';
const TEE_NAME = 'Gul';

const PARS = [4, 4, 3, 5, 3, 5, 3, 4, 4, 5, 3, 4, 4, 5, 4, 3, 4, 4] as const;

/** Gross score relative to the course par for each of the 25 rounds. */
const ROUND_PLANS = [
    { date: '2026-06-04', over: -1 },
    { date: '2026-06-06', over: 0 },
    { date: '2026-06-09', over: 1 },
    { date: '2026-06-12', over: 2 },
    { date: '2026-06-15', over: 3 },
    { date: '2026-06-18', over: 1 },
    { date: '2026-06-21', over: 0 },
    { date: '2026-06-24', over: 2 },
    { date: '2026-06-27', over: -2 },
    { date: '2026-06-30', over: 1 },
    { date: '2026-07-03', over: 2 },
    { date: '2026-07-06', over: 0 },
    { date: '2026-07-09', over: 3 },
    { date: '2026-07-12', over: -1 },
    { date: '2026-07-15', over: 1 },
    { date: '2026-07-18', over: 2 },
    { date: '2026-07-20', over: 0 },
    { date: '2026-07-22', over: 1 },
    { date: '2026-07-24', over: 3 },
    { date: '2026-07-25', over: -2 },
    { date: '2026-07-26', over: 2 },
    { date: '2026-07-27', over: 1 },
    { date: '2026-07-28', over: 0 },
    { date: '2026-07-29', over: 2 },
    { date: '2026-07-30', over: 1 },
] as const;

const BIRDIE_ORDER = [1, 6, 9, 10, 14, 17, 18, 4, 13, 2, 8, 12, 15, 5, 11, 16, 7, 3];
const BOGEY_ORDER = [4, 8, 12, 17, 2, 5, 15, 18, 7, 11, 3, 13, 16, 1, 6, 10, 9, 14];

type TeeResult = 'fairway' | 'in_play' | 'trouble';
type FirstPutt = 'inside_1m' | '1_to_2m' | '2_to_4m' | '4_to_8m' | 'over_8m';

interface HoleData {
    hole: number;
    playHoleId?: string;
    par: number;
    strokes: number;
    teeResult: TeeResult | null;
    gir: boolean;
    firstPutt: FirstPutt | null;
    putts: string | null;
    shortGameDifficulty: 'standard' | 'hard' | null;
    penalties: string;
    recoveryOk: string | null;
}

function scoreOffsets(roundIndex: number, desiredOver: number): number[] {
    const offsets = new Array<number>(PARS.length).fill(0);
    let birdies = 1 + (roundIndex % 3);
    let bogeys = birdies + desiredOver;
    if (bogeys < 0) {
        birdies += -bogeys;
        bogeys = 0;
    }

    const birdieHoles = BIRDIE_ORDER.slice(roundIndex % 4, roundIndex % 4 + birdies);
    const birdieSet = new Set(birdieHoles);
    for (const hole of birdieHoles) offsets[hole - 1] = -1;

    // Two rounds include a realistic double bogey. It uses two bogey strokes,
    // keeping the planned round total unchanged while exercising that metric.
    const hasDouble = roundIndex === 4 || roundIndex === 18;
    let remainingBogeyUnits = bogeys;
    if (hasDouble && remainingBogeyUnits >= 2) {
        const doubleHole = BOGEY_ORDER.find((hole) => !birdieSet.has(hole));
        if (doubleHole !== undefined) {
            offsets[doubleHole - 1] = 2;
            remainingBogeyUnits -= 2;
        }
    }

    for (const hole of BOGEY_ORDER) {
        if (remainingBogeyUnits === 0) break;
        if (birdieSet.has(hole) || offsets[hole - 1] !== 0) continue;
        offsets[hole - 1] = 1;
        remainingBogeyUnits -= 1;
    }
    if (remainingBogeyUnits !== 0) {
        throw new Error(`player-stats-marcus: could not distribute ${desiredOver} over on round ${roundIndex + 1}`);
    }
    return offsets;
}

function holeData(roundIndex: number, desiredOver: number): HoleData[] {
    const offsets = scoreOffsets(roundIndex, desiredOver);
    return PARS.map((par, index) => {
        const hole = index + 1;
        const strokes = par + offsets[index]!;
        const serial = roundIndex * PARS.length + index;
        const teeRoll = (roundIndex * 29 + hole * 17 + 11) % 100;
        const teeResult: TeeResult | null =
            par < 4 ? null : teeRoll < 58 ? 'fairway' : teeRoll < 87 ? 'in_play' : 'trouble';

        const girRoll = (roundIndex * 37 + hole * 13 + 7) % 100;
        let gir =
            par === 3
                ? girRoll < 78
                : teeResult === 'fairway'
                  ? girRoll < 74
                  : teeResult === 'in_play'
                    ? girRoll < 55
                    : girRoll < 28;
        // Birdies are GIRs in this fixture. A double bogey is not, while a
        // bogey can still be a GIR followed by a three-putt.
        if (strokes < par) gir = true;
        if (strokes >= par + 2) gir = false;

        const shortGameDifficulty = gir
            ? null
            : ((roundIndex * 19 + hole * 23 + 3) % 100 < 22 ? 'hard' : 'standard');
        const holeOut = !gir && (roundIndex * 41 + hole * 31 + 5) % 83 === 0;
        let firstPutt: FirstPutt | null = null;
        let putts: string | null = null;
        if (holeOut) {
            putts = '0';
        } else {
            const puttRoll = (roundIndex * 43 + hole * 29 + 9) % 100;
            if (gir) {
                firstPutt =
                    puttRoll < 8
                        ? 'inside_1m'
                        : puttRoll < 22
                          ? '1_to_2m'
                          : puttRoll < 55
                            ? '2_to_4m'
                            : puttRoll < 85
                              ? '4_to_8m'
                              : 'over_8m';
            } else {
                firstPutt =
                    puttRoll < 38
                        ? 'inside_1m'
                        : puttRoll < 70
                          ? '1_to_2m'
                          : puttRoll < 92
                            ? '2_to_4m'
                            : '4_to_8m';
            }

            const onePuttRoll = (roundIndex * 31 + hole * 11 + 17) % 100;
            putts =
                firstPutt === 'inside_1m'
                    ? onePuttRoll < 64
                        ? '1'
                        : '2'
                    : firstPutt === '1_to_2m'
                      ? onePuttRoll < 38
                          ? '1'
                          : '2'
                      : onePuttRoll < 16
                        ? '1'
                        : onePuttRoll < 78
                          ? '2'
                          : '3';
        }

        const penaltyRoll = (roundIndex * 47 + hole * 7 + 13) % 100;
        const penalties =
            teeResult === 'trouble' && penaltyRoll < 28
                ? (roundIndex % 11 === 0 ? '2' : '1')
                : penaltyRoll === 0
                  ? '1'
                  : '0';
        const recoveryOk =
            teeResult === 'trouble'
                ? ((roundIndex * 53 + hole * 5 + 2) % 100 < 65 ? '1' : '0')
                : null;

        return {
            hole,
            par,
            strokes,
            teeResult,
            gir,
            firstPutt,
            putts,
            shortGameDifficulty,
            penalties,
            recoveryOk,
        };
    });
}

function statItems(
    roundIndex: number,
    playerId: string,
    roundId: string,
    holes: HoleData[],
): StatEventInput[] {
    const items: StatEventInput[] = [];
    const add = (hole: HoleData, key: StatEventInput['key'], value: string): void => {
        items.push({
            playHoleId: hole.playHoleId!,
            playerId,
            key,
            value,
            clientEventId: `marcus-stats-${roundIndex + 1}-${hole.hole}-${key}`,
        });
    };

    for (const hole of holes) {
        const serial = roundIndex * PARS.length + hole.hole - 1;
        // A few skipped answers make the denominators look like real captured
        // golf rather than a synthetic 100% complete spreadsheet.
        if (hole.teeResult !== null && serial % 47 !== 0) add(hole, 'tee_result', hole.teeResult);
        if (serial % 53 !== 0) add(hole, 'gir', hole.gir ? '1' : '0');
        if (serial % 61 !== 0 && hole.putts !== null) {
            if (hole.firstPutt !== null) add(hole, 'first_putt', hole.firstPutt);
            add(hole, 'putts', hole.putts);
        }
        if (hole.shortGameDifficulty !== null) {
            add(hole, 'short_game_difficulty', hole.shortGameDifficulty);
        }
        if (serial % 73 !== 0) add(hole, 'penalties', hole.penalties);
        if (hole.recoveryOk !== null && serial % 79 !== 0) {
            add(hole, 'recovery_ok', hole.recoveryOk);
        }
    }

    // Keep this reference in the helper signature so a malformed future edit
    // cannot accidentally build events for a different round.
    if (roundId.length === 0) throw new Error('player-stats-marcus: missing round id');
    return items;
}

async function applyRound(
    s: Scenario,
    marcus: PlayerRef,
    courseId: string,
    teeId: string,
    roundIndex: number,
    plan: (typeof ROUND_PLANS)[number],
): Promise<{ created: boolean; score: number; statItems: number }> {
    const roundName = `${ROUND_NAME_PREFIX} ${String(roundIndex + 1).padStart(2, '0')}`;
    let round = await s.services.db
        .selectFrom('rounds')
        .select('id')
        .where('name', '=', roundName)
        .executeTakeFirst()
        .then((row) => (row ? s.services.roundService.getById(row.id) : null));
    let token: string;
    let created = false;

    if (!round) {
        const draft: RoundSetupDraft = {
            courseId,
            playedAt: plan.date,
            name: roundName,
            roundType: 'full_18',
            venueType: 'outdoor',
            producers: [
                {
                    producerDefId: 'p1',
                    playerRef: { kind: 'player', id: marcus.id },
                    handicapIndex: 1.0,
                    gender: 'M',
                    teeId,
                },
            ],
            formats: [{ formatId: 'stroke_play_individual' }],
        };
        const result = await s.services.friendlyRoundService.create(draft, marcus.id);
        if (!result.ok) {
            throw new Error(`player-stats-marcus: round ${roundIndex + 1} refused: ${JSON.stringify(result.diagnostics)}`);
        }
        round = result.round;
        token = result.friendlyRound.shareToken;
        created = true;
    } else {
        const friendly = await s.services.db
            .selectFrom('friendly_rounds')
            .select('share_token')
            .where('round_id', '=', round.id)
            .executeTakeFirst();
        if (!friendly) throw new Error(`player-stats-marcus: ${roundName} exists without a friendly-round token`);
        token = friendly.share_token;
    }

    const holes = holeData(roundIndex, plan.over).map((hole, index) => ({
        ...hole,
        playHoleId: [...round!.playHoles].sort((a, b) => a.ordinal - b.ordinal)[index]!.id,
    }));
    const ball = await s.services.db
        .selectFrom('ball_players as bp')
        .innerJoin('balls as b', 'b.id', 'bp.ball_id')
        .select('bp.ball_id')
        .where('b.round_id', '=', round.id)
        .where('bp.player_id', '=', marcus.id)
        .executeTakeFirst();
    if (!ball) throw new Error(`player-stats-marcus: no Marcus ball on ${roundName}`);

    for (const hole of holes) {
        await s.services.scoreEventService.append({
            roundId: round.id,
            ballId: ball.ball_id,
            playHoleId: hole.playHoleId,
            strokes: hole.strokes,
            eventType: 'score_entered',
            recordedByPlayerId: marcus.id,
            clientEventId: `marcus-score-${roundIndex + 1}-${hole.hole}`,
            recordedAt: new Date(Date.parse(`${plan.date}T10:00:00Z`) + hole.hole * 60_000).toISOString(),
        });
    }

    const events = statItems(roundIndex, marcus.id, round.id, holes);
    await s.services.playerStatsService.appendEvents({
        roundId: round.id,
        items: events,
        recordedByPlayerId: marcus.id,
    });
    await s.services.friendlyRoundService.finishByToken(token, `${plan.date}T18:00:00.000Z`);

    return {
        created,
        score: holes.reduce((total, hole) => total + hole.strokes, 0),
        statItems: events.length,
    };
}

export async function apply(s: Scenario): Promise<void> {
    await applyLinkopings(s);
    const course = await s.findCourse(CLUB_NAME, COURSE_NAME);
    const tee = (await s.services.teeService.listByCourse(course.id)).find((item) => item.name === TEE_NAME);
    if (!tee) throw new Error(`player-stats-marcus: expected ${TEE_NAME} tee on ${COURSE_NAME}`);

    const marcus = await s.player('marcus', { displayName: 'Marcus', handicap: 1.0 });
    const marcusProfile = await s.services.playerService.getById(marcus.id);
    if (marcusProfile?.handicapIndex !== 1.0) {
        await s.services.playerService.updateHandicapIndex(marcus.id, 1.0);
    }
    await s.services.playerService.updateProfile(marcus.id, { gender: 'M' });
    await s.services.playerStatsService.putConfig(marcus.id, {
        enabled: true,
        tee: true,
        approach: true,
        putting: true,
        shortGame: true,
        penalties: true,
        recovery: true,
    });

    let created = 0;
    let totalScore = 0;
    let totalStatItems = 0;
    for (let i = 0; i < ROUND_PLANS.length; i++) {
        const result = await applyRound(s, marcus, course.id, tee.id, i, ROUND_PLANS[i]!);
        if (result.created) created += 1;
        totalScore += result.score;
        totalStatItems += result.statItems;
    }

    // eslint-disable-next-line no-console
    console.log(
        `seed: player-stats-marcus applied (${ROUND_PLANS.length} rounds, ${created} new, ` +
            `gross ${totalScore}, ${totalStatItems} stat events, marcus/password123)`,
    );
}
