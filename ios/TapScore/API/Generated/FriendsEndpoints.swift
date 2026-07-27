// GENERATED — DO NOT EDIT. bun run generate:swift

enum FriendsEndpoints {
    static let list = APIEndpoint<EmptyInput, [FriendProfile]>(
        method: .get,
        path: "/friends",
        pathParams: [])
    static let add = APIEndpoint<FriendsAddInput, Friendship>(
        method: .post,
        path: "/friends",
        pathParams: [])
    static let remove = APIEndpoint<FriendsAddInput, ClubsRemoveOutput>(
        method: .delete,
        path: "/friends/:friendId",
        pathParams: ["friendId"])
}
