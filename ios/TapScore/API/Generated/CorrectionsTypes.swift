// GENERATED — DO NOT EDIT. bun run generate:swift

import Foundation

enum CorrectionsSetupCorrectionInputTarget: String, Codable, Sendable, Equatable {
    case producerTee = "producer_tee"
    case producerHandicapIndex = "producer_handicap_index"
    case producerCategory = "producer_category"
    case ballComposition = "ball_composition"
    case slotDeclaration = "slot_declaration"
    case ballStrategyConfig = "ball_strategy_config"
    case playHole = "play_hole"
    case playingGroup = "playing_group"
}

struct CorrectionsSetupCorrectionInput: Codable, Sendable, Equatable {
    var roundId: String
    var clientEventId: String
    var target: CorrectionsSetupCorrectionInputTarget
    var targetRef: [String: String]
    var newValue: JSONValue
    var reason: String

    enum CodingKeys: String, CodingKey {
        case roundId = "roundId"
        case clientEventId = "clientEventId"
        case target = "target"
        case targetRef = "targetRef"
        case newValue = "newValue"
        case reason = "reason"
    }

    init(roundId: String, clientEventId: String, target: CorrectionsSetupCorrectionInputTarget, targetRef: [String: String], newValue: JSONValue, reason: String) {
        self.roundId = roundId
        self.clientEventId = clientEventId
        self.target = target
        self.targetRef = targetRef
        self.newValue = newValue
        self.reason = reason
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.roundId = try c.decode(String.self, forKey: .roundId)
        self.clientEventId = try c.decode(String.self, forKey: .clientEventId)
        self.target = try c.decode(CorrectionsSetupCorrectionInputTarget.self, forKey: .target)
        self.targetRef = try c.decode([String: String].self, forKey: .targetRef)
        self.newValue = try c.decode(JSONValue.self, forKey: .newValue)
        self.reason = try c.decode(String.self, forKey: .reason)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(roundId, forKey: .roundId)
        try c.encode(clientEventId, forKey: .clientEventId)
        try c.encode(target, forKey: .target)
        try c.encode(targetRef, forKey: .targetRef)
        try c.encode(newValue, forKey: .newValue)
        try c.encode(reason, forKey: .reason)
    }
}

struct CorrectionsSetupCorrectionOutputOk: Codable, Sendable, Equatable {
    let ok: Bool = true
    var eventId: String
    var version: Double

    enum CodingKeys: String, CodingKey {
        case ok = "ok"
        case eventId = "eventId"
        case version = "version"
    }

    init(eventId: String, version: Double) {
        self.eventId = eventId
        self.version = version
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        _ = try c.decode(Bool.self, forKey: .ok)
        self.eventId = try c.decode(String.self, forKey: .eventId)
        self.version = try c.decode(Double.self, forKey: .version)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(ok, forKey: .ok)
        try c.encode(eventId, forKey: .eventId)
        try c.encode(version, forKey: .version)
    }
}

enum CorrectionsSetupCorrectionOutput: Codable, Sendable, Equatable {
    case ok(CorrectionsSetupCorrectionOutputOk)
    case notOk(CompetitionsCreateRoundOutputNotOkDiagnostics)

    private enum DiscriminantKey: String, CodingKey {
        case discriminant = "ok"
    }

