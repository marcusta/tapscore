// GENERATED — DO NOT EDIT. bun run generate:swift

enum TeesEndpoints {
    static let listByCourse = APIEndpoint<CourseRouteTemplatesListByCourseInput, [Tee]>(
        method: .get,
        path: "/tees/by-course",
        pathParams: [])
    static let `get` = APIEndpoint<ClubsGetInput, Tee?>(
        method: .get,
        path: "/tees/get",
        pathParams: [])
    static let create = APIEndpoint<TeesCreateInput, Tee>(
        method: .post,
        path: "/tees",
        pathParams: [])
    static let update = APIEndpoint<TeesUpdateInput, Tee>(
        method: .post,
        path: "/tees/update",
        pathParams: [])
    static let remove = APIEndpoint<ClubsGetInput, ClubsRemoveOutput>(
        method: .delete,
        path: "/tees/:id",
        pathParams: ["id"])
}
