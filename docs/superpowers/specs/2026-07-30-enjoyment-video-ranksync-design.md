# Enjoyment Slider, Video Preview, and AREDL/DL Rank Sync — Design

## Purpose
Three independent enhancements to the existing Extreme Demonlist app (see `2026-07-30-demonlist-design.md`):

1. Replace the enjoyment number input with a slider.
2. Show a clickable YouTube thumbnail/preview when a level has a video URL.
3. Auto-fetch each level's current rank from the public AREDL and DL (pointercrate.com) APIs.

None of these change the app's client-only architecture (Vite + Vue 3 SPA, `localStorage` persistence, no backend). All three ship together since they touch overlapping files (`LevelFormModal.vue`, `LevelTable.vue`), but each is independently testable and could be implemented/reverted on its own.

## 1. Enjoyment slider

**Files:** `src/components/LevelFormModal.vue` (modify), `src/style.css` (modify, for slider track styling).

Replace the enjoyment `<input type="number">` with `<input type="range" min="0" max="10" step="1">`. Styling: a recessed/inset groove track (subtle inner box-shadow) sunk into the surrounding surface color, with a glowing `--accent-lime` thumb (same color already used for the enjoyment pips in `LevelTable`), implemented via `appearance: none` plus `::-webkit-slider-runnable-track` / `::-moz-range-track` / `::-webkit-slider-thumb` / `::-moz-range-thumb` rules in `src/style.css` as a reusable `.slider` class.

The current numeric value renders as text beside the slider. Because `enjoyment: number | null` must still support "unrated," a "Clear" text-button next to the slider sets it back to `null`. If the field is `null` when the user first interacts with the slider, it initializes to `5` (a neutral starting point) rather than `0`. No changes to `Level`, `useLevels`, or `LevelTable` (the pip display already handles `null` correctly).

**Testing:** no new automated tests — this is a presentational form change with no new logic in `useLevels`, consistent with the existing testing scope (spec: Testing). Verified manually via the dev server.

## 2. YouTube video preview

**Files:**
- Create: `src/utils/youtube.ts` — `getYoutubeVideoId(url: string): string | null`.
- Create: `src/utils/youtube.spec.ts` — unit tests for URL parsing.
- Create: `src/components/VideoPreviewModal.vue` — lightbox with embedded player.
- Modify: `src/components/LevelTable.vue` — new "Video" column.

**Parsing:** `getYoutubeVideoId` recognizes `youtube.com/watch?v=<id>`, `youtu.be/<id>`, and `youtube.com/embed/<id>` (with any extra query params ignored), returning the 11-character video ID or `null` if the URL doesn't match any of these shapes. No API key or network call is needed for parsing or thumbnails — YouTube's thumbnail images are served from a public, keyless URL pattern.

**Table column:** a new non-sortable "Video" column in `LevelTable`. For each row:
- If `videoUrl` is blank: empty cell.
- If `videoUrl` parses to a video ID: render `<img src="https://img.youtube.com/vi/<id>/mqdefault.jpg">` with a play-icon overlay (CSS, no extra asset). Clicking it emits an event the parent (`App.vue`) uses to open `VideoPreviewModal` with that video ID.
- If `videoUrl` is set but doesn't parse (non-YouTube link): render a plain "↗" external-link icon that opens `videoUrl` in a new tab (`target="_blank" rel="noopener"`) instead of the modal.

**`VideoPreviewModal.vue`:** props `videoId: string`; renders a backdrop + centered `<iframe>` pointed at `https://www.youtube.com/embed/<id>?autoplay=1`; closes on X-button click, backdrop click, or Escape key. Emits `close`.

**Testing:** Vitest unit tests for `getYoutubeVideoId` covering all three recognized URL shapes, URLs with extra query params, and unrecognized/non-YouTube URLs (expect `null`). No component tests for the modal/table column, consistent with existing scope (presentational, verified manually).

## 3. AREDL & DL rank auto-sync

**Files:**
- Create: `src/services/rankSync.ts` — API clients + matching/patch logic.
- Create: `src/services/rankSync.spec.ts` — unit tests with mocked `fetch`.
- Modify: `src/composables/useLevels.ts` — expose sync state and `refreshRanks()`.
- Modify: `src/components/DataToolbar.vue` — "Refresh Ranks" button + status text.
- Modify: `src/App.vue` — trigger auto-sync on mount.
- Modify: `src/data/seedLevels.ts` — backfill `levelId` from a one-time name match against live data (see below).

