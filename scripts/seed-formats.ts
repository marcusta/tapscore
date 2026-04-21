import { MANUAL_FORMAT_DB_PATH, rebuildManualFormatDb } from './format-fixtures';

const { roundCount, dbPath } = await rebuildManualFormatDb(MANUAL_FORMAT_DB_PATH);
// eslint-disable-next-line no-console
console.log(`seed:formats rebuilt ${roundCount} manual fixture rounds in ${dbPath}`);
