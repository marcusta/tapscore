import '@basics/core/happy-dom';
import { expect, test } from 'bun:test';
import { Signal } from '@basics/core/client/core';
import { closeOnEscape, destructiveConfirm } from '../../manage/ui/confirm';

// The destructive-confirm contract. The dialog is the framework's; what is
// tested here is the wiring that kept drifting between call sites in the player
// app — danger tier, consequence copy, a verb on the confirm button, and a
// keyboard exit.

test('a destructive confirm is always the danger tier', () => {
    const props = destructiveConfirm({
        open: new Signal(false),
        title: 'Delete this club?',
        consequence: 'Linköpings GK and its two courses stop being available to new rounds.',
        confirmLabel: 'Delete club',
        onconfirm: () => {},
    });

    expect(props.danger).toBe(true);
    expect(props.confirmLabel).toBe('Delete club');
    expect(props.cancelLabel).toBe('Cancel');
});

test('the consequence becomes the message — the dialog never asks a bare "are you sure"', () => {
    const props = destructiveConfirm({
        open: new Signal(false),
        title: 'Remove this tee?',
        consequence: () => 'The Club / Men mapping loses its tee and rounds fall back to no tee.',
        confirmLabel: 'Remove tee',
        onconfirm: () => {},
    });

    expect(typeof props.message).toBe('function');
    expect((props.message as () => string)()).toContain('fall back');
    expect(props.title).toBe('Remove this tee?');
});

test('cancel copy can name what is kept', () => {
    const props = destructiveConfirm({
        open: new Signal(false),
        title: 'Delete this course?',
        consequence: 'Its holes and tees go with it.',
        confirmLabel: 'Delete course',
        cancelLabel: 'Keep course',
        onconfirm: () => {},
    });

    expect(props.cancelLabel).toBe('Keep course');
});

test('Escape closes an open dialog and runs the same cancel path as the button', () => {
    const open = new Signal(true);
    let cancelled = 0;
    const dispose = closeOnEscape(open, () => { cancelled += 1; });

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(open.get()).toBe(false);
    expect(cancelled).toBe(1);

    // A closed dialog does not react — Escape belongs to whatever is behind it.
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(cancelled).toBe(1);

    // Nor does any other key.
    open.set(true);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(open.get()).toBe(true);

    dispose();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(open.get()).toBe(true);
});
