import Foundation

/// Reading, validating and writing the `apiBaseURL` server override.
///
/// One key, two writers: the `-apiBaseURL …` launch argument (which `UserDefaults`
/// surfaces for free) and the super-admin Server screen. They must agree, so the
/// screen writes the same key rather than inventing a second one — otherwise a
/// build could be pointed two places at once and the winner would be an accident
/// of read order.
///
/// **Nothing here hot-swaps the running client, and that is deliberate.** The
/// base URL is read once at launch and handed to `TapScoreAPI` (an actor),
/// `LiveResultFeed`'s SSE connection and `PendingScoreQueue`'s in-flight work;
/// swapping it under them would leave sessions, a live event stream and queued
/// score writes addressed at the OLD origin while new requests went to the new
/// one — a half-migrated app whose bugs would all look like server bugs. A
/// relaunch is the honest semantics, so the UI says "relaunch to apply" and
/// means it.
enum ServerOverride {
    /// The `UserDefaults` key. Same one the launch argument uses.
    static var key: String { APIConfiguration.overrideDefaultsKey }

    /// Why a typed-in URL was refused. Each case carries its own user-facing
    /// wording so the view has no copy of its own to drift.
    enum ValidationError: Error, Equatable, Sendable {
        case empty
        case notAURL
        case missingScheme
        case missingHost
        /// Plaintext http to something that is not loopback.
        case insecureRemoteHost(String)

        var message: String {
            switch self {
            case .empty:
                return "Enter a server URL."
            case .notAURL, .missingHost:
                return "That is not a URL the app can reach."
            case .missingScheme:
                return "Include the scheme — https://… (or http:// for localhost)."
            case let .insecureRemoteHost(host):
                return "http:// is only allowed for localhost. Use https:// for \(host)."
            }
        }
    }

    /// Hosts allowed to be reached over plaintext http. The same loopback set
    /// `DeepLinkRouter` permits, and the same one `Info.plist`'s
    /// `NSAllowsLocalNetworking` actually makes reachable — widening this list
    /// would produce a URL the app accepts and ATS then refuses.
    static let loopbackHosts: Set<String> = ["localhost", "127.0.0.1", "::1"]

    /// Validates a typed-in base URL and returns the configuration it means.
    ///
    /// Rules, in order: parseable, has a scheme, has a host, and — the only
    /// rule that is about safety rather than about typos — https is required
    /// unless the host is loopback. A developer pointing at their own Mac is
    /// the entire reason plaintext is allowed at all; pointing a build at a
    /// remote host in the clear is not a thing this screen will help with.
    static func validate(_ raw: String) -> Result<APIConfiguration, ValidationError> {
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return .failure(.empty) }
        guard let url = URL(string: trimmed) else { return .failure(.notAURL) }
        guard let scheme = url.scheme?.lowercased(), !scheme.isEmpty else {
            return .failure(.missingScheme)
        }
        guard let host = url.host, !host.isEmpty else { return .failure(.missingHost) }
        if scheme != "https" {
            guard scheme == "http", loopbackHosts.contains(host.lowercased()) else {
                return .failure(.insecureRemoteHost(host))
            }
        }
        guard let configuration = APIConfiguration(overrideString: trimmed) else {
            return .failure(.notAURL)
        }
        return .success(configuration)
    }

    /// The override currently stored, if any. Nil means "the default", which is
    /// production.
    static func current(defaults: UserDefaults = .standard) -> String? {
        defaults.string(forKey: key)
    }

    /// Writes a validated override. Returns the configuration it will resolve
    /// to on the NEXT launch — not now; see the type doc.
    @discardableResult
    static func store(
        _ raw: String,
        defaults: UserDefaults = .standard
    ) -> Result<APIConfiguration, ValidationError> {
        let result = validate(raw)
        if case .success = result {
            defaults.set(raw.trimmingCharacters(in: .whitespacesAndNewlines), forKey: key)
        }
        return result
    }

    /// Clears the override, so the next launch resolves `.default` —
    /// production. The "Reset to Production" action.
    static func reset(defaults: UserDefaults = .standard) {
        defaults.removeObject(forKey: key)
    }
}
