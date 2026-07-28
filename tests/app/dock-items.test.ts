import { expect, test } from 'bun:test';
import { dockItems } from '../../src/app/dock-items';

// The dock is HOME / FRIENDS / COMPS — Profile left for the account menu.

test('dock is home + friends + comps when competitions are on', () => {
    expect(dockItems({ competitions: true }).map((i) => i.key)).toEqual([
        'home',
        'friends',
        'comps',
    ]);
});

test('competitions off drops the tab entirely', () => {
    expect(dockItems({ competitions: false }).map((i) => i.key)).toEqual(['home', 'friends']);
});

test('profile is never a dock item', () => {
    for (const flags of [{ competitions: true }, { competitions: false }]) {
        const items = dockItems(flags);
        expect(items.some((i) => i.href === '/profile')).toBe(false);
        expect(items.every((i) => i.icon.startsWith('<svg') && i.label.length > 0)).toBe(true);
    }
});
