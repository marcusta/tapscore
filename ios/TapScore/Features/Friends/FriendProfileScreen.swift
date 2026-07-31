import SwiftUI

/// A friend's profile — reached only from a MUTUAL row in `FriendsView`.
///
/// Named `FriendProfileScreen` because the wire payload it renders is the
/// generated `FriendProfileView` struct; two types cannot share the name.
///
/// Read-only by construction: the three stores behind this surface hold a
/// player id and call session-authorized reads, nothing else. A tapped round
/// opens the existing spectate surface by round ID — never by token, which the
/// profile payload does not carry in the first place.
///
/// The card's counts and the lists below them disagree on purpose (private and
/// link rounds count, only `friends`-visible ones list). This screen keeps the
/// two apart: the aggregates live on the profile card, and no list header or
/// terminal row ever restates a count.
struct FriendProfileScreen: View {
    @Environment(AppEnvironment.self) private var environment

    let playerId: String
    /// Carried from the row the viewer tapped, so the header has a name before
    /// the payload lands. Presentation only.
    let displayName: String
    /// Opens the spectate surface for a tapped round.
    let onOpenRound: (String) -> Void
    let onSeeAllRounds: () -> Void
    let onSeeCourses: () -> Void

    @State private var store: FriendProfileStore?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: TapSpacing.xl) {
                content
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, TapSpacing.lg)
            .padding(.top, TapSpacing.lg)
            .padding(.bottom, TapSpacing.xxl)
        }
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
            let created = FriendProfileStore(playerId: playerId, api: environment.api)
            store = created
            await created.load()
        }
        .accessibilityIdentifier("friend-profile-screen")
    }

    // MARK: - States

    @ViewBuilder
    private var content: some View {
        if let store {
            if let refusal = store.unavailable {
                // The name still heads the refusal: the viewer pushed this
                // screen for a specific person, possibly minutes ago, and an
                // anonymous "Profile not available" would not say whose.
                nameHeading
                RoundEmptyState(
                    title: refusal.title,
                    systemImage: refusal.systemImage,
                    message: refusal.message
                )
            } else if let error = store.loadError, store.profile == nil {
                nameHeading
                VStack(alignment: .leading, spacing: TapSpacing.sm) {
                    errorText(error)
                    Button("Try again") { Task { await store.load(force: true) } }
                        .buttonStyle(.tap(.secondary))
                }
            } else if let profile = store.profile {
                profileCard(profile)
                recentRounds(profile)
                coursesCard(profile)
            } else {
                nameHeading
                loadingSpinner
            }
        } else {
            nameHeading
            loadingSpinner
        }
    }

    /// The name from the tapped row, shown while the payload has not landed
    /// (and on refusal, where it never will). The loaded profile card renders
    /// its own header, so this never doubles it.
    private var nameHeading: some View {
        Text(displayName)
            .font(TapFont.display(size: 27.2, weight: .semibold))
            .foregroundStyle(TapColors.text)
            .lineLimit(1)
    }

    private var loadingSpinner: some View {
        ProgressView()
            .controlSize(.large)
            .tint(TapColors.primary)
            .frame(maxWidth: .infinity)
            .padding(.vertical, TapSpacing.xxl)
    }

    // MARK: - Profile card

    private func profileCard(_ profile: FriendProfileView) -> some View {
        TapCard {
            VStack(alignment: .leading, spacing: TapSpacing.lg) {
                HStack(spacing: TapSpacing.md) {
                    TapAvatar(
                        playerId: profile.player.id,
                        avatarVersion: profile.player.avatarVersion,
                        displayName: profile.player.displayName,
                        username: profile.player.username,
                        size: 56,
                        fontSize: 19.2
                    )
                    VStack(alignment: .leading, spacing: 1) {
                        Text(profile.player.displayName)
                            .font(TapFont.display(size: 20.8, weight: .semibold))
                            .foregroundStyle(TapColors.text)
                            .lineLimit(1)
                        Text("@\(profile.player.username)")
                            .font(TapFont.ui(size: 12.8))
                            .foregroundStyle(TapColors.textMuted)
                            .lineLimit(1)
                        // Nullable, so absent — never a dash.
                        if let club = profile.player.homeClubName, !club.isEmpty {
                            Text(club)
                                .font(TapFont.ui(size: 12.8))
                                .foregroundStyle(TapColors.textMuted)
                                .lineLimit(1)
                        }
                    }
                    Spacer(minLength: 0)
                    // Same rule as the club: no handicap, no element.
                    if let handicap = profile.player.handicapIndex {
                        Text(FriendListModel.handicap(handicap))
                            .font(TapFont.ui(size: 13.6, weight: .bold))
                            .foregroundStyle(TapColors.accent)
                            .padding(.vertical, 2)
                            .padding(.horizontal, 10)
                            .background(Capsule().fill(TapColors.accentSoft))
                            .accessibilityLabel(
                                "Handicap \(FriendListModel.handicap(handicap))"
                            )
                    }
                }

                // The aggregates — the one place the full counts belong. They
                // include rounds the lists below will not show, by design.
                HStack(spacing: 0) {
                    stat(Int(profile.roundsTotal), label: "Rounds")
                    stat(Int(profile.roundsThisYear), label: "This year")
                    stat(Int(profile.coursesTotal), label: "Courses")
                }
            }
            .padding(TapSpacing.lg)
        }
    }

    private func stat(_ value: Int, label: String) -> some View {
        VStack(spacing: 1) {
            Text("\(value)")
                .font(TapFont.display(size: 19.2, weight: .semibold))
                .foregroundStyle(TapColors.text)
            Text(label)
                .font(TapFont.ui(size: 12))
                .foregroundStyle(TapColors.textMuted)
        }
        .frame(maxWidth: .infinity)
        .accessibilityElement(children: .combine)
    }

    // MARK: - Recent rounds

    @ViewBuilder
    private func recentRounds(_ profile: FriendProfileView) -> some View {
        VStack(alignment: .leading, spacing: TapSpacing.md) {
            SectionHeader(title: "Recent rounds", size: 17.6)
            if profile.recentRounds.isEmpty {
                // The aggregates above may say plenty — the list can still be
                // empty, because only rounds shared with friends appear here.
                hint("No rounds are shared with you.")
            } else {
                TapCard {
                    VStack(spacing: 0) {
                        ForEach(profile.recentRounds, id: \.roundId) { entry in
                            Button {
                                onOpenRound(entry.roundId)
                            } label: {
                                FriendRoundRow(entry: entry)
                            }
                            .buttonStyle(.plain)
                            .accessibilityHint("Opens this round read-only")
                            Divider().overlay(TapColors.border)
                        }
                        // The same full-width chevron row the courses card and
                        // the profile's dashboard entry use — one "go deeper"
                        // affordance per family, at a real tap height.
                        Button {
                            onSeeAllRounds()
                        } label: {
                            HStack(spacing: TapSpacing.md) {
                                Text("See all rounds")
                                    .font(TapFont.ui(size: 14.4, weight: .semibold))
                                    .foregroundStyle(TapColors.text)
                                Spacer(minLength: 0)
                                Image(systemName: "chevron.right")
                                    .font(TapFont.ui(size: 12.8, weight: .bold))
                                    .foregroundStyle(TapColors.accent)
                            }
                            .padding(.vertical, TapSpacing.md)
                            .padding(.horizontal, TapSpacing.lg)
                            .frame(minHeight: 44)
                            .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                        .accessibilityIdentifier("friend-profile-see-all-rounds")
                    }
                }
            }
        }
    }

    // MARK: - Courses

    private func coursesCard(_ profile: FriendProfileView) -> some View {
        VStack(alignment: .leading, spacing: TapSpacing.md) {
            SectionHeader(title: "Courses", size: 17.6)
            TapCard {
                Button {
                    onSeeCourses()
                } label: {
                    HStack(spacing: TapSpacing.md) {
                        VStack(alignment: .leading, spacing: 1) {
                            Text(FriendProfileModel.coursesSummary(Int(profile.coursesTotal)))
                                .font(TapFont.ui(size: 16, weight: .semibold))
                                .foregroundStyle(TapColors.text)
                            Text("See where they play")
                                .font(TapFont.ui(size: 12.8))
                                .foregroundStyle(TapColors.textMuted)
                        }
                        Spacer(minLength: 0)
                        Image(systemName: "chevron.right")
                            .font(TapFont.ui(size: 12.8, weight: .bold))
                            .foregroundStyle(TapColors.accent)
                    }
                    .padding(.vertical, TapSpacing.md)
                    .padding(.horizontal, TapSpacing.lg)
                    .frame(minHeight: 44)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityLabel(
                    "\(FriendProfileModel.coursesSummary(Int(profile.coursesTotal))). See the courses."
                )
            }
        }
    }

    // MARK: - Small helpers

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

/// One round on a friend's profile — shared by the profile card's short list
/// and the full `FriendRoundsListView`, so the two cannot drift in what a
/// round row says.
struct FriendRoundRow: View {
    let entry: FriendProfileRoundEntry

    var body: some View {
        HStack(spacing: TapSpacing.md) {
            VStack(alignment: .leading, spacing: 1) {
                Text(FriendProfileModel.title(entry))
                    .font(TapFont.ui(size: 16, weight: .semibold))
                    .foregroundStyle(TapColors.text)
                    .lineLimit(1)
                Text(subtitle)
                    .font(TapFont.ui(size: 12.8))
                    .foregroundStyle(TapColors.textMuted)
                    .lineLimit(1)
            }
            Spacer(minLength: 0)
            Text(FriendProfileModel.progress(entry))
                .font(TapFont.ui(size: 13.6, weight: .bold))
                .foregroundStyle(TapColors.accent)
        }
        .padding(.vertical, TapSpacing.md)
        .padding(.horizontal, TapSpacing.lg)
        .contentShape(Rectangle())
        .accessibilityElement(children: .combine)
    }

    /// The date, plus the course when the title is the organizer's own name
    /// for the round (otherwise the course IS the title and repeating it says
    /// nothing).
    private var subtitle: String {
        let date = FriendProfileModel.displayDate(entry.date)
        if let name = entry.name, !name.isEmpty,
           let course = entry.courseName, !course.isEmpty {
            return "\(date) · \(course)"
        }
        return date
    }
}
