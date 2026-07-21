// Phase 5.5 Slice 1 — the pure start-list policy evaluator.
//
// ONE function decides every self-service gate (join, group creation, the
// advisory claim seam) from (policy, actor, now). These tests walk the
// matrix: groups axis × actor shape, roster resolution incl. the
// no-roster-source case, the self-service window, maxGroupSize defaulting,
// presets and preset matching, and the open default that preserves pre-5.5
// friendly behaviour.

import { test, expect } from 'bun:test';
import {
    DEFAULT_MAX_GROUP_SIZE,
    OPEN_START_LIST_POLICY,
    START_LIST_PRESETS,
    effectiveStartListPolicy,
    evaluateStartListOps,
    matchingPresetId,
    maxGroupSizeOf,
    type StartListActor,
    type StartListPolicy,
} from './start-list-policy';

const NOW = '2026-07-18T10:00:00.000Z';

const loggedIn = (over: Partial<StartListActor> = {}): StartListActor => ({
    playerId: 'p-1',
    onRoster: null,
    isProducer: false,
    ...over,
});

const anonymous: StartListActor = { playerId: null, onRoster: null, isProducer: false };

// --- Defaults -----------------------------------------------------------------

test('effectiveStartListPolicy: absent draft/field resolves to the open default', () => {
    expect(effectiveStartListPolicy(undefined)).toEqual(OPEN_START_LIST_POLICY);
    expect(effectiveStartListPolicy(null)).toEqual(OPEN_START_LIST_POLICY);
    expect(effectiveStartListPolicy({})).toEqual(OPEN_START_LIST_POLICY);
    const organized = START_LIST_PRESETS.organized;
    expect(effectiveStartListPolicy({ startList: organized })).toEqual(organized);
});

test('open default: exact pre-5.5 shape — open groups, assigned seats, anyone claims, flight of 4', () => {
    expect(OPEN_START_LIST_POLICY).toEqual({
        groups: 'open',
        seats: 'assigned',
        claimBy: 'anyone',
    });
    expect(maxGroupSizeOf(OPEN_START_LIST_POLICY)).toBe(DEFAULT_MAX_GROUP_SIZE);
    expect(maxGroupSizeOf({ ...OPEN_START_LIST_POLICY, maxGroupSize: 3 })).toBe(3);
});

// --- groups: 'open' -----------------------------------------------------------

test("groups 'open': any logged-in actor may join + create groups; anonymous must log in", () => {
    const ops = evaluateStartListOps(OPEN_START_LIST_POLICY, loggedIn(), NOW);
    expect(ops.join.allowed).toBe(true);
    expect(ops.createGroup.allowed).toBe(true);
    expect(ops.maxGroupSize).toBe(4);

    const anon = evaluateStartListOps(OPEN_START_LIST_POLICY, anonymous, NOW);
    expect(anon.join).toMatchObject({ allowed: false, code: 'login_required' });
    expect(anon.createGroup.allowed).toBe(false);
});

// --- groups: 'organized' ------------------------------------------------------

test("groups 'organized': self-service refused for everyone — even roster members and producers", () => {
    const policy = START_LIST_PRESETS.organized;
    for (const actor of [
        anonymous,
        loggedIn(),
        loggedIn({ onRoster: true }),
        loggedIn({ isProducer: true }),
    ]) {
        const ops = evaluateStartListOps(policy, actor, NOW);
        expect(ops.join).toMatchObject({ allowed: false, code: 'self_service_closed' });
        expect(ops.join.message).toContain('organizer');
        expect(ops.createGroup.allowed).toBe(false);
    }
});

// --- groups: 'roster' ---------------------------------------------------------

test("groups 'roster': roster member allowed, non-member refused, anonymous must log in", () => {
    const policy = START_LIST_PRESETS.self_organized;
    expect(evaluateStartListOps(policy, loggedIn({ onRoster: true }), NOW).join.allowed).toBe(true);
    expect(evaluateStartListOps(policy, loggedIn({ onRoster: true }), NOW).createGroup.allowed).toBe(
        true,
    );

    const outsider = evaluateStartListOps(policy, loggedIn({ onRoster: false }), NOW);
    expect(outsider.join).toMatchObject({ allowed: false, code: 'not_on_roster' });

    const anon = evaluateStartListOps(policy, anonymous, NOW);
    expect(anon.join).toMatchObject({ allowed: false, code: 'login_required' });
});

