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
- The core loop (add → rank → browse) is immediately obvious
- Copy has personality without being cute ("What'd you eat?")

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

## The vision — screen by screen

### Navigation structure

Five tabs: **Feed / Library / + / Notifications / Profile**

The center tab is the creation entry point. Tapping it opens a bottom sheet with two options: "New recipe" and "New meal from existing recipe." This keeps creation accessible from everywhere without dedicating a full tab to a form. The current approach of a full-screen create tab that shows both recipe and meal creation in one long scroll is too dense — it should be broken into focused steps.

### Library (Tab 2) — the home base

This is where users spend the most solo time. The screen should feel like opening a personal cookbook.

**Header:** Minimal. "Library" as a small section label, no subtitle paragraph. Below it, a search bar and a single row of filter/sort chips.

**The list:** Each meal is a horizontal card with:
- A square food photo on the left (or a warm placeholder with a utensil icon if no photo)
- The rank number overlaid on the photo's bottom-left corner in a small circle
- Meal title and recipe name to the right
- A subtle cuisine tag or time metadata underneath
- No "Rerank" button visible by default — that action lives in the meal detail or via long-press/swipe

The list should feel like a Spotify queue: clean rows, photo-led, scannable at a glance. The rank number is always visible but doesn't dominate — it's a badge on the photo, not a separate element.

**Empty state:** When the library is empty, a single centered illustration or icon with "You haven't ranked anything yet" and a prominent "Add your first recipe" button. No long explanation.

### Ranking (the signature screen)

This is the screen that defines Recipebook. It should be the most polished, most delightful interaction in the app.

**Layout:** Two meal cards stacked vertically, each taking roughly 40% of the screen height. Each card shows:
- The food photo filling the card (full bleed, rounded corners)
- The meal title overlaid at the bottom of the photo on a subtle gradient scrim
- The recipe name in small text below the title

**Interaction:** Tap the one you prefer. The chosen card briefly scales up with a subtle pulse, the other fades. After a beat, the next comparison slides in. A small progress indicator at the top shows "3 of 5 comparisons" or similar.

**When there are no photos:** The cards show the meal title large and centered on a warm `surfaceStrong` background, with the recipe name below. Still tappable, still clear, just text-driven.

**Completion:** When ranking is done, the screen transitions to show the updated ranked list position: "Smoky tomato beans is now #3 in your library" with a satisfying animation — the meal card slides into its position in a miniature list view. A button says "Back to library."

**The feeling:** This should feel like a game. Quick, decisive, satisfying. Not like filling out a form.

### Feed (Tab 1) — the social layer

The feed is a vertical scroll of meal cards from people you follow. It exists to make cooking social but should never feel like a commitment — opening the feed should feel like flipping through a friend's cookbook, not scrolling Twitter.

**Card structure:**
- Author row: small avatar (32px), name, handle, timestamp — all in one line, compact
- Hero photo: full-width, 3:2 aspect ratio, rounded corners. This is the visual anchor of every card.
- Below the photo: meal title (serif, bold), recipe name as a subtle link, caption text
- Rank badge: a small pill next to the meal title reading "#3 in their library" — contextualizing the rank as a personal ranking, not a global one
- Social actions: heart icon with count, comment icon with count, bookmark icon. Inline, no borders, no pill buttons — just icons and numbers. Light and unobtrusive.

**Without photos:** The card still works — the meal title becomes larger, the caption gets more space. But the design should make cards without photos feel noticeably less rich, gently encouraging users to add photos.

**Pull to refresh.** Infinite scroll. No stories row, no trending section, no algorithmic sorting — chronological from people you follow.

### Recipe detail — the cookbook page

When you tap into a recipe, it should feel like landing on a beautifully typeset cookbook page.

**Layout:**
- Hero photo: full-width at the top, edge-to-edge, with the recipe title overlaid at the bottom on a gradient scrim (large serif text, white)
- Below the photo: a metadata row — cuisine, prep time, cook time, servings — as small inline items with subtle icons
- **Ingredients section:** Clean list with ingredient names in regular weight, quantities and units in bold or accent color. No card wrapper — just a section with a divider above it.
- **Steps section:** Numbered steps, each with generous line spacing. Step images inline where they exist. Ingredient references highlighted in the accent color so they're tappable/recognizable.
- If you own this recipe: a subtle "Edit" icon in the top-right header area

