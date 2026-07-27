import { test, expect } from 'bun:test';
import { mkdtempSync, readdirSync, copyFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const repoRoot = new URL('..', import.meta.url).pathname;

async function runVerify(extraArgs: string[] = []) {
    const proc = Bun.spawn(['bun', 'scripts/generate-swift.ts', '--verify', ...extraArgs], {
        cwd: repoRoot,
        stdout: 'pipe',
        stderr: 'pipe',
    });
    const [out, err, code] = await Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
        proc.exited,
    ]);
    return { out, err, code };
}

const apiModules = readdirSync(join(repoRoot, 'server/api'))
    .filter((f) => f.endsWith('.api.ts'))
    .map((f) => f.replace('.api.ts', ''));

// The IR's correctness proof, wired into the suite so it cannot silently rot.
//
// `--verify` re-emits every `server/api/*.api.ts` client through the IR's
// TypeScript backend and diffs it against the committed `src/api/*.gen.ts`.
// A single byte of drift means the IR dropped or reshaped something the
// framework generator kept — and the Swift emitter reads the same IR, so the
// native client would inherit the loss.
test('IR reproduces the framework clients byte-for-byte', async () => {
    const { out, err, code } = await runVerify();
    expect(err + out).not.toContain('VERIFY FAIL');
    expect(code).toBe(0);
    // Every module must be covered — the count is derived from `server/api/`
    // rather than hardcoded, so adding an API without generating its client
    // fails here instead of quietly shrinking the denominator.
    expect(apiModules.length).toBeGreaterThan(0);
    expect(out).toContain(
        `verify: ${apiModules.length}/${apiModules.length} clients byte-identical`,
    );
    expect(out + err).not.toContain('MISSING ORACLE');
    expect(out + err).not.toContain('--allow-missing');
}, 60_000);

// A gate that disables itself when its oracle disappears is not a gate. Adding
// a new `server/api/*.api.ts` without running `bun run generate` used to log a
// "skipped" line and exit 0, so the byte-identity proof silently stopped
// covering the new module.
test('a missing oracle is a hard failure, not a skip', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'tapscore-oracles-'));
    try {
        const dropped = apiModules[0];
        for (const name of apiModules) {
            if (name === dropped) continue;
            copyFileSync(join(repoRoot, 'src/api', `${name}.gen.ts`), join(dir, `${name}.gen.ts`));
        }

        const failed = await runVerify(['--ref', dir]);
        expect(failed.code).toBe(1);
        expect(failed.err).toContain('MISSING ORACLE');
        expect(failed.err).toContain(dropped);
        expect(failed.err).toContain('bun run generate');
        expect(failed.err).toContain('--allow-missing');

        // ...and the escape hatch is explicit, per module, and reported.
        const waived = await runVerify(['--ref', dir, '--allow-missing', dropped]);
        expect(waived.err).not.toContain('VERIFY FAIL');
        expect(waived.code).toBe(0);
        expect(waived.out).toContain(
            `verify: ${apiModules.length - 1}/${apiModules.length - 1} clients byte-identical`,
        );
        expect(waived.out).toContain(`oracle waived via --allow-missing for ${dropped}`);
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
}, 120_000);
