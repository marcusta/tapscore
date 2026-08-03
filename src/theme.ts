import { createTokens } from '@basics/core/client/core';
import { resolveTapscoreTokens } from './theme-tokens';

// The player app's theme entry. The palette itself lives in `theme-tokens.ts`,
// shared with Tapscore Manage — see the note at the top of that file. What is
// left here is the player app's own composition of it: no additions, both
// schemes resolved, one `createTokens` call.
//
// Importing this module is what installs the theme (`createTokens` injects the
// `<style>`), so `src/main.ts` imports it for the side effect.

export { lightTokens, darkTokens } from './theme-tokens';

/**
 * The complete token maps for the player app — the shared palette merged over
 * the framework's neutral base and expanded with the derived `--field-*` /
 * `--btn-*` control tokens. Exported because this, not the raw palette, is the
 * full contract the Swift generator (`scripts/generate-theme-swift.ts`) mirrors
 * into the iOS design system.
 */
export const resolvedLight = resolveTapscoreTokens('light');
export const resolvedDark = resolveTapscoreTokens('dark');

export const t = createTokens(resolvedLight, resolvedDark);
