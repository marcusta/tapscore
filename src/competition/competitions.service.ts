import { Signal } from '@basics/core/client/core';
import { request, type RequestError } from '@basics/core/client/request';
import { api } from '../api';
import type {
    Competition,
    CompetitionDetail,
    CompetitionLeaderboard,
    CompetitionParticipant,
    CompetitionResults,
    CutOutcome,
    FinalizeOutcome,
} from '../api/competitions.gen';

/**
 * Whether the viewer administers a competition. The open detail read only
 * carries a round's `shareToken` for admin readers (its presence ⇒ admin), but
 * a fresh draft has no rounds yet — so we also accept owner identity. A
 * non-owner `competition_admin` grantee is recognised the moment the first
 * round exists (it carries their token); until then the server still enforces
 * every mutation, so the worst case is a briefly-hidden control, never a
 * broken write. Pure so it is trivially testable.
 */
export function isAdmin(detail: CompetitionDetail | null, myPlayerId: string | null): boolean {
    if (!detail) return false;
    if (myPlayerId !== null && detail.ownerPlayerId === myPlayerId) return true;
    return detail.rounds.some((r) => typeof r.shareToken === 'string');
}

/**
 * The competitions surface model (Phase 4 Slice 5). A DI singleton shared by
 * the list screen and the detail screen. Every endpoint here is session-scoped
 * (the list 401s without a login), so callers gate it behind the auth side
 * door exactly like the friends/profile services.
 *
 * Mutations return the server's humanized refusal message verbatim (or null on
 * success) so the caller renders it without interpretation; hard failures
 * (auth / validation) land in `mutateError`. Reads use the shared `request`
 * loading/error wrapper.
 */
export class CompetitionsService {
    // --- list ---
    readonly list = new Signal<Competition[]>([]);
    readonly listLoading = new Signal(false);
    readonly listError = new Signal<RequestError | null>(null);
    readonly listLoaded = new Signal(false);

    // --- detail (per id) ---
    readonly detail = new Signal<CompetitionDetail | null>(null);
    readonly detailId = new Signal<string | null>(null);
    readonly detailLoading = new Signal(false);
    readonly detailError = new Signal<RequestError | null>(null);

    readonly participants = new Signal<CompetitionParticipant[]>([]);

    // --- live aggregated board ---
    readonly board = new Signal<CompetitionLeaderboard | null>(null);
    readonly boardRefusal = new Signal<string | null>(null);
    readonly boardLoading = new Signal(false);

    // --- finalized results ---
    readonly results = new Signal<CompetitionResults | null>(null);
    readonly resultsRefusal = new Signal<string | null>(null);

    // --- mutation edge ---
    readonly mutating = new Signal(false);
    readonly mutateError = new Signal<string | null>(null);

    /** Load-once list of the viewer's competitions (owned ∪ admin-granted;
     *  the server filters). Mutations keep it fresh locally. */
    async loadList(force = false): Promise<void> {
        if (!force && (this.listLoaded.get() || this.listLoading.get())) return;
        const data = await request(this.listLoading, this.listError, () => api.competitions.list());
        if (!data) return;
        this.list.set(data);
        this.listLoaded.set(true);
    }

    /**
     * Load one competition's detail + roster + live board. Load-once per id:
     * a remount for the SAME id skips the refetch (mutations refresh
     * explicitly), so `$swap` churn never storms the endpoint. Switching id
     * always reloads. Never reads a signal at construction — callers invoke
     * this from a render body / effect, never a field initializer.
     */
    async loadDetail(id: string, force = false): Promise<void> {
        if (
            !force &&
            this.detailId.get() === id &&
            this.detail.get() !== null &&
            !this.detailLoading.get()
        ) {
            return;
        }
        if (this.detailLoading.get() && this.detailId.get() === id) return;
        this.detailId.set(id);
        const data = await request(this.detailLoading, this.detailError, () =>
            Promise.all([
                api.competitions.get({ id }),
                api.competitions.participants({ competitionId: id }),
            ]),
        );
        if (!data) return;
        const [detail, participants] = data;
        // A late response for an id the user has since navigated away from must
        // not clobber the current view.
        if (this.detailId.get() !== id) return;
        this.detail.set(detail);
        this.participants.set(participants);
        await this.loadBoard(id);
        if (detail.lifecycle === 'finalized') await this.loadResults(id);
    }

