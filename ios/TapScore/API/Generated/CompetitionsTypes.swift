// GENERATED — DO NOT EDIT. bun run generate:swift

import Foundation

enum CompetitionDetailLifecycle: String, Codable, Sendable, Equatable {
    case draft = "draft"
    case setup = "setup"
    case active = "active"
    case finalized = "finalized"
}

struct CompetitionDetailDefaultConfigSlotsItemAllowanceConfigFlat: Codable, Sendable, Equatable {
    let type: String = "flat"
    var pct: Double

    enum CodingKeys: String, CodingKey {
        case type = "type"
        case pct = "pct"
    }

    init(pct: Double) {
        self.pct = pct
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        _ = try c.decode(String.self, forKey: .type)
        self.pct = try c.decode(Double.self, forKey: .pct)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(type, forKey: .type)
        try c.encode(pct, forKey: .pct)
    }
}

struct CompetitionDetailDefaultConfigSlotsItemAllowanceConfigSplitBandsItem: Codable, Sendable, Equatable {
    var upToCh: Double?
    var pct: Double

    enum CodingKeys: String, CodingKey {
        case upToCh = "upToCh"
        case pct = "pct"
    }

    init(upToCh: Double? = nil, pct: Double) {
        self.upToCh = upToCh
        self.pct = pct
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.upToCh = try c.decodeIfPresent(Double.self, forKey: .upToCh)
        self.pct = try c.decode(Double.self, forKey: .pct)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        if let upToCh {
            try c.encode(upToCh, forKey: .upToCh)
        } else {
            try c.encodeNil(forKey: .upToCh)
        }
        try c.encode(pct, forKey: .pct)
    }
}

struct CompetitionDetailDefaultConfigSlotsItemAllowanceConfigSplit: Codable, Sendable, Equatable {
    let type: String = "split"
    var bands: [CompetitionDetailDefaultConfigSlotsItemAllowanceConfigSplitBandsItem]

    enum CodingKeys: String, CodingKey {
        case type = "type"
        case bands = "bands"
    }

    init(bands: [CompetitionDetailDefaultConfigSlotsItemAllowanceConfigSplitBandsItem]) {
        self.bands = bands
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        _ = try c.decode(String.self, forKey: .type)
        self.bands = try c.decode([CompetitionDetailDefaultConfigSlotsItemAllowanceConfigSplitBandsItem].self, forKey: .bands)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(type, forKey: .type)
        try c.encode(bands, forKey: .bands)
    }
}

enum CompetitionDetailDefaultConfigSlotsItemAllowanceConfig: Codable, Sendable, Equatable {
    case flat(CompetitionDetailDefaultConfigSlotsItemAllowanceConfigFlat)
    case split(CompetitionDetailDefaultConfigSlotsItemAllowanceConfigSplit)

    private enum DiscriminantKey: String, CodingKey {
        case discriminant = "type"
    }

    init(from decoder: any Decoder) throws {
        let tag = try decoder.container(keyedBy: DiscriminantKey.self)
        let discriminant = try tag.decode(String.self, forKey: .discriminant)
        switch discriminant {
        case "flat":
            self = .flat(try CompetitionDetailDefaultConfigSlotsItemAllowanceConfigFlat(from: decoder))
        case "split":
            self = .split(try CompetitionDetailDefaultConfigSlotsItemAllowanceConfigSplit(from: decoder))
        default:
            throw DecodingError.dataCorrupted(.init(
                codingPath: decoder.codingPath,
                debugDescription: "unknown type: \(discriminant)"))
        }
    }

    func encode(to encoder: any Encoder) throws {
        switch self {
        case .flat(let v): try v.encode(to: encoder)
        case .split(let v): try v.encode(to: encoder)
        }
    }
}

struct CompetitionDetailDefaultConfigSlotsItemTeamsItem: Codable, Sendable, Equatable {
    var label: String
    var producerDefIds: [String]

    enum CodingKeys: String, CodingKey {
        case label = "label"
        case producerDefIds = "producerDefIds"
    }

    init(label: String, producerDefIds: [String]) {
        self.label = label
        self.producerDefIds = producerDefIds
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.label = try c.decode(String.self, forKey: .label)
        self.producerDefIds = try c.decode([String].self, forKey: .producerDefIds)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(label, forKey: .label)
        try c.encode(producerDefIds, forKey: .producerDefIds)
    }
}

struct CompetitionDetailDefaultConfigSlotsItemBallsFrom: Codable, Sendable, Equatable {
    var ref: String

    enum CodingKeys: String, CodingKey {
        case ref = "ref"
    }

    init(ref: String) {
        self.ref = ref
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.ref = try c.decode(String.self, forKey: .ref)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(ref, forKey: .ref)
    }
}

struct CompetitionDetailDefaultConfigSlotsItemSubjectsItemPlayer: Codable, Sendable, Equatable {
    let kind: String = "player"
    var producerDefId: String

    enum CodingKeys: String, CodingKey {
        case kind = "kind"
        case producerDefId = "producerDefId"
    }

    init(producerDefId: String) {
        self.producerDefId = producerDefId
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        _ = try c.decode(String.self, forKey: .kind)
        self.producerDefId = try c.decode(String.self, forKey: .producerDefId)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(kind, forKey: .kind)
        try c.encode(producerDefId, forKey: .producerDefId)
    }
}

struct CompetitionDetailDefaultConfigSlotsItemSubjectsItemTeam: Codable, Sendable, Equatable {
    let kind: String = "team"
    var teamId: String

    enum CodingKeys: String, CodingKey {
        case kind = "kind"
        case teamId = "teamId"
    }

    init(teamId: String) {
        self.teamId = teamId
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        _ = try c.decode(String.self, forKey: .kind)
        self.teamId = try c.decode(String.self, forKey: .teamId)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(kind, forKey: .kind)
        try c.encode(teamId, forKey: .teamId)
    }
}

enum CompetitionDetailDefaultConfigSlotsItemSubjectsItem: Codable, Sendable, Equatable {
    case player(CompetitionDetailDefaultConfigSlotsItemSubjectsItemPlayer)
    case team(CompetitionDetailDefaultConfigSlotsItemSubjectsItemTeam)

    private enum DiscriminantKey: String, CodingKey {
        case discriminant = "kind"
    }

    init(from decoder: any Decoder) throws {
        let tag = try decoder.container(keyedBy: DiscriminantKey.self)
        let discriminant = try tag.decode(String.self, forKey: .discriminant)
        switch discriminant {
        case "player":
            self = .player(try CompetitionDetailDefaultConfigSlotsItemSubjectsItemPlayer(from: decoder))
        case "team":
            self = .team(try CompetitionDetailDefaultConfigSlotsItemSubjectsItemTeam(from: decoder))
        default:
            throw DecodingError.dataCorrupted(.init(
                codingPath: decoder.codingPath,
                debugDescription: "unknown kind: \(discriminant)"))
        }
    }

    func encode(to encoder: any Encoder) throws {
        switch self {
        case .player(let v): try v.encode(to: encoder)
        case .team(let v): try v.encode(to: encoder)
        }
    }
}

struct CompetitionDetailDefaultConfigSlotsItem: Codable, Sendable, Equatable {
    var formatId: String
    var id: String?
    var allowanceConfig: CompetitionDetailDefaultConfigSlotsItemAllowanceConfig?
    var producerDefIds: [String]?
    var teams: [CompetitionDetailDefaultConfigSlotsItemTeamsItem]?
    var formatConfig: JSONValue?
    var ballsFrom: CompetitionDetailDefaultConfigSlotsItemBallsFrom?
    var subjects: [CompetitionDetailDefaultConfigSlotsItemSubjectsItem]?

    enum CodingKeys: String, CodingKey {
        case formatId = "formatId"
        case id = "id"
        case allowanceConfig = "allowanceConfig"
        case producerDefIds = "producerDefIds"
        case teams = "teams"
        case formatConfig = "formatConfig"
        case ballsFrom = "ballsFrom"
        case subjects = "subjects"
    }

    init(formatId: String, id: String? = nil, allowanceConfig: CompetitionDetailDefaultConfigSlotsItemAllowanceConfig? = nil, producerDefIds: [String]? = nil, teams: [CompetitionDetailDefaultConfigSlotsItemTeamsItem]? = nil, formatConfig: JSONValue? = nil, ballsFrom: CompetitionDetailDefaultConfigSlotsItemBallsFrom? = nil, subjects: [CompetitionDetailDefaultConfigSlotsItemSubjectsItem]? = nil) {
        self.formatId = formatId
        self.id = id
        self.allowanceConfig = allowanceConfig
        self.producerDefIds = producerDefIds
        self.teams = teams
        self.formatConfig = formatConfig
        self.ballsFrom = ballsFrom
        self.subjects = subjects
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.formatId = try c.decode(String.self, forKey: .formatId)
        self.id = try c.decodeIfPresent(String.self, forKey: .id)
        self.allowanceConfig = try c.decodeIfPresent(CompetitionDetailDefaultConfigSlotsItemAllowanceConfig.self, forKey: .allowanceConfig)
        self.producerDefIds = try c.decodeIfPresent([String].self, forKey: .producerDefIds)
        self.teams = try c.decodeIfPresent([CompetitionDetailDefaultConfigSlotsItemTeamsItem].self, forKey: .teams)
        self.formatConfig = try c.decodeIfPresent(JSONValue.self, forKey: .formatConfig)
        self.ballsFrom = try c.decodeIfPresent(CompetitionDetailDefaultConfigSlotsItemBallsFrom.self, forKey: .ballsFrom)
        self.subjects = try c.decodeIfPresent([CompetitionDetailDefaultConfigSlotsItemSubjectsItem].self, forKey: .subjects)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(formatId, forKey: .formatId)
        try c.encodeIfPresent(id, forKey: .id)
        try c.encodeIfPresent(allowanceConfig, forKey: .allowanceConfig)
        try c.encodeIfPresent(producerDefIds, forKey: .producerDefIds)
        try c.encodeIfPresent(teams, forKey: .teams)
        try c.encodeIfPresent(formatConfig, forKey: .formatConfig)
        try c.encodeIfPresent(ballsFrom, forKey: .ballsFrom)
        try c.encodeIfPresent(subjects, forKey: .subjects)
    }
}

struct CompetitionDetailDefaultConfigCategoryTeesValue: Codable, Sendable, Equatable {
    var teeId: String

    enum CodingKeys: String, CodingKey {
        case teeId = "teeId"
    }

    init(teeId: String) {
        self.teeId = teeId
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.teeId = try c.decode(String.self, forKey: .teeId)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(teeId, forKey: .teeId)
    }
}

enum CompetitionDetailDefaultConfigStartList: String, Codable, Sendable, Equatable {
    case singleGroup = "single_group"
    case foursomes = "foursomes"
}

enum CompetitionDetailDefaultConfigStartListPolicyGroups: String, Codable, Sendable, Equatable {
    case organized = "organized"
    case roster = "roster"
    case `open` = "open"
}

enum CompetitionDetailDefaultConfigStartListPolicySeats: String, Codable, Sendable, Equatable {
    case assigned = "assigned"
    case claimable = "claimable"
}

enum CompetitionDetailDefaultConfigStartListPolicyClaimBy: String, Codable, Sendable, Equatable {
    case team = "team"
    case roster = "roster"
    case anyone = "anyone"
}

struct CompetitionDetailDefaultConfigStartListPolicyWindow: Codable, Sendable, Equatable {
    var opensAt: String?
    var closesAt: String?

    enum CodingKeys: String, CodingKey {
        case opensAt = "opensAt"
        case closesAt = "closesAt"
    }

    init(opensAt: String? = nil, closesAt: String? = nil) {
        self.opensAt = opensAt
        self.closesAt = closesAt
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.opensAt = try c.decodeIfPresent(String.self, forKey: .opensAt)
        self.closesAt = try c.decodeIfPresent(String.self, forKey: .closesAt)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encodeIfPresent(opensAt, forKey: .opensAt)
        try c.encodeIfPresent(closesAt, forKey: .closesAt)
    }
}

struct CompetitionDetailDefaultConfigStartListPolicy: Codable, Sendable, Equatable {
    var groups: CompetitionDetailDefaultConfigStartListPolicyGroups
    var seats: CompetitionDetailDefaultConfigStartListPolicySeats
    var claimBy: CompetitionDetailDefaultConfigStartListPolicyClaimBy
    var window: CompetitionDetailDefaultConfigStartListPolicyWindow?
    var maxGroupSize: Double?

    enum CodingKeys: String, CodingKey {
        case groups = "groups"
        case seats = "seats"
        case claimBy = "claimBy"
        case window = "window"
        case maxGroupSize = "maxGroupSize"
    }

    init(groups: CompetitionDetailDefaultConfigStartListPolicyGroups, seats: CompetitionDetailDefaultConfigStartListPolicySeats, claimBy: CompetitionDetailDefaultConfigStartListPolicyClaimBy, window: CompetitionDetailDefaultConfigStartListPolicyWindow? = nil, maxGroupSize: Double? = nil) {
        self.groups = groups
        self.seats = seats
        self.claimBy = claimBy
        self.window = window
        self.maxGroupSize = maxGroupSize
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.groups = try c.decode(CompetitionDetailDefaultConfigStartListPolicyGroups.self, forKey: .groups)
        self.seats = try c.decode(CompetitionDetailDefaultConfigStartListPolicySeats.self, forKey: .seats)
        self.claimBy = try c.decode(CompetitionDetailDefaultConfigStartListPolicyClaimBy.self, forKey: .claimBy)
        self.window = try c.decodeIfPresent(CompetitionDetailDefaultConfigStartListPolicyWindow.self, forKey: .window)
        self.maxGroupSize = try c.decodeIfPresent(Double.self, forKey: .maxGroupSize)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(groups, forKey: .groups)
        try c.encode(seats, forKey: .seats)
        try c.encode(claimBy, forKey: .claimBy)
        try c.encodeIfPresent(window, forKey: .window)
        try c.encodeIfPresent(maxGroupSize, forKey: .maxGroupSize)
    }
}

struct CompetitionDetailDefaultConfig: Codable, Sendable, Equatable {
    var slots: [CompetitionDetailDefaultConfigSlotsItem]
    var categoryTees: [String: CompetitionDetailDefaultConfigCategoryTeesValue]?
    var fallbackTee: CompetitionDetailDefaultConfigCategoryTeesValue?
    var startList: CompetitionDetailDefaultConfigStartList?
    var startListPolicy: CompetitionDetailDefaultConfigStartListPolicy?

    enum CodingKeys: String, CodingKey {
        case slots = "slots"
        case categoryTees = "categoryTees"
        case fallbackTee = "fallbackTee"
        case startList = "startList"
        case startListPolicy = "startListPolicy"
    }

