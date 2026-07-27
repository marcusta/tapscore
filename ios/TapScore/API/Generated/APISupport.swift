// GENERATED — DO NOT EDIT. bun run generate:swift
//
// Hand-written transport lives OUTSIDE this directory; these are the shared
// runtime pieces the generated code needs and nothing more.

import Foundation

enum HTTPMethod: String, Sendable, Equatable {
    case get = "GET"
    case post = "POST"
    case put = "PUT"
    case patch = "PATCH"
    case delete = "DELETE"
}

/// One endpoint of a generated API: method, path template and the names of the
/// `:param` segments in it. Carries no transport — the actor client does.
struct APIEndpoint<Input: Encodable & Sendable, Output: Decodable & Sendable>: Sendable {
    let method: HTTPMethod
    let path: String
    let pathParams: [String]

    init(method: HTTPMethod, path: String, pathParams: [String]) {
        self.method = method
        self.path = path
        self.pathParams = pathParams
    }
}

/// Placeholder input for endpoints that take none.
struct EmptyInput: Codable, Sendable, Equatable {
    init() {}
}

/// Absent / null / value — the three states a TS `?: null | T` property has on
/// the wire. Collapsing any two of them loses information the server acts on.
enum TriState<Wrapped: Codable & Sendable & Equatable>: Sendable, Equatable {
    case absent
    case null
    case value(Wrapped)

    var value: Wrapped? {
        if case .value(let v) = self { return v }
        return nil
    }

    var isAbsent: Bool {
        if case .absent = self { return true }
        return false
    }
}

/// Any JSON value — the Swift image of TS `unknown`.
enum JSONValue: Codable, Sendable, Equatable {
    case null
    case bool(Bool)
    case number(Double)
    case string(String)
    case array([JSONValue])
    case object([String: JSONValue])

    init(from decoder: any Decoder) throws {
        let c = try decoder.singleValueContainer()
        if c.decodeNil() { self = .null; return }
        if let v = try? c.decode(Bool.self) { self = .bool(v); return }
        if let v = try? c.decode(Double.self) { self = .number(v); return }
        if let v = try? c.decode(String.self) { self = .string(v); return }
        if let v = try? c.decode([JSONValue].self) { self = .array(v); return }
        if let v = try? c.decode([String: JSONValue].self) { self = .object(v); return }
        throw DecodingError.dataCorruptedError(in: c, debugDescription: "unrepresentable JSON value")
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.singleValueContainer()
        switch self {
        case .null: try c.encodeNil()
        case .bool(let v): try c.encode(v)
        case .number(let v): try c.encode(v)
        case .string(let v): try c.encode(v)
        case .array(let v): try c.encode(v)
        case .object(let v): try c.encode(v)
        }
    }
}

/// Coding key for key-presence probing (the fallback discriminator).
struct AnyCodingKey: CodingKey {
    var stringValue: String
    var intValue: Int?

    init(_ stringValue: String) {
        self.stringValue = stringValue
        self.intValue = nil
    }

    init?(stringValue: String) { self.init(stringValue) }

    init?(intValue: Int) {
        self.stringValue = String(intValue)
        self.intValue = intValue
    }
}
