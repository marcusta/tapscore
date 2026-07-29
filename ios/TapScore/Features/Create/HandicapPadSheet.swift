import SwiftUI

/// The handicap-index keypad (spec §5.7, B5.15–B5.24).
///
/// The field it opens from is NOT text-editable, and this is why: a handicap
/// index has twelve meaningful glyphs, one of which ("+", meaning better than
/// scratch) does not exist as a concept on any system keyboard, and the decimal
/// separator a Swedish phone produces is a comma while the wire wants a dot.
/// A twelve-key pad removes all of that, and it removes the autocorrect bar
/// from a screen where the next thing the user does is start a round.
///
/// Every rule about the string lives in `HandicapPad` — this file only draws
/// the keys and shows what they produce, including the live course handicap
/// (B5.17) so the number that decides how many shots someone gets is visible
/// before it is committed.
struct HandicapPadSheet: View {
    let playerName: String
    let tee: Tee?
    let gender: PlayerGender
    /// The value the row holds now — restored verbatim if the user cancels.
    let initialText: String
    /// Replaces the live course-handicap line under the draft. The create flow
    /// leaves this `nil`; the profile sets it, because "Pick a tee to see the
    /// course handicap." names an action that screen has no control for.
    let infoText: String?
    /// B5.21 enables Done on an empty draft because in the create flow an empty
    /// commit CLEARS the row. A caller with nothing to clear into (the profile:
    /// the endpoint takes a number, the chain is append-only) turns this off so
    /// Done is not an enabled button that does nothing.
    let allowsEmptyCommit: Bool
    let onCommit: (String) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var pad: HandicapPad

    init(
        playerName: String,
        tee: Tee?,
        gender: PlayerGender,
        initialText: String,
        infoText: String? = nil,
        allowsEmptyCommit: Bool = true,
        onCommit: @escaping (String) -> Void
    ) {
        self.playerName = playerName
        self.tee = tee
        self.gender = gender
        self.initialText = initialText
        self.infoText = infoText
        self.allowsEmptyCommit = allowsEmptyCommit
        self.onCommit = onCommit
        _pad = State(initialValue: HandicapPad(draft: initialText))
    }

    private var canCommit: Bool {
        pad.canCommit && (allowsEmptyCommit || !pad.draft.isEmpty)
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: TapSpacing.lg) {
                header
                keys
                Spacer(minLength: 0)
            }
            .padding(.horizontal, TapSpacing.lg)
            .padding(.top, TapSpacing.md)
            .padding(.bottom, TapSpacing.lg)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
            .background(TapColors.bg)
            .navigationTitle(playerName)
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(TapColors.bg, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    // B5.23: cancel leaves the row exactly as it was.
                    Button("Cancel") { dismiss() }
                        .font(TapFont.ui(size: 16))
                        .foregroundStyle(TapColors.textMuted)
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") {
                        onCommit(pad.committedText)
                        dismiss()
                    }
                    .font(TapFont.ui(size: 16, weight: .bold))
                    .foregroundStyle(canCommit ? TapColors.primary : TapColors.textMuted)
                    // B5.21/B5.22: enabled on empty (it commits a clear, where
                    // the caller allows clearing), disabled on a lone "+",
                    // which is not a number.
                    .disabled(!canCommit)
                }
            }
        }
    }

    // MARK: - Header

    private var header: some View {
        TapCard {
            VStack(alignment: .leading, spacing: TapSpacing.xs) {
                Text(pad.draft.isEmpty ? "HCP index" : pad.draft)
                    .font(TapFont.display(size: 34, weight: .semibold))
                    .foregroundStyle(pad.draft.isEmpty ? TapColors.textMuted : TapColors.text)
                    .monospacedDigit()
                Text(infoText ?? courseHandicapLine)
                    .font(TapFont.ui(size: 12.8))
                    .foregroundStyle(TapColors.textMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(TapSpacing.md)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    /// B5.17 — the course handicap for the value being typed, live. When a
    /// piece is missing it says WHICH, because "nothing here" over a number
    /// that decides shots is the state users read as a bug.
    private var courseHandicapLine: String {
        guard let tee else { return "Pick a tee to see the course handicap." }
        guard TeeOrder.hasRating(tee, for: gender) else {
            return "\(tee.name) has no rating for \(gender == .m ? "men" : "women")."
        }
        guard let value = pad.committedValue,
              let derivation = CourseHandicap.derive(index: value, tee: tee, gender: gender)
        else { return "Course handicap appears here." }
        return CourseHandicap.line(derivation, indexText: pad.draft)
    }

    // MARK: - Keys

    /// B5.16's exact grid, four to a row: `1…9`, `+`, `0`, separator — with the
    /// delete key on the end of the last row.
    private var keys: some View {
        let grid = pad.grid
        return VStack(spacing: TapSpacing.sm) {
            ForEach(Array(stride(from: 0, to: grid.count, by: 3)), id: \.self) { start in
                HStack(spacing: TapSpacing.sm) {
                    ForEach(start..<min(start + 3, grid.count), id: \.self) { index in
                        key(grid[index])
                    }
                    if start + 3 >= grid.count {
                        key(.delete)
                    }
                }
            }
        }
    }

    private func key(_ key: HandicapPad.Key) -> some View {
        let caption = HandicapPad.caption(for: key)
        return Button {
            pad.press(key)
        } label: {
            VStack(spacing: 0) {
                Text(HandicapPad.glyph(for: key, separator: pad.separator))
                    .font(TapFont.display(size: 24, weight: .semibold))
                    .foregroundStyle(TapColors.text)
                if !caption.isEmpty {
                    Text(caption)
                        .font(TapFont.ui(size: 10.4, weight: .medium))
                        .foregroundStyle(TapColors.textMuted)
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: 56)
            .background(RoundedRectangle(cornerRadius: 12).fill(TapColors.btnBg))
            .overlay(RoundedRectangle(cornerRadius: 12).strokeBorder(TapColors.border, lineWidth: 1))
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(accessibilityLabel(key))
    }

    private func accessibilityLabel(_ key: HandicapPad.Key) -> String {
        switch key {
        case .digit(let d): String(d)
        case .plus: "plus handicap"
        case .separator: "decimal separator"
        case .delete: "delete"
        }
    }
}
