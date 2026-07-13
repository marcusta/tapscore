import { Component, Computed, template } from '@basics/core/client/core';
import { ConfirmComponent } from '@basics/core/client/ui/confirm';
import type {
    CompetitionRankedEntry,
    CompetitionRoundCell,
} from '../api/competitions.gen';
import { CompetitionDetailService } from './competition-detail.service';
import { CompetitionsService } from './competitions.service';
import {
    arithmeticParts,
    competitionBoardRowKey,
    type CompetitionRoundColumn,
} from './competition-board-model';

type RoundColumn = CompetitionRoundColumn;

interface BoardRow {
    entry: CompetitionRankedEntry;
    points: number | null;
}

type BoardCell =
    | { kind: 'position'; text: string }
    | { kind: 'who'; entry: CompetitionRankedEntry }
    | { kind: 'round'; cell: CompetitionRoundCell | null; divider: boolean }
    | { kind: 'total'; text: string }
    | { kind: 'points'; text: string };

const tpl = template(`
    <div>
        <section bind="admin" class="cd__section cd__admin">
            <div class="cd__section-head"><h2>Admin</h2></div>
            <div bind="cutOutcome" class="cd__cutoutcome">
                <div class="cd__cutgrp">
                    <strong bind="advancedLabel"></strong> <span bind="advanced"></span>
                </div>
                <div class="cd__cutgrp">
                    <strong bind="cutLabel"></strong> <span bind="cut"></span>
                </div>
            </div>
            <div class="cd__adminbtns">
                <button bind="applyCut" class="cd__cutbtn" type="button">Apply cut</button>
                <button bind="finalize" class="cd__finalbtn" type="button">Finalize</button>
            </div>
            <p class="cd__adminnote">Finalizing freezes the results — it can't be undone.</p>
        </section>
        <section class="cd__section">
            <div class="cd__section-head"><h2 bind="title">Leaderboard</h2></div>
            <div bind="switcher" class="cd__setswitch"></div>
            <div bind="board" class="cd__board">
                <div bind="official" class="cd__official-banner"></div>
                <div bind="boardHead" class="cb-head">
                    <h3 bind="metric" class="cb-head__title"></h3>
                    <span bind="operator" class="cb-head__op"></span>
                    <span bind="defaulted" class="cb-head__hint">· default scoring</span>
                </div>
                <div bind="empty" class="cb-empty">No scores yet — the board fills in as rounds are played.</div>
                <table bind="table" class="cb">
                    <thead><tr bind="headers"></tr></thead>
                    <tbody bind="rows"></tbody>
                </table>
            </div>
            <div bind="refusal" class="cd__empty"></div>
        </section>
        <div bind="cutConfirm"></div>
        <div bind="finalizeConfirm"></div>
    </div>
`);

const buttonTpl = template(`<button bind="button" type="button"></button>`);
const headerTpl = template(`<th bind="cell"></th>`);
const rowTpl = template(`<tr bind="row"></tr>`);
const valueCellTpl = template(`<td bind="cell"><span bind="value"></span></td>`);
const whoCellTpl = template(`
    <td bind="cell" class="cb-who">
        <div class="cb-who__line">
            <span bind="name" class="cb-name"></span>
            <span bind="category" class="cb-tag cb-cat"></span>
            <span bind="status" class="cb-tag cb-tag--out"></span>
        </div>
        <div class="cb-arith">
            <span bind="parts"></span><span bind="equals"> = </span><span bind="total" class="cb-arith__total"></span>
        </div>
    </td>
`);
const arithmeticTpl = template(`<span bind="part"><span bind="separator"></span><span bind="value"></span></span>`);

export class CompetitionResultsComponent extends Component {
    private competitions = this.inject(CompetitionsService);
    private state = this.inject(CompetitionDetailService);

