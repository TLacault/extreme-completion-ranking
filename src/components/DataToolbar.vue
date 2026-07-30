<script setup lang="ts">
import { computed, ref } from 'vue'
import type { SyncStatus } from '../composables/useLevels'

const props = defineProps<{
  lastSyncedAt: string | null
  syncStatus: SyncStatus
  syncError: string | null
}>()

const emit = defineEmits<{
  export: []
  import: [text: string]
  reset: []
  refreshRanks: []
}>()

const syncLabel = computed(() => {
  if (props.syncStatus === 'syncing') return 'Syncing…'
  if (props.syncStatus === 'error') return `Sync failed — will retry next visit`
  if (!props.lastSyncedAt) return 'Never synced'
  return `Synced ${relativeTime(props.lastSyncedAt)}`
})

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.round(diffMs / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return `${days}d ago`
}

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
    <div class="sync">
      <button class="btn" :disabled="syncStatus === 'syncing'" @click="emit('refreshRanks')">Refresh ranks</button>
      <span class="sync-label mono" :class="{ error: syncStatus === 'error' }">{{ syncLabel }}</span>
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.hidden-input {
  display: none;
}

.sync {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sync-label {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.sync-label.error {
  color: var(--danger);
}

.mono {
  font-family: var(--font-mono);
}
</style>
