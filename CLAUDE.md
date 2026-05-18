# CLAUDE.md — Football Portal Frontend

## PROJECT CONTEXT

This is a **Vue 3 + Vite + JavaScript** portal for football content. The codebase already exists as a wellness portal with a brand override system. We are adding **two new football brands** (`football1`, `football2`) that override the base design with football-specific theming, layout tweaks, and content structure.

The portal is **generic football** — absolutely NO references to FIFA, UEFA, World Cup™, or any trademarked competition names anywhere in code, copy, meta tags, or assets. Use terms like "international tournament", "global championship", "the big tournament 2026", or simply "football" instead.

---

## ARCHITECTURE — BRAND OVERRIDE SYSTEM

The project uses a brand folder system under `src/brands/`. Each brand folder can override styles, config, assets, and components from the base.

```
src/
├── brands/
│   ├── football1/          ← Brand A (dark/stadium theme)
│   │   ├── assets/         ← logos, hero images, icons
│   │   ├── styles/         ← _variables.scss, _overrides.scss
│   │   ├── config.js       ← brand name, colors, feature flags, API keys
│   │   └── components/     ← brand-specific component overrides (optional)
│   ├── football2/          ← Brand B (vibrant/energy theme)
│   │   ├── assets/
│   │   ├── styles/
│   │   ├── config.js
│   │   └── components/
├── components/             ← shared base components
├── composables/            ← shared composables (useGames, useVideos, etc.)
├── config/                 ← base config
├── constants/              ← shared constants
├── data/                   ← static data files (games catalog, videos catalog)
├── i18n/                   ← translations
├── router/                 ← vue-router setup
├── services/               ← API services
├── stores/                 ← Pinia stores
├── styles/                 ← base/shared styles
├── utils/                  ← utility functions
├── views/                  ← page-level view components
├── App.vue
└── main.js
```

### How brands work:

- The active brand is determined at build time (env variable) or runtime (URL/config)
- Brand `config.js` exports: name, theme colors, feature flags, navigation items, API endpoints
- Brand `styles/` contains SCSS variable overrides that cascade over base styles
- Brand `components/` can replace specific base components entirely
- Brand `assets/` contains logos, hero images, brand-specific icons

### CRITICAL RULES:

- **NEVER modify existing wellness/wellness2/wellness3 brand folders**
- **NEVER modify base components in ways that break existing brands**
- All new football-specific code must be additive or inside the new brand folders
- Shared components must remain brand-agnostic (use CSS variables, config-driven content)

---

## PHASE 1 — WHAT TO BUILD NOW

### Two content sections only:

#### 1. GAMES PAGE (`/games`)

- Grid/card layout showing all available games
- Each game card: thumbnail, title, short description, platform badges (HTML5 / Android)
- Click → game detail page or direct play (HTML5) / download link (Android)
- Filter/sort: by platform (All / HTML5 / Android), by popularity, alphabetical
- Games data comes from a static JSON file in `src/data/games.json`
- Responsive: mobile-first, works great on phone screens

#### 2. VIDEOS PAGE (`/videos`)

- Grid/card layout for video content
- Each video card: thumbnail (with play icon overlay), title, duration, category tag
- Click → video player page (embedded player or modal)
- Filter by category (highlights, skills, funny, classic moments, etc.)
- Videos data from static JSON file `src/data/videos.json`
- Lazy loading for thumbnails

#### 3. HOME PAGE (`/`)

- Hero banner with football imagery (brand-specific)
- Featured/latest games section (horizontal scroll or grid, 4-6 items)
- Featured/latest videos section (horizontal scroll or grid, 4-6 items)
- Quick links to all sections
- Designed to feel like a sports portal, not a corporate site

#### 4. SHARED LAYOUT

- **Header/Navbar**: brand logo, navigation (Home, Games, Videos + placeholders for future: Trivia, History, Live), mobile hamburger menu
- **Footer**: minimal, brand name, links, copyright
- **Responsive breakpoints**: mobile (<768px), tablet (768-1024px), desktop (>1024px)

---

## PHASE 2 — COMING LATER (just prepare routing placeholders)

These pages will be added later. For now, create route entries and placeholder view components with a "Coming Soon" state:

- `/trivia` — Football Trivia & Quiz section
- `/history` — International Tournament History (timelines, records, stats from 1930)
- `/live` — Live Scores & Commentary (real-time data feeds)

---

## DATA STRUCTURES

### `src/data/games.json`

