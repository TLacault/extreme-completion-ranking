<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Plus, Skull } from '@lucide/vue'
import { useLevels } from './composables/useLevels'
import type { Level } from './types'
import LevelList from './components/LevelList.vue'
import LevelFormModal from './components/LevelFormModal.vue'
import FilterBar from './components/FilterBar.vue'
import DataToolbar from './components/DataToolbar.vue'
import VideoPreviewModal from './components/VideoPreviewModal.vue'
import FeaturedChannelsBanner from './components/FeaturedChannelsBanner.vue'

const {
  addLevel,
  updateLevel,
  deleteLevel,
  sortKey,
  sortDir,
  setSort,
  filters,
  visibleLevels,
  columnVisibility,
  exportJson,
  importJson,
  clearAllData,
  lastSyncedAt,
  syncStatus,
  syncError,
  refreshRanks,
} = useLevels()

const editingLevel = ref<Level | null>(null)
const showModal = ref(false)
const importError = ref<string | null>(null)
const playingVideoId = ref<string | null>(null)

const ONE_DAY_MS = 24 * 60 * 60 * 1000

onMounted(() => {
  const isStale = !lastSyncedAt.value || Date.now() - new Date(lastSyncedAt.value).getTime() > ONE_DAY_MS
  if (isStale) refreshRanks()
})

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
  a.download = 'extreme-tracker.json'
  a.click()
  URL.revokeObjectURL(url)
}

function onImport(text: string): void {
  const result = importJson(text)
  importError.value = result.ok ? null : result.error ?? 'Import failed.'
}
</script>

<template>
  <div class="page">
    <header class="app-header glass-panel">
      <div>
        <p class="eyebrow">Personal completion log</p>
        <h1><Skull class="title-icon" :size="26" /><span class="title-text">Extreme Tracker</span></h1>
      </div>
      <div class="header-actions">
        <button class="btn btn-primary" @click="openCreate">
          <Plus :size="15" />
          Add level
        </button>
        <DataToolbar
          :last-synced-at="lastSyncedAt"
          :sync-status="syncStatus"
          :sync-error="syncError"
          @export="onExport"
          @import="onImport"
          @clear-all="clearAllData"
          @refresh-ranks="refreshRanks"
        />
      </div>
    </header>

    <FeaturedChannelsBanner @play-video="playingVideoId = $event" />

    <p v-if="importError" class="import-error glass-panel" role="alert">{{ importError }}</p>

    <FilterBar :filters="filters" :column-visibility="columnVisibility" />

    <LevelList
      :levels="visibleLevels"
      :sort-key="sortKey"
      :sort-dir="sortDir"
      :column-visibility="columnVisibility"
      @sort="setSort"
      @edit="openEdit"
      @delete="deleteLevel"
      @play-video="playingVideoId = $event"
    />

    <LevelFormModal v-if="showModal" :level="editingLevel" @save="onSave" @close="showModal = false" />
    <VideoPreviewModal v-if="playingVideoId" :video-id="playingVideoId" @close="playingVideoId = null" />

    <footer class="app-footer">
      Made with 💀 by <a href="https://github.com/TLacault" target="_blank" rel="noopener">Tim Lacault</a>
    </footer>
  </div>
</template>

<style scoped>
.page {
  min-height: 100dvh;
  max-width: 1400px;
  margin: 0 auto;
  padding: clamp(1rem, 3vw, 2.5rem);
  /* Keep content clear of the notch, rounded corners and home indicator. */
  padding-left: max(clamp(1rem, 3vw, 2.5rem), env(safe-area-inset-left));
  padding-right: max(clamp(1rem, 3vw, 2.5rem), env(safe-area-inset-right));
  padding-bottom: max(clamp(1rem, 3vw, 2.5rem), env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.app-header {
  position: relative;
  z-index: 30;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1.5rem 1.75rem;
}

.eyebrow {
  margin: 0 0 0.3rem;
  font-size: 0.75rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--accent-cyan);
  text-shadow: 0 0 12px rgba(var(--glow-cyan), 0.5);
}

h1 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-family: var(--font-display);
  font-size: clamp(1.35rem, 6vw, 2rem);
  line-height: 1.15;
  letter-spacing: 0.02em;
}

.title-icon {
  color: var(--accent-magenta);
  filter: drop-shadow(0 0 10px rgba(var(--glow-magenta), 0.6));
  flex-shrink: 0;
}

.title-text {
  background: linear-gradient(120deg, #ffffff, var(--accent-magenta) 60%, var(--accent-violet));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 0 18px rgba(var(--glow-magenta), 0.25));
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.import-error {
  margin: 0;
  padding: 0.8rem 1.2rem;
  border-color: rgba(var(--glow-danger), 0.5);
  box-shadow: 0 0 20px rgba(var(--glow-danger), 0.2);
  color: #ffb3ba;
  font-size: 0.85rem;
}

.app-footer {
  margin: 0.5rem 0 0;
  padding-top: 1.25rem;
  border-top: 1px solid var(--border);
  text-align: center;
  font-size: 0.78rem;
  color: var(--text-muted);
}

.app-footer a {
  color: var(--text-muted);
  text-decoration: none;
  transition: color 200ms var(--ease);
}

.app-footer a:hover {
  color: var(--accent-cyan);
}

/* Phone portrait: header stacks and the actions become a full-width row. */
@media (max-width: 699.98px) {
  .page {
    gap: 0.85rem;
  }

  .app-header {
    align-items: stretch;
    flex-direction: column;
    gap: 0.9rem;
    padding: 1.1rem 1.1rem 1.2rem;
  }

  .header-actions {
    gap: 0.6rem;
  }

  .header-actions > * {
    flex: 1;
  }

  /* DataToolbar renders a wrapper div, so the button inside needs stretching too. */
  .header-actions :deep(.options-wrapper) > .btn {
    width: 100%;
    justify-content: center;
  }

  .header-actions > .btn {
    justify-content: center;
  }
}

/* Landscape phone: trim vertical chrome so the list gets the space. */
@media (orientation: landscape) and (max-height: 500px) {
  .page {
    padding-top: 0.6rem;
    gap: 0.7rem;
  }

  .app-header {
    padding: 0.7rem 1rem;
    align-items: center;
  }

  .eyebrow {
    display: none;
  }

  .app-footer {
    margin-top: 0.25rem;
    padding-top: 0.7rem;
  }
}
</style>
