/**
 * Run a tool from the `mackans-client-fw` checkout.
 *
 * The framework's tools live outside this repo, so the npm scripts used to
 * name them by a `../mackans-client-fw/...` path. That path is relative to the
 * CWD, which is wrong inside a git worktree: `.claude/worktrees/<name>/..` is
 * `.claude/worktrees/`, not the directory holding the checkouts. Resolving it
 * here rather than in the script string is what makes it fixable at all — bun
 * has to find the tool file before any of the tool's own `$BASICS_FW_DIR`
 * handling gets a chance to run.
 *
 *     bun scripts/fw.ts update 1.2.1
 *     bun scripts/fw.ts assert-not-linked
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

function fail(message: string): never {
    console.error(`\nfw: ${message}\n`);
    process.exit(1);
}

/** The main checkout's root, even when called from a linked worktree. */
function repoRoot(): string | null {
    const git = Bun.spawnSync(['git', 'rev-parse', '--git-common-dir'], { cwd: process.cwd() });
    if (git.exitCode !== 0) return null;
    // `--git-common-dir` is the MAIN repo's .git for every worktree; a plain
    // checkout answers with a bare `.git`, so resolve against the CWD.
    return resolve(process.cwd(), git.stdout.toString().trim(), '..');
}

function locateFramework(): string {
    const root = repoRoot();
    const candidates = [
        process.env.BASICS_FW_DIR,
        root ? resolve(root, '../mackans-client-fw') : null,
        resolve(process.cwd(), '../mackans-client-fw'),
    ].filter((c): c is string => Boolean(c));

    for (const candidate of candidates) {
        const pkg = join(candidate, 'core/package.json');
        if (!existsSync(pkg)) continue;
        // Same identity check the framework's own tools make: a sibling
        // directory with the right name is not proof it is the framework.
        const name = (JSON.parse(readFileSync(pkg, 'utf8')) as { name?: string }).name;
        if (name !== '@basics/core') continue;
        return resolve(candidate);
    }
    fail(
        `could not locate the mackans-client-fw checkout. Looked in:\n  ${candidates.join('\n  ')}\n`
        + '  Set $BASICS_FW_DIR to the checkout.',
    );
}

const [tool, ...rest] = process.argv.slice(2);
if (!tool) fail('usage: bun scripts/fw.ts <tool> [args...]   (e.g. update 1.2.1, assert-not-linked)');

const fw = locateFramework();
const toolPath = join(fw, 'tools', `${tool}.ts`);
if (!existsSync(toolPath)) fail(`no such framework tool: ${toolPath}`);

// CWD stays this repo — the tools read it to find the consumer being updated
// or checked. $BASICS_FW_DIR is exported so the tool's own lookup agrees with
// ours instead of re-probing relative paths.
const proc = Bun.spawn(['bun', toolPath, ...rest], {
    cwd: process.cwd(),
    env: { ...process.env, BASICS_FW_DIR: fw },
    stdio: ['inherit', 'inherit', 'inherit'],
});
process.exit(await proc.exited);
