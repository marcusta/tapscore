// GENERATED — DO NOT EDIT. bun run generate:swift

import Foundation

struct PlayerStatsConfig: Codable, Sendable, Equatable {
    var playerId: String
    var enabled: Bool
    var tee: Bool
    var approach: Bool
    var putting: Bool
    var shortGame: Bool
    var penalties: Bool
    var recovery: Bool
    var updatedAt: String?

    enum CodingKeys: String, CodingKey {
        case playerId = "playerId"
        case enabled = "enabled"
        case tee = "tee"
        case approach = "approach"
        case putting = "putting"
        case shortGame = "shortGame"
        case penalties = "penalties"
        case recovery = "recovery"
        case updatedAt = "updatedAt"
    }

    init(playerId: String, enabled: Bool, tee: Bool, approach: Bool, putting: Bool, shortGame: Bool, penalties: Bool, recovery: Bool, updatedAt: String? = nil) {
        self.playerId = playerId
        self.enabled = enabled
        self.tee = tee
        self.approach = approach
        self.putting = putting
        self.shortGame = shortGame
        self.penalties = penalties
        self.recovery = recovery
        self.updatedAt = updatedAt
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.playerId = try c.decode(String.self, forKey: .playerId)
        self.enabled = try c.decode(Bool.self, forKey: .enabled)
        self.tee = try c.decode(Bool.self, forKey: .tee)
        self.approach = try c.decode(Bool.self, forKey: .approach)
        self.putting = try c.decode(Bool.self, forKey: .putting)
        self.shortGame = try c.decode(Bool.self, forKey: .shortGame)
        self.penalties = try c.decode(Bool.self, forKey: .penalties)
        self.recovery = try c.decode(Bool.self, forKey: .recovery)
        self.updatedAt = try c.decodeIfPresent(String.self, forKey: .updatedAt)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(playerId, forKey: .playerId)
        try c.encode(enabled, forKey: .enabled)
        try c.encode(tee, forKey: .tee)
        try c.encode(approach, forKey: .approach)
        try c.encode(putting, forKey: .putting)
        try c.encode(shortGame, forKey: .shortGame)
        try c.encode(penalties, forKey: .penalties)
        try c.encode(recovery, forKey: .recovery)
        if let updatedAt {
            try c.encode(updatedAt, forKey: .updatedAt)
        } else {
            try c.encodeNil(forKey: .updatedAt)
        }
    }
}

struct AppendStatEventsResult: Codable, Sendable, Equatable {
    var events: [AppendedStatEvent]

    enum CodingKeys: String, CodingKey {
        case events = "events"
    }

    init(events: [AppendedStatEvent]) {
        self.events = events
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.events = try c.decode([AppendedStatEvent].self, forKey: .events)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(events, forKey: .events)
    }
}

enum PlayerHoleStatsTeeResult: String, Codable, Sendable, Equatable {
    case fairway = "fairway"
    case inPlay = "in_play"
    case trouble = "trouble"
}

enum PlayerHoleStatsFirstPutt: String, Codable, Sendable, Equatable {
    case inside2m = "inside_2m"
    case v2To6m = "2_to_6m"
    case over6m = "over_6m"
}

enum PlayerHoleStatsShortGameDifficulty: String, Codable, Sendable, Equatable {
    case standard = "standard"
    case hard = "hard"
}

struct PlayerHoleStats: Codable, Sendable, Equatable {
    var roundId: String
    var playHoleId: String
    var playerId: String
    var teeResult: PlayerHoleStatsTeeResult?
    var gir: Bool?
    var firstPutt: PlayerHoleStatsFirstPutt?
    var putts: Double?
    var shortGameDifficulty: PlayerHoleStatsShortGameDifficulty?
    var penalties: Double?
    var recoveryOk: Bool?

    enum CodingKeys: String, CodingKey {
        case roundId = "roundId"
        case playHoleId = "playHoleId"
        case playerId = "playerId"
        case teeResult = "teeResult"
        case gir = "gir"
        case firstPutt = "firstPutt"
        case putts = "putts"
        case shortGameDifficulty = "shortGameDifficulty"
        case penalties = "penalties"
        case recoveryOk = "recoveryOk"
    }

