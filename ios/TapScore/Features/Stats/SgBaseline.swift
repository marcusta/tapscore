import Foundation

/// Which reference the strokes-gained rows are measured against, as the READER
/// chose it — and the one place that turns that choice into a cohort.
///
/// Twin of the web's `sg-baseline` module: the same five stored strings, the same
/// key, the same resolution rule. A device that has never been touched stores
/// nothing, decodes `.auto`, and lands on the tier the player's handicap implies
/// — `hcp12` when there is no handicap and no session, which is exactly the
/// baseline the app shipped with.

// MARK: - The choice

/// `auto` plus the four tiers. Raw values are the stored strings, identical on
/// both clients.
enum SgBaselineChoice: String, CaseIterable, Sendable {
    /// Follow the signed-in player's handicap index.
    case auto
    case scratch
    case hcp5
    case hcp12
    case hcp20

    /// The tier this choice pins, or nil for `auto` — the one case with no
    /// matching `SgCohort` raw value, which is what makes this lookup total.
    var cohort: SgCohort? { SgCohort(rawValue: rawValue) }

    /// THE resolution rule, and the only one. Both stats surfaces and the ⓘ
    /// sheet go through it, so they cannot disagree about which table a row was
    /// weighed against.
    func resolved(handicapIndex: Double?) -> SgCohort {
        cohort ?? SgCohort.forHandicap(handicapIndex)
    }
}

// MARK: - Words

extension SgCohort {
    /// The tier in the reader's words. Identical strings on both clients.
    var title: String {
        switch self {
        case .scratch: return "Scratch"
        case .hcp5: return "5 handicap"
        case .hcp12: return "12 handicap"
        case .hcp20: return "20+ handicap"
        }
    }

    /// What this tier is expected to shoot on a par 72 — four par 3s, ten par 4s
    /// and four par 5s off its own hole table. Derived, never typed in: a tier
    /// whose table is recalibrated cannot leave a stale number in its subtitle.
    var expectedOnParSeventyTwo: Double {
        let tables = SgBaselines.bundle(for: self).tables
        return 4 * (tables.eHole[3] ?? 0) + 10 * (tables.eHole[4] ?? 0)
            + 4 * (tables.eHole[5] ?? 0)
    }
}

/// The picker's words, in one place so the control and its tests read the same
/// strings. Words over symbols (`docs/design-guidelines.md` §4).
enum SgBaselineCopy {
    static let pickerLabel = "Compared to"
    static let pickerTitle = "Compared to"
    static let autoTitle = "Match my handicap"

    static func rowTitle(_ choice: SgBaselineChoice) -> String {
        choice.cohort?.title ?? autoTitle
    }

    /// The row's explanation — the OPTION's meaning, with the reader's own
    /// handicap where it decides something.
    static func rowSubtitle(_ choice: SgBaselineChoice, handicapIndex: Double?) -> String {
        guard let cohort = choice.cohort else {
            guard let handicapIndex else {
                return
                    "No handicap on your profile yet, so this uses the \(SgCohort.hcp12.title) reference."
            }
            let matched = SgCohort.forHandicap(handicapIndex)
            return
                "Your \(ProfileFormat.index(handicapIndex)) handicap puts you on the \(matched.title) reference."
        }
        return "About \(shots(cohort)) shots on a par 72."
    }

    /// The collapsed field's qualification: which tier the choice actually
    /// resolved to, when the field's own title does not already say it.
    static func fieldMarker(_ context: SgBaselineContext) -> String? {
        guard context.choice == .auto else { return nil }
        return context.cohort.title
    }

    private static func shots(_ cohort: SgCohort) -> String {
        String(Int(cohort.expectedOnParSeventyTwo.rounded()))
    }
}

// MARK: - Persistence

/// The second thing the stats screen remembers between launches: which reference
/// the rows are measured against.
///
/// Same store and same reasoning as `StatsWindowPreference` — `UserDefaults`,
/// not the Keychain and not the server: it is a view preference, it grants
/// nothing, and a device that forgets it falls back to `auto`, which is the
/// answer the app would have computed anyway.
enum SgBaselinePreference {
    /// The web client stores the same string under the same key.
    static let key = "tapscore.stats.sgBaseline.v1"

    /// Follow the handicap. An unreadable or unknown stored value decodes to
    /// this rather than to a tier: a string written by a future version must not
    /// pin a reader to a table this build cannot name.
    static let fallback: SgBaselineChoice = .auto

    static func load(defaults: UserDefaults = .standard) -> SgBaselineChoice {
        guard let raw = defaults.string(forKey: key),
            let choice = SgBaselineChoice(rawValue: raw)
        else { return fallback }
        return choice
    }

    static func save(_ choice: SgBaselineChoice, defaults: UserDefaults = .standard) {
        defaults.set(choice.rawValue, forKey: key)
    }

    /// The stored choice resolved for a caller that has the auth state to hand —
    /// the round screen, the story card and the home card all read the baseline
    /// this way, so none of them can resolve it differently from the dashboard.
    static func context(auth: AuthState, defaults: UserDefaults = .standard) -> SgBaselineContext {
        SgBaselineContext(choice: load(defaults: defaults), handicapIndex: handicapIndex(auth))
    }

    /// The signed-in player's index, or nil for every other state. Negative is a
    /// plus handicap and stays negative — `SgCohort.forHandicap` wants the raw
    /// domain value, not the "+2.4" spelling.
    static func handicapIndex(_ auth: AuthState) -> Double? {
        guard case let .signedIn(player) = auth else { return nil }
        return player.handicapIndex
    }
}

// MARK: - The resolved baseline

/// The baseline in force, and how the reader ended up on it.
///
/// Carried as ONE value rather than as a loose cohort so the ⓘ sheet can say
/// *why* this table — "matched to your 2.0 handicap" and "you chose this" are
/// different sentences, and a bare cohort cannot tell them apart.
struct SgBaselineContext: Equatable, Sendable {
    var choice: SgBaselineChoice
    var handicapIndex: Double?

    init(choice: SgBaselineChoice = .auto, handicapIndex: Double? = nil) {
        self.choice = choice
        self.handicapIndex = handicapIndex
    }

    /// What every surface actually measures against today when nothing has been
    /// resolved: the shipped v1 constants.
    static let fallback = SgBaselineContext()

    var cohort: SgCohort { choice.resolved(handicapIndex: handicapIndex) }

    var bundle: SgBaselineBundle { SgBaselines.bundle(for: cohort) }
}
