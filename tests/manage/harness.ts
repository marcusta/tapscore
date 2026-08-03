import '@basics/core/happy-dom';
import { Component } from '@basics/core/client/core';

// Mounting helper for the Manage UI primitives (manage/ui/*). Not a test file —
// `bun test` only picks up `*.test.ts`.
//
// Importing '@basics/core/happy-dom' HERE, at the top of the first module a
// test loads, is what makes `manage/theme.ts` importable at all: it installs its
// tokens by calling `createTokens` at module scope, which needs a `document`.

export type Mounted<C extends Component<any>> = {
    component: C;
    host: HTMLElement;
    /** Unmount and detach — call it in `afterEach` so tests cannot see each
     *  other's DOM or leave effects subscribed. */
    destroy(): void;
};

export function mount<C extends Component<any>>(component: C): Mounted<C> {
    const host = document.createElement('div');
    document.body.appendChild(host);
    component.mount(host);
    return {
        component,
        host,
        destroy(): void {
            component.destroy();
            host.remove();
        },
    };
}

/** Fire a bubbling key event at an element, the way a real keypress arrives. */
export function press(el: HTMLElement, key: string): void {
    el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

/** Let queued microtasks (the table's focus hand-off) run. */
export const flush = (): Promise<void> => Promise.resolve();

/** The fixture row shape — a club, near enough to what T4 will list. */
export type Club = {
    id: string;
    name: string;
    location: string | null;
    courses: number;
};

export function club(over: Partial<Club> = {}): Club {
    return { id: 'c1', name: 'Linköpings GK', location: 'Linköping', courses: 2, ...over };
}