    init(roundId: String, playHoleId: String, playerId: String, teeResult: PlayerHoleStatsTeeResult? = nil, gir: Bool? = nil, firstPutt: PlayerHoleStatsFirstPutt? = nil, putts: Double? = nil, shortGameDifficulty: PlayerHoleStatsShortGameDifficulty? = nil, penalties: Double? = nil, recoveryOk: Bool? = nil) {
        self.roundId = roundId
        self.playHoleId = playHoleId
        self.playerId = playerId
        self.teeResult = teeResult
        self.gir = gir
        self.firstPutt = firstPutt
        self.putts = putts
        self.shortGameDifficulty = shortGameDifficulty
        self.penalties = penalties
        self.recoveryOk = recoveryOk
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.roundId = try c.decode(String.self, forKey: .roundId)
        self.playHoleId = try c.decode(String.self, forKey: .playHoleId)
        self.playerId = try c.decode(String.self, forKey: .playerId)
        self.teeResult = try c.decodeIfPresent(PlayerHoleStatsTeeResult.self, forKey: .teeResult)
        self.gir = try c.decodeIfPresent(Bool.self, forKey: .gir)
        self.firstPutt = try c.decodeIfPresent(PlayerHoleStatsFirstPutt.self, forKey: .firstPutt)
        self.putts = try c.decodeIfPresent(Double.self, forKey: .putts)
        self.shortGameDifficulty = try c.decodeIfPresent(PlayerHoleStatsShortGameDifficulty.self, forKey: .shortGameDifficulty)
        self.penalties = try c.decodeIfPresent(Double.self, forKey: .penalties)
        self.recoveryOk = try c.decodeIfPresent(Bool.self, forKey: .recoveryOk)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(roundId, forKey: .roundId)
        try c.encode(playHoleId, forKey: .playHoleId)
        try c.encode(playerId, forKey: .playerId)
        if let teeResult {
            try c.encode(teeResult, forKey: .teeResult)
        } else {
            try c.encodeNil(forKey: .teeResult)
        }
        if let gir {
            try c.encode(gir, forKey: .gir)
        } else {
            try c.encodeNil(forKey: .gir)
        }
        if let firstPutt {
            try c.encode(firstPutt, forKey: .firstPutt)
        } else {
            try c.encodeNil(forKey: .firstPutt)
        }
        if let putts {
            try c.encode(putts, forKey: .putts)
        } else {
            try c.encodeNil(forKey: .putts)
        }
        if let shortGameDifficulty {
            try c.encode(shortGameDifficulty, forKey: .shortGameDifficulty)
        } else {
            try c.encodeNil(forKey: .shortGameDifficulty)
        }
        if let penalties {
            try c.encode(penalties, forKey: .penalties)
        } else {
            try c.encodeNil(forKey: .penalties)
        }
        if let recoveryOk {
            try c.encode(recoveryOk, forKey: .recoveryOk)
        } else {
            try c.encodeNil(forKey: .recoveryOk)
        }
    }
}

struct AppendedStatEvent: Codable, Sendable, Equatable {
    var event: StatEvent
    var inserted: Bool

    enum CodingKeys: String, CodingKey {
        case event = "event"
        case inserted = "inserted"
    }

    init(event: StatEvent, inserted: Bool) {
        self.event = event
        self.inserted = inserted
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.event = try c.decode(StatEvent.self, forKey: .event)
        self.inserted = try c.decode(Bool.self, forKey: .inserted)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(event, forKey: .event)
        try c.encode(inserted, forKey: .inserted)
    }
}

enum StatEventKey: String, Codable, Sendable, Equatable {
    case penalties = "penalties"
    case teeResult = "tee_result"
    case gir = "gir"
    case firstPutt = "first_putt"
    case putts = "putts"
    case shortGameDifficulty = "short_game_difficulty"
    case recoveryOk = "recovery_ok"
}

struct StatEvent: Codable, Sendable, Equatable {
    var id: String
    var roundId: String
    var playHoleId: String
    var playerId: String
    var seq: Double
    var key: StatEventKey
    var value: String?
    var recordedByPlayerId: String?
    var recordedAt: String
    var clientEventId: String

    enum CodingKeys: String, CodingKey {
        case id = "id"
        case roundId = "roundId"
        case playHoleId = "playHoleId"
        case playerId = "playerId"
        case seq = "seq"
        case key = "key"
        case value = "value"
        case recordedByPlayerId = "recordedByPlayerId"
        case recordedAt = "recordedAt"
        case clientEventId = "clientEventId"
    }

