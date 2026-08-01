import XCTest
import SwiftUI
@testable import TapScore

/// Shared balls in the create flow: scramble, foursomes and greensomes built in
/// the Players step (`docs/proposals/ball-teams-composition.md`, Phase B).
///
/// The claim under test is not "a team exists" — it is that a shared ball
/// changes what the round IS. It changes the ball roster a format card is
/// judged against, it becomes a subject in its own right, and it takes its
/// members OUT of the individual subject list. That last one is the expensive
/// one: two scramble pairs playing stableford are two subjects, not two plus
/// four (`docs/format-templates.md` §4, the double-scoring trap), and a builder
/// that gets it wrong ships a leaderboard where every pair beats itself.
///
/// Everything runs through the real `CreateStore` over `RoundStubURLProtocol`,
/// so each assertion about "what we send" is an assertion about a request body.
@MainActor
final class CreateBallTeamsTests: XCTestCase {
    override func setUp() {
        super.setUp()
        RoundStubURLProtocol.reset()
        routeCatalog()
    }

    override func tearDown() {
        RoundStubURLProtocol.reset()
        super.tearDown()
    }

    // MARK: - The draft two pairs produce

    /// Four players as two scramble pairs, playing stableford AND match play.
    ///
    /// Both games are contested between the same two balls, and both say so the
    /// same way: two team subjects each, and not one of the four players
    /// appears as a subject of anything.
    func testTwoScramblePairsScoreAsTwoTeamsInBothGames() async throws {
        let store = await filled([("Anna", "5"), ("Bert", "12"), ("Cleo", "20"), ("Dan", "30")])
        // Added in the WRONG order on purpose: the seed sorts by playing
        // handicap, so Anna must come out first even though Bert went in first.
        try pair(store, "scramble", [1, 0])
        try pair(store, "scramble", [3, 2])
        store.toggleFormat("match_play_individual")
        XCTAssertEqual(
            store.formatSlots.map(\.formatId),
            ["stableford_individual", "match_play_individual"],
            "match play should be eligible: two balls is a contest")

        let draft = try await submitted(store)

        let teams = try XCTUnwrap(draft.teams)
        XCTAssertEqual(teams.map(\.id), ["1", "2"])
        XCTAssertEqual(teams.map(\.label), ["Team A", "Team B"])
        XCTAssertEqual(teams.map(\.kind), [.singleBall, .singleBall])
        XCTAssertEqual(teams.map(\.formation), ["scramble", "scramble"])
        XCTAssertEqual(members(teams[0]), [("p1", 35), ("p2", 15)].asMembers)
        XCTAssertEqual(members(teams[1]), [("p3", 35), ("p4", 15)].asMembers)

        XCTAssertEqual(subjectKeys(draft.formats[0]), ["team:1", "team:2"])
        XCTAssertEqual(subjectKeys(draft.formats[1]), ["team:1", "team:2"])
    }

    /// Five players, two pairs and a single — three balls. The player on their
    /// own ball is still an individual subject; the four sharing are not.
    func testASoloPlayerAlongsideTwoPairsIsTheThirdBall() async throws {
        let store = await filled([
            ("Anna", "5"), ("Bert", "12"), ("Cleo", "20"), ("Dan", "30"), ("Eve", "8"),
        ])
        try pair(store, "scramble", [0, 1])
        try pair(store, "scramble", [2, 3])

        XCTAssertEqual(store.ballUnits.count, 3)
        XCTAssertEqual(store.ballUnits.map(\.teamKey), [1, 2, nil])
        XCTAssertTrue(store.hasBallTeams)
        XCTAssertEqual(store.unpairedPlayers.map(\.name), ["Eve"])

        let draft = try await submitted(store)
        XCTAssertEqual(draft.teams?.count, 2)
        XCTAssertEqual(subjectKeys(draft.formats[0]), ["player:p5", "team:1", "team:2"])
    }

    /// A shared ball of ONE is not a ball. It would be dropped at build time and
    /// its player would quietly play alone, so pre-flight refuses it — with no
    /// network request at all (B9.7).
    func testAHalfBuiltTeamIsRefusedBeforeAnythingIsSent() async throws {
        let store = await filled([("Anna", "5"), ("Bert", "12")])
        let team = try XCTUnwrap(store.addBallTeam(formationId: "foursomes"))
        XCTAssertTrue(store.addBallTeamMember(rowId: store.players[0].id, to: team))

        routeSubmit()
        let token = await store.submit()

        XCTAssertNil(token)
        XCTAssertEqual(store.diagnostics.map(\.code), ["ball_team_too_small"])
        XCTAssertTrue(RoundStubURLProtocol.requests(for: "/guest-players").isEmpty)
        XCTAssertTrue(RoundStubURLProtocol.requests(for: "/friendly-rounds").isEmpty)
    }

    // MARK: - Seeding (proposal, "Seeding semantics")

    /// The three recipes, straight off the server's formation catalog: the
    /// numbers a scorecard is built from, in playing-handicap order.
    func testEachFormationSeedsItsOwnAllowances() async throws {
        let store = await filled([("Anna", "5"), ("Bert", "12"), ("Cleo", "20")])

        let team = try pair(store, "foursomes", [1, 0])
        XCTAssertEqual(pcts(store, 0), [50, 50])
        XCTAssertEqual(order(store, 0), ["Anna", "Bert"])

        XCTAssertTrue(store.setBallTeamFormation("greensomes", teamId: team))
        XCTAssertEqual(pcts(store, 0), [60, 40])

        // Three cannot be a greensome, so the formation change is refused and
        // the third member has to arrive under a formation that seats it.
        XCTAssertFalse(store.addBallTeamMember(rowId: store.players[2].id, to: team))
        XCTAssertTrue(store.setBallTeamFormation("scramble", teamId: team))
        XCTAssertEqual(pcts(store, 0), [35, 15], "scramble's pair recipe")
        XCTAssertTrue(store.addBallTeamMember(rowId: store.players[2].id, to: team))
        XCTAssertEqual(pcts(store, 0), [30, 20, 10], "re-seeded for the new size")
        XCTAssertEqual(order(store, 0), ["Anna", "Bert", "Cleo"])
    }

