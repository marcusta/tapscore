import { Signal } from '@basics/core/client/core';
import { request, type RequestError } from '@basics/core/client/request';
import { api, ApiError } from '../api';
import type {
    SeriesBoardView,
    SeriesDetail,
    SeriesRefusal,
    SeriesSummary,
    SeriesTeam,
    TeamPointsDescriptor,
} from '../api/series.gen';
import { buildMyRounds, type MyRoundEntry } from '../landing/my-rounds';
import { getDeviceSeries, recordDeviceSeries, type DeviceSeries } from './device-series';

type Outcome<T> = { ok: true; value: T } | { ok: false; refusal: SeriesRefusal };

/**
 * The team-events surface model. A DI singleton shared by the list screen and
 * the board screen.
 *
 * The board is an open read by series share token. Everything else is
 * session-scoped and admin-gated on the server; the client only decides which
 * controls to draw, from `board.canEdit`.
 *
 * A mutation returns the server's refusal message verbatim in `mutateError`
 * (null on success), then refreshes the board so the totals follow the edit.
 */
export class SeriesService {
    // --- list ---
    readonly list = new Signal<SeriesSummary[]>([]);
    readonly listLoading = new Signal(false);
    readonly listError = new Signal<RequestError | null>(null);
    readonly listLoaded = new Signal(false);
    readonly deviceList = new Signal<DeviceSeries[]>(getDeviceSeries());

    // --- board (per token) ---
    readonly board = new Signal<SeriesBoardView | null>(null);
    readonly boardToken = new Signal<string | null>(null);
    readonly boardLoading = new Signal(false);
    readonly boardError = new Signal<RequestError | null>(null);

    // --- setup (admin only) ---
    readonly detail = new Signal<SeriesDetail | null>(null);
    readonly rules = new Signal<TeamPointsDescriptor[]>([]);
    readonly myRounds = new Signal<MyRoundEntry[]>([]);

    // --- mutation edge ---
    readonly mutating = new Signal(false);
    readonly mutateError = new Signal<string | null>(null);

    async loadList(force = false): Promise<void> {
        if (!force && (this.listLoaded.get() || this.listLoading.get())) return;
        const data = await request(this.listLoading, this.listError, () => api.series.list());
        if (!data) return;
        this.list.set(data);
        this.listLoaded.set(true);
    }

    /**
     * Load the board for a share token. Load-once per token unless forced, so
     * `$swap` churn never storms the endpoint. `silent` is the poll path: it
     * keeps the last good board on a failed tick instead of flashing an error.
     */
    async loadBoard(token: string, opts: { force?: boolean; silent?: boolean } = {}): Promise<void> {
        const same = this.boardToken.get() === token;
        if (!opts.force && same && (this.board.get() !== null || this.boardLoading.get())) return;
        if (!same) {
            this.board.set(null);
            this.detail.set(null);
            this.mutateError.set(null);
        }
        this.boardToken.set(token);
        let data: SeriesBoardView | undefined;
        if (opts.silent) {
            try {
                data = await api.series.board({ token });
            } catch {
                return;
            }
        } else {
            data = await request(this.boardLoading, this.boardError, () =>
                api.series.board({ token }),
            );
        }
        if (!data || this.boardToken.get() !== token) return;
        this.board.set(data);
        this.deviceList.set(
            recordDeviceSeries({ token, name: data.name, lastSeenAt: new Date().toISOString() }),
        );
    }

    /** Admin-only reads behind the setup view. Safe to call repeatedly. */
    async loadSetup(seriesId: string): Promise<void> {
        try {
            const [detail, rules, mine] = await Promise.all([
                api.series.get({ seriesId }),
                this.rules.get().length > 0 ? this.rules.get() : api.series.rules(),
                api.dashboard.myRounds(),
            ]);
            this.detail.set(detail);
            this.rules.set(rules);
            this.myRounds.set(buildMyRounds(mine.produced, mine.created));
        } catch (err) {
            this.mutateError.set(err instanceof Error ? err.message : 'Could not load the setup');
        }
    }

    async create(name: string): Promise<SeriesSummary | null> {
        const created = await this.run(() =>
            api.series.create({
                name,
                teams: [
                    { name: 'Red', colour: 'red' },
                    { name: 'Blue', colour: 'blue' },
                ],
            }),
        );
        if (created) this.list.set([created, ...this.list.get()]);
        return created;
    }

    async remove(seriesId: string): Promise<boolean> {
        const done = await this.run(() => api.series.remove({ seriesId }));
        if (!done) return false;
        this.list.set(this.list.get().filter((s) => s.id !== seriesId));
        return true;
    }

    /** A mutation whose answer is the team list. */
    async mutateTeams(call: () => Promise<Outcome<SeriesTeam[]>>): Promise<boolean> {
        const teams = await this.run(call);
        if (!teams) return false;
        const detail = this.detail.get();
        if (detail) this.detail.set({ ...detail, teams });
        await this.refreshBoard();
        return true;
    }

    /** A mutation whose answer is the whole detail. */
    async mutateDetail(call: () => Promise<Outcome<SeriesDetail>>): Promise<boolean> {
        const detail = await this.run(call);
        if (!detail) return false;
        this.detail.set(detail);
        await this.refreshBoard();
        return true;
    }

    async rename(seriesId: string, name: string): Promise<boolean> {
        const summary = await this.run(() => api.series.rename({ seriesId, name }));
        if (!summary) return false;
        const detail = this.detail.get();
        if (detail) this.detail.set({ ...detail, name: summary.name });
        this.list.set(this.list.get().map((s) => (s.id === summary.id ? summary : s)));
        await this.refreshBoard();
        return true;
    }

    private async refreshBoard(): Promise<void> {
        const token = this.boardToken.get();
        if (token) await this.loadBoard(token, { force: true, silent: true });
    }

    private async run<T>(call: () => Promise<Outcome<T>>): Promise<T | null> {
        this.mutating.set(true);
        this.mutateError.set(null);
        try {
            const res = await call();
            if (res.ok) return res.value;
            this.mutateError.set(res.refusal.message);
            return null;
        } catch (err) {
            this.mutateError.set(
                err instanceof ApiError || err instanceof Error ? err.message : 'Something went wrong',
            );
            return null;
        } finally {
            this.mutating.set(false);
        }
    }
}
