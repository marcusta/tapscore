import XCTest
@testable import TapScore

/// The merge rules `EditRoundStoreTests` exercises through the store, pinned
/// one at a time — the cases a stored draft can contain but a stub round cannot
/// easily be driven into (a nested team, a group emptied outright, a slot whose
/// format was swapped).
@MainActor
final class EditDraftAssemblerTests: XCTestCase {
    private var catalog: FormatCatalog!

    override func setUp() async throws {
        try await super.setUp()
        catalog = FormatCatalog(descriptors: try JSONDecoder().decode(
            [FormatDescriptor].self,
            from: Data(WebDraftFixtures.catalogJSON.utf8)))
    }

    override func tearDown() {
        catalog = nil
        super.tearDown()
    }

    // MARK: - Groups

    func testGroupLeftWithNoMembersIsDroppedEntirely() {
        let groups = [
            group(["p1", "p2"]),
            group(["p3"]),
        ]
        let pruned = EditDraftAssembler.prunedGroups(groups, liveIds: ["p1", "p2"])
        XCTAssertEqual(pruned?.map(\.members), [["p1", "p2"]])
    }

    func testEveryGroupEmptiedMeansNoGroupsKeyAtAll() {
        let pruned = EditDraftAssembler.prunedGroups([group(["p1"])], liveIds: ["p9"])
        XCTAssertNil(pruned)
    }

    // MARK: - Teams

    /// A team may hold another team, so dropping an underfilled side can empty
    /// its container — which is why the prune runs to a fixpoint and not once.
    func testDroppingATeamCascadesToTheTeamThatHeldIt() {
        let teams = [
            team("1", members: [.producerDefId(.init(producerDefId: "p1", allowancePct: 100)),
                                .producerDefId(.init(producerDefId: "p2", allowancePct: 100))]),
            team("2", members: [.producerDefId(.init(producerDefId: "p3", allowancePct: 100)),
                                .producerDefId(.init(producerDefId: "p4", allowancePct: 100))]),
            team("3", members: [.teamId(.init(teamId: "1")), .teamId(.init(teamId: "2"))]),
        ]
        // p3 and p4 leave: team 2 falls below a pair, which leaves team 3
        // holding one member, which is not a pairing either.
        let pruned = EditDraftAssembler.prunedTeams(teams, liveIds: ["p1", "p2"])
        XCTAssertEqual(pruned?.map(\.id), ["1"])
    }

    // MARK: - Allowance and config

    /// A split band is what the round is actually scored under; the flow can
    /// only show its first band. Carrying it while the field still reads that
    /// band is what keeps opening the wizard from flattening the round.
    func testUntouchedSplitAllowanceIsCarriedNotFlattened() {
        let split = CompetitionDetailDefaultConfigSlotsItemAllowanceConfig.split(
            .init(bands: [.init(pct: 90, upToCh: 18), .init(pct: 80)]))
        XCTAssertEqual(EditDraftAssembler.allowanceText(split), "90")
        XCTAssertEqual(EditDraftAssembler.allowance(split, text: "90"), split)
        XCTAssertEqual(
            EditDraftAssembler.allowance(split, text: "75"),
            .flat(.init(pct: 75)))
    }

    /// A knob this flow cannot render is not a knob it may delete.
    func testNonStringConfigSurvivesWhileTheStringKnobsAgree() {
        let source = JSONValue.object([
            "points": .string("standard"),
            "tiebreak": .number(3),
        ])
        XCTAssertEqual(EditDraftAssembler.stringConfig(source), ["points": "standard"])
        XCTAssertEqual(
            EditDraftAssembler.formatConfig(source, config: ["points": "standard"]),
            source)

        // ...and it is not a knob deleted by the one beside it either. Editing
        // the select the flow CAN render is a merge onto the stored object, not
        // a rebuild from the strings the form happens to hold.
        XCTAssertEqual(
            EditDraftAssembler.formatConfig(source, config: ["points": "double"]),
            .object(["points": .string("double"), "tiebreak": .number(3)]))

        // A string key the form dropped IS dropped — the flow said something
        // about that key, so its silence is an edit.
        XCTAssertEqual(
            EditDraftAssembler.formatConfig(source, config: [:]),
            .object(["tiebreak": .number(3)]))

        // A key the flow added lands beside what it cannot see.
        XCTAssertEqual(
            EditDraftAssembler.formatConfig(source, config: ["points": "standard", "mode": "net"]),
            .object([
                "points": .string("standard"),
                "mode": .string("net"),
                "tiebreak": .number(3),
            ]))
    }

