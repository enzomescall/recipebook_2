# Recipebook Design Context

## Purpose

Recipebook exists at the intersection of three needs that no single app covers well:

1. **Store recipes with photos** so you remember what you made and how
2. **Rank them** so you can find your best ones without scrolling through everything
3. **Share with friends** so cooking becomes social without needing Instagram

The ranking mechanic is the differentiator. It's not a star rating — it's a direct comparison ("which was better, this or that?") that builds a ranked list over time. This should feel like the most fun part of the app.

## Audience

Home cooks. Not food bloggers, not professional chefs, not recipe-obsessed enthusiasts. People who cook a few times a week and want to remember what worked. The bar is: someone who has never used a recipe app before should be able to create a recipe, rank it, and share it in under two minutes without reading instructions.

The app must be fully useful if you never touch social features. The library and ranking are the core. Social is a layer on top — present but never in the way.

## Aesthetic direction

**Clean, professional, artisanal.**

Think of a well-designed cookbook that happens to be on your phone. Not sterile, not playful, not maximalist. Warm without being rustic. Confident whitespace. Typography does the heavy lifting.

### Reference: Beli
- Ranking mechanic is the hero interaction, not a buried settings page
- Cards are clean with generous whitespace
- Social features feel lightweight — you see friends' lists, you compare overlap
- Copy has personality without being cute ("What'd you eat?")
- The core loop (add → rank → browse) is immediately obvious

### Reference: Fable
- Content (book covers / our food photos) is the primary visual element
- Warm editorial palette — not cold whites, not loud colors
- Typography-forward — type choices create the premium feel
- Personal utility first, community second
- Feels premium at a broad audience — not niche or intimidating

### Anti-references: Paprika, Yummly
- Cluttered, utilitarian interfaces
- No sense of craft or visual pleasure
- Social features feel bolted on (Yummly) or absent (Paprika)
- Typography and spacing are afterthoughts

## Design principles

1. **Photos are hero content.** Every screen that can show a food photo should. The entire visual warmth of the app depends on user photos being presented beautifully. Without photos, the app should still look clean — but the design should incentivize adding them.

2. **The ranking mechanic should feel like a game.** Not a form, not a settings page. Two photos side by side, tap the one you liked more, watch your list reorder. This is the screen that makes people show the app to friends.

3. **Personal utility first, social second.** The library, the ranked list, the recipe detail — these are the core. Feed, likes, comments are present and well-designed but they never compete with the personal tools.

4. **Warm, not decorated.** The warmth comes from palette + typography + photo treatment, not from decorative elements. Reduce orbs, gradients, and chrome. Let content breathe.

5. **Copy has voice.** Not robotic ("Create a new recipe entry"), not cute ("Let's get cookin!"). Natural and direct: "What did you make?" / "Add a recipe" / "Your best meals."

6. **Intuitive without instructions.** If a screen needs a paragraph of explanation in the header, the screen design isn't done yet. Beli's standard: you understand the mechanic by looking at it.

## Typography direction

The current pairing (Georgia display + system sans body) establishes the editorial tone but needs refinement:

- **Display:** A warm serif with a real bold weight that renders well on Android. Georgia is a starting point — a custom serif (Lora, Source Serif, Playfair Display) would give more control and better cross-platform consistency.
- **Body:** The system font is invisible in a bad way. A clean humanist sans (Inter, DM Sans, or similar) would add subtle personality without fighting the serif.
- **Scale:** Consolidate to 3-4 intentional sizes rather than the current spread of 12/13/14/15/16/20/22/26/28/30.

## Color direction

The current palette is strong and should be preserved with minor adjustments:

- **Canvas** `#f4ede3` — warm parchment, good
- **Surface** `#fffaf4` — card white, good
- **Accent** `#bf5a2d` — terracotta, distinctive and food-appropriate
- **Text** `#1f1a17` — warm near-black, good

Potential refinements:
- Secondary button contrast needs testing — `surface` on `canvas` may be too close
- The accent soft `#f4d1bf` works for badges but may need a second accent for interactive states vs. decorative use

## Screen priorities

Ordered by design impact — which screens to focus on first:

1. **Ranking comparison screen** — This is the signature interaction. Two meals, side by side, tap to choose. Needs to feel designed, not functional. Photos are essential here.
2. **Library screen** — The personal home base. Ranked list with photos, search, filters. Should feel like browsing your own cookbook.
3. **Feed screen** — Cards with food photos, author attribution, social actions. Clean, scannable, not dense.
4. **Recipe detail screen** — The single-recipe view. Hero photo, ingredients, steps. Should look like a page from a beautiful cookbook.
5. **Profile screen** — Avatar, stats, your meal grid. Clean and minimal.
6. **Create flow** — Recipe creation and meal creation. Forms that don't feel like forms.

## What's not set in stone

Everything. Page structure, navigation, screen count, visual style — all open to experimentation. The only fixed points are:

- React Native + Expo
- Supabase backend
- The three core features: store recipes, rank them, share them

The design should be iterated on — try things, evaluate, change direction if it doesn't feel right.
