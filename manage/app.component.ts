import { Component, Computed, effect, template } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { ManageRolesService } from './roles/roles.service';
import { unlockedSections } from './shell/sections';
import { ShellComponent } from './shell/shell.component';
import { SignInComponent } from './auth/sign-in.component';
import { DeniedComponent } from './shell/denied.component';
import { BootFailureComponent, BootLoadingComponent } from './shell/boot.component';

/*
 * The root, and the one place that decides WHICH Manage a caller gets.
 *
 * Five mutually exclusive states, resolved from two signals and nothing else:
 *
 *   loading     the session probe or the roles call is still out
 *   failed      one of them could not be reached (distinct from "no roles")
 *   signed-out  no session — the sign-in form (spec §2.3)
 *   denied      signed in, no unlocked section — the refusal, full screen
 *   ready       the shell
 *
 * The order of the checks is the substance. `signed-out` is tested before the
 * roles are consulted, because a signed-out caller has no roles to fetch and
 * showing them a refusal would be a lie; `failed` is tested before `denied`,
 * because a dropped connection that painted the permission-denied screen would
 * tell an administrator they lack a role they hold. That distinction is why
 * `ManageRolesService` keeps its own `error` instead of swallowing failures
 * into an empty list the way `AdminService.loadRoles` does — see the note
 * there.
 *
 * This is PRESENTATION, not the gate. Every write is enforced server-side by
 * `CourseManagementAuthz` whatever this component concludes, and a grant
 * revoked mid-session leaves a stale shell whose next write 403s. That is the
 * intended failure, not a hole.
 */

type GateState = 'loading' | 'failed' | 'signed-out' | 'denied' | 'ready';

const tpl = template(`<div bind="gate" class="mapp"></div>`);

export class AppComponent extends Component {
    static styles = `
        .mapp { min-height: 100vh; min-height: 100dvh; }
    `;

    private auth = this.inject(AuthService);
    private roles = this.inject(ManageRolesService);

    private gate = new Computed<GateState>(() => {
        if (this.auth.loading.get()) return 'loading';
        if (this.auth.currentUser.get() === null) {
            return this.auth.error.get() ? 'failed' : 'signed-out';
        }
        if (this.roles.error.get()) return 'failed';
        if (!this.roles.loaded.get()) return 'loading';
        return unlockedSections(this.roles).length > 0 ? 'ready' : 'denied';
    });

    render(): DocumentFragment {
        const frag = this.wire(tpl, {});

        // The roles bootstrap. Driven by the session rather than called once on
        // boot, so signing in from the form below — and signing out from the
        // shell — both land in the right state without either screen knowing
        // this exists. `load()` is load-once, so the re-runs are free.
        this.track(
            effect(() => {
                if (this.auth.currentUser.get()) void this.roles.load();
                else this.roles.clear();
            }),
        );

        this.$swap(this.ref(frag, 'gate'), this.gate, {
            loading: BootLoadingComponent,
            failed: BootFailureComponent,
            'signed-out': SignInComponent,
            denied: DeniedComponent,
            ready: ShellComponent,
        });

        return frag;
    }
}
