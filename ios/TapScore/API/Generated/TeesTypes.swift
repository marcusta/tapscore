// GENERATED — DO NOT EDIT. bun run generate:swift

import Foundation

struct TeesCreateInputHoleLengthsItem: Codable, Sendable, Equatable {
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

struct TeesCreateInputRatingsItem: Codable, Sendable, Equatable {
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

struct TeesCreateInput: Codable, Sendable, Equatable {
    var courseId: String
    var name: String
    var colour: TriState<String>
    var holeLengths: [TeesCreateInputHoleLengthsItem]
    var ratings: [TeesCreateInputRatingsItem]

    enum CodingKeys: String, CodingKey {
        case courseId = "courseId"
        case name = "name"
        case colour = "colour"
        case holeLengths = "holeLengths"
        case ratings = "ratings"
    }

    init(courseId: String, name: String, colour: TriState<String> = .absent, holeLengths: [TeesCreateInputHoleLengthsItem], ratings: [TeesCreateInputRatingsItem]) {
        self.courseId = courseId
        self.name = name
        self.colour = colour
        self.holeLengths = holeLengths
        self.ratings = ratings
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.courseId = try c.decode(String.self, forKey: .courseId)
        self.name = try c.decode(String.self, forKey: .name)
        if c.contains(.colour) {
            self.colour = try c.decodeNil(forKey: .colour)
                ? .null
                : .value(try c.decode(String.self, forKey: .colour))
        } else {
            self.colour = .absent
        }
        self.holeLengths = try c.decode([TeesCreateInputHoleLengthsItem].self, forKey: .holeLengths)
        self.ratings = try c.decode([TeesCreateInputRatingsItem].self, forKey: .ratings)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(courseId, forKey: .courseId)
        try c.encode(name, forKey: .name)
        switch colour {
        case .absent: break
        case .null: try c.encodeNil(forKey: .colour)
        case .value(let v): try c.encode(v, forKey: .colour)
        }
        try c.encode(holeLengths, forKey: .holeLengths)
        try c.encode(ratings, forKey: .ratings)
    }
}

struct TeesUpdateInput: Codable, Sendable, Equatable {
    var id: String
    var name: String?
    var colour: TriState<String>
    var holeLengths: [TeesCreateInputHoleLengthsItem]?
    var ratings: [TeesCreateInputRatingsItem]?

    enum CodingKeys: String, CodingKey {
        case id = "id"
        case name = "name"
        case colour = "colour"
        case holeLengths = "holeLengths"
        case ratings = "ratings"
    }

    init(id: String, name: String? = nil, colour: TriState<String> = .absent, holeLengths: [TeesCreateInputHoleLengthsItem]? = nil, ratings: [TeesCreateInputRatingsItem]? = nil) {
        self.id = id
        self.name = name
        self.colour = colour
        self.holeLengths = holeLengths
        self.ratings = ratings
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try c.decode(String.self, forKey: .id)
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
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encodeIfPresent(name, forKey: .name)
        switch colour {
        case .absent: break
        case .null: try c.encodeNil(forKey: .colour)
        case .value(let v): try c.encode(v, forKey: .colour)
        }
        try c.encodeIfPresent(holeLengths, forKey: .holeLengths)
        try c.encodeIfPresent(ratings, forKey: .ratings)
    }
}
