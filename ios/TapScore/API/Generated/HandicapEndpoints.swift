// GENERATED — DO NOT EDIT. bun run generate:swift

enum HandicapEndpoints {
    static let latest = APIEndpoint<HandicapLatestInput, HandicapEntry?>(
        method: .get,
        path: "/handicap/latest",
        pathParams: [])
    static let history = APIEndpoint<HandicapLatestInput, [HandicapEntry]>(
        method: .get,
        path: "/handicap/history",
        pathParams: [])
    static let record = APIEndpoint<HandicapRecordInput, HandicapEntry>(
        method: .post,
        path: "/handicap/record",
        pathParams: [])
}
