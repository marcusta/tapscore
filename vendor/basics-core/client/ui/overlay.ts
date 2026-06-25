import { Component, Signal, effect } from '../core';

export type OverlayProps = {
    open: Signal<boolean>;
    bg?: string;
    zIndex?: number;
    scrollLock?: boolean;
    onclose?: () => void;
};

export class OverlayComponent extends Component<OverlayProps> {
    static styles = `
        .ui-overlay {
            position: fixed;
            inset: 0;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s;
        }
        .ui-overlay.open {
            opacity: 1;
            pointer-events: auto;
        }
    `;

    private el!: HTMLElement;

    render(): HTMLElement {
        this.el = document.createElement('div');
        this.el.className = 'ui-overlay';
        this.el.style.background = this.props.bg ?? 'rgba(0,0,0,0.4)';
        this.el.style.zIndex = String(this.props.zIndex ?? 50);

        this.el.addEventListener('click', () => {
            if (this.props.onclose) this.props.onclose();
            else this.props.open.set(false);
        });

        this.track(effect(() => {
            const isOpen = this.props.open.get();
            this.el.classList.toggle('open', isOpen);
            if (this.props.scrollLock) {
                document.body.style.overflow = isOpen ? 'hidden' : '';
            }
        }));

        return this.el;
    }

    onDestroy(): void {
        if (this.props.scrollLock) {
            document.body.style.overflow = '';
        }
    }
}
