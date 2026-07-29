// GENERATED — DO NOT EDIT. bun run generate:swift

enum FriendlyRoundsEndpoints {
    static let create = APIEndpoint<FriendlyRoundsCreateInput, FriendlyRoundsCreateOutput>(
        method: .post,
        path: "/friendly-rounds",
        pathParams: [])
    static let byToken = APIEndpoint<FriendlyRoundsByTokenInput, FriendlyRoundsByTokenOutput>(
        method: .get,
        path: "/friendly-rounds/by-token",
        pathParams: [])
    static let balls = APIEndpoint<FriendlyRoundsByTokenInput, [RoundBall]>(
        method: .get,
        path: "/friendly-rounds/balls",
        pathParams: [])
    static let scorecard = APIEndpoint<FriendlyRoundsByTokenInput, [Scorecard]>(
        method: .get,
        path: "/friendly-rounds/scorecard",
        pathParams: [])
    static let result = APIEndpoint<FriendlyRoundsResultInput, FriendlyRoundsResultOutput>(
        method: .get,
        path: "/friendly-rounds/result",
        pathParams: [])
    static let score = APIEndpoint<FriendlyRoundsScoreInput, AppendResult>(
        method: .post,
        path: "/friendly-rounds/score",
        pathParams: [])
    static let setup = APIEndpoint<FriendlyRoundsByTokenInput, FriendlyRoundsSetupOutput>(
        method: .get,
        path: "/friendly-rounds/setup",
        pathParams: [])
    static let editSetup = APIEndpoint<FriendlyRoundsEditSetupInput, FriendlyRoundsEditSetupOutput>(
        method: .post,
        path: "/friendly-rounds/setup",
        pathParams: [])
    static let remove = APIEndpoint<FriendlyRoundsByTokenInput, ClubsRemoveOutput>(
        method: .delete,
        path: "/friendly-rounds/:token",
        pathParams: ["token"])
    static let finish = APIEndpoint<FriendlyRoundsByTokenInput, FriendlyRoundsFinishOutput>(
        method: .post,
        path: "/friendly-rounds/finish",
        pathParams: [])
    static let reopen = APIEndpoint<FriendlyRoundsByTokenInput, FriendlyRoundsReopenOutput>(
        method: .post,
        path: "/friendly-rounds/reopen",
        pathParams: [])
    static let join = APIEndpoint<FriendlyRoundsJoinInput, FriendlyRoundsEditSetupOutput>(
        method: .post,
        path: "/friendly-rounds/join",
        pathParams: [])
    static let leave = APIEndpoint<FriendlyRoundsByTokenInput, FriendlyRoundsEditSetupOutput>(
        method: .post,
        path: "/friendly-rounds/leave",
        pathParams: [])
    static let claimGuest = APIEndpoint<FriendlyRoundsClaimGuestInput, ClaimGuestResult>(
        method: .post,
        path: "/friendly-rounds/claim-guest",
        pathParams: [])
    static let renameGuest = APIEndpoint<FriendlyRoundsRenameGuestInput, RenameGuestResult>(
        method: .post,
        path: "/friendly-rounds/rename-guest",
        pathParams: [])
    static let claimSeat = APIEndpoint<FriendlyRoundsClaimSeatInput, FriendlyRoundsEditSetupOutput>(
        method: .post,
        path: "/friendly-rounds/claim-seat",
        pathParams: [])
    static let releaseSeat = APIEndpoint<FriendlyRoundsReleaseSeatInput, FriendlyRoundsEditSetupOutput>(
        method: .post,
        path: "/friendly-rounds/release-seat",
        pathParams: [])
}
