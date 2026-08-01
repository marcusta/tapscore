// GENERATED — DO NOT EDIT. bun run generate:swift

import Foundation

struct FormatDescriptorDefaults: Codable, Sendable, Equatable {
    var allowanceConfig: CompetitionDetailDefaultConfigSlotsItemAllowanceConfig
    var formatConfig: [String: String]?

    enum CodingKeys: String, CodingKey {
        case allowanceConfig = "allowanceConfig"
        case formatConfig = "formatConfig"
    }

    init(allowanceConfig: CompetitionDetailDefaultConfigSlotsItemAllowanceConfig, formatConfig: [String: String]? = nil) {
        self.allowanceConfig = allowanceConfig
        self.formatConfig = formatConfig
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.allowanceConfig = try c.decode(CompetitionDetailDefaultConfigSlotsItemAllowanceConfig.self, forKey: .allowanceConfig)
        self.formatConfig = try c.decodeIfPresent([String: String].self, forKey: .formatConfig)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(allowanceConfig, forKey: .allowanceConfig)
        try c.encodeIfPresent(formatConfig, forKey: .formatConfig)
    }
}

enum ScoreGridComponentId: String, Codable, Sendable, Equatable {
    case defaultScoreGrid = "default-score-grid"
    case compactMatchGrid = "compact-match-grid"
    case categoryMatrixGrid = "category-matrix-grid"
}

struct FormatDescriptorResultDisplay: Codable, Sendable, Equatable {
    var runningTotals: String?
    var scoreGridComponentId: ScoreGridComponentId?

    enum CodingKeys: String, CodingKey {
        case runningTotals = "runningTotals"
        case scoreGridComponentId = "scoreGridComponentId"
    }

    init(runningTotals: String? = nil, scoreGridComponentId: ScoreGridComponentId? = nil) {
        self.runningTotals = runningTotals
        self.scoreGridComponentId = scoreGridComponentId
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.runningTotals = try c.decodeIfPresent(String.self, forKey: .runningTotals)
        self.scoreGridComponentId = try c.decodeIfPresent(ScoreGridComponentId.self, forKey: .scoreGridComponentId)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encodeIfPresent(runningTotals, forKey: .runningTotals)
        try c.encodeIfPresent(scoreGridComponentId, forKey: .scoreGridComponentId)
    }
}

struct FormatDescriptor: Codable, Sendable, Equatable {
    var id: String
    var label: String
    var labels: FormatLabels
    var description: String
    var scoringMode: String
    var teamShape: String
    var requirements: FormatRequirements
    var defaults: FormatDescriptorDefaults
    var configFields: [FormatConfigField]?
    var preset: FormatPreset?
    var metrics: [FormatMetric]
    var resultDisplay: FormatDescriptorResultDisplay?
    var scoresAnyBall: Bool?
    var clientAdapterId: String?

    enum CodingKeys: String, CodingKey {
        case id = "id"
        case label = "label"
        case labels = "labels"
        case description = "description"
        case scoringMode = "scoringMode"
        case teamShape = "teamShape"
        case requirements = "requirements"
        case defaults = "defaults"
        case configFields = "configFields"
        case preset = "preset"
        case metrics = "metrics"
        case resultDisplay = "resultDisplay"
        case scoresAnyBall = "scoresAnyBall"
        case clientAdapterId = "clientAdapterId"
    }

