// GENERATED — DO NOT EDIT. bun run generate:swift

import Foundation

struct CourseRouteTemplateRouteRouteSi: Codable, Sendable, Equatable {
    var sourceLabel: String?
    var sourceVersion: String?
    var allocationCycleSize: Double?
    var mode: RoundRouteSiMode

    enum CodingKeys: String, CodingKey {
        case sourceLabel = "sourceLabel"
        case sourceVersion = "sourceVersion"
        case allocationCycleSize = "allocationCycleSize"
        case mode = "mode"
    }

    init(sourceLabel: String? = nil, sourceVersion: String? = nil, allocationCycleSize: Double? = nil, mode: RoundRouteSiMode) {
        self.sourceLabel = sourceLabel
        self.sourceVersion = sourceVersion
        self.allocationCycleSize = allocationCycleSize
        self.mode = mode
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.sourceLabel = try c.decodeIfPresent(String.self, forKey: .sourceLabel)
        self.sourceVersion = try c.decodeIfPresent(String.self, forKey: .sourceVersion)
        self.allocationCycleSize = try c.decodeIfPresent(Double.self, forKey: .allocationCycleSize)
        self.mode = try c.decode(RoundRouteSiMode.self, forKey: .mode)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encodeIfPresent(sourceLabel, forKey: .sourceLabel)
        try c.encodeIfPresent(sourceVersion, forKey: .sourceVersion)
        try c.encodeIfPresent(allocationCycleSize, forKey: .allocationCycleSize)
        try c.encode(mode, forKey: .mode)
    }
}

struct CourseRouteTemplateRouteRouteHandicapPolicy: Codable, Sendable, Equatable {
    var postingIneligibleReason: String?
    var type: RoundRoutePolicyType
    var postingEligible: Bool

    enum CodingKeys: String, CodingKey {
        case postingIneligibleReason = "postingIneligibleReason"
        case type = "type"
        case postingEligible = "postingEligible"
    }

    init(postingIneligibleReason: String? = nil, type: RoundRoutePolicyType, postingEligible: Bool) {
        self.postingIneligibleReason = postingIneligibleReason
        self.type = type
        self.postingEligible = postingEligible
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.postingIneligibleReason = try c.decodeIfPresent(String.self, forKey: .postingIneligibleReason)
        self.type = try c.decode(RoundRoutePolicyType.self, forKey: .type)
        self.postingEligible = try c.decode(Bool.self, forKey: .postingEligible)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encodeIfPresent(postingIneligibleReason, forKey: .postingIneligibleReason)
        try c.encode(type, forKey: .type)
        try c.encode(postingEligible, forKey: .postingEligible)
    }
}

struct CourseRouteTemplateRouteRouteSectionsItem: Codable, Sendable, Equatable {
    var id: String
    var label: String
    var fromCanonicalOrdinal: Double
    var toCanonicalOrdinal: Double

    enum CodingKeys: String, CodingKey {
        case id = "id"
        case label = "label"
        case fromCanonicalOrdinal = "fromCanonicalOrdinal"
        case toCanonicalOrdinal = "toCanonicalOrdinal"
    }

    init(id: String, label: String, fromCanonicalOrdinal: Double, toCanonicalOrdinal: Double) {
        self.id = id
        self.label = label
        self.fromCanonicalOrdinal = fromCanonicalOrdinal
        self.toCanonicalOrdinal = toCanonicalOrdinal
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try c.decode(String.self, forKey: .id)
        self.label = try c.decode(String.self, forKey: .label)
        self.fromCanonicalOrdinal = try c.decode(Double.self, forKey: .fromCanonicalOrdinal)
        self.toCanonicalOrdinal = try c.decode(Double.self, forKey: .toCanonicalOrdinal)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encode(label, forKey: .label)
        try c.encode(fromCanonicalOrdinal, forKey: .fromCanonicalOrdinal)
        try c.encode(toCanonicalOrdinal, forKey: .toCanonicalOrdinal)
    }
}

struct CourseRouteTemplateRoutePlayHolesItemTeeOverridesItem: Codable, Sendable, Equatable {
    var lengthM: Double?
    var strokeIndexOverride: Double?
    var teeId: String

    enum CodingKeys: String, CodingKey {
        case lengthM = "lengthM"
        case strokeIndexOverride = "strokeIndexOverride"
        case teeId = "teeId"
    }

    init(lengthM: Double? = nil, strokeIndexOverride: Double? = nil, teeId: String) {
        self.lengthM = lengthM
        self.strokeIndexOverride = strokeIndexOverride
        self.teeId = teeId
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.lengthM = try c.decodeIfPresent(Double.self, forKey: .lengthM)
        self.strokeIndexOverride = try c.decodeIfPresent(Double.self, forKey: .strokeIndexOverride)
        self.teeId = try c.decode(String.self, forKey: .teeId)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encodeIfPresent(lengthM, forKey: .lengthM)
        try c.encodeIfPresent(strokeIndexOverride, forKey: .strokeIndexOverride)
        try c.encode(teeId, forKey: .teeId)
    }
}

