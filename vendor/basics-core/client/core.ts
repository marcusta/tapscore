// Basics-JS Core
// Signal reactivity, DI, Component base class, directives

// ─── Signal System ───────────────────────────────────────────────

type Subscriber = {
    run(): void;
    deps: Set<Set<Subscriber>>;
};

class Scheduler {
    private tracking: Subscriber | null = null;
    private batching = false;
    private readonly pending = new Set<Subscriber>();

    subscribe(subs: Set<Subscriber>): void {
        if (this.tracking) {
            subs.add(this.tracking);
            this.tracking.deps.add(subs);
        }
    }

    notify(subs: Set<Subscriber>): void {
        for (const s of [...subs]) {
            this.batching ? this.pending.add(s) : s.run();
        }
    }

    runTracked(sub: Subscriber, fn: () => void): void {
        teardown(sub);
        const prev = this.tracking;
        this.tracking = sub;
        try { fn(); } finally { this.tracking = prev; }
    }

    batch(fn: () => void): void {
        this.batching = true;
        try { fn(); } finally {
            this.batching = false;
            const queued = [...this.pending];
            this.pending.clear();
            for (const s of queued) s.run();
        }
    }
}

const scheduler = new Scheduler();

function teardown(sub: Subscriber): void {
    for (const set of sub.deps) set.delete(sub);
    sub.deps.clear();
}

export interface Readable<T> { get(): T; }

export class Signal<T> {
    private val: T;
    private readonly subs = new Set<Subscriber>();

    constructor(initial: T) { this.val = initial; }

    get(): T {
        scheduler.subscribe(this.subs);
        return this.val;
    }

    set(next: T): void {
        if (Object.is(this.val, next)) return;
        this.val = next;
        scheduler.notify(this.subs);
    }

    update(fn: (current: T) => T): void {
        this.set(fn(this.val));
    }
}

export class Computed<T> {
    private val: T;
    private readonly subs = new Set<Subscriber>();

    constructor(fn: () => T) {
        this.val = undefined as T;
        const self = this;
        const sub: Subscriber = {
            run() {
                scheduler.runTracked(sub, () => {
                    const next = fn();
                    if (!Object.is(self.val, next)) {
                        self.val = next;
                        scheduler.notify(self.subs);
                    }
                });
            },
            deps: new Set(),
        };
        sub.run();
    }

    get(): T {
        scheduler.subscribe(this.subs);
        return this.val;
    }
}

export function effect(fn: () => void): () => void {
    const sub: Subscriber = {
        run() { scheduler.runTracked(sub, fn); },
        deps: new Set(),
    };
    sub.run();
    return () => teardown(sub);
}

export function batch(fn: () => void): void {
    scheduler.batch(fn);
}

// ─── Dependency Injection ────────────────────────────────────────

export class Container {
    private readonly instances = new Map<Function, unknown>();

    get<T>(Ctor: new () => T): T {
        let inst = this.instances.get(Ctor) as T | undefined;
        if (!inst) {
            inst = new Ctor();
            this.instances.set(Ctor, inst);
        }
        return inst;
    }

    set<T>(Ctor: new (...args: any[]) => T, instance: T): void {
        this.instances.set(Ctor, instance);
    }

    reset(): void {
        this.instances.clear();
    }
}

export const di = new Container();

// ─── Router ─────────────────────────────────────────────────────

export type QueryValue = string | number | boolean | undefined | null;

export interface NavigateOptions {
    replace?: boolean;
    query?: Record<string, QueryValue>;
}

export class Router {
    readonly route = new Signal(location.pathname ?? '/');
    readonly search = new Signal(location.search ?? '');

    constructor() {
        window.addEventListener('popstate', () => batch(() => {
            this.route.set(location.pathname);
            this.search.set(location.search);
        }));
    }

    navigate(path: string, opts?: NavigateOptions | boolean): void {
        // Back-compat: navigate(path, true) still means replace.
        const options: NavigateOptions = typeof opts === 'boolean' ? { replace: opts } : (opts ?? {});
        const hashIdx = path.indexOf('#');
        const hash = hashIdx >= 0 ? path.slice(hashIdx) : '';
        const beforeHash = hashIdx >= 0 ? path.slice(0, hashIdx) : path;
        const qIdx = beforeHash.indexOf('?');
        const rawPath = qIdx >= 0 ? beforeHash.slice(0, qIdx) : beforeHash;
        const inlineQuery = qIdx >= 0 ? beforeHash.slice(qIdx + 1) : '';
        const search = options.query !== undefined
            ? serializeQuery(options.query)
            : (inlineQuery ? '?' + inlineQuery : '');
        const url = rawPath + search + hash;
        (options.replace ? history.replaceState : history.pushState).call(history, null, '', url);
        batch(() => {
            this.route.set(rawPath);
            this.search.set(search);
        });
    }

