import type { Kysely } from 'kysely';
import type { Database } from '../db/schema';
import { PlayerService } from './player.service';
import { PlayerAvatarService } from './player-avatar.service';
import { ClubService } from './club.service';
import { CourseService } from './course.service';
import { CourseRouteTemplateService } from './course-route-template.service';
import { TeeService } from './tee.service';
import { GuestPlayerService } from './guest-player.service';
import { HandicapService } from './handicap.service';
import { RoleService } from './role.service';
import { AdminService } from './admin.service';
import { RoundService, type RoundServiceDeps } from './round.service';
import { RoundEventsHub } from './round-events-hub';
import { ScoreEventService } from './score-event.service';
import { ScorecardService } from './scorecard.service';
import { PlayerStatsService } from './player-stats.service';
import { LeaderboardService } from './leaderboard.service';
import { CorrectionService } from './correction.service';
import { FormatActionService } from './format-action.service';
import { DashboardService } from './dashboard.service';
import { FriendlyRoundService } from './friendly-round.service';
import { StartListService } from './start-list.service';
import { RoundJoinService } from './round-join.service';
import { SeatClaimService } from './seat-claim.service';
import { RoundLeaveService } from './round-leave.service';
import { RoundEditService } from './round-edit.service';
import { GuestClaimService } from './guest-claim.service';
import { FriendService } from './friend.service';
import { FriendsActivityService } from './friends-activity.service';
import { FriendProfileService } from './friend-profile.service';
import { SpectateService } from './spectate.service';
import { CompetitionService } from './competition.service';
import { CompetitionRoundService } from './competition-round.service';
import { CompetitionLeaderboardService } from './competition-leaderboard.service';
import { CompetitionCutService } from './competition-cut.service';
import { CompetitionFinalizeService } from './competition-finalize.service';
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
    // Separate from PlayerService on purpose: it is the ONLY holder of
    // `player_avatars.bytes`, and keeping it apart is what makes "no other
    // query selects the BLOB" a checkable claim rather than a convention.
    const playerAvatarService = new PlayerAvatarService(db);
    const friendService = new FriendService(db);
    const clubService = new ClubService(db);
    const teeService = new TeeService(db);
    const courseService = new CourseService(db, teeService);
    const courseRouteTemplateService = new CourseRouteTemplateService(db);
    const guestPlayerService = new GuestPlayerService(db);
    const roleService = new RoleService(db);
    const adminService = new AdminService(db);
    // Phase 9a: every cursor move announces itself here; the SSE route is the
    // only subscriber today. Nothing else may depend on delivery — the hub is
    // in-process and best-effort, `rounds.latest_event_id` stays the truth.
    const roundEventsHub = new RoundEventsHub();
    const roundService = new RoundService(
        db,
        buildRoundServiceDeps(
            courseService,
            teeService,
            playerService,
            guestPlayerService,
            courseRouteTemplateService,
        ),
        roundEventsHub,
    );
    const scoreEventService = new ScoreEventService(db, roundService);
    const scorecardService = new ScorecardService(db);
    // Player statistics (docs/proposals/player-stats.md): its own aggregate —
    // config + capture events + the trigger-maintained projection. No deps: it
    // resolves nothing through sibling services, and the token front door
    // reaches it through FriendlyRoundService, like scoring does.
    const playerStatsService = new PlayerStatsService(db);
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
    // Start-list policy resolution (Phase 5.5): reads the policy off the
    // round's draft and resolves the actor's roster membership — the ONE seam
    // every self-service gate (join, group creation, the round read's
    // affordance payload) evaluates through.
    const startListService = new StartListService(db, roundService);
    const friendlyRoundService = new FriendlyRoundService(
        db,
        roundService,
        scoreEventService,
        scorecardService,
        leaderboardService,
        startListService,
        playerStatsService,
        // Finish/reopen move `rounds.status` without moving the cursor; an open
        // SSE stream learns about them only through this hub.
        roundEventsHub,
    );
    const roundJoinService = new RoundJoinService(
        db,
        roundService,
        correctionService,
        playerService,
        startListService,
    );
    // Seat claim/rebind/release (Phase 5.5 Slice 3): binds identity to a
    // placeholder seat as a setup correction through the same composed-
    // correction recompile tail as join — the compiler captures the snapshot
    // chain; the start-list policy is the sole gate authority.
    const seatClaimService = new SeatClaimService(
        db,
        roundService,
        correctionService,
        playerService,
        guestPlayerService,
        startListService,
    );
    const roundLeaveService = new RoundLeaveService(db, roundService, correctionService);
    const roundEditService = new RoundEditService(
        db,
        roundService,
        correctionService,
        playerStatsService,
    );
    const guestClaimService = new GuestClaimService(db);
    // Friends on the course (docs/proposals/friends-activity.md): the feed AND
    // the one visibility rule the spectate path is gated on — both live here so
    // "who may see this round" has a single implementation.
    const friendsActivityService = new FriendsActivityService(db, friendService);
    // The friend detail page: the same mutual-edge gate, asked about a PLAYER
    // rather than a round. Its own service because the visibility rule is
    // different in a way the feed must never inherit — private rounds are
    // counted but never listed (see the class doc).
    const friendProfileService = new FriendProfileService(db, friendService, playerService);
    const spectateService = new SpectateService(
        db,
        friendsActivityService,
        roundService,
        leaderboardService,
    );
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
        teeService,
    );
    // The live aggregated competition board: loads rounds + roster + per-round
    // RoundResults and folds through the registered AggregationStrategy.
    const competitionLeaderboardService = new CompetitionLeaderboardService(
        db,
        competitionService,
        competitionRoundService,
        leaderboardService,
    );
    // Cut + finalize (Slice 4) evaluate the SAME fold inputs the live board
    // assembles (leaderboard.prepare) — cut windows them, finalize snapshots.
    const competitionCutService = new CompetitionCutService(
        db,
        competitionLeaderboardService,
        competitionRoundService,
    );
    const competitionFinalizeService = new CompetitionFinalizeService(
        db,
        competitionService,
        competitionLeaderboardService,
        competitionRoundService,
    );
    return {
        db,
        roundEventsHub,
        playerService,
        playerAvatarService,
        friendService,
        clubService,
        courseService,
        courseRouteTemplateService,
        teeService,
        guestPlayerService,
        handicapService,
        roleService,
        adminService,
        roundService,
        scoreEventService,
        scorecardService,
        playerStatsService,
        leaderboardService,
        correctionService,
        formatActionService,
        dashboardService,
        friendlyRoundService,
        startListService,
        roundJoinService,
        seatClaimService,
        roundLeaveService,
        roundEditService,
        guestClaimService,
        friendsActivityService,
        friendProfileService,
        spectateService,
        competitionService,
        competitionRoundService,
        competitionLeaderboardService,
        competitionCutService,
        competitionFinalizeService,
    };
}
