import { Component, Computed, Router, Signal, template } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { ConfirmComponent } from '@basics/core/client/ui/confirm';
import { t } from '../theme';
import { s, btn, card } from '../css';
import { AdminService } from './admin.service';
import { api } from '../api';
import type { AdminPlayerSummary, AdminRoundSummary } from '../api/admin.gen';

// The operator screen (`/admin`) — the only surface in the app that reads
// across players. Two tabs over one fetch: every round in the DB (newest
// first, tap to open it through its share token) and the player roster with
// activity + roles.
//
// Visibility is server-enforced: without the unscoped `super_admin` grant the
// `/api/admin/*` reads 403 and this page shows the refusal. The route stays
// registered for everyone — hiding it client-side is presentation, never the
// gate.

const tpl = template(`
    <div class="admin">
        <button bind="back" class="admin__back" type="button">← Home</button>
        <h1 class="admin__title">Admin</h1>

        <div bind="denied" class="admin__denied">
            <p>This area needs a super admin role.</p>
            <p class="admin__denied-hint">Grant one from the server shell: <code>bun run grant:role grant &lt;username&gt; super_admin</code></p>
        </div>

        <div bind="body" class="admin__body">
            <div bind="stats" class="admin__stats"></div>

            <div class="admin__tabs">
                <button bind="tabRounds" type="button">Rounds</button>
                <button bind="tabPlayers" type="button">Players</button>
            </div>

            <div bind="loading" class="admin__loading">Loading…</div>
            <div bind="roundList" class="admin__list"></div>
            <div bind="playerList" class="admin__list"></div>
        </div>
        <div bind="confirmHost"></div>
    </div>
`);

const statTpl = template(`
    <div class="stat">
        <span bind="value" class="stat__value"></span>
        <span bind="label" class="stat__label"></span>
    </div>
`);

const roundTpl = template(`
    <button bind="row" type="button" class="admin-row">
        <div class="admin-row__top">
            <span bind="course" class="admin-row__title"></span>
            <span bind="status" class="admin-chip"></span>
        </div>
        <div class="admin-row__sub">
            <span bind="who"></span>
        </div>
        <div class="admin-row__sub admin-row__meta">
            <span bind="meta"></span>
        </div>
    </button>
`);

const playerTpl = template(`
    <div class="admin-row admin-row--static">
        <div class="admin-row__top">
            <span bind="name" class="admin-row__title"></span>
            <span bind="roleChip" class="admin-chip"></span>
        </div>
        <div class="admin-row__sub">
            <span bind="meta"></span>
        </div>
        <div class="admin-row__actions">
            <button bind="toggle" type="button"></button>
        </div>
    </div>
`);

const STATUS_LABEL: Record<AdminRoundSummary['status'], string> = {
    not_started: 'Not started',
    active: 'Playing',
    complete: 'Done',
};

/** "3 players · 42 scores · last 2026-07-24 10:02" — the activity line. */
function roundMeta(r: AdminRoundSummary): string {
    const parts = [`${r.participants.length} players`, `${r.scoreEventCount} scores`];
    if (r.lastEventAt) parts.push(`last ${r.lastEventAt.replace('T', ' ').slice(0, 16)}`);
    else parts.push('never played');
    return parts.join(' · ');
}

function playerMeta(p: AdminPlayerSummary): string {
    const parts = [`@${p.username}`, `${p.roundCount} rounds`];
    if (p.lastRoundDate) parts.push(`last ${p.lastRoundDate}`);
    if (p.handicapIndex !== null) parts.push(`hcp ${p.handicapIndex}`);
    if (p.deletedAt) parts.push('DELETED');
    return parts.join(' · ');
}

