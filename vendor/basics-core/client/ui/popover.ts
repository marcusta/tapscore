import { Component, Signal, effect } from '../core';
import type { SlotContent, SlotContext, PropsOf } from '../core';
import { OverlayComponent } from './overlay';

export type PopoverPlacement = 'top' | 'bottom' | 'left' | 'right';

export type PopoverProps = {
    open: Signal<boolean>;
    anchor: string;
    placement?: PopoverPlacement;
    content?: SlotContent;
    zIndex?: number;
    closeOnClickOutside?: boolean;
    overlayBg?: string;
    width?: string;
};

const t = (name: string) => `var(--${name})`;

const POSITION_AREA: Record<PopoverPlacement, string> = {
    bottom: 'bottom span-all',
    top: 'top span-all',
    left: 'left',
    right: 'right',
};

const FALLBACK_ORDER: Record<PopoverPlacement, string> = {
    bottom: '--pop-top, --pop-left, --pop-right',
    top: '--pop-bottom, --pop-left, --pop-right',
    left: '--pop-right, --pop-top, --pop-bottom',
    right: '--pop-left, --pop-top, --pop-bottom',
};

export class PopoverComponent extends Component<PopoverProps> {
    static styles = `
        @position-try --pop-top {
            position-area: top span-all;
        }
        @position-try --pop-bottom {
            position-area: bottom span-all;
        }
        @position-try --pop-left {
            position-area: left;
        }
        @position-try --pop-right {
            position-area: right;
        }

        .ui-popover {
            position: fixed;
            background: ${t('surface')};
            border: 1px solid ${t('border')};
            border-radius: ${t('radius')};
            box-shadow: ${t('shadow-elevated')};
            padding: 12px;
            opacity: 0;
            pointer-events: none;
            transform: scale(0.95);
            transition: opacity 0.15s, transform 0.15s;
        }
        .ui-popover.open {
            opacity: 1;
            pointer-events: auto;
            transform: scale(1);
        }
    `;

    private popoverEl!: HTMLElement;

    render(): HTMLElement {
        const wrapper = document.createElement('div');
        const zIndex = this.props.zIndex ?? 50;
        const placement = this.props.placement ?? 'bottom';
        const closeOnClickOutside = this.props.closeOnClickOutside ?? true;

        // Overlay for click-outside-to-close
        if (closeOnClickOutside) {
            this.spawn(OverlayComponent, wrapper, {
                open: this.props.open,
                bg: this.props.overlayBg ?? 'transparent',
                zIndex: zIndex - 1,
            });
        }

        // Popover panel
        this.popoverEl = document.createElement('div');
        this.popoverEl.className = 'ui-popover';
        this.popoverEl.style.zIndex = String(zIndex);

        // CSS Anchor Positioning
        this.popoverEl.style.positionAnchor = this.props.anchor;
        this.popoverEl.style.positionArea = POSITION_AREA[placement];
        this.popoverEl.style.positionTryFallbacks = FALLBACK_ORDER[placement];

        if (this.props.width) {
            this.popoverEl.style.width = this.props.width;
        }

        wrapper.appendChild(this.popoverEl);

        // Content via SlotContent projection
        if (this.props.content != null) {
            const contentHost = document.createElement('div');
            contentHost.setAttribute('bind', 'content');
            this.popoverEl.appendChild(contentHost);
            this.projectContent(contentHost, this.props.content);
        }

        // Toggle open class
        this.track(effect(() => {
            this.popoverEl.classList.toggle('open', this.props.open.get());
        }));

        return wrapper;
    }

    private projectContent(host: HTMLElement, content: SlotContent): void {
        if (typeof content === 'string') {
            host.textContent = content;
        } else if (typeof content === 'function' && content.prototype instanceof Component) {
            this.spawn(content as unknown as new () => Component<any>, host);
        } else if (typeof content === 'function') {
            (content as (host: HTMLElement, ctx: SlotContext) => void)(host, {
                spawn: <T extends Component<any>>(
                    Ctor: new (...args: any[]) => T,
                    h: HTMLElement,
                    ...args: {} extends PropsOf<T> ? [props?: PropsOf<T>] : [props: PropsOf<T>]
                ) => this.spawn(Ctor, h, ...args),
                track: (d: () => void) => this.track(d),
            });
        }
    }
}
