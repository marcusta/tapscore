import { Component, Computed, Signal, effect, template } from '@basics/core/client/core';
import { t } from '../theme';
import { s } from '../css';
import { RoundViewService, ballDisplayName } from './round.service';
import { clampIndex, stepsFromDrag } from './hole-carousel';
import type { RoundBall } from '../api/friendly-rounds.gen';
import type { MetadataInput } from '../api/setup.gen';

// One score column / carousel cell is SLOT wide. The carousel is a clipped
// window that shows exactly two cells — the previous and current hole —
// right-aligned directly above the previous-score and current-score columns
// (golf-serie's HoleHeaderCarousel layout). WINDOW_RADIUS cells are rendered
// off-screen each side so a drag can slide neighbours in before the snap.
const SLOT = 60;
const RIGHT_PAD = 8;
const WINDOW_RADIUS = 4;
const OFFSETS = Array.from({ length: WINDOW_RADIUS * 2 + 1 }, (_, i) => i - WINDOW_RADIUS);
const SNAP = 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1)';

const tpl = template(`
    <div bind="root" class="se hidden">
        <div bind="viewport" class="se__carousel">
            <div class="se__clip">
                <div bind="track" class="se__track"></div>
            </div>
        </div>

        <div bind="rows" class="se__rows"></div>

        <div bind="modal" class="se-modal hidden">
            <div class="se-modal__head">
                <button bind="close" class="se-modal__close" type="button">✕</button>
                <span bind="modalTitle" class="se-modal__title"></span>
                <span class="se-modal__spacer"></span>
            </div>
            <div bind="modalList" class="se-modal__list"></div>
            <div class="se-pad">
                <div bind="extended" class="se-pad__ext hidden">
                    <div class="se-pad__ext-row">
                        <button bind="extMinus" class="se-pad__ext-step" type="button">−</button>
                        <span bind="extVal" class="se-pad__ext-val"></span>
                        <button bind="extPlus" class="se-pad__ext-step" type="button">+</button>
                    </div>
                    <div class="se-pad__ext-actions">
                        <button bind="extCancel" class="se-pad__ext-cancel" type="button">Cancel</button>
                        <button bind="extOk" class="se-pad__ext-ok" type="button">✓</button>
                    </div>
                </div>
                <div bind="metaRow" class="se-meta hidden"></div>
                <div bind="keys" class="se-pad__grid"></div>
                <button bind="metaDone" class="se-done hidden" type="button">Done ›</button>
            </div>
        </div>

        <div bind="toast" class="se-toast hidden"></div>
    </div>
`);

const holeTpl = template(`
    <div bind="item" class="se-hole">
        <span bind="hnum" class="se-hole__num"></span>
        <span bind="hpar" class="se-hole__par"></span>
    </div>
`);

const rowTpl = template(`
    <div class="se-row">
        <div class="se-row__who">
            <span bind="name" class="se-row__name"></span>
            <span bind="topar" class="se-row__topar"></span>
        </div>
        <div class="se-row__scores">
            <span class="se-row__slot"><span bind="prev" class="se-row__prev"></span></span>
            <span class="se-row__slot"><button bind="circle" class="se-row__circle" type="button"><span bind="cval"></span></button></span>
        </div>
    </div>
`);

const mrowTpl = template(`
    <button bind="mrow" class="se-mrow" type="button">
        <div class="se-mrow__who">
            <span bind="mname" class="se-mrow__name"></span>
            <span bind="mhcp" class="se-mrow__hcp"></span>
        </div>
        <div bind="mcircle" class="se-mrow__circle"><span bind="mval"></span></div>
    </button>
`);

const keyTpl = template(`
    <button bind="key" class="se-key" type="button">
        <span bind="num" class="se-key__num"></span>
        <span bind="lbl" class="se-key__lbl"></span>
    </button>
`);

const chipTpl = template(`<button bind="chip" class="se-chip" type="button"></button>`);

interface PointerState {
    id: number;
    startX: number;
    startY: number;
    lastX: number;
    lastTime: number;
    velocity: number;
    horiz: boolean;
}

