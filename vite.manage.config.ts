import { defineConfig } from 'vite';

// Tapscore Manage — the second SPA (docs/proposals/manage-ui.md). Same repo,
// same deploy, same origin as the player app; separate build, never bundled
// together. In production it sits under the player app's deploy prefix at
// https://app.swedenindoorgolf.se/tapscore/manage/; dev serves it at '/manage/'
// so the base path has the same shape in both environments.
export default defineConfig({
    // `manage/index.html` is the entry, so the manage dir is the Vite root.
    // Everything below is therefore relative to it, not to the repo root.
    root: 'manage',
    base: process.env.NODE_ENV === 'production' ? '/tapscore/manage/' : '/manage/',
    // Without this, Vite would treat the repo's ./public — the player app's
    // build output — as static assets and copy the whole player build into
    // the manage output.
    publicDir: false,
    // @basics/core ships TypeScript source, not a bundle. Excluding it from
    // pre-bundling lets `bun link @basics/core` HMR framework source during
    // active framework work; harmless when consuming the tarball.
    optimizeDeps: { exclude: ['@basics/core'] },
    build: {
        // ./public/manage, i.e. a subdir of the player app's output — both
        // builds are committed and served by server/main.ts. Emptying is
        // scoped to public/manage, so a manage-only rebuild leaves the player
        // artifact alone. The reverse is not true: the player build empties
        // all of ./public, which is why `bun run build` builds player first,
        // then manage.
        outDir: '../public/manage',
        // outDir sits outside the Vite root, so Vite requires this to be
        // explicit before it will delete anything.
        emptyOutDir: true,
    },
    server: {
        host: true,
        // Off the player dev server's 5173 so both can run at once. Not
        // Vite's own next-in-line 5174 either — that is the port every other
        // Vite project on the machine drifts to.
        port: 5273,
        proxy: {
            '/api': {
                target: 'http://localhost:3030',
                changeOrigin: true,
            },
        },
    },
});
