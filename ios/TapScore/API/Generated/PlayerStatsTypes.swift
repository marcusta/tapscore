// GENERATED — DO NOT EDIT. bun run generate:swift

import Foundation

struct PlayerStatsConfig: Codable, Sendable, Equatable {
    var playerId: String
    var enabled: Bool
    var tee: Bool
    var approach: Bool
    var putting: Bool
    var shortGame: Bool
    var penalties: Bool
    var recovery: Bool
    var updatedAt: String?

    enum CodingKeys: String, CodingKey {
        case playerId = "playerId"
        case enabled = "enabled"
        case tee = "tee"
        case approach = "approach"
        case putting = "putting"
        case shortGame = "shortGame"
        case penalties = "penalties"
        case recovery = "recovery"
        case updatedAt = "updatedAt"
    }

    init(playerId: String, enabled: Bool, tee: Bool, approach: Bool, putting: Bool, shortGame: Bool, penalties: Bool, recovery: Bool, updatedAt: String? = nil) {
        self.playerId = playerId
        self.enabled = enabled
        self.tee = tee
        self.approach = approach
        self.putting = putting
        self.shortGame = shortGame
        self.penalties = penalties
        self.recovery = recovery
        self.updatedAt = updatedAt
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.playerId = try c.decode(String.self, forKey: .playerId)
        self.enabled = try c.decode(Bool.self, forKey: .enabled)
        self.tee = try c.decode(Bool.self, forKey: .tee)
        self.approach = try c.decode(Bool.self, forKey: .approach)
        self.putting = try c.decode(Bool.self, forKey: .putting)
        self.shortGame = try c.decode(Bool.self, forKey: .shortGame)
        self.penalties = try c.decode(Bool.self, forKey: .penalties)
        self.recovery = try c.decode(Bool.self, forKey: .recovery)
        self.updatedAt = try c.decodeIfPresent(String.self, forKey: .updatedAt)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(playerId, forKey: .playerId)
        try c.encode(enabled, forKey: .enabled)
        try c.encode(tee, forKey: .tee)
        try c.encode(approach, forKey: .approach)
        try c.encode(putting, forKey: .putting)
        try c.encode(shortGame, forKey: .shortGame)
        try c.encode(penalties, forKey: .penalties)
        try c.encode(recovery, forKey: .recovery)
        if let updatedAt {
            try c.encode(updatedAt, forKey: .updatedAt)
        } else {
            try c.encodeNil(forKey: .updatedAt)
        }
    }
}

struct PlayerStatsSummary: Codable, Sendable, Equatable {
    var playerId: String
    var roundsWithStats: Double?
    var totals: StatMeasures?
    var rounds: [PlayerRoundStats]
    var nextCursor: String?

    enum CodingKeys: String, CodingKey {
        case playerId = "playerId"
        case roundsWithStats = "roundsWithStats"
        case totals = "totals"
        case rounds = "rounds"
        case nextCursor = "nextCursor"
    }

    init(playerId: String, roundsWithStats: Double? = nil, totals: StatMeasures? = nil, rounds: [PlayerRoundStats], nextCursor: String? = nil) {
        self.playerId = playerId
        self.roundsWithStats = roundsWithStats
        self.totals = totals
        self.rounds = rounds
        self.nextCursor = nextCursor
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.playerId = try c.decode(String.self, forKey: .playerId)
        self.roundsWithStats = try c.decodeIfPresent(Double.self, forKey: .roundsWithStats)
        self.totals = try c.decodeIfPresent(StatMeasures.self, forKey: .totals)
        self.rounds = try c.decode([PlayerRoundStats].self, forKey: .rounds)
        self.nextCursor = try c.decodeIfPresent(String.self, forKey: .nextCursor)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(playerId, forKey: .playerId)
        if let roundsWithStats {
            try c.encode(roundsWithStats, forKey: .roundsWithStats)
        } else {
            try c.encodeNil(forKey: .roundsWithStats)
        }
        if let totals {
            try c.encode(totals, forKey: .totals)
        } else {
            try c.encodeNil(forKey: .totals)
        }
        try c.encode(rounds, forKey: .rounds)
        if let nextCursor {
            try c.encode(nextCursor, forKey: .nextCursor)
        } else {
            try c.encodeNil(forKey: .nextCursor)
        }
    }
}

struct PlayerRoundHoleStats: Codable, Sendable, Equatable {
    var playHoleId: String
    var ordinal: Double
    var courseHoleNumber: Double
    var par: Double
    var lengthM: Double?
    var score: Double?
    var stats: PlayerHoleStats

    enum CodingKeys: String, CodingKey {
        case playHoleId = "playHoleId"
        case ordinal = "ordinal"
        case courseHoleNumber = "courseHoleNumber"
        case par = "par"
        case lengthM = "lengthM"
        case score = "score"
        case stats = "stats"
    }

    init(playHoleId: String, ordinal: Double, courseHoleNumber: Double, par: Double, lengthM: Double? = nil, score: Double? = nil, stats: PlayerHoleStats) {
        self.playHoleId = playHoleId
        self.ordinal = ordinal
        self.courseHoleNumber = courseHoleNumber
        self.par = par
        self.lengthM = lengthM
        self.score = score
        self.stats = stats
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.playHoleId = try c.decode(String.self, forKey: .playHoleId)
        self.ordinal = try c.decode(Double.self, forKey: .ordinal)
        self.courseHoleNumber = try c.decode(Double.self, forKey: .courseHoleNumber)
        self.par = try c.decode(Double.self, forKey: .par)
        self.lengthM = try c.decodeIfPresent(Double.self, forKey: .lengthM)
        self.score = try c.decodeIfPresent(Double.self, forKey: .score)
        self.stats = try c.decode(PlayerHoleStats.self, forKey: .stats)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(playHoleId, forKey: .playHoleId)
        try c.encode(ordinal, forKey: .ordinal)
        try c.encode(courseHoleNumber, forKey: .courseHoleNumber)
        try c.encode(par, forKey: .par)
        if let lengthM {
            try c.encode(lengthM, forKey: .lengthM)
        } else {
            try c.encodeNil(forKey: .lengthM)
        }
        if let score {
            try c.encode(score, forKey: .score)
        } else {
            try c.encodeNil(forKey: .score)
        }
        try c.encode(stats, forKey: .stats)
    }
}

struct AppendStatEventsResult: Codable, Sendable, Equatable {
    var events: [AppendedStatEvent]

    enum CodingKeys: String, CodingKey {
        case events = "events"
    }

