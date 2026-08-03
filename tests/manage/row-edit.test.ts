import { expect, test } from 'bun:test';
import { COMMIT_FAILED, RowEditController } from '../../manage/ui/row-edit';

// The inline-edit state machine on its own — no DOM, because the states are the
// contract and every surface that edits a row in place (table, hole grid, tee
// panel) presents these same four.

test('begin opens a row; cancel closes it and forgets the error', () => {
    const edit = new RowEditController();
    expect(edit.phase.get()).toBe('idle');

    edit.begin('club-1');
    expect(edit.key.get()).toBe('club-1');
    expect(edit.phase.get()).toBe('editing');
    expect(edit.isEditing('club-1')).toBe(true);
    expect(edit.isEditing('club-2')).toBe(false);

    edit.fail('Name is required. Enter a name before saving.');
    expect(edit.phase.get()).toBe('failed');

    edit.cancel();
    expect(edit.key.get()).toBeNull();
    expect(edit.phase.get()).toBe('idle');
    expect(edit.error.get()).toBeNull();
});

test('a successful commit closes the editor', async () => {
    const edit = new RowEditController();
    edit.begin('club-1');

    const landed = await edit.commit(async () => ({ ok: true }));

    expect(landed).toBe(true);
    expect(edit.key.get()).toBeNull();
    expect(edit.phase.get()).toBe('idle');
    expect(edit.error.get()).toBeNull();
});

test('a rejected commit KEEPS the row open with the message on it', async () => {
    // The property that matters: a failed save must never throw away the draft.
    const edit = new RowEditController();
    edit.begin('club-1');

    const landed = await edit.commit(async () => ({
        ok: false,
        message: 'A club with that name already exists. Pick another name.',
    }));

    expect(landed).toBe(false);
    expect(edit.key.get()).toBe('club-1');
    expect(edit.phase.get()).toBe('failed');
    expect(edit.errorFor('club-1')).toBe(
        'A club with that name already exists. Pick another name.',
    );
    // …and never bleeds onto a neighbour.
    expect(edit.errorFor('club-2')).toBeNull();
});

test('a save that throws becomes the generic failure, not an unhandled rejection', async () => {
    const edit = new RowEditController();
    edit.begin('club-1');

    const landed = await edit.commit(async () => {
        throw new Error('fetch failed');
    });

    expect(landed).toBe(false);
    expect(edit.phase.get()).toBe('failed');
    expect(edit.error.get()).toBe(COMMIT_FAILED);
});

test('the row is locked while a save is in flight', async () => {
    const edit = new RowEditController();
    edit.begin('club-1');

    let release: (() => void) | null = null;
    const inFlight = edit.commit(
        () =>
            new Promise<{ ok: true }>((resolve) => {
                release = () => resolve({ ok: true });
            }),
    );

    expect(edit.phase.get()).toBe('saving');
    expect(edit.isSaving('club-1')).toBe(true);

    // Neither exit nor a jump to another row is allowed mid-request: the user
    // has to be able to see how the outstanding save ended.
    edit.cancel();
    edit.begin('club-2');
    expect(edit.key.get()).toBe('club-1');
    expect(edit.phase.get()).toBe('saving');

    // A second commit while one is out must not fire a second request.
    expect(await edit.commit(async () => ({ ok: true }))).toBe(false);

    release!();
    expect(await inFlight).toBe(true);
    expect(edit.phase.get()).toBe('idle');
});

test('committing with no open row is a no-op, not a request', async () => {
    const edit = new RowEditController();
    let called = false;

    const landed = await edit.commit(async () => {
        called = true;
        return { ok: true };
    });

    expect(landed).toBe(false);
    expect(called).toBe(false);
});

test('fail() without an open row cannot strand an error on the screen', () => {
    const edit = new RowEditController();
    edit.fail('nope');
    expect(edit.phase.get()).toBe('idle');
    expect(edit.error.get()).toBeNull();
});