    init(slots: [CompetitionDetailDefaultConfigSlotsItem], categoryTees: [String: CompetitionDetailDefaultConfigCategoryTeesValue]? = nil, fallbackTee: CompetitionDetailDefaultConfigCategoryTeesValue? = nil, startList: CompetitionDetailDefaultConfigStartList? = nil, startListPolicy: CompetitionDetailDefaultConfigStartListPolicy? = nil) {
        self.slots = slots
        self.categoryTees = categoryTees
        self.fallbackTee = fallbackTee
        self.startList = startList
        self.startListPolicy = startListPolicy
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.slots = try c.decode([CompetitionDetailDefaultConfigSlotsItem].self, forKey: .slots)
        self.categoryTees = try c.decodeIfPresent([String: CompetitionDetailDefaultConfigCategoryTeesValue].self, forKey: .categoryTees)
        self.fallbackTee = try c.decodeIfPresent(CompetitionDetailDefaultConfigCategoryTeesValue.self, forKey: .fallbackTee)
        self.startList = try c.decodeIfPresent(CompetitionDetailDefaultConfigStartList.self, forKey: .startList)
        self.startListPolicy = try c.decodeIfPresent(CompetitionDetailDefaultConfigStartListPolicy.self, forKey: .startListPolicy)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(slots, forKey: .slots)
        try c.encodeIfPresent(categoryTees, forKey: .categoryTees)
        try c.encodeIfPresent(fallbackTee, forKey: .fallbackTee)
        try c.encodeIfPresent(startList, forKey: .startList)
        try c.encodeIfPresent(startListPolicy, forKey: .startListPolicy)
    }
}

struct CompetitionDetail: Codable, Sendable, Equatable {
    var rounds: [CompetitionRoundListItem]
    var id: String
    var name: String
    var lifecycle: CompetitionDetailLifecycle
    var defaultConfig: CompetitionDetailDefaultConfig?
    var aggregation: CompetitionAggregation?
    var pointTemplateId: String?
    var cutRules: JSONValue
    var isResultsFinal: Bool
    var resultsFinalizedAt: String?
    var ownerPlayerId: String
    var createdAt: String

    enum CodingKeys: String, CodingKey {
        case rounds = "rounds"
        case id = "id"
        case name = "name"
        case lifecycle = "lifecycle"
        case defaultConfig = "defaultConfig"
        case aggregation = "aggregation"
        case pointTemplateId = "pointTemplateId"
        case cutRules = "cutRules"
        case isResultsFinal = "isResultsFinal"
        case resultsFinalizedAt = "resultsFinalizedAt"
        case ownerPlayerId = "ownerPlayerId"
        case createdAt = "createdAt"
    }

    init(rounds: [CompetitionRoundListItem], id: String, name: String, lifecycle: CompetitionDetailLifecycle, defaultConfig: CompetitionDetailDefaultConfig? = nil, aggregation: CompetitionAggregation? = nil, pointTemplateId: String? = nil, cutRules: JSONValue, isResultsFinal: Bool, resultsFinalizedAt: String? = nil, ownerPlayerId: String, createdAt: String) {
        self.rounds = rounds
        self.id = id
        self.name = name
        self.lifecycle = lifecycle
        self.defaultConfig = defaultConfig
        self.aggregation = aggregation
        self.pointTemplateId = pointTemplateId
        self.cutRules = cutRules
        self.isResultsFinal = isResultsFinal
        self.resultsFinalizedAt = resultsFinalizedAt
        self.ownerPlayerId = ownerPlayerId
        self.createdAt = createdAt
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.rounds = try c.decode([CompetitionRoundListItem].self, forKey: .rounds)
        self.id = try c.decode(String.self, forKey: .id)
        self.name = try c.decode(String.self, forKey: .name)
        self.lifecycle = try c.decode(CompetitionDetailLifecycle.self, forKey: .lifecycle)
        self.defaultConfig = try c.decodeIfPresent(CompetitionDetailDefaultConfig.self, forKey: .defaultConfig)
        self.aggregation = try c.decodeIfPresent(CompetitionAggregation.self, forKey: .aggregation)
        self.pointTemplateId = try c.decodeIfPresent(String.self, forKey: .pointTemplateId)
        self.cutRules = try c.decode(JSONValue.self, forKey: .cutRules)
        self.isResultsFinal = try c.decode(Bool.self, forKey: .isResultsFinal)
        self.resultsFinalizedAt = try c.decodeIfPresent(String.self, forKey: .resultsFinalizedAt)
        self.ownerPlayerId = try c.decode(String.self, forKey: .ownerPlayerId)
        self.createdAt = try c.decode(String.self, forKey: .createdAt)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(rounds, forKey: .rounds)
        try c.encode(id, forKey: .id)
        try c.encode(name, forKey: .name)
        try c.encode(lifecycle, forKey: .lifecycle)
        if let defaultConfig {
            try c.encode(defaultConfig, forKey: .defaultConfig)
        } else {
            try c.encodeNil(forKey: .defaultConfig)
        }
        if let aggregation {
            try c.encode(aggregation, forKey: .aggregation)
        } else {
            try c.encodeNil(forKey: .aggregation)
        }
        if let pointTemplateId {
            try c.encode(pointTemplateId, forKey: .pointTemplateId)
        } else {
            try c.encodeNil(forKey: .pointTemplateId)
        }
        try c.encode(cutRules, forKey: .cutRules)
        try c.encode(isResultsFinal, forKey: .isResultsFinal)
        if let resultsFinalizedAt {
            try c.encode(resultsFinalizedAt, forKey: .resultsFinalizedAt)
        } else {
            try c.encodeNil(forKey: .resultsFinalizedAt)
        }
        try c.encode(ownerPlayerId, forKey: .ownerPlayerId)
        try c.encode(createdAt, forKey: .createdAt)
    }
}

struct CompetitionParticipant: Codable, Sendable, Equatable {
    var id: String
    var competitionId: String
    var playerId: String?
    var guestPlayerId: String?
    var displayNameSnapshot: String
    var category: String?
    var cutAfterRound: Double?
    var withdrawnAt: String?
    var createdAt: String

    enum CodingKeys: String, CodingKey {
        case id = "id"
        case competitionId = "competitionId"
        case playerId = "playerId"
        case guestPlayerId = "guestPlayerId"
        case displayNameSnapshot = "displayNameSnapshot"
        case category = "category"
        case cutAfterRound = "cutAfterRound"
        case withdrawnAt = "withdrawnAt"
        case createdAt = "createdAt"
    }

    init(id: String, competitionId: String, playerId: String? = nil, guestPlayerId: String? = nil, displayNameSnapshot: String, category: String? = nil, cutAfterRound: Double? = nil, withdrawnAt: String? = nil, createdAt: String) {
        self.id = id
        self.competitionId = competitionId
        self.playerId = playerId
        self.guestPlayerId = guestPlayerId
        self.displayNameSnapshot = displayNameSnapshot
        self.category = category
        self.cutAfterRound = cutAfterRound
        self.withdrawnAt = withdrawnAt
        self.createdAt = createdAt
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try c.decode(String.self, forKey: .id)
        self.competitionId = try c.decode(String.self, forKey: .competitionId)
        self.playerId = try c.decodeIfPresent(String.self, forKey: .playerId)
        self.guestPlayerId = try c.decodeIfPresent(String.self, forKey: .guestPlayerId)
        self.displayNameSnapshot = try c.decode(String.self, forKey: .displayNameSnapshot)
        self.category = try c.decodeIfPresent(String.self, forKey: .category)
        self.cutAfterRound = try c.decodeIfPresent(Double.self, forKey: .cutAfterRound)
        self.withdrawnAt = try c.decodeIfPresent(String.self, forKey: .withdrawnAt)
        self.createdAt = try c.decode(String.self, forKey: .createdAt)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encode(competitionId, forKey: .competitionId)
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
        try c.encode(displayNameSnapshot, forKey: .displayNameSnapshot)
        if let category {
            try c.encode(category, forKey: .category)
        } else {
            try c.encodeNil(forKey: .category)
        }
        if let cutAfterRound {
            try c.encode(cutAfterRound, forKey: .cutAfterRound)
        } else {
            try c.encodeNil(forKey: .cutAfterRound)
        }
        if let withdrawnAt {
            try c.encode(withdrawnAt, forKey: .withdrawnAt)
        } else {
            try c.encodeNil(forKey: .withdrawnAt)
        }
        try c.encode(createdAt, forKey: .createdAt)
    }
}

enum CompetitionRefusalCode: String, Codable, Sendable, Equatable {
    case illegalTransition = "illegal_transition"
    case finalizeReserved = "finalize_reserved"
    case competitionFinalized = "competition_finalized"
    case lifecycleForbidsEdit = "lifecycle_forbids_edit"
    case lifecycleForbidsRoster = "lifecycle_forbids_roster"
    case lifecycleForbidsWithdraw = "lifecycle_forbids_withdraw"
    case invalidDefaultConfig = "invalid_default_config"
    case invalidAggregation = "invalid_aggregation"
    case lifecycleForbidsRounds = "lifecycle_forbids_rounds"
    case missingDefaultConfig = "missing_default_config"
    case emptyRoster = "empty_roster"
    case lifecycleForbidsCut = "lifecycle_forbids_cut"
    case missingCutRules = "missing_cut_rules"
    case invalidCutRules = "invalid_cut_rules"
    case cutAlreadyApplied = "cut_already_applied"
    case lifecycleForbidsFinalize = "lifecycle_forbids_finalize"
    case roundsIncomplete = "rounds_incomplete"
    case notFinalized = "not_finalized"
    case alreadyParticipant = "already_participant"
    case unknownPlayer = "unknown_player"
    case unknownGuest = "unknown_guest"
    case participantNotFound = "participant_not_found"
}

struct CompetitionRefusal: Codable, Sendable, Equatable {
    var code: CompetitionRefusalCode
    var message: String

    enum CodingKeys: String, CodingKey {
        case code = "code"
        case message = "message"
    }

    init(code: CompetitionRefusalCode, message: String) {
        self.code = code
        self.message = message
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.code = try c.decode(CompetitionRefusalCode.self, forKey: .code)
        self.message = try c.decode(String.self, forKey: .message)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(code, forKey: .code)
        try c.encode(message, forKey: .message)
    }
}

struct CompetitionLeaderboard: Codable, Sendable, Equatable {
    var competitionId: String
    var aggregation: CompetitionAggregation
    var defaulted: Bool
    var finalized: Bool
    var resultsFinalizedAt: String?
    var view: CompetitionResultView

    enum CodingKeys: String, CodingKey {
        case competitionId = "competitionId"
        case aggregation = "aggregation"
        case defaulted = "defaulted"
        case finalized = "finalized"
        case resultsFinalizedAt = "resultsFinalizedAt"
        case view = "view"
    }

    init(competitionId: String, aggregation: CompetitionAggregation, defaulted: Bool, finalized: Bool, resultsFinalizedAt: String? = nil, view: CompetitionResultView) {
        self.competitionId = competitionId
        self.aggregation = aggregation
        self.defaulted = defaulted
        self.finalized = finalized
        self.resultsFinalizedAt = resultsFinalizedAt
        self.view = view
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.competitionId = try c.decode(String.self, forKey: .competitionId)
        self.aggregation = try c.decode(CompetitionAggregation.self, forKey: .aggregation)
        self.defaulted = try c.decode(Bool.self, forKey: .defaulted)
        self.finalized = try c.decode(Bool.self, forKey: .finalized)
        self.resultsFinalizedAt = try c.decodeIfPresent(String.self, forKey: .resultsFinalizedAt)
        self.view = try c.decode(CompetitionResultView.self, forKey: .view)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(competitionId, forKey: .competitionId)
        try c.encode(aggregation, forKey: .aggregation)
        try c.encode(defaulted, forKey: .defaulted)
        try c.encode(finalized, forKey: .finalized)
        if let resultsFinalizedAt {
            try c.encode(resultsFinalizedAt, forKey: .resultsFinalizedAt)
        } else {
            try c.encodeNil(forKey: .resultsFinalizedAt)
        }
        try c.encode(view, forKey: .view)
    }
}

struct CompetitionResultsResultSetsItem: Codable, Sendable, Equatable {
    var scoringType: String
    var entries: [CompetitionResultEntry]

    enum CodingKeys: String, CodingKey {
        case scoringType = "scoringType"
        case entries = "entries"
    }

    init(scoringType: String, entries: [CompetitionResultEntry]) {
        self.scoringType = scoringType
        self.entries = entries
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.scoringType = try c.decode(String.self, forKey: .scoringType)
        self.entries = try c.decode([CompetitionResultEntry].self, forKey: .entries)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(scoringType, forKey: .scoringType)
        try c.encode(entries, forKey: .entries)
    }
}

struct CompetitionResults: Codable, Sendable, Equatable {
    var competitionId: String
    var finalizedAt: String
    var resultSets: [CompetitionResultsResultSetsItem]

    enum CodingKeys: String, CodingKey {
        case competitionId = "competitionId"
        case finalizedAt = "finalizedAt"
        case resultSets = "resultSets"
    }

    init(competitionId: String, finalizedAt: String, resultSets: [CompetitionResultsResultSetsItem]) {
        self.competitionId = competitionId
        self.finalizedAt = finalizedAt
        self.resultSets = resultSets
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.competitionId = try c.decode(String.self, forKey: .competitionId)
        self.finalizedAt = try c.decode(String.self, forKey: .finalizedAt)
        self.resultSets = try c.decode([CompetitionResultsResultSetsItem].self, forKey: .resultSets)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(competitionId, forKey: .competitionId)
        try c.encode(finalizedAt, forKey: .finalizedAt)
        try c.encode(resultSets, forKey: .resultSets)
    }
}

struct Competition: Codable, Sendable, Equatable {
    var id: String
    var name: String
    var lifecycle: CompetitionDetailLifecycle
    var defaultConfig: CompetitionDetailDefaultConfig?
    var aggregation: CompetitionAggregation?
    var pointTemplateId: String?
    var cutRules: JSONValue
    var isResultsFinal: Bool
    var resultsFinalizedAt: String?
    var ownerPlayerId: String
    var createdAt: String

    enum CodingKeys: String, CodingKey {
        case id = "id"
        case name = "name"
        case lifecycle = "lifecycle"
        case defaultConfig = "defaultConfig"
        case aggregation = "aggregation"
        case pointTemplateId = "pointTemplateId"
        case cutRules = "cutRules"
        case isResultsFinal = "isResultsFinal"
        case resultsFinalizedAt = "resultsFinalizedAt"
        case ownerPlayerId = "ownerPlayerId"
        case createdAt = "createdAt"
    }

