// GENERATED — DO NOT EDIT. bun run generate:swift

import Foundation

enum StartListPresetId: String, Codable, Sendable, Equatable {
    case organized = "organized"
    case organizedOpenSlots = "organized_open_slots"
    case pickYourTeeTime = "pick_your_tee_time"
    case selfOrganized = "self_organized"
}

struct StartListView: Codable, Sendable, Equatable {
    var policy: CompetitionDetailDefaultConfigStartListPolicy
    var presetId: StartListPresetId?
    var viewer: StartListOps
    var seats: [StartListSeat]
    var claimedSeats: [ClaimedSeat]

    enum CodingKeys: String, CodingKey {
        case policy = "policy"
        case presetId = "presetId"
        case viewer = "viewer"
        case seats = "seats"
        case claimedSeats = "claimedSeats"
    }

    init(policy: CompetitionDetailDefaultConfigStartListPolicy, presetId: StartListPresetId? = nil, viewer: StartListOps, seats: [StartListSeat], claimedSeats: [ClaimedSeat]) {
        self.policy = policy
        self.presetId = presetId
        self.viewer = viewer
        self.seats = seats
        self.claimedSeats = claimedSeats
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.policy = try c.decode(CompetitionDetailDefaultConfigStartListPolicy.self, forKey: .policy)
        self.presetId = try c.decodeIfPresent(StartListPresetId.self, forKey: .presetId)
        self.viewer = try c.decode(StartListOps.self, forKey: .viewer)
        self.seats = try c.decode([StartListSeat].self, forKey: .seats)
        self.claimedSeats = try c.decode([ClaimedSeat].self, forKey: .claimedSeats)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(policy, forKey: .policy)
        if let presetId {
            try c.encode(presetId, forKey: .presetId)
        } else {
            try c.encodeNil(forKey: .presetId)
        }
        try c.encode(viewer, forKey: .viewer)
        try c.encode(seats, forKey: .seats)
        try c.encode(claimedSeats, forKey: .claimedSeats)
    }
}

struct RoundBall: Codable, Sendable, Equatable {
    var id: String
    var label: String?
    var courseHandicap: Double?
    var players: [RoundBallPlayer]
    var slots: [RoundBallSlot]
    var pending: Bool

    enum CodingKeys: String, CodingKey {
        case id = "id"
        case label = "label"
        case courseHandicap = "courseHandicap"
        case players = "players"
        case slots = "slots"
        case pending = "pending"
    }

    init(id: String, label: String? = nil, courseHandicap: Double? = nil, players: [RoundBallPlayer], slots: [RoundBallSlot], pending: Bool) {
        self.id = id
        self.label = label
        self.courseHandicap = courseHandicap
        self.players = players
        self.slots = slots
        self.pending = pending
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try c.decode(String.self, forKey: .id)
        self.label = try c.decodeIfPresent(String.self, forKey: .label)
        self.courseHandicap = try c.decodeIfPresent(Double.self, forKey: .courseHandicap)
        self.players = try c.decode([RoundBallPlayer].self, forKey: .players)
        self.slots = try c.decode([RoundBallSlot].self, forKey: .slots)
        self.pending = try c.decode(Bool.self, forKey: .pending)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        if let label {
            try c.encode(label, forKey: .label)
        } else {
            try c.encodeNil(forKey: .label)
        }
        if let courseHandicap {
            try c.encode(courseHandicap, forKey: .courseHandicap)
        } else {
            try c.encodeNil(forKey: .courseHandicap)
        }
        try c.encode(players, forKey: .players)
        try c.encode(slots, forKey: .slots)
        try c.encode(pending, forKey: .pending)
    }
}

struct Scorecard: Codable, Sendable, Equatable {
    var ballId: String
    var holes: [ScorecardHole]

    enum CodingKeys: String, CodingKey {
        case ballId = "ballId"
        case holes = "holes"
    }

    init(ballId: String, holes: [ScorecardHole]) {
        self.ballId = ballId
        self.holes = holes
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.ballId = try c.decode(String.self, forKey: .ballId)
        self.holes = try c.decode([ScorecardHole].self, forKey: .holes)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(ballId, forKey: .ballId)
        try c.encode(holes, forKey: .holes)
    }
}

struct RoundResultPosting: Codable, Sendable, Equatable {
    var eligible: Bool
    var reason: String?

    enum CodingKeys: String, CodingKey {
        case eligible = "eligible"
        case reason = "reason"
    }

    init(eligible: Bool, reason: String? = nil) {
        self.eligible = eligible
        self.reason = reason
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.eligible = try c.decode(Bool.self, forKey: .eligible)
        self.reason = try c.decodeIfPresent(String.self, forKey: .reason)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(eligible, forKey: .eligible)
        if let reason {
            try c.encode(reason, forKey: .reason)
        } else {
            try c.encodeNil(forKey: .reason)
        }
    }
}

struct RoundResult: Codable, Sendable, Equatable {
    var slots: [SlotResultView]
    var routeSections: [RouteSectionRef]
    var posting: RoundResultPosting

    enum CodingKeys: String, CodingKey {
        case slots = "slots"
        case routeSections = "routeSections"
        case posting = "posting"
    }

    init(slots: [SlotResultView], routeSections: [RouteSectionRef], posting: RoundResultPosting) {
        self.slots = slots
        self.routeSections = routeSections
        self.posting = posting
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.slots = try c.decode([SlotResultView].self, forKey: .slots)
        self.routeSections = try c.decode([RouteSectionRef].self, forKey: .routeSections)
        self.posting = try c.decode(RoundResultPosting.self, forKey: .posting)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(slots, forKey: .slots)
        try c.encode(routeSections, forKey: .routeSections)
        try c.encode(posting, forKey: .posting)
    }
}

struct AppendResult: Codable, Sendable, Equatable {
    var event: ScoreEvent
    var inserted: Bool

    enum CodingKeys: String, CodingKey {
        case event = "event"
        case inserted = "inserted"
    }

    init(event: ScoreEvent, inserted: Bool) {
        self.event = event
        self.inserted = inserted
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.event = try c.decode(ScoreEvent.self, forKey: .event)
        self.inserted = try c.decode(Bool.self, forKey: .inserted)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(event, forKey: .event)
        try c.encode(inserted, forKey: .inserted)
    }
}

struct ClaimGuestResult: Codable, Sendable, Equatable {
    var roundId: String
    var guestPlayerId: String
    var playerId: String
    var ballPlayersFlipped: Double
    var scoreEventsFlipped: Double

    enum CodingKeys: String, CodingKey {
        case roundId = "roundId"
        case guestPlayerId = "guestPlayerId"
        case playerId = "playerId"
        case ballPlayersFlipped = "ballPlayersFlipped"
        case scoreEventsFlipped = "scoreEventsFlipped"
    }

    init(roundId: String, guestPlayerId: String, playerId: String, ballPlayersFlipped: Double, scoreEventsFlipped: Double) {
        self.roundId = roundId
        self.guestPlayerId = guestPlayerId
        self.playerId = playerId
        self.ballPlayersFlipped = ballPlayersFlipped
        self.scoreEventsFlipped = scoreEventsFlipped
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.roundId = try c.decode(String.self, forKey: .roundId)
        self.guestPlayerId = try c.decode(String.self, forKey: .guestPlayerId)
        self.playerId = try c.decode(String.self, forKey: .playerId)
        self.ballPlayersFlipped = try c.decode(Double.self, forKey: .ballPlayersFlipped)
        self.scoreEventsFlipped = try c.decode(Double.self, forKey: .scoreEventsFlipped)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(roundId, forKey: .roundId)
        try c.encode(guestPlayerId, forKey: .guestPlayerId)
        try c.encode(playerId, forKey: .playerId)
        try c.encode(ballPlayersFlipped, forKey: .ballPlayersFlipped)
        try c.encode(scoreEventsFlipped, forKey: .scoreEventsFlipped)
    }
}

struct RenameGuestResult: Codable, Sendable, Equatable {
    var guestPlayerId: String
    var displayName: String
    var ballPlayersUpdated: Double

    enum CodingKeys: String, CodingKey {
        case guestPlayerId = "guestPlayerId"
        case displayName = "displayName"
        case ballPlayersUpdated = "ballPlayersUpdated"
    }

    init(guestPlayerId: String, displayName: String, ballPlayersUpdated: Double) {
        self.guestPlayerId = guestPlayerId
        self.displayName = displayName
        self.ballPlayersUpdated = ballPlayersUpdated
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.guestPlayerId = try c.decode(String.self, forKey: .guestPlayerId)
        self.displayName = try c.decode(String.self, forKey: .displayName)
        self.ballPlayersUpdated = try c.decode(Double.self, forKey: .ballPlayersUpdated)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(guestPlayerId, forKey: .guestPlayerId)
        try c.encode(displayName, forKey: .displayName)
        try c.encode(ballPlayersUpdated, forKey: .ballPlayersUpdated)
    }
}

struct StartListOps: Codable, Sendable, Equatable {
    var join: StartListOpDecision
    var createGroup: StartListOpDecision
    var claimSeat: StartListOpDecision
    var claimSeatAsGuest: StartListOpDecision
    var maxGroupSize: Double

    enum CodingKeys: String, CodingKey {
        case join = "join"
        case createGroup = "createGroup"
        case claimSeat = "claimSeat"
        case claimSeatAsGuest = "claimSeatAsGuest"
        case maxGroupSize = "maxGroupSize"
    }

    init(join: StartListOpDecision, createGroup: StartListOpDecision, claimSeat: StartListOpDecision, claimSeatAsGuest: StartListOpDecision, maxGroupSize: Double) {
        self.join = join
        self.createGroup = createGroup
        self.claimSeat = claimSeat
        self.claimSeatAsGuest = claimSeatAsGuest
        self.maxGroupSize = maxGroupSize
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.join = try c.decode(StartListOpDecision.self, forKey: .join)
        self.createGroup = try c.decode(StartListOpDecision.self, forKey: .createGroup)
        self.claimSeat = try c.decode(StartListOpDecision.self, forKey: .claimSeat)
        self.claimSeatAsGuest = try c.decode(StartListOpDecision.self, forKey: .claimSeatAsGuest)
        self.maxGroupSize = try c.decode(Double.self, forKey: .maxGroupSize)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(join, forKey: .join)
        try c.encode(createGroup, forKey: .createGroup)
        try c.encode(claimSeat, forKey: .claimSeat)
        try c.encode(claimSeatAsGuest, forKey: .claimSeatAsGuest)
        try c.encode(maxGroupSize, forKey: .maxGroupSize)
    }
}

struct StartListSeat: Codable, Sendable, Equatable {
    var seatId: String
    var label: String
    var ballId: String
    var groupId: String?
    var teamRef: String?
    var category: String?

