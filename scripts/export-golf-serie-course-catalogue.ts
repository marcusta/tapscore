// One-shot maintainer tool: freeze a downloaded golf-serie production
// database into the committed catalogue consumed by the production importer.
//
// SOURCE_DB_PATH=/path/to/golf-serie.sqlite bun run export:golf-serie-courses

import * as fs from 'node:fs';
import * as path from 'node:path';
import { Database } from 'bun:sqlite';
import { readGolfSerieCatalogue, type GolfSerieCourseCatalogue } from './golf-serie-course-catalogue';

const sourcePath = process.env.SOURCE_DB_PATH;
if (!sourcePath || !fs.existsSync(sourcePath)) {
    console.error('SOURCE_DB_PATH must name a downloaded golf-serie SQLite database.');
    process.exit(1);
}

const source = new Database(sourcePath, { readonly: true });
try {
    const courses = readGolfSerieCatalogue(source);
    const catalogue: GolfSerieCourseCatalogue = {
        schemaVersion: 1,
        source: 'golf-serie production database',
        exportedAt: new Date().toISOString(),
        courses,
    };
    const outputPath = path.join(import.meta.dir, 'data', 'golf-serie-courses.json');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    await Bun.write(outputPath, `${JSON.stringify(catalogue, null, 2)}\n`);
    console.log(`wrote ${courses.length} courses to ${outputPath}`);
} finally {
    source.close();
}
