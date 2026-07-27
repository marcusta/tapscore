// GENERATED — DO NOT EDIT. bun run generate:swift

import Foundation

struct ScorecardsForBallInput: Codable, Sendable, Equatable {
    var ballId: String

    enum CodingKeys: String, CodingKey {
        case ballId = "ballId"
    }

    init(ballId: String) {
        self.ballId = ballId
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.ballId = try c.decode(String.self, forKey: .ballId)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(ballId, forKey: .ballId)
    }
}
