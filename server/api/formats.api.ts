import { requireAuth } from '@basics/core/server/auth';
import { formatCatalog, type FormatDescriptor } from '../domain/formats/plugin';

// --- API descriptor ---
//
// Phase 2.6b-final / Slice 5 — the format catalog. `GET /formats` exposes the
// registered, serializable `FormatDescriptor[]` (label, scoring/team metadata,
// ball/team requirements, defaults, ranked metrics, client-adapter hint) that
// drive the round-setup wizard + generic mobile UI. The descriptors are the
// ONE source of catalog truth — read straight from the canonical format
// registry, never a hand-maintained list. Authenticated: only logged-in
// players may enumerate formats.

export function createFormatsApi() {
    const mw = [requireAuth()];
    return {
        list: {
            method: 'GET' as const,
            path: '/formats',
            fn: (): FormatDescriptor[] => formatCatalog(),
            middleware: mw,
        },
    };
}
