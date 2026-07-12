import { ForbiddenError, NotFoundError } from '@basics/core/server/auth';
import type { RoleService } from '../services/role.service';
import type { CompetitionService } from '../services/competition.service';

/**
 * Phase 4 Slice 1 — the FIRST real `role_grants` enforcement.
 *
 * A competition mutation requires the session player to EITHER own the
 * competition (`owner_player_id`) OR hold a `competition_admin` grant scoped to
 * it (`role_grants` with `scope_type='competition'`, `scope_id=<competitionId>`).
 * This is the reusable seam every mutating competition endpoint calls at the top
 * of its handler, right after `requireUser(c).id` — consistent with how
 * `friendly-rounds` reads the session identity in the fn and delegates the
 * check.
 *
 * It throws (never returns a union): `ForbiddenError` → 403 for a stranger,
 * `NotFoundError` → 404 for a missing competition (a stranger must not learn a
 * competition exists by getting a 403 instead of a 404). Read paths do NOT use
 * this — they stay open per app convention. Play/score paths are token-scoped
 * per round and are untouched by competition roles.
 */
export class CompetitionAuthz {
    constructor(
        private roles: RoleService,
        private competitions: CompetitionService,
    ) {}

    /** Throws unless `playerId` owns `competitionId` or holds the scoped grant. */
    async assertAdmin(competitionId: string, playerId: string): Promise<void> {
        const competition = await this.competitions.get(competitionId);
        if (!competition) throw new NotFoundError('competition not found');
        if (competition.ownerPlayerId === playerId) return;
        const granted = await this.roles.hasRole(
            playerId,
            'competition_admin',
            'competition',
            competitionId,
        );
        if (granted) return;
        throw new ForbiddenError('competition admin required');
    }
}
