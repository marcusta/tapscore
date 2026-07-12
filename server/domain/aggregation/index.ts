// Phase 4 Slice 3 — central registration for built-in aggregation strategies.
// This is the canonical production registration entry point — the competition
// leaderboard resolves every aggregation through the registry this populates.
//
// Presence-checked rather than guarded by a boolean: it re-adds only the
// missing built-ins, so it is safe to call after a test has cleared the
// registry (the singletons are process-global and shared across files).

import {
    clearAggregationStrategies,
    hasAggregationStrategy,
    registerAggregationStrategy,
} from './strategy';
import { BUILTIN_AGGREGATION_STRATEGIES } from './builtins';

export function registerBuiltInAggregationStrategies(): void {
    for (const strategy of BUILTIN_AGGREGATION_STRATEGIES) {
        if (!hasAggregationStrategy(strategy.descriptor.id)) {
            registerAggregationStrategy(strategy);
        }
    }
}

export function resetBuiltInAggregationStrategies(): void {
    clearAggregationStrategies();
}
