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
    | 'tee_miss_dir'
    | 'recovery_ok'
    | 'gir'
    | 'green_miss_dir'
    | 'short_game_difficulty'
    | 'short_game_strokes'
    | 'first_putt'
    | 'first_putt_m'
    | 'putts'
    | 'penalties'
    | 'penalty_source';

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

/** How a prompt is answered. Deliberately tiny — three shapes cover every key. */
export type StatControl =
    /** Mutually exclusive options. Tapping the selected one deselects it. */
    | { kind: 'segments'; options: readonly StatOption[] }
    /**
     * A counter. `max === null` means unbounded upward; the top value renders as
     * "n+" so `putts` can mean "3 or more".
     */
    | { kind: 'stepper'; min: number; max: number | null }
    /**
     * A refinement of another key's answer: the option set depends on the
     * PARENT key's current value. This shape lives only in the catalogue —
     * `StatStep.prompts` resolves it to plain `segments` with the options the
     * parent's answer selects, so components still render a chip row and
     * decide nothing. A parent value with no entry means the refinement is
     * unaskable (and `visibility` reads it `contradicted`).
     */
    | {
          kind: 'refine';
          parent: StatEventKey;
          optionsByParent: Readonly<Record<string, readonly StatOption[]>>;
      };

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
    'tee_miss_dir',
    'recovery_ok',
    'gir',
    'green_miss_dir',
    'short_game_difficulty',
    'short_game_strokes',
    'first_putt',
    'first_putt_m',
    'putts',
    'penalties',
    'penalty_source',
];

/**
 * Par 3 has no tee shot worth grading — the same predicate shape the format
 * layer uses for its own inputs, evaluated by the same rule (`statApplies`).
 */
export const TEE_APPLIES: StatApplies = { minPar: 4 };

