import XCTest
@testable import TapScore

/// Who gets the operator entry point, end to end: the `/me/roles` payload the
/// server actually sends → `AppEnvironment.isSuperAdmin` → the rows the account
/// inset draws.
///
/// The payloads mirror `server/api/admin.routes.test.ts`
/// ("`/me/roles` needs only a session — it is caller-scoped": `[]` for a plain
/// player, one unscoped `super_admin` grant for an operator) and the generated
/// `RoleGrant` shape.
///
/// The rule under test is **absent, not disabled**: a non-admin has no Admin
/// row at all, in every failure direction — no grant, a 403, an unreachable
/// server, a body this build cannot decode.
final class AdminEntryTests: XCTestCase {
    private var session: URLSession!
    private var keychain: Keychain!

    override func setUp() {
        super.setUp()
        StubURLProtocol.reset(status: 200, body: Data("[]".utf8))
        let configuration = URLSessionConfiguration.ephemeral
        configuration.protocolClasses = [StubURLProtocol.self]
        session = URLSession(configuration: configuration)
        keychain = Keychain(service: "com.marcusandersson.tapscore.tests.\(UUID().uuidString)")
    }

    override func tearDown() {
        keychain.clear()
        keychain = nil
        session.invalidateAndCancel()
        session = nil
        StubURLProtocol.reset(status: 200, body: Data())
        super.tearDown()
    }

    /// An unscoped `super_admin` grant, as `RoleService.listForPlayer` returns it.
    private static let superAdminRoles = Data(
        #"[{"id":"g1","playerId":"p9","role":"super_admin","scopeType":null,"scopeId":null,"grantedAt":"2026-07-01T10:00:00.000Z"}]"#.utf8
    )

    /// A signed-in player who is not an operator — the ordinary case.
    private static let noRoles = Data("[]".utf8)

    /// A grant that is not `super_admin`.
    private static let otherRole = Data(
        #"[{"id":"g2","playerId":"p9","role":"competition_admin","scopeType":"competition","scopeId":"c-1","grantedAt":"2026-07-01T10:00:00.000Z"}]"#.utf8
    )

    /// A `super_admin` row that carries a SCOPE — the shape the server says
    /// cannot exist (`super_admin` is unscoped by construction) and which the
    /// gate must therefore refuse rather than trust. `admin.service.ts` requires
    /// `scopeType === null`; so does this client.
    private static let scopedSuperAdminRole = Data(
        #"[{"id":"g3","playerId":"p9","role":"super_admin","scopeType":"competition","scopeId":"c-1","grantedAt":"2026-07-01T10:00:00.000Z"}]"#.utf8
    )

    /// A signed-in environment whose `/me/roles` probe answers with `body`.
    @MainActor
    private func probed(status: Int, body: Data) async -> AppEnvironment {
        // Sign in first, with the sign-in body — the probe only runs for a
        // signed-in session, which is itself part of the gate.
        StubURLProtocol.reset(
            status: 200,
            body: Data(
                #"{"user":{"id":"p9","username":"marcus","displayName":"Marcus Andersson"},"token":"bearer-abc","created":false}"#.utf8
            )
        )
        let environment = AppEnvironment(configuration: .dev, keychain: keychain, session: session)
        _ = try? await environment.signIn(identityToken: "token", rawNonce: "nonce")

        StubURLProtocol.reset(status: status, body: body)
        await environment.probeRolesIfNeeded()
        return environment
    }

    // MARK: - The gate

    @MainActor
    func testSuperAdminGetsTheAdminAndServerRows() async {
        let environment = await probed(status: 200, body: Self.superAdminRoles)

        XCTAssertTrue(environment.isSuperAdmin)
        let rows = AccountInsetRows(isSuperAdmin: environment.isSuperAdmin)
        XCTAssertTrue(rows.showsAdmin)
        XCTAssertTrue(rows.showsServer, "Both operator rows answer to the same grant.")
    }

    @MainActor
    func testOrdinaryPlayerNeverGetsTheAdminRow() async {
        for body in [Self.noRoles, Self.otherRole] {
            let environment = await probed(status: 200, body: body)
            XCTAssertFalse(environment.isSuperAdmin)
            XCTAssertFalse(AccountInsetRows(isSuperAdmin: environment.isSuperAdmin).showsAdmin)
        }
    }

    /// The gate is `role == super_admin` AND `scopeType == nil`, matching
    /// `src/admin/admin.service.ts` and `server/api/admin-authz.ts`. A scoped
    /// `super_admin` row is not a grant this client will act on — matching the
    /// role alone would open an entry point the server refuses per request,
    /// turning a shape that should not exist into a 403 behind a visible row.
    @MainActor
    func testScopedSuperAdminGrantIsNotTheUnscopedOne() async {
        let environment = await probed(status: 200, body: Self.scopedSuperAdminRole)

        XCTAssertFalse(
            environment.isSuperAdmin,
            "super_admin is unscoped by construction; a scoped row is not the global grant."
        )
        let rows = AccountInsetRows(isSuperAdmin: environment.isSuperAdmin)
        XCTAssertFalse(rows.showsAdmin)
        XCTAssertFalse(rows.showsServer)
    }

    /// Every failure direction means "not an admin", silently — a 403 from the
    /// probe, a server that is not there, and a body that does not decode.
    @MainActor
    func testEveryProbeFailureHidesTheAdminRow() async {
        let failures: [(Int, Data)] = [
            (403, Data(#"{"error":"forbidden"}"#.utf8)),
            (401, Data(#"{"error":"nope"}"#.utf8)),
            (500, Data(#"{"error":"boom"}"#.utf8)),
            (200, Data(#"{"not":"an array"}"#.utf8)),
        ]
        for (status, body) in failures {
            let environment = await probed(status: status, body: body)
            XCTAssertFalse(
                AccountInsetRows(isSuperAdmin: environment.isSuperAdmin).showsAdmin,
                "HTTP \(status) must leave the Admin row absent."
            )
        }
    }

    @MainActor
    func testRowsAreAbsentWhenNothingIsKnownYet() {
        // The default before any probe: unknown reads as "not an admin".
        let rows = AccountInsetRows(isSuperAdmin: false)
        XCTAssertFalse(rows.showsAdmin)
        XCTAssertFalse(rows.showsServer)
    }

    // MARK: - The identity framing

    /// The inset's whole purpose is answering "WHICH account is this?", so the
    /// line says so out loud — visually and to VoiceOver. Without the framing a
    /// bare name reads as a heading or a greeting, which is the ambiguity the
    /// fork notice exists to resolve.
    @MainActor
    func testIdentityRowIsFramedAsWhoIsSignedIn() {
        let player = Player(
            id: "p9",
            username: "marcus",
            displayName: "Marcus Andersson"
        )

        XCTAssertEqual(
            AccountInsetView.identityAccessibilityLabel(player),
            "Signed in as Marcus Andersson, username marcus",
            "The label names the framing and spells out the username."
        )
    }
}
