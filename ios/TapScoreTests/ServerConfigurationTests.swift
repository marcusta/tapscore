import XCTest
@testable import TapScore

/// The server-URL policy: production is the default EVERYWHERE, the override is
/// the only way anywhere else, and the Server screen that writes it is gated on
/// a `super_admin` grant.
///
/// The first test here deliberately inverts what this codebase used to assert.
/// `APIConfiguration.default` branched on `targetEnvironment(simulator)` and
/// handed the simulator `.dev`; the whole suite runs in a simulator, so this
/// file is the one place that can hold the new rule honest.
final class ServerConfigurationTests: XCTestCase {
    private var defaults: UserDefaults!
    private var suiteName: String!

    override func setUp() {
        super.setUp()
        // A private suite: `.standard` is shared process state, and a leaked
        // `apiBaseURL` would point the NEXT test's environment somewhere else.
        suiteName = "tapscore.tests.\(UUID().uuidString)"
        defaults = UserDefaults(suiteName: suiteName)
    }

    override func tearDown() {
        defaults.removePersistentDomain(forName: suiteName)
        defaults = nil
        suiteName = nil
        super.tearDown()
    }

    // MARK: - 1. The default

    /// THE POLICY, in one assertion. This test runs in a simulator; under the
    /// old `#if targetEnvironment(simulator)` default it would fail.
    func testDefaultIsProductionEvenInTheSimulator() {
        XCTAssertEqual(
            APIConfiguration.default,
            .production,
            "A fresh install talks to production wherever it runs — simulator included."
        )
        XCTAssertEqual(
            APIConfiguration.default.baseURL.absoluteString,
            "https://app.swedenindoorgolf.se/tapscore/api"
        )
    }

    func testResolvedWithNoOverrideIsProduction() {
        XCTAssertEqual(APIConfiguration.resolved(defaults: defaults), .production)
    }

    // MARK: - 2. The override still wins

    func testOverrideBeatsTheProductionDefault() {
        defaults.set("http://localhost:3030/api", forKey: APIConfiguration.overrideDefaultsKey)

        let resolved = APIConfiguration.resolved(defaults: defaults)

        XCTAssertEqual(resolved.baseURL.absoluteString, "http://localhost:3030/api")
        XCTAssertEqual(
            resolved.webOrigin.absoluteString,
            "http://localhost:3030",
            "The trailing /api comes off to give share links their origin."
        )
    }

    /// The launch argument and the settings screen are the same key by
    /// construction, not by coincidence.
    func testTheLaunchArgumentAndTheSettingsScreenShareOneKey() {
        XCTAssertEqual(APIConfiguration.overrideDefaultsKey, "apiBaseURL")
        XCTAssertEqual(ServerOverride.key, APIConfiguration.overrideDefaultsKey)
    }

    func testAnUnparseableOverrideFallsBackToProductionRatherThanCrashing() {
        defaults.set("not a url at all", forKey: APIConfiguration.overrideDefaultsKey)

        XCTAssertEqual(APIConfiguration.resolved(defaults: defaults), .production)
    }

    func testASchemelessOverrideFallsBackToProduction() {
        defaults.set("app.swedenindoorgolf.se/tapscore/api", forKey: APIConfiguration.overrideDefaultsKey)

        XCTAssertEqual(APIConfiguration.resolved(defaults: defaults), .production)
    }

    // MARK: - 3. The validator

    func testHttpsIsAcceptedForAnyHost() throws {
        let configuration = try XCTUnwrap(ServerOverride.validate("https://staging.example/api").success)

        XCTAssertEqual(configuration.baseURL.absoluteString, "https://staging.example/api")
        XCTAssertEqual(configuration.webOrigin.absoluteString, "https://staging.example")
    }

    func testPlaintextHttpIsAllowedForLoopbackOnly() throws {
        for host in ["localhost", "127.0.0.1"] {
            let configuration = try XCTUnwrap(
                ServerOverride.validate("http://\(host):3030/api").success,
                "\(host) is the dev server; plaintext is the point."
            )
            XCTAssertEqual(configuration.baseURL.host, host)
        }
    }

    func testPlaintextHttpIsRefusedForARemoteHost() {
        XCTAssertEqual(
            ServerOverride.validate("http://app.swedenindoorgolf.se/tapscore/api").failure,
            .insecureRemoteHost("app.swedenindoorgolf.se")
        )
    }

    func testASchemeIsRequired() {
        XCTAssertEqual(ServerOverride.validate("app.swedenindoorgolf.se/api").failure, .missingScheme)
    }

    func testAHostIsRequired() {
        XCTAssertEqual(ServerOverride.validate("https:///api").failure, .missingHost)
    }

    func testEmptyIsItsOwnComplaint() {
        XCTAssertEqual(ServerOverride.validate("   ").failure, .empty)
    }

