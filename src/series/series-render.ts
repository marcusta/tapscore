// Pure `series payload → HTML string` folds (consumed via innerHTML, same
// idiom as `round/result-render.ts`). No DOM, no signals, so both are unit
// testable. Controls carry `data-act` plus the ids they act on; the component
// owns ONE delegated listener per host.
//
// Rule config is rendered from the descriptor's `configFields` DATA. Nothing
// here names a rule id: a rule is picked by its declared `appliesTo`.

import type {
    SeriesBoardSource,
    SeriesBoardView,
    SeriesDetail,
    SeriesPointSource,
    SeriesRoundDetail,
    SeriesTeam,
    TeamPointsDescriptor,
    TeamPointsRow,
    TeamPointsShare,
} from '../api/series.gen';
import { TEAM_COLOURS, teamHex } from './team-colours';

export function esc(value: unknown): string {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/** Points print without a trailing `.0`; halves print as `.5`. */
export function fmtPoints(n: number): string {
    return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}

const STATUS_WORDS: Record<string, string> = {
    not_started: 'Not started',
    active: 'In play',
    complete: 'Finished',
};

interface TeamLook {
    name: string;
    hex: string;
}

function shares(points: TeamPointsShare[], looks: Map<string, TeamLook>): string {
    if (points.length === 0) return '';
    return points
        .map((p) => {
            const look = looks.get(p.teamId);
            return `<span class="sb-share" style="--team:${look?.hex ?? '#6b7a6e'}"><i></i>${esc(
                look?.name ?? '?',
            )} <b>${fmtPoints(p.points)}</b></span>`;
        })
        .join('');
}

/**
 * A two-team row as a bar: side, standing, side. The side ahead fills with its
 * team colour; the other prints its name in its own. Level fills neither.
 */
function versusHtml(row: TeamPointsRow, looks: Map<string, TeamLook>): string {
    const v = row.versus!;
    const side = (key: 'a' | 'b'): string => {
        const s = v[key];
        const lead = v.leader === key ? ' sb-vs__side--lead' : '';
        return `<div class="sb-vs__side sb-vs__side--${key}${lead}" style="--team:${
            looks.get(s.teamId)?.hex ?? '#6b7a6e'
        }"><span class="sb-vs__name">${esc(s.name)}</span>${
            s.figure ? `<b class="sb-vs__figure">${esc(s.figure)}</b>` : ''
        }</div>`;
    };
    const state = row.live ? 'Live' : v.finished ? 'Final' : '';
    return `<div class="sb-vs">${side('a')}
        <div class="sb-vs__center">${
            v.standing ? `<span class="sb-vs__standing">${esc(v.standing)}</span>` : ''
        }${
            state ? `<span class="sb-vs__state${row.live ? ' sb-vs__state--live' : ''}">${state}</span>` : ''
        }</div>${side('b')}</div>`;
}

function sourceHtml(source: SeriesBoardSource, looks: Map<string, TeamLook>): string {
    const rows = source.rows
        .map((row) => {
            const head = row.versus
                ? `${versusHtml(row, looks)}
                <span class="sb-row__pts">${shares(row.points, looks)}</span>`
                : `
                <span class="sb-row__label">${esc(row.label || source.label)}</span>
                <span class="sb-row__status">${esc(row.status)}${
                    row.live ? ' <em class="sb-live">Live</em>' : ''
                }</span>
                <span class="sb-row__pts">${shares(row.points, looks)}</span>`;
            const problem = row.problem
                ? `<p class="sb-problem">${esc(row.problem)}</p>`
                : '';
            if (!row.detail && !problem) return `<div class="sb-row">${head}</div>`;
            return `<details class="sb-row sb-row--more"><summary>${head}</summary>${
                row.detail ? `<p class="sb-row__detail">${esc(row.detail)}</p>` : ''
            }${problem}</details>`;
        })
        .join('');
    return `
        <div class="sb-source">
            <div class="sb-source__head">
                <span class="sb-source__label">${esc(source.label)}</span>
                <span class="sb-source__rule">${esc(source.ruleLabel)}</span>
            </div>
            ${rows}
        </div>`;
}

export function renderBoard(board: SeriesBoardView): string {
    const looks = new Map<string, TeamLook>(
        board.teams.map((t) => [t.teamId, { name: t.name, hex: teamHex(t.colour) }] as const),
    );
    const totals = board.teams
        .map(
            (t) => `
            <div class="sb-team" style="--team:${teamHex(t.colour)}">
                <span class="sb-team__name">${esc(t.name)}</span>
                <span class="sb-team__pts">${fmtPoints(t.points)}</span>
                <span class="sb-team__sub">${
                    board.live ? `${fmtPoints(t.decided)} decided` : '&nbsp;'
                }</span>
            </div>`,
        )
        .join('');
    const roster = board.teams.some((t) => t.members.length > 0)
        ? `<section class="sb-roster" aria-label="Teams">${board.teams
              .map(
                  (t) => `
            <div class="sb-roster__team" style="--team:${teamHex(t.colour)}">
                <h3>${esc(t.name)}</h3>
                ${
                    t.members.length === 0
                        ? '<p class="sb-roster__none">No players yet.</p>'
                        : `<ul>${t.members.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>`
                }
            </div>`,
              )
              .join('')}</section>`
        : '';
    const sessions = board.sessions
        .map((session) => {
            const meta = [
                session.roundName,
                session.date?.slice(0, 10),
                session.status ? STATUS_WORDS[session.status] : null,
            ]
                .filter((v): v is string => typeof v === 'string' && v !== '')
                .map(esc)
                .join(' · ');
            return `
            <section class="sb-session">
                <h2>${esc(session.label)}</h2>
                ${meta ? `<p class="sb-session__meta">${meta}</p>` : ''}
                ${session.problem ? `<p class="sb-problem">${esc(session.problem)}</p>` : ''}
                ${
                    session.sources.length === 0
                        ? '<p class="sb-empty">No points set up for this round.</p>'
                        : session.sources.map((src) => sourceHtml(src, looks)).join('')
                }
            </section>`;
        })
        .join('');
    return `
        <div class="sb-totals">${totals}</div>
        ${board.live ? '<p class="sb-note">Live matches count as they stand. Totals can change.</p>' : ''}
        ${roster}
        ${sessions || '<p class="sb-empty">No rounds yet.</p>'}`;
}

// --- setup ---------------------------------------------------------------------------

export interface SetupFriend {
    id: string;
    displayName: string;
}

export interface SetupRound {
    token: string;
    label: string;
}

export interface SetupInput {
    detail: SeriesDetail;
    rules: TeamPointsDescriptor[];
    friends: SetupFriend[];
    /** Rounds the viewer holds a share token for and that are not attached. */
    rounds: SetupRound[];
    busy: boolean;
}

function dis(busy: boolean): string {
    return busy ? ' disabled' : '';
}

function teamHtml(team: SeriesTeam, input: SetupInput, taken: Set<string>): string {
    const { busy, detail } = input;
    const colours = TEAM_COLOURS.map(
        (c) =>
            `<option value="${c.id}"${c.id === team.colour ? ' selected' : ''}>${esc(c.label)}</option>`,
    ).join('');
    const members = team.members
        .map(
            (m) => `
            <li>
                <span>${esc(m.displayName)}${m.playerId ? '' : ' <small>guest</small>'}</span>
                <button type="button" class="ss-link" data-act="remove-member" data-member="${esc(m.id)}"${dis(busy)}>Remove</button>
            </li>`,
        )
        .join('');
    const free = input.friends.filter((f) => !taken.has(f.id));
    const friendPick =
        free.length === 0
            ? ''
            : `
            <div class="ss-inline">
                <select data-field="friend" aria-label="Friend">
                    ${free.map((f) => `<option value="${esc(f.id)}">${esc(f.displayName)}</option>`).join('')}
                </select>
                <button type="button" data-act="add-friend" data-team="${esc(team.id)}"${dis(busy)}>Add friend</button>
            </div>`;
    return `
        <div class="ss-card ss-team" data-team-card="${esc(team.id)}" style="--team:${teamHex(team.colour)}">
            <div class="ss-inline">
                <i class="ss-dot"></i>
                <input data-field="team-name" value="${esc(team.name)}" aria-label="Team name" />
                <select data-field="team-colour" aria-label="Team colour">${colours}</select>
                <button type="button" data-act="save-team" data-team="${esc(team.id)}"${dis(busy)}>Save</button>
            </div>
            <ul class="ss-members">${members || '<li class="ss-muted">No players yet.</li>'}</ul>
            ${friendPick}
            <div class="ss-inline">
                <input data-field="guest" placeholder="Guest name" aria-label="Guest name" />
                <button type="button" data-act="add-guest" data-team="${esc(team.id)}"${dis(busy)}>Add guest</button>
            </div>
            ${
                detail.teams.length > 2
                    ? `<button type="button" class="ss-link ss-link--danger" data-act="remove-team" data-team="${esc(team.id)}"${dis(busy)}>Remove team</button>`
                    : ''
            }
        </div>`;
}

function ballTeamControl(
    round: SeriesRoundDetail,
    ball: SeriesRoundDetail['balls'][number],
    teams: SeriesTeam[],
    busy: boolean,
): string {
    const attrs = `data-round="${esc(round.id)}" data-ball="${esc(ball.ballId)}"`;
    // Design guidelines §1: two options get the track control, more get a dropdown.
    if (teams.length === 2) {
        return `<div class="ss-seg" role="group">${teams
            .map(
                (t) =>
                    `<button type="button" data-act="ball-team" ${attrs} data-team="${esc(t.id)}" class="${
                        ball.teamId === t.id ? 'on' : ''
                    }" aria-pressed="${ball.teamId === t.id}"${dis(busy)}>${esc(t.name)}</button>`,
            )
            .join('')}</div>`;
    }
    return `<select data-change="ball-team" ${attrs}${dis(busy)}>
        <option value=""${ball.teamId === null ? ' selected' : ''}>No team</option>
        ${teams
            .map(
                (t) =>
                    `<option value="${esc(t.id)}"${ball.teamId === t.id ? ' selected' : ''}>${esc(t.name)}</option>`,
            )
            .join('')}
    </select>`;
}

function configRecord(config: unknown): Record<string, unknown> {
    return typeof config === 'object' && config !== null && !Array.isArray(config)
        ? (config as Record<string, unknown>)
        : {};
}

function sourceEditor(source: SeriesPointSource, input: SetupInput): string {
    const rule = input.rules.find((r) => r.id === source.ruleId);
    const config = configRecord(source.config);
    const fields = (rule?.configFields ?? [])
        .map((field) => {
            if (field.kind === 'number') {
                const v = typeof config[field.key] === 'number' ? config[field.key] : field.default;
                return `<label class="ss-field"><span>${esc(field.label)}</span>
                    <input type="number" inputmode="decimal" data-key="${esc(field.key)}" data-kind="number"
                        value="${esc(v)}" min="${field.min ?? 0}" step="${field.step ?? 1}" /></label>`;
            }
            if (field.kind === 'team_points') {
                const byTeam = configRecord(config[field.key]);
                return input.detail.teams
                    .map(
                        (t) => `<label class="ss-field" style="--team:${teamHex(t.colour)}">
                        <span><i class="ss-dot"></i>${esc(t.name)}</span>
                        <input type="number" inputmode="decimal" data-key="${esc(field.key)}" data-kind="team_points"
                            data-team="${esc(t.id)}" value="${esc(byTeam[t.id] ?? '')}" min="0" step="${field.step ?? 1}" /></label>`,
                    )
                    .join('');
            }
            return `<label class="ss-field ss-field--wide"><span>${esc(field.label)}</span>
                <input data-key="${esc(field.key)}" data-kind="text" value="${esc(config[field.key] ?? '')}" /></label>`;
        })
        .join('');
    return `
        <div class="ss-source" data-source-card="${esc(source.id)}">
            <div class="ss-inline">
                <input data-field="source-label" value="${esc(source.label)}" aria-label="What the points are for" />
                <span class="ss-muted">${esc(rule?.label ?? 'Unknown rule')}</span>
            </div>
            <div class="ss-fields">${fields}</div>
            <div class="ss-inline ss-inline--end">
                <button type="button" class="ss-link ss-link--danger" data-act="delete-source" data-source="${esc(source.id)}"${dis(input.busy)}>Remove</button>
                <button type="button" data-act="save-source" data-source="${esc(source.id)}"${dis(input.busy)}>Save points</button>
            </div>
        </div>`;
}

function addByHand(input: SetupInput, seriesRoundId: string | null): string {
    // The rule that needs no slot: selected by its declared shape, never by id.
    if (!input.rules.some((r) => r.appliesTo === 'none')) return '';
    return `<button type="button" class="ss-link" data-act="add-by-hand" data-round="${esc(
        seriesRoundId ?? '',
    )}"${dis(input.busy)}>Add points by hand</button>`;
}

