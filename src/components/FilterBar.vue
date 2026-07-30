<script setup lang="ts">
import type { Filters } from '../composables/useLevels'

defineProps<{
  filters: Filters
}>()

function toNullableNumber(value: string): number | null {
  return value === '' ? null : Number(value)
}
</script>

<template>
  <div class="filter-bar">
    <input v-model="filters.search" type="text" placeholder="Search name or creator…" class="search" />
    <label>
      Attempts
      <input
        :value="filters.attemptsMin ?? ''"
        @input="filters.attemptsMin = toNullableNumber(($event.target as HTMLInputElement).value)"
        type="number"
        placeholder="min"
      />
      <input
        :value="filters.attemptsMax ?? ''"
        @input="filters.attemptsMax = toNullableNumber(($event.target as HTMLInputElement).value)"
        type="number"
        placeholder="max"
      />
    </label>
    <label>
      Enjoyment
      <input
        :value="filters.enjoymentMin ?? ''"
        @input="filters.enjoymentMin = toNullableNumber(($event.target as HTMLInputElement).value)"
        type="number"
        placeholder="min"
      />
      <input
        :value="filters.enjoymentMax ?? ''"
        @input="filters.enjoymentMax = toNullableNumber(($event.target as HTMLInputElement).value)"
        type="number"
        placeholder="max"
      />
    </label>
    <label>
      Rank
      <input
        :value="filters.rankMin ?? ''"
        @input="filters.rankMin = toNullableNumber(($event.target as HTMLInputElement).value)"
        type="number"
        placeholder="min"
      />
      <input
        :value="filters.rankMax ?? ''"
        @input="filters.rankMax = toNullableNumber(($event.target as HTMLInputElement).value)"
        type="number"
        placeholder="max"
      />
    </label>
    <label>
      Date
      <input v-model="filters.dateFrom" type="date" />
      <input v-model="filters.dateTo" type="date" />
    </label>
  </div>
</template>

<style scoped>
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 1rem;
  padding: 0.8rem 1rem;
  background: var(--surface);
  border-bottom: 2px solid var(--accent-violet);
  box-shadow: 0 4px 16px -8px rgba(123, 47, 247, 0.5);
}

.filter-bar label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.filter-bar label > input {
  display: inline-block;
  width: 5.5rem;
  margin-right: 0.3rem;
}

.search {
  min-width: 200px;
  align-self: flex-end;
}
</style>
