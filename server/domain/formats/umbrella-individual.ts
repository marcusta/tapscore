// Umbrella × individual (3-player) — each player scores their own points
// per hole from 4 accomplishment categories:
//   (1) LG   — low individual gross in the 3-ball (ties all get 1)
//   (2) FWY  — hit the fairway (`metadata.fairway === true`) on par 4/5
//   (3) GIR  — reached the green in regulation (`metadata.gir === true`)
//   (4) BIRD — made a gross or net birdie per `config.birdieRule`
//
// Hole points = category sum × hole number. If one player sweeps all 4
// categories on a hole, the hole doubles ("umbrella").
//
// Input shape: exactly 3 individual participants in the slot. Events are
// participant-level (no `sourcePlayerId` needed). Supplemental hole data
// rides on `score_events.metadata` as:
//   - `metadata.gir: boolean`
//   - `metadata.fairway: boolean`

import type {
    CourseHole,
    FormatStrategy,
    HoleResult,
    BallInput,
    BallResult,
    SlotInput,
    SlotResult,
} from '../format';
import type { FormatSlot } from '../../services/round.service';
import { strokesGivenMap } from './_stableford-scoring';

type UmbrellaBirdieRule = 'gross' | 'net';

interface PlayerHoleScore {
    gross: number | null;
    net: number | null;
    contributed: boolean;
    hasEvent: boolean;
    gir: boolean;
    fairway: boolean;
}

interface ParticipantCtx {
    participant: BallInput;
    strokesByHole: Map<number, number>;
}

interface HoleCats {
    lg: number;
    fairway: number;
    gir: number;
    bird: number;
}

function readBirdieRule(slot: FormatSlot): UmbrellaBirdieRule {
    const raw = slot.scopeConfig?.config?.birdieRule;
    if (raw === 'gross' || raw === 'net') return raw;
    if (raw === undefined) return 'gross';
    throw new Error(
        `umbrella slot #${slot.slotIndex}: unknown birdieRule ${JSON.stringify(raw)} — expected 'gross' or 'net'`,
    );
}

function resolveParticipants(input: SlotInput, slot: FormatSlot): BallInput[] {
    if (input.balls.length !== 3) {
        throw new Error(
            `umbrella individual slot #${slot.slotIndex}: needs exactly 3 participants (got ${input.balls.length})`,
        );
    }
    return input.balls;
}

function playerHoleScore(ctx: ParticipantCtx, ch: CourseHole): PlayerHoleScore {
    const row = ctx.participant.holes.find((h) => h.holeNumber === ch.holeNumber);
    const gir = row?.metadata?.gir === true;
    const fairway = ch.par > 3 && row?.metadata?.fairway === true;
    if (row === undefined) {
        return {
            gross: null,
            net: null,
            contributed: false,
            hasEvent: false,
            gir,
            fairway,
        };
    }

    const strokes = row.strokes;
    const hasEvent = true;
    if (strokes === null || strokes === 0) {
        return {
            gross: null,
            net: null,
            contributed: false,
            hasEvent,
            gir,
            fairway,
        };
    }

    const given = ctx.strokesByHole.get(ch.holeNumber) ?? 0;
    return {
        gross: strokes,
        net: strokes - given,
        contributed: true,
        hasEvent,
        gir,
        fairway,
    };
}

function zeroCats(): HoleCats {
    return { lg: 0, fairway: 0, gir: 0, bird: 0 };
}

function sumCats(cats: HoleCats): number {
    return cats.lg + cats.fairway + cats.gir + cats.bird;
}

