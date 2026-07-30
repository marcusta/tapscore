// Player-stats capture, as pure value types (proposal `docs/proposals/player-stats.md` §1–2).
//
// The rules live here so they can be tested without a service, a network, or a
// DOM: which prompts a hole asks, how an answer changes that set, and what
// leaves the device when the step closes. `score-entry.component.ts` renders
// `prompts` and forwards taps; it decides nothing.
//
// The sibling of `advance-policy.ts`: plain data in, a decision out, ZERO
// imports, so the file is portable to Swift line for line
// (`ios/TapScore/Domain/StatPrompts.swift` is that port) and
// `tests/round/stat-prompts.test.ts` is the spec both are written against.

// ---------------------------------------------------------------------------
// Vocabulary
// ---------------------------------------------------------------------------

/**
 * The closed key set the server's `stat_events` log accepts. Declared here
 * rather than imported from `../api/player-stats.gen` to keep this module
 * import-free; the union is structurally identical (a divergence is a compile
 * error at the call sites that pass these keys to `appendEvents`).
 */
export type StatEventKey =
    | 'tee_result'
    | 'recovery_ok'
    | 'gir'
    | 'short_game_difficulty'
    | 'first_putt'
    | 'putts'
    | 'penalties';

/** Which capture modules a player has enabled (`GET /friendly-rounds/stats-configs`). */
export interface StatModules {
    tee: boolean;
    approach: boolean;
    putting: boolean;
    shortGame: boolean;
    penalties: boolean;
    recovery: boolean;
}

/**
 * One choice on a segmented row. `value` is the wire value the server's closed
 * vocabulary accepts; `label` is what the golfer reads.
 */
export interface StatOption {
    value: string;
    label: string;
}

/** How a prompt is answered. Deliberately tiny — two shapes cover all seven keys. */
export type StatControl =
    /** Mutually exclusive options. Tapping the selected one deselects it. */
    | { kind: 'segments'; options: readonly StatOption[] }
    /**
     * A counter. `max === null` means unbounded upward; the top value renders as
     * "n+" so `putts` can mean "3 or more".
     */
    | { kind: 'stepper'; min: number; max: number | null };

export interface StatPrompt {
    key: StatEventKey;
    label: string;
    control: StatControl;
}

/**
 * What the open step did to a key. Absent from the draft = untouched, which is
 * NOT the same as answered-false: an untouched key emits no event at all.
 *
 * `null` is the "cleared" case — the golfer removed an answer the server
 * already holds, which travels as `value: null` ("clear this key").
 */
export type StatAnswer = { set: string } | { cleared: true };

/** One item of the batch that leaves the device when the step closes. */
export interface StatBatchItem {
    key: StatEventKey;
    /** `null` is an explicit clear, not an omission. */
    value: string | null;
}

/**
 * A format-style `appliesWhen` predicate (the shape `setup.gen`'s
 * `MetadataApplies` carries). Optional-and-nullable on every field so a wire
 * value with explicit nulls evaluates the same as an absent one.
 */
export interface StatApplies {
    minPar?: number | null;
    maxPar?: number | null;
    pars?: readonly number[] | null;
    holes?: readonly number[] | null;
}

// ---------------------------------------------------------------------------
// The prompt catalogue
// ---------------------------------------------------------------------------

/** Shot order, so the step reads the way the hole was played. */
export const STAT_ORDER: readonly StatEventKey[] = [
    'tee_result',
    'recovery_ok',
    'gir',
    'short_game_difficulty',
    'first_putt',
    'putts',
    'penalties',
];

/**
 * Par 3 has no tee shot worth grading — the same predicate shape the format
 * layer uses for its own inputs, evaluated by the same rule (`statApplies`).
 */
export const TEE_APPLIES: StatApplies = { minPar: 4 };

const LABELS: Record<StatEventKey, string> = {
    tee_result: 'Tee shot',
    recovery_ok: 'Recovery',
    gir: 'Green in regulation',
    short_game_difficulty: 'Short game',
    first_putt: 'First putt',
    putts: 'Putts',
    penalties: 'Penalties',
};

