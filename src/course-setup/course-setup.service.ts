import { Signal } from '@basics/core/client/core';
import { request, type RequestError } from '@basics/core/client/request';
import { api } from '../api';
import type { Course, CourseTeeRole, TeeRole } from '../api/courses.gen';
import type { Tee } from '../api/tees.gen';

export type TeeGender = 'M' | 'F';

/**
 * The narrow authoring state for course tee defaults. Course, tee and hole
 * CRUD already have their own HTTP operations; this screen addresses the
 * missing domain decision: which rated tee fulfils each portable role.
 */
export class CourseSetupService {
    readonly loading = new Signal(false);
    readonly selectionLoading = new Signal(false);
    readonly saving = new Signal(false);
    readonly error = new Signal<RequestError | null>(null);
    readonly saveError = new Signal<RequestError | null>(null);

    readonly courses = new Signal<Course[]>([]);
    readonly roles = new Signal<TeeRole[]>([]);
    readonly courseId = new Signal('');
    readonly tees = new Signal<Tee[]>([]);
    readonly mappings = new Signal<CourseTeeRole[]>([]);

    async load(): Promise<void> {
        if (this.loading.get() || this.courses.get().length > 0) return;
        const data = await request(this.loading, this.error, () =>
            Promise.all([api.courses.list(), api.courses.teeRoleCatalog()]),
        );
        if (!data) return;
        const [courses, roles] = data;
        this.courses.set(courses);
        this.roles.set(roles);
        if (courses[0]) await this.selectCourse(courses[0].id);
    }

    async selectCourse(courseId: string): Promise<void> {
        if (!courseId || courseId === this.courseId.get()) return;
        this.courseId.set(courseId);
        this.tees.set([]);
        this.mappings.set([]);
        const data = await request(this.selectionLoading, this.error, () =>
            Promise.all([
                api.tees.listByCourse({ courseId }),
                api.courses.teeRoles({ courseId }),
            ]),
        );
        // A later course choice won the race; do not paint its response over
        // the newer selection.
        if (!data || this.courseId.get() !== courseId) return;
        const [tees, mappings] = data;
        this.tees.set(tees);
        this.mappings.set(mappings);
    }

    mappingTeeId(roleKey: string, gender: TeeGender): string {
        return this.mappings
            .get()
            .find((mapping) => mapping.roleKey === roleKey && mapping.gender === gender)?.teeId ?? '';
    }

    ratedTees(gender: TeeGender): Tee[] {
        return this.tees.get().filter((tee) => tee.ratings.some((rating) => rating.gender === gender));
    }

    async setMapping(roleKey: string, gender: TeeGender, teeId: string): Promise<void> {
        const courseId = this.courseId.get();
        if (!courseId || teeId === this.mappingTeeId(roleKey, gender)) return;
        const saved = await request(this.saving, this.saveError, async () => {
            if (teeId === '') {
                await api.courses.clearTeeRole({ courseId, roleKey, gender });
                return { mapping: null as CourseTeeRole | null };
            }
            return { mapping: await api.courses.setTeeRole({ courseId, roleKey, gender, teeId }) };
        });
        if (!saved) return;
        this.mappings.set(
            saved.mapping === null
                ? this.mappings
                      .get()
                      .filter((mapping) => !(mapping.roleKey === roleKey && mapping.gender === gender))
                : [
                      ...this.mappings
                          .get()
                          .filter((mapping) => !(mapping.roleKey === roleKey && mapping.gender === gender)),
                      saved.mapping,
                  ],
        );
    }
}