    init(events: [AppendedStatEvent]) {
        self.events = events
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.events = try c.decode([AppendedStatEvent].self, forKey: .events)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(events, forKey: .events)
    }
}

enum TeeResult: String, Codable, Sendable, Equatable {
    case fairway = "fairway"
    case inPlay = "in_play"
    case trouble = "trouble"
}

enum FirstPutt: String, Codable, Sendable, Equatable {
    case inside1m = "inside_1m"
    case v1To2m = "1_to_2m"
    case v2To4m = "2_to_4m"
    case v4To8m = "4_to_8m"
    case over8m = "over_8m"
    case inside2m = "inside_2m"
    case v2To6m = "2_to_6m"
    case over6m = "over_6m"
}

enum ShortGameDifficulty: String, Codable, Sendable, Equatable {
    case standard = "standard"
    case hard = "hard"
}

struct PlayerHoleStats: Codable, Sendable, Equatable {
    var roundId: String
    var playHoleId: String
    var playerId: String
    var teeResult: TeeResult?
    var gir: Bool?
    var firstPutt: FirstPutt?
    var putts: Double?
    var shortGameDifficulty: ShortGameDifficulty?
    var penalties: Double?
    var recoveryOk: Bool?

    enum CodingKeys: String, CodingKey {
        case roundId = "roundId"
        case playHoleId = "playHoleId"
        case playerId = "playerId"
        case teeResult = "teeResult"
        case gir = "gir"
        case firstPutt = "firstPutt"
        case putts = "putts"
        case shortGameDifficulty = "shortGameDifficulty"
        case penalties = "penalties"
        case recoveryOk = "recoveryOk"
    }

    init(roundId: String, playHoleId: String, playerId: String, teeResult: TeeResult? = nil, gir: Bool? = nil, firstPutt: FirstPutt? = nil, putts: Double? = nil, shortGameDifficulty: ShortGameDifficulty? = nil, penalties: Double? = nil, recoveryOk: Bool? = nil) {
        self.roundId = roundId
        self.playHoleId = playHoleId
        self.playerId = playerId
        self.teeResult = teeResult
        self.gir = gir
        self.firstPutt = firstPutt
        self.putts = putts
        self.shortGameDifficulty = shortGameDifficulty
        self.penalties = penalties
        self.recoveryOk = recoveryOk
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.roundId = try c.decode(String.self, forKey: .roundId)
        self.playHoleId = try c.decode(String.self, forKey: .playHoleId)
        self.playerId = try c.decode(String.self, forKey: .playerId)
        self.teeResult = try c.decodeIfPresent(TeeResult.self, forKey: .teeResult)
        self.gir = try c.decodeIfPresent(Bool.self, forKey: .gir)
        self.firstPutt = try c.decodeIfPresent(FirstPutt.self, forKey: .firstPutt)
        self.putts = try c.decodeIfPresent(Double.self, forKey: .putts)
        self.shortGameDifficulty = try c.decodeIfPresent(ShortGameDifficulty.self, forKey: .shortGameDifficulty)
        self.penalties = try c.decodeIfPresent(Double.self, forKey: .penalties)
        self.recoveryOk = try c.decodeIfPresent(Bool.self, forKey: .recoveryOk)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(roundId, forKey: .roundId)
        try c.encode(playHoleId, forKey: .playHoleId)
        try c.encode(playerId, forKey: .playerId)
        if let teeResult {
            try c.encode(teeResult, forKey: .teeResult)
        } else {
            try c.encodeNil(forKey: .teeResult)
        }
        if let gir {
            try c.encode(gir, forKey: .gir)
        } else {
            try c.encodeNil(forKey: .gir)
        }
        if let firstPutt {
            try c.encode(firstPutt, forKey: .firstPutt)
        } else {
            try c.encodeNil(forKey: .firstPutt)
        }
        if let putts {
            try c.encode(putts, forKey: .putts)
        } else {
            try c.encodeNil(forKey: .putts)
        }
        if let shortGameDifficulty {
            try c.encode(shortGameDifficulty, forKey: .shortGameDifficulty)
        } else {
            try c.encodeNil(forKey: .shortGameDifficulty)
        }
        if let penalties {
            try c.encode(penalties, forKey: .penalties)
        } else {
            try c.encodeNil(forKey: .penalties)
        }
        if let recoveryOk {
            try c.encode(recoveryOk, forKey: .recoveryOk)
        } else {
            try c.encodeNil(forKey: .recoveryOk)
        }
    }
}

struct RoundPlayerStatModules: Codable, Sendable, Equatable {
    var playerId: String
    var modules: StatModules

    enum CodingKeys: String, CodingKey {
        case playerId = "playerId"
        case modules = "modules"
    }

    init(playerId: String, modules: StatModules) {
        self.playerId = playerId
        self.modules = modules
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.playerId = try c.decode(String.self, forKey: .playerId)
        self.modules = try c.decode(StatModules.self, forKey: .modules)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(playerId, forKey: .playerId)
        try c.encode(modules, forKey: .modules)
    }
}

struct StatMeasures: Codable, Sendable, Equatable {
    var teeRecorded: Double
    var fairwayHits: Double
    var inPlayHits: Double
    var troubleCount: Double
    var girRecorded: Double
    var girHits: Double
    var firstPuttRecorded: Double
    var firstPuttInside1m: Double
    var firstPutt1To2m: Double
    var firstPutt2To4m: Double
    var firstPutt4To8m: Double
    var firstPuttOver8m: Double
    var firstPuttInside1mResolved: Double
    var firstPutt1To2mResolved: Double
    var firstPutt2To4mResolved: Double
    var firstPutt4To8mResolved: Double
    var firstPuttOver8mResolved: Double
    var onePuttInside1m: Double
    var onePutt1To2m: Double
    var onePutt2To4m: Double
    var onePutt4To8m: Double
    var onePuttOver8m: Double
    var puttsRecorded: Double
    var puttsTotal: Double
    var threePutts: Double
    var threePuttsFromOver8m: Double
    var scrambleAttemptsStandard: Double
    var scrambleSuccessesStandard: Double
    var scrambleAttemptsHard: Double
    var scrambleSuccessesHard: Double
    var scrambleFirstPuttStandard: Double
    var scrambleInside2mStandard: Double
    var scrambleFirstPuttHard: Double
    var scrambleInside2mHard: Double
    var scrambleHoledStandard: Double
    var scrambleHoledHard: Double
    var penaltiesRecorded: Double
    var penaltiesTotal: Double
    var recoveryAttempts: Double
    var recoverySuccesses: Double
    var holesScored: Double
    var strokesTotal: Double
    var parTotal: Double
    var holesScoredPar3: Double
    var strokesPar3: Double
    var holesScoredPar4: Double
    var strokesPar4: Double
    var holesScoredPar5: Double
    var strokesPar5: Double
    var doubleBogeyPlus: Double
    var girHolesScored: Double
    var birdiesOnGir: Double
    var bounceBackOpportunities: Double
    var bounceBackSuccesses: Double
    var holesScoredFairway: Double
    var strokesVsParFairway: Double
    var holesScoredInPlay: Double
    var strokesVsParInPlay: Double
    var holesScoredTrouble: Double
    var strokesVsParTrouble: Double
    var girRecordedFairway: Double
    var girHitsFairway: Double
    var girRecordedInPlay: Double
    var girHitsInPlay: Double
    var girRecordedTrouble: Double
    var girHitsTrouble: Double
    var girFirstPuttRecorded: Double
    var girFirstPuttInside1m: Double
    var girFirstPutt1To2m: Double
    var girFirstPutt2To4m: Double
    var girFirstPutt4To8m: Double
    var girFirstPuttOver8m: Double
    var puttsRecordedGir: Double
    var puttsTotalGir: Double
    var puttsTotalInside1mResolved: Double
    var puttsTotal1To2mResolved: Double
    var puttsTotal2To4mResolved: Double
    var puttsTotal4To8mResolved: Double
    var puttsTotalOver8mResolved: Double

