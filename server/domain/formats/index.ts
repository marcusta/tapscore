// Phase 2.6b-final / Slice 2a — central registration for built-in format
// plugins. This is the canonical production registration entry point — the
// leaderboard resolves every format through the registry this populates.
//
// Presence-checked rather than guarded by a boolean: it re-adds only the
// missing built-ins, so it is safe to call after a test has cleared the
// registry (the singletons are process-global and shared across files).

import { clearFormats, hasFormatPlugin, registerFormat } from './plugin';
import { BUILTIN_FORMAT_PLUGINS } from './builtins';

export function registerBuiltInFormats(): void {
    for (const plugin of BUILTIN_FORMAT_PLUGINS) {
        if (!hasFormatPlugin(plugin.descriptor.id)) registerFormat(plugin);
    }
}

export function resetBuiltInFormats(): void {
    clearFormats();
}
