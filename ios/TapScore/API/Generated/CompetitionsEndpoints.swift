// GENERATED — DO NOT EDIT. bun run generate:swift

enum CompetitionsEndpoints {
    static let `get` = APIEndpoint<ClubsGetInput, CompetitionDetail>(
        method: .get,
        path: "/competitions/get",
        pathParams: [])
    static let participants = APIEndpoint<CompetitionsParticipantsInput, [CompetitionParticipant]>(
        method: .get,
        path: "/competitions/participants",
        pathParams: [])
    static let leaderboard = APIEndpoint<ClubsGetInput, CompetitionsLeaderboardOutput>(
        method: .get,
        path: "/competitions/:id/leaderboard",
        pathParams: ["id"])
    static let results = APIEndpoint<ClubsGetInput, CompetitionsResultsOutput>(
        method: .get,
        path: "/competitions/:id/results",
        pathParams: ["id"])
    static let list = APIEndpoint<EmptyInput, [Competition]>(
        method: .get,
        path: "/competitions",
        pathParams: [])
    static let create = APIEndpoint<CompetitionsCreateInput, Competition>(
        method: .post,
        path: "/competitions",
        pathParams: [])
    static let update = APIEndpoint<CompetitionsUpdateInput, CompetitionsUpdateOutput>(
        method: .post,
        path: "/competitions/update",
        pathParams: [])
    static let transition = APIEndpoint<CompetitionsTransitionInput, CompetitionsUpdateOutput>(
        method: .post,
        path: "/competitions/transition",
        pathParams: [])
    static let createRound = APIEndpoint<CompetitionsCreateRoundInput, CompetitionsCreateRoundOutput>(
        method: .post,
        path: "/competitions/:id/rounds",
        pathParams: ["id"])
    static let applyCut = APIEndpoint<ClubsGetInput, CompetitionsApplyCutOutput>(
        method: .post,
        path: "/competitions/:id/cut",
        pathParams: ["id"])
    static let finalize = APIEndpoint<ClubsGetInput, CompetitionsFinalizeOutput>(
        method: .post,
        path: "/competitions/:id/finalize",
        pathParams: ["id"])
    static let addParticipant = APIEndpoint<CompetitionsAddParticipantInput, CompetitionsAddParticipantOutput>(
        method: .post,
        path: "/competitions/participants/add",
        pathParams: [])
    static let removeParticipant = APIEndpoint<CompetitionsRemoveParticipantInput, CompetitionsRemoveParticipantOutput>(
        method: .post,
        path: "/competitions/participants/remove",
        pathParams: [])
    static let withdrawParticipant = APIEndpoint<CompetitionsRemoveParticipantInput, CompetitionsWithdrawParticipantOutput>(
        method: .post,
        path: "/competitions/participants/withdraw",
        pathParams: [])
}