    enum CodingKeys: String, CodingKey {
        case seatId = "seatId"
        case label = "label"
        case ballId = "ballId"
        case groupId = "groupId"
        case teamRef = "teamRef"
        case category = "category"
    }

    init(seatId: String, label: String, ballId: String, groupId: String? = nil, teamRef: String? = nil, category: String? = nil) {
        self.seatId = seatId
        self.label = label
        self.ballId = ballId
        self.groupId = groupId
        self.teamRef = teamRef
        self.category = category
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.seatId = try c.decode(String.self, forKey: .seatId)
        self.label = try c.decode(String.self, forKey: .label)
        self.ballId = try c.decode(String.self, forKey: .ballId)
        self.groupId = try c.decodeIfPresent(String.self, forKey: .groupId)
        self.teamRef = try c.decodeIfPresent(String.self, forKey: .teamRef)
        self.category = try c.decodeIfPresent(String.self, forKey: .category)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(seatId, forKey: .seatId)
        try c.encode(label, forKey: .label)
        try c.encode(ballId, forKey: .ballId)
        if let groupId {
            try c.encode(groupId, forKey: .groupId)
        } else {
            try c.encodeNil(forKey: .groupId)
        }
        if let teamRef {
            try c.encode(teamRef, forKey: .teamRef)
        } else {
            try c.encodeNil(forKey: .teamRef)
        }
        if let category {
            try c.encode(category, forKey: .category)
        } else {
            try c.encodeNil(forKey: .category)
        }
    }
}

struct ClaimedSeat: Codable, Sendable, Equatable {
    var seatId: String
    var seatLabel: String
    var displayName: String
    var ballId: String?
    var occupiedByViewer: Bool
    var hasScores: Bool
    var viewerMayRelease: Bool

    enum CodingKeys: String, CodingKey {
        case seatId = "seatId"
        case seatLabel = "seatLabel"
        case displayName = "displayName"
        case ballId = "ballId"
        case occupiedByViewer = "occupiedByViewer"
        case hasScores = "hasScores"
        case viewerMayRelease = "viewerMayRelease"
    }

    init(seatId: String, seatLabel: String, displayName: String, ballId: String? = nil, occupiedByViewer: Bool, hasScores: Bool, viewerMayRelease: Bool) {
        self.seatId = seatId
        self.seatLabel = seatLabel
        self.displayName = displayName
        self.ballId = ballId
        self.occupiedByViewer = occupiedByViewer
        self.hasScores = hasScores
        self.viewerMayRelease = viewerMayRelease
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.seatId = try c.decode(String.self, forKey: .seatId)
        self.seatLabel = try c.decode(String.self, forKey: .seatLabel)
        self.displayName = try c.decode(String.self, forKey: .displayName)
        self.ballId = try c.decodeIfPresent(String.self, forKey: .ballId)
        self.occupiedByViewer = try c.decode(Bool.self, forKey: .occupiedByViewer)
        self.hasScores = try c.decode(Bool.self, forKey: .hasScores)
        self.viewerMayRelease = try c.decode(Bool.self, forKey: .viewerMayRelease)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(seatId, forKey: .seatId)
        try c.encode(seatLabel, forKey: .seatLabel)
        try c.encode(displayName, forKey: .displayName)
        if let ballId {
            try c.encode(ballId, forKey: .ballId)
        } else {
            try c.encodeNil(forKey: .ballId)
        }
        try c.encode(occupiedByViewer, forKey: .occupiedByViewer)
        try c.encode(hasScores, forKey: .hasScores)
        try c.encode(viewerMayRelease, forKey: .viewerMayRelease)
    }
}

struct RoundBallPlayer: Codable, Sendable, Equatable {
    var producerDefId: String
    var playerId: String?
    var guestPlayerId: String?
    var displayName: String
    var handicapIndex: Double?
    var teeName: String?
    var courseHandicap: Double?
    var pending: Bool

    enum CodingKeys: String, CodingKey {
        case producerDefId = "producerDefId"
        case playerId = "playerId"
        case guestPlayerId = "guestPlayerId"
        case displayName = "displayName"
        case handicapIndex = "handicapIndex"
        case teeName = "teeName"
        case courseHandicap = "courseHandicap"
        case pending = "pending"
    }

    init(producerDefId: String, playerId: String? = nil, guestPlayerId: String? = nil, displayName: String, handicapIndex: Double? = nil, teeName: String? = nil, courseHandicap: Double? = nil, pending: Bool) {
        self.producerDefId = producerDefId
        self.playerId = playerId
        self.guestPlayerId = guestPlayerId
        self.displayName = displayName
        self.handicapIndex = handicapIndex
        self.teeName = teeName
        self.courseHandicap = courseHandicap
        self.pending = pending
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.producerDefId = try c.decode(String.self, forKey: .producerDefId)
        self.playerId = try c.decodeIfPresent(String.self, forKey: .playerId)
        self.guestPlayerId = try c.decodeIfPresent(String.self, forKey: .guestPlayerId)
        self.displayName = try c.decode(String.self, forKey: .displayName)
        self.handicapIndex = try c.decodeIfPresent(Double.self, forKey: .handicapIndex)
        self.teeName = try c.decodeIfPresent(String.self, forKey: .teeName)
        self.courseHandicap = try c.decodeIfPresent(Double.self, forKey: .courseHandicap)
        self.pending = try c.decode(Bool.self, forKey: .pending)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(producerDefId, forKey: .producerDefId)
        if let playerId {
            try c.encode(playerId, forKey: .playerId)
        } else {
            try c.encodeNil(forKey: .playerId)
        }
        if let guestPlayerId {
            try c.encode(guestPlayerId, forKey: .guestPlayerId)
        } else {
            try c.encodeNil(forKey: .guestPlayerId)
        }
        try c.encode(displayName, forKey: .displayName)
        if let handicapIndex {
            try c.encode(handicapIndex, forKey: .handicapIndex)
        } else {
            try c.encodeNil(forKey: .handicapIndex)
        }
        if let teeName {
            try c.encode(teeName, forKey: .teeName)
        } else {
            try c.encodeNil(forKey: .teeName)
        }
        if let courseHandicap {
            try c.encode(courseHandicap, forKey: .courseHandicap)
        } else {
            try c.encodeNil(forKey: .courseHandicap)
        }
        try c.encode(pending, forKey: .pending)
    }
}

struct RoundBallSlot: Codable, Sendable, Equatable {
    var slotDefId: String
    var slotIndex: Double?
    var playingHandicap: Double?
    var teamLabel: String?
    var handicapDerivation: HandicapDerivation?

    enum CodingKeys: String, CodingKey {
        case slotDefId = "slotDefId"
        case slotIndex = "slotIndex"
        case playingHandicap = "playingHandicap"
        case teamLabel = "teamLabel"
        case handicapDerivation = "handicapDerivation"
    }

    init(slotDefId: String, slotIndex: Double? = nil, playingHandicap: Double? = nil, teamLabel: String? = nil, handicapDerivation: HandicapDerivation? = nil) {
        self.slotDefId = slotDefId
        self.slotIndex = slotIndex
        self.playingHandicap = playingHandicap
        self.teamLabel = teamLabel
        self.handicapDerivation = handicapDerivation
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.slotDefId = try c.decode(String.self, forKey: .slotDefId)
        self.slotIndex = try c.decodeIfPresent(Double.self, forKey: .slotIndex)
        self.playingHandicap = try c.decodeIfPresent(Double.self, forKey: .playingHandicap)
        self.teamLabel = try c.decodeIfPresent(String.self, forKey: .teamLabel)
        self.handicapDerivation = try c.decodeIfPresent(HandicapDerivation.self, forKey: .handicapDerivation)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(slotDefId, forKey: .slotDefId)
        if let slotIndex {
            try c.encode(slotIndex, forKey: .slotIndex)
        } else {
            try c.encodeNil(forKey: .slotIndex)
        }
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
        if let handicapDerivation {
            try c.encode(handicapDerivation, forKey: .handicapDerivation)
        } else {
            try c.encodeNil(forKey: .handicapDerivation)
        }
    }
}

struct ScorecardHole: Codable, Sendable, Equatable {
    var playHoleId: String
    var holeNumber: Double
    var courseHoleNumber: Double
    var canonicalOrdinal: Double
    var occurrenceLabel: String
    var strokes: Double?
    var recordedBy: String?
    var recordedAt: String
    var sourcePlayerId: String?
    var sourceGuestPlayerId: String?
    var metadata: TriState<[String: JSONValue]>

    enum CodingKeys: String, CodingKey {
        case playHoleId = "playHoleId"
        case holeNumber = "holeNumber"
        case courseHoleNumber = "courseHoleNumber"
        case canonicalOrdinal = "canonicalOrdinal"
        case occurrenceLabel = "occurrenceLabel"
        case strokes = "strokes"
        case recordedBy = "recordedBy"
        case recordedAt = "recordedAt"
        case sourcePlayerId = "sourcePlayerId"
        case sourceGuestPlayerId = "sourceGuestPlayerId"
        case metadata = "metadata"
    }

    init(playHoleId: String, holeNumber: Double, courseHoleNumber: Double, canonicalOrdinal: Double, occurrenceLabel: String, strokes: Double? = nil, recordedBy: String? = nil, recordedAt: String, sourcePlayerId: String? = nil, sourceGuestPlayerId: String? = nil, metadata: TriState<[String: JSONValue]> = .absent) {
        self.playHoleId = playHoleId
        self.holeNumber = holeNumber
        self.courseHoleNumber = courseHoleNumber
        self.canonicalOrdinal = canonicalOrdinal
        self.occurrenceLabel = occurrenceLabel
        self.strokes = strokes
        self.recordedBy = recordedBy
        self.recordedAt = recordedAt
        self.sourcePlayerId = sourcePlayerId
        self.sourceGuestPlayerId = sourceGuestPlayerId
        self.metadata = metadata
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.playHoleId = try c.decode(String.self, forKey: .playHoleId)
        self.holeNumber = try c.decode(Double.self, forKey: .holeNumber)
        self.courseHoleNumber = try c.decode(Double.self, forKey: .courseHoleNumber)
        self.canonicalOrdinal = try c.decode(Double.self, forKey: .canonicalOrdinal)
        self.occurrenceLabel = try c.decode(String.self, forKey: .occurrenceLabel)
        self.strokes = try c.decodeIfPresent(Double.self, forKey: .strokes)
        self.recordedBy = try c.decodeIfPresent(String.self, forKey: .recordedBy)
        self.recordedAt = try c.decode(String.self, forKey: .recordedAt)
        self.sourcePlayerId = try c.decodeIfPresent(String.self, forKey: .sourcePlayerId)
        self.sourceGuestPlayerId = try c.decodeIfPresent(String.self, forKey: .sourceGuestPlayerId)
        if c.contains(.metadata) {
            self.metadata = try c.decodeNil(forKey: .metadata)
                ? .null
                : .value(try c.decode([String: JSONValue].self, forKey: .metadata))
        } else {
            self.metadata = .absent
        }
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(playHoleId, forKey: .playHoleId)
        try c.encode(holeNumber, forKey: .holeNumber)
        try c.encode(courseHoleNumber, forKey: .courseHoleNumber)
        try c.encode(canonicalOrdinal, forKey: .canonicalOrdinal)
        try c.encode(occurrenceLabel, forKey: .occurrenceLabel)
        if let strokes {
            try c.encode(strokes, forKey: .strokes)
        } else {
            try c.encodeNil(forKey: .strokes)
        }
        if let recordedBy {
            try c.encode(recordedBy, forKey: .recordedBy)
        } else {
            try c.encodeNil(forKey: .recordedBy)
        }
        try c.encode(recordedAt, forKey: .recordedAt)
        if let sourcePlayerId {
            try c.encode(sourcePlayerId, forKey: .sourcePlayerId)
        } else {
            try c.encodeNil(forKey: .sourcePlayerId)
        }
        if let sourceGuestPlayerId {
            try c.encode(sourceGuestPlayerId, forKey: .sourceGuestPlayerId)
        } else {
            try c.encodeNil(forKey: .sourceGuestPlayerId)
        }
        switch metadata {
        case .absent: break
        case .null: try c.encodeNil(forKey: .metadata)
        case .value(let v): try c.encode(v, forKey: .metadata)
        }
    }
}

