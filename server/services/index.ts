import type { Kysely } from 'kysely';
import type { Database } from '../db/schema';
import { PlayerService } from './player.service';
import { ClubService } from './club.service';
import { CourseService } from './course.service';
import { CourseRouteTemplateService } from './course-route-template.service';
import { TeeService } from './tee.service';
import { GuestPlayerService } from './guest-player.service';
import { HandicapService } from './handicap.service';
import { RoleService } from './role.service';
import { RoundService, type RoundServiceDeps } from './round.service';
import { ScoreEventService } from './score-event.service';
import { ScorecardService } from './scorecard.service';
import { LeaderboardService } from './leaderboard.service';
import { CorrectionService } from './correction.service';
import { FormatActionService } from './format-action.service';
import { DashboardService } from './dashboard.service';
import { FriendlyRoundService } from './friendly-round.service';
import { RoundJoinService } from './round-join.service';
import { RoundLeaveService } from './round-leave.service';
import { RoundEditService } from './round-edit.service';
import { GuestClaimService } from './guest-claim.service';
import { FriendService } from './friend.service';
import { CompetitionService } from './competition.service';
import { CompetitionRoundService } from './competition-round.service';
import { CompetitionLeaderboardService } from './competition-leaderboard.service';
import type { CompilerTeeContext, Gender } from '../domain/compiler/types';

/**
 * Build the dep bag `RoundService.create` needs to assemble a CompilerInput.
 * Extracted here (not on RoundService itself) to keep the service free of
 * imports onto sibling services — they're provided by this composition root.
 */
function buildRoundServiceDeps(
    courseService: CourseService,
    teeService: TeeService,
    playerService: PlayerService,
    guestPlayerService: GuestPlayerService,
    courseRouteTemplateService: CourseRouteTemplateService,
): RoundServiceDeps {
    return {
        resolveRouteTemplate: (templateId) =>
            courseRouteTemplateService.resolveForRound(templateId),
        async getCourseHoles(courseId) {
            const course = await courseService.getById(courseId);
            if (!course) return [];
            return course.holes;
        },
        async getCourseName(courseId) {
            const course = await courseService.getById(courseId);
            return course?.name ?? null;
        },
        async getTeeContext(teeId): Promise<CompilerTeeContext | null> {
            const tee = await teeService.getById(teeId);
            if (!tee) return null;
            const holes = tee.holeLengths.map((h) => ({
                holeNumber: h.holeNumber,
                lengthM: h.lengthM,
                strokeIndexOverride: h.strokeIndexOverride,
            }));
            const ratings = new Map<
                Gender,
                { courseRating: number; slope: number; teePar: number }
            >();
            for (const r of tee.ratings) {
                ratings.set(r.gender, {
                    courseRating: r.courseRating,
                    slope: r.slope,
                    teePar: r.par,
                });
            }
            return { teeName: tee.name, holes, ratings };
        },
        async getPlayerProfile(playerId) {
            const p = await playerService.getById(playerId);
            if (!p) return null;
            // Players don't carry a default gender column; the producer
            // must supply gender in the RoundDefinition (mixed-tee rounds).
            return { displayName: p.displayName };
        },
        async getGuestProfile(guestId) {
            const g = await guestPlayerService.findById(guestId);
            if (!g) return null;
            return { displayName: g.displayName, gender: g.gender };
        },
    };
}

export function createServices(db: Kysely<Database>) {
    // HandicapService before PlayerService: registration + manual index
    // maintenance append to handicap_history through it (Phase 3).
    const handicapService = new HandicapService(db);
    const playerService = new PlayerService(db, handicapService);
    const friendService = new FriendService(db);
    const clubService = new ClubService(db);
    const courseService = new CourseService(db);
    const courseRouteTemplateService = new CourseRouteTemplateService(db);
    const teeService = new TeeService(db);
    const guestPlayerService = new GuestPlayerService(db);
    const roleService = new RoleService(db);
    const roundService = new RoundService(
        db,
        buildRoundServiceDeps(
            courseService,
            teeService,
            playerService,
            guestPlayerService,
            courseRouteTemplateService,
        ),
    );
    const scoreEventService = new ScoreEventService(db, roundService);
    const scorecardService = new ScorecardService(db);
    const leaderboardService = new LeaderboardService(
        db,
        roundService,
        courseService,
    );
    const correctionService = new CorrectionService(db, roundService);
    const formatActionService = new FormatActionService(db, roundService);
    const dashboardService = new DashboardService(
        db,
        roundService,
        leaderboardService,
        playerService,
    );
    const friendlyRoundService = new FriendlyRoundService(
        db,
        roundService,
        scoreEventService,
        scorecardService,
        leaderboardService,
    );
    const roundJoinService = new RoundJoinService(
        db,
        roundService,
        correctionService,
        playerService,
    );
    const roundLeaveService = new RoundLeaveService(db, roundService, correctionService);
    const roundEditService = new RoundEditService(db, roundService, correctionService);
    const guestClaimService = new GuestClaimService(db);
    const competitionService = new CompetitionService(
        db,
        playerService,
        guestPlayerService,
    );
    // Materialises competition rounds THROUGH the friendly create machinery
    // (same compile-or-diagnose path + token front door); see the service doc.
    const competitionRoundService = new CompetitionRoundService(
        db,
        competitionService,
        friendlyRoundService,
        playerService,
        guestPlayerService,
    );
    // The live aggregated competition board: loads rounds + roster + per-round
    // RoundResults and folds through the registered AggregationStrategy.
    const competitionLeaderboardService = new CompetitionLeaderboardService(
        db,
        competitionService,
        competitionRoundService,
        leaderboardService,
    );
    return {
        db,
        playerService,
        friendService,
        clubService,
        courseService,
        courseRouteTemplateService,
        teeService,
        guestPlayerService,
        handicapService,
        roleService,
        roundService,
        scoreEventService,
        scorecardService,
        leaderboardService,
        correctionService,
        formatActionService,
        dashboardService,
        friendlyRoundService,
        roundJoinService,
        roundLeaveService,
        roundEditService,
        guestClaimService,
        competitionService,
        competitionRoundService,
        competitionLeaderboardService,
    };
}
