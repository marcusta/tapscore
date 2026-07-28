import Foundation
import Observation

/// The operator screen's data, mirroring `src/admin/admin.service.ts`.
///
/// The web halves the same way and for the same reason: `/me/roles` is
/// caller-scoped and lives on `AppEnvironment` (it decides whether the entry
/// point renders at all), while `/admin/*` is the cross-player payload and is
/// only ever fetched from the admin screen itself — so an ordinary player never
/// triggers a 403.
///
/// Two deliberate departures from the web service:
///
/// 1. **Rounds page.** The web asks for `limit: 100` once and stops thinking
///    about it. The endpoint really does paginate (`limit` ≤ 200, `offset`), so
///    the native list asks for a page at a time and offers "Load more" — a
///    phone list that silently ends at row 100 is indistinguishable from a
///    database that ends there. Ordering is untouched: the server returns
///    rounds newest-first (`r.created_at desc`) and players newest-registered
///    first, and nothing here re-sorts them. `/admin/players` takes no page
///    input, so the roster is one shot by contract.
/// 2. **403 is a state, not an error string.** The grant can be revoked while
///    the screen is open — `AdminAuthz` is the real gate and it is checked per
///    request — so the refusal gets its own quiet phase rather than a red line.
@MainActor
@Observable
final class AdminStore {
    /// Where the first load got to. Load-more failures do NOT move it: a failed
    /// second page must not blank the rows already on screen.
    enum Phase: Equatable {
        case loading
        case ready
        /// 403 (or 401) — the caller is not, or is no longer, a super admin.
        case notAuthorized
        case failed(String)
    }

    /// One page of rounds. The server's own default (`listRounds(limit = 50)`),
    /// so the client is not inventing a second page size.
    static let pageSize = 50

    private(set) var phase: Phase = .loading
    private(set) var stats: AdminStats?
    private(set) var rounds: [AdminRoundSummary] = []
    private(set) var players: [AdminPlayerSummary] = []

    /// A full page came back, so there may be another. A short page proves the
    /// end without a count endpoint.
    private(set) var canLoadMore = false
    private(set) var isLoadingMore = false
    /// Surfaced under the list, never in place of it — see `Phase`.
    private(set) var loadMoreProblem: String?

    private let api: TapScoreAPI

    /// The ids already on screen, so a page boundary cannot render one round
    /// twice. See `append(page:)`.
    private var heldRoundIDs: Set<String> = []

    init(api: TapScoreAPI) {
        self.api = api
    }

    /// Appends a page, dropping rows already held.
    ///
    /// **Offset paging over a `created_at desc` window is not stable.** A round
    /// created between the first request and the second shifts every row down
    /// by one, so `offset = 50` hands back the round that was row 50 — which is
    /// already on screen. SwiftUI's `ForEach(id: \.roundId)` treats duplicate
    /// ids as a programmer error, and the visible symptom is a row rendered
    /// twice on the operator's screen.
    ///
    /// The dedupe is on APPEND only. `canLoadMore` still reads the RAW page
    /// length, because a full page means the server has more to give regardless
    /// of how much of it this client already had; deriving it from the appended
    /// count would end the list early on the exact page that overlapped.
    private func append(page: [AdminRoundSummary]) {
        for round in page where heldRoundIDs.insert(round.roundId).inserted {
            rounds.append(round)
        }
    }

    /// The screen's one fetch: counters, the first page of rounds, the roster.
    ///
    /// Three requests in parallel, exactly as the web's `Promise.all` does —
    /// they are independent reads and serialising them would triple the wait on
    /// the screen that has the most rows to draw.
    func load() async {
        phase = .loading
        loadMoreProblem = nil
        do {
            async let stats = api.send(AdminEndpoints.adminStats)
            async let page = api.send(
                AdminEndpoints.adminRounds,
                AdminAdminRoundsInput(limit: Double(Self.pageSize), offset: 0)
            )
            async let roster = api.send(AdminEndpoints.adminPlayers)

            let (loadedStats, loadedRounds, loadedPlayers) = try await (stats, page, roster)
            self.stats = loadedStats
            self.rounds = []
            self.heldRoundIDs = []
            append(page: loadedRounds)
            self.players = loadedPlayers
            self.canLoadMore = loadedRounds.count == Self.pageSize
            self.phase = .ready
        } catch {
            phase = Self.phase(for: error)
        }
    }

    /// The next page of rounds, appended.
    ///
    /// `offset` is the count already held rather than a page counter, so a
    /// double tap re-asks for the same window instead of skipping one. When a
    /// concurrent insert makes that window overlap what is already on screen,
    /// `append(page:)` drops the repeats.
    func loadMoreRounds() async {
        guard canLoadMore, !isLoadingMore, phase == .ready else { return }
        isLoadingMore = true
        loadMoreProblem = nil
        defer { isLoadingMore = false }
        do {
            let page = try await api.send(
                AdminEndpoints.adminRounds,
                AdminAdminRoundsInput(
                    limit: Double(Self.pageSize),
                    offset: Double(rounds.count)
                )
            )
            append(page: page)
            canLoadMore = page.count == Self.pageSize
        } catch {
            // A revoked grant mid-scroll is still a refusal of the whole
            // screen; anything else keeps the rows and says so underneath.
            let next = Self.phase(for: error)
            if next == .notAuthorized {
                phase = .notAuthorized
            } else {
                loadMoreProblem = APIErrorCopy.short(error)
            }
        }
    }

    /// 401 and 403 both mean "this session may not read this", which is the one
    /// outcome the screen has a state for. Everything else is a message.
    private static func phase(for error: any Error) -> Phase {
        switch error as? APIError {
        case .unauthorized:
            return .notAuthorized
        case let .server(code, _) where code == 403:
            return .notAuthorized
        default:
            return .failed(APIErrorCopy.short(error))
        }
    }
}

/// One-line failure copy for the admin screen.
///
/// Deliberately thin: `APIError` already carries `LocalizedError` wording, and
/// this only exists so a decode drift does not paint a 400-character Swift
/// diagnostic across a phone screen.
enum APIErrorCopy {
    static func short(_ error: any Error) -> String {
        switch error as? APIError {
        case let .server(code, message):
            return message.map { "\($0) (HTTP \(code))" } ?? "Server error (HTTP \(code))."
        case let .network(detail):
            return "Can't reach the server: \(detail)"
        case .decoding:
            return "The server sent a shape this build does not understand."
        case .unauthorized:
            return "Not authorized."
        case nil:
            return error.localizedDescription
        }
    }
}
