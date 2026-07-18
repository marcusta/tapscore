// Phase 5.5 Slice 1 — join-card affordance derivation from the round read's
// start-list payload. The server decides (`startList.viewer`); these pure
// helpers only translate that decision into card visibility, a verbatim
// blocked message for window refusals, and whether the group picker offers
// "Start a new group".

import { test, expect } from 'bun:test';
import { deriveGroupPicker, joinCardPolicyState, NEW_GROUP_CHOICE } from '../../src/round/join';
import type { RoundPlayingGroup, StartListView } from '../../src/api/friendly-rounds.gen';

const view = (
    join: StartListView['viewer']['join'],
    createGroup: StartListView['viewer']['createGroup'] = { allowed: true },
): StartListView => ({
    policy: { groups: 'open', seats: 'assigned', claimBy: 'anyone' },
    presetId: null,
    viewer: { join, createGroup, claimSeat: { allowed: true }, maxGroupSize: 4 },
});

test('joinCardPolicyState: allowed → active card; null view (still loading) → hidden', () => {
    expect(joinCardPolicyState(view({ allowed: true }))).toEqual({
        visible: true,
        blockedMessage: null,
    });
    expect(joinCardPolicyState(null)).toEqual({ visible: false, blockedMessage: null });
});

test('joinCardPolicyState: organized/roster/login refusals hide the card entirely (no leak)', () => {
    for (const code of ['self_service_closed', 'not_on_roster', 'login_required']) {
        const state = joinCardPolicyState(view({ allowed: false, code, message: 'nope' }));
        expect(state.visible).toBe(false);
    }
});

test('joinCardPolicyState: window refusals keep the card visible with the server message verbatim', () => {
    const message = 'Self-service sign-up has not opened yet — it opens 2026-07-18 12:00.';
    const state = joinCardPolicyState(view({ allowed: false, code: 'window_not_open', message }));
    expect(state).toEqual({ visible: true, blockedMessage: message });
    const closed = joinCardPolicyState(
        view({ allowed: false, code: 'window_closed', message: 'Sign-up closed.' }),
    );
    expect(closed.visible).toBe(true);
    expect(closed.blockedMessage).toBe('Sign-up closed.');
});

test('deriveGroupPicker: allowNewGroup=false omits "Start a new group" and never defaults to it', () => {
    const groups = [
        { id: 'g1', startTime: '09:00', capacity: 2, ballIds: ['b1', 'b2'] },
        { id: 'g2', startTime: '09:10', capacity: 4, ballIds: ['b3'] },
    ] as unknown as RoundPlayingGroup[];

    const withNew = deriveGroupPicker(groups);
    expect(withNew.options.map((o) => o.value)).toEqual(['g1', 'g2', NEW_GROUP_CHOICE]);
    expect(withNew.defaultValue).toBe('g2');

    const withoutNew = deriveGroupPicker(groups, false);
    expect(withoutNew.options.map((o) => o.value)).toEqual(['g1', 'g2']);
    expect(withoutNew.defaultValue).toBe('g2');

    // Every group full + no new-group option → no viable default ('').
    const allFull = [groups[0]!] as RoundPlayingGroup[];
    expect(deriveGroupPicker(allFull, false).defaultValue).toBe('');
});
