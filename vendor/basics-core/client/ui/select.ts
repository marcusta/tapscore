import { Component, Signal, effect, batch, type Readable } from '../core';

export type SelectOption = {
    value: string;
    label: string;
    icon?: string;
};

export type SelectProps = {
    value: Signal<string>;
    options: SelectOption[] | Readable<SelectOption[]>;
    placeholder?: string;
    disabled?: Readable<boolean> | boolean;
    zIndex?: number;
};

function isReadable<T>(v: unknown): v is Readable<T> {
    return typeof v === 'object' && v !== null && typeof (v as { get?: unknown }).get === 'function';
}

const t = (name: string) => `var(--${name})`;

export class SelectComponent extends Component<SelectProps> {
    static styles = `
        .ui-select {
            position: relative;
            display: inline-block;
        }
        .ui-select__trigger {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            padding: 6px 10px;
            min-width: 160px;
            width: 100%;
            border: 1px solid ${t('border')};
            border-radius: ${t('radius')};
            background: ${t('input-bg')};
            color: ${t('text')};
            font-family: inherit;
            font-size: inherit;
            cursor: pointer;
            text-align: left;
            line-height: 1.5;
        }
        .ui-select__trigger:focus-visible {
            outline: 2px solid ${t('primary')};
            outline-offset: 1px;
        }
        .ui-select__trigger--placeholder {
            color: ${t('text-muted')};
        }
        .ui-select__trigger--disabled {
            opacity: 0.5;
            pointer-events: none;
        }
        .ui-select__trigger-label {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            flex: 1;
        }
        .ui-select__chevron {
            color: ${t('text-muted')};
            font-size: 0.85rem;
            transition: transform 0.15s;
            flex-shrink: 0;
        }
        .ui-select__chevron--open {
            transform: rotate(180deg);
        }
        .ui-select__dropdown {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            margin-top: 4px;
            min-width: 100%;
            background: ${t('surface')};
            border: 1px solid ${t('border')};
            border-radius: ${t('radius')};
            box-shadow: ${t('shadow-elevated')};
            padding: 4px 0;
            opacity: 0;
            pointer-events: none;
            transform: scale(0.95);
            transition: opacity 0.15s, transform 0.15s;
            overflow-y: auto;
            max-height: 240px;
        }
        .ui-select__dropdown.open {
            opacity: 1;
            pointer-events: auto;
            transform: scale(1);
        }
        .ui-select__option {
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
        .ui-select__option:focus-visible {
            outline: none;
        }
        .ui-select__option--highlighted {
            background: ${t('hover-bg')};
        }
        .ui-select__option--selected {
            color: ${t('primary')};
            font-weight: 600;
        }
        .ui-select__option-icon {
            flex-shrink: 0;
        }
        .ui-select__option-label {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .ui-select__check {
            flex-shrink: 0;
            font-size: 0.75rem;
            color: ${t('primary')};
        }
    `;

    private open = new Signal(false);
    private highlightIndex = new Signal(-1);
    private wrapperEl!: HTMLElement;
    private triggerEl!: HTMLButtonElement;
    private dropdownEl!: HTMLElement;
    private optionEls: HTMLButtonElement[] = [];

    // Close when a pointer press lands anywhere outside this select. A document
    // capture listener (added only while open) is reliable across stacking
    // contexts and makes opening one select close any other — unlike a
    // per-instance transparent backdrop, whose z-order is fragile when several
    // selects coexist.
    private onOutsidePointer = (e: Event): void => {
        if (!this.wrapperEl.contains(e.target as Node)) {
            this.open.set(false);
        }
    };

