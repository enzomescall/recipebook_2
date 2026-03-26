create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  display_name text not null,
  bio text,
  profile_image_url text,
  followers_count integer not null default 0,
  following_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  cover_image_url text,
  cuisine text,
  servings integer,
  prep_time_minutes integer,
  cook_time_minutes integer,
  tags text[] not null default '{}',
  dietary_labels text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  order_index integer not null,
  name text not null,
  quantity text,
  unit text,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.recipe_steps (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  order_index integer not null,
  instruction_text text not null,
  ingredient_references uuid[] not null default '{}',
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  title text not null,
  caption text,
  hero_image_url text,
  visibility text not null default 'public' check (visibility in ('public', 'followers', 'private')),
  rank_position integer not null default 0,
  ranking_state jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.meal_comparisons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  subject_meal_id uuid not null references public.meals (id) on delete cascade,
  compared_against_meal_id uuid not null references public.meals (id) on delete cascade,
  preferred_meal_id uuid not null references public.meals (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.post_likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  meal_id uuid not null references public.meals (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, meal_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  meal_id uuid not null references public.meals (id) on delete cascade,
  parent_comment_id uuid references public.comments (id) on delete cascade,
  body text not null,
  mentioned_user_ids uuid[] not null default '{}',
  like_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comment_likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  comment_id uuid not null references public.comments (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, comment_id)
);

create table if not exists public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (follower_id, following_id)
);

create table if not exists public.starred_meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  meal_id uuid not null references public.meals (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, meal_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references public.profiles (id) on delete cascade,
  actor_user_id uuid references public.profiles (id) on delete set null,
  type text not null check (type in ('follow', 'meal_like', 'meal_comment', 'comment_reply', 'comment_like', 'mention', 'meal_star')),
  target_id uuid not null,
  secondary_target_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.apply_follow_counts()
returns trigger
language plpgsql
as $$
begin
  if (tg_op = 'INSERT') then
    update public.profiles set following_count = following_count + 1 where id = new.follower_id;
    update public.profiles set followers_count = followers_count + 1 where id = new.following_id;
    return new;
  end if;

  if (tg_op = 'DELETE') then
    update public.profiles set following_count = greatest(following_count - 1, 0) where id = old.follower_id;
    update public.profiles set followers_count = greatest(followers_count - 1, 0) where id = old.following_id;
    return old;
  end if;

  return null;
end;
$$;

alter table public.profiles enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.recipe_steps enable row level security;
alter table public.meals enable row level security;
alter table public.meal_comparisons enable row level security;
alter table public.post_likes enable row level security;
alter table public.comments enable row level security;
alter table public.comment_likes enable row level security;
alter table public.follows enable row level security;
alter table public.starred_meals enable row level security;
alter table public.notifications enable row level security;

create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger recipes_updated_at
before update on public.recipes
for each row execute function public.set_updated_at();

create trigger meals_updated_at
before update on public.meals
for each row execute function public.set_updated_at();

create trigger comments_updated_at
before update on public.comments
for each row execute function public.set_updated_at();

create trigger follows_count_changed
after insert or delete on public.follows
for each row execute function public.apply_follow_counts();

create policy "Profiles are readable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users manage their profile"
  on public.profiles for all
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Recipes are readable by visibility"
  on public.recipes for select
  to authenticated
  using (owner_id = auth.uid() or status = 'published');

create policy "Users manage their recipes"
  on public.recipes for all
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Recipe ingredients follow recipe access"
  on public.recipe_ingredients for select
  to authenticated
  using (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_id and (r.owner_id = auth.uid() or r.status = 'published')
    )
  );

create policy "Recipe ingredients are editable by owner"
  on public.recipe_ingredients for all
  to authenticated
  using (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_id and r.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_id and r.owner_id = auth.uid()
    )
  );

create policy "Recipe steps follow recipe access"
  on public.recipe_steps for select
  to authenticated
  using (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_id and (r.owner_id = auth.uid() or r.status = 'published')
    )
  );

create policy "Recipe steps are editable by owner"
  on public.recipe_steps for all
  to authenticated
  using (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_id and r.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_id and r.owner_id = auth.uid()
    )
  );

create policy "Meals are readable by visibility"
  on public.meals for select
  to authenticated
  using (
    owner_id = auth.uid()
    or visibility = 'public'
    or (
      visibility = 'followers'
      and exists (
        select 1 from public.follows f
        where f.follower_id = auth.uid() and f.following_id = owner_id
      )
    )
  );

create policy "Users manage their meals"
  on public.meals for all
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Meal comparisons are private to creator"
  on public.meal_comparisons for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Likes are readable"
  on public.post_likes for select
  to authenticated
  using (true);

create policy "Users manage their likes"
  on public.post_likes for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Comments are readable by meal access"
  on public.comments for select
  to authenticated
  using (
    exists (
      select 1 from public.meals m
      where m.id = meal_id
      and (
        m.owner_id = auth.uid()
        or m.visibility = 'public'
        or (
          m.visibility = 'followers'
          and exists (
            select 1 from public.follows f
            where f.follower_id = auth.uid() and f.following_id = m.owner_id
          )
        )
      )
    )
  );

create policy "Users manage their comments"
  on public.comments for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Comment likes are readable"
  on public.comment_likes for select
  to authenticated
  using (true);

create policy "Users manage their comment likes"
  on public.comment_likes for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users manage their follows"
  on public.follows for all
  to authenticated
  using (follower_id = auth.uid())
  with check (follower_id = auth.uid());

create policy "Starred meals are private to owner"
  on public.starred_meals for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Notifications are private to recipient"
  on public.notifications for all
  to authenticated
  using (recipient_user_id = auth.uid())
  with check (recipient_user_id = auth.uid());

create index if not exists recipes_owner_id_idx on public.recipes (owner_id, created_at desc);
create index if not exists meals_owner_rank_idx on public.meals (owner_id, rank_position asc);
create index if not exists comments_meal_created_idx on public.comments (meal_id, created_at asc);
create index if not exists follows_follower_idx on public.follows (follower_id);
create index if not exists notifications_recipient_idx on public.notifications (recipient_user_id, created_at desc);