const CONTROLS: Record<StatEventKey, StatControl> = {
    tee_result: {
        kind: 'segments',
        options: [
            { value: 'fairway', label: 'Fairway' },
            { value: 'in_play', label: 'In play' },
            { value: 'trouble', label: 'Trouble' },
        ],
    },
    gir: {
        kind: 'segments',
        options: [
            { value: '0', label: 'Miss' },
            { value: '1', label: 'Hit' },
        ],
    },
    // Post-9a3510e: five buckets. The three legacy values (`inside_2m`,
    // `2_to_6m`, `over_6m`) are still READ back by the server type so old rows
    // project, but they are never offered — a prefilled legacy value simply
    // matches no segment and shows nothing selected.
    first_putt: {
        kind: 'segments',
        options: [
            { value: 'inside_1m', label: '< 1m' },
            { value: '1_to_2m', label: '1–2m' },
            { value: '2_to_4m', label: '2–4m' },
            { value: '4_to_8m', label: '4–8m' },
            { value: 'over_8m', label: '> 8m' },
        ],
    },
    short_game_difficulty: {
        kind: 'segments',
        options: [
            { value: 'standard', label: 'Standard' },
            { value: 'hard', label: 'Hard' },
        ],
    },
    recovery_ok: {
        kind: 'segments',
        options: [
            { value: '0', label: 'No' },
            { value: '1', label: 'Yes' },
        ],
    },
    putts: { kind: 'stepper', min: 0, max: 3 },
    penalties: { kind: 'stepper', min: 0, max: null },
};

export function statLabel(key: StatEventKey): string {
    return LABELS[key];
}

export function statControl(key: StatEventKey): StatControl {
    return CONTROLS[key];
}

/** Display text for a stepper value: the top of a bounded range is open-ended. */
export function stepperText(value: number, max: number | null): string {
    if (max !== null && value >= max) return `${value}+`;
    return `${value}`;
}

/**
 * The `appliesWhen` predicate, evaluated. Extracted so the pure model and the
 * round service share ONE reading of the shape: every present field must hold
 * (AND), and an absent predicate always applies.
 */
export function statApplies(
    applies: StatApplies | null | undefined,
    par: number,
    hole: number,
): boolean {
    if (!applies) return true;
    if (applies.minPar != null && par < applies.minPar) return false;
    if (applies.maxPar != null && par > applies.maxPar) return false;
    if (applies.pars != null && !applies.pars.includes(par)) return false;
    if (applies.holes != null && !applies.holes.includes(hole)) return false;
    return true;
}

/**
 * Why a prompt is (not) on the card. The two off-card reasons are NOT
 * interchangeable, and conflating them is what turns a config change into data
 * loss:
 *
 * - `unreadable` — this player does not track the module, or the hole is the
 *   wrong shape for it (a par 3 has no tee-shot question). Nothing is being
 *   said about the value; a stored one stays stored.
 * - `contradicted` — the prompt IS trackable and its precondition was answered
 *   the other way (GIR flipped to hit, so there was no short-game shot). That
 *   is a statement about the hole, so a stored value is now wrong and gets
 *   cleared.
 */
export type StatVisibility = 'visible' | 'unreadable' | 'contradicted';

// ---------------------------------------------------------------------------
// The step
// ---------------------------------------------------------------------------

/**
 * One (player, hole) capture step: the modules that player tracks, what the
 * server already holds, and what this visit has touched.
 *
 * Mutable in place (the Swift twin is a `struct` with `mutating` methods); every
 * write runs `prune()`, because changing either half can hide a prompt and a
 * hidden prompt must not keep an answer.
 */
export class StatStep {
    private modules: StatModules;
    private readonly par: number;
    private readonly holeNumber: number;
    /**
     * Server rows plus this device's unsynced writes — the values the step opens
     * with. A key mapped here is "already answered".
     */
    private persistedMap: Map<StatEventKey, string>;
    /** This visit's changes. Empty means the step has nothing to send. */
    private draft = new Map<StatEventKey, StatAnswer>();