    enum CodingKeys: String, CodingKey {
        case teeRecorded = "teeRecorded"
        case fairwayHits = "fairwayHits"
        case inPlayHits = "inPlayHits"
        case troubleCount = "troubleCount"
        case girRecorded = "girRecorded"
        case girHits = "girHits"
        case firstPuttRecorded = "firstPuttRecorded"
        case firstPuttInside1m = "firstPuttInside1m"
        case firstPutt1To2m = "firstPutt1To2m"
        case firstPutt2To4m = "firstPutt2To4m"
        case firstPutt4To8m = "firstPutt4To8m"
        case firstPuttOver8m = "firstPuttOver8m"
        case firstPuttInside1mResolved = "firstPuttInside1mResolved"
        case firstPutt1To2mResolved = "firstPutt1To2mResolved"
        case firstPutt2To4mResolved = "firstPutt2To4mResolved"
        case firstPutt4To8mResolved = "firstPutt4To8mResolved"
        case firstPuttOver8mResolved = "firstPuttOver8mResolved"
        case onePuttInside1m = "onePuttInside1m"
        case onePutt1To2m = "onePutt1To2m"
        case onePutt2To4m = "onePutt2To4m"
        case onePutt4To8m = "onePutt4To8m"
        case onePuttOver8m = "onePuttOver8m"
        case puttsRecorded = "puttsRecorded"
        case puttsTotal = "puttsTotal"
        case threePutts = "threePutts"
        case threePuttsFromOver8m = "threePuttsFromOver8m"
        case scrambleAttemptsStandard = "scrambleAttemptsStandard"
        case scrambleSuccessesStandard = "scrambleSuccessesStandard"
        case scrambleAttemptsHard = "scrambleAttemptsHard"
        case scrambleSuccessesHard = "scrambleSuccessesHard"
        case scrambleFirstPuttStandard = "scrambleFirstPuttStandard"
        case scrambleInside2mStandard = "scrambleInside2mStandard"
        case scrambleFirstPuttHard = "scrambleFirstPuttHard"
        case scrambleInside2mHard = "scrambleInside2mHard"
        case scrambleHoledStandard = "scrambleHoledStandard"
        case scrambleHoledHard = "scrambleHoledHard"
        case penaltiesRecorded = "penaltiesRecorded"
        case penaltiesTotal = "penaltiesTotal"
        case recoveryAttempts = "recoveryAttempts"
        case recoverySuccesses = "recoverySuccesses"
        case holesScored = "holesScored"
        case strokesTotal = "strokesTotal"
        case parTotal = "parTotal"
        case holesScoredPar3 = "holesScoredPar3"
        case strokesPar3 = "strokesPar3"
        case holesScoredPar4 = "holesScoredPar4"
        case strokesPar4 = "strokesPar4"
        case holesScoredPar5 = "holesScoredPar5"
        case strokesPar5 = "strokesPar5"
        case doubleBogeyPlus = "doubleBogeyPlus"
        case girHolesScored = "girHolesScored"
        case birdiesOnGir = "birdiesOnGir"
        case bounceBackOpportunities = "bounceBackOpportunities"
        case bounceBackSuccesses = "bounceBackSuccesses"
        case holesScoredFairway = "holesScoredFairway"
        case strokesVsParFairway = "strokesVsParFairway"
        case holesScoredInPlay = "holesScoredInPlay"
        case strokesVsParInPlay = "strokesVsParInPlay"
        case holesScoredTrouble = "holesScoredTrouble"
        case strokesVsParTrouble = "strokesVsParTrouble"
        case girRecordedFairway = "girRecordedFairway"
        case girHitsFairway = "girHitsFairway"
        case girRecordedInPlay = "girRecordedInPlay"
        case girHitsInPlay = "girHitsInPlay"
        case girRecordedTrouble = "girRecordedTrouble"
        case girHitsTrouble = "girHitsTrouble"
        case girFirstPuttRecorded = "girFirstPuttRecorded"
        case girFirstPuttInside1m = "girFirstPuttInside1m"
        case girFirstPutt1To2m = "girFirstPutt1To2m"
        case girFirstPutt2To4m = "girFirstPutt2To4m"
        case girFirstPutt4To8m = "girFirstPutt4To8m"
        case girFirstPuttOver8m = "girFirstPuttOver8m"
        case puttsRecordedGir = "puttsRecordedGir"
        case puttsTotalGir = "puttsTotalGir"
        case puttsTotalInside1mResolved = "puttsTotalInside1mResolved"
        case puttsTotal1To2mResolved = "puttsTotal1To2mResolved"
        case puttsTotal2To4mResolved = "puttsTotal2To4mResolved"
        case puttsTotal4To8mResolved = "puttsTotal4To8mResolved"
        case puttsTotalOver8mResolved = "puttsTotalOver8mResolved"
    }

