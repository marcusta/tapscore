import { Component, effect } from '../core';

const t = (name: string) => `var(--${name})`;

export type BadgeProps = {
    text: string | (() => string);
    bg?: string | (() => string);
    color?: string;
};

/** CSS recipe for an inline badge label. */
export const badge = () => `
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    font-size: 0.75rem;
    font-weight: 600;
    border-radius: ${t('radius-pill')};
    line-height: 1.4;
`;

export class BadgeComponent extends Component<BadgeProps> {
    static styles = `
        .ui-badge {
            display: inline-flex;
            align-items: center;
            padding: 2px 8px;
            font-size: 0.75rem;
            font-weight: 600;
            border-radius: ${t('radius-pill')};
            line-height: 1.4;
        }
    `;

    render(): HTMLElement {
        const el = document.createElement('span');
        el.className = 'ui-badge';
        el.style.color = this.props.color ?? '#fff';

        const resolve = (v: string | (() => string) | undefined): string =>
            typeof v === 'function' ? v() : v ?? '';

        // Reactive text
        if (typeof this.props.text === 'function') {
            this.track(effect(() => { el.textContent = resolve(this.props.text); }));
        } else {
            el.textContent = this.props.text;
        }

        // Reactive background
        if (this.props.bg !== undefined) {
            if (typeof this.props.bg === 'function') {
                this.track(effect(() => { el.style.background = resolve(this.props.bg); }));
            } else {
                el.style.background = this.props.bg;
            }
        }

        return el;
    }
}