test("groups 'roster' with NO roster source: closed to newcomers, open to the round's own producers", () => {
    const policy: StartListPolicy = { groups: 'roster', seats: 'assigned', claimBy: 'roster' };
    // A friendly round has no competition roster → onRoster: null.
    const stranger = evaluateStartListOps(policy, loggedIn({ onRoster: null }), NOW);
    expect(stranger.join).toMatchObject({ allowed: false, code: 'not_on_roster' });

    // Producers count as their own roster — they may still organize groups.
    const producer = evaluateStartListOps(
        policy,
        loggedIn({ onRoster: null, isProducer: true }),
        NOW,
    );
    expect(producer.createGroup.allowed).toBe(true);
});

// --- window -------------------------------------------------------------------

test('window: refused before opensAt and after closesAt, with the window in the message', () => {
    const policy: StartListPolicy = {
        ...OPEN_START_LIST_POLICY,
        window: { opensAt: '2026-07-18T12:00:00Z', closesAt: '2026-07-18T16:00:00Z' },
    };
    const before = evaluateStartListOps(policy, loggedIn(), '2026-07-18T11:59:00Z');
    expect(before.join).toMatchObject({ allowed: false, code: 'window_not_open' });
    expect(before.join.message).toContain('2026-07-18 12:00');

    const inside = evaluateStartListOps(policy, loggedIn(), '2026-07-18T13:00:00Z');
    expect(inside.join.allowed).toBe(true);

    const after = evaluateStartListOps(policy, loggedIn(), '2026-07-18T17:00:00Z');
    expect(after.join).toMatchObject({ allowed: false, code: 'window_closed' });
    expect(after.join.message).toContain('2026-07-18 16:00');
});

test('window: half-open windows work; membership refusals outrank window refusals', () => {
    const opensOnly: StartListPolicy = {
        ...OPEN_START_LIST_POLICY,
        window: { opensAt: '2026-07-18T12:00:00Z' },
    };
    expect(evaluateStartListOps(opensOnly, loggedIn(), '2026-07-19T00:00:00Z').join.allowed).toBe(
        true,
    );

    // Outside the window AND not on the roster → the durable fact wins.
    const rosterWindowed: StartListPolicy = {
        groups: 'roster',
        seats: 'claimable',
        claimBy: 'roster',
        window: { closesAt: '2026-07-01T00:00:00Z' },
    };
    const refusal = evaluateStartListOps(rosterWindowed, loggedIn({ onRoster: false }), NOW);
    expect(refusal.join.code).toBe('not_on_roster');
    // A roster member outside the window gets the window refusal.
    const member = evaluateStartListOps(rosterWindowed, loggedIn({ onRoster: true }), NOW);
    expect(member.join.code).toBe('window_closed');
});

// --- claimBy (enforced by the Slice 3 claim op) --------------------------------

const CLAIMABLE_ANYONE: StartListPolicy = {
    groups: 'organized',
    seats: 'claimable',
    claimBy: 'anyone',
};

test("claimSeat: seats 'assigned' refuses whoever asks — including the open default", () => {
    for (const policy of [OPEN_START_LIST_POLICY, START_LIST_PRESETS.organized]) {
        const ops = evaluateStartListOps(policy, loggedIn({ onRoster: true }), NOW);
        expect(ops.claimSeat).toMatchObject({ allowed: false, code: 'seats_assigned' });
        expect(ops.claimSeatAsGuest).toMatchObject({ allowed: false, code: 'seats_assigned' });
    }
});