    init(id: String, label: String, labels: FormatLabels, description: String, scoringMode: String, teamShape: String, requirements: FormatRequirements, defaults: FormatDescriptorDefaults, configFields: [FormatConfigField]? = nil, preset: FormatPreset? = nil, metrics: [FormatMetric], resultDisplay: FormatDescriptorResultDisplay? = nil, scoresAnyBall: Bool? = nil, clientAdapterId: String? = nil) {
        self.id = id
        self.label = label
        self.labels = labels
        self.description = description
        self.scoringMode = scoringMode
        self.teamShape = teamShape
        self.requirements = requirements
        self.defaults = defaults
        self.configFields = configFields
        self.preset = preset
        self.metrics = metrics
        self.resultDisplay = resultDisplay
        self.scoresAnyBall = scoresAnyBall
        self.clientAdapterId = clientAdapterId
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try c.decode(String.self, forKey: .id)
        self.label = try c.decode(String.self, forKey: .label)
        self.labels = try c.decode(FormatLabels.self, forKey: .labels)
        self.description = try c.decode(String.self, forKey: .description)
        self.scoringMode = try c.decode(String.self, forKey: .scoringMode)
        self.teamShape = try c.decode(String.self, forKey: .teamShape)
        self.requirements = try c.decode(FormatRequirements.self, forKey: .requirements)
        self.defaults = try c.decode(FormatDescriptorDefaults.self, forKey: .defaults)
        self.configFields = try c.decodeIfPresent([FormatConfigField].self, forKey: .configFields)
        self.preset = try c.decodeIfPresent(FormatPreset.self, forKey: .preset)
        self.metrics = try c.decode([FormatMetric].self, forKey: .metrics)
        self.resultDisplay = try c.decodeIfPresent(FormatDescriptorResultDisplay.self, forKey: .resultDisplay)
        self.scoresAnyBall = try c.decodeIfPresent(Bool.self, forKey: .scoresAnyBall)
        self.clientAdapterId = try c.decodeIfPresent(String.self, forKey: .clientAdapterId)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encode(label, forKey: .label)
        try c.encode(labels, forKey: .labels)
        try c.encode(description, forKey: .description)
        try c.encode(scoringMode, forKey: .scoringMode)
        try c.encode(teamShape, forKey: .teamShape)
        try c.encode(requirements, forKey: .requirements)
        try c.encode(defaults, forKey: .defaults)
        try c.encodeIfPresent(configFields, forKey: .configFields)
        try c.encodeIfPresent(preset, forKey: .preset)
        try c.encode(metrics, forKey: .metrics)
        try c.encodeIfPresent(resultDisplay, forKey: .resultDisplay)
        try c.encodeIfPresent(scoresAnyBall, forKey: .scoresAnyBall)
        if let clientAdapterId {
            try c.encode(clientAdapterId, forKey: .clientAdapterId)
        } else {
            try c.encodeNil(forKey: .clientAdapterId)
        }
    }
}

struct FormatLabels: Codable, Sendable, Equatable {
    var en: String
    var sv: String?

    enum CodingKeys: String, CodingKey {
        case en = "en"
        case sv = "sv"
    }

    init(en: String, sv: String? = nil) {
        self.en = en
        self.sv = sv
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.en = try c.decode(String.self, forKey: .en)
        self.sv = try c.decodeIfPresent(String.self, forKey: .sv)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(en, forKey: .en)
        try c.encodeIfPresent(sv, forKey: .sv)
    }
}

enum HoleCoordinate: String, Codable, Sendable, Equatable {
    case playedOrdinal = "played_ordinal"
    case canonicalOrdinal = "canonical_ordinal"
    case courseHoleNumber = "course_hole_number"
}

struct FormatRequirements: Codable, Sendable, Equatable {
    var balls: FormatBallRequirement
    var scoreEntry: ScoreEntryCapabilities?
    var holeCoordinate: HoleCoordinate?
    var allowSegmentOverlap: Bool?

    enum CodingKeys: String, CodingKey {
        case balls = "balls"
        case scoreEntry = "scoreEntry"
        case holeCoordinate = "holeCoordinate"
        case allowSegmentOverlap = "allowSegmentOverlap"
    }

    init(balls: FormatBallRequirement, scoreEntry: ScoreEntryCapabilities? = nil, holeCoordinate: HoleCoordinate? = nil, allowSegmentOverlap: Bool? = nil) {
        self.balls = balls
        self.scoreEntry = scoreEntry
        self.holeCoordinate = holeCoordinate
        self.allowSegmentOverlap = allowSegmentOverlap
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.balls = try c.decode(FormatBallRequirement.self, forKey: .balls)
        self.scoreEntry = try c.decodeIfPresent(ScoreEntryCapabilities.self, forKey: .scoreEntry)
        self.holeCoordinate = try c.decodeIfPresent(HoleCoordinate.self, forKey: .holeCoordinate)
        self.allowSegmentOverlap = try c.decodeIfPresent(Bool.self, forKey: .allowSegmentOverlap)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(balls, forKey: .balls)
        try c.encodeIfPresent(scoreEntry, forKey: .scoreEntry)
        try c.encodeIfPresent(holeCoordinate, forKey: .holeCoordinate)
        try c.encodeIfPresent(allowSegmentOverlap, forKey: .allowSegmentOverlap)
    }
}

struct FormatConfigField: Codable, Sendable, Equatable {
    let kind: String = "select"
    var key: String
    var labels: FormatLabels
    var options: [FormatConfigOption]
    var `default`: String

    enum CodingKeys: String, CodingKey {
        case kind = "kind"
        case key = "key"
        case labels = "labels"
        case options = "options"
        case `default` = "default"
    }

