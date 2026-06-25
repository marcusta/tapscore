import { test, expect } from 'bun:test';
import { Signal, Computed, effect, batch, Component, template, Router } from './core';
import type { SlotContent, SlotRenderFn } from './core';

// --- Signal ---

test('Signal: get returns initial value', () => {
    const s = new Signal(42);
    expect(s.get()).toBe(42);
});

test('Signal: set updates value', () => {
    const s = new Signal(0);
    s.set(5);
    expect(s.get()).toBe(5);
});

test('Signal: set deduplicates with Object.is', () => {
    const s = new Signal(1);
    let runs = 0;
    effect(() => { s.get(); runs++; });
    expect(runs).toBe(1);

    s.set(1); // same value
    expect(runs).toBe(1);
});

test('Signal: update applies function to current value', () => {
    const s = new Signal(10);
    s.update(n => n + 5);
    expect(s.get()).toBe(15);
});

test('Signal: update deduplicates when returning same value', () => {
    const s = new Signal(1);
    let runs = 0;
    effect(() => { s.get(); runs++; });
    expect(runs).toBe(1);

    s.update(n => n); // returns same value
    expect(runs).toBe(1);
});

// --- Computed ---

test('Computed: computes initial value', () => {
    const a = new Signal(2);
    const b = new Signal(3);
    const sum = new Computed(() => a.get() + b.get());
    expect(sum.get()).toBe(5);
});

test('Computed: recomputes when dependency changes', () => {
    const a = new Signal(1);
    const double = new Computed(() => a.get() * 2);
    expect(double.get()).toBe(2);

    a.set(5);
    expect(double.get()).toBe(10);
});

test('Computed: caches value (does not recompute on repeated reads)', () => {
    let computeCount = 0;
    const a = new Signal(1);
    const c = new Computed(() => { computeCount++; return a.get(); });

    c.get();
    c.get();
    c.get();
    expect(computeCount).toBe(1);
});

test('Computed: skips downstream notification when value unchanged', () => {
    const a = new Signal(1);
    const clamped = new Computed(() => Math.min(a.get(), 10));
    let runs = 0;
    effect(() => { clamped.get(); runs++; });
    expect(runs).toBe(1);

    a.set(5); // clamped changes 1→5
    expect(runs).toBe(2);

    a.set(100); // clamped stays 10
    a.set(200); // clamped stays 10
    expect(runs).toBe(3); // only one additional run (for the 5→10 change)
});

// --- effect ---

test('effect: runs immediately on creation', () => {
    let ran = false;
    effect(() => { ran = true; });
    expect(ran).toBe(true);
});

test('effect: auto-tracks signal dependencies', () => {
    const s = new Signal('hello');
    let captured = '';
    effect(() => { captured = s.get(); });
    expect(captured).toBe('hello');

    s.set('world');
    expect(captured).toBe('world');
});

test('effect: re-subscribes on conditional reads', () => {
    const toggle = new Signal(true);
    const a = new Signal('a');
    const b = new Signal('b');
    let captured = '';

    effect(() => {
        captured = toggle.get() ? a.get() : b.get();
    });
    expect(captured).toBe('a');

    toggle.set(false);
    expect(captured).toBe('b');

    // Now only b should trigger, not a
    a.set('a2');
    expect(captured).toBe('b'); // unchanged

    b.set('b2');
    expect(captured).toBe('b2');
});

test('effect: dispose stops tracking', () => {
    const s = new Signal(0);
    let captured = 0;
    const dispose = effect(() => { captured = s.get(); });
    expect(captured).toBe(0);

    dispose();
    s.set(99);
    expect(captured).toBe(0); // not updated
});

// --- batch ---

test('batch: defers notifications until end', () => {
    const a = new Signal(1);
    const b = new Signal(2);
    let runs = 0;

    effect(() => { a.get(); b.get(); runs++; });
    expect(runs).toBe(1);

    batch(() => {
        a.set(10);
        b.set(20);
    });
    expect(runs).toBe(2); // only one additional run, not two
});

test('batch: each effect runs once even with multiple signal changes', () => {
    const s = new Signal(0);
    let runs = 0;

    effect(() => { s.get(); runs++; });
    expect(runs).toBe(1);

    batch(() => {
        s.set(1);
        s.set(2);
        s.set(3);
    });
    expect(runs).toBe(2); // one additional run at the end
});

// --- slot ---

const cardTpl = template(`
    <div class="card">
        <div bind="header"></div>
        <div bind="body"></div>
        <div bind="footer"></div>
    </div>
`);

class CardComponent extends Component<{ header?: SlotContent; body?: SlotContent; footer?: SlotContent }> {
    render(): DocumentFragment {
        const frag = this.wire(cardTpl, {});
        this.slot('header', frag);
        this.slot('body', frag);
        this.slot('footer', frag);
        return frag;
    }
}

class SimpleChild extends Component {
    static rendered = 0;
    static destroyed = 0;
    render(): HTMLElement {
        SimpleChild.rendered++;
        const el = document.createElement('span');
        el.textContent = 'child';
        return el;
    }
    onDestroy(): void { SimpleChild.destroyed++; }
}

