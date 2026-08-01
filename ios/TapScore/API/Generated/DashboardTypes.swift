// GENERATED — DO NOT EDIT. bun run generate:swift

import Foundation

struct DashboardRoundEntry: Codable, Sendable, Equatable {
    var round: Round
    var ballIds: [String]
    var slots: [DashboardSlotEntry]
    var shareToken: String?

    enum CodingKeys: String, CodingKey {
        case round = "round"
        case ballIds = "ballIds"
        case slots = "slots"
        case shareToken = "shareToken"
    }

    init(round: Round, ballIds: [String], slots: [DashboardSlotEntry], shareToken: String? = nil) {
        self.round = round
        self.ballIds = ballIds
        self.slots = slots
        self.shareToken = shareToken
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.round = try c.decode(Round.self, forKey: .round)
        self.ballIds = try c.decode([String].self, forKey: .ballIds)
        self.slots = try c.decode([DashboardSlotEntry].self, forKey: .slots)
        self.shareToken = try c.decodeIfPresent(String.self, forKey: .shareToken)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(round, forKey: .round)
        try c.encode(ballIds, forKey: .ballIds)
        try c.encode(slots, forKey: .slots)
        if let shareToken {
            try c.encode(shareToken, forKey: .shareToken)
        } else {
            try c.encodeNil(forKey: .shareToken)
        }
    }
}

struct FriendlyRound: Codable, Sendable, Equatable {
    var id: String
    var roundId: String
    var shareToken: String
    var creatorPlayerId: String?
    var createdAt: String

    enum CodingKeys: String, CodingKey {
        case id = "id"
        case roundId = "roundId"
        case shareToken = "shareToken"
        case creatorPlayerId = "creatorPlayerId"
        case createdAt = "createdAt"
    }

    init(id: String, roundId: String, shareToken: String, creatorPlayerId: String? = nil, createdAt: String) {
        self.id = id
        self.roundId = roundId
        self.shareToken = shareToken
        self.creatorPlayerId = creatorPlayerId
        self.createdAt = createdAt
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try c.decode(String.self, forKey: .id)
        self.roundId = try c.decode(String.self, forKey: .roundId)
        self.shareToken = try c.decode(String.self, forKey: .shareToken)
        self.creatorPlayerId = try c.decodeIfPresent(String.self, forKey: .creatorPlayerId)
        self.createdAt = try c.decode(String.self, forKey: .createdAt)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encode(roundId, forKey: .roundId)
        try c.encode(shareToken, forKey: .shareToken)
        if let creatorPlayerId {
            try c.encode(creatorPlayerId, forKey: .creatorPlayerId)
        } else {
            try c.encodeNil(forKey: .creatorPlayerId)
        }
        try c.encode(createdAt, forKey: .createdAt)
    }
}

struct FriendsActivity: Codable, Sendable, Equatable {
    var live: [FriendsActivityEntry]
    var recent: [FriendsActivityEntry]

    enum CodingKeys: String, CodingKey {
        case live = "live"
        case recent = "recent"
    }

    init(live: [FriendsActivityEntry], recent: [FriendsActivityEntry]) {
        self.live = live
        self.recent = recent
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.live = try c.decode([FriendsActivityEntry].self, forKey: .live)
        self.recent = try c.decode([FriendsActivityEntry].self, forKey: .recent)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(live, forKey: .live)
        try c.encode(recent, forKey: .recent)
    }
}

struct DashboardSlotEntry: Codable, Sendable, Equatable {
    var slotDefId: String
    var slotIndex: Double?
    var formatId: String
    var formatLabel: String
    var scoringMode: String
    var teamShape: String
    var ballId: String
    var playingHandicap: Double?
    var teamLabel: String?
    var position: Double?
    var total: Double?
    var metricLabel: String?

    enum CodingKeys: String, CodingKey {
        case slotDefId = "slotDefId"
        case slotIndex = "slotIndex"
        case formatId = "formatId"
        case formatLabel = "formatLabel"
        case scoringMode = "scoringMode"
        case teamShape = "teamShape"
        case ballId = "ballId"
        case playingHandicap = "playingHandicap"
        case teamLabel = "teamLabel"
        case position = "position"
        case total = "total"
        case metricLabel = "metricLabel"
    }

