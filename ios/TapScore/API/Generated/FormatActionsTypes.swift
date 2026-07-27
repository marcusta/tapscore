// GENERATED — DO NOT EDIT. bun run generate:swift

import Foundation

struct ConfigDiagnostic: Codable, Sendable, Equatable {
    var code: String
    var message: String
    var path: String?

    enum CodingKeys: String, CodingKey {
        case code = "code"
        case message = "message"
        case path = "path"
    }

    init(code: String, message: String, path: String? = nil) {
        self.code = code
        self.message = message
        self.path = path
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.code = try c.decode(String.self, forKey: .code)
        self.message = try c.decode(String.self, forKey: .message)
        self.path = try c.decodeIfPresent(String.self, forKey: .path)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(code, forKey: .code)
        try c.encode(message, forKey: .message)
        try c.encodeIfPresent(path, forKey: .path)
    }
}

struct FormatActionsAppendInput: Codable, Sendable, Equatable {
    var playHoleId: TriState<String>
    var sequence: Double?
    var schemaVersion: Double?
    var subjectBallId: TriState<String>
    var subjectProducerDefId: TriState<String>
    var supersedesActionId: TriState<String>
    var roundId: String
    var clientEventId: String
    var slotDefId: String
    var actionType: String
    var payload: JSONValue

    enum CodingKeys: String, CodingKey {
        case playHoleId = "playHoleId"
        case sequence = "sequence"
        case schemaVersion = "schemaVersion"
        case subjectBallId = "subjectBallId"
        case subjectProducerDefId = "subjectProducerDefId"
        case supersedesActionId = "supersedesActionId"
        case roundId = "roundId"
        case clientEventId = "clientEventId"
        case slotDefId = "slotDefId"
        case actionType = "actionType"
        case payload = "payload"
    }

    init(playHoleId: TriState<String> = .absent, sequence: Double? = nil, schemaVersion: Double? = nil, subjectBallId: TriState<String> = .absent, subjectProducerDefId: TriState<String> = .absent, supersedesActionId: TriState<String> = .absent, roundId: String, clientEventId: String, slotDefId: String, actionType: String, payload: JSONValue) {
        self.playHoleId = playHoleId
        self.sequence = sequence
        self.schemaVersion = schemaVersion
        self.subjectBallId = subjectBallId
        self.subjectProducerDefId = subjectProducerDefId
        self.supersedesActionId = supersedesActionId
        self.roundId = roundId
        self.clientEventId = clientEventId
        self.slotDefId = slotDefId
        self.actionType = actionType
        self.payload = payload
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        if c.contains(.playHoleId) {
            self.playHoleId = try c.decodeNil(forKey: .playHoleId)
                ? .null
                : .value(try c.decode(String.self, forKey: .playHoleId))
        } else {
            self.playHoleId = .absent
        }
        self.sequence = try c.decodeIfPresent(Double.self, forKey: .sequence)
        self.schemaVersion = try c.decodeIfPresent(Double.self, forKey: .schemaVersion)
        if c.contains(.subjectBallId) {
            self.subjectBallId = try c.decodeNil(forKey: .subjectBallId)
                ? .null
                : .value(try c.decode(String.self, forKey: .subjectBallId))
        } else {
            self.subjectBallId = .absent
        }
        if c.contains(.subjectProducerDefId) {
            self.subjectProducerDefId = try c.decodeNil(forKey: .subjectProducerDefId)
                ? .null
                : .value(try c.decode(String.self, forKey: .subjectProducerDefId))
        } else {
            self.subjectProducerDefId = .absent
        }
        if c.contains(.supersedesActionId) {
            self.supersedesActionId = try c.decodeNil(forKey: .supersedesActionId)
                ? .null
                : .value(try c.decode(String.self, forKey: .supersedesActionId))
        } else {
            self.supersedesActionId = .absent
        }
        self.roundId = try c.decode(String.self, forKey: .roundId)
        self.clientEventId = try c.decode(String.self, forKey: .clientEventId)
        self.slotDefId = try c.decode(String.self, forKey: .slotDefId)
        self.actionType = try c.decode(String.self, forKey: .actionType)
        self.payload = try c.decode(JSONValue.self, forKey: .payload)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        switch playHoleId {
        case .absent: break
        case .null: try c.encodeNil(forKey: .playHoleId)
        case .value(let v): try c.encode(v, forKey: .playHoleId)
        }
        try c.encodeIfPresent(sequence, forKey: .sequence)
        try c.encodeIfPresent(schemaVersion, forKey: .schemaVersion)
        switch subjectBallId {
        case .absent: break
        case .null: try c.encodeNil(forKey: .subjectBallId)
        case .value(let v): try c.encode(v, forKey: .subjectBallId)
        }
        switch subjectProducerDefId {
        case .absent: break
        case .null: try c.encodeNil(forKey: .subjectProducerDefId)
        case .value(let v): try c.encode(v, forKey: .subjectProducerDefId)
        }
        switch supersedesActionId {
        case .absent: break
        case .null: try c.encodeNil(forKey: .supersedesActionId)
        case .value(let v): try c.encode(v, forKey: .supersedesActionId)
        }
        try c.encode(roundId, forKey: .roundId)
        try c.encode(clientEventId, forKey: .clientEventId)
        try c.encode(slotDefId, forKey: .slotDefId)
        try c.encode(actionType, forKey: .actionType)
        try c.encode(payload, forKey: .payload)
    }
}

struct FormatActionsAppendOutputNotOk: Codable, Sendable, Equatable {
    let ok: Bool = false
    var diagnostics: [ConfigDiagnostic]

    enum CodingKeys: String, CodingKey {
        case ok = "ok"
        case diagnostics = "diagnostics"
    }

    init(diagnostics: [ConfigDiagnostic]) {
        self.diagnostics = diagnostics
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        _ = try c.decode(Bool.self, forKey: .ok)
        self.diagnostics = try c.decode([ConfigDiagnostic].self, forKey: .diagnostics)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(ok, forKey: .ok)
        try c.encode(diagnostics, forKey: .diagnostics)
    }
}

enum FormatActionsAppendOutput: Codable, Sendable, Equatable {
    case ok(CorrectionsRulingOutputOk)
    case notOk(FormatActionsAppendOutputNotOk)

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
            self = .notOk(try FormatActionsAppendOutputNotOk(from: decoder))
        }
    }

    func encode(to encoder: any Encoder) throws {
        switch self {
        case .ok(let v): try v.encode(to: encoder)
        case .notOk(let v): try v.encode(to: encoder)
        }
    }
}
