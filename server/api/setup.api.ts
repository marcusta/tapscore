import { Type, type Static } from '@sinclair/typebox';
import type { CourseService } from '../services/course.service';
import type { TeeService } from '../services/tee.service';

// --- Input schemas ---

const ByCourseInput = Type.Object({ courseId: Type.String() });

// --- API descriptor ---
//
// NO `requireAuth()`: this is the read half of the no-login FriendlyRound
// create flow (2.6e M2). `courses.api` / `tees.api` are auth-gated (admin
// editing surfaces); the no-login wizard can't pick a course/tee through them.
// This `setup` API exposes only the SELECT-side a guest needs to build a
// `RoundSetupDraft` — course catalog + a course's tees with gender ratings —
// mirroring the share-token trust boundary on the friendly-rounds front door.
// All writes (course/tee admin) stay behind `requireAuth()`.

export function createSetupApi(courses: CourseService, tees: TeeService) {
    return {
        courses:     { method: 'GET' as const, path: '/setup/courses',        fn: ()                                       => courses.list() },
        teesByCourse:{ method: 'GET' as const, path: '/setup/tees/by-course',  fn: (input: Static<typeof ByCourseInput>)    => tees.listByCourse(input.courseId), schema: ByCourseInput },
    };
}
