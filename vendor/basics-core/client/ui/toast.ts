import { Component, Signal } from '../core';

// ─── Types ──────────────────────────────────────────────────────

export type ToastVariant = 'info' | 'success' | 'error';

export type ToastOptions = {
    message: string;
    variant?: ToastVariant;
    duration?: number;
};

export type ToastItem = {
    id: string;
    message: string;
    variant: ToastVariant;
};

// ─── ToastService ───────────────────────────────────────────────

let nextId = 1;

export class ToastService {
    readonly items = new Signal<ToastItem[]>([]);
    private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();

    show(opts: ToastOptions): void {
        const id = String(nextId++);
        const variant = opts.variant ?? 'info';
        const duration = opts.duration ?? 3000;

        const item: ToastItem = { id, message: opts.message, variant };
        this.items.update(list => [...list, item]);

        if (duration > 0) {
            const timer = setTimeout(() => this.dismiss(id), duration);
            this.timers.set(id, timer);
        }
    }

    dismiss(id: string): void {
        const timer = this.timers.get(id);
        if (timer != null) {
            clearTimeout(timer);
            this.timers.delete(id);
        }
        this.items.update(list => list.filter(t => t.id !== id));
    }
}

// ─── ToastContainer ─────────────────────────────────────────────

const t = (name: string) => `var(--${name})`;

export class ToastContainer extends Component {
    static styles = `
        .ui-toast-container {
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 8px;
            pointer-events: none;
        }
        .ui-toast {
            max-width: 360px;
            min-width: 240px;
            padding: 12px 16px;
            background: ${t('surface')};
            border: 1px solid ${t('border')};
            border-radius: ${t('radius')};
            box-shadow: ${t('shadow-elevated')};
            display: flex;
            align-items: flex-start;
            gap: 8px;
            pointer-events: auto;
            opacity: 0;
            transform: translateX(100%);
            transition: opacity 0.2s ease, transform 0.2s ease;
        }
        .ui-toast.ui-toast--visible {
            opacity: 1;
            transform: translateX(0);
        }
        .ui-toast--info {
            border-left: 3px solid ${t('primary')};
        }
        .ui-toast--success {
            border-left: 3px solid ${t('primary')};
        }
        .ui-toast--error {
            border-left: 3px solid ${t('error')};
        }
        .ui-toast__message {
            flex: 1;
            color: ${t('text')};
            font-size: 0.875rem;
            line-height: 1.4;
        }
        .ui-toast__close {
            background: none;
            border: none;
            color: ${t('text-muted')};
            cursor: pointer;
            padding: 0;
            font-size: 1rem;
            line-height: 1;
            flex-shrink: 0;
        }
        .ui-toast__close:hover {
            color: ${t('text')};
        }
    `;

    private svc!: ToastService;

    render(): HTMLElement {
        this.svc = this.inject(ToastService);

        const container = document.createElement('div');
        container.className = 'ui-toast-container';

        this.$each(
            container,
            this.svc.items,
            (item, _index, track) => {
                const el = document.createElement('div');
                el.className = `ui-toast ui-toast--${item.variant}`;

                const msg = document.createElement('span');
                msg.className = 'ui-toast__message';
                msg.textContent = item.message;
                el.appendChild(msg);

                const closeBtn = document.createElement('button');
                closeBtn.className = 'ui-toast__close';
                closeBtn.textContent = '\u00d7';
                closeBtn.setAttribute('aria-label', 'Dismiss');
                closeBtn.addEventListener('click', () => this.svc.dismiss(item.id));
                el.appendChild(closeBtn);

                // Trigger enter animation after the element is in the DOM
                requestAnimationFrame(() => {
                    el.classList.add('ui-toast--visible');
                });

                return el;
            },
            (item) => item.id,
        );

        return container;
    }
}
