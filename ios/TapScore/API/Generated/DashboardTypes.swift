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
