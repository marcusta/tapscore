import XCTest
@testable import TapScore

/// `DeepLinkRouter` is the app's trust boundary for inbound URLs: it decides
/// whether a stranger's link gets to name a round token. The host allow-list
/// case below is the one that matters most — everything else is ergonomics.
final class DeepLinkRouterTests: XCTestCase {
    /// Routes with the DEBUG default (`allowsInsecureDevHosts == true` in this
    /// bundle). Use `route(_:allowsInsecureDevHosts:)` when the point of the
    /// test is which semantics apply.
    private func route(_ string: String) -> DeepLinkRoute? {
        guard let url = URL(string: string) else {
            XCTFail("Not a URL: \(string)")
            return nil
        }
        return DeepLinkRouter.route(for: url)
    }

    /// Routes with the insecure-dev-host rule pinned explicitly. The test
    /// bundle is always built DEBUG, so release behaviour can only be asserted
    /// by passing `false` here — that is exactly why the rule is a parameter
    /// and not a bare `#if` inside the router.
    private func route(_ string: String, allowsInsecureDevHosts: Bool) -> DeepLinkRoute? {
        guard let url = URL(string: string) else {
            XCTFail("Not a URL: \(string)")
            return nil
        }
        return DeepLinkRouter.route(for: url, allowsInsecureDevHosts: allowsInsecureDevHosts)
    }

    // MARK: - Valid round links

    func testUniversalLinkWithTokenResolvesToRound() {
        XCTAssertEqual(
            route("https://app.swedenindoorgolf.se/tapscore/round?token=abc123"),
            .round(token: "abc123")
        )
    }

    func testDeploymentPathPrefixIsIrrelevant() {
        // The `/tapscore` prefix is a deployment detail; a root-mounted deploy
        // must resolve identically.
        XCTAssertEqual(
            route("https://app.swedenindoorgolf.se/round?token=abc123"),
            .round(token: "abc123")
        )
    }

    func testHostMatchIsCaseInsensitiveAndExtraQueryIsIgnored() {
        XCTAssertEqual(
            route("https://APP.SwedenIndoorGolf.se/tapscore/round?utm=mail&token=abc123"),
            .round(token: "abc123")
        )
    }

    // MARK: - Missing / empty token

    func testRoundLinkWithoutTokenFallsBackToTheList() {
        // Not an error: a link that lost its query is still *our* link, so send
        // the user somewhere useful instead of opening an empty round.
        XCTAssertEqual(route("https://app.swedenindoorgolf.se/tapscore/round"), .roundList)
    }

    func testBlankTokenIsTreatedAsMissing() {
        XCTAssertEqual(route("https://app.swedenindoorgolf.se/tapscore/round?token="), .roundList)
        XCTAssertEqual(route("https://app.swedenindoorgolf.se/tapscore/round?token=%20%20"), .roundList)
    }

    // MARK: - Rejected

    func testForeignHostIsRejectedEvenWithAPerfectPath() {
        XCTAssertNil(route("https://evil.example.com/tapscore/round?token=abc123"))
    }

    func testLookalikeHostIsRejected() {
        XCTAssertNil(route("https://app.swedenindoorgolf.se.evil.example.com/round?token=abc123"))
    }

    func testUnknownSchemeAndUnknownPathAreRejected() {
        XCTAssertNil(route("ftp://app.swedenindoorgolf.se/round?token=abc123"))
        XCTAssertNil(route("https://app.swedenindoorgolf.se/settings?token=abc123"))
    }

    // MARK: - Dev scheme

    func testDevSchemeResolvesRound() {
        XCTAssertEqual(route("tapscore://round?token=abc123"), .round(token: "abc123"))
    }

    func testDevSchemeWithLeadingSlashesResolvesRound() {
        XCTAssertEqual(route("tapscore:///round?token=abc123"), .round(token: "abc123"))
    }

    func testDevSchemeRoundList() {
        XCTAssertEqual(route("tapscore://rounds"), .roundList)
    }

    func testDevSchemeHostIsCaseInsensitive() {
        // `components.host` is injected verbatim into the segment list, so a
        // capitalised host used to miss the lowercase `"round"` case and fall
        // through to nil. Every other path goes through `segments(of:)`, which
        // lowercases — this pins the dev scheme to the same rule.
        XCTAssertEqual(route("tapscore://Round?token=abc"), .round(token: "abc"))
        XCTAssertEqual(route("tapscore://ROUNDS"), .roundList)
    }

    // MARK: - Bare domain

    func testBareDomainResolvesToTheRoundList() {
        // No path segments at all: `pathSegments.last` is nil (never ""), so
        // there is exactly one arm handling this.
        XCTAssertEqual(route("https://app.swedenindoorgolf.se/"), .roundList)
        XCTAssertEqual(route("https://app.swedenindoorgolf.se"), .roundList)
        XCTAssertEqual(route("https://app.swedenindoorgolf.se/tapscore/"), nil)
    }

    // MARK: - Scheme / transport security

    func testPlainHTTPOnTheProductionHostIsRejectedInEveryConfiguration() {
        // Universal links are https-only, so a plaintext link naming the
        // trusted host is a downgrade attempt, not a share link. This must hold
        // with the dev relaxation both off *and* on.
        XCTAssertNil(
            route("http://app.swedenindoorgolf.se/tapscore/round?token=abc123", allowsInsecureDevHosts: false),
            "Release semantics: plaintext production link must not resolve."
        )
        XCTAssertNil(
            route("http://app.swedenindoorgolf.se/tapscore/round?token=abc123", allowsInsecureDevHosts: true),
            "The dev relaxation is for loopback only — it must not widen the production host."
        )
    }

    func testDevServerLinkResolvesOnlyWhenInsecureDevHostsAreAllowed() {
        // The bun dev server hands out `http://localhost:3030/round?token=…`;
        // JoinView's paste fallback runs it through this same parser.
        XCTAssertEqual(
            route("http://localhost:3030/round?token=abc123", allowsInsecureDevHosts: true),
            .round(token: "abc123")
        )
        XCTAssertEqual(
            route("http://127.0.0.1:3030/tapscore/round?token=abc123", allowsInsecureDevHosts: true),
            .round(token: "abc123")
        )
        XCTAssertNil(
            route("http://localhost:3030/round?token=abc123", allowsInsecureDevHosts: false),
            "Release semantics: a shipping build must not honour plaintext loopback links."
        )
    }

    func testDefaultMatchesTheBuildConfiguration() {
        // The test bundle is DEBUG, so the default must be the permissive one.
        // A release build flips this constant; the two tests above pin both
        // behaviours regardless.
        XCTAssertEqual(
            DeepLinkRouter.allowsInsecureDevHostsByDefault,
            true,
            "Test bundles build DEBUG; if this fails the default lost its #if."
        )
        XCTAssertEqual(route("http://localhost:3030/round?token=abc123"), .round(token: "abc123"))
    }

    func testForeignPlaintextHostIsRejected() {
        XCTAssertNil(route("http://evil.example.com/round?token=abc123", allowsInsecureDevHosts: true))
        XCTAssertNil(route("http://localhost.evil.example.com/round?token=abc123", allowsInsecureDevHosts: true))
    }
}
