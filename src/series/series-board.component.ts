import { Component, Computed, Router, Signal, effect, template, untrack } from '@basics/core/client/core';
import { ConfirmComponent } from '@basics/core/client/ui/confirm';
import { t } from '../theme';
import { s, btn, input, card } from '../css';
import { api } from '../api';
import type { SeriesBoardView } from '../api/series.gen';
import { FriendsService } from '../friends/friends.service';
import { ProfileService } from '../profile/profile.service';
import { shouldPoll, shouldRefreshOnVisibility } from '../round/poll-gate';
import { SeriesService } from './series.service';
import { forgetDeviceSeries } from './device-series';
import { readConfig, renderBoard, renderSetup } from './series-render';
import { TEAM_COLOURS } from './team-colours';

// The team-event board (`/series-board?token=`). An open read by series share
// token: anyone with the link sees team totals, sessions and match status. The
// payload never carries a round share token. `canEdit` (owner or series_admin,
// decided by the server) adds the Set up view; the server still gates every
// mutation.
//
// Both views are innerHTML folds (series-render.ts) with one delegated listener
// each. Setup inputs are uncontrolled: a value is read when its Save is
// pressed, and the view re-renders only when the server answers.

const POLL_MS = 15_000;

const tpl = template(`
    <div class="sbp">
        <button bind="back" type="button" class="sbp__back">Team events</button>
        <div bind="loading" class="sbp__muted">Loading…</div>
        <p bind="loadErr" class="sbp__err"></p>
        <div bind="body">
            <header class="sbp__head">
                <h1 bind="name"></h1>
                <div bind="tabs" class="ss-seg" role="group">
                    <button bind="tabBoard" type="button">Board</button>
                    <button bind="tabSetup" type="button">Set up</button>
                </div>
            </header>
            <div bind="board" class="sb"></div>
            <div bind="setupWrap">
                <p bind="mutateErr" class="sbp__err"></p>
                <div bind="setup" class="ss"></div>
            </div>
        </div>
        <div bind="confirmHost"></div>
    </div>
`);

/** A board with a round still to be played keeps refreshing. */
export function boardNeedsPolling(board: SeriesBoardView | null): boolean {
    if (!board) return false;
    return board.live || board.sessions.some((x) => x.status === 'not_started' || x.status === 'active');
}