enum SlotResultViewLeaderboardItem: Codable, Sendable, Equatable {
    case ranked(RankedSection)
    case matchSummary(MatchSummarySection)

    private enum DiscriminantKey: String, CodingKey {
        case discriminant = "kind"
    }

    init(from decoder: any Decoder) throws {
        let tag = try decoder.container(keyedBy: DiscriminantKey.self)
        let discriminant = try tag.decode(String.self, forKey: .discriminant)
        switch discriminant {
        case "ranked":
            self = .ranked(try RankedSection(from: decoder))
        case "match_summary":
            self = .matchSummary(try MatchSummarySection(from: decoder))
        default:
            throw DecodingError.dataCorrupted(.init(
                codingPath: decoder.codingPath,
                debugDescription: "unknown kind: \(discriminant)"))
        }
    }

    func encode(to encoder: any Encoder) throws {
        switch self {
        case .ranked(let v): try v.encode(to: encoder)
        case .matchSummary(let v): try v.encode(to: encoder)
        }
    }
}

struct SlotResultViewSubjectLabelsItem: Codable, Sendable, Equatable {
    var ballId: String
    var label: String
    var memberBallIds: [String]

    enum CodingKeys: String, CodingKey {
        case ballId = "ballId"
        case label = "label"
        case memberBallIds = "memberBallIds"
    }

    init(ballId: String, label: String, memberBallIds: [String]) {
        self.ballId = ballId
        self.label = label
        self.memberBallIds = memberBallIds
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.ballId = try c.decode(String.self, forKey: .ballId)
        self.label = try c.decode(String.self, forKey: .label)
        self.memberBallIds = try c.decode([String].self, forKey: .memberBallIds)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(ballId, forKey: .ballId)
        try c.encode(label, forKey: .label)
        try c.encode(memberBallIds, forKey: .memberBallIds)
    }
}

struct SlotResultView: Codable, Sendable, Equatable {
    var slotIndex: Double
    var slotDefId: String
    var formatId: String
    var formatLabel: String
    var scoringMode: String
    var teamShape: String
    var allowanceLabel: String
    var cards: [ScoreGridSection]
    var leaderboard: [SlotResultViewLeaderboardItem]
    var subjectLabels: [SlotResultViewSubjectLabelsItem]?

    enum CodingKeys: String, CodingKey {
        case slotIndex = "slotIndex"
        case slotDefId = "slotDefId"
        case formatId = "formatId"
        case formatLabel = "formatLabel"
        case scoringMode = "scoringMode"
        case teamShape = "teamShape"
        case allowanceLabel = "allowanceLabel"
        case cards = "cards"
        case leaderboard = "leaderboard"
        case subjectLabels = "subjectLabels"
    }

    init(slotIndex: Double, slotDefId: String, formatId: String, formatLabel: String, scoringMode: String, teamShape: String, allowanceLabel: String, cards: [ScoreGridSection], leaderboard: [SlotResultViewLeaderboardItem], subjectLabels: [SlotResultViewSubjectLabelsItem]? = nil) {
        self.slotIndex = slotIndex
        self.slotDefId = slotDefId
        self.formatId = formatId
        self.formatLabel = formatLabel
        self.scoringMode = scoringMode
        self.teamShape = teamShape
        self.allowanceLabel = allowanceLabel
        self.cards = cards
        self.leaderboard = leaderboard
        self.subjectLabels = subjectLabels
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.slotIndex = try c.decode(Double.self, forKey: .slotIndex)
        self.slotDefId = try c.decode(String.self, forKey: .slotDefId)
        self.formatId = try c.decode(String.self, forKey: .formatId)
        self.formatLabel = try c.decode(String.self, forKey: .formatLabel)
        self.scoringMode = try c.decode(String.self, forKey: .scoringMode)
        self.teamShape = try c.decode(String.self, forKey: .teamShape)
        self.allowanceLabel = try c.decode(String.self, forKey: .allowanceLabel)
        self.cards = try c.decode([ScoreGridSection].self, forKey: .cards)
        self.leaderboard = try c.decode([SlotResultViewLeaderboardItem].self, forKey: .leaderboard)
        self.subjectLabels = try c.decodeIfPresent([SlotResultViewSubjectLabelsItem].self, forKey: .subjectLabels)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(slotIndex, forKey: .slotIndex)
        try c.encode(slotDefId, forKey: .slotDefId)
        try c.encode(formatId, forKey: .formatId)
        try c.encode(formatLabel, forKey: .formatLabel)
        try c.encode(scoringMode, forKey: .scoringMode)
        try c.encode(teamShape, forKey: .teamShape)
        try c.encode(allowanceLabel, forKey: .allowanceLabel)
        try c.encode(cards, forKey: .cards)
        try c.encode(leaderboard, forKey: .leaderboard)
        try c.encodeIfPresent(subjectLabels, forKey: .subjectLabels)
    }
}

struct RouteSectionRef: Codable, Sendable, Equatable {
    var id: String
    var label: String
    var fromCanonicalOrdinal: Double
    var toCanonicalOrdinal: Double

    enum CodingKeys: String, CodingKey {
        case id = "id"
        case label = "label"
        case fromCanonicalOrdinal = "fromCanonicalOrdinal"
        case toCanonicalOrdinal = "toCanonicalOrdinal"
    }

    init(id: String, label: String, fromCanonicalOrdinal: Double, toCanonicalOrdinal: Double) {
        self.id = id
        self.label = label
        self.fromCanonicalOrdinal = fromCanonicalOrdinal
        self.toCanonicalOrdinal = toCanonicalOrdinal
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try c.decode(String.self, forKey: .id)
        self.label = try c.decode(String.self, forKey: .label)
        self.fromCanonicalOrdinal = try c.decode(Double.self, forKey: .fromCanonicalOrdinal)
        self.toCanonicalOrdinal = try c.decode(Double.self, forKey: .toCanonicalOrdinal)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encode(label, forKey: .label)
        try c.encode(fromCanonicalOrdinal, forKey: .fromCanonicalOrdinal)
        try c.encode(toCanonicalOrdinal, forKey: .toCanonicalOrdinal)
    }
}

enum ScoreEventEventType: String, Codable, Sendable, Equatable {
    case scoreEntered = "score_entered"
    case scoreCleared = "score_cleared"
    case scoreConfirmed = "score_confirmed"
    case manualOverride = "manual_override"
}

struct ScoreEvent: Codable, Sendable, Equatable {
    var id: String
    var roundId: String
    var ballId: String
    var playHoleId: String
    var strokes: Double?
    var eventType: ScoreEventEventType
    var recordedByPlayerId: String?
    var recordedAt: String
    var clientEventId: String
    var sourcePlayerId: String?
    var sourceGuestPlayerId: String?
    var metadata: [String: JSONValue]?

    enum CodingKeys: String, CodingKey {
        case id = "id"
        case roundId = "roundId"
        case ballId = "ballId"
        case playHoleId = "playHoleId"
        case strokes = "strokes"
        case eventType = "eventType"
        case recordedByPlayerId = "recordedByPlayerId"
        case recordedAt = "recordedAt"
        case clientEventId = "clientEventId"
        case sourcePlayerId = "sourcePlayerId"
        case sourceGuestPlayerId = "sourceGuestPlayerId"
        case metadata = "metadata"
    }

    init(id: String, roundId: String, ballId: String, playHoleId: String, strokes: Double? = nil, eventType: ScoreEventEventType, recordedByPlayerId: String? = nil, recordedAt: String, clientEventId: String, sourcePlayerId: String? = nil, sourceGuestPlayerId: String? = nil, metadata: [String: JSONValue]? = nil) {
        self.id = id
        self.roundId = roundId
        self.ballId = ballId
        self.playHoleId = playHoleId
        self.strokes = strokes
        self.eventType = eventType
        self.recordedByPlayerId = recordedByPlayerId
        self.recordedAt = recordedAt
        self.clientEventId = clientEventId
        self.sourcePlayerId = sourcePlayerId
        self.sourceGuestPlayerId = sourceGuestPlayerId
        self.metadata = metadata
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try c.decode(String.self, forKey: .id)
        self.roundId = try c.decode(String.self, forKey: .roundId)
        self.ballId = try c.decode(String.self, forKey: .ballId)
        self.playHoleId = try c.decode(String.self, forKey: .playHoleId)
        self.strokes = try c.decodeIfPresent(Double.self, forKey: .strokes)
        self.eventType = try c.decode(ScoreEventEventType.self, forKey: .eventType)
        self.recordedByPlayerId = try c.decodeIfPresent(String.self, forKey: .recordedByPlayerId)
        self.recordedAt = try c.decode(String.self, forKey: .recordedAt)
        self.clientEventId = try c.decode(String.self, forKey: .clientEventId)
        self.sourcePlayerId = try c.decodeIfPresent(String.self, forKey: .sourcePlayerId)
        self.sourceGuestPlayerId = try c.decodeIfPresent(String.self, forKey: .sourceGuestPlayerId)
        self.metadata = try c.decodeIfPresent([String: JSONValue].self, forKey: .metadata)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encode(roundId, forKey: .roundId)
        try c.encode(ballId, forKey: .ballId)
        try c.encode(playHoleId, forKey: .playHoleId)
        if let strokes {
            try c.encode(strokes, forKey: .strokes)
        } else {
            try c.encodeNil(forKey: .strokes)
        }
        try c.encode(eventType, forKey: .eventType)
        if let recordedByPlayerId {
            try c.encode(recordedByPlayerId, forKey: .recordedByPlayerId)
        } else {
            try c.encodeNil(forKey: .recordedByPlayerId)
        }
        try c.encode(recordedAt, forKey: .recordedAt)
        try c.encode(clientEventId, forKey: .clientEventId)
        if let sourcePlayerId {
            try c.encode(sourcePlayerId, forKey: .sourcePlayerId)
        } else {
            try c.encodeNil(forKey: .sourcePlayerId)
        }
        if let sourceGuestPlayerId {
            try c.encode(sourceGuestPlayerId, forKey: .sourceGuestPlayerId)
        } else {
            try c.encodeNil(forKey: .sourceGuestPlayerId)
        }
        if let metadata {
            try c.encode(metadata, forKey: .metadata)
        } else {
            try c.encodeNil(forKey: .metadata)
        }
    }
}

