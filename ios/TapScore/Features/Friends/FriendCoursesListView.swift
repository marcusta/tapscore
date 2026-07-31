import SwiftUI

/// The courses a friend has played — most recently played first.
///
/// The server caps this list and reports the cap with `hasMore`; when it is
/// set, one quiet line says the list is truncated, in words. No count heads
/// the list: the profile card's `coursesTotal` includes courses reached only
/// through private rounds, which never appear here.
struct FriendCoursesListView: View {
    @Environment(AppEnvironment.self) private var environment

    let playerId: String
    let displayName: String

    @State private var store: FriendCoursesStore?

    var body: some View {
        List {
            heading
                .listRowInsets(
                    EdgeInsets(
                        top: TapSpacing.xl,
                        leading: TapSpacing.lg,
                        bottom: TapSpacing.lg,
                        trailing: TapSpacing.lg
                    )
                )
                .plainRow()

            if let store {
                rows(store)
            } else {
                spinnerRow
            }
        }
        .listStyle(.plain)
        .scrollContentBackground(.hidden)
        .background(TapColors.bg)
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(TapColors.bg, for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
        .refreshable {
            if let store { await store.load(force: true) }
        }
        .task {
            guard store == nil else { return }
            let created = FriendCoursesStore(playerId: playerId, api: environment.api)
            store = created
            await created.load()
        }
        .accessibilityIdentifier("friend-courses-screen")
    }

    private var heading: some View {
        VStack(alignment: .leading, spacing: TapSpacing.xs) {
            Text("Courses")
                .font(TapFont.display(size: 27.2, weight: .semibold))
                .foregroundStyle(TapColors.text)
            Text("Where \(displayName) has played the rounds they share.")
                .font(TapFont.ui(size: 14.4))
                .foregroundStyle(TapColors.textMuted)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    @ViewBuilder
    private func rows(_ store: FriendCoursesStore) -> some View {
        if let refusal = store.unavailable {
            RoundEmptyState(
                title: refusal.title,
                systemImage: refusal.systemImage,
                message: refusal.message
            )
            .plainRow()
        } else if let error = store.loadError, store.courses.isEmpty {
            // Only when there is nothing to show — a failed REFRESH keeps the
            // rows the store deliberately preserved.
            VStack(alignment: .leading, spacing: TapSpacing.sm) {
                errorText(error)
                Button("Try again") { Task { await store.load(force: true) } }
                    .buttonStyle(.tap(.secondary))
            }
            .listRowInsets(
                EdgeInsets(top: 0, leading: TapSpacing.lg, bottom: 0, trailing: TapSpacing.lg)
            )
            .plainRow()
        } else if store.loading, !store.loaded {
            spinnerRow
        } else if store.loaded, store.courses.isEmpty {
            hint("No courses to show — no rounds are shared with you.")
                .listRowInsets(
                    EdgeInsets(top: 0, leading: TapSpacing.lg, bottom: 0, trailing: TapSpacing.lg)
                )
                .plainRow()
        } else {
            ForEach(store.courses, id: \.courseId) { course in
                TapCard {
                    HStack(spacing: TapSpacing.md) {
                        VStack(alignment: .leading, spacing: 1) {
                            Text(course.courseName ?? "Course")
                                .font(TapFont.ui(size: 16, weight: .semibold))
                                .foregroundStyle(TapColors.text)
                                .lineLimit(1)
                            Text(FriendProfileModel.courseLine(course))
                                .font(TapFont.ui(size: 12.8))
                                .foregroundStyle(TapColors.textMuted)
                                .lineLimit(1)
                        }
                        Spacer(minLength: 0)
                    }
                    .padding(.vertical, TapSpacing.md)
                    .padding(.horizontal, TapSpacing.lg)
                    .accessibilityElement(children: .combine)
                }
                .listRowInsets(
                    EdgeInsets(
                        top: 0,
                        leading: TapSpacing.lg,
                        bottom: TapSpacing.sm,
                        trailing: TapSpacing.lg
                    )
                )
                .plainRow()
            }

            if store.hasMore {
                hint("Showing the courses played most recently — the full list is longer.")
                    .listRowInsets(
                        EdgeInsets(
                            top: TapSpacing.xs,
                            leading: TapSpacing.lg,
                            bottom: 0,
                            trailing: TapSpacing.lg
                        )
                    )
                    .plainRow()
            }
        }
    }

    private var spinnerRow: some View {
        ProgressView()
            .frame(maxWidth: .infinity)
            .padding(.vertical, TapSpacing.lg)
            .listRowInsets(EdgeInsets())
            .plainRow()
    }

    private func hint(_ text: String) -> some View {
        Text(text)
            .font(TapFont.ui(size: 13.2))
            .foregroundStyle(TapColors.textMuted)
            .fixedSize(horizontal: false, vertical: true)
    }

    private func errorText(_ text: String) -> some View {
        Text(text)
            .font(TapFont.ui(size: 13.6))
            .foregroundStyle(TapColors.danger)
            .fixedSize(horizontal: false, vertical: true)
    }
}
