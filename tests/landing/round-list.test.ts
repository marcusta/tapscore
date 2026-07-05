import { expect, test } from 'bun:test';
import { withoutRound } from '../../src/landing/round-list';

// Pure list-removal derivation behind round deletion: after a successful
// token-scoped DELETE the landing prunes the row out of its loaded lists in
// place (no reload). Keyed by round.id so the same helper serves the public
// list, and both "My rounds" dashboard halves.

const item = (id: string) => ({ round: { id }, label: `round-${id}` });

test('removes exactly the matching round, preserving order', () => {
    const list = [item('a'), item('b'), item('c')];
    expect(withoutRound(list, 'b')).toEqual([item('a'), item('c')]);
});

test('removing an unknown round returns the SAME array instance (signal no-op)', () => {
    const list = [item('a'), item('b')];
    expect(withoutRound(list, 'zzz')).toBe(list);
});

test('does not mutate the input list', () => {
    const list = [item('a'), item('b')];
    withoutRound(list, 'a');
    expect(list).toHaveLength(2);
});

test('empty list stays empty', () => {
    const empty: Array<{ round: { id: string } }> = [];
    expect(withoutRound(empty, 'a')).toBe(empty);
});
