// GENERATED — DO NOT EDIT. bun run generate:swift

enum SpectateEndpoints {
    static let round = APIEndpoint<LeaderboardsForRoundInput, SpectateView>(
        method: .get,
        path: "/spectate/rounds/:roundId",
        pathParams: ["roundId"])
}
