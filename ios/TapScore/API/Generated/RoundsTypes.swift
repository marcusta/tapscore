// GENERATED — DO NOT EDIT. bun run generate:swift

import Foundation

struct RoundsCreateInputDefinitionProducersItemTeeId: Codable, Sendable, Equatable {
    var gender: PlayerGender?
    var category: String?
    var id: String
    var teeId: String
    var handicapIndex: Double
    var playerRef: CompetitionsCreateRoundOutputOkDraftProducersItemTeeIdPlayerRef

    enum CodingKeys: String, CodingKey {
        case gender = "gender"
        case category = "category"
        case id = "id"
        case teeId = "teeId"
        case handicapIndex = "handicapIndex"
        case playerRef = "playerRef"
    }

    init(gender: PlayerGender? = nil, category: String? = nil, id: String, teeId: String, handicapIndex: Double, playerRef: CompetitionsCreateRoundOutputOkDraftProducersItemTeeIdPlayerRef) {
        self.gender = gender
        self.category = category
        self.id = id
        self.teeId = teeId
        self.handicapIndex = handicapIndex
        self.playerRef = playerRef
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.gender = try c.decodeIfPresent(PlayerGender.self, forKey: .gender)
        self.category = try c.decodeIfPresent(String.self, forKey: .category)
        self.id = try c.decode(String.self, forKey: .id)
        self.teeId = try c.decode(String.self, forKey: .teeId)
        self.handicapIndex = try c.decode(Double.self, forKey: .handicapIndex)
        self.playerRef = try c.decode(CompetitionsCreateRoundOutputOkDraftProducersItemTeeIdPlayerRef.self, forKey: .playerRef)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encodeIfPresent(gender, forKey: .gender)
        try c.encodeIfPresent(category, forKey: .category)
        try c.encode(id, forKey: .id)
        try c.encode(teeId, forKey: .teeId)
        try c.encode(handicapIndex, forKey: .handicapIndex)
        try c.encode(playerRef, forKey: .playerRef)
    }
}

struct RoundsCreateInputDefinitionProducersItemPlaceholder: Codable, Sendable, Equatable {
    var category: String?
    var id: String
    var placeholder: CompetitionsCreateRoundOutputOkDraftProducersItemTeeIdSeat

    enum CodingKeys: String, CodingKey {
        case category = "category"
        case id = "id"
        case placeholder = "placeholder"
    }

    init(category: String? = nil, id: String, placeholder: CompetitionsCreateRoundOutputOkDraftProducersItemTeeIdSeat) {
        self.category = category
        self.id = id
        self.placeholder = placeholder
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.category = try c.decodeIfPresent(String.self, forKey: .category)
        self.id = try c.decode(String.self, forKey: .id)
        self.placeholder = try c.decode(CompetitionsCreateRoundOutputOkDraftProducersItemTeeIdSeat.self, forKey: .placeholder)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encodeIfPresent(category, forKey: .category)
        try c.encode(id, forKey: .id)
        try c.encode(placeholder, forKey: .placeholder)
    }
}

enum RoundsCreateInputDefinitionProducersItem: Codable, Sendable, Equatable {
    case teeId(RoundsCreateInputDefinitionProducersItemTeeId)
    case placeholder(RoundsCreateInputDefinitionProducersItemPlaceholder)

    init(from decoder: any Decoder) throws {
        let probe = try decoder.container(keyedBy: AnyCodingKey.self)
        if probe.contains(AnyCodingKey("teeId")) {
            self = .teeId(try RoundsCreateInputDefinitionProducersItemTeeId(from: decoder))
        } else {
            self = .placeholder(try RoundsCreateInputDefinitionProducersItemPlaceholder(from: decoder))
        }
    }

    func encode(to encoder: any Encoder) throws {
        switch self {
        case .teeId(let v): try v.encode(to: encoder)
        case .placeholder(let v): try v.encode(to: encoder)
        }
    }
}

struct RoundsCreateInputDefinitionSlotsItemBallSelector: Codable, Sendable, Equatable {
    var producerDefIds: [String]?
    var strategyDefIds: [String]?

    enum CodingKeys: String, CodingKey {
        case producerDefIds = "producerDefIds"
        case strategyDefIds = "strategyDefIds"
    }

