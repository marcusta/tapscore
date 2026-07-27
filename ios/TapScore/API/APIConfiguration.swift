import Foundation

/// Where the client talks to, resolved once at launch.
///
/// Two real deployments:
/// - **dev** `http://localhost:3030/api` — the bun dev server. Only reachable
///   from the simulator (a device cannot see the builder Mac's loopback), and
///   only because `Info.plist` sets `NSAllowsLocalNetworking`.
/// - **prod** `https://app.swedenindoorgolf.se/tapscore/api` — note the
///   `/tapscore` path prefix; the app is not at the domain root. (The
///   apple-app-site-association file *is* at the root — different thing, easy
///   to conflate. See ios/AGENTS.md.)
struct APIConfiguration: Equatable, Sendable {
    /// Fully-qualified API base, including the `/api` suffix. Paths are joined
    /// onto this, so the prefix survives.
    let baseURL: URL

    /// Origin used to build outbound share links (no `/api`).
    let webOrigin: URL

    static let dev = APIConfiguration(
        baseURL: URL(string: "http://localhost:3030/api")!,
        webOrigin: URL(string: "http://localhost:3030")!
    )

    static let production = APIConfiguration(
        baseURL: URL(string: "https://app.swedenindoorgolf.se/tapscore/api")!,
        webOrigin: URL(string: "https://app.swedenindoorgolf.se/tapscore")!
    )

    /// Simulator defaults to dev, a real device to production — a phone that
    /// defaulted to `localhost` would be dead on first launch.
    static let `default`: APIConfiguration = {
        #if targetEnvironment(simulator)
        return .dev
        #else
        return .production
        #endif
    }()

    /// Resolves the configuration, honouring a `UserDefaults` override
    /// (`-apiBaseURL https://…/api`) so a build can be pointed at a staging
    /// host without a rebuild. Same escape hatch golf-map uses for its
    /// headless live-verify.
    static func resolved(defaults: UserDefaults = .standard) -> APIConfiguration {
        guard let override = defaults.string(forKey: "apiBaseURL"),
              let url = URL(string: override),
              url.scheme != nil
        else { return .default }
        // Strip a trailing `/api` to recover the web origin for share links.
        let origin = url.lastPathComponent == "api" ? url.deletingLastPathComponent() : url
        return APIConfiguration(baseURL: url, webOrigin: origin)
    }
}
