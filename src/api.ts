import { createPlayersClient } from './api/players.gen';
import { createClubsClient } from './api/clubs.gen';
import { createCoursesClient } from './api/courses.gen';
import { createTeesClient } from './api/tees.gen';
import { createGuestPlayersClient } from './api/guest-players.gen';
import { createHandicapClient } from './api/handicap.gen';

export { ApiError } from '@basics/core/client/api-error';

export const api = {
    players: createPlayersClient('/api'),
    clubs: createClubsClient('/api'),
    courses: createCoursesClient('/api'),
    tees: createTeesClient('/api'),
    guestPlayers: createGuestPlayersClient('/api'),
    handicap: createHandicapClient('/api'),
};
