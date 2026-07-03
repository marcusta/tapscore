import { Component, Router, template } from '@basics/core/client/core';
import { t } from '../theme';
import { NavComponent } from './nav.component';
import { LandingComponent } from '../landing/landing.component';
import { RoundComponent } from '../round/round.component';
import { CreateComponent } from '../create/create.component';
import { LoginComponent } from '../auth/login.component';
import { PlayersComponent } from '../players/players.component';
import { RoundsComponent } from '../rounds/rounds.component';
import { ProfileComponent } from '../profile/profile.component';

const tpl = template(`
    <div class="app-shell">
        <main bind="content" class="app-shell__content"></main>
        <div bind="nav" class="app-shell__nav"></div>
    </div>
`);

export class AppComponent extends Component {
    static styles = `
        .app-shell {
            display: grid;
            grid-template-rows: 1fr auto;
            height: 100vh;
            height: 100dvh;
            max-width: 560px;
            margin: 0 auto;
            background: ${t('bg')};

            & .app-shell__content {
                overflow-y: auto;
                -webkit-overflow-scrolling: touch;
            }
        }
    `;

    private router = this.inject(Router);

    render(): DocumentFragment {
        const frag = this.wire(tpl, {});

        this.spawn(NavComponent, this.ref(frag, 'nav'));
        this.$swap(this.ref(frag, 'content'), this.router.route, {
            '/': LandingComponent,
            '/round': RoundComponent,
            '/create': CreateComponent,
            '/login': LoginComponent,
            '/rounds': RoundsComponent,
            '/players': PlayersComponent,
            '/profile': ProfileComponent,
        }, LandingComponent);

        return frag;
    }
}