    init(id: String, name: String, lifecycle: CompetitionDetailLifecycle, defaultConfig: CompetitionDetailDefaultConfig? = nil, aggregation: CompetitionAggregation? = nil, pointTemplateId: String? = nil, cutRules: JSONValue, isResultsFinal: Bool, resultsFinalizedAt: String? = nil, ownerPlayerId: String, createdAt: String) {
        self.id = id
        self.name = name
        self.lifecycle = lifecycle
        self.defaultConfig = defaultConfig
        self.aggregation = aggregation
        self.pointTemplateId = pointTemplateId
        self.cutRules = cutRules
        self.isResultsFinal = isResultsFinal
        self.resultsFinalizedAt = resultsFinalizedAt
        self.ownerPlayerId = ownerPlayerId
        self.createdAt = createdAt
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try c.decode(String.self, forKey: .id)
        self.name = try c.decode(String.self, forKey: .name)
        self.lifecycle = try c.decode(CompetitionDetailLifecycle.self, forKey: .lifecycle)
        self.defaultConfig = try c.decodeIfPresent(CompetitionDetailDefaultConfig.self, forKey: .defaultConfig)
        self.aggregation = try c.decodeIfPresent(CompetitionAggregation.self, forKey: .aggregation)
        self.pointTemplateId = try c.decodeIfPresent(String.self, forKey: .pointTemplateId)
        self.cutRules = try c.decode(JSONValue.self, forKey: .cutRules)
        self.isResultsFinal = try c.decode(Bool.self, forKey: .isResultsFinal)
        self.resultsFinalizedAt = try c.decodeIfPresent(String.self, forKey: .resultsFinalizedAt)
        self.ownerPlayerId = try c.decode(String.self, forKey: .ownerPlayerId)
        self.createdAt = try c.decode(String.self, forKey: .createdAt)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encode(name, forKey: .name)
        try c.encode(lifecycle, forKey: .lifecycle)
        if let defaultConfig {
            try c.encode(defaultConfig, forKey: .defaultConfig)
        } else {
            try c.encodeNil(forKey: .defaultConfig)
        }
        if let aggregation {
            try c.encode(aggregation, forKey: .aggregation)
        } else {
            try c.encodeNil(forKey: .aggregation)
        }
        if let pointTemplateId {
            try c.encode(pointTemplateId, forKey: .pointTemplateId)
        } else {
            try c.encodeNil(forKey: .pointTemplateId)
        }
        try c.encode(cutRules, forKey: .cutRules)
        try c.encode(isResultsFinal, forKey: .isResultsFinal)
        if let resultsFinalizedAt {
            try c.encode(resultsFinalizedAt, forKey: .resultsFinalizedAt)
        } else {
            try c.encodeNil(forKey: .resultsFinalizedAt)
        }
        try c.encode(ownerPlayerId, forKey: .ownerPlayerId)
        try c.encode(createdAt, forKey: .createdAt)
    }
}

struct CompetitionRound: Codable, Sendable, Equatable {
    var id: String
    var competitionId: String
    var roundId: String
    var roundNumber: Double
    var cutEligible: Bool
    var postCut: Bool
    var createdAt: String

    enum CodingKeys: String, CodingKey {
        case id = "id"
        case competitionId = "competitionId"
        case roundId = "roundId"
        case roundNumber = "roundNumber"
        case cutEligible = "cutEligible"
        case postCut = "postCut"
        case createdAt = "createdAt"
    }

    init(id: String, competitionId: String, roundId: String, roundNumber: Double, cutEligible: Bool, postCut: Bool, createdAt: String) {
        self.id = id
        self.competitionId = competitionId
        self.roundId = roundId
        self.roundNumber = roundNumber
        self.cutEligible = cutEligible
        self.postCut = postCut
        self.createdAt = createdAt
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try c.decode(String.self, forKey: .id)
        self.competitionId = try c.decode(String.self, forKey: .competitionId)
        self.roundId = try c.decode(String.self, forKey: .roundId)
        self.roundNumber = try c.decode(Double.self, forKey: .roundNumber)
        self.cutEligible = try c.decode(Bool.self, forKey: .cutEligible)
        self.postCut = try c.decode(Bool.self, forKey: .postCut)
        self.createdAt = try c.decode(String.self, forKey: .createdAt)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encode(competitionId, forKey: .competitionId)
        try c.encode(roundId, forKey: .roundId)
        try c.encode(roundNumber, forKey: .roundNumber)
        try c.encode(cutEligible, forKey: .cutEligible)
        try c.encode(postCut, forKey: .postCut)
        try c.encode(createdAt, forKey: .createdAt)
    }
}

enum RoundRoundType: String, Codable, Sendable, Equatable {
    case full18 = "full_18"
    case front9 = "front_9"
    case back9 = "back_9"
    case customHoles = "custom_holes"
}

enum RoundVenueType: String, Codable, Sendable, Equatable {
    case outdoor = "outdoor"
    case indoor = "indoor"
}

enum RoundStartListMode: String, Codable, Sendable, Equatable {
    case structured = "structured"
    case fixedSlots = "fixed_slots"
    case openWindow = "open_window"
}

struct Round: Codable, Sendable, Equatable {
    var id: String
    var courseId: String
    var date: String
    var roundType: RoundRoundType
    var venueType: RoundVenueType
    var startListMode: RoundStartListMode
    var windowStart: String?
    var windowEnd: String?
    var selfOrganize: Bool
    var status: AdminRoundSummaryStatus
    var latestEventId: String?
    var name: String?
    var courseNameSnapshot: String?
    var completedAt: String?
    var formatSlots: [FormatSlot]
    var playHoles: [RoundPlayHole]
    var routeSi: RoundRouteSi
    var routeHandicapPolicy: RoundRoutePolicy
    var routeSections: [RoundRouteSection]
    var playingGroups: [RoundPlayingGroup]

    enum CodingKeys: String, CodingKey {
        case id = "id"
        case courseId = "courseId"
        case date = "date"
        case roundType = "roundType"
        case venueType = "venueType"
        case startListMode = "startListMode"
        case windowStart = "windowStart"
        case windowEnd = "windowEnd"
        case selfOrganize = "selfOrganize"
        case status = "status"
        case latestEventId = "latestEventId"
        case name = "name"
        case courseNameSnapshot = "courseNameSnapshot"
        case completedAt = "completedAt"
        case formatSlots = "formatSlots"
        case playHoles = "playHoles"
        case routeSi = "routeSi"
        case routeHandicapPolicy = "routeHandicapPolicy"
        case routeSections = "routeSections"
        case playingGroups = "playingGroups"
    }

    init(id: String, courseId: String, date: String, roundType: RoundRoundType, venueType: RoundVenueType, startListMode: RoundStartListMode, windowStart: String? = nil, windowEnd: String? = nil, selfOrganize: Bool, status: AdminRoundSummaryStatus, latestEventId: String? = nil, name: String? = nil, courseNameSnapshot: String? = nil, completedAt: String? = nil, formatSlots: [FormatSlot], playHoles: [RoundPlayHole], routeSi: RoundRouteSi, routeHandicapPolicy: RoundRoutePolicy, routeSections: [RoundRouteSection], playingGroups: [RoundPlayingGroup]) {
        self.id = id
        self.courseId = courseId
        self.date = date
        self.roundType = roundType
        self.venueType = venueType
        self.startListMode = startListMode
        self.windowStart = windowStart
        self.windowEnd = windowEnd
        self.selfOrganize = selfOrganize
        self.status = status
        self.latestEventId = latestEventId
        self.name = name
        self.courseNameSnapshot = courseNameSnapshot
        self.completedAt = completedAt
        self.formatSlots = formatSlots
        self.playHoles = playHoles
        self.routeSi = routeSi
        self.routeHandicapPolicy = routeHandicapPolicy
        self.routeSections = routeSections
        self.playingGroups = playingGroups
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try c.decode(String.self, forKey: .id)
        self.courseId = try c.decode(String.self, forKey: .courseId)
        self.date = try c.decode(String.self, forKey: .date)
        self.roundType = try c.decode(RoundRoundType.self, forKey: .roundType)
        self.venueType = try c.decode(RoundVenueType.self, forKey: .venueType)
        self.startListMode = try c.decode(RoundStartListMode.self, forKey: .startListMode)
        self.windowStart = try c.decodeIfPresent(String.self, forKey: .windowStart)
        self.windowEnd = try c.decodeIfPresent(String.self, forKey: .windowEnd)
        self.selfOrganize = try c.decode(Bool.self, forKey: .selfOrganize)
        self.status = try c.decode(AdminRoundSummaryStatus.self, forKey: .status)
        self.latestEventId = try c.decodeIfPresent(String.self, forKey: .latestEventId)
        self.name = try c.decodeIfPresent(String.self, forKey: .name)
        self.courseNameSnapshot = try c.decodeIfPresent(String.self, forKey: .courseNameSnapshot)
        self.completedAt = try c.decodeIfPresent(String.self, forKey: .completedAt)
        self.formatSlots = try c.decode([FormatSlot].self, forKey: .formatSlots)
        self.playHoles = try c.decode([RoundPlayHole].self, forKey: .playHoles)
        self.routeSi = try c.decode(RoundRouteSi.self, forKey: .routeSi)
        self.routeHandicapPolicy = try c.decode(RoundRoutePolicy.self, forKey: .routeHandicapPolicy)
        self.routeSections = try c.decode([RoundRouteSection].self, forKey: .routeSections)
        self.playingGroups = try c.decode([RoundPlayingGroup].self, forKey: .playingGroups)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encode(courseId, forKey: .courseId)
        try c.encode(date, forKey: .date)
        try c.encode(roundType, forKey: .roundType)
        try c.encode(venueType, forKey: .venueType)
        try c.encode(startListMode, forKey: .startListMode)
        if let windowStart {
            try c.encode(windowStart, forKey: .windowStart)
        } else {
            try c.encodeNil(forKey: .windowStart)
        }
        if let windowEnd {
            try c.encode(windowEnd, forKey: .windowEnd)
        } else {
            try c.encodeNil(forKey: .windowEnd)
        }
        try c.encode(selfOrganize, forKey: .selfOrganize)
        try c.encode(status, forKey: .status)
        if let latestEventId {
            try c.encode(latestEventId, forKey: .latestEventId)
        } else {
            try c.encodeNil(forKey: .latestEventId)
        }
        if let name {
            try c.encode(name, forKey: .name)
        } else {
            try c.encodeNil(forKey: .name)
        }
        if let courseNameSnapshot {
            try c.encode(courseNameSnapshot, forKey: .courseNameSnapshot)
        } else {
            try c.encodeNil(forKey: .courseNameSnapshot)
        }
        if let completedAt {
            try c.encode(completedAt, forKey: .completedAt)
        } else {
            try c.encodeNil(forKey: .completedAt)
        }
        try c.encode(formatSlots, forKey: .formatSlots)
        try c.encode(playHoles, forKey: .playHoles)
        try c.encode(routeSi, forKey: .routeSi)
        try c.encode(routeHandicapPolicy, forKey: .routeHandicapPolicy)
        try c.encode(routeSections, forKey: .routeSections)
        try c.encode(playingGroups, forKey: .playingGroups)
    }
}

struct CompilerDiagnostic: Codable, Sendable, Equatable {
    var code: String
    var message: String
    var path: String?
    var formatIndex: Double?
    var slotIndex: Double?
    var formatId: String?
    var teamLabel: String?
    var actual: Double?
    var allowedMin: Double?
    var allowedMax: Double?

    enum CodingKeys: String, CodingKey {
        case code = "code"
        case message = "message"
        case path = "path"
        case formatIndex = "formatIndex"
        case slotIndex = "slotIndex"
        case formatId = "formatId"
        case teamLabel = "teamLabel"
        case actual = "actual"
        case allowedMin = "allowedMin"
        case allowedMax = "allowedMax"
    }

    init(code: String, message: String, path: String? = nil, formatIndex: Double? = nil, slotIndex: Double? = nil, formatId: String? = nil, teamLabel: String? = nil, actual: Double? = nil, allowedMin: Double? = nil, allowedMax: Double? = nil) {
        self.code = code
        self.message = message
        self.path = path
        self.formatIndex = formatIndex
        self.slotIndex = slotIndex
        self.formatId = formatId
        self.teamLabel = teamLabel
        self.actual = actual
        self.allowedMin = allowedMin
        self.allowedMax = allowedMax
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.code = try c.decode(String.self, forKey: .code)
        self.message = try c.decode(String.self, forKey: .message)
        self.path = try c.decodeIfPresent(String.self, forKey: .path)
        self.formatIndex = try c.decodeIfPresent(Double.self, forKey: .formatIndex)
        self.slotIndex = try c.decodeIfPresent(Double.self, forKey: .slotIndex)
        self.formatId = try c.decodeIfPresent(String.self, forKey: .formatId)
        self.teamLabel = try c.decodeIfPresent(String.self, forKey: .teamLabel)
        self.actual = try c.decodeIfPresent(Double.self, forKey: .actual)
        self.allowedMin = try c.decodeIfPresent(Double.self, forKey: .allowedMin)
        self.allowedMax = try c.decodeIfPresent(Double.self, forKey: .allowedMax)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(code, forKey: .code)
        try c.encode(message, forKey: .message)
        try c.encodeIfPresent(path, forKey: .path)
        try c.encodeIfPresent(formatIndex, forKey: .formatIndex)
        try c.encodeIfPresent(slotIndex, forKey: .slotIndex)
        try c.encodeIfPresent(formatId, forKey: .formatId)
        try c.encodeIfPresent(teamLabel, forKey: .teamLabel)
        try c.encodeIfPresent(actual, forKey: .actual)
        try c.encodeIfPresent(allowedMin, forKey: .allowedMin)
        try c.encodeIfPresent(allowedMax, forKey: .allowedMax)
    }
}

enum CutOutcomeRuleCutType: String, Codable, Sendable, Equatable {
    case topN = "top_n"
    case topPercent = "top_percent"
    case withinStrokes = "within_strokes"
}

struct CutOutcomeRule: Codable, Sendable, Equatable {
    var afterRound: Double
    var cutType: CutOutcomeRuleCutType
    var cutValue: Double

    enum CodingKeys: String, CodingKey {
        case afterRound = "afterRound"
        case cutType = "cutType"
        case cutValue = "cutValue"
    }

    init(afterRound: Double, cutType: CutOutcomeRuleCutType, cutValue: Double) {
        self.afterRound = afterRound
        self.cutType = cutType
        self.cutValue = cutValue
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.afterRound = try c.decode(Double.self, forKey: .afterRound)
        self.cutType = try c.decode(CutOutcomeRuleCutType.self, forKey: .cutType)
        self.cutValue = try c.decode(Double.self, forKey: .cutValue)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(afterRound, forKey: .afterRound)
        try c.encode(cutType, forKey: .cutType)
        try c.encode(cutValue, forKey: .cutValue)
    }
}

struct CutOutcome: Codable, Sendable, Equatable {
    var competitionId: String
    var rule: CutOutcomeRule
    var metricId: String
    var advanced: [CutDecisionEntry]
    var cut: [CutDecisionEntry]

