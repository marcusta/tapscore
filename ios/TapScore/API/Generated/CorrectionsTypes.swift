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
    var target: CorrectionsSetupCorrectionInputTarget
    var targetRef: [String: String]
    var newValue: JSONValue
    var reason: String
    var clientEventId: String

    enum CodingKeys: String, CodingKey {
        case roundId = "roundId"
        case target = "target"
        case targetRef = "targetRef"
        case newValue = "newValue"
        case reason = "reason"
        case clientEventId = "clientEventId"
    }

    init(roundId: String, target: CorrectionsSetupCorrectionInputTarget, targetRef: [String: String], newValue: JSONValue, reason: String, clientEventId: String) {
        self.roundId = roundId
        self.target = target
        self.targetRef = targetRef
        self.newValue = newValue
        self.reason = reason
        self.clientEventId = clientEventId
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.roundId = try c.decode(String.self, forKey: .roundId)
        self.target = try c.decode(CorrectionsSetupCorrectionInputTarget.self, forKey: .target)
        self.targetRef = try c.decode([String: String].self, forKey: .targetRef)
        self.newValue = try c.decode(JSONValue.self, forKey: .newValue)
        self.reason = try c.decode(String.self, forKey: .reason)
        self.clientEventId = try c.decode(String.self, forKey: .clientEventId)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(roundId, forKey: .roundId)
        try c.encode(target, forKey: .target)
        try c.encode(targetRef, forKey: .targetRef)
        try c.encode(newValue, forKey: .newValue)
        try c.encode(reason, forKey: .reason)
        try c.encode(clientEventId, forKey: .clientEventId)
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
    var slotDefId: String
    var newConfig: CompetitionDetailDefaultConfigSlotsItemAllowanceConfig
    var reason: String
    var clientEventId: String

    enum CodingKeys: String, CodingKey {
        case roundId = "roundId"
        case slotDefId = "slotDefId"
        case newConfig = "newConfig"
        case reason = "reason"
        case clientEventId = "clientEventId"
    }

    init(roundId: String, slotDefId: String, newConfig: CompetitionDetailDefaultConfigSlotsItemAllowanceConfig, reason: String, clientEventId: String) {
        self.roundId = roundId
        self.slotDefId = slotDefId
        self.newConfig = newConfig
        self.reason = reason
        self.clientEventId = clientEventId
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.roundId = try c.decode(String.self, forKey: .roundId)
        self.slotDefId = try c.decode(String.self, forKey: .slotDefId)
        self.newConfig = try c.decode(CompetitionDetailDefaultConfigSlotsItemAllowanceConfig.self, forKey: .newConfig)
        self.reason = try c.decode(String.self, forKey: .reason)
        self.clientEventId = try c.decode(String.self, forKey: .clientEventId)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(roundId, forKey: .roundId)
        try c.encode(slotDefId, forKey: .slotDefId)
        try c.encode(newConfig, forKey: .newConfig)
        try c.encode(reason, forKey: .reason)
        try c.encode(clientEventId, forKey: .clientEventId)
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
    var target: CorrectionsRulingInputTarget
    var targetId: String
    var rulingKind: CorrectionsRulingInputRulingKind
    var value: JSONValue
    var reason: String
    var clientEventId: String

    enum CodingKeys: String, CodingKey {
        case roundId = "roundId"
        case target = "target"
        case targetId = "targetId"
        case rulingKind = "rulingKind"
        case value = "value"
        case reason = "reason"
        case clientEventId = "clientEventId"
    }

    init(roundId: String, target: CorrectionsRulingInputTarget, targetId: String, rulingKind: CorrectionsRulingInputRulingKind, value: JSONValue, reason: String, clientEventId: String) {
        self.roundId = roundId
        self.target = target
        self.targetId = targetId
        self.rulingKind = rulingKind
        self.value = value
        self.reason = reason
        self.clientEventId = clientEventId
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.roundId = try c.decode(String.self, forKey: .roundId)
        self.target = try c.decode(CorrectionsRulingInputTarget.self, forKey: .target)
        self.targetId = try c.decode(String.self, forKey: .targetId)
        self.rulingKind = try c.decode(CorrectionsRulingInputRulingKind.self, forKey: .rulingKind)
        self.value = try c.decode(JSONValue.self, forKey: .value)
        self.reason = try c.decode(String.self, forKey: .reason)
        self.clientEventId = try c.decode(String.self, forKey: .clientEventId)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(roundId, forKey: .roundId)
        try c.encode(target, forKey: .target)
        try c.encode(targetId, forKey: .targetId)
        try c.encode(rulingKind, forKey: .rulingKind)
        try c.encode(value, forKey: .value)
        try c.encode(reason, forKey: .reason)
        try c.encode(clientEventId, forKey: .clientEventId)
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
