import { Component, template } from '@basics/core/client/core';
import { t } from '../theme';
import { s, card } from '../css';
import { RoundViewService } from './round.service';
import { renderCards, renderSlotLeaderboard } from './result-render';
import { ExpansionState, planBoard } from './board-expansion';
import { markerFormCss, markerTeamFillCss } from './marker-tokens';
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
            & .lb-rank__col-disclosure { width: 1.5rem; }
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

            /* --- Gamebook expansion: a ranked row whose scorecard folds under it.
               The row is tappable anywhere; the button inside the name cell is
               the real control (aria-expanded / aria-controls). The chevron has
               its own final column so it aligns at the board's right edge. */
            & .lb-rank__row--expandable { cursor: pointer; }
            & .lb-rank__toggle {
                display: flex;
                align-items: baseline;
                gap: ${s('xs')};
                width: 100%;
                padding: 0;
                margin: 0;
                border: 0;
                background: none;
                font: inherit;
                color: inherit;
                text-align: left;
                cursor: pointer;
                min-width: 0;
            }
            & .lb-rank__toggle:focus-visible {
                outline: 2px solid ${t('accent')};
                outline-offset: 2px;
                border-radius: 4px;
            }
            & .lb-rank__toggle .lb-rank__whobox { flex: 1 1 auto; }
            & .lb-rank__disclosure {
                text-align: right;
                padding-left: 0;
            }
            /* Chevron drawn from borders — no icon font, no asset. */
            & .lb-rank__chev {
                display: inline-block;
                width: 0.42em;
                height: 0.42em;
                border-right: 2px solid ${t('text-muted')};
                border-bottom: 2px solid ${t('text-muted')};
                transform: rotate(-45deg);
                transition: transform 200ms ease;
            }
            & .lb-rank__row--open .lb-rank__chev {
                transform: rotate(45deg);
            }
            /* The panel row is always in the DOM; open/closed is a HEIGHT
               animation on a 0fr→1fr grid track (the one technique that animates
               to intrinsic content height without measuring it in JS). */
            /* Beats the generic .lb-rank tbody td row metrics (fixed height +
               cell padding): a COLLAPSED panel must take no vertical space at
               all, or every expandable row grows a permanent empty gap. */
            & .lb-rank tbody td.lb-rank__panelcell {
                height: auto;
                padding: 0;
                /* No rule of its own while collapsed: a zero-height cell that
                   still paints a border draws a SECOND hairline right under the
                   row's own bottom border, so every expandable row looks
                   double-ruled. The border belongs to the OPEN panel, closing it
                   off from the next row. */
                border-bottom: 0;
            }
            & .lb-rank tbody tr.lb-rank__panel--open td.lb-rank__panelcell {
                border-bottom: 1px solid ${t('border')};
            }
            & .lb-rank__panelwrap {
                display: grid;
                grid-template-rows: 0fr;
                transition: grid-template-rows 220ms ease;
            }
            & .lb-rank__panel--open .lb-rank__panelwrap { grid-template-rows: 1fr; }
            & .lb-rank__panelbox {
                overflow: hidden;
                min-height: 0;
                /* Hidden from AT and tab order only AFTER the collapse finishes,
                   so the closing animation still shows the card. */
                visibility: hidden;
                transition: visibility 0s linear 220ms;
            }
            & .lb-rank__panel--open .lb-rank__panelbox {
                visibility: visible;
                transition-delay: 0s;
            }
            /* An inline card is page chrome-free: the row above already names the
               player, and a bordered card inside a table row reads as a box in a
               box. */
            & .lb-rank__panelbox .lb-card {
                border: 0;
                box-shadow: none;
                background: ${t('surface-sunken')};
                border-radius: 0;
                margin: 0;
                padding: ${s('sm')} ${s('sm')} ${s('md')};
            }
            & .lb-rank__panelbox .lb-card__head h4 { display: none; }
            & .lb-rank__panelbox .lb-grid .lb-rowlabel { background: ${t('surface-sunken')}; }
            @media (prefers-reduced-motion: reduce) {
                & .lb-rank__panelwrap,
                & .lb-rank__chev { transition: none; }
            }
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
            /* Score marker shapes. The base shape lives here; every per-form
               rule below is EMITTED from the marker token table
               (./marker-tokens.ts), which is the single home for
               marker id → meaning + class + visual. Restyle or add a marker
               there, not here — the server sends only the abstract template,
               and each marker's label carries the golf meaning. */
            & .lb-mark {
                display: inline-flex; align-items: center; justify-content: center;
                box-sizing: border-box; width: 1.7em; height: 1.7em; line-height: 1;
                /* Digits sit high in their line box, so nudge down to optically centre. */
                padding-top: 0.12em; vertical-align: middle;
                border-radius: 999px; font-weight: 700;
            }
            ${markerFormCss()}
            /* Deciding ball whose score is decorated: the marker's own shape gets
               the team fill — white number and white outline on the team colour.
               Declared AFTER the shape fills so the team colour wins. The white
               border + outer box-shadow halo are load-bearing: without them a
               filled bonus ring is indistinguishable from the plain standing
               pill (the score-to-par shapes above carry no outline). */
            & .lb-mark-fill--a, & .lb-mark-fill--b { border: 2px solid #fff; }
            ${markerTeamFillCss()}
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

    /**
     * Which rows are expanded. A PLAIN field, never a signal: a tap mutates the
     * DOM in place so the height transition plays, and `renderBody` (which only
     * re-runs when the result itself changes) reads this back to restore the
     * open rows after a live refetch. Keys are slot-scoped ball-id signatures
     * (`entryKey`), so a reorder on the server keeps each card under its own
     * player and two slots over the same balls stay independent.
     */
    private expansion = new ExpansionState();

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
            // One delegated listener each: the board is an innerHTML string, so
            // per-row handlers would have to be re-attached on every refetch.
            body: {
                innerHTML: () => this.renderBody(),
                onclick: (e: Event) => this.onBodyClick(e),
                onkeydown: (e: Event) => this.onBodyKeydown(e as KeyboardEvent),
            },
        });

        return frag;
    }

    /** The `<tr>` carrying an expansion key, if the event happened inside one. */
    private rowFor(e: Event): HTMLElement | null {
        const target = e.target as Element | null;
        return (target?.closest?.('tr[data-expand-key]') as HTMLElement | null) ?? null;
    }

    private onBodyClick(e: Event): void {
        const row = this.rowFor(e);
        if (!row) return;
        // Drag-select guard: the whole row is clickable, so selecting a player's
        // name (or a score, to copy it) ends in a click on the row and would
        // collapse the panel out from under the selection. A non-empty selection
        // at click time means the gesture was a drag, not a tap.
        if ((window.getSelection?.()?.toString() ?? '') !== '') return;
        const key = row.getAttribute('data-expand-key') ?? '';
        this.applyOpen(row, this.expansion.toggle(key));
    }

    /**
     * Escape is ROW-SCOPED, not global: it only collapses when focus is inside an
     * expanded row, and it never swallows the key for the rest of the page.
     */
    private onBodyKeydown(e: KeyboardEvent): void {
        if (e.key !== 'Escape') return;
        const row = this.rowFor(e);
        if (!row) return;
        const key = row.getAttribute('data-expand-key') ?? '';
        if (!this.expansion.isOpen(key)) return;
        this.applyOpen(row, this.expansion.set(key, false));
        (row.querySelector('.lb-rank__toggle') as HTMLElement | null)?.focus();
        e.stopPropagation();
    }

    /**
     * Drive the DOM for one row directly instead of re-rendering the board: the
     * CSS height transition needs the SAME elements to change class, and a
     * re-render would also lose scroll position and focus.
     */
    private applyOpen(row: HTMLElement, open: boolean): void {
        row.classList.toggle('lb-rank__row--open', open);
        row.querySelector('.lb-rank__toggle')?.setAttribute('aria-expanded', String(open));
        const panel = row.nextElementSibling;
        if (panel?.classList.contains('lb-rank__panel')) {
            panel.classList.toggle('lb-rank__panel--open', open);
        }
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
        // Gamebook layout: a card whose subject is exactly one ranked entry folds
        // into that row (tap to expand); everything else — shared, team, match —
        // keeps its place in the card list below.
        const plan = planBoard(slot);
        // Prune rows that no longer exist on this board (a ball left, or the
        // reader switched slots — keys are slot-scoped). A stale key is inert,
        // but left alone the set grows for the life of the page.
        this.expansion.retain(plan.attached.keys());
        const leaderboard = renderSlotLeaderboard(slot, nameOf, groupOf, {
            plan,
            routeSections: result.routeSections,
            isOpen: (key) => this.expansion.isOpen(key),
        });
        const cards = renderCards(plan.standalone, result.routeSections, nameOf);
        const cardsBlock = cards ? `<h3 class="lb-cards__head">Scorecard</h3>${cards}` : '';
        return leaderboard + cardsBlock;
    }
}
