import { Component, template } from '@basics/core/client/core';
import { t } from '../theme';
import { s, card } from '../css';
import { RoundViewService } from './round.service';
import { renderSlotCards, renderSlotLeaderboard } from './result-render';
import type { SlotResultView } from '../api/friendly-rounds.gen';

const tpl = template(`
    <div bind="root" class="lb">
        <div bind="status" class="lb__status hidden"></div>
        <div bind="body" class="lb__body"></div>
    </div>
`);

/**
 * The no-login leaderboard for `/round?token=` (2.6e M5). The round-level format
 * pill row picks which slot is shown (shared `RoundViewService.selectedSlot`);
 * each slot renders generic
 * canonical sections — ranked metrics, match summaries, and the format-aware
 * "full scorecard" cards (deferred here from M4). The client never interprets a
 * scoring-mode string; `result-render` lays out whatever sections the server
 * built, resolving ball ids → live names from `RoundViewService`.
 */
export class LeaderboardComponent extends Component {
    static styles = `
        .lb {
            /* Horizontal gutters come from the host panel (.round-view__main
               already pads lg) — padding here would double-indent every
               section relative to the page header and waste table width. */
            padding: ${s('lg')} 0 ${s('2xl')};

            & .lb__status {
                color: ${t('text-muted')};
                padding: ${s('xl')} 0;
                text-align: center;
                &.hidden { display: none; }
            }

            & .lb-empty {
                color: ${t('text-muted')};
                padding: ${s('xl')} 0;
                text-align: center;
            }
            & .lb-diag {
                ${card()}
                padding: ${s('md')} ${s('lg')};
                color: ${t('error')};
                font-size: 0.85rem;
                margin-bottom: ${s('md')};
                & code { font-family: ui-monospace, monospace; }
            }

            /* Ranked metric + match-summary sections. */
            & .lb-section { margin-bottom: ${s('xl')}; }
            & .lb-section__title {
                margin: 0 0 ${s('sm')};
                font-family: ${t('font-display')};
                font-weight: 600;
                font-size: 1rem;
                color: ${t('text')};
            }
            & .lb-rank {
                width: 100%;
                border-collapse: collapse;
                font-variant-numeric: tabular-nums;
                table-layout: fixed;
            }
            & .lb-rank__col-pos { width: 2.25rem; }
            & .lb-rank__col-total { width: 3.25rem; }
            & .lb-rank__col-pace { width: 3.25rem; }
            & .lb-rank__col-thru { width: 3rem; }
            & .lb-rank th,
            & .lb-rank td {
                vertical-align: middle;
            }
            & .lb-rank thead th {
                height: 1.65rem;
                font-size: 0.7rem;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: ${t('text-muted')};
                font-weight: 700;
                line-height: 1;
                padding: 0 ${s('sm')};
                border-bottom: 1px solid ${t('border')};
            }
            & .lb-rank tbody td {
                height: 2.25rem;
                padding: 0 ${s('sm')};
                border-bottom: 1px solid ${t('border')};
                font-size: 0.95rem;
                line-height: 1.1;
            }
            & .lb-rank__pos { text-align: center; font-weight: 700; color: ${t('text-muted')}; }
            & .lb-rank__who {
                text-align: left;
                font-weight: 600;
                font-family: ${t('font-display')};
            }
            /* Flex INSIDE the cell, not on the <td> itself: a display:flex td
               drops out of table layout and stops centring vertically, which
               left names riding above the numbers on their own row. The inner
               box keeps the ellipsis behaviour — a long NAME truncates while
               the group tag stays whole ("Gr…" bug). */
            & .lb-rank__whobox {
                display: flex;
                align-items: baseline;
                min-width: 0;
            }
            & .lb-rank__name {
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                min-width: 0;
            }
            & .lb-rank__total { text-align: right; font-weight: 800; font-size: 1.05rem; }
            /* Pace delta lives in its own column: adjacent to the total but
               visually separate (lighter weight, muted) so "33" and "−3" can
               never read as one number. */
            & .lb-rank__pace {
                text-align: right;
                font-weight: 700;
                font-size: 0.9rem;
                color: ${t('text-muted')};
                padding-left: 0;
            }
            & .lb-rank thead th.lb-rank__pace { font-weight: 700; }
            /* Worse than pace (+N) reads like over par; better (−N) like under
               par — same two colours the scorecard already uses. */
            & .lb-rank__pace--over { color: ${t('over-par')}; }
            & .lb-rank__pace--under { color: ${t('under-par')}; }
            /* Phase 3.5: group tag next to a player's name — only rendered when
               the round has 2+ playing groups (single-group rounds get nothing,
               same look as before this phase). */
            & .lb-rank__group {
                font-size: 0.7rem;
                font-weight: 600;
                color: ${t('text-muted')};
                margin-left: ${s('xs')};
                flex: none;
                white-space: nowrap;
            }
            & .lb-rank__thru { text-align: right; color: ${t('text-muted')}; }
            & .lb-rank__lead td { background: ${t('accent-soft')}; }
            & .lb-rank__lead .lb-rank__pos { color: ${t('accent')}; }

            /* Structured match panel: two team blocks + a centre standing. */
            & .lb-mp {
                display: grid; grid-template-columns: 1fr auto 1fr; align-items: stretch;
                border: 1px solid ${t('border')}; border-radius: 10px; overflow: hidden;
                margin-top: ${s('sm')};
            }
            & .lb-mp__team {
                padding: ${s('sm')} ${s('md')}; font-weight: 700; font-size: 0.9rem;
                display: flex; align-items: center;
            }
            & .lb-mp__team--a { color: #c2452f; }
            & .lb-mp__team--b { color: #2c6cae; justify-content: flex-end; text-align: right; }
            & .lb-mp__team--a.lb-mp__team--lead { background: #c2452f; color: #fff; }
            & .lb-mp__team--b.lb-mp__team--lead { background: #2c6cae; color: #fff; }
            & .lb-mp__center {
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                padding: ${s('xs')} ${s('md')}; gap: 1px;
            }
            & .lb-mp__standing { font-size: 1.25rem; font-weight: 800; line-height: 1; }
            & .lb-mp__status { font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.04em; color: ${t('text-muted')}; }

            /* Format-aware scorecard cards. */
            & .lb-cards__head {
                margin: ${s('xl')} 0 ${s('md')};
                font-family: ${t('font-display')};
                font-weight: 600;
                font-size: 1.1rem;
                color: ${t('text')};
            }
            & .lb-card {
                ${card()}
                padding: ${s('md')};
                margin-bottom: ${s('lg')};
            }
            & .lb-card--compact-match {
                border-color: color-mix(in srgb, ${t('accent')} 28%, ${t('border')});
                padding-top: ${s('sm')};
            }
            & .lb-card--category-matrix .lb-grid {
                font-size: 0.72rem;
                table-layout: auto;
                width: max-content;
                min-width: 100%;
            }
            & .lb-card--category-matrix .lb-grid th,
            & .lb-card--category-matrix .lb-grid td {
                padding: 2px 1px;
            }
            & .lb-card--category-matrix .lb-grid .lb-rowlabel {
                width: 5.8em;
                min-width: 5.8em;
                text-overflow: clip;
            }
            & .lb-card--category-matrix .lb-grid .lb-sum {
                width: 2.8em;
                min-width: 2.8em;
            }
            & .lb-card--category-matrix .lb-grid .lb-r-cat td {
                line-height: 1.1;
            }
            & .lb-card--category-matrix .lb-grid .lb-r-cat th {
                max-width: none;
            }
            & .lb-card--category-matrix .lb-grid .lb-r-points td,
            & .lb-card--category-matrix .lb-grid .lb-r-running td {
                font-size: 0.68rem;
                min-width: 3.25em;
                text-overflow: clip;
            }
            & .lb-card__head { margin-bottom: ${s('sm')}; }
            & .lb-card__head h4 {
                margin: 0;
                font-family: ${t('font-display')};
                font-weight: 600;
                font-size: 1rem;
                color: ${t('text')};
            }
            & .lb-card__sub { font-size: 0.75rem; color: ${t('text-muted')}; margin-top: 2px; }
            & .lb-card__scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
            /* Stacked 9-hole blocks (front 9 / back 9) get a little breathing room. */
            & .lb-card__scroll + .lb-card__scroll { margin-top: ${s('sm')}; }
            & .lb-grid {
                border-collapse: collapse;
                font-variant-numeric: tabular-nums;
                font-size: 0.8rem;
                white-space: nowrap;
                /* Fixed layout → every hole column is the same width (content no
                   longer stretches a column), and front-9 / back-9 blocks align. */
                table-layout: fixed;
                width: 100%;
            }
            & .lb-grid th, & .lb-grid td {
                padding: 3px 2px;
                text-align: center;
                border-bottom: 1px solid ${t('border')};
                overflow: hidden;
                text-overflow: ellipsis;
            }
            /* Data cells hold a digit, a shape, or "AS" — all centred and at most
               a couple of px wider than the tightest mobile column. Let them
               spill symmetrically instead of clipping shapes / ellipsizing "AS".
               (Row labels keep the th ellipsis above.) */
            & .lb-grid td { overflow: visible; text-overflow: clip; }
            & .lb-grid thead th {
                font-size: 0.7rem;
                color: ${t('text-muted')};
                font-weight: 700;
            }
            & .lb-grid .lb-rowlabel {
                text-align: left;
                width: 6em;
                position: sticky;
                left: 0;
                background: ${t('surface')};
                font-weight: 600;
                color: ${t('text')};
            }
            & .lb-grid .lb-sum { width: 2.4em; font-weight: 700; background: ${t('surface-sunken')}; }
            & .lb-grid .lb-r-dim td, & .lb-grid .lb-r-dim th { color: ${t('text-muted')}; }
            & .lb-grid .lb-c-si { color: ${t('text-muted')}; font-size: 0.7rem; }
            & .lb-grid .lb-r-cat th { font-weight: 400; color: ${t('text-muted')}; }
            & .lb-grid .lb-c-cat { text-align: center; color: ${t('accent')}; }
            /* Match-card team tints (the player rows + their deciding-ball marks). */
            & .lb-grid .lb-team-a, & .lb-grid .lb-team-a th { color: #c2452f; }
            & .lb-grid .lb-team-b, & .lb-grid .lb-team-b th { color: #2c6cae; }
            /* Standing pill — team-colour background, white text (high contrast). */
            & .lb-pill {
                display: inline-block; min-width: 1.4em; padding: 0.05em 0.45em;
                border-radius: 999px; color: #fff; font-weight: 700;
            }
            & .lb-pill--a { background: #c2452f; }
            & .lb-pill--b { background: #2c6cae; }
            /* Score marker shapes (presentation vocabulary), Golf Gamebook
               idiom: FILLED circles for under-par scores, FILLED squares for
               over-par, white number, colour encodes magnitude (red −1,
               orange −2, yellow −3+/HIO; light blue +1, dark blue +2 or
               worse). The marker's label carries the golf meaning; these
               class names stay presentation-only. */
            & .lb-mark {
                display: inline-flex; align-items: center; justify-content: center;
                box-sizing: border-box; width: 1.7em; height: 1.7em; line-height: 1;
                /* Digits sit high in their line box, so nudge down to optically centre. */
                padding-top: 0.12em; vertical-align: middle;
                border-radius: 999px; font-weight: 700;
            }
            /* Outline pill forms (badge/dot) keep currentColor + tone tints. */
            & .lb-mark--badge {
                width: auto; min-width: 1.8em;
                padding-left: 0.45em; padding-right: 0.45em;
                border: 2px solid currentColor;
            }
            & .lb-mark--badge.lb-mark-tone--success { color: #267348; }
            & .lb-mark--badge.lb-mark-tone--warning { color: #946200; }
            & .lb-mark--badge.lb-mark-tone--danger { color: #9b332a; }
            /* Filled forms — declared after the tone rules so white text wins. */
            & .lb-mark--ring { background: #d63b2f; color: #fff; }
            & .lb-mark--double_ring { background: #e0862c; color: #fff; }
            & .lb-mark--diamond { background: #e0b41f; color: #fff; }
            & .lb-mark--square,
            & .lb-mark--double_square,
            & .lb-mark--box_badge { border-radius: 3px; }
            & .lb-mark--square { background: #5b9bd5; color: #fff; }
            & .lb-mark--double_square,
            & .lb-mark--box_badge { background: #1f4e79; color: #fff; }
            /* Deciding ball whose score is decorated: the marker's own shape gets
               the team fill — white number and white outline on the team colour.
               Declared AFTER the shape fills so the team colour wins. The white
               border + outer box-shadow halo are load-bearing: without them a
               filled bonus ring is indistinguishable from the plain standing
               pill (the score-to-par shapes above carry no outline). */
            & .lb-mark-fill--a, & .lb-mark-fill--b { border: 2px solid #fff; }
            & .lb-mark--double_ring.lb-mark-fill--a,
            & .lb-mark--double_ring.lb-mark-fill--b { border-width: 3px; border-style: double; }
            & .lb-mark-fill--a { background: #c2452f; color: #fff; box-shadow: 0 0 0 2.5px #c2452f; }
            & .lb-mark-fill--b { background: #2c6cae; color: #fff; box-shadow: 0 0 0 2.5px #2c6cae; }
            & .lb-card__caption { margin: ${s('sm')} 0 0; font-size: 0.72rem; font-style: italic; color: ${t('text-muted')}; }
            & .lb-card__notes { margin: ${s('sm')} 0 0; font-size: 0.72rem; color: ${t('text-muted')}; }
            & .lb-card__notes-label {
                display: block; font-weight: 700; text-transform: uppercase;
                letter-spacing: 0.04em; font-size: 0.68rem; margin-bottom: 2px;
            }
            & .lb-card__note { display: block; }
            & .lb-card__totals {
                list-style: none; margin: ${s('sm')} 0 0; padding: 0;
                display: flex; flex-wrap: wrap; gap: ${s('md')};
                font-size: 0.85rem; color: ${t('text')};
            }
        }
    `;

