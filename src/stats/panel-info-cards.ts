// What a module card's "How this works" sheet says, for THIS reader.
//
// The owner's polish-pass ruling (2026-08-02) took every explainer sentence off
// the rows: a card is label + bar + value, and the prose that used to sit under
// a figure moved in here. Nothing was rewritten in the move — each body opens
// with the SAME `STATS_COPY` sentence the row carried, because that prose has
// already passed the owner's ear, and this pass is not the place to invent a
// second voice for it.
//
// What is new is the last sentence of every body: the reader's own denominator.
// A card that could have been written before the data loaded is a card written
// wrong — that is the whole reason the explainers left the rows, where they were
// static text, for a sheet where they are about the player.
//
// Twin of `ios/TapScore/Features/Stats/StatsPanelInfo.swift`.

import {
    missedGreenTaxSample,
    penaltyTaxSample,
    quantity,
    troubleTaxSample,
    UNIT_GREENS,
    UNIT_HOLES,
    UNIT_ROUNDS,
    type SampleUnit,
} from './stats-format';
import { STATS_COPY } from './stats-panel-blocks';
import { cohortLabel, type SgBaselineInfo } from './sg-baseline';
import type { StatsDashboardModel, StatsPanelId } from './stats-dashboard-model';

/**
 * One card of a panel's sheet: a short title and one paragraph. The same
 * anatomy as `SgInfoCard`, and it renders through the same markup — a reader who
 * has opened the priorities sheet has already met this shape.
 */
export interface StatsInfoCard {
    id: string;
    title: string;
    body: string;
}

/**
 * "Measured over 24 greens." — omitted entirely at a zero denominator. Never
 * "Measured over 0 holes.": a sample sentence about no sample is worse than no
 * sentence.
 */
function measuredOver(d: number, unit: SampleUnit): string | null {
    return d > 0 ? `Measured over ${quantity(d, unit)}.` : null;
}

/** "Measured over 9 holes with a penalty vs 45 without." — for a tax's two sides. */
function measured(sample: string | null): string | null {
    return sample === null ? null : `Measured ${sample}.`;
}

/** One paragraph from its sentences, dropping the ones that had nothing to say. */
function body(...parts: (string | null)[]): string {
    return parts.filter((p): p is string => p !== null && p !== '').join(' ');
}

function card(id: string, title: string, text: string): StatsInfoCard {
    return { id, title, body: text };
}

/**
 * The sheet's cards for one module card, in reading order.
 *
 * `[]` for a panel the window has no data for — the component then omits the
 * trigger altogether, because a sheet with nothing in it must not be reachable.
 */