    init(teeRecorded: Double, fairwayHits: Double, inPlayHits: Double, troubleCount: Double, girRecorded: Double, girHits: Double, firstPuttRecorded: Double, firstPuttInside1m: Double, firstPutt1To2m: Double, firstPutt2To4m: Double, firstPutt4To8m: Double, firstPuttOver8m: Double, firstPuttInside1mResolved: Double, firstPutt1To2mResolved: Double, firstPutt2To4mResolved: Double, firstPutt4To8mResolved: Double, firstPuttOver8mResolved: Double, onePuttInside1m: Double, onePutt1To2m: Double, onePutt2To4m: Double, onePutt4To8m: Double, onePuttOver8m: Double, puttsRecorded: Double, puttsTotal: Double, threePutts: Double, threePuttsFromOver8m: Double, scrambleAttemptsStandard: Double, scrambleSuccessesStandard: Double, scrambleAttemptsHard: Double, scrambleSuccessesHard: Double, scrambleFirstPuttStandard: Double, scrambleInside2mStandard: Double, scrambleFirstPuttHard: Double, scrambleInside2mHard: Double, scrambleHoledStandard: Double, scrambleHoledHard: Double, penaltiesRecorded: Double, penaltiesTotal: Double, recoveryAttempts: Double, recoverySuccesses: Double, holesScored: Double, strokesTotal: Double, parTotal: Double, holesScoredPar3: Double, strokesPar3: Double, holesScoredPar4: Double, strokesPar4: Double, holesScoredPar5: Double, strokesPar5: Double, doubleBogeyPlus: Double, girHolesScored: Double, birdiesOnGir: Double, bounceBackOpportunities: Double, bounceBackSuccesses: Double, holesScoredFairway: Double, strokesVsParFairway: Double, holesScoredInPlay: Double, strokesVsParInPlay: Double, holesScoredTrouble: Double, strokesVsParTrouble: Double, girRecordedFairway: Double, girHitsFairway: Double, girRecordedInPlay: Double, girHitsInPlay: Double, girRecordedTrouble: Double, girHitsTrouble: Double, girFirstPuttRecorded: Double, girFirstPuttInside1m: Double, girFirstPutt1To2m: Double, girFirstPutt2To4m: Double, girFirstPutt4To8m: Double, girFirstPuttOver8m: Double, puttsRecordedGir: Double, puttsTotalGir: Double, puttsTotalInside1mResolved: Double, puttsTotal1To2mResolved: Double, puttsTotal2To4mResolved: Double, puttsTotal4To8mResolved: Double, puttsTotalOver8mResolved: Double) {
        self.teeRecorded = teeRecorded
        self.fairwayHits = fairwayHits
        self.inPlayHits = inPlayHits
        self.troubleCount = troubleCount
        self.girRecorded = girRecorded
        self.girHits = girHits
        self.firstPuttRecorded = firstPuttRecorded
        self.firstPuttInside1m = firstPuttInside1m
        self.firstPutt1To2m = firstPutt1To2m
        self.firstPutt2To4m = firstPutt2To4m
        self.firstPutt4To8m = firstPutt4To8m
        self.firstPuttOver8m = firstPuttOver8m
        self.firstPuttInside1mResolved = firstPuttInside1mResolved
        self.firstPutt1To2mResolved = firstPutt1To2mResolved
        self.firstPutt2To4mResolved = firstPutt2To4mResolved
        self.firstPutt4To8mResolved = firstPutt4To8mResolved
        self.firstPuttOver8mResolved = firstPuttOver8mResolved
        self.onePuttInside1m = onePuttInside1m
        self.onePutt1To2m = onePutt1To2m
        self.onePutt2To4m = onePutt2To4m
        self.onePutt4To8m = onePutt4To8m
        self.onePuttOver8m = onePuttOver8m
        self.puttsRecorded = puttsRecorded
        self.puttsTotal = puttsTotal
        self.threePutts = threePutts
        self.threePuttsFromOver8m = threePuttsFromOver8m
        self.scrambleAttemptsStandard = scrambleAttemptsStandard
        self.scrambleSuccessesStandard = scrambleSuccessesStandard
        self.scrambleAttemptsHard = scrambleAttemptsHard
        self.scrambleSuccessesHard = scrambleSuccessesHard
        self.scrambleFirstPuttStandard = scrambleFirstPuttStandard
        self.scrambleInside2mStandard = scrambleInside2mStandard
        self.scrambleFirstPuttHard = scrambleFirstPuttHard
        self.scrambleInside2mHard = scrambleInside2mHard
        self.scrambleHoledStandard = scrambleHoledStandard
        self.scrambleHoledHard = scrambleHoledHard
        self.penaltiesRecorded = penaltiesRecorded
        self.penaltiesTotal = penaltiesTotal
        self.recoveryAttempts = recoveryAttempts
        self.recoverySuccesses = recoverySuccesses
        self.holesScored = holesScored
        self.strokesTotal = strokesTotal
        self.parTotal = parTotal
        self.holesScoredPar3 = holesScoredPar3
        self.strokesPar3 = strokesPar3
        self.holesScoredPar4 = holesScoredPar4
        self.strokesPar4 = strokesPar4
        self.holesScoredPar5 = holesScoredPar5
        self.strokesPar5 = strokesPar5
        self.doubleBogeyPlus = doubleBogeyPlus
        self.girHolesScored = girHolesScored
        self.birdiesOnGir = birdiesOnGir
        self.bounceBackOpportunities = bounceBackOpportunities
        self.bounceBackSuccesses = bounceBackSuccesses
        self.holesScoredFairway = holesScoredFairway
        self.strokesVsParFairway = strokesVsParFairway
        self.holesScoredInPlay = holesScoredInPlay
        self.strokesVsParInPlay = strokesVsParInPlay
        self.holesScoredTrouble = holesScoredTrouble
        self.strokesVsParTrouble = strokesVsParTrouble
        self.girRecordedFairway = girRecordedFairway
        self.girHitsFairway = girHitsFairway
        self.girRecordedInPlay = girRecordedInPlay
        self.girHitsInPlay = girHitsInPlay
        self.girRecordedTrouble = girRecordedTrouble
        self.girHitsTrouble = girHitsTrouble
        self.girFirstPuttRecorded = girFirstPuttRecorded
        self.girFirstPuttInside1m = girFirstPuttInside1m
        self.girFirstPutt1To2m = girFirstPutt1To2m
        self.girFirstPutt2To4m = girFirstPutt2To4m
        self.girFirstPutt4To8m = girFirstPutt4To8m
        self.girFirstPuttOver8m = girFirstPuttOver8m
        self.puttsRecordedGir = puttsRecordedGir
        self.puttsTotalGir = puttsTotalGir
        self.puttsTotalInside1mResolved = puttsTotalInside1mResolved
        self.puttsTotal1To2mResolved = puttsTotal1To2mResolved
        self.puttsTotal2To4mResolved = puttsTotal2To4mResolved
        self.puttsTotal4To8mResolved = puttsTotal4To8mResolved
        self.puttsTotalOver8mResolved = puttsTotalOver8mResolved
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.teeRecorded = try c.decode(Double.self, forKey: .teeRecorded)
        self.fairwayHits = try c.decode(Double.self, forKey: .fairwayHits)
        self.inPlayHits = try c.decode(Double.self, forKey: .inPlayHits)
        self.troubleCount = try c.decode(Double.self, forKey: .troubleCount)
        self.girRecorded = try c.decode(Double.self, forKey: .girRecorded)
        self.girHits = try c.decode(Double.self, forKey: .girHits)
        self.firstPuttRecorded = try c.decode(Double.self, forKey: .firstPuttRecorded)
        self.firstPuttInside1m = try c.decode(Double.self, forKey: .firstPuttInside1m)
        self.firstPutt1To2m = try c.decode(Double.self, forKey: .firstPutt1To2m)
        self.firstPutt2To4m = try c.decode(Double.self, forKey: .firstPutt2To4m)
        self.firstPutt4To8m = try c.decode(Double.self, forKey: .firstPutt4To8m)
        self.firstPuttOver8m = try c.decode(Double.self, forKey: .firstPuttOver8m)
        self.firstPuttInside1mResolved = try c.decode(Double.self, forKey: .firstPuttInside1mResolved)
        self.firstPutt1To2mResolved = try c.decode(Double.self, forKey: .firstPutt1To2mResolved)
        self.firstPutt2To4mResolved = try c.decode(Double.self, forKey: .firstPutt2To4mResolved)
        self.firstPutt4To8mResolved = try c.decode(Double.self, forKey: .firstPutt4To8mResolved)
        self.firstPuttOver8mResolved = try c.decode(Double.self, forKey: .firstPuttOver8mResolved)
        self.onePuttInside1m = try c.decode(Double.self, forKey: .onePuttInside1m)
        self.onePutt1To2m = try c.decode(Double.self, forKey: .onePutt1To2m)
        self.onePutt2To4m = try c.decode(Double.self, forKey: .onePutt2To4m)
        self.onePutt4To8m = try c.decode(Double.self, forKey: .onePutt4To8m)
        self.onePuttOver8m = try c.decode(Double.self, forKey: .onePuttOver8m)
        self.puttsRecorded = try c.decode(Double.self, forKey: .puttsRecorded)
        self.puttsTotal = try c.decode(Double.self, forKey: .puttsTotal)
        self.threePutts = try c.decode(Double.self, forKey: .threePutts)
        self.threePuttsFromOver8m = try c.decode(Double.self, forKey: .threePuttsFromOver8m)
        self.scrambleAttemptsStandard = try c.decode(Double.self, forKey: .scrambleAttemptsStandard)
        self.scrambleSuccessesStandard = try c.decode(Double.self, forKey: .scrambleSuccessesStandard)
        self.scrambleAttemptsHard = try c.decode(Double.self, forKey: .scrambleAttemptsHard)
        self.scrambleSuccessesHard = try c.decode(Double.self, forKey: .scrambleSuccessesHard)
        self.scrambleFirstPuttStandard = try c.decode(Double.self, forKey: .scrambleFirstPuttStandard)
        self.scrambleInside2mStandard = try c.decode(Double.self, forKey: .scrambleInside2mStandard)
        self.scrambleFirstPuttHard = try c.decode(Double.self, forKey: .scrambleFirstPuttHard)
        self.scrambleInside2mHard = try c.decode(Double.self, forKey: .scrambleInside2mHard)
        self.scrambleHoledStandard = try c.decode(Double.self, forKey: .scrambleHoledStandard)
        self.scrambleHoledHard = try c.decode(Double.self, forKey: .scrambleHoledHard)
        self.penaltiesRecorded = try c.decode(Double.self, forKey: .penaltiesRecorded)
        self.penaltiesTotal = try c.decode(Double.self, forKey: .penaltiesTotal)
        self.recoveryAttempts = try c.decode(Double.self, forKey: .recoveryAttempts)
        self.recoverySuccesses = try c.decode(Double.self, forKey: .recoverySuccesses)
        self.holesScored = try c.decode(Double.self, forKey: .holesScored)
        self.strokesTotal = try c.decode(Double.self, forKey: .strokesTotal)
        self.parTotal = try c.decode(Double.self, forKey: .parTotal)
        self.holesScoredPar3 = try c.decode(Double.self, forKey: .holesScoredPar3)
        self.strokesPar3 = try c.decode(Double.self, forKey: .strokesPar3)
        self.holesScoredPar4 = try c.decode(Double.self, forKey: .holesScoredPar4)
        self.strokesPar4 = try c.decode(Double.self, forKey: .strokesPar4)
        self.holesScoredPar5 = try c.decode(Double.self, forKey: .holesScoredPar5)
        self.strokesPar5 = try c.decode(Double.self, forKey: .strokesPar5)
        self.doubleBogeyPlus = try c.decode(Double.self, forKey: .doubleBogeyPlus)
        self.girHolesScored = try c.decode(Double.self, forKey: .girHolesScored)
        self.birdiesOnGir = try c.decode(Double.self, forKey: .birdiesOnGir)
        self.bounceBackOpportunities = try c.decode(Double.self, forKey: .bounceBackOpportunities)
        self.bounceBackSuccesses = try c.decode(Double.self, forKey: .bounceBackSuccesses)
        self.holesScoredFairway = try c.decode(Double.self, forKey: .holesScoredFairway)
        self.strokesVsParFairway = try c.decode(Double.self, forKey: .strokesVsParFairway)
        self.holesScoredInPlay = try c.decode(Double.self, forKey: .holesScoredInPlay)
        self.strokesVsParInPlay = try c.decode(Double.self, forKey: .strokesVsParInPlay)
        self.holesScoredTrouble = try c.decode(Double.self, forKey: .holesScoredTrouble)
        self.strokesVsParTrouble = try c.decode(Double.self, forKey: .strokesVsParTrouble)
        self.girRecordedFairway = try c.decode(Double.self, forKey: .girRecordedFairway)
        self.girHitsFairway = try c.decode(Double.self, forKey: .girHitsFairway)
        self.girRecordedInPlay = try c.decode(Double.self, forKey: .girRecordedInPlay)
        self.girHitsInPlay = try c.decode(Double.self, forKey: .girHitsInPlay)
        self.girRecordedTrouble = try c.decode(Double.self, forKey: .girRecordedTrouble)
        self.girHitsTrouble = try c.decode(Double.self, forKey: .girHitsTrouble)
        self.girFirstPuttRecorded = try c.decode(Double.self, forKey: .girFirstPuttRecorded)
        self.girFirstPuttInside1m = try c.decode(Double.self, forKey: .girFirstPuttInside1m)
        self.girFirstPutt1To2m = try c.decode(Double.self, forKey: .girFirstPutt1To2m)
        self.girFirstPutt2To4m = try c.decode(Double.self, forKey: .girFirstPutt2To4m)
        self.girFirstPutt4To8m = try c.decode(Double.self, forKey: .girFirstPutt4To8m)
        self.girFirstPuttOver8m = try c.decode(Double.self, forKey: .girFirstPuttOver8m)
        self.puttsRecordedGir = try c.decode(Double.self, forKey: .puttsRecordedGir)
        self.puttsTotalGir = try c.decode(Double.self, forKey: .puttsTotalGir)
        self.puttsTotalInside1mResolved = try c.decode(Double.self, forKey: .puttsTotalInside1mResolved)
        self.puttsTotal1To2mResolved = try c.decode(Double.self, forKey: .puttsTotal1To2mResolved)
        self.puttsTotal2To4mResolved = try c.decode(Double.self, forKey: .puttsTotal2To4mResolved)
        self.puttsTotal4To8mResolved = try c.decode(Double.self, forKey: .puttsTotal4To8mResolved)
        self.puttsTotalOver8mResolved = try c.decode(Double.self, forKey: .puttsTotalOver8mResolved)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(teeRecorded, forKey: .teeRecorded)
        try c.encode(fairwayHits, forKey: .fairwayHits)
        try c.encode(inPlayHits, forKey: .inPlayHits)
        try c.encode(troubleCount, forKey: .troubleCount)
        try c.encode(girRecorded, forKey: .girRecorded)
        try c.encode(girHits, forKey: .girHits)
        try c.encode(firstPuttRecorded, forKey: .firstPuttRecorded)
        try c.encode(firstPuttInside1m, forKey: .firstPuttInside1m)
        try c.encode(firstPutt1To2m, forKey: .firstPutt1To2m)
        try c.encode(firstPutt2To4m, forKey: .firstPutt2To4m)
        try c.encode(firstPutt4To8m, forKey: .firstPutt4To8m)
        try c.encode(firstPuttOver8m, forKey: .firstPuttOver8m)
        try c.encode(firstPuttInside1mResolved, forKey: .firstPuttInside1mResolved)
        try c.encode(firstPutt1To2mResolved, forKey: .firstPutt1To2mResolved)
        try c.encode(firstPutt2To4mResolved, forKey: .firstPutt2To4mResolved)
        try c.encode(firstPutt4To8mResolved, forKey: .firstPutt4To8mResolved)
        try c.encode(firstPuttOver8mResolved, forKey: .firstPuttOver8mResolved)
        try c.encode(onePuttInside1m, forKey: .onePuttInside1m)
        try c.encode(onePutt1To2m, forKey: .onePutt1To2m)
        try c.encode(onePutt2To4m, forKey: .onePutt2To4m)
        try c.encode(onePutt4To8m, forKey: .onePutt4To8m)
        try c.encode(onePuttOver8m, forKey: .onePuttOver8m)
        try c.encode(puttsRecorded, forKey: .puttsRecorded)
        try c.encode(puttsTotal, forKey: .puttsTotal)
        try c.encode(threePutts, forKey: .threePutts)
        try c.encode(threePuttsFromOver8m, forKey: .threePuttsFromOver8m)
        try c.encode(scrambleAttemptsStandard, forKey: .scrambleAttemptsStandard)
        try c.encode(scrambleSuccessesStandard, forKey: .scrambleSuccessesStandard)
        try c.encode(scrambleAttemptsHard, forKey: .scrambleAttemptsHard)
        try c.encode(scrambleSuccessesHard, forKey: .scrambleSuccessesHard)
        try c.encode(scrambleFirstPuttStandard, forKey: .scrambleFirstPuttStandard)
        try c.encode(scrambleInside2mStandard, forKey: .scrambleInside2mStandard)
        try c.encode(scrambleFirstPuttHard, forKey: .scrambleFirstPuttHard)
        try c.encode(scrambleInside2mHard, forKey: .scrambleInside2mHard)
        try c.encode(scrambleHoledStandard, forKey: .scrambleHoledStandard)
        try c.encode(scrambleHoledHard, forKey: .scrambleHoledHard)
        try c.encode(penaltiesRecorded, forKey: .penaltiesRecorded)
        try c.encode(penaltiesTotal, forKey: .penaltiesTotal)
        try c.encode(recoveryAttempts, forKey: .recoveryAttempts)
        try c.encode(recoverySuccesses, forKey: .recoverySuccesses)
        try c.encode(holesScored, forKey: .holesScored)
        try c.encode(strokesTotal, forKey: .strokesTotal)
        try c.encode(parTotal, forKey: .parTotal)
        try c.encode(holesScoredPar3, forKey: .holesScoredPar3)
        try c.encode(strokesPar3, forKey: .strokesPar3)
        try c.encode(holesScoredPar4, forKey: .holesScoredPar4)
        try c.encode(strokesPar4, forKey: .strokesPar4)
        try c.encode(holesScoredPar5, forKey: .holesScoredPar5)
        try c.encode(strokesPar5, forKey: .strokesPar5)
        try c.encode(doubleBogeyPlus, forKey: .doubleBogeyPlus)
        try c.encode(girHolesScored, forKey: .girHolesScored)
        try c.encode(birdiesOnGir, forKey: .birdiesOnGir)
        try c.encode(bounceBackOpportunities, forKey: .bounceBackOpportunities)
        try c.encode(bounceBackSuccesses, forKey: .bounceBackSuccesses)
        try c.encode(holesScoredFairway, forKey: .holesScoredFairway)
        try c.encode(strokesVsParFairway, forKey: .strokesVsParFairway)
        try c.encode(holesScoredInPlay, forKey: .holesScoredInPlay)
        try c.encode(strokesVsParInPlay, forKey: .strokesVsParInPlay)
        try c.encode(holesScoredTrouble, forKey: .holesScoredTrouble)
        try c.encode(strokesVsParTrouble, forKey: .strokesVsParTrouble)
        try c.encode(girRecordedFairway, forKey: .girRecordedFairway)
        try c.encode(girHitsFairway, forKey: .girHitsFairway)
        try c.encode(girRecordedInPlay, forKey: .girRecordedInPlay)
        try c.encode(girHitsInPlay, forKey: .girHitsInPlay)
        try c.encode(girRecordedTrouble, forKey: .girRecordedTrouble)
        try c.encode(girHitsTrouble, forKey: .girHitsTrouble)
        try c.encode(girFirstPuttRecorded, forKey: .girFirstPuttRecorded)
        try c.encode(girFirstPuttInside1m, forKey: .girFirstPuttInside1m)
        try c.encode(girFirstPutt1To2m, forKey: .girFirstPutt1To2m)
        try c.encode(girFirstPutt2To4m, forKey: .girFirstPutt2To4m)
        try c.encode(girFirstPutt4To8m, forKey: .girFirstPutt4To8m)
        try c.encode(girFirstPuttOver8m, forKey: .girFirstPuttOver8m)
        try c.encode(puttsRecordedGir, forKey: .puttsRecordedGir)
        try c.encode(puttsTotalGir, forKey: .puttsTotalGir)
        try c.encode(puttsTotalInside1mResolved, forKey: .puttsTotalInside1mResolved)
        try c.encode(puttsTotal1To2mResolved, forKey: .puttsTotal1To2mResolved)
        try c.encode(puttsTotal2To4mResolved, forKey: .puttsTotal2To4mResolved)
        try c.encode(puttsTotal4To8mResolved, forKey: .puttsTotal4To8mResolved)
        try c.encode(puttsTotalOver8mResolved, forKey: .puttsTotalOver8mResolved)
    }
}