    private svc = this.inject(RoundViewService);

    private slots = (): SlotResultView[] => this.svc.result.get()?.slots ?? [];
    /**
     * The selected slot's result view, matched by `slotDefId` — never by
     * index. `result.slots` order isn't guaranteed to match `round.formatSlots`
     * order (competition rounds can inherit-then-override and reorder/skip
     * slots), so index-based lookup can silently surface the wrong format.
     */
    private currentSlot = (): SlotResultView | null => {
        const slots = this.slots();
        const wanted = this.svc.selectedSlotDefId();
        return slots.find((s) => s.slotDefId === wanted) ?? slots[0] ?? null;
    };

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            status: {
                className: () => {
                    const loading = this.svc.resultLoading.get();
                    const empty = this.svc.result.get() === null;
                    return loading || empty ? 'lb__status' : 'lb__status hidden';
                },
                textContent: () =>
                    this.svc.resultLoading.get() ? 'Loading results…' : 'No results yet.',
            },
            body: { innerHTML: () => this.renderBody() },
        });

        return frag;
    }

    private renderBody(): string {
        const result = this.svc.result.get();
        if (!result) return '';
        const slot = this.currentSlot();
        if (!slot) return '<div class="lb-empty">No formats in this round.</div>';
        // Phase 5.5: a pending ball (unclaimed placeholder seat) renders its
        // seat LABEL wherever a name would appear, suffixed so a board reader
        // sees the seat is still open. Machine flag comes from ball metadata
        // (`RoundBall.pending`), never from sniffing the label text.
        const nameOf = (id: string) => {
            const name = this.svc.nameOf(id);
            return this.svc.isPending(id) ? `${name} (open seat)` : name;
        };
        const groupOf = (id: string) => this.svc.groupLabelOf(id);
        const leaderboard = renderSlotLeaderboard(slot, nameOf, groupOf);
        const cards = renderSlotCards(slot, result.routeSections, nameOf);
        const cardsBlock = cards ? `<h3 class="lb-cards__head">Scorecard</h3>${cards}` : '';
        return leaderboard + cardsBlock;
    }
}