    init(slotDefId: String, slotIndex: Double? = nil, formatId: String, formatLabel: String, scoringMode: String, teamShape: String, ballId: String, playingHandicap: Double? = nil, teamLabel: String? = nil, position: Double? = nil, total: Double? = nil, metricLabel: String? = nil) {
        self.slotDefId = slotDefId
        self.slotIndex = slotIndex
        self.formatId = formatId
        self.formatLabel = formatLabel
        self.scoringMode = scoringMode
        self.teamShape = teamShape
        self.ballId = ballId
        self.playingHandicap = playingHandicap
        self.teamLabel = teamLabel
        self.position = position
        self.total = total
        self.metricLabel = metricLabel
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.slotDefId = try c.decode(String.self, forKey: .slotDefId)
        self.slotIndex = try c.decodeIfPresent(Double.self, forKey: .slotIndex)
        self.formatId = try c.decode(String.self, forKey: .formatId)
        self.formatLabel = try c.decode(String.self, forKey: .formatLabel)
        self.scoringMode = try c.decode(String.self, forKey: .scoringMode)
        self.teamShape = try c.decode(String.self, forKey: .teamShape)
        self.ballId = try c.decode(String.self, forKey: .ballId)
        self.playingHandicap = try c.decodeIfPresent(Double.self, forKey: .playingHandicap)
        self.teamLabel = try c.decodeIfPresent(String.self, forKey: .teamLabel)
        self.position = try c.decodeIfPresent(Double.self, forKey: .position)
        self.total = try c.decodeIfPresent(Double.self, forKey: .total)
        self.metricLabel = try c.decodeIfPresent(String.self, forKey: .metricLabel)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(slotDefId, forKey: .slotDefId)
        if let slotIndex {
            try c.encode(slotIndex, forKey: .slotIndex)
        } else {
            try c.encodeNil(forKey: .slotIndex)
        }
        try c.encode(formatId, forKey: .formatId)
        try c.encode(formatLabel, forKey: .formatLabel)
        try c.encode(scoringMode, forKey: .scoringMode)
        try c.encode(teamShape, forKey: .teamShape)
        try c.encode(ballId, forKey: .ballId)
        if let playingHandicap {
            try c.encode(playingHandicap, forKey: .playingHandicap)
        } else {
            try c.encodeNil(forKey: .playingHandicap)
        }
        if let teamLabel {
            try c.encode(teamLabel, forKey: .teamLabel)
        } else {
            try c.encodeNil(forKey: .teamLabel)
        }
        if let position {
            try c.encode(position, forKey: .position)
        } else {
            try c.encodeNil(forKey: .position)
        }
        if let total {
            try c.encode(total, forKey: .total)
        } else {
            try c.encodeNil(forKey: .total)
        }
        if let metricLabel {
            try c.encode(metricLabel, forKey: .metricLabel)
        } else {
            try c.encodeNil(forKey: .metricLabel)
        }
    }
}

struct FriendsActivityEntry: Codable, Sendable, Equatable {
    var roundId: String
    var name: String?
    var courseName: String?
    var date: String
    var status: AdminRoundSummaryStatus
    var holeCount: Double
    var lastActivityAt: String?
    var formatIds: [String]?
    var friends: [FriendsActivityFriend]

    enum CodingKeys: String, CodingKey {
        case roundId = "roundId"
        case name = "name"
        case courseName = "courseName"
        case date = "date"
        case status = "status"
        case holeCount = "holeCount"
        case lastActivityAt = "lastActivityAt"
        case formatIds = "formatIds"
        case friends = "friends"
    }

