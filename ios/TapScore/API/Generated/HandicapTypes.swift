// GENERATED — DO NOT EDIT. bun run generate:swift

import Foundation

enum HandicapEntrySource: String, Codable, Sendable, Equatable {
    case manual = "manual"
    case calculated = "calculated"
    case `import` = "import"
}

struct HandicapEntry: Codable, Sendable, Equatable {
    var id: String
    var playerId: String
    var handicapIndex: Double
    var source: HandicapEntrySource
    var effectiveDate: String
    var enteredByPlayerId: String?
    var createdAt: String

    enum CodingKeys: String, CodingKey {
        case id = "id"
        case playerId = "playerId"
        case handicapIndex = "handicapIndex"
        case source = "source"
        case effectiveDate = "effectiveDate"
        case enteredByPlayerId = "enteredByPlayerId"
        case createdAt = "createdAt"
    }

    init(id: String, playerId: String, handicapIndex: Double, source: HandicapEntrySource, effectiveDate: String, enteredByPlayerId: String? = nil, createdAt: String) {
        self.id = id
        self.playerId = playerId
        self.handicapIndex = handicapIndex
        self.source = source
        self.effectiveDate = effectiveDate
        self.enteredByPlayerId = enteredByPlayerId
        self.createdAt = createdAt
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try c.decode(String.self, forKey: .id)
        self.playerId = try c.decode(String.self, forKey: .playerId)
        self.handicapIndex = try c.decode(Double.self, forKey: .handicapIndex)
        self.source = try c.decode(HandicapEntrySource.self, forKey: .source)
        self.effectiveDate = try c.decode(String.self, forKey: .effectiveDate)
        self.enteredByPlayerId = try c.decodeIfPresent(String.self, forKey: .enteredByPlayerId)
        self.createdAt = try c.decode(String.self, forKey: .createdAt)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encode(playerId, forKey: .playerId)
        try c.encode(handicapIndex, forKey: .handicapIndex)
        try c.encode(source, forKey: .source)
        try c.encode(effectiveDate, forKey: .effectiveDate)
        if let enteredByPlayerId {
            try c.encode(enteredByPlayerId, forKey: .enteredByPlayerId)
        } else {
            try c.encodeNil(forKey: .enteredByPlayerId)
        }
        try c.encode(createdAt, forKey: .createdAt)
    }
}

struct HandicapLatestInput: Codable, Sendable, Equatable {
    var playerId: String

    enum CodingKeys: String, CodingKey {
        case playerId = "playerId"
    }

    init(playerId: String) {
        self.playerId = playerId
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.playerId = try c.decode(String.self, forKey: .playerId)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(playerId, forKey: .playerId)
    }
}

struct HandicapRecordInput: Codable, Sendable, Equatable {
    var playerId: String
    var handicapIndex: Double
    var source: HandicapEntrySource
    var effectiveDate: String

    enum CodingKeys: String, CodingKey {
        case playerId = "playerId"
        case handicapIndex = "handicapIndex"
        case source = "source"
        case effectiveDate = "effectiveDate"
    }

    init(playerId: String, handicapIndex: Double, source: HandicapEntrySource, effectiveDate: String) {
        self.playerId = playerId
        self.handicapIndex = handicapIndex
        self.source = source
        self.effectiveDate = effectiveDate
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.playerId = try c.decode(String.self, forKey: .playerId)
        self.handicapIndex = try c.decode(Double.self, forKey: .handicapIndex)
        self.source = try c.decode(HandicapEntrySource.self, forKey: .source)
        self.effectiveDate = try c.decode(String.self, forKey: .effectiveDate)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(playerId, forKey: .playerId)
        try c.encode(handicapIndex, forKey: .handicapIndex)
        try c.encode(source, forKey: .source)
        try c.encode(effectiveDate, forKey: .effectiveDate)
    }
}
