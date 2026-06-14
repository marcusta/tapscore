// Phase 2.6d — format-action replay (§17 stateful format-action seam).
//
// Pure resolution of the append-only `format_action_events` log into the
// ordered, supersession-resolved `FormatAction[]` a plugin's `score()` replays.
// Generic — no per-format knowledge. The single replay rule the seam declares:
// an action carrying `supersedesActionId` REPLACES the referenced action (and
// transitively any it superseded); superseded rows drop out before the plugin
// ever sees them. Surviving actions are ordered deterministically by
// (playHoleId, sequence, recordedAt, id) so replay is reproducible.

import type { FormatAction } from './types';

/** Resolve supersession + order. Input may be in any order. */
export function replayFormatActions(actions: FormatAction[]): FormatAction[] {
    const superseded = new Set<string>();
    for (const a of actions) {
        if (a.supersedesActionId) superseded.add(a.supersedesActionId);
    }
    const live = actions.filter((a) => !superseded.has(a.id));
    return live.sort((a, b) => {
        const ph = (a.playHoleId ?? '').localeCompare(b.playHoleId ?? '');
        if (ph !== 0) return ph;
        if (a.sequence !== b.sequence) return a.sequence - b.sequence;
        const ts = a.recordedAt.localeCompare(b.recordedAt);
        if (ts !== 0) return ts;
        return a.id.localeCompare(b.id);
    });
}

/** Bucket replayed actions by `slotDefId` (post-supersession). */
export function replayFormatActionsBySlot(actions: FormatAction[]): Map<string, FormatAction[]> {
    const out = new Map<string, FormatAction[]>();
    for (const a of replayFormatActions(actions)) {
        out.set(a.slotDefId, [...(out.get(a.slotDefId) ?? []), a]);
    }
    return out;
}
