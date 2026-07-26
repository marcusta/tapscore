import { createTokens } from '@basics/core/client/core';
import { bridgeLegacyControls, neutralLight, neutralDark } from '@basics/core/client/default-theme';

// "Clubhouse scorecard" — warm cream paper, deep fairway-green ink, brass
// accent. High contrast for sunlight; numerals tabular everywhere.
//
// The theme is written in the legacy vocabulary (radius/border/input-bg/…);
// bridgeLegacyControls derives the 1.x control tokens (--field-*, --btn-*)
// from it so fields and buttons keep this exact look, and fills everything
// else from the neutral base so no recipe token is left undefined.
//
// Vocabulary split kept on purpose: `accent` is the legacy decorative brass
// used across app components, while the framework's ACTION tokens
// (accent-strong/on-accent — confirm primary, select active) map to the
// fairway green so framework dialogs match the app's own primary buttons.

const base = {
    radius: '12px',
    'radius-pill': '999px',
    'radius-sm': '6px',
    'font-display': "'Fraunces', Georgia, serif",
    shadow: '0 1px 2px rgba(30, 53, 38, 0.08)',
    'shadow-elevated': '0 4px 16px rgba(30, 53, 38, 0.14)',
};

export const t = createTokens(
    bridgeLegacyControls({
        ...base,
        bg: '#f2eee2',
        surface: '#fbf9f1',
        'surface-sunken': '#e9e4d4',
        'surface-2': '#e9e4d4',
        primary: '#2c5e3f',
        'primary-text': '#f7f4ea',
        'btn-bg': '#fbf9f1',
        'btn-hover': '#efeada',
        text: '#1e3526',
        'text-muted': '#6b7a6e',
        border: '#d8d2bf',
        'border-strong': '#b3ab92',
        'topbar-bg': '#1e3526',
        'active-bg': '#1e3526',
        'active-text': '#f7f4ea',
        'hover-bg': '#ece7d7',
        'input-bg': '#ffffff',
        accent: '#b08d3e',
        'accent-soft': '#f0e6cd',
        'accent-strong': '#2c5e3f',
        'on-accent': '#f7f4ea',
        danger: '#a0463c',
        'danger-strong': '#7f352d',
        'on-danger': '#f7f4ea',
        error: '#a0463c',
        'under-par': '#a0463c',
        'over-par': '#345b8a',
        'hole-bar': '#e6a23f',
        'hole-bar-text': '#3a2a0d',
    }, neutralLight),
    bridgeLegacyControls({
        ...base,
        bg: '#15231a',
        surface: '#1d2f22',
        'surface-sunken': '#101b14',
        'surface-2': '#101b14',
        primary: '#5d9b75',
        'primary-text': '#0f1a13',
        'btn-bg': '#24392b',
        'btn-hover': '#2e4836',
        text: '#e6e1d2',
        'text-muted': '#8da093',
        border: '#33493a',
        'border-strong': '#4d6653',
        'topbar-bg': '#0f1a13',
        'active-bg': '#5d9b75',
        'active-text': '#0f1a13',
        'hover-bg': '#273c2e',
        'input-bg': '#101b14',
        accent: '#cfa84f',
        'accent-soft': '#3a3320',
        'accent-strong': '#5d9b75',
        'on-accent': '#0f1a13',
        danger: '#d48a82',
        'danger-strong': '#e0a49d',
        'on-danger': '#15231a',
        error: '#d48a82',
        'under-par': '#d48a82',
        'over-par': '#8db2e0',
        'hole-bar': '#c08a35',
        'hole-bar-text': '#160f04',
        shadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
        'shadow-elevated': '0 4px 16px rgba(0, 0, 0, 0.4)',
    }, neutralDark),
);
