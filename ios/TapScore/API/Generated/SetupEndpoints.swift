// GENERATED — DO NOT EDIT. bun run generate:swift

enum SetupEndpoints {
    static let clubs = APIEndpoint<EmptyInput, [Club]>(
        method: .get,
        path: "/setup/clubs",
        pathParams: [])
    static let courses = APIEndpoint<EmptyInput, [SetupCourse]>(
        method: .get,
        path: "/setup/courses",
        pathParams: [])
    static let teesByCourse = APIEndpoint<CourseRouteTemplatesListByCourseInput, [Tee]>(
        method: .get,
        path: "/setup/tees/by-course",
        pathParams: [])
    static let formats = APIEndpoint<EmptyInput, [FormatDescriptor]>(
        method: .get,
        path: "/setup/formats",
        pathParams: [])
    static let aggregations = APIEndpoint<EmptyInput, [AggregationDescriptor]>(
        method: .get,
        path: "/setup/aggregations",
        pathParams: [])
}
