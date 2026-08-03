// Same re-export as `src/css.ts`: the framework's CSS recipes and spacing
// scale, reached through one app-local module so a future app-wide recipe has
// an obvious home and no component imports deep framework paths.
//
// ADR-005 ordering applies at every call site: recipe interpolation FIRST in a
// block, app overrides after.
export { s, btn, input, card } from '@basics/core/client/ui/css';