struct CourseRouteTemplateRoutePlayHolesItem: Codable, Sendable, Equatable {
    var id: String?
    var parOverride: Double?
    var baseStrokeIndexOverride: Double?
    var teeOverrides: [CourseRouteTemplateRoutePlayHolesItemTeeOverridesItem]?
    var courseHoleNumber: Double

    enum CodingKeys: String, CodingKey {
        case id = "id"
        case parOverride = "parOverride"
        case baseStrokeIndexOverride = "baseStrokeIndexOverride"
        case teeOverrides = "teeOverrides"
        case courseHoleNumber = "courseHoleNumber"
    }

    init(id: String? = nil, parOverride: Double? = nil, baseStrokeIndexOverride: Double? = nil, teeOverrides: [CourseRouteTemplateRoutePlayHolesItemTeeOverridesItem]? = nil, courseHoleNumber: Double) {
        self.id = id
        self.parOverride = parOverride
        self.baseStrokeIndexOverride = baseStrokeIndexOverride
        self.teeOverrides = teeOverrides
        self.courseHoleNumber = courseHoleNumber
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try c.decodeIfPresent(String.self, forKey: .id)
        self.parOverride = try c.decodeIfPresent(Double.self, forKey: .parOverride)
        self.baseStrokeIndexOverride = try c.decodeIfPresent(Double.self, forKey: .baseStrokeIndexOverride)
        self.teeOverrides = try c.decodeIfPresent([CourseRouteTemplateRoutePlayHolesItemTeeOverridesItem].self, forKey: .teeOverrides)
        self.courseHoleNumber = try c.decode(Double.self, forKey: .courseHoleNumber)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encodeIfPresent(id, forKey: .id)
        try c.encodeIfPresent(parOverride, forKey: .parOverride)
        try c.encodeIfPresent(baseStrokeIndexOverride, forKey: .baseStrokeIndexOverride)
        try c.encodeIfPresent(teeOverrides, forKey: .teeOverrides)
        try c.encode(courseHoleNumber, forKey: .courseHoleNumber)
    }
}

struct CourseRouteTemplateRoute: Codable, Sendable, Equatable {
    var routeSi: CourseRouteTemplateRouteRouteSi?
    var routeHandicapPolicy: CourseRouteTemplateRouteRouteHandicapPolicy?
    var routeSections: [CourseRouteTemplateRouteRouteSectionsItem]?
    var playHoles: [CourseRouteTemplateRoutePlayHolesItem]

    enum CodingKeys: String, CodingKey {
        case routeSi = "routeSi"
        case routeHandicapPolicy = "routeHandicapPolicy"
        case routeSections = "routeSections"
        case playHoles = "playHoles"
    }

    init(routeSi: CourseRouteTemplateRouteRouteSi? = nil, routeHandicapPolicy: CourseRouteTemplateRouteRouteHandicapPolicy? = nil, routeSections: [CourseRouteTemplateRouteRouteSectionsItem]? = nil, playHoles: [CourseRouteTemplateRoutePlayHolesItem]) {
        self.routeSi = routeSi
        self.routeHandicapPolicy = routeHandicapPolicy
        self.routeSections = routeSections
        self.playHoles = playHoles
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.routeSi = try c.decodeIfPresent(CourseRouteTemplateRouteRouteSi.self, forKey: .routeSi)
        self.routeHandicapPolicy = try c.decodeIfPresent(CourseRouteTemplateRouteRouteHandicapPolicy.self, forKey: .routeHandicapPolicy)
        self.routeSections = try c.decodeIfPresent([CourseRouteTemplateRouteRouteSectionsItem].self, forKey: .routeSections)
        self.playHoles = try c.decode([CourseRouteTemplateRoutePlayHolesItem].self, forKey: .playHoles)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encodeIfPresent(routeSi, forKey: .routeSi)
        try c.encodeIfPresent(routeHandicapPolicy, forKey: .routeHandicapPolicy)
        try c.encodeIfPresent(routeSections, forKey: .routeSections)
        try c.encode(playHoles, forKey: .playHoles)
    }
}

struct CourseRouteTemplate: Codable, Sendable, Equatable {
    var id: String
    var courseId: String
    var name: String
    var route: CourseRouteTemplateRoute
    var createdAt: String
    var updatedAt: String

    enum CodingKeys: String, CodingKey {
        case id = "id"
        case courseId = "courseId"
        case name = "name"
        case route = "route"
        case createdAt = "createdAt"
        case updatedAt = "updatedAt"
    }

