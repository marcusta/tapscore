import { ForbiddenError, NotFoundError } from '@basics/core/server/auth';
import type { RoleService } from '../services/role.service';
import type { SeriesService } from '../services/series.service';

/**
 * Phase 6 Slice 1 — the series mutation gate.
 *
 * A series mutation requires the session player to EITHER own the series
 * (`owner_player_id`) OR hold a `series_admin` grant scoped to it (`role_grants`
 * with `scope_type='series'`, `scope_id=<seriesId>`). Same shape as
 * CompetitionAuthz: it throws, `NotFoundError` (404) before `ForbiddenError`
 * (403), so a stranger cannot learn that a series exists.
 *
 * The board read does not use this; it is gated by the series share token.
 */
export class SeriesAuthz {
    constructor(
        private roles: RoleService,
        private series: SeriesService,
    ) {}

    /** Throws unless `playerId` owns `seriesId` or holds the scoped grant. */
    async assertAdmin(seriesId: string, playerId: string): Promise<void> {
        const found = await this.series.get(seriesId);
        if (!found) throw new NotFoundError('series not found');
        if (found.ownerPlayerId === playerId) return;
        const granted = await this.roles.hasRole(playerId, 'series_admin', 'series', seriesId);
        if (granted) return;
        throw new ForbiddenError('series admin required');
    }

    /** Non-throwing variant, for a read that only changes what it shows. */
    async isAdmin(seriesId: string, playerId: string | null): Promise<boolean> {
        if (playerId === null) return false;
        const found = await this.series.get(seriesId);
        if (!found) return false;
        if (found.ownerPlayerId === playerId) return true;
        return this.roles.hasRole(playerId, 'series_admin', 'series', seriesId);
    }
}
