import { Component, Router, Signal, effect, template } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { t } from '../theme';
import { s, btn } from '../css';
import { RoundViewService } from './round.service';
import { LeaderboardComponent } from './leaderboard.component';
import { missingScoresLine, unscoredCellCount } from './round-completion';
import { evaluateStoryEligibility, holesUnscoredFor } from '../stats/round-stats-model';
import { roundHeaderTitle } from './header-title';

// The finish flow (2026-08-01) — the round's CLOSING ceremony, and the fix for
// rounds left hanging as "Live" forever because Finish only lived in the "⋯"
// manage sheet.
//
// Three stages, each fullscreen:
//
//   1. PROMPT — raised by advance-policy's `roundComplete` moment (the last
//      ball on the last hole was just scored). "Finish round" is the one press
//      that actually finishes (POST /friendly-rounds/finish — organizational,
//      never a lock); "Go back" returns to the round untouched, for edits.
//      When the card is not actually full (a skipped hole, another group still
//      out) the prompt says how many scores are missing rather than gating —
//      the moment is right even when the data is not complete.
//   2. BOARD — the final results: the same `LeaderboardComponent` the round's
//      leaderboard tab renders, without the dock. The bottom button is "View
//      stats" only when the reader could actually see round stats (the story
//      card's own eligibility rule); otherwise it is "Close" straight home.
//   3. STATS — not rendered here: "View stats" navigates to
//      `/round-stats?id=…&finish=1`, whose finish mode swaps its back link for
//      a bottom "Close" home. One stats screen, not two.
//
// Twin of `ios/TapScore/Features/Round/FinishFlowView.swift`.

type Stage = 'prompt' | 'board';

const tpl = template(`
    <div bind="root" class="ffl hidden" role="dialog" aria-modal="true" aria-label="Finish round">
        <div bind="prompt" class="ffl__prompt">
            <div class="ffl__prompt-body">
                <p class="ffl__kicker">That was the last hole</p>
                <h1 class="ffl__title">Round complete</h1>
                <p bind="roundName" class="ffl__round"></p>
                <p bind="missing" class="ffl__missing"></p>
                <p bind="err" class="ffl__err"></p>
            </div>
            <div class="ffl__actions">
                <button bind="finishBtn" class="ffl__finish" type="button">Finish round</button>
                <button bind="backBtn" class="ffl__back" type="button">Go back</button>
            </div>
        </div>

        <div bind="board" class="ffl__board hidden">
            <div class="ffl__board-scroll">
                <header class="ffl__board-head">
                    <p class="ffl__kicker">Round finished</p>
                    <h1 class="ffl__title">Final results</h1>
                    <p bind="boardRound" class="ffl__round"></p>
                </header>
                <div bind="leaderboard"></div>
            </div>
            <div class="ffl__bottom">
                <button bind="nextBtn" class="ffl__finish" type="button"></button>
            </div>
        </div>
    </div>
`);

export class FinishFlowComponent extends Component {
    static styles = `
        /* Fullscreen takeover. Above the keypad layers (50–60), below the
           manage sheet (80) and the framework confirms (199/200) — nothing
           else is reachable while it is up anyway. */
        .ffl {
            position: fixed; inset: 0; z-index: 70;
            background: ${t('bg')};
            &.hidden { display: none; }

            & .ffl__kicker {
                margin: 0;
                font-size: 0.78rem; font-weight: 700;
                text-transform: uppercase; letter-spacing: 0.08em;
                color: ${t('accent')};
            }
            & .ffl__title {
                margin: ${s('xs')} 0 0;
                font-family: ${t('font-display')};
                font-weight: 600; font-size: 2rem; letter-spacing: -0.02em;
                color: ${t('text')};
            }
            & .ffl__round {
                margin: ${s('sm')} 0 0;
                color: ${t('text-muted')}; font-size: 0.95rem;
                &:empty { display: none; }
            }
            & .ffl__missing {
                margin: ${s('lg')} 0 0;
                color: ${t('danger')}; font-size: 0.9rem; font-weight: 600;
                &:empty { display: none; }
            }
            & .ffl__err {
                margin: ${s('md')} 0 0;
                color: ${t('danger')}; font-size: 0.85rem;
                &:empty { display: none; }
            }

            & .ffl__finish {
                ${btn()}
                width: 100%;
                min-height: 52px;
                font-family: inherit; font-size: 1rem; font-weight: 700;
                background: ${t('primary')};
                color: ${t('primary-text')};
                border: none;
            }
            & .ffl__back {
                ${btn()}
                width: 100%;
                min-height: 48px;
                font-family: inherit; font-size: 0.95rem; font-weight: 700;
            }

            & .ffl__prompt {
                height: 100%;
                display: flex; flex-direction: column;
                &.hidden { display: none; }
                justify-content: center;
                padding: ${s('2xl')} ${s('xl')} calc(${s('xl')} + env(safe-area-inset-bottom));
                text-align: center;

                & .ffl__prompt-body { flex: 1; display: flex; flex-direction: column; justify-content: center; }
                & .ffl__actions {
                    flex: 0 0 auto;
                    display: flex; flex-direction: column; gap: ${s('sm')};
                }
            }

            & .ffl__board {
                height: 100%;
                display: flex; flex-direction: column;
                &.hidden { display: none; }

                & .ffl__board-scroll {
                    flex: 1; overflow-y: auto;
                    -webkit-overflow-scrolling: touch;
                    padding: ${s('xl')} ${s('lg')} ${s('lg')};
                }
                & .ffl__board-head { margin-bottom: ${s('sm')}; }
                & .ffl__bottom {
                    flex: 0 0 auto;
                    padding: ${s('md')} ${s('lg')} calc(${s('md')} + env(safe-area-inset-bottom));
                    background: ${t('surface')};
                    box-shadow: ${t('shadow-elevated')};
                }
            }
        }
    `;

