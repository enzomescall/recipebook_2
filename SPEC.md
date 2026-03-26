# GENERAL FOREVER NOTES
Write clear, concise, readable code.
Do not focus excessively on fallbacks, backwards compatibility, or writing comments.

# Recipebook App Spec
## Overview

Recipebook is a social recipe app focused on three core ideas:

1. Users create and store their own recipes.
2. Users rank meals by comparing one meal against another.
3. Users share meals socially through a feed, profiles, comments, likes, and notifications.

The app will be built in React Native with Expo. The goal is to ship a working, scalable MVP with clean data flow and minimal hardcoding.

---

## Product Goals

* Let users create recipes and meals in a structured way.
* Let users maintain a ranked list of meals using pairwise comparison instead of star ratings.
* Let users share meals socially and interact with other users.
* Keep the architecture scalable for future backend, recommendation, and analytics work.
* Avoid hardcoded UI or business logic wherever possible.

---

## Core Concepts

### Recipe

A recipe is the underlying cooking object. It contains the actual cooking instructions and ingredient structure.

A recipe includes:

* title
* optional description
* optional cover image
* ingredients list
* steps list
* optional step images
* metadata such as cuisine, servings, prep time, cook time, tags, dietary labels

### Meal

A meal is the user-facing social and ranking entity. It references a recipe and adds presentation and ranking context.

A meal includes:

* linked recipe
* display title
* optional social caption
* optional hero image
* owner
* ranking state
* visibility state
* social stats
* created and updated timestamps

A user may create multiple meals from the same recipe if needed.

---

## Platforms

* React Native + Expo mobile app
* Initial focus on iOS and Android
* Architecture should allow future web support if needed

---

## Primary User Flows

### 1. Onboarding

User can:

* create an account
* sign in
* sign out
* reset password
* choose username
* upload profile picture
* add bio
* optionally import contacts or find friends

### 2. Create Recipe

User can:

* create a recipe
* add title
* add optional description
* add optional cover photo
* add ingredients dynamically
* define ingredient quantities and units
* add steps dynamically
* reference ingredients from the ingredient list inside each step
* reorder steps
* delete steps
* add optional images to steps
* save draft
* publish recipe

### 3. Create Meal

User can:

* create a meal from a recipe
* add display title if different from recipe title
* add optional caption
* choose visibility
* choose hero image
* publish to their profile and social feed

### 4. Rank Meal on Creation

When a new meal is created:

* user is prompted to rank it
* ranking is done by comparing this meal against existing meals
* comparisons are shown one at a time
* system inserts the new meal into the ranked order based on comparison outcomes

### 5. Edit Ranking Later

User can:

* re-rank any meal later
* launch the same comparison flow from a meal detail page or meal list
* update rank by comparing that meal against other meals
* see ranked list update after re-ranking completes

### 6. Browse Feed

User can:

* see a chronological social feed of meals from themselves and people they follow
* like posts
* comment on posts
* like comments
* reply to comments
* tag users in comments
* view tagged users
* save or star meals
* navigate to poster profile
* open meal detail page

### 7. Browse Ranked Library

User can:

* see their own meals in ranked order
* view rank number for each meal
* filter by cuisine
* filter by servings
* filter by ingredients
* filter by tags
* sort by newest, oldest, recently edited, rank
* search meals
* edit a meal
* delete a meal
* start a re-ranking flow from the list

### 8. Profile

User can:

* view own profile
* upload or change profile picture
* edit display name
* edit username
* edit bio
* view own posts
* view starred meals
* view followers and following
* manage account settings
* view their timeline
* pin or star meals so they are highlighted on profile

### 9. Other User Profiles

User can:

* view another user’s profile
* follow or unfollow
* view their public meals
* view their starred or pinned meals if public
* see mutuals or social context if implemented
* open meals and interact if visible

### 10. Notifications

User receives notifications for:

* likes on their meals
* comments on their meals
* replies to their comments
* likes on their comments
* follows
* tags in posts or comments
* mentions in social activity
* ranking reminders or prompts if desired later

User can:

* view notification list
* mark notifications as read
* tap notifications to deep link into relevant content

---

## Feature Requirements

## Authentication

* email and password sign up
* login
* logout
* forgot password
* persistent session
* optional future support for Apple and Google sign-in

## User Profile