    back(): void {
        history.back();
    }

    link(path: string, activeClass = 'active') {
        const pathname = path.split('#')[0]!.split('?')[0]!;
        return {
            onclick: (e: Event) => { e.preventDefault(); this.navigate(path); },
            className: () => {
                const r = this.route.get();
                return r === pathname || r.startsWith(pathname + '/') ? activeClass : '';
            },
        };
    }

    /** Extract named params from a pattern. e.g. params('/users/:id') */
    params<T extends Record<string, string> = Record<string, string>>(pattern: string): Computed<T> {
        const segments = pattern.split('/');
        return new Computed(() => {
            const parts = this.route.get().split('/');
            const result: Record<string, string> = {};
            for (const [i, seg] of segments.entries()) {
                if (seg.startsWith(':')) result[seg.slice(1)] = parts[i] ?? '';
            }
            return result as T;
        });
    }

    /** Reactive read of a single query parameter. Returns undefined if absent. */
    query(name: string): Computed<string | undefined> {
        return new Computed(() => {
            const params = new URLSearchParams(this.search.get());
            return params.get(name) ?? undefined;
        });
    }

    /** Reactive read of all query parameters as a plain object. */
    queries(): Computed<Record<string, string>> {
        return new Computed(() => {
            const out: Record<string, string> = {};
            for (const [k, v] of new URLSearchParams(this.search.get())) out[k] = v;
            return out;
        });
    }
}

function serializeQuery(q: Record<string, QueryValue>): string {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(q)) {
        if (v === undefined || v === null || v === '') continue;
        params.set(k, String(v));
    }
    const s = params.toString();
    return s ? '?' + s : '';
}

// ─── Theming ────────────────────────────────────────────────────

export function createScale<T extends Record<string, string>>(
    values: T
): (name: keyof T & string) => string {
    // name is keyof T — value always exists; ! needed because TS can't narrow Record indexing
    return (name) => values[name]!;
}

export function createTokens<T extends Record<string, string>>(
    light: T,
    dark: T
): (name: keyof T & string) => string {
    const toBlock = (obj: Record<string, string>, sel: string, scheme: string) => {
        const vars = Object.entries(obj).map(([k, v]) => `--${k}:${v}`).join(';');
        return `${sel}{color-scheme:${scheme};${vars}}`;
    };
    const style = document.createElement('style');
    style.textContent = toBlock(light, '[data-theme="light"]', 'light')
        + toBlock(dark, '[data-theme="dark"]', 'dark');
    document.head.appendChild(style);
    return (name) => `var(--${name})`;
}

const THEME_KEY = 'basics-js-theme';

export class Theme {
    readonly dark = new Signal(false);

    constructor() {
        const stored = localStorage.getItem(THEME_KEY);
        const prefersDark = matchMedia('(prefers-color-scheme: dark)').matches;
        this.dark.set(stored ? stored === 'dark' : prefersDark);
        effect(() => {
            const isDark = this.dark.get();
            document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
            localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
        });
    }

    toggle(): void { this.dark.update(v => !v); }
}

// ─── Template Helper ─────────────────────────────────────────────

export function template(html: string): HTMLTemplateElement {
    const tpl = document.createElement('template');
    tpl.innerHTML = html;
    return tpl;
}

// ─── Helpers ────────────────────────────────────────────────────

function matchPrefix<V>(route: string, map: Record<string, V>): V | undefined {
    let best: string | undefined;
    for (const key of Object.keys(map)) {
        if (route.startsWith(key + '/') && (!best || key.length > best.length)) best = key;
    }
    return best ? map[best] : undefined;
}

// ─── Component Base Class ────────────────────────────────────────

const injectedStyles = new Set<Function>();

export type PropsOf<T> = T extends Component<infer P> ? P : {};

export type SlotRenderFn = (host: HTMLElement, ctx: SlotContext) => void;

export type SlotContent =
    | string
    | (new () => Component<any>)
    | SlotRenderFn;

