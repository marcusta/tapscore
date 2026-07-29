// GENERATED — DO NOT EDIT. bun run generate:swift

import Foundation

struct CourseRouteTemplateRoutePlayHolesItemTeeOverridesItem: Codable, Sendable, Equatable {
    var teeId: String
    var lengthM: Double?
    var strokeIndexOverride: Double?

    enum CodingKeys: String, CodingKey {
        case teeId = "teeId"
        case lengthM = "lengthM"
        case strokeIndexOverride = "strokeIndexOverride"
    }

    init(teeId: String, lengthM: Double? = nil, strokeIndexOverride: Double? = nil) {
        self.teeId = teeId
        self.lengthM = lengthM
        self.strokeIndexOverride = strokeIndexOverride
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.teeId = try c.decode(String.self, forKey: .teeId)
        self.lengthM = try c.decodeIfPresent(Double.self, forKey: .lengthM)
        self.strokeIndexOverride = try c.decodeIfPresent(Double.self, forKey: .strokeIndexOverride)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(teeId, forKey: .teeId)
        try c.encodeIfPresent(lengthM, forKey: .lengthM)
        try c.encodeIfPresent(strokeIndexOverride, forKey: .strokeIndexOverride)
    }
}

struct CourseRouteTemplateRoutePlayHolesItem: Codable, Sendable, Equatable {
    var id: String?
    var courseHoleNumber: Double
    var parOverride: Double?
    var baseStrokeIndexOverride: Double?
    var teeOverrides: [CourseRouteTemplateRoutePlayHolesItemTeeOverridesItem]?

    enum CodingKeys: String, CodingKey {
        case id = "id"
        case courseHoleNumber = "courseHoleNumber"
        case parOverride = "parOverride"
        case baseStrokeIndexOverride = "baseStrokeIndexOverride"
        case teeOverrides = "teeOverrides"
    }

    init(id: String? = nil, courseHoleNumber: Double, parOverride: Double? = nil, baseStrokeIndexOverride: Double? = nil, teeOverrides: [CourseRouteTemplateRoutePlayHolesItemTeeOverridesItem]? = nil) {
        self.id = id
        self.courseHoleNumber = courseHoleNumber
        self.parOverride = parOverride
        self.baseStrokeIndexOverride = baseStrokeIndexOverride
        self.teeOverrides = teeOverrides
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try c.decodeIfPresent(String.self, forKey: .id)
        self.courseHoleNumber = try c.decode(Double.self, forKey: .courseHoleNumber)
        self.parOverride = try c.decodeIfPresent(Double.self, forKey: .parOverride)
        self.baseStrokeIndexOverride = try c.decodeIfPresent(Double.self, forKey: .baseStrokeIndexOverride)
        self.teeOverrides = try c.decodeIfPresent([CourseRouteTemplateRoutePlayHolesItemTeeOverridesItem].self, forKey: .teeOverrides)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encodeIfPresent(id, forKey: .id)
        try c.encode(courseHoleNumber, forKey: .courseHoleNumber)
        try c.encodeIfPresent(parOverride, forKey: .parOverride)
        try c.encodeIfPresent(baseStrokeIndexOverride, forKey: .baseStrokeIndexOverride)
        try c.encodeIfPresent(teeOverrides, forKey: .teeOverrides)
    }
}

struct CourseRouteTemplateRouteRouteSi: Codable, Sendable, Equatable {
    var mode: RoundRouteSiMode
    var sourceLabel: String?
    var sourceVersion: String?
    var allocationCycleSize: Double?

    enum CodingKeys: String, CodingKey {
        case mode = "mode"
        case sourceLabel = "sourceLabel"
        case sourceVersion = "sourceVersion"
        case allocationCycleSize = "allocationCycleSize"
    }

    init(mode: RoundRouteSiMode, sourceLabel: String? = nil, sourceVersion: String? = nil, allocationCycleSize: Double? = nil) {
        self.mode = mode
        self.sourceLabel = sourceLabel
        self.sourceVersion = sourceVersion
        self.allocationCycleSize = allocationCycleSize
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.mode = try c.decode(RoundRouteSiMode.self, forKey: .mode)
        self.sourceLabel = try c.decodeIfPresent(String.self, forKey: .sourceLabel)
        self.sourceVersion = try c.decodeIfPresent(String.self, forKey: .sourceVersion)
        self.allocationCycleSize = try c.decodeIfPresent(Double.self, forKey: .allocationCycleSize)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(mode, forKey: .mode)
        try c.encodeIfPresent(sourceLabel, forKey: .sourceLabel)
        try c.encodeIfPresent(sourceVersion, forKey: .sourceVersion)
        try c.encodeIfPresent(allocationCycleSize, forKey: .allocationCycleSize)
    }
}

