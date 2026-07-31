// GENERATED — DO NOT EDIT. bun run generate:swift

enum DashboardEndpoints {
    static let myRounds = APIEndpoint<EmptyInput, DashboardMyRoundsOutput>(
        method: .get,
        path: "/dashboard/my-rounds",
        pathParams: [])
    static let friendsActivity = APIEndpoint<EmptyInput, FriendsActivity>(
        method: .get,
        path: "/dashboard/friends-activity",
        pathParams: [])
}
