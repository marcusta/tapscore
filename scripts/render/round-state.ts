// Shared state derived from a RoundRenderContext. This is the per-render
// cache of lookup maps, slot classifiers, normalised handicap maps, and
// running-total tables used by the section + scorecard renderers.
//
// Centralising it here means the section/scorecard modules can stay
// stateless pure functions that take (ctx, state, <their own inputs>).

import type { Participant } from '../../server/services/participant.service';
import type { Round } from '../../server/services/round.service';
import type { CourseHole } from '../../server/domain/format';
import { courseHolesForRound } from '../../server/domain/round-holes';
import { normalizeMatchPlayHandicaps } from '../../server/domain/formats/_match-play-handicap';
import type {
    PairResult,
    RoundRenderContext,
    Scorecard,
} from './types';
import { numericCell, short } from './util';

type FormatSlot = Round['formatSlots'][number];

export interface RoundRenderState {
    // Hole data
    allCourseHoles: CourseHole[];
    playedCourseHoles: CourseHole[];

    // Look-ups
    scorecardByParticipant: Map<string, Scorecard>;
    slotByParticipantId: Map<string, FormatSlot>;
    pairResultsByParticipant: Map<string, PairResult>;

    // Slot classifiers (per-slot so a team-shape in one slot doesn't leak
    // layout choices into another slot's participants).
    isBetterBallSlot: (s: FormatSlot | undefined) => boolean;
    isFoursomesSlot: (s: FormatSlot | undefined) => boolean;
    isTalibanSlot: (s: FormatSlot | undefined) => boolean;
    isUmbrellaFourBallSlot: (s: FormatSlot | undefined) => boolean;
    isUmbrellaIndividualSlot: (s: FormatSlot | undefined) => boolean;
    isKopenhamnareSlot: (s: FormatSlot | undefined) => boolean;
    umbrellaBirdieRuleFor: (s: FormatSlot | undefined) => string | null;
    kopenHandicapModeFor: (s: FormatSlot | undefined) => string | null;

    // Participant classifiers
    isParticipantBetterBall: (p: Participant) => boolean;
    isParticipantFoursomes: (p: Participant) => boolean;
    isParticipantTaliban: (p: Participant) => boolean;
    isParticipantUmbrellaFourBall: (p: Participant) => boolean;
    isParticipantUmbrellaIndividual: (p: Participant) => boolean;
    isParticipantUmbrella: (p: Participant) => boolean;

    // Display helpers
    participantLabel: (p: Participant) => string;
    playerName: (id: string | null) => string;
    playerLinkLabel: (link: Participant['players'][number]) => string;
    playerPhSummary: (p: Participant) => string;

    // Handicap normalisation
    effectivePHByParticipant: Map<string, number | null>;
    effectivePHByLinkId: Map<string, number | null>;

    // Match-style running totals (kopenhamnare + umbrella)
    normalizedRunningByParticipant: Map<string, Map<number, number>>;
}

