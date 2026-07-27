import SwiftUI

@main
struct TapScoreApp: App {
    @State private var appEnvironment = AppEnvironment.live()
    @Environment(\.scenePhase) private var scenePhase

    var body: some Scene {
        WindowGroup {
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
                    await appEnvironment.bootstrap()
                }
        }
    }
}
