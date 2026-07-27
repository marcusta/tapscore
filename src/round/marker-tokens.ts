// Marker → visual tokens: the client half of the presentation vocabulary (N3).
//
// The server owns WHICH markers exist and what each abstract form MEANS
// (`MarkerTemplate` + its doc comments in
// `server/domain/strategies/result-vocabulary.ts`); this module owns what each
// one LOOKS LIKE on the web client. It is the single source for the marker
// half of the leaderboard CSS: the `.lb-mark--*` rules in
// `leaderboard.component.ts` are EMITTED from the table below, so adding or
// restyling a marker is one edit here — not a CSS rule plus a doc table plus a
// registry that must be kept in agreement.
//
// Same shape as `scoreGridRegistry` in `result-render.ts`: a closed, id-keyed
// client registry over a closed server vocabulary.
//
// Rules:
//   1. The table is EXHAUSTIVE over `MarkerTemplate`, which is derived from the
//      generated wire type — add a template server-side, run `bun run generate`,
//      and this file stops compiling until the new form has a visual.
//   2. Class names are DERIVED (`lb-mark--<template>`), never hand-written:
//      `result-render.ts` emits the same string from the marker's template, so
//      the two cannot drift.
//   3. Golf idiom stays out of here, exactly as on the server. `meaning`
//      describes the abstract form; the golf sentence rides in each marker's
//      own `label` (tooltip/aria), sent by the presenter.
//   4. `custom` markers (the greppable `marker.custom(id)` escape) have no
//      token: they render unstyled on purpose, so a one-off visual is visible
//      as unfinished rather than silently inheriting a shape.

import type { GridCell } from '../api/friendly-rounds.gen';

/** Every closed marker form the server can send (the `custom` escape aside). */
export type MarkerTemplate = Exclude<NonNullable<GridCell['marker']>['template'], 'custom'>;

/** Tones a marker may tint an OUTLINE form with (filled forms carry their own colour). */
type TintableTone = 'success' | 'warning' | 'danger';

export interface MarkerToken {
    /**
     * What the abstract form means — presentation-domain only, mirroring the
     * `MarkerTemplate` doc comments in the server vocabulary. Used as the
     * house reference when picking a form for a new marker.
     */
    meaning: string;
    /**
     * Fill colour of the shape; white number on top. Undefined = an outline
     * form that keeps `currentColor` (see `rule` / `tones`).
     */
    fill?: string;
    /** Square-cornered form (3px radius) instead of the base round pill. */
    boxy?: boolean;
    /** Extra declarations for the form's own rule, one CSS line each. */
    rule?: string[];
    /** Per-tone text tint, for outline forms only. */
    tones?: Partial<Record<TintableTone, string>>;
    /**
     * Border override when this form carries a TEAM fill (`.lb-mark-fill--a/b`)
     * — the deciding-ball case where the shape is filled in team colour.
     */
    teamFillBorder?: string;
    /** How the form reads on screen; the note a reviewer needs, not a repeat of the CSS. */
    visual: string;
}

/**
 * The marker token table. ORDER IS LOAD-BEARING: rules are emitted in this
 * order, so a later form's declarations win over an earlier one's (the
 * outline/tone rules come before the filled forms so their white number wins).
 */
export const MARKER_TOKENS: Record<MarkerTemplate, MarkerToken> = {
    ring: {
        meaning: 'a single-unit decided result',
        fill: '#d63b2f',
        visual: 'red filled circle — the Gamebook birdie mark (score to par −1)',
    },
    double_ring: {
        meaning: 'a two-unit decided result; more emphatic than a ring',
        fill: '#e0862c',
        // A team-filled double ring must stay distinguishable from the plain
        // standing pill, hence the doubled white border.
        teamFillBorder: 'border-width: 3px; border-style: double;',
        visual: 'orange filled circle (score to par −2); doubled white border when team-filled',
    },
    diamond: {
        meaning: 'a rare / high-magnitude decided result — the strongest form',
        fill: '#e0b41f',
        visual: 'yellow filled circle — hole-in-one / albatross territory',
    },
    dot: {
        meaning: 'a lightweight per-hole flag where a full ring would be too heavy',
        visual: 'the bare base shape (no fill, no border) — inherits cell colour',
    },
    badge: {
        meaning: 'a labelled status needing short text or a number, not just a shape',
        rule: [
            'width: auto; min-width: 1.8em;',
            'padding-left: 0.45em; padding-right: 0.45em;',
            'border: 2px solid currentColor;',
        ],
        tones: { success: '#267348', warning: '#946200', danger: '#9b332a' },
        visual: 'outline pill in the tone colour, text inside',
    },
    square: {
        meaning: 'a one-step negative score relation',
        fill: '#5b9bd5',
        boxy: true,
        visual: 'light-blue filled square (score to par +1)',
    },
    double_square: {
        meaning: 'a stronger negative score relation',
        fill: '#1f4e79',
        boxy: true,
        visual: 'dark-blue filled square (score to par +2)',
    },
    box_badge: {
        meaning: 'an angular labelled state that must not read as a round marker',
        fill: '#1f4e79',
        boxy: true,
        visual: 'dark-blue filled square carrying its value (+3 or worse)',
    },
};

