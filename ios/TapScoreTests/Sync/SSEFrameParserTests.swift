import XCTest
@testable import TapScore

/// Pins the SSE framing against the exact wire
/// `server/api/friendly-rounds-events.ts` produces: single-line JSON `data:`,
/// an `id:` carrying the cursor, and `: keep-alive` comments in between.
///
/// The chunking tests are the point of the whole design. `URLSession.bytes`
/// hands over whatever the socket produced and a proxy may re-chunk anywhere,
/// so the parser is fed the same stream at every byte boundary and must
/// produce identical frames.
final class SSEFrameParserTests: XCTestCase {
    private func frames(of stream: String, chunkSize: Int) -> [SSEFrame] {
        var parser = SSEFrameParser()
        var out: [SSEFrame] = []
        let bytes = Array(stream.utf8)
        var index = 0
        while index < bytes.count {
            let end = min(index + chunkSize, bytes.count)
            out += parser.consume(Data(bytes[index..<end]))
            index = end
        }
        parser.finish()
        return out
    }

    // MARK: - Field parsing

    func testParsesIdAndDataIntoOneFrame() {
        let stream = "id: evt-1\ndata: {\"latestEventId\":\"evt-1\",\"status\":\"active\"}\n\n"

        let result = frames(of: stream, chunkSize: stream.utf8.count)

        XCTAssertEqual(result.count, 1)
        XCTAssertEqual(result.first?.id, "evt-1")
        XCTAssertEqual(result.first?.data, #"{"latestEventId":"evt-1","status":"active"}"#)
    }

    func testCommentLinesProduceNoFrames() {
        // The heartbeat: `: keep-alive\n\n`. Its blank line must not dispatch
        // an empty event, or every 25 s the round screen sees a phantom frame.
        let result = frames(of: ": keep-alive\n\n: keep-alive\n\n", chunkSize: 3)

        XCTAssertTrue(result.isEmpty)
    }

    func testMalformedLinesAreIgnoredWithoutBreakingTheNextFrame() {
        // A colon-less line, an unknown field, and a `retry:` we do not honour
        // — none of them may swallow the good frame that follows.
        let stream = """
        garbage-with-no-colon
        event: message
        retry: 5000
        id: evt-9
        data: {"latestEventId":"evt-9","status":"complete"}


        """

        let result = frames(of: stream, chunkSize: 1)

        XCTAssertEqual(result.count, 1)
        XCTAssertEqual(result.first?.id, "evt-9")
        XCTAssertEqual(result.first?.data, #"{"latestEventId":"evt-9","status":"complete"}"#)
    }

    func testIdOnlyBlockMovesTheCursorWithoutDispatching() {
        var parser = SSEFrameParser()

        let result = parser.consume(Data("id: evt-5\n\n".utf8))

        XCTAssertTrue(result.isEmpty, "No data means no event…")
        XCTAssertEqual(parser.lastEventId, "evt-5", "…but the reconnect cursor still moved.")
    }

    func testDataFrameWithoutIdInheritsTheLastSeenCursor() {
        var parser = SSEFrameParser()

        _ = parser.consume(Data("id: evt-1\ndata: {\"a\":1}\n\n".utf8))
        let second = parser.consume(Data("data: {\"a\":2}\n\n".utf8))

        XCTAssertEqual(second.first?.id, "evt-1")
    }

    func testMultilineDataIsNewlineJoined() {
        let result = frames(of: "data: one\ndata: two\n\n", chunkSize: 4)

        XCTAssertEqual(result.first?.data, "one\ntwo")
    }

    // MARK: - Chunking

    func testMultipleFramesInOneChunk() {
        let stream = """
        id: a
        data: {"n":1}

        : keep-alive

        id: b
        data: {"n":2}


        """

        let result = frames(of: stream, chunkSize: stream.utf8.count)

        XCTAssertEqual(result.map(\.id), ["a", "b"])
        XCTAssertEqual(result.map(\.data), [#"{"n":1}"#, #"{"n":2}"#])
    }

    func testFramingIsIdenticalAtEveryByteBoundary() {
        let stream = """
        id: a
        data: {"latestEventId":"a","status":"active"}

        : keep-alive

        id: b
        data: {"latestEventId":"b","status":"complete"}


        """
        let expected = frames(of: stream, chunkSize: stream.utf8.count)
        XCTAssertEqual(expected.count, 2, "Precondition: the whole-stream parse.")

        for size in 1...stream.utf8.count {
            XCTAssertEqual(
                frames(of: stream, chunkSize: size),
                expected,
                "Chunk size \(size) changed the framing."
            )
        }
    }

    func testCRLFStreamSplitBetweenCRAndLFStillDispatchesOneFrame() {
        // The nastiest boundary: a chunk that ends on the CR of the blank
        // line's CRLF. Treating the stranded LF as its own line terminator
        // would fabricate a second blank line and split one event in two.
        var parser = SSEFrameParser()

        var result = parser.consume(Data("id: a\r\ndata: {\"n\":1}\r\n\r".utf8))
        result += parser.consume(Data("\n".utf8))

        XCTAssertEqual(result.count, 1)
        XCTAssertEqual(result.first?.data, #"{"n":1}"#)
        XCTAssertEqual(result.first?.id, "a")
    }

    func testTrailingPartialLineIsDiscarded() {
        var parser = SSEFrameParser()

        let result = parser.consume(Data("data: {\"n\":1}".utf8))
        parser.finish()

        XCTAssertTrue(result.isEmpty, "An unterminated frame is not an event.")
    }
}
