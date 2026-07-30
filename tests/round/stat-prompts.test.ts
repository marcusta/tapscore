import { expect, test } from 'bun:test';
import {
    STAT_ORDER,
    StatStep,
    TEE_APPLIES,
    statApplies,
    statControl,
    stepperText,
    type StatBatchItem,
    type StatEventKey,
    type StatModules,
    type StatOption,
} from '../../src/round/stat-prompts';

// The capture rules, with no service, no network and no DOM in the way: which
// prompts a hole asks, how one answer changes that set, and what a closed step
// owes the server. The case-for-case twin of
// `ios/TapScoreTests/Domain/StatPromptsTests.swift` — the two suites are the
// shared specification of the same pure model, so a change to one belongs in
// both.

function modules(over: Partial<StatModules> = {}): StatModules {
    return {
        tee: false,
        approach: false,
        putting: false,
        shortGame: false,
        penalties: false,
        recovery: false,
        ...over,
    };
}

function step(
    m: StatModules,
    opts: { par?: number; hole?: number; persisted?: Partial<Record<StatEventKey, string>> } = {},
): StatStep {
    return new StatStep(m, opts.par ?? 4, opts.hole ?? 1, opts.persisted ?? {});
}

function keys(s: StatStep): StatEventKey[] {
    return s.prompts.map((p) => p.key);
}

function item(key: StatEventKey, value: string | null): StatBatchItem {
    return { key, value };
}

function options(key: StatEventKey): readonly StatOption[] {
    const control = statControl(key);
    return control.kind === 'segments' ? control.options : [];
}

// --- Module → prompt mapping ---

test('each module contributes its own keys', () => {
    expect(keys(step(modules({ tee: true })))).toEqual(['tee_result']);
    expect(keys(step(modules({ approach: true })))).toEqual(['gir']);
    expect(keys(step(modules({ putting: true })))).toEqual(['first_putt', 'putts']);
    expect(keys(step(modules({ penalties: true })))).toEqual(['penalties']);
});

test('modules off ask nothing', () => {
    expect(step(modules()).isEmpty).toBe(true);
});

// Short game and recovery are conditional, so their module alone never puts a
// prompt on the card — the condition has to be met too.
test('conditional modules alone ask nothing', () => {
    expect(step(modules({ shortGame: true })).isEmpty).toBe(true);
    expect(step(modules({ recovery: true })).isEmpty).toBe(true);
});

test('prompts come in shot order', () => {
    const s = step(
        modules({
            tee: true,
            approach: true,
            putting: true,
            shortGame: true,
            penalties: true,
            recovery: true,
        }),
    );
    s.answer('tee_result', 'trouble');
    s.answer('gir', '0');
    // The worst case the proposal names: seven inputs on a par 4.
    expect(keys(s)).toEqual([
        'tee_result',
        'recovery_ok',
        'gir',
        'short_game_difficulty',
        'first_putt',
        'putts',
        'penalties',
    ]);
    expect(keys(s)).toEqual([...STAT_ORDER]);
});

// --- Par gating ---

test('tee result is not asked on a par 3', () => {
    const all = modules({ tee: true, approach: true, putting: true });
    expect(keys(step(all, { par: 3 }))).toEqual(['gir', 'first_putt', 'putts']);
    expect(keys(step(all, { par: 4 }))[0]).toBe('tee_result');
    expect(keys(step(all, { par: 5 }))[0]).toBe('tee_result');
});

// The gate is the same `appliesWhen` evaluation the format layer uses, not a
// second hardcoded par rule.
test('the par gate is the shared predicate', () => {
    expect(statApplies(TEE_APPLIES, 3, 1)).toBe(false);
    expect(statApplies(TEE_APPLIES, 4, 1)).toBe(true);
    expect(statApplies(null, 3, 1)).toBe(true);
    expect(statApplies({ holes: [2, 3] }, 4, 1)).toBe(false);
    // Every present clause must hold.
    expect(statApplies({ minPar: 4, maxPar: 4 }, 5, 1)).toBe(false);
});

// Recovery hangs off the tee prompt, so a par 3 cannot reach it at all.
test('recovery is unreachable on a par 3', () => {
    const s = step(modules({ tee: true, recovery: true }), { par: 3 });
    s.answer('tee_result', 'trouble');
    expect(s.isEmpty).toBe(true);
});

// --- Answer-dependent visibility ---

test('short game appears only when GIR is answered miss', () => {
    const s = step(modules({ approach: true, shortGame: true }));
    // An unanswered GIR says nothing about the short game.
    expect(keys(s)).toEqual(['gir']);
    s.answer('gir', '1');
    expect(keys(s)).toEqual(['gir']);
    s.answer('gir', '0');
    expect(keys(s)).toEqual(['gir', 'short_game_difficulty']);
});