    constructor(
        modules: StatModules,
        par: number,
        holeNumber: number,
        persisted: ReadonlyMap<StatEventKey, string> | Partial<Record<StatEventKey, string>> = {},
        draft: ReadonlyMap<StatEventKey, StatAnswer> = new Map(),
    ) {
        this.modules = modules;
        this.par = par;
        this.holeNumber = holeNumber;
        this.persistedMap = toKeyMap(persisted);
        this.draft = new Map(draft);
        this.prune();
    }

    /**
     * Re-reads the durable half (a load landed, or a config changed) WITHOUT
     * touching the draft: a refresh under an open step must not throw away
     * answers the golfer has already tapped but not yet committed.
     *
     * Returns whether anything a renderer can see actually moved, so a caller
     * driven by unrelated round state can skip the rebuild. The seed effect
     * re-runs on every ball, score and scorecard change and lands here with the
     * same cell nearly every time.
     */
    refresh(
        modules: StatModules,
        persisted: ReadonlyMap<StatEventKey, string> | Partial<Record<StatEventKey, string>>,
    ): boolean {
        const before = this.signature();
        this.modules = modules;
        this.persistedMap = toKeyMap(persisted);
        this.prune();
        return this.signature() !== before;
    }

    /**
     * Fingerprint of everything observable: which prompts are on the card (via
     * visibility) and what each key reads. Draft bookkeeping that changes no
     * visible value — prune recording an explicit clear for a key that was
     * already blank — deliberately does not register.
     */
    private signature(): string {
        let out = '';
        for (const key of STAT_ORDER) out += `${key}:${this.visibility(key)}:${this.value(key) ?? ''};`;
        return out;
    }

    // --- Visible prompts ---

    get prompts(): StatPrompt[] {
        const out: StatPrompt[] = [];
        for (const key of STAT_ORDER) {
            if (!this.isVisible(key)) continue;
            out.push({ key, label: statLabel(key), control: statControl(key) });
        }
        return out;
    }

    get isEmpty(): boolean {
        return this.prompts.length === 0;
    }

    visibility(key: StatEventKey): StatVisibility {
        switch (key) {
            case 'tee_result':
                return this.modules.tee && statApplies(TEE_APPLIES, this.par, this.holeNumber)
                    ? 'visible'
                    : 'unreadable';
            case 'recovery_ok':
                // Only meaningful after a tee shot that got into trouble — and
                // only when the tee prompt itself is on the card to have
                // answered it.
                if (!this.modules.recovery || this.visibility('tee_result') !== 'visible')
                    return 'unreadable';
                return this.value('tee_result') === 'trouble' ? 'visible' : 'contradicted';
            case 'gir':
                return this.modules.approach ? 'visible' : 'unreadable';
            case 'short_game_difficulty':
                // Answered-miss, not merely unanswered: an untouched GIR says
                // nothing about whether there was a short-game shot.
                if (!this.modules.shortGame || this.visibility('gir') !== 'visible')
                    return 'unreadable';
                return this.value('gir') === '0' ? 'visible' : 'contradicted';
            case 'first_putt':
            case 'putts':
                return this.modules.putting ? 'visible' : 'unreadable';
            case 'penalties':
                return this.modules.penalties ? 'visible' : 'unreadable';
        }
    }

    isVisible(key: StatEventKey): boolean {
        return this.visibility(key) === 'visible';
    }

    // --- Reading ---

    /** The answer in force: this visit's draft wins over what the server holds. */
    value(key: StatEventKey): string | null {
        const d = this.draft.get(key);
        if (d === undefined) return this.persistedMap.get(key) ?? null;
        return 'set' in d ? d.set : null;
    }

    intValue(key: StatEventKey): number | null {
        const v = this.value(key);
        if (v === null) return null;
        const n = Number.parseInt(v, 10);
        return Number.isNaN(n) ? null : n;
    }