    render(): DocumentFragment {
        const rows = new Computed<BoardRow[]>(() => {
            if (this.state.lifecycle.get() !== 'finalized') {
                return (this.competitions.board.get()?.view.entries ?? []).map((entry) => ({
                    entry,
                    points: null,
                }));
            }
            const resultSets = this.competitions.results.get()?.resultSets ?? [];
            const index = Math.min(this.state.resultSetIndex.get(), resultSets.length - 1);
            return (resultSets[index]?.entries ?? []).map((result) => ({
                entry: result.entry,
                points: result.points,
            }));
        });
        const columns = new Computed<RoundColumn[]>(() => {
            const live = this.competitions.board.get()?.view.rounds ?? [];
            if (live.length > 0) return live;
            const numbers = new Set<number>();
            for (const row of rows.get()) {
                for (const cell of row.entry.rounds) numbers.add(cell.roundNumber);
            }
            return [...numbers]
                .sort((a, b) => a - b)
                .map((roundNumber) => ({ roundNumber, postCut: false }));
        });
        const finalized = () => this.state.lifecycle.get() === 'finalized';
        const hasBoard = () =>
            finalized()
                ? (this.competitions.results.get()?.resultSets.length ?? 0) > 0
                : this.competitions.board.get() !== null;
        const outcome = () => this.state.cutOutcome.get();
        const names = (entries: { displayName: string }[]) =>
            entries.length === 0 ? '—' : entries.map((entry) => entry.displayName).join(', ');

        const frag = this.wire(tpl, {
            admin: {
                className: () =>
                    this.state.admin.get() && this.state.lifecycle.get() === 'active'
                        ? 'cd__section cd__admin'
                        : 'cd__section cd__admin hidden',
            },
            cutOutcome: {
                className: () =>
                    outcome() ? 'cd__cutoutcome' : 'cd__cutoutcome hidden',
            },
            advancedLabel: () => `Advanced (${outcome()?.advanced.length ?? 0}):`,
            advanced: () => names(outcome()?.advanced ?? []),
            cutLabel: () => `Cut (${outcome()?.cut.length ?? 0}):`,
            cut: () => names(outcome()?.cut ?? []),
            applyCut: {
                disabled: () => this.competitions.mutating.get(),
                onclick: () => this.state.cutConfirmOpen.set(true),
            },
            finalize: {
                disabled: () => this.competitions.mutating.get(),
                onclick: () => this.state.finalizeConfirmOpen.set(true),
            },
            title: () => (finalized() ? 'Official results' : 'Leaderboard'),
            board: { className: () => (finalized() ? 'cd__board cb cb--official' : 'cd__board') },
            official: {
                textContent: () => {
                    const date = this.competitions.results.get()?.finalizedAt.slice(0, 10) ?? '';
                    return finalized() && date ? `Official results · finalized ${date}` : '';
                },
                className: () =>
                    finalized() ? 'cd__official-banner' : 'cd__official-banner hidden',
            },
            boardHead: {
                className: () => (finalized() ? 'cb-head hidden' : 'cb-head'),
            },
            metric: () => this.competitions.board.get()?.view.metricLabel ?? '',
            operator: () => {
                const board = this.competitions.board.get();
                if (!board) return '';
                return board.view.operator.kind === 'best_n'
                    ? `Best ${board.view.operator.n} of ${board.view.rounds.length}`
                    : 'Total across rounds';
            },
            defaulted: {
                className: () =>
                    this.competitions.board.get()?.defaulted ? 'cb-head__hint' : 'cb-head__hint hidden',
            },
            empty: {
                className: () =>
                    hasBoard() && rows.get().length === 0 ? 'cb-empty' : 'cb-empty hidden',
            },
            table: {
                className: () => (hasBoard() && rows.get().length > 0 ? 'cb' : 'cb hidden'),
            },
            refusal: {
                textContent: () =>
                    finalized()
                        ? this.competitions.resultsRefusal.get() ?? ''
                        : this.competitions.board.get() === null
                          ? this.competitions.boardRefusal.get() ?? ''
                          : '',
            },
        });

        const headers = new Computed(() => [
            { text: '#', className: 'cb-pos' },
            { text: 'Player', className: 'cb-who' },
            ...columns.get().map((column, index, all) => ({
                text: `R${column.roundNumber}`,
                className: `cb-c${column.postCut && !all.slice(0, index).some((c) => c.postCut) ? ' cb-c--divider' : ''}`,
            })),
            { text: 'Total', className: 'cb-total' },
            ...(finalized() ? [{ text: 'Pts', className: 'cb-points' }] : []),
        ]);
        this.$each(
            this.ref(frag, 'headers'),
            headers,
            (header, index, track) =>
                this.wireEl(
                    headerTpl,
                    { cell: { textContent: () => header.text, className: () => header.className } },
                    track,
                ),
            (header) => `${header.text}:${header.className}`,
        );
        this.$each(
            this.ref(frag, 'rows'),
            rows,
            (row, _index, track) => this.boardRow(row, columns.get(), track),
            (row) => competitionBoardRowKey(row.entry, row.points, columns.get()),
        );
        this.$each(
            this.ref(frag, 'switcher'),
            new Computed(() => (finalized() ? this.competitions.results.get()?.resultSets ?? [] : [])),
            (set, index, track) =>
                this.wireEl(
                    buttonTpl,
                    {
                        button: {
                            textContent: () => set.scoringType.toUpperCase(),
                            className: () => (this.state.resultSetIndex.get() === index ? 'on' : ''),
                            onclick: () => this.state.resultSetIndex.set(index),
                        },
                    },
                    track,
                ),
            (set) => set.scoringType,
        );
        this.spawn(ConfirmComponent, this.ref(frag, 'cutConfirm'), {
            open: this.state.cutConfirmOpen,
            title: 'Apply cut?',
            message:
                'This evaluates the configured cut against the current aggregate and marks who advances. Cut players are left out of later rounds.',
            confirmLabel: 'Apply cut',
            cancelLabel: 'Cancel',
            onconfirm: async () => {
                const result = await this.competitions.applyCut(this.state.id.get() ?? '');
                if (result.ok) this.state.cutOutcome.set(result.outcome);
            },
        });
        this.spawn(ConfirmComponent, this.ref(frag, 'finalizeConfirm'), {
            open: this.state.finalizeConfirmOpen,
            title: 'Finalize competition?',
            message:
                'Finalizing freezes the official results and locks the competition. This cannot be undone.',
            confirmLabel: 'Finalize',
            cancelLabel: 'Cancel',
            danger: true,
            onconfirm: () => void this.competitions.finalize(this.state.id.get() ?? ''),
        });
        return frag;
    }

