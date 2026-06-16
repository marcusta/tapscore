import { Signal } from '@basics/core/client/core';
import { request, type RequestError } from '@basics/core/client/request';
import { api } from '../api';
import type { FormatDescriptor } from '../api/setup.gen';

// Phase 2.6e M3 — the catalog-driven format step's data source. Loads the
// SERVER's registered format descriptors via the no-auth `GET /setup/formats`
// (same serializable catalog as the auth-gated `GET /formats`). This REPLACES
// the hand-maintained `src/formats.ts` list: the client never decides which
// formats exist, what they're called, or what ball/team shape they need — it
// reads it all from the descriptor. Ball-creation strategy ids stay
// server-owned; the client only submits formatId / teams / allowance and lets
// the format plugin's `planSetup` choose the strategy.

export type { FormatDescriptor } from '../api/setup.gen';

/**
 * How the generic setup UI treats a format:
 *   - `individual`     — producers auto-deduced (producer = player); no editor.
 *   - `team_grouping`  — own-ball formats that group players into teams at the
 *                        slot (better-ball, taliban, umbrella-4): a team editor.
 *   - `team_ball`      — formats whose ball IS the team (foursomes, greensomes,
 *                        scramble): a team editor; one ball per team.
 * `teamSize` / `teamCount` are the declared bounds the editor enforces softly
 * (the server re-validates and returns diagnostics at `formats[i].teams`).
 */
export type FormatKind = 'individual' | 'team_grouping' | 'team_ball';

export interface FormatClass {
    kind: FormatKind;
    /** Per-team producer count bounds. */
    teamSize: { min: number; max: number };
    /** Number-of-teams bounds, when the descriptor declares them. */
    teamCount?: { min?: number; max?: number };
}

export class FormatCatalogService {
    readonly loading = new Signal(false);
    readonly error = new Signal<RequestError | null>(null);
    readonly descriptors = new Signal<FormatDescriptor[]>([]);

    private started = false;

    async load(): Promise<void> {
        if (this.started) return; // catalog is immutable per session — fetch once
        this.started = true;
        const data = await request(this.loading, this.error, () => api.setup.formats());
        if (data) this.descriptors.set(data);
        else this.started = false; // allow a retry if the fetch failed
    }

    byId(id: string): FormatDescriptor | null {
        return this.descriptors.get().find((d) => d.id === id) ?? null;
    }

    /** Classify a descriptor into the UI shape the format step renders. */
    classify(d: FormatDescriptor): FormatClass {
        const balls = d.requirements.balls;
        if (balls.ballMode === 'team') {
            // The ball is the team: team size = per-ball producer count.
            return { kind: 'team_ball', teamSize: { ...balls.producerCount } };
        }
        if (balls.requiresSlotTeamGrouping) {
            const grouping = balls.slotTeamGrouping ?? {};
            return {
                kind: 'team_grouping',
                teamSize: {
                    min: grouping.teamSize?.min ?? 2,
                    max: grouping.teamSize?.max ?? 2,
                },
                ...(grouping.teamCount ? { teamCount: grouping.teamCount } : {}),
            };
        }
        return { kind: 'individual', teamSize: { min: 1, max: 1 } };
    }

    classifyId(id: string): FormatClass | null {
        const d = this.byId(id);
        return d ? this.classify(d) : null;
    }

    needsTeams(id: string): boolean {
        const c = this.classifyId(id);
        return !!c && c.kind !== 'individual';
    }
}
