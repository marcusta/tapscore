import Foundation
import XCTest
@testable import TapScore

/// The stored draft the edit tests load — deliberately RICHER than anything the
/// iOS create flow can express.
///
/// That is the whole point of it. `editSetup` is a full-document replace (spec
/// B7), so the only fixture that can prove carry-through is one carrying fields
/// this client has no control for: a venue type, a start-list policy, playing
/// groups, a split allowance band, a numeric format knob, a producer category
/// and a seat label. A fixture made of only what the wizard can draw would pass
/// against a builder that throws the rest away.
///
/// Its ids line up with `CreateStubs`: `course-1`, `tee-y` / `tee-r` / `tee-w`,
/// so a real `CreateStore` can load it over the stub transport.
enum EditDraftFixtures {
    static let playedAt = "2026-05-04"

    /// Four producers, two sides, two format slots.
    ///
    ///  - `p1` plays as a real player and carries a `category`.
    ///  - `p4` carries a `seat`.
    ///  - Slot 0 is a side format with a SPLIT allowance (the flow shows one
    ///    flat %) and stored team entries.
    ///  - Slot 1 carries a `formatConfig` with a non-string value the flow
    ///    cannot render at all.
    static let richFour = """
    {
      "courseId": "course-1",
      "playedAt": "\(playedAt)",
      "roundType": "full_18",
      "venueType": "indoor",
      "startList": {
        "groups": "organized",
        "seats": "claimable",
        "claimBy": "team",
        "maxGroupSize": 4
      },
      "playingGroups": [
        {"startTime": "2026-05-04T08:00:00.000Z", "startHole": 1, "members": ["p1", "p2"]},
        {"startTime": "2026-05-04T08:10:00.000Z", "startHole": 10, "members": ["p3", "p4"]}
      ],
      "teams": [
        {
          "id": "1", "label": "Team A", "kind": "multi_ball", "formation": "custom",
          "members": [
            {"producerDefId": "p1", "allowancePct": 100},
            {"producerDefId": "p2", "allowancePct": 100}
          ]
        },
        {
          "id": "2", "label": "Team B", "kind": "multi_ball", "formation": "custom",
          "members": [
            {"producerDefId": "p3", "allowancePct": 100},
            {"producerDefId": "p4", "allowancePct": 100}
          ]
        }
      ],
      "producers": [
        {
          "producerDefId": "p1", "gender": "M", "category": "senior",
          "teeId": "tee-y", "handicapIndex": 12,
          "playerRef": {"id": "player-1", "kind": "player"}
        },
        {
          "producerDefId": "p2", "gender": "M",
          "teeId": "tee-y", "handicapIndex": 18.4,
          "playerRef": {"id": "guest-2", "kind": "guest"}
        },
        {
          "producerDefId": "p3", "gender": "F",
          "teeId": "tee-r", "handicapIndex": 24,
          "playerRef": {"id": "guest-3", "kind": "guest"}
        },
        {
          "producerDefId": "p4", "gender": "M",
          "seat": {"teamRef": "2", "label": "Seat 4"},
          "teeId": "tee-w", "handicapIndex": 5,
          "playerRef": {"id": "guest-4", "kind": "guest"}
        }
      ],
      "formats": [
        {
          "id": "slot-0",
          "formatId": "stableford_better_ball",
          "allowanceConfig": {
            "type": "split",
            "bands": [{"pct": 90, "upToCh": 18}, {"pct": 80}]
          },
          "teams": [
            {"label": "Team A", "producerDefIds": ["p1", "p2"]},
            {"label": "Team B", "producerDefIds": ["p3", "p4"]}
          ],
          "subjects": [
            {"kind": "team", "teamId": "1"},
            {"kind": "team", "teamId": "2"}
          ]
        },
        {
          "id": "slot-1",
          "formatId": "stableford_individual",
          "allowanceConfig": {"type": "flat", "pct": 95},
          "formatConfig": {"points": "standard", "tiebreak": 3},
          "producerDefIds": ["p1", "p2", "p3", "p4"],
          "subjects": [
            {"kind": "player", "producerDefId": "p1"},
            {"kind": "player", "producerDefId": "p2"},
            {"kind": "player", "producerDefId": "p3"},
            {"kind": "player", "producerDefId": "p4"}
          ]
        }
      ]
    }
    """

