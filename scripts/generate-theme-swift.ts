/**
 * Emits `ios/TapScore/DesignSystem/ThemeTokens.swift` from `src/theme.ts`.
 *
 * The web theme is the design contract ("Clubhouse scorecard" — warm cream
 * paper, deep fairway-green ink, brass accent). The native client must render
 * the SAME colours, not a hand-copied approximation that drifts the first time
 * someone tunes a hex on the web, so the token tables are generated rather than
 * transcribed. Run it after any change to `src/theme.ts`:
 *
 *     bun run generate:theme
 *
 * The output IS committed (same reasoning as `TapScore/API/Generated/`: with
 * zero SPM dependencies there is no build step that could produce it, and a
 * committed file keeps a palette change reviewable as a Swift diff). Never
 * hand-edit it — the next run eats the edit.
 *
 * ## Why the DOM shim
 *
 * `src/theme.ts` calls `createTokens`, which injects a `<style>` element at
 * import time. That is correct for a browser and fatal headless, so this script
 * installs the three `document` members `createTokens` touches before importing
 * the module. It is deliberately the *smallest* shim that works: the values we
 * read (`resolvedLight` / `resolvedDark`) are computed by `bridgeLegacyControls`,
 * which is pure, so nothing about the numbers depends on the fake DOM.
 *
 * ## Resolution
 *
 * A resolved map still contains `var(--other-token)` references (and the
 * `var(--a, var(--b))` fallback form). Those are followed WITHIN one
 * appearance, which is what makes e.g. `--field-focus-border → var(--primary)`
 * come out fairway-green in light and sage in dark from the same declaration.
 */

// --- headless DOM shim (see the note above) --------------------------------

const fakeElement = () => ({
    setAttribute(_name: string, _value: string) {},
    textContent: '',
    appendChild(_child: unknown) {},
});

(globalThis as unknown as { document: unknown }).document = {
    head: { querySelector: () => null, appendChild(_child: unknown) {} },
    createElement: fakeElement,
};

const { resolvedLight, resolvedDark } = await import('../src/theme');

// --- token classification --------------------------------------------------

const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const RGB = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,/\s]+([\d.%]+))?\s*\)$/;
const PX = /^(-?[\d.]+)px$/;
const MS = /^(-?[\d.]+)ms$/;
const NUMBER = /^-?[\d.]+$/;
/** `0 1px 2px rgba(...)` — the only box-shadow shape this theme uses. */
const SHADOW = /^(-?[\d.]+)(?:px)?\s+(-?[\d.]+)(?:px)?\s+(-?[\d.]+)(?:px)?\s+(.+)$/;

/**
 * Follow `var(--name)` / `var(--name, fallback)` inside one appearance's map.
 * Depth-capped rather than cycle-tracked: a cycle in a theme is a bug we want
 * to hear about, and 16 hops is far past anything legitimate.
 */
function resolve(value: string, map: Record<string, string>, depth = 0): string {
    const trimmed = value.trim();
    if (depth > 16) throw new Error(`var() chain too deep at: ${value}`);
    const match = /^var\(\s*--([\w-]+)\s*(?:,\s*([\s\S]+))?\)$/.exec(trimmed);
    if (!match) return trimmed;
    const [, name, fallback] = match;
    const next = map[name!];
    if (next !== undefined) return resolve(next, map, depth + 1);
    if (fallback !== undefined) return resolve(fallback, map, depth + 1);
    throw new Error(`undefined token --${name}`);
}

interface Rgba { r: number; g: number; b: number; a: number }

function parseColor(value: string): Rgba | null {
    if (value === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
    const hex = HEX.exec(value);
    if (hex) {
        let digits = hex[1]!;
        if (digits.length === 3) digits = digits.split('').map((c) => c + c).join('');
        const int = parseInt(digits.slice(0, 6), 16);
        const alpha = digits.length === 8 ? parseInt(digits.slice(6, 8), 16) / 255 : 1;
        return { r: (int >> 16) & 0xff, g: (int >> 8) & 0xff, b: int & 0xff, a: alpha };
    }
    const rgb = RGB.exec(value);
    if (rgb) {
        const alphaRaw = rgb[4];
        const a = alphaRaw === undefined
            ? 1
            : alphaRaw.endsWith('%') ? Number(alphaRaw.slice(0, -1)) / 100 : Number(alphaRaw);
        return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]), a };
    }
    return null;
}

/** `surface-sunken` → `surfaceSunken`; `space-1` → `space1`. */
function swiftName(token: string): string {
    const [head, ...rest] = token.split('-');
    return head! + rest.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join('');
}

const hexLiteral = (c: Rgba) =>
    '0x' + [c.r, c.g, c.b].map((n) => Math.round(n).toString(16).padStart(2, '0')).join('');

