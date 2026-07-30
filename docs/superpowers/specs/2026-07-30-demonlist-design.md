# Extreme Demonlist Ranking App — Design

## Purpose
A personal Geometry Dash extreme-demon ranking tool: a styled, sortable/filterable table of levels with all the metadata the user tracks by hand today (AREDL/DL placement, attempts, verification date, enjoyment). V1 is client-only — no backend, no accounts. Data is entered/edited directly in the browser and persisted locally, with JSON export/import for backup and portability.

## Scope
- Standalone project in this repo (`extreme-completion-ranking`), unrelated to any other project.
- No API, no auth, no server. Everything runs in the browser.
- Single user, single dataset at a time (no multi-list support in v1).

## Architecture
Vite + Vue 3 SPA. No backend. Data lives in `localStorage`; a `useLevels` composable is the single source of truth for state, persistence, and import/export.

## Data model
```ts
interface Level {
  id: string
  rank: number             // manual, drag-reorderable — the "true" demonlist position, default sort key
  name: string
  aredlRank: number | null
  dlRank: number | null
  attempts: number | null
  attemptsNote: string     // free text for caveats, e.g. "lost, prolly 5k+", "10k old + buffdate"
  date: string | null      // ISO date (YYYY-MM-DD), when known precisely
  dateNote: string         // free text for imprecise dates, e.g. "il y a 2 ans"
  enjoyment: number | null // 0-10
  creator: string
  videoUrl: string
  levelId: string
  notes: string
}
```
Only `id`, `rank`, and `name` are required. Every other field can be blank. Numeric fields (`attempts`, `date`) stay sortable/filterable; the paired `*Note` fields preserve nuance from messy source data without blocking sorting.

## Components
- `App.vue` — layout shell: header, filter bar, table, "add level" button.
- `composables/useLevels.ts` — CRUD, sort state, filter state, `localStorage` persistence (auto-save, debounced), JSON export/import, seed-loading on first run (only seeds if storage is empty).
- `components/LevelTable.vue` — sortable columns (rank, AREDL rank, DL rank, attempts, date, enjoyment, name); drag handle per row to reorder `rank`.
- `components/LevelFormModal.vue` — add/edit form covering all fields; shared by create and edit flows.
- `components/FilterBar.vue` — text search (name + creator) plus numeric range filters (attempts, enjoyment, rank) and a date range filter.
- `components/DataToolbar.vue` — Export JSON (file download), Import JSON (file upload with validation + confirm-replace), Reset-to-seed (confirm).

## Data flow
User action → `useLevels` mutates reactive state → auto-persist to `localStorage` (debounced) → table re-renders from a computed sorted+filtered view. Import replaces the full dataset after shape validation and a confirm dialog (destructive, since it overwrites current data). Export serializes current state to a downloadable `.json` file matching the `Level[]` schema above.

## Seed data
The user's pasted 35-entry extreme demonlist, parsed into the schema above, ships as the default dataset (loaded only when `localStorage` is empty on first run). Ambiguous source values (e.g. "lost atts ~5-10k", "y'a 2 an") are preserved verbatim in `attemptsNote`/`dateNote` rather than guessed into numbers/dates.

## Error handling
- **Import**: validate the uploaded JSON is an array of well-formed `Level`-shaped objects before applying; on failure, show a visible error and do not touch existing data; on success, confirm before overwriting.
- **Delete entry / Reset to seed**: confirm dialog before destructive action.
- **Form**: only `name` is required; no other validation blocks saving, since most fields are legitimately unknown/optional.

## Styling
Dark neon theme: near-black background, glowing cyan/magenta/purple accents on headers, hover states, and buttons; a display font suited to rank numbers; subtle glow/border treatment on the table. Concrete direction (palette, type, spacing) to be finalized during implementation using the `frontend-design` skill so it doesn't read as generic dark-mode Bootstrap.

## Testing
Vitest unit tests for `useLevels`: sort/filter logic, import validation (accepts well-formed data, rejects malformed), and seed-data parsing. No UI/e2e testing planned for v1.

## Out of scope (v1)
- Backend API, accounts, multi-user sync.
- Multiple simultaneous lists/profiles.
- Level thumbnails/media beyond a video URL link.