struct PlayerRoundStats: Codable, Sendable, Equatable {
    var roundId: String
    var date: String
    var courseName: String?
    var courseId: String
    var roundType: RoundType
    var venueType: VenueType
    var name: String?
    var holeCount: Double
    var measures: StatMeasures

    enum CodingKeys: String, CodingKey {
        case roundId = "roundId"
        case date = "date"
        case courseName = "courseName"
        case courseId = "courseId"
        case roundType = "roundType"
        case venueType = "venueType"
        case name = "name"
        case holeCount = "holeCount"
        case measures = "measures"
    }

    init(roundId: String, date: String, courseName: String? = nil, courseId: String, roundType: RoundType, venueType: VenueType, name: String? = nil, holeCount: Double, measures: StatMeasures) {
        self.roundId = roundId
        self.date = date
        self.courseName = courseName
        self.courseId = courseId
        self.roundType = roundType
        self.venueType = venueType
        self.name = name
        self.holeCount = holeCount
        self.measures = measures
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.roundId = try c.decode(String.self, forKey: .roundId)
        self.date = try c.decode(String.self, forKey: .date)
        self.courseName = try c.decodeIfPresent(String.self, forKey: .courseName)
        self.courseId = try c.decode(String.self, forKey: .courseId)
        self.roundType = try c.decode(RoundType.self, forKey: .roundType)
        self.venueType = try c.decode(VenueType.self, forKey: .venueType)
        self.name = try c.decodeIfPresent(String.self, forKey: .name)
        self.holeCount = try c.decode(Double.self, forKey: .holeCount)
        self.measures = try c.decode(StatMeasures.self, forKey: .measures)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(roundId, forKey: .roundId)
        try c.encode(date, forKey: .date)
        if let courseName {
            try c.encode(courseName, forKey: .courseName)
        } else {
            try c.encodeNil(forKey: .courseName)
        }
        try c.encode(courseId, forKey: .courseId)
        try c.encode(roundType, forKey: .roundType)
        try c.encode(venueType, forKey: .venueType)
        if let name {
            try c.encode(name, forKey: .name)
        } else {
            try c.encodeNil(forKey: .name)
        }
        try c.encode(holeCount, forKey: .holeCount)
        try c.encode(measures, forKey: .measures)
    }
}

