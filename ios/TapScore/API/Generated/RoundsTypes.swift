// GENERATED — DO NOT EDIT. bun run generate:swift

import Foundation

struct RoundsCreateInputDefinitionProducersItemPlayerRef: Codable, Sendable, Equatable {
    var id: String
    var playerRef: CompetitionsCreateRoundOutputOkDraftProducersItemPlayerRefPlayerRef
    var handicapIndex: Double
    var gender: PlayerGender?
    var teeId: String
    var category: String?

    enum CodingKeys: String, CodingKey {
        case id = "id"
        case playerRef = "playerRef"
        case handicapIndex = "handicapIndex"
        case gender = "gender"
        case teeId = "teeId"
        case category = "category"
    }

    init(id: String, playerRef: CompetitionsCreateRoundOutputOkDraftProducersItemPlayerRefPlayerRef, handicapIndex: Double, gender: PlayerGender? = nil, teeId: String, category: String? = nil) {
        self.id = id
        self.playerRef = playerRef
        self.handicapIndex = handicapIndex
        self.gender = gender
        self.teeId = teeId
        self.category = category
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try c.decode(String.self, forKey: .id)
        self.playerRef = try c.decode(CompetitionsCreateRoundOutputOkDraftProducersItemPlayerRefPlayerRef.self, forKey: .playerRef)
        self.handicapIndex = try c.decode(Double.self, forKey: .handicapIndex)
        self.gender = try c.decodeIfPresent(PlayerGender.self, forKey: .gender)
        self.teeId = try c.decode(String.self, forKey: .teeId)
        self.category = try c.decodeIfPresent(String.self, forKey: .category)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encode(playerRef, forKey: .playerRef)
        try c.encode(handicapIndex, forKey: .handicapIndex)
        try c.encodeIfPresent(gender, forKey: .gender)
        try c.encode(teeId, forKey: .teeId)
        try c.encodeIfPresent(category, forKey: .category)
    }
}

struct RoundsCreateInputDefinitionProducersItemPlaceholder: Codable, Sendable, Equatable {
    var id: String
    var placeholder: CompetitionsCreateRoundOutputOkDraftProducersItemPlayerRefSeat
    var category: String?

    enum CodingKeys: String, CodingKey {
        case id = "id"
        case placeholder = "placeholder"
        case category = "category"
    }

    init(id: String, placeholder: CompetitionsCreateRoundOutputOkDraftProducersItemPlayerRefSeat, category: String? = nil) {
        self.id = id
        self.placeholder = placeholder
        self.category = category
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try c.decode(String.self, forKey: .id)
        self.placeholder = try c.decode(CompetitionsCreateRoundOutputOkDraftProducersItemPlayerRefSeat.self, forKey: .placeholder)
        self.category = try c.decodeIfPresent(String.self, forKey: .category)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encode(placeholder, forKey: .placeholder)
        try c.encodeIfPresent(category, forKey: .category)
    }
}

enum RoundsCreateInputDefinitionProducersItem: Codable, Sendable, Equatable {
    case playerRef(RoundsCreateInputDefinitionProducersItemPlayerRef)
    case placeholder(RoundsCreateInputDefinitionProducersItemPlaceholder)

    init(from decoder: any Decoder) throws {
        let probe = try decoder.container(keyedBy: AnyCodingKey.self)
        if probe.contains(AnyCodingKey("playerRef")) {
            self = .playerRef(try RoundsCreateInputDefinitionProducersItemPlayerRef(from: decoder))
        } else {
            self = .placeholder(try RoundsCreateInputDefinitionProducersItemPlaceholder(from: decoder))
        }
    }

