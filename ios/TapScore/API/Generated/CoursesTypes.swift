// GENERATED — DO NOT EDIT. bun run generate:swift

import Foundation

struct Course: Codable, Sendable, Equatable {
    var id: String
    var clubId: String
    var name: String
    var holeCount: Double
    var latitude: Double?
    var longitude: Double?
    var holes: [Hole]

    enum CodingKeys: String, CodingKey {
        case id = "id"
        case clubId = "clubId"
        case name = "name"
        case holeCount = "holeCount"
        case latitude = "latitude"
        case longitude = "longitude"
        case holes = "holes"
    }

    init(id: String, clubId: String, name: String, holeCount: Double, latitude: Double? = nil, longitude: Double? = nil, holes: [Hole]) {
        self.id = id
        self.clubId = clubId
        self.name = name
        self.holeCount = holeCount
        self.latitude = latitude
        self.longitude = longitude
        self.holes = holes
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try c.decode(String.self, forKey: .id)
        self.clubId = try c.decode(String.self, forKey: .clubId)
        self.name = try c.decode(String.self, forKey: .name)
        self.holeCount = try c.decode(Double.self, forKey: .holeCount)
        self.latitude = try c.decodeIfPresent(Double.self, forKey: .latitude)
        self.longitude = try c.decodeIfPresent(Double.self, forKey: .longitude)
        self.holes = try c.decode([Hole].self, forKey: .holes)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encode(clubId, forKey: .clubId)
        try c.encode(name, forKey: .name)
        try c.encode(holeCount, forKey: .holeCount)
        if let latitude {
            try c.encode(latitude, forKey: .latitude)
        } else {
            try c.encodeNil(forKey: .latitude)
        }
        if let longitude {
            try c.encode(longitude, forKey: .longitude)
        } else {
            try c.encodeNil(forKey: .longitude)
        }
        try c.encode(holes, forKey: .holes)
    }
}

struct ClubCourse: Codable, Sendable, Equatable {
    var id: String
    var clubId: String
    var name: String
    var holeCount: Double
    var latitude: Double?
    var longitude: Double?
    var holes: [Hole]
    var teeCount: Double

    enum CodingKeys: String, CodingKey {
        case id = "id"
        case clubId = "clubId"
        case name = "name"
        case holeCount = "holeCount"
        case latitude = "latitude"
        case longitude = "longitude"
        case holes = "holes"
        case teeCount = "teeCount"
    }

    init(id: String, clubId: String, name: String, holeCount: Double, latitude: Double? = nil, longitude: Double? = nil, holes: [Hole], teeCount: Double) {
        self.id = id
        self.clubId = clubId
        self.name = name
        self.holeCount = holeCount
        self.latitude = latitude
        self.longitude = longitude
        self.holes = holes
        self.teeCount = teeCount
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try c.decode(String.self, forKey: .id)
        self.clubId = try c.decode(String.self, forKey: .clubId)
        self.name = try c.decode(String.self, forKey: .name)
        self.holeCount = try c.decode(Double.self, forKey: .holeCount)
        self.latitude = try c.decodeIfPresent(Double.self, forKey: .latitude)
        self.longitude = try c.decodeIfPresent(Double.self, forKey: .longitude)
        self.holes = try c.decode([Hole].self, forKey: .holes)
        self.teeCount = try c.decode(Double.self, forKey: .teeCount)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encode(clubId, forKey: .clubId)
        try c.encode(name, forKey: .name)
        try c.encode(holeCount, forKey: .holeCount)
        if let latitude {
            try c.encode(latitude, forKey: .latitude)
        } else {
            try c.encodeNil(forKey: .latitude)
        }
        if let longitude {
            try c.encode(longitude, forKey: .longitude)
        } else {
            try c.encodeNil(forKey: .longitude)
        }
        try c.encode(holes, forKey: .holes)
        try c.encode(teeCount, forKey: .teeCount)
    }
}

struct TeeRole: Codable, Sendable, Equatable {
    var roleKey: String
    var displayName: String
    var sortOrder: Double

    enum CodingKeys: String, CodingKey {
        case roleKey = "roleKey"
        case displayName = "displayName"
        case sortOrder = "sortOrder"
    }

