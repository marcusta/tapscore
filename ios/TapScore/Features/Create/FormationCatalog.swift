import Foundation

/// The shared-ball formations the server serves — scramble, foursomes,
/// greensomes — and the seeding recipe each one carries.
///
/// The Swift image of `server/domain/round-setup/formation-catalog.ts`, read
/// over `GET /setup/formations` exactly as `FormatCatalog` reads
/// `GET /setup/formats`. Like it, this is a **value over the server's
/// descriptors**, never a local table: an allowance recipe that disagrees with
/// the server's is a scorecard nobody can explain, and there is no way to spot
/// the disagreement from the phone.
///
/// So there is deliberately **no hardcoded fallback**. A catalog that failed to
/// load is simply EMPTY, `isAvailable` is false, and shared-ball teams cannot be
/// built in that session — the flow is otherwise untouched (proposal
/// `docs/proposals/ball-teams-composition.md`, "Formations are rule objects,
/// not metadata").
///
/// `custom` is absent by design, server-side and here: it is a valid draft
/// `formation` value with no recipe, reachable only from the web flexible
/// editor. A stored team carrying it round-trips through this client as
/// read-only passthrough (`EditDraftAssembler`), never as an editable team.
struct FormationCatalog: Sendable, Equatable {
    var descriptors: [FormationDescriptor] = []

    init(descriptors: [FormationDescriptor] = []) {
        self.descriptors = descriptors
    }

    /// The feature is available at all — i.e. the catalog fetch succeeded.
    var isAvailable: Bool { !descriptors.isEmpty }

    // MARK: - Lookup

    func byId(_ id: String) -> FormationDescriptor? {
        descriptors.first { $0.id == id }
    }

    /// `labels[locale] ?? labels.en` — the same "never throw on an unknown id"
    /// contract `FormatCatalog.label` has, so the caller keeps its own fallback.
    func label(_ id: String, locale: FormatCatalog.Locale = .current) -> String? {
        byId(id).map { label($0, locale: locale) }
    }

    func label(_ descriptor: FormationDescriptor, locale: FormatCatalog.Locale = .current) -> String {
        switch locale {
        case .sv:
            if let sv = descriptor.labels.sv, !sv.isEmpty { return sv }
            return descriptor.labels.en
        case .en:
            return descriptor.labels.en
        }
    }

    // MARK: - Rules

    /// The team-size bounds, inclusive. Nil for a formation this catalog does
    /// not know — which is the one state in which the caller must not enforce
    /// anything, rather than enforce a guess.
    func size(_ id: String) -> (min: Int, max: Int)? {
        byId(id).map { (min: Int($0.size.min), max: Int($0.size.max)) }
    }

    func fits(_ id: String, memberCount: Int) -> Bool {
        guard let size = size(id) else { return true }
        return memberCount >= size.min && memberCount <= size.max
    }

    /// The default allowance % **by position**, with members sorted by playing
    /// handicap ASCENDING (position 1 = the lowest handicap). Nil when this
    /// formation has no recipe for that many members — a size the bounds
    /// already refuse, or a formation the catalog does not carry.
    ///
    /// The wire spells the key as a string because that is what a JSON object
    /// carries; `allowancesBySize["2"]` is the pair recipe.
    func allowances(_ id: String, memberCount: Int) -> [Double]? {
        guard let recipe = byId(id)?.allowancesBySize[String(memberCount)],
              recipe.count == memberCount
        else { return nil }
        return recipe
    }
}