/**
 * The trust-based on-course score-entry experience for `/round?token=`, ported
 * from golf-serie's custom mobile ScoreEntry: a clipped swipeable hole-header
 * carousel (previous + current hole, aligned over the score columns), tappable
 * per-player score circles with running to-par, and a fullscreen dark keypad
 * (par-aware labels, 10+ stepper, clear→no-result, pickup→0) that auto-advances
 * to the next unscored ball and then the next hole.
 */
export class ScoreEntryComponent extends Component {
    static styles = `
        .se {
            margin-top: ${s('xl')};
            &.hidden { display: none; }
        }

        /* Clipped two-cell carousel right-aligned over the score columns. */
        .se__carousel {
            position: relative;
            height: 60px;
            overflow: hidden;
            border-radius: ${t('radius')};
            background: ${t('surface-sunken')};
            border: 1px solid ${t('border')};
            touch-action: pan-y;
            user-select: none;
        }
        .se__clip {
            position: absolute;
            top: 0;
            bottom: 0;
            right: ${RIGHT_PAD}px;
            width: ${SLOT * 2}px;
            overflow: hidden;
        }
        .se__track {
            position: absolute;
            top: 0;
            bottom: 0;
            right: ${-WINDOW_RADIUS * SLOT}px;
            display: flex;
            align-items: center;
            will-change: transform;
        }
        .se-hole {
            flex: 0 0 ${SLOT}px;
            width: ${SLOT}px;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 1px;
            opacity: 0.5;
            transform: scale(0.84);
            transition: opacity 180ms ease, transform 180ms ease;

            &.active { opacity: 1; transform: scale(1); }
            &.gone { opacity: 0; }

            & .se-hole__num {
                font-family: ${t('font-display')};
                font-weight: 700;
                font-size: 1.2rem;
                color: ${t('text')};
            }
            & .se-hole__par {
                font-size: 0.68rem;
                color: ${t('text-muted')};
            }
        }

        .se__rows {
            margin-top: ${s('sm')};
            border-top: 1px solid ${t('border')};
        }
        .se-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: ${s('md')};
            padding: ${s('md')} 0;
            border-bottom: 1px solid ${t('border')};

            & .se-row__who { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
            & .se-row__name {
                font-family: ${t('font-display')};
                font-weight: 600;
                font-size: 1.05rem;
                color: ${t('text')};
                overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
            }
            & .se-row__topar { font-size: 0.8rem; font-weight: 600; }

            & .se-row__scores { display: flex; align-items: center; padding-right: ${RIGHT_PAD}px; flex-shrink: 0; }
            & .se-row__slot { width: ${SLOT}px; display: flex; align-items: center; justify-content: center; }
            & .se-row__prev {
                font-family: ${t('font-display')}; font-weight: 700; font-size: 1.05rem;
                color: ${t('text-muted')};
                font-variant-numeric: tabular-nums;
            }
            & .se-row__circle {
                width: 48px; height: 48px; border-radius: 999px;
                border: none; cursor: pointer;
                background: ${t('accent-soft')};
                font-family: ${t('font-display')}; font-weight: 700; font-size: 1.25rem;
                color: ${t('primary')};
                font-variant-numeric: tabular-nums;
                transition: background 0.15s;
                &:active { background: ${t('accent')}; }
                &.empty { color: ${t('text-muted')}; background: ${t('surface-sunken')}; }
            }
        }
        .se-row__topar.under { color: ${t('under-par')}; }
        .se-row__topar.over { color: ${t('over-par')}; }
        .se-row__topar.even { color: ${t('text-muted')}; }

        /* --- Fullscreen dark keypad modal --- */
        .se-modal {
            position: fixed; inset: 0; z-index: 50;
            display: flex; flex-direction: column;
            background: #121212; color: #fff;
            &.hidden { display: none; }
        }
        .se-modal__head {
            display: flex; align-items: center; justify-content: space-between;
            padding: ${s('md')} ${s('lg')};
            border-bottom: 1px solid rgba(255,255,255,0.1);

            & .se-modal__close {
                background: none; border: none; color: #fff; font-size: 1.3rem;
                width: 40px; height: 40px; border-radius: 999px; cursor: pointer;
                &:active { background: rgba(255,255,255,0.1); }
            }
            & .se-modal__title { font-family: ${t('font-display')}; font-weight: 700; font-size: 1.1rem; }
            & .se-modal__spacer { width: 40px; }
        }
        .se-modal__list { flex: 1; overflow-y: auto; }
        .se-mrow {
            width: 100%;
            display: flex; align-items: center; justify-content: space-between;
            padding: ${s('lg')};
            background: none; border: none; border-left: 4px solid transparent;
            border-bottom: 1px solid rgba(255,255,255,0.08);
            color: #fff; font-family: inherit; cursor: pointer; text-align: left;

            &.sel { border-left-color: ${t('primary')}; background: rgba(93,155,117,0.14); }

            & .se-mrow__who { display: flex; flex-direction: column; gap: 2px; }
            & .se-mrow__name { font-family: ${t('font-display')}; font-weight: 600; font-size: 1rem; }
            & .se-mrow__hcp { font-size: 0.8rem; color: rgba(255,255,255,0.55); }

            & .se-mrow__circle {
                width: 52px; height: 52px; border-radius: 999px;
                display: flex; align-items: center; justify-content: center;
                background: ${t('primary')};
                font-family: ${t('font-display')}; font-weight: 700; font-size: 1.25rem;
                font-variant-numeric: tabular-nums;
            }
            &.sel .se-mrow__circle { background: #fff; color: ${t('primary')}; }
        }

        .se-pad { position: relative; padding: ${s('sm')} ${s('sm')} ${s('xl')}; background: #1c1c1e; }
        .se-meta {
            display: flex; gap: ${s('sm')}; flex-wrap: wrap;
            padding: 0 2px ${s('sm')};
            &.hidden { display: none; }

            & .se-chip {
                border: 1px solid rgba(255, 255, 255, 0.25);
                border-radius: 999px;
                background: transparent;
                color: rgba(255, 255, 255, 0.82);
                font-family: inherit;
                font-size: 0.85rem;
                font-weight: 700;
                padding: 8px 16px;
                cursor: pointer;
                &:active { background: rgba(255, 255, 255, 0.08); }
                &.on { background: ${t('primary')}; border-color: ${t('primary')}; color: #fff; }
            }
        }
        .se-pad__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
        .se-done {
            margin-top: 6px;
            width: 100%;
            height: 52px;
            border: none;
            border-radius: 10px;
            background: ${t('primary')};
            color: #fff;
            font-family: ${t('font-display')};
            font-weight: 700;
            font-size: 1.05rem;
            cursor: pointer;
            &:active { filter: brightness(1.1); }
            &.hidden { display: none; }
        }
        .se-key {
            height: 56px; border-radius: 10px; border: none; cursor: pointer;
            background: #2a2a2a; color: #fff; font-family: inherit;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            &:active { background: #3a3a3a; }
            &.par { background: ${t('primary')}; }
            &.clear { color: ${t('error')}; }
            &.muted { color: rgba(255,255,255,0.5); }

            & .se-key__num { font-size: 1.3rem; font-weight: 700; font-family: ${t('font-display')}; }
            & .se-key__lbl { font-size: 0.62rem; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; opacity: 0.75; margin-top: 1px; }
        }

        .se-pad__ext {
            position: absolute; inset: 0; z-index: 10;
            background: #1c1c1e; display: flex; flex-direction: column;
            padding: ${s('sm')} ${s('sm')} ${s('xl')};
            &.hidden { display: none; }

            & .se-pad__ext-row { flex: 1; display: flex; align-items: center; justify-content: center; gap: ${s('xl')}; }
            & .se-pad__ext-step {
                width: 60px; height: 60px; border-radius: 999px; border: none; cursor: pointer;
                background: #2a2a2a; color: #fff; font-size: 1.8rem; line-height: 1;
                &:active { background: #3a3a3a; }
            }
            & .se-pad__ext-val { width: 72px; text-align: center; font-family: ${t('font-display')}; font-weight: 700; font-size: 2.6rem; color: #fff; }
            & .se-pad__ext-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
            & .se-pad__ext-cancel { height: 52px; border-radius: 10px; border: none; cursor: pointer; background: #2a2a2a; color: #fff; font-weight: 600; font-family: inherit; }
            & .se-pad__ext-ok { height: 52px; border-radius: 10px; border: none; cursor: pointer; background: ${t('primary')}; color: #fff; font-size: 1.3rem; }
        }

        .se-toast {
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            z-index: 60;
            background: ${t('primary')}; color: ${t('primary-text')};
            font-family: ${t('font-display')}; font-weight: 700;
            padding: ${s('md')} ${s('xl')}; border-radius: ${t('radius')};
            box-shadow: ${t('shadow-elevated')};
            &.hidden { display: none; }
        }
    `;