    init(roleKey: String, displayName: String, sortOrder: Double) {
        self.roleKey = roleKey
        self.displayName = displayName
        self.sortOrder = sortOrder
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.roleKey = try c.decode(String.self, forKey: .roleKey)
        self.displayName = try c.decode(String.self, forKey: .displayName)
        self.sortOrder = try c.decode(Double.self, forKey: .sortOrder)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(roleKey, forKey: .roleKey)
        try c.encode(displayName, forKey: .displayName)
        try c.encode(sortOrder, forKey: .sortOrder)
    }
}

struct CourseTeeRole: Codable, Sendable, Equatable {
    var courseId: String
    var roleKey: String
    var gender: PlayerGender
    var teeId: String

    enum CodingKeys: String, CodingKey {
        case courseId = "courseId"
        case roleKey = "roleKey"
        case gender = "gender"
        case teeId = "teeId"
    }

    init(courseId: String, roleKey: String, gender: PlayerGender, teeId: String) {
        self.courseId = courseId
        self.roleKey = roleKey
        self.gender = gender
        self.teeId = teeId
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.courseId = try c.decode(String.self, forKey: .courseId)
        self.roleKey = try c.decode(String.self, forKey: .roleKey)
        self.gender = try c.decode(PlayerGender.self, forKey: .gender)
        self.teeId = try c.decode(String.self, forKey: .teeId)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(courseId, forKey: .courseId)
        try c.encode(roleKey, forKey: .roleKey)
        try c.encode(gender, forKey: .gender)
        try c.encode(teeId, forKey: .teeId)
    }
}

struct CourseValidation: Codable, Sendable, Equatable {
    var ok: Bool
    var issues: [CourseIssue]

    enum CodingKeys: String, CodingKey {
        case ok = "ok"
        case issues = "issues"
    }

    init(ok: Bool, issues: [CourseIssue]) {
        self.ok = ok
        self.issues = issues
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.ok = try c.decode(Bool.self, forKey: .ok)
        self.issues = try c.decode([CourseIssue].self, forKey: .issues)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(ok, forKey: .ok)
        try c.encode(issues, forKey: .issues)
    }
}

struct Hole: Codable, Sendable, Equatable {
    var holeNumber: Double
    var par: Double
    var strokeIndex: Double

    enum CodingKeys: String, CodingKey {
        case holeNumber = "holeNumber"
        case par = "par"
        case strokeIndex = "strokeIndex"
    }

    init(holeNumber: Double, par: Double, strokeIndex: Double) {
        self.holeNumber = holeNumber
        self.par = par
        self.strokeIndex = strokeIndex
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.holeNumber = try c.decode(Double.self, forKey: .holeNumber)
        self.par = try c.decode(Double.self, forKey: .par)
        self.strokeIndex = try c.decode(Double.self, forKey: .strokeIndex)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(holeNumber, forKey: .holeNumber)
        try c.encode(par, forKey: .par)
        try c.encode(strokeIndex, forKey: .strokeIndex)
    }
}

enum CourseIssueSeverity: String, Codable, Sendable, Equatable {
    case warning = "warning"
    case error = "error"
}

enum CourseIssueCode: String, Codable, Sendable, Equatable {
    case missingHoles = "missing_holes"
    case unexpectedHoles = "unexpected_holes"
    case duplicateStrokeIndex = "duplicate_stroke_index"
    case missingStrokeIndices = "missing_stroke_indices"
    case strokeIndexOutOfRange = "stroke_index_out_of_range"
    case unusualPar = "unusual_par"
}

struct CourseIssue: Codable, Sendable, Equatable {
    var severity: CourseIssueSeverity
    var code: CourseIssueCode
    var message: String
    var holeNumbers: [Double]?

    enum CodingKeys: String, CodingKey {
        case severity = "severity"
        case code = "code"
        case message = "message"
        case holeNumbers = "holeNumbers"
    }

    init(severity: CourseIssueSeverity, code: CourseIssueCode, message: String, holeNumbers: [Double]? = nil) {
        self.severity = severity
        self.code = code
        self.message = message
        self.holeNumbers = holeNumbers
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.severity = try c.decode(CourseIssueSeverity.self, forKey: .severity)
        self.code = try c.decode(CourseIssueCode.self, forKey: .code)
        self.message = try c.decode(String.self, forKey: .message)
        self.holeNumbers = try c.decodeIfPresent([Double].self, forKey: .holeNumbers)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(severity, forKey: .severity)
        try c.encode(code, forKey: .code)
        try c.encode(message, forKey: .message)
        try c.encodeIfPresent(holeNumbers, forKey: .holeNumbers)
    }
}