**The tone:** Calm, readable, not cramped. More whitespace than you think you need. A recipe should be readable while cooking — big type, clear sections, no visual noise.

### Profile (Tab 5)

**Layout:**
- Header: centered avatar (large, 80px), display name in serif, handle and bio below in body font
- Stats: a single horizontal row — meals count, followers, following — separated by vertical dividers, all inside one surface. Not three separate cards.
- **Meal grid:** Below the stats, a 2-column grid of meal photos (square thumbnails). Each thumbnail shows the rank number in the corner. Tapping opens the meal detail.
- If no meals yet: a single empty state encouraging recipe creation

**Other users' profiles:** Same layout, but with a Follow/Unfollow button below the bio and no edit controls.

### Create flow — focused steps, not one long form

**Breaking the current create screen into steps:**

**Step 1: "What did you make?"**
Title input, description input, cover photo picker. Just the basics. A "Next" button at the bottom.

**Step 2: "What's in it?"**
Ingredients list. Dynamic add/remove. Each ingredient is a compact row: name, quantity, unit, note. No card wrapper per ingredient — just rows with subtle dividers.

**Step 3: "How do you make it?"**
Steps list. Each step is a text area with an optional photo attachment. Ingredient references are tappable chips pulled from step 2.

**Step 4: "Save & share"**
Choose visibility (public/followers/private) with a simple segmented control. Option to save as draft or publish. If publishing as a meal, set the meal title and caption here.

**After creation → straight into ranking.** No intermediate screen. The ranking comparison starts immediately if you have 2+ meals.

This step-by-step approach means each screen is focused and never overwhelming. The progress is clear. You can save a draft at any step.

### Notifications (Tab 4)

Simple list. Each notification is a single row:
- Small avatar of the actor
- Text: "**Sarah** liked your **Smoky tomato beans**" — bold names, bold meal titles
- Timestamp on the right
- Unread notifications have a subtle accent-colored left border or dot

No grouping, no categories, no tabs. Just a chronological list. Tap to navigate to the relevant content.

### Comments

Accessed from the feed card or meal detail. A bottom sheet or pushed screen showing:
- The comment list with avatar, name, text, timestamp, like button
- Reply threading one level deep (replies indented slightly)
- A text input pinned to the bottom with a send button
- @ mentions with autocomplete

Simple, functional, not over-designed.

## Visual identity details

### Photo treatment
- All food photos use consistent corner radius (`radius.lg`, 24px)
- Aspect ratio: 3:2 for feed cards and recipe hero, 1:1 for library list thumbnails and profile grid
- Placeholder when no photo: warm `surfaceStrong` background with a centered utensil or plate icon in `muted` color
- Photos should feel slightly warm — consider a very subtle warm overlay or ensuring the UI warmth doesn't clash with cool-toned food photos

### Spacing rhythm
- Use the existing spacing scale but commit to a consistent rhythm: `lg` (20px) between major sections, `md` (16px) within sections, `sm` (12px) between related elements
- Screen padding: `lg` (20px) horizontal
- Card internal padding: `lg` (20px)

### Shadows and elevation
- Cards: the current shadow is good — warm-toned, soft, not too lifted
- No shadows on anything that isn't a card. Buttons, inputs, badges — all flat.
- The card border (`line` color, 1px) is subtle enough to keep. It provides definition on screens with less contrast.

### Icons
- Ionicons is fine for now. Use outline variants for inactive states, filled for active.
- Keep icon sizes consistent: 20px for inline actions, 26px for tab bar.

### Animations and interaction
- Pressed states: the current `scale: 0.99` on cards and `scale: 0.985` on buttons is good — subtle, not bouncy
- Ranking card selection: a brief scale-up (1.02) on the chosen card with a 200ms ease-out
- Page transitions: default Expo Router transitions, no custom work needed yet
- Pull-to-refresh: use the platform default

## What's not set in stone

Everything. Page structure, navigation, screen count, visual style — all open to experimentation. The only fixed points are:

- React Native + Expo
- Supabase backend
- The three core features: store recipes, rank them, share them

The design should be iterated on — try things, evaluate, change direction if it doesn't feel right.