    /// A handicap edit re-seeds an untouched team, because the recipe is indexed
    /// by playing-handicap POSITION — Cleo overtaking Bert moves the numbers.
    func testAHandicapEditReseedsAnUntouchedTeam() async throws {
        let store = await filled([("Anna", "5"), ("Bert", "12"), ("Cleo", "20")])
        try pair(store, "scramble", [0, 1, 2])
        XCTAssertEqual(order(store, 0), ["Anna", "Bert", "Cleo"])

        store.updatePlayer(id: store.players[2].id) { $0.handicapText = "1" }
        XCTAssertEqual(order(store, 0), ["Cleo", "Anna", "Bert"])
        XCTAssertEqual(pcts(store, 0), [30, 20, 10])
    }

    /// One hand-typed percentage and the team is the user's from then on: no
    /// membership change, no handicap change, nothing re-seeds over it.
    func testAManualAllowanceIsStickyAgainstEveryLaterChange() async throws {
        let store = await filled([("Anna", "5"), ("Bert", "12"), ("Cleo", "20")])
        let team = try pair(store, "scramble", [0, 1])
        store.setBallTeamAllowanceText("90", rowId: store.players[0].id, teamId: team)
        XCTAssertEqual(pcts(store, 0), [90, 15])

        store.updatePlayer(id: store.players[1].id) { $0.handicapText = "1" }
        XCTAssertEqual(order(store, 0), ["Anna", "Bert"], "a customized team does not re-order")
        XCTAssertEqual(pcts(store, 0), [90, 15])

        // A new member still gets a number — a blank allowance is a gap, not an
        // override — but the two that exist are left exactly as typed.
        XCTAssertTrue(store.addBallTeamMember(rowId: store.players[2].id, to: team))
        XCTAssertEqual(pcts(store, 0), [90, 15, 10])
    }

    // MARK: - Bounds (enforced in the state, not in the view)

    /// A foursome takes no third player, and the refusal is a return value —
    /// the caller does not have to re-derive the rule to know it happened.
    func testAFoursomeRefusesAThirdPlayer() async throws {
        let store = await filled([("Anna", "5"), ("Bert", "12"), ("Cleo", "20")])
        let team = try pair(store, "foursomes", [0, 1])
        XCTAssertFalse(store.addBallTeamMember(rowId: store.players[2].id, to: team))
        XCTAssertEqual(store.ballTeams[0].memberRowIds.count, 2)
    }

    /// Scramble's ceiling is eight, and it is the CATALOG's eight — nothing here
    /// carries a local copy of the table.
    func testScrambleCapsAtEight() async throws {
        let names = ["Anna", "Bert", "Cleo", "Dan", "Eve", "Finn", "Gus", "Hal", "Ivy"]
        let store = await filled(names.map { ($0, "12") })
        let team = try XCTUnwrap(store.addBallTeam(formationId: "scramble"))
        for index in 0..<8 {
            XCTAssertTrue(
                store.addBallTeamMember(rowId: store.players[index].id, to: team),
                "member \(index + 1) should fit")
        }
        XCTAssertFalse(store.addBallTeamMember(rowId: store.players[8].id, to: team))
        XCTAssertEqual(store.ballTeams[0].memberRowIds.count, 8)
    }

    // MARK: - What the Players-step section drives (Phase C)

    /// Retapping a member chip takes that player off the ball, and they are
    /// immediately available to the next one — the section offers exactly
    /// `unpairedPlayers`, so a seat that did not come back would be a player the
    /// UI could never place again.
    func testTakingAPlayerOffABallHandsThemBack() async throws {
        let store = await filled([("Anna", "5"), ("Bert", "12"), ("Cleo", "20")])
        let team = try pair(store, "scramble", [0, 1])
        XCTAssertEqual(store.unpairedPlayers.map(\.name), ["Cleo"])

        store.removeBallTeamMember(rowId: store.players[1].id, from: team)
        XCTAssertEqual(store.unpairedPlayers.map(\.name), ["Bert", "Cleo"])
        XCTAssertFalse(store.ballTeams[0].isLive, "one member is not a ball")
        XCTAssertEqual(store.ballUnits.count, 3, "and the round is three own balls again")
    }

    /// The card's remove control. Both members come back, and nothing that
    /// belonged to the team outlives it.
    func testRemovingATeamReturnsItsMembersToTheirOwnBalls() async throws {
        let store = await filled([("Anna", "5"), ("Bert", "12"), ("Cleo", "20")])
        let team = try pair(store, "scramble", [0, 1])
        XCTAssertTrue(store.hasBallTeams)

        store.removeBallTeam(id: team)
        XCTAssertTrue(store.ballTeams.isEmpty)
        XCTAssertFalse(store.hasBallTeams)
        XCTAssertEqual(store.unpairedPlayers.map(\.name), ["Anna", "Bert", "Cleo"])
        XCTAssertEqual(store.ballUnits.count, 3)
    }

