import { Component, Router, effect, template, untrack } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { t } from '../theme';
import { s, btn, card } from '../css';
import { RoundViewService } from '../round/round.service';
import { RoundStatsService } from './round-stats.service';
import { toneColor, toneForStrokesLost } from './stats-charts';
import { STATS_COLORS } from './stats-palette';
import { STATS_COPY } from './stats-panel-blocks';
import { componentTitle, signedNumber } from './stats-format';
import { evaluateStoryEligibility, holesUnscoredFor } from './round-stats-model';
import {
    baselineDeltaSentence,
    insightSentence,
    ROUND_STATS_COPY,
    ROUND_STORY_COPY,
    totalScoreLine,
} from './round-stats-copy';
import {
    STROKES_LOST_COMPONENTS,
    deltaComponent,
    strokesLostComponent,
    type StrokesLostComponent,
} from '../round/stat-measures';

// The round-end story (proposal §4.1) — a card above the leaderboard, once the
// reader's own card is finished.
//
// THE WHOLE COMPONENT IS A GATE. It renders nothing at all unless every one of
// these holds:
//
//   1. there is a session (the read is `GET /players/me/…`);
//   2. this player tracks stats in this round AND recorded something;
//   3. every hole on their own card has a score.
//
// `evaluateStoryEligibility` owns that order, and `round-stats-model.ts` owns
// the arithmetic behind (3). Failure of any kind — 404, 401, a dead endpoint —
// resolves to the same silence: the logged-out on-course flow is the app's
// primary path and must be untouched by a statistics surface it cannot use.
//
// Twin of `ios/TapScore/Features/Stats/RoundStoryCard.swift`.
//
// A note on WHY it hangs off "your card is finished" rather than the round's
// `status`: a round is `complete` when everyone is done, and the story is about
// one reader's own eighteen. The finished-card test is also DURABLE — a
// completion moment would be gone by the time the player looked at the board.

const tpl = template(`
    <section bind="story" class="story hidden">
        <div class="story__head">
            <span bind="title" class="story__title"></span>
            <span bind="score" class="story__score"></span>
        </div>
        <ul bind="values" class="story__values"></ul>
        <p bind="hint" class="story__hint"></p>
        <ul bind="lines" class="story__lines"></ul>
        <button bind="open" class="story__open" type="button"></button>
    </section>
`);

const lineTpl = template(`<li bind="text" class="story__line"></li>`);

const valueTpl = template(`
    <li class="story__value">
        <span bind="label" class="story__valuelabel"></span>
        <span bind="amount" class="story__valueamount"></span>
    </li>
`);

export class RoundStoryComponent extends Component {
    static styles = `
        .story {
            ${card()}
            display: flex; flex-direction: column; gap: ${s('sm')};
            padding: ${s('lg')};
            margin-bottom: ${s('lg')};

            &.hidden { display: none; }

            & .story__head {
                display: flex; align-items: baseline; justify-content: space-between;
                gap: ${s('md')};
            }
            & .story__title {
                font-family: ${t('font-display')};
                font-weight: 600; font-size: 1.1rem;
            }
            & .story__score {
                font-weight: 700; font-size: 1.1rem;
                font-variant-numeric: tabular-nums;
                &:empty { display: none; }
            }
            /* The four terms, stated in text. Two-up on a phone, tabular
               numerals so the signs line up. (There used to be an aria-hidden
               waterfall strip above — stretched to card width it read as a
               broken divider, and the rows already say everything it drew.) */
            & .story__values {
                margin: 0; padding: 0; list-style: none;
                display: grid; grid-template-columns: repeat(2, 1fr);
                gap: 2px ${s('md')};
                &:empty { display: none; }
            }
            & .story__value {
                display: flex; align-items: baseline; justify-content: space-between;
                gap: ${s('sm')};
            }
            & .story__valuelabel { font-size: 0.8rem; color: ${t('text-muted')}; }
            & .story__valueamount {
                font-size: 0.85rem; font-weight: 700;
                font-variant-numeric: tabular-nums;
                &.story__valueamount--absent {
                    font-weight: 400; font-size: 0.78rem; color: ${t('text-muted')};
                }
            }
            & .story__hint { margin: 0; font-size: 0.78rem; color: ${t('text-muted')}; }
            & .story__lines {
                margin: 0; padding: 0; list-style: none;
                display: flex; flex-direction: column; gap: ${s('xs')};
                &:empty { display: none; }
            }
            & .story__line { font-size: 0.9rem; }
            & .story__open {
                ${btn()}
                align-self: flex-start;
                padding: ${s('xs')} ${s('md')};
                font-family: inherit; font-size: 0.82rem; font-weight: 700;
            }
        }
    `;

