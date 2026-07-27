// GENERATED — DO NOT EDIT. bun run generate:swift

import Foundation

struct PlayerSearchResult: Codable, Sendable, Equatable {
    var isFriend: Bool
    var id: String
    var username: String
    var displayName: String
    var gender: PlayerGender?
    var handicapIndex: Double?
    var homeClubName: String?

    enum CodingKeys: String, CodingKey {
        case isFriend = "isFriend"
        case id = "id"
        case username = "username"
        case displayName = "displayName"
        case gender = "gender"
        case handicapIndex = "handicapIndex"
        case homeClubName = "homeClubName"
    }

    init(isFriend: Bool, id: String, username: String, displayName: String, gender: PlayerGender? = nil, handicapIndex: Double? = nil, homeClubName: String? = nil) {
        self.isFriend = isFriend
        self.id = id
        self.username = username
        self.displayName = displayName
        self.gender = gender
        self.handicapIndex = handicapIndex
        self.homeClubName = homeClubName
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.isFriend = try c.decode(Bool.self, forKey: .isFriend)
        self.id = try c.decode(String.self, forKey: .id)
        self.username = try c.decode(String.self, forKey: .username)
        self.displayName = try c.decode(String.self, forKey: .displayName)
        self.gender = try c.decodeIfPresent(PlayerGender.self, forKey: .gender)
        self.handicapIndex = try c.decodeIfPresent(Double.self, forKey: .handicapIndex)
        self.homeClubName = try c.decodeIfPresent(String.self, forKey: .homeClubName)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(isFriend, forKey: .isFriend)
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

struct PlayersRegisterInput: Codable, Sendable, Equatable {
    var gender: TriState<PlayerGender>
    var handicapIndex: TriState<Double>
    var homeClubId: TriState<String>
    var displayName: String
    var username: String
    var password: String

    enum CodingKeys: String, CodingKey {
        case gender = "gender"
        case handicapIndex = "handicapIndex"
        case homeClubId = "homeClubId"
        case displayName = "displayName"
        case username = "username"
        case password = "password"
    }

    init(gender: TriState<PlayerGender> = .absent, handicapIndex: TriState<Double> = .absent, homeClubId: TriState<String> = .absent, displayName: String, username: String, password: String) {
        self.gender = gender
        self.handicapIndex = handicapIndex
        self.homeClubId = homeClubId
        self.displayName = displayName
        self.username = username
        self.password = password
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        if c.contains(.gender) {
            self.gender = try c.decodeNil(forKey: .gender)
                ? .null
                : .value(try c.decode(PlayerGender.self, forKey: .gender))
        } else {
            self.gender = .absent
        }
        if c.contains(.handicapIndex) {
            self.handicapIndex = try c.decodeNil(forKey: .handicapIndex)
                ? .null
                : .value(try c.decode(Double.self, forKey: .handicapIndex))
        } else {
            self.handicapIndex = .absent
        }
        if c.contains(.homeClubId) {
            self.homeClubId = try c.decodeNil(forKey: .homeClubId)
                ? .null
                : .value(try c.decode(String.self, forKey: .homeClubId))
        } else {
            self.homeClubId = .absent
        }
        self.displayName = try c.decode(String.self, forKey: .displayName)
        self.username = try c.decode(String.self, forKey: .username)
        self.password = try c.decode(String.self, forKey: .password)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        switch gender {
        case .absent: break
        case .null: try c.encodeNil(forKey: .gender)
        case .value(let v): try c.encode(v, forKey: .gender)
        }
        switch handicapIndex {
        case .absent: break
        case .null: try c.encodeNil(forKey: .handicapIndex)
        case .value(let v): try c.encode(v, forKey: .handicapIndex)
        }
        switch homeClubId {
        case .absent: break
        case .null: try c.encodeNil(forKey: .homeClubId)
        case .value(let v): try c.encode(v, forKey: .homeClubId)
        }
        try c.encode(displayName, forKey: .displayName)
        try c.encode(username, forKey: .username)
        try c.encode(password, forKey: .password)
    }
}

struct PlayersUpdateHandicapInput: Codable, Sendable, Equatable {
    var effectiveDate: String?
    var handicapIndex: Double

    enum CodingKeys: String, CodingKey {
        case effectiveDate = "effectiveDate"
        case handicapIndex = "handicapIndex"
    }

    init(effectiveDate: String? = nil, handicapIndex: Double) {
        self.effectiveDate = effectiveDate
        self.handicapIndex = handicapIndex
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.effectiveDate = try c.decodeIfPresent(String.self, forKey: .effectiveDate)
        self.handicapIndex = try c.decode(Double.self, forKey: .handicapIndex)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encodeIfPresent(effectiveDate, forKey: .effectiveDate)
        try c.encode(handicapIndex, forKey: .handicapIndex)
    }
}

struct PlayersUpdateProfileInput: Codable, Sendable, Equatable {
    var gender: TriState<PlayerGender>
    var homeClubId: TriState<String>

    enum CodingKeys: String, CodingKey {
        case gender = "gender"
        case homeClubId = "homeClubId"
    }

    init(gender: TriState<PlayerGender> = .absent, homeClubId: TriState<String> = .absent) {
        self.gender = gender
        self.homeClubId = homeClubId
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
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
