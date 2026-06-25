import { Glob } from 'bun';
import { dirname, join } from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const SCAN_DIRS = (process.env.BASICS_SCAN_DIRS?.split(',') ?? ['src', 'server', 'tests']).map((d) => d.trim()).filter(Boolean);
const EXTENSIONS = ['.ts', '.tsx'];
const IMPORT_RE = /(?:import|export)\s.*?from\s+['"]([^'"]+)['"]/g;

// --- Collect all .ts files ---

async function scanFiles(): Promise<string[]> {
    const files: string[] = [];
    for (const dir of SCAN_DIRS) {
        const glob = new Glob('**/*.ts');
        for await (const path of glob.scan({ cwd: join(ROOT, dir), absolute: false })) {
            files.push(join(dir, path));
        }
    }
    return files;
}

// --- Parse imports from a file ---

function parseImports(content: string, filePath: string): string[] {
    const dir = dirname(filePath);
    const deps: string[] = [];
    for (const match of content.matchAll(IMPORT_RE)) {
        const specifier = match[1];
        if (!specifier.startsWith('.')) continue;
        const resolved = resolveSpecifier(dir, specifier);
        if (resolved) deps.push(resolved);
    }
    return deps;
}

function resolveSpecifier(fromDir: string, specifier: string): string | null {
    const base = join(fromDir, specifier);
    for (const ext of EXTENSIONS) {
        const candidate = base + ext;
        if (Bun.file(join(ROOT, candidate)).size) return candidate;
    }
    // Could be exact path already
    if (Bun.file(join(ROOT, base)).size) return base;
    // Try index
    for (const ext of EXTENSIONS) {
        const candidate = join(base, 'index' + ext);
        if (Bun.file(join(ROOT, candidate)).size) return candidate;
    }
    return null;
}

// --- Build reverse dependency map ---

async function buildReverseMap(files: string[]): Promise<Map<string, Set<string>>> {
    const reverse = new Map<string, Set<string>>();

    for (const file of files) {
        const content = await Bun.file(join(ROOT, file)).text();
        const deps = parseImports(content, file);
        for (const dep of deps) {
            let set = reverse.get(dep);
            if (!set) { set = new Set(); reverse.set(dep, set); }
            set.add(file);
        }
    }

    return reverse;
}

// --- BFS to find affected test files ---

function findAffectedTests(
    changedFiles: string[],
    reverseMap: Map<string, Set<string>>,
): Map<string, string[]> {
    const visited = new Set<string>();
    const testToChain = new Map<string, string[]>();

    for (const seed of changedFiles) {
        const queue: [string, string[]][] = [[seed, [seed]]];
        const localVisited = new Set<string>();

        while (queue.length > 0) {
            const [current, chain] = queue.shift()!;
            if (localVisited.has(current)) continue;
            localVisited.add(current);

            if (current.endsWith('.test.ts') && current !== seed) {
                if (!testToChain.has(current) || chain.length < testToChain.get(current)!.length) {
                    testToChain.set(current, chain);
                }
                continue; // don't traverse past test files
            }

            const dependents = reverseMap.get(current);
            if (dependents) {
                for (const dep of dependents) {
                    if (!localVisited.has(dep)) {
                        queue.push([dep, [...chain, dep]]);
                    }
                }
            }
        }

        visited.add(seed);
    }

    return testToChain;
}

// --- Get changed files from git ---

function getChangedFiles(): string[] {
    const unstaged = execSync('git diff --name-only HEAD', { cwd: ROOT, encoding: 'utf-8' });
    const staged = execSync('git diff --name-only --staged', { cwd: ROOT, encoding: 'utf-8' });
    const untracked = execSync('git ls-files --others --exclude-standard', { cwd: ROOT, encoding: 'utf-8' });
    const all = [...unstaged.split('\n'), ...staged.split('\n'), ...untracked.split('\n')]
        .map(f => f.trim())
        .filter(f => f.length > 0 && f.endsWith('.ts'));
    return [...new Set(all)];
}

// --- Main ---

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const fileArgs = args.filter(a => !a.startsWith('--'));

const changedFiles = fileArgs.length > 0 ? fileArgs : getChangedFiles();

if (changedFiles.length === 0) {
    console.log('No changed .ts files detected.');
    process.exit(0);
}

console.log(`Changed files: ${changedFiles.join(', ')}\n`);

const allFiles = await scanFiles();
const reverseMap = await buildReverseMap(allFiles);
const affected = findAffectedTests(changedFiles, reverseMap);

if (affected.size === 0) {
    console.log('No affected test files.');
    process.exit(0);
}

console.log('Affected tests:');
for (const [testFile, chain] of affected) {
    console.log(`  ${testFile}`);
    const source = chain.filter(f => !f.endsWith('.test.ts'));
    if (source.length > 0) {
        console.log(`    <- ${source.join(' <- ')}`);
    }
}
console.log();

if (dryRun) {
    console.log(`${affected.size} test file(s) affected (dry run).`);
    process.exit(0);
}

console.log(`Running ${affected.size} test file(s)...\n`);

const testFiles = [...affected.keys()].map(f => join(ROOT, f));
const result = Bun.spawnSync(['bun', 'test', ...testFiles], {
    cwd: ROOT,
    stdio: ['inherit', 'inherit', 'inherit'],
});

process.exit(result.exitCode);
