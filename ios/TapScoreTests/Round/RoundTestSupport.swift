import Foundation
@testable import TapScore

// MARK: - Routing stub

/// A `URLProtocol` that answers per PATH rather than with one canned body.
///
/// The round screen talks to five endpoints in one load, so the sync tests'
/// single-response stub cannot express "byToken succeeds, balls 500s" — which is
/// exactly the case the non-fatal load path exists for. Routes are matched by
/// path suffix, and every request is logged in order so a test can assert what
/// the store asked for (notably: whether a `cursor` rode along).
final class RoundStubURLProtocol: URLProtocol {
    struct Recorded: Sendable {
        let path: String
        /// The raw query string, so a test can prove a `cursor` did (or did not)
        /// ride along — the fact `path` alone cannot show.
        let query: String?
        let method: String
        let body: Data?

        var json: [String: Any]? {
            body.flatMap { try? JSONSerialization.jsonObject(with: $0) as? [String: Any] }
        }
    }

    /// One scripted reply. A route with several responses hands them out in
    /// order and repeats the last one forever — so "first result full, every
    /// later result unchanged" is one line.
    struct Route: Sendable {
        var status: Int
        var bodies: [Data]
    }

    private static let lock = NSLock()
    nonisolated(unsafe) private static var routes: [String: Route] = [:]
    nonisolated(unsafe) private static var hits: [String: Int] = [:]
    nonisolated(unsafe) private static var recorded: [Recorded] = []
    /// Blocks the response until released — lets a test hold request A open,
    /// let request B finish, and then release A to prove the seq guard drops it.
    nonisolated(unsafe) private static var gates: [String: DispatchSemaphore] = [:]

    static func reset() {
        lock.lock()
        defer { lock.unlock() }
        routes = [:]
        hits = [:]
        recorded = []
        gates = [:]
    }

    /// Route a path suffix to a JSON string (or several, consumed in order).
    static func route(_ path: String, status: Int = 200, _ bodies: String...) {
        lock.lock()
        defer { lock.unlock() }
        routes[path] = Route(status: status, bodies: bodies.map { Data($0.utf8) })
    }

    /// Hold this path's responses until `release(_:)`.
    static func gate(_ path: String) -> DispatchSemaphore {
        let semaphore = DispatchSemaphore(value: 0)
        lock.lock()
        gates[path] = semaphore
        lock.unlock()
        return semaphore
    }

    static var requests: [Recorded] {
        lock.lock()
        defer { lock.unlock() }
        return recorded
    }

    static func requests(for path: String) -> [Recorded] {
        requests.filter { $0.path.hasSuffix(path) }
    }

    private static func resolve(_ request: Recorded) -> (Int, Data, DispatchSemaphore?) {
        lock.lock()
        recorded.append(request)
        let key = routes.keys.first { request.path.hasSuffix($0) }
        let gate = key.flatMap { gates[$0] }
        guard let key, let route = routes[key] else {
            lock.unlock()
            return (404, Data("{\"error\":\"no route\"}".utf8), nil)
        }
        let index = min(hits[key] ?? 0, route.bodies.count - 1)
        hits[key] = (hits[key] ?? 0) + 1
        let body = route.bodies.isEmpty ? Data() : route.bodies[index]
        lock.unlock()
        return (route.status, body, gate)
    }

    private static func bodyData(of request: URLRequest) -> Data? {
        if let body = request.httpBody { return body }
        guard let stream = request.httpBodyStream else { return nil }
        stream.open()
        defer { stream.close() }
        var data = Data()
        var buffer = [UInt8](repeating: 0, count: 4096)
        while stream.hasBytesAvailable {
            let read = stream.read(&buffer, maxLength: 4096)
            if read <= 0 { break }
            data.append(contentsOf: buffer[0..<read])
        }
        return data
    }

    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }

    override func startLoading() {
        let recorded = Recorded(
            path: request.url?.path ?? "",
            query: request.url?.query,
            method: request.httpMethod ?? "GET",
            body: Self.bodyData(of: request)
        )
        let (status, body, gate) = Self.resolve(recorded)
        let url = request.url!
        let finish = { [weak self] in
            guard let self else { return }
            let response = HTTPURLResponse(
                url: url,
                statusCode: status,
                httpVersion: "HTTP/1.1",
                headerFields: ["Content-Type": "application/json"]
            )!
            self.client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
            self.client?.urlProtocol(self, didLoad: body)
            self.client?.urlProtocolDidFinishLoading(self)
        }
        // A gated response waits on a BACKGROUND queue, never here: URLSession
        // runs `startLoading` on a shared worker, so blocking it would stall
        // every other request in the session — including the one the test is
        // waiting for to overtake this one.
        if let gate {
            DispatchQueue.global().async {
                gate.wait()
                finish()
            }
        } else {
            finish()
        }
    }

    override func stopLoading() {}

    /// A `TapScoreAPI` wired to this stub.
    static func makeAPI() -> TapScoreAPI {
        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [RoundStubURLProtocol.self]
        return TapScoreAPI(
            configuration: APIConfiguration(
                baseURL: URL(string: "https://stub.test/api")!,
                webOrigin: URL(string: "https://stub.test")!
            ),
            session: URLSession(configuration: config)
        )
    }
}