    private svc = this.inject(RoundViewService);

    // Hole/group navigation lives in RoundViewService so the orange hole-info
    // bar (rendered by RoundComponent) and this carousel stay in lock-step.
    private holeIdx = this.svc.holeIdx;
    private modalOpen = new Signal(false);
    private currentBallIdx = new Signal(0);
    private extendedOpen = new Signal(false);
    private extendedScore = new Signal(10);
    // Per-hole metadata toggles (umbrella GIR/fairway) for the open ball+hole,
    // committed alongside strokes. Reseeded from stored state when the selected
    // ball/hole changes (`lastMetaKey` guards against clobbering live toggles).
    private pendingMeta = new Signal<Record<string, boolean>>({});
    private lastMetaKey: string | null = null;
    private toastMsg = new Signal<string | null>(null);
    private dragOffset = new Signal(0);
    private transitioning = new Signal(false);
    private ptr: PointerState | null = null;
    private pendingSteps: number | null = null;
    private settleTimer: ReturnType<typeof setTimeout> | null = null;
    private advanceTimer: ReturnType<typeof setTimeout> | null = null;
    private flashTimer: ReturnType<typeof setTimeout> | null = null;

    private hasScoring = new Computed(() => this.svc.balls.get().length > 0);

    // --- Itinerary navigation — delegates to the shared RoundViewService state
    // (tracked reads) so the carousel and the orange hole bar move together. ---
    private group = () => this.svc.group();
    private playedOrder = () => this.svc.playedOrder();
    private holeIndex = () => this.svc.holeIndex();
    private currentHole = () => this.svc.currentPlayedHole();
    private occAtOffset = (offset: number) => {
        const po = this.playedOrder();
        return po[clampIndex(this.holeIndex() + offset, po.length)] ?? null;
    };
    private ballsInGroup = (): RoundBall[] => {
        const g = this.group();
        if (!g) return [];
        const byId = new Map(this.svc.balls.get().map((b) => [b.id, b]));
        return g.ballIds.map((id) => byId.get(id)).filter((b): b is RoundBall => !!b);
    };

