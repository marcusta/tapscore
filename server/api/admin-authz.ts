import { ForbiddenError } from '@basics/core/server/auth';
import type { RoleService } from '../services/role.service';

/**
 * Global (unscoped) `super_admin` gate.
 *
 * `CompetitionAuthz` gates ONE competition; this gates the operator surface —
 * the cross-player, read-only observability views under `/api/admin/*` plus
 * role administration itself. A `super_admin` grant is unscoped by construction
 * (`scope_type`/`scope_id` NULL), so there is exactly one predicate here.
 *
 * Throws `ForbiddenError` → 403. There is no 404-masking counterpart like the
 * competition gate has: the admin routes describe no single resource whose
 * existence could leak.
 */
export class AdminAuthz {
    constructor(private roles: RoleService) {}

    /** Non-throwing check — for read paths that merely enrich their payload. */
    isSuperAdmin(playerId: string): Promise<boolean> {
        return this.roles.hasRole(playerId, 'super_admin');
    }

    /** Throws unless `playerId` holds the unscoped `super_admin` grant. */
    async assertSuperAdmin(playerId: string): Promise<void> {
        if (await this.isSuperAdmin(playerId)) return;
        throw new ForbiddenError('super admin required');
    }
}
