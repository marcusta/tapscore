import { expect, test } from 'bun:test';
import {
    FINISHED_PREVIEW_LIMIT,
    ONGOING_PREVIEW_LIMIT,
    handicapPill,
    showsAllRoundsLink,
    showsEmptyNotice,
    showsOngoingShowAll,
    type HomeCounts,
} from '../../src/landing/home-view';

// The home screen's counting and copy rules. Pure — the component only binds
// them to class names, so everything worth asserting is here.

function counts(over: Partial<HomeCounts> = {}): HomeCounts {
    return { rows: 0, ongoing: 0, finished: 0, ...over };
}

test('the caps match the iOS home', () => {
    expect(FINISHED_PREVIEW_LIMIT).toBe(3);
    expect(ONGOING_PREVIEW_LIMIT).toBe(4);
});

test('a handicap index renders as a pill, one decimal', () => {
    expect(handicapPill(18.4)).toBe('HCP 18.4');
    expect(handicapPill(0)).toBe('HCP 0.0');
    expect(handicapPill(9)).toBe('HCP 9.0');
});

test('a stored negative index is a PLUS handicap', () => {
    expect(handicapPill(-2)).toBe('HCP +2.0');
    expect(handicapPill(-0.4)).toBe('HCP +0.4');
});

test('no index means no pill — never "HCP –"', () => {
    expect(handicapPill(null)).toBeNull();
    expect(handicapPill(undefined)).toBeNull();
    expect(handicapPill(Number.NaN)).toBeNull();
});

test('"Show all" appears only once Ongoing is actually truncated', () => {
    expect(showsOngoingShowAll(0)).toBe(false);
    expect(showsOngoingShowAll(ONGOING_PREVIEW_LIMIT)).toBe(false);
    expect(showsOngoingShowAll(ONGOING_PREVIEW_LIMIT + 1)).toBe(true);
});

test('the standalone all-rounds link stands down when the finished card is on screen', () => {
    expect(showsAllRoundsLink(counts({ rows: 4, ongoing: 1, finished: 3 }))).toBe(false);
});

test('it also stands down when Ongoing carries its own "Show all" — the two never stack', () => {
    expect(showsAllRoundsLink(counts({ rows: 5, ongoing: 5, finished: 0 }))).toBe(false);
    expect(showsAllRoundsLink(counts({ rows: 4, ongoing: 4, finished: 0 }))).toBe(true);
});

test('rounds that aged out of the finished window still get a door', () => {
    // Loaded rows, but both partitions empty: every round is older than the
    // window. The link is then the ONLY way to reach them.
    expect(showsAllRoundsLink(counts({ rows: 7, ongoing: 0, finished: 0 }))).toBe(true);
});

test('nothing loaded means no link at all', () => {
    expect(showsAllRoundsLink(counts())).toBe(false);
});

test('only a genuinely empty list may say it is empty', () => {
    expect(showsEmptyNotice(counts())).toBe(true);
    // Aged-out rounds are still rounds — the notice must not claim otherwise.
    expect(showsEmptyNotice(counts({ rows: 7, ongoing: 0, finished: 0 }))).toBe(false);
});
