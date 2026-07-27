import Foundation

/// Where the client talks to, resolved once at launch.
///
/// **The default is production everywhere** — device, simulator, DEBUG,
/// release. Anything else is an explicit `apiBaseURL` override.
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

    /// **Production, unconditionally — simulator included.**
    ///
    /// This used to branch on `targetEnvironment(simulator)` and hand the
    /// simulator `.dev`. That default was a trap in the other direction from
    /// the one it was guarding: it made "which server am I talking to?" depend
    /// on where the binary happened to be running, so a simulator build that
    /// *should* have been pointed at prod silently was not, and nothing on
    /// screen said so. A fresh install now talks to prod everywhere, which is
    /// the honest answer for a fresh install, and reaching localhost is an
    /// explicit act: pass `-apiBaseURL http://localhost:3030/api` (launch
    /// argument or the super-admin Server screen, both of which write the SAME
    /// `UserDefaults` key).
    ///
    /// The cost is real and accepted: every simulator run that forgets the
    /// argument hits PRODUCTION. See ios/AGENTS.md — every documented run
    /// command carries it.
    static let `default`: APIConfiguration = .production

    /// The `UserDefaults` key the launch argument (`-apiBaseURL …`) and the
    /// Server settings screen both write. One key, so there is exactly one
    /// answer to "where is this build pointed?".
    static let overrideDefaultsKey = "apiBaseURL"

    /// Resolves the configuration, honouring the `apiBaseURL` override
    /// (`-apiBaseURL https://…/api`) so a build can be pointed at a staging
    /// host — or at the dev server — without a rebuild. Same escape hatch
    /// golf-map uses for its headless live-verify.
    ///
    /// Read ONCE at launch, by design: see `ServerOverride` for why nothing
    /// hot-swaps it.
    static func resolved(defaults: UserDefaults = .standard) -> APIConfiguration {
        guard let override = defaults.string(forKey: overrideDefaultsKey),
              let configuration = APIConfiguration(overrideString: override)
        else { return .default }
        return configuration
    }

}

/// The override constructor lives in an EXTENSION on purpose: an `init`
/// declared in the struct body would suppress the synthesized memberwise
/// `init(baseURL:webOrigin:)`, which the tests and `LiveResultFeed` build
/// configurations with.
extension APIConfiguration {
    /// Builds a configuration from a raw override string, or nil when it is not
    /// a URL with a scheme and a host.
    ///
    /// Deliberately permissive about the *scheme* (a launch argument is a
    /// developer's own decision, and staging hosts are not all https); the
    /// stricter rules live in `ServerOverride.validate`, which is what the UI
    /// runs before writing. Both share this constructor so the `/api` →
    /// web-origin derivation cannot drift between them.
    init?(overrideString raw: String) {
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty,
              let url = URL(string: trimmed),
              url.scheme != nil,
              let host = url.host, !host.isEmpty
        else { return nil }
        // Strip a trailing `/api` to recover the web origin for share links.
        // `deletingLastPathComponent()` leaves a trailing slash behind
        // (`…/tapscore/api` → `…/tapscore/`), which is harmless to
        // `URL.append(path:)` but makes the derived origin an odd-looking twin
        // of the hand-written `.dev` / `.production` spellings — and stops
        // `APIConfiguration(overrideString:)` from ever being EQUAL to them,
        // which the presets rely on. So the slash comes off.
        var origin = url
        if url.lastPathComponent == "api" {
            origin = url.deletingLastPathComponent()
            let text = origin.absoluteString
            if text.count > 1, text.hasSuffix("/"),
               let trimmed = URL(string: String(text.dropLast())) {
                origin = trimmed
            }
        }
        self.init(baseURL: url, webOrigin: origin)
    }
}
