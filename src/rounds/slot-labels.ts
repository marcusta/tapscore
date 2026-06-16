import { di } from '@basics/core/client/core';
import type { FormatSlot } from '../api/rounds.gen';
import { FormatCatalogService } from '../create/format-catalog.service';

/**
 * Human label for a round's format slot, read from the SERVER format catalog
 * (phase 2.6e M3 — replaces the hand-maintained `src/formats.ts` list). The
 * catalog is fetched once and cached; until it arrives this falls back to the
 * slot's own scoring/team metadata. Called inside reactive render bindings, so
 * reading the catalog signal re-renders the label when the fetch resolves.
 */
export function formatLabelFromSlot(slot: FormatSlot): string {
    const catalog = di.get(FormatCatalogService);
    void catalog.load();
    return catalog.byId(slot.formatId)?.label ?? `${slot.scoringMode} · ${slot.teamShape}`;
}
