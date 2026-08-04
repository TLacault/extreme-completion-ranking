<script setup lang="ts">
import { computed, ref } from "vue";
import {
  Award,
  Calendar,
  ChevronDown,
  CircleCheck,
  Columns3,
  Flame,
  Heart,
  Hourglass,
  ListTodo,
  Repeat,
  Search,
  Settings2,
  SlidersHorizontal,
  Target,
  Video,
  type LucideIcon,
} from "@lucide/vue";
import type { ColumnKey, ColumnVisibility, Filters } from "../composables/useLevels";
import { matchesPhone } from "../composables/useViewport";
import type { LevelStatus } from "../types";

const props = defineProps<{
  filters: Filters;
  columnVisibility: ColumnVisibility;
}>();

function toNullableNumber(value: string): number | null {
  return value === "" ? null : Number(value);
}

const STATUS_TOGGLES: { value: LevelStatus; label: string; icon: LucideIcon }[] = [
  { value: "completed", label: "Completed", icon: CircleCheck },
  { value: "in_progress", label: "Current", icon: Hourglass },
  { value: "planned", label: "Plan", icon: ListTodo },
];

const COLUMN_TOGGLES: { key: ColumnKey; label: string; icon: LucideIcon }[] = [
  { key: "status", label: "Status", icon: CircleCheck },
  { key: "aredlRank", label: "AREDL", icon: Award },
  { key: "dlRank", label: "DL", icon: Flame },
  { key: "attempts", label: "Attempts", icon: Repeat },
  { key: "date", label: "Date", icon: Calendar },
  { key: "enjoyment", label: "Enjoyment", icon: Heart },
  { key: "bestRun", label: "Best Run", icon: Target },
  { key: "video", label: "Video", icon: Video },
];

// On a phone the open panel fills the screen, so the list wins the first fold.
const expanded = ref(!matchesPhone());

const activeFilterCount = computed(() => {
  const f = props.filters;
  let count = 0;
  if (f.search.trim() !== "") count++;
  if (f.attemptsMin !== null || f.attemptsMax !== null) count++;
  if (f.enjoymentMin !== null || f.enjoymentMax !== null) count++;
  if (f.dateFrom !== null || f.dateTo !== null) count++;
  if (!f.statuses.completed || !f.statuses.in_progress || !f.statuses.planned) count++;
  return count;
});
</script>

<template>
  <div class="filter-bar glass-panel">
    <button
      class="filter-toggle"
      @click="expanded = !expanded"
      :aria-expanded="expanded"
    >
      <Settings2 :size="15" />
      <span>Options</span>
      <span v-if="activeFilterCount > 0" class="filter-badge mono">{{
        activeFilterCount
      }}</span>
      <ChevronDown :size="15" class="chevron" :class="{ open: expanded }" />
    </button>
    <div class="collapse" :class="{ collapsed: !expanded }">
      <div class="collapse-inner">
        <div class="status-field">
          <span class="field-label"><SlidersHorizontal :size="12" /> Status</span>
          <div class="toggle-row">
            <button
              v-for="option in STATUS_TOGGLES"
              :key="option.value"
              type="button"
              :class="['toggle-chip', `toggle-${option.value}`, { active: filters.statuses[option.value] }]"
              @click="filters.statuses[option.value] = !filters.statuses[option.value]"
            >
              <component :is="option.icon" :size="13" />
              {{ option.label }}
            </button>
          </div>
        </div>
        <div class="status-field">
          <span class="field-label"><Columns3 :size="12" /> Columns</span>
          <div class="toggle-row">
            <button
              v-for="option in COLUMN_TOGGLES"
              :key="option.key"
              type="button"
              :class="['toggle-chip', 'toggle-column', { active: columnVisibility[option.key] }]"
              @click="columnVisibility[option.key] = !columnVisibility[option.key]"
            >
              <component :is="option.icon" :size="13" />
              {{ option.label }}
            </button>
          </div>
        </div>
        <div class="filter-body">
          <label class="search-field">
            <span class="field-label"><Search :size="12" /> Search</span>
            <input
              v-model="filters.search"
              type="text"
              placeholder="Search name or creator…"
              class="search"
            />
          </label>
          <label>
            <span class="field-label"><Repeat :size="12" /> Attempts</span>
            <span class="range-inputs">
              <input
                :value="filters.attemptsMin ?? ''"
                @input="
                  filters.attemptsMin = toNullableNumber(
                    ($event.target as HTMLInputElement).value,
                  )
                "
                type="number"
                placeholder="min"
              />
              <input
                :value="filters.attemptsMax ?? ''"
                @input="
                  filters.attemptsMax = toNullableNumber(
                    ($event.target as HTMLInputElement).value,
                  )
                "
                type="number"
                placeholder="max"
              />
            </span>
          </label>
          <label>
            <span class="field-label"><Heart :size="12" /> Enjoyment</span>
            <span class="range-inputs">
              <input
                :value="filters.enjoymentMin ?? ''"
                @input="
                  filters.enjoymentMin = toNullableNumber(
                    ($event.target as HTMLInputElement).value,
                  )
                "
                type="number"
                placeholder="min"
              />
              <input
                :value="filters.enjoymentMax ?? ''"
                @input="
                  filters.enjoymentMax = toNullableNumber(
                    ($event.target as HTMLInputElement).value,
                  )
                "
                type="number"
                placeholder="max"
              />
            </span>
          </label>
          <label>
            <span class="field-label"><Calendar :size="12" /> Date</span>
            <span class="range-inputs">
              <input v-model="filters.dateFrom" type="date" />
              <input v-model="filters.dateTo" type="date" />
            </span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.filter-bar {
  padding: 0.5rem 1.5rem;
}