    enum CodingKeys: String, CodingKey {
        case competitionId = "competitionId"
        case rule = "rule"
        case metricId = "metricId"
        case advanced = "advanced"
        case cut = "cut"
    }

    init(competitionId: String, rule: CutOutcomeRule, metricId: String, advanced: [CutDecisionEntry], cut: [CutDecisionEntry]) {
        self.competitionId = competitionId
        self.rule = rule
        self.metricId = metricId
        self.advanced = advanced
        self.cut = cut
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.competitionId = try c.decode(String.self, forKey: .competitionId)
        self.rule = try c.decode(CutOutcomeRule.self, forKey: .rule)
        self.metricId = try c.decode(String.self, forKey: .metricId)
        self.advanced = try c.decode([CutDecisionEntry].self, forKey: .advanced)
        self.cut = try c.decode([CutDecisionEntry].self, forKey: .cut)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(competitionId, forKey: .competitionId)
        try c.encode(rule, forKey: .rule)
        try c.encode(metricId, forKey: .metricId)
        try c.encode(advanced, forKey: .advanced)
        try c.encode(cut, forKey: .cut)
    }
}

struct FinalizeOutcome: Codable, Sendable, Equatable {
    var competition: Competition
    var scoringTypes: [String]
    var rowCount: Double

    enum CodingKeys: String, CodingKey {
        case competition = "competition"
        case scoringTypes = "scoringTypes"
        case rowCount = "rowCount"
    }

    init(competition: Competition, scoringTypes: [String], rowCount: Double) {
        self.competition = competition
        self.scoringTypes = scoringTypes
        self.rowCount = rowCount
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.competition = try c.decode(Competition.self, forKey: .competition)
        self.scoringTypes = try c.decode([String].self, forKey: .scoringTypes)
        self.rowCount = try c.decode(Double.self, forKey: .rowCount)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(competition, forKey: .competition)
        try c.encode(scoringTypes, forKey: .scoringTypes)
        try c.encode(rowCount, forKey: .rowCount)
    }
}

struct CompetitionRoundListItem: Codable, Sendable, Equatable {
    var id: String
    var competitionId: String
    var roundId: String
    var roundNumber: Double
    var cutEligible: Bool
    var postCut: Bool
    var createdAt: String
    var status: AdminRoundSummaryStatus
    var completedAt: String?
    var date: String
    var courseNameSnapshot: String?
    var shareToken: String?

    enum CodingKeys: String, CodingKey {
        case id = "id"
        case competitionId = "competitionId"
        case roundId = "roundId"
        case roundNumber = "roundNumber"
        case cutEligible = "cutEligible"
        case postCut = "postCut"
        case createdAt = "createdAt"
        case status = "status"
        case completedAt = "completedAt"
        case date = "date"
        case courseNameSnapshot = "courseNameSnapshot"
        case shareToken = "shareToken"
    }

    init(id: String, competitionId: String, roundId: String, roundNumber: Double, cutEligible: Bool, postCut: Bool, createdAt: String, status: AdminRoundSummaryStatus, completedAt: String? = nil, date: String, courseNameSnapshot: String? = nil, shareToken: String? = nil) {
        self.id = id
        self.competitionId = competitionId
        self.roundId = roundId
        self.roundNumber = roundNumber
        self.cutEligible = cutEligible
        self.postCut = postCut
        self.createdAt = createdAt
        self.status = status
        self.completedAt = completedAt
        self.date = date
        self.courseNameSnapshot = courseNameSnapshot
        self.shareToken = shareToken
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try c.decode(String.self, forKey: .id)
        self.competitionId = try c.decode(String.self, forKey: .competitionId)
        self.roundId = try c.decode(String.self, forKey: .roundId)
        self.roundNumber = try c.decode(Double.self, forKey: .roundNumber)
        self.cutEligible = try c.decode(Bool.self, forKey: .cutEligible)
        self.postCut = try c.decode(Bool.self, forKey: .postCut)
        self.createdAt = try c.decode(String.self, forKey: .createdAt)
        self.status = try c.decode(AdminRoundSummaryStatus.self, forKey: .status)
        self.completedAt = try c.decodeIfPresent(String.self, forKey: .completedAt)
        self.date = try c.decode(String.self, forKey: .date)
        self.courseNameSnapshot = try c.decodeIfPresent(String.self, forKey: .courseNameSnapshot)
        self.shareToken = try c.decodeIfPresent(String.self, forKey: .shareToken)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encode(competitionId, forKey: .competitionId)
        try c.encode(roundId, forKey: .roundId)
        try c.encode(roundNumber, forKey: .roundNumber)
        try c.encode(cutEligible, forKey: .cutEligible)
        try c.encode(postCut, forKey: .postCut)
        try c.encode(createdAt, forKey: .createdAt)
        try c.encode(status, forKey: .status)
        if let completedAt {
            try c.encode(completedAt, forKey: .completedAt)
        } else {
            try c.encodeNil(forKey: .completedAt)
        }
        try c.encode(date, forKey: .date)
        if let courseNameSnapshot {
            try c.encode(courseNameSnapshot, forKey: .courseNameSnapshot)
        } else {
            try c.encodeNil(forKey: .courseNameSnapshot)
        }
        try c.encodeIfPresent(shareToken, forKey: .shareToken)
    }
}

struct CompetitionAggregation: Codable, Sendable, Equatable {
    var strategyId: String
    var config: JSONValue

    enum CodingKeys: String, CodingKey {
        case strategyId = "strategyId"
        case config = "config"
    }

    init(strategyId: String, config: JSONValue) {
        self.strategyId = strategyId
        self.config = config
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.strategyId = try c.decode(String.self, forKey: .strategyId)
        self.config = try c.decode(JSONValue.self, forKey: .config)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(strategyId, forKey: .strategyId)
        try c.encode(config, forKey: .config)
    }
}

enum CompetitionResultViewDirection: String, Codable, Sendable, Equatable {
    case high = "high"
    case low = "low"
}

struct CompetitionResultViewOperatorSum: Codable, Sendable, Equatable {
    let kind: String = "sum"

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

struct CompetitionResultViewOperatorBestN: Codable, Sendable, Equatable {
    let kind: String = "best_n"
    var n: Double

    enum CodingKeys: String, CodingKey {
        case kind = "kind"
        case n = "n"
    }

    init(n: Double) {
        self.n = n
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        _ = try c.decode(String.self, forKey: .kind)
        self.n = try c.decode(Double.self, forKey: .n)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(kind, forKey: .kind)
        try c.encode(n, forKey: .n)
    }
}

enum CompetitionResultViewOperator: Codable, Sendable, Equatable {
    case sum(CompetitionResultViewOperatorSum)
    case bestN(CompetitionResultViewOperatorBestN)

    private enum DiscriminantKey: String, CodingKey {
        case discriminant = "kind"
    }

    init(from decoder: any Decoder) throws {
        let tag = try decoder.container(keyedBy: DiscriminantKey.self)
        let discriminant = try tag.decode(String.self, forKey: .discriminant)
        switch discriminant {
        case "sum":
            self = .sum(try CompetitionResultViewOperatorSum(from: decoder))
        case "best_n":
            self = .bestN(try CompetitionResultViewOperatorBestN(from: decoder))
        default:
            throw DecodingError.dataCorrupted(.init(
                codingPath: decoder.codingPath,
                debugDescription: "unknown kind: \(discriminant)"))
        }
    }

    func encode(to encoder: any Encoder) throws {
        switch self {
        case .sum(let v): try v.encode(to: encoder)
        case .bestN(let v): try v.encode(to: encoder)
        }
    }
}

struct CompetitionResultViewRoundsItem: Codable, Sendable, Equatable {
    var roundNumber: Double
    var postCut: Bool

    enum CodingKeys: String, CodingKey {
        case roundNumber = "roundNumber"
        case postCut = "postCut"
    }

    init(roundNumber: Double, postCut: Bool) {
        self.roundNumber = roundNumber
        self.postCut = postCut
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.roundNumber = try c.decode(Double.self, forKey: .roundNumber)
        self.postCut = try c.decode(Bool.self, forKey: .postCut)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(roundNumber, forKey: .roundNumber)
        try c.encode(postCut, forKey: .postCut)
    }
}

struct CompetitionResultView: Codable, Sendable, Equatable {
    let kind: String = "competition_ranked"
    var strategyId: String
    var metricId: String
    var metricLabel: String
    var direction: CompetitionResultViewDirection
    var `operator`: CompetitionResultViewOperator
    var rounds: [CompetitionResultViewRoundsItem]
    var entries: [CompetitionRankedEntry]

    enum CodingKeys: String, CodingKey {
        case kind = "kind"
        case strategyId = "strategyId"
        case metricId = "metricId"
        case metricLabel = "metricLabel"
        case direction = "direction"
        case `operator` = "operator"
        case rounds = "rounds"
        case entries = "entries"
    }

    init(strategyId: String, metricId: String, metricLabel: String, direction: CompetitionResultViewDirection, `operator`: CompetitionResultViewOperator, rounds: [CompetitionResultViewRoundsItem], entries: [CompetitionRankedEntry]) {
        self.strategyId = strategyId
        self.metricId = metricId
        self.metricLabel = metricLabel
        self.direction = direction
        self.`operator` = `operator`
        self.rounds = rounds
        self.entries = entries
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        _ = try c.decode(String.self, forKey: .kind)
        self.strategyId = try c.decode(String.self, forKey: .strategyId)
        self.metricId = try c.decode(String.self, forKey: .metricId)
        self.metricLabel = try c.decode(String.self, forKey: .metricLabel)
        self.direction = try c.decode(CompetitionResultViewDirection.self, forKey: .direction)
        self.`operator` = try c.decode(CompetitionResultViewOperator.self, forKey: .`operator`)
        self.rounds = try c.decode([CompetitionResultViewRoundsItem].self, forKey: .rounds)
        self.entries = try c.decode([CompetitionRankedEntry].self, forKey: .entries)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(kind, forKey: .kind)
        try c.encode(strategyId, forKey: .strategyId)
        try c.encode(metricId, forKey: .metricId)
        try c.encode(metricLabel, forKey: .metricLabel)
        try c.encode(direction, forKey: .direction)
        try c.encode(`operator`, forKey: .`operator`)
        try c.encode(rounds, forKey: .rounds)
        try c.encode(entries, forKey: .entries)
    }
}

struct CompetitionResultEntry: Codable, Sendable, Equatable {
    var participantId: String
    var position: Double
    var points: Double
    var entry: CompetitionRankedEntry
    var tiebreak: JSONValue

    enum CodingKeys: String, CodingKey {
        case participantId = "participantId"
        case position = "position"
        case points = "points"
        case entry = "entry"
        case tiebreak = "tiebreak"
    }

    init(participantId: String, position: Double, points: Double, entry: CompetitionRankedEntry, tiebreak: JSONValue) {
        self.participantId = participantId
        self.position = position
        self.points = points
        self.entry = entry
        self.tiebreak = tiebreak
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.participantId = try c.decode(String.self, forKey: .participantId)
        self.position = try c.decode(Double.self, forKey: .position)
        self.points = try c.decode(Double.self, forKey: .points)
        self.entry = try c.decode(CompetitionRankedEntry.self, forKey: .entry)
        self.tiebreak = try c.decode(JSONValue.self, forKey: .tiebreak)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(participantId, forKey: .participantId)
        try c.encode(position, forKey: .position)
        try c.encode(points, forKey: .points)
        try c.encode(entry, forKey: .entry)
        try c.encode(tiebreak, forKey: .tiebreak)
    }
}

enum FormatSlotScoringMode: String, Codable, Sendable, Equatable {
    case custom = "custom"
    case strokePlay = "stroke_play"
    case stableford = "stableford"
    case matchPlay = "match_play"
    case kopenhamnare = "kopenhamnare"
    case taliban = "taliban"
    case umbrella = "umbrella"
    case skins = "skins"
}

enum FormatSlotTeamShape: String, Codable, Sendable, Equatable {
    case custom = "custom"
    case individual = "individual"
    case betterBall = "better_ball"
    case fourBall = "four_ball"
}

enum FormatSlotBallMode: String, Codable, Sendable, Equatable {
    case own = "own"
    case team = "team"
}

struct FormatSlot: Codable, Sendable, Equatable {
    var slotIndex: Double
    var slotDefId: String
    var formatId: String
    var scoringMode: FormatSlotScoringMode
    var teamShape: FormatSlotTeamShape
    var allowancePct: Double
    var allowanceConfig: CompetitionDetailDefaultConfigSlotsItemAllowanceConfig
    var formatConfig: JSONValue
    var ballMode: FormatSlotBallMode

    enum CodingKeys: String, CodingKey {
        case slotIndex = "slotIndex"
        case slotDefId = "slotDefId"
        case formatId = "formatId"
        case scoringMode = "scoringMode"
        case teamShape = "teamShape"
        case allowancePct = "allowancePct"
        case allowanceConfig = "allowanceConfig"
        case formatConfig = "formatConfig"
        case ballMode = "ballMode"
    }

    init(slotIndex: Double, slotDefId: String, formatId: String, scoringMode: FormatSlotScoringMode, teamShape: FormatSlotTeamShape, allowancePct: Double, allowanceConfig: CompetitionDetailDefaultConfigSlotsItemAllowanceConfig, formatConfig: JSONValue, ballMode: FormatSlotBallMode) {
        self.slotIndex = slotIndex
        self.slotDefId = slotDefId
        self.formatId = formatId
        self.scoringMode = scoringMode
        self.teamShape = teamShape
        self.allowancePct = allowancePct
        self.allowanceConfig = allowanceConfig
        self.formatConfig = formatConfig
        self.ballMode = ballMode
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.slotIndex = try c.decode(Double.self, forKey: .slotIndex)
        self.slotDefId = try c.decode(String.self, forKey: .slotDefId)
        self.formatId = try c.decode(String.self, forKey: .formatId)
        self.scoringMode = try c.decode(FormatSlotScoringMode.self, forKey: .scoringMode)
        self.teamShape = try c.decode(FormatSlotTeamShape.self, forKey: .teamShape)
        self.allowancePct = try c.decode(Double.self, forKey: .allowancePct)
        self.allowanceConfig = try c.decode(CompetitionDetailDefaultConfigSlotsItemAllowanceConfig.self, forKey: .allowanceConfig)
        self.formatConfig = try c.decode(JSONValue.self, forKey: .formatConfig)
        self.ballMode = try c.decode(FormatSlotBallMode.self, forKey: .ballMode)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(slotIndex, forKey: .slotIndex)
        try c.encode(slotDefId, forKey: .slotDefId)
        try c.encode(formatId, forKey: .formatId)
        try c.encode(scoringMode, forKey: .scoringMode)
        try c.encode(teamShape, forKey: .teamShape)
        try c.encode(allowancePct, forKey: .allowancePct)
        try c.encode(allowanceConfig, forKey: .allowanceConfig)
        try c.encode(formatConfig, forKey: .formatConfig)
        try c.encode(ballMode, forKey: .ballMode)
    }
}

struct RoundPlayHole: Codable, Sendable, Equatable {
    var id: String
    var playHoleDefId: String
    var ordinal: Double
    var courseHoleNumber: Double
    var par: Double
    var baseStrokeIndex: Double
    var tees: [RoundPlayHoleTee]

