// GENERATED — DO NOT EDIT. bun run generate:swift

import Foundation

struct FriendProfile: Codable, Sendable, Equatable {
    var sharedRoundCount: Double
    var lastPlayedAt: String?
    var frecency: Double
    var id: String
    var username: String
    var displayName: String
    var gender: PlayerGender?
    var handicapIndex: Double?
    var homeClubName: String?

    enum CodingKeys: String, CodingKey {
        case sharedRoundCount = "sharedRoundCount"
        case lastPlayedAt = "lastPlayedAt"
        case frecency = "frecency"
        case id = "id"
        case username = "username"
        case displayName = "displayName"
        case gender = "gender"
        case handicapIndex = "handicapIndex"
        case homeClubName = "homeClubName"
    }

    init(sharedRoundCount: Double, lastPlayedAt: String? = nil, frecency: Double, id: String, username: String, displayName: String, gender: PlayerGender? = nil, handicapIndex: Double? = nil, homeClubName: String? = nil) {
        self.sharedRoundCount = sharedRoundCount
        self.lastPlayedAt = lastPlayedAt
        self.frecency = frecency
        self.id = id
        self.username = username
        self.displayName = displayName
        self.gender = gender
        self.handicapIndex = handicapIndex
        self.homeClubName = homeClubName
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.sharedRoundCount = try c.decode(Double.self, forKey: .sharedRoundCount)
        self.lastPlayedAt = try c.decodeIfPresent(String.self, forKey: .lastPlayedAt)
        self.frecency = try c.decode(Double.self, forKey: .frecency)
        self.id = try c.decode(String.self, forKey: .id)
        self.username = try c.decode(String.self, forKey: .username)
        self.displayName = try c.decode(String.self, forKey: .displayName)
        self.gender = try c.decodeIfPresent(PlayerGender.self, forKey: .gender)
        self.handicapIndex = try c.decodeIfPresent(Double.self, forKey: .handicapIndex)
        self.homeClubName = try c.decodeIfPresent(String.self, forKey: .homeClubName)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(sharedRoundCount, forKey: .sharedRoundCount)
        if let lastPlayedAt {
            try c.encode(lastPlayedAt, forKey: .lastPlayedAt)
        } else {
            try c.encodeNil(forKey: .lastPlayedAt)
        }
        try c.encode(frecency, forKey: .frecency)
        try c.encode(id, forKey: .id)
        try c.encode(username, forKey: .username)
        try c.encode(displayName, forKey: .displayName)
        if let gender {
            try c.encode(gender, forKey: .gender)
        } else {
            try c.encodeNil(forKey: .gender)
        }
        if let handicapIndex {
            try c.encode(handicapIndex, forKey: .handicapIndex)
        } else {
            try c.encodeNil(forKey: .handicapIndex)
        }
        if let homeClubName {
            try c.encode(homeClubName, forKey: .homeClubName)
        } else {
            try c.encodeNil(forKey: .homeClubName)
        }
    }
}

struct Friendship: Codable, Sendable, Equatable {
    var playerId: String
    var friendPlayerId: String
    var createdAt: String

    enum CodingKeys: String, CodingKey {
        case playerId = "playerId"
        case friendPlayerId = "friendPlayerId"
        case createdAt = "createdAt"
    }

    init(playerId: String, friendPlayerId: String, createdAt: String) {
        self.playerId = playerId
        self.friendPlayerId = friendPlayerId
        self.createdAt = createdAt
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.playerId = try c.decode(String.self, forKey: .playerId)
        self.friendPlayerId = try c.decode(String.self, forKey: .friendPlayerId)
        self.createdAt = try c.decode(String.self, forKey: .createdAt)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(playerId, forKey: .playerId)
        try c.encode(friendPlayerId, forKey: .friendPlayerId)
        try c.encode(createdAt, forKey: .createdAt)
    }
}

struct FriendsAddInput: Codable, Sendable, Equatable {
    var friendId: String

    enum CodingKeys: String, CodingKey {
        case friendId = "friendId"
    }

    init(friendId: String) {
        self.friendId = friendId
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.friendId = try c.decode(String.self, forKey: .friendId)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(friendId, forKey: .friendId)
    }
}
