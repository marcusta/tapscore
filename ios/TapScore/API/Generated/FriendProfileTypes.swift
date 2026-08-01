// GENERATED — DO NOT EDIT. bun run generate:swift

import Foundation

struct FriendProfileView: Codable, Sendable, Equatable {
    var player: FriendProfileIdentity
    var roundsTotal: Double
    var roundsThisYear: Double
    var coursesTotal: Double
    var recentRounds: [FriendProfileRoundEntry]

    enum CodingKeys: String, CodingKey {
        case player = "player"
        case roundsTotal = "roundsTotal"
        case roundsThisYear = "roundsThisYear"
        case coursesTotal = "coursesTotal"
        case recentRounds = "recentRounds"
    }

    init(player: FriendProfileIdentity, roundsTotal: Double, roundsThisYear: Double, coursesTotal: Double, recentRounds: [FriendProfileRoundEntry]) {
        self.player = player
        self.roundsTotal = roundsTotal
        self.roundsThisYear = roundsThisYear
        self.coursesTotal = coursesTotal
        self.recentRounds = recentRounds
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.player = try c.decode(FriendProfileIdentity.self, forKey: .player)
        self.roundsTotal = try c.decode(Double.self, forKey: .roundsTotal)
        self.roundsThisYear = try c.decode(Double.self, forKey: .roundsThisYear)
        self.coursesTotal = try c.decode(Double.self, forKey: .coursesTotal)
        self.recentRounds = try c.decode([FriendProfileRoundEntry].self, forKey: .recentRounds)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(player, forKey: .player)
        try c.encode(roundsTotal, forKey: .roundsTotal)
        try c.encode(roundsThisYear, forKey: .roundsThisYear)
        try c.encode(coursesTotal, forKey: .coursesTotal)
        try c.encode(recentRounds, forKey: .recentRounds)
    }
}

struct FriendProfileRoundPage: Codable, Sendable, Equatable {
    var rounds: [FriendProfileRoundEntry]
    var nextCursor: String?
    var hasMore: Bool

    enum CodingKeys: String, CodingKey {
        case rounds = "rounds"
        case nextCursor = "nextCursor"
        case hasMore = "hasMore"
    }

    init(rounds: [FriendProfileRoundEntry], nextCursor: String? = nil, hasMore: Bool) {
        self.rounds = rounds
        self.nextCursor = nextCursor
        self.hasMore = hasMore
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.rounds = try c.decode([FriendProfileRoundEntry].self, forKey: .rounds)
        self.nextCursor = try c.decodeIfPresent(String.self, forKey: .nextCursor)
        self.hasMore = try c.decode(Bool.self, forKey: .hasMore)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(rounds, forKey: .rounds)
        if let nextCursor {
            try c.encode(nextCursor, forKey: .nextCursor)
        } else {
            try c.encodeNil(forKey: .nextCursor)
        }
        try c.encode(hasMore, forKey: .hasMore)
    }
}

struct FriendProfileCoursePage: Codable, Sendable, Equatable {
    var courses: [FriendProfileCourseEntry]
    var hasMore: Bool

    enum CodingKeys: String, CodingKey {
        case courses = "courses"
        case hasMore = "hasMore"
    }

    init(courses: [FriendProfileCourseEntry], hasMore: Bool) {
        self.courses = courses
        self.hasMore = hasMore
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.courses = try c.decode([FriendProfileCourseEntry].self, forKey: .courses)
        self.hasMore = try c.decode(Bool.self, forKey: .hasMore)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(courses, forKey: .courses)
        try c.encode(hasMore, forKey: .hasMore)
    }
}

struct FriendProfileIdentity: Codable, Sendable, Equatable {
    var id: String
    var username: String
    var displayName: String
    var handicapIndex: Double?
    var homeClubName: String?
    var avatarVersion: String?

    enum CodingKeys: String, CodingKey {
        case id = "id"
        case username = "username"
        case displayName = "displayName"
        case handicapIndex = "handicapIndex"
        case homeClubName = "homeClubName"
        case avatarVersion = "avatarVersion"
    }

    init(id: String, username: String, displayName: String, handicapIndex: Double? = nil, homeClubName: String? = nil, avatarVersion: String? = nil) {
        self.id = id
        self.username = username
        self.displayName = displayName
        self.handicapIndex = handicapIndex
        self.homeClubName = homeClubName
        self.avatarVersion = avatarVersion
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try c.decode(String.self, forKey: .id)
        self.username = try c.decode(String.self, forKey: .username)
        self.displayName = try c.decode(String.self, forKey: .displayName)
        self.handicapIndex = try c.decodeIfPresent(Double.self, forKey: .handicapIndex)
        self.homeClubName = try c.decodeIfPresent(String.self, forKey: .homeClubName)
        self.avatarVersion = try c.decodeIfPresent(String.self, forKey: .avatarVersion)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encode(username, forKey: .username)
        try c.encode(displayName, forKey: .displayName)
        if let handicapIndex {
            try c.encode(handicapIndex, forKey: .handicapIndex)
        } else {
            try c.encodeNil(forKey: .handicapIndex)
        }
        if let homeClubName {
            try c.encode(homeClubName, forKey: .homeClubName)
        } else {
            try c.encodeNil(forKey: .homeClubName)
        }
        if let avatarVersion {
            try c.encode(avatarVersion, forKey: .avatarVersion)
        } else {
            try c.encodeNil(forKey: .avatarVersion)
        }
    }
}

