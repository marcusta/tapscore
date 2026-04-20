// Köpenhamnare × individual — Swedish 3-player stroke-play points game.
//
// Exactly 3 participants share 6 points per hole based on net-score ranking:
//   - All three distinct              → 4 / 2 / 0
//   - Sole best, other two tied       → 4 / 1 / 1
//   - Two tied for best, one worst    → 3 / 3 / 0
//   - All three equal                 → 2 / 2 / 2
// Totals per hole always sum to 6. Running cumulative across the round.
// Higher is better (ranked under `scoringType: 'points'`).
//
// Handicap modes (picked per slot via `scopeConfig.config.handicapMode`):
//   - `standard`         each player gets their own `playingHandicap`,
//                        strokes distributed by SI (same as stroke-play).
//   - `delta_from_min`   the lowest-PH player plays at 0; the other two
//                        each get `(their_ph − min_ph)` strokes, distributed
//                        by SI. Matches the tradition of letting the best
//                        player "play off scratch" against the field.
//
// The strategy validates participant count at compute-time — exactly 3, or
// it throws with the slot index named. No 2-way Köpenhamnare; no 4-way
// Köpenhamnare. If any participant has `playingHandicap = null` under
// `delta_from_min`, the strategy throws (can't compute a delta against
// null). Under `standard`, a null PH is treated as 0 (same policy as
// stroke-play individual).
//
// Per-hole null handling: if any of the three players has no net score for
// a hole (no event, or DNP event), the hole is undecided — points are null
// for all three on that hole and no one's running total advances. This is
// intentional: Köpenhamnare only distributes 6 points when all three are
// scored, otherwise the ranking is ill-defined.
//
// Per-hole `note` surfaces a short topology tag (e.g. "4 of 6 (sole best)")
// alongside the points value — the scorecard render uses it as the Points
// cell tooltip, same pattern stableford uses.
//
// Totals on `ParticipantResult` emit one `points` entry; strategies with
// `points` already sort high-to-low in `leaderboard.ts`. We deliberately
// reuse the existing `points` scoring type rather than inventing
// `kopenhamnare_points` — per-slot label collisions between stableford and
// Köpenhamnare in a multi-slot round are 2.5i's problem (routing).

import type {
    CourseHole,
    FormatStrategy,
    HoleResult,
    ParticipantInput,
    ParticipantResult,
    SlotInput,
    SlotResult,
} from '../format';
import type { FormatSlot } from '../../services/round.service';

export type KopenhamnareHandicapMode = 'standard' | 'delta_from_min';

function readHandicapMode(slot: FormatSlot): KopenhamnareHandicapMode {
    const raw = slot.scopeConfig?.config?.handicapMode;
    if (raw === 'standard' || raw === 'delta_from_min') return raw;
    if (raw === undefined) return 'standard';
    throw new Error(
        `kopenhamnare slot #${slot.slotIndex}: unknown handicapMode ${JSON.stringify(raw)} — expected 'standard' or 'delta_from_min'`,
    );
}

function effectivePH(
    participants: ParticipantInput[],
    mode: KopenhamnareHandicapMode,
    slotIndex: number,
): Map<string, number> {
    const out = new Map<string, number>();
    if (mode === 'standard') {
        for (const p of participants) {
            out.set(p.participantId, p.playingHandicap ?? 0);
        }
        return out;
    }
    // delta_from_min
    const hasNull = participants.some((p) => p.playingHandicap === null);
    if (hasNull) {
        throw new Error(
            `kopenhamnare slot #${slotIndex}: handicapMode 'delta_from_min' requires a playingHandicap on every participant (at least one is null)`,
        );
    }
    const phs = participants.map((p) => p.playingHandicap as number);
    const min = Math.min(...phs);
    for (const p of participants) {
        out.set(p.participantId, (p.playingHandicap as number) - min);
    }
    return out;
}

function strokesByHoleFor(
    ph: number,
    courseHoles: CourseHole[],
): Map<number, number> {
    const holeCount = courseHoles.length;
    const baseline = holeCount > 0 ? Math.floor(ph / holeCount) : 0;
    const extras = holeCount > 0 ? ((ph % holeCount) + holeCount) % holeCount : 0;
    const m = new Map<number, number>();
    for (const ch of courseHoles) {
        const extra = ch.strokeIndex <= extras ? 1 : 0;
        m.set(ch.holeNumber, baseline + extra);
    }
    return m;
}

interface HoleState {
    gross: number | null;
    net: number | null;
    strokesGiven: number;
}

function resolveHole(
    p: ParticipantInput,
    ch: CourseHole,
    strokesGiven: number,
): HoleState {
    const played = p.holes.find((h) => h.holeNumber === ch.holeNumber);
    if (played === undefined) return { gross: null, net: null, strokesGiven };
    const strokes = played.strokes;
    if (strokes === null) return { gross: null, net: null, strokesGiven };
    if (strokes === 0) {
        // Pickup — in Köpenhamnare we treat as "hole not scored for ranking
        // purposes"; the three-way comparison needs a real net, and a pickup
        // has no meaningful ranking against others' scored holes.
        return { gross: null, net: null, strokesGiven };
    }
    return { gross: strokes, net: strokes - strokesGiven, strokesGiven };
}

interface HolePoints {
    points: number;
    topology: string; // e.g. "4 of 6 (sole best)"
}

/**
 * Distribute 6 points across three net scores.
 * Returns results in the same order as the input nets.
 */
