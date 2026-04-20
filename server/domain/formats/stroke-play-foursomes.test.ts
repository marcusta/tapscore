import { test, expect } from 'bun:test';
import {
    findFormat,
    type CourseHole,
    type ParticipantInput,
    type SlotInput,
} from '../format';
import type { FormatSlot } from '../../services/round.service';
import type { ScorecardHole } from '../../services/scorecard.service';

function par4Course(n: number): CourseHole[] {
    return Array.from({ length: n }, (_, i) => ({
        holeNumber: i + 1,
        par: 4,
        strokeIndex: i + 1,
    }));
}

// Mixed par course, 18 holes, par 72 (two par-5s, two par-3s, rest par-4s).
function par72Course(): CourseHole[] {
    const pars = [4, 4, 3, 5, 3, 5, 4, 4, 4, 5, 3, 4, 4, 5, 4, 3, 4, 4];
    const sis = [10, 6, 16, 8, 18, 2, 14, 12, 4, 3, 15, 11, 7, 1, 13, 17, 5, 9];
    return pars.map((par, i) => ({
        holeNumber: i + 1,
        par,
        strokeIndex: sis[i],
    }));
}

function slot(): FormatSlot {
    return {
        slotIndex: 0,
        scoringMode: 'stroke_play',
        teamShape: 'foursomes',
        allowancePct: 50,
        scopeConfig: null,
    };
}

function singleSlot(p: ParticipantInput, courseHoles: CourseHole[]): SlotInput {
    return { participants: [p], courseHoles };
}

const ALICE = 'alice-id';
const BOB = 'bob-id';

function hole(holeNumber: number, strokes: number | null): ScorecardHole {
    return {
        holeNumber,
        strokes,
        recordedBy: null,
        recordedAt: '',
        sourcePlayerId: null,
        sourceGuestPlayerId: null,
    };
}

function teamParticipant(opts: {
    participantId?: string;
    teamPh: number | null;
    holes: ScorecardHole[];
}): ParticipantInput {
    return {
        participantId: opts.participantId ?? 'team1',
        playingHandicap: opts.teamPh,
        holes: opts.holes,
        players: [
            { playerId: ALICE, guestPlayerId: null, playingHandicap: null },
            { playerId: BOB, guestPlayerId: null, playingHandicap: null },
        ],
    };
}

test('foursomes: par on every hole of an 18-hole (par 72) round → gross = 72, net = 72 − PH', () => {
    const s = findFormat('stroke_play', 'foursomes');
    const holes = par72Course();
    const scored: ScorecardHole[] = holes.map((h) => hole(h.holeNumber, h.par));
    const team = teamParticipant({ teamPh: 10, holes: scored });
    const r = s.compute(singleSlot(team, holes), slot()).participantResults[0];
    const gross = r.totals.find((t) => t.scoringType === 'gross')!.value;
    const net = r.totals.find((t) => t.scoringType === 'net')!.value;
    expect(gross).toBe(72);
    expect(net).toBe(62); // 72 − 10
    expect(r.holesPlayed).toBe(18);
});

test('foursomes: team PH 14 on a 72-par course → net total reflects 14-stroke deduction', () => {
    const s = findFormat('stroke_play', 'foursomes');
    const holes = par72Course();
    // Team shoots par every hole → gross 72, net = 72 − 14 = 58.
    const scored: ScorecardHole[] = holes.map((h) => hole(h.holeNumber, h.par));
    const team = teamParticipant({ teamPh: 14, holes: scored });
    const r = s.compute(singleSlot(team, holes), slot()).participantResults[0];
    expect(r.totals.find((t) => t.scoringType === 'gross')!.value).toBe(72);
    expect(r.totals.find((t) => t.scoringType === 'net')!.value).toBe(58);
});

test('foursomes: validation — != 2 player links throws', () => {
    const s = findFormat('stroke_play', 'foursomes');
    const holes = par4Course(1);

    const tooFew: ParticipantInput = {
        participantId: 'team1',
        playingHandicap: 0,
        holes: [],
        players: [{ playerId: ALICE, guestPlayerId: null, playingHandicap: null }],
    };
    expect(() => s.compute(singleSlot(tooFew, holes), slot())).toThrow(/exactly 2 player links/);

    const tooMany: ParticipantInput = {
        participantId: 'team1',
        playingHandicap: 0,
        holes: [],
        players: [
            { playerId: ALICE, guestPlayerId: null, playingHandicap: null },
            { playerId: BOB, guestPlayerId: null, playingHandicap: null },
            { playerId: 'carol', guestPlayerId: null, playingHandicap: null },
        ],
    };
    expect(() => s.compute(singleSlot(tooMany, holes), slot())).toThrow(/exactly 2 player links/);

    const missingPlayers: ParticipantInput = {
        participantId: 'team1',
        playingHandicap: 0,
        holes: [],
        // players omitted entirely — falls back to []
    };
    expect(() => s.compute(singleSlot(missingPlayers, holes), slot())).toThrow(/exactly 2 player links/);
});