export class SeriesBoardComponent extends Component {
    static styles = `
        .sbp {
            padding: ${s('lg')} ${s('lg')} ${s('2xl')};
            max-width: 720px; margin: 0 auto;

            & .hidden { display: none !important; }
            & .sbp__back {
                appearance: none; border: none; background: none; padding: 0;
                font-family: inherit; font-size: 0.85rem; color: ${t('text-muted')}; cursor: pointer;
                &::before { content: '‹ '; }
            }
            & .sbp__muted { color: ${t('text-muted')}; padding: ${s('lg')} 0; }
            & .sbp__err { color: ${t('error')}; font-size: 0.9rem; margin: ${s('sm')} 0; &:empty { display: none; } }
            & .sbp__head {
                display: flex; align-items: center; justify-content: space-between;
                gap: ${s('md')}; flex-wrap: wrap; margin: ${s('sm')} 0 ${s('lg')};
                & h1 {
                    margin: 0; font-family: ${t('font-display')}; font-weight: 600;
                    font-size: 1.8rem; letter-spacing: -0.02em;
                }
            }

            /* Track segmented control (design guidelines §2): a sunken track,
               the selection is a raised pill. Deliberately not btn(). */
            & .ss-seg {
                display: inline-flex; gap: 2px; padding: 3px; flex-shrink: 0;
                border: 1px solid ${t('border')}; border-radius: ${t('radius-pill')};
                background: ${t('surface-sunken')};
                & button {
                    appearance: none; border: 1px solid transparent; background: none;
                    padding: ${s('xs')} ${s('md')}; border-radius: ${t('radius-pill')};
                    font-family: inherit; font-weight: 500; font-size: 0.85rem;
                    color: ${t('text-muted')}; cursor: pointer; white-space: nowrap;
                    &.on {
                        background: ${t('surface')}; border-color: ${t('border')};
                        color: ${t('text')}; font-weight: 700;
                    }
                    &:disabled { cursor: default; }
                }
            }

            /* --- board --- */
            & .sb-totals {
                display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                gap: ${s('sm')}; margin-bottom: ${s('md')};
            }
            & .sb-team {
                ${card()}
                padding: ${s('md')}; text-align: center;
                border-top: 6px solid var(--team);
                display: flex; flex-direction: column; gap: 2px;
                & .sb-team__name { font-weight: 700; font-size: 0.95rem; }
                & .sb-team__pts {
                    font-family: ${t('font-display')}; font-weight: 600; font-size: 2.6rem; line-height: 1.1;
                    font-variant-numeric: tabular-nums;
                }
                & .sb-team__sub { font-size: 0.75rem; color: ${t('text-muted')}; }
            }
            & .sb-note, & .sb-empty { color: ${t('text-muted')}; font-size: 0.85rem; margin: 0 0 ${s('md')}; }
            & .sb-roster {
                display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                gap: ${s('sm')};
            }
            & .sb-roster__team {
                ${card()}
                padding: ${s('sm')} ${s('md')};
                border-left: 4px solid var(--team);
                & h3 {
                    margin: 0 0 ${s('xs')}; font-size: 0.75rem; font-weight: 700;
                    text-transform: uppercase; letter-spacing: 0.06em; color: ${t('text-muted')};
                }
                & ul { margin: 0; padding: 0; list-style: none; }
                & li { font-size: 0.95rem; padding: 2px 0; overflow-wrap: anywhere; }
                & .sb-roster__none { margin: 0; font-size: 0.85rem; color: ${t('text-muted')}; }
            }
            & .sb-session {
                margin-top: ${s('xl')};
                & h2 { margin: 0; font-size: 1.15rem; font-weight: 700; }
                & .sb-session__meta { margin: 2px 0 ${s('sm')}; font-size: 0.8rem; color: ${t('text-muted')}; }
            }
            & .sb-source {
                ${card()}
                padding: ${s('sm')} ${s('md')}; margin-top: ${s('sm')};
                & .sb-source__head {
                    display: flex; justify-content: space-between; gap: ${s('sm')};
                    font-size: 0.75rem; color: ${t('text-muted')};
                    text-transform: uppercase; letter-spacing: 0.06em;
                    padding-bottom: ${s('xs')};
                }
            }
            & .sb-row {
                border-top: 1px solid ${t('border')}; padding: ${s('sm')} 0;
                & summary { list-style: none; cursor: pointer; &::-webkit-details-marker { display: none; } }
                & .sb-row__detail { margin: ${s('xs')} 0 0; font-size: 0.8rem; color: ${t('text-muted')}; }
            }
            & div.sb-row, & .sb-row summary {
                display: grid; grid-template-columns: 1fr auto; gap: 2px ${s('md')}; align-items: baseline;
            }
            & .sb-row__label { font-weight: 600; }
            & .sb-row__status { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
            & .sb-row__pts { grid-column: 1 / -1; display: flex; gap: ${s('md')}; flex-wrap: wrap; font-size: 0.8rem; color: ${t('text-muted')}; }
            & .sb-vs {
                grid-column: 1 / -1;
                display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); align-items: stretch;
                border: 1px solid ${t('border')}; border-radius: 10px; overflow: hidden;
                margin-bottom: ${s('xs')};
            }
            & .sb-vs__side {
                padding: ${s('sm')} ${s('md')}; font-weight: 700; font-size: 0.9rem;
                display: flex; align-items: center; gap: ${s('sm')}; min-width: 0;
                color: var(--team);
            }
            & .sb-vs__side--b { flex-direction: row-reverse; text-align: right; }
            & .sb-vs__side--lead { background: var(--team); color: #fff; }
            & .sb-vs__name { overflow-wrap: anywhere; }
            & .sb-vs__figure { font-size: 1.25rem; font-weight: 800; line-height: 1; font-variant-numeric: tabular-nums; }
            & .sb-vs__center {
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                padding: ${s('xs')} ${s('sm')}; gap: 1px; text-align: center;
            }
            & .sb-vs__standing { font-size: 1.1rem; font-weight: 800; line-height: 1.05; white-space: nowrap; }
            & .sb-vs__state { font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.04em; color: ${t('text-muted')}; }
            & .sb-vs__state--live { color: ${t('accent')}; font-weight: 700; letter-spacing: 0.08em; }
            & .sb-share {
                display: inline-flex; align-items: center; gap: 4px;
                & i { width: 8px; height: 8px; border-radius: 50%; background: var(--team); }
                & b { color: ${t('text')}; }
            }
            & .sb-live {
                font-style: normal; font-size: 0.65rem; font-weight: 700; letter-spacing: 0.08em;
                text-transform: uppercase; color: ${t('accent')}; margin-left: 4px;
            }
            & .sb-problem { margin: ${s('xs')} 0 0; font-size: 0.8rem; color: ${t('danger')}; }

            /* --- setup --- */
            & .ss-section {
                margin-top: ${s('xl')};
                & h3 { margin: 0 0 ${s('sm')}; font-size: 1.05rem; font-weight: 700; }
                & h4 {
                    margin: ${s('md')} 0 ${s('xs')}; font-size: 0.75rem; font-weight: 700;
                    text-transform: uppercase; letter-spacing: 0.06em; color: ${t('text-muted')};
                }
            }
            & .ss-card {
                ${card()}
                padding: ${s('md')}; margin-bottom: ${s('sm')};
                display: flex; flex-direction: column; gap: ${s('sm')};
            }
            & .ss-team { border-left: 6px solid var(--team); }
            & .ss-inline {
                display: flex; gap: ${s('sm')}; align-items: center; flex-wrap: wrap;
                & input, & select { flex: 1 1 8rem; min-width: 0; }
                &.ss-inline--end { justify-content: flex-end; }
            }
            & .ss input, & .ss select {
                ${input()}
                padding: ${s('sm')} ${s('md')}; font-size: 1rem;
            }
            & .ss button:not(.ss-link):not([data-act="ball-team"]) {
                ${btn()}
                padding: ${s('sm')} ${s('md')}; font-family: inherit; font-size: 0.9rem; font-weight: 700;
                &:disabled { opacity: 0.5; cursor: default; }
            }
            & .ss-link {
                appearance: none; border: none; background: none; padding: ${s('xs')} 0;
                align-self: flex-start; font-family: inherit; font-size: 0.9rem; font-weight: 600;
                color: ${t('primary')}; cursor: pointer; text-align: left;
                &.ss-link--danger { color: ${t('danger')}; }
                &:disabled { opacity: 0.5; cursor: default; }
            }
            & .ss-dot {
                display: inline-block; width: 10px; height: 10px; border-radius: 50%;
                background: var(--team); margin-right: 6px; flex-shrink: 0;
            }
            & .ss-muted { color: ${t('text-muted')}; font-size: 0.85rem; margin: 0; }
            & .ss-warn { color: ${t('danger')}; font-weight: 600; }
            & .ss-members, & .ss-balls {
                list-style: none; margin: 0; padding: 0;
                & li {
                    display: flex; justify-content: space-between; align-items: center;
                    gap: ${s('sm')}; padding: ${s('xs')} 0; border-top: 1px solid ${t('border')};
                    &:first-child { border-top: none; }
                }
                & small { color: ${t('text-muted')}; }
                & select { flex: 0 1 10rem; }
            }
            & .ss-source {
                border-top: 1px solid ${t('border')}; padding-top: ${s('sm')};
                display: flex; flex-direction: column; gap: ${s('sm')};
            }
            & .ss-fields { display: flex; gap: ${s('sm')}; flex-wrap: wrap; }
            & .ss-field {
                display: flex; flex-direction: column; gap: 2px; flex: 1 1 6rem;
                font-size: 0.8rem; color: ${t('text-muted')};
                &.ss-field--wide { flex-basis: 100%; }
                & input { width: 100%; box-sizing: border-box; }
            }
        }
    `;

