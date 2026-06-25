import { Component, Signal, effect } from '../core';
import { OverlayComponent } from './overlay';

export type ConfirmProps = {
    open: Signal<boolean>;
    title?: string;
    message: string | (() => string);
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
    onconfirm: () => void;
    oncancel?: () => void;
};

const t = (name: string) => `var(--${name})`;

export class ConfirmComponent extends Component<ConfirmProps> {
    static styles = `
        .ui-confirm {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.95);
            min-width: 320px;
            max-width: 480px;
            background: ${t('surface')};
            border: 1px solid ${t('border')};
            border-radius: ${t('radius')};
            box-shadow: ${t('shadow-elevated')};
            z-index: 200;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.15s, transform 0.15s;
        }
        .ui-confirm.open {
            opacity: 1;
            pointer-events: auto;
            transform: translate(-50%, -50%) scale(1);
        }
        .ui-confirm__title {
            padding: 16px 20px 0;
            margin: 0;
            font-size: 1.125rem;
            font-weight: 600;
            color: ${t('text')};
        }
        .ui-confirm__message {
            padding: 12px 20px 20px;
            margin: 0;
            font-size: 0.9375rem;
            line-height: 1.5;
            color: ${t('text')};
        }
        .ui-confirm__actions {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            padding: 0 20px 16px;
        }
        .ui-confirm__btn {
            padding: 8px 16px;
            font-size: 0.875rem;
            font-family: inherit;
            font-weight: 500;
            border: 1px solid ${t('border')};
            border-radius: ${t('radius')};
            cursor: pointer;
            transition: background 0.15s;
        }
        .ui-confirm__btn--cancel {
            background: ${t('btn-bg')};
            color: ${t('text')};
        }
        .ui-confirm__btn--cancel:hover {
            background: ${t('btn-hover')};
        }
        .ui-confirm__btn--confirm {
            background: ${t('primary')};
            color: #fff;
            border-color: ${t('primary')};
        }
        .ui-confirm__btn--confirm:hover {
            filter: brightness(0.9);
        }
        .ui-confirm__btn--danger {
            background: ${t('error')};
            color: #fff;
            border-color: ${t('error')};
        }
        .ui-confirm__btn--danger:hover {
            filter: brightness(0.9);
        }
    `;

    private dialogEl!: HTMLElement;

    render(): HTMLElement {
        const wrapper = document.createElement('div');

        // Overlay
        this.spawn(OverlayComponent, wrapper, {
            open: this.props.open,
            bg: 'rgba(0,0,0,0.4)',
            zIndex: 199,
            scrollLock: true,
            onclose: () => this.handleCancel(),
        });

        // Dialog card
        this.dialogEl = document.createElement('div');
        this.dialogEl.className = 'ui-confirm';
        this.dialogEl.style.zIndex = '200';

        // Title
        const title = document.createElement('h2');
        title.className = 'ui-confirm__title';
        title.textContent = this.props.title ?? 'Confirm';
        this.dialogEl.appendChild(title);

        // Message
        const message = document.createElement('p');
        message.className = 'ui-confirm__message';
        if (typeof this.props.message === 'function') {
            const msgFn = this.props.message;
            this.track(effect(() => {
                message.textContent = msgFn();
            }));
        } else {
            message.textContent = this.props.message;
        }
        this.dialogEl.appendChild(message);

        // Actions
        const actions = document.createElement('div');
        actions.className = 'ui-confirm__actions';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'ui-confirm__btn ui-confirm__btn--cancel';
        cancelBtn.textContent = this.props.cancelLabel ?? 'Cancel';
        cancelBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleCancel();
        });
        actions.appendChild(cancelBtn);

        const confirmBtn = document.createElement('button');
        confirmBtn.className = this.props.danger
            ? 'ui-confirm__btn ui-confirm__btn--danger'
            : 'ui-confirm__btn ui-confirm__btn--confirm';
        confirmBtn.textContent = this.props.confirmLabel ?? 'Confirm';
        confirmBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.props.open.set(false);
            this.props.onconfirm();
        });
        actions.appendChild(confirmBtn);

        this.dialogEl.appendChild(actions);

        // Prevent clicks on the dialog from reaching the overlay
        this.dialogEl.addEventListener('click', (e) => e.stopPropagation());

        wrapper.appendChild(this.dialogEl);

        // Toggle open class
        this.track(effect(() => {
            this.dialogEl.classList.toggle('open', this.props.open.get());
        }));

        return wrapper;
    }

    private handleCancel(): void {
        this.props.open.set(false);
        if (this.props.oncancel) this.props.oncancel();
    }
}
