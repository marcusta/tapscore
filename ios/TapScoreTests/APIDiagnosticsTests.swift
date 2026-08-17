import XCTest
@testable import TapScore

/// Pins the failure log behind the Diagnostics screen:
///
/// 1. **The transport records what it throws, verbatim.** The player-facing
///    surfaces flatten every failure into "Couldn't reach the server"; the log
///    is the only place the mechanism survives, so an entry that disagrees
///    with the thrown error would defeat the screen's whole reason to exist.
/// 2. **The detail is the technical spelling, not the user copy.**
///    `errorDescription` says "Can't reach the server" — the log must not.
/// 3. **The ring stays bounded and newest-first.**
final class APIDiagnosticsTests: XCTestCase {
    private var session: URLSession!

    override func setUp() {
        super.setUp()
        StubURLProtocol.reset(status: 200, body: Data())
        let configuration = URLSessionConfiguration.ephemeral
        configuration.protocolClasses = [StubURLProtocol.self]
        session = URLSession(configuration: configuration)
    }

    override func tearDown() {
        session.invalidateAndCancel()
        session = nil
        StubURLProtocol.reset(status: 200, body: Data())
        super.tearDown()
    }

    // MARK: - 1. Transport recording

    func testServerErrorLandsInTheLogWithStatusAndMessage() async {
        StubURLProtocol.reset(status: 500, body: Data(#"{"error":"boom"}"#.utf8))
        let diagnostics = APIDiagnostics()
        let api = TapScoreAPI(configuration: .production, session: session, diagnostics: diagnostics)

        _ = try? await api.me()

        let failures = diagnostics.snapshot()
        XCTAssertEqual(failures.count, 1)
        XCTAssertEqual(failures.first?.method, "GET")
        XCTAssertEqual(failures.first?.path, "players/me")
        XCTAssertEqual(failures.first?.detail, "HTTP 500: boom")
    }

    func testDecodeFailureNamesTheModelAndTheMissingKey() async {
        // 200 with a body the Player model cannot decode — the data-dependent
        // failure mode the screen exists to catch.
        StubURLProtocol.reset(status: 200, body: Data(#"{"id":"p1"}"#.utf8))
        let diagnostics = APIDiagnostics()
        let api = TapScoreAPI(configuration: .production, session: session, diagnostics: diagnostics)

        _ = try? await api.me()

        let failures = diagnostics.snapshot()
        XCTAssertEqual(failures.count, 1)
        XCTAssertTrue(
            failures.first?.detail.hasPrefix("decoding: Player") == true,
            "Expected the model name in \(failures.first?.detail ?? "nil")"
        )
        XCTAssertTrue(
            failures.first?.detail.contains("username") == true,
            "The missing key is the diagnosis — it must survive into the entry."
        )
    }

    func testUnauthorizedIsRecordedAsA401NotAsUserCopy() async {
        StubURLProtocol.reset(status: 401, body: Data())
        let diagnostics = APIDiagnostics()
        let api = TapScoreAPI(configuration: .production, session: session, diagnostics: diagnostics)

        _ = try? await api.me()

        XCTAssertEqual(diagnostics.snapshot().first?.detail, "unauthorized (HTTP 401)")
    }

    // MARK: - 2. Detail spellings

    func testDetailSpellsEveryCaseTechnically() {
        XCTAssertEqual(
            APIDiagnostics.detail(.network("timed out")),
            "network: timed out",
            "Not the user-facing 'Can't reach the server' sentence."
        )
        XCTAssertEqual(APIDiagnostics.detail(.server(code: 502, message: nil)), "HTTP 502")
        XCTAssertEqual(APIDiagnostics.detail(.decoding("X: keyNotFound")), "decoding: X: keyNotFound")
    }

    // MARK: - 3. Ring behaviour

    func testRingKeepsTheNewestFiftyNewestFirst() {
        let diagnostics = APIDiagnostics()
        for index in 1...60 {
            diagnostics.record(method: "GET", path: "call/\(index)", error: .server(code: 500, message: nil))
        }

        let failures = diagnostics.snapshot()
        XCTAssertEqual(failures.count, 50)
        XCTAssertEqual(failures.first?.path, "call/60", "Newest first — the failure being chased is the last one.")
        XCTAssertEqual(failures.last?.path, "call/11")
    }

    func testClearEmptiesTheRing() {
        let diagnostics = APIDiagnostics()
        diagnostics.record(method: "GET", path: "x", error: .unauthorized)
        diagnostics.clear()
        XCTAssertTrue(diagnostics.snapshot().isEmpty)
    }

    // MARK: - Pasteboard form

    func testReportCarriesTimestampPathAndDetail() {
        let failure = APIFailure(
            date: Date(timeIntervalSince1970: 0),
            method: "GET",
            path: "dashboard/my-rounds",
            detail: "HTTP 500: boom"
        )
        let report = DiagnosticsView.report([failure])
        XCTAssertTrue(report.contains("GET /dashboard/my-rounds"))
        XCTAssertTrue(report.contains("HTTP 500: boom"))
        XCTAssertTrue(report.contains("1970-01-01"), "ISO timestamp, so a pasted report is orderable.")
    }
}
