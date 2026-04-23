import type { Kysely } from 'kysely';
import type { Database } from '../db/schema';
import { PlayerService } from './player.service';
import { ClubService } from './club.service';
import { CourseService } from './course.service';
import { TeeService } from './tee.service';
import { GuestPlayerService } from './guest-player.service';
import { HandicapService } from './handicap.service';
import { RoleService } from './role.service';
import { RoundService } from './round.service';
import { ParticipantService } from './participant.service';
import { TeeTimeService } from './tee-time.service';
import { ScoreEventService } from './score-event.service';
import { ScorecardService } from './scorecard.service';
import { LeaderboardService } from './leaderboard.service';

export function createServices(db: Kysely<Database>) {
    const playerService = new PlayerService(db);
    const clubService = new ClubService(db);
    const courseService = new CourseService(db);
    const teeService = new TeeService(db);
    const guestPlayerService = new GuestPlayerService(db);
    const handicapService = new HandicapService(db);
    const roleService = new RoleService(db);
    const roundService = new RoundService(db);
    const participantService = new ParticipantService(db, handicapService, teeService);
    const teeTimeService = new TeeTimeService(db);
    const scoreEventService = new ScoreEventService(db, roundService);
    const scorecardService = new ScorecardService(db);
    const leaderboardService = new LeaderboardService(
        db,
        roundService,
        scorecardService,
        courseService,
    );
    return {
        db,
        playerService,
        clubService,
        courseService,
        teeService,
        guestPlayerService,
        handicapService,
        roleService,
        roundService,
        participantService,
        teeTimeService,
        scoreEventService,
        scorecardService,
        leaderboardService,
    };
}