struct StartListOpDecision: Codable, Sendable, Equatable {
    var allowed: Bool
    var code: String?
    var message: String?

    enum CodingKeys: String, CodingKey {
        case allowed = "allowed"
        case code = "code"
        case message = "message"
    }

    init(allowed: Bool, code: String? = nil, message: String? = nil) {
        self.allowed = allowed
        self.code = code
        self.message = message
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.allowed = try c.decode(Bool.self, forKey: .allowed)
        self.code = try c.decodeIfPresent(String.self, forKey: .code)
        self.message = try c.decodeIfPresent(String.self, forKey: .message)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(allowed, forKey: .allowed)
        try c.encodeIfPresent(code, forKey: .code)
        try c.encodeIfPresent(message, forKey: .message)
    }
}

struct HandicapDerivationStepsItemCourseHandicap: Codable, Sendable, Equatable {
    let kind: String = "course_handicap"
    var producerLabel: String
    var teeName: String?
    var handicapIndex: Double?
    var slope: Double?
    var courseRating: Double?
    var par: Double?
    var result: Double

    enum CodingKeys: String, CodingKey {
        case kind = "kind"
        case producerLabel = "producerLabel"
        case teeName = "teeName"
        case handicapIndex = "handicapIndex"
        case slope = "slope"
        case courseRating = "courseRating"
        case par = "par"
        case result = "result"
    }

    init(producerLabel: String, teeName: String? = nil, handicapIndex: Double? = nil, slope: Double? = nil, courseRating: Double? = nil, par: Double? = nil, result: Double) {
        self.producerLabel = producerLabel
        self.teeName = teeName
        self.handicapIndex = handicapIndex
        self.slope = slope
        self.courseRating = courseRating
        self.par = par
        self.result = result
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        _ = try c.decode(String.self, forKey: .kind)
        self.producerLabel = try c.decode(String.self, forKey: .producerLabel)
        self.teeName = try c.decodeIfPresent(String.self, forKey: .teeName)
        self.handicapIndex = try c.decodeIfPresent(Double.self, forKey: .handicapIndex)
        self.slope = try c.decodeIfPresent(Double.self, forKey: .slope)
        self.courseRating = try c.decodeIfPresent(Double.self, forKey: .courseRating)
        self.par = try c.decodeIfPresent(Double.self, forKey: .par)
        self.result = try c.decode(Double.self, forKey: .result)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(kind, forKey: .kind)
        try c.encode(producerLabel, forKey: .producerLabel)
        if let teeName {
            try c.encode(teeName, forKey: .teeName)
        } else {
            try c.encodeNil(forKey: .teeName)
        }
        if let handicapIndex {
            try c.encode(handicapIndex, forKey: .handicapIndex)
        } else {
            try c.encodeNil(forKey: .handicapIndex)
        }
        if let slope {
            try c.encode(slope, forKey: .slope)
        } else {
            try c.encodeNil(forKey: .slope)
        }
        if let courseRating {
            try c.encode(courseRating, forKey: .courseRating)
        } else {
            try c.encodeNil(forKey: .courseRating)
        }
        if let par {
            try c.encode(par, forKey: .par)
        } else {
            try c.encodeNil(forKey: .par)
        }
        try c.encode(result, forKey: .result)
    }
}

struct HandicapDerivationStepsItemTeamCombinationPartsItem: Codable, Sendable, Equatable {
    var producerLabel: String
    var ch: Double
    var pct: Double

    enum CodingKeys: String, CodingKey {
        case producerLabel = "producerLabel"
        case ch = "ch"
        case pct = "pct"
    }

    init(producerLabel: String, ch: Double, pct: Double) {
        self.producerLabel = producerLabel
        self.ch = ch
        self.pct = pct
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.producerLabel = try c.decode(String.self, forKey: .producerLabel)
        self.ch = try c.decode(Double.self, forKey: .ch)
        self.pct = try c.decode(Double.self, forKey: .pct)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(producerLabel, forKey: .producerLabel)
        try c.encode(ch, forKey: .ch)
        try c.encode(pct, forKey: .pct)
    }
}

struct HandicapDerivationStepsItemTeamCombination: Codable, Sendable, Equatable {
    let kind: String = "team_combination"
    var parts: [HandicapDerivationStepsItemTeamCombinationPartsItem]
    var result: Double

    enum CodingKeys: String, CodingKey {
        case kind = "kind"
        case parts = "parts"
        case result = "result"
    }

    init(parts: [HandicapDerivationStepsItemTeamCombinationPartsItem], result: Double) {
        self.parts = parts
        self.result = result
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        _ = try c.decode(String.self, forKey: .kind)
        self.parts = try c.decode([HandicapDerivationStepsItemTeamCombinationPartsItem].self, forKey: .parts)
        self.result = try c.decode(Double.self, forKey: .result)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(kind, forKey: .kind)
        try c.encode(parts, forKey: .parts)
        try c.encode(result, forKey: .result)
    }
}

enum AllowanceSource: String, Codable, Sendable, Equatable {
    case flat = "flat"
    case split = "split"
}

struct HandicapDerivationStepsItemAllowance: Codable, Sendable, Equatable {
    let kind: String = "allowance"
    var pct: Double
    var source: AllowanceSource
    var result: Double

    enum CodingKeys: String, CodingKey {
        case kind = "kind"
        case pct = "pct"
        case source = "source"
        case result = "result"
    }

    init(pct: Double, source: AllowanceSource, result: Double) {
        self.pct = pct
        self.source = source
        self.result = result
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        _ = try c.decode(String.self, forKey: .kind)
        self.pct = try c.decode(Double.self, forKey: .pct)
        self.source = try c.decode(AllowanceSource.self, forKey: .source)
        self.result = try c.decode(Double.self, forKey: .result)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(kind, forKey: .kind)
        try c.encode(pct, forKey: .pct)
        try c.encode(source, forKey: .source)
        try c.encode(result, forKey: .result)
    }
}

struct HandicapDerivationStepsItemMatchDelta: Codable, Sendable, Equatable {
    let kind: String = "match_delta"
    var lowestPh: Double
    var ownPh: Double
    var result: Double

    enum CodingKeys: String, CodingKey {
        case kind = "kind"
        case lowestPh = "lowestPh"
        case ownPh = "ownPh"
        case result = "result"
    }

    init(lowestPh: Double, ownPh: Double, result: Double) {
        self.lowestPh = lowestPh
        self.ownPh = ownPh
        self.result = result
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        _ = try c.decode(String.self, forKey: .kind)
        self.lowestPh = try c.decode(Double.self, forKey: .lowestPh)
        self.ownPh = try c.decode(Double.self, forKey: .ownPh)
        self.result = try c.decode(Double.self, forKey: .result)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(kind, forKey: .kind)
        try c.encode(lowestPh, forKey: .lowestPh)
        try c.encode(ownPh, forKey: .ownPh)
        try c.encode(result, forKey: .result)
    }
}

enum HandicapDerivationStepsItem: Codable, Sendable, Equatable {
    case courseHandicap(HandicapDerivationStepsItemCourseHandicap)
    case teamCombination(HandicapDerivationStepsItemTeamCombination)
    case allowance(HandicapDerivationStepsItemAllowance)
    case matchDelta(HandicapDerivationStepsItemMatchDelta)

    private enum DiscriminantKey: String, CodingKey {
        case discriminant = "kind"
    }

    init(from decoder: any Decoder) throws {
        let tag = try decoder.container(keyedBy: DiscriminantKey.self)
        let discriminant = try tag.decode(String.self, forKey: .discriminant)
        switch discriminant {
        case "course_handicap":
            self = .courseHandicap(try HandicapDerivationStepsItemCourseHandicap(from: decoder))
        case "team_combination":
            self = .teamCombination(try HandicapDerivationStepsItemTeamCombination(from: decoder))
        case "allowance":
            self = .allowance(try HandicapDerivationStepsItemAllowance(from: decoder))
        case "match_delta":
            self = .matchDelta(try HandicapDerivationStepsItemMatchDelta(from: decoder))
        default:
            throw DecodingError.dataCorrupted(.init(
                codingPath: decoder.codingPath,
                debugDescription: "unknown kind: \(discriminant)"))
        }
    }

    func encode(to encoder: any Encoder) throws {
        switch self {
        case .courseHandicap(let v): try v.encode(to: encoder)
        case .teamCombination(let v): try v.encode(to: encoder)
        case .allowance(let v): try v.encode(to: encoder)
        case .matchDelta(let v): try v.encode(to: encoder)
        }
    }
}

struct HandicapDerivation: Codable, Sendable, Equatable {
    var effectivePh: Double
    var steps: [HandicapDerivationStepsItem]

    enum CodingKeys: String, CodingKey {
        case effectivePh = "effectivePh"
        case steps = "steps"
    }

    init(effectivePh: Double, steps: [HandicapDerivationStepsItem]) {
        self.effectivePh = effectivePh
        self.steps = steps
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.effectivePh = try c.decode(Double.self, forKey: .effectivePh)
        self.steps = try c.decode([HandicapDerivationStepsItem].self, forKey: .steps)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(effectivePh, forKey: .effectivePh)
        try c.encode(steps, forKey: .steps)
    }
}

struct ScoreGridSectionTitle: Codable, Sendable, Equatable {
    var groups: [[String]]
    var joiner: String

    enum CodingKeys: String, CodingKey {
        case groups = "groups"
        case joiner = "joiner"
    }

    init(groups: [[String]], joiner: String) {
        self.groups = groups
        self.joiner = joiner
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.groups = try c.decode([[String]].self, forKey: .groups)
        self.joiner = try c.decode(String.self, forKey: .joiner)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(groups, forKey: .groups)
        try c.encode(joiner, forKey: .joiner)
    }
}

struct ScoreGridSectionTotalsItem: Codable, Sendable, Equatable {
    var label: String
    var value: Double?

    enum CodingKeys: String, CodingKey {
        case label = "label"
        case value = "value"
    }