* user id
* username
* display name
* bio
* profile picture
* follower count
* following count
* starred meals
* privacy controls
* notification preferences

## Recipe Creation

* dynamic ingredient list
* ingredient has name, quantity, unit, optional note
* dynamic step list
* each step may reference one or more ingredients
* each step may have optional media
* support draft and published states

## Meal Creation

* meal references recipe
* meal can have its own social presentation fields
* meal can be posted publicly, privately, or followers-only depending on final privacy model
* meal supports social engagement and ranking

## Ranking System

Ranking must be pairwise comparison based.

Requirements:

* no star rating system for meal ranking
* no numeric user-facing score as primary ranking input
* ranking is produced through direct comparison of one meal to another
* new meals must be ranked at creation time
* existing meals must be re-rankable later
* ranked meal list must update deterministically after comparisons
* ranking logic should be implemented in a way that can scale beyond a simple hardcoded list

Comparison flow requirements:

* show two meals side by side or in a clear comparison view
* user selects preferred meal
* system updates rank position
* repeat until correct insertion point is found
* user may exit and resume if needed
* user should always understand which meal is being ranked

## Social Feed

Post card should support:

* meal title
* meal image
* poster avatar and username
* caption
* timestamp
* tags
* like button
* comment button
* save or star button
* share action if implemented
* navigate to meal detail
* navigate to user profile

## Comments

Comment functionality should support:

* create comment
* edit own comment
* delete own comment
* like comments
* reply to comments
* nested replies at least one level deep
* tag or mention users
* notification on reply or mention

## Search and Discovery

Users can search for:

* meals
* recipes
* users
* ingredients
* tags
* cuisines

Discovery should support:

* search bar
* filter chips
* recent searches
* trending tags or cuisines later if needed

## Starred / Saved Content

Users can:

* star meals
* unstar meals
* view starred meals on profile
* optionally surface starred meals in library and feed

Clarify difference:

* starred means highlighted/favorited for profile and personal access
* ranking remains separate and comparison-based

## Notifications

Notification types:

* new follower
* like on meal
* comment on meal
* reply to comment
* like on comment
* mention in comment
* mention in caption or post
* meal starred if desired
* ranking prompt or reminder later

Notification center supports:

* unread/read state
* grouped or flat list
* deep linking

## Media

App should support:

* profile picture upload
* recipe cover image upload
* meal hero image upload
* optional step images
* comment attachments not required for MVP unless desired

## Settings

User can:

* edit profile
* manage password
* manage notification settings
* manage privacy settings
* block users later if needed
* delete account later if needed

---

## App Screens

## Auth

* Splash screen
* Sign up screen
* Login screen
* Forgot password screen

## Main App

* Feed screen
* Library screen
* Create recipe screen
* Create meal flow
* Ranking comparison screen
* Meal detail screen
* Recipe detail screen
* Profile screen
* Edit profile screen
* Notifications screen
* Search screen
* Followers/following list screen
* Settings screen

---

## Screen-Level Requirements

## Feed Screen

Must include:

* scrolling list of social meal posts
* ability to like a post
* ability to comment on a post
* ability to open comments thread
* ability to open meal detail
* ability to open profile
* pull to refresh
* pagination or infinite scroll ready structure

## Library Screen

Must include:

* ranked meal list
* visible rank position
* search
* filters
* sort controls
* edit action
* delete action
* rerank action
* meal detail navigation

## Create Recipe Screen

Must include:

* title input
* optional description
* cover image upload
* dynamic ingredient input
* dynamic step input
* ingredient references inside steps
* reorder steps
* save draft
* publish

## Ranking Comparison Screen

Must include:

* clear display of two meals
* choose preferred meal
* enough context to compare
* progress through comparison flow
* support insertion of new meal into ranked list
* support reranking of existing meal

## Meal Detail Screen

Must include:

* meal hero image
* linked recipe summary
* social caption
* owner profile access
* comments
* like post
* star meal
* rerank meal
* edit meal if owner
* delete meal if owner

## Recipe Detail Screen

Must include:

* recipe title
* description
* ingredients
* steps
* optional step images
* linked meals or usage context if desired
* edit recipe if owner

## Profile Screen

Must include:

* profile picture
* username
* display name
* bio
* follower and following counts
* grid or list of user meals
* starred meals section
* edit profile action
* own timeline section or tab

## Notifications Screen

Must include:

* notification list
* unread state
* tap through to source content
* mark as read

