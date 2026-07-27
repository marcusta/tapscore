// GENERATED — DO NOT EDIT. bun run generate:swift

enum ScorecardsEndpoints {
    static let forBall = APIEndpoint<ScorecardsForBallInput, Scorecard>(
        method: .get,
        path: "/scorecards/for-ball",
        pathParams: [])
    static let forRound = APIEndpoint<LeaderboardsForRoundInput, [Scorecard]>(
        method: .get,
        path: "/scorecards/for-round",
        pathParams: [])
}
