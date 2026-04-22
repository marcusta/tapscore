// Phase 2.6b/2 — central registration for built-in format strategies.
// Idempotent; safe to call multiple times.

import { clearFormatStrategies, registerFormatStrategy } from '../format-strategy';

import { strokePlayIndividual } from './stroke-play-individual';
import { stablefordIndividual } from './stableford-individual';
import { matchPlayIndividual } from './match-play-individual';
import { kopenhamnareIndividual } from './kopenhamnare-individual';
import { stablefordBetterBall } from './stableford-better-ball';
import { strokePlayFoursomes } from './stroke-play-foursomes';
import { talibanBetterBall } from './taliban-better-ball';
import { umbrella4Ball } from './umbrella-4-ball';
import { umbrellaIndividual } from './umbrella-individual';
import { matchPlayBetterBall } from './match-play-better-ball';

let registered = false;

export function registerBuiltInFormatStrategies(): void {
    if (registered) return;
    registerFormatStrategy(strokePlayIndividual);
    registerFormatStrategy(stablefordIndividual);
    registerFormatStrategy(matchPlayIndividual);
    registerFormatStrategy(kopenhamnareIndividual);
    registerFormatStrategy(stablefordBetterBall);
    registerFormatStrategy(strokePlayFoursomes);
    registerFormatStrategy(talibanBetterBall);
    registerFormatStrategy(umbrella4Ball);
    registerFormatStrategy(umbrellaIndividual);
    registerFormatStrategy(matchPlayBetterBall);
    registered = true;
}

export function resetBuiltInFormatStrategies(): void {
    clearFormatStrategies();
    registered = false;
}
