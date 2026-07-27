// GENERATED — DO NOT EDIT. bun run generate:swift

import Foundation

struct LeaderboardsForRoundInput: Codable, Sendable, Equatable {
    var roundId: String

    enum CodingKeys: String, CodingKey {
        case roundId = "roundId"
    }

    init(roundId: String) {
        self.roundId = roundId
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.roundId = try c.decode(String.self, forKey: .roundId)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(roundId, forKey: .roundId)
    }
}
