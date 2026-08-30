import { expect, test } from 'bun:test';
import {
    derivedGirState,
    refineOptions,
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
    // `penalty_source` hangs off an ANSWERED penalty count, and `first_putt_m`
    // off a selected fine bucket, so the maximal card is only reachable once
    // both parents carry an answer.
    s.answer('penalties', '1');
    s.answer('first_putt', '2_to_4m');
    // The worst case: twelve inputs on a par 4.
    expect(keys(s)).toEqual([
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

test('short game appears once GIR is answered either way', () => {
    const s = step(modules({ approach: true, shortGame: true }));
    // An unanswered GIR says nothing about the short game.
    expect(keys(s)).toEqual(['gir']);
    // A hit keeps the short-game rows too — a par-5 chip on for GIR is a real
    // chip — just without the miss-direction question.
    s.answer('gir', '1');
    expect(keys(s)).toEqual(['gir', 'short_game_difficulty', 'short_game_strokes']);
    s.answer('gir', '0');
    expect(keys(s)).toEqual([
        'gir',
        'green_miss_dir',
        'short_game_difficulty',
        'short_game_strokes',
    ]);
});

// On a green hit in regulation the short-game rows are the exception, so the
// model tells the view to fold them behind an "Add short game" disclosure until
// either carries a value. The "tapped open this visit" flag is the view's.
test('short game on a hit green is collapsed until it has a value', () => {
    const s = step(modules({ approach: true, shortGame: true }));
    expect(s.shortGameDisclosure()).toBe('none');
    s.answer('gir', '0');
    // A missed green renders the rows normally — no disclosure.
    expect(s.shortGameDisclosure()).toBe('none');
    s.answer('gir', '1');
    expect(s.shortGameDisclosure()).toBe('collapsed');
    s.answer('short_game_difficulty', 'standard');
    expect(s.shortGameDisclosure()).toBe('expanded');
    s.answer('short_game_difficulty', null);
    expect(s.shortGameDisclosure()).toBe('collapsed');
    s.step('short_game_strokes', 1);
    expect(s.shortGameDisclosure()).toBe('expanded');
});

test('a stored short-game answer on a hit green opens expanded', () => {
    const s = step(modules({ approach: true, shortGame: true }), {
        persisted: { gir: '1', short_game_difficulty: 'hard' },
    });
    // Legal now: the chip happened, then the green was hit in regulation count.
    expect(keys(s)).toEqual(['gir', 'short_game_difficulty', 'short_game_strokes']);
    expect(s.value('short_game_difficulty')).toBe('hard');
    expect(s.shortGameDisclosure()).toBe('expanded');
    expect(s.batch).toEqual([]);
});

test('recovery appears only after trouble', () => {
    const s = step(modules({ tee: true, recovery: true }));
    expect(keys(s)).toEqual(['tee_result']);
    s.answer('tee_result', 'fairway');
    expect(keys(s)).toEqual(['tee_result']);
    s.answer('tee_result', 'trouble');
    expect(keys(s)).toEqual(['tee_result', 'tee_miss_dir', 'recovery_ok']);
});

// Hiding a revealed prompt DISCARDS its answer. A mis-tap that opened the
// short-game row must not leave its answer behind in the batch. `hit_late` is
// the answer that rules the chip out: the green attempt finished on the green.
test('hiding a prompt discards its answer', () => {
    const s = step(modules({ approach: true, shortGame: true }));
    s.answer('gir', '0');
    s.answer('short_game_difficulty', 'hard');
    expect(s.value('short_game_difficulty')).toBe('hard');

    s.answer('green_miss_dir', 'hit_late');
    expect(s.value('short_game_difficulty')).toBeNull();
    expect(s.batch).toEqual([item('gir', '0'), item('green_miss_dir', 'hit_late')]);
});

// Same discard, but the hidden key was already stored server-side: then the
// discard has to travel as an explicit clear, or the ghost row survives.
test('hiding a stored prompt clears it on the server', () => {
    const s = step(modules({ approach: true, shortGame: true }), {
        persisted: { gir: '0', short_game_difficulty: 'hard' },
    });
    expect(keys(s)).toEqual([
        'gir',
        'green_miss_dir',
        'short_game_difficulty',
        'short_game_strokes',
    ]);

    s.answer('green_miss_dir', 'hit_late');
    expect(keys(s)).toEqual(['gir', 'green_miss_dir']);
    expect(s.batch).toEqual([
        item('green_miss_dir', 'hit_late'),
        item('short_game_difficulty', null),
    ]);
});

// A step whose stored state is already inconsistent (a short-game answer with
// the green attempt on the green) cleans itself up on open rather than
// rendering an impossible row.
test('an impossible stored combination is pruned on open', () => {
    const s = step(modules({ approach: true, shortGame: true }), {
        persisted: { gir: '0', green_miss_dir: 'hit_late', short_game_difficulty: 'hard' },
    });
    expect(keys(s)).toEqual(['gir', 'green_miss_dir']);
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
    expect(keys(s)).toEqual(['gir', 'green_miss_dir']);
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

    s.refresh(modules({ approach: true }), {}, null);
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
    expect(options('short_game_difficulty').map((o) => o.value)).toEqual([
        'standard',
        'hard',
        'bunker',
    ]);
    expect(options('tee_miss_dir').map((o) => o.value)).toEqual(['left', 'right']);
    expect(options('green_miss_dir').map((o) => o.value)).toEqual([
        'long',
        'short',
        'left',
        'right',
        'hit_late',
    ]);
    expect(options('green_miss_dir').map((o) => o.label)).toEqual([
        'Long',
        'Short',
        'Left',
        'Right',
        'On green',
    ]);
    // The exact-metre refinement: one closed option set per fine bucket, and
    // the values are the exact TEXT the server stores.
    expect(refineOptions('first_putt_m', 'inside_1m')?.map((o) => o.value)).toEqual([
        '0.3',
        '0.5',
        '0.8',
    ]);
    expect(refineOptions('first_putt_m', '1_to_2m')?.map((o) => o.value)).toEqual([
        '1',
        '1.5',
        '2',
    ]);
    expect(refineOptions('first_putt_m', '2_to_4m')?.map((o) => o.value)).toEqual([
        '2.5',
        '3',
        '3.5',
        '4',
    ]);
    expect(refineOptions('first_putt_m', '4_to_8m')?.map((o) => o.value)).toEqual([
        '5',
        '6',
        '7',
        '8',
    ]);
    expect(refineOptions('first_putt_m', 'over_8m')?.map((o) => o.value)).toEqual([
        '10',
        '12',
        '14',
        '16',
        '20',
    ]);
    expect(refineOptions('first_putt_m', 'over_8m')?.map((o) => o.label)).toEqual([
        '10m',
        '12m',
        '14m',
        '16m',
        '20+',
    ]);
    // Legacy coarse buckets never offer a refinement.
    expect(refineOptions('first_putt_m', 'inside_2m')).toBeNull();
    expect(refineOptions('first_putt_m', '2_to_6m')).toBeNull();
    expect(refineOptions('first_putt_m', 'over_6m')).toBeNull();
    expect(refineOptions('first_putt_m', null)).toBeNull();
    expect(options('penalty_source').map((o) => o.value)).toEqual([
        'tee',
        'approach',
        'short_or_green',
    ]);
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
    s.refresh(modules({ approach: true, putting: true }), { putts: '2' }, null);
    // A load must not swallow an in-progress answer.
    expect(s.value('gir')).toBe('0');
    expect(s.value('putts')).toBe('2');
    expect(s.batch).toEqual([item('gir', '0')]);
});

test('refresh prunes prompts a module change removed', () => {
    const s = step(modules({ approach: true, shortGame: true }));
    s.answer('gir', '0');
    s.answer('short_game_difficulty', 'hard');
    s.refresh(modules({ approach: true }), {}, null);
    expect(keys(s)).toEqual(['gir', 'green_miss_dir']);
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
    expect(s.visibility('green_miss_dir')).toBe('contradicted');
    expect(s.visibility('short_game_difficulty')).toBe('visible');
    s.answer('gir', '0');
    expect(s.visibility('green_miss_dir')).toBe('visible');
    expect(s.visibility('short_game_difficulty')).toBe('visible');
});

// --- Refresh change reporting ---------------------------------------------
//
// The service bumps its render revision off this boolean, so a refresh that
// reports "changed" when nothing did rebuilds the prompt list on every
// unrelated round update — and, when the caller is itself a tracked effect,
// never terminates.

test('refresh reports whether anything observable moved', () => {
    const s = step(modules({ approach: true, putting: true }), { par: 4 });
    expect(s.refresh(modules({ approach: true, putting: true }), {}, null)).toBe(false);
    // A durable answer landing is a change.
    expect(s.refresh(modules({ approach: true, putting: true }), { gir: '1' }, null)).toBe(true);
    expect(s.refresh(modules({ approach: true, putting: true }), { gir: '1' }, null)).toBe(false);
    // So is a module going away, which takes its prompts off the card.
    expect(s.refresh(modules({ approach: true }), { gir: '1' }, null)).toBe(true);
});

test('refresh keeps an uncommitted draft and still reports no change', () => {
    const s = step(modules({ approach: true }), { par: 4 });
    s.answer('gir', '0');
    expect(s.refresh(modules({ approach: true }), {}, null)).toBe(false);
    expect(s.value('gir')).toBe('0');
});

// --- Capture v2: the four new conditional prompts -----------------------------
//
// Each one has the same three states as its older siblings: VISIBLE when its
// precondition holds, UNREADABLE when the module that owns it is off (stored
// value untouched), CONTRADICTED when the precondition is answered the other
// way (stored value explicitly cleared).

test('tee_miss_dir follows the tee result', () => {
    const s = step(modules({ tee: true }));
    expect(s.visibility('tee_miss_dir')).toBe('contradicted');
    s.answer('tee_result', 'fairway');
    expect(s.visibility('tee_miss_dir')).toBe('contradicted');
    s.answer('tee_result', 'in_play');
    expect(s.visibility('tee_miss_dir')).toBe('visible');
    s.answer('tee_result', 'trouble');
    expect(s.visibility('tee_miss_dir')).toBe('visible');
    // Module off: unreadable, not contradicted.
    s.refresh(modules({ putting: true }), { tee_result: 'trouble', tee_miss_dir: 'left' }, null);
    expect(s.visibility('tee_miss_dir')).toBe('unreadable');
    expect(s.batch).toEqual([]);
});

test('a stored tee_miss_dir is cleared when the drive turns out to be a fairway', () => {
    const s = step(modules({ tee: true }), {
        persisted: { tee_result: 'in_play', tee_miss_dir: 'right' },
    });
    expect(keys(s)).toEqual(['tee_result', 'tee_miss_dir']);
    s.answer('tee_result', 'fairway');
    expect(keys(s)).toEqual(['tee_result']);
    expect(s.batch).toEqual([item('tee_result', 'fairway'), item('tee_miss_dir', null)]);
});

test('green_miss_dir follows GIR', () => {
    const s = step(modules({ approach: true }));
    expect(s.visibility('green_miss_dir')).toBe('contradicted');
    s.answer('gir', '1');
    expect(s.visibility('green_miss_dir')).toBe('contradicted');
    s.answer('gir', '0');
    expect(s.visibility('green_miss_dir')).toBe('visible');
});

test('a stored green_miss_dir is cleared when the green turns out to be hit', () => {
    const s = step(modules({ approach: true }), {
        persisted: { gir: '0', green_miss_dir: 'long' },
    });
    s.answer('gir', '1');
    expect(keys(s)).toEqual(['gir']);
    expect(s.batch).toEqual([item('gir', '1'), item('green_miss_dir', null)]);
});

test('a stored short-game answer survives the gir flip to hit', () => {
    // Since 064 the short game is legal on a hit green, so the flip clears
    // the miss direction — its claim really is contradicted — and ONLY that:
    // the chip happened whichever way the green answer settles.
    const s = step(modules({ approach: true, shortGame: true }), {
        persisted: { gir: '0', green_miss_dir: 'left', short_game_difficulty: 'standard' },
    });
    s.answer('gir', '1');
    expect(s.value('short_game_difficulty')).toBe('standard');
    expect(s.visibility('short_game_difficulty')).toBe('visible');
    expect(s.shortGameDisclosure()).toBe('expanded');
    expect(s.batch).toEqual([item('gir', '1'), item('green_miss_dir', null)]);
});

test('short_game_strokes shares the short-game gate', () => {
    const s = step(modules({ approach: true, shortGame: true }));
    expect(s.visibility('short_game_strokes')).toBe('contradicted');
    s.answer('gir', '0');
    expect(s.visibility('short_game_strokes')).toBe('visible');
    // The module, not the difficulty answer, is what owns it.
    s.refresh(modules({ approach: true }), { gir: '0', short_game_strokes: '2' }, null);
    expect(s.visibility('short_game_strokes')).toBe('unreadable');
    // Unreadable never clears: the stored count survives the module going off.
    expect(s.batch).not.toContainEqual(item('short_game_strokes', null));
});

test('penalty_source follows an answered penalty count', () => {
    const s = step(modules({ penalties: true }));
    expect(s.visibility('penalty_source')).toBe('contradicted');
    s.step('penalties', 1);
    expect(s.visibility('penalty_source')).toBe('visible');
    s.step('penalties', -1);
    expect(s.visibility('penalty_source')).toBe('contradicted');
});

test('a stored penalty_source is cleared when the penalty goes back to zero', () => {
    const s = step(modules({ penalties: true }), {
        persisted: { penalties: '1', penalty_source: 'tee' },
    });
    expect(keys(s)).toEqual(['penalties', 'penalty_source']);
    s.answer('penalties', '0');
    expect(keys(s)).toEqual(['penalties']);
    expect(s.batch).toEqual([item('penalties', '0'), item('penalty_source', null)]);
});

// --- Capture v2: the derived-GIR lifecycle (§3.4b) -----------------------------
//
// Five exhaustive states. The scorecard is an INPUT to the prompt, never an
// override of it: a tap wins for the visit, and a stored answer wins forever.

function girStep(opts: {
    par?: number;
    strokes?: number | null;
    persisted?: Partial<Record<StatEventKey, string>>;
}): StatStep {
    const s = step(modules({ approach: true, putting: true, shortGame: true }), {
        par: opts.par ?? 4,
        persisted: opts.persisted ?? {},
    });
    s.setScore(opts.strokes ?? null);
    return s;
}

test('derived GIR is idle without a score', () => {
    const s = girStep({ strokes: null });
    s.answer('putts', '2');
    expect(derivedGirState(s).state).toBe('idle');
    expect(s.materialiseDerivedGir()).toBe(false);
});

test('derived GIR is pending once score and putts agree on a hit', () => {
    const s = girStep({ strokes: 4 });
    s.answer('putts', '2');
    expect(derivedGirState(s)).toEqual({ state: 'pending', derived: '1' });
    expect(s.value('gir')).toBeNull();
});

test('derived GIR is pending on a miss too', () => {
    const s = girStep({ strokes: 5 });
    s.answer('putts', '2');
    expect(derivedGirState(s)).toEqual({ state: 'pending', derived: '0' });
});

test('a manual tap before close wins', () => {
    const s = girStep({ strokes: 4 });
    s.answer('putts', '2');
    s.answer('gir', '0');
    expect(derivedGirState(s)).toEqual({ state: 'manual' });
    expect(s.materialiseDerivedGir()).toBe(false);
    expect(s.value('gir')).toBe('0');
});

test('a stored answer the score agrees with is simply persisted', () => {
    const s = girStep({ strokes: 4, persisted: { gir: '1', putts: '2' } });
    expect(derivedGirState(s)).toEqual({ state: 'persisted' });
    expect(s.materialiseDerivedGir()).toBe(false);
});

test('a stored answer the score disagrees with is reported, never overwritten', () => {
    const s = girStep({ strokes: 6, persisted: { gir: '1', putts: '2' } });
    expect(derivedGirState(s)).toEqual({ state: 'disagree', derived: '0', stored: '1' });
    expect(s.materialiseDerivedGir()).toBe(false);
    expect(s.value('gir')).toBe('1');
});

test('materialise on close reveals green_miss_dir after a derived miss', () => {
    const s = girStep({ strokes: 5 });
    s.answer('putts', '2');
    expect(keys(s)).not.toContain('green_miss_dir');
    expect(s.materialiseDerivedGir()).toBe(true);
    expect(s.value('gir')).toBe('0');
    expect(keys(s)).toContain('green_miss_dir');
    expect(keys(s)).toContain('short_game_difficulty');
    expect(s.batch).toContainEqual(item('gir', '0'));
    // Idempotent: a second close has nothing left to write.
    expect(s.materialiseDerivedGir()).toBe(false);
});

test('materialise on close reveals a collapsed short game after a derived hit', () => {
    // A chip then a green hit in regulation count is a legal combination now,
    // so a derived hit REVEALS the short-game rows (folded away) instead of
    // contradicting them.
    const s = girStep({ strokes: 4 });
    s.answer('putts', '2');
    expect(s.visibility('short_game_difficulty')).toBe('contradicted');
    expect(s.materialiseDerivedGir()).toBe(true);
    expect(s.value('gir')).toBe('1');
    expect(s.visibility('short_game_difficulty')).toBe('visible');
    expect(s.visibility('short_game_strokes')).toBe('visible');
    expect(s.shortGameDisclosure()).toBe('collapsed');
    expect(s.batch).toContainEqual(item('gir', '1'));
});

// A hole that contradicts itself — no putt taken, but a first-putt distance
// recorded — is not a hole to derive from. `putting_coherent` refuses the same
// pair on the server; deriving here would launder the mistake into a fact.
test('an incoherent putt record blocks derivation', () => {
    const s = girStep({ strokes: 4 });
    s.answer('first_putt', '1_to_2m');
    s.answer('putts', '0');
    expect(derivedGirState(s).state).toBe('idle');
    expect(s.derivedGir()).toBeNull();
});

// A chip-in is a MISSED green: `putts = 0` with no first-putt bucket leaves
// `strokes - putts = strokes`, which cannot clear `par - 2`.
test('a chip-in derives as a miss', () => {
    const s = girStep({ strokes: 3 });
    s.answer('putts', '0');
    expect(derivedGirState(s)).toEqual({ state: 'pending', derived: '0' });
});

// --- Exact first-putt metres (first_putt_m) ---------------------------------
//
// An optional refinement of the bucket: a second chip row whose options are
// the metres inside the CURRENTLY selected fine bucket. Same three states as
// every conditional prompt, plus one rule of its own — the answer must stay
// inside its parent's bucket.

test('first_putt_m appears only once a fine bucket is selected', () => {
    const s = step(modules({ putting: true }));
    expect(s.visibility('first_putt_m')).toBe('contradicted');
    expect(keys(s)).toEqual(['first_putt', 'putts']);
    s.answer('first_putt', '2_to_4m');
    expect(s.visibility('first_putt_m')).toBe('visible');
    expect(keys(s)).toEqual(['first_putt', 'first_putt_m', 'putts']);
});

// Components render what the model says: the emitted prompt is an ordinary
// segments row carrying the selected bucket's metres, with no leading label.
test('the first_putt_m prompt resolves to the selected bucket options', () => {
    const s = step(modules({ putting: true }));
    s.answer('first_putt', 'over_8m');
    const prompt = s.prompts.find((p) => p.key === 'first_putt_m');
    expect(prompt?.label).toBe('');
    expect(prompt?.control.kind).toBe('segments');
    expect(
        prompt?.control.kind === 'segments' ? prompt.control.options.map((o) => o.value) : [],
    ).toEqual(['10', '12', '14', '16', '20']);
});

test('a metre outside the selected bucket is refused', () => {
    const s = step(modules({ putting: true }));
    s.answer('first_putt', 'inside_1m');
    s.answer('first_putt_m', '3');
    expect(s.value('first_putt_m')).toBeNull();
    s.answer('first_putt_m', '0.5');
    expect(s.value('first_putt_m')).toBe('0.5');
    expect(s.batch).toEqual([item('first_putt', 'inside_1m'), item('first_putt_m', '0.5')]);
});

test('changing the bucket discards a drafted metre', () => {
    const s = step(modules({ putting: true }));
    s.answer('first_putt', '1_to_2m');
    s.answer('first_putt_m', '1.5');
    s.answer('first_putt', '4_to_8m');
    // '1.5' does not belong to 4–8m; it was never stored, so nothing to clear.
    expect(s.value('first_putt_m')).toBeNull();
    expect(s.batch).toEqual([item('first_putt', '4_to_8m')]);
});

test('changing the bucket clears a stored metre on the server', () => {
    const s = step(modules({ putting: true }), {
        persisted: { first_putt: '1_to_2m', first_putt_m: '1.5' },
    });
    expect(s.value('first_putt_m')).toBe('1.5');
    s.answer('first_putt', '4_to_8m');
    expect(s.value('first_putt_m')).toBeNull();
    expect(s.batch).toEqual([item('first_putt', '4_to_8m'), item('first_putt_m', null)]);
});

test('clearing the bucket clears a stored metre too', () => {
    const s = step(modules({ putting: true }), {
        persisted: { first_putt: '1_to_2m', first_putt_m: '1.5' },
    });
    s.answer('first_putt', null);
    expect(s.visibility('first_putt_m')).toBe('contradicted');
    expect(s.batch).toEqual([item('first_putt', null), item('first_putt_m', null)]);
});

// A legacy coarse bucket matches no segment and offers no refinement — the
// row is off the card, and nothing is cleared because nothing fine was stored.
test('a legacy coarse bucket hides the metre row without clearing anything', () => {
    const s = step(modules({ putting: true }), { persisted: { first_putt: 'inside_2m' } });
    expect(s.visibility('first_putt_m')).toBe('contradicted');
    expect(keys(s)).toEqual(['first_putt', 'putts']);
    expect(s.batch).toEqual([]);
});

// Module off (or the putting row unreadable): the stored metre SURVIVES, like
// every unreadable key.
test('a turned-off putting module keeps a stored metre', () => {
    const s = step(modules({ approach: true }), {
        persisted: { first_putt: '2_to_4m', first_putt_m: '3' },
    });
    expect(s.visibility('first_putt_m')).toBe('unreadable');
    expect(s.batch).toEqual([]);
});

test('re-selecting the stored metre sends nothing', () => {
    const s = step(modules({ putting: true }), {
        persisted: { first_putt: '2_to_4m', first_putt_m: '3' },
    });
    s.answer('first_putt_m', '3.5');
    expect(s.batch).toEqual([item('first_putt_m', '3.5')]);
    s.answer('first_putt_m', '3');
    expect(s.batch).toEqual([]);
});

// --- The fifth green answer (hit_late) --------------------------------------

test('hit_late contradicts the short game', () => {
    const s = step(modules({ approach: true, shortGame: true }));
    s.answer('gir', '0');
    expect(s.visibility('short_game_difficulty')).toBe('visible');
    expect(s.visibility('short_game_strokes')).toBe('visible');
    s.answer('green_miss_dir', 'hit_late');
    expect(s.visibility('short_game_difficulty')).toBe('contradicted');
    expect(s.visibility('short_game_strokes')).toBe('contradicted');
    // A direction miss brings them back.
    s.answer('green_miss_dir', 'long');
    expect(s.visibility('short_game_difficulty')).toBe('visible');
});

test('hit_late never shows a disclosure', () => {
    const s = step(modules({ approach: true, shortGame: true }));
    s.answer('gir', '0');
    s.answer('green_miss_dir', 'hit_late');
    expect(s.shortGameDisclosure()).toBe('none');
});
