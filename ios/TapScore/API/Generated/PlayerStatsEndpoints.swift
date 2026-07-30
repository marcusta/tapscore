// GENERATED — DO NOT EDIT. bun run generate:swift

enum PlayerStatsEndpoints {
    static let myConfig = APIEndpoint<EmptyInput, PlayerStatsConfig>(
        method: .get,
        path: "/players/me/stats-config",
        pathParams: [])
    static let putMyConfig = APIEndpoint<PlayerStatsPutMyConfigInput, PlayerStatsConfig>(
        method: .put,
        path: "/players/me/stats-config",
        pathParams: [])
    static let myStats = APIEndpoint<PlayerStatsMyStatsInput, PlayerStatsSummary>(
        method: .get,
        path: "/players/me/stats",
        pathParams: [])
    static let myRoundStats = APIEndpoint<LeaderboardsForRoundInput, [PlayerRoundHoleStats]>(
        method: .get,
        path: "/players/me/rounds/:roundId/stats",
        pathParams: ["roundId"])
    static let appendEvents = APIEndpoint<PlayerStatsAppendEventsInput, AppendStatEventsResult>(
        method: .post,
        path: "/friendly-rounds/stat-events",
        pathParams: [])
    static let byToken = APIEndpoint<FriendlyRoundsByTokenInput, [PlayerHoleStats]>(
        method: .get,
        path: "/friendly-rounds/stats",
        pathParams: [])
    static let configsByToken = APIEndpoint<FriendlyRoundsByTokenInput, [RoundPlayerStatModules]>(
        method: .get,
        path: "/friendly-rounds/stats-configs",
        pathParams: [])
}