    /// The FIRST team opens on scramble — the shared ball people turn up
    /// wanting to play. Falling through to the catalog's first descriptor would
    /// open on Foursomes, which is only true of the alphabet.
    func testTheFirstTeamOpensOnScramble() async throws {
        let store = await filled([("Anna", "5"), ("Bert", "12")])
        let team = try XCTUnwrap(store.addBallTeam())
        XCTAssertEqual(store.ballTeams.first { $0.id == team }?.formationId, "scramble")
    }

    /// "Add team" passes no formation, and the new team opens on the one last
    /// chosen — which is what makes "everyone plays scramble" one tap per pair
    /// rather than a formation question per team.
    func testAddTeamOpensOnTheFormationLastChosen() async throws {
        let store = await filled([
            ("Anna", "5"), ("Bert", "12"), ("Cleo", "20"), ("Dan", "30"),
        ])
        try pair(store, "greensomes", [0, 1])
        let second = try XCTUnwrap(store.addBallTeam())
        XCTAssertEqual(store.ballTeams.last?.id, second)
        XCTAssertEqual(store.ballTeams.last?.formationId, "greensomes")

        // …and a formation CHANGE is a choice too, so it moves the default.
        XCTAssertTrue(store.setBallTeamFormation("scramble", teamId: second))
        XCTAssertEqual(store.addBallTeam().flatMap { id in
            store.ballTeams.first { $0.id == id }?.formationId
        }, "scramble")
    }

    /// The formation chips refuse rather than rearrange: three players cannot
    /// become a foursome, and dropping one of them to make it fit is not a
    /// decision a chip tap gets to take. The refusal is the return value the
    /// card turns into a sentence.
    func testAFormationChipIsRefusedWhenTheMembershipCannotFitIt() async throws {
        let store = await filled([("Anna", "5"), ("Bert", "12"), ("Cleo", "20")])
        let team = try pair(store, "scramble", [0, 1, 2])
        XCTAssertFalse(store.setBallTeamFormation("foursomes", teamId: team))
        XCTAssertEqual(store.ballTeams[0].formationId, "scramble")
        XCTAssertEqual(store.ballTeams[0].memberRowIds.count, 3, "nobody was dropped")

        // An EMPTY team takes any formation — that is the ordinary first tap on
        // a card the section just created.
        let fresh = try XCTUnwrap(store.addBallTeam())
        XCTAssertTrue(store.setBallTeamFormation("foursomes", teamId: fresh))
    }

    // MARK: - Eligibility over the ball roster

    /// A SIDE format is built from the players still on their own ball (v1: a
    /// shared ball's members are not available to it). Six players with one pair
    /// leaves Taliban exactly the four it needs; pairing two more starves it.
    func testASideFormatSeesOnlyTheUnpairedPlayers() async throws {
        let names = ["Anna", "Bert", "Cleo", "Dan", "Eve", "Finn"]
        let store = await filled(names.map { ($0, "12") })
        try pair(store, "scramble", [0, 1])

        XCTAssertEqual(store.ballUnits.count, 5)
        XCTAssertNil(
            store.eligibilityIssue(for: "taliban_better_ball"),
            "four players are still on their own ball")

        try pair(store, "scramble", [2, 3])
        XCTAssertEqual(
            store.eligibilityIssue(for: "taliban_better_ball"),
            "needs at least 4 players on their own balls — 4 are sharing balls")
    }

    /// The refusal has to say WHICH roster is short. Six names are on the
    /// screen and Taliban wants four of them, so "needs at least 4 players" is
    /// read as arithmetic that does not add up; naming the players it cannot
    /// reach turns the same refusal into something to act on.
    func testASideFormatRefusalCountsIndividualsOnceBallsAreShared() async throws {
        let names = ["Anna", "Bert", "Cleo", "Dan"]
        let store = await filled(names.map { ($0, "12") })
        XCTAssertNil(store.eligibilityIssue(for: "taliban_better_ball"), "four own balls")

        try pair(store, "scramble", [0, 1])
        XCTAssertEqual(
            store.eligibilityIssue(for: "taliban_better_ball"),
            "needs at least 4 players on their own balls — 2 are sharing balls")

        // A BALL format loses nobody to a shared ball, so it never gets the
        // variant — its refusal already counts the thing it is judged on.
        XCTAssertNil(store.eligibilityIssue(for: "match_play_individual"))
    }

    /// The other half of the same rule: a BALL format is judged on BALLS. Four
    /// players are four balls until two of them pair up, and match play's bound
    /// is satisfied either way — but Köpenhamnare's three-ball ceiling is not.
    func testABallFormatIsJudgedOnTheBallRoster() async throws {
        let names = ["Anna", "Bert", "Cleo", "Dan"]
        let store = await filled(names.map { ($0, "12") })
        XCTAssertNil(store.eligibilityIssue(for: "kopenhamnare_individual"))

        try pair(store, "scramble", [0, 1])
        XCTAssertEqual(store.ballUnits.count, 3)
        XCTAssertNil(store.eligibilityIssue(for: "kopenhamnare_individual"))
        XCTAssertNil(store.eligibilityIssue(for: "match_play_individual"))
    }

