// GENERATED — DO NOT EDIT. bun run generate:swift

import Foundation

enum RoleGrantRole: String, Codable, Sendable, Equatable {
    case superAdmin = "super_admin"
    case seriesAdmin = "series_admin"
    case tourAdmin = "tour_admin"
    case competitionAdmin = "competition_admin"
    case courseAdmin = "course_admin"
    case friendlyRoundOwner = "friendly_round_owner"
}

struct RoleGrant: Codable, Sendable, Equatable {
    var id: String
    var playerId: String
    var role: RoleGrantRole
    var scopeType: String?
    var scopeId: String?
    var grantedAt: String

    enum CodingKeys: String, CodingKey {
        case id = "id"
        case playerId = "playerId"
        case role = "role"
        case scopeType = "scopeType"
        case scopeId = "scopeId"
        case grantedAt = "grantedAt"
    }

    init(id: String, playerId: String, role: RoleGrantRole, scopeType: String? = nil, scopeId: String? = nil, grantedAt: String) {
        self.id = id
        self.playerId = playerId
        self.role = role
        self.scopeType = scopeType
        self.scopeId = scopeId
        self.grantedAt = grantedAt
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try c.decode(String.self, forKey: .id)
        self.playerId = try c.decode(String.self, forKey: .playerId)
        self.role = try c.decode(RoleGrantRole.self, forKey: .role)
        self.scopeType = try c.decodeIfPresent(String.self, forKey: .scopeType)
        self.scopeId = try c.decodeIfPresent(String.self, forKey: .scopeId)
        self.grantedAt = try c.decode(String.self, forKey: .grantedAt)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encode(playerId, forKey: .playerId)
        try c.encode(role, forKey: .role)
        if let scopeType {
            try c.encode(scopeType, forKey: .scopeType)
        } else {
            try c.encodeNil(forKey: .scopeType)
        }
        if let scopeId {
            try c.encode(scopeId, forKey: .scopeId)
        } else {
            try c.encodeNil(forKey: .scopeId)
        }
        try c.encode(grantedAt, forKey: .grantedAt)
    }
}

struct AdminStats: Codable, Sendable, Equatable {
    var players: Double
    var guests: Double
    var rounds: Double
    var roundsActive: Double
    var roundsComplete: Double
    var roundsLast7Days: Double
    var scoreEvents: Double

    enum CodingKeys: String, CodingKey {
        case players = "players"
        case guests = "guests"
        case rounds = "rounds"
        case roundsActive = "roundsActive"
        case roundsComplete = "roundsComplete"
        case roundsLast7Days = "roundsLast7Days"
        case scoreEvents = "scoreEvents"
    }

    init(players: Double, guests: Double, rounds: Double, roundsActive: Double, roundsComplete: Double, roundsLast7Days: Double, scoreEvents: Double) {
        self.players = players
        self.guests = guests
        self.rounds = rounds
        self.roundsActive = roundsActive
        self.roundsComplete = roundsComplete
        self.roundsLast7Days = roundsLast7Days
        self.scoreEvents = scoreEvents
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.players = try c.decode(Double.self, forKey: .players)
        self.guests = try c.decode(Double.self, forKey: .guests)
        self.rounds = try c.decode(Double.self, forKey: .rounds)
        self.roundsActive = try c.decode(Double.self, forKey: .roundsActive)
        self.roundsComplete = try c.decode(Double.self, forKey: .roundsComplete)
        self.roundsLast7Days = try c.decode(Double.self, forKey: .roundsLast7Days)
        self.scoreEvents = try c.decode(Double.self, forKey: .scoreEvents)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(players, forKey: .players)
        try c.encode(guests, forKey: .guests)
        try c.encode(rounds, forKey: .rounds)
        try c.encode(roundsActive, forKey: .roundsActive)
        try c.encode(roundsComplete, forKey: .roundsComplete)
        try c.encode(roundsLast7Days, forKey: .roundsLast7Days)
        try c.encode(scoreEvents, forKey: .scoreEvents)
    }
}

enum RoundStatus: String, Codable, Sendable, Equatable {
    case active = "active"
    case notStarted = "not_started"
    case complete = "complete"
}

enum RoundVisibility: String, Codable, Sendable, Equatable {
    case `private` = "private"
    case friends = "friends"
    case link = "link"
}

struct AdminRoundSummary: Codable, Sendable, Equatable {
    var roundId: String
    var shareToken: String?
    var date: String
    var status: RoundStatus
    var visibility: RoundVisibility
    var courseName: String?
    var createdAt: String
    var completedAt: String?
    var creatorPlayerId: String?
    var creatorName: String?
    var participants: [String]
    var scoreEventCount: Double
    var lastEventAt: String?

