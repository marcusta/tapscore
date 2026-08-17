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

enum TeeMissDir: String, Codable, Sendable, Equatable {
    case `left` = "left"
    case `right` = "right"
}

enum GreenMissDir: String, Codable, Sendable, Equatable {
    case `left` = "left"
    case `right` = "right"
    case long = "long"
    case short = "short"
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
    case bunker = "bunker"
}

enum PenaltySource: String, Codable, Sendable, Equatable {
    case tee = "tee"
    case approach = "approach"
    case shortOrGreen = "short_or_green"
}

struct PlayerHoleStats: Codable, Sendable, Equatable {
    var roundId: String
    var playHoleId: String
    var playerId: String
    var teeResult: TeeResult?
    var teeMissDir: TeeMissDir?
    var gir: Bool?
    var greenMissDir: GreenMissDir?
    var firstPutt: FirstPutt?
    var putts: Double?
    var shortGameDifficulty: ShortGameDifficulty?
    var shortGameStrokes: Double?
    var penalties: Double?
    var penaltySource: PenaltySource?
    var recoveryOk: Bool?

    enum CodingKeys: String, CodingKey {
        case roundId = "roundId"
        case playHoleId = "playHoleId"
        case playerId = "playerId"
        case teeResult = "teeResult"
        case teeMissDir = "teeMissDir"
        case gir = "gir"
        case greenMissDir = "greenMissDir"
        case firstPutt = "firstPutt"
        case putts = "putts"
        case shortGameDifficulty = "shortGameDifficulty"
        case shortGameStrokes = "shortGameStrokes"
        case penalties = "penalties"
        case penaltySource = "penaltySource"
        case recoveryOk = "recoveryOk"
    }

