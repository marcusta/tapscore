// Phase 3 seed — manual handicap maintenance chain.
//
// A registered player edits their handicap index three times over a few
// months. Each edit goes through `PlayerService.updateHandicapIndex`, which
// is the real Phase 3 write path: it updates the live `players.handicap_index`
// column AND appends a `handicap_history` row (source `'manual'`, effective
// date, `entered_by_player_id` = the player themself — self-service edit, no
// federation/WHS posting per the 2026-07-03 scope decision). The verify page
// renders the resulting append-only chain oldest → newest.
//
// Chain: 18.4 (registration, effective today) → 17.9 → 17.5 (current).
// `selfRegister` always dates its history row "today" (no custom-date param),
// so the two follow-up edits use FUTURE effective dates to stay chronologically
// after it — the ordering the verify page checks is by `effective_date`, not
// wall-clock creation time.

import type { Scenario } from '../scenario';

export const MANUAL_HANDICAP_USERNAME = 'greta-manual-hcp';

export async function apply(s: Scenario): Promise<void> {
    const existing = (await s.services.playerService.list()).find(
        (p) => p.username === MANUAL_HANDICAP_USERNAME,
    );
    if (existing) {
        // eslint-disable-next-line no-console
        console.log(`seed: player-manual-handicap already present (player ${existing.id.slice(0, 8)})`);
        return;
    }

    // selfRegister with a starting index writes the FIRST manual history row
    // (18.4, effective the registration date, entered by self).
    const player = await s.services.playerService.selfRegister({
        username: MANUAL_HANDICAP_USERNAME,
        password: 'password123',
        displayName: 'Greta Lindqvist',
        handicapIndex: 18.4,
    });

    // Two later edits — each a separate manual history row with an explicit
    // effective date, chronologically after registration (see note above on
    // why these are future-dated relative to "today").
    await s.services.playerService.updateHandicapIndex(player.id, 17.9, '2026-08-01');
    await s.services.playerService.updateHandicapIndex(player.id, 17.5, '2026-09-15');

    // eslint-disable-next-line no-console
    console.log(`seed: player-manual-handicap created (player ${player.id.slice(0, 8)}, chain 18.4 -> 17.9 -> 17.5)`);
}
