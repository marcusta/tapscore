import { Component, Signal, effect } from '../core';

export type CalendarDay = {
    date: Date;
    dayOfMonth: number;
    isToday: boolean;
    isCurrentMonth: boolean;
};

export type CalendarProps = {
    year: Signal<number>;
    month: Signal<number>; // 1-based
    onPrev?: () => void;
    onNext?: () => void;
    renderDay?: (day: CalendarDay, cell: HTMLElement) => void;
    monthNames?: string[];
    dayNames?: string[];
};

const t = (name: string) => `var(--${name})`;

const DEFAULT_MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const DEFAULT_DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export class CalendarComponent extends Component<CalendarProps> {
    static styles = `
        .ui-cal {
            user-select: none;
        }
        .ui-cal__header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 0;
        }
        .ui-cal__title {
            font-weight: 600;
            font-size: 1rem;
            color: ${t('text')};
        }
        .ui-cal__nav {
            background: none;
            border: 1px solid ${t('border')};
            border-radius: ${t('radius-sm')};
            color: ${t('text')};
            cursor: pointer;
            padding: 4px 10px;
            font-size: 1rem;
            line-height: 1;
        }
        .ui-cal__nav:hover {
            background: ${t('hover-bg')};
        }
        .ui-cal__grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 1px;
        }
        .ui-cal__day-name {
            text-align: center;
            font-size: 0.75rem;
            font-weight: 600;
            color: ${t('text-muted')};
            padding: 4px 0;
        }
        .ui-cal__cell {
            min-height: 80px;
            padding: 4px;
            border: 1px solid ${t('border')};
            font-size: 0.8rem;
            position: relative;
        }
        .ui-cal__cell--other {
            opacity: 0.4;
        }
        .ui-cal__cell--today {
            background: ${t('primary')};
            color: ${t('primary-text')};
            border-color: ${t('primary')};
        }
        .ui-cal__cell-num {
            font-weight: 600;
            margin-bottom: 2px;
        }
        @media (max-width: 640px) {
            .ui-cal__cell { min-height: 60px; }
        }
    `;

    private grid!: HTMLElement;
    private titleEl!: HTMLElement;

    render(): HTMLElement {
        const root = document.createElement('div');
        root.className = 'ui-cal';

        // Header
        const header = document.createElement('div');
        header.className = 'ui-cal__header';

        const prevBtn = document.createElement('button');
        prevBtn.className = 'ui-cal__nav';
        prevBtn.textContent = '\u2039';
        prevBtn.addEventListener('click', () => this.handlePrev());

        this.titleEl = document.createElement('span');
        this.titleEl.className = 'ui-cal__title';

        const nextBtn = document.createElement('button');
        nextBtn.className = 'ui-cal__nav';
        nextBtn.textContent = '\u203a';
        nextBtn.addEventListener('click', () => this.handleNext());

        header.appendChild(prevBtn);
        header.appendChild(this.titleEl);
        header.appendChild(nextBtn);
        root.appendChild(header);

        // Day names row
        const dayNames = this.props.dayNames ?? DEFAULT_DAY_NAMES;
        const dayRow = document.createElement('div');
        dayRow.className = 'ui-cal__grid';
        for (const name of dayNames) {
            const cell = document.createElement('div');
            cell.className = 'ui-cal__day-name';
            cell.textContent = name;
            dayRow.appendChild(cell);
        }
        root.appendChild(dayRow);

        // Grid
        this.grid = document.createElement('div');
        this.grid.className = 'ui-cal__grid';
        root.appendChild(this.grid);

        // Rebuild grid on year/month change
        this.track(effect(() => {
            this.buildGrid(this.props.year.get(), this.props.month.get());
        }));

        return root;
    }

    private handlePrev(): void {
        if (this.props.onPrev) {
            this.props.onPrev();
        } else {
            let m = this.props.month.get() - 1;
            let y = this.props.year.get();
            if (m < 1) { m = 12; y--; }
            this.props.month.set(m);
            this.props.year.set(y);
        }
    }

    private handleNext(): void {
        if (this.props.onNext) {
            this.props.onNext();
        } else {
            let m = this.props.month.get() + 1;
            let y = this.props.year.get();
            if (m > 12) { m = 1; y++; }
            this.props.month.set(m);
            this.props.year.set(y);
        }
    }

    private buildGrid(year: number, month: number): void {
        const monthNames = this.props.monthNames ?? DEFAULT_MONTH_NAMES;
        this.titleEl.textContent = `${monthNames[month - 1]} ${year}`;

        this.grid.textContent = '';

        const today = new Date();
        const todayStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

        // First day of month
        const firstDay = new Date(year, month - 1, 1);
        // Day of week: 0=Sun..6=Sat → convert to Mon=0..Sun=6
        let startDow = firstDay.getDay() - 1;
        if (startDow < 0) startDow = 6;

        // Start date = first day minus the offset
        const startDate = new Date(year, month - 1, 1 - startDow);

        for (let i = 0; i < 42; i++) {
            const d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
            const isCurrentMonth = d.getMonth() === month - 1;
            const dayStr = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
            const isToday = dayStr === todayStr;

            const cell = document.createElement('div');
            cell.className = 'ui-cal__cell';
            if (!isCurrentMonth) cell.classList.add('ui-cal__cell--other');
            if (isToday) cell.classList.add('ui-cal__cell--today');

            const numEl = document.createElement('div');
            numEl.className = 'ui-cal__cell-num';
            numEl.textContent = String(d.getDate());
            cell.appendChild(numEl);

            const day: CalendarDay = {
                date: d,
                dayOfMonth: d.getDate(),
                isToday,
                isCurrentMonth,
            };

            if (this.props.renderDay) {
                this.props.renderDay(day, cell);
            }

            this.grid.appendChild(cell);
        }
    }
}
