// GENERATED — DO NOT EDIT. bun run generate:swift

import Foundation

enum PlayerGender: String, Codable, Sendable, Equatable {
    case m = "M"
    case f = "F"
}

struct Player: Codable, Sendable, Equatable {
    var id: String
    var username: String
    var displayName: String
    var nickname: String?
    var avatarUrl: String?
    var homeClubId: String?
    var handicapIndex: Double?
    var gender: PlayerGender?
    var deletedAt: String?

    enum CodingKeys: String, CodingKey {
        case id = "id"
        case username = "username"
        case displayName = "displayName"
        case nickname = "nickname"
        case avatarUrl = "avatarUrl"
        case homeClubId = "homeClubId"
        case handicapIndex = "handicapIndex"
        case gender = "gender"
        case deletedAt = "deletedAt"
    }

    init(id: String, username: String, displayName: String, nickname: String? = nil, avatarUrl: String? = nil, homeClubId: String? = nil, handicapIndex: Double? = nil, gender: PlayerGender? = nil, deletedAt: String? = nil) {
        self.id = id
        self.username = username
        self.displayName = displayName
        self.nickname = nickname
        self.avatarUrl = avatarUrl
        self.homeClubId = homeClubId
        self.handicapIndex = handicapIndex
        self.gender = gender
        self.deletedAt = deletedAt
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try c.decode(String.self, forKey: .id)
        self.username = try c.decode(String.self, forKey: .username)
        self.displayName = try c.decode(String.self, forKey: .displayName)
        self.nickname = try c.decodeIfPresent(String.self, forKey: .nickname)
        self.avatarUrl = try c.decodeIfPresent(String.self, forKey: .avatarUrl)
        self.homeClubId = try c.decodeIfPresent(String.self, forKey: .homeClubId)
        self.handicapIndex = try c.decodeIfPresent(Double.self, forKey: .handicapIndex)
        self.gender = try c.decodeIfPresent(PlayerGender.self, forKey: .gender)
        self.deletedAt = try c.decodeIfPresent(String.self, forKey: .deletedAt)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encode(username, forKey: .username)
        try c.encode(displayName, forKey: .displayName)
        if let nickname {
            try c.encode(nickname, forKey: .nickname)
        } else {
            try c.encodeNil(forKey: .nickname)
        }
        if let avatarUrl {
            try c.encode(avatarUrl, forKey: .avatarUrl)
        } else {
            try c.encodeNil(forKey: .avatarUrl)
        }
        if let homeClubId {
            try c.encode(homeClubId, forKey: .homeClubId)
        } else {
            try c.encodeNil(forKey: .homeClubId)
        }
        if let handicapIndex {
            try c.encode(handicapIndex, forKey: .handicapIndex)
        } else {
            try c.encodeNil(forKey: .handicapIndex)
        }
        if let gender {
            try c.encode(gender, forKey: .gender)
        } else {
            try c.encodeNil(forKey: .gender)
        }
        if let deletedAt {
            try c.encode(deletedAt, forKey: .deletedAt)
        } else {
            try c.encodeNil(forKey: .deletedAt)
        }
    }
}

struct AuthNativeAppleSignInInput: Codable, Sendable, Equatable {
    var fullName: TriState<String>
    var identityToken: String

    enum CodingKeys: String, CodingKey {
        case fullName = "fullName"
        case identityToken = "identityToken"
    }

    init(fullName: TriState<String> = .absent, identityToken: String) {
        self.fullName = fullName
        self.identityToken = identityToken
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        if c.contains(.fullName) {
            self.fullName = try c.decodeNil(forKey: .fullName)
                ? .null
                : .value(try c.decode(String.self, forKey: .fullName))
        } else {
            self.fullName = .absent
        }
        self.identityToken = try c.decode(String.self, forKey: .identityToken)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        switch fullName {
        case .absent: break
        case .null: try c.encodeNil(forKey: .fullName)
        case .value(let v): try c.encode(v, forKey: .fullName)
        }
        try c.encode(identityToken, forKey: .identityToken)
    }
}

struct AuthNativeAppleSignInOutput: Codable, Sendable, Equatable {
    var user: Player
    var token: String

    enum CodingKeys: String, CodingKey {
        case user = "user"
        case token = "token"
    }

    init(user: Player, token: String) {
        self.user = user
        self.token = token
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.user = try c.decode(Player.self, forKey: .user)
        self.token = try c.decode(String.self, forKey: .token)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(user, forKey: .user)
        try c.encode(token, forKey: .token)
    }
}

struct AuthNativeRevokeOutput: Codable, Sendable, Equatable {
    var ok: Bool
    var userId: String

    enum CodingKeys: String, CodingKey {
        case ok = "ok"
        case userId = "userId"
    }

    init(ok: Bool, userId: String) {
        self.ok = ok
        self.userId = userId
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.ok = try c.decode(Bool.self, forKey: .ok)
        self.userId = try c.decode(String.self, forKey: .userId)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(ok, forKey: .ok)
        try c.encode(userId, forKey: .userId)
    }
}