    enum CodingKeys: String, CodingKey {
        case roundId = "roundId"
        case shareToken = "shareToken"
        case date = "date"
        case status = "status"
        case visibility = "visibility"
        case courseName = "courseName"
        case createdAt = "createdAt"
        case completedAt = "completedAt"
        case creatorPlayerId = "creatorPlayerId"
        case creatorName = "creatorName"
        case participants = "participants"
        case scoreEventCount = "scoreEventCount"
        case lastEventAt = "lastEventAt"
    }

    init(roundId: String, shareToken: String? = nil, date: String, status: RoundStatus, visibility: RoundVisibility, courseName: String? = nil, createdAt: String, completedAt: String? = nil, creatorPlayerId: String? = nil, creatorName: String? = nil, participants: [String], scoreEventCount: Double, lastEventAt: String? = nil) {
        self.roundId = roundId
        self.shareToken = shareToken
        self.date = date
        self.status = status
        self.visibility = visibility
        self.courseName = courseName
        self.createdAt = createdAt
        self.completedAt = completedAt
        self.creatorPlayerId = creatorPlayerId
        self.creatorName = creatorName
        self.participants = participants
        self.scoreEventCount = scoreEventCount
        self.lastEventAt = lastEventAt
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.roundId = try c.decode(String.self, forKey: .roundId)
        self.shareToken = try c.decodeIfPresent(String.self, forKey: .shareToken)
        self.date = try c.decode(String.self, forKey: .date)
        self.status = try c.decode(RoundStatus.self, forKey: .status)
        self.visibility = try c.decode(RoundVisibility.self, forKey: .visibility)
        self.courseName = try c.decodeIfPresent(String.self, forKey: .courseName)
        self.createdAt = try c.decode(String.self, forKey: .createdAt)
        self.completedAt = try c.decodeIfPresent(String.self, forKey: .completedAt)
        self.creatorPlayerId = try c.decodeIfPresent(String.self, forKey: .creatorPlayerId)
        self.creatorName = try c.decodeIfPresent(String.self, forKey: .creatorName)
        self.participants = try c.decode([String].self, forKey: .participants)
        self.scoreEventCount = try c.decode(Double.self, forKey: .scoreEventCount)
        self.lastEventAt = try c.decodeIfPresent(String.self, forKey: .lastEventAt)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(roundId, forKey: .roundId)
        if let shareToken {
            try c.encode(shareToken, forKey: .shareToken)
        } else {
            try c.encodeNil(forKey: .shareToken)
        }
        try c.encode(date, forKey: .date)
        try c.encode(status, forKey: .status)
        try c.encode(visibility, forKey: .visibility)
        if let courseName {
            try c.encode(courseName, forKey: .courseName)
        } else {
            try c.encodeNil(forKey: .courseName)
        }
        try c.encode(createdAt, forKey: .createdAt)
        if let completedAt {
            try c.encode(completedAt, forKey: .completedAt)
        } else {
            try c.encodeNil(forKey: .completedAt)
        }
        if let creatorPlayerId {
            try c.encode(creatorPlayerId, forKey: .creatorPlayerId)
        } else {
            try c.encodeNil(forKey: .creatorPlayerId)
        }
        if let creatorName {
            try c.encode(creatorName, forKey: .creatorName)
        } else {
            try c.encodeNil(forKey: .creatorName)
        }
        try c.encode(participants, forKey: .participants)
        try c.encode(scoreEventCount, forKey: .scoreEventCount)
        if let lastEventAt {
            try c.encode(lastEventAt, forKey: .lastEventAt)
        } else {
            try c.encodeNil(forKey: .lastEventAt)
        }
    }
}

struct AdminPlayerSummary: Codable, Sendable, Equatable {
    var playerId: String
    var username: String
    var displayName: String
    var handicapIndex: Double?
    var createdAt: String
    var deletedAt: String?
    var roundCount: Double
    var lastRoundDate: String?
    var roles: [String]

    enum CodingKeys: String, CodingKey {
        case playerId = "playerId"
        case username = "username"
        case displayName = "displayName"
        case handicapIndex = "handicapIndex"
        case createdAt = "createdAt"
        case deletedAt = "deletedAt"
        case roundCount = "roundCount"
        case lastRoundDate = "lastRoundDate"
        case roles = "roles"
    }

