// GENERATED — DO NOT EDIT. bun run generate:swift

import Foundation

struct GuestPlayer: Codable, Sendable, Equatable {
    var id: String
    var displayName: String
    var gender: PlayerGender
    var handicapIndex: Double?
    var claimedByPlayerId: String?
    var claimedAt: String?

    enum CodingKeys: String, CodingKey {
        case id = "id"
        case displayName = "displayName"
        case gender = "gender"
        case handicapIndex = "handicapIndex"
        case claimedByPlayerId = "claimedByPlayerId"
        case claimedAt = "claimedAt"
    }

    init(id: String, displayName: String, gender: PlayerGender, handicapIndex: Double? = nil, claimedByPlayerId: String? = nil, claimedAt: String? = nil) {
        self.id = id
        self.displayName = displayName
        self.gender = gender
        self.handicapIndex = handicapIndex
        self.claimedByPlayerId = claimedByPlayerId
        self.claimedAt = claimedAt
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try c.decode(String.self, forKey: .id)
        self.displayName = try c.decode(String.self, forKey: .displayName)
        self.gender = try c.decode(PlayerGender.self, forKey: .gender)
        self.handicapIndex = try c.decodeIfPresent(Double.self, forKey: .handicapIndex)
        self.claimedByPlayerId = try c.decodeIfPresent(String.self, forKey: .claimedByPlayerId)
        self.claimedAt = try c.decodeIfPresent(String.self, forKey: .claimedAt)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encode(displayName, forKey: .displayName)
        try c.encode(gender, forKey: .gender)
        if let handicapIndex {
            try c.encode(handicapIndex, forKey: .handicapIndex)
        } else {
            try c.encodeNil(forKey: .handicapIndex)
        }
        if let claimedByPlayerId {
            try c.encode(claimedByPlayerId, forKey: .claimedByPlayerId)
        } else {
            try c.encodeNil(forKey: .claimedByPlayerId)
        }
        if let claimedAt {
            try c.encode(claimedAt, forKey: .claimedAt)
        } else {
            try c.encodeNil(forKey: .claimedAt)
        }
    }
}

struct GuestPlayersCreateInput: Codable, Sendable, Equatable {
    var displayName: String
    var gender: PlayerGender
    var handicapIndex: TriState<Double>

    enum CodingKeys: String, CodingKey {
        case displayName = "displayName"
        case gender = "gender"
        case handicapIndex = "handicapIndex"
    }

    init(displayName: String, gender: PlayerGender, handicapIndex: TriState<Double> = .absent) {
        self.displayName = displayName
        self.gender = gender
        self.handicapIndex = handicapIndex
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.displayName = try c.decode(String.self, forKey: .displayName)
        self.gender = try c.decode(PlayerGender.self, forKey: .gender)
        if c.contains(.handicapIndex) {
            self.handicapIndex = try c.decodeNil(forKey: .handicapIndex)
                ? .null
                : .value(try c.decode(Double.self, forKey: .handicapIndex))
        } else {
            self.handicapIndex = .absent
        }
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(displayName, forKey: .displayName)
        try c.encode(gender, forKey: .gender)
        switch handicapIndex {
        case .absent: break
        case .null: try c.encodeNil(forKey: .handicapIndex)
        case .value(let v): try c.encode(v, forKey: .handicapIndex)
        }
    }
}