struct FriendProfileRoundEntry: Codable, Sendable, Equatable {
    var roundId: String
    var name: String?
    var courseName: String?
    var date: String
    var status: RoundStatus
    var holeCount: Double
    var holesPlayed: Double
    var scoreToPar: Double?

    enum CodingKeys: String, CodingKey {
        case roundId = "roundId"
        case name = "name"
        case courseName = "courseName"
        case date = "date"
        case status = "status"
        case holeCount = "holeCount"
        case holesPlayed = "holesPlayed"
        case scoreToPar = "scoreToPar"
    }

    init(roundId: String, name: String? = nil, courseName: String? = nil, date: String, status: RoundStatus, holeCount: Double, holesPlayed: Double, scoreToPar: Double? = nil) {
        self.roundId = roundId
        self.name = name
        self.courseName = courseName
        self.date = date
        self.status = status
        self.holeCount = holeCount
        self.holesPlayed = holesPlayed
        self.scoreToPar = scoreToPar
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.roundId = try c.decode(String.self, forKey: .roundId)
        self.name = try c.decodeIfPresent(String.self, forKey: .name)
        self.courseName = try c.decodeIfPresent(String.self, forKey: .courseName)
        self.date = try c.decode(String.self, forKey: .date)
        self.status = try c.decode(RoundStatus.self, forKey: .status)
        self.holeCount = try c.decode(Double.self, forKey: .holeCount)
        self.holesPlayed = try c.decode(Double.self, forKey: .holesPlayed)
        self.scoreToPar = try c.decodeIfPresent(Double.self, forKey: .scoreToPar)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(roundId, forKey: .roundId)
        if let name {
            try c.encode(name, forKey: .name)
        } else {
            try c.encodeNil(forKey: .name)
        }
        if let courseName {
            try c.encode(courseName, forKey: .courseName)
        } else {
            try c.encodeNil(forKey: .courseName)
        }
        try c.encode(date, forKey: .date)
        try c.encode(status, forKey: .status)
        try c.encode(holeCount, forKey: .holeCount)
        try c.encode(holesPlayed, forKey: .holesPlayed)
        if let scoreToPar {
            try c.encode(scoreToPar, forKey: .scoreToPar)
        } else {
            try c.encodeNil(forKey: .scoreToPar)
        }
    }
}

struct FriendProfileCourseEntry: Codable, Sendable, Equatable {
    var courseId: String
    var courseName: String?
    var roundsPlayed: Double
    var lastPlayedAt: String

    enum CodingKeys: String, CodingKey {
        case courseId = "courseId"
        case courseName = "courseName"
        case roundsPlayed = "roundsPlayed"
        case lastPlayedAt = "lastPlayedAt"
    }

    init(courseId: String, courseName: String? = nil, roundsPlayed: Double, lastPlayedAt: String) {
        self.courseId = courseId
        self.courseName = courseName
        self.roundsPlayed = roundsPlayed
        self.lastPlayedAt = lastPlayedAt
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.courseId = try c.decode(String.self, forKey: .courseId)
        self.courseName = try c.decodeIfPresent(String.self, forKey: .courseName)
        self.roundsPlayed = try c.decode(Double.self, forKey: .roundsPlayed)
        self.lastPlayedAt = try c.decode(String.self, forKey: .lastPlayedAt)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(courseId, forKey: .courseId)
        if let courseName {
            try c.encode(courseName, forKey: .courseName)
        } else {
            try c.encodeNil(forKey: .courseName)
        }
        try c.encode(roundsPlayed, forKey: .roundsPlayed)
        try c.encode(lastPlayedAt, forKey: .lastPlayedAt)
    }
}

struct FriendProfileProfileInput: Codable, Sendable, Equatable {
    var playerId: String

    enum CodingKeys: String, CodingKey {
        case playerId = "playerId"
    }

    init(playerId: String) {
        self.playerId = playerId
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.playerId = try c.decode(String.self, forKey: .playerId)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(playerId, forKey: .playerId)
    }
}

struct FriendProfileRoundsInput: Codable, Sendable, Equatable {
    var playerId: String
    var cursor: String?
    var limit: Double?

    enum CodingKeys: String, CodingKey {
        case playerId = "playerId"
        case cursor = "cursor"
        case limit = "limit"
    }

    init(playerId: String, cursor: String? = nil, limit: Double? = nil) {
        self.playerId = playerId
        self.cursor = cursor
        self.limit = limit
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.playerId = try c.decode(String.self, forKey: .playerId)
        self.cursor = try c.decodeIfPresent(String.self, forKey: .cursor)
        self.limit = try c.decodeIfPresent(Double.self, forKey: .limit)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(playerId, forKey: .playerId)
        try c.encodeIfPresent(cursor, forKey: .cursor)
        try c.encodeIfPresent(limit, forKey: .limit)
    }
}
