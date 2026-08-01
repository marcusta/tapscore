// Handicap derivation presentation — the structured "how did we get this
// number" chain the scoring view's ⓘ popup renders.
//
// Closed vocabulary, same philosophy as `strategies/result-sections.ts`: the
// server sends numbers and machine kinds, never prose. The client owns the
// explanatory sentences (tone, localisation) keyed on `kind`.
//
// One `HandicapDerivation` rides on each `RoundBallSlot` in the round read
// model. It is setup-derived — every input is a compile-time snapshot
// (`ball_players.*_snapshot`, `balls.per_producer_ch`,
// `slots.allowance_config`, `slot_balls.playing_handicap_snapshot`) — so it
// belongs on the round payload, not the result payload, and never changes
// while scores come in.

/** One step in the CH → effective-PH chain, in derivation order. */
export type DerivationStep =
    /**
     * WHS course handicap for ONE producer:
     * `round(HI × slope/113 + (CR − par))`. One step per producer — a team
     * ball gets one per member. Formula inputs (and the tee the rating row
     * came from) are null when the seat's snapshot pre-dates them; `result`
     * (the CH) is always present.
     */
    | {
          kind: 'course_handicap';
          producerLabel: string;
          /** The tee whose rating produced this CH ("Gul") — names the
           *  "these tees" the popup's sentence refers to. */
          teeName: string | null;
          handicapIndex: number | null;
          slope: number | null;
          courseRating: number | null;
          par: number | null;
          result: number;
      }
    /**
     * Team-ball combination (ADR-0003): `ball_CH = round(Σ memberCH × pct)`.
     * Only on balls with 2+ producers and a `per_producer_pct` derivation.
     */
    | {
          kind: 'team_combination';
          parts: { producerLabel: string; ch: number; pct: number }[];
          result: number;
      }
    /**
     * Slot allowance: `PH = round(ballCH × pct/100)`. `source` says where the
     * pct came from — a flat slot pct or the ball's CH band in a split table.
     */
    | { kind: 'allowance'; pct: number; source: 'flat' | 'split'; result: number }
    /**
     * Match-flavoured PH normalisation (`normalizeMatchPlayPHs`): within the
     * normalisation group the lowest PH plays off 0 and everyone else the
     * difference. Emitted by the format strategy so it can never drift from
     * the PH its `score()` actually uses.
     */
    | { kind: 'match_delta'; lowestPh: number; ownPh: number; result: number };

export interface HandicapDerivation {
    /**
     * What the ball actually plays off in this slot — post-allowance AND
     * post-format-transform. THE number the scoring view shows, and the PH
     * the client stroke-hint allocator must be fed.
     */
    effectivePh: number;
    steps: DerivationStep[];
}

// --- Strategy hook I/O (see FormatStrategy.presentEffectivePhs) -------------

export interface EffectivePhInput {
    /**
     * The slot's balls in the SUPPLIED ORDER (compiler ball-order contract,
     * `slot_balls.rowid`) — match-play-individual pairs consecutive balls off
     * exactly this order.
     */
    slotBalls: { ballId: string; playingHandicapSnapshot: number }[];
    slotTeamGroupings?: { teamLabel: string; ballIds: string[] }[];
}

export interface EffectivePhBall {
    ballId: string;
    effectivePh: number;
    /** Present iff a transform changed the PH's meaning (today: match_delta). */
    step?: DerivationStep;
}
