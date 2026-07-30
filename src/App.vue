<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useLevels } from './composables/useLevels'
import type { Level } from './types'
import LevelTable from './components/LevelTable.vue'
import LevelFormModal from './components/LevelFormModal.vue'
import FilterBar from './components/FilterBar.vue'
import DataToolbar from './components/DataToolbar.vue'
import VideoPreviewModal from './components/VideoPreviewModal.vue'

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
      <DataToolbar
        :last-synced-at="lastSyncedAt"
        :sync-status="syncStatus"
        :sync-error="syncError"
        @export="onExport"
        @import="onImport"
        @reset="resetToSeed"
        @refresh-ranks="refreshRanks"
      />
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
    @play-video="playingVideoId = $event"
  />

  <LevelFormModal v-if="showModal" :level="editingLevel" @save="onSave" @close="showModal = false" />
  <VideoPreviewModal v-if="playingVideoId" :video-id="playingVideoId" @close="playingVideoId = null" />
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
