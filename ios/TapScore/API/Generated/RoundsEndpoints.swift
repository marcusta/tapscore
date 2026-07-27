// GENERATED — DO NOT EDIT. bun run generate:swift

enum RoundsEndpoints {
    static let list = APIEndpoint<EmptyInput, [Round]>(
        method: .get,
        path: "/rounds",
        pathParams: [])
    static let balls = APIEndpoint<LeaderboardsForRoundInput, [RoundBall]>(
        method: .get,
        path: "/rounds/balls",
        pathParams: [])
    static let `get` = APIEndpoint<ClubsGetInput, Round?>(
        method: .get,
        path: "/rounds/get",
        pathParams: [])
    static let create = APIEndpoint<RoundsCreateInput, Round>(
        method: .post,
        path: "/rounds",
        pathParams: [])
    static let createFromDraft = APIEndpoint<FriendlyRoundsCreateInput, FriendlyRoundsEditSetupOutput>(
        method: .post,
        path: "/rounds/from-draft",
        pathParams: [])
    static let update = APIEndpoint<RoundsUpdateInput, Round>(
        method: .post,
        path: "/rounds/update",
        pathParams: [])
    static let remove = APIEndpoint<ClubsGetInput, ClubsRemoveOutput>(
        method: .delete,
        path: "/rounds/:id",
        pathParams: ["id"])
}
