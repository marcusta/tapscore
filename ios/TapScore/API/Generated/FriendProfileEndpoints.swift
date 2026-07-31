// GENERATED — DO NOT EDIT. bun run generate:swift

enum FriendProfileEndpoints {
    static let profile = APIEndpoint<FriendProfileProfileInput, FriendProfileView>(
        method: .get,
        path: "/friends/:playerId/profile",
        pathParams: ["playerId"])
    static let rounds = APIEndpoint<FriendProfileRoundsInput, FriendProfileRoundPage>(
        method: .get,
        path: "/friends/:playerId/rounds",
        pathParams: ["playerId"])
    static let courses = APIEndpoint<FriendProfileProfileInput, FriendProfileCoursePage>(
        method: .get,
        path: "/friends/:playerId/courses",
        pathParams: ["playerId"])
}
