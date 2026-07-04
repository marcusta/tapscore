import { expect, test } from 'bun:test';
import { deriveGroupPicker, NEW_GROUP_CHOICE } from '../../src/round/join';
import type { RoundPlayingGroup } from '../../src/api/friendly-rounds.gen';

// Pure derivation for the join-card group picker (Phase 3.5 self-join choice).
// Each existing group → an option "Group N · <time> — <occ> of <cap>", disabled
// when full; a "Start a new group" option always follows; the default is the
// first group with space, else the new-group option.

let n = 0;

function group(p: Partial<RoundPlayingGroup> = {}): RoundPlayingGroup {
    n++;
    return {
        id: `rg-${n}`,
        startTime: '09:00',
        capacity: 4,
        hittingBay: null,
        startPlayHoleId: 'ph-1',
        startOrdinal: 1,
        endPlayHoleId: 'ph-18',
        endOrdinal: 18,
        ballIds: [],
        playedOrder: [],
        ...p,
    };
}

test('no groups: only the new-group option, default-selected', () => {
    const picker = deriveGroupPicker([]);
    expect(picker.options).toEqual([
        { value: NEW_GROUP_CHOICE, label: 'Start a new group', disabled: false },
    ]);
    expect(picker.defaultValue).toBe(NEW_GROUP_CHOICE);
});

test('single group with space: shown (occupancy of capacity) and default-selected', () => {
    const g = group({ id: 'rg-1', startTime: '09:00', capacity: 4, ballIds: ['b1', 'b2'] });
    const picker = deriveGroupPicker([g]);
    expect(picker.options[0]).toEqual({
        value: 'rg-1',
        label: 'Group 1 · 09:00 — 2 of 4',
        disabled: false,
    });
    expect(picker.options[1]!.value).toBe(NEW_GROUP_CHOICE);
    expect(picker.defaultValue).toBe('rg-1');
});

test('full group: disabled, and the default falls through to the next open one', () => {
    const full = group({ id: 'rg-1', capacity: 2, ballIds: ['b1', 'b2'] });
    const open = group({ id: 'rg-2', capacity: 4, ballIds: ['b3'] });
    const picker = deriveGroupPicker([full, open]);
    expect(picker.options[0]!.disabled).toBe(true);
    expect(picker.options[0]!.label).toBe('Group 1 · 09:00 — 2 of 2');
    expect(picker.options[1]!.disabled).toBe(false);
    expect(picker.defaultValue).toBe('rg-2');
});

test('every group full: default is the new-group option', () => {
    const a = group({ id: 'rg-1', capacity: 2, ballIds: ['b1', 'b2'] });
    const b = group({ id: 'rg-2', capacity: 1, ballIds: ['b3'] });
    const picker = deriveGroupPicker([a, b]);
    expect(picker.options[0]!.disabled).toBe(true);
    expect(picker.options[1]!.disabled).toBe(true);
    expect(picker.options[2]!.value).toBe(NEW_GROUP_CHOICE);
    expect(picker.defaultValue).toBe(NEW_GROUP_CHOICE);
});

test('startTime without a clock time (a bare date) is omitted from the label', () => {
    const g = group({ id: 'rg-1', startTime: '2026-07-04', capacity: 4, ballIds: ['b1'] });
    const picker = deriveGroupPicker([g]);
    expect(picker.options[0]!.label).toBe('Group 1 — 1 of 4');
});

test('group numbering is 1-based and follows input order', () => {
    const picker = deriveGroupPicker([
        group({ id: 'rg-1', ballIds: [] }),
        group({ id: 'rg-2', ballIds: [] }),
        group({ id: 'rg-3', ballIds: [] }),
    ]);
    expect(picker.options.map((o) => o.label.split(' —')[0])).toEqual([
        'Group 1 · 09:00',
        'Group 2 · 09:00',
        'Group 3 · 09:00',
        'Start a new group',
    ]);
});