    private svc = this.inject(RoundViewService);
    private auth = this.inject(AuthService);
    private router = this.inject(Router);

    private stage = new Signal<Stage>('prompt');
    private error = new Signal('');

    render(): DocumentFragment {
        // Every open starts at the prompt with a clean slate — the flow can
        // fire again on the same round (edit a score, complete it again).
        this.track(
            effect(() => {
                if (this.svc.finishFlowOpen.get()) {
                    this.stage.set('prompt');
                    this.error.set('');
                }
            }),
        );

        const frag = this.wire(tpl, {
            root: {
                className: () => (this.svc.finishFlowOpen.get() ? 'ffl' : 'ffl hidden'),
            },
            prompt: {
                className: () =>
                    this.stage.get() === 'prompt' ? 'ffl__prompt' : 'ffl__prompt hidden',
            },
            board: {
                className: () =>
                    this.stage.get() === 'board' ? 'ffl__board' : 'ffl__board hidden',
            },
            roundName: () => this.roundLine(),
            boardRound: () => this.roundLine(),
            missing: () => missingScoresLine(this.missingCount()) ?? '',
            err: () => this.error.get(),
            finishBtn: {
                onclick: () => void this.finish(),
                disabled: () => this.svc.finishing.get(),
            },
            backBtn: { onclick: () => this.svc.finishFlowOpen.set(false) },
            nextBtn: {
                textContent: () => (this.statsEligible() ? 'View stats' : 'Close'),
                onclick: () => this.leave(),
            },
        });

        // The final board is the round leaderboard, re-rendered without the
        // dock. A second instance of the same component over the same shared
        // service — the tab's copy stays mounted and untouched behind it.
        this.spawn(LeaderboardComponent, this.ref(frag, 'leaderboard'));

        // Escape backs out of the prompt the same way "Go back" does. The
        // board stage has no keyboard exit on purpose: by then the round is
        // finished and the button states the one path forward.
        const onKeydown = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            if (this.svc.finishFlowOpen.get() && this.stage.get() === 'prompt') {
                this.svc.finishFlowOpen.set(false);
            }
        };
        window.addEventListener('keydown', onKeydown);
        this.track(() => window.removeEventListener('keydown', onKeydown));

        return frag;
    }

    /** "Round name — course", whichever parts exist. */
    private roundLine(): string {
        const round = this.svc.round.get();
        if (round === null) return '';
        const title = roundHeaderTitle(round);
        const course = (round.courseNameSnapshot ?? '').trim();
        if (course !== '' && course !== title) return `${title} · ${course}`;
        return title;
    }

    private missingCount(): number {
        return unscoredCellCount({
            balls: this.svc.balls.get(),
            groups: this.svc.groups(),
            strokesFor: (ballId, playHoleId) => this.svc.strokesFor(ballId, playHoleId),
        });
    }

    /**
     * The one press that actually finishes. Idempotent server-side, so a round
     * another device already finished lands on the board just the same.
     */
    private async finish(): Promise<void> {
        this.error.set('');
        const res = await this.svc.finishRound();
        if (res === null) {
            this.error.set('Could not finish the round. Try again.');
            return;
        }
        this.stage.set('board');
        // Fresh board for the ceremony — same refetch the leaderboard tab does.
        void this.svc.loadResult();
    }

    /**
     * Whether "View stats" leads anywhere: the story card's exact eligibility
     * rule (signed in → tracks stats here → recorded something → own card
     * full). Anyone else goes straight home.
     */
    private statsEligible(): boolean {
        return (
            evaluateStoryEligibility({
                signedInPlayerId: this.auth.currentUser.get()?.id ?? null,
                statConfigPlayerIds: new Set(this.svc.statModules.get().keys()),
                statRows: this.svc.statRows.get(),
                holesUnscored: holesUnscoredFor({
                    playerId: this.auth.currentUser.get()?.id ?? '',
                    balls: this.svc.balls.get(),
                    groups: this.svc.groups(),
                    strokesFor: (ballId, playHoleId) => this.svc.strokesFor(ballId, playHoleId),
                }),
            }).reason === 'eligible'
        );
    }

    private leave(): void {
        const id = this.svc.round.get()?.id ?? null;
        const eligible = this.statsEligible();
        this.svc.finishFlowOpen.set(false);
        if (eligible && id !== null) {
            this.router.navigate('/round-stats', { query: { id, finish: '1' } });
        } else {
            this.router.navigate('/');
        }
    }
}