    /// Pairing players must never NARROW what the round can play.
    ///
    /// Five players and Split sixes (three balls, up to ten each) is legal: two
    /// sit the game out, exactly as a surplus player always has. Pairing two of
    /// them makes four balls — and refusing THAT would be a refusal with nothing
    /// to act on, since the roster it came from was already over the ceiling and
    /// perfectly fine. So the ceiling clamps the seed and the surplus ball sits
    /// out, on both sides of the pairing.
    func testPairingPlayersNeverNarrowsEligibility() async throws {
        let store = await filled([
            ("Anna", "5"), ("Bert", "12"), ("Cleo", "20"), ("Dan", "30"), ("Eve", "8"),
        ])
        XCTAssertNil(
            store.eligibilityIssue(for: "kopenhamnare_individual"),
            "five players already sit two of them out")

        try pair(store, "scramble", [0, 1])
        XCTAssertEqual(store.ballUnits.count, 4)
        XCTAssertNil(
            store.eligibilityIssue(for: "kopenhamnare_individual"),
            "four balls sit one out — the same arrangement, not a new problem")

        store.toggleFormat("kopenhamnare_individual")
        let game = try XCTUnwrap(store.games.first { $0.formatId == "kopenhamnare_individual" })
        XCTAssertEqual(game.ballCount, 3, "clamped to the format's own ceiling")
        XCTAssertEqual(
            Set(game.ballByPlayer.values), [0, 1, 2],
            "the fourth ball sits out rather than being seeded past the ceiling")
    }

    /// A size the formation SEATS but has no recipe for is refused, not
    /// defaulted.
    ///
    /// The fallback would be 100% per member — on a shared ball that is the sum
    /// of every member's full course handicap, the most dangerous number this
    /// flow could write, and it would write it silently. So a catalog that grew
    /// a size without growing its allowances stops the round instead.
    func testAnInBoundsSizeWithNoRecipeIsRefused() throws {
        let skewed = FormationCatalog(descriptors: [
            FormationDescriptor(
                id: "scramble",
                labels: FormationLabels(en: "Scramble"),
                size: FormationSize(min: 2, max: 4),
                allowancesBySize: ["2": [35, 15]]),
        ])
        let builder = CreateDraftBuilder(catalog: FormatCatalog(), formations: skewed)
        let diagnostics = builder.preflightBallTeams([
            .init(
                key: 1, kind: .singleBall, formation: "scramble",
                members: [0, 1, 2], pctByPlayer: [0: 100, 1: 100, 2: 100]),
        ])
        XCTAssertEqual(diagnostics.map(\.code), ["ball_team_no_recipe"])
        XCTAssertTrue(
            diagnostics[0].message.contains("3-player"),
            "the sentence names the size: \(diagnostics[0].message)")
    }

    /// One player cannot stand on two balls. The controls prevent it, but a
    /// STORED draft can hydrate a producer into two shared balls, so the
    /// pre-flight says it out loud rather than shipping a draft whose subjects
    /// score somebody twice.
    func testAPlayerOnTwoSharedBallsIsRefused() throws {
        let skewed = FormationCatalog(descriptors: [
            FormationDescriptor(
                id: "scramble",
                labels: FormationLabels(en: "Scramble"),
                size: FormationSize(min: 2, max: 4),
                allowancesBySize: ["2": [35, 15]]),
        ])
        let builder = CreateDraftBuilder(catalog: FormatCatalog(), formations: skewed)
        let diagnostics = builder.preflightBallTeams([
            .init(
                key: 1, kind: .singleBall, formation: "scramble",
                members: [0, 1], pctByPlayer: [0: 35, 1: 15]),
            .init(
                key: 2, kind: .singleBall, formation: "scramble",
                members: [1, 2], pctByPlayer: [1: 35, 2: 15]),
        ])
        XCTAssertEqual(diagnostics.map(\.code), ["ball_team_overlap"])
    }

    /// A row whose COURSE handicap cannot be derived sorts LAST.
    ///
    /// Anna is a woman on the white tee, which carries a men's rating only, so
    /// there is no course handicap for her — and her raw index (1) is the
    /// smallest number in the round. Ordering on that number alone would put her
    /// first and hand her scramble's 35% top slot on the strength of a figure
    /// nobody could compute. The lowest allowance is the conservative place for
    /// a row we cannot measure.
    func testARowWithNoDerivableCourseHandicapSortsLast() async throws {
        let store = await filled([("Anna", "1"), ("Bert", "12"), ("Cleo", "20")])
        store.updatePlayer(id: store.players[0].id) {
            $0.gender = .f
            $0.teeId = "tee-w"
        }
        XCTAssertNotNil(store.teeRatingIssue(for: store.players[0]))

        try pair(store, "scramble", [0, 1, 2])
        XCTAssertEqual(order(store, 0), ["Bert", "Cleo", "Anna"])
        XCTAssertEqual(pcts(store, 0), [30, 20, 10])
    }

    /// Equal handicaps keep ROSTER order, and keep it across an unrelated edit.
    ///
    /// The recipe is positional, so an unstable sort would move real percentages
    /// around every time anything in the Players step changed.
    func testEqualHandicapsHoldRosterOrder() async throws {
        let store = await filled([("Anna", "12"), ("Bert", "12"), ("Cleo", "12")])
        try pair(store, "scramble", [0, 1, 2])
        XCTAssertEqual(order(store, 0), ["Anna", "Bert", "Cleo"])
        XCTAssertEqual(pcts(store, 0), [30, 20, 10])

        store.updatePlayer(id: store.players[2].id) { $0.name = "Cleo B" }
        XCTAssertEqual(order(store, 0), ["Anna", "Bert", "Cleo B"], "a rename is not a re-order")
        XCTAssertEqual(pcts(store, 0), [30, 20, 10])
    }

    // MARK: - The allowance field (text in, number out)