export interface SlotContext {
    spawn<T extends Component<any>>(
        Ctor: new (...args: any[]) => T,
        host: HTMLElement,
        ...args: {} extends PropsOf<T> ? [props?: PropsOf<T>] : [props: PropsOf<T>]
    ): T;
    track(dispose: () => void): void;
}

export abstract class Component<P extends object = {}> {
    private readonly disposers: (() => void)[] = [];
    private readonly children: Component<any>[] = [];

    constructor(protected readonly props: P = {} as P) {
        const ctor = this.constructor as any;
        if (ctor.styles && !injectedStyles.has(ctor)) {
            injectedStyles.add(ctor);
            const el = document.createElement('style');
            el.textContent = ctor.styles;
            document.head.appendChild(el);
        }
    }

    abstract render(): HTMLElement | DocumentFragment;

    onMount(): void {}
    onDestroy(): void {}

    protected inject<T>(Ctor: new () => T): T { return di.get(Ctor); }
    protected track(dispose: () => void): void { this.disposers.push(dispose); }
    protected ref(root: DocumentFragment | HTMLElement, name: string): HTMLElement {
        return root.querySelector(`[bind="${name}"]`) as HTMLElement;
    }

    protected spawn<T extends Component<any>>(
        Ctor: new (...args: any[]) => T,
        host: HTMLElement,
        ...args: {} extends PropsOf<T> ? [props?: PropsOf<T>] : [props: PropsOf<T>]
    ): T {
        const child = new Ctor(args[0]);
        child.mount(host);
        this.children.push(child);
        return child;
    }

    mount(target: HTMLElement): void {
        target.appendChild(this.render());
        this.onMount();
    }

    destroy(): void {
        this.onDestroy();
        for (const child of this.children) child.destroy();
        this.children.length = 0;
        for (const d of this.disposers) d();
        this.disposers.length = 0;
    }