test('recovery appears only after trouble', () => {
    const s = step(modules({ tee: true, recovery: true }));
    expect(keys(s)).toEqual(['tee_result']);
    s.answer('tee_result', 'fairway');
    expect(keys(s)).toEqual(['tee_result']);
    s.answer('tee_result', 'trouble');
    expect(keys(s)).toEqual(['tee_result', 'recovery_ok']);
});

// Hiding a revealed prompt DISCARDS its answer. A mis-tap that opened the
// short-game row must not leave its answer behind in the batch.
test('hiding a prompt discards its answer', () => {
    const s = step(modules({ approach: true, shortGame: true }));
    s.answer('gir', '0');
    s.answer('short_game_difficulty', 'hard');
    expect(s.value('short_game_difficulty')).toBe('hard');

    s.answer('gir', '1');
    expect(s.value('short_game_difficulty')).toBeNull();
    expect(s.batch).toEqual([item('gir', '1')]);
});

// Same discard, but the hidden key was already stored server-side: then the
// discard has to travel as an explicit clear, or the ghost row survives.
test('hiding a stored prompt clears it on the server', () => {
    const s = step(modules({ approach: true, shortGame: true }), {
        persisted: { gir: '0', short_game_difficulty: 'hard' },
    });
    expect(keys(s)).toEqual(['gir', 'short_game_difficulty']);

    s.answer('gir', '1');
    expect(keys(s)).toEqual(['gir']);
    expect(s.batch).toEqual([item('gir', '1'), item('short_game_difficulty', null)]);
});

// A step whose stored state is already inconsistent (a short-game answer with
// GIR hit) cleans itself up on open rather than rendering an impossible row.
test('an impossible stored combination is pruned on open', () => {
    const s = step(modules({ approach: true, shortGame: true }), {
        persisted: { gir: '1', short_game_difficulty: 'hard' },
    });
    expect(keys(s)).toEqual(['gir']);
    expect(s.batch).toEqual([item('short_game_difficulty', null)]);
});

// The other kind of hidden. A module the player stopped tracking (or a hole
// shape that cannot ask) makes the question UNASKABLE — it says nothing about
// the stored answer, so nothing is cleared. Emitting a clear here would delete
// history on a config change, and would queue a batch the server may refuse,
// blocking every later stat behind it.
test('a turned-off module keeps its stored value', () => {
    const s = step(modules({ approach: true }), {
        persisted: { gir: '0', short_game_difficulty: 'hard', penalties: '2' },
    });
    expect(keys(s)).toEqual(['gir']);
    expect(s.batch).toEqual([]);
});

test('a par 3 keeps a stored tee result', () => {
    const s = step(modules({ tee: true, putting: true, recovery: true }), {
        par: 3,
        persisted: { tee_result: 'trouble', recovery_ok: '1' },
    });
    expect(keys(s)).toEqual(['first_putt', 'putts']);
    // A par 3 cannot ask the question, so it cannot answer it.
    expect(s.batch).toEqual([]);
});

// …and the draft half is still dropped, so an answer typed before a config
// change does not sneak out under a prompt that is no longer on the card.
test('a turned-off module still drops its draft', () => {
    const s = step(modules({ approach: true, penalties: true }));
    s.step('penalties', 1);
    expect(s.batch).toEqual([item('penalties', '1')]);

    s.refresh(modules({ approach: true }), {});
    expect(s.batch).toEqual([]);
});

// --- Tri-state ---

test('untouched keys emit nothing', () => {
    const s = step(modules({ tee: true, approach: true, putting: true, penalties: true }));
    expect(s.prompts.length).toBeGreaterThan(0);
    // Unanswered is not false — it is no event at all.
    expect(s.batch).toEqual([]);
    expect(s.isAnswered('gir')).toBe(false);
    expect(s.isAnswered('penalties')).toBe(false);
});

test('re-selecting the same option deselects it', () => {
    const s = step(modules({ approach: true }));
    s.answer('gir', '1');
    expect(s.value('gir')).toBe('1');
    s.answer('gir', null);
    expect(s.value('gir')).toBeNull();
    // It was never stored, so there is nothing to clear.
    expect(s.batch).toEqual([]);
});

test('deselecting a stored answer batches a clear', () => {
    const s = step(modules({ approach: true }), { persisted: { gir: '1' } });
    expect(s.isAnswered('gir')).toBe(true);
    s.answer('gir', null);
    expect(s.value('gir')).toBeNull();
    expect(s.batch).toEqual([item('gir', null)]);
});

test('re-answering the stored value sends nothing', () => {
    const s = step(modules({ approach: true }), { persisted: { gir: '1' } });
    s.answer('gir', '0');
    s.answer('gir', '1');
    expect(s.value('gir')).toBe('1');
    // A revisit that changes nothing must post nothing.
    expect(s.batch).toEqual([]);
});

