import { buildSlotResult } from './result-builder';
import type { FormatResultPresenter } from './result-presenter';

/**
 * Transitional presenter for formats not yet migrated to explicit result
 * presenters. Wraps the legacy central builder. Do NOT add new format-specific
 * behavior here — that goes in a format presenter. This file is deleted in Phase G.
 */
export const defaultResultPresenter: FormatResultPresenter = (input) => buildSlotResult(input);
