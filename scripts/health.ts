// sig-infra deploy DB validation entrypoint.
//
// Runs AFTER db:migrate against the same DB (DB_PATH=deploy-tmp/db.sqlite
// during deploy). Verifies the DB opens and every application table the
// server expects (server/db/schema.ts) is present. Exit 1 on any miss so
// the tooling aborts the deploy and rolls back.
//
// NOTE: only the app DB (app.sqlite) is validated here. sessions.sqlite
// and obs.sqlite are separate framework-owned DBs created at boot.
import { Database } from 'bun:sqlite';

const dbPath = process.env.DB_PATH || './data/app.sqlite';

// Keep in sync with the Database interface in server/db/schema.ts.
const REQUIRED_TABLES = [
    'players',
    'clubs',
    'courses',
    'course_holes',
    'course_route_templates',
    'tees',
    'tee_hole_lengths',
    'tee_ratings',
    'guest_players',
    'handicap_history',
    'role_grants',
    'rounds',
    'round_course_holes',
    'round_tee_holes',
    'round_play_holes',
    'round_play_tee_holes',
    'playing_groups',
    'playing_group_balls',
    'round_format_slots',
    'participants',
    'participant_players',
    'round_definitions',
    'round_ball_strategies',
    'balls',
    'ball_players',
    'slots',
    'slot_balls',
    'slot_ball_teams',
    'tee_times',
    'score_events',
    'scorecards',
    'setup_correction_events',
    'allowance_override_events',
    'ruling_events',
    'format_action_events',
    'friendly_rounds',
];

console.log(`Validating DB at ${dbPath}...`);

const db = new Database(dbPath);

try {
    // 1. DB opens and is queryable.
    db.query('SELECT 1').get();

    // 2. All required application tables exist.
    const rows = db
        .query("SELECT name FROM sqlite_master WHERE type = 'table'")
        .all() as Array<{ name: string }>;
    const present = new Set(rows.map((r) => r.name));

    const missing = REQUIRED_TABLES.filter((t) => !present.has(t));
    if (missing.length > 0) {
        console.error(`❌ Missing required tables: ${missing.join(', ')}`);
        db.close();
        process.exit(1);
    }

    console.log(`✅ DB healthy — all ${REQUIRED_TABLES.length} required tables present`);
    db.close();
    process.exit(0);
} catch (e) {
    console.error('❌ Health check failed:', e);
    db.close();
    process.exit(1);
}