    init(key: String, labels: FormatLabels, options: [FormatConfigOption], `default`: String) {
        self.key = key
        self.labels = labels
        self.options = options
        self.`default` = `default`
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        _ = try c.decode(String.self, forKey: .kind)
        self.key = try c.decode(String.self, forKey: .key)
        self.labels = try c.decode(FormatLabels.self, forKey: .labels)
        self.options = try c.decode([FormatConfigOption].self, forKey: .options)
        self.`default` = try c.decode(String.self, forKey: .`default`)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(kind, forKey: .kind)
        try c.encode(key, forKey: .key)
        try c.encode(labels, forKey: .labels)
        try c.encode(options, forKey: .options)
        try c.encode(`default`, forKey: .`default`)
    }
}

struct FormatPreset: Codable, Sendable, Equatable {
    var tagline: FormatLabels
    var rank: Double?

    enum CodingKeys: String, CodingKey {
        case tagline = "tagline"
        case rank = "rank"
    }

    init(tagline: FormatLabels, rank: Double? = nil) {
        self.tagline = tagline
        self.rank = rank
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.tagline = try c.decode(FormatLabels.self, forKey: .tagline)
        self.rank = try c.decodeIfPresent(Double.self, forKey: .rank)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(tagline, forKey: .tagline)
        try c.encodeIfPresent(rank, forKey: .rank)
    }
}

struct FormatMetricPaceObject: Codable, Sendable, Equatable {
    var perHole: Double

    enum CodingKeys: String, CodingKey {
        case perHole = "perHole"
    }

    init(perHole: Double) {
        self.perHole = perHole
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.perHole = try c.decode(Double.self, forKey: .perHole)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(perHole, forKey: .perHole)
    }
}

enum FormatMetricPace: Codable, Sendable, Equatable {
    case par
    case object(FormatMetricPaceObject)

    init(from decoder: any Decoder) throws {
        var errors: [String] = []
        do {
            let raw = try decoder.singleValueContainer().decode(String.self)
            if raw == "par" {
                self = .par
                return
            }
            errors.append("par: expected par, got \(raw)")
        } catch {
            errors.append("par: \(error)")
        }
        do {
            self = .object(try FormatMetricPaceObject(from: decoder))
            return
        } catch {
            errors.append("object: \(error)")
        }
        throw DecodingError.dataCorrupted(.init(
            codingPath: decoder.codingPath,
            debugDescription: "no FormatMetricPace variant matched — "
                + errors.joined(separator: " | ")))
    }

    func encode(to encoder: any Encoder) throws {
        switch self {
        case .par:
            var c = encoder.singleValueContainer()
            try c.encode("par")
        case .object(let v): try v.encode(to: encoder)
        }
    }
}

struct FormatMetric: Codable, Sendable, Equatable {
    var id: String
    var label: String
    var direction: ResultViewDirection
    var pace: FormatMetricPace?

    enum CodingKeys: String, CodingKey {
        case id = "id"
        case label = "label"
        case direction = "direction"
        case pace = "pace"
    }

    init(id: String, label: String, direction: ResultViewDirection, pace: FormatMetricPace? = nil) {
        self.id = id
        self.label = label
        self.direction = direction
        self.pace = pace
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try c.decode(String.self, forKey: .id)
        self.label = try c.decode(String.self, forKey: .label)
        self.direction = try c.decode(ResultViewDirection.self, forKey: .direction)
        self.pace = try c.decodeIfPresent(FormatMetricPace.self, forKey: .pace)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encode(label, forKey: .label)
        try c.encode(direction, forKey: .direction)
        try c.encodeIfPresent(pace, forKey: .pace)
    }
}

struct FormatBallRequirementProducerCount: Codable, Sendable, Equatable {
    var min: Double
    var max: Double

    enum CodingKeys: String, CodingKey {
        case min = "min"
        case max = "max"
    }

    init(min: Double, max: Double) {
        self.min = min
        self.max = max
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.min = try c.decode(Double.self, forKey: .min)
        self.max = try c.decode(Double.self, forKey: .max)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(min, forKey: .min)
        try c.encode(max, forKey: .max)
    }
}

enum FormatBallRequirementBallMode: String, Codable, Sendable, Equatable {
    case own = "own"
    case team = "team"
    case any = "any"
}

enum FormatBallTopology: String, Codable, Sendable, Equatable {
    case `static` = "static"
    case scheduled = "scheduled"
    case `dynamic` = "dynamic"
}

