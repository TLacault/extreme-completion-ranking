<script setup lang="ts">
import type { Level } from "../types";
import type { ColumnVisibility, SortKey, SortDir } from "../composables/useLevels";
import { useViewport } from "../composables/useViewport";
import LevelTable from "./LevelTable.vue";
import LevelCardList from "./LevelCardList.vue";
import LevelSortControl from "./LevelSortControl.vue";

defineProps<{
  levels: Level[];
  sortKey: SortKey;
  sortDir: SortDir;
  columnVisibility: ColumnVisibility;
}>();

const emit = defineEmits<{
  sort: [key: SortKey];
  edit: [level: Level];
  delete: [id: string];
  playVideo: [videoId: string];
}>();

/**
 * Narrow viewports get stacked cards; everything else (including landscape
 * phones, which are wide but short) keeps the table.
 */
const { isCardLayout, isDenseTable } = useViewport();
</script>

<template>
  <div v-if="isCardLayout" class="level-list">
    <LevelSortControl :sort-key="sortKey" :sort-dir="sortDir" @sort="emit('sort', $event)" />
    <LevelCardList
      :levels="levels"
      :column-visibility="columnVisibility"
      @edit="emit('edit', $event)"
      @delete="emit('delete', $event)"
      @play-video="emit('playVideo', $event)"
    />
  </div>
  <LevelTable
    v-else
    :levels="levels"
    :sort-key="sortKey"
    :sort-dir="sortDir"
    :column-visibility="columnVisibility"
    :compact="isDenseTable"
    @sort="emit('sort', $event)"
    @edit="emit('edit', $event)"
    @delete="emit('delete', $event)"
    @play-video="emit('playVideo', $event)"
  />
</template>

<style scoped>
.level-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
</style>
