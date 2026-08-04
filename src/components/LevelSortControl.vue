<script setup lang="ts">
import { ArrowDownNarrowWide, ArrowUpNarrowWide, ArrowUpDown } from "@lucide/vue";
import type { SortKey, SortDir } from "../composables/useLevels";

defineProps<{
  sortKey: SortKey;
  sortDir: SortDir;
}>();

const emit = defineEmits<{
  sort: [key: SortKey];
}>();

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "aredlRank", label: "AREDL rank" },
  { key: "dlRank", label: "DL rank" },
  { key: "name", label: "Name" },
  { key: "attempts", label: "Attempts" },
  { key: "date", label: "Date" },
  { key: "enjoyment", label: "Enjoyment" },
];

/**
 * setSort() toggles direction when the key is unchanged, so re-emitting the
 * current key is exactly how the direction button flips it.
 */
function onSelect(event: Event): void {
  emit("sort", (event.target as HTMLSelectElement).value as SortKey);
}
</script>

<template>
  <div class="sort-control glass-panel">
    <label class="sort-label">
      <ArrowUpDown :size="14" />
      <span class="sr-only">Sort by</span>
      <select :value="sortKey" @change="onSelect" aria-label="Sort by">
        <option v-for="option in SORT_OPTIONS" :key="option.key" :value="option.key">
          {{ option.label }}
        </option>
      </select>
    </label>
    <button
      class="dir-btn"
      @click="emit('sort', sortKey)"
      :aria-label="sortDir === 'asc' ? 'Sort ascending, tap to reverse' : 'Sort descending, tap to reverse'"
    >
      <component :is="sortDir === 'asc' ? ArrowUpNarrowWide : ArrowDownNarrowWide" :size="16" />
    </button>
  </div>
</template>

<style scoped>
.sort-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.6rem 0.45rem 0.8rem;
  border-radius: var(--radius);
}

.sort-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
  color: var(--text-muted);
}

.sort-label select {
  flex: 1;
  min-width: 0;
  min-height: 40px;
  font-size: 0.85rem;
}

.dir-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--accent-cyan);
  transition: border-color 200ms var(--ease), box-shadow 200ms var(--ease);
}

.dir-btn:hover {
  border-color: var(--accent-cyan);
  box-shadow: 0 0 12px rgba(var(--glow-cyan), 0.4);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
