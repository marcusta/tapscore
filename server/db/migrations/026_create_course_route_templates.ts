import { type Kysely } from 'kysely';

/**
 * Phase 2.6b-final / Slice 5 — named, reusable course-route templates.
 *
 * A Course may own named route templates (e.g. `10 + first 8`, `clubhouse 6`,
 * `difficulty SI`) as setup conveniences (REWRITE_DOMAIN_SPEC.md §3 "Course
 * route templates"). A template is AUTHORING DATA ONLY: it carries ordered
 * physical-hole occurrences, route sections, SI source/config, allocation
 * cycle, and route handicap policy — but no producers/formats. Creating a Round
 * resolves and FREEZES the complete template into the round's `RoundDefinition`;
 * later template edits never rewrite historical rounds.
 *
 *   course_route_templates    course-owned route authoring document
 *
 * `definition_json` stores the route authoring input (validated through the
 * SAME pure route compiler `RoundSetupDraft` uses). The name is unique within a
 * course so the wizard can reference "10 + first 8" unambiguously.
 */
export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('course_route_templates')
        .addColumn('id', 'text', (col) => col.primaryKey())
        .addColumn('course_id', 'text', (col) =>
            col.notNull().references('courses.id').onDelete('cascade'),
        )
        .addColumn('name', 'text', (col) => col.notNull())
        .addColumn('definition_json', 'text', (col) => col.notNull())
        .addColumn('created_at', 'text', (col) =>
            col.notNull().defaultTo('2026-06-13T00:00:00.000Z'),
        )
        .addColumn('updated_at', 'text', (col) =>
            col.notNull().defaultTo('2026-06-13T00:00:00.000Z'),
        )
        // Course-local unique name — the round-setup wizard references a
        // template by (course, name).
        .addUniqueConstraint('course_route_templates_name_unique', ['course_id', 'name'])
        .execute();

    await db.schema
        .createIndex('course_route_templates_course_id_index')
        .on('course_route_templates')
        .column('course_id')
        .execute();
}
