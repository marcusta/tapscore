import CoreGraphics

/// The spacing scale every web component lays out on.
///
/// Source: `s()` in `@basics/core/client/ui/css` (re-exported by `src/css.ts`),
/// a `rem` scale converted here at the 16px root. Hand-written rather than
/// generated: the scale is exposed to the web as a lookup *function*, so the
/// values are not readable as data the way `src/theme.ts`'s tables are.
///
/// The generated `TapMetrics.space1…space8` is a different, framework-internal
/// scale that this app's components do not use. Lay out with these.
enum TapSpacing {
    /// `s('xs')` — 0.25rem
    static let xs: CGFloat = 4
    /// `s('sm')` — 0.5rem
    static let sm: CGFloat = 8
    /// `s('md')` — 0.75rem
    static let md: CGFloat = 12
    /// `s('lg')` — 1rem
    static let lg: CGFloat = 16
    /// `s('xl')` — 1.5rem
    static let xl: CGFloat = 24
    /// `s('2xl')` — 2rem
    static let xxl: CGFloat = 32
    /// `s('3xl')` — 3rem
    static let xxxl: CGFloat = 48
}