    // MARK: - Route inversion

    func testRouteInversionReadsPresetAndStartHole() throws {
        let bare = try EditDraftFixtures.decoded(EditDraftFixtures.richFour)
        XCTAssertEqual(EditDraftAssembler.route(from: bare).preset, .full18)
        XCTAssertEqual(EditDraftAssembler.route(from: bare).startHole, 1)

        // A rotated round is encoded as custom holes; the start is the first
        // played hole and the preset falls out of the hole set's span.
        let rotated = try EditDraftFixtures.decoded(rotatedBackNine)
        XCTAssertEqual(EditDraftAssembler.route(from: rotated).preset, .back9)
        XCTAssertEqual(EditDraftAssembler.route(from: rotated).startHole, 14)
    }

    // MARK: - Slots

    /// Changing a slot's format keeps NOTHING: its knobs belonged to a strategy
    /// that is no longer playing, and its subjects were shaped by that
    /// strategy's rules.
    func testChangingASlotsFormatRebuildsItFromTheRoster() throws {
        let loaded = try EditDraftFixtures.decoded(EditDraftFixtures.richFour)
        let assembled = EditDraftAssembler(catalog: catalog).draft(
            replacing: loaded,
            courseId: loaded.courseId,
            route: .init(preset: .full18, holes: Array(1...18), startHole: 1),
            producers: producers(["p1", "p2", "p3", "p4"]),
            slots: [
                .init(sourceIndex: 0, formatId: "stableford_individual", allowanceText: "100"),
                .init(sourceIndex: 1, formatId: "stableford_individual", allowanceText: "95",
                      config: ["points": "standard"]),
            ])

        let changed = assembled.formats[0]
        XCTAssertNil(changed.id, "a rebuilt slot is not the stored slot")
        XCTAssertNil(changed.teams)
        XCTAssertEqual(changed.allowanceConfig, .flat(.init(pct: 100)))
        XCTAssertEqual(
            (changed.subjects ?? []).count, 4,
            "an individual format scores the roster, not the sides the old one used")

        // The untouched slot beside it is still carried whole.
        XCTAssertEqual(assembled.formats[1].id, "slot-1")
        XCTAssertEqual(assembled.formats[1].formatConfig, loaded.formats[1].formatConfig)
    }

    /// A side format added to a round that has no sides yet MINTS them, the way
    /// create seeds a freshly picked game. Emitting the empty subject list this
    /// used to is a save the flow refuses for the rest of the session, under a
    /// sentence about adding players the roster does not need.
    func testSideFormatAddedToATeamlessRoundMintsItsSides() throws {
        let loaded = try EditDraftFixtures.decoded(teamlessFour)
        let assembled = EditDraftAssembler(catalog: catalog).draft(
            replacing: loaded,
            courseId: loaded.courseId,
            route: .init(preset: .full18, holes: Array(1...18), startHole: 1),
            producers: producers(["p1", "p2", "p3", "p4"]),
            slots: [
                .init(sourceIndex: 0, formatId: "stableford_individual", allowanceText: "100"),
                .init(sourceIndex: nil, formatId: "taliban_better_ball", allowanceText: "100"),
            ])

        XCTAssertEqual(assembled.teams?.map(\.id), ["1", "2"])
        XCTAssertEqual(assembled.teams?.map(\.label), ["Team A", "Team B"])
        XCTAssertEqual(assembled.teams?.map(\.kind), [.multiBall, .multiBall])
        XCTAssertEqual(
            assembled.teams?.map { team in
                team.members.map { member in
                    if case .producerDefId(let m) = member { m.producerDefId } else { "team" }
                }
            },
            [["p1", "p2"], ["p3", "p4"]])
        XCTAssertEqual(subjectKeys(assembled.formats[1]), ["team:1", "team:2"])
        // The local pre-check `CreateStore.saveEdits` runs before it POSTs.
        XCTAssertTrue(
            assembled.formats.allSatisfy { !($0.subjects ?? []).isEmpty },
            "an empty subject list is refused locally, forever")
    }

