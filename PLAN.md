# Recipebook MVP Launch Plan

## Summary

Build toward a true Phase 1 MVP launch, using a hybrid delivery strategy: establish real Supabase-backed foundations early for auth, core entities, ranking, and media, while allowing lower-risk social and discovery pieces to ship behind stable interfaces and mature in later phases. Structure work so multiple engineers can move in parallel after a short foundation phase, with ranking treated as a first-class subsystem from the start.

## Phases

### Phase 0: Project Foundation and Delivery Skeleton

Goal: make the repo runnable, typed, navigable, and safe for parallel feature work.

Parallel tracks after initial setup:

- App shell: Expo app, TypeScript, Expo Router route groups, NativeWind, shared theme tokens, base layout, loading/error/empty primitives.
- Client architecture: `/lib/api`, `/lib/ranking`, `/store`, `/types`, centralized error handling, query client, auth/session store.
- Backend bootstrap: Supabase project setup, env handling, storage buckets, initial SQL migration strategy, RLS approach.
- Design system baseline: reusable form fields, buttons, cards, avatars, list scaffolds, image picker/upload helpers, toast surface.

Exit criteria:

- App boots on device or simulator.
- Navigation skeleton exists for auth, feed, library, create, profile, notifications.
- Supabase client connects in development.
- Shared component and API patterns are established.

### Phase 1: Core Domain and Data Contracts

Goal: lock the MVP data model and interfaces that other work depends on.

Parallel tracks:

- Database and domain modeling: users/profiles, recipes, meals, meal comparisons, follows, post likes, comments, comment likes, notifications, starred meals.
- Type contracts: app-level TypeScript models and DTO mapping for each core entity; keep Recipe and Meal distinct.
- API wrappers: `users`, `recipes`, `meals`, `ranking`, `comments`, `notifications` modules with stable function signatures.
- Security rules: RLS policies for ownership, visibility, feed reads, comment permissions, likes, follows, and notifications.

Important public interfaces:

- Auth session and user profile shape.
- Recipe create and update payloads.
- Meal create and update payloads with visibility.
- Ranking comparison session and result shape.
- Feed item summary shape.
- Comment thread shape with one-level nested replies capability.

Exit criteria:

- All MVP entities are queryable through API modules.
- RLS supports intended ownership and privacy behavior.
- Frontend can develop against stable contracts without direct table knowledge in screens.

### Phase 2: Auth, Profile, and Media Foundations

Goal: deliver account creation and profile management with real storage and session handling.

Parallel tracks:

- Auth flows: splash/session restore, sign up, sign in, sign out, forgot password, guarded route handling.
- Profile flows: username/display name/bio editing, profile fetch/update, own profile view, other profile view scaffold, follower/following counts.
- Media pipeline: upload helpers for profile, recipe cover, meal hero, step images; image validation, optimistic preview, persisted URLs.
- Settings shell: account/settings screen with notification/privacy placeholders wired to real profile/preferences storage if included in schema.

Exit criteria:

- User can create an account, persist session, edit profile, and upload a profile image.
- Authenticated and unauthenticated routes are reliably separated.
- Media uploads work for profile and are reusable by recipe and meal flows.

### Phase 3: Recipe and Meal Creation

Goal: make structured content creation fully functional before social surfacing.

Parallel tracks:

- Recipe editor: create/edit recipe form with title, description, ingredients, steps, ingredient references in steps, reordering, draft/publish.
- Meal creation: create meal from recipe, title override, caption, hero image, visibility, publish flow.
- Detail/read screens: recipe detail and meal detail skeletons using real data and ownership checks.
- Validation/state: React Hook Form schemas, draft handling, unsaved state behavior, upload integration, mutation/error flows.

Exit criteria:

- User can create a recipe with dynamic ingredients/steps and publish it.
- User can create a meal from a recipe and publish it.
- Recipe and Meal detail screens display persisted content correctly.

### Phase 4: Ranking Engine and Ranked Library

Goal: ship the app's core differentiator end to end.

Parallel tracks:

- Ranking domain logic: deterministic insertion-based comparison flow in `/lib/ranking`, supporting rank-on-create and rerank.
- Ranking persistence: store comparison history and persist resulting rank state/order for library reads.
- Ranking UI: comparison screen, progress state, resume/cancel behavior, context for current subject meal, post-completion transition.
- Library experience: ranked meal list, visible rank positions, sort/search/filter scaffolding for MVP fields, rerank entry points from list and detail.