// MARK: - Fake live feed

/// A `LiveResultFeeding` the test drives by hand — no socket, no reconnect
/// timing, no `SSEClient`. Every lifecycle call is recorded so the gate's
/// start/suspend/resume/stop contract is assertable.
actor FakeLiveFeed: LiveResultFeeding {
    enum Call: Sendable, Equatable {
        case start(token: String, since: String?)
        case suspend
        case resume
        case stop
    }

    private(set) var calls: [Call] = []
    private var continuation: AsyncStream<LiveResultFeed.Update>.Continuation?

    func start(token: String, since: String?) async -> AsyncStream<LiveResultFeed.Update> {
        calls.append(.start(token: token, since: since))
        let (stream, continuation) = AsyncStream<LiveResultFeed.Update>.makeStream(
            bufferingPolicy: .unbounded)
        self.continuation = continuation
        return stream
    }

    func suspend() async { calls.append(.suspend) }
    func resume() { calls.append(.resume) }

    func stop() async {
        calls.append(.stop)
        continuation?.finish()
        continuation = nil
    }

    /// Push one update into the live stream.
    func push(_ update: LiveResultFeed.Update) {
        continuation?.yield(update)
    }

    var started: Bool { calls.contains { if case .start = $0 { return true }; return false } }
}

// MARK: - Controllable clock

/// A `Sleeper` whose sleeps only finish when the test says so.
///
/// Timing contracts (the 700 ms advance pause, the 20 s fallback poll) are
/// asserted by *releasing* a sleep, never by waiting for one — a test that
/// slept for real would be slow and flaky, and would prove nothing about the
/// duration that was requested. The requested durations are recorded instead.
final class TestClock: @unchecked Sendable {
    private let lock = NSLock()
    private var waiters: [CheckedContinuation<Void, any Error>] = []
    private var requested: [Duration] = []

    var sleeper: SSEClient.Sleeper {
        { [self] duration in
            try await withCheckedThrowingContinuation { continuation in
                lock.lock()
                requested.append(duration)
                waiters.append(continuation)
                lock.unlock()
            }
        }
    }

    var durations: [Duration] {
        lock.lock()
        defer { lock.unlock() }
        return requested
    }

    var pendingCount: Int {
        lock.lock()
        defer { lock.unlock() }
        return waiters.count
    }

    /// Let every currently-sleeping caller through.
    func fire() {
        lock.lock()
        let pending = waiters
        waiters = []
        lock.unlock()
        for waiter in pending { waiter.resume() }
    }

    /// Cancel every sleeping caller (what task cancellation would do).
    func cancelAll() {
        lock.lock()
        let pending = waiters
        waiters = []
        lock.unlock()
        for waiter in pending { waiter.resume(throwing: CancellationError()) }
    }
}

// MARK: - Fixtures

/// JSON fixtures shaped exactly like the server's, built by hand so a contract
/// drift shows up as a decode failure in these tests rather than in production.
enum RoundFixtures {
    static let token = "tok-1"
    static let roundId = "round-1"

    /// `baseStrokeIndex` is the hole NUMBER, so `ph-1` is SI 1 and `ph-2` is
    /// SI 2 — the handicap-hint tests read strokes off that.
    ///
    /// - Parameter teeStrokeIndex: when set, the hole also carries a "Yellow"
    ///   tee whose (already effective, override → base) stroke index is this.
    ///   A ball whose first producer plays that tee must allocate off it and
    ///   not off `baseStrokeIndex`.
    static func playHole(
        _ id: String, ordinal: Int, number: Int, par: Int, teeStrokeIndex: Int? = nil
    ) -> String {
        let tees =
            teeStrokeIndex.map {
                """
                [{"teeRef":"tee-yellow","teeName":"Yellow","lengthM":300,"strokeIndex":\($0)}]
                """
            } ?? "[]"
        return """
        {"id":"\(id)","playHoleDefId":"def-\(id)","ordinal":\(ordinal),
         "courseHoleNumber":\(number),"par":\(par),"baseStrokeIndex":\(number),"tees":\(tees)}
        """
    }