    /// `GET /friendly-rounds/setup`, editable arm, wrapped around `richFour`.
    static func setup(
        hasScores: Bool = false,
        competitionRound: Bool = false,
        draft: String = richFour
    ) -> String {
        """
        {"editable":true,"status":"active","hasScores":\(hasScores),
         "competitionRound":\(competitionRound),
         "draft":\(draft),"draftVersion":3}
        """
    }

    /// `GET /friendly-rounds/balls` — the only place a producer's NAME lives.
    static let balls = """
    [\(ball("ball-1", ["p1": "Ada", "p2": "Bo"])),
     \(ball("ball-2", ["p3": "Cleo", "p4": "Dan"]))]
    """

    private static func ball(_ id: String, _ names: [String: String]) -> String {
        let players = names.keys.sorted().map { defId in
            """
            {"producerDefId":"\(defId)","playerId":null,"guestPlayerId":null,
             "displayName":"\(names[defId]!)","handicapIndex":null,"teeName":null,
             "courseHandicap":null,"pending":false}
            """
        }
        .joined(separator: ",")
        return """
        {"id":"\(id)","label":null,"courseHandicap":null,
         "players":[\(players)],"slots":[],"pending":false}
        """
    }

    /// Four producers on TWO SHARED BALLS — two scramble pairs, scored by one
    /// individual game whose subjects are the two balls and nobody else.
    ///
    /// The percentages are deliberately in an order the seeder would NOT
    /// produce: `p3` carries 35% on index 24 while `p4` carries 15% on index 5,
    /// so a load that re-seeded instead of treating a stored number as an
    /// override would swap them and change what the round scores. That is the
    /// whole claim of the round-trip test.
    static let scramblePairs = """
    {
      "courseId": "course-1",
      "playedAt": "\(playedAt)",
      "roundType": "full_18",
      "teams": [
        {
          "id": "1", "label": "Team A", "kind": "single_ball", "formation": "scramble",
          "members": [
            {"producerDefId": "p1", "allowancePct": 35},
            {"producerDefId": "p2", "allowancePct": 15}
          ]
        },
        {
          "id": "2", "label": "Team B", "kind": "single_ball", "formation": "scramble",
          "members": [
            {"producerDefId": "p3", "allowancePct": 35},
            {"producerDefId": "p4", "allowancePct": 15}
          ]
        }
      ],
      "producers": [
        {
          "producerDefId": "p1", "gender": "M", "teeId": "tee-y", "handicapIndex": 12,
          "playerRef": {"id": "guest-1", "kind": "guest"}
        },
        {
          "producerDefId": "p2", "gender": "M", "teeId": "tee-y", "handicapIndex": 18.4,
          "playerRef": {"id": "guest-2", "kind": "guest"}
        },
        {
          "producerDefId": "p3", "gender": "M", "teeId": "tee-y", "handicapIndex": 24,
          "playerRef": {"id": "guest-3", "kind": "guest"}
        },
        {
          "producerDefId": "p4", "gender": "M", "teeId": "tee-y", "handicapIndex": 5,
          "playerRef": {"id": "guest-4", "kind": "guest"}
        }
      ],
      "formats": [
        {
          "id": "slot-0",
          "formatId": "stableford_individual",
          "allowanceConfig": {"type": "flat", "pct": 100},
          "subjects": [
            {"kind": "team", "teamId": "1"},
            {"kind": "team", "teamId": "2"}
          ]
        }
      ]
    }
    """

