import { test, expect, beforeEach } from 'bun:test';
import { Signal } from '../core';
import { OverlayComponent } from './overlay';

beforeEach(() => {
    document.body.innerHTML = '<div id="host"></div>';
    document.body.style.overflow = '';
});

test('OverlayComponent: renders closed by default', () => {
    const open = new Signal(false);
    const host = document.getElementById('host')!;
    const comp = new OverlayComponent({ open });
    comp.mount(host);

    const overlay = host.querySelector('.ui-overlay') as HTMLElement;
    expect(overlay).not.toBeNull();
    expect(overlay.classList.contains('open')).toBe(false);

    comp.destroy();
});

test('OverlayComponent: opens when signal is true', () => {
    const open = new Signal(false);
    const host = document.getElementById('host')!;
    const comp = new OverlayComponent({ open });
    comp.mount(host);

    open.set(true);
    const overlay = host.querySelector('.ui-overlay') as HTMLElement;
    expect(overlay.classList.contains('open')).toBe(true);

    comp.destroy();
});

test('OverlayComponent: click sets open to false', () => {
    const open = new Signal(true);
    const host = document.getElementById('host')!;
    const comp = new OverlayComponent({ open });
    comp.mount(host);

    const overlay = host.querySelector('.ui-overlay') as HTMLElement;
    overlay.click();
    expect(open.get()).toBe(false);

    comp.destroy();
});

test('OverlayComponent: click calls onclose if provided', () => {
    const open = new Signal(true);
    let closeCalled = false;
    const host = document.getElementById('host')!;
    const comp = new OverlayComponent({ open, onclose: () => { closeCalled = true; } });
    comp.mount(host);

    const overlay = host.querySelector('.ui-overlay') as HTMLElement;
    overlay.click();
    expect(closeCalled).toBe(true);
    expect(open.get()).toBe(true); // onclose doesn't auto-set open

    comp.destroy();
});

test('OverlayComponent: scroll lock toggles body overflow', () => {
    const open = new Signal(false);
    const host = document.getElementById('host')!;
    const comp = new OverlayComponent({ open, scrollLock: true });
    comp.mount(host);

    expect(document.body.style.overflow).toBe('');

    open.set(true);
    expect(document.body.style.overflow).toBe('hidden');

    open.set(false);
    expect(document.body.style.overflow).toBe('');

    comp.destroy();
});

test('OverlayComponent: destroy restores body scroll', () => {
    const open = new Signal(true);
    const host = document.getElementById('host')!;
    const comp = new OverlayComponent({ open, scrollLock: true });
    comp.mount(host);

    expect(document.body.style.overflow).toBe('hidden');

    comp.destroy();
    expect(document.body.style.overflow).toBe('');
});

test('OverlayComponent: custom bg and zIndex', () => {
    const open = new Signal(false);
    const host = document.getElementById('host')!;
    const comp = new OverlayComponent({ open, bg: 'red', zIndex: 200 });
    comp.mount(host);

    const overlay = host.querySelector('.ui-overlay') as HTMLElement;
    expect(overlay.style.background).toBe('red');
    expect(overlay.style.zIndex).toBe('200');

    comp.destroy();
});