```json
[
  {
    "id": "game-001",
    "title": "Penalty Shootout",
    "slug": "penalty-shootout",
    "description": "Test your nerves in this penalty kick challenge",
    "thumbnail": "/assets/games/penalty-shootout-thumb.jpg",
    "platform": ["html5"],
    "playUrl": "https://example.com/games/penalty-shootout",
    "featured": true,
    "category": "action",
    "rating": 4.5,
    "plays": 12500
  }
]
```

### `src/data/videos.json`

```json
[
  {
    "id": "video-001",
    "title": "Top 10 Goals of the Season",
    "slug": "top-10-goals-season",
    "description": "The most spectacular goals from this season",
    "thumbnail": "/assets/videos/top-10-goals-thumb.jpg",
    "videoUrl": "https://example.com/videos/top-10-goals",
    "embedCode": "<iframe ...>",
    "duration": "8:34",
    "category": "highlights",
    "featured": true,
    "publishedAt": "2026-05-10"
  }
]
```

Create these files with 8-12 sample/placeholder entries each so the UI has realistic content to render. Use placeholder thumbnail URLs (e.g. `https://placehold.co/400x225/1a472a/ffffff?text=Game+Name`).

---

## DESIGN SPECIFICATIONS

### Brand `football1` — "Stadium Nights" (Dark Theme)

- **Vibe**: premium, immersive, like watching a match in a dark stadium
- **Primary**: `#1B5E20` (deep green — pitch green)
- **Secondary**: `#FF6F00` (amber/orange — energy, action)
- **Background**: `#0D1117` (near-black)
- **Surface**: `#161B22` (dark card surfaces)
- **Text primary**: `#E6EDF3` (light gray)
- **Text secondary**: `#8B949E` (muted gray)
- **Accent**: `#FFD600` (golden yellow — trophy/winner feel)
- **Typography**: bold, sporty — use `'Oswald', 'Arial Black', sans-serif` for headings, `'Inter', 'Roboto', sans-serif` for body
- **Cards**: subtle border glow on hover, dark glass-morphism feel
- **Hero**: full-width dark image with gradient overlay, big bold headline

### Brand `football2` — "Matchday Energy" (Vibrant Light Theme)

- **Vibe**: energetic, young, social-media-native, like a sports app
- **Primary**: `#00C853` (vivid green)
- **Secondary**: `#2979FF` (electric blue)
- **Background**: `#F5F5F5` (light gray)
- **Surface**: `#FFFFFF` (white cards)
- **Text primary**: `#1A1A2E` (near-black)
- **Text secondary**: `#5F6368` (medium gray)
- **Accent**: `#FF1744` (red — passion, action CTA)
- **Typography**: `'Poppins', 'Nunito', sans-serif` for headings, `'Inter', sans-serif` for body
- **Cards**: white with shadow, colorful category tags, rounded corners
- **Hero**: colorful gradient or bright photo, playful typography

### Shared Design Rules (both brands):

- Mobile-first responsive
- Cards must have hover states (scale, shadow, or glow depending on brand)
- Navigation sticky on scroll
- Smooth page transitions (Vue Router transitions)
- Loading skeletons for async content
- Empty states for filtered results with no matches
- All images must have alt text
- Minimum touch target 44px on mobile
- Use CSS custom properties (variables) for all brand colors — base defines the property names, brands override the values
- Grid layouts: CSS Grid, not flexbox hacks

---

## CSS VARIABLE SYSTEM

Base styles define CSS custom properties. Brand overrides reassign them.

```css
/* src/styles/base/_variables.css — defaults */
:root {
  --color-primary: #1b5e20;
  --color-secondary: #ff6f00;
  --color-bg: #0d1117;
  --color-surface: #161b22;
  --color-text: #e6edf3;
  --color-text-secondary: #8b949e;
  --color-accent: #ffd600;
  --font-heading: "Oswald", sans-serif;
  --font-body: "Inter", sans-serif;
  --radius-card: 12px;
  --radius-button: 8px;
  --shadow-card: 0 4px 6px rgba(0, 0, 0, 0.3);
  --shadow-card-hover: 0 8px 25px rgba(0, 0, 0, 0.5);
  --transition-default: all 0.2s ease;
  --header-height: 64px;
  --max-content-width: 1280px;
}
```

```css
/* src/brands/football2/styles/_overrides.css — brand 2 overrides */
:root {
  --color-primary: #00c853;
  --color-secondary: #2979ff;
  --color-bg: #f5f5f5;
  --color-surface: #ffffff;
  --color-text: #1a1a2e;
  --color-text-secondary: #5f6368;
  --color-accent: #ff1744;
  --font-heading: "Poppins", sans-serif;
  --font-body: "Inter", sans-serif;
  --radius-card: 16px;
  --radius-button: 24px;
  --shadow-card: 0 2px 8px rgba(0, 0, 0, 0.08);
  --shadow-card-hover: 0 8px 24px rgba(0, 0, 0, 0.12);
}
```