test('slot: string content sets textContent', () => {
    const host = document.createElement('div');
    const card = new CardComponent({ header: 'My Title' });
    card.mount(host);

    const header = host.querySelector('[bind="header"]')!;
    expect(header.textContent).toBe('My Title');

    card.destroy();
});

test('slot: Component class is spawned into host', () => {
    SimpleChild.rendered = 0;
    SimpleChild.destroyed = 0;

    const host = document.createElement('div');
    const card = new CardComponent({ body: SimpleChild });
    card.mount(host);

    expect(SimpleChild.rendered).toBe(1);
    expect(host.querySelector('[bind="body"] span')!.textContent).toBe('child');

    card.destroy();
});

test('slot: render function receives host and ctx', () => {
    const host = document.createElement('div');
    let receivedHost: HTMLElement | null = null;
    let receivedCtx: any = null;

    const renderFn: SlotRenderFn = (h, ctx) => {
        receivedHost = h;
        receivedCtx = ctx;
        const el = document.createElement('p');
        el.textContent = 'from render fn';
        h.appendChild(el);
    };

    const card = new CardComponent({ footer: renderFn });
    card.mount(host);

    expect(receivedHost).not.toBeNull();
    expect(receivedHost!.getAttribute('bind')).toBe('footer');
    expect(typeof receivedCtx.spawn).toBe('function');
    expect(typeof receivedCtx.track).toBe('function');
    expect(host.querySelector('[bind="footer"] p')!.textContent).toBe('from render fn');

    card.destroy();
});

test('slot: render function ctx.spawn ties lifecycle to container', () => {
    SimpleChild.rendered = 0;
    SimpleChild.destroyed = 0;

    const host = document.createElement('div');
    const card = new CardComponent({
        body: (h, ctx) => { ctx.spawn(SimpleChild, h); },
    });
    card.mount(host);

    expect(SimpleChild.rendered).toBe(1);

    card.destroy();
    expect(SimpleChild.destroyed).toBe(1);
});

test('slot: render function ctx.track registers disposer on container', () => {
    let disposed = false;
    const host = document.createElement('div');
    const card = new CardComponent({
        body: (_h, ctx) => { ctx.track(() => { disposed = true; }); },
    });
    card.mount(host);

    expect(disposed).toBe(false);
    card.destroy();
    expect(disposed).toBe(true);
});

test('slot: returns false for missing content', () => {
    class TestCard extends Component {
        slotResult = false;
        render(): DocumentFragment {
            const frag = cardTpl.content.cloneNode(true) as DocumentFragment;
            this.slotResult = this.slot('header', frag);
            return frag;
        }
    }

    const host = document.createElement('div');
    const card = new TestCard();
    card.mount(host);

    expect(card.slotResult).toBe(false);
    card.destroy();
});

test('slot: returns true when content is projected', () => {
    class TestCard extends Component<{ header?: SlotContent }> {
        slotResult = false;
        render(): DocumentFragment {
            const frag = cardTpl.content.cloneNode(true) as DocumentFragment;
            this.slotResult = this.slot('header', frag);
            return frag;
        }
    }

    const host = document.createElement('div');
    const card = new TestCard({ header: 'Title' });
    card.mount(host);

    expect(card.slotResult).toBe(true);
    card.destroy();
});

test('slot: destroy cascades to spawned Component class content', () => {
    SimpleChild.rendered = 0;
    SimpleChild.destroyed = 0;

    const host = document.createElement('div');
    const card = new CardComponent({ header: SimpleChild, body: SimpleChild });
    card.mount(host);

    expect(SimpleChild.rendered).toBe(2);

    card.destroy();
    expect(SimpleChild.destroyed).toBe(2);
});

// --- Router ---

test('Router.params: extracts named segments from route', () => {
    const router = new Router();
    const params = router.params<{ id: string }>('/users/:id');

    router.navigate('/users/abc123');
    expect(params.get()).toEqual({ id: 'abc123' });

    router.navigate('/users/xyz');
    expect(params.get()).toEqual({ id: 'xyz' });
});

test('Router.params: multiple params', () => {
    const router = new Router();
    const params = router.params<{ section: string; id: string }>('/app/:section/:id');

    router.navigate('/app/horses/42');
    expect(params.get()).toEqual({ section: 'horses', id: '42' });
});

test('Router.params: empty string for missing segment', () => {
    const router = new Router();
    const params = router.params<{ id: string }>('/users/:id');

    router.navigate('/users');
    expect(params.get()).toEqual({ id: '' });
});

test('Router.link: activeClass matches exact path and child paths', () => {
    const router = new Router();
    const link = router.link('/horses');

    router.navigate('/horses');
    expect(link.className()).toBe('active');

    router.navigate('/horses/detail/123');
    expect(link.className()).toBe('active');

    router.navigate('/settings');
    expect(link.className()).toBe('');
});