    /** (Re)fetch the live aggregated board for the current competition. Open
     *  read; a refusal (e.g. no rounds yet) parks its message in `boardRefusal`. */
    async loadBoard(id: string): Promise<void> {
        this.boardLoading.set(true);
        try {
            const res = await api.competitions.leaderboard({ id });
            if (res.ok) {
                this.board.set(res.value);
                this.boardRefusal.set(null);
            } else {
                this.board.set(null);
                this.boardRefusal.set(res.refusal.message);
            }
        } catch {
            this.board.set(null);
            this.boardRefusal.set(null);
        } finally {
            this.boardLoading.set(false);
        }
    }

    /** (Re)fetch the frozen results (gross/net sets) for a finalized
     *  competition; `not_finalized` and friends land in `resultsRefusal`. */
    async loadResults(id: string): Promise<void> {
        try {
            const res = await api.competitions.results({ id });
            if (res.ok) {
                this.results.set(res.value);
                this.resultsRefusal.set(null);
            } else {
                this.results.set(null);
                this.resultsRefusal.set(res.refusal.message);
            }
        } catch {
            this.results.set(null);
        }
    }

    /** Create a competition; on success prepend it to the loaded list and
     *  return it so the caller can navigate into its detail. Hard failures
     *  surface in `mutateError`; returns null. */
    async create(name: string): Promise<Competition | null> {
        this.mutating.set(true);
        this.mutateError.set(null);
        try {
            const comp = await api.competitions.create({ name });
            this.list.set([comp, ...this.list.get()]);
            return comp;
        } catch (err) {
            this.mutateError.set(errText(err));
            return null;
        } finally {
            this.mutating.set(false);
        }
    }

    /** Drive a lifecycle transition. Returns the refusal message verbatim, or
     *  null on success (detail is refreshed). */
    transition(id: string, to: Competition['lifecycle']): Promise<string | null> {
        return this.mutate(
            () => api.competitions.transition({ id, to }),
            () => this.loadDetail(id, true),
        );
    }

    /** Save setup defaults / aggregation / cut rules. Any subset of fields. */
    updateConfig(input: {
        id: string;
        name?: string;
        defaultConfig?: unknown;
        aggregation?: null | { strategyId: string; config: unknown };
        cutRules?: unknown;
    }): Promise<string | null> {
        return this.mutate(
            () => api.competitions.update(input),
            () => this.loadDetail(input.id, true),
        );
    }

    async addPlayer(competitionId: string, playerId: string, category: string | null): Promise<string | null> {
        return this.rosterMutate(competitionId, () =>
            api.competitions.addParticipant({ competitionId, playerId, category }),
        );
    }

    /** Create a guest player, then add them to the roster. */
    async addGuest(
        competitionId: string,
        guest: { displayName: string; gender: 'M' | 'F'; handicapIndex: number | null },
        category: string | null,
    ): Promise<string | null> {
        this.mutating.set(true);
        this.mutateError.set(null);
        let guestId: string;
        try {
            const created = await api.guestPlayers.create(guest);
            guestId = created.id;
        } catch (err) {
            this.mutating.set(false);
            this.mutateError.set(errText(err));
            return errText(err);
        }
        this.mutating.set(false);
        return this.rosterMutate(competitionId, () =>
            api.competitions.addParticipant({ competitionId, guestPlayerId: guestId, category }),
        );
    }

    removeParticipant(competitionId: string, participantId: string): Promise<string | null> {
        return this.rosterMutate(competitionId, () =>
            api.competitions.removeParticipant({ participantId }),
        );
    }

    withdrawParticipant(competitionId: string, participantId: string): Promise<string | null> {
        return this.rosterMutate(competitionId, () =>
            api.competitions.withdrawParticipant({ participantId }),
        );
    }