    /// A stored shared ball that plays ONE of the round's two games.
    ///
    /// Slot 0 scores the pair; slot 1 is a game they sit out of entirely. That
    /// is a shape the web flexible editor can build and this flow cannot, which
    /// makes it exactly the shape an iOS edit has to leave alone: growing every
    /// shared ball into every slot would enter the pair in a game the round
    /// deliberately kept them out of.
    static let sharedBallSatOut = """
    {
      "courseId": "course-1",
      "playedAt": "\(playedAt)",
      "roundType": "full_18",
      "teams": [
        {
          "id": "1", "label": "Team A", "kind": "single_ball", "formation": "scramble",
          "members": [
            {"producerDefId": "p1", "allowancePct": 35},
            {"producerDefId": "p2", "allowancePct": 15}
          ]
        }
      ],
      "producers": [
        {
          "producerDefId": "p1", "gender": "M", "teeId": "tee-y", "handicapIndex": 12,
          "playerRef": {"id": "guest-1", "kind": "guest"}
        },
        {
          "producerDefId": "p2", "gender": "M", "teeId": "tee-y", "handicapIndex": 18.4,
          "playerRef": {"id": "guest-2", "kind": "guest"}
        },
        {
          "producerDefId": "p3", "gender": "M", "teeId": "tee-y", "handicapIndex": 24,
          "playerRef": {"id": "guest-3", "kind": "guest"}
        },
        {
          "producerDefId": "p4", "gender": "M", "teeId": "tee-y", "handicapIndex": 5,
          "playerRef": {"id": "guest-4", "kind": "guest"}
        }
      ],
      "formats": [
        {
          "id": "slot-0",
          "formatId": "stableford_individual",
          "allowanceConfig": {"type": "flat", "pct": 100},
          "subjects": [
            {"kind": "team", "teamId": "1"},
            {"kind": "player", "producerDefId": "p3"},
            {"kind": "player", "producerDefId": "p4"}
          ]
        },
        {
          "id": "slot-1",
          "formatId": "stroke_play_individual",
          "allowanceConfig": {"type": "flat", "pct": 100},
          "subjects": [
            {"kind": "player", "producerDefId": "p3"},
            {"kind": "player", "producerDefId": "p4"}
          ]
        }
      ]
    }
    """

    /// A shared ball this client can own, next to one it CANNOT.
    ///
    /// Team `2` is a `single_ball` team whose formation the catalog knows, so
    /// every field-by-field test of "is this ours?" says yes — but one of its
    /// members is another TEAM, which the Players step has no way to show. It
    /// must therefore pass through whole. The two sides deciding that
    /// independently is a silent delete, which is what this fixture exists to
    /// catch: hydration reports what it took, and the save path replaces only
    /// that.
    static let nestedBall = """
    {
      "courseId": "course-1",
      "playedAt": "\(playedAt)",
      "roundType": "full_18",
      "teams": [
        {
          "id": "1", "label": "Team A", "kind": "single_ball", "formation": "scramble",
          "members": [
            {"producerDefId": "p1", "allowancePct": 35},
            {"producerDefId": "p2", "allowancePct": 15}
          ]
        },
        {
          "id": "2", "label": "Team B", "kind": "single_ball", "formation": "scramble",
          "members": [
            {"producerDefId": "p3", "allowancePct": 100},
            {"teamId": "1"}
          ]
        }
      ],
      "producers": [
        {
          "producerDefId": "p1", "gender": "M", "teeId": "tee-y", "handicapIndex": 12,
          "playerRef": {"id": "guest-1", "kind": "guest"}
        },
        {
          "producerDefId": "p2", "gender": "M", "teeId": "tee-y", "handicapIndex": 18.4,
          "playerRef": {"id": "guest-2", "kind": "guest"}
        },
        {
          "producerDefId": "p3", "gender": "M", "teeId": "tee-y", "handicapIndex": 24,
          "playerRef": {"id": "guest-3", "kind": "guest"}
        },
        {
          "producerDefId": "p4", "gender": "M", "teeId": "tee-y", "handicapIndex": 5,
          "playerRef": {"id": "guest-4", "kind": "guest"}
        }
      ],
      "formats": [
        {
          "id": "slot-0",
          "formatId": "stableford_individual",
          "allowanceConfig": {"type": "flat", "pct": 100},
          "subjects": [
            {"kind": "team", "teamId": "1"},
            {"kind": "team", "teamId": "2"},
            {"kind": "player", "producerDefId": "p4"}
          ]
        }
      ]
    }
    """

