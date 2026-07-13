import { Computed, Router, Signal, di } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { api } from '../api';
import type { Course } from '../api/courses.gen';
import type { CutOutcome } from '../api/competitions.gen';
import type { Tee } from '../api/tees.gen';
import { FormatCatalogService } from '../create/format-catalog.service';
import { FriendsService } from '../friends/friends.service';
import { ProfileService } from '../profile/profile.service';
import {
    AggregationCatalogService,
    type AggregationDescriptor,
} from './aggregation-catalog.service';
import { CompetitionsService, isAdmin } from './competitions.service';
import type { Lifecycle } from './lifecycle';

/** One generic aggregation config field declared by the server catalog. */
export type AggregationField = NonNullable<AggregationDescriptor['configFields']>[number];

/** Seed the string-backed form controls from a strategy's typed config. */
export function aggregationFormValues(
    fields: AggregationField[],
    config: Record<string, unknown>,
): Record<string, string> {
    const values: Record<string, string> = {};
    for (const field of fields) {
        const raw = config[field.key];
        values[field.key] = raw !== undefined && raw !== null ? String(raw) : String(field.default);
    }
    return values;
}

/** Convert generic form strings back to the descriptor-declared config shape. */
export function aggregationConfig(
    fields: AggregationField[],
    values: Record<string, string>,
): Record<string, unknown> {
    const config: Record<string, unknown> = {};
    for (const field of fields) {
        const raw = values[field.key] ?? String(field.default);
        config[field.key] =
            field.kind === 'integer'
                ? Number.parseInt(raw, 10) || Number(field.default)
                : raw;
    }
    return config;
}

/**
 * Shared state for the competition-detail child views. The shallow components
 * only bind templates; this service owns editor drafts, reference-data loading,
 * and the small pieces of orchestration that span setup, roster, rounds, and
 * results.
 */
export class CompetitionDetailService {
    private competitions = di.get(CompetitionsService);
    readonly formats = di.get(FormatCatalogService);
    readonly aggregations = di.get(AggregationCatalogService);
    readonly friends = di.get(FriendsService);
    readonly profile = di.get(ProfileService);
    private auth = di.get(AuthService);
    private router = di.get(Router);

    readonly id = this.router.query('id');
    readonly admin = new Computed(() =>
        isAdmin(this.competitions.detail.get(), this.profile.player.get()?.id ?? null),
    );
    readonly lifecycle = new Computed<Lifecycle>(
        () => (this.competitions.detail.get()?.lifecycle ?? 'draft') as Lifecycle,
    );

    readonly editingSetup = new Signal(false);
    readonly nameDraft = new Signal('');
    readonly slotDraft = new Signal<string[]>([]);
    readonly aggregationStrategy = new Signal('');
    readonly aggregationValues = new Signal<Record<string, string>>({});
    readonly startListDraft = new Signal<'single_group' | 'foursomes'>('single_group');
    readonly courseDraft = new Signal('');
    readonly teeDraft = new Signal('');
    readonly cutAfterDraft = new Signal('');
    readonly cutTypeDraft = new Signal('');
    readonly cutValueDraft = new Signal('');
    readonly formatPickDraft = new Signal('');

    readonly guestNameDraft = new Signal('');
    readonly guestGenderDraft = new Signal<'M' | 'F'>('M');
    readonly guestHcpDraft = new Signal('');
    readonly roundCourseDraft = new Signal('');
    readonly roundDateDraft = new Signal('');

    readonly courses = new Signal<Course[]>([]);
    readonly tees = new Signal<Tee[]>([]);
    readonly resultSetIndex = new Signal(0);
    readonly cutOutcome = new Signal<CutOutcome | null>(null);
    readonly cutConfirmOpen = new Signal(false);
    readonly finalizeConfirmOpen = new Signal(false);

    private coursesLoaded = false;

    /** Reset view-local state whenever the detail route is entered or its id changes. */
    enter(): void {
        this.editingSetup.set(false);
        this.nameDraft.set('');
        this.slotDraft.set([]);
        this.aggregationStrategy.set('');
        this.aggregationValues.set({});
        this.startListDraft.set('single_group');
        this.courseDraft.set('');
        this.teeDraft.set('');
        this.tees.set([]);
        this.cutAfterDraft.set('');
        this.cutTypeDraft.set('');
        this.cutValueDraft.set('');
        this.formatPickDraft.set('');
        this.guestNameDraft.set('');
        this.guestGenderDraft.set('M');
        this.guestHcpDraft.set('');
        this.roundCourseDraft.set('');
        this.roundDateDraft.set('');
        this.resultSetIndex.set(0);
        this.cutOutcome.set(null);
        this.cutConfirmOpen.set(false);
        this.finalizeConfirmOpen.set(false);
    }

    initialize(): void {
        if (this.auth.currentUser.get()) {
            void this.profile.load();
            void this.friends.load();
        }
        void this.formats.load();
        void this.aggregations.load();
        this.loadCourses();
    }

