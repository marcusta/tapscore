import Foundation

/// A destination resolved from an inbound URL.
///
/// Kept deliberately small: the share link is the only externally reachable
/// entry point that matters for N4's cold-tap gate, so every other URL shape
/// resolves to `nil` rather than growing a speculative case.
enum DeepLinkRoute: Equatable, Sendable {
    /// `/round?token=…` — the round share link. The token is the round's write
    /// credential; treat it as a secret (never log it).
    case round(token: String)
    /// `/rounds` — the landing list. Useful for the dev scheme and for a
    /// share link that lost its token.
    case roundList
}

/// Parses inbound URLs (universal links and the `tapscore://` dev scheme) into
/// `DeepLinkRoute`s.
///
/// Three accepted forms:
///
/// 1. **Universal link** — `https://app.swedenindoorgolf.se/tapscore/round?token=…`
///    The app is deployed under a `/tapscore` path prefix, but the prefix is a
///    deployment detail, so matching is done on the *trailing* path component
///    (`…/round`) and the host allow-list. A foreign host is rejected outright,
///    even if the path looks right — otherwise any site could hand us a token
///    to POST somewhere. **`https` only**: universal links are https-only by
///    definition, so an `http://app.swedenindoorgolf.se/round?token=…` link is
///    a downgrade attempt, not a share link, and is rejected.
/// 2. **Dev scheme** — `tapscore://round?token=…`. Universal links need the
///    apple-app-site-association file live at the domain root and a real
///    association, neither of which exists in the simulator. The dev scheme
///    lets `xcrun simctl openurl` drive the same routes.
/// 3. **Dev server link** — `http://localhost:3030/round?token=…`, accepted
///    only in DEBUG builds. That is the URL the bun dev server puts on the
///    clipboard, and `JoinView`'s paste fallback would otherwise be unusable
///    while developing. Loopback is not reachable from a stranger's network,
///    so the plaintext exemption stays confined to it.
///
/// Pure and synchronous by design: this is the piece the tests pin, and it must
/// stay free of app state so a URL can be classified before any environment
/// exists. The DEBUG-only relaxations are expressed as a *parameter*
/// (`allowsInsecureDevHosts`) whose default comes from the build config, so the
/// release rule stays testable from a DEBUG test bundle.
enum DeepLinkRouter {
    /// Hosts whose `https` links this app is willing to interpret. Matched
    /// case-insensitively; anything else is not our link.
    static let trustedHosts: Set<String> = ["app.swedenindoorgolf.se"]

    /// Loopback hosts the dev server runs on. Only ever consulted when
    /// `allowsInsecureDevHosts` is true.
    static let devHosts: Set<String> = ["localhost", "127.0.0.1", "[::1]", "::1"]

    /// The custom scheme registered in `Info.plist` (`CFBundleURLTypes`).
    static let devScheme = "tapscore"

    /// Whether plaintext `http://localhost…` links are honoured. True in DEBUG,
    /// false in a shipping build. Pass the flag explicitly to `route(for:_:)`
    /// to pin either semantics from a test.
    static let allowsInsecureDevHostsByDefault: Bool = {
        #if DEBUG
        return true
        #else
        return false
        #endif
    }()

    /// Resolves a URL to a route, or nil when the URL is not one of ours.
    ///
    /// - Parameter allowsInsecureDevHosts: when true, `http://localhost…` and
    ///   `http://127.0.0.1…` also resolve. Defaults to the build config; tests
    ///   pass it explicitly so release semantics are checkable in a DEBUG
    ///   test bundle. It never widens the *trusted* host — production is
    ///   https-only in every configuration.
    static func route(
        for url: URL,
        allowsInsecureDevHosts: Bool = allowsInsecureDevHostsByDefault
    ) -> DeepLinkRoute? {
        guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
              let scheme = components.scheme?.lowercased()
        else { return nil }

        switch scheme {
        case "https":
            // Host allow-list first: an untrusted origin never gets to name a
            // route, regardless of how convincing its path is.
            guard let host = components.host?.lowercased(),
                  trustedHosts.contains(host) || (allowsInsecureDevHosts && devHosts.contains(host))
            else { return nil }
            return route(pathSegments: segments(of: components.path), query: components.queryItems)

        case "http":
            // Plaintext is a dev-only affordance, and only for loopback. The
            // production host is deliberately absent from `devHosts`.
            guard allowsInsecureDevHosts,
                  let host = components.host?.lowercased(),
                  devHosts.contains(host)
            else { return nil }
            return route(pathSegments: segments(of: components.path), query: components.queryItems)

        case devScheme:
            // `tapscore://round?token=…` puts "round" in `host`;
            // `tapscore:///round?token=…` puts it in `path`. Accept both.
            // Lowercased like every other segment, so `tapscore://Round` is
            // not a second, differently-behaving spelling.
            let leading = components.host.map { [$0.lowercased()] } ?? []
            return route(pathSegments: leading + segments(of: components.path), query: components.queryItems)

        default:
            return nil
        }
    }

    // MARK: - Internals

    /// Splits a URL path into non-empty, lowercased segments.
    private static func segments(of path: String) -> [String] {
        path.split(separator: "/").map { $0.lowercased() }
    }

    /// Maps path segments + query onto a route. The deployment path prefix
    /// (`/tapscore`) is ignored: only the last segment names the destination.
    private static func route(pathSegments: [String], query: [URLQueryItem]?) -> DeepLinkRoute? {
        switch pathSegments.last {
        case "round":
            // A round link without a usable token is not a round link. Fall
            // back to the list rather than opening an empty round screen.
            guard let token = nonEmptyToken(in: query) else { return .roundList }
            return .round(token: token)
        // `nil` is the bare domain (`https://host/`) — `segments(of:)` never
        // yields an empty string, so there is no "" case to handle.
        case "rounds", nil:
            return .roundList
        default:
            return nil
        }
    }

    /// Extracts a non-empty, whitespace-trimmed `token` query value.
    private static func nonEmptyToken(in query: [URLQueryItem]?) -> String? {
        guard let raw = query?.first(where: { $0.name == "token" })?.value else { return nil }
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }
}
