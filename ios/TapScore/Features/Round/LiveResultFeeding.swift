import Foundation

/// The slice of `LiveResultFeed` the round screen drives.
///
/// Exists so `RoundStore` can be exercised against a scripted feed without a
/// socket, a server, or `SSEClient`'s reconnect timing. `LiveResultFeed` itself
/// is untouched — it already has exactly this surface, so the conformance below
/// is empty. The protocol is `Actor`-constrained because the real feed IS an
/// actor and its methods are isolated; a `Sendable` class would not do.
protocol LiveResultFeeding: Actor {
    /// Opens the feed for a share token and returns its update stream.
    func start(token: String, since: String?) async -> AsyncStream<LiveResultFeed.Update>
    /// Drops the connection, keeps the stream (backgrounding).
    func suspend() async
    /// Reconnects after `suspend()`, resuming from the persisted cursor.
    func resume()
    /// Closes everything and finishes the stream.
    func stop() async
}

extension LiveResultFeed: LiveResultFeeding {}
