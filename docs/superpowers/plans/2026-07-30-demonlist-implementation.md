# Extreme Demonlist Ranking App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a client-only Vite + Vue 3 SPA that displays the user's personal extreme-demon completion ranking as a sortable/filterable table, backed by `localStorage`, with JSON export/import and a 35-entry seed dataset.

**Architecture:** A single `useLevels` composable owns all state (levels array, sort state, filter state), persistence (debounced `localStorage` writes, seed-loading on first run), and import/export/validation logic. `App.vue` wires this composable to four presentational components: `FilterBar`, `DataToolbar`, `LevelTable`, `LevelFormModal`. No router, no backend, no external state library.

**Tech Stack:** Vite, Vue 3 (`<script setup>` + TypeScript), Vitest + jsdom for unit tests. No UI test-utils — per spec, only `useLevels` gets automated tests; components are verified manually via the dev server.

## Global Constraints

- No backend, no auth, no accounts — everything runs client-side (spec: Scope).
- Single dataset, no multi-list support in v1 (spec: Scope).
- Only `id`, `rank`, `name` are required on a `Level`; every other field must be independently blank-able (spec: Data model).
- Ambiguous source values (ranges, "lost", "prolly", "+") must NOT be guessed into numbers/dates — preserve verbatim in the paired `*Note` field and leave the numeric/date field `null` (spec: Seed data).
- Destructive actions (delete entry, reset to seed, import-overwrite) require a confirm step before applying (spec: Error handling).
- Import must validate shape before applying; on invalid input, existing data must be left untouched (spec: Error handling).
- Automated tests are Vitest-only, scoped to `useLevels` (sort/filter logic, import validation, seed-data parsing) and seed data shape — no UI/e2e tests in v1 (spec: Testing).
- Theme: dark neon — concrete tokens are locked in below (Task 7) rather than left to be improvised later.

## Visual direction (locked in via `frontend-design`)

**Color** (CSS custom properties, defined once in `src/style.css`):
- `--bg: #0A0612` — near-black with an eggplant undertone (page background)
- `--surface: #150D22` — table/panel background
- `--surface-raised: #1D1230` — modal/card background
- `--border: rgba(123, 47, 247, 0.28)` — hairline violet border, used everywhere instead of grey
- `--text: #F2E9FF` — primary text (soft lavender-white, not pure white)
- `--text-muted: #9C8BB5`
- `--accent-magenta: #FF3D9A` — primary interactive accent (links, active sort arrow, primary button fill)
- `--accent-violet: #7B2FF7` — secondary accent (borders, headings underglow)
- `--accent-cyan: #2DE2E6` — data/focus accent (focus rings, rank number glow)
- `--accent-lime: #C6FF3D` — enjoyment meter fill
- `--danger: #FF4757` — destructive actions (delete, reset)

**Type:** Display face `Unbounded` (page title, section headings) — geometric/industrial weight distinct from generic dark-mode-Bootstrap defaults. Body face `Inter` (labels, buttons, form chrome). Data face `JetBrains Mono` with tabular figures for every numeric/date column (rank, AREDL/DL rank, attempts, date, enjoyment) — ties the "precision platforming" subject matter to the table's own precision/alignment.

**Signature element — "attempt heat":** attempt counts are the emotional core of an extreme-demon list (they're literally the number of deaths). Instead of rendering them as a flat number, the `attempts` cell gets a banded glow that intensifies with the count: no glow under 2000, a subtle magenta text-shadow from 2000–4999, a stronger one from 5000–9999, and a slow ambient pulse animation (3s, disabled under `prefers-reduced-motion`) at 10000+. This is implemented as a computed CSS class (`heat-0` / `heat-1` / `heat-2` / `heat-3`) in `LevelTable.vue`.

**Layout:** Header wordmark ("EXTREME DEMONLIST" in Unbounded) with a small eyebrow ("personal completion log"). Slim `FilterBar` strip below it with a glowing bottom border. Main `LevelTable`: hairline row dividers, hover state adds a magenta outline + slight lift, drag handle only shown/active when sorted by rank. Enjoyment renders as 10 small pips (lit lime up to the value) rather than a bare digit. Buttons are ghost/outline by default (transparent fill, 1px accent border, glow on hover); "Add Level" is the one solid-fill (magenta) button; destructive actions (delete row, reset-to-seed) use the `--danger` outline color to read as different in kind from everything else.

---

### Task 1: Project scaffolding

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `index.html`
- Create: `src/main.ts`
- Create: `src/App.vue` (placeholder shell, replaced fully in Task 12)
- Create: `.gitignore`

**Interfaces:**
- Produces: an npm project runnable via `npm run dev`, `npm run build`, `npm test` — all later tasks assume these scripts exist.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "extreme-completion-ranking",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "vue": "^3.5.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.2.0",
    "jsdom": "^25.0.0",
    "typescript": "^5.7.0",
    "vite": "^6.0.0",
    "vitest": "^2.1.0",
    "vue-tsc": "^2.2.0"
  }
}
```

- [ ] **Step 2: Create `vite.config.ts`**

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
  },
})
```

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true,
    "jsx": "preserve",
    "types": ["vitest/globals"]
  },
  "include": ["src"]
}
```

Note: `"types": ["vitest/globals"]` is included so `.vue` files type-check cleanly even though test files import `vitest` explicitly (Step 4 of later tasks) rather than relying on globals.

- [ ] **Step 4: Create `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Extreme Demonlist</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Unbounded:wght@500;700;900&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap"
      rel="stylesheet"
    />
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 5: Create `src/main.ts`**

```ts
import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

createApp(App).mount('#app')
```

- [ ] **Step 6: Create placeholder `src/App.vue`**

```vue
<script setup lang="ts"></script>

<template>
  <main>Extreme Demonlist — under construction</main>
</template>
```

- [ ] **Step 7: Create empty `src/style.css` placeholder (filled in Task 7)**

```css
/* theme tokens added in Task 7 */
```

- [ ] **Step 8: Create `.gitignore`**

```
node_modules
dist
*.local
```

- [ ] **Step 9: Install dependencies and verify the dev server boots**

Run: `npm install && npm run build`
Expected: build completes with no errors and emits `dist/`.

- [ ] **Step 10: Commit**

```bash
git add package.json vite.config.ts tsconfig.json index.html src/main.ts src/App.vue src/style.css .gitignore package-lock.json
git commit -m "chore: scaffold Vite + Vue 3 + TypeScript project"
```

---

### Task 2: Level type and seed data

**Files:**
- Create: `src/types.ts`
- Create: `src/data/seedLevels.ts`
- Test: `src/data/seedLevels.spec.ts`

**Interfaces:**
- Produces: `Level` interface (consumed by every later task), `seedLevels: Level[]` (consumed by `useLevels` in Task 3).

- [ ] **Step 1: Write the failing test**

```ts
// src/data/seedLevels.spec.ts
import { describe, it, expect } from 'vitest'
import { seedLevels } from './seedLevels'

describe('seedLevels', () => {
  it('has exactly 35 entries', () => {
    expect(seedLevels).toHaveLength(35)
  })

  it('has unique, sequential ranks from 1 to 35', () => {
    const ranks = seedLevels.map((l) => l.rank).sort((a, b) => a - b)
    expect(ranks).toEqual(Array.from({ length: 35 }, (_, i) => i + 1))
  })

  it('has unique non-empty ids and names for every entry', () => {
    const ids = new Set(seedLevels.map((l) => l.id))
    const names = new Set(seedLevels.map((l) => l.name))
    expect(ids.size).toBe(35)
    expect(names.size).toBe(35)
    for (const level of seedLevels) {
      expect(level.id.length).toBeGreaterThan(0)
      expect(level.name.length).toBeGreaterThan(0)
    }
  })

  it('preserves ambiguous attempts/dates as null with a verbatim note instead of guessing', () => {
    const prismaticHaze = seedLevels.find((l) => l.name === 'Prismatic Haze')!
    expect(prismaticHaze.attempts).toBeNull()
    expect(prismaticHaze.attemptsNote).toBe('lost atts ~5-10k')

    const aftermath = seedLevels.find((l) => l.name === 'Aftermath')!
    expect(aftermath.date).toBeNull()
    expect(aftermath.dateNote).toBe("y'a 2 an")
  })

  it('parses precise numeric/date values into their typed fields', () => {
    const auditoryBreaker = seedLevels.find((l) => l.name === 'Auditory Breaker')!
    expect(auditoryBreaker.aredlRank).toBe(569)
    expect(auditoryBreaker.dlRank).toBe(425)
    expect(auditoryBreaker.attempts).toBe(8232)
    expect(auditoryBreaker.date).toBe('2026-04-21')
    expect(auditoryBreaker.enjoyment).toBe(6)
  })

  it('defaults unspecified optional fields to blank rather than omitting them', () => {
    for (const level of seedLevels) {
      expect(typeof level.creator).toBe('string')
      expect(typeof level.videoUrl).toBe('string')
      expect(typeof level.levelId).toBe('string')
      expect(typeof level.notes).toBe('string')
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/seedLevels.spec.ts`
Expected: FAIL — `Cannot find module './seedLevels'`