    init(from decoder: any Decoder) throws {
        let tag = try decoder.container(keyedBy: DiscriminantKey.self)
        let discriminant = try tag.decode(Bool.self, forKey: .discriminant)
        switch discriminant {
        case true:
            self = .ok(try CorrectionsSetupCorrectionOutputOk(from: decoder))
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

struct CorrectionsAllowanceOverrideInput: Codable, Sendable, Equatable {
    var roundId: String
    var clientEventId: String
    var reason: String
    var slotDefId: String
    var newConfig: CompetitionDetailDefaultConfigSlotsItemAllowanceConfig

    enum CodingKeys: String, CodingKey {
        case roundId = "roundId"
        case clientEventId = "clientEventId"
        case reason = "reason"
        case slotDefId = "slotDefId"
        case newConfig = "newConfig"
    }

    init(roundId: String, clientEventId: String, reason: String, slotDefId: String, newConfig: CompetitionDetailDefaultConfigSlotsItemAllowanceConfig) {
        self.roundId = roundId
        self.clientEventId = clientEventId
        self.reason = reason
        self.slotDefId = slotDefId
        self.newConfig = newConfig
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.roundId = try c.decode(String.self, forKey: .roundId)
        self.clientEventId = try c.decode(String.self, forKey: .clientEventId)
        self.reason = try c.decode(String.self, forKey: .reason)
        self.slotDefId = try c.decode(String.self, forKey: .slotDefId)
        self.newConfig = try c.decode(CompetitionDetailDefaultConfigSlotsItemAllowanceConfig.self, forKey: .newConfig)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(roundId, forKey: .roundId)
        try c.encode(clientEventId, forKey: .clientEventId)
        try c.encode(reason, forKey: .reason)
        try c.encode(slotDefId, forKey: .slotDefId)
        try c.encode(newConfig, forKey: .newConfig)
    }
}

enum CorrectionsRulingInputTarget: String, Codable, Sendable, Equatable {
    case ballHole = "ball_hole"
    case ballTotal = "ball_total"
    case slotBallResult = "slot_ball_result"
}

enum CorrectionsRulingInputRulingKind: String, Codable, Sendable, Equatable {
    case dq = "dq"
    case penaltyStrokes = "penalty_strokes"
    case holeAdjudication = "hole_adjudication"
    case wd = "wd"
}

struct CorrectionsRulingInput: Codable, Sendable, Equatable {
    var roundId: String
    var clientEventId: String
    var value: JSONValue
    var target: CorrectionsRulingInputTarget
    var reason: String
    var targetId: String
    var rulingKind: CorrectionsRulingInputRulingKind

    enum CodingKeys: String, CodingKey {
        case roundId = "roundId"
        case clientEventId = "clientEventId"
        case value = "value"
        case target = "target"
        case reason = "reason"
        case targetId = "targetId"
        case rulingKind = "rulingKind"
    }

    init(roundId: String, clientEventId: String, value: JSONValue, target: CorrectionsRulingInputTarget, reason: String, targetId: String, rulingKind: CorrectionsRulingInputRulingKind) {
        self.roundId = roundId
        self.clientEventId = clientEventId
        self.value = value
        self.target = target
        self.reason = reason
        self.targetId = targetId
        self.rulingKind = rulingKind
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.roundId = try c.decode(String.self, forKey: .roundId)
        self.clientEventId = try c.decode(String.self, forKey: .clientEventId)
        self.value = try c.decode(JSONValue.self, forKey: .value)
        self.target = try c.decode(CorrectionsRulingInputTarget.self, forKey: .target)
        self.reason = try c.decode(String.self, forKey: .reason)
        self.targetId = try c.decode(String.self, forKey: .targetId)
        self.rulingKind = try c.decode(CorrectionsRulingInputRulingKind.self, forKey: .rulingKind)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(roundId, forKey: .roundId)
        try c.encode(clientEventId, forKey: .clientEventId)
        try c.encode(value, forKey: .value)
        try c.encode(target, forKey: .target)
        try c.encode(reason, forKey: .reason)
        try c.encode(targetId, forKey: .targetId)
        try c.encode(rulingKind, forKey: .rulingKind)
    }
}

struct CorrectionsRulingOutputOk: Codable, Sendable, Equatable {
    let ok: Bool = true
    var id: String

    enum CodingKeys: String, CodingKey {
        case ok = "ok"
        case id = "id"
    }

    init(id: String) {
        self.id = id
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        _ = try c.decode(Bool.self, forKey: .ok)
        self.id = try c.decode(String.self, forKey: .id)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(ok, forKey: .ok)
        try c.encode(id, forKey: .id)
    }
}

enum CorrectionsRulingOutput: Codable, Sendable, Equatable {
    case ok(CorrectionsRulingOutputOk)
    case notOk(CompetitionsCreateRoundOutputNotOkDiagnostics)

    private enum DiscriminantKey: String, CodingKey {
        case discriminant = "ok"
    }

    init(from decoder: any Decoder) throws {
        let tag = try decoder.container(keyedBy: DiscriminantKey.self)
        let discriminant = try tag.decode(Bool.self, forKey: .discriminant)
        switch discriminant {
        case true:
            self = .ok(try CorrectionsRulingOutputOk(from: decoder))
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
