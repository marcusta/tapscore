import Foundation
import Observation
import SwiftUI

/// Foreground/background hooks, in one place.
///
/// **Stub, on purpose.** The live-round feed (`/api/friendly-rounds/:id/events`,
/// SSE) must not stay connected while the app is backgrounded: iOS suspends the
/// socket, the server keeps a dead subscriber, and on return the client silently
/// shows stale scores. The fix is always the same shape — drop the stream on
/// background, reconnect and re-fetch a snapshot on foreground — so the
/// subscription points exist now and the feed plugs into them later.
///
/// `TapScoreApp` drives this from `@Environment(\.scenePhase)`; nothing else
/// should observe `scenePhase` directly, or the reconnect logic ends up
/// scattered across screens.
@MainActor
@Observable
final class ScenePhaseCoordinator {
    /// The last phase this coordinator was told about.
    private(set) var phase: ScenePhase = .inactive

    /// Number of times the app has become active. `1` is the cold start; a
    /// screen can use `> 1` to distinguish "returned from background".
    private(set) var activations = 0

    /// Callbacks fired when the app becomes active. Keyed so a screen can
    /// register on appear and deregister on disappear without leaking.
    private var foregroundHandlers: [String: @MainActor () -> Void] = [:]

    /// Callbacks fired when the app leaves the active phase.
    private var backgroundHandlers: [String: @MainActor () -> Void] = [:]

    init() {}

    /// Registers (or replaces) a pair of hooks under `key`.
    ///
    /// - Parameters:
    ///   - key: stable identity, e.g. `"round-feed:\(roundId)"`.
    ///   - onForeground: reconnect + re-fetch a snapshot.
    ///   - onBackground: tear the stream down.
    func register(
        key: String,
        onForeground: (@MainActor () -> Void)? = nil,
        onBackground: (@MainActor () -> Void)? = nil
    ) {
        foregroundHandlers[key] = onForeground
        backgroundHandlers[key] = onBackground
    }

    /// Removes both hooks registered under `key`.
    func unregister(key: String) {
        foregroundHandlers[key] = nil
        backgroundHandlers[key] = nil
    }

    /// Feeds a SwiftUI scene-phase change in. Idempotent: repeating the current
    /// phase fires nothing, so `onChange(initial: true)` is safe.
    func update(to newPhase: ScenePhase) {
        guard newPhase != phase else { return }
        let wasActive = phase == .active
        phase = newPhase

        if newPhase == .active {
            activations += 1
            for handler in foregroundHandlers.values { handler() }
        } else if wasActive {
            for handler in backgroundHandlers.values { handler() }
        }
    }
}
