import { Component, Signal, effect } from '../core';

export type TabItem = {
    key: string;
    label: string;
    icon?: string;
};

export type TabsProps = {
    active: Signal<string>;
    tabs: TabItem[];
    variant?: 'underline' | 'pill';
};

const t = (name: string) => `var(--${name})`;

export class TabsComponent extends Component<TabsProps> {
    static styles = `
        .ui-tabs {
            display: flex;
            gap: 0;
            border-bottom: 1px solid ${t('border')};
        }
        .ui-tabs--pill {
            gap: 4px;
            border-bottom: none;
            background: ${t('hover-bg')};
            border-radius: ${t('radius')};
            padding: 4px;
        }
        .ui-tabs__tab {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 16px;
            font-size: 0.875rem;
            font-family: inherit;
            cursor: pointer;
            border: none;
            background: none;
            color: ${t('text-muted')};
            transition: background 0.15s, border-color 0.15s, color 0.15s;
        }
        /* Underline variant */
        .ui-tabs--underline .ui-tabs__tab {
            border-bottom: 2px solid transparent;
            margin-bottom: -1px;
        }
        .ui-tabs--underline .ui-tabs__tab:hover {
            background: ${t('hover-bg')};
        }
        .ui-tabs--underline .ui-tabs__tab.active {
            color: ${t('primary')};
            border-bottom-color: ${t('primary')};
        }
        /* Pill variant */
        .ui-tabs--pill .ui-tabs__tab {
            border-radius: ${t('radius-pill')};
        }
        .ui-tabs--pill .ui-tabs__tab:hover {
            background: ${t('border')};
        }
        .ui-tabs--pill .ui-tabs__tab.active {
            background: ${t('primary')};
            color: ${t('primary-text')};
        }
    `;

    private nav!: HTMLElement;
    private buttons: HTMLButtonElement[] = [];

    render(): HTMLElement {
        const variant = this.props.variant ?? 'underline';

        this.nav = document.createElement('nav');
        this.nav.className = `ui-tabs ui-tabs--${variant}`;
        this.nav.setAttribute('role', 'tablist');

        for (const tab of this.props.tabs) {
            const btn = document.createElement('button');
            btn.className = 'ui-tabs__tab';
            btn.setAttribute('role', 'tab');
            btn.setAttribute('data-key', tab.key);

            if (tab.icon) {
                const iconSpan = document.createElement('span');
                iconSpan.textContent = tab.icon;
                btn.appendChild(iconSpan);
            }

            const labelSpan = document.createElement('span');
            labelSpan.textContent = tab.label;
            btn.appendChild(labelSpan);

            btn.addEventListener('click', () => {
                this.props.active.set(tab.key);
            });

            this.buttons.push(btn);
            this.nav.appendChild(btn);
        }

        // Track active signal to toggle .active class and aria-selected
        this.track(effect(() => {
            const active = this.props.active.get();
            for (const btn of this.buttons) {
                const isActive = btn.getAttribute('data-key') === active;
                btn.classList.toggle('active', isActive);
                btn.setAttribute('aria-selected', String(isActive));
            }
        }));

        return this.nav;
    }
}
