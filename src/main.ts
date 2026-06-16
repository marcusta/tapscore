import { di, Router, Theme, startApp } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import './theme';
import { AppComponent } from './app/app.component';

di.get(Theme);
const router = di.get(Router);
const auth = di.get(AuthService);

await startApp(AppComponent, '#app', {
    hot: import.meta.hot,
    onInit: async () => {
        // No-login app: '/' is the landing for everyone. Login is an optional
        // side door — never forced. Only bounce an already-signed-in user off
        // the login page back to the landing.
        await auth.load();
        if (auth.currentUser.get() && router.route.get() === '/login') {
            router.navigate('/', true);
        }
    },
});
