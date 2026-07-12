import { Signal } from '@basics/core/client/core';
import { request, type RequestError } from '@basics/core/client/request';
import { api } from '../api';
import type { AggregationDescriptor } from '../api/setup.gen';
import { currentLocale, type Locale } from '../locale';

export type { AggregationDescriptor } from '../api/setup.gen';

/**
 * The aggregation-strategy catalog (Phase 4 Slice 5). Loads the server's
 * registered `AggregationStrategy` descriptors via the open `GET
 * /setup/aggregations`, exactly as `FormatCatalogService` loads formats. This
 * is what lets the competition setup UI list strategies and render their
 * config editor WITHOUT hardcoding a single strategy id — the architecture
 * ratchet (server/domain/aggregation/architecture.test.ts) forbids
 * aggregation-id literals in client code, so the client must consume the
 * catalog and drive its picker + config fields off the descriptor data.
 */
export class AggregationCatalogService {
    readonly loading = new Signal(false);
    readonly error = new Signal<RequestError | null>(null);
    readonly descriptors = new Signal<AggregationDescriptor[]>([]);

    private started = false;

    async load(): Promise<void> {
        if (this.started) return; // immutable per session — fetch once
        this.started = true;
        const data = await request(this.loading, this.error, () => api.setup.aggregations());
        if (data) this.descriptors.set(data);
        else this.started = false; // allow retry on failure
    }

    byId(id: string): AggregationDescriptor | null {
        return this.descriptors.get().find((d) => d.id === id) ?? null;
    }

    /** Locale-appropriate label for a descriptor (or id), falling back to the
     *  canonical label, then the id. */
    labelOf(descriptorOrId: AggregationDescriptor | string, locale: Locale = currentLocale()): string {
        const d = typeof descriptorOrId === 'string' ? this.byId(descriptorOrId) : descriptorOrId;
        if (!d) return typeof descriptorOrId === 'string' ? descriptorOrId : '';
        return d.labels?.[locale] ?? d.labels?.en ?? d.label;
    }
}
