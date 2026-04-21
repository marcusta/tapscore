import { MANUAL_FORMAT_DB_PATH, verifyManualFormatDb } from './format-fixtures';

const { roundCount } = await verifyManualFormatDb(MANUAL_FORMAT_DB_PATH);
// eslint-disable-next-line no-console
console.log(`check:format-fixtures ok (${roundCount} rounds present)`);
