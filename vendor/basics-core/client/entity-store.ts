import { Signal } from './core';

export class EntityStore<T extends { id: string; version?: number }> {
    readonly items = new Signal<T[]>([]);
    readonly total = new Signal(0);
    private _items = new Map<string, Signal<T>>();

    /** Per-item signal for fine-grained binding inside $each */
    item(id: string): Signal<T> {
        const sig = this._items.get(id);
        if (!sig) throw new Error(`Entity ${id} not found in store`);
        return sig;
    }

    /** Replace all items (load, page change, reload) */
    set(items: T[], total?: number): void {
        const next = new Map<string, Signal<T>>();
        for (const item of items) {
            const existing = this._items.get(item.id);
            if (existing) {
                existing.set(item);
                next.set(item.id, existing);
            } else {
                next.set(item.id, new Signal(item));
            }
        }
        this._items = next;
        this.items.set(items);
        if (total !== undefined) this.total.set(total);
    }

    /** Update a single item — fine-grained (per-item signal fires) */
    patch(updated: T): void {
        const sig = this._items.get(updated.id);
        if (sig) {
            sig.set(updated);
            this.items.update(list =>
                list.map(item => item.id === updated.id ? updated : item)
            );
        }
    }

    /** Structural add */
    add(item: T): void {
        this._items.set(item.id, new Signal(item));
        this.items.update(list => [...list, item]);
        this.total.update(n => n + 1);
    }

    /** Structural remove */
    remove(id: string): void {
        this._items.delete(id);
        this.items.update(list => list.filter(item => item.id !== id));
        this.total.update(n => n - 1);
    }

    /** Mutation — reads version from store when present, patches on success */
    async mutate<R extends T>(id: string, fn: (version: T['version']) => Promise<R>): Promise<R> {
        const sig = this._items.get(id);
        if (!sig) throw new Error(`Entity ${id} not found in store`);
        // T['version'] narrows to number when T has version: number, undefined otherwise.
        // TS can't prove this generically — the cast is provably safe by the constraint.
        const result = await fn(sig.get().version as T['version']);
        this.patch(result);
        return result;
    }
}