    init(id: String, roundId: String, playHoleId: String, playerId: String, seq: Double, key: StatEventKey, value: String? = nil, recordedByPlayerId: String? = nil, recordedAt: String, clientEventId: String) {
        self.id = id
        self.roundId = roundId
        self.playHoleId = playHoleId
        self.playerId = playerId
        self.seq = seq
        self.key = key
        self.value = value
        self.recordedByPlayerId = recordedByPlayerId
        self.recordedAt = recordedAt
        self.clientEventId = clientEventId
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try c.decode(String.self, forKey: .id)
        self.roundId = try c.decode(String.self, forKey: .roundId)
        self.playHoleId = try c.decode(String.self, forKey: .playHoleId)
        self.playerId = try c.decode(String.self, forKey: .playerId)
        self.seq = try c.decode(Double.self, forKey: .seq)
        self.key = try c.decode(StatEventKey.self, forKey: .key)
        self.value = try c.decodeIfPresent(String.self, forKey: .value)
        self.recordedByPlayerId = try c.decodeIfPresent(String.self, forKey: .recordedByPlayerId)
        self.recordedAt = try c.decode(String.self, forKey: .recordedAt)
        self.clientEventId = try c.decode(String.self, forKey: .clientEventId)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encode(roundId, forKey: .roundId)
        try c.encode(playHoleId, forKey: .playHoleId)
        try c.encode(playerId, forKey: .playerId)
        try c.encode(seq, forKey: .seq)
        try c.encode(key, forKey: .key)
        if let value {
            try c.encode(value, forKey: .value)
        } else {
            try c.encodeNil(forKey: .value)
        }
        if let recordedByPlayerId {
            try c.encode(recordedByPlayerId, forKey: .recordedByPlayerId)
        } else {
            try c.encodeNil(forKey: .recordedByPlayerId)
        }
        try c.encode(recordedAt, forKey: .recordedAt)
        try c.encode(clientEventId, forKey: .clientEventId)
    }
}

struct PlayerStatsPutMyConfigInput: Codable, Sendable, Equatable {
    var enabled: Bool
    var tee: Bool
    var approach: Bool
    var putting: Bool
    var shortGame: Bool
    var penalties: Bool
    var recovery: Bool

    enum CodingKeys: String, CodingKey {
        case enabled = "enabled"
        case tee = "tee"
        case approach = "approach"
        case putting = "putting"
        case shortGame = "shortGame"
        case penalties = "penalties"
        case recovery = "recovery"
    }

    init(enabled: Bool, tee: Bool, approach: Bool, putting: Bool, shortGame: Bool, penalties: Bool, recovery: Bool) {
        self.enabled = enabled
        self.tee = tee
        self.approach = approach
        self.putting = putting
        self.shortGame = shortGame
        self.penalties = penalties
        self.recovery = recovery
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.enabled = try c.decode(Bool.self, forKey: .enabled)
        self.tee = try c.decode(Bool.self, forKey: .tee)
        self.approach = try c.decode(Bool.self, forKey: .approach)
        self.putting = try c.decode(Bool.self, forKey: .putting)
        self.shortGame = try c.decode(Bool.self, forKey: .shortGame)
        self.penalties = try c.decode(Bool.self, forKey: .penalties)
        self.recovery = try c.decode(Bool.self, forKey: .recovery)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(enabled, forKey: .enabled)
        try c.encode(tee, forKey: .tee)
        try c.encode(approach, forKey: .approach)
        try c.encode(putting, forKey: .putting)
        try c.encode(shortGame, forKey: .shortGame)
        try c.encode(penalties, forKey: .penalties)
        try c.encode(recovery, forKey: .recovery)
    }
}

struct PlayerStatsAppendEventsInputItemsItem: Codable, Sendable, Equatable {
    var playerId: String
    var playHoleId: String
    var clientEventId: String
    var key: StatEventKey
    var value: String?

    enum CodingKeys: String, CodingKey {
        case playerId = "playerId"
        case playHoleId = "playHoleId"
        case clientEventId = "clientEventId"
        case key = "key"
        case value = "value"
    }

    init(playerId: String, playHoleId: String, clientEventId: String, key: StatEventKey, value: String? = nil) {
        self.playerId = playerId
        self.playHoleId = playHoleId
        self.clientEventId = clientEventId
        self.key = key
        self.value = value
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.playerId = try c.decode(String.self, forKey: .playerId)
        self.playHoleId = try c.decode(String.self, forKey: .playHoleId)
        self.clientEventId = try c.decode(String.self, forKey: .clientEventId)
        self.key = try c.decode(StatEventKey.self, forKey: .key)
        self.value = try c.decodeIfPresent(String.self, forKey: .value)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(playerId, forKey: .playerId)
        try c.encode(playHoleId, forKey: .playHoleId)
        try c.encode(clientEventId, forKey: .clientEventId)
        try c.encode(key, forKey: .key)
        if let value {
            try c.encode(value, forKey: .value)
        } else {
            try c.encodeNil(forKey: .value)
        }
    }
}

struct PlayerStatsAppendEventsInput: Codable, Sendable, Equatable {
    var token: String
    var items: [PlayerStatsAppendEventsInputItemsItem]

    enum CodingKeys: String, CodingKey {
        case token = "token"
        case items = "items"
    }

    init(token: String, items: [PlayerStatsAppendEventsInputItemsItem]) {
        self.token = token
        self.items = items
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.token = try c.decode(String.self, forKey: .token)
        self.items = try c.decode([PlayerStatsAppendEventsInputItemsItem].self, forKey: .items)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(token, forKey: .token)
        try c.encode(items, forKey: .items)
    }
}