export function buildRoundRenderState(ctx: RoundRenderContext): RoundRenderState {
    const { round, course, participants, scorecards, playersById, guestsById, leaderboard } = ctx;

    const scorecardByParticipant = new Map(scorecards.map((sc) => [sc.participantId, sc]));

    // Per-participant slot lookup. Multi-slot rounds scope participants via
    // `scopeConfig.scope.participantIds` (same convention as
    // leaderboard.service.ts). Single-slot rounds without scope fall back
    // to "everyone in slot 0".
    const slotByParticipantId = new Map<string, FormatSlot>();
    const singleSlotNoScope =
        round.formatSlots.length === 1 &&
        (round.formatSlots[0]!.scopeConfig?.scope?.participantIds ?? null) === null;
    if (singleSlotNoScope) {
        for (const p of participants) {
            slotByParticipantId.set(p.id, round.formatSlots[0]!);
        }
    } else {
        for (const p of participants) {
            const match = round.formatSlots.find((s) =>
                s.scopeConfig?.scope?.participantIds?.includes(p.id),
            );
            if (match) slotByParticipantId.set(p.id, match);
        }
    }

    // Per-participant format detection — a team-shape format in one slot must
    // not leak layout choices into another slot's participants. Each scorecard
    // variant asks its OWN slot what format it is.
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

    const isParticipantBetterBall = (p: Participant): boolean =>
        isBetterBallSlot(slotByParticipantId.get(p.id));
    const isParticipantFoursomes = (p: Participant): boolean =>
        isFoursomesSlot(slotByParticipantId.get(p.id));
    const isParticipantTaliban = (p: Participant): boolean =>
        isTalibanSlot(slotByParticipantId.get(p.id));
    const isParticipantUmbrellaFourBall = (p: Participant): boolean =>
        isUmbrellaFourBallSlot(slotByParticipantId.get(p.id));
    const isParticipantUmbrellaIndividual = (p: Participant): boolean =>
        isUmbrellaIndividualSlot(slotByParticipantId.get(p.id));
    const isParticipantUmbrella = (p: Participant): boolean =>
        isParticipantUmbrellaFourBall(p) || isParticipantUmbrellaIndividual(p);

    const participantLabel = (p: Participant): string => {
        const names = p.players.map((link) => {
            if (link.playerId) return playersById.get(link.playerId)?.displayName ?? `player:${short(link.playerId)}`;
            if (link.guestPlayerId) {
                const g = guestsById.get(link.guestPlayerId);
                return g ? `${g.displayName} (guest)` : `guest:${short(link.guestPlayerId)}`;
            }
            return '?';
        });
        if (!names.length) return `participant:${short(p.id)}`;
        // Team-shape formats use " & " between members; individual-shape
        // participants only ever have one name anyway, so the separator is
        // mostly cosmetic when there's 2+ players. Detection is per-slot so
        // a foursomes team in slot #1 gets `&` even when slot #0 is singles.
        const teamShape =
            isParticipantBetterBall(p) ||
            isParticipantFoursomes(p) ||
            isParticipantTaliban(p) ||
            isParticipantUmbrella(p);
        const sep = teamShape ? ' & ' : ' + ';
        return names.join(sep);
    };
    const playerName = (id: string | null): string => {
        if (!id) return '—';
        return playersById.get(id)?.displayName ?? short(id);
    };
    const playerLinkLabel = (link: Participant['players'][number]): string => {
        if (link.playerId) return playersById.get(link.playerId)?.displayName ?? `player:${short(link.playerId)}`;
        if (link.guestPlayerId) {
            const g = guestsById.get(link.guestPlayerId);
            return g ? `${g.displayName} (guest)` : `guest:${short(link.guestPlayerId)}`;
        }
        return '?';
    };

    const pairResultsByParticipant = new Map<string, PairResult>();
    for (const pr of leaderboard.pairResults) {
        pairResultsByParticipant.set(pr.participants[0], pr);
        pairResultsByParticipant.set(pr.participants[1], pr);
    }

    // Köpenhamnare: for any kopenhamnare × individual slot, derive effective
    // PH per participant for the card-header annotation. The snapshot is
    // always shown; the effective PH surfaces how delta_from_min shifts it
    // (e.g. snapshot PH=22, mode=delta_from_min → effective PH=17). Handled
    // per slot so a hypothetical multi-slot layout with two kopenhamnare
    // groups computes the min within each group.
    const effectivePHByParticipant = new Map<string, number | null>();
    const effectivePHByLinkId = new Map<string, number | null>();
    for (const pr of leaderboard.pairResults) {
        const slot = round.formatSlots[pr.slotIndex];
        if (!(slot?.scoringMode === 'match_play')) continue;
        const [idA, idB] = pr.participants;
        const partA = participants.find((p) => p.id === idA);
        const partB = participants.find((p) => p.id === idB);
        if (!partA || !partB) continue;
        if (slot.teamShape === 'individual') {
            const [effectiveA, effectiveB] = normalizeMatchPlayHandicaps([
                partA.playingHandicapSnapshot,
                partB.playingHandicapSnapshot,
            ]);
            effectivePHByParticipant.set(idA, effectiveA);
            effectivePHByParticipant.set(idB, effectiveB);
            continue;
        }
        if (slot.teamShape === 'better_ball') {
            const allLinks = [
                ...partA.players.map((link) => ({
                    link,
                    ph: link.playingHandicapSnapshot ?? partA.playingHandicapSnapshot,
                })),
                ...partB.players.map((link) => ({
                    link,
                    ph: link.playingHandicapSnapshot ?? partB.playingHandicapSnapshot,
                })),
            ];
            const normalized = normalizeMatchPlayHandicaps(allLinks.map((entry) => entry.ph));
            for (let i = 0; i < allLinks.length; i++) {
                effectivePHByLinkId.set(allLinks[i]!.link.id, normalized[i] ?? null);
            }
        }
    }
    for (const slot of round.formatSlots) {
        if (!isKopenhamnareSlot(slot)) continue;
        const slotParticipants = participants.filter(
            (p) => slotByParticipantId.get(p.id) === slot,
        );
        const mode = kopenHandicapModeFor(slot);
        if (mode === 'delta_from_min') {
            const phs = slotParticipants.map((p) => p.playingHandicapSnapshot);
            const allNonNull = phs.every((v) => v !== null) && phs.length > 0;
            if (allNonNull) {
                const min = Math.min(...(phs as number[]));
                for (const p of slotParticipants) {
                    effectivePHByParticipant.set(
                        p.id,
                        (p.playingHandicapSnapshot as number) - min,
                    );
                }
            } else {
                for (const p of slotParticipants) effectivePHByParticipant.set(p.id, null);
            }
        } else {
            for (const p of slotParticipants) {
                effectivePHByParticipant.set(p.id, p.playingHandicapSnapshot);
            }
        }
    }

    const allCourseHoles: CourseHole[] = course.holes.map((h) => ({
        holeNumber: h.holeNumber,
        par: h.par,
        strokeIndex: h.strokeIndex,
    }));
    const playedCourseHoles: CourseHole[] = courseHolesForRound(round.roundType, allCourseHoles);

    const playerPhSummary = (p: Participant): string =>
        p.players.length === 0
            ? `PH ${p.playingHandicapSnapshot ?? '—'}`
            : `player PH ${p.players
                  .map((link) => {
                      const base = link.playingHandicapSnapshot ?? p.playingHandicapSnapshot;
                      const adjusted = effectivePHByLinkId.get(link.id) ?? base;
                      if (adjusted !== base) return `${numericCell(base)} → ${numericCell(adjusted)}`;
                      return numericCell(base);
                  })
                  .join(' / ')}`;

    // Match-style / head-to-head-ish formats benefit from a "running"
    // cumulative that is normalised to the current trailer, so the lowest
    // total is always 0 at any hole. Example:
    //   raw totals  [10, 8, 6] -> running [4, 2, 0]
    //   raw totals  [7, 4]     -> running [3, 0]
    //
    // This is rendered for:
    //   - Köpenhamnare (3-player match-style points race)
    //   - Umbrella (both 2v2 and 3-player individual variants)
    //
    // Pair formats (match-play, Taliban) compute the same idea from their
    // pair-level rows below because they don't expose participant `totals`
    // as points arrays.
    const normalizedRunningByParticipant = new Map<string, Map<number, number>>();
    const needsNormalizedRunning = (s: FormatSlot | undefined): boolean =>
        isKopenhamnareSlot(s) || s?.scoringMode === 'umbrella';
    for (const slot of round.formatSlots) {
        if (!needsNormalizedRunning(slot)) continue;
        const slotResults = leaderboard.participantResults.filter(
            (r) => r.slotIndex === slot.slotIndex,
        );
        if (slotResults.length === 0) continue;
        const rawTotals = new Map<string, number>();
        const holes = [...playedCourseHoles].sort((a, b) => a.holeNumber - b.holeNumber);
        for (const r of slotResults) {
            rawTotals.set(r.participantId, 0);
            normalizedRunningByParticipant.set(r.participantId, new Map());
        }
        for (const ch of holes) {
            for (const r of slotResults) {
                const hr = r.holes.find((h) => h.holeNumber === ch.holeNumber);
                if (hr?.points !== null && hr?.points !== undefined) {
                    rawTotals.set(
                        r.participantId,
                        (rawTotals.get(r.participantId) ?? 0) + hr.points,
                    );
                }
            }
            const min = Math.min(...slotResults.map((r) => rawTotals.get(r.participantId) ?? 0));
            for (const r of slotResults) {
                normalizedRunningByParticipant
                    .get(r.participantId)!
                    .set(ch.holeNumber, (rawTotals.get(r.participantId) ?? 0) - min);
            }
        }
    }

    return {
        allCourseHoles,
        playedCourseHoles,
        scorecardByParticipant,
        slotByParticipantId,
        pairResultsByParticipant,
        isBetterBallSlot,
        isFoursomesSlot,
        isTalibanSlot,
        isUmbrellaFourBallSlot,
        isUmbrellaIndividualSlot,
        isKopenhamnareSlot,
        umbrellaBirdieRuleFor,
        kopenHandicapModeFor,
        isParticipantBetterBall,
        isParticipantFoursomes,
        isParticipantTaliban,
        isParticipantUmbrellaFourBall,
        isParticipantUmbrellaIndividual,
        isParticipantUmbrella,
        participantLabel,
        playerName,
        playerLinkLabel,
        playerPhSummary,
        effectivePHByParticipant,
        effectivePHByLinkId,
        normalizedRunningByParticipant,
    };
}

