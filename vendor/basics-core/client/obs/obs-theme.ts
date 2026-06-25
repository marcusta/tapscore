import { neutralLight, neutralDark } from '../default-theme';

let injected = false;

/**
 * Inject obs-scoped theme tokens. Uses CSS @scope so tokens override
 * the app theme inside .obs-shell by scoping proximity.
 * First caller wins — call with overrides before the obs shell lazy-loads.
 */
export function injectObsTheme(
    light?: Partial<typeof neutralLight>,
    dark?: Partial<typeof neutralDark>,
): void {
    if (injected) return;
    injected = true;

    const l = { ...neutralLight, ...light } as Record<string, string>;
    const d = { ...neutralDark, ...dark } as Record<string, string>;

    const toVars = (obj: Record<string, string>) =>
        Object.entries(obj).map(([k, v]) => `--${k}:${v}`).join(';');

    const style = document.createElement('style');
    style.textContent =
        `@scope ([data-theme="light"] .obs-shell) { :scope { ${toVars(l)} } }` +
        `@scope ([data-theme="dark"] .obs-shell) { :scope { ${toVars(d)} } }`;
    document.head.appendChild(style);
}