function formatBreakdown(
    points: number,
    holeNumber: number,
    sweep: boolean,
    cats: HoleCats,
    fieldGrosses: Array<number | null>,
    own: PlayerHoleScore,
): string {
    const parts: string[] = [];
    if (cats.lg > 0) parts.push('LG');
    if (cats.fairway > 0) parts.push('FWY');
    if (cats.gir > 0) parts.push('GIR');
    if (cats.bird > 0) parts.push('BIRD');

    const catTotal = sumCats(cats);
    const catStr = parts.length === 0 ? '0' : parts.join(' + ');
    const grosses = fieldGrosses.map((g) => g ?? '—').join('/');
    const ownBits = `gross ${own.gross ?? '—'}, fairway ${own.fairway ? '✓' : '✗'}, GIR ${own.gir ? '✓' : '✗'}`;
    if (sweep) {
        return `${catStr} = ${catTotal} × ${holeNumber} × 2 = ${points} ☂ (field ${grosses}; ${ownBits})`;
    }
    return `${catStr} = ${catTotal} × ${holeNumber} = ${points} (field ${grosses}; ${ownBits})`;
}

export const umbrellaIndividual: FormatStrategy = {
    scoringMode: 'umbrella',
    teamShape: 'individual',
    compute(input: SlotInput, slot: FormatSlot): SlotResult {
        const participants = resolveParticipants(input, slot);
        const birdieRule = readBirdieRule(slot);
        const ordered = [...input.courseHoles].sort((a, b) => a.holeNumber - b.holeNumber);
        const participantCtxs: ParticipantCtx[] = participants.map((participant) => ({
            participant,
            strokesByHole: strokesGivenMap(participant.playingHandicap ?? 0, input.courseHoles),
        }));

        const holesByParticipant = new Map<string, HoleResult[]>();
        const totalsByParticipant = new Map<string, number>();
        const holesPlayedByParticipant = new Map<string, number>();

        for (const p of participants) {
            holesByParticipant.set(p.ballId, []);
            totalsByParticipant.set(p.ballId, 0);
            holesPlayedByParticipant.set(p.ballId, 0);
        }

        for (const ch of ordered) {
            const scores = participantCtxs.map((ctx) => ({
                participant: ctx.participant,
                score: playerHoleScore(ctx, ch),
            }));

            const contributed = scores.filter((s) => s.score.contributed && s.score.gross !== null);
            const lowGross =
                contributed.length > 0
                    ? Math.min(...contributed.map((s) => s.score.gross as number))
                    : null;

            for (const { participant, score } of scores) {
                if (score.hasEvent) {
                    holesPlayedByParticipant.set(
                        participant.ballId,
                        (holesPlayedByParticipant.get(participant.ballId) ?? 0) + 1,
                    );
                }

                const cats = zeroCats();
                if (lowGross !== null && score.contributed && score.gross === lowGross) cats.lg = 1;
                cats.fairway = score.fairway ? 1 : 0;
                cats.gir = score.gir ? 1 : 0;
                const birdie =
                    score.contributed &&
                    (birdieRule === 'gross'
                        ? score.gross !== null && score.gross <= ch.par - 1
                        : score.net !== null && score.net <= ch.par - 1);
                cats.bird = birdie ? 1 : 0;

                const catSum = sumCats(cats);
                const sweep = catSum === 4;
                const points = catSum * ch.holeNumber * (sweep ? 2 : 1);
                totalsByParticipant.set(
                    participant.ballId,
                    (totalsByParticipant.get(participant.ballId) ?? 0) + points,
                );

                holesByParticipant.get(participant.ballId)!.push({
                    holeNumber: ch.holeNumber,
                    gross: score.gross,
                    net: score.net,
                    points,
                    note: formatBreakdown(
                        points,
                        ch.holeNumber,
                        sweep,
                        cats,
                        scores.map((s) => s.score.gross),
                        score,
                    ),
                });
            }
        }

        const ballResults: BallResult[] = participants.map((p) => ({
            ballId: p.ballId,
            slotIndex: slot.slotIndex,
            holes: holesByParticipant.get(p.ballId)!,
            totals: [{ scoringType: 'points', value: totalsByParticipant.get(p.ballId) ?? 0 }],
            holesPlayed: holesPlayedByParticipant.get(p.ballId) ?? 0,
        }));

        return { ballResults };
    },
};
