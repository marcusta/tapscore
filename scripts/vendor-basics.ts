// Re-vendor @basics/core from the local mackans-client-fw sibling repo.
//
// tapscore deploys to a server that has no access to the framework repo
// (it's local-only, no git remote), so the framework runtime AND developer
// adapters (generate-api / affected-tests) are vendored into vendor/basics-core
// and committed. Run this whenever the framework changes, then `bun install` +
// project/framework verification + commit the result.
//
//   bun run vendor:basics
//   bun install        # refresh node_modules/@basics/core + lockfile
//   bun run test
//   bun run test:framework
//   git add vendor/basics-core bun.lock && git commit -m "Re-vendor @basics/core"
//
// Pairs with the pinned-deps rule: vendoring is the explicit point where
// framework changes land in tapscore. Normal runtime, generation, and affected
// test commands never execute code from SRC directly.
import { $ } from 'bun';

const SRC = '../mackans-client-fw/core/';
const DEST = 'vendor/basics-core/';

const exists = await Bun.file('../mackans-client-fw/core/package.json').exists();
if (!exists) {
    console.error(`❌ Framework not found at ${SRC} — clone mackans-client-fw as a sibling first.`);
    process.exit(1);
}

console.log(`Vendoring ${SRC} → ${DEST} ...`);

// --delete keeps the vendored copy an exact mirror (removes files deleted
// upstream). node_modules/.git/.DS_Store are never copied.
await $`rsync -a --delete \
    --exclude node_modules \
    --exclude .git \
    --exclude .DS_Store \
    ${SRC} ${DEST}`;

const fileCount = (await $`find ${DEST} -type f`.text()).trim().split('\n').length;

// Vite pre-bundles @basics/core as an optimized dependency and invalidates that
// cache on the dep's VERSION, not its file contents. A vendored source change
// keeps the same version, so vite keeps serving the stale bundle even across a
// dev-server restart — leading to baffling "method is not a function" crashes
// when app code calls something the cached bundle predates. Drop the cache here
// so the next `vite` start re-optimizes against the freshly-vendored core.
await $`rm -rf node_modules/.vite`.nothrow();

console.log(`✅ Vendored ${fileCount} files (cleared node_modules/.vite). Next: bun install && commit vendor/basics-core + bun.lock`);