    init(label: String, value: Double? = nil) {
        self.label = label
        self.value = value
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.label = try c.decode(String.self, forKey: .label)
        self.value = try c.decodeIfPresent(Double.self, forKey: .value)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(label, forKey: .label)
        if let value {
            try c.encode(value, forKey: .value)
        } else {
            try c.encodeNil(forKey: .value)
        }
    }
}

struct ScoreGridSection: Codable, Sendable, Equatable {
    let kind: String = "score_grid"
    var componentId: ScoreGridComponentId?
    var title: ScoreGridSectionTitle
    var subjectBallIds: [String]
    var holes: [HoleRef]
    var subtitleFacts: [String]
    var rows: [GridRow]
    var footnotes: [String]
    var caption: String?
    var totals: [ScoreGridSectionTotalsItem]

    enum CodingKeys: String, CodingKey {
        case kind = "kind"
        case componentId = "componentId"
        case title = "title"
        case subjectBallIds = "subjectBallIds"
        case holes = "holes"
        case subtitleFacts = "subtitleFacts"
        case rows = "rows"
        case footnotes = "footnotes"
        case caption = "caption"
        case totals = "totals"
    }

    init(componentId: ScoreGridComponentId? = nil, title: ScoreGridSectionTitle, subjectBallIds: [String], holes: [HoleRef], subtitleFacts: [String], rows: [GridRow], footnotes: [String], caption: String? = nil, totals: [ScoreGridSectionTotalsItem]) {
        self.componentId = componentId
        self.title = title
        self.subjectBallIds = subjectBallIds
        self.holes = holes
        self.subtitleFacts = subtitleFacts
        self.rows = rows
        self.footnotes = footnotes
        self.caption = caption
        self.totals = totals
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        _ = try c.decode(String.self, forKey: .kind)
        self.componentId = try c.decodeIfPresent(ScoreGridComponentId.self, forKey: .componentId)
        self.title = try c.decode(ScoreGridSectionTitle.self, forKey: .title)
        self.subjectBallIds = try c.decode([String].self, forKey: .subjectBallIds)
        self.holes = try c.decode([HoleRef].self, forKey: .holes)
        self.subtitleFacts = try c.decode([String].self, forKey: .subtitleFacts)
        self.rows = try c.decode([GridRow].self, forKey: .rows)
        self.footnotes = try c.decode([String].self, forKey: .footnotes)
        self.caption = try c.decodeIfPresent(String.self, forKey: .caption)
        self.totals = try c.decode([ScoreGridSectionTotalsItem].self, forKey: .totals)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(kind, forKey: .kind)
        try c.encodeIfPresent(componentId, forKey: .componentId)
        try c.encode(title, forKey: .title)
        try c.encode(subjectBallIds, forKey: .subjectBallIds)
        try c.encode(holes, forKey: .holes)
        try c.encode(subtitleFacts, forKey: .subtitleFacts)
        try c.encode(rows, forKey: .rows)
        try c.encode(footnotes, forKey: .footnotes)
        try c.encodeIfPresent(caption, forKey: .caption)
        try c.encode(totals, forKey: .totals)
    }
}

struct RankedSection: Codable, Sendable, Equatable {
    let kind: String = "ranked"
    var metricId: String
    var metricLabel: String
    var direction: ResultViewDirection?
    var entries: [RankedEntry]

    enum CodingKeys: String, CodingKey {
        case kind = "kind"
        case metricId = "metricId"
        case metricLabel = "metricLabel"
        case direction = "direction"
        case entries = "entries"
    }

    init(metricId: String, metricLabel: String, direction: ResultViewDirection? = nil, entries: [RankedEntry]) {
        self.metricId = metricId
        self.metricLabel = metricLabel
        self.direction = direction
        self.entries = entries
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        _ = try c.decode(String.self, forKey: .kind)
        self.metricId = try c.decode(String.self, forKey: .metricId)
        self.metricLabel = try c.decode(String.self, forKey: .metricLabel)
        self.direction = try c.decodeIfPresent(ResultViewDirection.self, forKey: .direction)
        self.entries = try c.decode([RankedEntry].self, forKey: .entries)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(kind, forKey: .kind)
        try c.encode(metricId, forKey: .metricId)
        try c.encode(metricLabel, forKey: .metricLabel)
        try c.encodeIfPresent(direction, forKey: .direction)
        try c.encode(entries, forKey: .entries)
    }
}

struct MatchSummarySection: Codable, Sendable, Equatable {
    let kind: String = "match_summary"
    var title: String
    var matches: [MatchPanel]

    enum CodingKeys: String, CodingKey {
        case kind = "kind"
        case title = "title"
        case matches = "matches"
    }

    init(title: String, matches: [MatchPanel]) {
        self.title = title
        self.matches = matches
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        _ = try c.decode(String.self, forKey: .kind)
        self.title = try c.decode(String.self, forKey: .title)
        self.matches = try c.decode([MatchPanel].self, forKey: .matches)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(kind, forKey: .kind)
        try c.encode(title, forKey: .title)
        try c.encode(matches, forKey: .matches)
    }
}

struct HoleRef: Codable, Sendable, Equatable {
    var holeNumber: Double
    var playHoleId: String
    var courseHoleNumber: Double
    var canonicalOrdinal: Double
    var occurrenceLabel: String

    enum CodingKeys: String, CodingKey {
        case holeNumber = "holeNumber"
        case playHoleId = "playHoleId"
        case courseHoleNumber = "courseHoleNumber"
        case canonicalOrdinal = "canonicalOrdinal"
        case occurrenceLabel = "occurrenceLabel"
    }

    init(holeNumber: Double, playHoleId: String, courseHoleNumber: Double, canonicalOrdinal: Double, occurrenceLabel: String) {
        self.holeNumber = holeNumber
        self.playHoleId = playHoleId
        self.courseHoleNumber = courseHoleNumber
        self.canonicalOrdinal = canonicalOrdinal
        self.occurrenceLabel = occurrenceLabel
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.holeNumber = try c.decode(Double.self, forKey: .holeNumber)
        self.playHoleId = try c.decode(String.self, forKey: .playHoleId)
        self.courseHoleNumber = try c.decode(Double.self, forKey: .courseHoleNumber)
        self.canonicalOrdinal = try c.decode(Double.self, forKey: .canonicalOrdinal)
        self.occurrenceLabel = try c.decode(String.self, forKey: .occurrenceLabel)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(holeNumber, forKey: .holeNumber)
        try c.encode(playHoleId, forKey: .playHoleId)
        try c.encode(courseHoleNumber, forKey: .courseHoleNumber)
        try c.encode(canonicalOrdinal, forKey: .canonicalOrdinal)
        try c.encode(occurrenceLabel, forKey: .occurrenceLabel)
    }
}

enum GridRowKind: String, Codable, Sendable, Equatable {
    case par = "par"
    case si = "si"
    case given = "given"
    case gross = "gross"
    case net = "net"
    case points = "points"
    case running = "running"
    case status = "status"
    case category = "category"
    case free = "free"
}

enum GridRowAggregate: String, Codable, Sendable, Equatable {
    case sum = "sum"
    case last = "last"
    case `none` = "none"
}

enum GridRowTeam: String, Codable, Sendable, Equatable {
    case a = "a"
    case b = "b"
}

struct GridRow: Codable, Sendable, Equatable {
    var label: String
    var subjectBallId: String?
    var kind: GridRowKind
    var cells: [GridCell]
    var aggregate: GridRowAggregate
    var emphasis: Bool?
    var team: GridRowTeam?

    enum CodingKeys: String, CodingKey {
        case label = "label"
        case subjectBallId = "subjectBallId"
        case kind = "kind"
        case cells = "cells"
        case aggregate = "aggregate"
        case emphasis = "emphasis"
        case team = "team"
    }

    init(label: String, subjectBallId: String? = nil, kind: GridRowKind, cells: [GridCell], aggregate: GridRowAggregate, emphasis: Bool? = nil, team: GridRowTeam? = nil) {
        self.label = label
        self.subjectBallId = subjectBallId
        self.kind = kind
        self.cells = cells
        self.aggregate = aggregate
        self.emphasis = emphasis
        self.team = team
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.label = try c.decode(String.self, forKey: .label)
        self.subjectBallId = try c.decodeIfPresent(String.self, forKey: .subjectBallId)
        self.kind = try c.decode(GridRowKind.self, forKey: .kind)
        self.cells = try c.decode([GridCell].self, forKey: .cells)
        self.aggregate = try c.decode(GridRowAggregate.self, forKey: .aggregate)
        self.emphasis = try c.decodeIfPresent(Bool.self, forKey: .emphasis)
        self.team = try c.decodeIfPresent(GridRowTeam.self, forKey: .team)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(label, forKey: .label)
        try c.encodeIfPresent(subjectBallId, forKey: .subjectBallId)
        try c.encode(kind, forKey: .kind)
        try c.encode(cells, forKey: .cells)
        try c.encode(aggregate, forKey: .aggregate)
        try c.encodeIfPresent(emphasis, forKey: .emphasis)
        try c.encodeIfPresent(team, forKey: .team)
    }
}

struct RankedEntry: Codable, Sendable, Equatable {
    var ballIds: [String]
    var total: Double?
    var holesPlayed: Double
    var paceDelta: Double?
    var position: Double

    enum CodingKeys: String, CodingKey {
        case ballIds = "ballIds"
        case total = "total"
        case holesPlayed = "holesPlayed"
        case paceDelta = "paceDelta"
        case position = "position"
    }

    init(ballIds: [String], total: Double? = nil, holesPlayed: Double, paceDelta: Double? = nil, position: Double) {
        self.ballIds = ballIds
        self.total = total
        self.holesPlayed = holesPlayed
        self.paceDelta = paceDelta
        self.position = position
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.ballIds = try c.decode([String].self, forKey: .ballIds)
        self.total = try c.decodeIfPresent(Double.self, forKey: .total)
        self.holesPlayed = try c.decode(Double.self, forKey: .holesPlayed)
        self.paceDelta = try c.decodeIfPresent(Double.self, forKey: .paceDelta)
        self.position = try c.decode(Double.self, forKey: .position)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(ballIds, forKey: .ballIds)
        if let total {
            try c.encode(total, forKey: .total)
        } else {
            try c.encodeNil(forKey: .total)
        }
        try c.encode(holesPlayed, forKey: .holesPlayed)
        try c.encodeIfPresent(paceDelta, forKey: .paceDelta)
        try c.encode(position, forKey: .position)
    }
}

struct MatchPanelSideA: Codable, Sendable, Equatable {
    var ballIds: [String]

    enum CodingKeys: String, CodingKey {
        case ballIds = "ballIds"
    }

    init(ballIds: [String]) {
        self.ballIds = ballIds
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.ballIds = try c.decode([String].self, forKey: .ballIds)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(ballIds, forKey: .ballIds)
    }
}