    /// The `/api` suffix is what separates the API base from the web origin
    /// share links are built on — and a URL without it must not have its LAST
    /// path segment eaten.
    func testWebOriginOnlyStripsATrailingApiSegment() throws {
        let withSuffix = try XCTUnwrap(ServerOverride.validate("https://h.example/tapscore/api").success)
        XCTAssertEqual(withSuffix.webOrigin.absoluteString, "https://h.example/tapscore")

        let without = try XCTUnwrap(ServerOverride.validate("https://h.example/tapscore").success)
        XCTAssertEqual(
            without.webOrigin.absoluteString,
            "https://h.example/tapscore",
            "No /api to strip means nothing is stripped."
        )
    }

    /// The "Local dev" preset writes the very string `.dev` is spelled with, so
    /// a build pointed there is INDISTINGUISHABLE from one that resolved `.dev`
    /// directly — no trailing-slash twin of the same origin.
    func testTheLocalDevPresetRoundTripsToTheDevConfiguration() {
        let stored = ServerOverride.store(
            APIConfiguration.dev.baseURL.absoluteString, defaults: defaults)

        XCTAssertEqual(stored.success, .dev)
        XCTAssertEqual(APIConfiguration.resolved(defaults: defaults), .dev)
    }

    func testTheProductionPresetRoundTripsToTheProductionConfiguration() {
        let stored = ServerOverride.store(
            APIConfiguration.production.baseURL.absoluteString, defaults: defaults)

        XCTAssertEqual(stored.success, .production)
        XCTAssertEqual(APIConfiguration.resolved(defaults: defaults), .production)
    }

    func testSurroundingWhitespaceIsForgiven() throws {
        let configuration = try XCTUnwrap(
            ServerOverride.validate("  https://h.example/api \n ").success
        )
        XCTAssertEqual(configuration.baseURL.absoluteString, "https://h.example/api")
    }

    // MARK: - 4. Write-through and reset

    func testStoringAValidURLWritesTheOverrideKey() {
        let result = ServerOverride.store("http://localhost:3030/api", defaults: defaults)

        XCTAssertNotNil(result.success)
        XCTAssertEqual(defaults.string(forKey: "apiBaseURL"), "http://localhost:3030/api")
        XCTAssertEqual(
            APIConfiguration.resolved(defaults: defaults).baseURL.absoluteString,
            "http://localhost:3030/api",
            "What the screen wrote is what the next launch resolves."
        )
    }

    func testStoringARejectedURLLeavesTheExistingOverrideAlone() {
        ServerOverride.store("http://localhost:3030/api", defaults: defaults)

        let result = ServerOverride.store("http://evil.example/api", defaults: defaults)

        XCTAssertEqual(result.failure, .insecureRemoteHost("evil.example"))
        XCTAssertEqual(
            defaults.string(forKey: "apiBaseURL"),
            "http://localhost:3030/api",
            "A refused URL must not half-apply and strand the build nowhere."
        )
    }

    func testResetClearsTheOverrideBackToProduction() {
        ServerOverride.store("http://localhost:3030/api", defaults: defaults)

        ServerOverride.reset(defaults: defaults)

        XCTAssertNil(ServerOverride.current(defaults: defaults))
        XCTAssertEqual(APIConfiguration.resolved(defaults: defaults), .production)
    }

    // MARK: - 5. The role gate

    private static let meJSON = Data(
        #"{"id":"p9","username":"marcus","displayName":"Marcus Andersson"}"#.utf8
    )

    private static let superAdminGrants = Data(
        #"[{"id":"g1","playerId":"p9","role":"super_admin","scopeType":null,"scopeId":null,"grantedAt":"2026-01-01T00:00:00.000Z"}]"#.utf8
    )

    private static let ordinaryGrants = Data(
        #"[{"id":"g2","playerId":"p9","role":"friendly_round_owner","scopeType":"round","scopeId":"r1","grantedAt":"2026-01-01T00:00:00.000Z"}]"#.utf8
    )

    @MainActor
    private func signedInEnvironment(
        rolesStatus: Int,
        rolesBody: Data
    ) async -> (AppEnvironment, Keychain) {
        StubURLProtocol.reset(status: 200, body: Self.meJSON)
        StubURLProtocol.stub(path: "/me/roles", status: rolesStatus, body: rolesBody)
        let configuration = URLSessionConfiguration.ephemeral
        configuration.protocolClasses = [StubURLProtocol.self]
        let session = URLSession(configuration: configuration)
        let keychain = Keychain(service: "com.marcusandersson.tapscore.tests.\(UUID().uuidString)")
        XCTAssertTrue(keychain.saveToken("bearer-abc"))
        let environment = AppEnvironment(configuration: .dev, keychain: keychain, session: session)
        await environment.bootstrap()
        return (environment, keychain)
    }

