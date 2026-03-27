## Overview

This document defines the recommended technical stack for Recipebook.

The stack is optimized for:

* Fast MVP development
* Linux-first development environment
* Easy iOS deployment without local macOS
* Clean architecture and scalability
* Strong support from AI tooling and ecosystem

The frontend will be built using **React Native with Expo**, consistent with the product spec .

---

## Architecture Philosophy

The system should follow:

* **Frontend-first MVP development**
* **Backend-as-a-service initially**
* **Clear separation of concerns**
* **Replaceable backend layer (no lock-in)**
* **Eventual migration path to custom backend if needed**

---

## High-Level Architecture

```
[ React Native App (Expo) ]
            ↓
[ API Layer / Client SDK ]
            ↓
[ Backend (Supabase / Firebase) ]
            ↓
[ Database + Storage + Auth + Realtime ]
```

---

## Frontend

### Framework

* **React Native (Expo)**

  * Managed workflow (no native code initially)
  * Cross-platform (iOS + Android)
  * Compatible with EAS Build for iOS from Linux

### Language

* **TypeScript**

  * Required for maintainability and scaling
  * Improves AI-assisted development accuracy

---

## Navigation

* **Expo Router** (recommended)

  * File-based routing
  * Clean mental model similar to Next.js
  * Scales well with app complexity

Alternative:

* React Navigation (if more control needed)

---

## State Management

### Primary

* **Zustand**

  * Minimal boilerplate
  * Easy mental model
  * Great for MVP speed

### Secondary (server state)

* **TanStack Query (React Query)**

  * Handles:

    * caching
    * background refetching
    * pagination
    * optimistic updates

---

## Backend (MVP)

### Recommended: Supabase

* PostgreSQL database
* Built-in authentication
* Row-level security (important for privacy)
* Realtime subscriptions
* Storage for images
* REST + auto-generated APIs

Why Supabase fits this app:

* Strong relational support (important for:

  * users
  * meals
  * comparisons
  * comments)
* Easier to model ranking + social graph than NoSQL

---

### Alternative: Firebase

Use if you prioritize:

* simpler setup
* looser schema

Tradeoffs:

* harder relational queries
* ranking system becomes more complex

---

## Database

### Type

* **PostgreSQL (via Supabase)**

### Key Features Used

* relational joins (users ↔ meals ↔ recipes)
* indexing for ranking queries
* JSON fields for flexible metadata (ingredients, steps)
* row-level security for privacy

---

## API Layer

### MVP Approach

* Use **Supabase client SDK directly** from frontend

### Abstraction Layer (important)

Create:

```
/lib/api/
  users.ts
  meals.ts
  recipes.ts
  ranking.ts
  comments.ts
```

This ensures:

* easy migration to custom backend later
* no business logic inside UI components

---

## Authentication

* Supabase Auth

Supports:

* email/password
* magic links (optional)
* OAuth (Apple, Google later)

Session handled automatically on client.

---

## Media Storage

* Supabase Storage

Used for:

* profile images
* recipe images
* meal images
* step images

---

## Ranking System (Core Logic)

### Location

* Implement in:

  * `/lib/ranking/`

### Approach

* Client-driven insertion logic (MVP)
* Persist comparisons in backend

### Data Flow

```
User compares A vs B
→ result stored (MealComparison)
→ ranking recalculated locally
→ updated ranking persisted
```

### Future Upgrade Path

* Move ranking computation to backend service
* Introduce:

  * ELO-like system OR
  * optimized insertion trees

---

## Notifications

### MVP

* Stored in database (Supabase table)

### Delivery

* In-app polling or realtime subscriptions

### Future

* Push notifications via:

  * Expo Notifications
  * Firebase Cloud Messaging (FCM)

---

## Realtime Features

* Supabase Realtime

Used for:

* live comments
* notifications
* feed updates (optional early)

---

## Search

### MVP

* Simple SQL queries via Supabase

### Future

* Add:

  * Algolia OR
  * Meilisearch

---

## Deployment

### Mobile Builds

* **Expo EAS Build**

Supports:

* iOS builds from Linux
* automatic certificate management
* TestFlight deployment

---

### Environments

* development
* preview (optional)
* production

Use `.env` files for:

* API keys
* project URLs

---

## Testing

### MVP

* Manual testing on device (Expo Go)

### Recommended Additions

* Jest (unit tests)
* React Native Testing Library

---

## Code Structure

```
/app                # Expo Router screens
/components         # reusable UI
/features           # feature-based modules
/lib
  /api              # backend calls
  /ranking          # ranking logic
  /utils
/store              # Zustand state
/types              # TypeScript types
/constants
```

---

## Styling

### Recommended

* **NativeWind (Tailwind for React Native)**

Benefits:

* fast iteration
* consistent design
* AI-friendly

Alternative:

* StyleSheet (more control, slower)

---

## Forms

* **React Hook Form**

Used for:

* recipe creation
* meal creation
* auth flows

---

## Analytics (Future)

* PostHog OR Firebase Analytics

Track:

* user engagement
* ranking behavior
* retention

---

## Error Handling

* Centralized error utility
* Toast system for UI feedback

---

## Version Control

* Git (GitHub)

Recommended setup:

* main
* dev
* feature branches

---

## CI/CD (Optional Early)

* GitHub Actions

Future:

* automate builds
* run tests
* trigger EAS builds

---

## Security Considerations

* Row-level security in database
* Validate inputs on client + backend
* Secure storage of API keys
* Auth-protected endpoints

---

## Scaling Path

### When to move off BaaS

Trigger conditions:

* complex ranking computation
* heavy feed personalization
* performance bottlenecks

### Future Backend

* Node.js (FastAPI also viable)
* Hosted on:

  * AWS / GCP / Fly.io

---

## Tech Stack Summary

### Frontend

* React Native (Expo)
* TypeScript
* Expo Router
* Zustand
* React Query
* NativeWind

### Backend

* Supabase (PostgreSQL + Auth + Storage + Realtime)

### Infra

* Expo EAS Build
* GitHub

### Optional Add-ons

* Algolia (search)
* PostHog (analytics)
* Firebase (push notifications)

---

## Final Recommendation

For this specific app:

**Do NOT over-engineer early**

Start with:

* Expo
* Supabase
* Zustand
* React Query

Ship fast → validate → then scale.

---

If you want next, I can:

* turn this into a **starter repo structure**
* or generate your **actual folder + file boilerplate**
* or design the **ranking algorithm properly (this is the hardest part of your app)**
