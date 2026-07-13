import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const FILES = [
    'competition.service.ts',
    'competition-round.service.ts',
    'competition-leaderboard.service.ts',
    'competition-cut.service.ts',
    'competition-finalize.service.ts',
] as const;

const TABLE_OPERATION = /\.(?:selectFrom|insertInto|updateTable|deleteFrom)\s*\(/g;
const METHODS_MARKER = '// --- Methods';

function methodBodyOperations(source: string): string[] {
    const marker = source.indexOf(METHODS_MARKER);
    if (marker < 0) throw new Error(`missing ${METHODS_MARKER} marker`);
    return [...source.slice(marker).matchAll(TABLE_OPERATION)].map((match) => match[0]);
}

describe('Phase 4 competition query inventory', () => {
    for (const file of FILES) {
        test(`${file} keeps table operations in its query inventory`, () => {
            const source = readFileSync(resolve(import.meta.dir, file), 'utf8');
            expect(methodBodyOperations(source)).toEqual([]);
        });
    }

    test('negative control — a table operation in a method is detected', () => {
        const source = `
            private rows() { return this.db.selectFrom('competitions'); }
            ${METHODS_MARKER}
            async create() { return this.db.insertInto('competitions'); }
        `;
        expect(methodBodyOperations(source)).toEqual([".insertInto("]);
    });
});
