// GENERATED — DO NOT EDIT. bun run generate:swift

import Foundation

struct ScoreEventsAppendInput: Codable, Sendable, Equatable {
    var roundId: String
    var ballId: String
    var playHoleId: String
    var strokes: Double?
    var eventType: ScoreEventEventType
    var clientEventId: String
    var sourcePlayerId: TriState<String>
    var sourceGuestPlayerId: TriState<String>
    var metadata: TriState<[String: JSONValue]>

    enum CodingKeys: String, CodingKey {
        case roundId = "roundId"
        case ballId = "ballId"
        case playHoleId = "playHoleId"
        case strokes = "strokes"
        case eventType = "eventType"
        case clientEventId = "clientEventId"
        case sourcePlayerId = "sourcePlayerId"
        case sourceGuestPlayerId = "sourceGuestPlayerId"
        case metadata = "metadata"
    }

    init(roundId: String, ballId: String, playHoleId: String, strokes: Double? = nil, eventType: ScoreEventEventType, clientEventId: String, sourcePlayerId: TriState<String> = .absent, sourceGuestPlayerId: TriState<String> = .absent, metadata: TriState<[String: JSONValue]> = .absent) {
        self.roundId = roundId
        self.ballId = ballId
        self.playHoleId = playHoleId
        self.strokes = strokes
        self.eventType = eventType
        self.clientEventId = clientEventId
        self.sourcePlayerId = sourcePlayerId
        self.sourceGuestPlayerId = sourceGuestPlayerId
        self.metadata = metadata
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.roundId = try c.decode(String.self, forKey: .roundId)
        self.ballId = try c.decode(String.self, forKey: .ballId)
        self.playHoleId = try c.decode(String.self, forKey: .playHoleId)
        self.strokes = try c.decodeIfPresent(Double.self, forKey: .strokes)
        self.eventType = try c.decode(ScoreEventEventType.self, forKey: .eventType)
        self.clientEventId = try c.decode(String.self, forKey: .clientEventId)
        if c.contains(.sourcePlayerId) {
            self.sourcePlayerId = try c.decodeNil(forKey: .sourcePlayerId)
                ? .null
                : .value(try c.decode(String.self, forKey: .sourcePlayerId))
        } else {
            self.sourcePlayerId = .absent
        }
        if c.contains(.sourceGuestPlayerId) {
            self.sourceGuestPlayerId = try c.decodeNil(forKey: .sourceGuestPlayerId)
                ? .null
                : .value(try c.decode(String.self, forKey: .sourceGuestPlayerId))
        } else {
            self.sourceGuestPlayerId = .absent
        }
        if c.contains(.metadata) {
            self.metadata = try c.decodeNil(forKey: .metadata)
                ? .null
                : .value(try c.decode([String: JSONValue].self, forKey: .metadata))
        } else {
            self.metadata = .absent
        }
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(roundId, forKey: .roundId)
        try c.encode(ballId, forKey: .ballId)
        try c.encode(playHoleId, forKey: .playHoleId)
        if let strokes {
            try c.encode(strokes, forKey: .strokes)
        } else {
            try c.encodeNil(forKey: .strokes)
        }
        try c.encode(eventType, forKey: .eventType)
        try c.encode(clientEventId, forKey: .clientEventId)
        switch sourcePlayerId {
        case .absent: break
        case .null: try c.encodeNil(forKey: .sourcePlayerId)
        case .value(let v): try c.encode(v, forKey: .sourcePlayerId)
        }
        switch sourceGuestPlayerId {
        case .absent: break
        case .null: try c.encodeNil(forKey: .sourceGuestPlayerId)
        case .value(let v): try c.encode(v, forKey: .sourceGuestPlayerId)
        }
        switch metadata {
        case .absent: break
        case .null: try c.encodeNil(forKey: .metadata)
        case .value(let v): try c.encode(v, forKey: .metadata)
        }
    }
}