- [ ] **Step 3: Create `src/types.ts`**

```ts
export interface Level {
  id: string
  rank: number
  name: string
  aredlRank: number | null
  dlRank: number | null
  attempts: number | null
  attemptsNote: string
  date: string | null
  dateNote: string
  enjoyment: number | null
  creator: string
  videoUrl: string
  levelId: string
  notes: string
}
```

- [ ] **Step 4: Create `src/data/seedLevels.ts`**

```ts
import type { Level } from '../types'

export const seedLevels: Level[] = [
  { id: 'auditory-breaker', rank: 1, name: 'Auditory Breaker', aredlRank: 569, dlRank: 425, attempts: 8232, attemptsNote: '', date: '2026-04-21', dateNote: '', enjoyment: 6, creator: '', videoUrl: '', levelId: '', notes: '' },
  { id: 'astral-divinity', rank: 2, name: 'Astral Divinity', aredlRank: 504, dlRank: 449, attempts: 11982, attemptsNote: '', date: '2025-09-05', dateNote: '', enjoyment: 7, creator: '', videoUrl: '', levelId: '', notes: '' },
  { id: 'gravity', rank: 3, name: 'Gravity', aredlRank: 739, dlRank: null, attempts: 4213, attemptsNote: '', date: '2026-03-31', dateNote: '', enjoyment: 8, creator: '', videoUrl: '', levelId: '', notes: '' },
  { id: 'bloodbath', rank: 4, name: 'Bloodbath', aredlRank: 740, dlRank: null, attempts: 16000, attemptsNote: '', date: '2022-02-02', dateNote: '', enjoyment: 7, creator: '', videoUrl: '', levelId: '', notes: '' },
  { id: 'idols', rank: 5, name: 'Idols', aredlRank: 745, dlRank: null, attempts: 5786, attemptsNote: '', date: '2025-06-15', dateNote: '', enjoyment: 9, creator: '', videoUrl: '', levelId: '', notes: '' },
  { id: 'prismatic-haze', rank: 6, name: 'Prismatic Haze', aredlRank: 769, dlRank: null, attempts: null, attemptsNote: 'lost atts ~5-10k', date: '2022-02-25', dateNote: '', enjoyment: null, creator: '', videoUrl: '', levelId: '', notes: '' },
  { id: 'aftermath', rank: 7, name: 'Aftermath', aredlRank: 878, dlRank: null, attempts: null, attemptsNote: 'lost 2-4k', date: null, dateNote: "y'a 2 an", enjoyment: null, creator: '', videoUrl: '', levelId: '', notes: '' },
  { id: 'chopstep', rank: 8, name: 'Chopstep', aredlRank: 884, dlRank: null, attempts: 13256, attemptsNote: '', date: '2025-02-05', dateNote: '', enjoyment: null, creator: '', videoUrl: '', levelId: '', notes: '' },
  { id: 'daydream', rank: 9, name: 'Daydream', aredlRank: 963, dlRank: null, attempts: 16792, attemptsNote: '10k old + buffdate', date: '2025-05-14', dateNote: '', enjoyment: null, creator: '', videoUrl: '', levelId: '', notes: '' },
  { id: 'warning', rank: 10, name: 'Warning', aredlRank: 970, dlRank: null, attempts: 765, attemptsNote: '3422 old atts', date: '2026-07-06', dateNote: '', enjoyment: null, creator: '', videoUrl: '', levelId: '', notes: '' },
  { id: 'broken-signal', rank: 11, name: 'Broken Signal', aredlRank: 1092, dlRank: null, attempts: 1601, attemptsNote: '2.5k old atts', date: '2026-03-25', dateNote: '', enjoyment: null, creator: '', videoUrl: '', levelId: '', notes: '' },
  { id: 'napalm', rank: 12, name: 'Napalm', aredlRank: 1101, dlRank: null, attempts: 2981, attemptsNote: '', date: '2026-01-25', dateNote: '', enjoyment: null, creator: '', videoUrl: '', levelId: '', notes: '' },
  { id: 'deception-dive', rank: 13, name: 'Deception Dive', aredlRank: 1154, dlRank: null, attempts: null, attemptsNote: 'lost atts prolly 5k+', date: '2022-01-23', dateNote: '', enjoyment: null, creator: '', videoUrl: '', levelId: '', notes: '' },
  { id: 'crowd-control', rank: 14, name: 'Crowd Control', aredlRank: 1156, dlRank: null, attempts: 3100, attemptsNote: '', date: '2026-01-15', dateNote: '', enjoyment: null, creator: '', videoUrl: '', levelId: '', notes: '' },
  { id: 'cyclone', rank: 15, name: 'Cyclone', aredlRank: 1163, dlRank: null, attempts: 8853, attemptsNote: '', date: '2021-05-08', dateNote: '', enjoyment: null, creator: '', videoUrl: '', levelId: '', notes: '' },
  { id: 'shurima', rank: 16, name: 'Shurima', aredlRank: 1184, dlRank: null, attempts: 3220, attemptsNote: '', date: '2026-06-07', dateNote: '', enjoyment: null, creator: '', videoUrl: '', levelId: '', notes: '' },
  { id: 'allegiance', rank: 17, name: 'Allegiance', aredlRank: 1191, dlRank: null, attempts: 4500, attemptsNote: '', date: '2025-04-08', dateNote: '', enjoyment: null, creator: '', videoUrl: '', levelId: '', notes: '' },
  { id: 'just-dance', rank: 18, name: 'Just Dance', aredlRank: 1207, dlRank: null, attempts: 7150, attemptsNote: '', date: '2025-03-06', dateNote: '', enjoyment: null, creator: '', videoUrl: '', levelId: '', notes: '' },
  { id: 'reanimate', rank: 19, name: 'Reanimate', aredlRank: 1225, dlRank: null, attempts: 3226, attemptsNote: '', date: '2026-06-21', dateNote: '', enjoyment: null, creator: '', videoUrl: '', levelId: '', notes: '' },
  { id: 'make-it-drop', rank: 20, name: 'Make it Drop', aredlRank: 1261, dlRank: null, attempts: 3064, attemptsNote: '', date: '2022-01-21', dateNote: '', enjoyment: null, creator: '', videoUrl: '', levelId: '', notes: '' },
  { id: '8ox', rank: 21, name: '8ox', aredlRank: 1277, dlRank: null, attempts: 3000, attemptsNote: '', date: null, dateNote: "y'a 2 ans", enjoyment: null, creator: '', videoUrl: '', levelId: '', notes: '' },
  { id: 'penombre', rank: 22, name: 'Penombre', aredlRank: 1281, dlRank: null, attempts: 2200, attemptsNote: '', date: '2023-01-20', dateNote: '', enjoyment: null, creator: '', videoUrl: '', levelId: '', notes: '' },
  { id: 'forbidden-isle', rank: 23, name: 'Forbidden Isle', aredlRank: 1285, dlRank: null, attempts: null, attemptsNote: 'lost 5-10k', date: '2022-01-19', dateNote: '', enjoyment: null, creator: '', videoUrl: '', levelId: '', notes: '' },
  { id: 'cataclysm', rank: 24, name: 'Cataclysm', aredlRank: 1305, dlRank: null, attempts: 4405, attemptsNote: '', date: '2022-01-24', dateNote: '', enjoyment: null, creator: '', videoUrl: '', levelId: '', notes: '' },
  { id: 'azurite', rank: 25, name: 'Azurite', aredlRank: 1327, dlRank: null, attempts: 5500, attemptsNote: '', date: '2022-01-20', dateNote: '', enjoyment: null, creator: '', videoUrl: '', levelId: '', notes: '' },
  { id: 'reverie', rank: 26, name: 'Reverie', aredlRank: 1333, dlRank: null, attempts: 5393, attemptsNote: '', date: null, dateNote: "y'a 3 ans", enjoyment: null, creator: '', videoUrl: '', levelId: '', notes: '' },
  { id: 'niwa', rank: 27, name: 'Niwa', aredlRank: 1347, dlRank: null, attempts: 2400, attemptsNote: '', date: '2026-01-08', dateNote: '', enjoyment: null, creator: '', videoUrl: '', levelId: '', notes: '' },
  { id: 'mystic-bounds', rank: 28, name: 'Mystic Bounds', aredlRank: 1342, dlRank: null, attempts: 2016, attemptsNote: '', date: '2026-02-19', dateNote: '', enjoyment: null, creator: '', videoUrl: '', levelId: '', notes: '' },
  { id: 'prismatic', rank: 29, name: 'Prismatic', aredlRank: 1355, dlRank: null, attempts: 1370, attemptsNote: '', date: '2026-02-23', dateNote: '', enjoyment: null, creator: '', videoUrl: '', levelId: '', notes: '' },
  { id: 'acu', rank: 30, name: 'Acu', aredlRank: 1385, dlRank: null, attempts: null, attemptsNote: '10k+', date: '2021-03-28', dateNote: '', enjoyment: null, creator: '', videoUrl: '', levelId: '', notes: '' },
  { id: 'tantrum', rank: 31, name: 'Tantrum', aredlRank: 1340, dlRank: null, attempts: 2800, attemptsNote: '', date: '2021-08-26', dateNote: '', enjoyment: null, creator: '', videoUrl: '', levelId: '', notes: '' },
  { id: 'sweater-weather', rank: 32, name: 'Sweater Weather', aredlRank: 1384, dlRank: null, attempts: 1314, attemptsNote: '', date: '2026-02-26', dateNote: '', enjoyment: null, creator: '', videoUrl: '', levelId: '', notes: '' },
  { id: 'memories-iii', rank: 33, name: 'Memories III', aredlRank: 1478, dlRank: null, attempts: 2219, attemptsNote: '', date: '2026-07-26', dateNote: '', enjoyment: null, creator: '', videoUrl: '', levelId: '', notes: '' },
  { id: 'brutal', rank: 34, name: 'Brutal', aredlRank: 1486, dlRank: null, attempts: 3783, attemptsNote: '', date: '2026-06-29', dateNote: '', enjoyment: null, creator: '', videoUrl: '', levelId: '', notes: '' },
  { id: 'lone', rank: 35, name: 'Lone', aredlRank: 1490, dlRank: null, attempts: 1199, attemptsNote: '', date: '2026-07-07', dateNote: '', enjoyment: null, creator: '', videoUrl: '', levelId: '', notes: '' },
]
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/data/seedLevels.spec.ts`
Expected: PASS (6 tests)

