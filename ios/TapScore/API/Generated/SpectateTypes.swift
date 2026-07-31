// GENERATED — DO NOT EDIT. bun run generate:swift

import Foundation

struct SpectateView: Codable, Sendable, Equatable {
    var round: Round
    var result: RoundResult
    var cursor: String?
    var status: AdminRoundSummaryStatus

    enum CodingKeys: String, CodingKey {
        case round = "round"
        case result = "result"
        case cursor = "cursor"
        case status = "status"
    }

    init(round: Round, result: RoundResult, cursor: String? = nil, status: AdminRoundSummaryStatus) {
        self.round = round
        self.result = result
        self.cursor = cursor
        self.status = status
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.round = try c.decode(Round.self, forKey: .round)
        self.result = try c.decode(RoundResult.self, forKey: .result)
        self.cursor = try c.decodeIfPresent(String.self, forKey: .cursor)
        self.status = try c.decode(AdminRoundSummaryStatus.self, forKey: .status)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(round, forKey: .round)
        try c.encode(result, forKey: .result)
        if let cursor {
            try c.encode(cursor, forKey: .cursor)
        } else {
            try c.encodeNil(forKey: .cursor)
        }
        try c.encode(status, forKey: .status)
    }
}
