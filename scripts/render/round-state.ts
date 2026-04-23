// Shared state derived from a RoundRenderContext. Keyed by ball id —
// every lookup / classifier / running-total is per-ball. Slot detection
// happens per (ball, slotIndex) because a format's team-shape in one
// slot must not leak layout choices into another slot's balls.

import type { Round } from '../../server/services/round.service';
import type { Scorecard } from '../../server/services/scorecard.service';
import type {
    BallResult,
    CourseHole,
    PairResult,
} from '../../server/domain/format';
import { courseHolesForRound } from '../../server/domain/round-holes';
import { normalizeMatchPlayHandicaps } from '../../server/domain/formats/_match-play-handicap';
import type { BallInfo, RoundRenderContext } from './types';
import { numericCell, short } from './util';

type FormatSlot = Round['formatSlots'][number];

export interface RoundRenderState {
    // Hole data
    allCourseHoles: CourseHole[];
    playedCourseHoles: CourseHole[];

    // Look-ups
    scorecardByBall: Map<string, Scorecard>;
    /** BallResult keyed by ball id. Every ball with a result for this round. */
    resultByBall: Map<string, BallResult>;
    /** slotIndex → FormatSlot (handy alias; same as round.formatSlots[i]). */
    formatSlotByIndex: Map<number, FormatSlot>;
    /** Pair result keyed by each participating ball id. */
    pairResultByBall: Map<string, PairResult>;

    // Slot classifiers (pure functions of slot)
    isBetterBallSlot: (s: FormatSlot | undefined) => boolean;
    isFoursomesSlot: (s: FormatSlot | undefined) => boolean;
    isTalibanSlot: (s: FormatSlot | undefined) => boolean;
    isUmbrellaFourBallSlot: (s: FormatSlot | undefined) => boolean;
    isUmbrellaIndividualSlot: (s: FormatSlot | undefined) => boolean;
    isKopenhamnareSlot: (s: FormatSlot | undefined) => boolean;
    umbrellaBirdieRuleFor: (s: FormatSlot | undefined) => string | null;
    kopenHandicapModeFor: (s: FormatSlot | undefined) => string | null;

    // Ball classifiers (use the ball's result.slotIndex)
    slotForBall: (b: BallInfo) => FormatSlot | undefined;
    isBallBetterBall: (b: BallInfo) => boolean;
    isBallFoursomes: (b: BallInfo) => boolean;
    isBallTaliban: (b: BallInfo) => boolean;
    isBallUmbrellaFourBall: (b: BallInfo) => boolean;
    isBallUmbrellaIndividual: (b: BallInfo) => boolean;
    isBallUmbrella: (b: BallInfo) => boolean;

    // Display helpers
    ballLabel: (b: BallInfo) => string;
    producerName: (producer: BallInfo['producers'][number]) => string;
    playerName: (id: string | null) => string;
    producerPhSummary: (b: BallInfo) => string;

    // Handicap normalisation — keyed by ball id.
    // For match-play-individual: one ball → one effective PH.
    // For match-play-better-ball: each producer within each ball gets a
    // normalised PH (keyed by `${ballId}:${producerDefId}`).
    effectivePHByBall: Map<string, number | null>;
    effectivePHByProducer: Map<string, number | null>;

    // Match-style running totals (kopenhamnare + umbrella)
    normalizedRunningByBall: Map<string, Map<number, number>>;

    /**
     * Looks up the `slot_balls.playing_handicap_snapshot` for a ball in a
     * given formatSlots slotIndex. Falls back to the first non-null PH
     * across the ball's slot map when the slotIndex → compiler slot id
     * mapping isn't unique.
     */
    ballPlayingHandicapInSlot(b: BallInfo, slotIndex: number): number | null;
}

function producerPH(
    b: BallInfo,
    producer: BallInfo['producers'][number],
): number | null {
    // Per-producer PH doesn't live on ball_players (that's course-handicap).
    // The ball carries per-slot playing_handicap_snapshot rows in
    // `playingHandicapBySlot`; for per-player PH normalisation a match-play
    // better-ball renderer needs the producer's *course* handicap mapped
    // through the slot allowance. For the purposes of strokes-given we use
    // the producer's courseHandicapSnapshot directly — better-ball match
    // play operates on per-producer PH via normalizeMatchPlayHandicaps, and
    // the raw CH is what the domain uses to seed that normalisation.
    return producer.courseHandicapSnapshot;
}

