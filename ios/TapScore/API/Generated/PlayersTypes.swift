// GENERATED — DO NOT EDIT. bun run generate:swift

import Foundation

struct PlayerSearchResult: Codable, Sendable, Equatable {
    var id: String
    var username: String
    var displayName: String
    var gender: PlayerGender?
    var handicapIndex: Double?
    var homeClubName: String?
    var avatarVersion: String?
    var isFriend: Bool

    enum CodingKeys: String, CodingKey {
        case id = "id"
        case username = "username"
        case displayName = "displayName"
        case gender = "gender"
        case handicapIndex = "handicapIndex"
        case homeClubName = "homeClubName"
        case avatarVersion = "avatarVersion"
        case isFriend = "isFriend"
    }

    init(id: String, username: String, displayName: String, gender: PlayerGender? = nil, handicapIndex: Double? = nil, homeClubName: String? = nil, avatarVersion: String? = nil, isFriend: Bool) {
        self.id = id
        self.username = username
        self.displayName = displayName
        self.gender = gender
        self.handicapIndex = handicapIndex
        self.homeClubName = homeClubName
        self.avatarVersion = avatarVersion
        self.isFriend = isFriend
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try c.decode(String.self, forKey: .id)
        self.username = try c.decode(String.self, forKey: .username)
        self.displayName = try c.decode(String.self, forKey: .displayName)
        self.gender = try c.decodeIfPresent(PlayerGender.self, forKey: .gender)
        self.handicapIndex = try c.decodeIfPresent(Double.self, forKey: .handicapIndex)
        self.homeClubName = try c.decodeIfPresent(String.self, forKey: .homeClubName)
        self.avatarVersion = try c.decodeIfPresent(String.self, forKey: .avatarVersion)
        self.isFriend = try c.decode(Bool.self, forKey: .isFriend)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
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
        if let avatarVersion {
            try c.encode(avatarVersion, forKey: .avatarVersion)
        } else {
            try c.encodeNil(forKey: .avatarVersion)
        }
        try c.encode(isFriend, forKey: .isFriend)
    }
}

struct PlayersRegisterInput: Codable, Sendable, Equatable {
    var username: String
    var password: String
    var displayName: String
    var handicapIndex: TriState<Double>
    var gender: TriState<PlayerGender>
    var homeClubId: TriState<String>

    enum CodingKeys: String, CodingKey {
        case username = "username"
        case password = "password"
        case displayName = "displayName"
        case handicapIndex = "handicapIndex"
        case gender = "gender"
        case homeClubId = "homeClubId"
    }

    init(username: String, password: String, displayName: String, handicapIndex: TriState<Double> = .absent, gender: TriState<PlayerGender> = .absent, homeClubId: TriState<String> = .absent) {
        self.username = username
        self.password = password
        self.displayName = displayName
        self.handicapIndex = handicapIndex
        self.gender = gender
        self.homeClubId = homeClubId
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.username = try c.decode(String.self, forKey: .username)
        self.password = try c.decode(String.self, forKey: .password)
        self.displayName = try c.decode(String.self, forKey: .displayName)
        if c.contains(.handicapIndex) {
            self.handicapIndex = try c.decodeNil(forKey: .handicapIndex)
                ? .null
                : .value(try c.decode(Double.self, forKey: .handicapIndex))
        } else {
            self.handicapIndex = .absent
        }
        if c.contains(.gender) {
            self.gender = try c.decodeNil(forKey: .gender)
                ? .null
                : .value(try c.decode(PlayerGender.self, forKey: .gender))
        } else {
            self.gender = .absent
        }
        if c.contains(.homeClubId) {
            self.homeClubId = try c.decodeNil(forKey: .homeClubId)
                ? .null
                : .value(try c.decode(String.self, forKey: .homeClubId))
        } else {
            self.homeClubId = .absent
        }
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(username, forKey: .username)
        try c.encode(password, forKey: .password)
        try c.encode(displayName, forKey: .displayName)
        switch handicapIndex {
        case .absent: break
        case .null: try c.encodeNil(forKey: .handicapIndex)
        case .value(let v): try c.encode(v, forKey: .handicapIndex)
        }
        switch gender {
        case .absent: break
        case .null: try c.encodeNil(forKey: .gender)
        case .value(let v): try c.encode(v, forKey: .gender)
        }
        switch homeClubId {
        case .absent: break
        case .null: try c.encodeNil(forKey: .homeClubId)
        case .value(let v): try c.encode(v, forKey: .homeClubId)
        }
    }
}

struct PlayersUpdateHandicapInput: Codable, Sendable, Equatable {
    var handicapIndex: Double
    var effectiveDate: String?

    enum CodingKeys: String, CodingKey {
        case handicapIndex = "handicapIndex"
        case effectiveDate = "effectiveDate"
    }

    init(handicapIndex: Double, effectiveDate: String? = nil) {
        self.handicapIndex = handicapIndex
        self.effectiveDate = effectiveDate
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.handicapIndex = try c.decode(Double.self, forKey: .handicapIndex)
        self.effectiveDate = try c.decodeIfPresent(String.self, forKey: .effectiveDate)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(handicapIndex, forKey: .handicapIndex)
        try c.encodeIfPresent(effectiveDate, forKey: .effectiveDate)
    }
}

struct PlayersUpdateProfileInput: Codable, Sendable, Equatable {
    var displayName: String?
    var gender: TriState<PlayerGender>
    var homeClubId: TriState<String>

    enum CodingKeys: String, CodingKey {
        case displayName = "displayName"
        case gender = "gender"
        case homeClubId = "homeClubId"
    }

    init(displayName: String? = nil, gender: TriState<PlayerGender> = .absent, homeClubId: TriState<String> = .absent) {
        self.displayName = displayName
        self.gender = gender
        self.homeClubId = homeClubId
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.displayName = try c.decodeIfPresent(String.self, forKey: .displayName)
        if c.contains(.gender) {
            self.gender = try c.decodeNil(forKey: .gender)
                ? .null
                : .value(try c.decode(PlayerGender.self, forKey: .gender))
        } else {
            self.gender = .absent
        }
        if c.contains(.homeClubId) {
            self.homeClubId = try c.decodeNil(forKey: .homeClubId)
                ? .null
                : .value(try c.decode(String.self, forKey: .homeClubId))
        } else {
            self.homeClubId = .absent
        }
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encodeIfPresent(displayName, forKey: .displayName)
        switch gender {
        case .absent: break
        case .null: try c.encodeNil(forKey: .gender)
        case .value(let v): try c.encode(v, forKey: .gender)
        }
        switch homeClubId {
        case .absent: break
        case .null: try c.encodeNil(forKey: .homeClubId)
        case .value(let v): try c.encode(v, forKey: .homeClubId)
        }
    }
}

struct PlayersSearchInput: Codable, Sendable, Equatable {
    var q: String?

    enum CodingKeys: String, CodingKey {
        case q = "q"
    }

    init(q: String? = nil) {
        self.q = q
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.q = try c.decodeIfPresent(String.self, forKey: .q)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encodeIfPresent(q, forKey: .q)
    }
}
