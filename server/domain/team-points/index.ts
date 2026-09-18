// Phase 6 Slice 1 — central registration for built-in team-points rules.
//
// Presence-checked rather than guarded by a boolean: it re-adds only the
// missing built-ins, so it is safe to call after a test has cleared the
// registry (the singletons are process-global and shared across files).

import { clearTeamPointsRules, hasTeamPointsRule, registerTeamPointsRule } from './rule';
import { BUILTIN_TEAM_POINTS_RULES } from './builtins';

export function registerBuiltInTeamPointsRules(): void {
    for (const rule of BUILTIN_TEAM_POINTS_RULES) {
        if (!hasTeamPointsRule(rule.descriptor.id)) registerTeamPointsRule(rule);
    }
}

export function resetBuiltInTeamPointsRules(): void {
    clearTeamPointsRules();
}