---

## COMPONENT NAMING & STRUCTURE

Use this naming convention for components:

```
components/
├── layout/
│   ├── AppHeader.vue
│   ├── AppFooter.vue
│   ├── AppNav.vue
│   └── AppHero.vue
├── games/
│   ├── GameCard.vue
│   ├── GameGrid.vue
│   └── GameFilters.vue
├── videos/
│   ├── VideoCard.vue
│   ├── VideoGrid.vue
│   └── VideoFilters.vue
├── shared/
│   ├── BaseCard.vue
│   ├── BaseButton.vue
│   ├── BaseBadge.vue
│   ├── BaseModal.vue
│   ├── SkeletonCard.vue
│   ├── EmptyState.vue
│   ├── SectionHeader.vue
│   └── FilterBar.vue
└── home/
    ├── FeaturedGames.vue
    └── FeaturedVideos.vue
```

### Component rules:

- Every component uses `<script setup>` syntax
- Props validated with `defineProps` and proper types/defaults
- Emit events with `defineEmits`
- Scoped styles using `<style scoped>` — reference CSS variables only
- No hardcoded colors or font families in component styles
- Composables for shared logic (`useGames`, `useVideos`, `useFilters`, `useBrand`)

---

## ROUTING

```js
// src/router/index.js
const routes = [
  { path: "/", name: "Home", component: () => import("@/views/HomeView.vue") },
  {
    path: "/games",
    name: "Games",
    component: () => import("@/views/GamesView.vue"),
  },
  {
    path: "/games/:slug",
    name: "GameDetail",
    component: () => import("@/views/GameDetailView.vue"),
  },
  {
    path: "/videos",
    name: "Videos",
    component: () => import("@/views/VideosView.vue"),
  },
  {
    path: "/videos/:slug",
    name: "VideoDetail",
    component: () => import("@/views/VideoDetailView.vue"),
  },
  // Phase 2 placeholders
  {
    path: "/trivia",
    name: "Trivia",
    component: () => import("@/views/ComingSoonView.vue"),
  },
  {
    path: "/history",
    name: "History",
    component: () => import("@/views/ComingSoonView.vue"),
  },
  {
    path: "/live",
    name: "Live",
    component: () => import("@/views/ComingSoonView.vue"),
  },
];
```

---

## STORES (Pinia)

```
stores/
├── brand.js      ← active brand config, theme, feature flags
├── games.js      ← games list, filters, selected game
└── videos.js     ← videos list, filters, selected video
```

---

## IMPORTANT TECHNICAL NOTES

1. **Existing codebase**: Look at how existing wellness brands work before creating football brands. Match the same override pattern.
2. **No npm additions without asking**: Use only libraries already in package.json. If something new is needed, ask first.
3. **Placeholder assets**: Use placeholder images from `placehold.co` or solid-color SVGs. Real assets come later.
4. **i18n ready**: All user-facing strings should go through the i18n system (or at minimum, be in the brand config, not hardcoded).
5. **Accessibility**: semantic HTML, ARIA labels on interactive elements, keyboard navigable, color contrast WCAG AA minimum.
6. **Performance**: lazy-load route views, lazy-load images with `loading="lazy"`, keep bundle size in mind.
7. **No API calls yet**: Phase 1 is 100% static data from JSON files. API integration comes in Phase 2.

---

## DELIVERABLES CHECKLIST

When done, I should be able to:

- [ ] Run `npm run dev` and see the football portal
- [ ] Switch between football1 and football2 brands (via env var or config)
- [ ] Navigate Home → Games → Game Detail → back
- [ ] Navigate Home → Videos → Video Detail → back
- [ ] Filter games by platform
- [ ] Filter videos by category
- [ ] See responsive layout on mobile/tablet/desktop
- [ ] See "Coming Soon" for Trivia, History, Live routes
- [ ] See both brands render with distinctly different visual identities
- [ ] See no broken styles on existing wellness brands

---

## EXECUTION ORDER

1. First, **explore the existing codebase** — understand how brands, config, styles, router, stores currently work
2. Create the brand folder structures for `football1` and `football2`
3. Create shared base components (BaseCard, layout components)
4. Create data files (games.json, videos.json with sample data)
5. Create stores (games, videos)
6. Create views and page-specific components
7. Wire up routing
8. Apply brand theming and verify both brands render correctly
9. Test responsive layout
10. Verify existing wellness brands still work
