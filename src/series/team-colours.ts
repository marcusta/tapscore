// Team colours for team events. The server stores the colour NAME
// (`teams.colour`), never a hex, so both clients own their own rendering of it.
// The values are mid-tones that hold 4.5:1 against white text and stay legible
// on both the light and the dark surface. A team is never identified by colour
// alone: the name is always printed next to it.

export interface TeamColour {
    id: string;
    label: string;
    hex: string;
}

export const TEAM_COLOURS: readonly TeamColour[] = [
    { id: 'red', label: 'Red', hex: '#b5443a' },
    { id: 'blue', label: 'Blue', hex: '#3a69a8' },
    { id: 'green', label: 'Green', hex: '#3b7a52' },
    { id: 'gold', label: 'Gold', hex: '#a37a1f' },
    { id: 'purple', label: 'Purple', hex: '#7652a3' },
    { id: 'orange', label: 'Orange', hex: '#c0652a' },
];

const FALLBACK = '#6b7a6e';

/** The hex for a stored colour name; an unknown name reads as neutral grey. */
export function teamHex(colour: string): string {
    return TEAM_COLOURS.find((c) => c.id === colour)?.hex ?? FALLBACK;
}
