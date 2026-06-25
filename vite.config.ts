import { defineConfig } from 'vite';

// Served behind Caddy at https://app.swedenindoorgolf.se/tapscore/ in
// production (Caddy strips the /tapscore prefix before proxying). `base`
// makes asset URLs + the router's BASE_URL carry the prefix; dev stays at '/'.
export default defineConfig({
    base: process.env.NODE_ENV === 'production' ? '/tapscore/' : '/',
    // No separate static-assets dir; ./public is the build output, so disable
    // publicDir to avoid it colliding with outDir on rebuilds.
    publicDir: false,
    build: {
        // Built client is committed to git and served by the Hono server
        // (server/main.ts). The deploy has no build step, so this is the
        // shipped artifact.
        outDir: 'public',
        emptyOutDir: true,
    },
    server: {
        host: true,
        proxy: {
            '/api': {
                target: 'http://localhost:3030',
                changeOrigin: true,
            },
        },
    },
});
