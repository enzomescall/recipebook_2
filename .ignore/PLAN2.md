# Parallelizable Implementation Queue

## Summary

Use a 3-wave queue so subagents can work in parallel without stepping on the same files. Prioritize MVP-critical work first: detail surfaces, ranking completion, media foundation, and social data APIs. Treat each lane as an owned subsystem with a narrow write scope and explicit outputs.

## Wave 1: Start Immediately in Parallel

### Lane A: Detail Surfaces and Navigation
Owner scope: app routes for detail/edit entry, read-side meal/recipe API helpers, shared detail view composition.

Deliver:
- Add meal detail screen and recipe detail screen.
- Add navigation into meal detail from feed and library.
- Add edit entry points from detail/list surfaces, even if edit recipe is still partial.
- Add read-side API helpers for single meal and single recipe fetches with joined owner/recipe data as needed.

Public/interface additions:
- `getMealById(mealId)`
- `getRecipeById(recipeId)`
- Route params for meal and recipe detail screens.

Acceptance:
- Tapping a feed or library item opens the correct meal detail.
- Meal detail links to recipe detail.
- Owner-only actions are visible only for owned content.

Dependencies:
- None. This lane can start now.

### Lane B: Ranking Completion
Owner scope: `app/(app)/create.tsx`, `app/(app)/ranking.tsx`, ranking hooks/helpers, rank persistence improvements.

Deliver:
- Auto-launch ranking immediately after meal creation.
- Make ranking screen accept a subject meal id via navigation params.
- Add rerank entry from each library meal row and meal detail.
- Persist final rank updates in one deterministic write path rather than ad hoc per-screen behavior.
- Add comparison session resume shape, even if resume UI is lightweight.

Public/interface additions:
- Ranking route/search params: `subjectMealId`, optional `mode=create|rerank`
- One reusable “apply ranked order” API entry point

Acceptance:
- Creating a meal lands the user in ranking for that meal.
- Rerank from library/detail opens the same flow.
- Completing ranking updates the library order consistently.

Dependencies:
- Can start now.
- Should coordinate lightly with Lane A on detail-screen rerank entry.

### Lane C: Media Foundation
Owner scope: upload helper layer, image picker wiring, storage-path conventions, image field integration in profile/create flows.

Deliver:
- Add a reusable image pick/upload helper.
- Wire real upload support for profile image, recipe cover, meal hero, and step image fields.
- Replace the temporary profile image URL field UX with picker/upload UX.
- Add storage setup notes to repo docs or env docs if missing.

Public/interface additions:
- `uploadImage({ bucket, path, mimeType, uri })`
- Stable bucket/path naming rules for `profiles/`, `recipes/`, `meals/`, `recipe-steps/`

Acceptance:
- User can pick an image and save it to Supabase storage.
- Saved profile/recipe/meal records store the returned public URL or storage URL consistently.
- Existing forms still work when no image is chosen.

Dependencies:
- Can start now.
- Coordinate with Lane F later for recipe step images.

### Lane D: Social Data/API Layer
Owner scope: `lib/api/*`, feed query helper, notification write helper, domain typing for social actions.

Deliver:
- Add API wrappers for follows, meal likes, starred meals, and comment likes.
- Add a richer feed query helper so screens stop hand-assembling joins.
- Add notification write helpers for follow, like, comment, reply, comment-like, and star events.
- Add actor/target join support for notifications read-side data.

Public/interface additions:
- `toggleFollowUser`
- `toggleMealLike`
- `toggleStarredMeal`
- `toggleCommentLike`
- `getFeedItems`
- `createNotificationForEvent` or equivalent event-specific helpers
- Notification read shape with actor profile and target metadata

Acceptance:
- APIs exist for every MVP social mutation from the spec.
- Feed helper returns owner + meal + recipe shape without screen-level join logic.
- Notification reads are human-readable enough for UI use.

Dependencies:
- Can start now.

## Wave 2: Start Once Wave 1 Outputs Land

### Lane E: Social UI and Interaction Surfaces
Owner scope: feed UI, meal detail social module, comment thread UI, follow/star actions on profile/detail.

Deliver:
- Wire like/unlike, comment, reply, comment-like, follow/unfollow, and star/unstar in UI.
- Put primary interaction surfaces on meal detail first; keep feed interactions lightweight if needed.
- Use Lane D APIs and notification writes for all mutations.