    init(producerDefIds: [String]? = nil, strategyDefIds: [String]? = nil) {
        self.producerDefIds = producerDefIds
        self.strategyDefIds = strategyDefIds
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.producerDefIds = try c.decodeIfPresent([String].self, forKey: .producerDefIds)
        self.strategyDefIds = try c.decodeIfPresent([String].self, forKey: .strategyDefIds)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encodeIfPresent(producerDefIds, forKey: .producerDefIds)
        try c.encodeIfPresent(strategyDefIds, forKey: .strategyDefIds)
    }
}

struct RoundsCreateInputDefinitionSlotsItemTeamGrouping: Codable, Sendable, Equatable {
    var teams: [CompetitionDetailDefaultConfigSlotsItemTeamsItem]

    enum CodingKeys: String, CodingKey {
        case teams = "teams"
    }

    init(teams: [CompetitionDetailDefaultConfigSlotsItemTeamsItem]) {
        self.teams = teams
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.teams = try c.decode([CompetitionDetailDefaultConfigSlotsItemTeamsItem].self, forKey: .teams)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(teams, forKey: .teams)
    }
}

struct RoundsCreateInputDefinitionSlotsItemSideAggregation: Codable, Sendable, Equatable {
    let type: String = "best_net"

    enum CodingKeys: String, CodingKey {
        case type = "type"
    }

    init() {
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        _ = try c.decode(String.self, forKey: .type)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(type, forKey: .type)
    }
}

struct RoundsCreateInputDefinitionSlotsItem: Codable, Sendable, Equatable {
    var formatConfig: JSONValue?
    var ballSelector: RoundsCreateInputDefinitionSlotsItemBallSelector?
    var teamGrouping: RoundsCreateInputDefinitionSlotsItemTeamGrouping?
    var sideAggregation: RoundsCreateInputDefinitionSlotsItemSideAggregation?
    var id: String
    var formatId: String
    var allowanceConfig: CompetitionDetailDefaultConfigSlotsItemAllowanceConfig

    enum CodingKeys: String, CodingKey {
        case formatConfig = "formatConfig"
        case ballSelector = "ballSelector"
        case teamGrouping = "teamGrouping"
        case sideAggregation = "sideAggregation"
        case id = "id"
        case formatId = "formatId"
        case allowanceConfig = "allowanceConfig"
    }

    init(formatConfig: JSONValue? = nil, ballSelector: RoundsCreateInputDefinitionSlotsItemBallSelector? = nil, teamGrouping: RoundsCreateInputDefinitionSlotsItemTeamGrouping? = nil, sideAggregation: RoundsCreateInputDefinitionSlotsItemSideAggregation? = nil, id: String, formatId: String, allowanceConfig: CompetitionDetailDefaultConfigSlotsItemAllowanceConfig) {
        self.formatConfig = formatConfig
        self.ballSelector = ballSelector
        self.teamGrouping = teamGrouping
        self.sideAggregation = sideAggregation
        self.id = id
        self.formatId = formatId
        self.allowanceConfig = allowanceConfig
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.formatConfig = try c.decodeIfPresent(JSONValue.self, forKey: .formatConfig)
        self.ballSelector = try c.decodeIfPresent(RoundsCreateInputDefinitionSlotsItemBallSelector.self, forKey: .ballSelector)
        self.teamGrouping = try c.decodeIfPresent(RoundsCreateInputDefinitionSlotsItemTeamGrouping.self, forKey: .teamGrouping)
        self.sideAggregation = try c.decodeIfPresent(RoundsCreateInputDefinitionSlotsItemSideAggregation.self, forKey: .sideAggregation)
        self.id = try c.decode(String.self, forKey: .id)
        self.formatId = try c.decode(String.self, forKey: .formatId)
        self.allowanceConfig = try c.decode(CompetitionDetailDefaultConfigSlotsItemAllowanceConfig.self, forKey: .allowanceConfig)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encodeIfPresent(formatConfig, forKey: .formatConfig)
        try c.encodeIfPresent(ballSelector, forKey: .ballSelector)
        try c.encodeIfPresent(teamGrouping, forKey: .teamGrouping)
        try c.encodeIfPresent(sideAggregation, forKey: .sideAggregation)
        try c.encode(id, forKey: .id)
        try c.encode(formatId, forKey: .formatId)
        try c.encode(allowanceConfig, forKey: .allowanceConfig)
    }
}

struct RoundsCreateInputDefinitionBallStrategiesItemDerivationConfigSingle: Codable, Sendable, Equatable {
    let type: String = "single"

