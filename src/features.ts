// Build-time feature toggles. Vite inlines `import.meta.env.*` at build time,
// so an off flag drops the feature from the shipped bundle's UI entirely — no
// runtime config, no server round-trip.
//
// Each flag defaults to "on in dev, off in prod" and can be forced either way
// with a VITE_FEATURE_* env var at build time:
//
//   VITE_FEATURE_COMPETITIONS=1 bun run build   # ship it
//   VITE_FEATURE_COMPETITIONS=0 bun run dev     # hide it locally
function flag(value: string | undefined, defaultOn: boolean): boolean {
    if (value === undefined || value === '') return defaultOn;
    return value !== '0' && value.toLowerCase() !== 'false';
}

const env = import.meta.env ?? {};

export const features = {
    // Competitions ("Comps" tab + /competitions, /competition routes). Hidden
    // in prod until the competition flow is finished.
    competitions: flag(env.VITE_FEATURE_COMPETITIONS, !!env.DEV),
};