    private round = this.inject(RoundViewService);
    private stats = this.inject(RoundStatsService);
    private auth = this.inject(AuthService);
    private router = this.inject(Router);
    private colors = STATS_COLORS;

    render(): DocumentFragment {
        // Signals are read inside the effect, never in a field initializer: the
        // card lives on `/round`, whose service writes constantly, and a read
        // during construction would subscribe the parent's spawn to all of it.
        this.track(
            effect(() => {
                const roundId = this.eligibleRoundId();
                untrack(() => {
                    if (roundId !== null) void this.stats.load(roundId).catch(() => {});
                });
            }),
        );

        const model = () => (this.shows() ? this.stats.model.get() : null);

        const frag = this.wire(tpl, {
            story: { className: () => (this.shows() ? 'story' : 'story hidden') },
            title: () => ROUND_STORY_COPY.title,
            score: () => {
                const m = model();
                return m === null ? '' : (totalScoreLine(m.strokes, m.vsPar) ?? '');
            },
            hint: () => (model() === null ? '' : this.hint()),
            open: {
                textContent: () => ROUND_STORY_COPY.seeWholeRound,
                onclick: () => {
                    const id = this.stats.roundId.get();
                    if (id !== null) this.router.navigate('/round-stats', { query: { id } });
                },
            },
        });

        // --- The four terms, in words ---------------------------------------
        //
        // iOS states them the same way (`RoundWaterfallSection`,
        // `showsHint: false`). The colour is a second channel only: the sign
        // is in the text.
        const componentValue = (c: StrokesLostComponent): number | null => {
            const m = model();
            return m === null ? null : strokesLostComponent(m.waterfall, c);
        };
        this.$each(
            this.ref(frag, 'values'),
            () => (model() === null ? [] : [...STROKES_LOST_COMPONENTS]),
            (component, _i, track) =>
                this.wireEl(
                    valueTpl,
                    {
                        label: () => componentTitle(component),
                        amount: {
                            textContent: () => {
                                const value = componentValue(component);
                                return value === null
                                    ? STATS_COPY.notRecorded
                                    : signedNumber(value);
                            },
                            className: () =>
                                componentValue(component) === null
                                    ? 'story__valueamount story__valueamount--absent'
                                    : 'story__valueamount',
                            style: () => {
                                const value = componentValue(component);
                                return value === null
                                    ? ''
                                    : `color:${toneColor(toneForStrokesLost(value), this.colors)}`;
                            },
                        },
                    },
                    track,
                ),
            (component) => component,
        );

        // Two or three sentences, already ranked and already chosen by
        // `insightLines`. The module picked them; this only words them.
        this.$each(
            this.ref(frag, 'lines'),
            () => model()?.insights ?? [],
            (line, _i, track) =>
                this.wireEl(lineTpl, { text: () => insightSentence(line) }, track),
            (line) => line.id,
        );

        return frag;
    }

    /**
     * The round id this card may read, or null.
     *
     * Everything the gate needs is already public on `RoundViewService`, so the
     * check is a pure function over those reads and that service needs no new
     * method for this surface.
     */
    private eligibleRoundId(): string | null {
        const round = this.round.round.get();
        if (round === null) return null;
        const eligibility = evaluateStoryEligibility({
            signedInPlayerId: this.auth.currentUser.get()?.id ?? null,
            statConfigPlayerIds: new Set(this.round.statModules.get().keys()),
            statRows: this.round.statRows.get(),
            holesUnscored: holesUnscoredFor({
                playerId: this.auth.currentUser.get()?.id ?? '',
                balls: this.round.balls.get(),
                groups: this.round.groups(),
                strokesFor: (ballId, playHoleId) => this.round.strokesFor(ballId, playHoleId),
            }),
        });
        return eligibility.reason === 'eligible' ? round.id : null;
    }

    /** Eligible AND the read landed. Any other phase is silence, not a message. */
    private shows(): boolean {
        const id = this.eligibleRoundId();
        if (id === null) return false;
        return this.stats.phase.get() === 'ready' && this.stats.roundId.get() === id;
    }

    /**
     * The sentence under the bar. With a personal window it is the round's worst
     * component against the player's own normal; without one it says what the
     * bar is measured against instead, because a first round has no personal
     * baseline and inventing one would be the whole point missed.
     */
    private hint(): string {
        const m = this.stats.model.get();
        if (m === null) return '';
        if (m.deltas === null) return ROUND_STATS_COPY.waterfallHint;
        let worst: number | null = null;
        for (const c of STROKES_LOST_COMPONENTS) {
            const d = deltaComponent(m.deltas, c);
            if (d === null) continue;
            if (worst === null || Math.abs(d) > Math.abs(worst)) worst = d;
        }
        return worst === null
            ? ROUND_STATS_COPY.waterfallHint
            : baselineDeltaSentence(worst, m.windowCount);
    }
}