    render(): HTMLElement {
        const wrapper = document.createElement('div');
        wrapper.className = 'ui-select';
        this.wrapperEl = wrapper;

        const zIndex = this.props.zIndex ?? 50;

        // Trigger button
        this.triggerEl = document.createElement('button');
        this.triggerEl.className = 'ui-select__trigger';
        this.triggerEl.setAttribute('type', 'button');
        this.triggerEl.setAttribute('role', 'combobox');
        this.triggerEl.setAttribute('aria-haspopup', 'listbox');

        const labelSpan = document.createElement('span');
        labelSpan.className = 'ui-select__trigger-label';
        this.triggerEl.appendChild(labelSpan);

        const chevron = document.createElement('span');
        chevron.className = 'ui-select__chevron';
        chevron.textContent = '\u25BE';
        chevron.setAttribute('aria-hidden', 'true');
        this.triggerEl.appendChild(chevron);

        this.triggerEl.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });

        this.triggerEl.addEventListener('keydown', (e) => {
            this.handleTriggerKeydown(e);
        });

        wrapper.appendChild(this.triggerEl);

        // Dropdown panel
        this.dropdownEl = document.createElement('div');
        this.dropdownEl.className = 'ui-select__dropdown';
        this.dropdownEl.setAttribute('role', 'listbox');
        this.dropdownEl.style.zIndex = String(zIndex);

        this.dropdownEl.addEventListener('keydown', (e) => {
            this.handleDropdownKeydown(e);
        });

        wrapper.appendChild(this.dropdownEl);

        // Build options — reactive if Signal
        const buildOptions = (options: SelectOption[]) => {
            this.optionEls = [];
            this.dropdownEl.textContent = '';

            for (let i = 0; i < options.length; i++) {
                const opt = options[i];
                const btn = document.createElement('button');
                btn.className = 'ui-select__option';
                btn.setAttribute('type', 'button');
                btn.setAttribute('role', 'option');
                btn.id = `ui-select-opt-${i}`;

                if (opt.icon) {
                    const iconSpan = document.createElement('span');
                    iconSpan.className = 'ui-select__option-icon';
                    iconSpan.textContent = opt.icon;
                    btn.appendChild(iconSpan);
                }

                const labelEl = document.createElement('span');
                labelEl.className = 'ui-select__option-label';
                labelEl.textContent = opt.label;
                btn.appendChild(labelEl);

                const checkEl = document.createElement('span');
                checkEl.className = 'ui-select__check';
                checkEl.setAttribute('aria-hidden', 'true');
                btn.appendChild(checkEl);

                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.selectOption(opt.value);
                });

                btn.addEventListener('mouseenter', () => {
                    this.highlightIndex.set(i);
                });

                this.dropdownEl.appendChild(btn);
                this.optionEls.push(btn);
            }
        };

        if (isReadable(this.props.options)) {
            this.track(effect(() => {
                const opts = isReadable(this.props.options)
                    ? this.props.options.get()
                    : this.props.options;
                buildOptions(opts);
            }));
        } else {
            buildOptions(this.props.options);
        }

        // Effect: update trigger label and selected state on value change
        this.track(effect(() => {
            const val = this.props.value.get();
            const options = isReadable(this.props.options)
                ? this.props.options.get()
                : this.props.options;
            const selected = options.find(o => o.value === val);

            if (selected) {
                labelSpan.textContent = selected.icon
                    ? `${selected.icon} ${selected.label}`
                    : selected.label;
                this.triggerEl.classList.remove('ui-select__trigger--placeholder');
            } else {
                labelSpan.textContent = this.props.placeholder ?? '';
                this.triggerEl.classList.toggle(
                    'ui-select__trigger--placeholder',
                    !!this.props.placeholder,
                );
            }

            // Update aria-selected and check marks
            for (let i = 0; i < options.length; i++) {
                const btn = this.optionEls[i];
                if (!btn) continue;
                const isSelected = options[i].value === val;
                btn.setAttribute('aria-selected', String(isSelected));
                btn.classList.toggle('ui-select__option--selected', isSelected);
                const check = btn.querySelector('.ui-select__check') as HTMLElement;
                if (check) check.textContent = isSelected ? '\u2713' : '';
            }
        }));

        // Effect: toggle open state
        this.track(effect(() => {
            const isOpen = this.open.get();
            this.dropdownEl.classList.toggle('open', isOpen);
            chevron.classList.toggle('ui-select__chevron--open', isOpen);
            this.triggerEl.setAttribute('aria-expanded', String(isOpen));

            // Outside-click-to-close: only listen while open. Capture phase, so
            // it fires before the just-clicked element can swallow the event.
            if (isOpen) {
                document.addEventListener('pointerdown', this.onOutsidePointer, true);
            } else {
                document.removeEventListener('pointerdown', this.onOutsidePointer, true);
            }

            if (isOpen) {
                // Highlight the currently selected option, or first
                const options = isReadable(this.props.options)
                    ? this.props.options.get()
                    : this.props.options;
                const val = this.props.value.get();
                const idx = options.findIndex(o => o.value === val);
                this.highlightIndex.set(idx >= 0 ? idx : 0);
            }
        }));

        // Effect: highlight management
        this.track(effect(() => {
            const idx = this.highlightIndex.get();
            for (let i = 0; i < this.optionEls.length; i++) {
                this.optionEls[i].classList.toggle(
                    'ui-select__option--highlighted',
                    i === idx,
                );
            }
            if (idx >= 0 && this.optionEls[idx]) {
                this.triggerEl.setAttribute('aria-activedescendant', `ui-select-opt-${idx}`);
                this.optionEls[idx].scrollIntoView({ block: 'nearest' });
            }
        }));

        // Effect: disabled state
        if (this.props.disabled != null) {
            if (isReadable(this.props.disabled)) {
                this.track(effect(() => {
                    const dis = (this.props.disabled as Signal<boolean>).get();
                    this.triggerEl.classList.toggle('ui-select__trigger--disabled', dis);
                    this.triggerEl.disabled = dis;
                }));
            } else if (this.props.disabled) {
                this.triggerEl.classList.add('ui-select__trigger--disabled');
                this.triggerEl.disabled = true;
            }
        }

        return wrapper;
    }

    private toggle(): void {
        this.open.update(v => !v);
    }

    private selectOption(value: string): void {
        batch(() => {
            this.props.value.set(value);
            this.open.set(false);
        });
        this.triggerEl.focus();
    }

    private handleTriggerKeydown(e: KeyboardEvent): void {
        switch (e.key) {
            case 'Enter':
            case ' ':
                e.preventDefault();
                this.toggle();
                break;
            case 'ArrowDown':
                e.preventDefault();
                if (!this.open.get()) {
                    this.open.set(true);
                } else {
                    this.moveHighlight(1);
                }
                break;
            case 'ArrowUp':
                e.preventDefault();
                if (!this.open.get()) {
                    this.open.set(true);
                } else {
                    this.moveHighlight(-1);
                }
                break;
            case 'Escape':
                if (this.open.get()) {
                    e.preventDefault();
                    this.open.set(false);
                }
                break;
        }
    }

    private handleDropdownKeydown(e: KeyboardEvent): void {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.moveHighlight(1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.moveHighlight(-1);
                break;
            case 'Enter':
            case ' ': {
                e.preventDefault();
                const idx = this.highlightIndex.get();
                const options = isReadable(this.props.options)
                    ? this.props.options.get()
                    : this.props.options;
                if (idx >= 0 && idx < options.length) {
                    this.selectOption(options[idx].value);
                }
                break;
            }
            case 'Escape':
                e.preventDefault();
                this.open.set(false);
                this.triggerEl.focus();
                break;
            case 'Tab':
                this.open.set(false);
                break;
        }
    }

    private moveHighlight(delta: number): void {
        const options = isReadable(this.props.options)
            ? this.props.options.get()
            : this.props.options;
        if (options.length === 0) return;

        const current = this.highlightIndex.get();
        let next = current + delta;
        if (next < 0) next = options.length - 1;
        if (next >= options.length) next = 0;
        this.highlightIndex.set(next);
    }

    onDestroy(): void {
        document.removeEventListener('pointerdown', this.onOutsidePointer, true);
    }
}
