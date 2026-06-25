import { Component, Signal, effect } from '../core';
import type { SlotContent } from '../core';
import { OverlayComponent } from './overlay';

export type DrawerProps = {
    open: Signal<boolean>;
    side?: 'left' | 'right';
    width?: string;
    zIndex?: number;
    overlayBg?: string;
    content?: SlotContent;
};

const t = (name: string) => `var(--${name})`;

export class DrawerComponent extends Component<DrawerProps> {
    static styles = `
        .ui-drawer {
            position: fixed;
            top: 0;
            bottom: 0;
            background: ${t('surface')};
            box-shadow: none;
            transition: transform 0.25s ease;
            overflow-y: auto;
        }
        .ui-drawer--left {
            left: 0;
            transform: translateX(-100%);
        }
        .ui-drawer--right {
            right: 0;
            transform: translateX(100%);
        }
        .ui-drawer.open {
            box-shadow: ${t('shadow-elevated')};
        }
        .ui-drawer--left.open {
            transform: translateX(0);
        }
        .ui-drawer--right.open {
            transform: translateX(0);
        }
    `;

    private panel!: HTMLElement;

    render(): HTMLElement {
        const wrapper = document.createElement('div');
        const zIndex = this.props.zIndex ?? 100;
        const side = this.props.side ?? 'left';

        // Overlay
        this.spawn(OverlayComponent, wrapper, {
            open: this.props.open,
            bg: this.props.overlayBg ?? 'rgba(0,0,0,0.4)',
            zIndex: zIndex - 1,
            scrollLock: true,
        });

        // Panel
        this.panel = document.createElement('div');
        this.panel.className = `ui-drawer ui-drawer--${side}`;
        this.panel.style.width = this.props.width ?? '280px';
        this.panel.style.zIndex = String(zIndex);
        wrapper.appendChild(this.panel);

        // Content via slot
        if (this.props.content != null) {
            const contentHost = document.createElement('div');
            contentHost.setAttribute('bind', 'content');
            this.panel.appendChild(contentHost);
            // Use slot projection manually since we build DOM imperatively
            this.projectContent(contentHost, this.props.content);
        }

        // Toggle open class
        this.track(effect(() => {
            this.panel.classList.toggle('open', this.props.open.get());
        }));

        return wrapper;
    }

    private projectContent(host: HTMLElement, content: SlotContent): void {
        if (typeof content === 'string') {
            host.textContent = content;
        } else if (typeof content === 'function' && content.prototype instanceof Component) {
            this.spawn(content as unknown as new () => Component<any>, host);
        } else if (typeof content === 'function') {
            (content as (host: HTMLElement, ctx: { spawn: Function; track: (d: () => void) => void }) => void)(host, {
                spawn: <T extends Component<any>>(
                    Ctor: new (...args: any[]) => T,
                    h: HTMLElement,
                    ...args: any[]
                ) => this.spawn(Ctor, h, ...args as any),
                track: (d: () => void) => this.track(d),
            });
        }
    }
}
