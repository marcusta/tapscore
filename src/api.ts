import { createPlayersClient } from './api/players.gen';
import { createFriendsClient } from './api/friends.gen';
import { createClubsClient } from './api/clubs.gen';
import { createCoursesClient } from './api/courses.gen';
import { createTeesClient } from './api/tees.gen';
import { createGuestPlayersClient } from './api/guest-players.gen';
import { createHandicapClient } from './api/handicap.gen';
import { createRoundsClient } from './api/rounds.gen';
import { createScoreEventsClient } from './api/score-events.gen';
import { createScorecardsClient } from './api/scorecards.gen';
import { createLeaderboardsClient } from './api/leaderboards.gen';
import { createFriendlyRoundsClient } from './api/friendly-rounds.gen';
import { createDashboardClient } from './api/dashboard.gen';
import { createSetupClient } from './api/setup.gen';
import { createCompetitionsClient } from './api/competitions.gen';
import { createAdminClient } from './api/admin.gen';
import { createPlayerStatsClient } from './api/player-stats.gen';
import { API_BASE } from './api-base';

export { ApiError } from '@basics/core/client/api-error';

export { API_BASE } from './api-base';

export const api = {
    players: createPlayersClient(API_BASE),
    friends: createFriendsClient(API_BASE),
    clubs: createClubsClient(API_BASE),
    courses: createCoursesClient(API_BASE),
    tees: createTeesClient(API_BASE),
    guestPlayers: createGuestPlayersClient(API_BASE),
    handicap: createHandicapClient(API_BASE),
    rounds: createRoundsClient(API_BASE),
    scoreEvents: createScoreEventsClient(API_BASE),
    scorecards: createScorecardsClient(API_BASE),
    leaderboards: createLeaderboardsClient(API_BASE),
    friendlyRounds: createFriendlyRoundsClient(API_BASE),
    dashboard: createDashboardClient(API_BASE),
    setup: createSetupClient(API_BASE),
    competitions: createCompetitionsClient(API_BASE),
    admin: createAdminClient(API_BASE),
    playerStats: createPlayerStatsClient(API_BASE),
};