struct MatchPanel: Codable, Sendable, Equatable {
    var sideA: MatchPanelSideA
    var sideB: MatchPanelSideA
    var leader: GridRowTeam?
    var magnitude: Double
    var finished: Bool
    var thru: Double

    enum CodingKeys: String, CodingKey {
        case sideA = "sideA"
        case sideB = "sideB"
        case leader = "leader"
        case magnitude = "magnitude"
        case finished = "finished"
        case thru = "thru"
    }

    init(sideA: MatchPanelSideA, sideB: MatchPanelSideA, leader: GridRowTeam? = nil, magnitude: Double, finished: Bool, thru: Double) {
        self.sideA = sideA
        self.sideB = sideB
        self.leader = leader
        self.magnitude = magnitude
        self.finished = finished
        self.thru = thru
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.sideA = try c.decode(MatchPanelSideA.self, forKey: .sideA)
        self.sideB = try c.decode(MatchPanelSideA.self, forKey: .sideB)
        self.leader = try c.decodeIfPresent(GridRowTeam.self, forKey: .leader)
        self.magnitude = try c.decode(Double.self, forKey: .magnitude)
        self.finished = try c.decode(Bool.self, forKey: .finished)
        self.thru = try c.decode(Double.self, forKey: .thru)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(sideA, forKey: .sideA)
        try c.encode(sideB, forKey: .sideB)
        if let leader {
            try c.encode(leader, forKey: .leader)
        } else {
            try c.encodeNil(forKey: .leader)
        }
        try c.encode(magnitude, forKey: .magnitude)
        try c.encode(finished, forKey: .finished)
        try c.encode(thru, forKey: .thru)
    }
}

enum GridCellTone: String, Codable, Sendable, Equatable {
    case neutral = "neutral"
    case sideA = "side_a"
    case sideB = "side_b"
    case success = "success"
    case warning = "warning"
    case danger = "danger"
}

enum CellMarkerTemplate: String, Codable, Sendable, Equatable {
    case ring = "ring"
    case doubleRing = "double_ring"
    case diamond = "diamond"
    case dot = "dot"
    case badge = "badge"
    case boxBadge = "box_badge"
    case square = "square"
    case doubleSquare = "double_square"
}

struct GridCellMarkerOther: Codable, Sendable, Equatable {
    var tone: GridCellTone?
    var label: String?
    var value: String?
    var template: CellMarkerTemplate

    enum CodingKeys: String, CodingKey {
        case tone = "tone"
        case label = "label"
        case value = "value"
        case template = "template"
    }

    init(tone: GridCellTone? = nil, label: String? = nil, value: String? = nil, template: CellMarkerTemplate) {
        self.tone = tone
        self.label = label
        self.value = value
        self.template = template
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.tone = try c.decodeIfPresent(GridCellTone.self, forKey: .tone)
        self.label = try c.decodeIfPresent(String.self, forKey: .label)
        self.value = try c.decodeIfPresent(String.self, forKey: .value)
        self.template = try c.decode(CellMarkerTemplate.self, forKey: .template)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encodeIfPresent(tone, forKey: .tone)
        try c.encodeIfPresent(label, forKey: .label)
        try c.encodeIfPresent(value, forKey: .value)
        try c.encode(template, forKey: .template)
    }
}

struct GridCellMarkerCustom: Codable, Sendable, Equatable {
    var tone: GridCellTone?
    var label: String?
    var value: String?
    let template: String = "custom"
    var customId: String

    enum CodingKeys: String, CodingKey {
        case tone = "tone"
        case label = "label"
        case value = "value"
        case template = "template"
        case customId = "customId"
    }

    init(tone: GridCellTone? = nil, label: String? = nil, value: String? = nil, customId: String) {
        self.tone = tone
        self.label = label
        self.value = value
        self.customId = customId
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.tone = try c.decodeIfPresent(GridCellTone.self, forKey: .tone)
        self.label = try c.decodeIfPresent(String.self, forKey: .label)
        self.value = try c.decodeIfPresent(String.self, forKey: .value)
        _ = try c.decode(String.self, forKey: .template)
        self.customId = try c.decode(String.self, forKey: .customId)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encodeIfPresent(tone, forKey: .tone)
        try c.encodeIfPresent(label, forKey: .label)
        try c.encodeIfPresent(value, forKey: .value)
        try c.encode(template, forKey: .template)
        try c.encode(customId, forKey: .customId)
    }
}

enum GridCellMarker: Codable, Sendable, Equatable {
    case other(GridCellMarkerOther)
    case custom(GridCellMarkerCustom)

    private enum DiscriminantKey: String, CodingKey {
        case discriminant = "template"
    }

    init(from decoder: any Decoder) throws {
        let tag = try decoder.container(keyedBy: DiscriminantKey.self)
        let discriminant = try tag.decode(String.self, forKey: .discriminant)
        switch discriminant {
        case "ring", "double_ring", "diamond", "dot", "badge", "box_badge", "square", "double_square":
            self = .other(try GridCellMarkerOther(from: decoder))
        case "custom":
            self = .custom(try GridCellMarkerCustom(from: decoder))
        default:
            throw DecodingError.dataCorrupted(.init(
                codingPath: decoder.codingPath,
                debugDescription: "unknown template: \(discriminant)"))
        }
    }

    func encode(to encoder: any Encoder) throws {
        switch self {
        case .other(let v): try v.encode(to: encoder)
        case .custom(let v): try v.encode(to: encoder)
        }
    }
}

struct GridCell: Codable, Sendable, Equatable {
    var playHoleId: String
    var holeNumber: Double
    var value: Double?
    var display: String?
    var title: String?
    var tone: GridCellTone?
    var marker: GridCellMarker?
    var team: GridRowTeam?

    enum CodingKeys: String, CodingKey {
        case playHoleId = "playHoleId"
        case holeNumber = "holeNumber"
        case value = "value"
        case display = "display"
        case title = "title"
        case tone = "tone"
        case marker = "marker"
        case team = "team"
    }

    init(playHoleId: String, holeNumber: Double, value: Double? = nil, display: String? = nil, title: String? = nil, tone: GridCellTone? = nil, marker: GridCellMarker? = nil, team: GridRowTeam? = nil) {
        self.playHoleId = playHoleId
        self.holeNumber = holeNumber
        self.value = value
        self.display = display
        self.title = title
        self.tone = tone
        self.marker = marker
        self.team = team
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.playHoleId = try c.decode(String.self, forKey: .playHoleId)
        self.holeNumber = try c.decode(Double.self, forKey: .holeNumber)
        self.value = try c.decodeIfPresent(Double.self, forKey: .value)
        self.display = try c.decodeIfPresent(String.self, forKey: .display)
        self.title = try c.decodeIfPresent(String.self, forKey: .title)
        self.tone = try c.decodeIfPresent(GridCellTone.self, forKey: .tone)
        self.marker = try c.decodeIfPresent(GridCellMarker.self, forKey: .marker)
        self.team = try c.decodeIfPresent(GridRowTeam.self, forKey: .team)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(playHoleId, forKey: .playHoleId)
        try c.encode(holeNumber, forKey: .holeNumber)
        if let value {
            try c.encode(value, forKey: .value)
        } else {
            try c.encodeNil(forKey: .value)
        }
        try c.encodeIfPresent(display, forKey: .display)
        try c.encodeIfPresent(title, forKey: .title)
        try c.encodeIfPresent(tone, forKey: .tone)
        try c.encodeIfPresent(marker, forKey: .marker)
        try c.encodeIfPresent(team, forKey: .team)
    }
}

struct FriendlyRoundsCreateInput: Codable, Sendable, Equatable {
    var draft: CompetitionsCreateRoundOutputOkDraft

    enum CodingKeys: String, CodingKey {
        case draft = "draft"
    }

    init(draft: CompetitionsCreateRoundOutputOkDraft) {
        self.draft = draft
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.draft = try c.decode(CompetitionsCreateRoundOutputOkDraft.self, forKey: .draft)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(draft, forKey: .draft)
    }
}

struct FriendlyRoundsCreateOutputOk: Codable, Sendable, Equatable {
    let ok: Bool = true
    var round: Round
    var friendlyRound: FriendlyRound

    enum CodingKeys: String, CodingKey {
        case ok = "ok"
        case round = "round"
        case friendlyRound = "friendlyRound"
    }

    init(round: Round, friendlyRound: FriendlyRound) {
        self.round = round
        self.friendlyRound = friendlyRound
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        _ = try c.decode(Bool.self, forKey: .ok)
        self.round = try c.decode(Round.self, forKey: .round)
        self.friendlyRound = try c.decode(FriendlyRound.self, forKey: .friendlyRound)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(ok, forKey: .ok)
        try c.encode(round, forKey: .round)
        try c.encode(friendlyRound, forKey: .friendlyRound)
    }
}

enum FriendlyRoundsCreateOutput: Codable, Sendable, Equatable {
    case ok(FriendlyRoundsCreateOutputOk)
    case notOk(CompetitionsCreateRoundOutputNotOkDiagnostics)

    private enum DiscriminantKey: String, CodingKey {
        case discriminant = "ok"
    }

    init(from decoder: any Decoder) throws {
        let tag = try decoder.container(keyedBy: DiscriminantKey.self)
        let discriminant = try tag.decode(Bool.self, forKey: .discriminant)
        switch discriminant {
        case true:
            self = .ok(try FriendlyRoundsCreateOutputOk(from: decoder))
        case false:
            self = .notOk(try CompetitionsCreateRoundOutputNotOkDiagnostics(from: decoder))
        }
    }

    func encode(to encoder: any Encoder) throws {
        switch self {
        case .ok(let v): try v.encode(to: encoder)
        case .notOk(let v): try v.encode(to: encoder)
        }
    }
}

struct FriendlyRoundsByTokenInput: Codable, Sendable, Equatable {
    var token: String

    enum CodingKeys: String, CodingKey {
        case token = "token"
    }

    init(token: String) {
        self.token = token
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.token = try c.decode(String.self, forKey: .token)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(token, forKey: .token)
    }
}

struct FriendlyRoundsByTokenOutput: Codable, Sendable, Equatable {
    var friendlyRound: FriendlyRound
    var round: Round
    var startList: StartListView
    var isCompetitionRound: Bool

    enum CodingKeys: String, CodingKey {
        case friendlyRound = "friendlyRound"
        case round = "round"
        case startList = "startList"
        case isCompetitionRound = "isCompetitionRound"
    }

    init(friendlyRound: FriendlyRound, round: Round, startList: StartListView, isCompetitionRound: Bool) {
        self.friendlyRound = friendlyRound
        self.round = round
        self.startList = startList
        self.isCompetitionRound = isCompetitionRound
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.friendlyRound = try c.decode(FriendlyRound.self, forKey: .friendlyRound)
        self.round = try c.decode(Round.self, forKey: .round)
        self.startList = try c.decode(StartListView.self, forKey: .startList)
        self.isCompetitionRound = try c.decode(Bool.self, forKey: .isCompetitionRound)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(friendlyRound, forKey: .friendlyRound)
        try c.encode(round, forKey: .round)
        try c.encode(startList, forKey: .startList)
        try c.encode(isCompetitionRound, forKey: .isCompetitionRound)
    }
}