    private parFor = (playHoleId: string | null) => this.svc.parFor(playHoleId);
    private occLabel = (playHoleId: string): string => this.svc.occLabel(playHoleId);
    private ballName = (b: RoundBall) => ballDisplayName(b);

    /** Boolean metadata toggles applicable to the current hole (umbrella GIR/fairway). */
    private metaInputs = (): MetadataInput[] =>
        this.svc.metadataInputsForHole(this.svc.currentPlayHole()).filter((m) => m.kind === 'boolean');

    /** Strokes display: no-result → "–", pickup(0) → "0", else the count. */
    private displayScore = (strokes: number | null): string =>
        strokes === null ? '–' : String(strokes);

    /** Running to-par over scored holes (>0 strokes; pickup/no-result excluded). */
    private toParValue = (ball: RoundBall): number | null => {
        let shots = 0;
        let par = 0;
        let any = false;
        for (const occ of this.playedOrder()) {
            const st = this.svc.strokesFor(ball.id, occ.playHoleId);
            if (st !== null && st > 0) {
                shots += st;
                par += this.parFor(occ.playHoleId);
                any = true;
            }
        }
        return any ? shots - par : null;
    };

    private toParText = (ball: RoundBall): string => {
        const v = this.toParValue(ball);
        return v === null ? '–' : v === 0 ? 'E' : v > 0 ? `+${v}` : `${v}`;
    };
    private toParClass = (ball: RoundBall): string => {
        const v = this.toParValue(ball);
        const tone = v === null || v === 0 ? 'even' : v < 0 ? 'under' : 'over';
        return `se-row__topar ${tone}`;
    };

    private scoreLabel = (score: number, par: number): string => {
        if (score === 1) return 'HIO';
        const d = score - par;
        if (d <= -4 || d >= 5) return 'OTHER';
        return (
            { '-3': 'ALBA', '-2': 'EAGLE', '-1': 'BIRDIE', '0': 'PAR', '1': 'BOGEY', '2': 'DOUBLE', '3': 'TRIPLE', '4': 'QUAD' } as Record<string, string>
        )[String(d)] ?? '';
    };