function roundHtml(round: SeriesRoundDetail, input: SetupInput): string {
    const { detail, busy } = input;
    const sources = detail.sources.filter((s) => s.seriesRoundId === round.id);
    const covered = new Set(sources.map((s) => s.slotDefId));
    const missing = round.slots.filter((s) => s.suggestedRuleId && !covered.has(s.slotDefId));
    return `
        <div class="ss-card" data-round-card="${esc(round.id)}">
            <div class="ss-inline">
                <input data-field="round-label" value="${esc(round.label)}" aria-label="Session name" />
                <button type="button" data-act="relabel-round" data-round="${esc(round.id)}"${dis(busy)}>Save</button>
            </div>
            <p class="ss-muted">${esc([round.roundName, round.date?.slice(0, 10), STATUS_WORDS[round.status]].filter(Boolean).join(' · '))}</p>
            ${round.problem ? `<p class="sb-problem">${esc(round.problem)}</p>` : ''}
            <h4>Who plays for which team</h4>
            <ul class="ss-balls">
                ${round.balls
                    .map(
                        (b) =>
                            `<li><span>${esc(b.label)}${
                                b.teamId === null ? ' <small class="ss-warn">No team</small>' : ''
                            }</span>${ballTeamControl(round, b, detail.teams, busy)}</li>`,
                    )
                    .join('')}
            </ul>
            <h4>Points</h4>
            ${sources.map((s) => sourceEditor(s, input)).join('') || '<p class="ss-muted">Nothing pays points yet.</p>'}
            ${missing
                .map(
                    (slot) =>
                        `<button type="button" class="ss-link" data-act="add-slot-source" data-round="${esc(
                            round.id,
                        )}" data-slot="${esc(slot.slotDefId)}" data-rule="${esc(
                            slot.suggestedRuleId,
                        )}" data-label="${esc(slot.formatLabel)}"${dis(busy)}>Score ${esc(slot.formatLabel)} for points</button>`,
                )
                .join('')}
            ${addByHand(input, round.id)}
            <button type="button" class="ss-link ss-link--danger" data-act="detach-round" data-round="${esc(round.id)}"${dis(busy)}>Remove round from event</button>
        </div>`;
}

export function renderSetup(input: SetupInput): string {
    const { detail, busy } = input;
    const taken = new Set(
        detail.teams.flatMap((t) => t.members.map((m) => m.playerId).filter((id): id is string => !!id)),
    );
    const loose = detail.sources.filter((s) => s.seriesRoundId === null);
    const attach =
        input.rounds.length === 0
            ? '<p class="ss-muted">Create the round first, then add it here. Only rounds you created or play in show up.</p>'
            : `
            <div class="ss-card" data-attach-card>
                <select data-field="attach-round" aria-label="Round">
                    ${input.rounds.map((r) => `<option value="${esc(r.token)}">${esc(r.label)}</option>`).join('')}
                </select>
                <div class="ss-inline">
                    <input data-field="attach-label" placeholder="Session name, for example Friday morning" aria-label="Session name" />
                    <button type="button" data-act="attach-round"${dis(busy)}>Add round</button>
                </div>
            </div>`;
    return `
        <section class="ss-section" data-name-card>
            <h3>Event</h3>
            <div class="ss-inline">
                <input data-field="series-name" value="${esc(detail.name)}" aria-label="Event name" />
                <button type="button" data-act="rename"${dis(busy)}>Save</button>
            </div>
            <button type="button" class="ss-link" data-act="copy-link">Copy link to the board</button>
        </section>
        <section class="ss-section">
            <h3>Teams</h3>
            ${detail.teams.map((t) => teamHtml(t, input, taken)).join('')}
            <button type="button" class="ss-link" data-act="add-team"${dis(busy)}>Add a team</button>
        </section>
        <section class="ss-section">
            <h3>Rounds</h3>
            ${detail.rounds.map((r) => roundHtml(r, input)).join('')}
            ${attach}
        </section>
        <section class="ss-section">
            <h3>Other points</h3>
            <p class="ss-muted">For anything outside a round: longest drive, a putting contest.</p>
            ${loose.map((s) => sourceEditor(s, input)).join('')}
            ${addByHand(input, null)}
        </section>
        <section class="ss-section">
            <button type="button" class="ss-link ss-link--danger" data-act="delete-series"${dis(busy)}>Delete this team event</button>
        </section>`;
}

/**
 * Read a source editor's inputs back into a rule config. The shape follows the
 * field `kind` carried on each input, so this never needs to know the rule.
 */
export function readConfig(card: ParentNode): Record<string, unknown> {
    const config: Record<string, unknown> = {};
    for (const el of card.querySelectorAll<HTMLInputElement>('input[data-key]')) {
        const key = el.dataset.key!;
        const kind = el.dataset.kind;
        if (kind === 'text') {
            config[key] = el.value;
            continue;
        }
        const n = el.value.trim() === '' ? null : Number(el.value.replace(',', '.'));
        if (kind === 'team_points') {
            const byTeam = (config[key] ??= {}) as Record<string, number>;
            if (n !== null && Number.isFinite(n)) byTeam[el.dataset.team!] = n;
        } else if (n !== null && Number.isFinite(n)) {
            config[key] = n;
        }
    }
    return config;
}