struct FriendlyRoundsResultInput: Codable, Sendable, Equatable {
    var token: String
    var cursor: String?

    enum CodingKeys: String, CodingKey {
        case token = "token"
        case cursor = "cursor"
    }

    init(token: String, cursor: String? = nil) {
        self.token = token
        self.cursor = cursor
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.token = try c.decode(String.self, forKey: .token)
        self.cursor = try c.decodeIfPresent(String.self, forKey: .cursor)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(token, forKey: .token)
        try c.encodeIfPresent(cursor, forKey: .cursor)
    }
}

struct FriendlyRoundsResultOutputUnchanged: Codable, Sendable, Equatable {
    let unchanged: Bool = true
    var cursor: String

    enum CodingKeys: String, CodingKey {
        case unchanged = "unchanged"
        case cursor = "cursor"
    }

    init(cursor: String) {
        self.cursor = cursor
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        _ = try c.decode(Bool.self, forKey: .unchanged)
        self.cursor = try c.decode(String.self, forKey: .cursor)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(unchanged, forKey: .unchanged)
        try c.encode(cursor, forKey: .cursor)
    }
}

struct FriendlyRoundsResultOutputNotUnchanged: Codable, Sendable, Equatable {
    let unchanged: Bool = false
    var cursor: String?
    var result: RoundResult

    enum CodingKeys: String, CodingKey {
        case unchanged = "unchanged"
        case cursor = "cursor"
        case result = "result"
    }

    init(cursor: String? = nil, result: RoundResult) {
        self.cursor = cursor
        self.result = result
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        _ = try c.decode(Bool.self, forKey: .unchanged)
        self.cursor = try c.decodeIfPresent(String.self, forKey: .cursor)
        self.result = try c.decode(RoundResult.self, forKey: .result)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(unchanged, forKey: .unchanged)
        if let cursor {
            try c.encode(cursor, forKey: .cursor)
        } else {
            try c.encodeNil(forKey: .cursor)
        }
        try c.encode(result, forKey: .result)
    }
}

enum FriendlyRoundsResultOutput: Codable, Sendable, Equatable {
    case unchanged(FriendlyRoundsResultOutputUnchanged)
    case notUnchanged(FriendlyRoundsResultOutputNotUnchanged)

    private enum DiscriminantKey: String, CodingKey {
        case discriminant = "unchanged"
    }

    init(from decoder: any Decoder) throws {
        let tag = try decoder.container(keyedBy: DiscriminantKey.self)
        let discriminant = try tag.decode(Bool.self, forKey: .discriminant)
        switch discriminant {
        case true:
            self = .unchanged(try FriendlyRoundsResultOutputUnchanged(from: decoder))
        case false:
            self = .notUnchanged(try FriendlyRoundsResultOutputNotUnchanged(from: decoder))
        }
    }

    func encode(to encoder: any Encoder) throws {
        switch self {
        case .unchanged(let v): try v.encode(to: encoder)
        case .notUnchanged(let v): try v.encode(to: encoder)
        }
    }
}

struct FriendlyRoundsScoreInput: Codable, Sendable, Equatable {
    var token: String
    var ballId: String
    var playHoleId: String
    var strokes: Double?
    var eventType: ScoreEventEventType
    var clientEventId: String
    var sourcePlayerId: TriState<String>
    var sourceGuestPlayerId: TriState<String>
    var metadata: TriState<[String: JSONValue]>

    enum CodingKeys: String, CodingKey {
        case token = "token"
        case ballId = "ballId"
        case playHoleId = "playHoleId"
        case strokes = "strokes"
        case eventType = "eventType"
        case clientEventId = "clientEventId"
        case sourcePlayerId = "sourcePlayerId"
        case sourceGuestPlayerId = "sourceGuestPlayerId"
        case metadata = "metadata"
    }

    init(token: String, ballId: String, playHoleId: String, strokes: Double? = nil, eventType: ScoreEventEventType, clientEventId: String, sourcePlayerId: TriState<String> = .absent, sourceGuestPlayerId: TriState<String> = .absent, metadata: TriState<[String: JSONValue]> = .absent) {
        self.token = token
        self.ballId = ballId
        self.playHoleId = playHoleId
        self.strokes = strokes
        self.eventType = eventType
        self.clientEventId = clientEventId
        self.sourcePlayerId = sourcePlayerId
        self.sourceGuestPlayerId = sourceGuestPlayerId
        self.metadata = metadata
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.token = try c.decode(String.self, forKey: .token)
        self.ballId = try c.decode(String.self, forKey: .ballId)
        self.playHoleId = try c.decode(String.self, forKey: .playHoleId)
        self.strokes = try c.decodeIfPresent(Double.self, forKey: .strokes)
        self.eventType = try c.decode(ScoreEventEventType.self, forKey: .eventType)
        self.clientEventId = try c.decode(String.self, forKey: .clientEventId)
        if c.contains(.sourcePlayerId) {
            self.sourcePlayerId = try c.decodeNil(forKey: .sourcePlayerId)
                ? .null
                : .value(try c.decode(String.self, forKey: .sourcePlayerId))
        } else {
            self.sourcePlayerId = .absent
        }
        if c.contains(.sourceGuestPlayerId) {
            self.sourceGuestPlayerId = try c.decodeNil(forKey: .sourceGuestPlayerId)
                ? .null
                : .value(try c.decode(String.self, forKey: .sourceGuestPlayerId))
        } else {
            self.sourceGuestPlayerId = .absent
        }
        if c.contains(.metadata) {
            self.metadata = try c.decodeNil(forKey: .metadata)
                ? .null
                : .value(try c.decode([String: JSONValue].self, forKey: .metadata))
        } else {
            self.metadata = .absent
        }
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(token, forKey: .token)
        try c.encode(ballId, forKey: .ballId)
        try c.encode(playHoleId, forKey: .playHoleId)
        if let strokes {
            try c.encode(strokes, forKey: .strokes)
        } else {
            try c.encodeNil(forKey: .strokes)
        }
        try c.encode(eventType, forKey: .eventType)
        try c.encode(clientEventId, forKey: .clientEventId)
        switch sourcePlayerId {
        case .absent: break
        case .null: try c.encodeNil(forKey: .sourcePlayerId)
        case .value(let v): try c.encode(v, forKey: .sourcePlayerId)
        }
        switch sourceGuestPlayerId {
        case .absent: break
        case .null: try c.encodeNil(forKey: .sourceGuestPlayerId)
        case .value(let v): try c.encode(v, forKey: .sourceGuestPlayerId)
        }
        switch metadata {
        case .absent: break
        case .null: try c.encodeNil(forKey: .metadata)
        case .value(let v): try c.encode(v, forKey: .metadata)
        }
    }
}

struct FriendlyRoundsSetupOutputEditable: Codable, Sendable, Equatable {
    let editable: Bool = true
    var status: RoundStatus
    var hasScores: Bool
    var competitionRound: Bool
    var draft: CompetitionsCreateRoundOutputOkDraft
    var draftVersion: Double

    enum CodingKeys: String, CodingKey {
        case editable = "editable"
        case status = "status"
        case hasScores = "hasScores"
        case competitionRound = "competitionRound"
        case draft = "draft"
        case draftVersion = "draftVersion"
    }

    init(status: RoundStatus, hasScores: Bool, competitionRound: Bool, draft: CompetitionsCreateRoundOutputOkDraft, draftVersion: Double) {
        self.status = status
        self.hasScores = hasScores
        self.competitionRound = competitionRound
        self.draft = draft
        self.draftVersion = draftVersion
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        _ = try c.decode(Bool.self, forKey: .editable)
        self.status = try c.decode(RoundStatus.self, forKey: .status)
        self.hasScores = try c.decode(Bool.self, forKey: .hasScores)
        self.competitionRound = try c.decode(Bool.self, forKey: .competitionRound)
        self.draft = try c.decode(CompetitionsCreateRoundOutputOkDraft.self, forKey: .draft)
        self.draftVersion = try c.decode(Double.self, forKey: .draftVersion)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(editable, forKey: .editable)
        try c.encode(status, forKey: .status)
        try c.encode(hasScores, forKey: .hasScores)
        try c.encode(competitionRound, forKey: .competitionRound)
        try c.encode(draft, forKey: .draft)
        try c.encode(draftVersion, forKey: .draftVersion)
    }
}

enum SetupNotEditableReason: String, Codable, Sendable, Equatable {
    case roundComplete = "round_complete"
    case noStoredDraft = "no_stored_draft"
}

struct FriendlyRoundsSetupOutputNotEditable: Codable, Sendable, Equatable {
    let editable: Bool = false
    var status: RoundStatus
    var reason: SetupNotEditableReason

    enum CodingKeys: String, CodingKey {
        case editable = "editable"
        case status = "status"
        case reason = "reason"
    }

    init(status: RoundStatus, reason: SetupNotEditableReason) {
        self.status = status
        self.reason = reason
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        _ = try c.decode(Bool.self, forKey: .editable)
        self.status = try c.decode(RoundStatus.self, forKey: .status)
        self.reason = try c.decode(SetupNotEditableReason.self, forKey: .reason)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(editable, forKey: .editable)
        try c.encode(status, forKey: .status)
        try c.encode(reason, forKey: .reason)
    }
}

enum FriendlyRoundsSetupOutput: Codable, Sendable, Equatable {
    case editable(FriendlyRoundsSetupOutputEditable)
    case notEditable(FriendlyRoundsSetupOutputNotEditable)

    private enum DiscriminantKey: String, CodingKey {
        case discriminant = "editable"
    }

    init(from decoder: any Decoder) throws {
        let tag = try decoder.container(keyedBy: DiscriminantKey.self)
        let discriminant = try tag.decode(Bool.self, forKey: .discriminant)
        switch discriminant {
        case true:
            self = .editable(try FriendlyRoundsSetupOutputEditable(from: decoder))
        case false:
            self = .notEditable(try FriendlyRoundsSetupOutputNotEditable(from: decoder))
        }
    }

    func encode(to encoder: any Encoder) throws {
        switch self {
        case .editable(let v): try v.encode(to: encoder)
        case .notEditable(let v): try v.encode(to: encoder)
        }
    }
}

struct FriendlyRoundsEditSetupInput: Codable, Sendable, Equatable {
    var token: String
    var draft: CompetitionsCreateRoundOutputOkDraft
    var clientEventId: String?

    enum CodingKeys: String, CodingKey {
        case token = "token"
        case draft = "draft"
        case clientEventId = "clientEventId"
    }

