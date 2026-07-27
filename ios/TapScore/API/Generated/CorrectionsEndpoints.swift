// GENERATED — DO NOT EDIT. bun run generate:swift

enum CorrectionsEndpoints {
    static let setupCorrection = APIEndpoint<CorrectionsSetupCorrectionInput, CorrectionsSetupCorrectionOutput>(
        method: .post,
        path: "/corrections/setup",
        pathParams: [])
    static let allowanceOverride = APIEndpoint<CorrectionsAllowanceOverrideInput, CorrectionsSetupCorrectionOutput>(
        method: .post,
        path: "/corrections/allowance",
        pathParams: [])
    static let ruling = APIEndpoint<CorrectionsRulingInput, CorrectionsRulingOutput>(
        method: .post,
        path: "/corrections/ruling",
        pathParams: [])
}