    enum CodingKeys: String, CodingKey {
        case type = "type"
    }

    init() {
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        _ = try c.decode(String.self, forKey: .type)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(type, forKey: .type)
    }
}

struct RoundsCreateInputDefinitionBallStrategiesItemDerivationConfigAvg: Codable, Sendable, Equatable {
    let type: String = "avg"

    enum CodingKeys: String, CodingKey {
        case type = "type"
    }

    init() {
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        _ = try c.decode(String.self, forKey: .type)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(type, forKey: .type)
    }
}

struct RoundsCreateInputDefinitionBallStrategiesItemDerivationConfigSumOfCh: Codable, Sendable, Equatable {
    let type: String = "sum_of_ch"

    enum CodingKeys: String, CodingKey {
        case type = "type"
    }

    init() {
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        _ = try c.decode(String.self, forKey: .type)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(type, forKey: .type)
    }
}

struct RoundsCreateInputDefinitionBallStrategiesItemDerivationConfigWeighted: Codable, Sendable, Equatable {
    let type: String = "weighted"
    var lowPct: Double
    var highPct: Double

    enum CodingKeys: String, CodingKey {
        case type = "type"
        case lowPct = "lowPct"
        case highPct = "highPct"
    }

    init(lowPct: Double, highPct: Double) {
        self.lowPct = lowPct
        self.highPct = highPct
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        _ = try c.decode(String.self, forKey: .type)
        self.lowPct = try c.decode(Double.self, forKey: .lowPct)
        self.highPct = try c.decode(Double.self, forKey: .highPct)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(type, forKey: .type)
        try c.encode(lowPct, forKey: .lowPct)
        try c.encode(highPct, forKey: .highPct)
    }
}

struct RoundsCreateInputDefinitionBallStrategiesItemDerivationConfigByRank: Codable, Sendable, Equatable {
    let type: String = "by_rank"
    var chPcts: [Double]

    enum CodingKeys: String, CodingKey {
        case type = "type"
        case chPcts = "chPcts"
    }

    init(chPcts: [Double]) {
        self.chPcts = chPcts
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        _ = try c.decode(String.self, forKey: .type)
        self.chPcts = try c.decode([Double].self, forKey: .chPcts)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(type, forKey: .type)
        try c.encode(chPcts, forKey: .chPcts)
    }
}

struct RoundsCreateInputDefinitionBallStrategiesItemDerivationConfigPerProducerPct: Codable, Sendable, Equatable {
    let type: String = "per_producer_pct"
    var pcts: [String: Double]

    enum CodingKeys: String, CodingKey {
        case type = "type"
        case pcts = "pcts"
    }

    init(pcts: [String: Double]) {
        self.pcts = pcts
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        _ = try c.decode(String.self, forKey: .type)
        self.pcts = try c.decode([String: Double].self, forKey: .pcts)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(type, forKey: .type)
        try c.encode(pcts, forKey: .pcts)
    }
}

enum RoundsCreateInputDefinitionBallStrategiesItemDerivationConfig: Codable, Sendable, Equatable {
    case single(RoundsCreateInputDefinitionBallStrategiesItemDerivationConfigSingle)
    case avg(RoundsCreateInputDefinitionBallStrategiesItemDerivationConfigAvg)
    case sumOfCh(RoundsCreateInputDefinitionBallStrategiesItemDerivationConfigSumOfCh)
    case weighted(RoundsCreateInputDefinitionBallStrategiesItemDerivationConfigWeighted)
    case byRank(RoundsCreateInputDefinitionBallStrategiesItemDerivationConfigByRank)
    case perProducerPct(RoundsCreateInputDefinitionBallStrategiesItemDerivationConfigPerProducerPct)

    private enum DiscriminantKey: String, CodingKey {
        case discriminant = "type"
    }

