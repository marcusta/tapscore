// Phase 2.6b/1 — deterministic content-addressed ids for compiler outputs.
//
// Compiler outputs (`balls.id`, `slots.id`, `round_ball_strategies.id`) MUST
// regenerate identically on recompile so append-only events keep resolving
// after a setup correction. The recipe lives here, with a namespace prefix
// per id kind so the formula can be versioned later (`tapscore:ball:v2` …)
// without breaking already-persisted ids.
//
// SHA-256, truncated to 20 hex chars (80 bits). Plenty of collision margin
// for the row counts we deal with (a single round has O(10) balls / slots);
// length is a deliberate bump up from the 16-char ids the seed scripts
// happen to use — id aesthetics are not a constraint here.

import { createHash } from 'node:crypto';

const HASH_LENGTH = 20;

export type IdNamespace =
    | 'tapscore:ball:v1'
    | 'tapscore:slot:v1'
    | 'tapscore:round_ball_strategy:v1'
    | 'tapscore:round_play_hole:v1'
    | 'tapscore:playing_group:v1'
    // ADR-0004 — virtual side subjects. NEVER persisted (synthesized at
    // materialisation), but content-addressed on (slot_def_id, team label) so
    // the virtual subject's identity survives recompiles exactly like the
    // persisted ids do.
    | 'tapscore:virtual_side_ball:v1';

/**
 * Deterministic id for compiler outputs. Pure function of `(namespace,
 * ...parts)` — same inputs always produce the same id.
 *
 * Encoding is length-prefixed (`${utf8ByteLength}:${part}` per element) so
 * the recipe is injective: no choice of part contents can produce the same
 * payload as a different part split. Naive separator joining would collide
 * when a def-id legitimately contains the separator character; def-ids are
 * arbitrary strings (admin input), so that risk is real.
 *
 * Callers are responsible for ordering: producer-set members must be
 * pre-sorted by `sortProducerSet` so two strategy invocations with the same
 * producers in different orders collide on purpose.
 */
export function hashId(namespace: IdNamespace, ...parts: string[]): string {
    const encoder = new TextEncoder();
    const segments = [namespace, ...parts].map((p) => {
        const bytes = encoder.encode(p).length;
        return `${bytes}:${p}`;
    });
    return createHash('sha256').update(segments.join('')).digest('hex').slice(0, HASH_LENGTH);
}

export type ProducerRef = { kind: 'player' | 'guest'; id: string };

/**
 * Producer-set sort rule for the ball-id recipe.
 *
 * Lex sort on `${kind}:${id}` so a strategy instance produces the same ball
 * id regardless of the input ordering. Returns string keys (the form fed
 * directly into `hashId`), not the original objects, because the only
 * downstream consumer is the hash.
 */
export function sortProducerSet(refs: ProducerRef[]): string[] {
    return refs.map((r) => `${r.kind}:${r.id}`).sort();
}