    render(): DocumentFragment {
        this.track(() => {
            if (this.advanceTimer) clearTimeout(this.advanceTimer);
            if (this.flashTimer) clearTimeout(this.flashTimer);
            if (this.settleTimer) clearTimeout(this.settleTimer);
        });
        // Keep the selected ball in range as the group (and its ball count) changes.
        this.track(
            effect(() => {
                const n = this.ballsInGroup().length;
                if (n > 0 && this.currentBallIdx.get() >= n) this.currentBallIdx.set(0);
            }),
        );

        const frag = this.wire(tpl, {
            root: { className: () => (this.hasScoring.get() ? 'se' : 'se hidden') },
            close: { onclick: () => this.modalOpen.set(false) },
            modal: { className: () => (this.modalOpen.get() ? 'se-modal' : 'se-modal hidden') },
            modalTitle: () => {
                const ph = this.currentHole();
                return ph ? `Hole ${this.occLabel(ph.playHoleId)} · Par ${this.parFor(ph.playHoleId)}` : '';
            },
            extended: { className: () => (this.extendedOpen.get() ? 'se-pad__ext' : 'se-pad__ext hidden') },
            extVal: () => String(this.extendedScore.get()),
            extMinus: { onclick: () => this.extendedScore.set(Math.max(10, this.extendedScore.get() - 1)) },
            extPlus: { onclick: () => this.extendedScore.set(this.extendedScore.get() + 1) },
            extCancel: { onclick: () => this.extendedOpen.set(false) },
            extOk: {
                onclick: () => {
                    this.extendedOpen.set(false);
                    this.commit(this.extendedScore.get());
                },
            },
            toast: {
                className: () => (this.toastMsg.get() ? 'se-toast' : 'se-toast hidden'),
                textContent: () => this.toastMsg.get() ?? '',
            },
            // When the hole expects metadata (umbrella GIR/fairway), entering a
            // score does NOT auto-advance — this button does, so the player can
            // mark GIR/fairway after the stroke. Hidden for strokes-only holes.
            metaDone: {
                className: () => (this.metaInputs().length > 0 ? 'se-done' : 'se-done hidden'),
                onclick: () => this.advance(),
            },
        });

        // Carousel — windowed cells (one fixed slot per offset, content reactive)
        // plus a pointer-driven, momentum-snapping transform.
        const viewport = this.ref(frag, 'viewport');
        const track = this.ref(frag, 'track');
        this.bindCarouselPointer(viewport, track);
        this.track(
            effect(() => {
                track.style.transition = this.transitioning.get() ? SNAP : 'none';
                track.style.transform = `translateX(${this.dragOffset.get()}px)`;
            }),
        );
        this.$each(
            track,
            new Computed(() => OFFSETS),
            (offset, _i, t2) => this.holeItem(offset, t2),
            (offset) => offset,
        );

        // Main player rows for the current hole.
        this.$each(
            this.ref(frag, 'rows'),
            new Computed(() => {
                const po = this.playedOrder();
                const idx = this.holeIndex();
                const ph = po[idx];
                if (!ph) return [] as { ball: RoundBall; ph: string; prevPh: string | null }[];
                const prevPh = idx > 0 ? po[idx - 1]!.playHoleId : null;
                return this.ballsInGroup().map((ball) => ({ ball, ph: ph.playHoleId, prevPh }));
            }),
            (d, _i, t2) => this.playerRow(d.ball, d.ph, d.prevPh, t2),
            (d) => `${d.ball.id}|${d.ph}`,
        );

        // Modal player list (stable per ball; reactive score + selection).
        this.$each(
            this.ref(frag, 'modalList'),
            new Computed(() => this.ballsInGroup()),
            (ball, i, t2) => this.modalRow(ball, i, t2),
            (ball) => ball.id,
        );

        // Keypad — 1..9, then 10+, clear, pickup.
        const keysHost = this.ref(frag, 'keys');
        for (const n of [1, 2, 3, 4, 5, 6, 7, 8, 9]) keysHost.appendChild(this.numberKey(n));
        keysHost.appendChild(this.specialKey('10+', '', 'se-key', () => this.openExtended()));
        keysHost.appendChild(this.specialKey('✕', 'clear', 'se-key clear', () => this.commit(null)));
        keysHost.appendChild(this.specialKey('0', 'pick up', 'se-key muted', () => this.commit(0)));

        // Per-hole metadata toggles (umbrella GIR/fairway), declared by the
        // format and scoped to the hole's par via `appliesWhen`. Absent for
        // strokes-only rounds, so the keypad is unchanged for every other format.
        const metaHost = this.ref(frag, 'metaRow');
        this.track(
            effect(() => {
                metaHost.className = this.metaInputs().length > 0 ? 'se-meta' : 'se-meta hidden';
            }),
        );
        this.$each(
            metaHost,
            new Computed(() => this.metaInputs()),
            (mi, _i, track) => this.metaChip(mi, track),
            (mi) => mi.key,
        );
        // Reseed the toggles from stored state whenever the open ball/hole
        // changes (never on a same-hole cell update, so live toggles survive).
        this.track(
            effect(() => {
                if (!this.modalOpen.get()) {
                    this.lastMetaKey = null;
                    return;
                }
                const ball = this.ballsInGroup()[this.currentBallIdx.get()];
                const ph = this.currentHole();
                if (!ball || !ph) return;
                const key = `${ball.id}|${ph.playHoleId}`;
                if (key === this.lastMetaKey) return;
                this.lastMetaKey = key;
                const seed: Record<string, boolean> = {};
                for (const mi of this.metaInputs())
                    seed[mi.key] = this.svc.metadataFor(ball.id, ph.playHoleId, mi.key) === true;
                this.pendingMeta.set(seed);
            }),
        );

        return frag;
    }

