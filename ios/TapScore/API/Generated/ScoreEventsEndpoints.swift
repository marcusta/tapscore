// GENERATED — DO NOT EDIT. bun run generate:swift

enum ScoreEventsEndpoints {
    static let listByRound = APIEndpoint<LeaderboardsForRoundInput, [ScoreEvent]>(
        method: .get,
        path: "/score-events/by-round",
        pathParams: [])
    static let append = APIEndpoint<ScoreEventsAppendInput, AppendResult>(
        method: .post,
        path: "/score-events",
        pathParams: [])
}
