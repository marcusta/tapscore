// Phase 2.6b-final / Slice 5 — course-route template document schema.
//
// A template is route AUTHORING input only: ordered occurrence definitions,
// route sections, SI source/config (incl. allocation cycle), and route handicap
// policy. It carries no producers, formats, or playing groups. It is validated
// through the SAME pure route compiler (`compileRoute`) that `RoundSetupDraft`
// uses, and FROZEN into a `RoundDefinition` at round-create time — later edits
// never rewrite historical rounds (REWRITE_DOMAIN_SPEC.md §3).

import { Type, type Static } from '@sinclair/typebox';
import {
    PlayHoleInput,
    RouteHandicapPolicy,
    RouteSection,
    RouteSiInput,
} from './round-definition';

export const CourseRouteTemplateRoute = Type.Object({
    /** Ordered physical-hole occurrences — the explicit itinerary. */
    playHoles: Type.Array(PlayHoleInput, { minItems: 1 }),
    /** SI source/config + allocation cycle. Defaults to official when omitted. */
    routeSi: Type.Optional(RouteSiInput),
    /** Required for non-standard routes (repeated holes / custom SI). */
    routeHandicapPolicy: Type.Optional(RouteHandicapPolicy),
    routeSections: Type.Optional(Type.Array(RouteSection)),
});

export type CourseRouteTemplateRoute = Static<typeof CourseRouteTemplateRoute>;
