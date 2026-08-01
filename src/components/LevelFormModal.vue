<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { CircleCheck, Hourglass, ListTodo, LoaderCircle, Pencil, Plus, Search, X, type LucideIcon } from '@lucide/vue'
import type { Level, LevelStatus } from '../types'
import { fetchAredlEnrichment, searchLevels, type LookupEntry } from '../services/levelLookup'
import DualRangeSlider from './DualRangeSlider.vue'

const props = defineProps<{
  level: Level | null
  defaultStatus?: LevelStatus
}>()

const emit = defineEmits<{
  save: [payload: Omit<Level, 'id' | 'rank'>]
  close: []
}>()

const STATUS_OPTIONS: { value: LevelStatus; label: string; icon: LucideIcon }[] = [
  { value: 'completed', label: 'Completed', icon: CircleCheck },
  { value: 'in_progress', label: 'Currently completing', icon: Hourglass },
  { value: 'planned', label: 'Plan on completing', icon: ListTodo },
]

function blankForm(): Omit<Level, 'id' | 'rank'> {
  const status = props.defaultStatus ?? 'completed'
  return {
    name: '',
    status,
    aredlRank: null,
    dlRank: null,
    bestRunMin: status === 'completed' ? 0 : null,
    bestRunMax: status === 'completed' ? 100 : null,
    attempts: null,
    attemptsNote: '',
    date: new Date().toISOString().slice(0, 10),
    dateNote: '',
    enjoyment: null,
    creator: '',
    videoUrl: '',
    levelId: '',
    notes: '',
  }
}

const form = reactive(props.level ? { ...props.level, status: props.level.status ?? 'completed' } : blankForm())
const titleIcon = computed(() => (props.level ? Pencil : Plus))

watch(
  () => props.level,
  (level) => {
    Object.assign(form, level ? { ...level, status: level.status ?? 'completed' } : blankForm())
  },
)

function toNullableNumber(value: string): number | null {
  return value === '' ? null : Number(value)
}

function onStatusChange(status: LevelStatus): void {
  const wasCompleted = form.status === 'completed'
  form.status = status
  if (status === 'completed') {
    form.bestRunMin = 0
    form.bestRunMax = 100
  } else if (wasCompleted) {
    form.bestRunMin = null
    form.bestRunMax = null
  }
}

function onSubmit(): void {
  if (!form.name.trim()) return
  const { id: _id, rank: _rank, ...payload } = form as Level
  emit('save', payload)
}

function onOverlayClick(): void {
  if (form.name.trim()) {
    onSubmit()
  } else {
    emit('close')
  }
}

const suggestions = ref<LookupEntry[]>([])
const showSuggestions = ref(false)
const searchLoading = ref(false)
const enriching = ref(false)
const highlightedIndex = ref(-1)
let debounceTimer: ReturnType<typeof setTimeout> | undefined
let searchToken = 0

function scheduleSearch(): void {
  showSuggestions.value = true
  highlightedIndex.value = -1
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(runSearch, 200)
}

async function runSearch(): Promise<void> {
  const query = form.name
  if (!query.trim()) {
    suggestions.value = []
    return
  }
  const token = ++searchToken
  searchLoading.value = true
  const results = await searchLevels(query)
  if (token === searchToken) {
    suggestions.value = results
    searchLoading.value = false
  }
}

async function selectSuggestion(entry: LookupEntry): Promise<void> {
  form.name = entry.name
  form.levelId = String(entry.levelId)
  if (entry.aredlPosition !== null) form.aredlRank = entry.aredlPosition
  if (entry.dlPosition !== null) form.dlRank = entry.dlPosition
  if (entry.creator) form.creator = entry.creator
  if (entry.videoUrl) form.videoUrl = entry.videoUrl
  showSuggestions.value = false
  suggestions.value = []

  if (!entry.creator || !entry.videoUrl) {
    enriching.value = true
    const enrichment = await fetchAredlEnrichment(entry.levelId)
    if (!form.creator && enrichment.creator) form.creator = enrichment.creator
    if (!form.videoUrl && enrichment.videoUrl) form.videoUrl = enrichment.videoUrl
    enriching.value = false
  }
}

