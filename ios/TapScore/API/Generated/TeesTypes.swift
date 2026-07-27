// GENERATED — DO NOT EDIT. bun run generate:swift

import Foundation

struct TeesCreateInputHoleLengthsItem: Codable, Sendable, Equatable {
    var lengthM: Double
    var strokeIndexOverride: Double?
    var holeNumber: Double

    enum CodingKeys: String, CodingKey {
        case lengthM = "lengthM"
        case strokeIndexOverride = "strokeIndexOverride"
        case holeNumber = "holeNumber"
    }

    init(lengthM: Double, strokeIndexOverride: Double? = nil, holeNumber: Double) {
        self.lengthM = lengthM
        self.strokeIndexOverride = strokeIndexOverride
        self.holeNumber = holeNumber
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.lengthM = try c.decode(Double.self, forKey: .lengthM)
        self.strokeIndexOverride = try c.decodeIfPresent(Double.self, forKey: .strokeIndexOverride)
        self.holeNumber = try c.decode(Double.self, forKey: .holeNumber)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(lengthM, forKey: .lengthM)
        if let strokeIndexOverride {
            try c.encode(strokeIndexOverride, forKey: .strokeIndexOverride)
        } else {
            try c.encodeNil(forKey: .strokeIndexOverride)
        }
        try c.encode(holeNumber, forKey: .holeNumber)
    }
}

struct TeesCreateInputRatingsItem: Codable, Sendable, Equatable {
    var gender: PlayerGender
    var par: Double
    var courseRating: Double
    var slope: Double
    var totalLengthM: Double

    enum CodingKeys: String, CodingKey {
        case gender = "gender"
        case par = "par"
        case courseRating = "courseRating"
        case slope = "slope"
        case totalLengthM = "totalLengthM"
    }

    init(gender: PlayerGender, par: Double, courseRating: Double, slope: Double, totalLengthM: Double) {
        self.gender = gender
        self.par = par
        self.courseRating = courseRating
        self.slope = slope
        self.totalLengthM = totalLengthM
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.gender = try c.decode(PlayerGender.self, forKey: .gender)
        self.par = try c.decode(Double.self, forKey: .par)
        self.courseRating = try c.decode(Double.self, forKey: .courseRating)
        self.slope = try c.decode(Double.self, forKey: .slope)
        self.totalLengthM = try c.decode(Double.self, forKey: .totalLengthM)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(gender, forKey: .gender)
        try c.encode(par, forKey: .par)
        try c.encode(courseRating, forKey: .courseRating)
        try c.encode(slope, forKey: .slope)
        try c.encode(totalLengthM, forKey: .totalLengthM)
    }
}

struct TeesCreateInput: Codable, Sendable, Equatable {
    var colour: TriState<String>
    var name: String
    var courseId: String
    var holeLengths: [TeesCreateInputHoleLengthsItem]
    var ratings: [TeesCreateInputRatingsItem]

    enum CodingKeys: String, CodingKey {
        case colour = "colour"
        case name = "name"
        case courseId = "courseId"
        case holeLengths = "holeLengths"
        case ratings = "ratings"
    }

    init(colour: TriState<String> = .absent, name: String, courseId: String, holeLengths: [TeesCreateInputHoleLengthsItem], ratings: [TeesCreateInputRatingsItem]) {
        self.colour = colour
        self.name = name
        self.courseId = courseId
        self.holeLengths = holeLengths
        self.ratings = ratings
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        if c.contains(.colour) {
            self.colour = try c.decodeNil(forKey: .colour)
                ? .null
                : .value(try c.decode(String.self, forKey: .colour))
        } else {
            self.colour = .absent
        }
        self.name = try c.decode(String.self, forKey: .name)
        self.courseId = try c.decode(String.self, forKey: .courseId)
        self.holeLengths = try c.decode([TeesCreateInputHoleLengthsItem].self, forKey: .holeLengths)
        self.ratings = try c.decode([TeesCreateInputRatingsItem].self, forKey: .ratings)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        switch colour {
        case .absent: break
        case .null: try c.encodeNil(forKey: .colour)
        case .value(let v): try c.encode(v, forKey: .colour)
        }
        try c.encode(name, forKey: .name)
        try c.encode(courseId, forKey: .courseId)
        try c.encode(holeLengths, forKey: .holeLengths)
        try c.encode(ratings, forKey: .ratings)
    }
}

struct TeesUpdateInput: Codable, Sendable, Equatable {
    var name: String?
    var colour: TriState<String>
    var holeLengths: [TeesCreateInputHoleLengthsItem]?
    var ratings: [TeesCreateInputRatingsItem]?
    var id: String

    enum CodingKeys: String, CodingKey {
        case name = "name"
        case colour = "colour"
        case holeLengths = "holeLengths"
        case ratings = "ratings"
        case id = "id"
    }

    init(name: String? = nil, colour: TriState<String> = .absent, holeLengths: [TeesCreateInputHoleLengthsItem]? = nil, ratings: [TeesCreateInputRatingsItem]? = nil, id: String) {
        self.name = name
        self.colour = colour
        self.holeLengths = holeLengths
        self.ratings = ratings
        self.id = id
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.name = try c.decodeIfPresent(String.self, forKey: .name)
        if c.contains(.colour) {
            self.colour = try c.decodeNil(forKey: .colour)
                ? .null
                : .value(try c.decode(String.self, forKey: .colour))
        } else {
            self.colour = .absent
        }
        self.holeLengths = try c.decodeIfPresent([TeesCreateInputHoleLengthsItem].self, forKey: .holeLengths)
        self.ratings = try c.decodeIfPresent([TeesCreateInputRatingsItem].self, forKey: .ratings)
        self.id = try c.decode(String.self, forKey: .id)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encodeIfPresent(name, forKey: .name)
        switch colour {
        case .absent: break
        case .null: try c.encodeNil(forKey: .colour)
        case .value(let v): try c.encode(v, forKey: .colour)
        }
        try c.encodeIfPresent(holeLengths, forKey: .holeLengths)
        try c.encodeIfPresent(ratings, forKey: .ratings)
        try c.encode(id, forKey: .id)
    }
}
