// GENERATED — DO NOT EDIT. bun run generate:swift

enum AuthNativeEndpoints {
    static let appleSignIn = APIEndpoint<AuthNativeAppleSignInInput, AuthNativeAppleSignInOutput>(
        method: .post,
        path: "/auth/apple",
        pathParams: [])
    static let revoke = APIEndpoint<EmptyInput, AuthNativeRevokeOutput>(
        method: .post,
        path: "/auth/revoke",
        pathParams: [])
}