    init(from decoder: any Decoder) throws {
        let tag = try decoder.container(keyedBy: DiscriminantKey.self)
        let discriminant = try tag.decode(String.self, forKey: .discriminant)
        switch discriminant {
        case "single":
            self = .single(try RoundsCreateInputDefinitionBallStrategiesItemDerivationConfigSingle(from: decoder))
        case "avg":
            self = .avg(try RoundsCreateInputDefinitionBallStrategiesItemDerivationConfigAvg(from: decoder))
        case "sum_of_ch":
            self = .sumOfCh(try RoundsCreateInputDefinitionBallStrategiesItemDerivationConfigSumOfCh(from: decoder))
        case "weighted":
            self = .weighted(try RoundsCreateInputDefinitionBallStrategiesItemDerivationConfigWeighted(from: decoder))
        case "by_rank":
            self = .byRank(try RoundsCreateInputDefinitionBallStrategiesItemDerivationConfigByRank(from: decoder))
        case "per_producer_pct":
            self = .perProducerPct(try RoundsCreateInputDefinitionBallStrategiesItemDerivationConfigPerProducerPct(from: decoder))
        default:
            throw DecodingError.dataCorrupted(.init(
                codingPath: decoder.codingPath,
                debugDescription: "unknown type: \(discriminant)"))
        }
    }

    func encode(to encoder: any Encoder) throws {
        switch self {
        case .single(let v): try v.encode(to: encoder)
        case .avg(let v): try v.encode(to: encoder)
        case .sumOfCh(let v): try v.encode(to: encoder)
        case .weighted(let v): try v.encode(to: encoder)
        case .byRank(let v): try v.encode(to: encoder)
        case .perProducerPct(let v): try v.encode(to: encoder)
        }
    }
}

struct RoundsCreateInputDefinitionBallStrategiesItem: Codable, Sendable, Equatable {
    var composition: RoundsCreateInputDefinitionSlotsItemTeamGrouping?
    var id: String
    var strategyId: String
    var derivationConfig: RoundsCreateInputDefinitionBallStrategiesItemDerivationConfig

    enum CodingKeys: String, CodingKey {
        case composition = "composition"
        case id = "id"
        case strategyId = "strategyId"
        case derivationConfig = "derivationConfig"
    }

    init(composition: RoundsCreateInputDefinitionSlotsItemTeamGrouping? = nil, id: String, strategyId: String, derivationConfig: RoundsCreateInputDefinitionBallStrategiesItemDerivationConfig) {
        self.composition = composition
        self.id = id
        self.strategyId = strategyId
        self.derivationConfig = derivationConfig
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.composition = try c.decodeIfPresent(RoundsCreateInputDefinitionSlotsItemTeamGrouping.self, forKey: .composition)
        self.id = try c.decode(String.self, forKey: .id)
        self.strategyId = try c.decode(String.self, forKey: .strategyId)
        self.derivationConfig = try c.decode(RoundsCreateInputDefinitionBallStrategiesItemDerivationConfig.self, forKey: .derivationConfig)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encodeIfPresent(composition, forKey: .composition)
        try c.encode(id, forKey: .id)
        try c.encode(strategyId, forKey: .strategyId)
        try c.encode(derivationConfig, forKey: .derivationConfig)
    }
}

struct RoundsCreateInputDefinition: Codable, Sendable, Equatable {
    var playHoles: [CourseRouteTemplateRoutePlayHolesItem]?
    var routeSi: CourseRouteTemplateRouteRouteSi?
    var routeHandicapPolicy: CourseRouteTemplateRouteRouteHandicapPolicy?
    var routeSections: [CourseRouteTemplateRouteRouteSectionsItem]?
    var roundType: RoundRoundType?
    var venueType: RoundVenueType?
    var playingGroups: [CompetitionsCreateRoundOutputOkDraftRoutePlayingGroupsItem]?
    var startListMode: RoundStartListMode?
    var windowStart: TriState<String>
    var windowEnd: TriState<String>
    var selfOrganize: Bool?
    var courseId: String
    var playedAt: String
    var producers: [RoundsCreateInputDefinitionProducersItem]
    var slots: [RoundsCreateInputDefinitionSlotsItem]
    var ballStrategies: [RoundsCreateInputDefinitionBallStrategiesItem]

    enum CodingKeys: String, CodingKey {
        case playHoles = "playHoles"
        case routeSi = "routeSi"
        case routeHandicapPolicy = "routeHandicapPolicy"
        case routeSections = "routeSections"
        case roundType = "roundType"
        case venueType = "venueType"
        case playingGroups = "playingGroups"
        case startListMode = "startListMode"
        case windowStart = "windowStart"
        case windowEnd = "windowEnd"
        case selfOrganize = "selfOrganize"
        case courseId = "courseId"
        case playedAt = "playedAt"
        case producers = "producers"
        case slots = "slots"
        case ballStrategies = "ballStrategies"
    }

