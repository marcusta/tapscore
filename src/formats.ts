// Client-side catalog of the server's registered formats. Legacy hardcoded
// mobile copy — replaced by the server `GET /formats` catalog in phase 2.6e
// (mobile repair + migration). Until then the mobile new-round flow reads it.

export interface FormatInfo {
    id: string;
    label: string;
    blurb: string;
    /** Slot needs a 2+ team grouping of producers. */
    needsTeams: boolean;
    /** Balls come from alt_shot_pair (foursomes) instead of own-ball. */
    pairBall: boolean;
}

export const FORMATS: FormatInfo[] = [
    { id: 'stroke_play_individual', label: 'Stroke play', blurb: 'Gross & net strokes, lowest wins', needsTeams: false, pairBall: false },
    { id: 'stableford_individual', label: 'Stableford', blurb: 'Points per hole, highest wins', needsTeams: false, pairBall: false },
    { id: 'match_play_individual', label: 'Match play', blurb: 'Hole-by-hole duel, 2 players', needsTeams: false, pairBall: false },
    { id: 'kopenhamnare_individual', label: 'Split sixes', blurb: '6 points per hole split across 3', needsTeams: false, pairBall: false },
    { id: 'umbrella_individual', label: 'Umbrella', blurb: 'Multi-criteria team points', needsTeams: true, pairBall: false },
    { id: 'stableford_better_ball', label: 'Better ball · Stableford', blurb: 'Best ball per team counts', needsTeams: true, pairBall: false },
    { id: 'match_play_better_ball', label: 'Better ball · Match play', blurb: 'Team duel, best ball counts', needsTeams: true, pairBall: false },
    { id: 'taliban_better_ball', label: 'Taliban', blurb: 'Better ball with bonus weighting', needsTeams: true, pairBall: false },
    { id: 'umbrella_4_ball', label: 'Umbrella · 4-ball', blurb: 'Team umbrella over four balls', needsTeams: true, pairBall: false },
    { id: 'stroke_play_foursomes', label: 'Foursomes', blurb: 'Alternate shot, one ball per pair', needsTeams: true, pairBall: true },
];

export function formatLabel(id: string): string {
    return FORMATS.find((f) => f.id === id)?.label ?? id;
}
