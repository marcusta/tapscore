import { Component, Computed, effect, Router, Signal, template } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { SelectComponent, type SelectOption } from '@basics/core/client/ui/select';
import { t } from '../theme';
import { s, card } from '../css';
import { AdminService } from '../admin/admin.service';
import { CourseSetupService, type TeeGender } from './course-setup.service';

const tpl = template(`
    <div class="course-setup">
        <button bind="back" class="course-setup__back" type="button">← Home</button>
        <h1>Course setup</h1>
        <div bind="denied" class="course-setup__denied">
            This area needs a course admin role.
        </div>
        <div bind="body" class="course-setup__body">
            <p class="course-setup__intro">Choose the rated tee each course uses for Club, Tournament and Beginner defaults.</p>
            <label class="course-setup__field">
                <span>Course</span>
                <div bind="course"></div>
            </label>
            <p bind="error" class="course-setup__error"></p>
            <div bind="loading" class="course-setup__loading">Loading course…</div>
            <section bind="defaults" class="course-setup__defaults">
                <div class="course-setup__section-head">
                    <h2>Default tee roles</h2>
                    <p>Only tees with a rating for that gender are available.</p>
                </div>
                <div class="course-setup__table-head">
                    <span>Role</span><span>Men</span><span>Women</span>
                </div>
                <div bind="roles" class="course-setup__roles"></div>
            </section>
            <section bind="tees" class="course-setup__tees">
                <h2>Available tees</h2>
                <div bind="teeRows" class="course-setup__tee-rows"></div>
            </section>
        </div>
    </div>
`);

const roleTpl = template(`
    <div class="course-role">
        <div class="course-role__name"><strong bind="name"></strong></div>
        <label class="course-role__field"><span>Men</span><div bind="men"></div></label>
        <label class="course-role__field"><span>Women</span><div bind="women"></div></label>
    </div>
`);

const teeTpl = template(`
    <div class="course-tee">
        <strong bind="name"></strong><span bind="ratings"></span>
    </div>
`);

/** The course-admin screen. Server-side authorization remains the gate. */
export class CourseSetupComponent extends Component {
    static styles = `
        .course-setup {
            padding: ${s('xl')} ${s('lg')} ${s('2xl')};
            & h1, & h2 { font-family: ${t('font-display')}; color: ${t('text')}; }
            & h1 { margin: 0 0 ${s('lg')}; font-size: 1.8rem; }
            & h2 { margin: 0; font-size: 1.2rem; }
            & .course-setup__back {
                padding: ${s('xs')} 0; margin: 0 0 ${s('md')}; border: 0; background: none;
                color: ${t('text-muted')}; font-family: inherit; font-size: 0.9rem;
                font-weight: 600; cursor: pointer;
            }
            & .course-setup__body.hidden, & .course-setup__denied.hidden,
              & .course-setup__loading.hidden, & .course-setup__defaults.hidden,
              & .course-setup__tees.hidden { display: none; }
            & .course-setup__denied, & .course-setup__intro, & .course-setup__section-head p,
              & .course-setup__loading { color: ${t('text-muted')}; font-size: 0.9rem; }
            & .course-setup__intro { margin: 0 0 ${s('lg')}; }
            & .course-setup__field { display: block; margin-bottom: ${s('xl')}; }
            & .course-setup__field > span, & .course-setup__table-head,
              & .course-role__field > span {
                font-size: 0.75rem; font-weight: 700; letter-spacing: 0.06em;
                text-transform: uppercase; color: ${t('text-muted')};
            }
            & .course-setup__field > span { display: block; margin-bottom: ${s('xs')}; }
            & .course-setup__field .ui-select { display: block; width: 100%; }
            & .course-setup__error { margin: -${s('lg')} 0 ${s('lg')}; color: ${t('error')}; font-size: 0.9rem; }
            & .course-setup__error:empty { display: none; }
            & .course-setup__defaults, & .course-setup__tees {
                ${card()}
                padding: ${s('lg')}; margin-top: ${s('lg')};
            }
            & .course-setup__section-head { margin-bottom: ${s('md')}; }
            & .course-setup__section-head p { margin: ${s('xs')} 0 0; }
            & .course-setup__table-head, & .course-role {
                display: grid; grid-template-columns: minmax(74px, 0.7fr) minmax(0, 1fr) minmax(0, 1fr);
                gap: ${s('sm')}; align-items: center;
            }
            & .course-setup__table-head { padding: ${s('sm')} 0; }
            & .course-role { padding: ${s('md')} 0; border-top: 1px solid ${t('border')}; }
            & .course-role__name { color: ${t('text')}; font-size: 0.9rem; }
            & .course-role__field > span { display: none; }
            & .course-role__field .ui-select { display: block; min-width: 0; }
            & .course-setup__tee-rows { display: flex; flex-direction: column; gap: ${s('sm')}; margin-top: ${s('md')}; }
            & .course-tee { display: flex; flex-wrap: wrap; gap: ${s('sm')}; color: ${t('text')}; font-size: 0.9rem; }
            & .course-tee span { color: ${t('text-muted')}; }
            @media (max-width: 380px) {
                & .course-setup__table-head { display: none; }
                & .course-role { grid-template-columns: 1fr 1fr; }
                & .course-role__name { grid-column: 1 / -1; }
                & .course-role__field > span { display: block; margin-bottom: ${s('xs')}; }
            }
        }
    `;