    enum CodingKeys: String, CodingKey {
        case id = "id"
        case playHoleDefId = "playHoleDefId"
        case ordinal = "ordinal"
        case courseHoleNumber = "courseHoleNumber"
        case par = "par"
        case baseStrokeIndex = "baseStrokeIndex"
        case tees = "tees"
    }

    init(id: String, playHoleDefId: String, ordinal: Double, courseHoleNumber: Double, par: Double, baseStrokeIndex: Double, tees: [RoundPlayHoleTee]) {
        self.id = id
        self.playHoleDefId = playHoleDefId
        self.ordinal = ordinal
        self.courseHoleNumber = courseHoleNumber
        self.par = par
        self.baseStrokeIndex = baseStrokeIndex
        self.tees = tees
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try c.decode(String.self, forKey: .id)
        self.playHoleDefId = try c.decode(String.self, forKey: .playHoleDefId)
        self.ordinal = try c.decode(Double.self, forKey: .ordinal)
        self.courseHoleNumber = try c.decode(Double.self, forKey: .courseHoleNumber)
        self.par = try c.decode(Double.self, forKey: .par)
        self.baseStrokeIndex = try c.decode(Double.self, forKey: .baseStrokeIndex)
        self.tees = try c.decode([RoundPlayHoleTee].self, forKey: .tees)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encode(playHoleDefId, forKey: .playHoleDefId)
        try c.encode(ordinal, forKey: .ordinal)
        try c.encode(courseHoleNumber, forKey: .courseHoleNumber)
        try c.encode(par, forKey: .par)
        try c.encode(baseStrokeIndex, forKey: .baseStrokeIndex)
        try c.encode(tees, forKey: .tees)
    }
}

enum RoundRouteSiMode: String, Codable, Sendable, Equatable {
    case official = "official"
    case difficulty = "difficulty"
    case custom = "custom"
}

struct RoundRouteSi: Codable, Sendable, Equatable {
    var mode: RoundRouteSiMode
    var sourceLabel: String?
    var sourceVersion: String?
    var allocationCycleSize: Double

    enum CodingKeys: String, CodingKey {
        case mode = "mode"
        case sourceLabel = "sourceLabel"
        case sourceVersion = "sourceVersion"
        case allocationCycleSize = "allocationCycleSize"
    }

    init(mode: RoundRouteSiMode, sourceLabel: String? = nil, sourceVersion: String? = nil, allocationCycleSize: Double) {
        self.mode = mode
        self.sourceLabel = sourceLabel
        self.sourceVersion = sourceVersion
        self.allocationCycleSize = allocationCycleSize
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.mode = try c.decode(RoundRouteSiMode.self, forKey: .mode)
        self.sourceLabel = try c.decodeIfPresent(String.self, forKey: .sourceLabel)
        self.sourceVersion = try c.decodeIfPresent(String.self, forKey: .sourceVersion)
        self.allocationCycleSize = try c.decode(Double.self, forKey: .allocationCycleSize)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(mode, forKey: .mode)
        if let sourceLabel {
            try c.encode(sourceLabel, forKey: .sourceLabel)
        } else {
            try c.encodeNil(forKey: .sourceLabel)
        }
        if let sourceVersion {
            try c.encode(sourceVersion, forKey: .sourceVersion)
        } else {
            try c.encodeNil(forKey: .sourceVersion)
        }
        try c.encode(allocationCycleSize, forKey: .allocationCycleSize)
    }
}

enum RoundRoutePolicyType: String, Codable, Sendable, Equatable {
    case officialRoute = "official_route"
    case fullCourseCasual = "full_course_casual"
    case proratedCasual = "prorated_casual"
    case explicit = "explicit"
}

struct RoundRoutePolicy: Codable, Sendable, Equatable {
    var type: RoundRoutePolicyType
    var postingEligible: Bool
    var postingIneligibleReason: String?

    enum CodingKeys: String, CodingKey {
        case type = "type"
        case postingEligible = "postingEligible"
        case postingIneligibleReason = "postingIneligibleReason"
    }

    init(type: RoundRoutePolicyType, postingEligible: Bool, postingIneligibleReason: String? = nil) {
        self.type = type
        self.postingEligible = postingEligible
        self.postingIneligibleReason = postingIneligibleReason
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.type = try c.decode(RoundRoutePolicyType.self, forKey: .type)
        self.postingEligible = try c.decode(Bool.self, forKey: .postingEligible)
        self.postingIneligibleReason = try c.decodeIfPresent(String.self, forKey: .postingIneligibleReason)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(type, forKey: .type)
        try c.encode(postingEligible, forKey: .postingEligible)
        if let postingIneligibleReason {
            try c.encode(postingIneligibleReason, forKey: .postingIneligibleReason)
        } else {
            try c.encodeNil(forKey: .postingIneligibleReason)
        }
    }
}

struct RoundRouteSection: Codable, Sendable, Equatable {
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

struct RoundPlayingGroup: Codable, Sendable, Equatable {
    var id: String
    var startTime: String
    var capacity: Double
    var hittingBay: String?
    var startPlayHoleId: String
    var startOrdinal: Double
    var endPlayHoleId: String
    var endOrdinal: Double
    var ballIds: [String]
    var playedOrder: [RoundGroupPlayedHole]

    enum CodingKeys: String, CodingKey {
        case id = "id"
        case startTime = "startTime"
        case capacity = "capacity"
        case hittingBay = "hittingBay"
        case startPlayHoleId = "startPlayHoleId"
        case startOrdinal = "startOrdinal"
        case endPlayHoleId = "endPlayHoleId"
        case endOrdinal = "endOrdinal"
        case ballIds = "ballIds"
        case playedOrder = "playedOrder"
    }

    init(id: String, startTime: String, capacity: Double, hittingBay: String? = nil, startPlayHoleId: String, startOrdinal: Double, endPlayHoleId: String, endOrdinal: Double, ballIds: [String], playedOrder: [RoundGroupPlayedHole]) {
        self.id = id
        self.startTime = startTime
        self.capacity = capacity
        self.hittingBay = hittingBay
        self.startPlayHoleId = startPlayHoleId
        self.startOrdinal = startOrdinal
        self.endPlayHoleId = endPlayHoleId
        self.endOrdinal = endOrdinal
        self.ballIds = ballIds
        self.playedOrder = playedOrder
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try c.decode(String.self, forKey: .id)
        self.startTime = try c.decode(String.self, forKey: .startTime)
        self.capacity = try c.decode(Double.self, forKey: .capacity)
        self.hittingBay = try c.decodeIfPresent(String.self, forKey: .hittingBay)
        self.startPlayHoleId = try c.decode(String.self, forKey: .startPlayHoleId)
        self.startOrdinal = try c.decode(Double.self, forKey: .startOrdinal)
        self.endPlayHoleId = try c.decode(String.self, forKey: .endPlayHoleId)
        self.endOrdinal = try c.decode(Double.self, forKey: .endOrdinal)
        self.ballIds = try c.decode([String].self, forKey: .ballIds)
        self.playedOrder = try c.decode([RoundGroupPlayedHole].self, forKey: .playedOrder)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encode(startTime, forKey: .startTime)
        try c.encode(capacity, forKey: .capacity)
        if let hittingBay {
            try c.encode(hittingBay, forKey: .hittingBay)
        } else {
            try c.encodeNil(forKey: .hittingBay)
        }
        try c.encode(startPlayHoleId, forKey: .startPlayHoleId)
        try c.encode(startOrdinal, forKey: .startOrdinal)
        try c.encode(endPlayHoleId, forKey: .endPlayHoleId)
        try c.encode(endOrdinal, forKey: .endOrdinal)
        try c.encode(ballIds, forKey: .ballIds)
        try c.encode(playedOrder, forKey: .playedOrder)
    }
}

enum CutDecisionEntryReason: String, Codable, Sendable, Equatable {
    case rank = "rank"
    case withdrawn = "withdrawn"
}

struct CutDecisionEntry: Codable, Sendable, Equatable {
    var participantId: String
    var displayName: String
    var position: Double
    var total: Double?
    var reason: CutDecisionEntryReason?

    enum CodingKeys: String, CodingKey {
        case participantId = "participantId"
        case displayName = "displayName"
        case position = "position"
        case total = "total"
        case reason = "reason"
    }

    init(participantId: String, displayName: String, position: Double, total: Double? = nil, reason: CutDecisionEntryReason? = nil) {
        self.participantId = participantId
        self.displayName = displayName
        self.position = position
        self.total = total
        self.reason = reason
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.participantId = try c.decode(String.self, forKey: .participantId)
        self.displayName = try c.decode(String.self, forKey: .displayName)
        self.position = try c.decode(Double.self, forKey: .position)
        self.total = try c.decodeIfPresent(Double.self, forKey: .total)
        self.reason = try c.decodeIfPresent(CutDecisionEntryReason.self, forKey: .reason)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(participantId, forKey: .participantId)
        try c.encode(displayName, forKey: .displayName)
        try c.encode(position, forKey: .position)
        if let total {
            try c.encode(total, forKey: .total)
        } else {
            try c.encodeNil(forKey: .total)
        }
        try c.encodeIfPresent(reason, forKey: .reason)
    }
}

struct CompetitionRankedEntry: Codable, Sendable, Equatable {
    var participantId: String
    var displayName: String
    var category: String?
    var playerRef: IdentityRef
    var rounds: [CompetitionRoundCell]
    var total: Double?
    var roundsCounted: Double
    var position: Double
    var withdrawn: Bool
    var cutAfterRound: Double?
    var incomplete: Bool

    enum CodingKeys: String, CodingKey {
        case participantId = "participantId"
        case displayName = "displayName"
        case category = "category"
        case playerRef = "playerRef"
        case rounds = "rounds"
        case total = "total"
        case roundsCounted = "roundsCounted"
        case position = "position"
        case withdrawn = "withdrawn"
        case cutAfterRound = "cutAfterRound"
        case incomplete = "incomplete"
    }

    init(participantId: String, displayName: String, category: String? = nil, playerRef: IdentityRef, rounds: [CompetitionRoundCell], total: Double? = nil, roundsCounted: Double, position: Double, withdrawn: Bool, cutAfterRound: Double? = nil, incomplete: Bool) {
        self.participantId = participantId
        self.displayName = displayName
        self.category = category
        self.playerRef = playerRef
        self.rounds = rounds
        self.total = total
        self.roundsCounted = roundsCounted
        self.position = position
        self.withdrawn = withdrawn
        self.cutAfterRound = cutAfterRound
        self.incomplete = incomplete
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.participantId = try c.decode(String.self, forKey: .participantId)
        self.displayName = try c.decode(String.self, forKey: .displayName)
        self.category = try c.decodeIfPresent(String.self, forKey: .category)
        self.playerRef = try c.decode(IdentityRef.self, forKey: .playerRef)
        self.rounds = try c.decode([CompetitionRoundCell].self, forKey: .rounds)
        self.total = try c.decodeIfPresent(Double.self, forKey: .total)
        self.roundsCounted = try c.decode(Double.self, forKey: .roundsCounted)
        self.position = try c.decode(Double.self, forKey: .position)
        self.withdrawn = try c.decode(Bool.self, forKey: .withdrawn)
        self.cutAfterRound = try c.decodeIfPresent(Double.self, forKey: .cutAfterRound)
        self.incomplete = try c.decode(Bool.self, forKey: .incomplete)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(participantId, forKey: .participantId)
        try c.encode(displayName, forKey: .displayName)
        if let category {
            try c.encode(category, forKey: .category)
        } else {
            try c.encodeNil(forKey: .category)
        }
        try c.encode(playerRef, forKey: .playerRef)
        try c.encode(rounds, forKey: .rounds)
        if let total {
            try c.encode(total, forKey: .total)
        } else {
            try c.encodeNil(forKey: .total)
        }
        try c.encode(roundsCounted, forKey: .roundsCounted)
        try c.encode(position, forKey: .position)
        try c.encode(withdrawn, forKey: .withdrawn)
        if let cutAfterRound {
            try c.encode(cutAfterRound, forKey: .cutAfterRound)
        } else {
            try c.encodeNil(forKey: .cutAfterRound)
        }
        try c.encode(incomplete, forKey: .incomplete)
    }
}

struct RoundPlayHoleTee: Codable, Sendable, Equatable {
    var teeRef: String
    var teeName: String
    var lengthM: Double
    var strokeIndex: Double

    enum CodingKeys: String, CodingKey {
        case teeRef = "teeRef"
        case teeName = "teeName"
        case lengthM = "lengthM"
        case strokeIndex = "strokeIndex"
    }

    init(teeRef: String, teeName: String, lengthM: Double, strokeIndex: Double) {
        self.teeRef = teeRef
        self.teeName = teeName
        self.lengthM = lengthM
        self.strokeIndex = strokeIndex
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.teeRef = try c.decode(String.self, forKey: .teeRef)
        self.teeName = try c.decode(String.self, forKey: .teeName)
        self.lengthM = try c.decode(Double.self, forKey: .lengthM)
        self.strokeIndex = try c.decode(Double.self, forKey: .strokeIndex)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(teeRef, forKey: .teeRef)
        try c.encode(teeName, forKey: .teeName)
        try c.encode(lengthM, forKey: .lengthM)
        try c.encode(strokeIndex, forKey: .strokeIndex)
    }
}

struct RoundGroupPlayedHole: Codable, Sendable, Equatable {
    var playHoleId: String
    var ordinal: Double
    var courseHoleNumber: Double
    var groupRelativeOrder: Double

    enum CodingKeys: String, CodingKey {
        case playHoleId = "playHoleId"
        case ordinal = "ordinal"
        case courseHoleNumber = "courseHoleNumber"
        case groupRelativeOrder = "groupRelativeOrder"
    }