struct AppendedStatEvent: Codable, Sendable, Equatable {
    var event: StatEvent
    var inserted: Bool

    enum CodingKeys: String, CodingKey {
        case event = "event"
        case inserted = "inserted"
    }

    init(event: StatEvent, inserted: Bool) {
        self.event = event
        self.inserted = inserted
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.event = try c.decode(StatEvent.self, forKey: .event)
        self.inserted = try c.decode(Bool.self, forKey: .inserted)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(event, forKey: .event)
        try c.encode(inserted, forKey: .inserted)
    }
}

struct StatModules: Codable, Sendable, Equatable {
    var tee: Bool
    var approach: Bool
    var putting: Bool
    var shortGame: Bool
    var penalties: Bool
    var recovery: Bool

    enum CodingKeys: String, CodingKey {
        case tee = "tee"
        case approach = "approach"
        case putting = "putting"
        case shortGame = "shortGame"
        case penalties = "penalties"
        case recovery = "recovery"
    }

    init(tee: Bool, approach: Bool, putting: Bool, shortGame: Bool, penalties: Bool, recovery: Bool) {
        self.tee = tee
        self.approach = approach
        self.putting = putting
        self.shortGame = shortGame
        self.penalties = penalties
        self.recovery = recovery
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.tee = try c.decode(Bool.self, forKey: .tee)
        self.approach = try c.decode(Bool.self, forKey: .approach)
        self.putting = try c.decode(Bool.self, forKey: .putting)
        self.shortGame = try c.decode(Bool.self, forKey: .shortGame)
        self.penalties = try c.decode(Bool.self, forKey: .penalties)
        self.recovery = try c.decode(Bool.self, forKey: .recovery)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(tee, forKey: .tee)
        try c.encode(approach, forKey: .approach)
        try c.encode(putting, forKey: .putting)
        try c.encode(shortGame, forKey: .shortGame)
        try c.encode(penalties, forKey: .penalties)
        try c.encode(recovery, forKey: .recovery)
    }
}