    private loadCourses(): void {
        if (this.coursesLoaded) return;
        this.coursesLoaded = true;
        void api.courses
            .list()
            .then((courses) => this.courses.set(courses))
            .catch(() => {
                this.coursesLoaded = false;
            });
    }

    async loadTees(courseId: string): Promise<void> {
        if (!courseId) {
            this.tees.set([]);
            return;
        }
        try {
            this.tees.set(await api.tees.listByCourse({ courseId }));
        } catch {
            this.tees.set([]);
        }
    }

    selectAggregation(id: string): void {
        this.applyAggregation(id, {});
    }

    applyAggregation(id: string, config: Record<string, unknown>): void {
        this.aggregationStrategy.set(id);
        const fields = this.aggregations.byId(id)?.configFields ?? [];
        this.aggregationValues.set(aggregationFormValues(fields, config));
    }

    setAggregationValue(key: string, value: string): void {
        this.aggregationValues.set({ ...this.aggregationValues.get(), [key]: value });
    }

    seedSetupEditor(): void {
        const detail = this.competitions.detail.get();
        if (!detail) return;
        this.nameDraft.set(detail.name);
        const config = detail.defaultConfig;
        this.slotDraft.set((config?.slots ?? []).map((slot) => slot.formatId));
        this.startListDraft.set(config?.startList ?? 'single_group');
        this.teeDraft.set(config?.fallbackTee?.teeId ?? '');
        const aggregation = detail.aggregation;
        const strategyId =
            aggregation?.strategyId ?? this.aggregations.descriptors.get()[0]?.id ?? '';
        this.applyAggregation(
            strategyId,
            (aggregation?.config ?? {}) as Record<string, unknown>,
        );
        const cut = detail.cutRules as
            | { afterRound?: number; cutType?: string; cutValue?: number }
            | null
            | undefined;
        this.cutAfterDraft.set(cut?.afterRound !== undefined ? String(cut.afterRound) : '');
        this.cutTypeDraft.set(cut?.cutType ?? '');
        this.cutValueDraft.set(cut?.cutValue !== undefined ? String(cut.cutValue) : '');
        this.formatPickDraft.set(this.formats.descriptors.get()[0]?.id ?? '');
        this.editingSetup.set(true);
    }

    async saveSetup(): Promise<void> {
        const id = this.id.get() ?? '';
        const slots = this.slotDraft.get().map((formatId) => ({ formatId }));
        const teeId = this.teeDraft.get();
        const defaultConfig =
            slots.length > 0
                ? {
                      slots,
                      startList: this.startListDraft.get(),
                      ...(teeId ? { fallbackTee: { teeId } } : {}),
                  }
                : undefined;
        const strategyId = this.aggregationStrategy.get();
        const fields = this.aggregations.byId(strategyId)?.configFields ?? [];
        const selectedAggregation = strategyId
            ? {
                  strategyId,
                  config: aggregationConfig(fields, this.aggregationValues.get()),
              }
            : undefined;
        const afterRound = Number.parseInt(this.cutAfterDraft.get(), 10);
        const cutValue = Number.parseInt(this.cutValueDraft.get(), 10);
        const cutType = this.cutTypeDraft.get();
        const cutRules =
            cutType && Number.isFinite(afterRound) && Number.isFinite(cutValue)
                ? { afterRound, cutType, cutValue }
                : undefined;
        const refusal = await this.competitions.updateConfig({
            id,
            name: this.nameDraft.get().trim() || undefined,
            ...(defaultConfig ? { defaultConfig } : {}),
            ...(selectedAggregation ? { aggregation: selectedAggregation } : {}),
            ...(cutRules ? { cutRules } : {}),
        });
        if (refusal === null) this.editingSetup.set(false);
    }

    async addGuest(): Promise<void> {
        const name = this.guestNameDraft.get().trim();
        if (!name) return;
        const raw = this.guestHcpDraft.get().trim().replace(',', '.');
        const handicap = raw === '' ? null : Number.parseFloat(raw);
        const refusal = await this.competitions.addGuest(
            this.id.get() ?? '',
            {
                displayName: name,
                gender: this.guestGenderDraft.get(),
                handicapIndex: Number.isFinite(handicap as number) ? (handicap as number) : null,
            },
            null,
        );
        if (refusal === null) {
            this.guestNameDraft.set('');
            this.guestHcpDraft.set('');
        }
    }

    async createRound(): Promise<string | null> {
        const courseId = this.roundCourseDraft.get() || this.courseDraft.get();
        const playedAt = this.roundDateDraft.get();
        if (!courseId || !playedAt) {
            this.competitions.mutateError.set('Pick a course and a date for the round.');
            return null;
        }
        const result = await this.competitions.createRound({
            id: this.id.get() ?? '',
            courseId,
            playedAt,
        });
        return result.ok ? result.shareToken : null;
    }
}