    private svc = this.inject(SeriesService);
    private friends = this.inject(FriendsService);
    private profile = this.inject(ProfileService);
    private router = this.inject(Router);

    private token = this.router.query('token');
    private tab = new Signal<'board' | 'setup'>('board');
    private confirmOpen = new Signal(false);
    private pending = new Signal<{ title: string; message: string; label: string; run: () => void } | null>(null);

    private canEdit = new Computed(() => this.svc.board.get()?.canEdit === true);
    private showSetup = new Computed(() => this.canEdit.get() && this.tab.get() === 'setup');

    render(): DocumentFragment {
        const board = () => this.svc.board.get();

        this.track(
            effect(() => {
                const token = this.token.get();
                if (token) untrack(() => void this.svc.loadBoard(token));
            }),
        );
        // The setup reads are admin-only; fetch them the first time the view opens.
        this.track(
            effect(() => {
                const b = board();
                if (!this.showSetup.get() || !b) return;
                untrack(() => {
                    if (this.svc.detail.get()?.id !== b.id) void this.svc.loadSetup(b.id);
                    void this.friends.load();
                    void this.profile.load();
                });
            }),
        );

        this.startPolling();

        const frag = this.wire(tpl, {
            back: { onclick: () => this.router.navigate('/series') },
            loading: {
                className: () =>
                    this.svc.boardLoading.get() && board() === null ? 'sbp__muted' : 'sbp__muted hidden',
            },
            loadErr: {
                textContent: () =>
                    board() === null && this.svc.boardError.get()
                        ? 'This team event could not be opened. The link may be wrong, or the event was deleted.'
                        : '',
            },
            body: { className: () => (board() ? '' : 'hidden') },
            name: () => board()?.name ?? '',
            tabs: { className: () => (this.canEdit.get() ? 'ss-seg' : 'ss-seg hidden') },
            tabBoard: {
                className: () => (this.tab.get() === 'board' ? 'on' : ''),
                onclick: () => this.tab.set('board'),
            },
            tabSetup: {
                className: () => (this.tab.get() === 'setup' ? 'on' : ''),
                onclick: () => this.tab.set('setup'),
            },
            board: {
                className: () => (this.showSetup.get() ? 'sb hidden' : 'sb'),
                innerHTML: () => {
                    const b = board();
                    return b ? renderBoard(b) : '';
                },
            },
            setupWrap: { className: () => (this.showSetup.get() ? '' : 'hidden') },
            mutateErr: { textContent: () => this.svc.mutateError.get() ?? '' },
            setup: {
                innerHTML: () => this.setupHtml(),
                onclick: (e: Event) => this.onSetupClick(e),
                onchange: (e: Event) => this.onSetupChange(e),
            },
        });

        this.spawn(ConfirmComponent, this.ref(frag, 'confirmHost'), {
            open: this.confirmOpen,
            title: () => this.pending.get()?.title ?? '',
            message: () => this.pending.get()?.message ?? '',
            confirmLabel: () => this.pending.get()?.label ?? 'Remove',
            cancelLabel: 'Cancel',
            danger: true,
            onconfirm: () => this.pending.get()?.run(),
        });

        return frag;
    }