enum StatEventKey: String, Codable, Sendable, Equatable {
    case penalties = "penalties"
    case teeResult = "tee_result"
    case gir = "gir"
    case firstPutt = "first_putt"
    case putts = "putts"
    case shortGameDifficulty = "short_game_difficulty"
    case recoveryOk = "recovery_ok"
}

struct StatEvent: Codable, Sendable, Equatable {
    var id: String
    var roundId: String
    var playHoleId: String
    var playerId: String
    var seq: Double
    var key: StatEventKey
    var value: String?
    var recordedByPlayerId: String?
    var recordedAt: String
    var clientEventId: String

    enum CodingKeys: String, CodingKey {
        case id = "id"
        case roundId = "roundId"
        case playHoleId = "playHoleId"
        case playerId = "playerId"
        case seq = "seq"
        case key = "key"
        case value = "value"
        case recordedByPlayerId = "recordedByPlayerId"
        case recordedAt = "recordedAt"
        case clientEventId = "clientEventId"
    }

    init(id: String, roundId: String, playHoleId: String, playerId: String, seq: Double, key: StatEventKey, value: String? = nil, recordedByPlayerId: String? = nil, recordedAt: String, clientEventId: String) {
        self.id = id
        self.roundId = roundId
        self.playHoleId = playHoleId
        self.playerId = playerId
        self.seq = seq
        self.key = key
        self.value = value
        self.recordedByPlayerId = recordedByPlayerId
        self.recordedAt = recordedAt
        self.clientEventId = clientEventId
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try c.decode(String.self, forKey: .id)
        self.roundId = try c.decode(String.self, forKey: .roundId)
        self.playHoleId = try c.decode(String.self, forKey: .playHoleId)
        self.playerId = try c.decode(String.self, forKey: .playerId)
        self.seq = try c.decode(Double.self, forKey: .seq)
        self.key = try c.decode(StatEventKey.self, forKey: .key)
        self.value = try c.decodeIfPresent(String.self, forKey: .value)
        self.recordedByPlayerId = try c.decodeIfPresent(String.self, forKey: .recordedByPlayerId)
        self.recordedAt = try c.decode(String.self, forKey: .recordedAt)
        self.clientEventId = try c.decode(String.self, forKey: .clientEventId)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encode(roundId, forKey: .roundId)
        try c.encode(playHoleId, forKey: .playHoleId)
        try c.encode(playerId, forKey: .playerId)
        try c.encode(seq, forKey: .seq)
        try c.encode(key, forKey: .key)
        if let value {
            try c.encode(value, forKey: .value)
        } else {
            try c.encodeNil(forKey: .value)
        }
        if let recordedByPlayerId {
            try c.encode(recordedByPlayerId, forKey: .recordedByPlayerId)
        } else {
            try c.encodeNil(forKey: .recordedByPlayerId)
        }
        try c.encode(recordedAt, forKey: .recordedAt)
        try c.encode(clientEventId, forKey: .clientEventId)
    }
}