export function panelInfoCards(
    id: StatsPanelId | null,
    model: StatsDashboardModel,
    baseline: SgBaselineInfo,
): StatsInfoCard[] {
    switch (id) {
        case 'tee': {
            const p = model.tee;
            if (!p) return [];
            return [
                card(
                    'teeFan',
                    'Where your tee shots finish',
                    body(STATS_COPY.teeFan, measuredOver(p.teeRecorded, UNIT_HOLES)),
                ),
                card(
                    'vsParByTee',
                    'What each tee shot cost',
                    body(
                        STATS_COPY.vsParByTee,
                        STATS_COPY.troubleTax,
                        measured(troubleTaxSample(p.vsParByTee)),
                    ),
                ),
                card(
                    'recovery',
                    'Recovery',
                    body(STATS_COPY.recovery, measuredOver(p.recovery.d, UNIT_HOLES)),
                ),
                card(
                    'penalties',
                    'Penalties',
                    body(
                        STATS_COPY.penalties,
                        measuredOver(p.penaltiesRecordedHoles, UNIT_HOLES),
                        measured(penaltyTaxSample(p.vsParByPenalty)),
                    ),
                ),
            ];
        }
        case 'approach': {
            const p = model.approach;
            if (!p) return [];
            return [
                card(
                    'greenMiss',
                    'Where you miss the green',
                    body(STATS_COPY.greenMiss, measuredOver(p.greenMissRecorded, UNIT_HOLES)),
                ),
                card(
                    'proximity',
                    'Proximity with GIR',
                    // Every bucket of the mix shares one denominator by
                    // construction, so the shortest bucket's `d` IS the sample.
                    body(
                        STATS_COPY.proximityProxy,
                        measuredOver(p.girFirstPuttMix.inside_1m.d, UNIT_GREENS),
                    ),
                ),
                card(
                    'birdieConversion',
                    'Birdie conversion',
                    body(
                        STATS_COPY.birdieConversion,
                        measuredOver(p.birdieConversion.d, UNIT_GREENS),
                    ),
                ),
                card(
                    'hardChipShare',
                    'Hard misses',
                    body(STATS_COPY.hardChipShare, measuredOver(p.hardChipShare.d, UNIT_HOLES)),
                ),
                card(
                    'missedGreenTax',
                    'Cost of a missed green',
                    body(
                        STATS_COPY.missedGreenTax,
                        measured(missedGreenTaxSample(p.costOfMissedGreen)),
                    ),
                ),
            ];
        }
        case 'putting': {
            const p = model.putting;
            if (!p) return [];
            return [
                card(
                    'firstPuttSpread',
                    'First putt, all holes',
                    body(
                        STATS_COPY.firstPuttSpread,
                        measuredOver(p.firstPuttSpread.inside_1m.d, UNIT_HOLES),
                    ),
                ),
                card(
                    'ladder',
                    'Holed on the first putt',
                    // The cohort sentence, in the same pointer phrasing the
                    // priorities sheet uses: both the tick and the cost follow
                    // the selector, so the sheet has to say which tier is on.
                    body(
                        STATS_COPY.ladderBaseline,
                        STATS_COPY.ladderCost,
                        `Measured against the ${cohortLabel(baseline.cohort)} reference — change it under “${STATS_COPY.filterBaseline}” in Filters.`,
                    ),
                ),
                card(
                    'threePutt',
                    'Three or more putts',
                    body(
                        STATS_COPY.threePutt,
                        STATS_COPY.longThreePutt,
                        measuredOver(p.threePutt.d, UNIT_HOLES),
                    ),
                ),
                card(
                    'puttsPerGir',
                    'Putts per green hit',
                    body(STATS_COPY.puttsPerGir, measuredOver(p.puttsPerGirHole.d, UNIT_GREENS)),
                ),
                card(
                    'puttsAfterMissedGreen',
                    'Putts after a missed green',
                    body(
                        STATS_COPY.puttsAfterMissedGreen,
                        measuredOver(p.puttsAfterMissedGreen.d, UNIT_HOLES),
                    ),
                ),
            ];
        }
        case 'shortGame': {
            const p = model.shortGame;
            if (!p) return [];
            const attempts =
                p.scramble.standard.d + p.scramble.hard.d + p.scramble.bunker.d;
            return [
                card(
                    'scrambling',
                    'Scrambling',
                    body(
                        STATS_COPY.sandSave,
                        STATS_COPY.multiChip,
                        STATS_COPY.multiChipBunker,
                        STATS_COPY.extraShortGameStrokes,
                        measuredOver(attempts, UNIT_HOLES),
                    ),
                ),
                card(
                    'chipInside2m',
                    'Chipped to inside 2 m',
                    body(
                        STATS_COPY.conversionInside2m,
                        measuredOver(p.conversionInside2m.d, UNIT_HOLES),
                    ),
                ),
                // Counts, not rates: there is no denominator to report, so the
                // card is the sentence alone.
                card('chipIns', 'Chip-ins', STATS_COPY.chipIns),
            ];
        }
        case 'scoring': {
            const p = model.scoring;
            if (!p) return [];
            return [
                card(
                    'doubles',
                    'Doubles or worse',
                    body(
                        STATS_COPY.doubleBogeyPlus,
                        measuredOver(p.doubleBogeyPlusPerRound.d, UNIT_ROUNDS),
                    ),
                ),
                card(
                    'bounceBack',
                    'Bounce-back',
                    body(STATS_COPY.bounceBack, measuredOver(p.bounceBack.d, UNIT_HOLES)),
                ),
            ];
        }
        case null:
            return [];
    }
}
