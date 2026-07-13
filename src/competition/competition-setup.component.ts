import { Component, Computed, template } from '@basics/core/client/core';
import { CompetitionsService } from './competitions.service';
import {
    CompetitionDetailService,
    type AggregationField,
} from './competition-detail.service';
import { canEditSetup } from './lifecycle';

const tpl = template(`
    <section bind="root" class="cd__section cd__setup">
        <div class="cd__section-head">
            <h2>Setup</h2>
            <button bind="toggle" class="cd__linkbtn" type="button"></button>
        </div>
        <div bind="summary" class="cd__summary">
            <div>Formats: <span bind="summaryFormats"></span></div>
            <div>Scoring: <span bind="summaryScoring"></span></div>
        </div>
        <div bind="form" class="cd__form">
            <label class="cd__field"><span>Name</span><input bind="name" /></label>
            <div class="cd__field">
                <span>Format slots</span>
                <div bind="slots" class="cd__slots"></div>
                <div class="cd__addrow">
                    <select bind="formatPick"></select>
                    <button bind="addSlot" type="button">Add slot</button>
                </div>
            </div>
            <label class="cd__field">
                <span>Scoring (aggregation)</span><select bind="aggregationPick"></select>
            </label>
            <p bind="aggregationDescription" class="cd__aggdesc"></p>
            <div bind="aggregationFields" class="cd__aggfields"></div>
            <label class="cd__field">
                <span>Course (for default tee + new rounds)</span><select bind="course"></select>
            </label>
            <label class="cd__field"><span>Default tee</span><select bind="tee"></select></label>
            <label class="cd__field">
                <span>Start list</span>
                <select bind="startList">
                    <option value="single_group">One group</option>
                    <option value="foursomes">Foursomes</option>
                </select>
            </label>
            <div class="cd__field">
                <span>Cut (optional)</span>
                <div class="cd__cutrow">
                    <input bind="cutAfter" inputmode="numeric" placeholder="after round" />
                    <select bind="cutType">
                        <option value="">no cut</option>
                        <option value="top_n">Top N</option>
                        <option value="top_percent">Top %</option>
                        <option value="within_strokes">Within strokes</option>
                    </select>
                    <input bind="cutValue" inputmode="numeric" placeholder="value" />
                </div>
            </div>
            <div class="cd__formactions">
                <button bind="save" type="button">Save setup</button>
                <button bind="cancel" class="cd__linkbtn" type="button">Cancel</button>
            </div>
        </div>
    </section>
`);

const slotTpl = template(`
    <div class="cd__slot">
        <span bind="label"></span>
        <button bind="remove" type="button" aria-label="Remove">×</button>
    </div>
`);
const optionTpl = template(`<option bind="option"></option>`);
const configFieldTpl = template(`
    <label class="cd__field">
        <span bind="label"></span>
        <select bind="select"></select>
        <input bind="integer" inputmode="numeric" />
    </label>
`);

export class CompetitionSetupComponent extends Component {
    private competitions = this.inject(CompetitionsService);
    private state = this.inject(CompetitionDetailService);

