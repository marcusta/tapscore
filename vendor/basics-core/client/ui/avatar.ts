import { Component, effect } from '../core';

export type AvatarProps = {
    size?: number;
    initials?: string | (() => string);
    bg?: string | (() => string);
    color?: string;
    src?: string | (() => string);
    showOverlay?: boolean;
    fontSize?: string;
};

/** CSS recipe for a simple initials-only avatar circle. */
export const avatar = (size = 40) => `
    width: ${size}px;
    height: ${size}px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: ${Math.round(size * 0.4)}px;
    font-weight: 600;
    flex-shrink: 0;
`;

export class AvatarComponent extends Component<AvatarProps> {
    static styles = `
        .ui-avatar {
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            overflow: hidden;
            flex-shrink: 0;
        }
        .ui-avatar__initials {
            font-weight: 600;
            user-select: none;
            z-index: 1;
        }
        .ui-avatar__img {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            z-index: 2;
        }
        .ui-avatar__img.overlay {
            z-index: 0;
        }
        .ui-avatar__img.hidden {
            display: none;
        }
    `;

    render(): HTMLElement {
        const size = this.props.size ?? 40;
        const el = document.createElement('div');
        el.className = 'ui-avatar';
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.fontSize = this.props.fontSize ?? `${Math.round(size * 0.4)}px`;
        el.style.color = this.props.color ?? '#fff';

        const span = document.createElement('span');
        span.className = 'ui-avatar__initials';
        el.appendChild(span);

        const resolve = (v: string | (() => string) | undefined): string =>
            typeof v === 'function' ? v() : v ?? '';

        // Reactive initials
        if (this.props.initials !== undefined) {
            if (typeof this.props.initials === 'function') {
                this.track(effect(() => { span.textContent = resolve(this.props.initials); }));
            } else {
                span.textContent = this.props.initials;
            }
        }

        // Reactive background
        if (this.props.bg !== undefined) {
            if (typeof this.props.bg === 'function') {
                this.track(effect(() => { el.style.background = resolve(this.props.bg); }));
            } else {
                el.style.background = this.props.bg;
            }
        }

        // Image
        if (this.props.src !== undefined) {
            const img = document.createElement('img');
            img.className = 'ui-avatar__img';
            if (this.props.showOverlay) img.classList.add('overlay');

            img.addEventListener('error', () => {
                img.classList.add('hidden');
            });

            if (typeof this.props.src === 'function') {
                this.track(effect(() => {
                    const url = resolve(this.props.src);
                    if (url) {
                        img.src = url;
                        img.classList.remove('hidden');
                    } else {
                        img.classList.add('hidden');
                    }
                }));
            } else {
                img.src = this.props.src;
            }

            el.appendChild(img);
        }

        return el;
    }
}