    private holeItem(offset: number, track: (d: () => void) => void): HTMLElement {
        return this.wireEl(
            holeTpl,
            {
                item: {
                    className: () => {
                        // The previous slot is empty on the first hole (nothing before it).
                        const restingHidden = offset === -1 && this.holeIndex() <= 0;
                        return `se-hole${offset === 0 ? ' active' : ''}${restingHidden ? ' gone' : ''}`;
                    },
                },
                hnum: { textContent: () => { const o = this.occAtOffset(offset); return o ? this.occLabel(o.playHoleId) : ''; } },
                hpar: { textContent: () => { const o = this.occAtOffset(offset); return o ? `Par ${this.parFor(o.playHoleId)}` : ''; } },
            },
            track,
        );
    }

    private playerRow(
        ball: RoundBall,
        playHoleId: string,
        prevPlayHoleId: string | null,
        track: (d: () => void) => void,
    ): HTMLElement {
        return this.wireEl(
            rowTpl,
            {
                name: { textContent: this.ballName(ball) },
                topar: {
                    textContent: () => this.toParText(ball),
                    className: () => this.toParClass(ball),
                },
                prev: {
                    textContent: () =>
                        prevPlayHoleId ? this.displayScore(this.svc.strokesFor(ball.id, prevPlayHoleId)) : '',
                },
                cval: { textContent: () => this.displayScore(this.svc.strokesFor(ball.id, playHoleId)) },
                circle: {
                    className: () =>
                        this.svc.strokesFor(ball.id, playHoleId) === null
                            ? 'se-row__circle empty'
                            : 'se-row__circle',
                    onclick: () => this.openModalForBall(ball.id),
                },
            },
            track,
        );
    }

    private modalRow(ball: RoundBall, index: number, track: (d: () => void) => void): HTMLElement {
        const hcp =
            ball.players.length > 1
                ? `Team · CH ${ball.courseHandicap}`
                : `CH ${ball.players[0]?.courseHandicap ?? ball.courseHandicap}`;
        return this.wireEl(
            mrowTpl,
            {
                mrow: {
                    className: () => (this.currentBallIdx.get() === index ? 'se-mrow sel' : 'se-mrow'),
                    onclick: () => this.currentBallIdx.set(index),
                },
                mname: { textContent: this.ballName(ball) },
                mhcp: { textContent: hcp },
                mval: {
                    textContent: () => {
                        const ph = this.currentHole();
                        return ph ? this.displayScore(this.svc.strokesFor(ball.id, ph.playHoleId)) : '–';
                    },
                },
            },
            track,
        );
    }

