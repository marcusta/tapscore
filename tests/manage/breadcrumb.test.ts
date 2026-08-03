import { describe, expect, test } from 'bun:test';
import { BreadcrumbService, crumbKey } from '../../manage/shell/breadcrumb.service';

// The trail itself is data (the shell renders whatever the mounted screen
// published), so what is worth pinning here is the IDENTITY rule — the one
// place where a wrong answer is invisible in the payload and only shows up as
// a stale row on screen.

describe('breadcrumb slot', () => {
    test('the last screen to publish wins', () => {
        const svc = new BreadcrumbService();
        expect(svc.crumbs.get()).toEqual([]);

        svc.set([{ label: 'Clubs' }]);
        svc.set([{ label: 'Clubs', path: '/courses' }, { label: 'Halmstad GK' }]);

        expect(svc.crumbs.get().map((c) => c.label)).toEqual(['Clubs', 'Halmstad GK']);
    });
});

describe('crumbKey', () => {
    test('the same label at the same index is a DIFFERENT row once it gains a path', () => {
        // Clubs list → club page. Keyed on label alone these collide, the row
        // is reused, and "Clubs" stays the un-clickable current page.
        expect(crumbKey({ label: 'Clubs' }, 0)).not.toBe(
            crumbKey({ label: 'Clubs', path: '/courses' }, 0),
        );
    });

    test('two clubs with the same name at the same step stay distinct', () => {
        expect(crumbKey({ label: 'Golfklubben', path: '/courses/clubs/a' }, 1)).not.toBe(
            crumbKey({ label: 'Golfklubben', path: '/courses/clubs/b' }, 1),
        );
    });

    test('an unchanged crumb keeps its row', () => {
        const a = crumbKey({ label: 'Clubs', path: '/courses' }, 0);
        const b = crumbKey({ label: 'Clubs', path: '/courses' }, 0);
        expect(a).toBe(b);
    });

    test('the same crumb at a different step is a different row', () => {
        expect(crumbKey({ label: 'Clubs', path: '/courses' }, 0)).not.toBe(
            crumbKey({ label: 'Clubs', path: '/courses' }, 1),
        );
    });
});
