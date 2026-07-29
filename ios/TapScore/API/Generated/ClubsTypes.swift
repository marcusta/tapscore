// GENERATED — DO NOT EDIT. bun run generate:swift

import Foundation

struct Club: Codable, Sendable, Equatable {
    var id: String
    var name: String
    var location: String?
    var logoUrl: String?

    enum CodingKeys: String, CodingKey {
        case id = "id"
        case name = "name"
        case location = "location"
        case logoUrl = "logoUrl"
    }

    init(id: String, name: String, location: String? = nil, logoUrl: String? = nil) {
        self.id = id
        self.name = name
        self.location = location
        self.logoUrl = logoUrl
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try c.decode(String.self, forKey: .id)
        self.name = try c.decode(String.self, forKey: .name)
        self.location = try c.decodeIfPresent(String.self, forKey: .location)
        self.logoUrl = try c.decodeIfPresent(String.self, forKey: .logoUrl)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encode(name, forKey: .name)
        if let location {
            try c.encode(location, forKey: .location)
        } else {
            try c.encodeNil(forKey: .location)
        }
        if let logoUrl {
            try c.encode(logoUrl, forKey: .logoUrl)
        } else {
            try c.encodeNil(forKey: .logoUrl)
        }
    }
}

struct ClubsGetInput: Codable, Sendable, Equatable {
    var id: String

    enum CodingKeys: String, CodingKey {
        case id = "id"
    }

    init(id: String) {
        self.id = id
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try c.decode(String.self, forKey: .id)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
    }
}

struct ClubsCreateInput: Codable, Sendable, Equatable {
    var name: String
    var location: TriState<String>
    var logoUrl: TriState<String>

    enum CodingKeys: String, CodingKey {
        case name = "name"
        case location = "location"
        case logoUrl = "logoUrl"
    }

    init(name: String, location: TriState<String> = .absent, logoUrl: TriState<String> = .absent) {
        self.name = name
        self.location = location
        self.logoUrl = logoUrl
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.name = try c.decode(String.self, forKey: .name)
        if c.contains(.location) {
            self.location = try c.decodeNil(forKey: .location)
                ? .null
                : .value(try c.decode(String.self, forKey: .location))
        } else {
            self.location = .absent
        }
        if c.contains(.logoUrl) {
            self.logoUrl = try c.decodeNil(forKey: .logoUrl)
                ? .null
                : .value(try c.decode(String.self, forKey: .logoUrl))
        } else {
            self.logoUrl = .absent
        }
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(name, forKey: .name)
        switch location {
        case .absent: break
        case .null: try c.encodeNil(forKey: .location)
        case .value(let v): try c.encode(v, forKey: .location)
        }
        switch logoUrl {
        case .absent: break
        case .null: try c.encodeNil(forKey: .logoUrl)
        case .value(let v): try c.encode(v, forKey: .logoUrl)
        }
    }
}

struct ClubsUpdateInput: Codable, Sendable, Equatable {
    var id: String
    var name: String?
    var location: TriState<String>
    var logoUrl: TriState<String>

    enum CodingKeys: String, CodingKey {
        case id = "id"
        case name = "name"
        case location = "location"
        case logoUrl = "logoUrl"
    }

    init(id: String, name: String? = nil, location: TriState<String> = .absent, logoUrl: TriState<String> = .absent) {
        self.id = id
        self.name = name
        self.location = location
        self.logoUrl = logoUrl
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try c.decode(String.self, forKey: .id)
        self.name = try c.decodeIfPresent(String.self, forKey: .name)
        if c.contains(.location) {
            self.location = try c.decodeNil(forKey: .location)
                ? .null
                : .value(try c.decode(String.self, forKey: .location))
        } else {
            self.location = .absent
        }
        if c.contains(.logoUrl) {
            self.logoUrl = try c.decodeNil(forKey: .logoUrl)
                ? .null
                : .value(try c.decode(String.self, forKey: .logoUrl))
        } else {
            self.logoUrl = .absent
        }
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encodeIfPresent(name, forKey: .name)
        switch location {
        case .absent: break
        case .null: try c.encodeNil(forKey: .location)
        case .value(let v): try c.encode(v, forKey: .location)
        }
        switch logoUrl {
        case .absent: break
        case .null: try c.encodeNil(forKey: .logoUrl)
        case .value(let v): try c.encode(v, forKey: .logoUrl)
        }
    }
}

struct ClubsRemoveOutput: Codable, Sendable, Equatable {
    var ok: Bool

    enum CodingKeys: String, CodingKey {
        case ok = "ok"
    }

    init(ok: Bool) {
        self.ok = ok
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.ok = try c.decode(Bool.self, forKey: .ok)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(ok, forKey: .ok)
    }
}