**Verified live endpoints** (both public, keyless, CORS-enabled for browser `fetch`):
- AREDL: `GET https://api.aredl.net/v2/api/aredl/levels` — single JSON array; each item includes `level_id` (number, in-game GD level ID), `position` (number, current rank), `name` (string).
- DL: `GET https://pointercrate.com/api/v2/demons/` — cursor-paginated via `?after=<id>&limit=100`, `Link` response header gives `rel=next`; same field shape (`level_id`, `position`, `name`). `access-control-allow-origin: *`.

```ts
interface RemoteLevel {
  levelId: number
  position: number
  name: string
}

function fetchAredlLevels(): Promise<RemoteLevel[]>   // single GET
function fetchDlLevels(): Promise<RemoteLevel[]>       // loops pages via `after` cursor until exhausted
```

**Matching rule:** for each local `Level`, look it up in a given remote list by:
1. `levelId` (parsed as a number) if `level.levelId` is non-blank and a remote entry has that exact `level_id`.
2. Otherwise, case-insensitive exact name match — but only applied if exactly one remote entry matches that name. Zero or multiple matches count as "not found."

If a level is "not found" in a given list, that list's rank field (`aredlRank` or `dlRank`) is left untouched — never cleared to `null` (per design decision: absence from a fetch isn't treated as authoritative removal, since it could also mean a temporary API hiccup or a mismatched name).

**`refreshRanks()`:** fetches both lists in parallel (`Promise.allSettled`, so a rejected promise from one doesn't throw before the other resolves). Matches and `updateLevel` calls are applied only if **both** fetches succeed; if either fails, no level data changes and `lastSyncedAt` is not updated (all-or-nothing, matching the Error handling section below). Returns a result summary (`{ aredlOk, dlOk, matchedCount, error? }`) for the UI to display.

**Composable additions to `useLevels`:**
```ts
lastSyncedAt: Ref<string | null>        // ISO timestamp, persisted separately
syncStatus: Ref<'idle' | 'syncing' | 'error'>
syncError: Ref<string | null>
refreshRanks(): Promise<void>
```
`lastSyncedAt` persists to its own `localStorage` key (`ecr:lastSync:v1`), separate from `ecr:levels:v1`, so a rank sync doesn't need to touch the debounced levels-persistence watcher.

**Auto-trigger:** in `App.vue`'s `onMounted`, call `refreshRanks()` automatically only if `lastSyncedAt` is `null` or more than 24 hours old. This keeps casual repeated visits within a day from re-fetching, while a manual "Refresh Ranks" button in `DataToolbar` (showing "Synced Xh ago" / "Syncing…" / "Sync failed — will retry next visit") allows fetching anytime on demand.

**Error handling:** network failure or non-2xx response on either endpoint is caught, reflected in `syncStatus`/`syncError`, and does not modify `levels` or `lastSyncedAt` — so both the next auto-check and a manual retry will try again.

**Seed data backfill:** using the live API data fetched during design, 33 of the 35 seed levels matched an AREDL entry by name (all except `8ox` and `Azurite`, which aren't currently found on AREDL by that name — possibly renamed or removed since the list positions in the seed data were recorded). `levelId` will be backfilled for those 33 entries in `src/data/seedLevels.ts`; `8ox` and `Azurite` keep `levelId: ''` for the user to fill in manually later via the edit form.

**Testing:** Vitest unit tests for `rankSync.ts` with `fetch` mocked (`vi.stubGlobal('fetch', ...)`):
- Matches by `levelId` when present.
- Falls back to name match when `levelId` is blank.
- Skips (leaves untouched) when a name match is ambiguous (2+ hits) or absent.
- Leaves `aredlRank`/`dlRank` untouched when a level isn't found in that list.
- On fetch failure for one or both lists, `levels` and `lastSyncedAt` are unchanged and `syncStatus` becomes `'error'`.
- On success, `lastSyncedAt` updates and matched levels' rank fields update.

## Out of scope
- Editing `aredlRank`/`dlRank` is still possible manually via the form (sync only overwrites on a successful match; manual edits persist until the next successful sync for that level).
- No UI to review "not found" levels beyond the sync result summary text; no batch levelId-entry helper.
- No backend/proxy — all API calls happen directly from the browser using the verified CORS-enabled endpoints above.