/** Swift literal for a number. `String(n)` already drops a trailing `.0`. */
const num = (n: number) => `${n}`;

/**
 * Declaration for a non-colour scalar.
 *
 * A scalar that is the SAME in both appearances is a plain `let`. One that
 * DIFFERS becomes a computed accessor over `dynamicScalar`, for the same reason
 * every colour is dynamic: emitting the light value alone would silently ship
 * the day palette's number at night (`--done-opacity` is 0.4 light, 0.35 dark).
 */
function scalarDecl(
    name: string,
    type: 'Double' | 'CGFloat',
    light: number,
    dark: number,
): string {
    if (light === dark) return `        static let ${name}: ${type} = ${num(light)}`;
    const call = `dynamicScalar(light: ${num(light)}, dark: ${num(dark)})`;
    return `        static var ${name}: ${type} { ${type === 'Double' ? call : `${type}(${call})`} }`;
}

// --- emission --------------------------------------------------------------

// The two maps must name the same tokens, checked BOTH ways. A token missing
// from dark used to fall through to an undefined lookup and die inside
// `resolve()` with a message about nothing; symmetric checks make either
// direction say which token and which appearance.
const names = Object.keys(resolvedLight);
const darkNames = Object.keys(resolvedDark);
for (const name of darkNames) {
    if (!names.includes(name)) {
        throw new Error(`token --${name} exists in dark but not light`);
    }
}
for (const name of names) {
    if (!darkNames.includes(name)) {
        throw new Error(`token --${name} exists in light but not dark`);
    }
}

interface Pair { token: string; light: string; dark: string }

const pairs: Pair[] = names.map((token) => ({
    token,
    light: resolve(resolvedLight[token]!, resolvedLight),
    dark: resolve(resolvedDark[token]!, resolvedDark),
}));

const colors: string[] = [];
const radii: string[] = [];
const metrics: string[] = [];
const durations: string[] = [];
const shadows: string[] = [];
/** Tokens carrying no native meaning (font stacks, easing curves, `none`). */
const skipped: string[] = [];

const doc = (token: string, extra?: string) =>
    `        /// Web token: \`--${token}\`${extra ? ` — ${extra}` : ''}`;

for (const { token, light, dark } of pairs) {
    const name = swiftName(token);

    // Shadows first: `0 1px 2px rgba(…)` would otherwise fall through as text.
    if (token === 'shadow' || token.startsWith('shadow-')) {
        if (light === 'none') { skipped.push(token); continue; }
        const l = SHADOW.exec(light);
        const d = SHADOW.exec(dark);
        if (!l || !d) { skipped.push(token); continue; }
        const lc = parseColor(l[4]!.trim());
        const dc = parseColor(d[4]!.trim());
        if (!lc || !dc) { skipped.push(token); continue; }
        shadows.push(
            doc(token),
            `        static let ${name} = Shadow(`,
            `            color: dynamicColor(light: ${hexLiteral(lc)}, lightAlpha: ${lc.a}, dark: ${hexLiteral(dc)}, darkAlpha: ${dc.a}),`,
            // CSS blur radius is roughly twice SwiftUI's Gaussian radius.
            `            radius: ${num(Number(l[3]) / 2)},`,
            `            x: ${num(Number(l[1]))},`,
            `            y: ${num(Number(l[2]))}`,
            `        )`,
            '',
        );
        continue;
    }

    const lightColor = parseColor(light);
    const darkColor = parseColor(dark);
    if (lightColor && darkColor) {
        const same = light === dark ? ' (identical in both appearances)' : undefined;
        colors.push(
            doc(token, same),
            `        static let ${name} = dynamicColor(`,
            `            light: ${hexLiteral(lightColor)}, lightAlpha: ${lightColor.a},`,
            `            dark: ${hexLiteral(darkColor)}, darkAlpha: ${darkColor.a}`,
            `        )`,
            '',
        );
        continue;
    }

    const px = PX.exec(light);
    const pxDark = PX.exec(dark);
    if (px && pxDark) {
        const line = [
            doc(token),
            scalarDecl(name, 'CGFloat', Number(px[1]), Number(pxDark[1])),
            '',
        ];
        (token === 'radius' || token.startsWith('radius-') || token.endsWith('-radius')
            ? radii
            : metrics
        ).push(...line);
        continue;
    }

    const ms = MS.exec(light);
    const msDark = MS.exec(dark);
    if (ms && msDark) {
        durations.push(
            doc(token),
            scalarDecl(name, 'Double', Number(ms[1]) / 1000, Number(msDark[1]) / 1000),
            '',
        );
        continue;
    }

    if (NUMBER.test(light) && NUMBER.test(dark)) {
        metrics.push(
            doc(token),
            scalarDecl(name, 'Double', Number(light), Number(dark)),
            '',
        );
        continue;
    }

    skipped.push(token);
}