    init(roundId: String, name: String? = nil, courseName: String? = nil, date: String, status: AdminRoundSummaryStatus, holeCount: Double, lastActivityAt: String? = nil, formatIds: [String]? = nil, friends: [FriendsActivityFriend]) {
        self.roundId = roundId
        self.name = name
        self.courseName = courseName
        self.date = date
        self.status = status
        self.holeCount = holeCount
        self.lastActivityAt = lastActivityAt
        self.formatIds = formatIds
        self.friends = friends
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.roundId = try c.decode(String.self, forKey: .roundId)
        self.name = try c.decodeIfPresent(String.self, forKey: .name)
        self.courseName = try c.decodeIfPresent(String.self, forKey: .courseName)
        self.date = try c.decode(String.self, forKey: .date)
        self.status = try c.decode(AdminRoundSummaryStatus.self, forKey: .status)
        self.holeCount = try c.decode(Double.self, forKey: .holeCount)
        self.lastActivityAt = try c.decodeIfPresent(String.self, forKey: .lastActivityAt)
        self.formatIds = try c.decodeIfPresent([String].self, forKey: .formatIds)
        self.friends = try c.decode([FriendsActivityFriend].self, forKey: .friends)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(roundId, forKey: .roundId)
        if let name {
            try c.encode(name, forKey: .name)
        } else {
            try c.encodeNil(forKey: .name)
        }
        if let courseName {
            try c.encode(courseName, forKey: .courseName)
        } else {
            try c.encodeNil(forKey: .courseName)
        }
        try c.encode(date, forKey: .date)
        try c.encode(status, forKey: .status)
        try c.encode(holeCount, forKey: .holeCount)
        if let lastActivityAt {
            try c.encode(lastActivityAt, forKey: .lastActivityAt)
        } else {
            try c.encodeNil(forKey: .lastActivityAt)
        }
        try c.encodeIfPresent(formatIds, forKey: .formatIds)
        try c.encode(friends, forKey: .friends)
    }
}

struct FriendsActivityFriend: Codable, Sendable, Equatable {
    var playerId: String
    var displayName: String
    var avatarVersion: String?
    var holesPlayed: Double
    var scoreToPar: Double?

    enum CodingKeys: String, CodingKey {
        case playerId = "playerId"
        case displayName = "displayName"
        case avatarVersion = "avatarVersion"
        case holesPlayed = "holesPlayed"
        case scoreToPar = "scoreToPar"
    }

    init(playerId: String, displayName: String, avatarVersion: String? = nil, holesPlayed: Double, scoreToPar: Double? = nil) {
        self.playerId = playerId
        self.displayName = displayName
        self.avatarVersion = avatarVersion
        self.holesPlayed = holesPlayed
        self.scoreToPar = scoreToPar
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.playerId = try c.decode(String.self, forKey: .playerId)
        self.displayName = try c.decode(String.self, forKey: .displayName)
        self.avatarVersion = try c.decodeIfPresent(String.self, forKey: .avatarVersion)
        self.holesPlayed = try c.decode(Double.self, forKey: .holesPlayed)
        self.scoreToPar = try c.decodeIfPresent(Double.self, forKey: .scoreToPar)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(playerId, forKey: .playerId)
        try c.encode(displayName, forKey: .displayName)
        if let avatarVersion {
            try c.encode(avatarVersion, forKey: .avatarVersion)
        } else {
            try c.encodeNil(forKey: .avatarVersion)
        }
        try c.encode(holesPlayed, forKey: .holesPlayed)
        if let scoreToPar {
            try c.encode(scoreToPar, forKey: .scoreToPar)
        } else {
            try c.encodeNil(forKey: .scoreToPar)
        }
    }
}

struct DashboardMyRoundsOutputCreatedItem: Codable, Sendable, Equatable {
    var friendlyRound: FriendlyRound
    var round: Round

    enum CodingKeys: String, CodingKey {
        case friendlyRound = "friendlyRound"
        case round = "round"
    }

    init(friendlyRound: FriendlyRound, round: Round) {
        self.friendlyRound = friendlyRound
        self.round = round
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.friendlyRound = try c.decode(FriendlyRound.self, forKey: .friendlyRound)
        self.round = try c.decode(Round.self, forKey: .round)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(friendlyRound, forKey: .friendlyRound)
        try c.encode(round, forKey: .round)
    }
}

struct DashboardMyRoundsOutput: Codable, Sendable, Equatable {
    var produced: [DashboardRoundEntry]
    var created: [DashboardMyRoundsOutputCreatedItem]

    enum CodingKeys: String, CodingKey {
        case produced = "produced"
        case created = "created"
    }

    init(produced: [DashboardRoundEntry], created: [DashboardMyRoundsOutputCreatedItem]) {
        self.produced = produced
        self.created = created
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.produced = try c.decode([DashboardRoundEntry].self, forKey: .produced)
        self.created = try c.decode([DashboardMyRoundsOutputCreatedItem].self, forKey: .created)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(produced, forKey: .produced)
        try c.encode(created, forKey: .created)
    }
}