struct PlayerStatsPutMyConfigInput: Codable, Sendable, Equatable {
    var enabled: Bool
    var tee: Bool
    var approach: Bool
    var putting: Bool
    var shortGame: Bool
    var penalties: Bool
    var recovery: Bool

    enum CodingKeys: String, CodingKey {
        case enabled = "enabled"
        case tee = "tee"
        case approach = "approach"
        case putting = "putting"
        case shortGame = "shortGame"
        case penalties = "penalties"
        case recovery = "recovery"
    }

    init(enabled: Bool, tee: Bool, approach: Bool, putting: Bool, shortGame: Bool, penalties: Bool, recovery: Bool) {
        self.enabled = enabled
        self.tee = tee
        self.approach = approach
        self.putting = putting
        self.shortGame = shortGame
        self.penalties = penalties
        self.recovery = recovery
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.enabled = try c.decode(Bool.self, forKey: .enabled)
        self.tee = try c.decode(Bool.self, forKey: .tee)
        self.approach = try c.decode(Bool.self, forKey: .approach)
        self.putting = try c.decode(Bool.self, forKey: .putting)
        self.shortGame = try c.decode(Bool.self, forKey: .shortGame)
        self.penalties = try c.decode(Bool.self, forKey: .penalties)
        self.recovery = try c.decode(Bool.self, forKey: .recovery)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(enabled, forKey: .enabled)
        try c.encode(tee, forKey: .tee)
        try c.encode(approach, forKey: .approach)
        try c.encode(putting, forKey: .putting)
        try c.encode(shortGame, forKey: .shortGame)
        try c.encode(penalties, forKey: .penalties)
        try c.encode(recovery, forKey: .recovery)
    }
}

struct PlayerStatsMyStatsInput: Codable, Sendable, Equatable {
    var limit: Double?
    var cursor: String?

    enum CodingKeys: String, CodingKey {
        case limit = "limit"
        case cursor = "cursor"
    }

    init(limit: Double? = nil, cursor: String? = nil) {
        self.limit = limit
        self.cursor = cursor
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.limit = try c.decodeIfPresent(Double.self, forKey: .limit)
        self.cursor = try c.decodeIfPresent(String.self, forKey: .cursor)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encodeIfPresent(limit, forKey: .limit)
        try c.encodeIfPresent(cursor, forKey: .cursor)
    }
}

struct PlayerStatsAppendEventsInputItemsItem: Codable, Sendable, Equatable {
    var playHoleId: String
    var playerId: String
    var key: StatEventKey
    var value: String?
    var clientEventId: String

    enum CodingKeys: String, CodingKey {
        case playHoleId = "playHoleId"
        case playerId = "playerId"
        case key = "key"
        case value = "value"
        case clientEventId = "clientEventId"
    }

    init(playHoleId: String, playerId: String, key: StatEventKey, value: String? = nil, clientEventId: String) {
        self.playHoleId = playHoleId
        self.playerId = playerId
        self.key = key
        self.value = value
        self.clientEventId = clientEventId
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.playHoleId = try c.decode(String.self, forKey: .playHoleId)
        self.playerId = try c.decode(String.self, forKey: .playerId)
        self.key = try c.decode(StatEventKey.self, forKey: .key)
        self.value = try c.decodeIfPresent(String.self, forKey: .value)
        self.clientEventId = try c.decode(String.self, forKey: .clientEventId)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(playHoleId, forKey: .playHoleId)
        try c.encode(playerId, forKey: .playerId)
        try c.encode(key, forKey: .key)
        if let value {
            try c.encode(value, forKey: .value)
        } else {
            try c.encodeNil(forKey: .value)
        }
        try c.encode(clientEventId, forKey: .clientEventId)
    }
}

struct PlayerStatsAppendEventsInput: Codable, Sendable, Equatable {
    var token: String
    var items: [PlayerStatsAppendEventsInputItemsItem]

    enum CodingKeys: String, CodingKey {
        case token = "token"
        case items = "items"
    }

    init(token: String, items: [PlayerStatsAppendEventsInputItemsItem]) {
        self.token = token
        self.items = items
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.token = try c.decode(String.self, forKey: .token)
        self.items = try c.decode([PlayerStatsAppendEventsInputItemsItem].self, forKey: .items)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(token, forKey: .token)
        try c.encode(items, forKey: .items)
    }
}
