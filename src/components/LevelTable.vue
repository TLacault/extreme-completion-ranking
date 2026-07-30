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
        <td class="mono">{{ level.date ?? (level.dateNote || '—') }}</td>
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