    /**
     * Materialise the next round from the competition defaults. Returns the new
     * round's share token on success (the caller opens `/round?token=…`), or a
     * refusal / compiler-diagnostic message verbatim. Detail refreshes so the
     * new round appears in the list.
     */
    async createRound(input: {
        id: string;
        courseId: string;
        playedAt: string;
        roundType?: 'full_18' | 'front_9' | 'back_9' | 'custom_holes';
        venueType?: 'outdoor' | 'indoor';
    }): Promise<{ ok: true; shareToken: string } | { ok: false; message: string }> {
        this.mutating.set(true);
        this.mutateError.set(null);
        try {
            const res = await api.competitions.createRound(input);
            if (res.ok) {
                await this.loadDetail(input.id, true);
                return { ok: true, shareToken: res.shareToken };
            }
            const message =
                'refusal' in res
                    ? res.refusal.message
                    : res.diagnostics.map((d) => d.message).join(' · ');
            this.mutateError.set(message);
            return { ok: false, message };
        } catch (err) {
            const message = errText(err);
            this.mutateError.set(message);
            return { ok: false, message };
        } finally {
            this.mutating.set(false);
        }
    }

    /** Apply the configured cut. Returns the outcome on success (advanced / cut
     *  lists) or the refusal message. Detail + board refresh. */
    async applyCut(id: string): Promise<{ ok: true; outcome: CutOutcome } | { ok: false; message: string }> {
        this.mutating.set(true);
        this.mutateError.set(null);
        try {
            const res = await api.competitions.applyCut({ id });
            if (res.ok) {
                await this.loadDetail(id, true);
                return { ok: true, outcome: res.value };
            }
            this.mutateError.set(res.refusal.message);
            return { ok: false, message: res.refusal.message };
        } catch (err) {
            const message = errText(err);
            this.mutateError.set(message);
            return { ok: false, message };
        } finally {
            this.mutating.set(false);
        }
    }

    /** Finalize (irreversible). Returns the outcome or the refusal message.
     *  Detail refreshes → lifecycle flips to finalized and results load. */
    async finalize(id: string): Promise<{ ok: true; outcome: FinalizeOutcome } | { ok: false; message: string }> {
        this.mutating.set(true);
        this.mutateError.set(null);
        try {
            const res = await api.competitions.finalize({ id });
            if (res.ok) {
                await this.loadDetail(id, true);
                return { ok: true, outcome: res.value };
            }
            this.mutateError.set(res.refusal.message);
            return { ok: false, message: res.refusal.message };
        } catch (err) {
            const message = errText(err);
            this.mutateError.set(message);
            return { ok: false, message };
        } finally {
            this.mutating.set(false);
        }
    }

    /** Forget everything (sign-out). */
    clear(): void {
        this.list.set([]);
        this.listLoaded.set(false);
        this.detail.set(null);
        this.detailId.set(null);
        this.participants.set([]);
        this.board.set(null);
        this.boardRefusal.set(null);
        this.results.set(null);
        this.resultsRefusal.set(null);
        this.listError.set(null);
        this.detailError.set(null);
        this.mutateError.set(null);
    }

    /** Shared union-refusal mutation: `{ok:false,refusal}` → its message;
     *  `{ok:true}` → run `onOk`, return null; a thrown ApiError → `mutateError`
     *  + its message. */
    private async mutate(
        call: () => Promise<{ ok: false; refusal: { message: string } } | { ok: true; value: unknown }>,
        onOk: () => Promise<void> | void,
    ): Promise<string | null> {
        this.mutating.set(true);
        this.mutateError.set(null);
        try {
            const res = await call();
            if (res.ok) {
                await onOk();
                return null;
            }
            this.mutateError.set(res.refusal.message);
            return res.refusal.message;
        } catch (err) {
            const message = errText(err);
            this.mutateError.set(message);
            return message;
        } finally {
            this.mutating.set(false);
        }
    }

    /** A roster mutation whose success refreshes the participant list. */
    private rosterMutate(
        competitionId: string,
        call: () => Promise<{ ok: false; refusal: { message: string } } | { ok: true; value: unknown }>,
    ): Promise<string | null> {
        return this.mutate(call, async () => {
            const participants = await api.competitions.participants({ competitionId });
            this.participants.set(participants);
        });
    }
}

/** Best available message from a thrown API error. */
function errText(err: unknown): string {
    if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
        return err.message;
    }
    return 'Something went wrong. Try again.';
}
