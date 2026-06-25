// One-shot generator: emits idempotent course seed files under scripts/seeds/
// from the legacy golf-serie sqlite DBs. Run locally once (the golf-serie DBs
// are not present in prod); the GENERATED .ts files are what get committed +
// deployed. Re-run to refresh after source data changes.
//
//   bun scripts/gen-course-seeds.ts
//
// golf-serie schema: courses(pars, stroke_index JSON arrays), course_tees
// (name, color), course_tee_ratings(gender 'men'/'women', course_rating,
// slope_rating). Gender is mapped men->M, women->F. Per-hole lengths aren't
// tracked there, so totalLengthM is left 0 (handicap math needs only CR/slope/par).
import { Database } from 'bun:sqlite';
import * as path from 'node:path';

const GS = '/Users/marcust/dev/github/golf-serie';
const PROD = path.join(GS, 'deploy-tmp/golf_series-prod-20260419-115501.sqlite');
const MAIN = path.join(GS, 'golf_series.db');

interface Spec {
    db: string;
    srcId: number;
    seedName: string;
    club: string;
    course: string;
}

const SPECS: Spec[] = [
    { db: PROD, srcId: 9, seedName: 'landeryds-classic', club: 'Landeryds Golfklubb', course: 'Classic' },
    { db: PROD, srcId: 10, seedName: 'landeryds-masters', club: 'Landeryds Golfklubb', course: 'Masters' },
    { db: PROD, srcId: 21, seedName: 'landeryds-vesterby', club: 'Landeryds Golfklubb', course: 'Vesterby Links' },
    { db: MAIN, srcId: 6, seedName: 'vreta-kloster', club: 'Vreta Kloster Golfklubb', course: '18-hålsbanan' },
    { db: PROD, srcId: 11, seedName: 'nsgk-klinga', club: 'Norrköping Söderköping Golfklubb', course: 'Klinga' },
    { db: PROD, srcId: 22, seedName: 'nsgk-hylinge', club: 'Norrköping Söderköping Golfklubb', course: 'Hylinge 18-hål' },
    { db: PROD, srcId: 13, seedName: 'mjolby', club: 'Mjölby Golfklubb', course: 'Mjölby Golfklubb' },
];

const GENDER: Record<string, 'M' | 'F'> = { men: 'M', women: 'F' };

function emit(spec: Spec): string {
    const d = new Database(spec.db, { readonly: true });
    const co = d.query('select pars, stroke_index from courses where id=?').get(spec.srcId) as {
        pars: string;
        stroke_index: string;
    };
    const pars: number[] = JSON.parse(co.pars);
    const si: number[] = JSON.parse(co.stroke_index);
    const tees = d.query('select id, name, color from course_tees where course_id=? order by id').all(spec.srcId) as Array<{
        id: number;
        name: string;
        color: string | null;
    }>;
    const teeLiterals = tees.map((t) => {
        const rows = d
            .query('select gender, course_rating, slope_rating from course_tee_ratings where tee_id=?')
            .all(t.id) as Array<{ gender: string; course_rating: number; slope_rating: number }>;
        const ratings = rows
            .filter((r) => GENDER[r.gender])
            .sort((a, b) => (GENDER[a.gender] === 'M' ? -1 : 1))
            .map(
                (r) =>
                    `{ gender: '${GENDER[r.gender]}' as const, courseRating: ${r.course_rating}, slope: ${r.slope_rating} }`,
            );
        const colour = t.color ? `'${t.color}'` : 'null';
        return `    { name: ${JSON.stringify(t.name)}, colour: ${colour}, ratings: [${ratings.join(', ')}] },`;
    });
    d.close();

    return `// ${spec.club} — ${spec.course}. Real course data extracted from golf-serie's
// sqlite DB via scripts/gen-course-seeds.ts. Idempotent: re-running is a no-op.
import type { Scenario } from '../scenario';

const PARS = ${JSON.stringify(pars)} as const;
const STROKE_INDEX = ${JSON.stringify(si)} as const;
const COURSE_PAR = PARS.reduce((a, b) => a + b, 0);

const TEES = [
${teeLiterals.join('\n')}
];

const CLUB_NAME = ${JSON.stringify(spec.club)};
const COURSE_NAME = ${JSON.stringify(spec.course)};

export async function apply(s: Scenario): Promise<void> {
    await s.club(CLUB_NAME);
    await s.course({
        clubName: CLUB_NAME,
        name: COURSE_NAME,
        holeCount: 18,
        holes: PARS.map((par, i) => ({ holeNumber: i + 1, par, strokeIndex: STROKE_INDEX[i]! })),
    });
    for (const t of TEES) {
        await s.tee({
            clubName: CLUB_NAME,
            courseName: COURSE_NAME,
            name: t.name,
            colour: t.colour,
            ratings: t.ratings.map((r) => ({
                gender: r.gender,
                courseRating: r.courseRating,
                slope: r.slope,
                par: COURSE_PAR,
                totalLengthM: 0,
            })),
        });
    }
    // eslint-disable-next-line no-console
    console.log(\`seed: \${CLUB_NAME} / \${COURSE_NAME} + \${TEES.length} tees applied\`);
}
`;
}

const outDir = path.join(import.meta.dir, 'seeds');
for (const spec of SPECS) {
    const file = path.join(outDir, `${spec.seedName}.ts`);
    await Bun.write(file, emit(spec));
    console.log(`✓ ${spec.seedName}.ts  (${spec.club} / ${spec.course})`);
}
console.log(`\nGenerated ${SPECS.length} seed files.`);