export function buildRoundRenderState(ctx: RoundRenderContext): RoundRenderState {
    const { round, course, balls, scorecards, playersById, guestsById, leaderboard, slotIndexByCompilerSlotId } = ctx;

    const ballPlayingHandicapInSlot = (b: BallInfo, slotIndex: number): number | null => {
        // Prefer the slot whose compiler slot id maps to this slotIndex.
        for (const sid of b.slotIds) {
            if (slotIndexByCompilerSlotId.get(sid) === slotIndex) {
                const v = b.playingHandicapBySlot.get(sid);
                if (v !== null && v !== undefined) return v;
            }
        }
        // Fallback: first non-null PH on any slot this ball is in.
        for (const sid of b.slotIds) {
            const v = b.playingHandicapBySlot.get(sid);
            if (v !== null && v !== undefined) return v;
        }
        return null;
    };

    const scorecardByBall = new Map(scorecards.map((sc) => [sc.ballId, sc]));
    const resultByBall = new Map(leaderboard.ballResults.map((r) => [r.ballId, r]));
    const formatSlotByIndex = new Map<number, FormatSlot>();
    for (const s of round.formatSlots) formatSlotByIndex.set(s.slotIndex, s);

    // Slot-level classifiers — same shape as before. Tied to format strategy
    // key, not to a ball id.
    const isBetterBallSlot = (s: FormatSlot | undefined): boolean =>
        s?.scoringMode === 'stableford' && s?.teamShape === 'better_ball';
    const isFoursomesSlot = (s: FormatSlot | undefined): boolean =>
        s?.scoringMode === 'stroke_play' && s?.teamShape === 'foursomes';
    const isTalibanSlot = (s: FormatSlot | undefined): boolean =>
        s?.scoringMode === 'taliban' && s?.teamShape === 'better_ball';
    const isUmbrellaFourBallSlot = (s: FormatSlot | undefined): boolean =>
        s?.scoringMode === 'umbrella' && s?.teamShape === 'four_ball';
    const isUmbrellaIndividualSlot = (s: FormatSlot | undefined): boolean =>
        s?.scoringMode === 'umbrella' && s?.teamShape === 'individual';
    const isKopenhamnareSlot = (s: FormatSlot | undefined): boolean =>
        s?.scoringMode === 'kopenhamnare' && s?.teamShape === 'individual';
    const umbrellaBirdieRuleFor = (s: FormatSlot | undefined): string | null =>
        s?.scoringMode === 'umbrella'
            ? ((s!.scopeConfig?.config?.birdieRule as string | undefined) ?? 'gross')
            : null;
    const kopenHandicapModeFor = (s: FormatSlot | undefined): string | null =>
        isKopenhamnareSlot(s)
            ? ((s!.scopeConfig?.config?.handicapMode as string | undefined) ??
              'standard')
            : null;

    // Each ball's slot comes from its BallResult.slotIndex. Multi-slot rounds
    // that stamp a ball into multiple slots will be surprising here — pick
    // the first result. The leaderboard returns one BallResult per ball per
    // slot the ball participates in; the common "one ball, one slot" pattern
    // collapses to a single entry.
    const slotForBall = (b: BallInfo): FormatSlot | undefined => {
        const result = resultByBall.get(b.id);
        if (!result) return undefined;
        return formatSlotByIndex.get(result.slotIndex);
    };
    const isBallBetterBall = (b: BallInfo): boolean => isBetterBallSlot(slotForBall(b));
    const isBallFoursomes = (b: BallInfo): boolean => isFoursomesSlot(slotForBall(b));
    const isBallTaliban = (b: BallInfo): boolean => isTalibanSlot(slotForBall(b));
    const isBallUmbrellaFourBall = (b: BallInfo): boolean =>
        isUmbrellaFourBallSlot(slotForBall(b));
    const isBallUmbrellaIndividual = (b: BallInfo): boolean =>
        isUmbrellaIndividualSlot(slotForBall(b));
    const isBallUmbrella = (b: BallInfo): boolean =>
        isBallUmbrellaFourBall(b) || isBallUmbrellaIndividual(b);

    const producerName = (producer: BallInfo['producers'][number]): string => {
        // Prefer live displayName from player/guest services — the snapshot
        // is authoritative only if the source has been deleted.
        if (producer.playerId) {
            const p = playersById.get(producer.playerId);
            if (p) return p.displayName;
        }
        if (producer.guestPlayerId) {
            const g = guestsById.get(producer.guestPlayerId);
            if (g) return `${g.displayName} (guest)`;
        }
        return producer.displayName;
    };

    const ballLabel = (b: BallInfo): string => {
        if (b.producers.length === 0) {
            return b.label ?? `ball:${short(b.id)}`;
        }
        const names = b.producers.map((p) => producerName(p));
        // Team-shape formats use " & " between members; own-ball/individual
        // formats have a single producer. Detection is per-ball-slot so a
        // foursomes ball in slot #1 gets `&` even when slot #0 is singles.
        const slot = slotForBall(b);
        const teamShape =
            isBetterBallSlot(slot) ||
            isFoursomesSlot(slot) ||
            isTalibanSlot(slot) ||
            isUmbrellaFourBallSlot(slot);
        const sep = teamShape ? ' & ' : ' + ';
        return names.join(sep);
    };
    const playerName = (id: string | null): string => {
        if (!id) return '—';
        return playersById.get(id)?.displayName ?? short(id);
    };

    const pairResultByBall = new Map<string, PairResult>();
    for (const pr of leaderboard.pairResults) {
        pairResultByBall.set(pr.balls[0], pr);
        pairResultByBall.set(pr.balls[1], pr);
    }

    // Match-play PH normalisation.
    //
    // match-play × individual: each ball has exactly one producer; one
    //   BallResult per ball; pair links two balls. Normalise the two balls'
    //   PH (from slot_balls.playing_handicap_snapshot) against each other.
    // match-play × better-ball: each ball is a team of 2 producers; two
    //   balls per pair (joined by slot_ball_teams.team_label). Normalise
    //   across all 4 producers.
    const effectivePHByBall = new Map<string, number | null>();
    const effectivePHByProducer = new Map<string, number | null>();
    const producerKey = (ballId: string, producerDefId: string): string =>
        `${ballId}:${producerDefId}`;

    for (const pr of leaderboard.pairResults) {
        const slot = formatSlotByIndex.get(pr.slotIndex);
        if (!(slot?.scoringMode === 'match_play')) continue;
        const [idA, idB] = pr.balls;
        const ballA = balls.find((b) => b.id === idA);
        const ballB = balls.find((b) => b.id === idB);
        if (!ballA || !ballB) continue;
        // Resolve per-slot PH by walking the ball's slot map. Since
        // round_format_slots.slot_index is different from slots.id, we
        // check each of the ball's slot ids and take the first
        // non-null PH — in practice a ball in slot #N carries exactly
        // one slot_balls row.
        const slotPhFor = (b: BallInfo): number | null => {
            for (const sid of b.slotIds) {
                const v = b.playingHandicapBySlot.get(sid);
                if (v !== null && v !== undefined) return v;
            }
            return null;
        };
        if (slot.teamShape === 'individual') {
            const [effectiveA, effectiveB] = normalizeMatchPlayHandicaps([
                slotPhFor(ballA),
                slotPhFor(ballB),
            ]);
            effectivePHByBall.set(idA, effectiveA);
            effectivePHByBall.set(idB, effectiveB);
            continue;
        }
        if (slot.teamShape === 'better_ball') {
            const entries = [
                ...ballA.producers.map((p) => ({ ballId: idA, producer: p })),
                ...ballB.producers.map((p) => ({ ballId: idB, producer: p })),
            ];
            const phs = entries.map(
                (e) => producerPH(balls.find((b) => b.id === e.ballId)!, e.producer),
            );
            const normalized = normalizeMatchPlayHandicaps(phs);
            for (let i = 0; i < entries.length; i++) {
                effectivePHByProducer.set(
                    producerKey(entries[i]!.ballId, entries[i]!.producer.producerDefId),
                    normalized[i] ?? null,
                );
            }
        }
    }

    // Köpenhamnare PH normalisation — per slot.
    for (const slot of round.formatSlots) {
        if (!isKopenhamnareSlot(slot)) continue;
        const slotResults = leaderboard.ballResults.filter(
            (r) => r.slotIndex === slot.slotIndex,
        );
        const slotBalls = slotResults
            .map((r) => balls.find((b) => b.id === r.ballId))
            .filter((b): b is BallInfo => Boolean(b));
        const mode = kopenHandicapModeFor(slot);
        // Pull each ball's PH from slot_balls (any of its slot ids — the
        // kopenhamnare slot is among them).
        const phFor = (b: BallInfo): number | null => {
            for (const sid of b.slotIds) {
                const v = b.playingHandicapBySlot.get(sid);
                if (v !== null && v !== undefined) return v;
            }
            return null;
        };
        if (mode === 'delta_from_min') {
            const phs = slotBalls.map((b) => phFor(b));
            const allNonNull = phs.every((v) => v !== null) && phs.length > 0;
            if (allNonNull) {
                const min = Math.min(...(phs as number[]));
                for (let i = 0; i < slotBalls.length; i++) {
                    effectivePHByBall.set(
                        slotBalls[i]!.id,
                        (phs[i] as number) - min,
                    );
                }
            } else {
                for (const b of slotBalls) effectivePHByBall.set(b.id, null);
            }
        } else {
            for (const b of slotBalls) effectivePHByBall.set(b.id, phFor(b));
        }
    }

    const allCourseHoles: CourseHole[] = course.holes.map((h) => ({
        holeNumber: h.holeNumber,
        par: h.par,
        strokeIndex: h.strokeIndex,
    }));
    const playedCourseHoles: CourseHole[] = courseHolesForRound(round.roundType, allCourseHoles);

    const producerPhSummary = (b: BallInfo): string => {
        if (b.producers.length === 0) {
            const ph = phForBall(b);
            return `PH ${ph ?? '—'}`;
        }
        return `player PH ${b.producers
            .map((prod) => {
                const base = producerPH(b, prod);
                const adjusted =
                    effectivePHByProducer.get(producerKey(b.id, prod.producerDefId)) ??
                    undefined;
                if (adjusted !== undefined && adjusted !== base) {
                    return `${numericCell(base)} → ${numericCell(adjusted)}`;
                }
                return numericCell(base);
            })
            .join(' / ')}`;
    };

    function phForBall(b: BallInfo): number | null {
        for (const sid of b.slotIds) {
            const v = b.playingHandicapBySlot.get(sid);
            if (v !== null && v !== undefined) return v;
        }
        return null;
    }

    // Match-style normalised running per ball (for Köpenhamnare + Umbrella).
    const normalizedRunningByBall = new Map<string, Map<number, number>>();
    const needsNormalizedRunning = (s: FormatSlot | undefined): boolean =>
        isKopenhamnareSlot(s) || s?.scoringMode === 'umbrella';
    for (const slot of round.formatSlots) {
        if (!needsNormalizedRunning(slot)) continue;
        const slotResults = leaderboard.ballResults.filter(
            (r) => r.slotIndex === slot.slotIndex,
        );
        if (slotResults.length === 0) continue;
        const rawTotals = new Map<string, number>();
        const holes = [...playedCourseHoles].sort((a, b) => a.holeNumber - b.holeNumber);
        for (const r of slotResults) {
            rawTotals.set(r.ballId, 0);
            normalizedRunningByBall.set(r.ballId, new Map());
        }
        for (const ch of holes) {
            for (const r of slotResults) {
                const hr = r.holes.find((h) => h.holeNumber === ch.holeNumber);
                if (hr?.points !== null && hr?.points !== undefined) {
                    rawTotals.set(r.ballId, (rawTotals.get(r.ballId) ?? 0) + hr.points);
                }
            }
            const min = Math.min(...slotResults.map((r) => rawTotals.get(r.ballId) ?? 0));
            for (const r of slotResults) {
                normalizedRunningByBall
                    .get(r.ballId)!
                    .set(ch.holeNumber, (rawTotals.get(r.ballId) ?? 0) - min);
            }
        }
    }

    return {
        allCourseHoles,
        playedCourseHoles,
        scorecardByBall,
        resultByBall,
        formatSlotByIndex,
        pairResultByBall,
        isBetterBallSlot,
        isFoursomesSlot,
        isTalibanSlot,
        isUmbrellaFourBallSlot,
        isUmbrellaIndividualSlot,
        isKopenhamnareSlot,
        umbrellaBirdieRuleFor,
        kopenHandicapModeFor,
        slotForBall,
        isBallBetterBall,
        isBallFoursomes,
        isBallTaliban,
        isBallUmbrellaFourBall,
        isBallUmbrellaIndividual,
        isBallUmbrella,
        ballLabel,
        producerName,
        playerName,
        producerPhSummary,
        effectivePHByBall,
        effectivePHByProducer,
        normalizedRunningByBall,
        ballPlayingHandicapInSlot,
    };
}