struct FormatBallRequirementSlotBallCount: Codable, Sendable, Equatable {
    var min: Double?
    var max: Double?
    var multipleOf: Double?

    enum CodingKeys: String, CodingKey {
        case min = "min"
        case max = "max"
        case multipleOf = "multipleOf"
    }

    init(min: Double? = nil, max: Double? = nil, multipleOf: Double? = nil) {
        self.min = min
        self.max = max
        self.multipleOf = multipleOf
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.min = try c.decodeIfPresent(Double.self, forKey: .min)
        self.max = try c.decodeIfPresent(Double.self, forKey: .max)
        self.multipleOf = try c.decodeIfPresent(Double.self, forKey: .multipleOf)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encodeIfPresent(min, forKey: .min)
        try c.encodeIfPresent(max, forKey: .max)
        try c.encodeIfPresent(multipleOf, forKey: .multipleOf)
    }
}

struct FormatBallRequirementSlotTeamGroupingTeamCount: Codable, Sendable, Equatable {
    var min: Double?
    var max: Double?

    enum CodingKeys: String, CodingKey {
        case min = "min"
        case max = "max"
    }

    init(min: Double? = nil, max: Double? = nil) {
        self.min = min
        self.max = max
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.min = try c.decodeIfPresent(Double.self, forKey: .min)
        self.max = try c.decodeIfPresent(Double.self, forKey: .max)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encodeIfPresent(min, forKey: .min)
        try c.encodeIfPresent(max, forKey: .max)
    }
}

struct FormatBallRequirementSlotTeamGrouping: Codable, Sendable, Equatable {
    var teamCount: FormatBallRequirementSlotTeamGroupingTeamCount?
    var teamSize: FormatBallRequirementSlotTeamGroupingTeamCount?

    enum CodingKeys: String, CodingKey {
        case teamCount = "teamCount"
        case teamSize = "teamSize"
    }

    init(teamCount: FormatBallRequirementSlotTeamGroupingTeamCount? = nil, teamSize: FormatBallRequirementSlotTeamGroupingTeamCount? = nil) {
        self.teamCount = teamCount
        self.teamSize = teamSize
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.teamCount = try c.decodeIfPresent(FormatBallRequirementSlotTeamGroupingTeamCount.self, forKey: .teamCount)
        self.teamSize = try c.decodeIfPresent(FormatBallRequirementSlotTeamGroupingTeamCount.self, forKey: .teamSize)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encodeIfPresent(teamCount, forKey: .teamCount)
        try c.encodeIfPresent(teamSize, forKey: .teamSize)
    }
}

struct FormatBallRequirement: Codable, Sendable, Equatable {
    var producerCount: FormatBallRequirementProducerCount
    var ballMode: FormatBallRequirementBallMode
    var topology: FormatBallTopology?
    var requiresSlotTeamGrouping: Bool?
    var slotBallCount: FormatBallRequirementSlotBallCount?
    var slotTeamGrouping: FormatBallRequirementSlotTeamGrouping?

    enum CodingKeys: String, CodingKey {
        case producerCount = "producerCount"
        case ballMode = "ballMode"
        case topology = "topology"
        case requiresSlotTeamGrouping = "requiresSlotTeamGrouping"
        case slotBallCount = "slotBallCount"
        case slotTeamGrouping = "slotTeamGrouping"
    }

    init(producerCount: FormatBallRequirementProducerCount, ballMode: FormatBallRequirementBallMode, topology: FormatBallTopology? = nil, requiresSlotTeamGrouping: Bool? = nil, slotBallCount: FormatBallRequirementSlotBallCount? = nil, slotTeamGrouping: FormatBallRequirementSlotTeamGrouping? = nil) {
        self.producerCount = producerCount
        self.ballMode = ballMode
        self.topology = topology
        self.requiresSlotTeamGrouping = requiresSlotTeamGrouping
        self.slotBallCount = slotBallCount
        self.slotTeamGrouping = slotTeamGrouping
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.producerCount = try c.decode(FormatBallRequirementProducerCount.self, forKey: .producerCount)
        self.ballMode = try c.decode(FormatBallRequirementBallMode.self, forKey: .ballMode)
        self.topology = try c.decodeIfPresent(FormatBallTopology.self, forKey: .topology)
        self.requiresSlotTeamGrouping = try c.decodeIfPresent(Bool.self, forKey: .requiresSlotTeamGrouping)
        self.slotBallCount = try c.decodeIfPresent(FormatBallRequirementSlotBallCount.self, forKey: .slotBallCount)
        self.slotTeamGrouping = try c.decodeIfPresent(FormatBallRequirementSlotTeamGrouping.self, forKey: .slotTeamGrouping)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(producerCount, forKey: .producerCount)
        try c.encode(ballMode, forKey: .ballMode)
        try c.encodeIfPresent(topology, forKey: .topology)
        try c.encodeIfPresent(requiresSlotTeamGrouping, forKey: .requiresSlotTeamGrouping)
        try c.encodeIfPresent(slotBallCount, forKey: .slotBallCount)
        try c.encodeIfPresent(slotTeamGrouping, forKey: .slotTeamGrouping)
    }
}