struct CourseRouteTemplateRouteRouteHandicapPolicy: Codable, Sendable, Equatable {
    var type: RoundRoutePolicyType
    var postingEligible: Bool
    var postingIneligibleReason: String?

    enum CodingKeys: String, CodingKey {
        case type = "type"
        case postingEligible = "postingEligible"
        case postingIneligibleReason = "postingIneligibleReason"
    }

    init(type: RoundRoutePolicyType, postingEligible: Bool, postingIneligibleReason: String? = nil) {
        self.type = type
        self.postingEligible = postingEligible
        self.postingIneligibleReason = postingIneligibleReason
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.type = try c.decode(RoundRoutePolicyType.self, forKey: .type)
        self.postingEligible = try c.decode(Bool.self, forKey: .postingEligible)
        self.postingIneligibleReason = try c.decodeIfPresent(String.self, forKey: .postingIneligibleReason)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(type, forKey: .type)
        try c.encode(postingEligible, forKey: .postingEligible)
        try c.encodeIfPresent(postingIneligibleReason, forKey: .postingIneligibleReason)
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

struct CourseRouteTemplateRoute: Codable, Sendable, Equatable {
    var playHoles: [CourseRouteTemplateRoutePlayHolesItem]
    var routeSi: CourseRouteTemplateRouteRouteSi?
    var routeHandicapPolicy: CourseRouteTemplateRouteRouteHandicapPolicy?
    var routeSections: [CourseRouteTemplateRouteRouteSectionsItem]?

    enum CodingKeys: String, CodingKey {
        case playHoles = "playHoles"
        case routeSi = "routeSi"
        case routeHandicapPolicy = "routeHandicapPolicy"
        case routeSections = "routeSections"
    }

    init(playHoles: [CourseRouteTemplateRoutePlayHolesItem], routeSi: CourseRouteTemplateRouteRouteSi? = nil, routeHandicapPolicy: CourseRouteTemplateRouteRouteHandicapPolicy? = nil, routeSections: [CourseRouteTemplateRouteRouteSectionsItem]? = nil) {
        self.playHoles = playHoles
        self.routeSi = routeSi
        self.routeHandicapPolicy = routeHandicapPolicy
        self.routeSections = routeSections
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.playHoles = try c.decode([CourseRouteTemplateRoutePlayHolesItem].self, forKey: .playHoles)
        self.routeSi = try c.decodeIfPresent(CourseRouteTemplateRouteRouteSi.self, forKey: .routeSi)
        self.routeHandicapPolicy = try c.decodeIfPresent(CourseRouteTemplateRouteRouteHandicapPolicy.self, forKey: .routeHandicapPolicy)
        self.routeSections = try c.decodeIfPresent([CourseRouteTemplateRouteRouteSectionsItem].self, forKey: .routeSections)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(playHoles, forKey: .playHoles)
        try c.encodeIfPresent(routeSi, forKey: .routeSi)
        try c.encodeIfPresent(routeHandicapPolicy, forKey: .routeHandicapPolicy)
        try c.encodeIfPresent(routeSections, forKey: .routeSections)
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
    var courseId: String
    var name: String
    var route: CourseRouteTemplateRoute

    enum CodingKeys: String, CodingKey {
        case courseId = "courseId"
        case name = "name"
        case route = "route"
    }

    init(courseId: String, name: String, route: CourseRouteTemplateRoute) {
        self.courseId = courseId
        self.name = name
        self.route = route
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.courseId = try c.decode(String.self, forKey: .courseId)
        self.name = try c.decode(String.self, forKey: .name)
        self.route = try c.decode(CourseRouteTemplateRoute.self, forKey: .route)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(courseId, forKey: .courseId)
        try c.encode(name, forKey: .name)
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
    var id: String
    var name: String?
    var route: CourseRouteTemplateRoute?

    enum CodingKeys: String, CodingKey {
        case id = "id"
        case name = "name"
        case route = "route"
    }

    init(id: String, name: String? = nil, route: CourseRouteTemplateRoute? = nil) {
        self.id = id
        self.name = name
        self.route = route
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try c.decode(String.self, forKey: .id)
        self.name = try c.decodeIfPresent(String.self, forKey: .name)
        self.route = try c.decodeIfPresent(CourseRouteTemplateRoute.self, forKey: .route)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encodeIfPresent(name, forKey: .name)
        try c.encodeIfPresent(route, forKey: .route)
    }
}