    private numberKey(n: number): HTMLElement {
        return this.wireEl(keyTpl, {
            key: {
                className: () => {
                    const ph = this.currentHole();
                    const isPar = ph ? n === this.parFor(ph.playHoleId) : false;
                    return isPar ? 'se-key par' : 'se-key';
                },
                onclick: () => this.commit(n),
            },
            num: { textContent: String(n) },
            lbl: {
                textContent: () => {
                    const ph = this.currentHole();
                    return ph ? this.scoreLabel(n, this.parFor(ph.playHoleId)) : '';
                },
            },
        });
    }

    private specialKey(num: string, label: string, className: string, onclick: () => void): HTMLElement {
        return this.wireEl(keyTpl, {
            key: { className, onclick },
            num: { textContent: num },
            lbl: { textContent: label },
        });
    }

    private openModalForBall(ballId: string): void {
        const idx = this.ballsInGroup().findIndex((b) => b.id === ballId);
        this.currentBallIdx.set(idx < 0 ? 0 : idx);
        this.extendedOpen.set(false);
        this.modalOpen.set(true);
    }

    private openExtended(): void {
        this.extendedScore.set(10);
        this.extendedOpen.set(true);
    }

    /** Record `value` for the selected ball on the current hole, then advance. */
    private commit(value: number | null): void {
        const balls = this.ballsInGroup();
        const ph = this.currentHole();
        const ball = balls[this.currentBallIdx.get()];
        if (!ph || !ball) return;
        // Clearing a hole carries no metadata; a real/pickup score carries the
        // COMPLETE toggle snapshot so the latest event's blob is authoritative.
        const meta = value === null ? undefined : this.metaSnapshot();
        void this.svc.setScore(ball.id, ph.playHoleId, value, meta);
        // Strokes-only holes auto-advance for fast entry; holes that expect
        // metadata stay put so the player can mark GIR/fairway, then tap Done.
        if (this.metaInputs().length === 0) this.advance();
    }

    /** Explicit booleans for every applicable toggle (so turning one OFF persists). */
    private metaSnapshot(): Record<string, unknown> | undefined {
        const inputs = this.metaInputs();
        if (inputs.length === 0) return undefined;
        const pending = this.pendingMeta.get();
        const out: Record<string, unknown> = {};
        for (const mi of inputs) out[mi.key] = pending[mi.key] === true;
        return out;
    }

    private toggleMeta(key: string): void {
        const cur = this.pendingMeta.get();
        this.pendingMeta.set({ ...cur, [key]: !(cur[key] === true) });
        // If a score is already in for this ball+hole, persist the toggle right
        // away (re-send strokes + the full snapshot) so it survives without
        // re-tapping the number. Before a score exists it rides on the commit.
        const ball = this.ballsInGroup()[this.currentBallIdx.get()];
        const ph = this.currentHole();
        if (!ball || !ph) return;
        const strokes = this.svc.strokesFor(ball.id, ph.playHoleId);
        if (strokes !== null) void this.svc.setScore(ball.id, ph.playHoleId, strokes, this.metaSnapshot());
    }

    private metaChip(mi: MetadataInput, track: (d: () => void) => void): HTMLElement {
        return this.wireEl(
            chipTpl,
            {
                chip: {
                    textContent: mi.label,
                    className: () => (this.pendingMeta.get()[mi.key] ? 'se-chip on' : 'se-chip'),
                    onclick: () => this.toggleMeta(mi.key),
                },
            },
            track,
        );
    }

    /**
     * Move to the next ball with no score on this hole; once every ball is
     * scored, flash a confirmation and advance to the next hole (keeping the
     * keypad up for fast entry). The last hole closes the keypad.
     */
    private advance(): void {
        const balls = this.ballsInGroup();
        const ph = this.currentHole();
        if (!ph) return;
        const scored = (i: number) => this.svc.strokesFor(balls[i]!.id, ph.playHoleId) !== null;
        const cur = this.currentBallIdx.get();
        for (let i = cur + 1; i < balls.length; i++) if (!scored(i)) return this.currentBallIdx.set(i);
        for (let i = 0; i < cur; i++) if (!scored(i)) return this.currentBallIdx.set(i);

        const po = this.playedOrder();
        const idx = this.holeIndex();
        if (idx >= po.length - 1) {
            this.flash('Round complete');
            this.modalOpen.set(false);
            return;
        }
        this.flash(`Hole ${this.occLabel(ph.playHoleId)} done`);
        const fromPh = ph.playHoleId;
        if (this.advanceTimer) clearTimeout(this.advanceTimer);
        this.advanceTimer = setTimeout(() => {
            this.advanceTimer = null;
            // Only auto-advance if still on the hole that completed — a manual
            // swipe during the pause must not yank the user to the wrong hole.
            if (this.currentHole()?.playHoleId !== fromPh) return;
            this.holeIdx.set(clampIndex(this.holeIndex() + 1, this.playedOrder().length));
            this.currentBallIdx.set(0);
        }, 700);
    }