function onNameFocus(): void {
  if (suggestions.value.length) showSuggestions.value = true
}

function onNameBlur(): void {
  setTimeout(() => {
    showSuggestions.value = false
  }, 150)
}

function moveHighlight(delta: number): void {
  if (!suggestions.value.length) return
  const max = suggestions.value.length - 1
  highlightedIndex.value = Math.min(max, Math.max(0, highlightedIndex.value + delta))
}

function confirmHighlighted(): void {
  const entry = suggestions.value[highlightedIndex.value]
  if (entry) selectSuggestion(entry)
}
</script>

<template>
  <div class="overlay" @click.self="onOverlayClick">
    <div class="modal glass-panel glass-strong">
      <h2>
        <component :is="titleIcon" class="title-icon" :size="20" />
        {{ level ? 'Edit level' : 'Add level' }}
      </h2>
      <form @submit.prevent="onSubmit">
        <label class="name-field">
          Name *
          <div class="input-with-icon">
            <Search class="field-icon" :size="16" />
            <input
              v-model="form.name"
              type="text"
              required
              autocomplete="off"
              @input="scheduleSearch"
              @focus="onNameFocus"
              @blur="onNameBlur"
              @keydown.down.prevent="moveHighlight(1)"
              @keydown.up.prevent="moveHighlight(-1)"
              @keydown.enter="confirmHighlighted"
              @keydown.esc="showSuggestions = false"
            />
            <LoaderCircle v-if="searchLoading || enriching" class="field-spinner spin" :size="15" />
          </div>
          <ul v-if="showSuggestions && suggestions.length" class="suggestions glass-panel glass-strong">
            <li
              v-for="(entry, i) in suggestions"
              :key="entry.levelId"
              :class="{ active: i === highlightedIndex }"
              @mousedown.prevent="selectSuggestion(entry)"
            >
              <span class="suggestion-name">{{ entry.name }}</span>
              <span class="suggestion-meta">
                <span v-if="entry.aredlPosition !== null" class="badge badge-aredl">AREDL #{{ entry.aredlPosition }}</span>
                <span v-if="entry.dlPosition !== null" class="badge badge-dl">DL #{{ entry.dlPosition }}</span>
              </span>
            </li>
          </ul>
        </label>
        <label>
          Status
          <div class="status-row">
            <button
              v-for="option in STATUS_OPTIONS"
              :key="option.value"
              type="button"
              :class="['status-btn', `status-btn-${option.value}`, { active: form.status === option.value }]"
              @click="onStatusChange(option.value)"
            >
              <component :is="option.icon" :size="14" />
              {{ option.label }}
            </button>
          </div>
        </label>
        <label v-if="form.status !== 'completed'">
          Best run (%)
          <DualRangeSlider v-model:min-value="form.bestRunMin" v-model:max-value="form.bestRunMax" />
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
          <div class="slider-row">
            <input
              class="slider"
              :value="form.enjoyment ?? 5"
              @input="form.enjoyment = Number(($event.target as HTMLInputElement).value)"
              type="range"
              min="0"
              max="10"
              step="1"
            />
            <span class="slider-value mono">{{ form.enjoyment ?? '—' }}</span>
            <button type="button" class="btn btn-clear" @click="form.enjoyment = null">Clear</button>
          </div>
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
          <button type="button" class="btn" @click="emit('close')">
            <X :size="15" />
            Cancel
          </button>
          <button type="submit" class="btn btn-primary">
            <component :is="titleIcon" :size="15" />
            Save
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(6, 4, 15, 0.6);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 40;
  animation: fade-in 200ms var(--ease);
}

.modal {
  padding: 1.75rem;
  width: min(520px, 90vw);
  max-height: 85vh;
  overflow-y: auto;
  box-shadow:
    0 20px 60px -12px rgba(0, 0, 0, 0.6),
    0 0 40px rgba(var(--glow-violet), 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  animation: modal-in 260ms var(--ease);
}

.modal::-webkit-scrollbar {
  width: 8px;
}

.modal::-webkit-scrollbar-track {
  background: transparent;
  margin: 10% 0;
}

.modal::-webkit-scrollbar-thumb {
  background: rgba(var(--glow-violet), 0.5);
  border-radius: 999px;
}

.modal::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--glow-magenta), 0.55);
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
}

