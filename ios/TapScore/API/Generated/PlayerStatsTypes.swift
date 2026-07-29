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
    var roundsWithStats: Double
    var totals: StatMeasures
    var rounds: [PlayerRoundStats]

    enum CodingKeys: String, CodingKey {
        case playerId = "playerId"
        case roundsWithStats = "roundsWithStats"
        case totals = "totals"
        case rounds = "rounds"
    }

    init(playerId: String, roundsWithStats: Double, totals: StatMeasures, rounds: [PlayerRoundStats]) {
        self.playerId = playerId
        self.roundsWithStats = roundsWithStats
        self.totals = totals
        self.rounds = rounds
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.playerId = try c.decode(String.self, forKey: .playerId)
        self.roundsWithStats = try c.decode(Double.self, forKey: .roundsWithStats)
        self.totals = try c.decode(StatMeasures.self, forKey: .totals)
        self.rounds = try c.decode([PlayerRoundStats].self, forKey: .rounds)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(playerId, forKey: .playerId)
        try c.encode(roundsWithStats, forKey: .roundsWithStats)
        try c.encode(totals, forKey: .totals)
        try c.encode(rounds, forKey: .rounds)
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

enum PlayerHoleStatsTeeResult: String, Codable, Sendable, Equatable {
    case fairway = "fairway"
    case inPlay = "in_play"
    case trouble = "trouble"
}

enum PlayerHoleStatsFirstPutt: String, Codable, Sendable, Equatable {
    case inside2m = "inside_2m"
    case v2To6m = "2_to_6m"
    case over6m = "over_6m"
}

enum PlayerHoleStatsShortGameDifficulty: String, Codable, Sendable, Equatable {
    case standard = "standard"
    case hard = "hard"
}

struct PlayerHoleStats: Codable, Sendable, Equatable {
    var roundId: String
    var playHoleId: String
    var playerId: String
    var teeResult: PlayerHoleStatsTeeResult?
    var gir: Bool?
    var firstPutt: PlayerHoleStatsFirstPutt?
    var putts: Double?
    var shortGameDifficulty: PlayerHoleStatsShortGameDifficulty?
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

    init(roundId: String, playHoleId: String, playerId: String, teeResult: PlayerHoleStatsTeeResult? = nil, gir: Bool? = nil, firstPutt: PlayerHoleStatsFirstPutt? = nil, putts: Double? = nil, shortGameDifficulty: PlayerHoleStatsShortGameDifficulty? = nil, penalties: Double? = nil, recoveryOk: Bool? = nil) {
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
        self.teeResult = try c.decodeIfPresent(PlayerHoleStatsTeeResult.self, forKey: .teeResult)
        self.gir = try c.decodeIfPresent(Bool.self, forKey: .gir)
        self.firstPutt = try c.decodeIfPresent(PlayerHoleStatsFirstPutt.self, forKey: .firstPutt)
        self.putts = try c.decodeIfPresent(Double.self, forKey: .putts)
        self.shortGameDifficulty = try c.decodeIfPresent(PlayerHoleStatsShortGameDifficulty.self, forKey: .shortGameDifficulty)
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
    var firstPuttInside2m: Double
    var firstPutt2To6m: Double
    var firstPuttOver6m: Double
    var firstPuttInside2mResolved: Double
    var firstPutt2To6mResolved: Double
    var firstPuttOver6mResolved: Double
    var onePuttInside2m: Double
    var onePutt2To6m: Double
    var onePuttOver6m: Double
    var puttsRecorded: Double
    var puttsTotal: Double
    var threePutts: Double
    var threePuttsFromOver6m: Double
    var scrambleAttemptsStandard: Double
    var scrambleSuccessesStandard: Double
    var scrambleAttemptsHard: Double
    var scrambleSuccessesHard: Double
    var scrambleFirstPuttStandard: Double
    var scrambleInside2mStandard: Double
    var scrambleFirstPuttHard: Double
    var scrambleInside2mHard: Double
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

    enum CodingKeys: String, CodingKey {
        case teeRecorded = "teeRecorded"
        case fairwayHits = "fairwayHits"
        case inPlayHits = "inPlayHits"
        case troubleCount = "troubleCount"
        case girRecorded = "girRecorded"
        case girHits = "girHits"
        case firstPuttRecorded = "firstPuttRecorded"
        case firstPuttInside2m = "firstPuttInside2m"
        case firstPutt2To6m = "firstPutt2To6m"
        case firstPuttOver6m = "firstPuttOver6m"
        case firstPuttInside2mResolved = "firstPuttInside2mResolved"
        case firstPutt2To6mResolved = "firstPutt2To6mResolved"
        case firstPuttOver6mResolved = "firstPuttOver6mResolved"
        case onePuttInside2m = "onePuttInside2m"
        case onePutt2To6m = "onePutt2To6m"
        case onePuttOver6m = "onePuttOver6m"
        case puttsRecorded = "puttsRecorded"
        case puttsTotal = "puttsTotal"
        case threePutts = "threePutts"
        case threePuttsFromOver6m = "threePuttsFromOver6m"
        case scrambleAttemptsStandard = "scrambleAttemptsStandard"
        case scrambleSuccessesStandard = "scrambleSuccessesStandard"
        case scrambleAttemptsHard = "scrambleAttemptsHard"
        case scrambleSuccessesHard = "scrambleSuccessesHard"
        case scrambleFirstPuttStandard = "scrambleFirstPuttStandard"
        case scrambleInside2mStandard = "scrambleInside2mStandard"
        case scrambleFirstPuttHard = "scrambleFirstPuttHard"
        case scrambleInside2mHard = "scrambleInside2mHard"
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
    }

    init(teeRecorded: Double, fairwayHits: Double, inPlayHits: Double, troubleCount: Double, girRecorded: Double, girHits: Double, firstPuttRecorded: Double, firstPuttInside2m: Double, firstPutt2To6m: Double, firstPuttOver6m: Double, firstPuttInside2mResolved: Double, firstPutt2To6mResolved: Double, firstPuttOver6mResolved: Double, onePuttInside2m: Double, onePutt2To6m: Double, onePuttOver6m: Double, puttsRecorded: Double, puttsTotal: Double, threePutts: Double, threePuttsFromOver6m: Double, scrambleAttemptsStandard: Double, scrambleSuccessesStandard: Double, scrambleAttemptsHard: Double, scrambleSuccessesHard: Double, scrambleFirstPuttStandard: Double, scrambleInside2mStandard: Double, scrambleFirstPuttHard: Double, scrambleInside2mHard: Double, penaltiesRecorded: Double, penaltiesTotal: Double, recoveryAttempts: Double, recoverySuccesses: Double, holesScored: Double, strokesTotal: Double, parTotal: Double, holesScoredPar3: Double, strokesPar3: Double, holesScoredPar4: Double, strokesPar4: Double, holesScoredPar5: Double, strokesPar5: Double, doubleBogeyPlus: Double, girHolesScored: Double, birdiesOnGir: Double, bounceBackOpportunities: Double, bounceBackSuccesses: Double, holesScoredFairway: Double, strokesVsParFairway: Double, holesScoredInPlay: Double, strokesVsParInPlay: Double, holesScoredTrouble: Double, strokesVsParTrouble: Double) {
        self.teeRecorded = teeRecorded
        self.fairwayHits = fairwayHits
        self.inPlayHits = inPlayHits
        self.troubleCount = troubleCount
        self.girRecorded = girRecorded
        self.girHits = girHits
        self.firstPuttRecorded = firstPuttRecorded
        self.firstPuttInside2m = firstPuttInside2m
        self.firstPutt2To6m = firstPutt2To6m
        self.firstPuttOver6m = firstPuttOver6m
        self.firstPuttInside2mResolved = firstPuttInside2mResolved
        self.firstPutt2To6mResolved = firstPutt2To6mResolved
        self.firstPuttOver6mResolved = firstPuttOver6mResolved
        self.onePuttInside2m = onePuttInside2m
        self.onePutt2To6m = onePutt2To6m
        self.onePuttOver6m = onePuttOver6m
        self.puttsRecorded = puttsRecorded
        self.puttsTotal = puttsTotal
        self.threePutts = threePutts
        self.threePuttsFromOver6m = threePuttsFromOver6m
        self.scrambleAttemptsStandard = scrambleAttemptsStandard
        self.scrambleSuccessesStandard = scrambleSuccessesStandard
        self.scrambleAttemptsHard = scrambleAttemptsHard
        self.scrambleSuccessesHard = scrambleSuccessesHard
        self.scrambleFirstPuttStandard = scrambleFirstPuttStandard
        self.scrambleInside2mStandard = scrambleInside2mStandard
        self.scrambleFirstPuttHard = scrambleFirstPuttHard
        self.scrambleInside2mHard = scrambleInside2mHard
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
        self.firstPuttInside2m = try c.decode(Double.self, forKey: .firstPuttInside2m)
        self.firstPutt2To6m = try c.decode(Double.self, forKey: .firstPutt2To6m)
        self.firstPuttOver6m = try c.decode(Double.self, forKey: .firstPuttOver6m)
        self.firstPuttInside2mResolved = try c.decode(Double.self, forKey: .firstPuttInside2mResolved)
        self.firstPutt2To6mResolved = try c.decode(Double.self, forKey: .firstPutt2To6mResolved)
        self.firstPuttOver6mResolved = try c.decode(Double.self, forKey: .firstPuttOver6mResolved)
        self.onePuttInside2m = try c.decode(Double.self, forKey: .onePuttInside2m)
        self.onePutt2To6m = try c.decode(Double.self, forKey: .onePutt2To6m)
        self.onePuttOver6m = try c.decode(Double.self, forKey: .onePuttOver6m)
        self.puttsRecorded = try c.decode(Double.self, forKey: .puttsRecorded)
        self.puttsTotal = try c.decode(Double.self, forKey: .puttsTotal)
        self.threePutts = try c.decode(Double.self, forKey: .threePutts)
        self.threePuttsFromOver6m = try c.decode(Double.self, forKey: .threePuttsFromOver6m)
        self.scrambleAttemptsStandard = try c.decode(Double.self, forKey: .scrambleAttemptsStandard)
        self.scrambleSuccessesStandard = try c.decode(Double.self, forKey: .scrambleSuccessesStandard)
        self.scrambleAttemptsHard = try c.decode(Double.self, forKey: .scrambleAttemptsHard)
        self.scrambleSuccessesHard = try c.decode(Double.self, forKey: .scrambleSuccessesHard)
        self.scrambleFirstPuttStandard = try c.decode(Double.self, forKey: .scrambleFirstPuttStandard)
        self.scrambleInside2mStandard = try c.decode(Double.self, forKey: .scrambleInside2mStandard)
        self.scrambleFirstPuttHard = try c.decode(Double.self, forKey: .scrambleFirstPuttHard)
        self.scrambleInside2mHard = try c.decode(Double.self, forKey: .scrambleInside2mHard)
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
        try c.encode(firstPuttInside2m, forKey: .firstPuttInside2m)
        try c.encode(firstPutt2To6m, forKey: .firstPutt2To6m)
        try c.encode(firstPuttOver6m, forKey: .firstPuttOver6m)
        try c.encode(firstPuttInside2mResolved, forKey: .firstPuttInside2mResolved)
        try c.encode(firstPutt2To6mResolved, forKey: .firstPutt2To6mResolved)
        try c.encode(firstPuttOver6mResolved, forKey: .firstPuttOver6mResolved)
        try c.encode(onePuttInside2m, forKey: .onePuttInside2m)
        try c.encode(onePutt2To6m, forKey: .onePutt2To6m)
        try c.encode(onePuttOver6m, forKey: .onePuttOver6m)
        try c.encode(puttsRecorded, forKey: .puttsRecorded)
        try c.encode(puttsTotal, forKey: .puttsTotal)
        try c.encode(threePutts, forKey: .threePutts)
        try c.encode(threePuttsFromOver6m, forKey: .threePuttsFromOver6m)
        try c.encode(scrambleAttemptsStandard, forKey: .scrambleAttemptsStandard)
        try c.encode(scrambleSuccessesStandard, forKey: .scrambleSuccessesStandard)
        try c.encode(scrambleAttemptsHard, forKey: .scrambleAttemptsHard)
        try c.encode(scrambleSuccessesHard, forKey: .scrambleSuccessesHard)
        try c.encode(scrambleFirstPuttStandard, forKey: .scrambleFirstPuttStandard)
        try c.encode(scrambleInside2mStandard, forKey: .scrambleInside2mStandard)
        try c.encode(scrambleFirstPuttHard, forKey: .scrambleFirstPuttHard)
        try c.encode(scrambleInside2mHard, forKey: .scrambleInside2mHard)
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
    }
}

struct PlayerRoundStats: Codable, Sendable, Equatable {
    var roundId: String
    var date: String
    var courseName: String?
    var measures: StatMeasures

    enum CodingKeys: String, CodingKey {
        case roundId = "roundId"
        case date = "date"
        case courseName = "courseName"
        case measures = "measures"
    }

    init(roundId: String, date: String, courseName: String? = nil, measures: StatMeasures) {
        self.roundId = roundId
        self.date = date
        self.courseName = courseName
        self.measures = measures
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.roundId = try c.decode(String.self, forKey: .roundId)
        self.date = try c.decode(String.self, forKey: .date)
        self.courseName = try c.decodeIfPresent(String.self, forKey: .courseName)
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
