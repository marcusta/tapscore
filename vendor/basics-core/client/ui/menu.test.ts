import { test, expect, beforeEach } from 'bun:test';
import { Signal } from '../core';
import { MenuComponent } from './menu';
import type { MenuItem } from './menu';

beforeEach(() => {
    document.body.innerHTML = '<div id="host"></div>';
});

test('MenuComponent: renders items', () => {
    const open = new Signal(true);
    const items: MenuItem[] = [
        { type: 'item', label: 'Edit', onclick: () => {} },
        { type: 'item', label: 'Delete', onclick: () => {} },
    ];
    const host = document.getElementById('host')!;
    const comp = new MenuComponent({ open, items });
    comp.mount(host);

    const buttons = host.querySelectorAll('.ui-menu__item');
    expect(buttons.length).toBe(2);

    comp.destroy();
});

test('MenuComponent: renders labels and dividers', () => {
    const open = new Signal(true);
    const items: MenuItem[] = [
        { type: 'label', text: 'Actions' },
        { type: 'item', label: 'Edit', onclick: () => {} },
        { type: 'divider' },
        { type: 'item', label: 'Delete', onclick: () => {} },
    ];
    const host = document.getElementById('host')!;
    const comp = new MenuComponent({ open, items });
    comp.mount(host);

    expect(host.querySelectorAll('.ui-menu__label').length).toBe(1);
    expect(host.querySelectorAll('.ui-menu__divider').length).toBe(1);
    expect(host.querySelectorAll('.ui-menu__item').length).toBe(2);

    const label = host.querySelector('.ui-menu__label') as HTMLElement;
    expect(label.textContent).toBe('Actions');

    comp.destroy();
});

test('MenuComponent: click handler fires and closes menu', () => {
    const open = new Signal(true);
    let clicked = false;
    const items: MenuItem[] = [
        { type: 'item', label: 'Action', onclick: () => { clicked = true; } },
    ];
    const host = document.getElementById('host')!;
    const comp = new MenuComponent({ open, items });
    comp.mount(host);

    const btn = host.querySelector('.ui-menu__item') as HTMLElement;
    btn.click();
    expect(clicked).toBe(true);
    expect(open.get()).toBe(false); // closeOnClick default true

    comp.destroy();
});

test('MenuComponent: closeOnClick=false keeps menu open', () => {
    const open = new Signal(true);
    const items: MenuItem[] = [
        { type: 'item', label: 'Action', onclick: () => {} },
    ];
    const host = document.getElementById('host')!;
    const comp = new MenuComponent({ open, items, closeOnClick: false });
    comp.mount(host);

    const btn = host.querySelector('.ui-menu__item') as HTMLElement;
    btn.click();
    expect(open.get()).toBe(true); // still open

    comp.destroy();
});

test('MenuComponent: toggles open class via signal', () => {
    const open = new Signal(false);
    const items: MenuItem[] = [
        { type: 'item', label: 'Test', onclick: () => {} },
    ];
    const host = document.getElementById('host')!;
    const comp = new MenuComponent({ open, items });
    comp.mount(host);

    const menu = host.querySelector('.ui-menu') as HTMLElement;
    expect(menu.classList.contains('open')).toBe(false);

    open.set(true);
    expect(menu.classList.contains('open')).toBe(true);

    comp.destroy();
});

test('MenuComponent: signal-based items rebuild on change', () => {
    const open = new Signal(true);
    const items = new Signal<MenuItem[]>([
        { type: 'item', label: 'A', onclick: () => {} },
    ]);
    const host = document.getElementById('host')!;
    const comp = new MenuComponent({ open, items });
    comp.mount(host);

    expect(host.querySelectorAll('.ui-menu__item').length).toBe(1);

    items.set([
        { type: 'item', label: 'A', onclick: () => {} },
        { type: 'item', label: 'B', onclick: () => {} },
        { type: 'item', label: 'C', onclick: () => {} },
    ]);
    expect(host.querySelectorAll('.ui-menu__item').length).toBe(3);

    comp.destroy();
});

test('MenuComponent: icon renders in item', () => {
    const open = new Signal(true);
    const items: MenuItem[] = [
        { type: 'item', label: 'Star', icon: '\u2605', onclick: () => {} },
    ];
    const host = document.getElementById('host')!;
    const comp = new MenuComponent({ open, items });
    comp.mount(host);

    const btn = host.querySelector('.ui-menu__item') as HTMLElement;
    expect(btn.textContent).toContain('\u2605');
    expect(btn.textContent).toContain('Star');

    comp.destroy();
});