    init(playHoleId: String, ordinal: Double, courseHoleNumber: Double, groupRelativeOrder: Double) {
        self.playHoleId = playHoleId
        self.ordinal = ordinal
        self.courseHoleNumber = courseHoleNumber
        self.groupRelativeOrder = groupRelativeOrder
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.playHoleId = try c.decode(String.self, forKey: .playHoleId)
        self.ordinal = try c.decode(Double.self, forKey: .ordinal)
        self.courseHoleNumber = try c.decode(Double.self, forKey: .courseHoleNumber)
        self.groupRelativeOrder = try c.decode(Double.self, forKey: .groupRelativeOrder)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(playHoleId, forKey: .playHoleId)
        try c.encode(ordinal, forKey: .ordinal)
        try c.encode(courseHoleNumber, forKey: .courseHoleNumber)
        try c.encode(groupRelativeOrder, forKey: .groupRelativeOrder)
    }
}

enum IdentityRefKind: String, Codable, Sendable, Equatable {
    case player = "player"
    case guest = "guest"
}

struct IdentityRef: Codable, Sendable, Equatable {
    var kind: IdentityRefKind
    var id: String

    enum CodingKeys: String, CodingKey {
        case kind = "kind"
        case id = "id"
    }

    init(kind: IdentityRefKind, id: String) {
        self.kind = kind
        self.id = id
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.kind = try c.decode(IdentityRefKind.self, forKey: .kind)
        self.id = try c.decode(String.self, forKey: .id)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(kind, forKey: .kind)
        try c.encode(id, forKey: .id)
    }
}

enum CompetitionRoundCellStatus: String, Codable, Sendable, Equatable {
    case counted = "counted"
    case dropped = "dropped"
    case missing = "missing"
    case cut = "cut"
}

struct CompetitionRoundCell: Codable, Sendable, Equatable {
    var roundNumber: Double
    var value: Double?
    var included: Bool
    var status: CompetitionRoundCellStatus

    enum CodingKeys: String, CodingKey {
        case roundNumber = "roundNumber"
        case value = "value"
        case included = "included"
        case status = "status"
    }

    init(roundNumber: Double, value: Double? = nil, included: Bool, status: CompetitionRoundCellStatus) {
        self.roundNumber = roundNumber
        self.value = value
        self.included = included
        self.status = status
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.roundNumber = try c.decode(Double.self, forKey: .roundNumber)
        self.value = try c.decodeIfPresent(Double.self, forKey: .value)
        self.included = try c.decode(Bool.self, forKey: .included)
        self.status = try c.decode(CompetitionRoundCellStatus.self, forKey: .status)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(roundNumber, forKey: .roundNumber)
        if let value {
            try c.encode(value, forKey: .value)
        } else {
            try c.encodeNil(forKey: .value)
        }
        try c.encode(included, forKey: .included)
        try c.encode(status, forKey: .status)
    }
}

struct CompetitionsParticipantsInput: Codable, Sendable, Equatable {
    var competitionId: String

    enum CodingKeys: String, CodingKey {
        case competitionId = "competitionId"
    }

    init(competitionId: String) {
        self.competitionId = competitionId
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.competitionId = try c.decode(String.self, forKey: .competitionId)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(competitionId, forKey: .competitionId)
    }
}

struct CompetitionsLeaderboardOutputNotOk: Codable, Sendable, Equatable {
    let ok: Bool = false
    var refusal: CompetitionRefusal

    enum CodingKeys: String, CodingKey {
        case ok = "ok"
        case refusal = "refusal"
    }

    init(refusal: CompetitionRefusal) {
        self.refusal = refusal
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        _ = try c.decode(Bool.self, forKey: .ok)
        self.refusal = try c.decode(CompetitionRefusal.self, forKey: .refusal)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(ok, forKey: .ok)
        try c.encode(refusal, forKey: .refusal)
    }
}

struct CompetitionsLeaderboardOutputOk: Codable, Sendable, Equatable {
    let ok: Bool = true
    var value: CompetitionLeaderboard

    enum CodingKeys: String, CodingKey {
        case ok = "ok"
        case value = "value"
    }

    init(value: CompetitionLeaderboard) {
        self.value = value
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        _ = try c.decode(Bool.self, forKey: .ok)
        self.value = try c.decode(CompetitionLeaderboard.self, forKey: .value)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(ok, forKey: .ok)
        try c.encode(value, forKey: .value)
    }
}

enum CompetitionsLeaderboardOutput: Codable, Sendable, Equatable {
    case notOk(CompetitionsLeaderboardOutputNotOk)
    case ok(CompetitionsLeaderboardOutputOk)

    private enum DiscriminantKey: String, CodingKey {
        case discriminant = "ok"
    }

    init(from decoder: any Decoder) throws {
        let tag = try decoder.container(keyedBy: DiscriminantKey.self)
        let discriminant = try tag.decode(Bool.self, forKey: .discriminant)
        switch discriminant {
        case false:
            self = .notOk(try CompetitionsLeaderboardOutputNotOk(from: decoder))
        case true:
            self = .ok(try CompetitionsLeaderboardOutputOk(from: decoder))
        }
    }

    func encode(to encoder: any Encoder) throws {
        switch self {
        case .notOk(let v): try v.encode(to: encoder)
        case .ok(let v): try v.encode(to: encoder)
        }
    }
}

struct CompetitionsResultsOutputOk: Codable, Sendable, Equatable {
    let ok: Bool = true
    var value: CompetitionResults

    enum CodingKeys: String, CodingKey {
        case ok = "ok"
        case value = "value"
    }

    init(value: CompetitionResults) {
        self.value = value
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        _ = try c.decode(Bool.self, forKey: .ok)
        self.value = try c.decode(CompetitionResults.self, forKey: .value)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(ok, forKey: .ok)
        try c.encode(value, forKey: .value)
    }
}

enum CompetitionsResultsOutput: Codable, Sendable, Equatable {
    case notOk(CompetitionsLeaderboardOutputNotOk)
    case ok(CompetitionsResultsOutputOk)

    private enum DiscriminantKey: String, CodingKey {
        case discriminant = "ok"
    }

    init(from decoder: any Decoder) throws {
        let tag = try decoder.container(keyedBy: DiscriminantKey.self)
        let discriminant = try tag.decode(Bool.self, forKey: .discriminant)
        switch discriminant {
        case false:
            self = .notOk(try CompetitionsLeaderboardOutputNotOk(from: decoder))
        case true:
            self = .ok(try CompetitionsResultsOutputOk(from: decoder))
        }
    }

    func encode(to encoder: any Encoder) throws {
        switch self {
        case .notOk(let v): try v.encode(to: encoder)
        case .ok(let v): try v.encode(to: encoder)
        }
    }
}

struct CompetitionsCreateInput: Codable, Sendable, Equatable {
    var name: String

    enum CodingKeys: String, CodingKey {
        case name = "name"
    }

    init(name: String) {
        self.name = name
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.name = try c.decode(String.self, forKey: .name)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(name, forKey: .name)
    }
}

struct CompetitionsUpdateInputAggregation: Codable, Sendable, Equatable {
    var strategyId: String
    var config: JSONValue

    enum CodingKeys: String, CodingKey {
        case strategyId = "strategyId"
        case config = "config"
    }

    init(strategyId: String, config: JSONValue) {
        self.strategyId = strategyId
        self.config = config
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.strategyId = try c.decode(String.self, forKey: .strategyId)
        self.config = try c.decode(JSONValue.self, forKey: .config)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(strategyId, forKey: .strategyId)
        try c.encode(config, forKey: .config)
    }
}

struct CompetitionsUpdateInput: Codable, Sendable, Equatable {
    var id: String
    var name: String?
    var defaultConfig: JSONValue?
    var aggregation: TriState<CompetitionsUpdateInputAggregation>
    var cutRules: JSONValue?

    enum CodingKeys: String, CodingKey {
        case id = "id"
        case name = "name"
        case defaultConfig = "defaultConfig"
        case aggregation = "aggregation"
        case cutRules = "cutRules"
    }

    init(id: String, name: String? = nil, defaultConfig: JSONValue? = nil, aggregation: TriState<CompetitionsUpdateInputAggregation> = .absent, cutRules: JSONValue? = nil) {
        self.id = id
        self.name = name
        self.defaultConfig = defaultConfig
        self.aggregation = aggregation
        self.cutRules = cutRules
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try c.decode(String.self, forKey: .id)
        self.name = try c.decodeIfPresent(String.self, forKey: .name)
        self.defaultConfig = try c.decodeIfPresent(JSONValue.self, forKey: .defaultConfig)
        if c.contains(.aggregation) {
            self.aggregation = try c.decodeNil(forKey: .aggregation)
                ? .null
                : .value(try c.decode(CompetitionsUpdateInputAggregation.self, forKey: .aggregation))
        } else {
            self.aggregation = .absent
        }
        self.cutRules = try c.decodeIfPresent(JSONValue.self, forKey: .cutRules)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encodeIfPresent(name, forKey: .name)
        try c.encodeIfPresent(defaultConfig, forKey: .defaultConfig)
        switch aggregation {
        case .absent: break
        case .null: try c.encodeNil(forKey: .aggregation)
        case .value(let v): try c.encode(v, forKey: .aggregation)
        }
        try c.encodeIfPresent(cutRules, forKey: .cutRules)
    }
}

struct CompetitionsUpdateOutputOk: Codable, Sendable, Equatable {
    let ok: Bool = true
    var value: Competition

    enum CodingKeys: String, CodingKey {
        case ok = "ok"
        case value = "value"
    }

    init(value: Competition) {
        self.value = value
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        _ = try c.decode(Bool.self, forKey: .ok)
        self.value = try c.decode(Competition.self, forKey: .value)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(ok, forKey: .ok)
        try c.encode(value, forKey: .value)
    }
}

enum CompetitionsUpdateOutput: Codable, Sendable, Equatable {
    case notOk(CompetitionsLeaderboardOutputNotOk)
    case ok(CompetitionsUpdateOutputOk)

    private enum DiscriminantKey: String, CodingKey {
        case discriminant = "ok"
    }

    init(from decoder: any Decoder) throws {
        let tag = try decoder.container(keyedBy: DiscriminantKey.self)
        let discriminant = try tag.decode(Bool.self, forKey: .discriminant)
        switch discriminant {
        case false:
            self = .notOk(try CompetitionsLeaderboardOutputNotOk(from: decoder))
        case true:
            self = .ok(try CompetitionsUpdateOutputOk(from: decoder))
        }
    }

    func encode(to encoder: any Encoder) throws {
        switch self {
        case .notOk(let v): try v.encode(to: encoder)
        case .ok(let v): try v.encode(to: encoder)
        }
    }
}

struct CompetitionsTransitionInput: Codable, Sendable, Equatable {
    var id: String
    var to: CompetitionDetailLifecycle

    enum CodingKeys: String, CodingKey {
        case id = "id"
        case to = "to"
    }

    init(id: String, to: CompetitionDetailLifecycle) {
        self.id = id
        self.to = to
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try c.decode(String.self, forKey: .id)
        self.to = try c.decode(CompetitionDetailLifecycle.self, forKey: .to)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encode(to, forKey: .to)
    }
}

struct CompetitionsCreateRoundInput: Codable, Sendable, Equatable {
    var id: String
    var courseId: String
    var playedAt: String
    var roundType: RoundRoundType?
    var venueType: RoundVenueType?

    enum CodingKeys: String, CodingKey {
        case id = "id"
        case courseId = "courseId"
        case playedAt = "playedAt"
        case roundType = "roundType"
        case venueType = "venueType"
    }

    init(id: String, courseId: String, playedAt: String, roundType: RoundRoundType? = nil, venueType: RoundVenueType? = nil) {
        self.id = id
        self.courseId = courseId
        self.playedAt = playedAt
        self.roundType = roundType
        self.venueType = venueType
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try c.decode(String.self, forKey: .id)
        self.courseId = try c.decode(String.self, forKey: .courseId)
        self.playedAt = try c.decode(String.self, forKey: .playedAt)
        self.roundType = try c.decodeIfPresent(RoundRoundType.self, forKey: .roundType)
        self.venueType = try c.decodeIfPresent(RoundVenueType.self, forKey: .venueType)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encode(courseId, forKey: .courseId)
        try c.encode(playedAt, forKey: .playedAt)
        try c.encodeIfPresent(roundType, forKey: .roundType)
        try c.encodeIfPresent(venueType, forKey: .venueType)
    }
}

struct CompetitionsCreateRoundOutputOkDraftRoutePlayingGroupsItem: Codable, Sendable, Equatable {
    var id: String?
    var startTime: String
    var startPlayHoleDefId: String?
    var startOrdinal: Double?
    var capacity: Double
    var hittingBay: String?
    var producerDefIds: [String]

    enum CodingKeys: String, CodingKey {
        case id = "id"
        case startTime = "startTime"
        case startPlayHoleDefId = "startPlayHoleDefId"
        case startOrdinal = "startOrdinal"
        case capacity = "capacity"
        case hittingBay = "hittingBay"
        case producerDefIds = "producerDefIds"
    }

    init(id: String? = nil, startTime: String, startPlayHoleDefId: String? = nil, startOrdinal: Double? = nil, capacity: Double, hittingBay: String? = nil, producerDefIds: [String]) {
        self.id = id
        self.startTime = startTime
        self.startPlayHoleDefId = startPlayHoleDefId
        self.startOrdinal = startOrdinal
        self.capacity = capacity
        self.hittingBay = hittingBay
        self.producerDefIds = producerDefIds
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try c.decodeIfPresent(String.self, forKey: .id)
        self.startTime = try c.decode(String.self, forKey: .startTime)
        self.startPlayHoleDefId = try c.decodeIfPresent(String.self, forKey: .startPlayHoleDefId)
        self.startOrdinal = try c.decodeIfPresent(Double.self, forKey: .startOrdinal)
        self.capacity = try c.decode(Double.self, forKey: .capacity)
        self.hittingBay = try c.decodeIfPresent(String.self, forKey: .hittingBay)
        self.producerDefIds = try c.decode([String].self, forKey: .producerDefIds)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encodeIfPresent(id, forKey: .id)
        try c.encode(startTime, forKey: .startTime)
        try c.encodeIfPresent(startPlayHoleDefId, forKey: .startPlayHoleDefId)
        try c.encodeIfPresent(startOrdinal, forKey: .startOrdinal)
        try c.encode(capacity, forKey: .capacity)
        try c.encodeIfPresent(hittingBay, forKey: .hittingBay)
        try c.encode(producerDefIds, forKey: .producerDefIds)
    }
}

struct CompetitionsCreateRoundOutputOkDraftRoute: Codable, Sendable, Equatable {
    var templateId: String?
    var playHoles: [CourseRouteTemplateRoutePlayHolesItem]?
    var routeSi: CourseRouteTemplateRouteRouteSi?
    var routeHandicapPolicy: CourseRouteTemplateRouteRouteHandicapPolicy?
    var routeSections: [CourseRouteTemplateRouteRouteSectionsItem]?
    var playingGroups: [CompetitionsCreateRoundOutputOkDraftRoutePlayingGroupsItem]?

    enum CodingKeys: String, CodingKey {
        case templateId = "templateId"
        case playHoles = "playHoles"
        case routeSi = "routeSi"
        case routeHandicapPolicy = "routeHandicapPolicy"
        case routeSections = "routeSections"
        case playingGroups = "playingGroups"
    }

