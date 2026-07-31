<script setup lang="ts">
import { computed, ref } from "vue";
import {
  Calendar,
  ChevronDown,
  Heart,
  Repeat,
  Search,
  SlidersHorizontal,
} from "@lucide/vue";
import type { Filters } from "../composables/useLevels";

const props = defineProps<{
  filters: Filters;
}>();

function toNullableNumber(value: string): number | null {
  return value === "" ? null : Number(value);
}

const expanded = ref(true);

const activeFilterCount = computed(() => {
  const f = props.filters;
  let count = 0;
  if (f.search.trim() !== "") count++;
  if (f.attemptsMin !== null || f.attemptsMax !== null) count++;
  if (f.enjoymentMin !== null || f.enjoymentMax !== null) count++;
  if (f.dateFrom !== null || f.dateTo !== null) count++;
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
      <SlidersHorizontal :size="15" />
      <span>Filters</span>
      <span v-if="activeFilterCount > 0" class="filter-badge mono">{{
        activeFilterCount
      }}</span>
      <ChevronDown :size="15" class="chevron" :class="{ open: expanded }" />
    </button>
    <div class="collapse" :class="{ collapsed: !expanded }">
      <div class="collapse-inner">
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
</style>