Important interface decisions:

- Ranking exposes a comparison-session API that UI consumes; decision logic stays out of screens.
- Persist both comparison events and current rank ordering/state so ranked views are cheap to load and history is reconstructable.

Exit criteria:

- New meal creation immediately enters ranking flow.
- Existing meal can be reranked later through the same subsystem.
- Ranked library renders deterministically from persisted state.

### Phase 5: Social MVP

Goal: make meals socially visible and interactive.

Parallel tracks:

- Feed: chronological feed query, feed card UI, pull-to-refresh, pagination-ready list structure, profile/meals navigation.
- Engagement: like/unlike meal, create/edit/delete comment, one-level reply support in schema and API, comment thread rendering.
- Profile social surfaces: user timeline/posts, starred meals section, follow/unfollow, other-user profile visibility handling.
- Notifications: create notification records for follows, likes, comments, replies, and mention-ready events; notification list and mark-as-read.
- Saved/starred: star/unstar meal, profile surfacing, personal access entry points.

Exit criteria:

- Feed shows real meals from self/followed users according to current visibility rules.
- Users can like and comment on meals.
- Follow relationships affect profile and feed behavior.
- Notifications deep-link into relevant meal/comment/profile targets.

### Phase 6: Hardening for MVP Launch

Goal: close the gap between "works" and "launchable".

Parallel tracks:

- Search/filter pass: library search, tag/cuisine/ingredient filters, sort modes, recent-search scaffolding if time allows.
- Reliability: empty/loading/error states across all main screens, optimistic update review, retry behavior, offline-tolerant UX where cheap.
- QA/test coverage: unit tests for ranking logic and API adapters, component tests for critical forms/screens, manual device matrix and regression checklist.
- Release ops: environment separation, seed/dev data approach, CI for typecheck/tests, EAS preview build path, crash/error monitoring hook-in if chosen.

Exit criteria:

- All Phase 1 acceptance criteria in `SPEC.md` are manually verifiable.
- Ranking logic has automated coverage.
- Preview/release build path is documented and repeatable.

## Parallelization Model

Recommended dependency structure:

1. Phase 0 is mostly shared and should be completed first.
2. After Phase 1 contracts are stable, run three main lanes in parallel:
   - Lane A: auth/profile/media
   - Lane B: recipe/meal creation
   - Lane C: ranking engine and library foundation
3. Feed/social work should start once meal reads, profiles, and follows are stable.
4. Launch hardening can begin before social is fully done, but final QA waits on all MVP flows.

Suggested team split:

- Engineer 1: app shell, auth/profile, settings, shared client infra.
- Engineer 2: schema/RLS/API wrappers, feed/comments/notifications backend-facing work.
- Engineer 3: recipe/meal creation flows and detail screens.
- Engineer 4: ranking engine, comparison UI, ranked library.

## Test Plan

Core scenarios:

- Sign up, restore session, sign out, reset password.
- Create/edit profile with image upload.
- Create recipe with dynamic ingredients, step references, reorder, and publish.
- Create meal from recipe and enter ranking immediately.
- Insert a new meal into an existing ranked list with deterministic results.
- Rerank an existing meal and verify rank updates persist.
- Feed renders meals correctly for owner/follower/public visibility cases.
- Like/unlike meal, add/edit/delete comment, reply, star/unstar meal.
- Follow/unfollow user and verify feed/profile/notification effects.
- Notification deep links open the right meal/comment/profile.
- Library search/filter/sort does not break rank ordering semantics.

Automated coverage priority:

- Ranking insertion/session logic.
- API adapter mapping and permission-sensitive mutations.
- Critical forms: auth, recipe create, meal create.
- Feed and comment thread rendering with loading/error/empty states.

## Assumptions and Defaults

- Supabase is the MVP backend from the start for auth, data, storage, and notification persistence.
- Delivery is hybrid: stable interfaces may exist before every downstream UI is polished.
- The first milestone target is MVP launch, not just internal alpha.
- Ranking uses deterministic insertion-based comparisons now, with comparison history persisted for future upgrades.
- Replies, comment likes, mentions, and richer discovery can be schema-ready early even if some UX polish lands later.
- The MVP privacy model supports at least `public`, `followers`, and `private`, while feed ordering remains chronological.