    init(templateId: String? = nil, playHoles: [CourseRouteTemplateRoutePlayHolesItem]? = nil, routeSi: CourseRouteTemplateRouteRouteSi? = nil, routeHandicapPolicy: CourseRouteTemplateRouteRouteHandicapPolicy? = nil, routeSections: [CourseRouteTemplateRouteRouteSectionsItem]? = nil, playingGroups: [CompetitionsCreateRoundOutputOkDraftRoutePlayingGroupsItem]? = nil) {
        self.templateId = templateId
        self.playHoles = playHoles
        self.routeSi = routeSi
        self.routeHandicapPolicy = routeHandicapPolicy
        self.routeSections = routeSections
        self.playingGroups = playingGroups
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.templateId = try c.decodeIfPresent(String.self, forKey: .templateId)
        self.playHoles = try c.decodeIfPresent([CourseRouteTemplateRoutePlayHolesItem].self, forKey: .playHoles)
        self.routeSi = try c.decodeIfPresent(CourseRouteTemplateRouteRouteSi.self, forKey: .routeSi)
        self.routeHandicapPolicy = try c.decodeIfPresent(CourseRouteTemplateRouteRouteHandicapPolicy.self, forKey: .routeHandicapPolicy)
        self.routeSections = try c.decodeIfPresent([CourseRouteTemplateRouteRouteSectionsItem].self, forKey: .routeSections)
        self.playingGroups = try c.decodeIfPresent([CompetitionsCreateRoundOutputOkDraftRoutePlayingGroupsItem].self, forKey: .playingGroups)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encodeIfPresent(templateId, forKey: .templateId)
        try c.encodeIfPresent(playHoles, forKey: .playHoles)
        try c.encodeIfPresent(routeSi, forKey: .routeSi)
        try c.encodeIfPresent(routeHandicapPolicy, forKey: .routeHandicapPolicy)
        try c.encodeIfPresent(routeSections, forKey: .routeSections)
        try c.encodeIfPresent(playingGroups, forKey: .playingGroups)
    }
}

struct CompetitionsCreateRoundOutputOkDraftProducersItemPlayerRefPlayerRef: Codable, Sendable, Equatable {
    var kind: IdentityRefKind
    var id: String

    enum CodingKeys: String, CodingKey {
        case kind = "kind"
        case id = "id"
    }

    init(kind: IdentityRefKind, id: String) {
        self.kind = kind
        self.id = id
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.kind = try c.decode(IdentityRefKind.self, forKey: .kind)
        self.id = try c.decode(String.self, forKey: .id)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(kind, forKey: .kind)
        try c.encode(id, forKey: .id)
    }
}

struct CompetitionsCreateRoundOutputOkDraftProducersItemPlayerRefSeat: Codable, Sendable, Equatable {
    var label: String
    var teamRef: String?

    enum CodingKeys: String, CodingKey {
        case label = "label"
        case teamRef = "teamRef"
    }

    init(label: String, teamRef: String? = nil) {
        self.label = label
        self.teamRef = teamRef
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.label = try c.decode(String.self, forKey: .label)
        self.teamRef = try c.decodeIfPresent(String.self, forKey: .teamRef)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(label, forKey: .label)
        try c.encodeIfPresent(teamRef, forKey: .teamRef)
    }
}

struct CompetitionsCreateRoundOutputOkDraftProducersItemPlayerRef: Codable, Sendable, Equatable {
    var producerDefId: String
    var playerRef: CompetitionsCreateRoundOutputOkDraftProducersItemPlayerRefPlayerRef
    var handicapIndex: Double
    var gender: PlayerGender?
    var teeId: String
    var category: String?
    var seat: CompetitionsCreateRoundOutputOkDraftProducersItemPlayerRefSeat?

    enum CodingKeys: String, CodingKey {
        case producerDefId = "producerDefId"
        case playerRef = "playerRef"
        case handicapIndex = "handicapIndex"
        case gender = "gender"
        case teeId = "teeId"
        case category = "category"
        case seat = "seat"
    }

    init(producerDefId: String, playerRef: CompetitionsCreateRoundOutputOkDraftProducersItemPlayerRefPlayerRef, handicapIndex: Double, gender: PlayerGender? = nil, teeId: String, category: String? = nil, seat: CompetitionsCreateRoundOutputOkDraftProducersItemPlayerRefSeat? = nil) {
        self.producerDefId = producerDefId
        self.playerRef = playerRef
        self.handicapIndex = handicapIndex
        self.gender = gender
        self.teeId = teeId
        self.category = category
        self.seat = seat
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.producerDefId = try c.decode(String.self, forKey: .producerDefId)
        self.playerRef = try c.decode(CompetitionsCreateRoundOutputOkDraftProducersItemPlayerRefPlayerRef.self, forKey: .playerRef)
        self.handicapIndex = try c.decode(Double.self, forKey: .handicapIndex)
        self.gender = try c.decodeIfPresent(PlayerGender.self, forKey: .gender)
        self.teeId = try c.decode(String.self, forKey: .teeId)
        self.category = try c.decodeIfPresent(String.self, forKey: .category)
        self.seat = try c.decodeIfPresent(CompetitionsCreateRoundOutputOkDraftProducersItemPlayerRefSeat.self, forKey: .seat)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(producerDefId, forKey: .producerDefId)
        try c.encode(playerRef, forKey: .playerRef)
        try c.encode(handicapIndex, forKey: .handicapIndex)
        try c.encodeIfPresent(gender, forKey: .gender)
        try c.encode(teeId, forKey: .teeId)
        try c.encodeIfPresent(category, forKey: .category)
        try c.encodeIfPresent(seat, forKey: .seat)
    }
}

struct CompetitionsCreateRoundOutputOkDraftProducersItemPlaceholder: Codable, Sendable, Equatable {
    var producerDefId: String
    var placeholder: CompetitionsCreateRoundOutputOkDraftProducersItemPlayerRefSeat
    var category: String?

    enum CodingKeys: String, CodingKey {
        case producerDefId = "producerDefId"
        case placeholder = "placeholder"
        case category = "category"
    }

    init(producerDefId: String, placeholder: CompetitionsCreateRoundOutputOkDraftProducersItemPlayerRefSeat, category: String? = nil) {
        self.producerDefId = producerDefId
        self.placeholder = placeholder
        self.category = category
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.producerDefId = try c.decode(String.self, forKey: .producerDefId)
        self.placeholder = try c.decode(CompetitionsCreateRoundOutputOkDraftProducersItemPlayerRefSeat.self, forKey: .placeholder)
        self.category = try c.decodeIfPresent(String.self, forKey: .category)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(producerDefId, forKey: .producerDefId)
        try c.encode(placeholder, forKey: .placeholder)
        try c.encodeIfPresent(category, forKey: .category)
    }
}

enum CompetitionsCreateRoundOutputOkDraftProducersItem: Codable, Sendable, Equatable {
    case playerRef(CompetitionsCreateRoundOutputOkDraftProducersItemPlayerRef)
    case placeholder(CompetitionsCreateRoundOutputOkDraftProducersItemPlaceholder)

    init(from decoder: any Decoder) throws {
        let probe = try decoder.container(keyedBy: AnyCodingKey.self)
        if probe.contains(AnyCodingKey("playerRef")) {
            self = .playerRef(try CompetitionsCreateRoundOutputOkDraftProducersItemPlayerRef(from: decoder))
        } else {
            self = .placeholder(try CompetitionsCreateRoundOutputOkDraftProducersItemPlaceholder(from: decoder))
        }
    }

    func encode(to encoder: any Encoder) throws {
        switch self {
        case .playerRef(let v): try v.encode(to: encoder)
        case .placeholder(let v): try v.encode(to: encoder)
        }
    }
}

enum CompetitionsCreateRoundOutputOkDraftTeamsItemKind: String, Codable, Sendable, Equatable {
    case singleBall = "single_ball"
    case multiBall = "multi_ball"
}

struct CompetitionsCreateRoundOutputOkDraftTeamsItemMembersItemProducerDefId: Codable, Sendable, Equatable {
    var producerDefId: String
    var allowancePct: Double

    enum CodingKeys: String, CodingKey {
        case producerDefId = "producerDefId"
        case allowancePct = "allowancePct"
    }

    init(producerDefId: String, allowancePct: Double) {
        self.producerDefId = producerDefId
        self.allowancePct = allowancePct
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.producerDefId = try c.decode(String.self, forKey: .producerDefId)
        self.allowancePct = try c.decode(Double.self, forKey: .allowancePct)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(producerDefId, forKey: .producerDefId)
        try c.encode(allowancePct, forKey: .allowancePct)
    }
}

struct CompetitionsCreateRoundOutputOkDraftTeamsItemMembersItemTeamId: Codable, Sendable, Equatable {
    var teamId: String

    enum CodingKeys: String, CodingKey {
        case teamId = "teamId"
    }

    init(teamId: String) {
        self.teamId = teamId
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.teamId = try c.decode(String.self, forKey: .teamId)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(teamId, forKey: .teamId)
    }
}

enum CompetitionsCreateRoundOutputOkDraftTeamsItemMembersItem: Codable, Sendable, Equatable {
    case producerDefId(CompetitionsCreateRoundOutputOkDraftTeamsItemMembersItemProducerDefId)
    case teamId(CompetitionsCreateRoundOutputOkDraftTeamsItemMembersItemTeamId)

    init(from decoder: any Decoder) throws {
        let probe = try decoder.container(keyedBy: AnyCodingKey.self)
        if probe.contains(AnyCodingKey("producerDefId")) {
            self = .producerDefId(try CompetitionsCreateRoundOutputOkDraftTeamsItemMembersItemProducerDefId(from: decoder))
        } else {
            self = .teamId(try CompetitionsCreateRoundOutputOkDraftTeamsItemMembersItemTeamId(from: decoder))
        }
    }

    func encode(to encoder: any Encoder) throws {
        switch self {
        case .producerDefId(let v): try v.encode(to: encoder)
        case .teamId(let v): try v.encode(to: encoder)
        }
    }
}

struct CompetitionsCreateRoundOutputOkDraftTeamsItem: Codable, Sendable, Equatable {
    var id: String
    var label: String?
    var formation: String?
    var kind: CompetitionsCreateRoundOutputOkDraftTeamsItemKind?
    var members: [CompetitionsCreateRoundOutputOkDraftTeamsItemMembersItem]

    enum CodingKeys: String, CodingKey {
        case id = "id"
        case label = "label"
        case formation = "formation"
        case kind = "kind"
        case members = "members"
    }

    init(id: String, label: String? = nil, formation: String? = nil, kind: CompetitionsCreateRoundOutputOkDraftTeamsItemKind? = nil, members: [CompetitionsCreateRoundOutputOkDraftTeamsItemMembersItem]) {
        self.id = id
        self.label = label
        self.formation = formation
        self.kind = kind
        self.members = members
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try c.decode(String.self, forKey: .id)
        self.label = try c.decodeIfPresent(String.self, forKey: .label)
        self.formation = try c.decodeIfPresent(String.self, forKey: .formation)
        self.kind = try c.decodeIfPresent(CompetitionsCreateRoundOutputOkDraftTeamsItemKind.self, forKey: .kind)
        self.members = try c.decode([CompetitionsCreateRoundOutputOkDraftTeamsItemMembersItem].self, forKey: .members)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encodeIfPresent(label, forKey: .label)
        try c.encodeIfPresent(formation, forKey: .formation)
        try c.encodeIfPresent(kind, forKey: .kind)
        try c.encode(members, forKey: .members)
    }
}

struct CompetitionsCreateRoundOutputOkDraftPlayingGroupsItem: Codable, Sendable, Equatable {
    var members: [String]
    var startTime: String?
    var startHole: Double?

    enum CodingKeys: String, CodingKey {
        case members = "members"
        case startTime = "startTime"
        case startHole = "startHole"
    }

    init(members: [String], startTime: String? = nil, startHole: Double? = nil) {
        self.members = members
        self.startTime = startTime
        self.startHole = startHole
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.members = try c.decode([String].self, forKey: .members)
        self.startTime = try c.decodeIfPresent(String.self, forKey: .startTime)
        self.startHole = try c.decodeIfPresent(Double.self, forKey: .startHole)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(members, forKey: .members)
        try c.encodeIfPresent(startTime, forKey: .startTime)
        try c.encodeIfPresent(startHole, forKey: .startHole)
    }
}

struct CompetitionsCreateRoundOutputOkDraft: Codable, Sendable, Equatable {
    var courseId: String
    var playedAt: String
    var name: String?
    var roundType: RoundRoundType?
    var venueType: RoundVenueType?
    var route: CompetitionsCreateRoundOutputOkDraftRoute?
    var producers: [CompetitionsCreateRoundOutputOkDraftProducersItem]
    var teams: [CompetitionsCreateRoundOutputOkDraftTeamsItem]?
    var formats: [CompetitionDetailDefaultConfigSlotsItem]
    var playingGroups: [CompetitionsCreateRoundOutputOkDraftPlayingGroupsItem]?
    var startList: CompetitionDetailDefaultConfigStartListPolicy?

    enum CodingKeys: String, CodingKey {
        case courseId = "courseId"
        case playedAt = "playedAt"
        case name = "name"
        case roundType = "roundType"
        case venueType = "venueType"
        case route = "route"
        case producers = "producers"
        case teams = "teams"
        case formats = "formats"
        case playingGroups = "playingGroups"
        case startList = "startList"
    }

