// GENERATED — DO NOT EDIT. bun run generate:swift

enum AdminEndpoints {
    static let myRoles = APIEndpoint<EmptyInput, [RoleGrant]>(
        method: .get,
        path: "/me/roles",
        pathParams: [])
    static let adminStats = APIEndpoint<EmptyInput, AdminStats>(
        method: .get,
        path: "/admin/stats",
        pathParams: [])
    static let adminRounds = APIEndpoint<AdminAdminRoundsInput, [AdminRoundSummary]>(
        method: .get,
        path: "/admin/rounds",
        pathParams: [])
    static let adminPlayers = APIEndpoint<EmptyInput, [AdminPlayerSummary]>(
        method: .get,
        path: "/admin/players",
        pathParams: [])
    static let adminGrantRole = APIEndpoint<AdminAdminGrantRoleInput, RoleGrant>(
        method: .post,
        path: "/admin/roles/grant",
        pathParams: [])
    static let adminRevokeRole = APIEndpoint<AdminAdminGrantRoleInput, AdminAdminRevokeRoleOutput>(
        method: .post,
        path: "/admin/roles/revoke",
        pathParams: [])
}