    init(playHoles: [CourseRouteTemplateRoutePlayHolesItem]? = nil, routeSi: CourseRouteTemplateRouteRouteSi? = nil, routeHandicapPolicy: CourseRouteTemplateRouteRouteHandicapPolicy? = nil, routeSections: [CourseRouteTemplateRouteRouteSectionsItem]? = nil, roundType: RoundRoundType? = nil, venueType: RoundVenueType? = nil, playingGroups: [CompetitionsCreateRoundOutputOkDraftRoutePlayingGroupsItem]? = nil, startListMode: RoundStartListMode? = nil, windowStart: TriState<String> = .absent, windowEnd: TriState<String> = .absent, selfOrganize: Bool? = nil, courseId: String, playedAt: String, producers: [RoundsCreateInputDefinitionProducersItem], slots: [RoundsCreateInputDefinitionSlotsItem], ballStrategies: [RoundsCreateInputDefinitionBallStrategiesItem]) {
        self.playHoles = playHoles
        self.routeSi = routeSi
        self.routeHandicapPolicy = routeHandicapPolicy
        self.routeSections = routeSections
        self.roundType = roundType
        self.venueType = venueType
        self.playingGroups = playingGroups
        self.startListMode = startListMode
        self.windowStart = windowStart
        self.windowEnd = windowEnd
        self.selfOrganize = selfOrganize
        self.courseId = courseId
        self.playedAt = playedAt
        self.producers = producers
        self.slots = slots
        self.ballStrategies = ballStrategies
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.playHoles = try c.decodeIfPresent([CourseRouteTemplateRoutePlayHolesItem].self, forKey: .playHoles)
        self.routeSi = try c.decodeIfPresent(CourseRouteTemplateRouteRouteSi.self, forKey: .routeSi)
        self.routeHandicapPolicy = try c.decodeIfPresent(CourseRouteTemplateRouteRouteHandicapPolicy.self, forKey: .routeHandicapPolicy)
        self.routeSections = try c.decodeIfPresent([CourseRouteTemplateRouteRouteSectionsItem].self, forKey: .routeSections)
        self.roundType = try c.decodeIfPresent(RoundRoundType.self, forKey: .roundType)
        self.venueType = try c.decodeIfPresent(RoundVenueType.self, forKey: .venueType)
        self.playingGroups = try c.decodeIfPresent([CompetitionsCreateRoundOutputOkDraftRoutePlayingGroupsItem].self, forKey: .playingGroups)
        self.startListMode = try c.decodeIfPresent(RoundStartListMode.self, forKey: .startListMode)
        if c.contains(.windowStart) {
            self.windowStart = try c.decodeNil(forKey: .windowStart)
                ? .null
                : .value(try c.decode(String.self, forKey: .windowStart))
        } else {
            self.windowStart = .absent
        }
        if c.contains(.windowEnd) {
            self.windowEnd = try c.decodeNil(forKey: .windowEnd)
                ? .null
                : .value(try c.decode(String.self, forKey: .windowEnd))
        } else {
            self.windowEnd = .absent
        }
        self.selfOrganize = try c.decodeIfPresent(Bool.self, forKey: .selfOrganize)
        self.courseId = try c.decode(String.self, forKey: .courseId)
        self.playedAt = try c.decode(String.self, forKey: .playedAt)
        self.producers = try c.decode([RoundsCreateInputDefinitionProducersItem].self, forKey: .producers)
        self.slots = try c.decode([RoundsCreateInputDefinitionSlotsItem].self, forKey: .slots)
        self.ballStrategies = try c.decode([RoundsCreateInputDefinitionBallStrategiesItem].self, forKey: .ballStrategies)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encodeIfPresent(playHoles, forKey: .playHoles)
        try c.encodeIfPresent(routeSi, forKey: .routeSi)
        try c.encodeIfPresent(routeHandicapPolicy, forKey: .routeHandicapPolicy)
        try c.encodeIfPresent(routeSections, forKey: .routeSections)
        try c.encodeIfPresent(roundType, forKey: .roundType)
        try c.encodeIfPresent(venueType, forKey: .venueType)
        try c.encodeIfPresent(playingGroups, forKey: .playingGroups)
        try c.encodeIfPresent(startListMode, forKey: .startListMode)
        switch windowStart {
        case .absent: break
        case .null: try c.encodeNil(forKey: .windowStart)
        case .value(let v): try c.encode(v, forKey: .windowStart)
        }
        switch windowEnd {
        case .absent: break
        case .null: try c.encodeNil(forKey: .windowEnd)
        case .value(let v): try c.encode(v, forKey: .windowEnd)
        }
        try c.encodeIfPresent(selfOrganize, forKey: .selfOrganize)
        try c.encode(courseId, forKey: .courseId)
        try c.encode(playedAt, forKey: .playedAt)
        try c.encode(producers, forKey: .producers)
        try c.encode(slots, forKey: .slots)
        try c.encode(ballStrategies, forKey: .ballStrategies)
    }
}

