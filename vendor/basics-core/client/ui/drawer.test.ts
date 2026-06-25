import { test, expect, beforeEach } from 'bun:test';
import { Signal } from '../core';
import { DrawerComponent } from './drawer';

beforeEach(() => {
    document.body.innerHTML = '<div id="host"></div>';
    document.body.style.overflow = '';
});

test('DrawerComponent: renders closed by default', () => {
    const open = new Signal(false);
    const host = document.getElementById('host')!;
    const comp = new DrawerComponent({ open });
    comp.mount(host);

    const panel = host.querySelector('.ui-drawer') as HTMLElement;
    expect(panel).not.toBeNull();
    expect(panel.classList.contains('open')).toBe(false);

    comp.destroy();
});

test('DrawerComponent: opens when signal is true', () => {
    const open = new Signal(false);
    const host = document.getElementById('host')!;
    const comp = new DrawerComponent({ open });
    comp.mount(host);

    open.set(true);
    const panel = host.querySelector('.ui-drawer') as HTMLElement;
    expect(panel.classList.contains('open')).toBe(true);

    comp.destroy();
});

test('DrawerComponent: overlay is spawned', () => {
    const open = new Signal(false);
    const host = document.getElementById('host')!;
    const comp = new DrawerComponent({ open });
    comp.mount(host);

    const overlay = host.querySelector('.ui-overlay') as HTMLElement;
    expect(overlay).not.toBeNull();

    comp.destroy();
});

test('DrawerComponent: default side is left', () => {
    const open = new Signal(false);
    const host = document.getElementById('host')!;
    const comp = new DrawerComponent({ open });
    comp.mount(host);

    const panel = host.querySelector('.ui-drawer') as HTMLElement;
    expect(panel.classList.contains('ui-drawer--left')).toBe(true);

    comp.destroy();
});

test('DrawerComponent: right side variant', () => {
    const open = new Signal(false);
    const host = document.getElementById('host')!;
    const comp = new DrawerComponent({ open, side: 'right' });
    comp.mount(host);

    const panel = host.querySelector('.ui-drawer') as HTMLElement;
    expect(panel.classList.contains('ui-drawer--right')).toBe(true);

    comp.destroy();
});

test('DrawerComponent: custom width', () => {
    const open = new Signal(false);
    const host = document.getElementById('host')!;
    const comp = new DrawerComponent({ open, width: '320px' });
    comp.mount(host);

    const panel = host.querySelector('.ui-drawer') as HTMLElement;
    expect(panel.style.width).toBe('320px');

    comp.destroy();
});

test('DrawerComponent: string content projection', () => {
    const open = new Signal(true);
    const host = document.getElementById('host')!;
    const comp = new DrawerComponent({ open, content: 'Hello Drawer' });
    comp.mount(host);

    const contentEl = host.querySelector('[bind="content"]') as HTMLElement;
    expect(contentEl.textContent).toBe('Hello Drawer');

    comp.destroy();
});

test('DrawerComponent: render function content projection', () => {
    const open = new Signal(true);
    const host = document.getElementById('host')!;
    const comp = new DrawerComponent({
        open,
        content: (h) => {
            const p = document.createElement('p');
            p.textContent = 'Custom content';
            h.appendChild(p);
        },
    });
    comp.mount(host);

    const p = host.querySelector('p') as HTMLElement;
    expect(p.textContent).toBe('Custom content');

    comp.destroy();
});

test('DrawerComponent: overlay click closes drawer', () => {
    const open = new Signal(true);
    const host = document.getElementById('host')!;
    const comp = new DrawerComponent({ open });
    comp.mount(host);

    const overlay = host.querySelector('.ui-overlay') as HTMLElement;
    overlay.click();
    expect(open.get()).toBe(false);

    comp.destroy();
});
