# Supabase Setup Plan (for MCP-connected session)

## Context

The app's code is fully implemented across all 3 waves. A migration file already exists at `supabase/migrations/0001_initial_schema.sql` that defines every table. Before the app can run against a real Supabase project, the session with MCP access needs to:

1. Apply the migration to the live project
2. Fix two table name mismatches introduced during Wave 1 (code uses wrong names vs what the migration creates)
3. Create the 4 storage buckets used by the image upload helper
4. Add the Supabase env vars to the local `.env` file so the app can connect

---

## Step 1 — Apply the migration

Use MCP to run the SQL in `supabase/migrations/0001_initial_schema.sql` against the connected project. This creates all 12 tables, RLS policies, triggers, indexes, and functions in one shot.

Verify after: confirm these tables exist —
`profiles`, `recipes`, `recipe_ingredients`, `recipe_steps`, `meals`, `meal_comparisons`, `follows`, `post_likes`, `starred_meals`, `comment_likes`, `comments`, `notifications`

---

## Step 2 — Fix two table name mismatches in lib/api/social.ts

**Critical bug**: the code was generated with wrong table names. Fix directly in the file:

| What code uses | What the migration creates | Fix |
|---|---|---|
| `user_follows` | `follows` | rename in social.ts |
| `meal_likes` | `post_likes` | rename in social.ts |

**File to edit:** `lib/api/social.ts`

Changes:
- All `.from('user_follows')` → `.from('follows')`
- All `.from('meal_likes')` → `.from('post_likes')`

There are ~4 occurrences of each. Use find-and-replace across the file.

---

## Step 3 — Create storage buckets

Use MCP to create 4 public storage buckets:

| Bucket name | Public? | Used for |
|---|---|---|
| `profiles` | yes | User avatar images |
| `recipes` | yes | Recipe cover images |
| `meals` | yes | Meal hero images |
| `recipe-steps` | yes | Step instruction images |

All buckets should be public (the app reads public URLs directly into `<Image>` components without auth headers).

---

## Step 4 — Set env vars

Get the project URL and anon key from the Supabase dashboard (Settings → API) and write them to the app's env file.

**File:** `/home/enzo/Documents/Code/recipebook_v2/.env` (create if missing)

```
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

These keys match what `constants/env.ts` and `lib/supabase/client.ts` expect.

---

## Step 5 — Verify end-to-end

After all steps, confirm:

1. **Schema**: use MCP to list tables — all 12 should exist
2. **RLS**: use MCP to check RLS is enabled on each table (the migration enables it)
3. **Buckets**: use MCP to list storage buckets — 4 should exist
4. **App connects**: run `npm start` — the app should no longer show the "Connect Supabase" empty states
5. **Auth flow**: sign up a test user → profile should be created in `profiles` table (the migration has a trigger for this — check if it exists, otherwise profiles.ts `ensureProfileForUser` handles it on sign-in)
6. **Table names**: after fixing social.ts, grep for `user_follows` and `meal_likes` — should return no results

---

## Files modified by this plan

| File | Change |
|---|---|
| `lib/api/social.ts` | `user_follows` → `follows`, `meal_likes` → `post_likes` |
| `.env` | Created with Supabase URL + anon key |
| Supabase project | Migration applied, 4 storage buckets created |

---

## What is NOT needed

- No new tables — the migration already has everything including social tables
- No new migrations — one migration file covers the full schema
- No changes to TypeScript types — the mismatches are only in API query strings, not type definitions