- [ ] **Step 6: Commit**

```bash
git add src/types.ts src/data/seedLevels.ts src/data/seedLevels.spec.ts
git commit -m "feat: add Level schema and 35-entry seed dataset"
```

---

### Task 3: `useLevels` — state, CRUD, persistence, seed-loading

**Files:**
- Create: `src/composables/useLevels.ts`
- Test: `src/composables/useLevels.spec.ts`

**Interfaces:**
- Consumes: `Level` (`src/types.ts`), `seedLevels` (`src/data/seedLevels.ts`).
- Produces (this task's slice of the final API — sorting/filtering/import-export added in Tasks 4–6):
  - `export const STORAGE_KEY: string`
  - `export function useLevels(): { levels: Ref<Level[]>; addLevel(input: Omit<Level, 'id' | 'rank'>): void; updateLevel(id: string, patch: Partial<Omit<Level, 'id'>>): void; deleteLevel(id: string): void; reorderLevels(idsInOrder: string[]): void }`
  - Each call to `useLevels()` creates independent reactive state (no module-level singleton) — this is what makes it safe to call repeatedly in tests without cross-test pollution.

- [ ] **Step 1: Write the failing tests**

```ts
// src/composables/useLevels.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useLevels, STORAGE_KEY } from './useLevels'
import { seedLevels } from '../data/seedLevels'

describe('useLevels — seed loading', () => {
  beforeEach(() => localStorage.clear())

  it('loads the 35-entry seed dataset when storage is empty', () => {
    const { levels } = useLevels()
    expect(levels.value).toHaveLength(35)
    expect(levels.value[0].name).toBe('Auditory Breaker')
  })

  it('loads existing storage data instead of the seed when storage is non-empty', () => {
    const custom: typeof seedLevels = [
      { id: 'x', rank: 1, name: 'Custom', aredlRank: null, dlRank: null, attempts: null, attemptsNote: '', date: null, dateNote: '', enjoyment: null, creator: '', videoUrl: '', levelId: '', notes: '' },
    ]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(custom))
    const { levels } = useLevels()
    expect(levels.value).toEqual(custom)
  })
})

describe('useLevels — CRUD', () => {
  beforeEach(() => localStorage.clear())

  it('addLevel appends a level with the next sequential rank and a generated id', () => {
    const { levels, addLevel } = useLevels()
    const before = levels.value.length
    addLevel({ name: 'New Level', aredlRank: null, dlRank: null, attempts: null, attemptsNote: '', date: null, dateNote: '', enjoyment: null, creator: '', videoUrl: '', levelId: '', notes: '' })
    expect(levels.value).toHaveLength(before + 1)
    const added = levels.value[levels.value.length - 1]
    expect(added.name).toBe('New Level')
    expect(added.rank).toBe(before + 1)
    expect(added.id).toBeTruthy()
  })

  it('updateLevel patches only the given fields on the matching id', () => {
    const { levels, updateLevel } = useLevels()
    const target = levels.value[0]
    updateLevel(target.id, { enjoyment: 10 })
    expect(levels.value[0].enjoyment).toBe(10)
    expect(levels.value[0].name).toBe(target.name)
  })

  it('deleteLevel removes the matching id and leaves the rest untouched', () => {
    const { levels, deleteLevel } = useLevels()
    const before = levels.value.length
    const target = levels.value[0]
    deleteLevel(target.id)
    expect(levels.value).toHaveLength(before - 1)
    expect(levels.value.find((l) => l.id === target.id)).toBeUndefined()
  })

  it('reorderLevels reassigns rank 1..N to match the given id order', () => {
    const { levels, reorderLevels } = useLevels()
    const ids = levels.value.map((l) => l.id)
    const reversed = [...ids].reverse()
    reorderLevels(reversed)
    for (let i = 0; i < reversed.length; i++) {
      const level = levels.value.find((l) => l.id === reversed[i])!
      expect(level.rank).toBe(i + 1)
    }
  })
})

describe('useLevels — persistence', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })

  it('debounces writes to localStorage after a mutation', () => {
    const { addLevel } = useLevels()
    addLevel({ name: 'Persisted Level', aredlRank: null, dlRank: null, attempts: null, attemptsNote: '', date: null, dateNote: '', enjoyment: null, creator: '', videoUrl: '', levelId: '', notes: '' })
    vi.advanceTimersByTime(500)
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(stored).toHaveLength(36)
    expect(stored[35].name).toBe('Persisted Level')
    vi.useRealTimers()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/composables/useLevels.spec.ts`
Expected: FAIL — `Cannot find module './useLevels'`

- [ ] **Step 3: Implement `src/composables/useLevels.ts`**

```ts
import { ref, watch, type Ref } from 'vue'
import type { Level } from '../types'
import { seedLevels } from '../data/seedLevels'

export const STORAGE_KEY = 'ecr:levels:v1'

function generateId(): string {
  return `lvl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`
}

function debounce<T extends (...args: never[]) => void>(fn: T, wait: number) {
  let timer: ReturnType<typeof setTimeout> | undefined
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), wait)
  }
}

function loadInitialLevels(): Level[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return structuredClone(seedLevels)
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed as Level[]
  } catch {
    // fall through to seed data on corrupt storage
  }
  return structuredClone(seedLevels)
}

export function useLevels() {
  const levels: Ref<Level[]> = ref(loadInitialLevels())

  const persist = debounce((data: Level[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, 300)

  watch(levels, (data) => persist(data), { deep: true })

  function addLevel(input: Omit<Level, 'id' | 'rank'>): void {
    const rank = levels.value.length + 1
    levels.value.push({ ...input, id: generateId(), rank })
  }

  function updateLevel(id: string, patch: Partial<Omit<Level, 'id'>>): void {
    const level = levels.value.find((l) => l.id === id)
    if (!level) return
    Object.assign(level, patch)
  }

  function deleteLevel(id: string): void {
    levels.value = levels.value.filter((l) => l.id !== id)
  }

  function reorderLevels(idsInOrder: string[]): void {
    idsInOrder.forEach((id, index) => {
      const level = levels.value.find((l) => l.id === id)
      if (level) level.rank = index + 1
    })
  }

  return { levels, addLevel, updateLevel, deleteLevel, reorderLevels }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/composables/useLevels.spec.ts`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add src/composables/useLevels.ts src/composables/useLevels.spec.ts
git commit -m "feat: add useLevels composable with CRUD and localStorage persistence"
```

---

### Task 4: `useLevels` — sorting

**Files:**
- Modify: `src/composables/useLevels.ts`
- Test: `src/composables/useLevels.spec.ts`

**Interfaces:**
- Consumes: the `useLevels()` return value from Task 3.
- Produces (added to the same return object):
  - `export type SortKey = 'rank' | 'aredlRank' | 'dlRank' | 'attempts' | 'date' | 'enjoyment' | 'name'`
  - `sortKey: Ref<SortKey>`, `sortDir: Ref<'asc' | 'desc'>`
  - `setSort(key: SortKey): void` — clicking the active key flips `sortDir`; clicking a new key sets it with `sortDir = 'asc'`.
  - `visibleLevels: ComputedRef<Level[]>` (sort-only for now; Task 5 adds filtering into the same computed).
  - Null values always sort last regardless of `sortDir`.

- [ ] **Step 1: Write the failing tests**

```ts
// append to src/composables/useLevels.spec.ts
describe('useLevels — sorting', () => {
  beforeEach(() => localStorage.clear())

  it('defaults to sorting by rank ascending', () => {
    const { visibleLevels } = useLevels()
    const ranks = visibleLevels.value.map((l) => l.rank)
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b))
  })

  it('setSort on a new key sorts ascending by that key', () => {
    const { setSort, visibleLevels } = useLevels()
    setSort('attempts')
    const nonNull = visibleLevels.value.filter((l) => l.attempts !== null).map((l) => l.attempts!)
    expect(nonNull).toEqual([...nonNull].sort((a, b) => a - b))
  })

  it('setSort on the same key twice flips to descending', () => {
    const { setSort, visibleLevels } = useLevels()
    setSort('attempts')
    setSort('attempts')
    const nonNull = visibleLevels.value.filter((l) => l.attempts !== null).map((l) => l.attempts!)
    expect(nonNull).toEqual([...nonNull].sort((a, b) => b - a))
  })

  it('sorts null values last regardless of direction', () => {
    const { setSort, sortDir, visibleLevels } = useLevels()
    setSort('attempts')
    expect(visibleLevels.value[visibleLevels.value.length - 1].attempts).toBeNull()
    setSort('attempts')
    expect(sortDir.value).toBe('desc')
    expect(visibleLevels.value[visibleLevels.value.length - 1].attempts).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/composables/useLevels.spec.ts`
Expected: FAIL — `setSort is not a function` / `visibleLevels is undefined`

- [ ] **Step 3: Add sorting to `src/composables/useLevels.ts`**

Add near the top (after existing imports):

```ts
import { computed } from 'vue'

export type SortKey = 'rank' | 'aredlRank' | 'dlRank' | 'attempts' | 'date' | 'enjoyment' | 'name'
export type SortDir = 'asc' | 'desc'
```

Inside `useLevels()`, after the CRUD functions, before the `return`:

```ts
  const sortKey = ref<SortKey>('rank')
  const sortDir = ref<SortDir>('asc')

  function setSort(key: SortKey): void {
    if (sortKey.value === key) {
      sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortKey.value = key
      sortDir.value = 'asc'
    }
  }

  function compareLevels(a: Level, b: Level): number {
    const key = sortKey.value
    const av = key === 'name' ? a.name : a[key]
    const bv = key === 'name' ? b.name : b[key]
    if (av === null && bv === null) return 0
    if (av === null) return 1
    if (bv === null) return -1
    const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number)
    return sortDir.value === 'asc' ? cmp : -cmp
  }

  const visibleLevels = computed(() => [...levels.value].sort(compareLevels))
```

Update the `return` statement to include the new members:

```ts
  return { levels, addLevel, updateLevel, deleteLevel, reorderLevels, sortKey, sortDir, setSort, visibleLevels }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/composables/useLevels.spec.ts`
Expected: PASS (11 tests)

- [ ] **Step 5: Commit**

```bash
git add src/composables/useLevels.ts src/composables/useLevels.spec.ts
git commit -m "feat: add sortable visibleLevels to useLevels"
```

---

### Task 5: `useLevels` — filtering

**Files:**
- Modify: `src/composables/useLevels.ts`
- Test: `src/composables/useLevels.spec.ts`

**Interfaces:**
- Consumes: `visibleLevels`/`compareLevels` from Task 4.
- Produces (added to the same return object):
  - `export interface Filters { search: string; attemptsMin: number | null; attemptsMax: number | null; enjoymentMin: number | null; enjoymentMax: number | null; rankMin: number | null; rankMax: number | null; dateFrom: string | null; dateTo: string | null }`
  - `filters: Filters` (a `reactive` object — components bind directly to its properties, e.g. `v-model="filters.search"`)
  - `visibleLevels` now applies filters before sorting.
  - Rule: when a numeric/date range filter is active (min or max set) and the level's corresponding field is `null`, the level is excluded (a level with unknown attempts can't be evaluated against an attempts range).

- [ ] **Step 1: Write the failing tests**

```ts
// append to src/composables/useLevels.spec.ts
describe('useLevels — filtering', () => {
  beforeEach(() => localStorage.clear())

  it('search matches name case-insensitively', () => {
    const { filters, visibleLevels } = useLevels()
    filters.search = 'gravity'
    expect(visibleLevels.value.map((l) => l.name)).toEqual(['Gravity'])
  })

  it('search matches creator case-insensitively', () => {
    const { levels, filters, visibleLevels } = useLevels()
    levels.value[0].creator = 'SomeCreator'
    filters.search = 'somecreator'
    expect(visibleLevels.value).toHaveLength(1)
    expect(visibleLevels.value[0].id).toBe(levels.value[0].id)
  })

  it('filters by attempts range, excluding entries with null attempts', () => {
    const { filters, visibleLevels } = useLevels()
    filters.attemptsMin = 5000
    filters.attemptsMax = 9000
    for (const level of visibleLevels.value) {
      expect(level.attempts).not.toBeNull()
      expect(level.attempts!).toBeGreaterThanOrEqual(5000)
      expect(level.attempts!).toBeLessThanOrEqual(9000)
    }
  })

  it('filters by date range, excluding entries with null date', () => {
    const { filters, visibleLevels } = useLevels()
    filters.dateFrom = '2026-01-01'
    filters.dateTo = '2026-12-31'
    for (const level of visibleLevels.value) {
      expect(level.date).not.toBeNull()
      expect(level.date! >= '2026-01-01' && level.date! <= '2026-12-31').toBe(true)
    }
  })

  it('combines search, range filters, and sort together', () => {
    const { filters, setSort, visibleLevels } = useLevels()
    filters.attemptsMin = 1000
    setSort('attempts')
    const attempts = visibleLevels.value.map((l) => l.attempts!)
    expect(attempts.every((a) => a >= 1000)).toBe(true)
    expect(attempts).toEqual([...attempts].sort((a, b) => a - b))
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/composables/useLevels.spec.ts`
Expected: FAIL — `filters is undefined`

- [ ] **Step 3: Add filtering to `src/composables/useLevels.ts`**

Change the `computed` import line to also import `reactive`:

```ts
import { ref, watch, computed, reactive, type Ref } from 'vue'
```

Add the `Filters` interface near the `SortKey`/`SortDir` types:

```ts
export interface Filters {
  search: string
  attemptsMin: number | null
  attemptsMax: number | null
  enjoymentMin: number | null
  enjoymentMax: number | null
  rankMin: number | null
  rankMax: number | null
  dateFrom: string | null
  dateTo: string | null
}

function inRange(value: number | null, min: number | null, max: number | null): boolean {
  if (min === null && max === null) return true
  if (value === null) return false
  if (min !== null && value < min) return false
  if (max !== null && value > max) return false
  return true
}
```

Inside `useLevels()`, after `sortKey`/`sortDir`/`setSort`, replace the `visibleLevels` computed with a filtered + sorted version:

```ts
  const filters = reactive<Filters>({
    search: '',
    attemptsMin: null,
    attemptsMax: null,
    enjoymentMin: null,
    enjoymentMax: null,
    rankMin: null,
    rankMax: null,
    dateFrom: null,
    dateTo: null,
  })

  function matchesFilters(level: Level): boolean {
    const search = filters.search.trim().toLowerCase()
    if (search && !level.name.toLowerCase().includes(search) && !level.creator.toLowerCase().includes(search)) {
      return false
    }
    if (!inRange(level.attempts, filters.attemptsMin, filters.attemptsMax)) return false
    if (!inRange(level.enjoyment, filters.enjoymentMin, filters.enjoymentMax)) return false
    if (!inRange(level.rank, filters.rankMin, filters.rankMax)) return false
    if (filters.dateFrom !== null || filters.dateTo !== null) {
      if (level.date === null) return false
      if (filters.dateFrom !== null && level.date < filters.dateFrom) return false
      if (filters.dateTo !== null && level.date > filters.dateTo) return false
    }
    return true
  }

  const visibleLevels = computed(() => levels.value.filter(matchesFilters).sort(compareLevels))
```

Update the `return` statement:

```ts
  return { levels, addLevel, updateLevel, deleteLevel, reorderLevels, sortKey, sortDir, setSort, filters, visibleLevels }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/composables/useLevels.spec.ts`
Expected: PASS (16 tests)

- [ ] **Step 5: Commit**

```bash
git add src/composables/useLevels.ts src/composables/useLevels.spec.ts
git commit -m "feat: add filtering (search + numeric/date ranges) to useLevels"
```

---

### Task 6: `useLevels` — import/export/reset

**Files:**
- Modify: `src/composables/useLevels.ts`
- Test: `src/composables/useLevels.spec.ts`

**Interfaces:**
- Consumes: `levels`, `STORAGE_KEY`, `seedLevels` from earlier tasks/Task 3.
- Produces (added to the same return object):
  - `export interface ImportResult { ok: boolean; error?: string }`
  - `exportJson(): string` — pretty-printed JSON of the current `levels.value`.
  - `importJson(jsonText: string): ImportResult` — validates, and only on success replaces `levels.value` (and thus triggers persistence via the existing `watch`).
  - `resetToSeed(): void` — replaces `levels.value` with a fresh deep clone of `seedLevels`. No confirmation here — confirmation is the caller's (UI's) responsibility, per spec's "Error handling" section.

- [ ] **Step 1: Write the failing tests**

```ts
// append to src/composables/useLevels.spec.ts
describe('useLevels — import/export/reset', () => {
  beforeEach(() => localStorage.clear())

  it('exportJson serializes the current levels as valid JSON', () => {
    const { levels, exportJson } = useLevels()
    const parsed = JSON.parse(exportJson())
    expect(parsed).toEqual(levels.value)
  })

  it('importJson accepts a well-formed Level[] and replaces the dataset', () => {
    const { levels, importJson } = useLevels()
    const replacement = [
      { id: 'a', rank: 1, name: 'Imported', aredlRank: null, dlRank: null, attempts: null, attemptsNote: '', date: null, dateNote: '', enjoyment: null, creator: '', videoUrl: '', levelId: '', notes: '' },
    ]
    const result = importJson(JSON.stringify(replacement))
    expect(result.ok).toBe(true)
    expect(levels.value).toEqual(replacement)
  })

  it('importJson rejects non-JSON input and leaves existing data untouched', () => {
    const { levels, importJson } = useLevels()
    const before = [...levels.value]
    const result = importJson('not json')
    expect(result.ok).toBe(false)
    expect(result.error).toBeTruthy()
    expect(levels.value).toEqual(before)
  })

  it('importJson rejects a JSON object that is not an array', () => {
    const { levels, importJson } = useLevels()
    const before = [...levels.value]
    const result = importJson(JSON.stringify({ not: 'an array' }))
    expect(result.ok).toBe(false)
    expect(levels.value).toEqual(before)
  })

  it('importJson rejects entries missing required fields', () => {
    const { levels, importJson } = useLevels()
    const before = [...levels.value]
    const result = importJson(JSON.stringify([{ id: 'a', rank: 1 }]))
    expect(result.ok).toBe(false)
    expect(result.error).toContain('name')
    expect(levels.value).toEqual(before)
  })

  it('resetToSeed restores the original 35-entry seed dataset after mutation', () => {
    const { levels, addLevel, resetToSeed } = useLevels()
    addLevel({ name: 'Temp', aredlRank: null, dlRank: null, attempts: null, attemptsNote: '', date: null, dateNote: '', enjoyment: null, creator: '', videoUrl: '', levelId: '', notes: '' })
    expect(levels.value).toHaveLength(36)
    resetToSeed()
    expect(levels.value).toHaveLength(35)
    expect(levels.value[0].name).toBe('Auditory Breaker')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/composables/useLevels.spec.ts`
Expected: FAIL — `exportJson is not a function`

- [ ] **Step 3: Add import/export/reset to `src/composables/useLevels.ts`**

Add near the other top-level types:

```ts
export interface ImportResult {
  ok: boolean
  error?: string
}

const LEVEL_FIELD_TYPES: Record<keyof Level, 'string' | 'number' | 'nullable-string' | 'nullable-number'> = {
  id: 'string',
  rank: 'number',
  name: 'string',
  aredlRank: 'nullable-number',
  dlRank: 'nullable-number',
  attempts: 'nullable-number',
  attemptsNote: 'string',
  date: 'nullable-string',
  dateNote: 'string',
  enjoyment: 'nullable-number',
  creator: 'string',
  videoUrl: 'string',
  levelId: 'string',
  notes: 'string',
}

function validateLevel(item: unknown, index: number): string | null {
  if (typeof item !== 'object' || item === null) return `Entry ${index}: not an object.`
  const record = item as Record<string, unknown>
  for (const [field, kind] of Object.entries(LEVEL_FIELD_TYPES) as [keyof Level, string][]) {
    const value = record[field]
    const ok =
      (kind === 'string' && typeof value === 'string') ||
      (kind === 'number' && typeof value === 'number') ||
      (kind === 'nullable-string' && (value === null || typeof value === 'string')) ||
      (kind === 'nullable-number' && (value === null || typeof value === 'number'))
    if (!ok) return `Entry ${index}: missing or invalid field "${field}".`
  }
  return null
}
```

Inside `useLevels()`, after `matchesFilters`/`visibleLevels`, before the `return`:

```ts
  function exportJson(): string {
    return JSON.stringify(levels.value, null, 2)
  }

  function importJson(jsonText: string): ImportResult {
    let parsed: unknown
    try {
      parsed = JSON.parse(jsonText)
    } catch {
      return { ok: false, error: 'Invalid JSON: the file could not be parsed.' }
    }
    if (!Array.isArray(parsed)) {
      return { ok: false, error: 'Expected a JSON array of levels.' }
    }
    for (let i = 0; i < parsed.length; i++) {
      const error = validateLevel(parsed[i], i)
      if (error) return { ok: false, error }
    }
    levels.value = parsed as Level[]
    return { ok: true }
  }

  function resetToSeed(): void {
    levels.value = structuredClone(seedLevels)
  }
```

Update the `return` statement:

```ts
  return {
    levels,
    addLevel,
    updateLevel,
    deleteLevel,
    reorderLevels,
    sortKey,
    sortDir,
    setSort,
    filters,
    visibleLevels,
    exportJson,
    importJson,
    resetToSeed,
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/composables/useLevels.spec.ts`
Expected: PASS (22 tests)

- [ ] **Step 5: Run the full test suite**

Run: `npm test`
Expected: PASS (28 tests total, across `seedLevels.spec.ts` and `useLevels.spec.ts`)

- [ ] **Step 6: Commit**

```bash
git add src/composables/useLevels.ts src/composables/useLevels.spec.ts
git commit -m "feat: add JSON export/import validation and reset-to-seed to useLevels"
```

---

### Task 7: Global theme

**Files:**
- Modify: `src/style.css`

**Interfaces:**
- Produces: CSS custom properties (`--bg`, `--surface`, `--surface-raised`, `--border`, `--text`, `--text-muted`, `--accent-magenta`, `--accent-violet`, `--accent-cyan`, `--accent-lime`, `--danger`, `--font-display`, `--font-body`, `--font-mono`, `--radius`) consumed by every component in Tasks 8–12. `index.html` already loads Unbounded/Inter/JetBrains Mono (Task 1, Step 4).

- [ ] **Step 1: Replace `src/style.css`**

```css
:root {
  --bg: #0a0612;
  --surface: #150d22;
  --surface-raised: #1d1230;
  --border: rgba(123, 47, 247, 0.28);
  --text: #f2e9ff;
  --text-muted: #9c8bb5;
  --accent-magenta: #ff3d9a;
  --accent-violet: #7b2ff7;
  --accent-cyan: #2de2e6;
  --accent-lime: #c6ff3d;
  --danger: #ff4757;
  --font-display: 'Unbounded', sans-serif;
  --font-body: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --radius: 8px;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-body);
}

button {
  font-family: var(--font-body);
  cursor: pointer;
}

input,
select,
textarea {
  font-family: var(--font-body);
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

input:focus-visible,
select:focus-visible,
textarea:focus-visible,
button:focus-visible,
[tabindex]:focus-visible {
  outline: 2px solid var(--accent-cyan);
  outline-offset: 2px;
}

.btn {
  background: transparent;
  border: 1px solid var(--accent-violet);
  color: var(--text);
  border-radius: var(--radius);
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  letter-spacing: 0.02em;
  transition: box-shadow 150ms ease, border-color 150ms ease;
}

.btn:hover {
  border-color: var(--accent-cyan);
  box-shadow: 0 0 12px rgba(45, 226, 230, 0.35);
}

.btn-primary {
  background: var(--accent-magenta);
  border-color: var(--accent-magenta);
  color: #0a0612;
  font-weight: 600;
}

.btn-primary:hover {
  box-shadow: 0 0 16px rgba(255, 61, 154, 0.55);
}

.btn-danger {
  border-color: var(--danger);
}

.btn-danger:hover {
  border-color: var(--danger);
  box-shadow: 0 0 12px rgba(255, 71, 87, 0.4);
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
}
```

- [ ] **Step 2: Verify no build errors**

Run: `npm run build`
Expected: build succeeds (CSS has no logic to unit test; verification here is purely "it compiles").

- [ ] **Step 3: Commit**

```bash
git add src/style.css
git commit -m "feat: add dark-neon theme tokens and base styles"
```

---

### Task 8: `LevelTable.vue`

**Files:**
- Create: `src/components/LevelTable.vue`

**Interfaces:**
- Consumes (props): `levels: Level[]` (the `visibleLevels.value` from `useLevels`), `sortKey: SortKey`, `sortDir: 'asc' | 'desc'`.
- Consumes (emits): `sort` (payload: `SortKey`) → parent calls `setSort(key)`; `edit` (payload: `Level`) → parent opens the form modal in edit mode; `delete` (payload: `string` id) → parent confirms then calls `deleteLevel(id)`; `reorder` (payload: `string[]`, the full new id order) → parent calls `reorderLevels(ids)`.
- Produces: nothing consumed elsewhere — this is a leaf component wired directly into `App.vue` in Task 12.

- [ ] **Step 1: Create `src/components/LevelTable.vue`**

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { Level } from '../types'
import type { SortKey, SortDir } from '../composables/useLevels'

const props = defineProps<{
  levels: Level[]
  sortKey: SortKey
  sortDir: SortDir
}>()

const emit = defineEmits<{
  sort: [key: SortKey]
  edit: [level: Level]
  delete: [id: string]
  reorder: [ids: string[]]
}>()

const columns: { key: SortKey; label: string }[] = [
  { key: 'rank', label: 'Rank' },
  { key: 'name', label: 'Name' },
  { key: 'aredlRank', label: 'AREDL' },
  { key: 'dlRank', label: 'DL' },
  { key: 'attempts', label: 'Attempts' },
  { key: 'date', label: 'Date' },
  { key: 'enjoyment', label: 'Enjoyment' },
]

function heatClass(attempts: number | null): string {
  if (attempts === null) return ''
  if (attempts >= 10000) return 'heat-3'
  if (attempts >= 5000) return 'heat-2'
  if (attempts >= 2000) return 'heat-1'
  return ''
}

function sortIndicator(key: SortKey): string {
  if (props.sortKey !== key) return ''
  return props.sortDir === 'asc' ? '▲' : '▼'
}

function onDelete(level: Level): void {
  if (confirm(`Delete "${level.name}" from your list? This cannot be undone.`)) {
    emit('delete', level.id)
  }
}

const draggingId = ref<string | null>(null)
const dragEnabled = () => props.sortKey === 'rank'

function onDragStart(id: string): void {
  if (!dragEnabled()) return
  draggingId.value = id
}

function onDrop(targetId: string): void {
  if (!dragEnabled() || draggingId.value === null || draggingId.value === targetId) return
  const ids = props.levels.map((l) => l.id)
  const from = ids.indexOf(draggingId.value)
  const to = ids.indexOf(targetId)
  ids.splice(from, 1)
  ids.splice(to, 0, draggingId.value)
  draggingId.value = null
  emit('reorder', ids)
}
</script>

<template>
  <table class="level-table">
    <thead>
      <tr>
        <th class="handle-col" v-if="sortKey === 'rank'"></th>
        <th v-for="col in columns" :key="col.key" @click="emit('sort', col.key)" class="sortable">
          {{ col.label }} <span class="indicator">{{ sortIndicator(col.key) }}</span>
        </th>
        <th class="actions-col">Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="level in levels"
        :key="level.id"
        :draggable="dragEnabled()"
        @dragstart="onDragStart(level.id)"
        @dragover.prevent
        @drop="onDrop(level.id)"
        :class="{ dragging: draggingId === level.id }"
      >
        <td class="handle-col" v-if="sortKey === 'rank'">&#8942;&#8942;</td>
        <td class="mono">{{ level.rank }}</td>
        <td>{{ level.name }}</td>
        <td class="mono">{{ level.aredlRank ?? '—' }}</td>
        <td class="mono">{{ level.dlRank ?? '—' }}</td>
        <td class="mono" :class="heatClass(level.attempts)">
          {{ level.attempts !== null ? level.attempts.toLocaleString() : level.attemptsNote || '—' }}
        </td>
        <td class="mono">{{ level.date ?? level.dateNote || '—' }}</td>
        <td>
          <span class="enjoyment-meter" v-if="level.enjoyment !== null">
            <span
              v-for="pip in 10"
              :key="pip"
              class="pip"
              :class="{ lit: pip <= level.enjoyment }"
            ></span>
          </span>
          <span v-else class="mono">—</span>
        </td>
        <td class="actions-col">
          <button class="btn" @click="emit('edit', level)">Edit</button>
          <button class="btn btn-danger" @click="onDelete(level)">Delete</button>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>
.level-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--surface);
  border-radius: var(--radius);
  overflow: hidden;
}

th,
td {
  padding: 0.6rem 0.8rem;
  border-bottom: 1px solid var(--border);
  text-align: left;
  font-size: 0.85rem;
}

th {
  font-family: var(--font-body);
  font-weight: 600;
  color: var(--text-muted);
  user-select: none;
}

th.sortable {
  cursor: pointer;
}

th.sortable:hover {
  color: var(--accent-cyan);
}

.indicator {
  color: var(--accent-magenta);
  font-size: 0.7em;
}

.mono {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}

tbody tr {
  transition: box-shadow 150ms ease, transform 150ms ease;
}

tbody tr:hover {
  box-shadow: inset 0 0 0 1px var(--accent-magenta);
}

tbody tr.dragging {
  opacity: 0.4;
}

.handle-col {
  width: 1.5rem;
  color: var(--text-muted);
  cursor: grab;
  letter-spacing: -2px;
}

.actions-col {
  white-space: nowrap;
}

.actions-col .btn {
  padding: 0.3rem 0.6rem;
  font-size: 0.75rem;
  margin-right: 0.3rem;
}

.heat-1 {
  text-shadow: 0 0 6px rgba(255, 61, 154, 0.45);
}

.heat-2 {
  text-shadow: 0 0 10px rgba(255, 61, 154, 0.7);
  color: var(--accent-magenta);
}

.heat-3 {
  text-shadow: 0 0 14px rgba(255, 61, 154, 0.9);
  color: var(--accent-magenta);
  animation: pulse-heat 3s ease-in-out infinite;
}

@keyframes pulse-heat {
  0%,
  100% {
    text-shadow: 0 0 14px rgba(255, 61, 154, 0.9);
  }
  50% {
    text-shadow: 0 0 22px rgba(255, 61, 154, 1);
  }
}

.enjoyment-meter {
  display: inline-flex;
  gap: 2px;
}

.pip {
  width: 6px;
  height: 12px;
  border-radius: 2px;
  background: var(--border);
}

.pip.lit {
  background: var(--accent-lime);
  box-shadow: 0 0 4px rgba(198, 255, 61, 0.6);
}
</style>
```

- [ ] **Step 2: Verify no build errors**

Run: `npm run build`
Expected: build succeeds. (No automated test for this component per spec's testing scope — verified visually in Task 12.)

- [ ] **Step 3: Commit**

```bash
git add src/components/LevelTable.vue
git commit -m "feat: add LevelTable with sortable columns, drag reorder, and attempt-heat styling"
```

---

### Task 9: `LevelFormModal.vue`

**Files:**
- Create: `src/components/LevelFormModal.vue`

**Interfaces:**
- Consumes (props): `level: Level | null` (`null` = create mode, otherwise the level being edited).
- Consumes (emits): `save` (payload: `Omit<Level, 'id' | 'rank'>`) → parent calls `addLevel(payload)` when `level` prop was `null`, or `updateLevel(level.id, payload)` otherwise; `close` (no payload) → parent hides the modal.
- Note: `rank` is intentionally excluded from the form — per spec, rank is manual/drag-reorderable via the table only (Task 8), not directly editable as a number.

- [ ] **Step 1: Create `src/components/LevelFormModal.vue`**

```vue
<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { Level } from '../types'

const props = defineProps<{
  level: Level | null
}>()

const emit = defineEmits<{
  save: [payload: Omit<Level, 'id' | 'rank'>]
  close: []
}>()

function blankForm(): Omit<Level, 'id' | 'rank'> {
  return {
    name: '',
    aredlRank: null,
    dlRank: null,
    attempts: null,
    attemptsNote: '',
    date: null,
    dateNote: '',
    enjoyment: null,
    creator: '',
    videoUrl: '',
    levelId: '',
    notes: '',
  }
}

const form = reactive(props.level ? { ...props.level } : blankForm())

watch(
  () => props.level,
  (level) => {
    Object.assign(form, level ? { ...level } : blankForm())
  },
)

function toNullableNumber(value: string): number | null {
  return value === '' ? null : Number(value)
}

function onSubmit(): void {
  if (!form.name.trim()) return
  const { id: _id, rank: _rank, ...payload } = form as Level
  emit('save', payload)
}
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="modal">
      <h2>{{ level ? 'Edit level' : 'Add level' }}</h2>
      <form @submit.prevent="onSubmit">
        <label>
          Name *
          <input v-model="form.name" type="text" required />
        </label>
        <label>
          Creator
          <input v-model="form.creator" type="text" />
        </label>
        <div class="row">
          <label>
            AREDL rank
            <input
              :value="form.aredlRank ?? ''"
              @input="form.aredlRank = toNullableNumber(($event.target as HTMLInputElement).value)"
              type="number"
            />
          </label>
          <label>
            DL rank
            <input
              :value="form.dlRank ?? ''"
              @input="form.dlRank = toNullableNumber(($event.target as HTMLInputElement).value)"
              type="number"
            />
          </label>
        </div>
        <div class="row">
          <label>
            Attempts
            <input
              :value="form.attempts ?? ''"
              @input="form.attempts = toNullableNumber(($event.target as HTMLInputElement).value)"
              type="number"
            />
          </label>
          <label>
            Attempts note
            <input v-model="form.attemptsNote" type="text" placeholder="e.g. lost, prolly 5k+" />
          </label>
        </div>
        <div class="row">
          <label>
            Date
            <input v-model="form.date" type="date" />
          </label>
          <label>
            Date note
            <input v-model="form.dateNote" type="text" placeholder="e.g. il y a 2 ans" />
          </label>
        </div>
        <label>
          Enjoyment (0-10)
          <input
            :value="form.enjoyment ?? ''"
            @input="form.enjoyment = toNullableNumber(($event.target as HTMLInputElement).value)"
            type="number"
            min="0"
            max="10"
          />
        </label>
        <label>
          Video URL
          <input v-model="form.videoUrl" type="text" />
        </label>
        <label>
          Level ID
          <input v-model="form.levelId" type="text" />
        </label>
        <label>
          Notes
          <textarea v-model="form.notes" rows="3"></textarea>
        </label>
        <div class="actions">
          <button type="button" class="btn" @click="emit('close')">Cancel</button>
          <button type="submit" class="btn btn-primary">Save</button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 6, 18, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.modal {
  background: var(--surface-raised);
  border-top: 3px solid var(--accent-violet);
  border-radius: var(--radius);
  padding: 1.5rem;
  width: min(520px, 90vw);
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 0 32px rgba(123, 47, 247, 0.35);
}

.modal h2 {
  font-family: var(--font-display);
  margin-top: 0;
}

form {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

label {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: 0.8rem;
  color: var(--text-muted);
}

input,
textarea {
  padding: 0.4rem 0.6rem;
  font-size: 0.9rem;
  color: var(--text);
}

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.8rem;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  margin-top: 0.5rem;
}
</style>
```

- [ ] **Step 2: Verify no build errors**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/LevelFormModal.vue
git commit -m "feat: add LevelFormModal for creating and editing levels"
```

---

### Task 10: `FilterBar.vue`

**Files:**
- Create: `src/components/FilterBar.vue`

**Interfaces:**
- Consumes (props): `filters: Filters` (the reactive object from `useLevels`, passed through as-is — this component mutates it directly via `v-model`, matching how `useLevels` exposes it).

- [ ] **Step 1: Create `src/components/FilterBar.vue`**

```vue
<script setup lang="ts">
import type { Filters } from '../composables/useLevels'

defineProps<{
  filters: Filters
}>()

function toNullableNumber(value: string): number | null {
  return value === '' ? null : Number(value)
}
</script>

<template>
  <div class="filter-bar">
    <input v-model="filters.search" type="text" placeholder="Search name or creator…" class="search" />
    <label>
      Attempts
      <input
        :value="filters.attemptsMin ?? ''"
        @input="filters.attemptsMin = toNullableNumber(($event.target as HTMLInputElement).value)"
        type="number"
        placeholder="min"
      />
      <input
        :value="filters.attemptsMax ?? ''"
        @input="filters.attemptsMax = toNullableNumber(($event.target as HTMLInputElement).value)"
        type="number"
        placeholder="max"
      />
    </label>
    <label>
      Enjoyment
      <input
        :value="filters.enjoymentMin ?? ''"
        @input="filters.enjoymentMin = toNullableNumber(($event.target as HTMLInputElement).value)"
        type="number"
        placeholder="min"
      />
      <input
        :value="filters.enjoymentMax ?? ''"
        @input="filters.enjoymentMax = toNullableNumber(($event.target as HTMLInputElement).value)"
        type="number"
        placeholder="max"
      />
    </label>
    <label>
      Rank
      <input
        :value="filters.rankMin ?? ''"
        @input="filters.rankMin = toNullableNumber(($event.target as HTMLInputElement).value)"
        type="number"
        placeholder="min"
      />
      <input
        :value="filters.rankMax ?? ''"
        @input="filters.rankMax = toNullableNumber(($event.target as HTMLInputElement).value)"
        type="number"
        placeholder="max"
      />
    </label>
    <label>
      Date
      <input v-model="filters.dateFrom" type="date" />
      <input v-model="filters.dateTo" type="date" />
    </label>
  </div>
</template>

<style scoped>
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 1rem;
  padding: 0.8rem 1rem;
  background: var(--surface);
  border-bottom: 2px solid var(--accent-violet);
  box-shadow: 0 4px 16px -8px rgba(123, 47, 247, 0.5);
}

.filter-bar label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.filter-bar label > input {
  display: inline-block;
  width: 5.5rem;
  margin-right: 0.3rem;
}

.search {
  min-width: 200px;
  align-self: flex-end;
}
</style>
```

- [ ] **Step 2: Verify no build errors**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/FilterBar.vue
git commit -m "feat: add FilterBar for search and numeric/date range filtering"
```

---

### Task 11: `DataToolbar.vue`

**Files:**
- Create: `src/components/DataToolbar.vue`

**Interfaces:**
- Consumes (props): none.
- Consumes (emits): `export` (no payload) → parent calls `exportJson()` and triggers the download; `import` (payload: `string`, the raw file text) → parent calls `importJson(text)` and surfaces the result; `reset` (no payload) → parent confirms then calls `resetToSeed()`.
- This component owns the `<input type="file">` and `Blob`/anchor-download mechanics so `useLevels` stays DOM-free and unit-testable.

- [ ] **Step 1: Create `src/components/DataToolbar.vue`**

```vue
<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  export: []
  import: [text: string]
  reset: []
}>()

const fileInput = ref<HTMLInputElement | null>(null)

function triggerImport(): void {
  fileInput.value?.click()
}

function onFileChange(event: Event): void {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => emit('import', String(reader.result))
  reader.readAsText(file)
  ;(event.target as HTMLInputElement).value = ''
}

function onReset(): void {
  if (confirm('Reset your list back to the original seed data? Your current entries will be lost.')) {
    emit('reset')
  }
}
</script>

<template>
  <div class="toolbar">
    <button class="btn" @click="emit('export')">Export JSON</button>
    <button class="btn" @click="triggerImport">Import JSON</button>
    <input ref="fileInput" type="file" accept="application/json" class="hidden-input" @change="onFileChange" />
    <button class="btn btn-danger" @click="onReset">Reset to seed</button>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  gap: 0.6rem;
}

.hidden-input {
  display: none;
}
</style>
```

- [ ] **Step 2: Verify no build errors**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/DataToolbar.vue
git commit -m "feat: add DataToolbar for JSON export/import and reset-to-seed"
```

---

### Task 12: Wire up `App.vue` and manually verify

**Files:**
- Modify: `src/App.vue`
- Modify: `README.md`

**Interfaces:**
- Consumes: `useLevels()` (Tasks 3–6), `LevelTable`, `LevelFormModal`, `FilterBar`, `DataToolbar` (Tasks 8–11).
- Produces: the complete app — nothing further consumes this.

- [ ] **Step 1: Replace `src/App.vue`**

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useLevels } from './composables/useLevels'
import type { Level } from './types'
import LevelTable from './components/LevelTable.vue'
import LevelFormModal from './components/LevelFormModal.vue'
import FilterBar from './components/FilterBar.vue'
import DataToolbar from './components/DataToolbar.vue'

const {
  addLevel,
  updateLevel,
  deleteLevel,
  reorderLevels,
  sortKey,
  sortDir,
  setSort,
  filters,
  visibleLevels,
  exportJson,
  importJson,
  resetToSeed,
} = useLevels()

const editingLevel = ref<Level | null>(null)
const showModal = ref(false)
const importError = ref<string | null>(null)

function openCreate(): void {
  editingLevel.value = null
  showModal.value = true
}

function openEdit(level: Level): void {
  editingLevel.value = level
  showModal.value = true
}

function onSave(payload: Omit<Level, 'id' | 'rank'>): void {
  if (editingLevel.value) {
    updateLevel(editingLevel.value.id, payload)
  } else {
    addLevel(payload)
  }
  showModal.value = false
}

function onExport(): void {
  const blob = new Blob([exportJson()], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'extreme-demonlist.json'
  a.click()
  URL.revokeObjectURL(url)
}

function onImport(text: string): void {
  const result = importJson(text)
  importError.value = result.ok ? null : result.error ?? 'Import failed.'
}
</script>

<template>
  <header class="app-header">
    <div>
      <p class="eyebrow">Personal completion log</p>
      <h1>Extreme Demonlist</h1>
    </div>
    <div class="header-actions">
      <button class="btn btn-primary" @click="openCreate">Add level</button>
      <DataToolbar @export="onExport" @import="onImport" @reset="resetToSeed" />
    </div>
  </header>

  <p v-if="importError" class="import-error" role="alert">{{ importError }}</p>

  <FilterBar :filters="filters" />

  <LevelTable
    :levels="visibleLevels"
    :sort-key="sortKey"
    :sort-dir="sortDir"
    @sort="setSort"
    @edit="openEdit"
    @delete="deleteLevel"
    @reorder="reorderLevels"
  />

  <LevelFormModal v-if="showModal" :level="editingLevel" @save="onSave" @close="showModal = false" />
</template>

<style scoped>
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 1.5rem 1.5rem 1rem;
}

.eyebrow {
  margin: 0 0 0.2rem;
  font-size: 0.75rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--accent-cyan);
}

h1 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 2rem;
  letter-spacing: 0.02em;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.import-error {
  margin: 0 1.5rem 1rem;
  padding: 0.6rem 1rem;
  border: 1px solid var(--danger);
  border-radius: var(--radius);
  color: var(--danger);
  font-size: 0.85rem;
}
</style>
```

- [ ] **Step 2: Run the full test suite**

Run: `npm test`
Expected: PASS (28 tests)

- [ ] **Step 3: Manually verify in the browser**

Run: `npm run dev` and open the printed local URL.
Check:
- The table loads with 35 seeded levels, sorted by rank.
- Clicking a column header sorts by that column; clicking again reverses direction.
- Dragging a row (while sorted by rank) reorders it and updates rank numbers.
- Typing in the search box filters by name/creator; numeric/date range filters narrow the list.
- "Add level" opens the modal, saving with only a name filled in succeeds and appends a row.
- "Edit" on a row opens the modal pre-filled; saving updates that row in place.
- "Delete" prompts for confirmation before removing a row.
- "Export JSON" downloads a file containing the current dataset.
- "Import JSON" with a malformed file shows the error banner and leaves the table unchanged; with a well-formed file, replaces the table.
- "Reset to seed" prompts for confirmation, then restores the original 35 entries.
- Reloading the page preserves whatever edits were made (localStorage persistence).

- [ ] **Step 4: Update `README.md`**

```markdown
# extreme-completion-ranking

A personal Geometry Dash extreme-demon ranking tool: a dark-neon, sortable/filterable table of levels with AREDL/DL placement, attempts, verification date, and enjoyment. Client-only — data lives in `localStorage`, with JSON export/import for backup.

## Development

```bash
npm install
npm run dev      # start the dev server
npm test         # run the Vitest suite
npm run build    # type-check and build for production
```

See `docs/superpowers/specs/2026-07-30-demonlist-design.md` for the full design spec.
```

- [ ] **Step 5: Commit**

```bash
git add src/App.vue README.md
git commit -m "feat: wire up App.vue and finish the extreme demonlist app"
```

---

## Self-review notes

- **Spec coverage:** Architecture (composable + no backend) → Tasks 3–6. Data model → Task 2. Components (`App.vue`, `useLevels`, `LevelTable`, `LevelFormModal`, `FilterBar`, `DataToolbar`) → Tasks 12, 3–6, 8, 9, 10, 11 respectively. Data flow (mutate → debounced persist → recompute view; import validate+confirm; export serialize) → Tasks 3, 6, 11, 12. Seed data → Task 2. Error handling (import validation, delete/reset confirm, name-only-required form) → Tasks 6, 8, 9, 11. Styling (concrete dark-neon direction via `frontend-design`) → Visual direction section + Task 7. Testing (Vitest for `useLevels`: sort/filter/import validation/seed parsing) → Tasks 2, 4, 5, 6. Out-of-scope items are simply not built.
- **Placeholder scan:** no TBD/TODO markers; every code step has real code; styling is concrete tokens, not "add appropriate styling."
- **Type consistency:** `Level` (Task 2) is used identically across all composable/component signatures. `SortKey`/`SortDir`/`Filters`/`ImportResult` are defined once (Tasks 4–6) and imported by name in `LevelTable.vue`/`FilterBar.vue`. `useLevels()`'s returned function signatures (`addLevel`, `updateLevel`, `reorderLevels`, `exportJson`, `importJson`, `resetToSeed`) match what `App.vue` calls in Task 12.