struct CoursesListByClubInput: Codable, Sendable, Equatable {
    var clubId: String

    enum CodingKeys: String, CodingKey {
        case clubId = "clubId"
    }

    init(clubId: String) {
        self.clubId = clubId
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.clubId = try c.decode(String.self, forKey: .clubId)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(clubId, forKey: .clubId)
    }
}

struct CoursesCreateInputHolesItem: Codable, Sendable, Equatable {
    var holeNumber: Double
    var par: Double
    var strokeIndex: Double

    enum CodingKeys: String, CodingKey {
        case holeNumber = "holeNumber"
        case par = "par"
        case strokeIndex = "strokeIndex"
    }

    init(holeNumber: Double, par: Double, strokeIndex: Double) {
        self.holeNumber = holeNumber
        self.par = par
        self.strokeIndex = strokeIndex
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.holeNumber = try c.decode(Double.self, forKey: .holeNumber)
        self.par = try c.decode(Double.self, forKey: .par)
        self.strokeIndex = try c.decode(Double.self, forKey: .strokeIndex)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(holeNumber, forKey: .holeNumber)
        try c.encode(par, forKey: .par)
        try c.encode(strokeIndex, forKey: .strokeIndex)
    }
}

struct CoursesCreateInput: Codable, Sendable, Equatable {
    var clubId: String
    var name: String
    var holeCount: Double
    var holes: [CoursesCreateInputHolesItem]?
    var latitude: TriState<Double>
    var longitude: TriState<Double>

    enum CodingKeys: String, CodingKey {
        case clubId = "clubId"
        case name = "name"
        case holeCount = "holeCount"
        case holes = "holes"
        case latitude = "latitude"
        case longitude = "longitude"
    }

    init(clubId: String, name: String, holeCount: Double, holes: [CoursesCreateInputHolesItem]? = nil, latitude: TriState<Double> = .absent, longitude: TriState<Double> = .absent) {
        self.clubId = clubId
        self.name = name
        self.holeCount = holeCount
        self.holes = holes
        self.latitude = latitude
        self.longitude = longitude
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.clubId = try c.decode(String.self, forKey: .clubId)
        self.name = try c.decode(String.self, forKey: .name)
        self.holeCount = try c.decode(Double.self, forKey: .holeCount)
        self.holes = try c.decodeIfPresent([CoursesCreateInputHolesItem].self, forKey: .holes)
        if c.contains(.latitude) {
            self.latitude = try c.decodeNil(forKey: .latitude)
                ? .null
                : .value(try c.decode(Double.self, forKey: .latitude))
        } else {
            self.latitude = .absent
        }
        if c.contains(.longitude) {
            self.longitude = try c.decodeNil(forKey: .longitude)
                ? .null
                : .value(try c.decode(Double.self, forKey: .longitude))
        } else {
            self.longitude = .absent
        }
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(clubId, forKey: .clubId)
        try c.encode(name, forKey: .name)
        try c.encode(holeCount, forKey: .holeCount)
        try c.encodeIfPresent(holes, forKey: .holes)
        switch latitude {
        case .absent: break
        case .null: try c.encodeNil(forKey: .latitude)
        case .value(let v): try c.encode(v, forKey: .latitude)
        }
        switch longitude {
        case .absent: break
        case .null: try c.encodeNil(forKey: .longitude)
        case .value(let v): try c.encode(v, forKey: .longitude)
        }
    }
}

struct CoursesUpdateInput: Codable, Sendable, Equatable {
    var id: String
    var name: String?
    var holeCount: Double?
    var holes: [CoursesCreateInputHolesItem]?
    var latitude: TriState<Double>
    var longitude: TriState<Double>

    enum CodingKeys: String, CodingKey {
        case id = "id"
        case name = "name"
        case holeCount = "holeCount"
        case holes = "holes"
        case latitude = "latitude"
        case longitude = "longitude"
    }