const trim = (lines: string[]) => lines.join('\n').replace(/\n+$/, '');

const header = `// GENERATED — DO NOT EDIT.
//
// Source of truth: ../../../src/theme.ts (the web client's "Clubhouse
// scorecard" theme). Regenerate with \`bun run generate:theme\` from the repo
// root, and commit the result alongside the theme change that caused it.
// Generator: scripts/generate-theme-swift.ts
//
// Every colour is DYNAMIC: it resolves through the trait collection, so the app
// follows the system appearance the same way \`[data-theme]\` follows
// \`prefers-color-scheme\` on the web. Token names mirror the web's, with the
// original \`--kebab-case\` name in each doc comment so drift is greppable.
//
// Tokens with no native meaning are intentionally absent:
// ${skipped.map((t) => `--${t}`).join(', ')}.

import SwiftUI
import UIKit

/// The web theme's token tables, as SwiftUI values.
enum ThemeTokens {
    /// A CSS \`box-shadow\` expressed for \`View.shadow(color:radius:x:y:)\`.
    ///
    /// CSS blur is roughly twice SwiftUI's Gaussian radius, so \`radius\` is the
    /// CSS blur halved; \`x\` / \`y\` carry over unchanged.
    struct Shadow: Equatable, Sendable {
        let color: Color
        let radius: CGFloat
        let x: CGFloat
        let y: CGFloat
    }

    /// Colour tokens.
    enum Colors {
${trim(colors)}
    }

    /// Corner radii.
    enum Radius {
${trim(radii)}
    }

    /// Non-radius lengths, weights and opacities.
    enum Metrics {
${trim(metrics)}
    }

    /// Transition durations, in seconds.
    enum Durations {
${trim(durations)}
    }

    /// Elevation.
    enum Shadows {
${trim(shadows)}
    }
}

/// Short spellings used throughout \`DesignSystem/\` and the feature screens.
typealias TapColors = ThemeTokens.Colors
typealias TapRadius = ThemeTokens.Radius
typealias TapMetrics = ThemeTokens.Metrics
typealias TapDurations = ThemeTokens.Durations
typealias TapShadows = ThemeTokens.Shadows

/// Build a colour that resolves per appearance.
///
/// \`UIColor(dynamicProvider:)\` rather than an asset catalog: the values are
/// generated, and a generated \`.xcassets\` tree is far harder to review than a
/// generated Swift file.
private func dynamicColor(
    light: UInt32,
    lightAlpha: Double = 1,
    dark: UInt32,
    darkAlpha: Double = 1
) -> Color {
    Color(uiColor: UIColor { traits in
        traits.userInterfaceStyle == .dark
            ? UIColor(rgb: dark, alpha: darkAlpha)
            : UIColor(rgb: light, alpha: lightAlpha)
    })
}

/// Resolve a NON-colour token that differs between the two appearances.
///
/// Colours get \`UIColor(dynamicProvider:)\`, which UIKit re-resolves whenever the
/// trait collection changes. A bare \`Double\` has no such hook, so the value is
/// read from \`UITraitCollection.current\` at the point of use — which SwiftUI
/// sets while it evaluates a view's \`body\`, so a token read inside a body
/// follows the appearance the same way a colour does.
///
/// Read it in a \`body\` (or anywhere else with a live trait environment). Read
/// from a background thread or at static-initialiser time it falls back to the
/// light value, which is the same behaviour the previous light-only constants
/// had — never worse, and correct wherever it matters.
private func dynamicScalar(light: Double, dark: Double) -> Double {
    UITraitCollection.current.userInterfaceStyle == .dark ? dark : light
}

private extension UIColor {
    convenience init(rgb: UInt32, alpha: Double) {
        self.init(
            red: CGFloat((rgb >> 16) & 0xff) / 255,
            green: CGFloat((rgb >> 8) & 0xff) / 255,
            blue: CGFloat(rgb & 0xff) / 255,
            alpha: CGFloat(alpha)
        )
    }
}
`;

const outPath = new URL('../ios/TapScore/DesignSystem/ThemeTokens.swift', import.meta.url);
await Bun.write(outPath, header);
console.log(
    `wrote ${outPath.pathname} — ${colors.length > 0 ? pairs.length : 0} tokens `
    + `(${(colors.length / 6) | 0} colours, ${(radii.length / 3) | 0} radii, `
    + `${(shadows.length / 8) | 0} shadows, ${skipped.length} skipped)`,
);