export class AdminComponent extends Component {
    static styles = `
        .admin {
            padding: ${s('xl')} ${s('lg')} ${s('2xl')};

            & .admin__back {
                background: none; border: none; font-family: inherit;
                font-size: 0.9rem; font-weight: 600; color: ${t('text-muted')};
                cursor: pointer; padding: ${s('xs')} 0; margin-bottom: ${s('md')};
            }

            & .admin__title {
                margin: 0 0 ${s('lg')};
                font-family: ${t('font-display')};
                font-weight: 600; font-size: 1.8rem; letter-spacing: -0.02em;
                color: ${t('text')};
            }

            & .admin__denied {
                color: ${t('text-muted')}; font-size: 0.9rem;
                &.hidden { display: none; }
                & code {
                    display: block; margin-top: ${s('xs')};
                    font-size: 0.8rem; word-break: break-all;
                }
            }
            & .admin__denied-hint { color: ${t('text-muted')}; }
            & .admin__body.hidden { display: none; }

            & .admin__stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(88px, 1fr));
                gap: ${s('sm')};
                margin-bottom: ${s('lg')};

                & .stat {
                    ${card({})}
                    display: flex; flex-direction: column; gap: 2px;
                    padding: ${s('sm')} ${s('md')};

                    & .stat__value {
                        font-family: ${t('font-display')};
                        font-size: 1.4rem; font-weight: 700; color: ${t('text')};
                    }
                    & .stat__label {
                        font-size: 0.7rem; font-weight: 600; letter-spacing: 0.06em;
                        text-transform: uppercase; color: ${t('text-muted')};
                    }
                }
            }

            & .admin__tabs {
                display: flex; gap: ${s('sm')}; margin-bottom: ${s('md')};

                & button {
                    ${btn()}
                    flex: 1;
                    padding: ${s('sm')} ${s('md')};
                    font-family: inherit; font-size: 0.9rem; font-weight: 700;
                    background: ${t('surface-sunken')}; color: ${t('text-muted')};
                    border: none; cursor: pointer;

                    &.active { background: ${t('primary')}; color: ${t('primary-text')}; }
                }
            }

            & .admin__loading {
                color: ${t('text-muted')}; font-size: 0.9rem; padding: ${s('lg')} 0;
                &.hidden { display: none; }
            }

            & .admin__list {
                display: flex; flex-direction: column; gap: ${s('sm')};
                &.hidden { display: none; }
            }

            & .admin-row {
                ${card({ hover: true })}
                display: flex; flex-direction: column; gap: ${s('xs')};
                width: 100%; text-align: left; font-family: inherit;
                padding: ${s('md')} ${s('lg')};
                cursor: pointer;

                &.admin-row--static { cursor: default; }

                & .admin-row__top {
                    display: flex; align-items: center; justify-content: space-between;
                    gap: ${s('sm')};
                }

                & .admin-row__title {
                    font-weight: 700; font-size: 1rem; color: ${t('text')};
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                }

                & .admin-row__sub {
                    font-size: 0.8rem; color: ${t('text-muted')};
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                }
                & .admin-row__meta { font-variant-numeric: tabular-nums; }

                & .admin-row__actions {
                    display: flex; justify-content: flex-end; margin-top: ${s('xs')};
                    & button {
                        ${btn()}
                        padding: ${s('xs')} ${s('md')};
                        font-family: inherit; font-size: 0.75rem; font-weight: 700;
                        background: ${t('surface-sunken')}; color: ${t('text-muted')};
                        border: none; cursor: pointer;
                        &:disabled { opacity: 0.5; cursor: default; }
                    }
                }
            }

            & .admin-chip {
                flex-shrink: 0;
                font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
                letter-spacing: 0.08em; border-radius: ${t('radius-pill')};
                padding: 2px 10px;
                background: ${t('surface-sunken')}; color: ${t('text-muted')};
                &:empty { display: none; }
            }
        }
    `;

    private svc = this.inject(AdminService);
    private auth = this.inject(AuthService);
    private router = this.inject(Router);

    private tab = new Signal<'rounds' | 'players'>('rounds');
    private grantOpen = new Signal(false);
    private grantTarget = new Signal<AdminPlayerSummary | null>(null);
    private mutating = new Signal(false);

    /** A refusal only counts once the caller's own roles are known. */
    private denied = new Computed(
        () => this.auth.currentUser.get() === null || !this.svc.isSuperAdmin(),
    );