const LABELS: Record<StatEventKey, string> = {
    tee_result: 'Tee shot',
    tee_miss_dir: 'Which side',
    recovery_ok: 'Recovery',
    gir: 'Green in regulation',
    green_miss_dir: 'Approach',
    short_game_difficulty: 'Short game',
    short_game_strokes: 'Shots to the green',
    first_putt: 'First putt',
    // The refinement row renders directly under the selected bucket; a leading
    // label would just repeat "First putt".
    first_putt_m: '',
    putts: 'Putts',
    penalties: 'Penalties',
    penalty_source: 'Penalty on',
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
    // Side is a property of the tee shot, so it sits immediately after it and
    // before `recovery_ok` (the next shot). Two options: down-the-hole left or
    // right, never a compass bearing.
    tee_miss_dir: {
        kind: 'segments',
        options: [
            { value: 'left', label: 'Left' },
            { value: 'right', label: 'Right' },
        ],
    },
    gir: {
        kind: 'segments',
        options: [
            { value: '0', label: 'Miss' },
            { value: '1', label: 'Hit' },
        ],
    },
    // Seen from where the approach was played: long is past the flag.
    // `hit_late` is the fifth answer: the first green attempt DID hit the
    // green, just after regulation (on in 3 on a par 4, say) — so there was no
    // chip, and the short-game prompts are contradicted by it.
    green_miss_dir: {
        kind: 'segments',
        options: [
            { value: 'long', label: 'Long' },
            { value: 'short', label: 'Short' },
            { value: 'left', label: 'Left' },
            { value: 'right', label: 'Right' },
            { value: 'hit_late', label: 'On green' },
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
    // Exact metres, an optional refinement of the bucket. Closed vocabulary,
    // one option set per FINE bucket — the legacy coarse values have no entry,
    // so a legacy prefill reads `contradicted` and never shows the row. Values
    // are the exact TEXT the server stores ('0.3' … '20'); '20' renders "20+".
    first_putt_m: {
        kind: 'refine',
        parent: 'first_putt',
        optionsByParent: {
            inside_1m: [
                { value: '0.3', label: '0.3m' },
                { value: '0.5', label: '0.5m' },
                { value: '0.8', label: '0.8m' },
            ],
            '1_to_2m': [
                { value: '1', label: '1m' },
                { value: '1.5', label: '1.5m' },
                { value: '2', label: '2m' },
            ],
            '2_to_4m': [
                { value: '2.5', label: '2.5m' },
                { value: '3', label: '3m' },
                { value: '3.5', label: '3.5m' },
                { value: '4', label: '4m' },
            ],
            '4_to_8m': [
                { value: '5', label: '5m' },
                { value: '6', label: '6m' },
                { value: '7', label: '7m' },
                { value: '8', label: '8m' },
            ],
            over_8m: [
                { value: '10', label: '10m' },
                { value: '12', label: '12m' },
                { value: '14', label: '14m' },
                { value: '16', label: '16m' },
                { value: '20', label: '20+' },
            ],
        },
    },
    short_game_difficulty: {
        kind: 'segments',
        options: [
            { value: 'standard', label: 'Standard' },
            { value: 'hard', label: 'Hard' },
            { value: 'bunker', label: 'Bunker' },
        ],
    },
    // How many shots it took to get ON the green. One is the normal answer, so
    // the floor is 1 and an unrecorded hole counts as 1 server-side; `5+` is
    // the cap, not a claim of exactly five.
    short_game_strokes: { kind: 'stepper', min: 1, max: 5 },
    recovery_ok: {
        kind: 'segments',
        options: [
            { value: '0', label: 'No' },
            { value: '1', label: 'Yes' },
        ],
    },
    putts: { kind: 'stepper', min: 0, max: 3 },
    penalties: { kind: 'stepper', min: 0, max: null },
    penalty_source: {
        kind: 'segments',
        options: [
            { value: 'tee', label: 'Tee shot' },
            { value: 'approach', label: 'Approach' },
            { value: 'short_or_green', label: 'Around the green' },
        ],
    },
};

export function statLabel(key: StatEventKey): string {
    return LABELS[key];
}

export function statControl(key: StatEventKey): StatControl {
    return CONTROLS[key];
}

/**
 * The option set a `refine` control offers for one parent value, or `null`
 * when that parent value has no refinement (unanswered, or a legacy value).
 * Exposed for `StatStep` and the tests; components never call it — they get
 * the resolved `segments` control from `prompts`.
 */
export function refineOptions(key: StatEventKey, parentValue: string | null): readonly StatOption[] | null {
    const control = CONTROLS[key];
    if (control.kind !== 'refine' || parentValue === null) return null;
    return control.optionsByParent[parentValue] ?? null;
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

/**
 * How the short-game rows present on a GIR-hit hole (proposal: "Add short
 * game"). `none` = the rows render normally (missed green) or are off the card
 * entirely; `collapsed` = visible but folded behind the disclosure row, because
 * a chip on a green hit in regulation is the exception; `expanded` = a value
 * exists, so the rows render normally. The transient "tapped open this visit"
 * flag is the component's, not the model's — the model only says
 * collapsible-vs-expanded.
 */
export type ShortGameDisclosure = 'none' | 'collapsed' | 'expanded';

// ---------------------------------------------------------------------------
// Derived GIR (proposal §3.4b)
// ---------------------------------------------------------------------------

/**
 * Whether the scorecard can answer GIR on its own.
 *
 * `gir = 1` iff `strokes - putts <= par - 2`. `putts = 0` on a coherent hole
 * means the ball was holed from off the green, so `strokes - putts = strokes`,
 * which is `> par - 2` on any sane hole and correctly reads as a MISS — a
 * chip-in is a missed green.
 */
export function canDeriveGir(par: number, strokes: number | null, putts: number | null): boolean {
    return strokes !== null && strokes > 0 && putts !== null && putts >= 0 && par > 0;
}

/** The derived answer, in wire form. Only meaningful when `canDeriveGir`. */
export function deriveGir(par: number, strokes: number, putts: number): string {
    return strokes - putts <= par - 2 ? '1' : '0';
}

/**
 * The five exhaustive states of the GIR prompt, for the view layer and the
 * tests. See §3.4b: derivation fires at step COMPLETION, a manual tap locks for
 * the visit, and a persisted answer is authoritative forever.
 */
export type DerivedGirState =
    /** The golfer touched GIR in this visit. The tapped answer stands. */
    | { state: 'manual' }
    /** Stored, and either the derivation agrees or it cannot run. */
    | { state: 'persisted' }
    /** Unanswered and derivable — no segment selected, pending line shown. */
    | { state: 'pending'; derived: string }
    /** Unanswered and not derivable — no segment selected, no line. */
    | { state: 'idle' }
    /** Stored, derivable, and the two disagree. The STORED answer stands. */
    | { state: 'disagree'; derived: string; stored: string };

/**
 * Pure reading of a step's GIR state. Both platforms expose this function; the
 * view chooses copy from the tag, and `materialiseDerivedGir()` acts only on
 * `pending`.
 */
export function derivedGirState(step: StatStep): DerivedGirState {
    if (step.girIsLocked) return { state: 'manual' };
    const answered = step.isAnswered('gir');
    if (step.visibility('gir') !== 'visible') return answered ? { state: 'persisted' } : { state: 'idle' };
    const derived = step.derivedGir();
    if (derived === null) return answered ? { state: 'persisted' } : { state: 'idle' };
    if (!answered) return { state: 'pending', derived };
    const stored = step.value('gir') as string;
    return stored === derived ? { state: 'persisted' } : { state: 'disagree', derived, stored };
}

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
    /**
     * Set the moment the golfer touches `gir` in this visit. Never cleared by
     * `refresh()` or `prune()`; cleared only by constructing a new step (a new
     * hole or player). Rule 2 of §3.4b: a manual interaction locks the
     * derivation out for the life of this visit.
     */
    private girLocked = false;
    /**
     * The hole's score, supplied by the host — `StatStep` has no scorecard.
     * `null` = not known yet, which makes the derivation unavailable.
     */
    private strokes: number | null = null;

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
        /**
         * REQUIRED, deliberately undefaulted: a defaulted `null` here silently
         * unsets the score on every unrelated refresh, which turns a `pending`
         * derivation back into `idle` and loses the answer. Every caller must
         * say what the scorecard holds.
         */
        strokes: number | null,
    ): boolean {
        const before = this.signature();
        this.modules = modules;
        this.persistedMap = toKeyMap(persisted);
        this.strokes = strokes;
        this.prune();
        return this.signature() !== before;
    }

    /**
     * The hole's score, from the host's scorecard. Read only by the GIR
     * derivation; nothing else in the step knows about strokes.
     */
    setScore(strokes: number | null): void {
        this.strokes = strokes;
    }

    /** Rule 2 of §3.4b, for `derivedGirState`. */
    get girIsLocked(): boolean {
        return this.girLocked;
    }

    /**
     * The score's own answer to GIR, or `null` when it cannot speak.
     *
     * Blocked when the putt count is incoherent — `putts = 0` alongside a
     * `first_putt` bucket, the same contradiction `putting_coherent` refuses on
     * the server. Deriving from a hole that contradicts itself would launder a
     * mistake into a fact.
     */
    derivedGir(): string | null {
        const putts = this.intValue('putts');
        if (putts === 0 && this.value('first_putt') !== null) return null;
        if (!canDeriveGir(this.par, this.strokes, putts)) return null;
        return deriveGir(this.par, this.strokes as number, putts as number);
    }

    /**
     * Step completion (§3.4b rule 1). A no-op in every state but `pending`;
     * there it records the derived answer through the ORDINARY write path, so
     * a derived miss reveals `green_miss_dir` / `short_game_*` and a derived hit
     * contradicts them. Order matters: materialise, prune, then build the batch.
     *
     * Returns whether anything was written, so a caller can skip a rebuild.
     */
    materialiseDerivedGir(): boolean {
        const s = derivedGirState(this);
        if (s.state !== 'pending') return false;
        this.record('gir', s.derived);
        this.prune();
        return true;
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
        // The GIR derivation reads the scorecard, which moves independently of
        // every key above: a score typed after the step opened turns `idle` into
        // `pending` without changing a single answer.
        out += `gir-derived:${derivedGirState(this).state};`;
        return out;
    }

    // --- Visible prompts ---

    get prompts(): StatPrompt[] {
        const out: StatPrompt[] = [];
        for (const key of STAT_ORDER) {
            if (!this.isVisible(key)) continue;
            out.push({ key, label: statLabel(key), control: this.resolvedControl(key) });
        }
        return out;
    }

    /**
     * The control a renderer gets: a `refine` entry is resolved to plain
     * `segments` carrying the option set the parent's current answer selects,
     * so the component draws an ordinary chip row and decides nothing. Only
     * called for visible keys, where the option set is guaranteed to exist.
     */
    private resolvedControl(key: StatEventKey): StatControl {
        const control = statControl(key);
        if (control.kind !== 'refine') return control;
        return { kind: 'segments', options: refineOptions(key, this.value(control.parent)) ?? [] };
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
            case 'tee_miss_dir':
                // Side is only a fact once the drive left the fairway. Asked on
                // `in_play` too: a side is a side even when the ball is playable.
                if (!this.modules.tee || this.visibility('tee_result') !== 'visible')
                    return 'unreadable';
                return this.value('tee_result') === 'in_play' ||
                    this.value('tee_result') === 'trouble'
                    ? 'visible'
                    : 'contradicted';
            case 'recovery_ok':
                // Only meaningful after a tee shot that got into trouble — and
                // only when the tee prompt itself is on the card to have
                // answered it.
                if (!this.modules.recovery || this.visibility('tee_result') !== 'visible')
                    return 'unreadable';
                return this.value('tee_result') === 'trouble' ? 'visible' : 'contradicted';
            case 'gir':
                return this.modules.approach ? 'visible' : 'unreadable';
            case 'green_miss_dir':
                if (!this.modules.approach || this.visibility('gir') !== 'visible')
                    return 'unreadable';
                return this.value('gir') === '0' ? 'visible' : 'contradicted';
            case 'short_game_difficulty':
                // Answered, not merely untouched: an untouched GIR says nothing
                // about whether there was a short-game shot. A hit green keeps
                // the prompts too (a par-5 chip on for GIR is a real chip) —
                // `shortGameDisclosure` tells the view to fold them away by
                // default there. `hit_late` is the one answer that RULES OUT a
                // chip: the green attempt finished on the green.
                if (!this.modules.shortGame || this.visibility('gir') !== 'visible')
                    return 'unreadable';
                if (this.value('green_miss_dir') === 'hit_late') return 'contradicted';
                return this.value('gir') !== null ? 'visible' : 'contradicted';
            case 'short_game_strokes':
                // Same gate as short_game_difficulty — the counter is asked
                // whenever there was a short-game shot, not only once a
                // difficulty is picked.
                if (!this.modules.shortGame || this.visibility('gir') !== 'visible')
                    return 'unreadable';
                if (this.value('green_miss_dir') === 'hit_late') return 'contradicted';
                return this.value('gir') !== null ? 'visible' : 'contradicted';
            case 'first_putt':
            case 'putts':
                return this.modules.putting ? 'visible' : 'unreadable';
            case 'first_putt_m':
                // Refines `first_putt`, so it inherits that row's readability;
                // without a FINE bucket selected (unanswered, or a legacy
                // coarse value) there is nothing to refine.
                if (!this.modules.putting || this.visibility('first_putt') !== 'visible')
                    return 'unreadable';
                return refineOptions('first_putt_m', this.value('first_putt')) !== null
                    ? 'visible'
                    : 'contradicted';
            case 'penalties':
                return this.modules.penalties ? 'visible' : 'unreadable';
            case 'penalty_source':
                if (!this.modules.penalties || this.visibility('penalties') !== 'visible')
                    return 'unreadable';
                return (this.intValue('penalties') ?? 0) >= 1 ? 'visible' : 'contradicted';
        }
    }

    isVisible(key: StatEventKey): boolean {
        return this.visibility(key) === 'visible';
    }

    /** See `ShortGameDisclosure`. Only ever `collapsed` on a GIR-hit hole. */
    shortGameDisclosure(): ShortGameDisclosure {
        if (this.value('gir') !== '1') return 'none';
        if (this.visibility('short_game_difficulty') !== 'visible') return 'none';
        return this.value('short_game_difficulty') === null &&
            this.value('short_game_strokes') === null
            ? 'collapsed'
            : 'expanded';
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
        // A refine value must belong to the option set its parent's CURRENT
        // answer selects — a metre from another bucket is not an answer here.
        const control = statControl(key);
        if (value !== null && control.kind === 'refine') {
            const options = refineOptions(key, this.value(control.parent));
            if (options === null || !options.some((o) => o.value === value)) return;
        }
        // A gesture on GIR — including one that CLEARS it — locks the
        // derivation out for this visit (§3.4b rule 2).
        if (key === 'gir') this.girLocked = true;
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
                if (vis === 'visible') {
                    // Bucket coherence for a refine key: the row is on the
                    // card, but its answer belongs to a bucket the parent no
                    // longer holds — clear it (on the server too, matching
                    // `contradicted` semantics).
                    const control = statControl(key);
                    const value = this.value(key);
                    if (control.kind === 'refine' && value !== null) {
                        const options = refineOptions(key, this.value(control.parent));
                        if (options === null || !options.some((o) => o.value === value)) {
                            this.record(key, null);
                        }
                    }
                } else if (vis === 'contradicted') this.record(key, null);
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