---

## Data Model Expectations

These are conceptual and should be implemented cleanly for backend and frontend use.

## User

Fields:

* id
* username
* displayName
* bio
* profileImageUrl
* followersCount
* followingCount
* starredMealIds
* createdAt
* updatedAt

## Recipe

Fields:

* id
* ownerId
* title
* description
* coverImageUrl
* ingredients
* steps
* cuisine
* servings
* prepTimeMinutes
* cookTimeMinutes
* tags
* dietaryLabels
* status
* createdAt
* updatedAt

## Ingredient

Fields:

* id
* name
* quantity
* unit
* note

## RecipeStep

Fields:

* id
* order
* instructionText
* ingredientReferences
* imageUrl

## Meal

Fields:

* id
* ownerId
* recipeId
* title
* caption
* heroImageUrl
* visibility
* rankPosition or rankingState
* createdAt
* updatedAt

## MealComparison

Fields:

* id
* userId
* subjectMealId
* comparedAgainstMealId
* preferredMealId
* createdAt

This can support pairwise ranking history.

## PostLike

Fields:

* id
* userId
* mealId
* createdAt

## Comment

Fields:

* id
* userId
* mealId
* parentCommentId nullable
* body
* mentionedUserIds
* likeCount
* createdAt
* updatedAt

## CommentLike

Fields:

* id
* userId
* commentId
* createdAt

## Follow

Fields:

* id
* followerId
* followingId
* createdAt

## Notification

Fields:

* id
* recipientUserId
* actorUserId
* type
* targetId
* secondaryTargetId nullable
* read
* createdAt

---

## Ranking Logic Requirements

* Ranking must be comparison-based.
* User should compare one meal against another.
* New meal ranking should happen immediately after meal creation.
* Existing meal reranking should reuse the same flow.
* System should support efficient insertion into a ranked list.
* Internal implementation may use insertion logic, binary-search-style comparisons, or another deterministic comparison flow.
* User-facing ranking should be a clear ordered list.
* Ranking history should be stored or reconstructable if possible.

---

## Backend Expectations

The app should be built so it can work with a scalable backend. The implementation should avoid hardcoded or tightly coupled assumptions.

Backend should support:

* auth
* users
* recipes
* meals
* meal comparisons
* likes
* comments
* comment likes
* follows
* notifications
* media uploads

Preferred backend characteristics:

* easy to ship MVP
* easy to evolve
* supports relational or document-based queries cleanly
* supports image storage
* supports push notifications later

---

## Non-Functional Requirements

* Code should be modular and scalable.
* No hardcoded production data in UI components.
* Shared components should be reusable.
* Business logic should be separated from presentational UI where reasonable.
* App should support loading, error, and empty states.
* Forms should have validation.
* Lists should support pagination-ready patterns.
* API/data layer should be abstracted enough to swap implementations later.
* Ranking logic should not be embedded directly into UI components.

---

## MVP Priorities

Phase 1:

* auth
* create recipe
* create meal
* pairwise ranking on creation
* reranking existing meals
* ranked library
* feed
* comments
* likes
* profile
* notifications

Phase 2:

* replies to comments
* comment likes
* mentions and tagging
* saved/starred surfacing improvements
* search and discovery enhancements
* privacy controls
* push notifications
* drafts and richer media

Phase 3:

* recommendation systems
* friend suggestions
* analytics
* collaborative recipes
* richer social graph features

---

## Acceptance Criteria

* User can sign up and create a profile with a profile picture.
* User can create a recipe with ingredients and steps.
* User can create a meal from a recipe.
* User is prompted to rank a meal when it is created.
* User can compare meals and produce a ranked order.
* User can rerank a meal later by comparing it to other meals.
* User can view meals in ranked order in the library.
* User can post meals to a feed.
* Other users can like and comment on meal posts.
* Users can like comments.
* Users can view notifications for social activity.
* Users can star meals and see them on profile.
* Users can search and filter meals in the library.
* All main flows work without hardcoded assumptions.

---

## Notes for Implementation

* Treat ranking as a first-class feature, not an afterthought.
* Keep Recipe and Meal conceptually separate.
* Build with future backend integration in mind.
* Optimize for a working app first, but do not implement shortcuts that make scaling difficult later.
* It is acceptable for visual fidelity to evolve over time, but functional architecture should be sound from the start.
