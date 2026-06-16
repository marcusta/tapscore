// Swipe math for the hole-header carousel, ported from golf-serie's
// score-entry/holeCarousel.ts. Index-based and CLAMPED (a golf round is linear
// — never wrap occurrence 18 back to occurrence 1, unlike the source's modulo).

const MOMENTUM_PROJECTION_MS = 180;
const MAX_STEPS = 4;
const MIN_DRAG = 12;

export function clampIndex(index: number, length: number): number {
    if (length <= 0) return 0;
    return Math.max(0, Math.min(length - 1, index));
}

/**
 * How many occurrences a drag (with release momentum) should advance. Positive
 * = forward (dragged left). Returns 0 below the minimum drag distance so a tap
 * never changes the hole.
 */
export function stepsFromDrag(input: {
    dragDistance: number;
    velocity: number;
    itemWidth: number;
}): number {
    const { dragDistance, velocity, itemWidth } = input;
    if (itemWidth <= 0 || Math.abs(dragDistance) < MIN_DRAG) return 0;
    const projected = dragDistance + velocity * MOMENTUM_PROJECTION_MS;
    const steps = Math.round(-projected / itemWidth);
    return Math.max(-MAX_STEPS, Math.min(MAX_STEPS, steps));
}