    init(courseId: String, playedAt: String, name: String? = nil, roundType: RoundRoundType? = nil, venueType: RoundVenueType? = nil, route: CompetitionsCreateRoundOutputOkDraftRoute? = nil, producers: [CompetitionsCreateRoundOutputOkDraftProducersItem], teams: [CompetitionsCreateRoundOutputOkDraftTeamsItem]? = nil, formats: [CompetitionDetailDefaultConfigSlotsItem], playingGroups: [CompetitionsCreateRoundOutputOkDraftPlayingGroupsItem]? = nil, startList: CompetitionDetailDefaultConfigStartListPolicy? = nil) {
        self.courseId = courseId
        self.playedAt = playedAt
        self.name = name
        self.roundType = roundType
        self.venueType = venueType
        self.route = route
        self.producers = producers
        self.teams = teams
        self.formats = formats
        self.playingGroups = playingGroups
        self.startList = startList
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.courseId = try c.decode(String.self, forKey: .courseId)
        self.playedAt = try c.decode(String.self, forKey: .playedAt)
        self.name = try c.decodeIfPresent(String.self, forKey: .name)
        self.roundType = try c.decodeIfPresent(RoundRoundType.self, forKey: .roundType)
        self.venueType = try c.decodeIfPresent(RoundVenueType.self, forKey: .venueType)
        self.route = try c.decodeIfPresent(CompetitionsCreateRoundOutputOkDraftRoute.self, forKey: .route)
        self.producers = try c.decode([CompetitionsCreateRoundOutputOkDraftProducersItem].self, forKey: .producers)
        self.teams = try c.decodeIfPresent([CompetitionsCreateRoundOutputOkDraftTeamsItem].self, forKey: .teams)
        self.formats = try c.decode([CompetitionDetailDefaultConfigSlotsItem].self, forKey: .formats)
        self.playingGroups = try c.decodeIfPresent([CompetitionsCreateRoundOutputOkDraftPlayingGroupsItem].self, forKey: .playingGroups)
        self.startList = try c.decodeIfPresent(CompetitionDetailDefaultConfigStartListPolicy.self, forKey: .startList)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(courseId, forKey: .courseId)
        try c.encode(playedAt, forKey: .playedAt)
        try c.encodeIfPresent(name, forKey: .name)
        try c.encodeIfPresent(roundType, forKey: .roundType)
        try c.encodeIfPresent(venueType, forKey: .venueType)
        try c.encodeIfPresent(route, forKey: .route)
        try c.encode(producers, forKey: .producers)
        try c.encodeIfPresent(teams, forKey: .teams)
        try c.encode(formats, forKey: .formats)
        try c.encodeIfPresent(playingGroups, forKey: .playingGroups)
        try c.encodeIfPresent(startList, forKey: .startList)
    }
}

struct CompetitionsCreateRoundOutputOk: Codable, Sendable, Equatable {
    let ok: Bool = true
    var competitionRound: CompetitionRound
    var round: Round
    var shareToken: String
    var draft: CompetitionsCreateRoundOutputOkDraft

    enum CodingKeys: String, CodingKey {
        case ok = "ok"
        case competitionRound = "competitionRound"
        case round = "round"
        case shareToken = "shareToken"
        case draft = "draft"
    }

    init(competitionRound: CompetitionRound, round: Round, shareToken: String, draft: CompetitionsCreateRoundOutputOkDraft) {
        self.competitionRound = competitionRound
        self.round = round
        self.shareToken = shareToken
        self.draft = draft
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        _ = try c.decode(Bool.self, forKey: .ok)
        self.competitionRound = try c.decode(CompetitionRound.self, forKey: .competitionRound)
        self.round = try c.decode(Round.self, forKey: .round)
        self.shareToken = try c.decode(String.self, forKey: .shareToken)
        self.draft = try c.decode(CompetitionsCreateRoundOutputOkDraft.self, forKey: .draft)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(ok, forKey: .ok)
        try c.encode(competitionRound, forKey: .competitionRound)
        try c.encode(round, forKey: .round)
        try c.encode(shareToken, forKey: .shareToken)
        try c.encode(draft, forKey: .draft)
    }
}

struct CompetitionsCreateRoundOutputNotOkDiagnostics: Codable, Sendable, Equatable {
    let ok: Bool = false
    var diagnostics: [CompilerDiagnostic]

    enum CodingKeys: String, CodingKey {
        case ok = "ok"
        case diagnostics = "diagnostics"
    }

    init(diagnostics: [CompilerDiagnostic]) {
        self.diagnostics = diagnostics
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        _ = try c.decode(Bool.self, forKey: .ok)
        self.diagnostics = try c.decode([CompilerDiagnostic].self, forKey: .diagnostics)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(ok, forKey: .ok)
        try c.encode(diagnostics, forKey: .diagnostics)
    }
}

enum CompetitionsCreateRoundOutput: Codable, Sendable, Equatable {
    case ok(CompetitionsCreateRoundOutputOk)
    case notOkRefusal(CompetitionsLeaderboardOutputNotOk)
    case notOkDiagnostics(CompetitionsCreateRoundOutputNotOkDiagnostics)

    private enum DiscriminantKey: String, CodingKey {
        case discriminant = "ok"
    }

    init(from decoder: any Decoder) throws {
        let tag = try decoder.container(keyedBy: DiscriminantKey.self)
        let discriminant = try tag.decode(Bool.self, forKey: .discriminant)
        switch discriminant {
        case true:
            self = .ok(try CompetitionsCreateRoundOutputOk(from: decoder))
        case false:
            let probe = try decoder.container(keyedBy: AnyCodingKey.self)
            if probe.contains(AnyCodingKey("refusal")) {
                self = .notOkRefusal(try CompetitionsLeaderboardOutputNotOk(from: decoder))
            } else {
                self = .notOkDiagnostics(try CompetitionsCreateRoundOutputNotOkDiagnostics(from: decoder))
            }
        }
    }

    func encode(to encoder: any Encoder) throws {
        switch self {
        case .ok(let v): try v.encode(to: encoder)
        case .notOkRefusal(let v): try v.encode(to: encoder)
        case .notOkDiagnostics(let v): try v.encode(to: encoder)
        }
    }
}

struct CompetitionsApplyCutOutputOk: Codable, Sendable, Equatable {
    let ok: Bool = true
    var value: CutOutcome

    enum CodingKeys: String, CodingKey {
        case ok = "ok"
        case value = "value"
    }

    init(value: CutOutcome) {
        self.value = value
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        _ = try c.decode(Bool.self, forKey: .ok)
        self.value = try c.decode(CutOutcome.self, forKey: .value)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(ok, forKey: .ok)
        try c.encode(value, forKey: .value)
    }
}

enum CompetitionsApplyCutOutput: Codable, Sendable, Equatable {
    case notOk(CompetitionsLeaderboardOutputNotOk)
    case ok(CompetitionsApplyCutOutputOk)

    private enum DiscriminantKey: String, CodingKey {
        case discriminant = "ok"
    }

    init(from decoder: any Decoder) throws {
        let tag = try decoder.container(keyedBy: DiscriminantKey.self)
        let discriminant = try tag.decode(Bool.self, forKey: .discriminant)
        switch discriminant {
        case false:
            self = .notOk(try CompetitionsLeaderboardOutputNotOk(from: decoder))
        case true:
            self = .ok(try CompetitionsApplyCutOutputOk(from: decoder))
        }
    }

    func encode(to encoder: any Encoder) throws {
        switch self {
        case .notOk(let v): try v.encode(to: encoder)
        case .ok(let v): try v.encode(to: encoder)
        }
    }
}

struct CompetitionsFinalizeOutputOk: Codable, Sendable, Equatable {
    let ok: Bool = true
    var value: FinalizeOutcome

    enum CodingKeys: String, CodingKey {
        case ok = "ok"
        case value = "value"
    }

    init(value: FinalizeOutcome) {
        self.value = value
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        _ = try c.decode(Bool.self, forKey: .ok)
        self.value = try c.decode(FinalizeOutcome.self, forKey: .value)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(ok, forKey: .ok)
        try c.encode(value, forKey: .value)
    }
}

enum CompetitionsFinalizeOutput: Codable, Sendable, Equatable {
    case notOk(CompetitionsLeaderboardOutputNotOk)
    case ok(CompetitionsFinalizeOutputOk)

    private enum DiscriminantKey: String, CodingKey {
        case discriminant = "ok"
    }

    init(from decoder: any Decoder) throws {
        let tag = try decoder.container(keyedBy: DiscriminantKey.self)
        let discriminant = try tag.decode(Bool.self, forKey: .discriminant)
        switch discriminant {
        case false:
            self = .notOk(try CompetitionsLeaderboardOutputNotOk(from: decoder))
        case true:
            self = .ok(try CompetitionsFinalizeOutputOk(from: decoder))
        }
    }

    func encode(to encoder: any Encoder) throws {
        switch self {
        case .notOk(let v): try v.encode(to: encoder)
        case .ok(let v): try v.encode(to: encoder)
        }
    }
}

struct CompetitionsAddParticipantInput: Codable, Sendable, Equatable {
    var competitionId: String
    var playerId: String?
    var guestPlayerId: String?
    var category: TriState<String>

    enum CodingKeys: String, CodingKey {
        case competitionId = "competitionId"
        case playerId = "playerId"
        case guestPlayerId = "guestPlayerId"
        case category = "category"
    }

    init(competitionId: String, playerId: String? = nil, guestPlayerId: String? = nil, category: TriState<String> = .absent) {
        self.competitionId = competitionId
        self.playerId = playerId
        self.guestPlayerId = guestPlayerId
        self.category = category
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.competitionId = try c.decode(String.self, forKey: .competitionId)
        self.playerId = try c.decodeIfPresent(String.self, forKey: .playerId)
        self.guestPlayerId = try c.decodeIfPresent(String.self, forKey: .guestPlayerId)
        if c.contains(.category) {
            self.category = try c.decodeNil(forKey: .category)
                ? .null
                : .value(try c.decode(String.self, forKey: .category))
        } else {
            self.category = .absent
        }
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(competitionId, forKey: .competitionId)
        try c.encodeIfPresent(playerId, forKey: .playerId)
        try c.encodeIfPresent(guestPlayerId, forKey: .guestPlayerId)
        switch category {
        case .absent: break
        case .null: try c.encodeNil(forKey: .category)
        case .value(let v): try c.encode(v, forKey: .category)
        }
    }
}

struct CompetitionsAddParticipantOutputOk: Codable, Sendable, Equatable {
    let ok: Bool = true
    var value: CompetitionParticipant

    enum CodingKeys: String, CodingKey {
        case ok = "ok"
        case value = "value"
    }

    init(value: CompetitionParticipant) {
        self.value = value
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        _ = try c.decode(Bool.self, forKey: .ok)
        self.value = try c.decode(CompetitionParticipant.self, forKey: .value)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(ok, forKey: .ok)
        try c.encode(value, forKey: .value)
    }
}

struct CompetitionsAddParticipantOutputNotOkRefusal: Codable, Sendable, Equatable {
    var code: String
    var message: String

    enum CodingKeys: String, CodingKey {
        case code = "code"
        case message = "message"
    }

    init(code: String, message: String) {
        self.code = code
        self.message = message
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.code = try c.decode(String.self, forKey: .code)
        self.message = try c.decode(String.self, forKey: .message)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(code, forKey: .code)
        try c.encode(message, forKey: .message)
    }
}

struct CompetitionsAddParticipantOutputNotOk: Codable, Sendable, Equatable {
    let ok: Bool = false
    var refusal: CompetitionsAddParticipantOutputNotOkRefusal

    enum CodingKeys: String, CodingKey {
        case ok = "ok"
        case refusal = "refusal"
    }

    init(refusal: CompetitionsAddParticipantOutputNotOkRefusal) {
        self.refusal = refusal
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        _ = try c.decode(Bool.self, forKey: .ok)
        self.refusal = try c.decode(CompetitionsAddParticipantOutputNotOkRefusal.self, forKey: .refusal)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(ok, forKey: .ok)
        try c.encode(refusal, forKey: .refusal)
    }
}

enum CompetitionsAddParticipantOutput: Codable, Sendable, Equatable {
    case ok(CompetitionsAddParticipantOutputOk)
    case notOk(CompetitionsAddParticipantOutputNotOk)

    private enum DiscriminantKey: String, CodingKey {
        case discriminant = "ok"
    }

    init(from decoder: any Decoder) throws {
        let tag = try decoder.container(keyedBy: DiscriminantKey.self)
        let discriminant = try tag.decode(Bool.self, forKey: .discriminant)
        switch discriminant {
        case true:
            self = .ok(try CompetitionsAddParticipantOutputOk(from: decoder))
        case false:
            self = .notOk(try CompetitionsAddParticipantOutputNotOk(from: decoder))
        }
    }

    func encode(to encoder: any Encoder) throws {
        switch self {
        case .ok(let v): try v.encode(to: encoder)
        case .notOk(let v): try v.encode(to: encoder)
        }
    }
}

struct CompetitionsRemoveParticipantInput: Codable, Sendable, Equatable {
    var participantId: String

    enum CodingKeys: String, CodingKey {
        case participantId = "participantId"
    }

    init(participantId: String) {
        self.participantId = participantId
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.participantId = try c.decode(String.self, forKey: .participantId)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(participantId, forKey: .participantId)
    }
}

struct CompetitionsRemoveParticipantOutputOkValue: Codable, Sendable, Equatable {
    let removed: Bool = true

    enum CodingKeys: String, CodingKey {
        case removed = "removed"
    }

    init() {
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        _ = try c.decode(Bool.self, forKey: .removed)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(removed, forKey: .removed)
    }
}

struct CompetitionsRemoveParticipantOutputOk: Codable, Sendable, Equatable {
    let ok: Bool = true
    var value: CompetitionsRemoveParticipantOutputOkValue

    enum CodingKeys: String, CodingKey {
        case ok = "ok"
        case value = "value"
    }

    init(value: CompetitionsRemoveParticipantOutputOkValue) {
        self.value = value
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        _ = try c.decode(Bool.self, forKey: .ok)
        self.value = try c.decode(CompetitionsRemoveParticipantOutputOkValue.self, forKey: .value)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(ok, forKey: .ok)
        try c.encode(value, forKey: .value)
    }
}

enum CompetitionsRemoveParticipantOutput: Codable, Sendable, Equatable {
    case notOk(CompetitionsLeaderboardOutputNotOk)
    case ok(CompetitionsRemoveParticipantOutputOk)

    private enum DiscriminantKey: String, CodingKey {
        case discriminant = "ok"
    }

    init(from decoder: any Decoder) throws {
        let tag = try decoder.container(keyedBy: DiscriminantKey.self)
        let discriminant = try tag.decode(Bool.self, forKey: .discriminant)
        switch discriminant {
        case false:
            self = .notOk(try CompetitionsLeaderboardOutputNotOk(from: decoder))
        case true:
            self = .ok(try CompetitionsRemoveParticipantOutputOk(from: decoder))
        }
    }

    func encode(to encoder: any Encoder) throws {
        switch self {
        case .notOk(let v): try v.encode(to: encoder)
        case .ok(let v): try v.encode(to: encoder)
        }
    }
}

enum CompetitionsWithdrawParticipantOutput: Codable, Sendable, Equatable {
    case notOk(CompetitionsLeaderboardOutputNotOk)
    case ok(CompetitionsAddParticipantOutputOk)

    private enum DiscriminantKey: String, CodingKey {
        case discriminant = "ok"
    }

    init(from decoder: any Decoder) throws {
        let tag = try decoder.container(keyedBy: DiscriminantKey.self)
        let discriminant = try tag.decode(Bool.self, forKey: .discriminant)
        switch discriminant {
        case false:
            self = .notOk(try CompetitionsLeaderboardOutputNotOk(from: decoder))
        case true:
            self = .ok(try CompetitionsAddParticipantOutputOk(from: decoder))
        }
    }

    func encode(to encoder: any Encoder) throws {
        switch self {
        case .notOk(let v): try v.encode(to: encoder)
        case .ok(let v): try v.encode(to: encoder)
        }
    }
}
