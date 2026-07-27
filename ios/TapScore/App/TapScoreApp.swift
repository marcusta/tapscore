import SwiftUI

@main
struct TapScoreApp: App {
    @State private var appEnvironment = AppEnvironment.live()
    @Environment(\.scenePhase) private var scenePhase

    var body: some Scene {
        WindowGroup {
            #if DEBUG
            // `-tapscoreGallery` swaps the whole app for the design-system
            // catalogue, so a review can screenshot every primitive headlessly.
            // It REPLACES the shell rather than sitting inside it: the gallery
            // is not a screen of this app, and nothing in normal navigation
            // must be able to reach it. DEBUG only, like `LaunchDeepLink`.
            if LaunchGallery.isEnabled {
                DesignGalleryView()
            } else {
                shell
            }
            #else
            shell
            #endif
        }
    }

    /// The real app. Extracted from `body` only so the DEBUG gallery switch
    /// above stays a two-line branch instead of duplicating every modifier.
    private var shell: some View {
        RootView()
            .environment(appEnvironment)
            // Single funnel for lifecycle: everything that cares about
            // foreground/background registers with the coordinator instead
            // of observing scenePhase itself (see ScenePhaseCoordinator).
            .onChange(of: scenePhase, initial: true) { _, phase in
                appEnvironment.scenePhase.update(to: phase)
            }
            // Universal links (https://app.swedenindoorgolf.se/tapscore/…)
            // and the tapscore:// dev scheme both land here.
            .onOpenURL { url in
                appEnvironment.handle(url: url)
            }
            .task {
                // A launch-argument link is applied BEFORE bootstrap, for
                // the same reason a cold-start `onOpenURL` is: the route is
                // parked on the environment and drained by `RootView`, and
                // nothing about opening a round waits on auth.
                if let url = LaunchDeepLink.url() { appEnvironment.handle(url: url) }
                await appEnvironment.bootstrap()
            }
    }
}

/// A deep link supplied at **launch** rather than by the system.
///
/// `xcrun simctl openurl` works, but the first `tapscore://` URL a simulator
/// sees raises a SpringBoard confirmation alert ("Open in TapScore?") that a
/// headless script cannot dismiss — so any automated verification of the round
/// screen ends up depending on a human tap. Passing the link as a launch
/// argument routes the exact same URL through the exact same `DeepLinkRouter`
/// and `ShellNavigation` path, with no system UI in the way:
///
/// ```sh
/// xcrun simctl launch --console <udid> com.marcusandersson.tapscore \
///     -tapscoreDeepLink 'tapscore://round?token=abc123'
/// # or, equivalently:
/// SIMCTL_CHILD_TAPSCORE_DEEP_LINK='tapscore://round?token=abc123' \
///     xcrun simctl launch <udid> com.marcusandersson.tapscore
/// ```
///
/// **DEBUG only.** It is not a security hole in a shipping build either (a
/// launch argument means the attacker already runs code as the user), but it is
/// a test seam and a release build has no business honouring one. The URL is
/// still parsed by `DeepLinkRouter`, so the host allow-list and the https rule
/// apply unchanged — this widens *how a URL arrives*, never *which URLs count*.
enum LaunchDeepLink {
    /// Launch argument key, in the `-key value` form `UserDefaults` also picks
    /// up, and the environment variable that means the same thing.
    static let argument = "-tapscoreDeepLink"
    static let environmentKey = "TAPSCORE_DEEP_LINK"

    /// The URL to open at startup, or nil.
    static func url(
        arguments: [String] = ProcessInfo.processInfo.arguments,
        environment: [String: String] = ProcessInfo.processInfo.environment
    ) -> URL? {
        #if DEBUG
        return string(arguments: arguments, environment: environment)
            .flatMap(URL.init(string:))
        #else
        return nil
        #endif
    }

    /// Pure lookup, split out so the precedence is testable without a process.
    /// The argument wins: it is the more explicit of the two.
    static func string(
        arguments: [String],
        environment: [String: String]
    ) -> String? {
        if let index = arguments.firstIndex(of: argument), index + 1 < arguments.count {
            let value = arguments[index + 1].trimmingCharacters(in: .whitespacesAndNewlines)
            if !value.isEmpty { return value }
        }
        let fromEnvironment = (environment[environmentKey] ?? "")
            .trimmingCharacters(in: .whitespacesAndNewlines)
        return fromEnvironment.isEmpty ? nil : fromEnvironment
    }
}
