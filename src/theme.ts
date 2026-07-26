import { createTokens } from '@basics/core/client/core';
import { neutralLight, neutralDark } from '@basics/core/client/default-theme';

// "Clubhouse scorecard" — warm cream paper, deep fairway-green ink, brass
// accent. High contrast for sunlight; numerals tabular everywhere.
//
// neutralLight/neutralDark are spread FIRST: framework recipes reference
// tokens with no var() fallback (font-ui, space-*, dur-*, shadow-1/2/3, …),
// and an undefined one silently drops the whole declaration. Everything below
// the spread overrides the neutral value. NOTE the vocabulary split: `accent`
// here is the legacy decorative brass used across app components, while the
// framework's ACTION tokens (accent-strong/on-accent — confirm primary,
// select active) are mapped to the fairway green so framework dialogs match
// the app's own primary buttons.

const base = {
    radius: '12px',
    'radius-pill': '999px',
    'radius-sm': '6px',
    'radius-md': '12px',
    'font-display': "'Fraunces', Georgia, serif",
    shadow: '0 1px 2px rgba(30, 53, 38, 0.08)',
    'shadow-elevated': '0 4px 16px rgba(30, 53, 38, 0.14)',
    'shadow-1': '0 1px 2px rgba(30, 53, 38, 0.08)',
    'shadow-2': '0 4px 16px rgba(30, 53, 38, 0.14)',
    'shadow-3': '0 16px 40px rgba(30, 53, 38, 0.22)',
};

export const t = createTokens({
    ...neutralLight,
    ...base,
    bg: '#f2eee2',
    surface: '#fbf9f1',
    'surface-sunken': '#e9e4d4',
    primary: '#2c5e3f',
    'primary-text': '#f7f4ea',
    'btn-bg': '#fbf9f1',
    'btn-hover': '#efeada',
    text: '#1e3526',
    'text-muted': '#6b7a6e',
    border: '#d8d2bf',
    'topbar-bg': '#1e3526',
    'active-bg': '#1e3526',
    'active-text': '#f7f4ea',
    'hover-bg': '#ece7d7',
    'input-bg': '#ffffff',
    accent: '#b08d3e',
    'accent-soft': '#f0e6cd',
    'accent-strong': '#2c5e3f',
    'on-accent': '#f7f4ea',
    'surface-2': '#e9e4d4',
    'border-strong': '#b3ab92',
    danger: '#a0463c',
    'danger-strong': '#7f352d',
    'on-danger': '#f7f4ea',
    error: '#a0463c',
    'under-par': '#a0463c',
    'over-par': '#345b8a',
    'hole-bar': '#e6a23f',
    'hole-bar-text': '#3a2a0d',
}, {
    ...neutralDark,
    ...base,
    'shadow-1': '0 1px 2px rgba(0, 0, 0, 0.3)',
    'shadow-2': '0 4px 16px rgba(0, 0, 0, 0.4)',
    'shadow-3': '0 16px 44px rgba(0, 0, 0, 0.55)',
    bg: '#15231a',
    surface: '#1d2f22',
    'surface-sunken': '#101b14',
    primary: '#5d9b75',
    'primary-text': '#0f1a13',
    'btn-bg': '#24392b',
    'btn-hover': '#2e4836',
    text: '#e6e1d2',
    'text-muted': '#8da093',
    border: '#33493a',
    'topbar-bg': '#0f1a13',
    'active-bg': '#5d9b75',
    'active-text': '#0f1a13',
    'hover-bg': '#273c2e',
    'input-bg': '#101b14',
    accent: '#cfa84f',
    'accent-soft': '#3a3320',
    'accent-strong': '#5d9b75',
    'on-accent': '#0f1a13',
    'surface-2': '#101b14',
    'border-strong': '#4d6653',
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
});
