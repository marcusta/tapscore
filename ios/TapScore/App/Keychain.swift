import Foundation
import Security

/// Keychain-backed storage for the single bearer session token the native
/// client authenticates with.
///
/// The server issues the token from `POST /api/auth/apple` (framework 1.2.0
/// `issueSessionToken`) and accepts it as `Authorization: Bearer <token>` on
/// every route that also accepts the web session cookie. The token IS a
/// credential, so it lives in the Keychain — **never** `UserDefaults`, which is
/// a plist in the app container readable from any backup.
///
/// Deliberately tiny, mirroring `../golf-map/ios/GolfMap/App/Keychain.swift`:
/// one slot, overwrite-on-save, wipe-on-clear. A second slot would mean a
/// second logged-in identity, which the product does not have.
struct Keychain: Sendable {
    /// Keychain service string namespacing every item this app writes.
    let service: String

    /// How a token is written. Exactly one implementation ships (`SecItemAdd`,
    /// below) — the seam exists because the interesting branch is the FAILING
    /// one: `AppEnvironment.adoptSession` revokes a just-issued server session
    /// when the write fails, and a real Keychain cannot be asked to refuse a
    /// write on demand. An untested revoke is a revoke that quietly stops
    /// happening, and each miss leaks a live session nothing can ever kill.
    typealias Writer = @Sendable (_ service: String, _ account: String, _ token: String) -> Bool

    /// The single account label under `service`. Fixed, because there is
    /// exactly one token slot.
    private let account = "session-token"

    private let writer: Writer

    init(
        service: String = "com.marcusandersson.tapscore.session",
        writer: @escaping Writer = Keychain.secItemAddWriter
    ) {
        self.service = service
        self.writer = writer
    }

    /// A store whose writes always fail. Test-only in practice; it is spelled
    /// as a named value rather than a closure at the call site so the intent
    /// reads at a glance.
    static func failingWrites(service: String) -> Keychain {
        Keychain(service: service, writer: { _, _, _ in false })
    }

    /// Stores (or replaces) the bearer token. Any previously stored token is
    /// removed first so at most one item ever exists.
    ///
    /// - Returns: `true` when the item was written. A `false` here is a real
    ///   signal (missing entitlement, locked device) worth surfacing rather
    ///   than swallowing.
    @discardableResult
    func saveToken(_ token: String) -> Bool {
        clear()
        return writer(service, account, token)
    }

    /// The real write. Add-only, after `clear()`, so at most one item exists.
    static let secItemAddWriter: Writer = { service, account, token in
        guard let data = token.data(using: .utf8) else { return false }
        let attributes: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecValueData as String: data,
            // Available after first unlock; survives reboots, never syncs to
            // iCloud (a session token is device-scoped by design).
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlock,
        ]
        return SecItemAdd(attributes as CFDictionary, nil) == errSecSuccess
    }

    /// Loads the stored bearer token, or nil when none is present.
    func loadToken() -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]
        var item: CFTypeRef?
        guard SecItemCopyMatching(query as CFDictionary, &item) == errSecSuccess,
              let data = item as? Data,
              let token = String(data: data, encoding: .utf8)
        else { return nil }
        return token
    }

    /// Removes every item for this service (logout, or a token the server
    /// rejected with 401).
    func clear() {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
        ]
        SecItemDelete(query as CFDictionary)
    }
}