    /// A round that already has sides ADOPTS them instead of minting a second,
    /// parallel pairing — create's "set your pairs up once", in edit mode.
    func testSideFormatAddedToARoundWithSidesAdoptsThem() throws {
        let loaded = try EditDraftFixtures.decoded(EditDraftFixtures.richFour)
        let assembled = EditDraftAssembler(catalog: catalog).draft(
            replacing: loaded,
            courseId: loaded.courseId,
            route: .init(preset: .full18, holes: Array(1...18), startHole: 1),
            producers: producers(["p1", "p2", "p3", "p4"]),
            slots: [
                .init(sourceIndex: 0, formatId: "stableford_better_ball", allowanceText: "90"),
                .init(sourceIndex: 1, formatId: "stableford_individual", allowanceText: "95",
                      config: ["points": "standard"]),
                .init(sourceIndex: nil, formatId: "taliban_better_ball", allowanceText: "100"),
            ])

        XCTAssertEqual(assembled.teams?.map(\.id), ["1", "2"], "no second pairing was invented")
        XCTAssertEqual(subjectKeys(assembled.formats[2]), ["team:1", "team:2"])
        XCTAssertTrue(assembled.formats.allSatisfy { !($0.subjects ?? []).isEmpty })
    }

    // MARK: - Fixtures

    private let rotatedBackNine = """
    {
      "courseId": "course-1", "playedAt": "2026-05-04", "roundType": "custom_holes",
      "route": {"playHoles": [
        {"courseHoleNumber": 14}, {"courseHoleNumber": 15}, {"courseHoleNumber": 16},
        {"courseHoleNumber": 17}, {"courseHoleNumber": 18}, {"courseHoleNumber": 10},
        {"courseHoleNumber": 11}, {"courseHoleNumber": 12}, {"courseHoleNumber": 13}
      ]},
      "producers": [
        {"producerDefId": "p1", "gender": "M", "teeId": "tee-y", "handicapIndex": 12,
         "playerRef": {"id": "guest-1", "kind": "guest"}}
      ],
      "formats": [
        {"formatId": "stableford_individual", "allowanceConfig": {"type": "flat", "pct": 100},
         "subjects": [{"kind": "player", "producerDefId": "p1"}]}
      ]
    }
    """

    /// Four players, one individual slot, no teams at all — the round a side
    /// format added mid-edit has nothing to adopt from.
    private let teamlessFour = """
    {
      "courseId": "course-1", "playedAt": "2026-05-04", "roundType": "full_18",
      "producers": [
        {"producerDefId": "p1", "gender": "M", "teeId": "tee-y", "handicapIndex": 12,
         "playerRef": {"id": "guest-1", "kind": "guest"}},
        {"producerDefId": "p2", "gender": "M", "teeId": "tee-y", "handicapIndex": 18,
         "playerRef": {"id": "guest-2", "kind": "guest"}},
        {"producerDefId": "p3", "gender": "F", "teeId": "tee-r", "handicapIndex": 24,
         "playerRef": {"id": "guest-3", "kind": "guest"}},
        {"producerDefId": "p4", "gender": "M", "teeId": "tee-w", "handicapIndex": 5,
         "playerRef": {"id": "guest-4", "kind": "guest"}}
      ],
      "formats": [
        {"id": "slot-0", "formatId": "stableford_individual",
         "allowanceConfig": {"type": "flat", "pct": 100},
         "subjects": [
           {"kind": "player", "producerDefId": "p1"},
           {"kind": "player", "producerDefId": "p2"},
           {"kind": "player", "producerDefId": "p3"},
           {"kind": "player", "producerDefId": "p4"}
         ]}
      ]
    }
    """

    private func subjectKeys(_ slot: CompetitionDetailDefaultConfigSlotsItem) -> [String] {
        (slot.subjects ?? []).map { subject in
            switch subject {
            case .player(let p): "player:\(p.producerDefId)"
            case .team(let t): "team:\(t.teamId)"
            }
        }
    }

    private func group(_ members: [String]) -> CompetitionsCreateRoundOutputOkDraftPlayingGroupsItem {
        .init(startTime: nil, startHole: 1, members: members)
    }

    private func team(
        _ id: String,
        members: [CompetitionsCreateRoundOutputOkDraftTeamsItemMembersItem]
    ) -> CompetitionsCreateRoundOutputOkDraftTeamsItem {
        .init(label: "Team \(id)", kind: .multiBall, formation: "custom", id: id, members: members)
    }

    private func producers(_ ids: [String]) -> [EditDraftAssembler.Producer] {
        ids.map {
            .init(producerDefId: $0, handicapIndex: 12, teeId: "tee-y", gender: .m,
                  ref: .guest("guest-\($0)"))
        }
    }
}
