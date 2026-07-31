// GENERATED — DO NOT EDIT. bun run generate:swift

import Foundation

struct AuthUser: Codable, Sendable, Equatable {
    var id: String
    var username: String

    enum CodingKeys: String, CodingKey {
        case id = "id"
        case username = "username"
    }

    init(id: String, username: String) {
        self.id = id
        self.username = username
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try c.decode(String.self, forKey: .id)
        self.username = try c.decode(String.self, forKey: .username)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encode(username, forKey: .username)
    }
}

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
    var handicapConfirmedAt: String?
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
        case handicapConfirmedAt = "handicapConfirmedAt"
        case deletedAt = "deletedAt"
    }

    init(id: String, username: String, displayName: String, nickname: String? = nil, avatarUrl: String? = nil, homeClubId: String? = nil, handicapIndex: Double? = nil, gender: PlayerGender? = nil, handicapConfirmedAt: String? = nil, deletedAt: String? = nil) {
        self.id = id
        self.username = username
        self.displayName = displayName
        self.nickname = nickname
        self.avatarUrl = avatarUrl
        self.homeClubId = homeClubId
        self.handicapIndex = handicapIndex
        self.gender = gender
        self.handicapConfirmedAt = handicapConfirmedAt
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
        self.handicapConfirmedAt = try c.decodeIfPresent(String.self, forKey: .handicapConfirmedAt)
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
        if let handicapConfirmedAt {
            try c.encode(handicapConfirmedAt, forKey: .handicapConfirmedAt)
        } else {
            try c.encodeNil(forKey: .handicapConfirmedAt)
        }
        if let deletedAt {
            try c.encode(deletedAt, forKey: .deletedAt)
        } else {
            try c.encodeNil(forKey: .deletedAt)
        }
    }
}

struct AuthNativeNativeLoginInput: Codable, Sendable, Equatable {
    var username: String
    var password: String

    enum CodingKeys: String, CodingKey {
        case username = "username"
        case password = "password"
    }

    init(username: String, password: String) {
        self.username = username
        self.password = password
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.username = try c.decode(String.self, forKey: .username)
        self.password = try c.decode(String.self, forKey: .password)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(username, forKey: .username)
        try c.encode(password, forKey: .password)
    }
}

struct AuthNativeNativeLoginOutput: Codable, Sendable, Equatable {
    var user: AuthUser
    var token: String

    enum CodingKeys: String, CodingKey {
        case user = "user"
        case token = "token"
    }

    init(user: AuthUser, token: String) {
        self.user = user
        self.token = token
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.user = try c.decode(AuthUser.self, forKey: .user)
        self.token = try c.decode(String.self, forKey: .token)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(user, forKey: .user)
        try c.encode(token, forKey: .token)
    }
}

struct AuthNativeAppleSignInInput: Codable, Sendable, Equatable {
    var identityToken: String
    var fullName: TriState<String>
    var nonce: String?

    enum CodingKeys: String, CodingKey {
        case identityToken = "identityToken"
        case fullName = "fullName"
        case nonce = "nonce"
    }

    init(identityToken: String, fullName: TriState<String> = .absent, nonce: String? = nil) {
        self.identityToken = identityToken
        self.fullName = fullName
        self.nonce = nonce
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.identityToken = try c.decode(String.self, forKey: .identityToken)
        if c.contains(.fullName) {
            self.fullName = try c.decodeNil(forKey: .fullName)
                ? .null
                : .value(try c.decode(String.self, forKey: .fullName))
        } else {
            self.fullName = .absent
        }
        self.nonce = try c.decodeIfPresent(String.self, forKey: .nonce)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(identityToken, forKey: .identityToken)
        switch fullName {
        case .absent: break
        case .null: try c.encodeNil(forKey: .fullName)
        case .value(let v): try c.encode(v, forKey: .fullName)
        }
        try c.encodeIfPresent(nonce, forKey: .nonce)
    }
}

struct AuthNativeAppleSignInOutput: Codable, Sendable, Equatable {
    var user: Player
    var token: String
    var created: Bool

    enum CodingKeys: String, CodingKey {
        case user = "user"
        case token = "token"
        case created = "created"
    }

    init(user: Player, token: String, created: Bool) {
        self.user = user
        self.token = token
        self.created = created
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.user = try c.decode(Player.self, forKey: .user)
        self.token = try c.decode(String.self, forKey: .token)
        self.created = try c.decode(Bool.self, forKey: .created)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(user, forKey: .user)
        try c.encode(token, forKey: .token)
        try c.encode(created, forKey: .created)
    }
}

enum AuthNativeCredentialsOutputProvidersItem: String, Codable, Sendable, Equatable {
    case password = "password"
    case apple = "apple"
}

struct AuthNativeCredentialsOutput: Codable, Sendable, Equatable {
    var providers: [AuthNativeCredentialsOutputProvidersItem]

    enum CodingKeys: String, CodingKey {
        case providers = "providers"
    }

    init(providers: [AuthNativeCredentialsOutputProvidersItem]) {
        self.providers = providers
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.providers = try c.decode([AuthNativeCredentialsOutputProvidersItem].self, forKey: .providers)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(providers, forKey: .providers)
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