    /// A two-hole, two-ball round — the smallest shape that exercises both
    /// ball-to-ball advance and hole-to-hole advance.
    ///
    /// - Parameter reversedOrder: keeps the same play holes but reverses the
    ///   group's `playedOrder`, so the hole sitting at index 0 changes without
    ///   the client doing anything. That is the itinerary-changed-under-you
    ///   case the pending jump's fire-time `fromHoleId` check exists for, and a
    ///   reload is the one path that reaches it without cancelling the jump.
    static func byToken(
        status: String = "active",
        holes: Int = 2,
        reversedOrder: Bool = false,
        par: Int = 4,
        teeStrokeIndex: Int? = nil
    ) -> String {
        let playHoles = (1...holes)
            .map {
                playHole(
                    "ph-\($0)", ordinal: $0, number: $0, par: par, teeStrokeIndex: teeStrokeIndex)
            }
            .joined(separator: ",")
        let order = reversedOrder ? Array((1...holes).reversed()) : Array(1...holes)
        let played = order
            .map {
                """
                {"playHoleId":"ph-\($0)","ordinal":\($0),"courseHoleNumber":\($0),
                 "groupRelativeOrder":\($0)}
                """
            }
            .joined(separator: ",")
        return """
        {"friendlyRound":{"id":"fr-1","roundId":"\(roundId)","shareToken":"\(token)",
          "creatorPlayerId":null,"createdAt":"2026-07-27T09:00:00.000Z"},
         "round":{"id":"\(roundId)","courseId":"course-1","date":"2026-07-27",
          "roundType":"full_18","venueType":"outdoor","startListMode":"open_window",
          "windowStart":null,"windowEnd":null,"selfOrganize":true,"status":"\(status)",
          "latestEventId":null,"courseNameSnapshot":"Test GK","completedAt":null,
          "formatSlots":[{"slotIndex":0,"slotDefId":"slot-0","formatId":"stableford_individual",
            "scoringMode":"stableford","teamShape":"individual","allowancePct":100,
            "allowanceConfig":{"type":"flat","pct":100},"formatConfig":null,
            "ballMode":"own"}],
          "playHoles":[\(playHoles)],
          "routeSi":{"mode":"official","sourceLabel":null,"sourceVersion":null,
            "allocationCycleSize":18},
          "routeHandicapPolicy":{"type":"official_route","postingEligible":true,
            "postingIneligibleReason":null},
          "routeSections":[{"id":"sec-1","label":"Out","fromCanonicalOrdinal":1,
            "toCanonicalOrdinal":\(holes)}],
          "playingGroups":[{"id":"grp-1","startTime":"2026-07-27","capacity":4,
            "hittingBay":null,"startPlayHoleId":"ph-1","startOrdinal":1,
            "endPlayHoleId":"ph-\(holes)","endOrdinal":\(holes),
            "ballIds":["ball-1","ball-2"],"playedOrder":[\(played)]}]},
         "startList":\(startList)}
        """
    }

    static let startList = """
    {"policy":{"groups":"open","seats":"assigned","claimBy":"anyone"},"presetId":null,
     "viewer":{"join":{"allowed":false,"code":"login_required","message":"Log in."},
       "createGroup":{"allowed":false,"code":"login_required","message":"Log in."},
       "claimSeat":{"allowed":false,"code":"seats_assigned","message":"Assigned."},
       "claimSeatAsGuest":{"allowed":false,"code":"seats_assigned","message":"Assigned."},
       "maxGroupSize":4},
     "seats":[],"claimedSeats":[]}
    """

    /// Two balls. `secondPending` turns the second into a still-unclaimed
    /// placeholder seat, which is the case the non-scoreable rules exist for.
    ///
    /// - Parameters:
    ///   - playingHandicap: seats a `slot-0` entry carrying this PH on BOTH
    ///     balls. Absent by default — a round with no PH shows no handicap hint
    ///     at all, and that is the shape most of these tests want.
    ///   - teeName: the first producer's tee, which is what resolves a hole's
    ///     effective stroke index.
    static func balls(
        secondPending: Bool = false,
        playingHandicap: Double? = nil,
        teeName: String? = nil
    ) -> String {
        let slots =
            playingHandicap.map {
                """
                [{"slotDefId":"slot-0","slotIndex":0,"playingHandicap":\($0),"teamLabel":null}]
                """
            } ?? "[]"
        let tee = teeName.map { "\"\($0)\"" } ?? "null"
        return """
        [{"id":"ball-1","label":"Ada","courseHandicap":10,
          "players":[{"producerDefId":"p1","playerId":"p-1","guestPlayerId":null,
            "displayName":"Ada","handicapIndex":10,"teeName":\(tee),"courseHandicap":10,
            "pending":false}],
          "slots":\(slots),"pending":false},
         {"id":"ball-2","label":"Bo","courseHandicap":null,
          "players":[{"producerDefId":"p2","playerId":null,"guestPlayerId":"g-2",
            "displayName":"Bo","handicapIndex":null,"teeName":\(tee),"courseHandicap":null,
            "pending":\(secondPending)}],
          "slots":\(slots),"pending":\(secondPending)}]
        """
    }