    protected wire(
        tpl: HTMLTemplateElement,
        map: Record<string, (() => unknown) | Record<string, unknown>>,
        trackFn?: (d: () => void) => void
    ): DocumentFragment {
        const doTrack = trackFn ?? ((d: () => void) => this.track(d));
        const frag = tpl.content.cloneNode(true) as DocumentFragment;

        for (const el of frag.querySelectorAll<HTMLElement>('[bind]')) {
            const binding = map[el.getAttribute('bind')!];
            if (!binding) continue;

            if (typeof binding === 'function') {
                doTrack(effect(() => {
                    const val = binding();
                    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)
                        el.value = String(val);
                    else
                        el.textContent = String(val);
                }));
            } else {
                for (const [key, val] of Object.entries(binding)) {
                    const isAttr = key.includes('-');
                    if (key.startsWith('on') && typeof val === 'function')
                        el.addEventListener(key.slice(2), val as EventListener);
                    else if (typeof val === 'function')
                        doTrack(effect(() => {
                            const v = (val as () => unknown)();
                            isAttr ? el.setAttribute(key, String(v)) : (el as any)[key] = v;
                        }));
                    else
                        isAttr ? el.setAttribute(key, String(val)) : (el as any)[key] = val;
                }
            }
        }
        return frag;
    }

    protected wireEl(
        tpl: HTMLTemplateElement,
        map: Record<string, (() => unknown) | Record<string, unknown>>,
        trackFn?: (d: () => void) => void
    ): HTMLElement {
        return this.wire(tpl, map, trackFn).firstElementChild as HTMLElement;
    }

    // ─── Slots ────────────────────────────────────────────────────

    protected slot(name: string, root: DocumentFragment | HTMLElement): boolean {
        const content = this.props[name as keyof P] as SlotContent | undefined;
        if (content == null) return false;
        const host = this.ref(root, name);
        if (!host) return false;

        if (typeof content === 'string') {
            host.textContent = content;
        } else if (typeof content === 'function' && content.prototype instanceof Component) {
            this.spawn(content as unknown as new () => Component<any>, host);
        } else if (typeof content === 'function') {
            (content as SlotRenderFn)(host, {
                spawn: <T extends Component<any>>(
                    Ctor: new (...args: any[]) => T,
                    h: HTMLElement,
                    ...args: {} extends PropsOf<T> ? [props?: PropsOf<T>] : [props: PropsOf<T>]
                ) => this.spawn(Ctor, h, ...args),
                track: (d: () => void) => this.track(d),
            });
        }
        return true;
    }

    // ─── Directives ──────────────────────────────────────────────

    protected $each<T>(
        host: HTMLElement,
        items: Readable<T[]> | (() => T[]),
        renderer: (item: T, index: number, track: (d: () => void) => void) => HTMLElement,
        key: (item: T, index: number) => string | number = (_item, index) => index
    ): void {
        const read: () => T[] = typeof items === 'function' ? items : () => items.get();
        const nodes = new Map<string | number, HTMLElement>();
        const scopes = new Map<string | number, (() => void)[]>();

        // Clean up all item scopes when component destroys
        this.track(() => {
            for (const fns of scopes.values()) fns.forEach(d => d());
            scopes.clear();
        });

        this.track(effect(() => {
            const list = read();
            const next = new Map<string | number, HTMLElement>();

            for (const [i, item] of list.entries()) {
                const k = key(item, i);
                if (nodes.has(k)) {
                    next.set(k, nodes.get(k)!);
                } else {
                    const itemDisposers: (() => void)[] = [];
                    next.set(k, renderer(item, i, d => itemDisposers.push(d)));
                    scopes.set(k, itemDisposers);
                }
            }

            // Remove deleted nodes from DOM and dispose their effects
            for (const [k, node] of nodes) {
                if (!next.has(k)) {
                    node.remove();
                    scopes.get(k)?.forEach(d => d());
                    scopes.delete(k);
                }
            }

            // Minimal DOM moves: walk new order, only move out-of-place nodes
            let cursor = host.firstChild;
            for (const node of next.values()) {
                if (node === cursor) {
                    cursor = cursor.nextSibling;
                } else {
                    host.insertBefore(node, cursor);
                }
            }

            nodes.clear();
            for (const [k, v] of next) nodes.set(k, v);
        }));
    }

    protected $condition(
        host: HTMLElement,
        signal: Readable<boolean>,
        onTrue: () => HTMLElement,
        onFalse?: () => HTMLElement
    ): void {
        let current: HTMLElement | null = null;
        this.track(effect(() => {
            if (current) { current.remove(); current = null; }
            current = signal.get() ? onTrue() : onFalse?.() ?? null;
            if (current) host.appendChild(current);
        }));
    }

    protected $swap(
        host: HTMLElement,
        signal: Readable<string>,
        map: Record<string, new () => Component<any>>,
        fallback?: new () => Component<any>
    ): void {
        let child: Component<any> | null = null;
        this.track(effect(() => {
            if (child) { child.destroy(); child = null; }
            host.textContent = '';
            const route = signal.get();
            const Ctor = map[route] ?? matchPrefix(route, map) ?? fallback;
            if (Ctor) {
                child = new Ctor();
                child.mount(host);
            }
        }));
        this.track(() => child?.destroy());
    }
}

// ─── App Bootstrap ──────────────────────────────────────────────

interface HotContext {
    data: Record<string, unknown>;
    dispose(cb: () => void): void;
    accept(): void;
}

export async function startApp(
    Root: new () => Component<any>,
    root: string | HTMLElement,
    options?: {
        hot?: HotContext | undefined;
        onInit?: (() => void | Promise<void>) | undefined;
    }
): Promise<void> {
    const el = typeof root === 'string'
        ? document.querySelector(root) as HTMLElement : root;
    el.textContent = '';

    const router = di.get(Router);
    let app: Component<any> | null = null;
    let inObs = false;
    let ObsShell: (new () => Component<any>) | null = null;
    let initRan = !!options?.hot?.data['hmr'];

    const mount = async (obs: boolean) => {
        if (app) { app.destroy(); app = null; el.textContent = ''; }

        if (obs) {
            if (!ObsShell) {
                const mod = await import('./obs/obs-shell.component');
                ObsShell = mod.ObsShellComponent as unknown as new () => Component<any>;
            }
            app = new ObsShell();
        } else {
            if (!initRan && options?.onInit) {
                await options.onInit();
                initRan = true;
            }
            app = new Root();
        }

        app.mount(el);
        inObs = obs;
    };

    await mount(location.pathname.startsWith('/_obs'));

    effect(() => {
        const wantObs = router.route.get().startsWith('/_obs');
        if (wantObs !== inObs) mount(wantObs);
    });

    if (options?.hot) {
        options.hot.data['hmr'] = true;
        options.hot.dispose(() => app?.destroy());
        options.hot.accept();
    }
}
