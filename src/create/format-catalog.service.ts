import { Signal } from '@basics/core/client/core';
import { request, type RequestError } from '@basics/core/client/request';
import { api } from '../api';
import type { FormatConfigField, FormatConfigOption, FormatDescriptor } from '../api/setup.gen';
import { currentLocale, type Locale } from '../locale';

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

/**
 * How many balls a format is contested between, and how many players may share
 * one of those balls. DERIVED from `requirements.balls` — see `playableShape`.
 * `count.max` absent ⇒ unbounded (add as many balls as the roster allows).
 */
export interface PlayableShape {
    count: { min: number; max?: number };
    size: { min: number; max: number };
}

/**
 * The largest team the setup UI will build — the `team_ball` strategy's
 * composition bound (2–10 players). Lives here rather than in `setup.service`
 * because the derived {@link PlayableShape} needs it too and the service
 * already imports this module (the reverse would be a cycle).
 */
export const MAX_TEAM_SIZE = 10;

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

    /**
     * Locale-appropriate display label for a descriptor (or a format id
     * looked up against the loaded catalog). Picks `labels[locale]`, falling
     * back to `labels.en`, then to the descriptor's canonical `label`. Never
     * throws on an unknown id — returns `null` so callers keep their own
     * fallback (e.g. `slot-labels.ts`'s scoringMode/teamShape string).
     *
     * `locale` defaults to `currentLocale()` (the browser's `navigator.language`);
     * pass it explicitly to test locale-specific behaviour without touching
     * global state.
     */
    labelOf(descriptorOrId: FormatDescriptor | string, locale: Locale = currentLocale()): string | null {
        const d = typeof descriptorOrId === 'string' ? this.byId(descriptorOrId) : descriptorOrId;
        if (!d) return null;
        return d.labels?.[locale] ?? d.labels?.en ?? d.label;
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

    /**
     * Locale-appropriate label for a config field or one of its options
     * (`FormatConfigField` / `FormatConfigOption`). These carry `labels` ONLY —
     * there is no bare `label` fallback the way `FormatDescriptor` has one — so
     * the resolution is `labels[locale] ?? labels.en`, mirroring `labelOf`.
     * `locale` defaults to `currentLocale()`; pass it explicitly in tests.
     */
    configLabelOf(
        item: FormatConfigField | FormatConfigOption,
        locale: Locale = currentLocale(),
    ): string {
        return item.labels?.[locale] ?? item.labels?.en ?? '';
    }

    /**
     * The curated game cards (format-templates §1): every descriptor declaring
     * a `preset`, ordered by `rank` (lower first; an absent rank sorts last,
     * then by label so the order is stable). Absent `preset` ⇒ the format is
     * not offered as a card — it stays reachable through the flexible form.
     * NOT a client-side registry: the list is whatever the server declares.
     */
    presets(locale: Locale = currentLocale()): FormatDescriptor[] {
        const ranked = this.descriptors.get().filter((d) => d.preset);
        return ranked.sort((a, b) => {
            const ra = a.preset?.rank ?? Number.POSITIVE_INFINITY;
            const rb = b.preset?.rank ?? Number.POSITIVE_INFINITY;
            if (ra !== rb) return ra - rb;
            return (this.labelOf(a, locale) ?? a.id).localeCompare(this.labelOf(b, locale) ?? b.id);
        });
    }

    /**
     * The card's "what is this game" line — the descriptor's own
     * `preset.tagline`, resolved with the same locale rule as {@link labelOf}
     * (`tagline[locale] ?? tagline.en`). Empty string for a descriptor that
     * declares no preset, so a caller never has to null-check for display.
     */
    taglineOf(
        descriptorOrId: FormatDescriptor | string,
        locale: Locale = currentLocale(),
    ): string {
        const d = typeof descriptorOrId === 'string' ? this.byId(descriptorOrId) : descriptorOrId;
        const tagline = d?.preset?.tagline;
        return tagline?.[locale] ?? tagline?.en ?? '';
    }

    /**
     * What a game is contested BETWEEN — derived from the descriptor's declared
     * ball requirement, never from a per-format client table (format-templates
     * §1 "The ball shape is derived, not declared"):
     *
     *   - `requiresSlotTeamGrouping` → the declared team count × team size
     *     (taliban / umbrella 4-ball: 2 balls × 2 players). Checked FIRST: a
     *     grouping format also declares `slotBallCount` (the total player
     *     count), which is not the number of contesting balls.
     *   - `slotBallCount`, no grouping → that many balls; a ball holds one
     *     player, or up to MAX_TEAM_SIZE when the format accepts aggregated
     *     side subjects (ADR-0004) — köpenhamnare: 3 balls × 1–N, umbrella
     *     individual (per-ball metadata): 3 balls × 1.
     *   - neither → individual play: every player is their own ball, so the
     *     count is unbounded above.
     *
     * `ballMode: 'team'` (foursomes / greensomes / scramble) is checked first,
     * as in `classify`: the ball IS the team, so a ball holds `producerCount`
     * players and the balls are however many the slot declares. No builtin
     * declares it today — it is handled so that registering one needs no client
     * change, which is the whole point of deriving the shape.
     */
    playableShape(d: FormatDescriptor): PlayableShape {
        const balls = d.requirements.balls;
        if (balls.ballMode === 'team') {
            return {
                count: this.ballCountOf(balls.slotBallCount),
                size: { ...balls.producerCount },
            };
        }
        if (balls.requiresSlotTeamGrouping) {
            const grouping = balls.slotTeamGrouping ?? {};
            const teamCount = grouping.teamCount ?? {};
            return {
                count: {
                    min: teamCount.min ?? 2,
                    ...(teamCount.max !== undefined ? { max: teamCount.max } : {}),
                },
                size: { min: grouping.teamSize?.min ?? 2, max: grouping.teamSize?.max ?? 2 },
            };
        }
        if (balls.slotBallCount) {
            const multi = this.acceptsSideSubjects(d);
            return {
                count: this.ballCountOf(balls.slotBallCount),
                size: { min: 1, max: multi ? MAX_TEAM_SIZE : 1 },
            };
        }
        return { count: { min: 1 }, size: { min: 1, max: 1 } };
    }

    /** A declared `slotBallCount` as playable bounds: two balls minimum (one
     * ball is not a contest) and an absent max stays unbounded. */
    private ballCountOf(declared: { min?: number; max?: number } | undefined): {
        min: number;
        max?: number;
    } {
        return {
            min: declared?.min ?? 2,
            ...(declared?.max !== undefined ? { max: declared.max } : {}),
        };
    }

    classifyId(id: string): FormatClass | null {
        const d = this.byId(id);
        return d ? this.classify(d) : null;
    }

    needsTeams(id: string): boolean {
        const c = this.classifyId(id);
        return !!c && c.kind !== 'individual';
    }

    /**
     * A side format (better-ball / taliban / umbrella-4ball) aggregates within
     * each side and compares sides — its subjects are multi-ball (side) teams,
     * not individual balls. Ball formats (everything else) score players +
     * single-ball teams.
     */
    isSideFormat(id: string): boolean {
        return this.classifyId(id)?.kind === 'team_grouping';
    }

    /**
     * ADR-0004 — a BALL format may additionally score a multi-ball (side)
     * team: the engine aggregates the side's best net into one virtual
     * subject. Two exclusions, both descriptor-driven: side formats (they
     * consume sides directly, not as aggregated subjects) and formats that
     * take per-ball metadata (umbrella's GIR — no defined side aggregation).
     *
     * Takes a descriptor OR an id (like `labelOf`), so a derivation holding a
     * descriptor doesn't have to round-trip through the loaded catalog.
     */
    acceptsSideSubjects(descriptorOrId: FormatDescriptor | string): boolean {
        const d = typeof descriptorOrId === 'string' ? this.byId(descriptorOrId) : descriptorOrId;
        if (!d) return false;
        if (this.classify(d).kind === 'team_grouping') return false;
        return (d.requirements.scoreEntry?.metadata?.length ?? 0) === 0;
    }
}
