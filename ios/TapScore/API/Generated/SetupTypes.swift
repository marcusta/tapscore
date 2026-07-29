// GENERATED — DO NOT EDIT. bun run generate:swift

import Foundation

struct SetupCourse: Codable, Sendable, Equatable {
    var id: String
    var clubId: String
    var name: String
    var holeCount: Double
    var holes: [Hole]
    var clubName: String

    enum CodingKeys: String, CodingKey {
        case id = "id"
        case clubId = "clubId"
        case name = "name"
        case holeCount = "holeCount"
        case holes = "holes"
        case clubName = "clubName"
    }

    init(id: String, clubId: String, name: String, holeCount: Double, holes: [Hole], clubName: String) {
        self.id = id
        self.clubId = clubId
        self.name = name
        self.holeCount = holeCount
        self.holes = holes
        self.clubName = clubName
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try c.decode(String.self, forKey: .id)
        self.clubId = try c.decode(String.self, forKey: .clubId)
        self.name = try c.decode(String.self, forKey: .name)
        self.holeCount = try c.decode(Double.self, forKey: .holeCount)
        self.holes = try c.decode([Hole].self, forKey: .holes)
        self.clubName = try c.decode(String.self, forKey: .clubName)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encode(clubId, forKey: .clubId)
        try c.encode(name, forKey: .name)
        try c.encode(holeCount, forKey: .holeCount)
        try c.encode(holes, forKey: .holes)
        try c.encode(clubName, forKey: .clubName)
    }
}

struct Tee: Codable, Sendable, Equatable {
    var id: String
    var courseId: String
    var name: String
    var colour: String?
    var holeLengths: [TeeHoleLength]
    var ratings: [TeeRating]

    enum CodingKeys: String, CodingKey {
        case id = "id"
        case courseId = "courseId"
        case name = "name"
        case colour = "colour"
        case holeLengths = "holeLengths"
        case ratings = "ratings"
    }

    init(id: String, courseId: String, name: String, colour: String? = nil, holeLengths: [TeeHoleLength], ratings: [TeeRating]) {
        self.id = id
        self.courseId = courseId
        self.name = name
        self.colour = colour
        self.holeLengths = holeLengths
        self.ratings = ratings
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try c.decode(String.self, forKey: .id)
        self.courseId = try c.decode(String.self, forKey: .courseId)
        self.name = try c.decode(String.self, forKey: .name)
        self.colour = try c.decodeIfPresent(String.self, forKey: .colour)
        self.holeLengths = try c.decode([TeeHoleLength].self, forKey: .holeLengths)
        self.ratings = try c.decode([TeeRating].self, forKey: .ratings)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encode(courseId, forKey: .courseId)
        try c.encode(name, forKey: .name)
        if let colour {
            try c.encode(colour, forKey: .colour)
        } else {
            try c.encodeNil(forKey: .colour)
        }
        try c.encode(holeLengths, forKey: .holeLengths)
        try c.encode(ratings, forKey: .ratings)
    }
}

struct AggregationDescriptorConfigFieldsItemSelectOptionsItem: Codable, Sendable, Equatable {
    var value: String
    var label: String

    enum CodingKeys: String, CodingKey {
        case value = "value"
        case label = "label"
    }

    init(value: String, label: String) {
        self.value = value
        self.label = label
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.value = try c.decode(String.self, forKey: .value)
        self.label = try c.decode(String.self, forKey: .label)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(value, forKey: .value)
        try c.encode(label, forKey: .label)
    }
}

struct AggregationDescriptorConfigFieldsItemSelect: Codable, Sendable, Equatable {
    let kind: String = "select"
    var key: String
    var label: String
    var options: [AggregationDescriptorConfigFieldsItemSelectOptionsItem]
    var `default`: String

    enum CodingKeys: String, CodingKey {
        case kind = "kind"
        case key = "key"
        case label = "label"
        case options = "options"
        case `default` = "default"
    }

    init(key: String, label: String, options: [AggregationDescriptorConfigFieldsItemSelectOptionsItem], `default`: String) {
        self.key = key
        self.label = label
        self.options = options
        self.`default` = `default`
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        _ = try c.decode(String.self, forKey: .kind)
        self.key = try c.decode(String.self, forKey: .key)
        self.label = try c.decode(String.self, forKey: .label)
        self.options = try c.decode([AggregationDescriptorConfigFieldsItemSelectOptionsItem].self, forKey: .options)
        self.`default` = try c.decode(String.self, forKey: .`default`)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(kind, forKey: .kind)
        try c.encode(key, forKey: .key)
        try c.encode(label, forKey: .label)
        try c.encode(options, forKey: .options)
        try c.encode(`default`, forKey: .`default`)
    }
}

struct AggregationDescriptorConfigFieldsItemInteger: Codable, Sendable, Equatable {
    let kind: String = "integer"
    var key: String
    var label: String
    var `default`: Double
    var min: Double?

    enum CodingKeys: String, CodingKey {
        case kind = "kind"
        case key = "key"
        case label = "label"
        case `default` = "default"
        case min = "min"
    }