test("claimSeat: 'anyone' allows a session self-claim; anonymous self-claim needs login; guest claim works anonymously", () => {
    const session = evaluateStartListOps(CLAIMABLE_ANYONE, loggedIn(), NOW);
    expect(session.claimSeat.allowed).toBe(true);
    expect(session.claimSeatAsGuest.allowed).toBe(true);

    const anon = evaluateStartListOps(CLAIMABLE_ANYONE, anonymous, NOW);
    expect(anon.claimSeat).toMatchObject({ allowed: false, code: 'login_required' });
    // Trust-based like guest add: the token holder may seat a guest.
    expect(anon.claimSeatAsGuest.allowed).toBe(true);
});

test("claimSeat: 'roster' gates on membership; guests cannot claim rostered seats; anonymous must log in", () => {
    const roster = evaluateStartListOps(
        START_LIST_PRESETS.pick_your_tee_time,
        loggedIn({ onRoster: false }),
        NOW,
    );
    expect(roster.claimSeat).toMatchObject({ allowed: false, code: 'not_on_roster' });
    expect(roster.claimSeatAsGuest).toMatchObject({
        allowed: false,
        code: 'guest_claim_not_allowed',
    });
    expect(
        evaluateStartListOps(
            START_LIST_PRESETS.pick_your_tee_time,
            loggedIn({ onRoster: true }),
            NOW,
        ).claimSeat.allowed,
    ).toBe(true);
    expect(
        evaluateStartListOps(START_LIST_PRESETS.pick_your_tee_time, anonymous, NOW).claimSeat,
    ).toMatchObject({ allowed: false, code: 'login_required' });

    const team = evaluateStartListOps(START_LIST_PRESETS.organized_open_slots, loggedIn(), NOW);
    expect(team.claimSeat).toMatchObject({ allowed: false, code: 'team_claim_unavailable' });
    expect(team.claimSeatAsGuest).toMatchObject({
        allowed: false,
        code: 'team_claim_unavailable',
    });
});

test('claimSeat: the self-service window applies, but durable refusals outrank it', () => {
    const windowed: StartListPolicy = {
        ...CLAIMABLE_ANYONE,
        window: { closesAt: '2026-07-01T00:00:00Z' },
    };
    const closed = evaluateStartListOps(windowed, loggedIn(), NOW);
    expect(closed.claimSeat).toMatchObject({ allowed: false, code: 'window_closed' });
    expect(closed.claimSeatAsGuest).toMatchObject({ allowed: false, code: 'window_closed' });

    // Wrong audience is the durable fact — reported before the window.
    const rosterWindowed: StartListPolicy = {
        ...START_LIST_PRESETS.pick_your_tee_time,
        window: { closesAt: '2026-07-01T00:00:00Z' },
    };
    const refused = evaluateStartListOps(rosterWindowed, loggedIn({ onRoster: false }), NOW);
    expect(refused.claimSeat.code).toBe('not_on_roster');
    expect(refused.claimSeatAsGuest.code).toBe('guest_claim_not_allowed');
});

// --- Presets ------------------------------------------------------------------

test('presets: the four named shapes, and matching ignores window/maxGroupSize tuning', () => {
    expect(START_LIST_PRESETS.organized.groups).toBe('organized');
    expect(START_LIST_PRESETS.organized.seats).toBe('assigned');
    expect(START_LIST_PRESETS.organized_open_slots).toMatchObject({
        groups: 'organized',
        seats: 'claimable',
        claimBy: 'team',
    });
    expect(START_LIST_PRESETS.pick_your_tee_time).toMatchObject({
        groups: 'organized',
        seats: 'claimable',
        claimBy: 'roster',
    });
    expect(START_LIST_PRESETS.self_organized).toMatchObject({
        groups: 'roster',
        seats: 'claimable',
        claimBy: 'roster',
    });

    expect(matchingPresetId(START_LIST_PRESETS.self_organized)).toBe('self_organized');
    expect(
        matchingPresetId({
            ...START_LIST_PRESETS.organized,
            maxGroupSize: 3,
            window: { opensAt: '2026-07-01T00:00:00Z' },
        }),
    ).toBe('organized');
    // The open default is NOT a preset (it is the implicit friendly default).
    expect(matchingPresetId(OPEN_START_LIST_POLICY)).toBeNull();
});
