import { ForbiddenError } from '@basics/core/server/auth';
import type { RoleService } from '../services/role.service';

/**
 * The one gate for shared course authoring: clubs, courses, tees, reusable
 * routes and course tee-role mappings. An unscoped course_admin operates the
 * catalog; super_admin is deliberately its superset.
 *
 * Club-scoped grants are deferred. A course must be creatable before it has a
 * course id, and the product has not yet defined club membership/ownership.
 */
export class CourseManagementAuthz {
    constructor(private roles: RoleService) {}

    async canManageCourses(playerId: string): Promise<boolean> {
        return (await this.roles.hasRole(playerId, 'super_admin'))
            || (await this.roles.hasRole(playerId, 'course_admin'));
    }

    async assertCanManageCourses(playerId: string): Promise<void> {
        if (await this.canManageCourses(playerId)) return;
        throw new ForbiddenError('course admin required');
    }
}
