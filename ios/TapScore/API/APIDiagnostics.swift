import Foundation
import os

/// One failed API call, exactly as the transport saw it.
struct APIFailure: Identifiable, Equatable, Sendable {
    let id: UUID
    let date: Date
    let method: String
    /// Path relative to the API base — what `requestData` was given, so the
    /// entry names the endpoint without repeating the server half that the
    /// Server screen already shows.
    let path: String
    /// The full technical story: error case, HTTP status, decoding coding
    /// path. Deliberately unabridged — this string exists to be pasted into a
    /// bug report, and a truncated `DecodingError` names the struct but not
    /// the key that missed.
    let detail: String

    init(date: Date, method: String, path: String, detail: String) {
        self.id = UUID()
        self.date = date
        self.method = method
        self.path = path
        self.detail = detail
    }
}

/// The failure log behind the Diagnostics screen.
///
/// Exists because the user-facing surfaces deliberately do NOT say what went
/// wrong: the landing folds every dashboard failure into "Couldn't reach the
/// server", which is the right sentence for a player and a dead end for
/// whoever has to fix it. This is the other half of that trade — every
/// `APIError` the transport throws lands here verbatim, and only the
/// super-admin Diagnostics screen ever renders it.
///
/// Two sinks, on purpose:
///
/// - **A ring buffer in memory**, for the in-app screen. Not persisted: the
///   failures worth reading are the ones from THIS launch, and a log that
///   survives sign-out would carry one account's paths into another's session.
/// - **The unified log** (`os.Logger`, subsystem = bundle id, category `api`),
///   for reading from a connected Mac — `log collect --device` or Console.app
///   — which persists on the device and works even when nobody opened the
///   screen before relaunching. Marked `.public` because endpoint paths and
///   error shapes are not user content, and a redacted `<private>` entry
///   answers nothing.
///
/// A `Sendable` class with a lock rather than an actor, so the `TapScoreAPI`
/// actor can record from its own executor without an extra hop, and views can
/// read a snapshot synchronously.
final class APIDiagnostics: Sendable {
    static let shared = APIDiagnostics()

    /// Ring size. Big enough for a whole debugging session, small enough that
    /// "copy all" stays pasteable.
    private static let capacity = 50

    private let entries = OSAllocatedUnfairLock<[APIFailure]>(initialState: [])
    private let logger = Logger(subsystem: "com.marcusandersson.tapscore", category: "api")

    func record(method: String, path: String, error: APIError) {
        let detail = Self.detail(error)
        let failure = APIFailure(date: Date(), method: method, path: path, detail: detail)
        entries.withLock { list in
            list.append(failure)
            if list.count > Self.capacity {
                list.removeFirst(list.count - Self.capacity)
            }
        }
        logger.error("\(method, privacy: .public) \(path, privacy: .public) — \(detail, privacy: .public)")
    }

    /// Newest first — the failure being chased is almost always the last one.
    func snapshot() -> [APIFailure] {
        entries.withLock { $0 }.reversed()
    }

    func clear() {
        entries.withLock { $0.removeAll() }
    }

    /// The case name spelled out, then everything the case carries. NOT
    /// `errorDescription` — that string is written for an end user ("Can't
    /// reach the server") and this log exists precisely because that sentence
    /// hides the mechanism.
    static func detail(_ error: APIError) -> String {
        switch error {
        case .unauthorized:
            "unauthorized (HTTP 401)"
        case let .network(detail):
            "network: \(detail)"
        case let .decoding(detail):
            "decoding: \(detail)"
        case let .server(code, message):
            message.map { "HTTP \(code): \($0)" } ?? "HTTP \(code)"
        }
    }
}
