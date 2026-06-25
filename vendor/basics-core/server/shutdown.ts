const cleanups: (() => Promise<void>)[] = [];
let registered = false;

export function onShutdown(cleanup: () => Promise<void>): void {
    cleanups.push(cleanup);

    if (!registered) {
        registered = true;
        const handler = async () => {
            console.log('Shutting down...');
            for (const fn of cleanups) await fn();
            process.exit(0);
        };
        process.on('SIGTERM', handler);
        process.on('SIGINT', handler);
    }
}
