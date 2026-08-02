import { expect, test } from 'bun:test';
import { roundListAction, roundListActionLabel } from '../../src/landing/round-actions';

test('a creator gets delete, whether or not they played', () => {
    expect(roundListAction({ token: 'tok', created: true, played: false })).toBe('delete');
    expect(roundListAction({ token: 'tok', created: true, played: true })).toBe('delete');
});

test('a non-creator player gets remove-self', () => {
    expect(roundListAction({ token: 'tok', created: false, played: true })).toBe('leave');
    expect(roundListActionLabel('leave')).toBe('Remove me from this round');
});

test('device-local and wrapper-less rows have no server action', () => {
    expect(roundListAction({ token: 'tok', created: false, played: false })).toBeNull();
    expect(roundListAction({ token: null, created: true, played: true })).toBeNull();
});
