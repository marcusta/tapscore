import Foundation

/// Every way a tapscore API call can fail, as one closed set.
///
/// The split matters at the call site: `.unauthorized` means *wipe the token*,
/// `.network` means *retry later*, `.decoding` means *the client and server
/// disagree about a shape* (a bug, usually a stale `API/Generated/`), and
/// `.server` means *the server said no* and the message is worth showing.
enum APIError: Error, Equatable, Sendable {
    /// HTTP 401. The bearer token is missing, expired, or was revoked
    /// (`POST /api/auth/revoke`).
    case unauthorized
    /// The request never produced an HTTP response — offline, DNS, TLS,
    /// timeout. `detail` is the underlying description.
    case network(String)
    /// The body did not match the expected model. Almost always a client/server
    /// contract drift; regenerate `API/Generated/` before suspecting anything else.
    case decoding(String)
    /// A non-2xx, non-401 status. `message` is the server's `{ error }` string
    /// when it sent one.
    case server(code: Int, message: String?)
}

extension APIError: LocalizedError {
    var errorDescription: String? {
        switch self {
        case .unauthorized:
            "Your session has expired. Sign in again."
        case let .network(detail):
            "Can't reach the server: \(detail)"
        case let .decoding(detail):
            "Unexpected response from the server: \(detail)"
        case let .server(code, message):
            message.map { "\($0) (HTTP \(code))" } ?? "Server error (HTTP \(code))."
        }
    }
}