    private auth = this.inject(AuthService);
    private admins = this.inject(AdminService);
    private setup = this.inject(CourseSetupService);
    private router = this.inject(Router);
    private denied = new Computed(
        () => this.auth.currentUser.get() === null || !this.admins.canManageCourses(),
    );

    render(): DocumentFragment {
        void this.admins.loadRoles().then(() => {
            if (this.admins.canManageCourses()) void this.setup.load();
        });
        const frag = this.wire(tpl, {
            back: { onclick: () => this.router.navigate('/') },
            denied: { className: () => this.denied.get() ? 'course-setup__denied' : 'course-setup__denied hidden' },
            body: { className: () => this.denied.get() ? 'course-setup__body hidden' : 'course-setup__body' },
            error: { textContent: () => this.setup.error.get()?.message ?? this.setup.saveError.get()?.message ?? '' },
            loading: { className: () => this.setup.loading.get() || this.setup.selectionLoading.get() ? 'course-setup__loading' : 'course-setup__loading hidden' },
            defaults: { className: () => this.setup.courseId.get() ? 'course-setup__defaults' : 'course-setup__defaults hidden' },
            tees: { className: () => this.setup.courseId.get() ? 'course-setup__tees' : 'course-setup__tees hidden' },
        });

        const track = (dispose: () => void) => this.track(dispose);
        this.mountSelect(this.ref(frag, 'course'), track, {
            value: this.bound(track, () => this.setup.courseId.get(), (id) => void this.setup.selectCourse(id)),
            options: { get: () => this.setup.courses.get().map((course) => ({ value: course.id, label: course.name })) },
            placeholder: 'Select a course',
        });

        this.$each(
            this.ref(frag, 'roles'),
            this.setup.roles,
            (role, _index, trackRole) => this.roleRow(role.roleKey, role.displayName, trackRole),
            (role) => role.roleKey,
        );
        this.$each(
            this.ref(frag, 'teeRows'),
            this.setup.tees,
            (tee, _index, trackTee) => this.wireEl(teeTpl, {
                name: () => tee.colour ? `${tee.name} · ${tee.colour}` : tee.name,
                ratings: () => tee.ratings.map((rating) => `${rating.gender} ${rating.courseRating.toFixed(1)} / ${rating.slope}`).join(' · '),
            }, trackTee),
            (tee) => tee.id,
        );
        return frag;
    }

    private roleRow(roleKey: string, displayName: string, track: (dispose: () => void) => void): HTMLElement {
        const el = this.wireEl(roleTpl, { name: () => displayName }, track);
        this.mountMappingSelect(el, 'men', roleKey, 'M', track);
        this.mountMappingSelect(el, 'women', roleKey, 'F', track);
        return el;
    }

    private mountMappingSelect(
        el: HTMLElement,
        bind: string,
        roleKey: string,
        gender: TeeGender,
        track: (dispose: () => void) => void,
    ): void {
        this.mountSelect(this.ref(el, bind), track, {
            value: this.bound(track, () => this.setup.mappingTeeId(roleKey, gender), (teeId) => void this.setup.setMapping(roleKey, gender, teeId)),
            options: { get: () => [
                { value: '', label: 'Not set' },
                ...this.setup.ratedTees(gender).map((tee) => ({ value: tee.id, label: tee.name })),
            ] },
            disabled: { get: () => this.setup.saving.get() || this.setup.selectionLoading.get() },
        });
    }

    private mountSelect(host: HTMLElement, track: (dispose: () => void) => void, props: { value: Signal<string>; options: { get: () => SelectOption[] }; placeholder?: string; disabled?: { get: () => boolean } }): void {
        const child = new SelectComponent(props);
        child.mount(host);
        track(() => child.destroy());
    }

    private bound(track: (dispose: () => void) => void, read: () => string, write: (value: string) => void): Signal<string> {
        const value = new Signal(read());
        track(effect(() => value.set(read())));
        // SelectComponent owns a signal rather than an onchange callback. Its
        // initial value is a render fact, NOT an edit — especially important
        // for the valid '' = "Not set" mapping while the server mapping is
        // still loading. Only a change after that first synchronization writes.
        let first = true;
        track(effect(() => {
            const next = value.get();
            if (first) {
                first = false;
                return;
            }
            queueMicrotask(() => {
                if (value.get() === next) write(next);
            });
        }));
        return value;
    }
}