    init(id: String, courseId: String, name: String, route: CourseRouteTemplateRoute, createdAt: String, updatedAt: String) {
        self.id = id
        self.courseId = courseId
        self.name = name
        self.route = route
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try c.decode(String.self, forKey: .id)
        self.courseId = try c.decode(String.self, forKey: .courseId)
        self.name = try c.decode(String.self, forKey: .name)
        self.route = try c.decode(CourseRouteTemplateRoute.self, forKey: .route)
        self.createdAt = try c.decode(String.self, forKey: .createdAt)
        self.updatedAt = try c.decode(String.self, forKey: .updatedAt)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encode(courseId, forKey: .courseId)
        try c.encode(name, forKey: .name)
        try c.encode(route, forKey: .route)
        try c.encode(createdAt, forKey: .createdAt)
        try c.encode(updatedAt, forKey: .updatedAt)
    }
}

struct CourseRouteTemplatesListByCourseInput: Codable, Sendable, Equatable {
    var courseId: String

    enum CodingKeys: String, CodingKey {
        case courseId = "courseId"
    }

    init(courseId: String) {
        self.courseId = courseId
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.courseId = try c.decode(String.self, forKey: .courseId)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(courseId, forKey: .courseId)
    }
}

struct CourseRouteTemplatesValidateInput: Codable, Sendable, Equatable {
    var courseId: String
    var route: CourseRouteTemplateRoute

    enum CodingKeys: String, CodingKey {
        case courseId = "courseId"
        case route = "route"
    }

    init(courseId: String, route: CourseRouteTemplateRoute) {
        self.courseId = courseId
        self.route = route
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.courseId = try c.decode(String.self, forKey: .courseId)
        self.route = try c.decode(CourseRouteTemplateRoute.self, forKey: .route)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(courseId, forKey: .courseId)
        try c.encode(route, forKey: .route)
    }
}

struct CourseRouteTemplatesCreateInput: Codable, Sendable, Equatable {
    var name: String
    var courseId: String
    var route: CourseRouteTemplateRoute

    enum CodingKeys: String, CodingKey {
        case name = "name"
        case courseId = "courseId"
        case route = "route"
    }

    init(name: String, courseId: String, route: CourseRouteTemplateRoute) {
        self.name = name
        self.courseId = courseId
        self.route = route
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.name = try c.decode(String.self, forKey: .name)
        self.courseId = try c.decode(String.self, forKey: .courseId)
        self.route = try c.decode(CourseRouteTemplateRoute.self, forKey: .route)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(name, forKey: .name)
        try c.encode(courseId, forKey: .courseId)
        try c.encode(route, forKey: .route)
    }
}

struct CourseRouteTemplatesCreateOutputOk: Codable, Sendable, Equatable {
    let ok: Bool = true
    var template: CourseRouteTemplate

    enum CodingKeys: String, CodingKey {
        case ok = "ok"
        case template = "template"
    }

    init(template: CourseRouteTemplate) {
        self.template = template
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        _ = try c.decode(Bool.self, forKey: .ok)
        self.template = try c.decode(CourseRouteTemplate.self, forKey: .template)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(ok, forKey: .ok)
        try c.encode(template, forKey: .template)
    }
}

enum CourseRouteTemplatesCreateOutput: Codable, Sendable, Equatable {
    case ok(CourseRouteTemplatesCreateOutputOk)
    case notOk(CompetitionsCreateRoundOutputNotOkDiagnostics)

    private enum DiscriminantKey: String, CodingKey {
        case discriminant = "ok"
    }

    init(from decoder: any Decoder) throws {
        let tag = try decoder.container(keyedBy: DiscriminantKey.self)
        let discriminant = try tag.decode(Bool.self, forKey: .discriminant)
        switch discriminant {
        case true:
            self = .ok(try CourseRouteTemplatesCreateOutputOk(from: decoder))
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

struct CourseRouteTemplatesUpdateInput: Codable, Sendable, Equatable {
    var name: String?
    var route: CourseRouteTemplateRoute?
    var id: String

    enum CodingKeys: String, CodingKey {
        case name = "name"
        case route = "route"
        case id = "id"
    }

    init(name: String? = nil, route: CourseRouteTemplateRoute? = nil, id: String) {
        self.name = name
        self.route = route
        self.id = id
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.name = try c.decodeIfPresent(String.self, forKey: .name)
        self.route = try c.decodeIfPresent(CourseRouteTemplateRoute.self, forKey: .route)
        self.id = try c.decode(String.self, forKey: .id)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encodeIfPresent(name, forKey: .name)
        try c.encodeIfPresent(route, forKey: .route)
        try c.encode(id, forKey: .id)
    }
}
