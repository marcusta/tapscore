import XCTest
@testable import TapScore

/// The bearer token is the whole native session. If `Keychain` silently fails
/// to persist it, the app looks fine and logs the user out on every cold start
/// — a failure mode that is invisible in a simulator run but obvious here.
final class KeychainTests: XCTestCase {
    /// Per-test service string so the suite never collides with a real install
    /// (or with a parallel test) in the shared simulator keychain.
    private var keychain = Keychain(service: "com.marcusandersson.tapscore.tests.\(UUID().uuidString)")

    override func tearDown() {
        keychain.clear()
        super.tearDown()
    }

    func testTokenRoundTripsAndOverwrites() {
        XCTAssertNil(keychain.loadToken(), "A fresh service must start empty.")

        XCTAssertTrue(keychain.saveToken("token-one"))
        XCTAssertEqual(keychain.loadToken(), "token-one")

        // Save must replace, not accumulate — two items under one service would
        // make `loadToken` nondeterministic.
        XCTAssertTrue(keychain.saveToken("token-two"))
        XCTAssertEqual(keychain.loadToken(), "token-two")

        keychain.clear()
        XCTAssertNil(keychain.loadToken(), "clear() must remove the token (logout).")
    }
}