    /// A cleared box stays cleared, and scores as the seeded number while it is
    /// empty. Deriving the text back from the model instead snapped the field to
    /// its old value on the next read, so the number could never be retyped —
    /// and writing the blank through would have played Anna off 0%, which is a
    /// legal allowance nothing downstream would have flagged.
    func testBlankingAnAllowanceLeavesItBlankAndStillScoresTheSeededNumber() async throws {
        let store = await filled([("Anna", "5"), ("Bert", "12")])
        let team = try pair(store, "scramble", [0, 1])
        let field = CreateRoundView.allowanceText(
            store, teamId: team, rowId: store.players[0].id)
        XCTAssertEqual(field.wrappedValue, "35", "the seeded number shows without being typed")

        field.wrappedValue = ""
        XCTAssertEqual(field.wrappedValue, "", "a cleared box must stay cleared")
        XCTAssertEqual(pcts(store, 0), [35, 15], "a blank is not 0% — it is the seeded number")

        field.wrappedValue = "6"
        field.wrappedValue = "60"
        XCTAssertEqual(field.wrappedValue, "60")
        XCTAssertEqual(pcts(store, 0), [60, 15], "the retyped number is the one that scores")

        // A comma is a decimal point to most of this app's users, and
        // `HandicapInput.parse` is the one place that is decided.
        field.wrappedValue = "5,5"
        XCTAssertEqual(pcts(store, 0), [5.5, 15])

        // Clamped where it is consumed, not under the caret: "1000" is a
        // half-typed number until the user stops typing.
        field.wrappedValue = "1000"
        XCTAssertEqual(field.wrappedValue, "1000")
        XCTAssertEqual(pcts(store, 0), [100, 15])
    }

    /// A stored 62.5 is somebody's scorecard. It has to survive an edit that
    /// was not about it — the field renders it, and rendering must not be a
    /// round trip through a digits-only parser that lands 62.
    func testAStoredFractionalAllowanceSurvivesAnUnrelatedEdit() async throws {
        let draft = EditDraftFixtures.scramblePairs.replacingOccurrences(
            of: "{\"producerDefId\": \"p1\", \"allowancePct\": 35}",
            with: "{\"producerDefId\": \"p1\", \"allowancePct\": 62.5}")
        XCTAssertNotEqual(draft, EditDraftFixtures.scramblePairs, "fixture shape changed")
        routeEditSetup(draft: draft)
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.loadForEdit(token: "tok")
        XCTAssertTrue(store.editHydrated)

        let team = try XCTUnwrap(store.ballTeams.first)
        let rowId = try XCTUnwrap(team.memberRowIds.first)
        let field = CreateRoundView.allowanceText(store, teamId: team.id, rowId: rowId)
        XCTAssertEqual(field.wrappedValue, "62.5")

        // The unrelated edit: another player's handicap (which re-seeds every
        // untouched team), and a second member's percentage typed on this card.
        store.updatePlayer(id: store.players[3].id) { $0.handicapText = "9" }
        let sibling = try XCTUnwrap(team.memberRowIds.last)
        CreateRoundView.allowanceText(store, teamId: team.id, rowId: sibling)
            .wrappedValue = "20"

        XCTAssertEqual(field.wrappedValue, "62.5", "the untouched number was rewritten")
        XCTAssertEqual(store.ballTeams[0].allowance(rowId), 62.5)

        routeEditSetupAccepts()
        let saved = await store.saveEdits()
        XCTAssertTrue(saved, "\(store.diagnostics) \(store.submitError ?? "")")
        let posted = try postedEditDraft()
        XCTAssertEqual(
            try XCTUnwrap(posted.teams?.first).members.compactMap { member -> Double? in
                guard case .producerDefId(let m) = member else { return nil }
                return m.allowancePct
            },
            [62.5, 20])
    }

    // MARK: - What the card says (`CreateRoundView`)

    /// The card letters a team by its position among the teams the DRAFT will
    /// carry, not by its position in the list on screen: an empty card is
    /// dropped before the draft, so counting it would print "Team B" over the
    /// ball the scorecard calls Team A.
    func testACardLettersATeamTheWayTheDraftWill() async throws {
        let store = await filled([("Anna", "5"), ("Bert", "12")])
        let empty = try XCTUnwrap(store.addBallTeam(formationId: "scramble"))
        let real = try pair(store, "scramble", [0, 1])

        let labels = CreateRoundView.ballTeamLabels(store)
        XCTAssertEqual(labels[empty], "New team", "an empty card claims no letter")
        XCTAssertEqual(labels[real], "Team A")

        let draft = try await submitted(store)
        XCTAssertEqual(draft.teams?.map(\.label), ["Team A"])
        XCTAssertEqual(labels[real], draft.teams?.first?.label, "the card and the draft disagree")
    }

    /// The sentence the whole section exists to produce, and the words around
    /// it. Pinned because this copy is the feature: it is what tells a group of
    /// four that they are now two balls, and what each of them brings to one.
    func testTheCardSaysWhatSharingABallDoes() async throws {
        let store = await filled([("Anna", "5"), ("Bert", "12")])
        XCTAssertEqual(CreateRoundView.ballTeamsPitchTitle, "Playing scramble or foursomes?")
        XCTAssertEqual(
            CreateRoundView.ballTeamsPitchBody,
            "Group players who share one ball. Skip this if everyone plays their own ball.")
        XCTAssertEqual(
            CreateRoundView.ballTeamsFootnote, "Anyone not on a team plays their own ball.")

        let team = try XCTUnwrap(store.addBallTeam(formationId: "scramble"))
        XCTAssertNil(
            CreateRoundView.ballTeamSummary(store, team: store.ballTeams[0]),
            "a team that is not a ball has no consequence to state")
        XCTAssertEqual(
            CreateRoundView.ballTeamHint(memberCount: 0),
            "Pick two players — a shared ball needs at least two.")
        XCTAssertEqual(
            CreateRoundView.ballTeamHint(memberCount: 1),
            "Pick one more player — a shared ball needs at least two.")

        XCTAssertTrue(store.addBallTeamMember(rowId: store.players[0].id, to: team))
        XCTAssertTrue(store.addBallTeamMember(rowId: store.players[1].id, to: team))
        XCTAssertEqual(
            CreateRoundView.ballTeamSummary(store, team: store.ballTeams[0]),
            "Anna + Bert · Scramble · plays one ball · HCP 4")
    }

