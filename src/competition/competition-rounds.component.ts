import { Component, Computed, Router, template } from '@basics/core/client/core';
import { CompetitionDetailService } from './competition-detail.service';
import { CompetitionsService } from './competitions.service';
import { canAddRounds } from './lifecycle';

const STATUS_TEXT: Record<string, string> = {
    not_started: 'Not started',
    active: 'Live',
    complete: 'Finished',
};

const tpl = template(`
    <section class="cd__section">
        <div class="cd__section-head"><h2>Rounds</h2></div>
        <div bind="empty" class="cd__empty">No rounds yet.</div>
        <div bind="rounds" class="cd__rounds"></div>
        <form bind="form" class="cd__addround">
            <span class="cd__sublabel">Add a round</span>
            <div class="cd__addroundrow">
                <select bind="course"></select>
                <input bind="date" type="date" />
                <button bind="add" type="submit">Add round</button>
            </div>
        </form>
    </section>
`);
const roundTpl = template(`
    <button bind="row" class="cd__roundrow" type="button">
        <span bind="number" class="cd__rnum"></span>
        <span bind="meta" class="cd__rmeta"></span>
        <span bind="status" class="cd__rstatus"></span>
    </button>
`);
const optionTpl = template(`<option bind="option"></option>`);

export class CompetitionRoundsComponent extends Component {
    private competitions = this.inject(CompetitionsService);
    private state = this.inject(CompetitionDetailService);
    private router = this.inject(Router);

    render(): DocumentFragment {
        const rounds = new Computed(() => this.competitions.detail.get()?.rounds ?? []);
        const frag = this.wire(tpl, {
            empty: {
                className: () =>
                    rounds.get().length === 0 ? 'cd__empty' : 'cd__empty hidden',
            },
            form: {
                className: () =>
                    this.state.admin.get() && canAddRounds(this.state.lifecycle.get())
                        ? 'cd__addround'
                        : 'cd__addround hidden',
                onsubmit: (event: Event) => {
                    event.preventDefault();
                    void this.createRound();
                },
            },
            course: {
                value: () => this.state.roundCourseDraft.get(),
                onchange: (event: Event) =>
                    this.state.roundCourseDraft.set(
                        (event.target as HTMLSelectElement).value,
                    ),
            },
            date: {
                value: () => this.state.roundDateDraft.get(),
                oninput: (event: Event) =>
                    this.state.roundDateDraft.set((event.target as HTMLInputElement).value),
            },
            add: { disabled: () => this.competitions.mutating.get() },
        });
        this.$each(
            this.ref(frag, 'course'),
            this.state.courses,
            (course, _index, track) =>
                this.wireEl(
                    optionTpl,
                    {
                        option: { value: () => course.id, textContent: () => course.name },
                    },
                    track,
                ),
            (course) => course.id,
        );
        this.$each(
            this.ref(frag, 'rounds'),
            rounds,
            (round, _index, track) =>
                this.wireEl(
                    roundTpl,
                    {
                        row: {
                            disabled: () => !round.shareToken,
                            onclick: () => {
                                if (round.shareToken) {
                                    this.router.navigate('/round', {
                                        query: { token: round.shareToken },
                                    });
                                }
                            },
                        },
                        number: () => `Round ${round.roundNumber}`,
                        meta: () => {
                            const bits = [round.courseNameSnapshot, round.date].filter(Boolean);
                            return bits.join(' · ') || (round.shareToken ? 'Open' : 'View-only');
                        },
                        status: {
                            textContent: () => STATUS_TEXT[round.status] ?? round.status,
                            className: () => `cd__rstatus s-${round.status}`,
                        },
                    },
                    track,
                ),
            (round) =>
                JSON.stringify({
                    id: round.id,
                    status: round.status,
                    shareToken: round.shareToken,
                    courseName: round.courseNameSnapshot,
                    date: round.date,
                }),
        );
        return frag;
    }

    private async createRound(): Promise<void> {
        const token = await this.state.createRound();
        if (token) this.router.navigate('/round', { query: { token } });
    }
}