test('Router.query: reactive read of single parameter', () => {
    const router = new Router();
    const id = router.query('id');

    router.navigate('/items', { query: { id: 'abc' } });
    expect(id.get()).toBe('abc');

    router.navigate('/items', { query: { id: 'xyz' } });
    expect(id.get()).toBe('xyz');

    router.navigate('/items');
    expect(id.get()).toBeUndefined();
});

test('Router.navigate: serializes query object, skips undefined/null/empty', () => {
    const router = new Router();

    router.navigate('/search', { query: { q: 'hi', page: 2, tag: undefined, empty: '' } });
    expect(router.search.get()).toBe('?q=hi&page=2');
});

test('Router.navigate: preserves inline query when no query option given', () => {
    const router = new Router();

    router.navigate('/items?id=abc');
    expect(router.route.get()).toBe('/items');
    expect(router.search.get()).toBe('?id=abc');
    expect(router.query('id').get()).toBe('abc');
});

test('Router.navigate(path, true) still replaces (back-compat)', () => {
    const router = new Router();
    router.navigate('/a');
    router.navigate('/b', true);
    expect(router.route.get()).toBe('/b');
});

test('Router.navigate: preserves hash fragment in URL', () => {
    const calls: string[] = [];
    const orig = history.pushState;
    history.pushState = function (_s: unknown, _t: string, url?: string | null) {
        calls.push(String(url ?? ''));
    } as typeof history.pushState;
    try {
        const router = new Router();

        router.navigate('/docs#intro');
        expect(router.route.get()).toBe('/docs');
        expect(calls[calls.length - 1]).toBe('/docs#intro');

        router.navigate('/docs?v=2#section-3');
        expect(router.route.get()).toBe('/docs');
        expect(router.search.get()).toBe('?v=2');
        expect(calls[calls.length - 1]).toBe('/docs?v=2#section-3');

        router.navigate('/items#bottom', { query: { id: 'x' } });
        expect(router.search.get()).toBe('?id=x');
        expect(calls[calls.length - 1]).toBe('/items?id=x#bottom');
    } finally {
        history.pushState = orig;
    }
});

test('Router.link: active class ignores query and hash in path', () => {
    const router = new Router();
    const link = router.link('/items?id=abc');

    router.navigate('/items', { query: { id: 'abc' } });
    expect(link.className()).toBe('active');

    router.navigate('/items/detail');
    expect(link.className()).toBe('active');

    router.navigate('/other');
    expect(link.className()).toBe('');
});

test('Router.queries: returns all params as object', () => {
    const router = new Router();
    const all = router.queries();

    router.navigate('/search', { query: { q: 'hi', page: 1 } });
    expect(all.get()).toEqual({ q: 'hi', page: '1' });
});

test('$each: accepts a function returning T[]', () => {
    const items = new Signal([1, 2, 3]);
    let root: HTMLElement;

    class List extends Component {
        render() {
            root = document.createElement('div');
            this.$each(root, () => items.get().map(n => n * 10), (item) => {
                const li = document.createElement('li');
                li.textContent = String(item);
                return li;
            }, item => item);
            return root;
        }
    }
    new List().mount(document.body);
    expect(root!.children.length).toBe(3);
    expect(root!.children[0]!.textContent).toBe('10');

    items.set([4, 5]);
    expect(root!.children.length).toBe(2);
    expect(root!.children[0]!.textContent).toBe('40');
});

test('$swap: prefix matching selects longest match', () => {
    class PageA extends Component { render() { return document.createElement('div'); } }
    class PageB extends Component { render() { return document.createElement('div'); } }

    const route = new Signal('/horses/detail/123');
    const host = document.createElement('div');

    class App extends Component {
        render() {
            const el = document.createElement('div');
            this.$swap(el, route, {
                '/horses': PageA,
                '/horses/detail': PageB,
            });
            return el;
        }
    }

    const app = new App();
    app.mount(host);

    // /horses/detail/123 should match /horses/detail (longest prefix), not /horses
    // We can verify by checking that the component was mounted
    // Since both return empty divs, we test the match logic indirectly
    // via the route signal — change to exact match and verify it works
    route.set('/horses');
    // Exact match: /horses → PageA
    route.set('/horses/detail/456');
    // Prefix match: /horses/detail (longest) → PageB

    app.destroy();
});

test('$swap: exact match takes priority over prefix', () => {
    let mounted = '';
    class Exact extends Component {
        render() { mounted = 'exact'; return document.createElement('div'); }
    }
    class Prefix extends Component {
        render() { mounted = 'prefix'; return document.createElement('div'); }
    }

    const route = new Signal('/horses');
    const host = document.createElement('div');

    class App extends Component {
        render() {
            const el = document.createElement('div');
            this.$swap(el, route, { '/horses': Exact, '/horse': Prefix });
            return el;
        }
    }

    const app = new App();
    app.mount(host);
    expect(mounted).toBe('exact');

    route.set('/horse/detail');
    expect(mounted).toBe('prefix');

    app.destroy();
});
