import Foundation

/// What each capture prompt actually means, in the golfer's own words.
///
/// Owner ruling (2026-08-02): the cards stay wordless — no explainer sentence
/// sits under a control. The explanation lives behind ONE worded trigger
/// ("What these mean") that opens one sheet with one card per currently visible
/// prompt. A per-prompt ⓘ would be eleven glyphs on a card whose whole job is to
/// be quiet.
///
/// Twin of `src/round/stat-explainers.ts`: same keys, same strings, zero
/// imports either side. If the two disagree, one of them is wrong.
enum StatExplainers {
    static let table: [StatEventKey: String] = [
        .teeResult: """
            Fairway means the ball finished on the short grass. In play is \
            anywhere you can still play a normal shot. Trouble is anywhere you \
            have to recover from: deep rough, trees, sand, a lost ball.
            """,
        .teeMissDir: """
            Which side the ball finished, looking down the hole from the tee. \
            Only asked when the drive left the fairway. Over a few rounds this \
            is what separates a one-way miss from a two-way one.
            """,
        .recoveryOk: """
            Did the very next shot get you back to a normal position: fairway, \
            green, or a clear approach? Say yes even if the hole still ended \
            badly. This is about the recovery shot, not the score.
            """,
        .gir: """
            Hit means the ball was on the putting surface with at least two \
            shots left for par: the first shot on a par 3, the second on a par \
            4, the third on a par 5. The fringe is a miss.
            """,
        .greenMissDir: """
            Which way you missed, seen from where you played the approach. Long \
            is past the flag, short is in front of it. Left and right are \
            exactly that.
            """,
        .shortGameDifficulty: """
            Standard is a clean lie with green to work with. Hard is anything \
            that takes the shot away from you: long grass, short-sided, \
            downhill, an awkward stance. Bunker is sand, whatever the lie.
            """,
        .shortGameStrokes: """
            How many shots it took to get from off the green onto it. One is \
            the normal answer and is already filled in — only change it if you \
            needed more.
            """,
        .firstPutt: """
            How far the first putt was, in metres. If you holed out from off \
            the green there was no first putt, so leave this alone and set \
            putts to 0.
            """,
        .putts: """
            Putts taken on the green, counting the one that went in. 0 means \
            you were never on the green with a putter.
            """,
        .penalties: """
            Penalty strokes added on this hole: out of bounds, a lost ball, an \
            unplayable lie, water. Count strokes, not incidents.
            """,
        .penaltySource: """
            Which shot cost you the stroke. If a hole cost you more than one, \
            pick the shot that did the most damage.
            """,
    ]

    /// Total over the vocabulary by construction — every key has a sentence, and
    /// the empty string is not one of them (a test asserts it).
    static func explainer(_ key: StatEventKey) -> String { table[key] ?? "" }
}