    static let emptyScorecards = "[]"

    /// A scorecard with one recorded hole, for the "loaded value shows through
    /// when no optimistic overlay exists" case.
    static func scorecards(ballId: String, playHoleId: String, strokes: Int) -> String {
        """
        [{"ballId":"\(ballId)","holes":[{"playHoleId":"\(playHoleId)","holeNumber":1,
          "courseHoleNumber":1,"canonicalOrdinal":1,"occurrenceLabel":"1",
          "strokes":\(strokes),"recordedBy":null,"recordedAt":"2026-07-27T09:05:00.000Z",
          "sourcePlayerId":null,"sourceGuestPlayerId":null,"metadata":null}]}]
        """
    }

    /// Both balls scored on `ph-1`. Lets a test tell a jump that LANDED from one
    /// that was abandoned even when the resulting hole index is the same: only a
    /// landing re-runs `noteHoleEntered`, which on this card flips
    /// `holeCompleteOnEntry` to true.
    static let scorecardsBothOnFirstHole = """
    [{"ballId":"ball-1","holes":[{"playHoleId":"ph-1","holeNumber":1,
      "courseHoleNumber":1,"canonicalOrdinal":1,"occurrenceLabel":"1",
      "strokes":4,"recordedBy":null,"recordedAt":"2026-07-27T09:05:00.000Z",
      "sourcePlayerId":null,"sourceGuestPlayerId":null,"metadata":null}]},
     {"ballId":"ball-2","holes":[{"playHoleId":"ph-1","holeNumber":1,
      "courseHoleNumber":1,"canonicalOrdinal":1,"occurrenceLabel":"1",
      "strokes":5,"recordedBy":null,"recordedAt":"2026-07-27T09:05:00.000Z",
      "sourcePlayerId":null,"sourceGuestPlayerId":null,"metadata":null}]}]
    """

    static func result(cursor: String?, total: Int = 4) -> String {
        let cursorJSON = cursor.map { "\"\($0)\"" } ?? "null"
        return """
        {"unchanged":false,"cursor":\(cursorJSON),
         "result":{"slots":[{"slotIndex":0,"slotDefId":"slot-0",
           "formatId":"stableford_individual","formatLabel":"Stableford",
           "scoringMode":"stableford","teamShape":"individual","allowanceLabel":"100%",
           "cards":[],
           "leaderboard":[{"kind":"ranked","metricId":"points","metricLabel":"Points",
             "direction":"high",
             "entries":[{"ballIds":["ball-1"],"total":\(total),"holesPlayed":1,
               "paceDelta":0,"position":1}]}],
           "subjectLabels":null}],
          "routeSections":[{"id":"sec-1","label":"Out","fromCanonicalOrdinal":1,
            "toCanonicalOrdinal":2}],
          "posting":{"eligible":false,"reason":null}}}
        """
    }

    static func unchanged(cursor: String?) -> String {
        let cursorJSON = cursor.map { "\"\($0)\"" } ?? "null"
        return "{\"unchanged\":true,\"cursor\":\(cursorJSON)}"
    }

    static let appendResult = """
    {"event":{"id":"ev-1","roundId":"\(roundId)","ballId":"ball-1","playHoleId":"ph-1",
      "strokes":4,"eventType":"score_entered","recordedByPlayerId":null,
      "recordedAt":"2026-07-27T09:05:00.000Z","clientEventId":"c-1",
      "sourcePlayerId":null,"sourceGuestPlayerId":null,"metadata":null},
     "inserted":true}
    """

    /// A format declaring a boolean metadata input on par-4-and-up holes, so the
    /// stats step and `appliesWhen` filtering are both exercised.
    static let formatsWithStats = """
    [{"id":"stableford_individual","label":"Stableford",
      "labels":{"en":"Stableford","sv":null},
      "description":"","scoringMode":"stableford","teamShape":"individual",
      "requirements":{"balls":{"producerCount":{"min":1,"max":4},"ballMode":"own"},
        "scoreEntry":{"strokes":true,
          "metadata":[{"key":"gir","label":"GIR","kind":"boolean",
            "appliesWhen":{"minPar":4}}]}},
      "defaults":{"allowanceConfig":{"type":"flat","pct":100},"formatConfig":null},
      "metrics":[]}]
    """

    static let formatsPlain = """
    [{"id":"stableford_individual","label":"Stableford",
      "labels":{"en":"Stableford","sv":null},
      "description":"","scoringMode":"stableford","teamShape":"individual",
      "requirements":{"balls":{"producerCount":{"min":1,"max":4},"ballMode":"own"}},
      "defaults":{"allowanceConfig":{"type":"flat","pct":100},"formatConfig":null},
      "metrics":[]}]
    """
}
