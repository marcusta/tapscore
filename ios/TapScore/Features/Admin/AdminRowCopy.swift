import Foundation

/// The operator screen's row strings, ported verbatim from
/// `src/admin/admin.component.ts` (`STATUS_LABEL`, `roundMeta`, `playerMeta`).
///
/// Pure and separate from the view for one reason: these lines are the whole
/// information content of the admin lists, and the web and native operator
/// screens disagreeing about what a round row says is the kind of drift nobody
/// notices until they are comparing two screens over a support call. Tests pin
/// the strings; the view only lays them out.
enum AdminRowCopy {
    // MARK: - Rounds

    /// Web: `STATUS_LABEL`. Note this is the ADMIN vocabulary ("Playing",
    /// "Done"), not the landing's (`StatusChip` → "Live", "Finished") — the
    /// same difference the web has between `admin.component.ts` and
    /// `landing.component.ts`.
    static func statusLabel(_ status: AdminRoundSummaryStatus) -> String {
        switch status {
        case .notStarted: "Not started"
        case .active: "Playing"
        case .complete: "Done"
        }
    }

    /// Web: `.admin-row__title` — `r.courseName ?? 'Unknown course'`.
    static func courseTitle(_ round: AdminRoundSummary) -> String {
        round.courseName ?? "Unknown course"
    }

    /// Web: the `who` binding — "by Marcus — Ada, Bo".
    ///
    /// An EMPTY creator name reads as absent, because the web line is
    /// `r.creatorName ? … : 'by a guest'` and `''` is falsy in JS. Swift's
    /// `String?` draws the line one notch further out — `Optional("")` is a
    /// value — so without this the two clients would render the same row as
    /// "by a guest" and "by " respectively.
    static func who(_ round: AdminRoundSummary) -> String {
        let creator = round.creatorName.flatMap { $0.isEmpty ? nil : $0 }
        let by = creator.map { "by \($0)" } ?? "by a guest"
        let names = round.participants.joined(separator: ", ")
        return names.isEmpty ? by : "\(by) — \(names)"
    }

    /// Web: the `meta` binding — `${r.date} · ${roundMeta(r)}`.
    static func roundMeta(_ round: AdminRoundSummary) -> String {
        var parts = [
            "\(round.participants.count) players",
            "\(count(round.scoreEventCount)) scores",
        ]
        if let last = round.lastEventAt {
            parts.append("last \(timestamp(last))")
        } else {
            parts.append("never played")
        }
        return ([round.date] + parts).joined(separator: " · ")
    }

    // MARK: - Players

    /// Web: `playerMeta` — "@marcus · 12 rounds · last 2026-07-24 · hcp 8.4 · DELETED".
    static func playerMeta(_ player: AdminPlayerSummary) -> String {
        var parts = ["@\(player.username)", "\(count(player.roundCount)) rounds"]
        if let last = player.lastRoundDate { parts.append("last \(last)") }
        if let handicap = player.handicapIndex { parts.append("hcp \(number(handicap))") }
        if player.deletedAt != nil { parts.append("DELETED") }
        return parts.joined(separator: " · ")
    }

    /// Web: `roleChip` — an "admin" pill for the unscoped grant, and the chip's
    /// `:empty { display: none }` for everyone else.
    static func roleChip(_ player: AdminPlayerSummary) -> String? {
        player.roles.contains("super_admin") ? "admin" : nil
    }

    // MARK: - Numbers

    /// The wire carries every count as a JSON number, so the generator types it
    /// `Double`. Rendering it as one would put "12.0 rounds" on the screen.
    static func count(_ value: Double) -> String {
        String(Int(value.rounded()))
    }

    /// A handicap index is genuinely fractional; JS prints `8.4` and `8`, and
    /// `%g`-style trimming is what matches it.
    static func number(_ value: Double) -> String {
        value == value.rounded() ? String(Int(value.rounded())) : String(value)
    }

    /// Web: `r.lastEventAt.replace('T', ' ').slice(0, 16)` — "2026-07-24 10:02".
    static func timestamp(_ iso: String) -> String {
        String(iso.replacingOccurrences(of: "T", with: " ").prefix(16))
    }
}
