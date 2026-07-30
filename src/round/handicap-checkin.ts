import type { RoundBall } from '../api/friendly-rounds.gen';

// Handicap check-in — pure derivation of WHETHER to ask "is this still your
// handicap?" on the way into a round.
//
// The problem it solves: an index is entered once, at sign-up, and then rots.
// Nobody visits their profile to maintain it, so a round played months later
// silently computes strokes off a stale number — and unlike a mis-typed score,
// nothing in the round ever looks wrong. The only reliable moment to ask is
// the one where the player is holding their phone and about to play.
//
// The gate is deliberately narrow, because the failure mode of a prompt like
// this is being trained away:
//
//   - the viewer is logged in and PLAYS in this round (a spectator opening a
//     share link has no handicap in it — asking them is noise);
//   - this is the first time this round has been opened on this device, so the
//     ask happens on the way IN, once per round, never mid-play;
//   - the last confirmation is older than a day (see below), or there has
//     never been one.
//
// The server stores only the timestamp (`players.handicap_confirmed_at`) and
// the staleness rule lives here, in one place, so "how often do we ask" stays
// a product decision the client owns rather than something baked into an
// endpoint.

/**
 * How long a confirmation stays good. A day, which sounds aggressive but is
 * not: the check-in fires at most once per round, so a morning and afternoon
 * round on the same day ask once, and a player who confirms before teeing off
 * is not asked again on that round no matter how long it takes to play.
 */
export const HANDICAP_CHECKIN_STALE_MS = 24 * 60 * 60 * 1000;

/**
 * True when the player's handicap confirmation is old enough to ask again.
 *
 * `null` (never confirmed) is stale — that is every account created before the
 * feature existed, and they are exactly the ones worth asking. An unparseable
 * or future-dated timestamp is also treated as stale: erring toward one extra
 * question is cheaper than erring toward a whole season of wrong strokes.
 */
export function isHandicapConfirmationStale(confirmedAt: string | null, now: number): boolean {
    if (confirmedAt === null) return true;
    const at = new Date(confirmedAt).getTime();
    if (!Number.isFinite(at)) return true;
    // A timestamp further ahead than the window itself is a broken clock, not
    // a fresh answer — left alone it would suppress the check-in forever. The
    // window's worth of tolerance keeps ordinary client/server skew (seconds)
    // from re-staling a confirmation the moment it is made.
    if (at - now > HANDICAP_CHECKIN_STALE_MS) return true;
    return now - at >= HANDICAP_CHECKIN_STALE_MS;
}

/**
 * True when `playerId` is a producer on any ball in this round — the same
 * "already plays here" test the join card uses, read the other way round.
 * A guest seat this viewer has claimed counts: the claim resolved the seat to
 * their player id, and their index is what it plays off.
 */
export function playsInRound(balls: readonly RoundBall[], playerId: string | null): boolean {
    if (!playerId) return false;
    for (const ball of balls) {
        for (const p of ball.players) {
            if (p.playerId === playerId) return true;
        }
    }
    return false;
}

export interface HandicapCheckinState {
    /** Whether the check-in bar should render at all. */
    visible: boolean;
    /** The index to show back to the player; null when they have none set. */
    index: number | null;
}

export interface HandicapCheckinInput {
    /** The logged-in viewer, or null when logged out. */
    playerId: string | null;
    balls: readonly RoundBall[];
    /**
     * First open of THIS round on THIS device. Captured before the round is
     * marked seen, and held for the whole visit — so a self-join mid-visit can
     * still surface the check-in, and a refetch cannot retract it.
     */
    firstOpen: boolean;
    /** `players.handicapConfirmedAt`; null = never confirmed. */
    handicapConfirmedAt: string | null;
    /** The viewer's live index, or null when they have none. */
    handicapIndex: number | null;
    /** False until the profile read lands — never ask on unknown data. */
    profileLoaded: boolean;
    /** Answered or dismissed during this visit. */
    settled: boolean;
    now: number;
}

/**
 * The check-in's whole decision, in one pure function so the round view can
 * render it and a test can pin it without a DOM.
 */
export function handicapCheckinState(input: HandicapCheckinInput): HandicapCheckinState {
    const hidden: HandicapCheckinState = { visible: false, index: null };
    if (input.settled) return hidden;
    if (!input.profileLoaded) return hidden;
    if (!input.firstOpen) return hidden;
    if (!playsInRound(input.balls, input.playerId)) return hidden;
    if (!isHandicapConfirmationStale(input.handicapConfirmedAt, input.now)) return hidden;
    return { visible: true, index: input.handicapIndex };
}