    /** Whether this key carries an answer (as opposed to being untouched-and-unset). */
    isAnswered(key: StatEventKey): boolean {
        return this.value(key) !== null;
    }

    // --- Writing ---

    /**
     * Sets or (with `null`) removes an answer. Re-selecting the value the server
     * already holds drops the draft entry entirely — a revisit that changes
     * nothing sends nothing.
     */
    answer(key: StatEventKey, value: string | null): void {
        if (!this.isVisible(key)) return;
        this.record(key, value);
        this.prune();
    }

    /**
     * Nudges a stepper. Any nudge answers the key, so a `-1` from unanswered
     * records the floor rather than doing nothing.
     */
    step(key: StatEventKey, delta: number): void {
        const control = statControl(key);
        if (!this.isVisible(key) || control.kind !== 'stepper') return;
        let next = (this.intValue(key) ?? control.min) + delta;
        if (next < control.min) next = control.min;
        if (control.max !== null && next > control.max) next = control.max;
        this.record(key, String(next));
        this.prune();
    }

    private record(key: StatEventKey, value: string | null): void {
        if (value !== null) {
            if (this.persistedMap.get(key) === value) this.draft.delete(key);
            else this.draft.set(key, { set: value });
            return;
        }
        if (this.persistedMap.get(key) === undefined) this.draft.delete(key);
        else this.draft.set(key, { cleared: true });
    }

    /**
     * Drops answers for prompts that are no longer on the card.
     *
     * A `contradicted` prompt is cleared on the server too, so a mis-tap that
     * revealed short game does not leave a ghost row behind. An `unreadable`
     * one only loses its DRAFT: turning a module off, or opening the step on a
     * par 3, makes the question unaskable, not the stored answer wrong — and a
     * clear here would both destroy history and (for a value the server refuses
     * to clear) poison the queue with a batch that can never succeed.
     */
    private prune(): void {
        // Discarding can hide further prompts, so run to a fixed point. The
        // dependency chain is two deep, so this settles immediately.
        for (let pass = 0; pass < STAT_ORDER.length; pass++) {
            let changed = false;
            for (const key of STAT_ORDER) {
                const before = this.draft.get(key);
                const vis = this.visibility(key);
                if (vis === 'visible') continue;
                if (vis === 'contradicted') this.record(key, null);
                else this.draft.delete(key);
                if (!sameAnswer(before, this.draft.get(key))) changed = true;
            }
            if (!changed) return;
        }
    }

    // --- Committing ---

    /** What the step owes the server, in prompt order so a batch is deterministic. */
    get batch(): StatBatchItem[] {
        const out: StatBatchItem[] = [];
        for (const key of STAT_ORDER) {
            const d = this.draft.get(key);
            if (d === undefined) continue;
            out.push({ key, value: 'set' in d ? d.set : null });
        }
        return out;
    }

    /**
     * Folds the draft into the persisted half — call once the batch is queued,
     * so the step re-opens showing what was sent and owing nothing.
     */
    commitDraft(): void {
        for (const [key, answer] of this.draft) {
            if ('set' in answer) this.persistedMap.set(key, answer.set);
            else this.persistedMap.delete(key);
        }
        this.draft.clear();
    }
}

function sameAnswer(a: StatAnswer | undefined, b: StatAnswer | undefined): boolean {
    if (a === undefined || b === undefined) return a === b;
    if ('set' in a) return 'set' in b && a.set === b.set;
    return !('set' in b);
}

function toKeyMap(
    src: ReadonlyMap<StatEventKey, string> | Partial<Record<StatEventKey, string>>,
): Map<StatEventKey, string> {
    if (src instanceof Map) return new Map(src);
    const out = new Map<StatEventKey, string>();
    for (const key of STAT_ORDER) {
        const v = (src as Partial<Record<StatEventKey, string>>)[key];
        if (v !== undefined) out.set(key, v);
    }
    return out;
}