    private startPolling(): void {
        let visible = !document.hidden;
        const refresh = () => {
            const token = this.token.get();
            if (token) void this.svc.loadBoard(token, { force: true, silent: true });
        };
        const timer = window.setInterval(() => {
            const live = boardNeedsPolling(this.svc.board.get());
            // A setup edit re-renders its inputs; never refresh under the editor.
            if (this.showSetup.get()) return;
            if (shouldPoll({ pageVisible: !document.hidden, status: live ? 'active' : 'complete' })) {
                refresh();
            }
        }, POLL_MS);
        const onVisibility = () => {
            const now = !document.hidden;
            if (shouldRefreshOnVisibility(visible, now) && !this.showSetup.get()) refresh();
            visible = now;
        };
        document.addEventListener('visibilitychange', onVisibility);
        this.track(() => {
            window.clearInterval(timer);
            document.removeEventListener('visibilitychange', onVisibility);
        });
    }

    private setupHtml(): string {
        const detail = this.svc.detail.get();
        if (!detail) return '<p class="ss-muted">Loading…</p>';
        const me = this.profile.player.get();
        const attached = new Set(detail.rounds.map((r) => r.roundId));
        const rounds = this.svc.myRounds
            .get()
            .filter((r) => r.token !== null && !attached.has(r.round.id))
            .slice(0, 30)
            .map((r) => ({
                token: r.token!,
                label: [r.round.name ?? r.round.courseNameSnapshot ?? 'Round', r.round.date.slice(0, 10)].join(' · '),
            }));
        return renderSetup({
            detail,
            rules: this.svc.rules.get(),
            // The owner plays too, and is nobody's friend: list them first.
            friends: [
                ...(me ? [{ id: me.id, displayName: me.displayName }] : []),
                ...this.friends.friends.get().map((f) => ({ id: f.id, displayName: f.displayName })),
            ],
            rounds,
            // Not `mutating`: a re-render on every request start would wipe the
            // other cards' unsaved inputs. The click handler drops presses
            // while a request is in flight instead.
            busy: false,
        });
    }