    /// Both refusals, in the formation's own words. The size one says what it
    /// wants AND what it has; the full one deliberately does not — "plays 2,
    /// has 2" reads as a contradiction to whoever just tapped a third name.
    func testARefusedTapSaysWhichRuleRefusedIt() async throws {
        let store = await filled([("Anna", "5"), ("Bert", "12"), ("Cleo", "20")])
        let foursomes = try XCTUnwrap(store.formations.byId("foursomes"))
        let scramble = try XCTUnwrap(store.formations.byId("scramble"))

        XCTAssertEqual(
            CreateRoundView.ballTeamSizeRefusal(store, descriptor: foursomes, memberCount: 3),
            "Foursomes plays 2 — this ball has 3.")
        XCTAssertEqual(
            CreateRoundView.ballTeamSizeRefusal(store, descriptor: scramble, memberCount: 1),
            "Scramble plays 2–8 — this ball has 1.")
        XCTAssertEqual(
            CreateRoundView.ballTeamFullRefusal(store, descriptor: foursomes),
            "Foursomes plays 2 players — this ball is full.")
    }

    // MARK: - Helpers

    private func filled(_ roster: [(String, String)]) async -> CreateStore {
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()
        await store.selectCourse("course-1")
        for (index, entry) in roster.enumerated() {
            if index >= store.players.count { store.addPlayer() }
            store.updatePlayer(id: store.players[index].id) {
                $0.name = entry.0
                $0.handicapText = entry.1
            }
        }
        XCTAssertEqual(store.players.count, roster.count, "the roster cap refused a row")
        XCTAssertTrue(store.ballTeamsAvailable, "GET /setup/formations did not land")
        return store
    }

    @discardableResult
    private func pair(_ store: CreateStore, _ formation: String, _ rows: [Int]) throws -> UUID {
        let team = try XCTUnwrap(store.addBallTeam(formationId: formation))
        for row in rows {
            XCTAssertTrue(
                store.addBallTeamMember(rowId: store.players[row].id, to: team),
                "row \(row) refused by \(formation)")
        }
        return team
    }

    /// A team's percentages in MEMBER order — which is the seeded order, and so
    /// is itself part of what is being asserted.
    private func pcts(_ store: CreateStore, _ index: Int) -> [Double] {
        let team = store.ballTeams[index]
        return team.memberRowIds.map { team.allowance($0) ?? -1 }
    }

    private func order(_ store: CreateStore, _ index: Int) -> [String] {
        store.ballTeams[index].memberRowIds.map { store.player(id: $0)?.name ?? "?" }
    }

    private func routeSubmit() {
        RoundStubURLProtocol.route(
            "/guest-players",
            guestJSON("g-1"), guestJSON("g-2"), guestJSON("g-3"),
            guestJSON("g-4"), guestJSON("g-5"), guestJSON("g-6"),
            guestJSON("g-7"), guestJSON("g-8"), guestJSON("g-9"))
        RoundStubURLProtocol.route("/friendly-rounds", Self.createOkJSON)
    }

    /// The draft the store POSTed to `POST /friendly-rounds`, decoded.
    private func submitted(
        _ store: CreateStore
    ) async throws -> CompetitionsCreateRoundOutputOkDraft {
        routeSubmit()
        let token = await store.submit()
        XCTAssertEqual(
            token, "tok-1",
            "submit refused: \(store.diagnostics.map(\.message)) \(store.submitError ?? "")")
        let body = try XCTUnwrap(
            RoundStubURLProtocol.requests(for: "/friendly-rounds").last?.body,
            "no create POST was made")
        return try JSONDecoder().decode(FriendlyRoundsCreateInput.self, from: body).draft
    }

    private func members(
        _ team: CompetitionsCreateRoundOutputOkDraftTeamsItem
    ) -> [TeamMember] {
        team.members.compactMap { member in
            guard case .producerDefId(let m) = member else { return nil }
            return TeamMember(defId: m.producerDefId, pct: m.allowancePct ?? 100)
        }
    }

    private func subjectKeys(_ slot: CompetitionDetailDefaultConfigSlotsItem) -> [String] {
        (slot.subjects ?? []).map { subject in
            switch subject {
            case .player(let p): "player:\(p.producerDefId)"
            case .team(let t): "team:\(t.teamId)"
            }
        }
    }

    struct TeamMember: Equatable {
        var defId: String
        var pct: Double
    }

    private static let createOkJSON = """
    {"ok":true,
     "friendlyRound":{"id":"fr-1","roundId":"round-1","shareToken":"tok-1",
       "creatorPlayerId":null,"createdAt":"2026-01-02T09:00:00.000Z"},
     "round":{"id":"round-1","courseId":"course-1","date":"2026-01-02",
       "roundType":"full_18","venueType":"outdoor","startListMode":"open_window",
       "windowStart":null,"windowEnd":null,"selfOrganize":true,"status":"not_started",
       "latestEventId":null,"visibility":"friends",
       "courseNameSnapshot":"Test GK","completedAt":null,
       "formatSlots":[],"playHoles":[],
       "routeSi":{"mode":"official","sourceLabel":null,"sourceVersion":null,
         "allocationCycleSize":18},
       "routeHandicapPolicy":{"type":"official_route","postingEligible":true,
         "postingIneligibleReason":null},
       "routeSections":[],"playingGroups":[]}}
    """
}

