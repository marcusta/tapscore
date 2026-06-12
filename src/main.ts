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
        await auth.load();
        if (!auth.currentUser.get()) {
            router.navigate('/login', true);
        } else if (router.route.get() === '/' || router.route.get() === '/login') {
            router.navigate('/rounds', true);
        }
    },
});