@keyframes modal-in {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.98);
  }
}

.modal h2 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-display);
  margin-top: 0;
  background: linear-gradient(120deg, #ffffff, var(--accent-cyan));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.title-icon {
  color: var(--accent-cyan);
  filter: drop-shadow(0 0 8px rgba(var(--glow-cyan), 0.6));
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
  position: relative;
}

input,
textarea {
  padding: 0.4rem 0.6rem;
  font-size: 0.9rem;
  color: var(--text);
}

textarea {
  resize: vertical;
}

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.8rem;
}

.status-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.status-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.8rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border);
  border-radius: 999px;
  color: var(--text-muted);
  font-size: 0.78rem;
  transition: border-color 200ms var(--ease), color 200ms var(--ease), background 200ms var(--ease), box-shadow 200ms var(--ease);
}

.status-btn:hover {
  border-color: var(--border-strong);
  color: var(--text);
}

.status-btn.active {
  font-weight: 600;
}

.status-btn-completed.active {
  color: #34d399;
  background: rgba(52, 211, 153, 0.14);
  border-color: rgba(52, 211, 153, 0.4);
  box-shadow: 0 0 10px rgba(52, 211, 153, 0.3);
}

.status-btn-in_progress.active {
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.14);
  border-color: rgba(251, 191, 36, 0.4);
  box-shadow: 0 0 10px rgba(251, 191, 36, 0.3);
}

.status-btn-planned.active {
  color: #c4b5fd;
  background: rgba(196, 181, 253, 0.12);
  border-color: rgba(196, 181, 253, 0.4);
  box-shadow: 0 0 10px rgba(196, 181, 253, 0.25);
}

.name-field {
  z-index: 2;
}

.input-with-icon {
  position: relative;
  display: flex;
  align-items: center;
}

.input-with-icon input {
  width: 100%;
  padding-left: 2.1rem;
  padding-right: 2.1rem;
}

.field-icon {
  position: absolute;
  left: 0.65rem;
  color: var(--text-muted);
  pointer-events: none;
}

.field-spinner {
  position: absolute;
  right: 0.65rem;
  color: var(--accent-cyan);
}

.spin {
  animation: spin 900ms linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.suggestions {
  position: absolute;
  top: calc(100% + 0.35rem);
  left: 0;
  right: 0;
  max-height: 240px;
  overflow-y: auto;
  padding: 0.4rem;
  margin: 0;
  list-style: none;
  z-index: 5;
  background: linear-gradient(155deg, rgba(28, 18, 44, 0.92), rgba(20, 13, 32, 0.88));
  border: 1px solid var(--border-strong);
  box-shadow: 0 12px 32px -8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.04) inset;
  backdrop-filter: blur(28px) saturate(180%);
  -webkit-backdrop-filter: blur(28px) saturate(180%);
}

.suggestions li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  padding: 0.5rem 0.6rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 150ms var(--ease);
}

.suggestions li:hover,
.suggestions li.active {
  background: rgba(var(--glow-cyan), 0.12);
}

.suggestion-name {
  color: var(--text);
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.suggestion-meta {
  display: flex;
  gap: 0.3rem;
  flex-shrink: 0;
}

.badge {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  padding: 0.15rem 0.4rem;
  border-radius: 999px;
  border: 1px solid var(--border);
  white-space: nowrap;
}

.badge-aredl {
  color: var(--accent-magenta);
  border-color: rgba(var(--glow-magenta), 0.4);
}

.badge-dl {
  color: var(--accent-cyan);
  border-color: rgba(var(--glow-cyan), 0.4);
}

.slider-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.slider-row .slider {
  flex: 1;
}

.slider-value {
  min-width: 1.4rem;
  text-align: right;
  color: var(--text);
  font-family: var(--font-mono);
}

.btn-clear {
  padding: 0.25rem 0.6rem;
  font-size: 0.75rem;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  margin-top: 0.5rem;
}
</style>
