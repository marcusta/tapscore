// GENERATED — DO NOT EDIT. bun run generate:swift

import Foundation

struct Course: Codable, Sendable, Equatable {
    var id: String
    var clubId: String
    var name: String
    var holeCount: Double
    var holes: [Hole]

    enum CodingKeys: String, CodingKey {
        case id = "id"
        case clubId = "clubId"
        case name = "name"
        case holeCount = "holeCount"
        case holes = "holes"
    }

    init(id: String, clubId: String, name: String, holeCount: Double, holes: [Hole]) {
        self.id = id
        self.clubId = clubId
        self.name = name
        self.holeCount = holeCount
        self.holes = holes
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try c.decode(String.self, forKey: .id)
        self.clubId = try c.decode(String.self, forKey: .clubId)
        self.name = try c.decode(String.self, forKey: .name)
        self.holeCount = try c.decode(Double.self, forKey: .holeCount)
        self.holes = try c.decode([Hole].self, forKey: .holes)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encode(clubId, forKey: .clubId)
        try c.encode(name, forKey: .name)
        try c.encode(holeCount, forKey: .holeCount)
        try c.encode(holes, forKey: .holes)
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
    var par: Double
    var holeNumber: Double
    var strokeIndex: Double

    enum CodingKeys: String, CodingKey {
        case par = "par"
        case holeNumber = "holeNumber"
        case strokeIndex = "strokeIndex"
    }

    init(par: Double, holeNumber: Double, strokeIndex: Double) {
        self.par = par
        self.holeNumber = holeNumber
        self.strokeIndex = strokeIndex
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.par = try c.decode(Double.self, forKey: .par)
        self.holeNumber = try c.decode(Double.self, forKey: .holeNumber)
        self.strokeIndex = try c.decode(Double.self, forKey: .strokeIndex)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(par, forKey: .par)
        try c.encode(holeNumber, forKey: .holeNumber)
        try c.encode(strokeIndex, forKey: .strokeIndex)
    }
}

struct CoursesCreateInput: Codable, Sendable, Equatable {
    var holes: [CoursesCreateInputHolesItem]?
    var name: String
    var clubId: String
    var holeCount: Double

    enum CodingKeys: String, CodingKey {
        case holes = "holes"
        case name = "name"
        case clubId = "clubId"
        case holeCount = "holeCount"
    }

    init(holes: [CoursesCreateInputHolesItem]? = nil, name: String, clubId: String, holeCount: Double) {
        self.holes = holes
        self.name = name
        self.clubId = clubId
        self.holeCount = holeCount
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.holes = try c.decodeIfPresent([CoursesCreateInputHolesItem].self, forKey: .holes)
        self.name = try c.decode(String.self, forKey: .name)
        self.clubId = try c.decode(String.self, forKey: .clubId)
        self.holeCount = try c.decode(Double.self, forKey: .holeCount)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encodeIfPresent(holes, forKey: .holes)
        try c.encode(name, forKey: .name)
        try c.encode(clubId, forKey: .clubId)
        try c.encode(holeCount, forKey: .holeCount)
    }
}

struct CoursesUpdateInput: Codable, Sendable, Equatable {
    var name: String?
    var holeCount: Double?
    var holes: [CoursesCreateInputHolesItem]?
    var id: String

    enum CodingKeys: String, CodingKey {
        case name = "name"
        case holeCount = "holeCount"
        case holes = "holes"
        case id = "id"
    }

    init(name: String? = nil, holeCount: Double? = nil, holes: [CoursesCreateInputHolesItem]? = nil, id: String) {
        self.name = name
        self.holeCount = holeCount
        self.holes = holes
        self.id = id
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.name = try c.decodeIfPresent(String.self, forKey: .name)
        self.holeCount = try c.decodeIfPresent(Double.self, forKey: .holeCount)
        self.holes = try c.decodeIfPresent([CoursesCreateInputHolesItem].self, forKey: .holes)
        self.id = try c.decode(String.self, forKey: .id)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encodeIfPresent(name, forKey: .name)
        try c.encodeIfPresent(holeCount, forKey: .holeCount)
        try c.encodeIfPresent(holes, forKey: .holes)
        try c.encode(id, forKey: .id)
    }
}

struct CoursesUpdateHoleInput: Codable, Sendable, Equatable {
    var par: Double?
    var strokeIndex: Double?
    var courseId: String
    var holeNumber: Double

    enum CodingKeys: String, CodingKey {
        case par = "par"
        case strokeIndex = "strokeIndex"
        case courseId = "courseId"
        case holeNumber = "holeNumber"
    }

    init(par: Double? = nil, strokeIndex: Double? = nil, courseId: String, holeNumber: Double) {
        self.par = par
        self.strokeIndex = strokeIndex
        self.courseId = courseId
        self.holeNumber = holeNumber
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.par = try c.decodeIfPresent(Double.self, forKey: .par)
        self.strokeIndex = try c.decodeIfPresent(Double.self, forKey: .strokeIndex)
        self.courseId = try c.decode(String.self, forKey: .courseId)
        self.holeNumber = try c.decode(Double.self, forKey: .holeNumber)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encodeIfPresent(par, forKey: .par)
        try c.encodeIfPresent(strokeIndex, forKey: .strokeIndex)
        try c.encode(courseId, forKey: .courseId)
        try c.encode(holeNumber, forKey: .holeNumber)
    }
}
