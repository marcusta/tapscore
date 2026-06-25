import { test, expect, beforeEach } from 'bun:test';
import { Signal } from '../core';
import { CalendarComponent } from './calendar';
import type { CalendarDay } from './calendar';

beforeEach(() => {
    document.body.innerHTML = '<div id="host"></div>';
});

test('CalendarComponent: renders 42 day cells', () => {
    const year = new Signal(2025);
    const month = new Signal(1);
    const host = document.getElementById('host')!;
    const comp = new CalendarComponent({ year, month });
    comp.mount(host);

    const cells = host.querySelectorAll('.ui-cal__cell');
    expect(cells.length).toBe(42);

    comp.destroy();
});

test('CalendarComponent: renders 7 day name headers', () => {
    const year = new Signal(2025);
    const month = new Signal(1);
    const host = document.getElementById('host')!;
    const comp = new CalendarComponent({ year, month });
    comp.mount(host);

    const dayNames = host.querySelectorAll('.ui-cal__day-name');
    expect(dayNames.length).toBe(7);
    expect(dayNames[0].textContent).toBe('Mon');
    expect(dayNames[6].textContent).toBe('Sun');

    comp.destroy();
});

test('CalendarComponent: displays month and year in title', () => {
    const year = new Signal(2025);
    const month = new Signal(3);
    const host = document.getElementById('host')!;
    const comp = new CalendarComponent({ year, month });
    comp.mount(host);

    const title = host.querySelector('.ui-cal__title') as HTMLElement;
    expect(title.textContent).toBe('March 2025');

    comp.destroy();
});

test('CalendarComponent: rebuilds grid on month change', () => {
    const year = new Signal(2025);
    const month = new Signal(1);
    const host = document.getElementById('host')!;
    const comp = new CalendarComponent({ year, month });
    comp.mount(host);

    const title = host.querySelector('.ui-cal__title') as HTMLElement;
    expect(title.textContent).toBe('January 2025');

    month.set(6);
    expect(title.textContent).toBe('June 2025');

    comp.destroy();
});

test('CalendarComponent: today cell is highlighted', () => {
    const now = new Date();
    const year = new Signal(now.getFullYear());
    const month = new Signal(now.getMonth() + 1);
    const host = document.getElementById('host')!;
    const comp = new CalendarComponent({ year, month });
    comp.mount(host);

    const todayCell = host.querySelector('.ui-cal__cell--today');
    expect(todayCell).not.toBeNull();

    const num = todayCell!.querySelector('.ui-cal__cell-num') as HTMLElement;
    expect(num.textContent).toBe(String(now.getDate()));

    comp.destroy();
});

test('CalendarComponent: other-month cells have dimmed class', () => {
    const year = new Signal(2025);
    const month = new Signal(1); // January 2025 starts on Wed
    const host = document.getElementById('host')!;
    const comp = new CalendarComponent({ year, month });
    comp.mount(host);

    const otherCells = host.querySelectorAll('.ui-cal__cell--other');
    expect(otherCells.length).toBeGreaterThan(0);

    comp.destroy();
});

test('CalendarComponent: prev/next navigation changes month', () => {
    const year = new Signal(2025);
    const month = new Signal(3);
    const host = document.getElementById('host')!;
    const comp = new CalendarComponent({ year, month });
    comp.mount(host);

    // Click prev
    const buttons = host.querySelectorAll('.ui-cal__nav');
    const prevBtn = buttons[0] as HTMLElement;
    const nextBtn = buttons[1] as HTMLElement;

    prevBtn.click();
    expect(month.get()).toBe(2);

    nextBtn.click();
    expect(month.get()).toBe(3);

    comp.destroy();
});

test('CalendarComponent: prev wraps to December of previous year', () => {
    const year = new Signal(2025);
    const month = new Signal(1);
    const host = document.getElementById('host')!;
    const comp = new CalendarComponent({ year, month });
    comp.mount(host);

    const prevBtn = host.querySelectorAll('.ui-cal__nav')[0] as HTMLElement;
    prevBtn.click();

    expect(month.get()).toBe(12);
    expect(year.get()).toBe(2024);

    comp.destroy();
});

test('CalendarComponent: next wraps to January of next year', () => {
    const year = new Signal(2025);
    const month = new Signal(12);
    const host = document.getElementById('host')!;
    const comp = new CalendarComponent({ year, month });
    comp.mount(host);

    const nextBtn = host.querySelectorAll('.ui-cal__nav')[1] as HTMLElement;
    nextBtn.click();

    expect(month.get()).toBe(1);
    expect(year.get()).toBe(2026);

    comp.destroy();
});

test('CalendarComponent: renderDay callback receives each day', () => {
    const year = new Signal(2025);
    const month = new Signal(1);
    const days: CalendarDay[] = [];
    const host = document.getElementById('host')!;
    const comp = new CalendarComponent({
        year,
        month,
        renderDay: (day) => { days.push(day); },
    });
    comp.mount(host);

    expect(days.length).toBe(42);

    // Check a current-month day exists
    const currentMonthDays = days.filter(d => d.isCurrentMonth);
    expect(currentMonthDays.length).toBe(31); // January has 31 days

    comp.destroy();
});

test('CalendarComponent: renderDay callback can add content to cell', () => {
    const year = new Signal(2025);
    const month = new Signal(1);
    const host = document.getElementById('host')!;
    const comp = new CalendarComponent({
        year,
        month,
        renderDay: (day, cell) => {
            if (day.dayOfMonth === 15 && day.isCurrentMonth) {
                const badge = document.createElement('span');
                badge.className = 'test-badge';
                badge.textContent = 'Event';
                cell.appendChild(badge);
            }
        },
    });
    comp.mount(host);

    const badges = host.querySelectorAll('.test-badge');
    expect(badges.length).toBe(1);
    expect(badges[0].textContent).toBe('Event');

    comp.destroy();
});

test('CalendarComponent: custom onPrev/onNext callbacks used instead of defaults', () => {
    const year = new Signal(2025);
    const month = new Signal(6);
    let prevCalled = false;
    let nextCalled = false;
    const host = document.getElementById('host')!;
    const comp = new CalendarComponent({
        year,
        month,
        onPrev: () => { prevCalled = true; },
        onNext: () => { nextCalled = true; },
    });
    comp.mount(host);

    const buttons = host.querySelectorAll('.ui-cal__nav');
    (buttons[0] as HTMLElement).click();
    expect(prevCalled).toBe(true);
    expect(month.get()).toBe(6); // not changed by component

    (buttons[1] as HTMLElement).click();
    expect(nextCalled).toBe(true);

    comp.destroy();
});

test('CalendarComponent: custom month and day names', () => {
    const year = new Signal(2025);
    const month = new Signal(1);
    const host = document.getElementById('host')!;
    const comp = new CalendarComponent({
        year,
        month,
        monthNames: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        dayNames: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
    });
    comp.mount(host);

    const title = host.querySelector('.ui-cal__title') as HTMLElement;
    expect(title.textContent).toBe('Jan 2025');

    const dayNames = host.querySelectorAll('.ui-cal__day-name');
    expect(dayNames[0].textContent).toBe('M');

    comp.destroy();
});