    init(token: String, draft: CompetitionsCreateRoundOutputOkDraft, clientEventId: String? = nil) {
        self.token = token
        self.draft = draft
        self.clientEventId = clientEventId
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.token = try c.decode(String.self, forKey: .token)
        self.draft = try c.decode(CompetitionsCreateRoundOutputOkDraft.self, forKey: .draft)
        self.clientEventId = try c.decodeIfPresent(String.self, forKey: .clientEventId)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(token, forKey: .token)
        try c.encode(draft, forKey: .draft)
        try c.encodeIfPresent(clientEventId, forKey: .clientEventId)
    }
}

struct FriendlyRoundsEditSetupOutputOk: Codable, Sendable, Equatable {
    let ok: Bool = true
    var round: Round

    enum CodingKeys: String, CodingKey {
        case ok = "ok"
        case round = "round"
    }

    init(round: Round) {
        self.round = round
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        _ = try c.decode(Bool.self, forKey: .ok)
        self.round = try c.decode(Round.self, forKey: .round)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(ok, forKey: .ok)
        try c.encode(round, forKey: .round)
    }
}

enum FriendlyRoundsEditSetupOutput: Codable, Sendable, Equatable {
    case ok(FriendlyRoundsEditSetupOutputOk)
    case notOk(CompetitionsCreateRoundOutputNotOkDiagnostics)

    private enum DiscriminantKey: String, CodingKey {
        case discriminant = "ok"
    }

    init(from decoder: any Decoder) throws {
        let tag = try decoder.container(keyedBy: DiscriminantKey.self)
        let discriminant = try tag.decode(Bool.self, forKey: .discriminant)
        switch discriminant {
        case true:
            self = .ok(try FriendlyRoundsEditSetupOutputOk(from: decoder))
        case false:
            self = .notOk(try CompetitionsCreateRoundOutputNotOkDiagnostics(from: decoder))
        }
    }

    func encode(to encoder: any Encoder) throws {
        switch self {
        case .ok(let v): try v.encode(to: encoder)
        case .notOk(let v): try v.encode(to: encoder)
        }
    }
}

struct FriendlyRoundsFinishOutput: Codable, Sendable, Equatable {
    var status: RoundStatus
    var completedAt: String

    enum CodingKeys: String, CodingKey {
        case status = "status"
        case completedAt = "completedAt"
    }

    init(status: RoundStatus, completedAt: String) {
        self.status = status
        self.completedAt = completedAt
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.status = try c.decode(RoundStatus.self, forKey: .status)
        self.completedAt = try c.decode(String.self, forKey: .completedAt)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(status, forKey: .status)
        try c.encode(completedAt, forKey: .completedAt)
    }
}

struct FriendlyRoundsReopenOutput: Codable, Sendable, Equatable {
    var status: RoundStatus

    enum CodingKeys: String, CodingKey {
        case status = "status"
    }

    init(status: RoundStatus) {
        self.status = status
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.status = try c.decode(RoundStatus.self, forKey: .status)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(status, forKey: .status)
    }
}

struct FriendlyRoundsSetVisibilityInput: Codable, Sendable, Equatable {
    var token: String
    var visibility: RoundVisibility

    enum CodingKeys: String, CodingKey {
        case token = "token"
        case visibility = "visibility"
    }

    init(token: String, visibility: RoundVisibility) {
        self.token = token
        self.visibility = visibility
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.token = try c.decode(String.self, forKey: .token)
        self.visibility = try c.decode(RoundVisibility.self, forKey: .visibility)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(token, forKey: .token)
        try c.encode(visibility, forKey: .visibility)
    }
}

struct FriendlyRoundsSetVisibilityOutput: Codable, Sendable, Equatable {
    var visibility: RoundVisibility

    enum CodingKeys: String, CodingKey {
        case visibility = "visibility"
    }

    init(visibility: RoundVisibility) {
        self.visibility = visibility
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.visibility = try c.decode(RoundVisibility.self, forKey: .visibility)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(visibility, forKey: .visibility)
    }
}

struct FriendlyRoundsJoinInput: Codable, Sendable, Equatable {
    var token: String
    var teeId: String
    var groupChoice: String?

    enum CodingKeys: String, CodingKey {
        case token = "token"
        case teeId = "teeId"
        case groupChoice = "groupChoice"
    }

    init(token: String, teeId: String, groupChoice: String? = nil) {
        self.token = token
        self.teeId = teeId
        self.groupChoice = groupChoice
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.token = try c.decode(String.self, forKey: .token)
        self.teeId = try c.decode(String.self, forKey: .teeId)
        self.groupChoice = try c.decodeIfPresent(String.self, forKey: .groupChoice)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(token, forKey: .token)
        try c.encode(teeId, forKey: .teeId)
        try c.encodeIfPresent(groupChoice, forKey: .groupChoice)
    }
}

struct FriendlyRoundsClaimGuestInput: Codable, Sendable, Equatable {
    var token: String
    var guestPlayerId: String

    enum CodingKeys: String, CodingKey {
        case token = "token"
        case guestPlayerId = "guestPlayerId"
    }

    init(token: String, guestPlayerId: String) {
        self.token = token
        self.guestPlayerId = guestPlayerId
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.token = try c.decode(String.self, forKey: .token)
        self.guestPlayerId = try c.decode(String.self, forKey: .guestPlayerId)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(token, forKey: .token)
        try c.encode(guestPlayerId, forKey: .guestPlayerId)
    }
}

struct FriendlyRoundsRenameGuestInput: Codable, Sendable, Equatable {
    var token: String
    var guestPlayerId: String
    var displayName: String

    enum CodingKeys: String, CodingKey {
        case token = "token"
        case guestPlayerId = "guestPlayerId"
        case displayName = "displayName"
    }

    init(token: String, guestPlayerId: String, displayName: String) {
        self.token = token
        self.guestPlayerId = guestPlayerId
        self.displayName = displayName
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.token = try c.decode(String.self, forKey: .token)
        self.guestPlayerId = try c.decode(String.self, forKey: .guestPlayerId)
        self.displayName = try c.decode(String.self, forKey: .displayName)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(token, forKey: .token)
        try c.encode(guestPlayerId, forKey: .guestPlayerId)
        try c.encode(displayName, forKey: .displayName)
    }
}

struct FriendlyRoundsClaimSeatInputIdentitySelf: Codable, Sendable, Equatable {
    let kind: String = "self"

    enum CodingKeys: String, CodingKey {
        case kind = "kind"
    }

    init() {
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        _ = try c.decode(String.self, forKey: .kind)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(kind, forKey: .kind)
    }
}

struct FriendlyRoundsClaimSeatInputIdentityGuest: Codable, Sendable, Equatable {
    let kind: String = "guest"
    var name: String
    var handicapIndex: Double
    var gender: PlayerGender

    enum CodingKeys: String, CodingKey {
        case kind = "kind"
        case name = "name"
        case handicapIndex = "handicapIndex"
        case gender = "gender"
    }

    init(name: String, handicapIndex: Double, gender: PlayerGender) {
        self.name = name
        self.handicapIndex = handicapIndex
        self.gender = gender
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        _ = try c.decode(String.self, forKey: .kind)
        self.name = try c.decode(String.self, forKey: .name)
        self.handicapIndex = try c.decode(Double.self, forKey: .handicapIndex)
        self.gender = try c.decode(PlayerGender.self, forKey: .gender)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(kind, forKey: .kind)
        try c.encode(name, forKey: .name)
        try c.encode(handicapIndex, forKey: .handicapIndex)
        try c.encode(gender, forKey: .gender)
    }
}

enum FriendlyRoundsClaimSeatInputIdentity: Codable, Sendable, Equatable {
    case `self`(FriendlyRoundsClaimSeatInputIdentitySelf)
    case guest(FriendlyRoundsClaimSeatInputIdentityGuest)

    private enum DiscriminantKey: String, CodingKey {
        case discriminant = "kind"
    }

    init(from decoder: any Decoder) throws {
        let tag = try decoder.container(keyedBy: DiscriminantKey.self)
        let discriminant = try tag.decode(String.self, forKey: .discriminant)
        switch discriminant {
        case "self":
            self = .`self`(try FriendlyRoundsClaimSeatInputIdentitySelf(from: decoder))
        case "guest":
            self = .guest(try FriendlyRoundsClaimSeatInputIdentityGuest(from: decoder))
        default:
            throw DecodingError.dataCorrupted(.init(
                codingPath: decoder.codingPath,
                debugDescription: "unknown kind: \(discriminant)"))
        }
    }

    func encode(to encoder: any Encoder) throws {
        switch self {
        case .`self`(let v): try v.encode(to: encoder)
        case .guest(let v): try v.encode(to: encoder)
        }
    }
}

struct FriendlyRoundsClaimSeatInput: Codable, Sendable, Equatable {
    var token: String
    var seatId: String
    var identity: FriendlyRoundsClaimSeatInputIdentity
    var teeId: String?
    var clientEventId: String

    enum CodingKeys: String, CodingKey {
        case token = "token"
        case seatId = "seatId"
        case identity = "identity"
        case teeId = "teeId"
        case clientEventId = "clientEventId"
    }

    init(token: String, seatId: String, identity: FriendlyRoundsClaimSeatInputIdentity, teeId: String? = nil, clientEventId: String) {
        self.token = token
        self.seatId = seatId
        self.identity = identity
        self.teeId = teeId
        self.clientEventId = clientEventId
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.token = try c.decode(String.self, forKey: .token)
        self.seatId = try c.decode(String.self, forKey: .seatId)
        self.identity = try c.decode(FriendlyRoundsClaimSeatInputIdentity.self, forKey: .identity)
        self.teeId = try c.decodeIfPresent(String.self, forKey: .teeId)
        self.clientEventId = try c.decode(String.self, forKey: .clientEventId)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(token, forKey: .token)
        try c.encode(seatId, forKey: .seatId)
        try c.encode(identity, forKey: .identity)
        try c.encodeIfPresent(teeId, forKey: .teeId)
        try c.encode(clientEventId, forKey: .clientEventId)
    }
}

struct FriendlyRoundsReleaseSeatInput: Codable, Sendable, Equatable {
    var token: String
    var seatId: String
    var clientEventId: String

    enum CodingKeys: String, CodingKey {
        case token = "token"
        case seatId = "seatId"
        case clientEventId = "clientEventId"
    }

    init(token: String, seatId: String, clientEventId: String) {
        self.token = token
        self.seatId = seatId
        self.clientEventId = clientEventId
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.token = try c.decode(String.self, forKey: .token)
        self.seatId = try c.decode(String.self, forKey: .seatId)
        self.clientEventId = try c.decode(String.self, forKey: .clientEventId)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(token, forKey: .token)
        try c.encode(seatId, forKey: .seatId)
        try c.encode(clientEventId, forKey: .clientEventId)
    }
}
