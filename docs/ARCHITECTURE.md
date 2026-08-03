# Architecture

Extreme Tracker is a client-only single-page app: a Vite + Vue 3 + TypeScript
build with no backend and no accounts. Everything a user enters lives in
their browser's `localStorage`; the only network calls are read-only fetches
against public third-party APIs (Geometry Dash ranking sites, optionally
YouTube) that enrich the UI with live data.

## Tech stack

- **[Vue 3](https://vuejs.org/)** (`<script setup>`) — components
- **TypeScript** — strict mode, end to end
- **[Vite](https://vitejs.dev/)** — dev server and build
- **[Vitest](https://vitest.dev/)** + `jsdom` — unit tests
- **[Lucide](https://lucide.dev/)** — icons
- **GitHub Actions → GitHub Pages** — CI and hosting

## Project structure

```
src/
├── main.ts                      # app entry point
├── App.vue                      # layout shell, wires useLevels to components
├── style.css                    # theme tokens (CSS custom properties) + base styles
├── types.ts                     # Level, LevelStatus
├── composables/
│   └── useLevels.ts             # single source of truth: state, CRUD, persistence
├── services/
│   ├── rankSync.ts              # AREDL / Pointercrate DL API clients + matching
│   ├── levelLookup.ts           # search/autocomplete index for the add-level form
│   ├── featuredCreator.ts       # YouTube Data API + AREDL leaderboard fetches
│   └── featuredCreatorConfig.ts # hardcoded identity/fallback values for the banner
├── components/
│   ├── LevelTable.vue           # sortable, filterable ranking table
│   ├── LevelFormModal.vue       # add/edit form with AREDL/DL autofill search
│   ├── FilterBar.vue            # search + range filters + column toggles
│   ├── DataToolbar.vue          # export/import/clear-data, rank-sync status
│   ├── DualRangeSlider.vue      # reusable min/max range input
│   ├── VideoPreviewModal.vue    # embedded YouTube player lightbox
│   └── FeaturedChannelsBanner.vue # YouTube/Twitch/GD/AREDL "featured creator" panel
└── utils/
    └── youtube.ts                # video-ID parsing from arbitrary YouTube URLs
```

Every non-trivial module has a co-located `*.spec.ts`.

## Data model

`src/types.ts`:

```ts
type LevelStatus = 'completed' | 'in_progress' | 'planned'

interface Level {
  id: string
  rank: number
  name: string
  status: LevelStatus
  aredlRank: number | null
  dlRank: number | null
  bestRunMin: number | null       // progress %, only meaningful when not completed
  bestRunMax: number | null
  attempts: number | null
  attemptsNote: string            // free text for imprecise/lost attempt counts
  date: string | null             // ISO date, when known precisely
  dateNote: string                // free text for imprecise dates
  enjoyment: number | null        // 0-10
  creator: string
  videoUrl: string
  levelId: string                 // in-game GD level ID, used to match against remote APIs
  notes: string
}
```

Only `id`, `rank`, `name`, and `status` are structurally required — every
other field is independently nullable/blank so partial or messy source data
never blocks entry. Numeric/date fields stay sortable and filterable; the
paired `*Note` fields preserve nuance ("lost, prolly 5k+") without forcing a
guess into the typed field.

## State management: `useLevels`

`src/composables/useLevels.ts` is the single source of truth for the whole
app. Each call creates independent reactive state (no module-level
singleton), which is what makes it safe to call repeatedly in tests. It
owns:

- **CRUD** — `addLevel`, `updateLevel`, `deleteLevel`.
- **Sort** — `sortKey`/`sortDir` + `setSort(key)` (click same key twice to
  flip direction); `null` values always sort last.
- **Filter** — a `reactive` `filters` object (search text, attempts/enjoyment
  ranges, date range, status checkboxes) that components bind to directly
  (e.g. `v-model="filters.search"`).
- **`visibleLevels`** — a `computed` combining filter + sort, consumed by
  `LevelTable`.
- **Column visibility** — a `reactive` `columnVisibility` map, persisted
  separately so a user's table layout survives reloads independent of their
  data.
- **Persistence** — a debounced (300 ms) `watch` writes `levels` to
  `localStorage`. Three independent keys are used so unrelated changes don't
  invalidate each other:
  - `ecr:levels:v1` — the level data itself
  - `ecr:lastSync:v1` — last successful rank-sync timestamp
  - `ecr:columns:v1` — column visibility preferences
- **Import/export** — `exportJson()` serializes current state;
  `importJson(text)` validates shape field-by-field before replacing data,
  leaving existing data untouched on any validation failure.
- **Rank sync** — `refreshRanks()` delegates to `services/rankSync.ts` and
  exposes `syncStatus` / `syncError` / `lastSyncedAt` for the UI.

## External integrations

All integrations are plain `fetch` calls to public, keyless, CORS-enabled
endpoints — there is no server-side proxy anywhere in this app.

### AREDL & Pointercrate DL (`services/rankSync.ts`)

- `GET https://api.aredl.net/v2/api/aredl/levels` — one JSON array of every
  ranked AREDL level (`level_id`, `position`, `name`, ...).
- `GET https://pointercrate.com/api/v2/demons/` — cursor-paginated
  (`?after=<id>&limit=100`), looped until a short page signals the end.

`matchRank()` resolves a local `Level` against a remote list by
`levelId` first, falling back to a case-insensitive exact name match — but
only when the name match is unambiguous (exactly one hit). A level not found
in a given list keeps its existing rank rather than being cleared, since
absence could just as easily mean a temporary API hiccup as a real removal.

`refreshRanks()` fetches both APIs in parallel with `Promise.allSettled` and
applies updates **only if both succeed** (all-or-nothing), so a partial
outage never leaves the data half-updated. `App.vue` triggers this
automatically on mount when `lastSyncedAt` is missing or more than 24 hours
old; `DataToolbar` also exposes a manual "Refresh ranks" button.

### Add-level autofill (`services/levelLookup.ts`)

Builds an in-memory search index by merging the same AREDL/DL raw responses
`rankSync.ts` fetches (cached per session, deduplicated by `level_id`).
`LevelFormModal` uses `searchLevels(query)` to power live suggestions as the
user types a level name, and `fetchAredlEnrichment(levelId)` to pull a
verification video URL and creator name for the level they picked — so
adding a level only ever requires typing its name.

### Featured-creator banner (`services/featuredCreator.ts`)

Optional YouTube Data API v3 integration (`VITE_YOUTUBE_API_KEY`) that pulls
a channel's latest upload, subscriber count, and avatar for the banner at
the top of the app. If the key is unset or any call fails, the banner falls
back to static values in `featuredCreatorConfig.ts` rather than showing
broken or empty content. The banner's AREDL leaderboard stats
(`fetchAredlStats`) use the same public AREDL API as rank sync, no key
required.

## Styling

A single dark-neon theme is defined as CSS custom properties in
`src/style.css` (`--bg`, `--surface`, `--accent-magenta`, `--accent-violet`,
`--accent-cyan`, `--accent-lime`, `--danger`, plus `--glow-*` RGB triples for
`rgba(var(--glow-x), alpha)` glow effects). Components use scoped `<style>`
blocks and reference these tokens rather than hardcoding colors, so the
palette can be re-themed from one file. `prefers-reduced-motion` disables
decorative animations (pulsing heat glow, rotating gradient borders).

## Testing

Vitest + `jsdom`, run via `npm test`. Tests are co-located with the code
they cover (`useLevels.spec.ts`, `rankSync.spec.ts`, `featuredCreator.spec.ts`,
`youtube.spec.ts`) and focus on logic — state transitions, API
matching/validation, URL parsing — rather than component rendering, which is
verified manually against the dev server.

## Build & deploy

`npm run build` runs `vue-tsc -b` (type-check) then `vite build`. Every push
to `main` runs `.github/workflows/deploy.yml`: install → type-check →
`vitest run` → build → deploy the `dist/` output to GitHub Pages. The Vite
`base` is pinned to `/extreme-tracker/` to match the Pages project path.
`VITE_YOUTUBE_API_KEY` is injected from a repository secret at build time
only if configured; it is entirely optional (see [Environment
variables](#environment-variables)).

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `VITE_YOUTUBE_API_KEY` | No | Enables live YouTube stats/latest-video in the featured-creator banner. Without it, the banner shows the static fallback in `featuredCreatorConfig.ts`. |

See `.env.example` for local setup.