test('answers on hidden prompts are refused', () => {
    const s = step(modules({ approach: true, shortGame: true }));
    s.answer('short_game_difficulty', 'hard');
    expect(s.value('short_game_difficulty')).toBeNull();
    expect(s.batch).toEqual([]);
});

// --- Steppers ---

test('putts stepper clamps at zero and three', () => {
    const s = step(modules({ putting: true }));
    s.step('putts', -1);
    // Any nudge answers the key, floor included.
    expect(s.value('putts')).toBe('0');
    for (let i = 0; i < 10; i++) s.step('putts', 1);
    expect(s.value('putts')).toBe('3');
    expect(stepperText(3, 3)).toBe('3+');
    expect(stepperText(2, 3)).toBe('2');
});

test('penalties stepper is unbounded', () => {
    const s = step(modules({ penalties: true }));
    for (let i = 0; i < 5; i++) s.step('penalties', 1);
    expect(s.value('penalties')).toBe('5');
    expect(stepperText(5, null)).toBe('5');
    s.step('penalties', -10);
    expect(s.value('penalties')).toBe('0');
});

test('stepping back to the stored value sends nothing', () => {
    const s = step(modules({ putting: true }), { persisted: { putts: '2' } });
    s.step('putts', 1);
    expect(s.batch).toEqual([item('putts', '3')]);
    s.step('putts', -1);
    expect(s.batch).toEqual([]);
});

// --- Wire vocabulary ---

// The option values are the closed set the server accepts. A rename here is a
// 400 at capture time, so they are pinned.
test('option values match the server vocabulary', () => {
    expect(options('tee_result').map((o) => o.value)).toEqual(['fairway', 'in_play', 'trouble']);
    expect(options('gir').map((o) => o.value)).toEqual(['0', '1']);
    expect(options('first_putt').map((o) => o.value)).toEqual([
        'inside_1m',
        '1_to_2m',
        '2_to_4m',
        '4_to_8m',
        'over_8m',
    ]);
    expect(options('first_putt').map((o) => o.label)).toEqual([
        '< 1m',
        '1–2m',
        '2–4m',
        '4–8m',
        '> 8m',
    ]);
    expect(options('short_game_difficulty').map((o) => o.value)).toEqual(['standard', 'hard']);
    expect(options('recovery_ok').map((o) => o.value)).toEqual(['0', '1']);
    expect(statControl('putts')).toEqual({ kind: 'stepper', min: 0, max: 3 });
    expect(statControl('penalties')).toEqual({ kind: 'stepper', min: 0, max: null });
});

// --- Committing ---

test('commit folds the draft and leaves nothing owing', () => {
    const s = step(modules({ approach: true, putting: true }), { persisted: { putts: '2' } });
    s.answer('gir', '0');
    s.step('putts', -1);
    expect(s.batch).toEqual([item('gir', '0'), item('putts', '1')]);

    s.commitDraft();
    // A committed step must not re-queue its own answers.
    expect(s.batch).toEqual([]);
    expect(s.value('gir')).toBe('0');
    expect(s.value('putts')).toBe('1');
});

test('refresh keeps the draft', () => {
    const s = step(modules({ approach: true, putting: true }));
    s.answer('gir', '0');
    s.refresh(modules({ approach: true, putting: true }), { putts: '2' });
    // A load must not swallow an in-progress answer.
    expect(s.value('gir')).toBe('0');
    expect(s.value('putts')).toBe('2');
    expect(s.batch).toEqual([item('gir', '0')]);
});

test('refresh prunes prompts a module change removed', () => {
    const s = step(modules({ approach: true, shortGame: true }));
    s.answer('gir', '0');
    s.answer('short_game_difficulty', 'hard');
    s.refresh(modules({ approach: true }), {});
    expect(keys(s)).toEqual(['gir']);
    expect(s.value('short_game_difficulty')).toBeNull();
});

// --- Visibility, named ---

// The service and the renderer both branch on the three-valued visibility, so
// the distinction is pinned directly and not only through its consequences.
test('visibility names why a prompt is off the card', () => {
    const s = step(modules({ tee: true, approach: true, shortGame: true, recovery: true }), {
        par: 3,
    });
    expect(s.visibility('tee_result')).toBe('unreadable');
    expect(s.visibility('recovery_ok')).toBe('unreadable');
    expect(s.visibility('gir')).toBe('visible');
    expect(s.visibility('putts')).toBe('unreadable');
    // Trackable, precondition answered the other way ⇒ contradicted.
    s.answer('gir', '1');
    expect(s.visibility('short_game_difficulty')).toBe('contradicted');
    s.answer('gir', '0');
    expect(s.visibility('short_game_difficulty')).toBe('visible');
});
