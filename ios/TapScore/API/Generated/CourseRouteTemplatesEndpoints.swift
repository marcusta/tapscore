// GENERATED — DO NOT EDIT. bun run generate:swift

enum CourseRouteTemplatesEndpoints {
    static let listByCourse = APIEndpoint<CourseRouteTemplatesListByCourseInput, [CourseRouteTemplate]>(
        method: .get,
        path: "/course-route-templates",
        pathParams: [])
    static let `get` = APIEndpoint<ClubsGetInput, CourseRouteTemplate?>(
        method: .get,
        path: "/course-route-templates/get",
        pathParams: [])
    static let validate = APIEndpoint<CourseRouteTemplatesValidateInput, [CompilerDiagnostic]>(
        method: .post,
        path: "/course-route-templates/validate",
        pathParams: [])
    static let create = APIEndpoint<CourseRouteTemplatesCreateInput, CourseRouteTemplatesCreateOutput>(
        method: .post,
        path: "/course-route-templates",
        pathParams: [])
    static let update = APIEndpoint<CourseRouteTemplatesUpdateInput, CourseRouteTemplatesCreateOutput>(
        method: .post,
        path: "/course-route-templates/update",
        pathParams: [])
    static let remove = APIEndpoint<ClubsGetInput, ClubsRemoveOutput>(
        method: .delete,
        path: "/course-route-templates/:id",
        pathParams: ["id"])
}
