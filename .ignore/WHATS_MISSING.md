# Whats Missing

## Current State

- Expo Router app scaffold is in place.
- Auth/session store exists and route guards work.
- Shared UI primitives and theme are set up.
- Supabase client, typed API wrappers, and initial SQL migration exist.
- Feed, notifications, profile, create, library, and ranking screens exist.
- `npm run typecheck` passes.

## Important Files

- Plan: [PLAN.md](/home/enzo/Documents/Code/recipebook_v2/PLAN.md)
- Spec: [SPEC.md](/home/enzo/Documents/Code/recipebook_v2/SPEC.md)
- App shell: [app/_layout.tsx](/home/enzo/Documents/Code/recipebook_v2/app/_layout.tsx)
- Auth store: [store/session.ts](/home/enzo/Documents/Code/recipebook_v2/store/session.ts)
- Supabase client: [lib/supabase/client.ts](/home/enzo/Documents/Code/recipebook_v2/lib/supabase/client.ts)
- Migration: [supabase/migrations/0001_initial_schema.sql](/home/enzo/Documents/Code/recipebook_v2/supabase/migrations/0001_initial_schema.sql)

## What Is Still Missing

### Auth / Profile

- No profile edit screen.
- No profile create/update flow after sign-up.
- No profile image upload flow.
- Sign-up stores metadata in auth, but profile row creation is not wired.

### Recipe / Meal Creation

- Create screen uses local form state, not React Hook Form.
- No edit recipe flow.
- No recipe detail screen.
- No meal detail screen.
- No image upload integration for recipe cover, meal hero, or step images.
- Ingredient references inside steps are not wired; steps save with empty `ingredientReferences`.

### Ranking

- Ranking screen exists, but new meal creation does not automatically launch ranking yet.
- Reranking is manual from library via a separate ranking screen.
- Rank persistence is naive row-by-row updates.
- Comparison history is recorded, but ranking session resume is not implemented.

### Feed / Social

- Feed is read-only.
- No likes, comments, replies, comment likes, follows, or starring wired in UI.
- Feed uses simple readable meal/profile data, not a richer joined feed query.
- No meal detail navigation from feed.

### Notifications

- Notifications are readable and mark-as-read works.
- No deep links.
- No actor/target joins for human-readable names.
- No write-side notification generation from social actions yet.

### Library

- Search is client-side only over loaded meals.
- No real filters or sort modes beyond current ranked list display.
- No rerank entry from each meal row.

### Backend / Data

- Migration is first pass only; likely needs tightening once real write flows expand.
- No storage bucket setup/docs beyond env example.
- No seed data or local Supabase workflow docs.
- No dedicated feed query helper in API layer yet.
- No API wrappers yet for follows, likes, starred meals, comment likes.

### Testing / Tooling

- No unit tests yet.
- No component tests yet.
- No CI.
- No lint setup.

## Known Implementation Notes

- `tsconfig.json` was broadened again to include app/components; keep it that way.
- `lib/api/recipes.ts` now persists recipe row first, then ingredients and steps, then refetches the recipe.
- `lib/api/meals.ts` assigns `rank_position` as `count + 1` on create.
- `app/(app)/ranking.tsx` is a hidden tab route and is reachable from library.
- Missing Supabase env vars should not crash the app; screens show configured-aware empty states.

## Best Next Steps

1. Wire profile row creation/update and build edit profile screen.
2. Add meal detail and recipe detail screens.
3. Auto-launch ranking after meal creation.
4. Implement likes/comments/follows/starred meals plus notification writes.
5. Replace ad hoc screen queries with feature hooks/API helpers where missing.
6. Add tests for ranking logic and API helpers.

## If You Need To Resume Fast

- Start by reading:
  - [WHATS_MISSING.md](/home/enzo/Documents/Code/recipebook_v2/WHATS_MISSING.md)
  - [PLAN.md](/home/enzo/Documents/Code/recipebook_v2/PLAN.md)
  - [app/(app)/create.tsx](/home/enzo/Documents/Code/recipebook_v2/app/(app)/create.tsx)
  - [app/(app)/ranking.tsx](/home/enzo/Documents/Code/recipebook_v2/app/(app)/ranking.tsx)
  - [lib/api/recipes.ts](/home/enzo/Documents/Code/recipebook_v2/lib/api/recipes.ts)
  - [lib/api/meals.ts](/home/enzo/Documents/Code/recipebook_v2/lib/api/meals.ts)
