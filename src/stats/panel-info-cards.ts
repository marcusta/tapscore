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
// TWO rules govern which cards exist, both from the owner's 2026-08-03 read:
//
// 1. A CARD TITLE IS A ROW NAME, VERBATIM. Anywhere the screen uses a word of
//    its own — "Trouble tax", "Penalty tax", "Missed-green tax", "Sand save" —
//    that exact string is a HEADING here, not a clause inside a section card. A
//    reader who does not know what a tax is in golf scans headings for the word
//    they just read; a definition filed under "What each tee shot cost" is a
//    definition they will not find. Section-shaped cards survive only where the
//    row names they cover are already plain English.
// 2. EVERY DENOMINATOR THE ROWS DROPPED LANDS HERE. Figure rows print the bare
//    value now, so this sheet is the only place the sample is stated. A group of
//    parallel rows states its legs in one sentence (`groupSample`), because the
//    rows partition one sample and how it split is the interesting part.
//
// Twin of `ios/TapScore/Features/Stats/StatsPanelInfo.swift`.

import {
    byParSample,
    groupSample,
    missedGreenSample,
    missedGreenTaxSample,
    penaltyDoubleGeography,
    penaltyTaxSample,
    quantity,
    troubleTaxSample,
    vsParByTeeSample,
    UNIT_GREENS,
    UNIT_HOLES,
    UNIT_ROUNDS,
    type SampleUnit,
} from './stats-format';
import { STATS_COPY } from './stats-panel-blocks';
import { cohortLabel, type SgBaselineInfo } from './sg-baseline';
import type {
    StatsDashboardModel,
    StatsPanelId,
    StatsTeePanel,
} from './stats-dashboard-model';

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

/**
 * "Your penalty doubles: 2 off the tee, 1 on the approach and 1 around the
 * green." — the live geography split the penalty sentence promises. Omitted
 * entirely when the window has no penalty doubles: the caveat sentence still
 * explains the split, but there is nothing to state.
 */
function penaltyDoubleSplit(g: {
    tee: number;
    approach: number;
    short: number;
    unknown: number;
}): string | null {
    const split = penaltyDoubleGeography(g);
    return split === null ? null : `Your penalty doubles: ${split}.`;
}

/** One paragraph from its sentences, dropping the ones that had nothing to say. */
function body(...parts: (string | null)[]): string {
    return parts.filter((p): p is string => p !== null && p !== '').join(' ');
}

function card(id: string, title: string, text: string): StatsInfoCard {
    return { id, title, body: text };
}

/**
 * The penalties figure is per ROUND, but it only exists on holes where the
 * question was answered — so its honest sample is both numbers.
 *
 * Gated on the recorded holes rather than on `penaltiesPerRound.d`, which is the
 * window's round count whatever anyone recorded: without the gate a window that
 * never answered the penalty question would claim "over 3 rounds" for a figure
 * the card does not even show.
 */