    private boardRow(
        row: BoardRow,
        columns: RoundColumn[],
        track: (dispose: () => void) => void,
    ): HTMLElement {
        const entry = row.entry;
        const demoted = entry.withdrawn || entry.cutAfterRound !== null;
        const classes = ['cb-row'];
        if (entry.withdrawn) classes.push('cb-row--withdrawn');
        else if (entry.cutAfterRound !== null) classes.push('cb-row--cut');
        else if (entry.position === 1) classes.push('cb-row--lead');
        if (entry.incomplete) classes.push('cb-row--incomplete');
        const firstPostCut = columns.findIndex((column) => column.postCut);
        const byRound = new Map(entry.rounds.map((cell) => [cell.roundNumber, cell]));
        const cells: BoardCell[] = [
            { kind: 'position', text: demoted ? '—' : String(entry.position) },
            { kind: 'who', entry },
            ...columns.map(
                (column, index): BoardCell => ({
                    kind: 'round',
                    cell: byRound.get(column.roundNumber) ?? null,
                    divider: index === firstPostCut,
                }),
            ),
            { kind: 'total', text: entry.total === null ? '—' : String(entry.total) },
            ...(row.points === null
                ? []
                : ([{ kind: 'points', text: String(row.points) }] as BoardCell[])),
        ];
        const element = this.wireEl(
            rowTpl,
            { row: { className: () => classes.join(' ') } },
            track,
        );
        this.$each(
            element,
            new Computed(() => cells),
            (cell, index, cellTrack) => this.boardCell(cell, cellTrack),
            (_cell, index) => index,
        );
        return element;
    }

    private boardCell(
        cell: BoardCell,
        track: (dispose: () => void) => void,
    ): HTMLElement {
        if (cell.kind === 'who') return this.whoCell(cell.entry, track);
        const className =
            cell.kind === 'position'
                ? 'cb-pos'
                : cell.kind === 'total'
                  ? 'cb-total'
                  : cell.kind === 'points'
                    ? 'cb-points'
                    : `cb-c cb-c--${cell.cell?.status ?? 'missing'}${cell.divider ? ' cb-c--divider' : ''}`;
        const text =
            cell.kind === 'round'
                ? cell.cell?.value === null || !cell.cell
                    ? '—'
                    : String(cell.cell.value)
                : cell.text;
        return this.wireEl(
            valueCellTpl,
            {
                cell: { className: () => className },
                value: {
                    textContent: () => text,
                    className: () =>
                        cell.kind === 'round' && cell.cell?.status === 'dropped' ? 'cb-struck' : '',
                },
            },
            track,
        );
    }

    private whoCell(
        entry: CompetitionRankedEntry,
        track: (dispose: () => void) => void,
    ): HTMLElement {
        const status = entry.withdrawn
            ? 'WD'
            : entry.cutAfterRound !== null
              ? `Cut R${entry.cutAfterRound}`
              : '';
        const parts = arithmeticParts(entry);
        const element = this.wireEl(
            whoCellTpl,
            {
                cell: {},
                name: () => entry.displayName,
                category: {
                    textContent: () => entry.category ?? '',
                    className: () => (entry.category ? 'cb-tag cb-cat' : 'cb-tag cb-cat hidden'),
                },
                status: {
                    textContent: () => status,
                    className: () =>
                        status ? 'cb-tag cb-tag--out' : 'cb-tag cb-tag--out hidden',
                },
                equals: { className: () => (parts.length === 0 ? 'hidden' : '') },
                total: () => (entry.total === null ? '—' : String(entry.total)),
            },
            track,
        );
        this.$each(
            element.querySelector('[bind="parts"]') as HTMLElement,
            new Computed(() => parts),
            (part, index, partTrack) =>
                this.wireEl(
                    arithmeticTpl,
                    {
                        separator: () => (index === 0 ? '' : ' + '),
                        value: {
                            textContent: () => part.text,
                            className: () => (part.dropped ? 'cb-struck' : ''),
                        },
                    },
                    partTrack,
                ),
            (_part, index) => index,
        );
        return element;
    }
}
