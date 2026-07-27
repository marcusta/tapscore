// GENERATED — DO NOT EDIT. bun run generate:swift

enum PlayersEndpoints {
    static let me = APIEndpoint<EmptyInput, Player?>(
        method: .get,
        path: "/players/me",
        pathParams: [])
    static let register = APIEndpoint<PlayersRegisterInput, Player>(
        method: .post,
        path: "/players/register",
        pathParams: [])
    static let updateHandicap = APIEndpoint<PlayersUpdateHandicapInput, HandicapEntry>(
        method: .post,
        path: "/players/me/handicap",
        pathParams: [])
    static let myHandicapHistory = APIEndpoint<EmptyInput, [HandicapEntry]>(
        method: .get,
        path: "/players/me/handicap-history",
        pathParams: [])
    static let updateProfile = APIEndpoint<PlayersUpdateProfileInput, Player>(
        method: .post,
        path: "/players/me/profile",
        pathParams: [])
    static let search = APIEndpoint<PlayersSearchInput, [PlayerSearchResult]>(
        method: .get,
        path: "/players/search",
        pathParams: [])
}