    init(roundId: String, playHoleId: String, playerId: String, teeResult: TeeResult? = nil, teeMissDir: TeeMissDir? = nil, gir: Bool? = nil, greenMissDir: GreenMissDir? = nil, firstPutt: FirstPutt? = nil, putts: Double? = nil, shortGameDifficulty: ShortGameDifficulty? = nil, shortGameStrokes: Double? = nil, penalties: Double? = nil, penaltySource: PenaltySource? = nil, recoveryOk: Bool? = nil) {
        self.roundId = roundId
        self.playHoleId = playHoleId
        self.playerId = playerId
        self.teeResult = teeResult
        self.teeMissDir = teeMissDir
        self.gir = gir
        self.greenMissDir = greenMissDir
        self.firstPutt = firstPutt
        self.putts = putts
        self.shortGameDifficulty = shortGameDifficulty
        self.shortGameStrokes = shortGameStrokes
        self.penalties = penalties
        self.penaltySource = penaltySource
        self.recoveryOk = recoveryOk
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.roundId = try c.decode(String.self, forKey: .roundId)
        self.playHoleId = try c.decode(String.self, forKey: .playHoleId)
        self.playerId = try c.decode(String.self, forKey: .playerId)
        self.teeResult = try c.decodeIfPresent(TeeResult.self, forKey: .teeResult)
        self.teeMissDir = try c.decodeIfPresent(TeeMissDir.self, forKey: .teeMissDir)
        self.gir = try c.decodeIfPresent(Bool.self, forKey: .gir)
        self.greenMissDir = try c.decodeIfPresent(GreenMissDir.self, forKey: .greenMissDir)
        self.firstPutt = try c.decodeIfPresent(FirstPutt.self, forKey: .firstPutt)
        self.putts = try c.decodeIfPresent(Double.self, forKey: .putts)
        self.shortGameDifficulty = try c.decodeIfPresent(ShortGameDifficulty.self, forKey: .shortGameDifficulty)
        self.shortGameStrokes = try c.decodeIfPresent(Double.self, forKey: .shortGameStrokes)
        self.penalties = try c.decodeIfPresent(Double.self, forKey: .penalties)
        self.penaltySource = try c.decodeIfPresent(PenaltySource.self, forKey: .penaltySource)
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
        if let teeMissDir {
            try c.encode(teeMissDir, forKey: .teeMissDir)
        } else {
            try c.encodeNil(forKey: .teeMissDir)
        }
        if let gir {
            try c.encode(gir, forKey: .gir)
        } else {
            try c.encodeNil(forKey: .gir)
        }
        if let greenMissDir {
            try c.encode(greenMissDir, forKey: .greenMissDir)
        } else {
            try c.encodeNil(forKey: .greenMissDir)
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
        if let shortGameStrokes {
            try c.encode(shortGameStrokes, forKey: .shortGameStrokes)
        } else {
            try c.encodeNil(forKey: .shortGameStrokes)
        }
        if let penalties {
            try c.encode(penalties, forKey: .penalties)
        } else {
            try c.encodeNil(forKey: .penalties)
        }
        if let penaltySource {
            try c.encode(penaltySource, forKey: .penaltySource)
        } else {
            try c.encodeNil(forKey: .penaltySource)
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
    var teeMissRecorded: Double
    var teeMissLeft: Double
    var teeMissRight: Double
    var teeTroubleLeft: Double
    var teeTroubleRight: Double
    var girRecorded: Double
    var girHits: Double
    var greenMissRecorded: Double
    var greenMissLong: Double
    var greenMissShort: Double
    var greenMissLeft: Double
    var greenMissRight: Double
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
    var scrambleAttemptsBunker: Double
    var scrambleSuccessesBunker: Double
    var scrambleFirstPuttBunker: Double
    var scrambleInside2mBunker: Double
    var scrambleHoledBunker: Double
    var shortGameStrokesRecorded: Double
    var shortGameStrokesEffective: Double
    var shortGameStrokesEffectiveStandard: Double
    var shortGameStrokesEffectiveHard: Double
    var shortGameStrokesEffectiveBunker: Double
    var holesMultiChip: Double
    var holesMultiChipBunker: Double
    var penaltiesRecorded: Double
    var penaltiesTotal: Double
    var recoveryAttempts: Double
    var recoverySuccesses: Double
    var penaltySourceRecorded: Double
    var penaltiesTee: Double
    var penaltiesApproach: Double
    var penaltiesShort: Double
    var holesScored: Double
    var strokesTotal: Double
    var parTotal: Double
    var holesScoredPar3: Double
    var strokesPar3: Double
    var holesScoredPar4: Double
    var strokesPar4: Double
    var holesScoredPar5: Double
    var strokesPar5: Double
    var holesEagleOrBetter: Double
    var holesBirdie: Double
    var holesPar: Double
    var holesBogey: Double
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
    var strokesVsParGirHit: Double
    var holesScoredGirMiss: Double
    var strokesVsParGirMiss: Double
    var girRecordedPar3: Double
    var girHitsPar3: Double
    var girRecordedPar4: Double
    var girHitsPar4: Double
    var girRecordedPar5: Double
    var girHitsPar5: Double
    var holesZeroPutt: Double
    var holesOnePutt: Double
    var holesTwoPutt: Double
    var puttsRecordedPar3: Double
    var puttsTotalPar3: Double
    var puttsRecordedPar4: Double
    var puttsTotalPar4: Double
    var puttsRecordedPar5: Double
    var puttsTotalPar5: Double
    var holesWithPenalty: Double
    var holesScoredPenalty: Double
    var strokesVsParPenalty: Double
    var holesScoredPenaltyFree: Double
    var strokesVsParPenaltyFree: Double
    var teeRecordedPar4: Double
    var fairwayHitsPar4: Double
    var inPlayHitsPar4: Double
    var troubleCountPar4: Double
    var teeRecordedPar5: Double
    var fairwayHitsPar5: Double
    var inPlayHitsPar5: Double
    var troubleCountPar5: Double
    var attHolesPar3Gir: Double
    var attHolesPar3Miss: Double
    var attHolesPar45Gir: Double
    var attHolesPar45Miss: Double
    var attStrokes: Double
    var attPutts: Double
    var attPenalties: Double
    var attFairwayPar4: Double
    var attInPlayPar4: Double
    var attTroublePar4: Double
    var attFairwayPar5: Double
    var attInPlayPar5: Double
    var attTroublePar5: Double
    var attGirFirstPuttInside1m: Double
    var attGirFirstPutt1To2m: Double
    var attGirFirstPutt2To4m: Double
    var attGirFirstPutt4To8m: Double
    var attGirFirstPuttOver8m: Double
    var attGirHoled: Double
    var attMissStandard: Double
    var attMissHard: Double
    var attChipInside2mStandard: Double
    var attChipOutside2mStandard: Double
    var attChipHoledStandard: Double
    var attChipInside2mHard: Double
    var attChipOutside2mHard: Double
    var attChipHoledHard: Double
    var attMissBunker: Double
    var attChipInside2mBunker: Double
    var attChipOutside2mBunker: Double
    var attChipHoledBunker: Double
    var attSgStrokesEffectiveStandard: Double
    var attSgStrokesEffectiveHard: Double
    var attSgStrokesEffectiveBunker: Double
    var scrambleSingleChipStandard: Double
    var scrambleChipInStandard: Double
    var scrambleChipOnePuttStandard: Double
    var scrambleChipTwoPuttStandard: Double
    var scrambleChipThreePuttStandard: Double
    var scrambleSingleChipHard: Double
    var scrambleChipInHard: Double
    var scrambleChipOnePuttHard: Double
    var scrambleChipTwoPuttHard: Double
    var scrambleChipThreePuttHard: Double
    var scrambleSingleChipBunker: Double
    var scrambleChipInBunker: Double
    var scrambleChipOnePuttBunker: Double
    var scrambleChipTwoPuttBunker: Double
    var scrambleChipThreePuttBunker: Double
    var holesMultiChipStandard: Double
    var holesMultiChipHard: Double
    var scrambleInside2mResolvedStandard: Double
    var scrambleInside2mSavedStandard: Double
    var scrambleInside2mResolvedHard: Double
    var scrambleInside2mSavedHard: Double
    var scrambleInside2mResolvedBunker: Double
    var scrambleInside2mSavedBunker: Double
    var holesScoredMissStandard: Double
    var strokesVsParMissStandard: Double
    var holesScoredMissHard: Double
    var strokesVsParMissHard: Double
    var holesScoredMissBunker: Double
    var strokesVsParMissBunker: Double
    var dblPenalty: Double
    var dblFailedRecovery: Double
    var dblMultiChip: Double
    var dblThreePutt: Double
    var dblTroubleTee: Double
    var dblFullSwing: Double
    var dblUnattributed: Double
    var dblPenaltyTee: Double
    var dblPenaltyApproach: Double
    var dblPenaltyShort: Double
    var dblPenaltyUnknown: Double

    enum CodingKeys: String, CodingKey {
        case teeRecorded = "teeRecorded"
        case fairwayHits = "fairwayHits"
        case inPlayHits = "inPlayHits"
        case troubleCount = "troubleCount"
        case teeMissRecorded = "teeMissRecorded"
        case teeMissLeft = "teeMissLeft"
        case teeMissRight = "teeMissRight"
        case teeTroubleLeft = "teeTroubleLeft"
        case teeTroubleRight = "teeTroubleRight"
        case girRecorded = "girRecorded"
        case girHits = "girHits"
        case greenMissRecorded = "greenMissRecorded"
        case greenMissLong = "greenMissLong"
        case greenMissShort = "greenMissShort"
        case greenMissLeft = "greenMissLeft"
        case greenMissRight = "greenMissRight"
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
        case scrambleAttemptsBunker = "scrambleAttemptsBunker"
        case scrambleSuccessesBunker = "scrambleSuccessesBunker"
        case scrambleFirstPuttBunker = "scrambleFirstPuttBunker"
        case scrambleInside2mBunker = "scrambleInside2mBunker"
        case scrambleHoledBunker = "scrambleHoledBunker"
        case shortGameStrokesRecorded = "shortGameStrokesRecorded"
        case shortGameStrokesEffective = "shortGameStrokesEffective"
        case shortGameStrokesEffectiveStandard = "shortGameStrokesEffectiveStandard"
        case shortGameStrokesEffectiveHard = "shortGameStrokesEffectiveHard"
        case shortGameStrokesEffectiveBunker = "shortGameStrokesEffectiveBunker"
        case holesMultiChip = "holesMultiChip"
        case holesMultiChipBunker = "holesMultiChipBunker"
        case penaltiesRecorded = "penaltiesRecorded"
        case penaltiesTotal = "penaltiesTotal"
        case recoveryAttempts = "recoveryAttempts"
        case recoverySuccesses = "recoverySuccesses"
        case penaltySourceRecorded = "penaltySourceRecorded"
        case penaltiesTee = "penaltiesTee"
        case penaltiesApproach = "penaltiesApproach"
        case penaltiesShort = "penaltiesShort"
        case holesScored = "holesScored"
        case strokesTotal = "strokesTotal"
        case parTotal = "parTotal"
        case holesScoredPar3 = "holesScoredPar3"
        case strokesPar3 = "strokesPar3"
        case holesScoredPar4 = "holesScoredPar4"
        case strokesPar4 = "strokesPar4"
        case holesScoredPar5 = "holesScoredPar5"
        case strokesPar5 = "strokesPar5"
        case holesEagleOrBetter = "holesEagleOrBetter"
        case holesBirdie = "holesBirdie"
        case holesPar = "holesPar"
        case holesBogey = "holesBogey"
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
        case strokesVsParGirHit = "strokesVsParGirHit"
        case holesScoredGirMiss = "holesScoredGirMiss"
        case strokesVsParGirMiss = "strokesVsParGirMiss"
        case girRecordedPar3 = "girRecordedPar3"
        case girHitsPar3 = "girHitsPar3"
        case girRecordedPar4 = "girRecordedPar4"
        case girHitsPar4 = "girHitsPar4"
        case girRecordedPar5 = "girRecordedPar5"
        case girHitsPar5 = "girHitsPar5"
        case holesZeroPutt = "holesZeroPutt"
        case holesOnePutt = "holesOnePutt"
        case holesTwoPutt = "holesTwoPutt"
        case puttsRecordedPar3 = "puttsRecordedPar3"
        case puttsTotalPar3 = "puttsTotalPar3"
        case puttsRecordedPar4 = "puttsRecordedPar4"
        case puttsTotalPar4 = "puttsTotalPar4"
        case puttsRecordedPar5 = "puttsRecordedPar5"
        case puttsTotalPar5 = "puttsTotalPar5"
        case holesWithPenalty = "holesWithPenalty"
        case holesScoredPenalty = "holesScoredPenalty"
        case strokesVsParPenalty = "strokesVsParPenalty"
        case holesScoredPenaltyFree = "holesScoredPenaltyFree"
        case strokesVsParPenaltyFree = "strokesVsParPenaltyFree"
        case teeRecordedPar4 = "teeRecordedPar4"
        case fairwayHitsPar4 = "fairwayHitsPar4"
        case inPlayHitsPar4 = "inPlayHitsPar4"
        case troubleCountPar4 = "troubleCountPar4"
        case teeRecordedPar5 = "teeRecordedPar5"
        case fairwayHitsPar5 = "fairwayHitsPar5"
        case inPlayHitsPar5 = "inPlayHitsPar5"
        case troubleCountPar5 = "troubleCountPar5"
        case attHolesPar3Gir = "attHolesPar3Gir"
        case attHolesPar3Miss = "attHolesPar3Miss"
        case attHolesPar45Gir = "attHolesPar45Gir"
        case attHolesPar45Miss = "attHolesPar45Miss"
        case attStrokes = "attStrokes"
        case attPutts = "attPutts"
        case attPenalties = "attPenalties"
        case attFairwayPar4 = "attFairwayPar4"
        case attInPlayPar4 = "attInPlayPar4"
        case attTroublePar4 = "attTroublePar4"
        case attFairwayPar5 = "attFairwayPar5"
        case attInPlayPar5 = "attInPlayPar5"
        case attTroublePar5 = "attTroublePar5"
        case attGirFirstPuttInside1m = "attGirFirstPuttInside1m"
        case attGirFirstPutt1To2m = "attGirFirstPutt1To2m"
        case attGirFirstPutt2To4m = "attGirFirstPutt2To4m"
        case attGirFirstPutt4To8m = "attGirFirstPutt4To8m"
        case attGirFirstPuttOver8m = "attGirFirstPuttOver8m"
        case attGirHoled = "attGirHoled"
        case attMissStandard = "attMissStandard"
        case attMissHard = "attMissHard"
        case attChipInside2mStandard = "attChipInside2mStandard"
        case attChipOutside2mStandard = "attChipOutside2mStandard"
        case attChipHoledStandard = "attChipHoledStandard"
        case attChipInside2mHard = "attChipInside2mHard"
        case attChipOutside2mHard = "attChipOutside2mHard"
        case attChipHoledHard = "attChipHoledHard"
        case attMissBunker = "attMissBunker"
        case attChipInside2mBunker = "attChipInside2mBunker"
        case attChipOutside2mBunker = "attChipOutside2mBunker"
        case attChipHoledBunker = "attChipHoledBunker"
        case attSgStrokesEffectiveStandard = "attSgStrokesEffectiveStandard"
        case attSgStrokesEffectiveHard = "attSgStrokesEffectiveHard"
        case attSgStrokesEffectiveBunker = "attSgStrokesEffectiveBunker"
        case scrambleSingleChipStandard = "scrambleSingleChipStandard"
        case scrambleChipInStandard = "scrambleChipInStandard"
        case scrambleChipOnePuttStandard = "scrambleChipOnePuttStandard"
        case scrambleChipTwoPuttStandard = "scrambleChipTwoPuttStandard"
        case scrambleChipThreePuttStandard = "scrambleChipThreePuttStandard"
        case scrambleSingleChipHard = "scrambleSingleChipHard"
        case scrambleChipInHard = "scrambleChipInHard"
        case scrambleChipOnePuttHard = "scrambleChipOnePuttHard"
        case scrambleChipTwoPuttHard = "scrambleChipTwoPuttHard"
        case scrambleChipThreePuttHard = "scrambleChipThreePuttHard"
        case scrambleSingleChipBunker = "scrambleSingleChipBunker"
        case scrambleChipInBunker = "scrambleChipInBunker"
        case scrambleChipOnePuttBunker = "scrambleChipOnePuttBunker"
        case scrambleChipTwoPuttBunker = "scrambleChipTwoPuttBunker"
        case scrambleChipThreePuttBunker = "scrambleChipThreePuttBunker"
        case holesMultiChipStandard = "holesMultiChipStandard"
        case holesMultiChipHard = "holesMultiChipHard"
        case scrambleInside2mResolvedStandard = "scrambleInside2mResolvedStandard"
        case scrambleInside2mSavedStandard = "scrambleInside2mSavedStandard"
        case scrambleInside2mResolvedHard = "scrambleInside2mResolvedHard"
        case scrambleInside2mSavedHard = "scrambleInside2mSavedHard"
        case scrambleInside2mResolvedBunker = "scrambleInside2mResolvedBunker"
        case scrambleInside2mSavedBunker = "scrambleInside2mSavedBunker"
        case holesScoredMissStandard = "holesScoredMissStandard"
        case strokesVsParMissStandard = "strokesVsParMissStandard"
        case holesScoredMissHard = "holesScoredMissHard"
        case strokesVsParMissHard = "strokesVsParMissHard"
        case holesScoredMissBunker = "holesScoredMissBunker"
        case strokesVsParMissBunker = "strokesVsParMissBunker"
        case dblPenalty = "dblPenalty"
        case dblFailedRecovery = "dblFailedRecovery"
        case dblMultiChip = "dblMultiChip"
        case dblThreePutt = "dblThreePutt"
        case dblTroubleTee = "dblTroubleTee"
        case dblFullSwing = "dblFullSwing"
        case dblUnattributed = "dblUnattributed"
        case dblPenaltyTee = "dblPenaltyTee"
        case dblPenaltyApproach = "dblPenaltyApproach"
        case dblPenaltyShort = "dblPenaltyShort"
        case dblPenaltyUnknown = "dblPenaltyUnknown"
    }

    init(teeRecorded: Double, fairwayHits: Double, inPlayHits: Double, troubleCount: Double, teeMissRecorded: Double, teeMissLeft: Double, teeMissRight: Double, teeTroubleLeft: Double, teeTroubleRight: Double, girRecorded: Double, girHits: Double, greenMissRecorded: Double, greenMissLong: Double, greenMissShort: Double, greenMissLeft: Double, greenMissRight: Double, firstPuttRecorded: Double, firstPuttInside1m: Double, firstPutt1To2m: Double, firstPutt2To4m: Double, firstPutt4To8m: Double, firstPuttOver8m: Double, firstPuttInside1mResolved: Double, firstPutt1To2mResolved: Double, firstPutt2To4mResolved: Double, firstPutt4To8mResolved: Double, firstPuttOver8mResolved: Double, onePuttInside1m: Double, onePutt1To2m: Double, onePutt2To4m: Double, onePutt4To8m: Double, onePuttOver8m: Double, puttsRecorded: Double, puttsTotal: Double, threePutts: Double, threePuttsFromOver8m: Double, scrambleAttemptsStandard: Double, scrambleSuccessesStandard: Double, scrambleAttemptsHard: Double, scrambleSuccessesHard: Double, scrambleFirstPuttStandard: Double, scrambleInside2mStandard: Double, scrambleFirstPuttHard: Double, scrambleInside2mHard: Double, scrambleHoledStandard: Double, scrambleHoledHard: Double, scrambleAttemptsBunker: Double, scrambleSuccessesBunker: Double, scrambleFirstPuttBunker: Double, scrambleInside2mBunker: Double, scrambleHoledBunker: Double, shortGameStrokesRecorded: Double, shortGameStrokesEffective: Double, shortGameStrokesEffectiveStandard: Double, shortGameStrokesEffectiveHard: Double, shortGameStrokesEffectiveBunker: Double, holesMultiChip: Double, holesMultiChipBunker: Double, penaltiesRecorded: Double, penaltiesTotal: Double, recoveryAttempts: Double, recoverySuccesses: Double, penaltySourceRecorded: Double, penaltiesTee: Double, penaltiesApproach: Double, penaltiesShort: Double, holesScored: Double, strokesTotal: Double, parTotal: Double, holesScoredPar3: Double, strokesPar3: Double, holesScoredPar4: Double, strokesPar4: Double, holesScoredPar5: Double, strokesPar5: Double, holesEagleOrBetter: Double, holesBirdie: Double, holesPar: Double, holesBogey: Double, doubleBogeyPlus: Double, girHolesScored: Double, birdiesOnGir: Double, bounceBackOpportunities: Double, bounceBackSuccesses: Double, holesScoredFairway: Double, strokesVsParFairway: Double, holesScoredInPlay: Double, strokesVsParInPlay: Double, holesScoredTrouble: Double, strokesVsParTrouble: Double, girRecordedFairway: Double, girHitsFairway: Double, girRecordedInPlay: Double, girHitsInPlay: Double, girRecordedTrouble: Double, girHitsTrouble: Double, girFirstPuttRecorded: Double, girFirstPuttInside1m: Double, girFirstPutt1To2m: Double, girFirstPutt2To4m: Double, girFirstPutt4To8m: Double, girFirstPuttOver8m: Double, puttsRecordedGir: Double, puttsTotalGir: Double, puttsTotalInside1mResolved: Double, puttsTotal1To2mResolved: Double, puttsTotal2To4mResolved: Double, puttsTotal4To8mResolved: Double, puttsTotalOver8mResolved: Double, strokesVsParGirHit: Double, holesScoredGirMiss: Double, strokesVsParGirMiss: Double, girRecordedPar3: Double, girHitsPar3: Double, girRecordedPar4: Double, girHitsPar4: Double, girRecordedPar5: Double, girHitsPar5: Double, holesZeroPutt: Double, holesOnePutt: Double, holesTwoPutt: Double, puttsRecordedPar3: Double, puttsTotalPar3: Double, puttsRecordedPar4: Double, puttsTotalPar4: Double, puttsRecordedPar5: Double, puttsTotalPar5: Double, holesWithPenalty: Double, holesScoredPenalty: Double, strokesVsParPenalty: Double, holesScoredPenaltyFree: Double, strokesVsParPenaltyFree: Double, teeRecordedPar4: Double, fairwayHitsPar4: Double, inPlayHitsPar4: Double, troubleCountPar4: Double, teeRecordedPar5: Double, fairwayHitsPar5: Double, inPlayHitsPar5: Double, troubleCountPar5: Double, attHolesPar3Gir: Double, attHolesPar3Miss: Double, attHolesPar45Gir: Double, attHolesPar45Miss: Double, attStrokes: Double, attPutts: Double, attPenalties: Double, attFairwayPar4: Double, attInPlayPar4: Double, attTroublePar4: Double, attFairwayPar5: Double, attInPlayPar5: Double, attTroublePar5: Double, attGirFirstPuttInside1m: Double, attGirFirstPutt1To2m: Double, attGirFirstPutt2To4m: Double, attGirFirstPutt4To8m: Double, attGirFirstPuttOver8m: Double, attGirHoled: Double, attMissStandard: Double, attMissHard: Double, attChipInside2mStandard: Double, attChipOutside2mStandard: Double, attChipHoledStandard: Double, attChipInside2mHard: Double, attChipOutside2mHard: Double, attChipHoledHard: Double, attMissBunker: Double, attChipInside2mBunker: Double, attChipOutside2mBunker: Double, attChipHoledBunker: Double, attSgStrokesEffectiveStandard: Double, attSgStrokesEffectiveHard: Double, attSgStrokesEffectiveBunker: Double, scrambleSingleChipStandard: Double, scrambleChipInStandard: Double, scrambleChipOnePuttStandard: Double, scrambleChipTwoPuttStandard: Double, scrambleChipThreePuttStandard: Double, scrambleSingleChipHard: Double, scrambleChipInHard: Double, scrambleChipOnePuttHard: Double, scrambleChipTwoPuttHard: Double, scrambleChipThreePuttHard: Double, scrambleSingleChipBunker: Double, scrambleChipInBunker: Double, scrambleChipOnePuttBunker: Double, scrambleChipTwoPuttBunker: Double, scrambleChipThreePuttBunker: Double, holesMultiChipStandard: Double, holesMultiChipHard: Double, scrambleInside2mResolvedStandard: Double, scrambleInside2mSavedStandard: Double, scrambleInside2mResolvedHard: Double, scrambleInside2mSavedHard: Double, scrambleInside2mResolvedBunker: Double, scrambleInside2mSavedBunker: Double, holesScoredMissStandard: Double, strokesVsParMissStandard: Double, holesScoredMissHard: Double, strokesVsParMissHard: Double, holesScoredMissBunker: Double, strokesVsParMissBunker: Double, dblPenalty: Double, dblFailedRecovery: Double, dblMultiChip: Double, dblThreePutt: Double, dblTroubleTee: Double, dblFullSwing: Double, dblUnattributed: Double, dblPenaltyTee: Double, dblPenaltyApproach: Double, dblPenaltyShort: Double, dblPenaltyUnknown: Double) {
        self.teeRecorded = teeRecorded
        self.fairwayHits = fairwayHits
        self.inPlayHits = inPlayHits
        self.troubleCount = troubleCount
        self.teeMissRecorded = teeMissRecorded
        self.teeMissLeft = teeMissLeft
        self.teeMissRight = teeMissRight
        self.teeTroubleLeft = teeTroubleLeft
        self.teeTroubleRight = teeTroubleRight
        self.girRecorded = girRecorded
        self.girHits = girHits
        self.greenMissRecorded = greenMissRecorded
        self.greenMissLong = greenMissLong
        self.greenMissShort = greenMissShort
        self.greenMissLeft = greenMissLeft
        self.greenMissRight = greenMissRight
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
        self.scrambleAttemptsBunker = scrambleAttemptsBunker
        self.scrambleSuccessesBunker = scrambleSuccessesBunker
        self.scrambleFirstPuttBunker = scrambleFirstPuttBunker
        self.scrambleInside2mBunker = scrambleInside2mBunker
        self.scrambleHoledBunker = scrambleHoledBunker
        self.shortGameStrokesRecorded = shortGameStrokesRecorded
        self.shortGameStrokesEffective = shortGameStrokesEffective
        self.shortGameStrokesEffectiveStandard = shortGameStrokesEffectiveStandard
        self.shortGameStrokesEffectiveHard = shortGameStrokesEffectiveHard
        self.shortGameStrokesEffectiveBunker = shortGameStrokesEffectiveBunker
        self.holesMultiChip = holesMultiChip
        self.holesMultiChipBunker = holesMultiChipBunker
        self.penaltiesRecorded = penaltiesRecorded
        self.penaltiesTotal = penaltiesTotal
        self.recoveryAttempts = recoveryAttempts
        self.recoverySuccesses = recoverySuccesses
        self.penaltySourceRecorded = penaltySourceRecorded
        self.penaltiesTee = penaltiesTee
        self.penaltiesApproach = penaltiesApproach
        self.penaltiesShort = penaltiesShort
        self.holesScored = holesScored
        self.strokesTotal = strokesTotal
        self.parTotal = parTotal
        self.holesScoredPar3 = holesScoredPar3
        self.strokesPar3 = strokesPar3
        self.holesScoredPar4 = holesScoredPar4
        self.strokesPar4 = strokesPar4
        self.holesScoredPar5 = holesScoredPar5
        self.strokesPar5 = strokesPar5
        self.holesEagleOrBetter = holesEagleOrBetter
        self.holesBirdie = holesBirdie
        self.holesPar = holesPar
        self.holesBogey = holesBogey
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
        self.strokesVsParGirHit = strokesVsParGirHit
        self.holesScoredGirMiss = holesScoredGirMiss
        self.strokesVsParGirMiss = strokesVsParGirMiss
        self.girRecordedPar3 = girRecordedPar3
        self.girHitsPar3 = girHitsPar3
        self.girRecordedPar4 = girRecordedPar4
        self.girHitsPar4 = girHitsPar4
        self.girRecordedPar5 = girRecordedPar5
        self.girHitsPar5 = girHitsPar5
        self.holesZeroPutt = holesZeroPutt
        self.holesOnePutt = holesOnePutt
        self.holesTwoPutt = holesTwoPutt
        self.puttsRecordedPar3 = puttsRecordedPar3
        self.puttsTotalPar3 = puttsTotalPar3
        self.puttsRecordedPar4 = puttsRecordedPar4
        self.puttsTotalPar4 = puttsTotalPar4
        self.puttsRecordedPar5 = puttsRecordedPar5
        self.puttsTotalPar5 = puttsTotalPar5
        self.holesWithPenalty = holesWithPenalty
        self.holesScoredPenalty = holesScoredPenalty
        self.strokesVsParPenalty = strokesVsParPenalty
        self.holesScoredPenaltyFree = holesScoredPenaltyFree
        self.strokesVsParPenaltyFree = strokesVsParPenaltyFree
        self.teeRecordedPar4 = teeRecordedPar4
        self.fairwayHitsPar4 = fairwayHitsPar4
        self.inPlayHitsPar4 = inPlayHitsPar4
        self.troubleCountPar4 = troubleCountPar4
        self.teeRecordedPar5 = teeRecordedPar5
        self.fairwayHitsPar5 = fairwayHitsPar5
        self.inPlayHitsPar5 = inPlayHitsPar5
        self.troubleCountPar5 = troubleCountPar5
        self.attHolesPar3Gir = attHolesPar3Gir
        self.attHolesPar3Miss = attHolesPar3Miss
        self.attHolesPar45Gir = attHolesPar45Gir
        self.attHolesPar45Miss = attHolesPar45Miss
        self.attStrokes = attStrokes
        self.attPutts = attPutts
        self.attPenalties = attPenalties
        self.attFairwayPar4 = attFairwayPar4
        self.attInPlayPar4 = attInPlayPar4
        self.attTroublePar4 = attTroublePar4
        self.attFairwayPar5 = attFairwayPar5
        self.attInPlayPar5 = attInPlayPar5
        self.attTroublePar5 = attTroublePar5
        self.attGirFirstPuttInside1m = attGirFirstPuttInside1m
        self.attGirFirstPutt1To2m = attGirFirstPutt1To2m
        self.attGirFirstPutt2To4m = attGirFirstPutt2To4m
        self.attGirFirstPutt4To8m = attGirFirstPutt4To8m
        self.attGirFirstPuttOver8m = attGirFirstPuttOver8m
        self.attGirHoled = attGirHoled
        self.attMissStandard = attMissStandard
        self.attMissHard = attMissHard
        self.attChipInside2mStandard = attChipInside2mStandard
        self.attChipOutside2mStandard = attChipOutside2mStandard
        self.attChipHoledStandard = attChipHoledStandard
        self.attChipInside2mHard = attChipInside2mHard
        self.attChipOutside2mHard = attChipOutside2mHard
        self.attChipHoledHard = attChipHoledHard
        self.attMissBunker = attMissBunker
        self.attChipInside2mBunker = attChipInside2mBunker
        self.attChipOutside2mBunker = attChipOutside2mBunker
        self.attChipHoledBunker = attChipHoledBunker
        self.attSgStrokesEffectiveStandard = attSgStrokesEffectiveStandard
        self.attSgStrokesEffectiveHard = attSgStrokesEffectiveHard
        self.attSgStrokesEffectiveBunker = attSgStrokesEffectiveBunker
        self.scrambleSingleChipStandard = scrambleSingleChipStandard
        self.scrambleChipInStandard = scrambleChipInStandard
        self.scrambleChipOnePuttStandard = scrambleChipOnePuttStandard
        self.scrambleChipTwoPuttStandard = scrambleChipTwoPuttStandard
        self.scrambleChipThreePuttStandard = scrambleChipThreePuttStandard
        self.scrambleSingleChipHard = scrambleSingleChipHard
        self.scrambleChipInHard = scrambleChipInHard
        self.scrambleChipOnePuttHard = scrambleChipOnePuttHard
        self.scrambleChipTwoPuttHard = scrambleChipTwoPuttHard
        self.scrambleChipThreePuttHard = scrambleChipThreePuttHard
        self.scrambleSingleChipBunker = scrambleSingleChipBunker
        self.scrambleChipInBunker = scrambleChipInBunker
        self.scrambleChipOnePuttBunker = scrambleChipOnePuttBunker
        self.scrambleChipTwoPuttBunker = scrambleChipTwoPuttBunker
        self.scrambleChipThreePuttBunker = scrambleChipThreePuttBunker
        self.holesMultiChipStandard = holesMultiChipStandard
        self.holesMultiChipHard = holesMultiChipHard
        self.scrambleInside2mResolvedStandard = scrambleInside2mResolvedStandard
        self.scrambleInside2mSavedStandard = scrambleInside2mSavedStandard
        self.scrambleInside2mResolvedHard = scrambleInside2mResolvedHard
        self.scrambleInside2mSavedHard = scrambleInside2mSavedHard
        self.scrambleInside2mResolvedBunker = scrambleInside2mResolvedBunker
        self.scrambleInside2mSavedBunker = scrambleInside2mSavedBunker
        self.holesScoredMissStandard = holesScoredMissStandard
        self.strokesVsParMissStandard = strokesVsParMissStandard
        self.holesScoredMissHard = holesScoredMissHard
        self.strokesVsParMissHard = strokesVsParMissHard
        self.holesScoredMissBunker = holesScoredMissBunker
        self.strokesVsParMissBunker = strokesVsParMissBunker
        self.dblPenalty = dblPenalty
        self.dblFailedRecovery = dblFailedRecovery
        self.dblMultiChip = dblMultiChip
        self.dblThreePutt = dblThreePutt
        self.dblTroubleTee = dblTroubleTee
        self.dblFullSwing = dblFullSwing
        self.dblUnattributed = dblUnattributed
        self.dblPenaltyTee = dblPenaltyTee
        self.dblPenaltyApproach = dblPenaltyApproach
        self.dblPenaltyShort = dblPenaltyShort
        self.dblPenaltyUnknown = dblPenaltyUnknown
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.teeRecorded = try c.decode(Double.self, forKey: .teeRecorded)
        self.fairwayHits = try c.decode(Double.self, forKey: .fairwayHits)
        self.inPlayHits = try c.decode(Double.self, forKey: .inPlayHits)
        self.troubleCount = try c.decode(Double.self, forKey: .troubleCount)
        self.teeMissRecorded = try c.decode(Double.self, forKey: .teeMissRecorded)
        self.teeMissLeft = try c.decode(Double.self, forKey: .teeMissLeft)
        self.teeMissRight = try c.decode(Double.self, forKey: .teeMissRight)
        self.teeTroubleLeft = try c.decode(Double.self, forKey: .teeTroubleLeft)
        self.teeTroubleRight = try c.decode(Double.self, forKey: .teeTroubleRight)
        self.girRecorded = try c.decode(Double.self, forKey: .girRecorded)
        self.girHits = try c.decode(Double.self, forKey: .girHits)
        self.greenMissRecorded = try c.decode(Double.self, forKey: .greenMissRecorded)
        self.greenMissLong = try c.decode(Double.self, forKey: .greenMissLong)
        self.greenMissShort = try c.decode(Double.self, forKey: .greenMissShort)
        self.greenMissLeft = try c.decode(Double.self, forKey: .greenMissLeft)
        self.greenMissRight = try c.decode(Double.self, forKey: .greenMissRight)
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
        self.scrambleAttemptsBunker = try c.decode(Double.self, forKey: .scrambleAttemptsBunker)
        self.scrambleSuccessesBunker = try c.decode(Double.self, forKey: .scrambleSuccessesBunker)
        self.scrambleFirstPuttBunker = try c.decode(Double.self, forKey: .scrambleFirstPuttBunker)
        self.scrambleInside2mBunker = try c.decode(Double.self, forKey: .scrambleInside2mBunker)
        self.scrambleHoledBunker = try c.decode(Double.self, forKey: .scrambleHoledBunker)
        self.shortGameStrokesRecorded = try c.decode(Double.self, forKey: .shortGameStrokesRecorded)
        self.shortGameStrokesEffective = try c.decode(Double.self, forKey: .shortGameStrokesEffective)
        self.shortGameStrokesEffectiveStandard = try c.decode(Double.self, forKey: .shortGameStrokesEffectiveStandard)
        self.shortGameStrokesEffectiveHard = try c.decode(Double.self, forKey: .shortGameStrokesEffectiveHard)
        self.shortGameStrokesEffectiveBunker = try c.decode(Double.self, forKey: .shortGameStrokesEffectiveBunker)
        self.holesMultiChip = try c.decode(Double.self, forKey: .holesMultiChip)
        self.holesMultiChipBunker = try c.decode(Double.self, forKey: .holesMultiChipBunker)
        self.penaltiesRecorded = try c.decode(Double.self, forKey: .penaltiesRecorded)
        self.penaltiesTotal = try c.decode(Double.self, forKey: .penaltiesTotal)
        self.recoveryAttempts = try c.decode(Double.self, forKey: .recoveryAttempts)
        self.recoverySuccesses = try c.decode(Double.self, forKey: .recoverySuccesses)
        self.penaltySourceRecorded = try c.decode(Double.self, forKey: .penaltySourceRecorded)
        self.penaltiesTee = try c.decode(Double.self, forKey: .penaltiesTee)
        self.penaltiesApproach = try c.decode(Double.self, forKey: .penaltiesApproach)
        self.penaltiesShort = try c.decode(Double.self, forKey: .penaltiesShort)
        self.holesScored = try c.decode(Double.self, forKey: .holesScored)
        self.strokesTotal = try c.decode(Double.self, forKey: .strokesTotal)
        self.parTotal = try c.decode(Double.self, forKey: .parTotal)
        self.holesScoredPar3 = try c.decode(Double.self, forKey: .holesScoredPar3)
        self.strokesPar3 = try c.decode(Double.self, forKey: .strokesPar3)
        self.holesScoredPar4 = try c.decode(Double.self, forKey: .holesScoredPar4)
        self.strokesPar4 = try c.decode(Double.self, forKey: .strokesPar4)
        self.holesScoredPar5 = try c.decode(Double.self, forKey: .holesScoredPar5)
        self.strokesPar5 = try c.decode(Double.self, forKey: .strokesPar5)
        self.holesEagleOrBetter = try c.decode(Double.self, forKey: .holesEagleOrBetter)
        self.holesBirdie = try c.decode(Double.self, forKey: .holesBirdie)
        self.holesPar = try c.decode(Double.self, forKey: .holesPar)
        self.holesBogey = try c.decode(Double.self, forKey: .holesBogey)
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
        self.strokesVsParGirHit = try c.decode(Double.self, forKey: .strokesVsParGirHit)
        self.holesScoredGirMiss = try c.decode(Double.self, forKey: .holesScoredGirMiss)
        self.strokesVsParGirMiss = try c.decode(Double.self, forKey: .strokesVsParGirMiss)
        self.girRecordedPar3 = try c.decode(Double.self, forKey: .girRecordedPar3)
        self.girHitsPar3 = try c.decode(Double.self, forKey: .girHitsPar3)
        self.girRecordedPar4 = try c.decode(Double.self, forKey: .girRecordedPar4)
        self.girHitsPar4 = try c.decode(Double.self, forKey: .girHitsPar4)
        self.girRecordedPar5 = try c.decode(Double.self, forKey: .girRecordedPar5)
        self.girHitsPar5 = try c.decode(Double.self, forKey: .girHitsPar5)
        self.holesZeroPutt = try c.decode(Double.self, forKey: .holesZeroPutt)
        self.holesOnePutt = try c.decode(Double.self, forKey: .holesOnePutt)
        self.holesTwoPutt = try c.decode(Double.self, forKey: .holesTwoPutt)
        self.puttsRecordedPar3 = try c.decode(Double.self, forKey: .puttsRecordedPar3)
        self.puttsTotalPar3 = try c.decode(Double.self, forKey: .puttsTotalPar3)
        self.puttsRecordedPar4 = try c.decode(Double.self, forKey: .puttsRecordedPar4)
        self.puttsTotalPar4 = try c.decode(Double.self, forKey: .puttsTotalPar4)
        self.puttsRecordedPar5 = try c.decode(Double.self, forKey: .puttsRecordedPar5)
        self.puttsTotalPar5 = try c.decode(Double.self, forKey: .puttsTotalPar5)
        self.holesWithPenalty = try c.decode(Double.self, forKey: .holesWithPenalty)
        self.holesScoredPenalty = try c.decode(Double.self, forKey: .holesScoredPenalty)
        self.strokesVsParPenalty = try c.decode(Double.self, forKey: .strokesVsParPenalty)
        self.holesScoredPenaltyFree = try c.decode(Double.self, forKey: .holesScoredPenaltyFree)
        self.strokesVsParPenaltyFree = try c.decode(Double.self, forKey: .strokesVsParPenaltyFree)
        self.teeRecordedPar4 = try c.decode(Double.self, forKey: .teeRecordedPar4)
        self.fairwayHitsPar4 = try c.decode(Double.self, forKey: .fairwayHitsPar4)
        self.inPlayHitsPar4 = try c.decode(Double.self, forKey: .inPlayHitsPar4)
        self.troubleCountPar4 = try c.decode(Double.self, forKey: .troubleCountPar4)
        self.teeRecordedPar5 = try c.decode(Double.self, forKey: .teeRecordedPar5)
        self.fairwayHitsPar5 = try c.decode(Double.self, forKey: .fairwayHitsPar5)
        self.inPlayHitsPar5 = try c.decode(Double.self, forKey: .inPlayHitsPar5)
        self.troubleCountPar5 = try c.decode(Double.self, forKey: .troubleCountPar5)
        self.attHolesPar3Gir = try c.decode(Double.self, forKey: .attHolesPar3Gir)
        self.attHolesPar3Miss = try c.decode(Double.self, forKey: .attHolesPar3Miss)
        self.attHolesPar45Gir = try c.decode(Double.self, forKey: .attHolesPar45Gir)
        self.attHolesPar45Miss = try c.decode(Double.self, forKey: .attHolesPar45Miss)
        self.attStrokes = try c.decode(Double.self, forKey: .attStrokes)
        self.attPutts = try c.decode(Double.self, forKey: .attPutts)
        self.attPenalties = try c.decode(Double.self, forKey: .attPenalties)
        self.attFairwayPar4 = try c.decode(Double.self, forKey: .attFairwayPar4)
        self.attInPlayPar4 = try c.decode(Double.self, forKey: .attInPlayPar4)
        self.attTroublePar4 = try c.decode(Double.self, forKey: .attTroublePar4)
        self.attFairwayPar5 = try c.decode(Double.self, forKey: .attFairwayPar5)
        self.attInPlayPar5 = try c.decode(Double.self, forKey: .attInPlayPar5)
        self.attTroublePar5 = try c.decode(Double.self, forKey: .attTroublePar5)
        self.attGirFirstPuttInside1m = try c.decode(Double.self, forKey: .attGirFirstPuttInside1m)
        self.attGirFirstPutt1To2m = try c.decode(Double.self, forKey: .attGirFirstPutt1To2m)
        self.attGirFirstPutt2To4m = try c.decode(Double.self, forKey: .attGirFirstPutt2To4m)
        self.attGirFirstPutt4To8m = try c.decode(Double.self, forKey: .attGirFirstPutt4To8m)
        self.attGirFirstPuttOver8m = try c.decode(Double.self, forKey: .attGirFirstPuttOver8m)
        self.attGirHoled = try c.decode(Double.self, forKey: .attGirHoled)
        self.attMissStandard = try c.decode(Double.self, forKey: .attMissStandard)
        self.attMissHard = try c.decode(Double.self, forKey: .attMissHard)
        self.attChipInside2mStandard = try c.decode(Double.self, forKey: .attChipInside2mStandard)
        self.attChipOutside2mStandard = try c.decode(Double.self, forKey: .attChipOutside2mStandard)
        self.attChipHoledStandard = try c.decode(Double.self, forKey: .attChipHoledStandard)
        self.attChipInside2mHard = try c.decode(Double.self, forKey: .attChipInside2mHard)
        self.attChipOutside2mHard = try c.decode(Double.self, forKey: .attChipOutside2mHard)
        self.attChipHoledHard = try c.decode(Double.self, forKey: .attChipHoledHard)
        self.attMissBunker = try c.decode(Double.self, forKey: .attMissBunker)
        self.attChipInside2mBunker = try c.decode(Double.self, forKey: .attChipInside2mBunker)
        self.attChipOutside2mBunker = try c.decode(Double.self, forKey: .attChipOutside2mBunker)
        self.attChipHoledBunker = try c.decode(Double.self, forKey: .attChipHoledBunker)
        self.attSgStrokesEffectiveStandard = try c.decode(Double.self, forKey: .attSgStrokesEffectiveStandard)
        self.attSgStrokesEffectiveHard = try c.decode(Double.self, forKey: .attSgStrokesEffectiveHard)
        self.attSgStrokesEffectiveBunker = try c.decode(Double.self, forKey: .attSgStrokesEffectiveBunker)
        self.scrambleSingleChipStandard = try c.decode(Double.self, forKey: .scrambleSingleChipStandard)
        self.scrambleChipInStandard = try c.decode(Double.self, forKey: .scrambleChipInStandard)
        self.scrambleChipOnePuttStandard = try c.decode(Double.self, forKey: .scrambleChipOnePuttStandard)
        self.scrambleChipTwoPuttStandard = try c.decode(Double.self, forKey: .scrambleChipTwoPuttStandard)
        self.scrambleChipThreePuttStandard = try c.decode(Double.self, forKey: .scrambleChipThreePuttStandard)
        self.scrambleSingleChipHard = try c.decode(Double.self, forKey: .scrambleSingleChipHard)
        self.scrambleChipInHard = try c.decode(Double.self, forKey: .scrambleChipInHard)
        self.scrambleChipOnePuttHard = try c.decode(Double.self, forKey: .scrambleChipOnePuttHard)
        self.scrambleChipTwoPuttHard = try c.decode(Double.self, forKey: .scrambleChipTwoPuttHard)
        self.scrambleChipThreePuttHard = try c.decode(Double.self, forKey: .scrambleChipThreePuttHard)
        self.scrambleSingleChipBunker = try c.decode(Double.self, forKey: .scrambleSingleChipBunker)
        self.scrambleChipInBunker = try c.decode(Double.self, forKey: .scrambleChipInBunker)
        self.scrambleChipOnePuttBunker = try c.decode(Double.self, forKey: .scrambleChipOnePuttBunker)
        self.scrambleChipTwoPuttBunker = try c.decode(Double.self, forKey: .scrambleChipTwoPuttBunker)
        self.scrambleChipThreePuttBunker = try c.decode(Double.self, forKey: .scrambleChipThreePuttBunker)
        self.holesMultiChipStandard = try c.decode(Double.self, forKey: .holesMultiChipStandard)
        self.holesMultiChipHard = try c.decode(Double.self, forKey: .holesMultiChipHard)
        self.scrambleInside2mResolvedStandard = try c.decode(Double.self, forKey: .scrambleInside2mResolvedStandard)
        self.scrambleInside2mSavedStandard = try c.decode(Double.self, forKey: .scrambleInside2mSavedStandard)
        self.scrambleInside2mResolvedHard = try c.decode(Double.self, forKey: .scrambleInside2mResolvedHard)
        self.scrambleInside2mSavedHard = try c.decode(Double.self, forKey: .scrambleInside2mSavedHard)
        self.scrambleInside2mResolvedBunker = try c.decode(Double.self, forKey: .scrambleInside2mResolvedBunker)
        self.scrambleInside2mSavedBunker = try c.decode(Double.self, forKey: .scrambleInside2mSavedBunker)
        self.holesScoredMissStandard = try c.decode(Double.self, forKey: .holesScoredMissStandard)
        self.strokesVsParMissStandard = try c.decode(Double.self, forKey: .strokesVsParMissStandard)
        self.holesScoredMissHard = try c.decode(Double.self, forKey: .holesScoredMissHard)
        self.strokesVsParMissHard = try c.decode(Double.self, forKey: .strokesVsParMissHard)
        self.holesScoredMissBunker = try c.decode(Double.self, forKey: .holesScoredMissBunker)
        self.strokesVsParMissBunker = try c.decode(Double.self, forKey: .strokesVsParMissBunker)
        self.dblPenalty = try c.decode(Double.self, forKey: .dblPenalty)
        self.dblFailedRecovery = try c.decode(Double.self, forKey: .dblFailedRecovery)
        self.dblMultiChip = try c.decode(Double.self, forKey: .dblMultiChip)
        self.dblThreePutt = try c.decode(Double.self, forKey: .dblThreePutt)
        self.dblTroubleTee = try c.decode(Double.self, forKey: .dblTroubleTee)
        self.dblFullSwing = try c.decode(Double.self, forKey: .dblFullSwing)
        self.dblUnattributed = try c.decode(Double.self, forKey: .dblUnattributed)
        self.dblPenaltyTee = try c.decode(Double.self, forKey: .dblPenaltyTee)
        self.dblPenaltyApproach = try c.decode(Double.self, forKey: .dblPenaltyApproach)
        self.dblPenaltyShort = try c.decode(Double.self, forKey: .dblPenaltyShort)
        self.dblPenaltyUnknown = try c.decode(Double.self, forKey: .dblPenaltyUnknown)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(teeRecorded, forKey: .teeRecorded)
        try c.encode(fairwayHits, forKey: .fairwayHits)
        try c.encode(inPlayHits, forKey: .inPlayHits)
        try c.encode(troubleCount, forKey: .troubleCount)
        try c.encode(teeMissRecorded, forKey: .teeMissRecorded)
        try c.encode(teeMissLeft, forKey: .teeMissLeft)
        try c.encode(teeMissRight, forKey: .teeMissRight)
        try c.encode(teeTroubleLeft, forKey: .teeTroubleLeft)
        try c.encode(teeTroubleRight, forKey: .teeTroubleRight)
        try c.encode(girRecorded, forKey: .girRecorded)
        try c.encode(girHits, forKey: .girHits)
        try c.encode(greenMissRecorded, forKey: .greenMissRecorded)
        try c.encode(greenMissLong, forKey: .greenMissLong)
        try c.encode(greenMissShort, forKey: .greenMissShort)
        try c.encode(greenMissLeft, forKey: .greenMissLeft)
        try c.encode(greenMissRight, forKey: .greenMissRight)
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
        try c.encode(scrambleAttemptsBunker, forKey: .scrambleAttemptsBunker)
        try c.encode(scrambleSuccessesBunker, forKey: .scrambleSuccessesBunker)
        try c.encode(scrambleFirstPuttBunker, forKey: .scrambleFirstPuttBunker)
        try c.encode(scrambleInside2mBunker, forKey: .scrambleInside2mBunker)
        try c.encode(scrambleHoledBunker, forKey: .scrambleHoledBunker)
        try c.encode(shortGameStrokesRecorded, forKey: .shortGameStrokesRecorded)
        try c.encode(shortGameStrokesEffective, forKey: .shortGameStrokesEffective)
        try c.encode(shortGameStrokesEffectiveStandard, forKey: .shortGameStrokesEffectiveStandard)
        try c.encode(shortGameStrokesEffectiveHard, forKey: .shortGameStrokesEffectiveHard)
        try c.encode(shortGameStrokesEffectiveBunker, forKey: .shortGameStrokesEffectiveBunker)
        try c.encode(holesMultiChip, forKey: .holesMultiChip)
        try c.encode(holesMultiChipBunker, forKey: .holesMultiChipBunker)
        try c.encode(penaltiesRecorded, forKey: .penaltiesRecorded)
        try c.encode(penaltiesTotal, forKey: .penaltiesTotal)
        try c.encode(recoveryAttempts, forKey: .recoveryAttempts)
        try c.encode(recoverySuccesses, forKey: .recoverySuccesses)
        try c.encode(penaltySourceRecorded, forKey: .penaltySourceRecorded)
        try c.encode(penaltiesTee, forKey: .penaltiesTee)
        try c.encode(penaltiesApproach, forKey: .penaltiesApproach)
        try c.encode(penaltiesShort, forKey: .penaltiesShort)
        try c.encode(holesScored, forKey: .holesScored)
        try c.encode(strokesTotal, forKey: .strokesTotal)
        try c.encode(parTotal, forKey: .parTotal)
        try c.encode(holesScoredPar3, forKey: .holesScoredPar3)
        try c.encode(strokesPar3, forKey: .strokesPar3)
        try c.encode(holesScoredPar4, forKey: .holesScoredPar4)
        try c.encode(strokesPar4, forKey: .strokesPar4)
        try c.encode(holesScoredPar5, forKey: .holesScoredPar5)
        try c.encode(strokesPar5, forKey: .strokesPar5)
        try c.encode(holesEagleOrBetter, forKey: .holesEagleOrBetter)
        try c.encode(holesBirdie, forKey: .holesBirdie)
        try c.encode(holesPar, forKey: .holesPar)
        try c.encode(holesBogey, forKey: .holesBogey)
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
        try c.encode(strokesVsParGirHit, forKey: .strokesVsParGirHit)
        try c.encode(holesScoredGirMiss, forKey: .holesScoredGirMiss)
        try c.encode(strokesVsParGirMiss, forKey: .strokesVsParGirMiss)
        try c.encode(girRecordedPar3, forKey: .girRecordedPar3)
        try c.encode(girHitsPar3, forKey: .girHitsPar3)
        try c.encode(girRecordedPar4, forKey: .girRecordedPar4)
        try c.encode(girHitsPar4, forKey: .girHitsPar4)
        try c.encode(girRecordedPar5, forKey: .girRecordedPar5)
        try c.encode(girHitsPar5, forKey: .girHitsPar5)
        try c.encode(holesZeroPutt, forKey: .holesZeroPutt)
        try c.encode(holesOnePutt, forKey: .holesOnePutt)
        try c.encode(holesTwoPutt, forKey: .holesTwoPutt)
        try c.encode(puttsRecordedPar3, forKey: .puttsRecordedPar3)
        try c.encode(puttsTotalPar3, forKey: .puttsTotalPar3)
        try c.encode(puttsRecordedPar4, forKey: .puttsRecordedPar4)
        try c.encode(puttsTotalPar4, forKey: .puttsTotalPar4)
        try c.encode(puttsRecordedPar5, forKey: .puttsRecordedPar5)
        try c.encode(puttsTotalPar5, forKey: .puttsTotalPar5)
        try c.encode(holesWithPenalty, forKey: .holesWithPenalty)
        try c.encode(holesScoredPenalty, forKey: .holesScoredPenalty)
        try c.encode(strokesVsParPenalty, forKey: .strokesVsParPenalty)
        try c.encode(holesScoredPenaltyFree, forKey: .holesScoredPenaltyFree)
        try c.encode(strokesVsParPenaltyFree, forKey: .strokesVsParPenaltyFree)
        try c.encode(teeRecordedPar4, forKey: .teeRecordedPar4)
        try c.encode(fairwayHitsPar4, forKey: .fairwayHitsPar4)
        try c.encode(inPlayHitsPar4, forKey: .inPlayHitsPar4)
        try c.encode(troubleCountPar4, forKey: .troubleCountPar4)
        try c.encode(teeRecordedPar5, forKey: .teeRecordedPar5)
        try c.encode(fairwayHitsPar5, forKey: .fairwayHitsPar5)
        try c.encode(inPlayHitsPar5, forKey: .inPlayHitsPar5)
        try c.encode(troubleCountPar5, forKey: .troubleCountPar5)
        try c.encode(attHolesPar3Gir, forKey: .attHolesPar3Gir)
        try c.encode(attHolesPar3Miss, forKey: .attHolesPar3Miss)
        try c.encode(attHolesPar45Gir, forKey: .attHolesPar45Gir)
        try c.encode(attHolesPar45Miss, forKey: .attHolesPar45Miss)
        try c.encode(attStrokes, forKey: .attStrokes)
        try c.encode(attPutts, forKey: .attPutts)
        try c.encode(attPenalties, forKey: .attPenalties)
        try c.encode(attFairwayPar4, forKey: .attFairwayPar4)
        try c.encode(attInPlayPar4, forKey: .attInPlayPar4)
        try c.encode(attTroublePar4, forKey: .attTroublePar4)
        try c.encode(attFairwayPar5, forKey: .attFairwayPar5)
        try c.encode(attInPlayPar5, forKey: .attInPlayPar5)
        try c.encode(attTroublePar5, forKey: .attTroublePar5)
        try c.encode(attGirFirstPuttInside1m, forKey: .attGirFirstPuttInside1m)
        try c.encode(attGirFirstPutt1To2m, forKey: .attGirFirstPutt1To2m)
        try c.encode(attGirFirstPutt2To4m, forKey: .attGirFirstPutt2To4m)
        try c.encode(attGirFirstPutt4To8m, forKey: .attGirFirstPutt4To8m)
        try c.encode(attGirFirstPuttOver8m, forKey: .attGirFirstPuttOver8m)
        try c.encode(attGirHoled, forKey: .attGirHoled)
        try c.encode(attMissStandard, forKey: .attMissStandard)
        try c.encode(attMissHard, forKey: .attMissHard)
        try c.encode(attChipInside2mStandard, forKey: .attChipInside2mStandard)
        try c.encode(attChipOutside2mStandard, forKey: .attChipOutside2mStandard)
        try c.encode(attChipHoledStandard, forKey: .attChipHoledStandard)
        try c.encode(attChipInside2mHard, forKey: .attChipInside2mHard)
        try c.encode(attChipOutside2mHard, forKey: .attChipOutside2mHard)
        try c.encode(attChipHoledHard, forKey: .attChipHoledHard)
        try c.encode(attMissBunker, forKey: .attMissBunker)
        try c.encode(attChipInside2mBunker, forKey: .attChipInside2mBunker)
        try c.encode(attChipOutside2mBunker, forKey: .attChipOutside2mBunker)
        try c.encode(attChipHoledBunker, forKey: .attChipHoledBunker)
        try c.encode(attSgStrokesEffectiveStandard, forKey: .attSgStrokesEffectiveStandard)
        try c.encode(attSgStrokesEffectiveHard, forKey: .attSgStrokesEffectiveHard)
        try c.encode(attSgStrokesEffectiveBunker, forKey: .attSgStrokesEffectiveBunker)
        try c.encode(scrambleSingleChipStandard, forKey: .scrambleSingleChipStandard)
        try c.encode(scrambleChipInStandard, forKey: .scrambleChipInStandard)
        try c.encode(scrambleChipOnePuttStandard, forKey: .scrambleChipOnePuttStandard)
        try c.encode(scrambleChipTwoPuttStandard, forKey: .scrambleChipTwoPuttStandard)
        try c.encode(scrambleChipThreePuttStandard, forKey: .scrambleChipThreePuttStandard)
        try c.encode(scrambleSingleChipHard, forKey: .scrambleSingleChipHard)
        try c.encode(scrambleChipInHard, forKey: .scrambleChipInHard)
        try c.encode(scrambleChipOnePuttHard, forKey: .scrambleChipOnePuttHard)
        try c.encode(scrambleChipTwoPuttHard, forKey: .scrambleChipTwoPuttHard)
        try c.encode(scrambleChipThreePuttHard, forKey: .scrambleChipThreePuttHard)
        try c.encode(scrambleSingleChipBunker, forKey: .scrambleSingleChipBunker)
        try c.encode(scrambleChipInBunker, forKey: .scrambleChipInBunker)
        try c.encode(scrambleChipOnePuttBunker, forKey: .scrambleChipOnePuttBunker)
        try c.encode(scrambleChipTwoPuttBunker, forKey: .scrambleChipTwoPuttBunker)
        try c.encode(scrambleChipThreePuttBunker, forKey: .scrambleChipThreePuttBunker)
        try c.encode(holesMultiChipStandard, forKey: .holesMultiChipStandard)
        try c.encode(holesMultiChipHard, forKey: .holesMultiChipHard)
        try c.encode(scrambleInside2mResolvedStandard, forKey: .scrambleInside2mResolvedStandard)
        try c.encode(scrambleInside2mSavedStandard, forKey: .scrambleInside2mSavedStandard)
        try c.encode(scrambleInside2mResolvedHard, forKey: .scrambleInside2mResolvedHard)
        try c.encode(scrambleInside2mSavedHard, forKey: .scrambleInside2mSavedHard)
        try c.encode(scrambleInside2mResolvedBunker, forKey: .scrambleInside2mResolvedBunker)
        try c.encode(scrambleInside2mSavedBunker, forKey: .scrambleInside2mSavedBunker)
        try c.encode(holesScoredMissStandard, forKey: .holesScoredMissStandard)
        try c.encode(strokesVsParMissStandard, forKey: .strokesVsParMissStandard)
        try c.encode(holesScoredMissHard, forKey: .holesScoredMissHard)
        try c.encode(strokesVsParMissHard, forKey: .strokesVsParMissHard)
        try c.encode(holesScoredMissBunker, forKey: .holesScoredMissBunker)
        try c.encode(strokesVsParMissBunker, forKey: .strokesVsParMissBunker)
        try c.encode(dblPenalty, forKey: .dblPenalty)
        try c.encode(dblFailedRecovery, forKey: .dblFailedRecovery)
        try c.encode(dblMultiChip, forKey: .dblMultiChip)
        try c.encode(dblThreePutt, forKey: .dblThreePutt)
        try c.encode(dblTroubleTee, forKey: .dblTroubleTee)
        try c.encode(dblFullSwing, forKey: .dblFullSwing)
        try c.encode(dblUnattributed, forKey: .dblUnattributed)
        try c.encode(dblPenaltyTee, forKey: .dblPenaltyTee)
        try c.encode(dblPenaltyApproach, forKey: .dblPenaltyApproach)
        try c.encode(dblPenaltyShort, forKey: .dblPenaltyShort)
        try c.encode(dblPenaltyUnknown, forKey: .dblPenaltyUnknown)
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
    case teeMissDir = "tee_miss_dir"
    case gir = "gir"
    case greenMissDir = "green_miss_dir"
    case firstPutt = "first_putt"
    case putts = "putts"
    case shortGameDifficulty = "short_game_difficulty"
    case shortGameStrokes = "short_game_strokes"
    case penaltySource = "penalty_source"
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
