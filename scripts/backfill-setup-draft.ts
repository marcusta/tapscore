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
const replace = args.includes('--replace');
const routeFrom = flagValue('--route-from');
const checkDraft = flagValue('--check-draft');
const roundId = args.find((a) => !a.startsWith('--') && a !== routeFrom && a !== checkDraft);
if (!roundId) {
    console.error(
        'usage: bun scripts/backfill-setup-draft.ts <roundId> [--route-from <payload.json>]\n' +
            '                                                  [--replace] [--apply]\n' +
            '       bun scripts/backfill-setup-draft.ts <roundId> --check-draft <payload.json>',
    );
    process.exit(1);
}

function flagValue(flag: string): string | undefined {
    const i = args.indexOf(flag);
    return i === -1 ? undefined : args[i + 1];
}

/** A captured client payload: either `{token, draft}` or a bare draft. */
function readPayloadDraft(file: string): RoundSetupDraft {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8')) as
        | { draft?: RoundSetupDraft }
        | RoundSetupDraft;
    const draft = 'draft' in parsed && parsed.draft ? parsed.draft : (parsed as RoundSetupDraft);
    if (!draft.courseId || !Array.isArray(draft.producers)) {
        throw new Error(`${file} is not a RoundSetupDraft (nor a {token, draft} payload)`);
    }
    return draft;
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
    const chain = await db
        .selectFrom('round_setup_drafts')
        .select(['version', 'source_kind'])
        .where('round_id', '=', roundId)
        .orderBy('version', 'desc')
        .execute();
    if (chain.length > 0 && !checkDraft && !replace) {
        console.error(`round ${roundId} already has a draft chain (v${chain[0]!.version}) — nothing to do`);
        process.exit(1);
    }
    // --replace rewrites a SYNTHETIC v1 (this tool's own backfill) in place.
    // A chain with real history is audit trail; never rewrite it.
    if (replace && (chain.length !== 1 || chain[0]!.source_kind !== 'initial')) {
        console.error(
            `round ${roundId} has ${chain.length} draft version(s) — --replace only rewrites a lone synthetic v1`,
        );
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

    // Three modes, one verification path:
    //   --check-draft  pre-flight an arbitrary submitted draft (nothing is written);
    //   --route-from   backfill, but take `route` verbatim from a captured wizard
    //                  payload so a later wizard edit compares EQUAL under
    //                  `sameCourseAndRoute` (which diffs the whole route document,
    //                  so an expanded route from the definition would read as a
    //                  route change and trip the scored-round lock);
    //   default        backfill from the definition.
    const draft = checkDraft
        ? readPayloadDraft(checkDraft)
        : draftFromDefinition(
              def,
              // Wrapped, not passed bare: a preset-route payload has NO `route`
              // key at all, and that absence is itself the shape to copy.
              routeFrom ? { route: readPayloadDraft(routeFrom).route } : undefined,
          );

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
        console.error('REFUSED — this draft does not preserve the round\'s scored subjects:');
        for (const p of problems) console.error(`  ${p}`);
        process.exit(1);
    }

    const scores = await db
        .selectFrom('score_events')
        .select(({ fn }) => fn.countAll<number>().as('n'))
        .where('round_id', '=', roundId)
        .executeTakeFirst();
    console.log(
        `OK — every existing subject survives: ${storedBalls.size} balls, ${storedHoles.size} play holes, ` +
            `${storedBallPlayers.length} ball players (round has ${scores?.n ?? 0} score events)`,
    );

    // Balls the draft ADDS are fine (a new format scores retroactively from the
    // existing event log) but worth naming, and so are the route fields that
    // ride along outside the id checks.
    const newBalls = compiled.compiled.balls.filter((b) => !storedBalls.has(b.id));
    if (newBalls.length > 0) console.log(`  + ${newBalls.length} new ball(s) this draft would create`);
    for (const w of routeWarnings(def, compiled.compiled.definitionJson)) console.log(`  ! ${w}`);

    if (checkDraft) {
        // Pre-flight only. The route lock is a DRAFT-level comparison the edit
        // service makes against the stored draft, so also say whether this
        // submission would even get past it.
        const stored = chain.length
            ? ((await db
                  .selectFrom('round_setup_drafts')
                  .select('draft_json')
                  .where('round_id', '=', roundId)
                  .orderBy('version', 'desc')
                  .executeTakeFirst())!.draft_json as string)
            : null;
        if (stored && (scores?.n ?? 0) > 0) {
            const same = sameCourseAndRoute(JSON.parse(stored) as RoundSetupDraft, draft);
            console.log(
                same
                    ? '  route lock: PASSES — course/route match the stored draft'
                    : "  route lock: WOULD REFUSE — this draft's course/route differ from the stored draft",
            );
        }
    } else if (!apply) {
        console.log(`\ndry run — re-run with --apply to ${replace ? 'rewrite' : 'insert'} draft v1\n`);
        console.log(JSON.stringify(draft, null, 2));
    } else {
        await db.transaction().execute(async (trx) => {
            if (replace) {
                await trx.deleteFrom('round_setup_drafts').where('round_id', '=', roundId).execute();
            }
            await trx
                .insertInto('round_setup_drafts')
                .values({
                    round_id: roundId,
                    version: 1,
                    draft_json: JSON.stringify(draft),
                    source_kind: 'initial',
                    source_event_id: null,
                })
                .execute();
        });
        console.log(
            `${replace ? 'rewrote' : 'inserted'} round_setup_drafts v1 — the round is now wizard-editable`,
        );
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
function draftFromDefinition(
    def: ResolvedDefinition,
    routeOverride?: { route: RoundSetupDraft['route'] },
): RoundSetupDraft {
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

    const route = routeOverride ? (routeOverride.route ?? {}) : {
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

/**
 * Route fields the id checks do NOT protect: section labels, the SI mode and
 * the start list. Both sides here are RESOLVED definitions — the stored one and
 * the compiler's own output for the candidate draft — because the compiler
 * re-normalizes, so a draft that omits a field it can regenerate loses nothing.
 * Comparing a draft-shaped rebuild against a resolved definition would report
 * every default as a loss.
 */
function routeWarnings(stored: ResolvedDefinition, compiledDefinitionJson: string): string[] {
    const next = JSON.parse(compiledDefinitionJson) as ResolvedDefinition;
    const out: string[] = [];
    const had = (v: unknown[] | undefined) => (v?.length ?? 0) > 0;
    if (had(stored.routeSections) && !had(next.routeSections)) {
        out.push(`route sections would be dropped (${stored.routeSections!.length} stored)`);
    }
    if (had(stored.playingGroups) && !had(next.playingGroups)) {
        out.push(`playing groups would be dropped (${stored.playingGroups!.length} stored)`);
    } else if (
        JSON.stringify(sortKeys(stored.playingGroups)) !== JSON.stringify(sortKeys(next.playingGroups))
    ) {
        out.push('playing groups would be rebuilt (membership, start times or start holes differ)');
    }
    if (JSON.stringify(sortKeys(stored.routeSi)) !== JSON.stringify(sortKeys(next.routeSi))) {
        out.push(`routeSi would change: ${JSON.stringify(stored.routeSi)} → ${JSON.stringify(next.routeSi)}`);
    }
    return out;
}

/**
 * Mirror of `RoundEditService`'s private `sameCourseAndRoute` — the draft-level
 * comparison that decides the scored-round course/route lock. Duplicated (not
 * imported) because it is private to the service; keep the two in step.
 */
function sameCourseAndRoute(a: RoundSetupDraft, b: RoundSetupDraft): boolean {
    const pick = (d: RoundSetupDraft) => ({
        courseId: d.courseId,
        roundType: d.roundType ?? 'full_18',
        route: d.route ?? null,
    });
    return JSON.stringify(sortKeys(pick(a))) === JSON.stringify(sortKeys(pick(b)));
}

function sortKeys(v: unknown): unknown {
    if (Array.isArray(v)) return v.map(sortKeys);
    if (v !== null && typeof v === 'object') {
        const out: Record<string, unknown> = {};
        for (const k of Object.keys(v as Record<string, unknown>).sort()) {
            const val = (v as Record<string, unknown>)[k];
            if (val !== undefined) out[k] = sortKeys(val);
        }
        return out;
    }
    return v;
}

function diff(label: string, stored: Set<string>, rebuilt: string[], out: string[]): void {
    const next = new Set(rebuilt);
    const missing = [...stored].filter((id) => !next.has(id));
    const added = [...next].filter((id) => !stored.has(id));
    if (missing.length) out.push(`${label}: ${missing.length} would be ORPHANED — ${missing.slice(0, 3).join(', ')}`);
    if (added.length) out.push(`${label}: ${added.length} unexpected new — ${added.slice(0, 3).join(', ')}`);
}