    private ask(title: string, message: string, label: string, run: () => void): void {
        this.pending.set({ title, message, label, run });
        this.confirmOpen.set(true);
    }

    private onSetupChange(e: Event): void {
        const el = e.target as HTMLElement;
        const detail = this.svc.detail.get();
        if (!detail || !(el instanceof HTMLSelectElement) || el.dataset.change !== 'ball-team') return;
        void this.svc.mutateDetail(() =>
            api.series.setBallTeam({
                seriesId: detail.id,
                seriesRoundId: el.dataset.round!,
                ballId: el.dataset.ball!,
                teamId: el.value === '' ? null : el.value,
            }),
        );
    }

    private onSetupClick(e: Event): void {
        const btnEl = (e.target as HTMLElement).closest<HTMLElement>('[data-act]');
        const detail = this.svc.detail.get();
        if (!btnEl || !detail || this.svc.mutating.get()) return;
        const seriesId = detail.id;
        const d = btnEl.dataset;
        const field = (scope: string, name: string): string =>
            (
                btnEl.closest(scope)?.querySelector<HTMLInputElement | HTMLSelectElement>(
                    `[data-field="${name}"]`,
                )?.value ?? ''
            ).trim();

        switch (d.act) {
            case 'rename':
                void this.svc.rename(seriesId, field('[data-name-card]', 'series-name'));
                return;
            case 'copy-link': {
                const url = new URL(window.location.href);
                void navigator.clipboard?.writeText(url.toString()).then(
                    () => (btnEl.textContent = 'Link copied'),
                    () => (btnEl.textContent = url.toString()),
                );
                return;
            }
            case 'add-team': {
                const n = detail.teams.length + 1;
                const used = new Set(detail.teams.map((x) => x.colour));
                const colour = TEAM_COLOURS.find((c) => !used.has(c.id))?.id ?? TEAM_COLOURS[0]!.id;
                void this.svc.mutateTeams(() => api.series.addTeam({ seriesId, name: `Team ${n}`, colour }));
                return;
            }
            case 'save-team':
                void this.svc.mutateTeams(() =>
                    api.series.updateTeam({
                        seriesId,
                        teamId: d.team!,
                        name: field('[data-team-card]', 'team-name'),
                        colour: field('[data-team-card]', 'team-colour'),
                    }),
                );
                return;
            case 'remove-team':
                this.ask('Remove this team?', 'Its players and its points leave the event.', 'Remove team', () =>
                    void this.svc.mutateTeams(() => api.series.removeTeam({ seriesId, teamId: d.team! })),
                );
                return;
            case 'add-friend': {
                const playerId = field('[data-team-card]', 'friend');
                if (playerId)
                    void this.svc.mutateTeams(() => api.series.addMember({ seriesId, teamId: d.team!, playerId }));
                return;
            }
            case 'add-guest': {
                const guestName = field('[data-team-card]', 'guest');
                if (guestName)
                    void this.svc.mutateTeams(() => api.series.addMember({ seriesId, teamId: d.team!, guestName }));
                return;
            }
            case 'remove-member':
                void this.svc.mutateTeams(() => api.series.removeMember({ seriesId, memberId: d.member! }));
                return;
            case 'attach-round': {
                const roundShareToken = field('[data-attach-card]', 'attach-round');
                if (roundShareToken)
                    void this.svc.mutateDetail(() =>
                        api.series.attachRound({
                            seriesId,
                            roundShareToken,
                            label: field('[data-attach-card]', 'attach-label'),
                        }),
                    );
                return;
            }
            case 'relabel-round':
                void this.svc.mutateDetail(() =>
                    api.series.relabelRound({
                        seriesId,
                        seriesRoundId: d.round!,
                        label: field('[data-round-card]', 'round-label'),
                    }),
                );
                return;
            case 'detach-round':
                this.ask(
                    'Remove this round from the event?',
                    'The round and its scores stay. Its points leave the board.',
                    'Remove round',
                    () => void this.svc.mutateDetail(() => api.series.detachRound({ seriesId, seriesRoundId: d.round! })),
                );
                return;
            case 'ball-team':
                void this.svc.mutateDetail(() =>
                    api.series.setBallTeam({
                        seriesId,
                        seriesRoundId: d.round!,
                        ballId: d.ball!,
                        teamId: d.team!,
                    }),
                );
                return;
            case 'add-slot-source':
                void this.svc.mutateDetail(() =>
                    api.series.upsertSource({
                        seriesId,
                        seriesRoundId: d.round!,
                        slotDefId: d.slot!,
                        ruleId: d.rule!,
                        label: d.label || 'Points',
                    }),
                );
                return;
            case 'add-by-hand': {
                const rule = this.svc.rules.get().find((r) => r.appliesTo === 'none');
                if (!rule) return;
                void this.svc.mutateDetail(() =>
                    api.series.upsertSource({
                        seriesId,
                        seriesRoundId: d.round ? d.round : null,
                        slotDefId: null,
                        ruleId: rule.id,
                        label: 'Extra points',
                    }),
                );
                return;
            }
            case 'save-source': {
                const source = detail.sources.find((x) => x.id === d.source);
                const cardEl = btnEl.closest<HTMLElement>('[data-source-card]');
                if (!source || !cardEl) return;
                void this.svc.mutateDetail(() =>
                    api.series.upsertSource({
                        seriesId,
                        id: source.id,
                        seriesRoundId: source.seriesRoundId,
                        slotDefId: source.slotDefId,
                        ruleId: source.ruleId,
                        config: readConfig(cardEl),
                        label: field('[data-source-card]', 'source-label'),
                    }),
                );
                return;
            }
            case 'delete-source':
                void this.svc.mutateDetail(() => api.series.deleteSource({ seriesId, sourceId: d.source! }));
                return;
            case 'delete-series':
                this.ask(
                    `Delete ${detail.name}?`,
                    'Teams and points go. The rounds and their scores stay.',
                    'Delete event',
                    () =>
                        void this.svc.remove(seriesId).then((ok) => {
                            if (!ok) return;
                            this.svc.deviceList.set(forgetDeviceSeries(detail.shareToken));
                            this.router.navigate('/series');
                        }),
                );
                return;
        }
    }
}