    init(key: String, label: String, `default`: Double, min: Double? = nil) {
        self.key = key
        self.label = label
        self.`default` = `default`
        self.min = min
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        _ = try c.decode(String.self, forKey: .kind)
        self.key = try c.decode(String.self, forKey: .key)
        self.label = try c.decode(String.self, forKey: .label)
        self.`default` = try c.decode(Double.self, forKey: .`default`)
        self.min = try c.decodeIfPresent(Double.self, forKey: .min)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(kind, forKey: .kind)
        try c.encode(key, forKey: .key)
        try c.encode(label, forKey: .label)
        try c.encode(`default`, forKey: .`default`)
        try c.encodeIfPresent(min, forKey: .min)
    }
}

enum AggregationDescriptorConfigFieldsItem: Codable, Sendable, Equatable {
    case select(AggregationDescriptorConfigFieldsItemSelect)
    case integer(AggregationDescriptorConfigFieldsItemInteger)

    private enum DiscriminantKey: String, CodingKey {
        case discriminant = "kind"
    }

    init(from decoder: any Decoder) throws {
        let tag = try decoder.container(keyedBy: DiscriminantKey.self)
        let discriminant = try tag.decode(String.self, forKey: .discriminant)
        switch discriminant {
        case "select":
            self = .select(try AggregationDescriptorConfigFieldsItemSelect(from: decoder))
        case "integer":
            self = .integer(try AggregationDescriptorConfigFieldsItemInteger(from: decoder))
        default:
            throw DecodingError.dataCorrupted(.init(
                codingPath: decoder.codingPath,
                debugDescription: "unknown kind: \(discriminant)"))
        }
    }

    func encode(to encoder: any Encoder) throws {
        switch self {
        case .select(let v): try v.encode(to: encoder)
        case .integer(let v): try v.encode(to: encoder)
        }
    }
}

struct AggregationDescriptor: Codable, Sendable, Equatable {
    var id: String
    var label: String
    var labels: AggregationLabels
    var description: String
    var configFields: [AggregationDescriptorConfigFieldsItem]?

    enum CodingKeys: String, CodingKey {
        case id = "id"
        case label = "label"
        case labels = "labels"
        case description = "description"
        case configFields = "configFields"
    }

    init(id: String, label: String, labels: AggregationLabels, description: String, configFields: [AggregationDescriptorConfigFieldsItem]? = nil) {
        self.id = id
        self.label = label
        self.labels = labels
        self.description = description
        self.configFields = configFields
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try c.decode(String.self, forKey: .id)
        self.label = try c.decode(String.self, forKey: .label)
        self.labels = try c.decode(AggregationLabels.self, forKey: .labels)
        self.description = try c.decode(String.self, forKey: .description)
        self.configFields = try c.decodeIfPresent([AggregationDescriptorConfigFieldsItem].self, forKey: .configFields)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encode(label, forKey: .label)
        try c.encode(labels, forKey: .labels)
        try c.encode(description, forKey: .description)
        try c.encodeIfPresent(configFields, forKey: .configFields)
    }
}

struct TeeHoleLength: Codable, Sendable, Equatable {
    var holeNumber: Double
    var lengthM: Double
    var strokeIndexOverride: Double?

    enum CodingKeys: String, CodingKey {
        case holeNumber = "holeNumber"
        case lengthM = "lengthM"
        case strokeIndexOverride = "strokeIndexOverride"
    }

    init(holeNumber: Double, lengthM: Double, strokeIndexOverride: Double? = nil) {
        self.holeNumber = holeNumber
        self.lengthM = lengthM
        self.strokeIndexOverride = strokeIndexOverride
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.holeNumber = try c.decode(Double.self, forKey: .holeNumber)
        self.lengthM = try c.decode(Double.self, forKey: .lengthM)
        self.strokeIndexOverride = try c.decodeIfPresent(Double.self, forKey: .strokeIndexOverride)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(holeNumber, forKey: .holeNumber)
        try c.encode(lengthM, forKey: .lengthM)
        if let strokeIndexOverride {
            try c.encode(strokeIndexOverride, forKey: .strokeIndexOverride)
        } else {
            try c.encodeNil(forKey: .strokeIndexOverride)
        }
    }
}

struct TeeRating: Codable, Sendable, Equatable {
    var gender: PlayerGender
    var courseRating: Double
    var slope: Double
    var par: Double
    var totalLengthM: Double

    enum CodingKeys: String, CodingKey {
        case gender = "gender"
        case courseRating = "courseRating"
        case slope = "slope"
        case par = "par"
        case totalLengthM = "totalLengthM"
    }

    init(gender: PlayerGender, courseRating: Double, slope: Double, par: Double, totalLengthM: Double) {
        self.gender = gender
        self.courseRating = courseRating
        self.slope = slope
        self.par = par
        self.totalLengthM = totalLengthM
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.gender = try c.decode(PlayerGender.self, forKey: .gender)
        self.courseRating = try c.decode(Double.self, forKey: .courseRating)
        self.slope = try c.decode(Double.self, forKey: .slope)
        self.par = try c.decode(Double.self, forKey: .par)
        self.totalLengthM = try c.decode(Double.self, forKey: .totalLengthM)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(gender, forKey: .gender)
        try c.encode(courseRating, forKey: .courseRating)
        try c.encode(slope, forKey: .slope)
        try c.encode(par, forKey: .par)
        try c.encode(totalLengthM, forKey: .totalLengthM)
    }
}

struct AggregationLabels: Codable, Sendable, Equatable {
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
