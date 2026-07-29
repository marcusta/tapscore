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
    static let appendEvents = APIEndpoint<PlayerStatsAppendEventsInput, AppendStatEventsResult>(
        method: .post,
        path: "/friendly-rounds/stat-events",
        pathParams: [])
    static let byToken = APIEndpoint<FriendlyRoundsByTokenInput, [PlayerHoleStats]>(
        method: .get,
        path: "/friendly-rounds/stats",
        pathParams: [])
}