private extension Array where Element == (String, Double) {
    var asMembers: [CreateBallTeamsTests.TeamMember] {
        map { CreateBallTeamsTests.TeamMember(defId: $0.0, pct: $0.1) }
    }
}

/// The stored round-trip: a draft carrying two shared balls loads into the
/// Players step and saves back out as the same document.
///
/// Separate from the suite above because it is the EDIT contract, not the
/// create one — and the fixture's percentages are in an order the seeder would
/// never produce, so a load that re-seeded instead of honouring the stored
/// numbers would fail here and nowhere else.
@MainActor
final class EditBallTeamsRoundTripTests: XCTestCase {
    override func setUp() {
        super.setUp()
        RoundStubURLProtocol.reset()
    }

    override func tearDown() {
        RoundStubURLProtocol.reset()
        super.tearDown()
    }

    func testAStoredPairSetSurvivesLoadAndSaveUntouched() async throws {
        routeEditSetup(draft: EditDraftFixtures.scramblePairs)
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.loadForEdit(token: "tok")
        XCTAssertTrue(store.editHydrated)

        // Hydrated as state, not as an opaque blob: the Players step can see
        // both balls, and every stored number came with them.
        XCTAssertEqual(store.ballTeams.count, 2)
        XCTAssertEqual(store.ballTeams.map(\.formationId), ["scramble", "scramble"])
        XCTAssertTrue(
            store.ballTeams.allSatisfy(\.customized),
            "a stored percentage is an override by the only definition that matters")
        XCTAssertEqual(
            store.ballTeams[1].memberRowIds.map { store.ballTeams[1].allowance($0) },
            [35, 15],
            "the seeder would have put Dan's 5 first — the stored order stands")
        XCTAssertTrue(store.unpairedPlayers.isEmpty)

        routeEditSetupAccepts()
        let saved = await store.saveEdits()
        XCTAssertTrue(saved, "unexpected refusal: \(store.diagnostics) \(store.submitError ?? "")")

        let loaded = try EditDraftFixtures.decoded(EditDraftFixtures.scramblePairs)
        let posted = try postedEditDraft()
        XCTAssertEqual(
            try JSONCanon.text(of: try JSONEncoder().encode(posted)),
            try JSONCanon.text(of: try JSONEncoder().encode(loaded)))
    }

    /// The double-scoring trap in the EDIT direction. A member of a stored
    /// shared ball is not "ticked out" of the slot that scores their ball — so
    /// they must not be hydrated as excluded, and must not be topped up as an
    /// individual subject on the way back out.
    func testABallMemberIsNeitherExcludedNorDoubleScored() async throws {
        routeEditSetup(draft: EditDraftFixtures.scramblePairs)
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.loadForEdit(token: "tok")
        XCTAssertTrue(store.formatSlots[0].excludedRowIds.isEmpty)

        routeEditSetupAccepts()
        let saved = await store.saveEdits()
        XCTAssertTrue(saved, "unexpected refusal: \(store.diagnostics) \(store.submitError ?? "")")

        let posted = try postedEditDraft()
        let kinds = (posted.formats[0].subjects ?? []).map { subject -> String in
            switch subject {
            case .player: "player"
            case .team: "team"
            }
        }
        XCTAssertEqual(kinds, ["team", "team"], "two subjects, not two plus four")
    }

    /// A stored team this flow cannot show survives a save that touches
    /// everything around it.
    ///
    /// Team B is a `single_ball` team on a formation the catalog knows — every
    /// field-by-field test says "ours" — but one of its members is another TEAM,
    /// which the Players step has no control for and so does not hydrate. The
    /// save path must replace exactly what hydration TOOK, or a round somebody
    /// opened to fix a handicap loses a team and everyone scored through it.
    func testATeamHydrationCouldNotTakeIsNeverReplaced() async throws {
        routeEditSetup(draft: EditDraftFixtures.nestedBall)
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.loadForEdit(token: "tok")
        XCTAssertTrue(store.editHydrated)
        XCTAssertEqual(
            store.ballTeams.map(\.sourceTeamId), ["1"],
            "the nested team is not something this step can show")

        routeEditSetupAccepts()
        let saved = await store.saveEdits()
        XCTAssertTrue(saved, "unexpected refusal: \(store.diagnostics) \(store.submitError ?? "")")

        let loaded = try EditDraftFixtures.decoded(EditDraftFixtures.nestedBall)
        XCTAssertEqual(
            try JSONCanon.text(of: try JSONEncoder().encode(try postedEditDraft())),
            try JSONCanon.text(of: try JSONEncoder().encode(loaded)),
            "a no-op save is the document it loaded")

        // And an edit ELSEWHERE leaves both teams and every subject alone.
        store.updatePlayer(id: store.players[3].id) { $0.handicapText = "9" }
        let savedAgain = await store.saveEdits()
        XCTAssertTrue(savedAgain, "unexpected refusal: \(store.diagnostics)")
        let posted = try postedEditDraft()
        XCTAssertEqual(
            try JSONCanon.text(of: try JSONEncoder().encode(try XCTUnwrap(posted.teams))),
            try JSONCanon.text(of: try JSONEncoder().encode(try XCTUnwrap(loaded.teams))))
        XCTAssertEqual(
            subjectKeys(posted.formats[0]), ["team:1", "team:2", "player:p4"],
            "no team dropped, and nobody topped up in its place")
    }