struct ScoreEntryCapabilities: Codable, Sendable, Equatable {
    var strokes: Bool
    var metadata: [MetadataInput]?

    enum CodingKeys: String, CodingKey {
        case strokes = "strokes"
        case metadata = "metadata"
    }

    init(strokes: Bool, metadata: [MetadataInput]? = nil) {
        self.strokes = strokes
        self.metadata = metadata
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.strokes = try c.decode(Bool.self, forKey: .strokes)
        self.metadata = try c.decodeIfPresent([MetadataInput].self, forKey: .metadata)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(strokes, forKey: .strokes)
        try c.encodeIfPresent(metadata, forKey: .metadata)
    }
}

struct FormatConfigOption: Codable, Sendable, Equatable {
    var value: String
    var labels: FormatLabels
    var hint: FormatLabels?

    enum CodingKeys: String, CodingKey {
        case value = "value"
        case labels = "labels"
        case hint = "hint"
    }

    init(value: String, labels: FormatLabels, hint: FormatLabels? = nil) {
        self.value = value
        self.labels = labels
        self.hint = hint
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.value = try c.decode(String.self, forKey: .value)
        self.labels = try c.decode(FormatLabels.self, forKey: .labels)
        self.hint = try c.decodeIfPresent(FormatLabels.self, forKey: .hint)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(value, forKey: .value)
        try c.encode(labels, forKey: .labels)
        try c.encodeIfPresent(hint, forKey: .hint)
    }
}

enum MetadataInputKind: String, Codable, Sendable, Equatable {
    case number = "number"
    case boolean = "boolean"
}

struct MetadataInput: Codable, Sendable, Equatable {
    var key: String
    var label: String
    var kind: MetadataInputKind
    var appliesWhen: MetadataApplies?

    enum CodingKeys: String, CodingKey {
        case key = "key"
        case label = "label"
        case kind = "kind"
        case appliesWhen = "appliesWhen"
    }

    init(key: String, label: String, kind: MetadataInputKind, appliesWhen: MetadataApplies? = nil) {
        self.key = key
        self.label = label
        self.kind = kind
        self.appliesWhen = appliesWhen
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.key = try c.decode(String.self, forKey: .key)
        self.label = try c.decode(String.self, forKey: .label)
        self.kind = try c.decode(MetadataInputKind.self, forKey: .kind)
        self.appliesWhen = try c.decodeIfPresent(MetadataApplies.self, forKey: .appliesWhen)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(key, forKey: .key)
        try c.encode(label, forKey: .label)
        try c.encode(kind, forKey: .kind)
        try c.encodeIfPresent(appliesWhen, forKey: .appliesWhen)
    }
}

struct MetadataApplies: Codable, Sendable, Equatable {
    var minPar: Double?
    var maxPar: Double?
    var pars: [Double]?
    var holes: [Double]?

    enum CodingKeys: String, CodingKey {
        case minPar = "minPar"
        case maxPar = "maxPar"
        case pars = "pars"
        case holes = "holes"
    }

    init(minPar: Double? = nil, maxPar: Double? = nil, pars: [Double]? = nil, holes: [Double]? = nil) {
        self.minPar = minPar
        self.maxPar = maxPar
        self.pars = pars
        self.holes = holes
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.minPar = try c.decodeIfPresent(Double.self, forKey: .minPar)
        self.maxPar = try c.decodeIfPresent(Double.self, forKey: .maxPar)
        self.pars = try c.decodeIfPresent([Double].self, forKey: .pars)
        self.holes = try c.decodeIfPresent([Double].self, forKey: .holes)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encodeIfPresent(minPar, forKey: .minPar)
        try c.encodeIfPresent(maxPar, forKey: .maxPar)
        try c.encodeIfPresent(pars, forKey: .pars)
        try c.encodeIfPresent(holes, forKey: .holes)
    }
}
