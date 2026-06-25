import { createScale } from '../core';

/** Reference a theme CSS custom property. */
const t = (name: string) => `var(--${name})`;

export const s = createScale({
    xs: '0.25rem',
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
    '2xl': '2rem',
});

export const btn = (radius = t('radius')) => `
    border: 1px solid ${t('border')};
    border-radius: ${radius};
    background: ${t('btn-bg')};
    color: ${t('text')};
    cursor: pointer;
    transition: background 0.15s;
    &:hover { background: ${t('btn-hover')}; }
`;

export const input = () => `
    border: 1px solid ${t('border')};
    border-radius: ${t('radius')};
    background: ${t('input-bg')};
    color: ${t('text')};
    font-family: inherit;
    &::placeholder { color: ${t('text-muted')}; }
`;

export const card = (options?: { hover?: boolean }) => `
    background: ${t('surface')};
    border: 1px solid ${t('border')};
    border-radius: ${t('radius')};
    box-shadow: ${t('shadow')};
    ${options?.hover ? `
    transition: box-shadow 0.2s, border-color 0.2s;
    &:hover { box-shadow: ${t('shadow-elevated')}; }` : ''}
`;