    func encode(to encoder: any Encoder) throws {
        switch self {
        case .playerRef(let v): try v.encode(to: encoder)
        case .placeholder(let v): try v.encode(to: encoder)
        }
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

struct RoundsCreateInputDefinitionBallStrategiesItemComposition: Codable, Sendable, Equatable {
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

struct RoundsCreateInputDefinitionBallStrategiesItem: Codable, Sendable, Equatable {
    var id: String
    var strategyId: String
    var derivationConfig: RoundsCreateInputDefinitionBallStrategiesItemDerivationConfig
    var composition: RoundsCreateInputDefinitionBallStrategiesItemComposition?

    enum CodingKeys: String, CodingKey {
        case id = "id"
        case strategyId = "strategyId"
        case derivationConfig = "derivationConfig"
        case composition = "composition"
    }

    init(id: String, strategyId: String, derivationConfig: RoundsCreateInputDefinitionBallStrategiesItemDerivationConfig, composition: RoundsCreateInputDefinitionBallStrategiesItemComposition? = nil) {
        self.id = id
        self.strategyId = strategyId
        self.derivationConfig = derivationConfig
        self.composition = composition
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try c.decode(String.self, forKey: .id)
        self.strategyId = try c.decode(String.self, forKey: .strategyId)
        self.derivationConfig = try c.decode(RoundsCreateInputDefinitionBallStrategiesItemDerivationConfig.self, forKey: .derivationConfig)
        self.composition = try c.decodeIfPresent(RoundsCreateInputDefinitionBallStrategiesItemComposition.self, forKey: .composition)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encode(strategyId, forKey: .strategyId)
        try c.encode(derivationConfig, forKey: .derivationConfig)
        try c.encodeIfPresent(composition, forKey: .composition)
    }
}

struct RoundsCreateInputDefinitionSlotsItemBallSelector: Codable, Sendable, Equatable {
    var strategyDefIds: [String]?
    var producerDefIds: [String]?

    enum CodingKeys: String, CodingKey {
        case strategyDefIds = "strategyDefIds"
        case producerDefIds = "producerDefIds"
    }

    init(strategyDefIds: [String]? = nil, producerDefIds: [String]? = nil) {
        self.strategyDefIds = strategyDefIds
        self.producerDefIds = producerDefIds
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.strategyDefIds = try c.decodeIfPresent([String].self, forKey: .strategyDefIds)
        self.producerDefIds = try c.decodeIfPresent([String].self, forKey: .producerDefIds)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encodeIfPresent(strategyDefIds, forKey: .strategyDefIds)
        try c.encodeIfPresent(producerDefIds, forKey: .producerDefIds)
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
    var id: String
    var formatId: String
    var allowanceConfig: CompetitionDetailDefaultConfigSlotsItemAllowanceConfig
    var ballSelector: RoundsCreateInputDefinitionSlotsItemBallSelector?
    var teamGrouping: RoundsCreateInputDefinitionBallStrategiesItemComposition?
    var sideAggregation: RoundsCreateInputDefinitionSlotsItemSideAggregation?
    var formatConfig: JSONValue?

    enum CodingKeys: String, CodingKey {
        case id = "id"
        case formatId = "formatId"
        case allowanceConfig = "allowanceConfig"
        case ballSelector = "ballSelector"
        case teamGrouping = "teamGrouping"
        case sideAggregation = "sideAggregation"
        case formatConfig = "formatConfig"
    }

    init(id: String, formatId: String, allowanceConfig: CompetitionDetailDefaultConfigSlotsItemAllowanceConfig, ballSelector: RoundsCreateInputDefinitionSlotsItemBallSelector? = nil, teamGrouping: RoundsCreateInputDefinitionBallStrategiesItemComposition? = nil, sideAggregation: RoundsCreateInputDefinitionSlotsItemSideAggregation? = nil, formatConfig: JSONValue? = nil) {
        self.id = id
        self.formatId = formatId
        self.allowanceConfig = allowanceConfig
        self.ballSelector = ballSelector
        self.teamGrouping = teamGrouping
        self.sideAggregation = sideAggregation
        self.formatConfig = formatConfig
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try c.decode(String.self, forKey: .id)
        self.formatId = try c.decode(String.self, forKey: .formatId)
        self.allowanceConfig = try c.decode(CompetitionDetailDefaultConfigSlotsItemAllowanceConfig.self, forKey: .allowanceConfig)
        self.ballSelector = try c.decodeIfPresent(RoundsCreateInputDefinitionSlotsItemBallSelector.self, forKey: .ballSelector)
        self.teamGrouping = try c.decodeIfPresent(RoundsCreateInputDefinitionBallStrategiesItemComposition.self, forKey: .teamGrouping)
        self.sideAggregation = try c.decodeIfPresent(RoundsCreateInputDefinitionSlotsItemSideAggregation.self, forKey: .sideAggregation)
        self.formatConfig = try c.decodeIfPresent(JSONValue.self, forKey: .formatConfig)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encode(formatId, forKey: .formatId)
        try c.encode(allowanceConfig, forKey: .allowanceConfig)
        try c.encodeIfPresent(ballSelector, forKey: .ballSelector)
        try c.encodeIfPresent(teamGrouping, forKey: .teamGrouping)
        try c.encodeIfPresent(sideAggregation, forKey: .sideAggregation)
        try c.encodeIfPresent(formatConfig, forKey: .formatConfig)
    }
}

struct RoundsCreateInputDefinition: Codable, Sendable, Equatable {
    var courseId: String
    var playedAt: String
    var roundType: RoundType?
    var venueType: VenueType?
    var startListMode: StartListMode?
    var windowStart: TriState<String>
    var windowEnd: TriState<String>
    var selfOrganize: Bool?
    var routeSi: CourseRouteTemplateRouteRouteSi?
    var routeHandicapPolicy: CourseRouteTemplateRouteRouteHandicapPolicy?
    var routeSections: [CourseRouteTemplateRouteRouteSectionsItem]?
    var playHoles: [CourseRouteTemplateRoutePlayHolesItem]?
    var producers: [RoundsCreateInputDefinitionProducersItem]
    var ballStrategies: [RoundsCreateInputDefinitionBallStrategiesItem]
    var playingGroups: [CompetitionsCreateRoundOutputOkDraftRoutePlayingGroupsItem]?
    var slots: [RoundsCreateInputDefinitionSlotsItem]

    enum CodingKeys: String, CodingKey {
        case courseId = "courseId"
        case playedAt = "playedAt"
        case roundType = "roundType"
        case venueType = "venueType"
        case startListMode = "startListMode"
        case windowStart = "windowStart"
        case windowEnd = "windowEnd"
        case selfOrganize = "selfOrganize"
        case routeSi = "routeSi"
        case routeHandicapPolicy = "routeHandicapPolicy"
        case routeSections = "routeSections"
        case playHoles = "playHoles"
        case producers = "producers"
        case ballStrategies = "ballStrategies"
        case playingGroups = "playingGroups"
        case slots = "slots"
    }

    init(courseId: String, playedAt: String, roundType: RoundType? = nil, venueType: VenueType? = nil, startListMode: StartListMode? = nil, windowStart: TriState<String> = .absent, windowEnd: TriState<String> = .absent, selfOrganize: Bool? = nil, routeSi: CourseRouteTemplateRouteRouteSi? = nil, routeHandicapPolicy: CourseRouteTemplateRouteRouteHandicapPolicy? = nil, routeSections: [CourseRouteTemplateRouteRouteSectionsItem]? = nil, playHoles: [CourseRouteTemplateRoutePlayHolesItem]? = nil, producers: [RoundsCreateInputDefinitionProducersItem], ballStrategies: [RoundsCreateInputDefinitionBallStrategiesItem], playingGroups: [CompetitionsCreateRoundOutputOkDraftRoutePlayingGroupsItem]? = nil, slots: [RoundsCreateInputDefinitionSlotsItem]) {
        self.courseId = courseId
        self.playedAt = playedAt
        self.roundType = roundType
        self.venueType = venueType
        self.startListMode = startListMode
        self.windowStart = windowStart
        self.windowEnd = windowEnd
        self.selfOrganize = selfOrganize
        self.routeSi = routeSi
        self.routeHandicapPolicy = routeHandicapPolicy
        self.routeSections = routeSections
        self.playHoles = playHoles
        self.producers = producers
        self.ballStrategies = ballStrategies
        self.playingGroups = playingGroups
        self.slots = slots
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.courseId = try c.decode(String.self, forKey: .courseId)
        self.playedAt = try c.decode(String.self, forKey: .playedAt)
        self.roundType = try c.decodeIfPresent(RoundType.self, forKey: .roundType)
        self.venueType = try c.decodeIfPresent(VenueType.self, forKey: .venueType)
        self.startListMode = try c.decodeIfPresent(StartListMode.self, forKey: .startListMode)
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
        self.routeSi = try c.decodeIfPresent(CourseRouteTemplateRouteRouteSi.self, forKey: .routeSi)
        self.routeHandicapPolicy = try c.decodeIfPresent(CourseRouteTemplateRouteRouteHandicapPolicy.self, forKey: .routeHandicapPolicy)
        self.routeSections = try c.decodeIfPresent([CourseRouteTemplateRouteRouteSectionsItem].self, forKey: .routeSections)
        self.playHoles = try c.decodeIfPresent([CourseRouteTemplateRoutePlayHolesItem].self, forKey: .playHoles)
        self.producers = try c.decode([RoundsCreateInputDefinitionProducersItem].self, forKey: .producers)
        self.ballStrategies = try c.decode([RoundsCreateInputDefinitionBallStrategiesItem].self, forKey: .ballStrategies)
        self.playingGroups = try c.decodeIfPresent([CompetitionsCreateRoundOutputOkDraftRoutePlayingGroupsItem].self, forKey: .playingGroups)
        self.slots = try c.decode([RoundsCreateInputDefinitionSlotsItem].self, forKey: .slots)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(courseId, forKey: .courseId)
        try c.encode(playedAt, forKey: .playedAt)
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
        try c.encodeIfPresent(routeSi, forKey: .routeSi)
        try c.encodeIfPresent(routeHandicapPolicy, forKey: .routeHandicapPolicy)
        try c.encodeIfPresent(routeSections, forKey: .routeSections)
        try c.encodeIfPresent(playHoles, forKey: .playHoles)
        try c.encode(producers, forKey: .producers)
        try c.encode(ballStrategies, forKey: .ballStrategies)
        try c.encodeIfPresent(playingGroups, forKey: .playingGroups)
        try c.encode(slots, forKey: .slots)
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
    var id: String
    var date: String?
    var roundType: RoundType?
    var venueType: VenueType?
    var startListMode: StartListMode?
    var windowStart: TriState<String>
    var windowEnd: TriState<String>
    var selfOrganize: Bool?
    var status: RoundStatus?

    enum CodingKeys: String, CodingKey {
        case id = "id"
        case date = "date"
        case roundType = "roundType"
        case venueType = "venueType"
        case startListMode = "startListMode"
        case windowStart = "windowStart"
        case windowEnd = "windowEnd"
        case selfOrganize = "selfOrganize"
        case status = "status"
    }

    init(id: String, date: String? = nil, roundType: RoundType? = nil, venueType: VenueType? = nil, startListMode: StartListMode? = nil, windowStart: TriState<String> = .absent, windowEnd: TriState<String> = .absent, selfOrganize: Bool? = nil, status: RoundStatus? = nil) {
        self.id = id
        self.date = date
        self.roundType = roundType
        self.venueType = venueType
        self.startListMode = startListMode
        self.windowStart = windowStart
        self.windowEnd = windowEnd
        self.selfOrganize = selfOrganize
        self.status = status
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try c.decode(String.self, forKey: .id)
        self.date = try c.decodeIfPresent(String.self, forKey: .date)
        self.roundType = try c.decodeIfPresent(RoundType.self, forKey: .roundType)
        self.venueType = try c.decodeIfPresent(VenueType.self, forKey: .venueType)
        self.startListMode = try c.decodeIfPresent(StartListMode.self, forKey: .startListMode)
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
        self.status = try c.decodeIfPresent(RoundStatus.self, forKey: .status)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encodeIfPresent(date, forKey: .date)
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
        try c.encodeIfPresent(status, forKey: .status)
    }
}
