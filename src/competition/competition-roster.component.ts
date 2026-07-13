import { Component, template } from '@basics/core/client/core';
import { CompetitionDetailService } from './competition-detail.service';
import { CompetitionsService } from './competitions.service';
import { canEditSetup } from './lifecycle';

const tpl = template(`
    <section class="cd__section">
        <div class="cd__section-head">
            <h2>Players</h2><span bind="count" class="cd__count"></span>
        </div>
        <div bind="empty" class="cd__empty">No players yet.</div>
        <div bind="roster" class="cd__roster"></div>
        <div bind="add" class="cd__rosteradd">
            <div class="cd__addfriends">
                <span class="cd__sublabel">Add from friends</span>
                <div bind="friends" class="cd__friendpick"></div>
            </div>
            <form bind="guestForm" class="cd__guestform">
                <span class="cd__sublabel">Add a guest</span>
                <div class="cd__guestrow">
                    <input bind="guestName" placeholder="Name" />
                    <select bind="guestGender">
                        <option value="M">M</option><option value="F">F</option>
                    </select>
                    <input bind="guestHcp" inputmode="decimal" placeholder="HCP" />
                    <button bind="addGuest" type="submit">Add</button>
                </div>
            </form>
        </div>
    </section>
`);

const rowTpl = template(`
    <div class="cd__rosterrow">
        <span bind="name" class="cd__rname"></span>
        <span bind="category" class="cd__rcat"></span>
        <span bind="status" class="cd__rout"></span>
        <button bind="withdraw" class="cd__ract" type="button">Withdraw</button>
        <button bind="remove" class="cd__ract cd__ract--danger" type="button">Remove</button>
    </div>
`);
const friendTpl = template(`<button bind="chip" class="cd__friendchip" type="button"></button>`);

export class CompetitionRosterComponent extends Component {
    private competitions = this.inject(CompetitionsService);
    private state = this.inject(CompetitionDetailService);

    render(): DocumentFragment {
        const id = () => this.state.id.get() ?? '';
        const frag = this.wire(tpl, {
            count: () => {
                const count = this.competitions.participants.get().length;
                return count === 0 ? '' : String(count);
            },
            empty: {
                className: () =>
                    this.competitions.participants.get().length === 0
                        ? 'cd__empty'
                        : 'cd__empty hidden',
            },
            add: {
                className: () =>
                    this.state.admin.get() && canEditSetup(this.state.lifecycle.get())
                        ? 'cd__rosteradd'
                        : 'cd__rosteradd hidden',
            },
            guestForm: {
                onsubmit: (event: Event) => {
                    event.preventDefault();
                    void this.state.addGuest();
                },
            },
            guestName: {
                value: () => this.state.guestNameDraft.get(),
                oninput: (event: Event) =>
                    this.state.guestNameDraft.set((event.target as HTMLInputElement).value),
            },
            guestGender: {
                value: () => this.state.guestGenderDraft.get(),
                onchange: (event: Event) =>
                    this.state.guestGenderDraft.set(
                        (event.target as HTMLSelectElement).value as 'M' | 'F',
                    ),
            },
            guestHcp: {
                value: () => this.state.guestHcpDraft.get(),
                oninput: (event: Event) =>
                    this.state.guestHcpDraft.set((event.target as HTMLInputElement).value),
            },
            addGuest: { disabled: () => this.competitions.mutating.get() },
        });

        this.$each(
            this.ref(frag, 'roster'),
            this.competitions.participants,
            (participant, _index, track) =>
                this.wireEl(
                    rowTpl,
                    {
                        name: () => participant.displayNameSnapshot,
                        category: {
                            textContent: () => participant.category ?? '',
                            className: () =>
                                participant.category ? 'cd__rcat' : 'cd__rcat hidden',
                        },
                        status: {
                            textContent: () =>
                                participant.withdrawnAt
                                    ? 'Withdrawn'
                                    : participant.cutAfterRound !== null
                                      ? `Cut R${participant.cutAfterRound}`
                                      : '',
                            className: () =>
                                participant.withdrawnAt || participant.cutAfterRound !== null
                                    ? 'cd__rout'
                                    : 'cd__rout hidden',
                        },
                        withdraw: {
                            className: () =>
                                this.state.admin.get() && !participant.withdrawnAt
                                    ? 'cd__ract'
                                    : 'cd__ract hidden',
                            onclick: () =>
                                void this.competitions.withdrawParticipant(id(), participant.id),
                        },
                        remove: {
                            className: () =>
                                this.state.admin.get() && canEditSetup(this.state.lifecycle.get())
                                    ? 'cd__ract cd__ract--danger'
                                    : 'cd__ract cd__ract--danger hidden',
                            onclick: () =>
                                void this.competitions.removeParticipant(id(), participant.id),
                        },
                    },
                    track,
                ),
            (participant) =>
                JSON.stringify({
                    id: participant.id,
                    name: participant.displayNameSnapshot,
                    category: participant.category,
                    withdrawnAt: participant.withdrawnAt,
                    cutAfterRound: participant.cutAfterRound,
                }),
        );
        this.$each(
            this.ref(frag, 'friends'),
            this.state.friends.friends,
            (friend, _index, track) =>
                this.wireEl(
                    friendTpl,
                    {
                        chip: {
                            textContent: () => friend.displayName,
                            disabled: () =>
                                this.competitions.mutating.get() ||
                                this.competitions.participants
                                    .get()
                                    .some((participant) => participant.playerId === friend.id),
                            onclick: () =>
                                void this.competitions.addPlayer(id(), friend.id, null),
                        },
                    },
                    track,
                ),
            (friend) => friend.id,
        );
        return frag;
    }
}
