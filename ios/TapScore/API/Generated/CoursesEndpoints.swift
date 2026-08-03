// GENERATED — DO NOT EDIT. bun run generate:swift

enum CoursesEndpoints {
    static let list = APIEndpoint<EmptyInput, [Course]>(
        method: .get,
        path: "/courses",
        pathParams: [])
    static let listByClub = APIEndpoint<CoursesListByClubInput, [ClubCourse]>(
        method: .get,
        path: "/courses/by-club",
        pathParams: [])
    static let `get` = APIEndpoint<ClubsGetInput, Course?>(
        method: .get,
        path: "/courses/get",
        pathParams: [])
    static let teeRoleCatalog = APIEndpoint<EmptyInput, [TeeRole]>(
        method: .get,
        path: "/courses/tee-roles/catalog",
        pathParams: [])
    static let teeRoles = APIEndpoint<CourseRouteTemplatesListByCourseInput, [CourseTeeRole]>(
        method: .get,
        path: "/courses/tee-roles",
        pathParams: [])
    static let create = APIEndpoint<CoursesCreateInput, Course>(
        method: .post,
        path: "/courses",
        pathParams: [])
    static let update = APIEndpoint<CoursesUpdateInput, Course>(
        method: .post,
        path: "/courses/update",
        pathParams: [])
    static let updateHole = APIEndpoint<CoursesUpdateHoleInput, Course>(
        method: .post,
        path: "/courses/holes/update",
        pathParams: [])
    static let setTeeRole = APIEndpoint<CoursesSetTeeRoleInput, CourseTeeRole>(
        method: .post,
        path: "/courses/tee-roles",
        pathParams: [])
    static let clearTeeRole = APIEndpoint<CoursesClearTeeRoleInput, ClubsRemoveOutput>(
        method: .delete,
        path: "/courses/tee-roles/:courseId/:roleKey/:gender",
        pathParams: ["courseId", "roleKey", "gender"])
    static let validate = APIEndpoint<ClubsGetInput, CourseValidation>(
        method: .get,
        path: "/courses/validate",
        pathParams: [])
    static let remove = APIEndpoint<ClubsGetInput, ClubsRemoveOutput>(
        method: .delete,
        path: "/courses/:id",
        pathParams: ["id"])
}
