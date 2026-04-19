import type { Kysely } from 'kysely';
import type { Database } from '../db/schema';
import { PlayerService } from './player.service';
import { ClubService } from './club.service';
import { CourseService } from './course.service';
import { TeeService } from './tee.service';
import { GuestPlayerService } from './guest-player.service';
import { HandicapService } from './handicap.service';
import { RoleService } from './role.service';

export function createServices(db: Kysely<Database>) {
    const playerService = new PlayerService(db);
    const clubService = new ClubService(db);
    const courseService = new CourseService(db);
    const teeService = new TeeService(db);
    const guestPlayerService = new GuestPlayerService(db);
    const handicapService = new HandicapService(db);
    const roleService = new RoleService(db);
    return {
        db,
        playerService,
        clubService,
        courseService,
        teeService,
        guestPlayerService,
        handicapService,
        roleService,
    };
}
