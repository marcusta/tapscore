// GENERATED — DO NOT EDIT. bun run generate:swift

enum ClubsEndpoints {
    static let list = APIEndpoint<EmptyInput, [ClubListItem]>(
        method: .get,
        path: "/clubs",
        pathParams: [])
    static let `get` = APIEndpoint<ClubsGetInput, Club?>(
        method: .get,
        path: "/clubs/get",
        pathParams: [])
    static let create = APIEndpoint<ClubsCreateInput, Club>(
        method: .post,
        path: "/clubs",
        pathParams: [])
    static let update = APIEndpoint<ClubsUpdateInput, Club>(
        method: .post,
        path: "/clubs/update",
        pathParams: [])
    static let remove = APIEndpoint<ClubsGetInput, ClubsRemoveOutput>(
        method: .delete,
        path: "/clubs/:id",
        pathParams: ["id"])
}