    init(id: String, name: String? = nil, holeCount: Double? = nil, holes: [CoursesCreateInputHolesItem]? = nil, latitude: TriState<Double> = .absent, longitude: TriState<Double> = .absent) {
        self.id = id
        self.name = name
        self.holeCount = holeCount
        self.holes = holes
        self.latitude = latitude
        self.longitude = longitude
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try c.decode(String.self, forKey: .id)
        self.name = try c.decodeIfPresent(String.self, forKey: .name)
        self.holeCount = try c.decodeIfPresent(Double.self, forKey: .holeCount)
        self.holes = try c.decodeIfPresent([CoursesCreateInputHolesItem].self, forKey: .holes)
        if c.contains(.latitude) {
            self.latitude = try c.decodeNil(forKey: .latitude)
                ? .null
                : .value(try c.decode(Double.self, forKey: .latitude))
        } else {
            self.latitude = .absent
        }
        if c.contains(.longitude) {
            self.longitude = try c.decodeNil(forKey: .longitude)
                ? .null
                : .value(try c.decode(Double.self, forKey: .longitude))
        } else {
            self.longitude = .absent
        }
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encodeIfPresent(name, forKey: .name)
        try c.encodeIfPresent(holeCount, forKey: .holeCount)
        try c.encodeIfPresent(holes, forKey: .holes)
        switch latitude {
        case .absent: break
        case .null: try c.encodeNil(forKey: .latitude)
        case .value(let v): try c.encode(v, forKey: .latitude)
        }
        switch longitude {
        case .absent: break
        case .null: try c.encodeNil(forKey: .longitude)
        case .value(let v): try c.encode(v, forKey: .longitude)
        }
    }
}

struct CoursesUpdateHoleInput: Codable, Sendable, Equatable {
    var courseId: String
    var holeNumber: Double
    var par: Double?
    var strokeIndex: Double?

    enum CodingKeys: String, CodingKey {
        case courseId = "courseId"
        case holeNumber = "holeNumber"
        case par = "par"
        case strokeIndex = "strokeIndex"
    }

    init(courseId: String, holeNumber: Double, par: Double? = nil, strokeIndex: Double? = nil) {
        self.courseId = courseId
        self.holeNumber = holeNumber
        self.par = par
        self.strokeIndex = strokeIndex
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.courseId = try c.decode(String.self, forKey: .courseId)
        self.holeNumber = try c.decode(Double.self, forKey: .holeNumber)
        self.par = try c.decodeIfPresent(Double.self, forKey: .par)
        self.strokeIndex = try c.decodeIfPresent(Double.self, forKey: .strokeIndex)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(courseId, forKey: .courseId)
        try c.encode(holeNumber, forKey: .holeNumber)
        try c.encodeIfPresent(par, forKey: .par)
        try c.encodeIfPresent(strokeIndex, forKey: .strokeIndex)
    }
}

struct CoursesSetTeeRoleInput: Codable, Sendable, Equatable {
    var courseId: String
    var roleKey: String
    var gender: PlayerGender
    var teeId: String

    enum CodingKeys: String, CodingKey {
        case courseId = "courseId"
        case roleKey = "roleKey"
        case gender = "gender"
        case teeId = "teeId"
    }

    init(courseId: String, roleKey: String, gender: PlayerGender, teeId: String) {
        self.courseId = courseId
        self.roleKey = roleKey
        self.gender = gender
        self.teeId = teeId
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.courseId = try c.decode(String.self, forKey: .courseId)
        self.roleKey = try c.decode(String.self, forKey: .roleKey)
        self.gender = try c.decode(PlayerGender.self, forKey: .gender)
        self.teeId = try c.decode(String.self, forKey: .teeId)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(courseId, forKey: .courseId)
        try c.encode(roleKey, forKey: .roleKey)
        try c.encode(gender, forKey: .gender)
        try c.encode(teeId, forKey: .teeId)
    }
}

struct CoursesClearTeeRoleInput: Codable, Sendable, Equatable {
    var courseId: String
    var roleKey: String
    var gender: PlayerGender

    enum CodingKeys: String, CodingKey {
        case courseId = "courseId"
        case roleKey = "roleKey"
        case gender = "gender"
    }

    init(courseId: String, roleKey: String, gender: PlayerGender) {
        self.courseId = courseId
        self.roleKey = roleKey
        self.gender = gender
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.courseId = try c.decode(String.self, forKey: .courseId)
        self.roleKey = try c.decode(String.self, forKey: .roleKey)
        self.gender = try c.decode(PlayerGender.self, forKey: .gender)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(courseId, forKey: .courseId)
        try c.encode(roleKey, forKey: .roleKey)
        try c.encode(gender, forKey: .gender)
    }
}
