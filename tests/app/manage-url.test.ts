import { existsSync, readFileSync } from 'node:fs';
import { expect, test } from 'bun:test';
import { manageUrl } from '../../src/app/manage-url';

// Where the player app's "Course setup" row now points (spec §3.6's
// supersession clause), and the proof that the page it used to point at is
// really gone.

test('production sits under the deploy base path', () => {
    expect(manageUrl('/tapscore/')).toBe('/tapscore/manage/');
});

test('a root deployment gets the bare path', () => {
    expect(manageUrl('/')).toBe('/manage/');
});

test('the trailing slash is not load-bearing either way', () => {
    expect(manageUrl('/tapscore')).toBe('/tapscore/manage/');
    expect(manageUrl('')).toBe('/manage/');
});

// ─── Supersession ───
//
// These read source text, deliberately. The claim is a NEGATIVE one — that a
// route and a directory no longer exist — and the only way to assert the
// absence of a route from a table built inside a component class, without
// mounting the entire player app and its two dozen services, is to look. A
// re-added route would be caught here rather than in a QA pass.

const source = (path: string): string =>
    readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

test('the player app has no /course-setup route left', () => {
    const app = source('src/app/app.component.ts');
    expect(app).not.toContain('course-setup');
    expect(app).not.toContain('CourseSetupComponent');
});

test('the superseded page is deleted, not merely unrouted', () => {
    expect(existsSync(new URL('../../src/course-setup', import.meta.url))).toBe(false);
});

test('the account-menu row is a link OUT of the app, carrying the derived URL', () => {
    const menu = source('src/app/account-menu.component.ts');
    expect(menu).toContain('<a bind="courseSetup"');
    expect(menu).toContain('href: manageUrl()');
    // The row itself is unchanged for the reader: same label, same condition.
    expect(source('src/app/account-menu.ts')).toContain(
        "rows.push({ kind: 'course-setup', label: 'Course setup' })",
    );
});