function distribute6(nets: [number, number, number]): [HolePoints, HolePoints, HolePoints] {
    const [a, b, c] = nets;
    const uniq = new Set(nets);
    if (uniq.size === 3) {
        // all distinct → 4 / 2 / 0
        const sorted = [...nets].sort((x, y) => x - y);
        const best = sorted[0];
        const mid = sorted[1];
        return nets.map((n): HolePoints => {
            if (n === best) return { points: 4, topology: '4 of 6 (sole best)' };
            if (n === mid) return { points: 2, topology: '2 of 6 (middle)' };
            return { points: 0, topology: '0 of 6 (sole worst)' };
        }) as [HolePoints, HolePoints, HolePoints];
    }
    if (uniq.size === 1) {
        // all equal → 2 / 2 / 2
        return [
            { points: 2, topology: '2 of 6 (all equal)' },
            { points: 2, topology: '2 of 6 (all equal)' },
            { points: 2, topology: '2 of 6 (all equal)' },
        ];
    }
    // uniq.size === 2 → either sole best + tied rest, or tied best + sole worst
    const min = Math.min(a, b, c);
    const countAtMin = nets.filter((n) => n === min).length;
    if (countAtMin === 1) {
        // sole best (1), tied rest (2) → 4 / 1 / 1
        return nets.map((n): HolePoints => {
            if (n === min) return { points: 4, topology: '4 of 6 (sole best)' };
            return { points: 1, topology: '1 of 6 (tied rest)' };
        }) as [HolePoints, HolePoints, HolePoints];
    }
    // countAtMin === 2 → tied best (2), sole worst (1) → 3 / 3 / 0
    return nets.map((n): HolePoints => {
        if (n === min) return { points: 3, topology: '3 of 6 (tied best)' };
        return { points: 0, topology: '0 of 6 (sole worst)' };
    }) as [HolePoints, HolePoints, HolePoints];
}

export const kopenhamnareIndividual: FormatStrategy = {
    scoringMode: 'kopenhamnare',
    teamShape: 'individual',
    compute(input: SlotInput, slot: FormatSlot): SlotResult {
        if (input.participants.length !== 3) {
            throw new Error(
                `kopenhamnare slot #${slot.slotIndex}: exactly 3 participants required (got ${input.participants.length})`,
            );
        }

        const mode = readHandicapMode(slot);
        const phByParticipant = effectivePH(input.participants, mode, slot.slotIndex);

        const strokesMaps = new Map<string, Map<number, number>>();
        for (const p of input.participants) {
            const ph = phByParticipant.get(p.participantId) ?? 0;
            strokesMaps.set(p.participantId, strokesByHoleFor(ph, input.courseHoles));
        }

        // Per-participant accumulators.
        const holesByPid = new Map<string, HoleResult[]>();
        const totalsByPid = new Map<string, number>();
        const pointsHasValueByPid = new Map<string, boolean>();
        const holesPlayedByPid = new Map<string, number>();
        for (const p of input.participants) {
            holesByPid.set(p.participantId, []);
            totalsByPid.set(p.participantId, 0);
            pointsHasValueByPid.set(p.participantId, false);
            holesPlayedByPid.set(p.participantId, 0);
        }

        const ordered = [...input.courseHoles].sort((x, y) => x.holeNumber - y.holeNumber);
        const [pA, pB, pC] = input.participants;

        for (const ch of ordered) {
            const stateA = resolveHole(
                pA,
                ch,
                strokesMaps.get(pA.participantId)!.get(ch.holeNumber) ?? 0,
            );
            const stateB = resolveHole(
                pB,
                ch,
                strokesMaps.get(pB.participantId)!.get(ch.holeNumber) ?? 0,
            );
            const stateC = resolveHole(
                pC,
                ch,
                strokesMaps.get(pC.participantId)!.get(ch.holeNumber) ?? 0,
            );

            // Count engagement per participant (has an event on this hole).
            for (const [p, state] of [
                [pA, stateA],
                [pB, stateB],
                [pC, stateC],
            ] as const) {
                const played = p.holes.find((h) => h.holeNumber === ch.holeNumber);
                if (played !== undefined) {
                    holesPlayedByPid.set(
                        p.participantId,
                        (holesPlayedByPid.get(p.participantId) ?? 0) + 1,
                    );
                }
                void state;
            }

            const allScored =
                stateA.net !== null && stateB.net !== null && stateC.net !== null;

            if (!allScored) {
                // Hole not decided — null points for all three; running totals
                // unchanged.
                for (const [p, state] of [
                    [pA, stateA],
                    [pB, stateB],
                    [pC, stateC],
                ] as const) {
                    holesByPid.get(p.participantId)!.push({
                        holeNumber: ch.holeNumber,
                        gross: state.gross,
                        net: state.net,
                        points: null,
                    });
                }
                continue;
            }

            const dist = distribute6([
                stateA.net as number,
                stateB.net as number,
                stateC.net as number,
            ]);
            const pairs = [
                [pA, stateA, dist[0]],
                [pB, stateB, dist[1]],
                [pC, stateC, dist[2]],
            ] as const;
            for (const [p, state, hp] of pairs) {
                totalsByPid.set(
                    p.participantId,
                    (totalsByPid.get(p.participantId) ?? 0) + hp.points,
                );
                pointsHasValueByPid.set(p.participantId, true);
                holesByPid.get(p.participantId)!.push({
                    holeNumber: ch.holeNumber,
                    gross: state.gross,
                    net: state.net,
                    points: hp.points,
                    note: hp.topology,
                });
            }
        }

        const participantResults: ParticipantResult[] = input.participants.map((p) => ({
            participantId: p.participantId,
            slotIndex: slot.slotIndex,
            holes: holesByPid.get(p.participantId)!,
            totals: [
                {
                    scoringType: 'points',
                    value: pointsHasValueByPid.get(p.participantId)
                        ? (totalsByPid.get(p.participantId) ?? 0)
                        : null,
                },
            ],
            holesPlayed: holesPlayedByPid.get(p.participantId) ?? 0,
        }));

        return { participantResults };
    },
};