    /// A pairing made DURING an edit has to be scored by something.
    ///
    /// Minting the team and leaving the slot alone is the worst of both: the
    /// round stores a shared ball nothing plays, while its members carry on
    /// being scored individually — the arrangement the pairing was meant to
    /// replace.
    func testAPairBuiltDuringAnEditBecomesASubject() async throws {
        routeEditSetup(draft: EditDraftFixtures.plainFour)
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.loadForEdit(token: "tok")
        XCTAssertTrue(store.ballTeams.isEmpty)

        let team = try XCTUnwrap(store.addBallTeam(formationId: "scramble"))
        XCTAssertTrue(store.addBallTeamMember(rowId: store.players[0].id, to: team))
        XCTAssertTrue(store.addBallTeamMember(rowId: store.players[1].id, to: team))

        routeEditSetupAccepts()
        let saved = await store.saveEdits()
        XCTAssertTrue(saved, "unexpected refusal: \(store.diagnostics) \(store.submitError ?? "")")

        let posted = try postedEditDraft()
        let teams = try XCTUnwrap(posted.teams)
        XCTAssertEqual(teams.map(\.id), ["1"])
        XCTAssertEqual(teams.map(\.label), ["Team A"])
        XCTAssertEqual(teams.map(\.kind), [.singleBall])
        XCTAssertEqual(teams.map(\.formation), ["scramble"])
        XCTAssertEqual(memberPairs(teams[0]), ["p1@35", "p2@15"])

        XCTAssertEqual(
            subjectKeys(posted.formats[0]), ["player:p3", "player:p4", "team:1"],
            "the ball is scored, and its members are not scored again beside it")
    }

    /// A stored ball SAT OUT of a game stays sat out.
    ///
    /// The round already decided where its pair plays — slot 0 scores them,
    /// slot 1 does not — and an edit made to fix somebody's handicap is not a
    /// decision about that. Growing every shared ball into every slot would
    /// enter them in a game they were deliberately kept out of, which is the
    /// same class of silent rewrite as deleting a team: nothing in the UI says
    /// it happened.
    func testAStoredBallSatOutOfASlotIsNotGrownIntoIt() async throws {
        routeEditSetup(draft: EditDraftFixtures.sharedBallSatOut)
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.loadForEdit(token: "tok")
        XCTAssertEqual(store.ballTeams.count, 1)
        XCTAssertEqual(store.formatSlots.count, 2)

        routeEditSetupAccepts()
        let saved = await store.saveEdits()
        XCTAssertTrue(saved, "unexpected refusal: \(store.diagnostics) \(store.submitError ?? "")")

        let loaded = try EditDraftFixtures.decoded(EditDraftFixtures.sharedBallSatOut)
        XCTAssertEqual(
            try JSONCanon.text(of: try JSONEncoder().encode(try postedEditDraft())),
            try JSONCanon.text(of: try JSONEncoder().encode(loaded)),
            "a no-op save is the document it loaded")

        // The edit somebody actually opened the round for.
        store.updatePlayer(id: store.players[2].id) { $0.handicapText = "21" }
        let savedAgain = await store.saveEdits()
        XCTAssertTrue(savedAgain, "unexpected refusal: \(store.diagnostics)")

        let posted = try postedEditDraft()
        XCTAssertEqual(
            subjectKeys(posted.formats[0]), ["team:1", "player:p3", "player:p4"],
            "the game the pair plays is unchanged")
        XCTAssertEqual(
            subjectKeys(posted.formats[1]), ["player:p3", "player:p4"],
            "and the game they sat out is still a game they sat out")
        XCTAssertEqual(
            try JSONCanon.text(of: try JSONEncoder().encode(try XCTUnwrap(posted.teams))),
            try JSONCanon.text(of: try JSONEncoder().encode(try XCTUnwrap(loaded.teams))))
    }

    /// The formation catalog failing to load must not DELETE a stored pairing.
    ///
    /// Nothing could be hydrated, so the Players step has nothing to say about
    /// the round's teams — and "nothing to say" is not "the user removed them".
    /// The stored document carries through whole.
    func testAFailedFormationFetchCarriesStoredTeamsThrough() async throws {
        routeEditSetup(draft: EditDraftFixtures.scramblePairs)
        RoundStubURLProtocol.route("/setup/formations", status: 500, "{}")
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.loadForEdit(token: "tok")
        XCTAssertTrue(store.editHydrated)
        XCTAssertFalse(store.ballTeamsAvailable, "the section cannot be offered at all")
        XCTAssertTrue(store.ballTeams.isEmpty)

        routeEditSetupAccepts()
        let saved = await store.saveEdits()
        XCTAssertTrue(saved, "unexpected refusal: \(store.diagnostics) \(store.submitError ?? "")")

        let loaded = try EditDraftFixtures.decoded(EditDraftFixtures.scramblePairs)
        XCTAssertEqual(
            try JSONCanon.text(of: try JSONEncoder().encode(try postedEditDraft())),
            try JSONCanon.text(of: try JSONEncoder().encode(loaded)))
    }

    // MARK: - Helpers

    /// A team's members as `defId@pct`, in member order — which IS the seeded
    /// order, so the spelling carries both facts in one assertion.
    private func memberPairs(
        _ team: CompetitionsCreateRoundOutputOkDraftTeamsItem
    ) -> [String] {
        team.members.compactMap { member in
            guard case .producerDefId(let m) = member else { return nil }
            let pct = m.allowancePct ?? 100
            return "\(m.producerDefId)@\(pct == pct.rounded() ? String(Int(pct)) : String(pct))"
        }
    }

    private func subjectKeys(_ slot: CompetitionDetailDefaultConfigSlotsItem) -> [String] {
        (slot.subjects ?? []).map { subject in
            switch subject {
            case .player(let p): "player:\(p.producerDefId)"
            case .team(let t): "team:\(t.teamId)"
            }
        }
    }
}
