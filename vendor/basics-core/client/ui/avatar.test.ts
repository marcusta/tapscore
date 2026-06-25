import { test, expect, beforeEach } from 'bun:test';
import { Signal, effect } from '../core';
import { AvatarComponent, avatar } from './avatar';

beforeEach(() => {
    document.body.innerHTML = '<div id="host"></div>';
});

test('AvatarComponent: renders initials', () => {
    const host = document.getElementById('host')!;
    const comp = new AvatarComponent({ initials: 'AB', bg: '#4263eb' });
    comp.mount(host);

    const span = host.querySelector('.ui-avatar__initials') as HTMLElement;
    expect(span.textContent).toBe('AB');

    comp.destroy();
});

test('AvatarComponent: default size is 40px', () => {
    const host = document.getElementById('host')!;
    const comp = new AvatarComponent({ initials: 'X' });
    comp.mount(host);

    const el = host.querySelector('.ui-avatar') as HTMLElement;
    expect(el.style.width).toBe('40px');
    expect(el.style.height).toBe('40px');

    comp.destroy();
});

test('AvatarComponent: custom size', () => {
    const host = document.getElementById('host')!;
    const comp = new AvatarComponent({ initials: 'X', size: 64 });
    comp.mount(host);

    const el = host.querySelector('.ui-avatar') as HTMLElement;
    expect(el.style.width).toBe('64px');
    expect(el.style.height).toBe('64px');

    comp.destroy();
});

test('AvatarComponent: image renders', () => {
    const host = document.getElementById('host')!;
    const comp = new AvatarComponent({ src: 'https://example.com/photo.jpg', initials: 'AB' });
    comp.mount(host);

    const img = host.querySelector('.ui-avatar__img') as HTMLImageElement;
    expect(img).not.toBeNull();
    expect(img.src).toContain('photo.jpg');

    comp.destroy();
});

test('AvatarComponent: image error hides img', () => {
    const host = document.getElementById('host')!;
    const comp = new AvatarComponent({ src: 'bad.jpg', initials: 'AB' });
    comp.mount(host);

    const img = host.querySelector('.ui-avatar__img') as HTMLImageElement;
    img.dispatchEvent(new Event('error'));
    expect(img.classList.contains('hidden')).toBe(true);

    comp.destroy();
});

test('AvatarComponent: reactive initials via function', () => {
    const name = new Signal('AB');
    const host = document.getElementById('host')!;
    const comp = new AvatarComponent({ initials: () => name.get() });
    comp.mount(host);

    const span = host.querySelector('.ui-avatar__initials') as HTMLElement;
    expect(span.textContent).toBe('AB');

    name.set('CD');
    expect(span.textContent).toBe('CD');

    comp.destroy();
});

test('AvatarComponent: reactive bg via function', () => {
    const color = new Signal('#ff0000');
    const host = document.getElementById('host')!;
    const comp = new AvatarComponent({ initials: 'X', bg: () => color.get() });
    comp.mount(host);

    const el = host.querySelector('.ui-avatar') as HTMLElement;
    expect(el.style.background).toBe('#ff0000');

    color.set('#00ff00');
    expect(el.style.background).toBe('#00ff00');

    comp.destroy();
});

test('AvatarComponent: overlay mode places img behind initials', () => {
    const host = document.getElementById('host')!;
    const comp = new AvatarComponent({ src: 'photo.jpg', initials: 'AB', showOverlay: true });
    comp.mount(host);

    const img = host.querySelector('.ui-avatar__img') as HTMLElement;
    expect(img.classList.contains('overlay')).toBe(true);

    comp.destroy();
});

test('avatar recipe returns css string with size', () => {
    const css = avatar(48);
    expect(css).toContain('48px');
    expect(css).toContain('border-radius: 50%');
});

test('avatar recipe default size is 40', () => {
    const css = avatar();
    expect(css).toContain('40px');
});
