import { t } from '../theme';
import type { StatsChartColors } from './stats-charts';

/**
 * The stats chart palette, in the app's theme vocabulary — one table, shared by
 * the dashboard, the per-round screen and the round-end story so a green bar
 * means the same thing on all three.
 *
 * `accent-strong` (fairway green) is the framework's ACTION family and the one
 * this app paints "good" in; `danger` is terracotta; plain `accent` is
 * decorative brass, which is exactly right for a magnitude with no direction.
 *
 * Resolved here rather than in `stats-charts.ts`, which must stay importable
 * without a DOM — `t()` comes from `../theme`, whose `createTokens` touches
 * `document` at import time. Anything under `tests/` importing the geometry
 * must not drag this file in with it.
 */
export const STATS_COLORS: StatsChartColors = {
    gain: t('accent-strong'),
    loss: t('danger'),
    zero: t('border-strong'),
    neutral: t('accent'),
    track: t('surface-sunken'),
    rule: t('border'),
};
