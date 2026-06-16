import { createPlayersClient } from './api/players.gen';
import { createClubsClient } from './api/clubs.gen';
import { createCoursesClient } from './api/courses.gen';
import { createTeesClient } from './api/tees.gen';
import { createGuestPlayersClient } from './api/guest-players.gen';
import { createHandicapClient } from './api/handicap.gen';
import { createRoundsClient } from './api/rounds.gen';
import { createParticipantsClient } from './api/participants.gen';
import { createScoreEventsClient } from './api/score-events.gen';
import { createScorecardsClient } from './api/scorecards.gen';
import { createLeaderboardsClient } from './api/leaderboards.gen';
import { createFriendlyRoundsClient } from './api/friendly-rounds.gen';

export { ApiError } from '@basics/core/client/api-error';

export const api = {
    players: createPlayersClient('/api'),
    clubs: createClubsClient('/api'),
    courses: createCoursesClient('/api'),
    tees: createTeesClient('/api'),
    guestPlayers: createGuestPlayersClient('/api'),
    handicap: createHandicapClient('/api'),
    rounds: createRoundsClient('/api'),
    participants: createParticipantsClient('/api'),
    scoreEvents: createScoreEventsClient('/api'),
    scorecards: createScorecardsClient('/api'),
    leaderboards: createLeaderboardsClient('/api'),
    friendlyRounds: createFriendlyRoundsClient('/api'),
};