    @MainActor
    func testSuperAdminGrantMakesTheServerRowVisible() async {
        let (environment, keychain) = await signedInEnvironment(
            rolesStatus: 200, rolesBody: Self.superAdminGrants)
        defer { keychain.clear() }

        XCTAssertFalse(environment.isSuperAdmin, "Nothing is assumed before the probe runs.")

        await environment.probeRolesIfNeeded()

        XCTAssertTrue(environment.isSuperAdmin)
        XCTAssertEqual(
            StubURLProtocol.requests.last?.url?.absoluteString,
            "http://localhost:3030/api/me/roles",
            "The probe goes through the generated Admin descriptor and the one transport."
        )
    }

    @MainActor
    func testAGrantThatIsNotSuperAdminLeavesTheRowHidden() async {
        let (environment, keychain) = await signedInEnvironment(
            rolesStatus: 200, rolesBody: Self.ordinaryGrants)
        defer { keychain.clear() }

        await environment.probeRolesIfNeeded()

        XCTAssertFalse(environment.isSuperAdmin)
    }

    @MainActor
    func testNoGrantsAtAllLeavesTheRowHidden() async {
        let (environment, keychain) = await signedInEnvironment(
            rolesStatus: 200, rolesBody: Data("[]".utf8))
        defer { keychain.clear() }

        await environment.probeRolesIfNeeded()

        XCTAssertFalse(environment.isSuperAdmin)
    }

    /// Every failure is the same failure: not a super admin, silently.
    @MainActor
    func testEveryProbeFailureIsTreatedAsNotSuperAdmin() async {
        for (status, body) in [
            (401, Data(#"{"error":"bearer_token_required"}"#.utf8)),
            (403, Data(#"{"error":"forbidden"}"#.utf8)),
            (500, Data(#"{"error":"boom"}"#.utf8)),
            (200, Data(#"{"not":"an array"}"#.utf8)),
        ] {
            let (environment, keychain) = await signedInEnvironment(
                rolesStatus: status, rolesBody: body)
            defer { keychain.clear() }

            await environment.probeRolesIfNeeded()

            XCTAssertFalse(
                environment.isSuperAdmin,
                "A \(status) must hide the row, not surface an error."
            )
        }
    }

    /// A failed probe is NOT retried — the account inset's `.task` can fire
    /// again on every appearance, and a 403 that re-asks is a retry storm.
    @MainActor
    func testTheProbeRunsOncePerSessionEvenAfterFailing() async {
        let (environment, keychain) = await signedInEnvironment(
            rolesStatus: 403, rolesBody: Data(#"{"error":"forbidden"}"#.utf8))
        defer { keychain.clear() }
        let before = StubURLProtocol.requests.count

        await environment.probeRolesIfNeeded()
        await environment.probeRolesIfNeeded()
        await environment.probeRolesIfNeeded()

        XCTAssertEqual(
            StubURLProtocol.requests.count - before,
            1,
            "One probe per session, failure included."
        )
    }

    /// Anonymous never asks: `/me/roles` requires a bearer, and a request that
    /// is guaranteed to 401 is not worth making.
    @MainActor
    func testAnAnonymousSessionNeverProbes() async {
        StubURLProtocol.reset(status: 200, body: Data("[]".utf8))
        let configuration = URLSessionConfiguration.ephemeral
        configuration.protocolClasses = [StubURLProtocol.self]
        let keychain = Keychain(service: "com.marcusandersson.tapscore.tests.\(UUID().uuidString)")
        defer { keychain.clear() }
        let environment = AppEnvironment(
            configuration: .dev,
            keychain: keychain,
            session: URLSession(configuration: configuration)
        )
        await environment.bootstrap()

        await environment.probeRolesIfNeeded()

        XCTAssertFalse(environment.isSuperAdmin)
        XCTAssertTrue(StubURLProtocol.requests.isEmpty, "No token, no probe.")
    }

    @MainActor
    func testSignOutForgetsTheGrantAndRearmsTheProbe() async {
        let (environment, keychain) = await signedInEnvironment(
            rolesStatus: 200, rolesBody: Self.superAdminGrants)
        defer { keychain.clear() }
        await environment.probeRolesIfNeeded()
        XCTAssertTrue(environment.isSuperAdmin)

        await environment.signOut()

        XCTAssertFalse(
            environment.isSuperAdmin,
            "The grant belonged to the player who just left."
        )
    }
}

// MARK: - Result sugar

private extension Result where Success == APIConfiguration, Failure == ServerOverride.ValidationError {
    var success: APIConfiguration? {
        if case let .success(value) = self { return value }
        return nil
    }

    var failure: ServerOverride.ValidationError? {
        if case let .failure(error) = self { return error }
        return nil
    }
}
