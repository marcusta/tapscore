// One-off ops tool — backfill `round_setup_drafts` v1 for a round created
// BEFORE the draft-persisting create path landed (migration 034 / Phase 3.5).
//
// Draft v1 is written only inside the create transaction ("editable from birth
// or not at all"), so an older round reports `no_stored_draft` and the wizard
// refuses to edit it. This tool reconstructs an equivalent draft from the
// round's latest compiled `round_definitions` row and — only after proving the
// reconstruction recompiles to the SAME content-addressed balls, ball players
// and play-hole occurrences the round already has — inserts it as version 1.
//
// The proof matters: an edit rebuilds the definition from the stored draft, and
// any drift in ball ids would orphan the append-only score events (which key on
// (ball_id, play_hole_id)). A reconstruction that does not reproduce the
// current compile is refused, never written.
//
// Usage:
//   bun scripts/backfill-setup-draft.ts <roundId>            # verify only
//   bun scripts/backfill-setup-draft.ts <roundId> --apply    # verify + insert
//   DB_PATH=/path/to/app.sqlite bun scripts/backfill-setup-draft.ts ...

import * as fs from 'node:fs';
import { createDb } from '@basics/core/server/db';
import type { Database } from '../server/db/schema';
import { createServices } from '../server/services/index';
import { buildRoundDefinition } from '../server/domain/round-setup/builder';
import type { RoundSetupDraft } from '../server/domain/round-setup/draft';
import { registerBuiltInBallCreationStrategies } from '../server/domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../server/domain/formats';
import { registerBuiltInAggregationStrategies } from '../server/domain/aggregation';

registerBuiltInBallCreationStrategies();
registerBuiltInFormats();
registerBuiltInAggregationStrategies();

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const roundId = args.find((a) => !a.startsWith('--'));
if (!roundId) {
    console.error('usage: bun scripts/backfill-setup-draft.ts <roundId> [--apply]');
    process.exit(1);
}

const dbPath = process.env.DB_PATH ?? './data/app.sqlite';
if (!fs.existsSync(dbPath)) {
    console.error(`no database at ${dbPath}`);
    process.exit(1);
}

// No migrations here on purpose — this runs against an already-migrated DB.
const db = createDb<Database>(dbPath);
const svc = createServices(db);

try {
    const existing = await db
        .selectFrom('round_setup_drafts')
        .select('version')
        .where('round_id', '=', roundId)
        .executeTakeFirst();
    if (existing) {
        console.error(`round ${roundId} already has a draft chain (v${existing.version}) — nothing to do`);
        process.exit(1);
    }

    const defRow = await db
        .selectFrom('round_definitions')
        .select(['version', 'definition_json'])
        .where('round_id', '=', roundId)
        .where('superseded_by_version', 'is', null)
        .orderBy('version', 'desc')
        .executeTakeFirst();
    if (!defRow) {
        console.error(`round ${roundId} has no live compiled definition`);
        process.exit(1);
    }

    const def = JSON.parse(defRow.definition_json) as ResolvedDefinition;
    const draft = draftFromDefinition(def);

    // --- Prove the reconstruction ------------------------------------------
    const built = buildRoundDefinition(draft);
    if (!built.ok) {
        console.error('reconstructed draft does not build:', built.diagnostics);
        process.exit(1);
    }
    const compiled = await svc.roundService.compileDefinition(roundId, built.definition);
    if (!compiled.ok) {
        console.error('reconstructed draft does not compile:', compiled.diagnostics);
        process.exit(1);
    }

    const storedBalls = await ids(db, 'balls', roundId);
    const storedHoles = await ids(db, 'round_play_holes', roundId);
    const storedBallPlayers = await db
        .selectFrom('ball_players as bp')
        .innerJoin('balls as b', 'b.id', 'bp.ball_id')
        .where('b.round_id', '=', roundId)
        .select(['bp.ball_id', 'bp.producer_def_id'])
        .execute();

    const problems: string[] = [];
    diff('balls', storedBalls, compiled.compiled.balls.map((b) => b.id), problems);
    diff('play holes', storedHoles, compiled.compiled.playHoles.map((p) => p.id), problems);
    diff(
        'ball players',
        new Set(storedBallPlayers.map((r) => `${r.ball_id}|${r.producer_def_id}`)),
        compiled.compiled.ballPlayers.map((bp) => `${bp.ballId}|${bp.producerDefId}`),
        problems,
    );

    if (problems.length > 0) {
        console.error('REFUSED — the reconstructed draft does not reproduce the current compile:');
        for (const p of problems) console.error(`  ${p}`);
        process.exit(1);
    }

    const scores = await db
        .selectFrom('score_events')
        .select(({ fn }) => fn.countAll<number>().as('n'))
        .where('round_id', '=', roundId)
        .executeTakeFirst();
    console.log(
        `OK — reconstruction reproduces ${storedBalls.size} balls, ${storedHoles.size} play holes, ` +
            `${storedBallPlayers.length} ball players (round has ${scores?.n ?? 0} score events)`,
    );

    if (!apply) {
        console.log('\ndry run — re-run with --apply to insert draft v1\n');
        console.log(JSON.stringify(draft, null, 2));
    } else {
        await db
            .insertInto('round_setup_drafts')
            .values({
                round_id: roundId,
                version: 1,
                draft_json: JSON.stringify(draft),
                source_kind: 'initial',
                source_event_id: null,
            })
            .execute();
        console.log('inserted round_setup_drafts v1 — the round is now wizard-editable');
    }
} finally {
    await db.destroy();
}