/**
 * The CSS modifier class for a marker form — the ONLY place the `lb-mark--`
 * prefix is written. Both the emitted CSS below and `result-render.ts` call
 * this, so rule 2 (derived, never hand-written) holds by construction.
 *
 * The parameter is widened past `MarkerTemplate` because the renderer passes
 * the RAW contract template: `custom`, or a form this client predates, still
 * gets a derived class — it simply matches no rule, which is the intended
 * "visible as unfinished" outcome (rule 4).
 */
export function markerClass(template: MarkerTemplate | (string & {})): string {
    return `lb-mark--${template}`;
}

const entries = (): [MarkerTemplate, MarkerToken][] =>
    Object.entries(MARKER_TOKENS) as [MarkerTemplate, MarkerToken][];

/** Indent every line but the first to the depth of the `${…}` in the styles literal. */
function block(lines: string[]): string {
    return lines.join('\n            ');
}

/** One rule over several forms: a selector per line, the body on the last. */
function groupRule(ids: MarkerTemplate[], body: string): string[] {
    return ids.map((id, i) => `& .${markerClass(id)}${i === ids.length - 1 ? ` { ${body} }` : ','}`);
}

/**
 * The per-form marker rules, for the `.lb-mark` block in
 * `leaderboard.component.ts`. Emission order: outline forms (their own rule +
 * tone tints) first, then the filled forms — so the filled forms' white number
 * wins over a tone tint. The shared square-corner rule is emitted once whenever
 * any boxy form exists, in a fixed slot just before the first boxy fill group,
 * keeping every square declaration together.
 */
export function markerFormCss(): string {
    const lines: string[] = [];

    lines.push('/* Outline forms keep currentColor + tone tints. */');
    for (const [id, tok] of entries()) {
        if (!tok.rule && !tok.tones) continue;
        if (tok.rule) {
            lines.push(`& .${markerClass(id)} {`);
            for (const decl of tok.rule) lines.push(`    ${decl}`);
            lines.push('}');
        }
        for (const [tone, color] of Object.entries(tok.tones ?? {})) {
            lines.push(`& .${markerClass(id)}.lb-mark-tone--${tone} { color: ${color}; }`);
        }
    }

    lines.push('/* Filled forms — declared after the tone rules so white text wins. */');
    const boxy = entries().filter(([, t]) => t.boxy).map(([id]) => id);

    // Fills are grouped by colour: two forms sharing a colour share one rule.
    const fillGroups: { fill: string; ids: MarkerTemplate[] }[] = [];
    const seen = new Set<MarkerTemplate>();
    for (const [id, tok] of entries()) {
        if (tok.fill === undefined || seen.has(id)) continue;
        const ids = entries().filter(([, t]) => t.fill === tok.fill).map(([gid]) => gid);
        for (const gid of ids) seen.add(gid);
        fillGroups.push({ fill: tok.fill, ids });
    }

    // The shared square-corner rule is keyed off the boxy forms EXISTING, not
    // off some fill group happening to contain one — an all-outline boxy set
    // would otherwise silently lose its corners. Its slot is fixed: just before
    // the first boxy fill group, keeping every square declaration together, and
    // after the last fill when no boxy form is filled at all.
    let boxyAt = -1;
    if (boxy.length > 0) {
        const firstBoxyFill = fillGroups.findIndex((g) => g.ids.some((id) => MARKER_TOKENS[id].boxy));
        boxyAt = firstBoxyFill === -1 ? fillGroups.length : firstBoxyFill;
    }

    fillGroups.forEach((g, i) => {
        if (i === boxyAt) lines.push(...groupRule(boxy, 'border-radius: 3px;'));
        lines.push(...groupRule(g.ids, `background: ${g.fill}; color: #fff;`));
    });
    if (boxyAt === fillGroups.length) lines.push(...groupRule(boxy, 'border-radius: 3px;'));

    return block(lines);
}

/**
 * Per-form overrides for a marker whose shape carries a TEAM fill (the deciding
 * ball on a match card). Emitted after the shared `.lb-mark-fill--*` border.
 */
export function markerTeamFillCss(): string {
    const lines: string[] = [];
    for (const [id, tok] of entries()) {
        if (!tok.teamFillBorder) continue;
        const cls = markerClass(id);
        lines.push(
            `& .${cls}.lb-mark-fill--a,`,
            `& .${cls}.lb-mark-fill--b { ${tok.teamFillBorder} }`,
        );
    }
    return block(lines);
}