    private flash(msg: string): void {
        this.toastMsg.set(msg);
        if (this.flashTimer) clearTimeout(this.flashTimer);
        this.flashTimer = setTimeout(() => {
            this.flashTimer = null;
            if (this.toastMsg.get() === msg) this.toastMsg.set(null);
        }, 1100);
    }

    // --- Carousel pointer + momentum snap (windowed: transform is just the drag
    // offset; on release we animate to the snapped offset, then recenter the
    // window by changing the hole and resetting the offset to 0). ---

    private snap(steps: number): void {
        this.pendingSteps = steps;
        this.transitioning.set(true);
        this.dragOffset.set(-steps * SLOT);
        if (this.settleTimer) clearTimeout(this.settleTimer);
        this.settleTimer = setTimeout(() => this.finishSettle(), 420);
    }

    private finishSettle(): void {
        if (this.pendingSteps === null) return;
        const steps = this.pendingSteps;
        this.pendingSteps = null;
        if (this.settleTimer) {
            clearTimeout(this.settleTimer);
            this.settleTimer = null;
        }
        // Transition OFF before recentering, so changing the hole (which slides
        // the snapped cell into the current slot) doesn't animate a jump back.
        this.transitioning.set(false);
        if (steps !== 0) {
            this.holeIdx.set(clampIndex(this.holeIndex() + steps, this.playedOrder().length));
        }
        this.dragOffset.set(0);
    }

    private bindCarouselPointer(viewport: HTMLElement, track: HTMLElement): void {
        track.addEventListener('transitionend', (e) => {
            if ((e as TransitionEvent).propertyName === 'transform') this.finishSettle();
        });
        viewport.addEventListener('pointerdown', (e: PointerEvent) => {
            if (this.ptr || this.transitioning.get() || this.playedOrder().length <= 1) return;
            this.ptr = {
                id: e.pointerId,
                startX: e.clientX,
                startY: e.clientY,
                lastX: e.clientX,
                lastTime: Date.now(),
                velocity: 0,
                horiz: false,
            };
            this.dragOffset.set(0);
            viewport.setPointerCapture?.(e.pointerId);
        });
        viewport.addEventListener('pointermove', (e: PointerEvent) => {
            const p = this.ptr;
            if (!p || p.id !== e.pointerId) return;
            const dx = e.clientX - p.startX;
            const dy = e.clientY - p.startY;
            if (!p.horiz) {
                if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) return;
                if (Math.abs(dx) <= 8) return;
                p.horiz = true;
            }
            const now = Date.now();
            const elapsed = Math.max(1, now - p.lastTime);
            p.velocity = (e.clientX - p.lastX) / elapsed;
            p.lastX = e.clientX;
            p.lastTime = now;
            this.dragOffset.set(dx);
        });
        const end = (e: PointerEvent) => {
            const p = this.ptr;
            if (!p || p.id !== e.pointerId) return;
            const dragDistance = e.clientX - p.startX;
            const wasHoriz = p.horiz;
            this.ptr = null;
            viewport.releasePointerCapture?.(e.pointerId);
            if (!wasHoriz) {
                this.dragOffset.set(0);
                return;
            }
            this.snap(stepsFromDrag({ dragDistance, velocity: p.velocity, itemWidth: SLOT }));
        };
        viewport.addEventListener('pointerup', end);
        viewport.addEventListener('pointercancel', (e: PointerEvent) => {
            if (!this.ptr || this.ptr.id !== e.pointerId) return;
            this.ptr = null;
            viewport.releasePointerCapture?.(e.pointerId);
            this.snap(0);
        });
    }
}
