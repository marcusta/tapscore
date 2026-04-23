import type { Kysely } from 'kysely';

import { backfillRoundDefinitions } from '../backfill/round-definitions';
import type { Database } from '../schema';

/**
 * Phase 2.6b/3a — backfill `round_definitions` (and the six sibling output
 * tables) for every existing round.
 *
 * The RoundCompiler is the new write boundary for round setup. Migration
 * 018 created the target tables; this migration populates them from the
 * legacy (`participants`, `participant_players`, `round_format_slots`)
 * shape via `synthesizeRoundDefinition` → `compile` → `persistCompiledRound`.
 *
 * Skip semantics: if a round's legacy data is incomplete or malformed the
 * round is left without a `round_definitions` row, diagnostics are
 * written to stderr, and the migration still succeeds. Slice 3b's service
 * cutover is gated on the replay-gate test, not on this migration —
 * leaving a dirty pre-existing round unlinked is less destructive than
 * aborting every future migration.
 */
export async function up(db: Kysely<Database>): Promise<void> {
    const result = await backfillRoundDefinitions(db);
    if (result.roundsSkipped > 0) {
        console.warn(
            `migration 019: skipped ${result.roundsSkipped} round(s) due to diagnostics:`,
        );
        for (const d of result.diagnostics) {
            console.warn(`  round ${d.roundId} [${d.stage}]: ${d.messages.join('; ')}`);
        }
    }
    if (result.roundsTouched > 0) {
        console.log(`migration 019: backfilled ${result.roundsTouched} round(s)`);
    }
}