test('foursomes: DNP on a hole voids gross and net totals, same as individual', () => {
    const s = findFormat('stroke_play', 'foursomes');
    const holes = par4Course(18);
    const scored: ScorecardHole[] = [
        ...Array.from({ length: 17 }, (_, i) => hole(i + 1, 4)),
        hole(18, null), // DNP
    ];
    const team = teamParticipant({ teamPh: 0, holes: scored });
    const r = s.compute(singleSlot(team, holes), slot()).participantResults[0];
    // Per-hole DNP value is null; team's card not complete → totals null.
    expect(r.holes.find((h) => h.holeNumber === 18)!.gross).toBeNull();
    expect(r.totals.find((t) => t.scoringType === 'gross')!.value).toBeNull();
    expect(r.totals.find((t) => t.scoringType === 'net')!.value).toBeNull();
    // All 18 holes have an event (the DNP is an event), so holesPlayed is 18.
    expect(r.holesPlayed).toBe(18);
});

test('foursomes: pickup resolves to par + 2 + strokes given (WHS net-double)', () => {
    const s = findFormat('stroke_play', 'foursomes');
    const holes = par4Course(18);
    // Team PH 18 → 1 stroke on every hole (baseline).
    const scored: ScorecardHole[] = [hole(1, 0)]; // pickup on hole 1 (par 4, +1 stroke)
    const team = teamParticipant({ teamPh: 18, holes: scored });
    const r = s.compute(singleSlot(team, holes), slot()).participantResults[0];
    const h1 = r.holes.find((h) => h.holeNumber === 1)!;
    // Par 4 + 2 + 1 stroke given = 7 gross; net = 6.
    expect(h1.gross).toBe(7);
    expect(h1.net).toBe(6);
    // Pickup still voids the totals (same WHS rule as individual stroke-play).
    expect(r.totals.find((t) => t.scoringType === 'gross')!.value).toBeNull();
    expect(r.totals.find((t) => t.scoringType === 'net')!.value).toBeNull();
});

test('foursomes ≡ individual on identical inputs (proves the shared helper)', () => {
    // Same participant data, same course, same PH → stroke-play-individual
    // and stroke-play-foursomes should produce byte-identical per-hole
    // results (foursomes additionally requires 2 player links but the
    // per-hole scoring is exactly the same).
    const holes = par72Course();
    const scored: ScorecardHole[] = [
        hole(1, 4), hole(2, 5), hole(3, 3), hole(4, 6), hole(5, 3),
        hole(6, 5), hole(7, 4), hole(8, 4), hole(9, 4),
        hole(10, 6), hole(11, 3), hole(12, 4), hole(13, 4),
        hole(14, 5), hole(15, 4), hole(16, 3), hole(17, 4), hole(18, 4),
    ];

    const individualStrategy = findFormat('stroke_play', 'individual');
    const indSlot: FormatSlot = {
        slotIndex: 0,
        scoringMode: 'stroke_play',
        teamShape: 'individual',
        allowancePct: 100,
        scopeConfig: null,
    };
    const indInput: ParticipantInput = {
        participantId: 'p1',
        playingHandicap: 10,
        holes: scored,
    };
    const indR = individualStrategy.compute(singleSlot(indInput, holes), indSlot)
        .participantResults[0];

    const foursomesStrategy = findFormat('stroke_play', 'foursomes');
    const team = teamParticipant({ participantId: 'p1', teamPh: 10, holes: scored });
    const fouR = foursomesStrategy.compute(singleSlot(team, holes), slot()).participantResults[0];

    // Totals match exactly.
    expect(fouR.totals.find((t) => t.scoringType === 'gross')!.value).toBe(
        indR.totals.find((t) => t.scoringType === 'gross')!.value,
    );
    expect(fouR.totals.find((t) => t.scoringType === 'net')!.value).toBe(
        indR.totals.find((t) => t.scoringType === 'net')!.value,
    );
    // Per-hole results match on gross and net.
    for (const ch of holes) {
        const ih = indR.holes.find((h) => h.holeNumber === ch.holeNumber)!;
        const fh = fouR.holes.find((h) => h.holeNumber === ch.holeNumber)!;
        expect(fh.gross).toBe(ih.gross);
        expect(fh.net).toBe(ih.net);
    }
});

test('foursomes: a clean 18-hole card produces non-null totals and one result per participant in the slot', () => {
    const s = findFormat('stroke_play', 'foursomes');
    const holes = par72Course();
    const t1Scored: ScorecardHole[] = holes.map((h) => hole(h.holeNumber, h.par + 1));
    const t2Scored: ScorecardHole[] = holes.map((h) => hole(h.holeNumber, h.par));

    const t1 = teamParticipant({ participantId: 'team1', teamPh: 10, holes: t1Scored });
    const t2 = teamParticipant({ participantId: 'team2', teamPh: 8, holes: t2Scored });

    const out = s.compute({ participants: [t1, t2], courseHoles: holes }, slot());
    expect(out.participantResults).toHaveLength(2);
    expect(out.pairResults).toBeUndefined();
    // t1 shot 72 + 18 = 90, team PH 10 → net 80.
    expect(out.participantResults[0].totals.find((t) => t.scoringType === 'gross')!.value).toBe(90);
    expect(out.participantResults[0].totals.find((t) => t.scoringType === 'net')!.value).toBe(80);
    // t2 shot par — 72, team PH 8 → net 64.
    expect(out.participantResults[1].totals.find((t) => t.scoringType === 'gross')!.value).toBe(72);
    expect(out.participantResults[1].totals.find((t) => t.scoringType === 'net')!.value).toBe(64);
});