    /// Four players, no teams, everyone for themselves — the ordinary stored
    /// round somebody opens in order to PAIR two of them.
    static let plainFour = """
    {
      "courseId": "course-1",
      "playedAt": "\(playedAt)",
      "roundType": "full_18",
      "producers": [
        {
          "producerDefId": "p1", "gender": "M", "teeId": "tee-y", "handicapIndex": 12,
          "playerRef": {"id": "guest-1", "kind": "guest"}
        },
        {
          "producerDefId": "p2", "gender": "M", "teeId": "tee-y", "handicapIndex": 18.4,
          "playerRef": {"id": "guest-2", "kind": "guest"}
        },
        {
          "producerDefId": "p3", "gender": "M", "teeId": "tee-y", "handicapIndex": 24,
          "playerRef": {"id": "guest-3", "kind": "guest"}
        },
        {
          "producerDefId": "p4", "gender": "M", "teeId": "tee-y", "handicapIndex": 5,
          "playerRef": {"id": "guest-4", "kind": "guest"}
        }
      ],
      "formats": [
        {
          "id": "slot-0",
          "formatId": "stableford_individual",
          "allowanceConfig": {"type": "flat", "pct": 100},
          "subjects": [
            {"kind": "player", "producerDefId": "p1"},
            {"kind": "player", "producerDefId": "p2"},
            {"kind": "player", "producerDefId": "p3"},
            {"kind": "player", "producerDefId": "p4"}
          ]
        }
      ]
    }
    """

    /// A draft with an unclaimed seat — the one client-side refusal (B3).
    static let withPlaceholderSeat = """
    {
      "courseId": "course-1",
      "playedAt": "\(playedAt)",
      "roundType": "full_18",
      "producers": [
        {
          "producerDefId": "p1", "gender": "M", "teeId": "tee-y", "handicapIndex": 12,
          "playerRef": {"id": "guest-1", "kind": "guest"}
        },
        {"producerDefId": "p2", "placeholder": {"label": "Open seat", "teamRef": null}}
      ],
      "formats": [
        {
          "formatId": "stableford_individual",
          "allowanceConfig": {"type": "flat", "pct": 100},
          "subjects": [{"kind": "player", "producerDefId": "p1"}]
        }
      ]
    }
    """

    static func decoded(_ json: String) throws -> CompetitionsCreateRoundOutputOkDraft {
        try JSONDecoder().decode(
            CompetitionsCreateRoundOutputOkDraft.self,
            from: Data(json.utf8))
    }
}

extension XCTestCase {
    /// The catalog plus everything an edit load and save touch: the stored
    /// draft (GET), the round's balls, and the replace (POST) — which shares
    /// the GET's path and so must be routed BY METHOD.
    func routeEditSetup(
        hasScores: Bool = false,
        competitionRound: Bool = false,
        draft: String = EditDraftFixtures.richFour,
        balls: String = EditDraftFixtures.balls
    ) {
        routeCatalog()
        RoundStubURLProtocol.route(
            "/friendly-rounds/setup",
            method: "GET",
            EditDraftFixtures.setup(
                hasScores: hasScores, competitionRound: competitionRound, draft: draft))
        RoundStubURLProtocol.route("/friendly-rounds/balls", balls)
    }

    /// The accepted arm of `POST /friendly-rounds/setup`.
    func routeEditSetupAccepts() {
        RoundStubURLProtocol.route("/friendly-rounds/setup", method: "POST", RoundFixtures.leaveOk())
    }

    /// The refusal arm — an HTTP 200 carrying diagnostics, not an error status.
    func routeEditSetupRefuses(_ diagnostics: String) {
        RoundStubURLProtocol.route(
            "/friendly-rounds/setup",
            method: "POST",
            "{\"ok\":false,\"diagnostics\":[\(diagnostics)]}")
    }

    /// The draft body the store POSTed to `editSetup`, decoded.
    func postedEditDraft() throws -> CompetitionsCreateRoundOutputOkDraft {
        let posts = RoundStubURLProtocol.requests(for: "/friendly-rounds/setup")
            .filter { $0.method == "POST" }
        let body = try XCTUnwrap(posts.last?.body, "no editSetup POST was made")
        return try JSONDecoder().decode(
            FriendlyRoundsEditSetupInput.self,
            from: body).draft
    }
}