// --- Reconstruction ---------------------------------------------------------

/** The stored `resolved-v1` definition, as far as this tool reads it. */
interface ResolvedDefinition {
    courseId: string;
    playedAt: string;
    roundType?: 'full_18' | 'front_9' | 'back_9' | 'custom_holes';
    venueType?: 'outdoor' | 'indoor';
    routeSi?: unknown;
    routeHandicapPolicy?: unknown;
    routeSections?: unknown[];
    playHoles?: unknown[];
    playingGroups?: unknown[];
    producers: {
        id: string;
        playerRef?: { kind: 'player' | 'guest'; id: string };
        handicapIndex?: number;
        gender?: 'M' | 'F';
        teeId?: string;
        category?: string;
    }[];
    slots: {
        formatId: string;
        allowanceConfig?: unknown;
        formatConfig?: unknown;
        ballSelector?: { producerDefIds?: string[] };
    }[];
}

/**
 * Definition → draft. The route rides in `route` in its already-frozen form
 * (including `playingGroups`, which the builder passes straight through), so
 * the builder sees exactly the fields the original create froze. Only rounds
 * whose producers are all identity-bound and whose slots are plain own-ball
 * selections reconstruct faithfully; anything richer (teams, subjects,
 * ballsFrom, placeholder seats) is rejected rather than guessed at.
 */
function draftFromDefinition(def: ResolvedDefinition): RoundSetupDraft {
    const producers = def.producers.map((p) => {
        if (!p.playerRef || p.handicapIndex === undefined || !p.teeId) {
            throw new Error(`producer ${p.id} is not a plain identity producer — reconstruct by hand`);
        }
        return {
            producerDefId: p.id,
            playerRef: p.playerRef,
            handicapIndex: p.handicapIndex,
            ...(p.gender !== undefined ? { gender: p.gender } : {}),
            teeId: p.teeId,
            ...(p.category !== undefined ? { category: p.category } : {}),
        };
    });

    const allProducerIds = producers.map((p) => p.producerDefId);
    const formats = def.slots.map((s) => {
        const subset = s.ballSelector?.producerDefIds ?? [];
        const isWholeRoster =
            subset.length === allProducerIds.length &&
            allProducerIds.every((id) => subset.includes(id));
        return {
            formatId: s.formatId,
            ...(s.allowanceConfig !== undefined ? { allowanceConfig: s.allowanceConfig } : {}),
            ...(s.formatConfig !== undefined ? { formatConfig: s.formatConfig } : {}),
            ...(isWholeRoster ? {} : { producerDefIds: subset }),
        };
    });

    const route = {
        ...(def.playHoles !== undefined ? { playHoles: def.playHoles } : {}),
        ...(def.routeSi !== undefined ? { routeSi: def.routeSi } : {}),
        ...(def.routeHandicapPolicy !== undefined
            ? { routeHandicapPolicy: def.routeHandicapPolicy }
            : {}),
        ...(def.routeSections !== undefined ? { routeSections: def.routeSections } : {}),
        ...(def.playingGroups !== undefined ? { playingGroups: def.playingGroups } : {}),
    };

    return {
        courseId: def.courseId,
        playedAt: def.playedAt,
        ...(def.roundType !== undefined ? { roundType: def.roundType } : {}),
        ...(def.venueType !== undefined ? { venueType: def.venueType } : {}),
        ...(Object.keys(route).length > 0 ? { route } : {}),
        producers,
        formats,
    } as RoundSetupDraft;
}

// --- Comparison helpers ------------------------------------------------------

async function ids(
    database: typeof db,
    table: 'balls' | 'round_play_holes',
    round: string,
): Promise<Set<string>> {
    const rows = await database
        .selectFrom(table)
        .select('id')
        .where('round_id', '=', round)
        .execute();
    return new Set(rows.map((r) => r.id));
}

function diff(label: string, stored: Set<string>, rebuilt: string[], out: string[]): void {
    const next = new Set(rebuilt);
    const missing = [...stored].filter((id) => !next.has(id));
    const added = [...next].filter((id) => !stored.has(id));
    if (missing.length) out.push(`${label}: ${missing.length} would be ORPHANED — ${missing.slice(0, 3).join(', ')}`);
    if (added.length) out.push(`${label}: ${added.length} unexpected new — ${added.slice(0, 3).join(', ')}`);
}