    render(): DocumentFragment {
        void this.svc.loadRoles().then(() => {
            if (this.svc.isSuperAdmin()) void this.svc.load();
        });

        const frag = this.wire(tpl, {
            back: { onclick: () => this.router.navigate('/') },
            denied: { className: () => (this.denied.get() ? 'admin__denied' : 'admin__denied hidden') },
            body: { className: () => (this.denied.get() ? 'admin__body hidden' : 'admin__body') },
            loading: {
                className: () =>
                    this.svc.loading.get() ? 'admin__loading' : 'admin__loading hidden',
            },
            tabRounds: {
                className: () => (this.tab.get() === 'rounds' ? 'active' : ''),
                onclick: () => this.tab.set('rounds'),
            },
            tabPlayers: {
                className: () => (this.tab.get() === 'players' ? 'active' : ''),
                onclick: () => this.tab.set('players'),
            },
            roundList: {
                className: () => (this.tab.get() === 'rounds' ? 'admin__list' : 'admin__list hidden'),
            },
            playerList: {
                className: () => (this.tab.get() === 'players' ? 'admin__list' : 'admin__list hidden'),
            },
        });

        // Counters — a flat list so a new stat needs no layout change.
        const statRows = new Computed(() => {
            const st = this.svc.stats.get();
            if (!st) return [];
            return [
                { key: 'rounds', label: 'Rounds', value: st.rounds },
                { key: 'active', label: 'Playing', value: st.roundsActive },
                { key: 'week', label: 'Last 7d', value: st.roundsLast7Days },
                { key: 'players', label: 'Players', value: st.players },
                { key: 'guests', label: 'Guests', value: st.guests },
                { key: 'scores', label: 'Scores', value: st.scoreEvents },
            ];
        });

        this.$each(
            this.ref(frag, 'stats'),
            statRows,
            (stat, _i, track) =>
                this.wireEl(
                    statTpl,
                    { value: () => String(stat.value), label: () => stat.label },
                    track,
                ),
            (stat) => stat.key,
        );

        this.$each(
            this.ref(frag, 'roundList'),
            this.svc.rounds,
            (r, _i, track) =>
                this.wireEl(
                    roundTpl,
                    {
                        row: {
                            // The share token IS the round's front door; a round
                            // without a friendly wrapper has none and can't be opened.
                            disabled: () => r.shareToken === null,
                            onclick: () => {
                                if (r.shareToken)
                                    this.router.navigate('/round', { query: { token: r.shareToken } });
                            },
                        },
                        course: () => r.courseName ?? 'Unknown course',
                        status: () => STATUS_LABEL[r.status],
                        who: () => {
                            const by = r.creatorName ? `by ${r.creatorName}` : 'by a guest';
                            const names = r.participants.join(', ');
                            return names ? `${by} — ${names}` : by;
                        },
                        meta: () => `${r.date} · ${roundMeta(r)}`,
                    },
                    track,
                ),
            (r) => r.roundId,
        );

        this.$each(
            this.ref(frag, 'playerList'),
            this.svc.players,
            (p, _i, track) =>
                this.wireEl(
                    playerTpl,
                    {
                        name: () => p.displayName,
                        roleChip: () => (p.roles.includes('super_admin') ? 'admin' : ''),
                        meta: () => playerMeta(p),
                        toggle: {
                            textContent: () =>
                                p.roles.includes('super_admin') ? 'Revoke admin' : 'Make admin',
                            disabled: () => this.mutating.get(),
                            onclick: () => {
                                this.grantTarget.set(p);
                                this.grantOpen.set(true);
                            },
                        },
                    },
                    track,
                ),
            (p) => p.playerId,
        );

        this.spawn(ConfirmComponent, this.ref(frag, 'confirmHost'), {
            open: this.grantOpen,
            title: () => {
                const p = this.grantTarget.get();
                return p?.roles.includes('super_admin') ? 'Revoke admin?' : 'Make admin?';
            },
            message: () => {
                const p = this.grantTarget.get();
                if (!p) return '';
                return p.roles.includes('super_admin')
                    ? `Remove the super admin role from ${p.displayName}?`
                    : `Give ${p.displayName} the super admin role? They will be able to see every player's rounds.`;
            },
            confirmLabel: 'Confirm',
            cancelLabel: 'Cancel',
            onconfirm: () => {
                const p = this.grantTarget.get();
                if (p) void this.toggleAdmin(p);
            },
        });

        return frag;
    }

    /** Grant or revoke `super_admin`, then re-pull the roster from the server. */
    private async toggleAdmin(p: AdminPlayerSummary): Promise<void> {
        this.mutating.set(true);
        try {
            const input = { playerId: p.playerId, role: 'super_admin' as const };
            if (p.roles.includes('super_admin')) await api.admin.adminRevokeRole(input);
            else await api.admin.adminGrantRole(input);
            await this.svc.load(true);
        } finally {
            this.mutating.set(false);
        }
    }
}
