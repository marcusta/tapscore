import { Component, Signal, effect } from '../core';
import { OverlayComponent } from './overlay';

export type MenuItem =
    | { type: 'item'; label: string; icon?: string; onclick: () => void }
    | { type: 'label'; text: string }
    | { type: 'divider' };

export type MenuProps = {
    open: Signal<boolean>;
    items: Signal<MenuItem[]> | MenuItem[];
    zIndex?: number;
    closeOnClick?: boolean;
    overlayBg?: string;
};

const t = (name: string) => `var(--${name})`;

export class MenuComponent extends Component<MenuProps> {
    static styles = `
        .ui-menu {
            position: absolute;
            min-width: 180px;
            background: ${t('surface')};
            border: 1px solid ${t('border')};
            border-radius: ${t('radius')};
            box-shadow: ${t('shadow-elevated')};
            padding: 4px 0;
            opacity: 0;
            pointer-events: none;
            transform: scale(0.95);
            transition: opacity 0.15s, transform 0.15s;
            z-index: 51;
        }
        .ui-menu.open {
            opacity: 1;
            pointer-events: auto;
            transform: scale(1);
        }
        .ui-menu__item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            cursor: pointer;
            color: ${t('text')};
            font-size: 0.875rem;
            border: none;
            background: none;
            width: 100%;
            text-align: left;
            font-family: inherit;
        }
        .ui-menu__item > span:first-child:has(svg) {
            display: flex;
            align-items: center;
            color: ${t('text-muted')};
        }
        .ui-menu__item:hover {
            background: ${t('hover-bg')};
        }
        .ui-menu__label {
            padding: 8px 12px 4px;
            font-size: 0.75rem;
            color: ${t('text-muted')};
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .ui-menu__divider {
            height: 1px;
            background: ${t('border')};
            margin: 4px 0;
        }
    `;

    private menuEl!: HTMLElement;

    render(): HTMLElement {
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';

        // Overlay for click-outside-to-close
        this.spawn(OverlayComponent, wrapper, {
            open: this.props.open,
            bg: this.props.overlayBg ?? 'transparent',
            zIndex: (this.props.zIndex ?? 50) - 1,
        });

        this.menuEl = document.createElement('div');
        this.menuEl.className = 'ui-menu';
        this.menuEl.style.zIndex = String(this.props.zIndex ?? 50);
        wrapper.appendChild(this.menuEl);

        const closeOnClick = this.props.closeOnClick ?? true;

        const buildItems = (items: MenuItem[]) => {
            this.menuEl.textContent = '';
            for (const item of items) {
                if (item.type === 'divider') {
                    const div = document.createElement('div');
                    div.className = 'ui-menu__divider';
                    this.menuEl.appendChild(div);
                } else if (item.type === 'label') {
                    const lbl = document.createElement('div');
                    lbl.className = 'ui-menu__label';
                    lbl.textContent = item.text;
                    this.menuEl.appendChild(lbl);
                } else {
                    const btn = document.createElement('button');
                    btn.className = 'ui-menu__item';
                    if (item.icon) {
                        const iconSpan = document.createElement('span');
                        iconSpan.innerHTML = item.icon;
                        btn.appendChild(iconSpan);
                    }
                    const textSpan = document.createElement('span');
                    textSpan.textContent = item.label;
                    btn.appendChild(textSpan);
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        item.onclick();
                        if (closeOnClick) this.props.open.set(false);
                    });
                    this.menuEl.appendChild(btn);
                }
            }
        };

        // Build items — reactive if Signal
        if (this.props.items instanceof Signal) {
            this.track(effect(() => {
                buildItems(this.props.items instanceof Signal ? this.props.items.get() : this.props.items);
            }));
        } else {
            buildItems(this.props.items);
        }

        // Toggle open class
        this.track(effect(() => {
            this.menuEl.classList.toggle('open', this.props.open.get());
        }));

        return wrapper;
    }
}