function penaltiesSample(p: StatsTeePanel): string | null {
    if (p.penaltiesRecordedHoles <= 0) return null;
    return groupSample([
        { d: p.penaltiesPerRound.d, unit: UNIT_ROUNDS },
        { d: p.penaltiesRecordedHoles, unit: UNIT_HOLES },
    ]);
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
                // Titled with the subhead the three rows sit under, word for
                // word. The trouble tax used to be explained inside this card;
                // it now has its own, below, because "Trouble tax" is the string
                // a puzzled reader is scanning for.
                card(
                    'vsParByTee',
                    'Average vs par, by where the tee shot finished',
                    body(STATS_COPY.vsParByTee, measured(vsParByTeeSample(p.vsParByTee))),
                ),
                card(
                    'troubleTax',
                    'Trouble tax',
                    body(STATS_COPY.troubleTax, measured(troubleTaxSample(p.vsParByTee))),
                ),
                card(
                    'recovery',
                    'Recovery',
                    body(STATS_COPY.recovery, measuredOver(p.recovery.d, UNIT_HOLES)),
                ),
                card(
                    'penalties',
                    'Penalties',
                    body(STATS_COPY.penalties, measured(penaltiesSample(p))),
                ),
                card(
                    'penaltyTax',
                    'Penalty tax',
                    body(STATS_COPY.penaltyTax, measured(penaltyTaxSample(p.vsParByPenalty))),
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
                    'costOfMissedGreen',
                    'Cost of a missed green',
                    body(
                        STATS_COPY.costOfMissedGreen,
                        measured(missedGreenSample(p.costOfMissedGreen)),
                    ),
                ),
                // The tax gets the row's own name as its heading, and its own
                // two-sided sample: the group card above states the two legs as a
                // partition, this one states them as a comparison.
                card(
                    'missedGreenTax',
                    'Missed-green tax',
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
                card(
                    'puttsByPar',
                    'Putts per hole, by par',
                    body(STATS_COPY.puttsByPar, measured(byParSample(p.puttsPerHoleByPar))),
                ),
            ];
        }
        case 'shortGame': {
            const p = model.shortGame;
            if (!p) return [];
            const attempts =
                p.scramble.standard.d + p.scramble.hard.d + p.scramble.bunker.d;
            return [
                // Five rows, five cards. This used to be ONE card that opened
                // "Scrambling" and then ran four unrelated definitions together,
                // which put the meaning of "Sand save" — the app's own vocabulary
                // for the bunker scramble — three sentences deep under a heading
                // that does not contain the word.
                card(
                    'missMix',
                    STATS_COPY.missMixHead,
                    body(STATS_COPY.missMix, measuredOver(attempts, UNIT_HOLES)),
                ),
                card(
                    'scrambling',
                    'Scrambling',
                    body(STATS_COPY.scrambling, measuredOver(attempts, UNIT_HOLES)),
                ),
                card(
                    'sandSave',
                    'Sand save',
                    body(STATS_COPY.sandSave, measuredOver(p.sandSave.d, UNIT_HOLES)),
                ),
                card(
                    'extraShortGameStrokes',
                    'Extra short-game shots',
                    body(
                        STATS_COPY.extraShortGameStrokes,
                        measuredOver(p.shortGameStrokesRecorded, UNIT_HOLES),
                    ),
                ),
                // ONE card for the three outcome groups: same five rows, same
                // denominator rule, so one explanation serves them all. The
                // multi-chip sentence rides along because its row lives inside
                // the groups now.
                card(
                    'chipOutcomes',
                    'After the chip',
                    body(
                        STATS_COPY.chipOutcomes,
                        STATS_COPY.multiChip,
                        measuredOver(attempts, UNIT_HOLES),
                    ),
                ),
                card(
                    'missCost',
                    'Average vs par, by how hard the miss was',
                    body(
                        STATS_COPY.missCost,
                        measuredOver(
                            p.missCost.standard.d + p.missCost.hard.d + p.missCost.bunker.d,
                            UNIT_HOLES,
                        ),
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
                card(
                    'savedInside2m',
                    'Saved when inside 2 m',
                    body(
                        STATS_COPY.savedInside2m,
                        measuredOver(p.savedInside2m.overall.d, UNIT_HOLES),
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
                    'vsPar',
                    'Average vs par',
                    body(STATS_COPY.avgVsParByPar, measured(byParSample(p.avgVsParByParGroup))),
                ),
                card(
                    'doubles',
                    'Doubles or worse',
                    body(
                        STATS_COPY.doubleBogeyPlus,
                        measuredOver(p.doubleBogeyPlusPerRound.d, UNIT_ROUNDS),
                    ),
                ),
                // ONE card for the whole grouped block: groups and sub-rows
                // share a denominator and a priority order, so one explanation
                // serves them all. Order per the proposal (§4.3): what the
                // block is, the priority order and why, the denominator, then
                // the two rows that need a caveat of their own — "Full swing"
                // (the residual, claimed only on a fully recorded hole) and
                // "Not enough recorded" (counted, never dropped). The penalty
                // sentence explains how a penalty double lands in a phase, and
                // the split itself is stated LIVE — the only surface that adds
                // the four geography numbers up, per the ⓘ ruling that a sheet
                // is about the player, not about the feature.
                ...(p.doubleBogeyPlusHoles > 0
                    ? [
                          card(
                              'doubleCauses',
                              STATS_COPY.doubleCausesHead,
                              body(
                                  STATS_COPY.doubleCauses,
                                  STATS_COPY.doubleCausesOrder,
                                  measuredOver(p.doubleBogeyPlusHoles, UNIT_HOLES),
                                  STATS_COPY.doubleCausesLongGame,
                                  STATS_COPY.doubleCausesUnattributed,
                                  STATS_COPY.doubleCausesPenalty,
                                  penaltyDoubleSplit(p.penaltyDoubleSources),
                              ),
                          ),
                      ]
                    : []),
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
