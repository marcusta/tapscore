// Re-vendor @basics/core from the local mackans-client-fw sibling repo.
//
// tapscore deploys to a server that has no access to the framework repo
// (it's local-only, no git remote), so the framework is vendored into
// vendor/basics-core and committed. Run this whenever the framework
// changes, then `bun install` + commit the result.
//
//   bun run vendor:basics
//   bun install        # refresh node_modules/@basics/core + lockfile
//   git add vendor/basics-core bun.lock && git commit -m "Re-vendor @basics/core"
//
// Pairs with the pinned-deps rule: vendoring is the explicit point where
// framework changes land in tapscore.
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
console.log(`✅ Vendored ${fileCount} files. Next: bun install && commit vendor/basics-core + bun.lock`);
