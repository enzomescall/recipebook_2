-- Add ranking + versioning fields to recipes
ALTER TABLE public.recipes
  ADD COLUMN rank_position integer NOT NULL DEFAULT 0,
  ADD COLUMN parent_recipe_id uuid REFERENCES public.recipes(id) ON DELETE SET NULL,
  ADD COLUMN version_number integer NOT NULL DEFAULT 1;

-- Index for ranked recipe lists
CREATE INDEX recipes_owner_rank_idx ON public.recipes (owner_id, rank_position ASC);

-- Seed rank_position for existing recipes (per owner, ordered by created_at)
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY owner_id ORDER BY created_at) AS rn
  FROM public.recipes
)
UPDATE public.recipes SET rank_position = ranked.rn FROM ranked WHERE recipes.id = ranked.id;

-- Recipe comparisons table (mirrors meal_comparisons)
CREATE TABLE public.recipe_comparisons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_recipe_id uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  compared_against_recipe_id uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  preferred_recipe_id uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.recipe_comparisons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recipe comparisons are private to creator"
  ON public.recipe_comparisons FOR ALL USING (auth.uid() = user_id);