Acceptance:
- Users can perform all MVP social actions from real screens.
- Mutations update visible counts/state via query invalidation or optimistic refresh.
- Social actions generate notifications.

Dependencies:
- Requires Lane D.
- Strongly benefits from Lane A’s meal detail route.

### Lane F: Recipe and Meal Creation Hardening
Owner scope: create flow, recipe editor state, edit recipe flow, ingredient reference wiring.

Deliver:
- Convert create recipe flow from local state to React Hook Form.
- Add edit recipe flow.
- Wire step ingredient references so saved steps point to real ingredients.
- Integrate uploaded recipe cover, meal hero, and step images using Lane C’s helper.

Acceptance:
- User can create and edit a recipe with dynamic ingredients and steps.
- Ingredient references survive save/load.
- Recipe/media fields persist correctly.

Dependencies:
- Requires Lane C for real media UX.
- Independent from social work.

### Lane G: Library Upgrade
Owner scope: library screen, meal-row actions, filter/sort/search behavior.

Deliver:
- Add real sort/filter modes matching the MVP subset in the spec.
- Add rerank entry on each meal row.
- Add navigation from each row into meal detail.
- Keep rank semantics intact when switching sort/filter views.

Acceptance:
- Library supports at least rank/newest/oldest sort and a small first-pass filter set.
- Each row exposes detail and rerank entry.
- Default ranked view remains deterministic.

Dependencies:
- Needs Lane A for detail route.
- Needs Lane B for rerank entry target.

## Wave 3: Hardening and Launch-Critical Finish

### Lane H: Notifications UX Completion
Owner scope: notifications screen and linking behavior.

Deliver:
- Add deep links from notifications into meal detail, comment context, or profile.
- Replace placeholder actor/target labels with real joined names from Lane D.
- Mark-as-read behavior should remain intact.

Acceptance:
- Tapping a notification lands on the correct destination.
- Notification copy references human-readable actor/target data.

Dependencies:
- Requires Lane A and Lane D.
- Benefits from Lane E for comment targets.

### Lane I: Testing and Tooling
Owner scope: test setup, CI/lint/typecheck workflow, highest-value unit coverage.

Deliver:
- Add unit tests for ranking insertion/session logic.
- Add API helper tests for profile/social/ranking write paths.
- Add component tests for critical auth/create/profile flows.
- Add lint and CI to run typecheck and tests.

Acceptance:
- CI runs at minimum typecheck + tests.
- Ranking logic has automated coverage before broader polish.

Dependencies:
- Best started after Wave 1 APIs stabilize.

## Subagent Assignment Defaults

Recommended handoff set if you want 4 subagents right now:
- Subagent 1: Lane A
- Subagent 2: Lane B
- Subagent 3: Lane C
- Subagent 4: Lane D

Recommended second round after merges:
- Subagent 1: Lane E
- Subagent 2: Lane F
- Subagent 3: Lane G
- Subagent 4: Lane H or I depending on how stable the UI/API surface is

Conflict avoidance:
- Lane A owns detail routes and read-side detail helpers.
- Lane B owns ranking flow and create-to-ranking navigation.
- Lane C owns upload helpers and storage integration.
- Lane D owns social API wrappers and notification event writes.
- Do not let more than one lane rewrite the same screen in the same wave.

## Test Plan

- Create meal -> auto-enter ranking -> save order -> library reflects new order.
- Feed item -> meal detail -> recipe detail navigation works end to end.
- Profile/recipe/meal image upload persists and reloads.
- Like/comment/reply/follow/star flows mutate correctly and create notifications.
- Notification tap deep-links into the right destination.
- Library sort/filter does not corrupt persisted rank order.
- Recipe save/load preserves ingredient references in steps.

## Assumptions and Defaults

- Priority is MVP-critical delivery, not perfect polish.
- Meal detail is the primary home for social interactions; feed can stay lighter initially.
- Storage uses Supabase and should be implemented once centrally, then reused.
- Ranking remains deterministic insertion-based; persistence should be centralized rather than screen-specific.
- Query invalidation is acceptable as the default state-sync strategy unless a lane already has a clean optimistic pattern.