.filter-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  color: var(--text);
  font-family: var(--font-body);
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 0.5rem 0.2rem;
  width: 100%;
}

.filter-toggle:hover {
  color: var(--accent-cyan);
}

.filter-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.2rem;
  height: 1.2rem;
  padding: 0 0.35rem;
  border-radius: 999px;
  background: rgba(var(--glow-magenta), 0.2);
  color: var(--accent-magenta);
  font-size: 0.65rem;
}

.chevron {
  margin-left: auto;
  transition: transform 220ms var(--ease);
}

.chevron.open {
  transform: rotate(180deg);
}

.collapse {
  display: grid;
  grid-template-rows: 1fr;
  transition: grid-template-rows 280ms var(--ease);
}

.collapse.collapsed {
  grid-template-rows: 0fr;
}

.collapse-inner {
  overflow: hidden;
}

.filter-body {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 1.4rem;
  padding: 0.6rem 0.2rem 1rem;
}

.filter-body label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.field-label {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}

.status-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
  padding: 0.6rem 0.2rem 0.8rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.toggle-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.toggle-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.75rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border);
  border-radius: 999px;
  color: var(--text-muted);
  font-size: 0.75rem;
  text-transform: none;
  letter-spacing: normal;
  transition: border-color 200ms var(--ease), color 200ms var(--ease), background 200ms var(--ease), box-shadow 200ms var(--ease), opacity 200ms var(--ease);
}

.toggle-chip:hover {
  border-color: var(--border-strong);
  color: var(--text);
}

.toggle-chip:not(.active) {
  opacity: 0.55;
}

.toggle-chip.active {
  font-weight: 600;
}

.toggle-chip.toggle-completed.active {
  color: #34d399;
  background: rgba(52, 211, 153, 0.14);
  border-color: rgba(52, 211, 153, 0.4);
  box-shadow: 0 0 10px rgba(52, 211, 153, 0.3);
}

.toggle-chip.toggle-in_progress.active {
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.14);
  border-color: rgba(251, 191, 36, 0.4);
  box-shadow: 0 0 10px rgba(251, 191, 36, 0.3);
}

.toggle-chip.toggle-planned.active {
  color: #c4b5fd;
  background: rgba(196, 181, 253, 0.12);
  border-color: rgba(196, 181, 253, 0.4);
  box-shadow: 0 0 10px rgba(196, 181, 253, 0.25);
}

.toggle-chip.toggle-column.active {
  color: var(--accent-cyan);
  background: rgba(var(--glow-cyan), 0.14);
  border-color: rgba(var(--glow-cyan), 0.4);
  box-shadow: 0 0 10px rgba(var(--glow-cyan), 0.3);
}

.range-inputs {
  display: flex;
  gap: 0.3rem;
}

.range-inputs input {
  width: 5.5rem;
}

.search-field {
  align-self: flex-end;
}

.search {
  min-width: 220px;
}

.search:focus-visible {
  background: rgba(var(--glow-magenta), 0.05);
}

@media (max-width: 699.98px) {
  .filter-bar {
    padding: 0.4rem 1rem;
  }

  .filter-toggle {
    padding: 0.6rem 0.2rem;
    min-height: 44px;
  }

  /* Fields go one per row; ranges split the width evenly instead of overflowing. */
  .filter-body {
    flex-direction: column;
    align-items: stretch;
    gap: 0.9rem;
    padding-bottom: 1.1rem;
  }

  .search-field {
    align-self: stretch;
  }

  .search {
    min-width: 0;
    width: 100%;
  }

  .range-inputs {
    gap: 0.5rem;
  }

  .range-inputs input {
    width: auto;
    flex: 1;
    min-width: 0;
  }

  .toggle-chip {
    padding: 0.5rem 0.8rem;
    min-height: 38px;
  }
}

/* Landscape phone: two field columns fit, but vertical padding must shrink. */
@media (orientation: landscape) and (max-height: 500px) {
  .filter-bar {
    padding: 0.3rem 1rem;
  }

  .filter-body {
    gap: 0.9rem;
    padding: 0.5rem 0.2rem 0.7rem;
  }

  .status-field {
    padding: 0.45rem 0.2rem 0.6rem;
  }
}
</style>