struct RoundsCreateInput: Codable, Sendable, Equatable {
    var definition: RoundsCreateInputDefinition

    enum CodingKeys: String, CodingKey {
        case definition = "definition"
    }

    init(definition: RoundsCreateInputDefinition) {
        self.definition = definition
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.definition = try c.decode(RoundsCreateInputDefinition.self, forKey: .definition)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(definition, forKey: .definition)
    }
}

struct RoundsUpdateInput: Codable, Sendable, Equatable {
    var status: AdminRoundSummaryStatus?
    var roundType: RoundRoundType?
    var venueType: RoundVenueType?
    var startListMode: RoundStartListMode?
    var windowStart: TriState<String>
    var windowEnd: TriState<String>
    var selfOrganize: Bool?
    var date: String?
    var id: String

    enum CodingKeys: String, CodingKey {
        case status = "status"
        case roundType = "roundType"
        case venueType = "venueType"
        case startListMode = "startListMode"
        case windowStart = "windowStart"
        case windowEnd = "windowEnd"
        case selfOrganize = "selfOrganize"
        case date = "date"
        case id = "id"
    }

    init(status: AdminRoundSummaryStatus? = nil, roundType: RoundRoundType? = nil, venueType: RoundVenueType? = nil, startListMode: RoundStartListMode? = nil, windowStart: TriState<String> = .absent, windowEnd: TriState<String> = .absent, selfOrganize: Bool? = nil, date: String? = nil, id: String) {
        self.status = status
        self.roundType = roundType
        self.venueType = venueType
        self.startListMode = startListMode
        self.windowStart = windowStart
        self.windowEnd = windowEnd
        self.selfOrganize = selfOrganize
        self.date = date
        self.id = id
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.status = try c.decodeIfPresent(AdminRoundSummaryStatus.self, forKey: .status)
        self.roundType = try c.decodeIfPresent(RoundRoundType.self, forKey: .roundType)
        self.venueType = try c.decodeIfPresent(RoundVenueType.self, forKey: .venueType)
        self.startListMode = try c.decodeIfPresent(RoundStartListMode.self, forKey: .startListMode)
        if c.contains(.windowStart) {
            self.windowStart = try c.decodeNil(forKey: .windowStart)
                ? .null
                : .value(try c.decode(String.self, forKey: .windowStart))
        } else {
            self.windowStart = .absent
        }
        if c.contains(.windowEnd) {
            self.windowEnd = try c.decodeNil(forKey: .windowEnd)
                ? .null
                : .value(try c.decode(String.self, forKey: .windowEnd))
        } else {
            self.windowEnd = .absent
        }
        self.selfOrganize = try c.decodeIfPresent(Bool.self, forKey: .selfOrganize)
        self.date = try c.decodeIfPresent(String.self, forKey: .date)
        self.id = try c.decode(String.self, forKey: .id)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encodeIfPresent(status, forKey: .status)
        try c.encodeIfPresent(roundType, forKey: .roundType)
        try c.encodeIfPresent(venueType, forKey: .venueType)
        try c.encodeIfPresent(startListMode, forKey: .startListMode)
        switch windowStart {
        case .absent: break
        case .null: try c.encodeNil(forKey: .windowStart)
        case .value(let v): try c.encode(v, forKey: .windowStart)
        }
        switch windowEnd {
        case .absent: break
        case .null: try c.encodeNil(forKey: .windowEnd)
        case .value(let v): try c.encode(v, forKey: .windowEnd)
        }
        try c.encodeIfPresent(selfOrganize, forKey: .selfOrganize)
        try c.encodeIfPresent(date, forKey: .date)
        try c.encode(id, forKey: .id)
    }
}
