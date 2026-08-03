# Tee roles and round defaults

Course tee colours are not a portable player preference. A player therefore
chooses a **tee role**, while a course resolves that role to one of its own
tees for the player's rating gender.

## Role catalogue and course mappings

`tee_roles` is a global, data-backed catalogue. The initial roles are:

- `club` — the ordinary club tee;
- `tournament` — the course's competition/back tee;
- `beginner` — the beginner or junior tee.

`course_tee_roles` maps each optional `(course, role, gender)` pair to a tee.
The same tee may fill multiple roles. A mapping is valid only when its tee
belongs to the course and has a rating for that gender. Removing a tee rating
clears only mappings for that tee and gender; a round always snapshots its
resolved tee, so historical results do not change.

Roles are global rather than arbitrary per-course labels. Adding a role is
data-additive, but it becomes selectable without client code only once the
profile/create UI consumes the catalogue generically.

## Round creation

The flow stays round-first:

`choose course → inspect/adjust Men and Women defaults → add players → optional per-player tee override`

The round creator's optional profile role pre-fills **their own gender's**
round default when the selected course resolves that role. It does not create
hidden per-player defaults in the roster. Every player added afterwards takes
the round default for their gender unless explicitly overridden.

For either gender, resolving a missing role follows this order:

1. the requested course role, if configured and rated;
2. the course's `club` role, if configured and rated;
3. Swedish colour convention: Gul/Yellow for men, Röd/Red for women;
4. the existing deterministic rated-tee fallback, or an actionable unset
   state if no tee is rated for that gender.

An organiser changing a round default deliberately applies it to the relevant
rows. Explicit individual tee overrides remain unchanged.

## Authorisation

Shared course authoring is gated by an unscoped `course_admin` grant; an
unscoped `super_admin` is its superset. The gate covers club, course, tee,
route-template, and course-tee-role mutations. Read paths remain available to
signed-in callers, and setup discovery remains open through its dedicated
read-only API.

Club-scoped grants are deferred: the product has not defined club ownership or
membership, and an administrator must be able to create a course before it has
an id to scope a grant to.