    render(): DocumentFragment {
        const detail = () => this.competitions.detail.get();
        const frag = this.wire(tpl, {
            root: {
                className: () =>
                    this.state.admin.get() && canEditSetup(this.state.lifecycle.get())
                        ? 'cd__section cd__setup'
                        : 'cd__section cd__setup hidden',
            },
            toggle: {
                textContent: () => (this.state.editingSetup.get() ? 'Close' : 'Edit'),
                onclick: () => {
                    if (this.state.editingSetup.get()) this.state.editingSetup.set(false);
                    else this.state.seedSetupEditor();
                },
            },
            summary: {
                className: () =>
                    this.state.editingSetup.get() ? 'cd__summary hidden' : 'cd__summary',
            },
            summaryFormats: {
                textContent: () => {
                    const slots = detail()?.defaultConfig?.slots ?? [];
                    return slots.length
                        ? slots
                              .map(
                                  (slot) =>
                                      this.state.formats.labelOf(slot.formatId) ?? slot.formatId,
                              )
                              .join(', ')
                        : 'none set';
                },
                className: () =>
                    (detail()?.defaultConfig?.slots.length ?? 0) === 0 ? 'cd__muted-em' : '',
            },
            summaryScoring: {
                textContent: () => {
                    const aggregation = detail()?.aggregation;
                    return aggregation
                        ? this.state.aggregations.labelOf(aggregation.strategyId)
                        : 'default (chosen automatically)';
                },
                className: () => (detail()?.aggregation ? '' : 'cd__muted-em'),
            },
            form: {
                className: () =>
                    this.state.editingSetup.get() ? 'cd__form' : 'cd__form hidden',
            },
            name: {
                value: () => this.state.nameDraft.get(),
                oninput: (event: Event) =>
                    this.state.nameDraft.set((event.target as HTMLInputElement).value),
            },
            formatPick: {
                value: () => this.state.formatPickDraft.get(),
                onchange: (event: Event) =>
                    this.state.formatPickDraft.set((event.target as HTMLSelectElement).value),
            },
            addSlot: {
                onclick: () => {
                    const formatId =
                        this.state.formatPickDraft.get() ||
                        this.state.formats.descriptors.get()[0]?.id;
                    if (formatId) {
                        this.state.slotDraft.set([...this.state.slotDraft.get(), formatId]);
                    }
                },
            },
            aggregationPick: {
                value: () => this.state.aggregationStrategy.get(),
                onchange: (event: Event) =>
                    this.state.selectAggregation((event.target as HTMLSelectElement).value),
            },
            aggregationDescription: () =>
                this.state.aggregations.byId(this.state.aggregationStrategy.get())?.description ?? '',
            course: {
                value: () => this.state.courseDraft.get(),
                onchange: (event: Event) => {
                    const id = (event.target as HTMLSelectElement).value;
                    this.state.courseDraft.set(id);
                    this.state.teeDraft.set('');
                    void this.state.loadTees(id);
                },
            },
            tee: {
                value: () => this.state.teeDraft.get(),
                onchange: (event: Event) =>
                    this.state.teeDraft.set((event.target as HTMLSelectElement).value),
            },
            startList: {
                value: () => this.state.startListDraft.get(),
                onchange: (event: Event) =>
                    this.state.startListDraft.set(
                        (event.target as HTMLSelectElement).value as
                            | 'single_group'
                            | 'foursomes',
                    ),
            },
            cutAfter: {
                value: () => this.state.cutAfterDraft.get(),
                oninput: (event: Event) =>
                    this.state.cutAfterDraft.set((event.target as HTMLInputElement).value),
            },
            cutType: {
                value: () => this.state.cutTypeDraft.get(),
                onchange: (event: Event) =>
                    this.state.cutTypeDraft.set((event.target as HTMLSelectElement).value),
            },
            cutValue: {
                value: () => this.state.cutValueDraft.get(),
                oninput: (event: Event) =>
                    this.state.cutValueDraft.set((event.target as HTMLInputElement).value),
            },
            save: {
                disabled: () => this.competitions.mutating.get(),
                textContent: () => (this.competitions.mutating.get() ? 'Saving…' : 'Save setup'),
                onclick: () => void this.state.saveSetup(),
            },
            cancel: { onclick: () => this.state.editingSetup.set(false) },
        });

        this.$each(
            this.ref(frag, 'slots'),
            this.state.slotDraft,
            (formatId, index, track) =>
                this.wireEl(
                    slotTpl,
                    {
                        label: () =>
                            `Slot ${index + 1}: ${this.state.formats.labelOf(formatId) ?? formatId}`,
                        remove: {
                            onclick: () =>
                                this.state.slotDraft.set(
                                    this.state.slotDraft.get().filter((_, i) => i !== index),
                                ),
                        },
                    },
                    track,
                ),
            (formatId, index) => `${index}:${formatId}`,
        );
        this.$each(
            this.ref(frag, 'formatPick'),
            this.state.formats.descriptors,
            (descriptor, _index, track) =>
                this.wireEl(
                    optionTpl,
                    {
                        option: {
                            value: () => descriptor.id,
                            textContent: () =>
                                this.state.formats.labelOf(descriptor) ?? descriptor.id,
                        },
                    },
                    track,
                ),
            (descriptor) => descriptor.id,
        );
        this.$each(
            this.ref(frag, 'aggregationPick'),
            this.state.aggregations.descriptors,
            (descriptor, _index, track) =>
                this.wireEl(
                    optionTpl,
                    {
                        option: {
                            value: () => descriptor.id,
                            textContent: () => this.state.aggregations.labelOf(descriptor),
                        },
                    },
                    track,
                ),
            (descriptor) => descriptor.id,
        );
        const fields = new Computed(
            () =>
                this.state.aggregations.byId(this.state.aggregationStrategy.get())?.configFields ??
                [],
        );
        this.$each(
            this.ref(frag, 'aggregationFields'),
            fields,
            (field, _index, track) => this.configField(field, track),
            (field) => field.key,
        );
        const courseOption = (course: { id: string; name: string }, track: (d: () => void) => void) =>
            this.wireEl(
                optionTpl,
                { option: { value: () => course.id, textContent: () => course.name } },
                track,
            );
        this.$each(
            this.ref(frag, 'course'),
            this.state.courses,
            (course, _index, track) => courseOption(course, track),
            (course) => course.id,
        );
        this.$each(
            this.ref(frag, 'tee'),
            this.state.tees,
            (tee, _index, track) => courseOption(tee, track),
            (tee) => tee.id,
        );
        return frag;
    }

    private configField(
        field: AggregationField,
        track: (dispose: () => void) => void,
    ): HTMLElement {
        const element = this.wireEl(
            configFieldTpl,
            {
                label: () => field.label,
                select: {
                    className: () => (field.kind === 'select' ? '' : 'hidden'),
                    value: () =>
                        this.state.aggregationValues.get()[field.key] ?? String(field.default),
                    onchange: (event: Event) =>
                        this.state.setAggregationValue(
                            field.key,
                            (event.target as HTMLSelectElement).value,
                        ),
                },
                integer: {
                    className: () => (field.kind === 'integer' ? '' : 'hidden'),
                    value: () =>
                        this.state.aggregationValues.get()[field.key] ?? String(field.default),
                    oninput: (event: Event) =>
                        this.state.setAggregationValue(
                            field.key,
                            (event.target as HTMLInputElement).value,
                        ),
                },
            },
            track,
        );
        const select = element.querySelector('select') as HTMLElement;
        const options = new Computed(() => (field.kind === 'select' ? field.options : []));
        this.$each(
            select,
            options,
            (option, _index, optionTrack) =>
                this.wireEl(
                    optionTpl,
                    {
                        option: { value: () => option.value, textContent: () => option.label },
                    },
                    optionTrack,
                ),
            (option) => option.value,
        );
        return element;
    }
}