    init(playerId: String, username: String, displayName: String, handicapIndex: Double? = nil, createdAt: String, deletedAt: String? = nil, roundCount: Double, lastRoundDate: String? = nil, roles: [String]) {
        self.playerId = playerId
        self.username = username
        self.displayName = displayName
        self.handicapIndex = handicapIndex
        self.createdAt = createdAt
        self.deletedAt = deletedAt
        self.roundCount = roundCount
        self.lastRoundDate = lastRoundDate
        self.roles = roles
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.playerId = try c.decode(String.self, forKey: .playerId)
        self.username = try c.decode(String.self, forKey: .username)
        self.displayName = try c.decode(String.self, forKey: .displayName)
        self.handicapIndex = try c.decodeIfPresent(Double.self, forKey: .handicapIndex)
        self.createdAt = try c.decode(String.self, forKey: .createdAt)
        self.deletedAt = try c.decodeIfPresent(String.self, forKey: .deletedAt)
        self.roundCount = try c.decode(Double.self, forKey: .roundCount)
        self.lastRoundDate = try c.decodeIfPresent(String.self, forKey: .lastRoundDate)
        self.roles = try c.decode([String].self, forKey: .roles)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(playerId, forKey: .playerId)
        try c.encode(username, forKey: .username)
        try c.encode(displayName, forKey: .displayName)
        if let handicapIndex {
            try c.encode(handicapIndex, forKey: .handicapIndex)
        } else {
            try c.encodeNil(forKey: .handicapIndex)
        }
        try c.encode(createdAt, forKey: .createdAt)
        if let deletedAt {
            try c.encode(deletedAt, forKey: .deletedAt)
        } else {
            try c.encodeNil(forKey: .deletedAt)
        }
        try c.encode(roundCount, forKey: .roundCount)
        if let lastRoundDate {
            try c.encode(lastRoundDate, forKey: .lastRoundDate)
        } else {
            try c.encodeNil(forKey: .lastRoundDate)
        }
        try c.encode(roles, forKey: .roles)
    }
}

struct AdminAdminRoundsInput: Codable, Sendable, Equatable {
    var limit: Double?
    var offset: Double?

    enum CodingKeys: String, CodingKey {
        case limit = "limit"
        case offset = "offset"
    }

    init(limit: Double? = nil, offset: Double? = nil) {
        self.limit = limit
        self.offset = offset
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.limit = try c.decodeIfPresent(Double.self, forKey: .limit)
        self.offset = try c.decodeIfPresent(Double.self, forKey: .offset)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encodeIfPresent(limit, forKey: .limit)
        try c.encodeIfPresent(offset, forKey: .offset)
    }
}

struct AdminAdminGrantRoleInput: Codable, Sendable, Equatable {
    var playerId: String
    var role: RoleGrantRole
    var scopeType: TriState<String>
    var scopeId: TriState<String>

    enum CodingKeys: String, CodingKey {
        case playerId = "playerId"
        case role = "role"
        case scopeType = "scopeType"
        case scopeId = "scopeId"
    }

    init(playerId: String, role: RoleGrantRole, scopeType: TriState<String> = .absent, scopeId: TriState<String> = .absent) {
        self.playerId = playerId
        self.role = role
        self.scopeType = scopeType
        self.scopeId = scopeId
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.playerId = try c.decode(String.self, forKey: .playerId)
        self.role = try c.decode(RoleGrantRole.self, forKey: .role)
        if c.contains(.scopeType) {
            self.scopeType = try c.decodeNil(forKey: .scopeType)
                ? .null
                : .value(try c.decode(String.self, forKey: .scopeType))
        } else {
            self.scopeType = .absent
        }
        if c.contains(.scopeId) {
            self.scopeId = try c.decodeNil(forKey: .scopeId)
                ? .null
                : .value(try c.decode(String.self, forKey: .scopeId))
        } else {
            self.scopeId = .absent
        }
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(playerId, forKey: .playerId)
        try c.encode(role, forKey: .role)
        switch scopeType {
        case .absent: break
        case .null: try c.encodeNil(forKey: .scopeType)
        case .value(let v): try c.encode(v, forKey: .scopeType)
        }
        switch scopeId {
        case .absent: break
        case .null: try c.encodeNil(forKey: .scopeId)
        case .value(let v): try c.encode(v, forKey: .scopeId)
        }
    }
}

struct AdminAdminRevokeRoleOutput: Codable, Sendable, Equatable {
    let ok: Bool = true

    enum CodingKeys: String, CodingKey {
        case ok = "ok"
    }

    init() {
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        _ = try c.decode(Bool.self, forKey: .ok)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(ok, forKey: .ok)
    }
}
