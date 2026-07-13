import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function filesWithLiteralNul(files: { name: string; source: string }[]): string[] {
    return files.filter((file) => file.source.includes('\0')).map((file) => file.name);
}

describe('service source hygiene', () => {
    test('TypeScript sources contain no literal NUL bytes', () => {
        const files = [...new Bun.Glob('*.ts').scanSync({ cwd: import.meta.dir, onlyFiles: true })]
            .map((name) => ({
                name,
                source: readFileSync(resolve(import.meta.dir, name), 'utf8'),
            }));
        expect(filesWithLiteralNul(files)).toEqual([]);
    });

    test('negative control — a literal NUL is detected', () => {
        expect(filesWithLiteralNul([{ name: 'bad.ts', source: 'left\0right' }])).toEqual([
            'bad.ts',
        ]);
    });
});
