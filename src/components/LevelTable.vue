<script setup lang="ts">
import { computed } from "vue";
import {
  Award,
  Calendar,
  ChevronDown,
  ChevronUp,
  CircleCheck,
  Flame,
  Gamepad2,
  Hash,
  Heart,
  Pencil,
  Play,
  Repeat,
  Settings2,
  SquareArrowOutUpRight,
  Target,
  Trash2,
  Video,
  type LucideIcon,
} from "@lucide/vue";
import type { Level } from "../types";
import type { ColumnKey, ColumnVisibility, SortKey, SortDir } from "../composables/useLevels";
import {
  attemptsLabel,
  bestRunLabel,
  dateLabel,
  heatClass,
  listBadge,
  pipStyle,
  rankMedal,
  statusBadge,
} from "../services/levelPresentation";
import { getYoutubeVideoId } from "../utils/youtube";

const props = withDefaults(
  defineProps<{
    levels: Level[];
    sortKey: SortKey;
    sortDir: SortDir;
    columnVisibility: ColumnVisibility;
    /** Short landscape viewports shorten the widest cells to avoid sideways scroll. */
    compact?: boolean;
  }>(),
  { compact: false },
);

const emit = defineEmits<{
  sort: [key: SortKey];
  edit: [level: Level];
  delete: [id: string];
  playVideo: [videoId: string];
}>();

const columns: { key: SortKey; label: string; icon: LucideIcon }[] = [
  { key: "name", label: "Name", icon: Gamepad2 },
  { key: "aredlRank", label: "AREDL", icon: Award },
  { key: "dlRank", label: "DL", icon: Flame },
  { key: "attempts", label: "Attempts", icon: Repeat },
  { key: "date", label: "Date", icon: Calendar },
  { key: "enjoyment", label: "Enjoyment", icon: Heart },
];

const visibleColumns = computed(() =>
  columns.filter((col) => col.key === "name" || props.columnVisibility[col.key as ColumnKey]),
);

const visibleColumnCount = computed(
  () =>
    1 + // rank
    (props.columnVisibility.status ? 1 : 0) +
    visibleColumns.value.length +
    (props.columnVisibility.bestRun ? 1 : 0) +
    (props.columnVisibility.video ? 1 : 0) +
    1, // actions
);

function sortIndicator(key: SortKey): LucideIcon | null {
  if (props.sortKey !== key) return null;
  return props.sortDir === "asc" ? ChevronUp : ChevronDown;
}

function onVideoClick(level: Level): void {
  const videoId = getYoutubeVideoId(level.videoUrl);
  if (videoId) {
    emit("playVideo", videoId);
  } else {
    window.open(level.videoUrl, "_blank", "noopener");
  }
}

function onRowDblClick(event: MouseEvent, level: Level): void {
  if ((event.target as HTMLElement).closest("button, a, input")) return;
  emit("edit", level);
}
</script>

<template>
  <div class="table-card glass-panel">
    <table class="level-table">
      <thead>
        <tr>
          <th class="rank-col">
            <span class="th-label">
              <Hash :size="13" class="th-icon" />
              RANK
            </span>
          </th>
          <th v-if="columnVisibility.status" class="status-col">
            <span class="th-label">
              <CircleCheck :size="13" class="th-icon" />
              Status
            </span>
          </th>
          <th
            v-for="col in visibleColumns"
            :key="col.key"
            @click="emit('sort', col.key)"
            class="sortable"
          >
            <span class="th-label">
              <component :is="col.icon" :size="13" class="th-icon" />
              {{ col.label }}
              <component
                :is="sortIndicator(col.key)"
                v-if="sortIndicator(col.key)"
                :size="13"
                class="indicator"
              />
            </span>
          </th>
          <th v-if="columnVisibility.bestRun" class="bestrun-col">
            <span class="th-label">
              <Target :size="13" class="th-icon" />
              Best Run
            </span>
          </th>
          <th v-if="columnVisibility.video" class="video-col">
            <span class="th-label">
              <Video :size="13" class="th-icon" />
              Video
            </span>
          </th>
          <th class="actions-col">
            <span class="th-label">
              <Settings2 :size="13" class="th-icon" />
              Actions
            </span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="levels.length === 0" class="empty-row">
          <td :colspan="visibleColumnCount" class="empty-state">
            No levels yet — click "Add level" to start your list.
          </td>
        </tr>
        <tr
          v-for="(level, index) in levels"
          :key="level.id"
          @dblclick="onRowDblClick($event, level)"
        >
          <td class="mono rank-col">
            <component
              v-if="rankMedal(index + 1)"
              :is="rankMedal(index + 1)!.icon"
              :size="15"
              :class="['medal-icon', rankMedal(index + 1)!.className]"
            />
            {{ index + 1 }}
          </td>
          <td v-if="columnVisibility.status" class="status-col">
            <span
              :class="['status-badge', statusBadge(level).className]"
              :title="statusBadge(level).label"
            >
              <component :is="statusBadge(level).icon" :size="12" />
              <span class="status-text">{{ statusBadge(level).label }}</span>
            </span>
          </td>
          <td class="name-cell">{{ level.name }}</td>
          <td v-if="columnVisibility.aredlRank" class="mono">{{ level.aredlRank ?? "—" }}</td>
          <td v-if="columnVisibility.dlRank" class="mono">
            {{ level.dlRank ?? "—" }}
            <span
              v-if="listBadge(level.dlRank)"
              :class="['list-badge', listBadge(level.dlRank)!.className]"
            >
              {{ listBadge(level.dlRank)!.label }}
            </span>
          </td>
          <td v-if="columnVisibility.attempts" class="mono" :class="heatClass(level.attempts)">
            {{ attemptsLabel(level) }}
          </td>
          <td v-if="columnVisibility.date" class="mono date-col">{{ dateLabel(level) }}</td>
          <td v-if="columnVisibility.enjoyment">
            <span class="enjoyment-meter" v-if="level.enjoyment !== null">
              <span
                v-for="pip in 10"
                :key="pip"
                class="pip"
                :class="{ lit: pip <= level.enjoyment }"
                :style="pipStyle(pip, level.enjoyment)"
              ></span>
            </span>
            <span v-else class="mono">—</span>
          </td>
          <td v-if="columnVisibility.bestRun" class="mono bestrun-col">
            {{ bestRunLabel(level, props.compact) }}
          </td>
          <td v-if="columnVisibility.video" class="video-col">
            <button
              v-if="level.videoUrl && getYoutubeVideoId(level.videoUrl)"
              class="video-thumb"
              @click="onVideoClick(level)"
              :aria-label="`Play video for ${level.name}`"
            >
              <img
                :src="`https://img.youtube.com/vi/${getYoutubeVideoId(
                  level.videoUrl,
                )}/mqdefault.jpg`"
                alt=""
              />
              <span class="play-icon"
                ><Play :size="14" fill="currentColor"
              /></span>
            </button>
            <button
              v-else-if="level.videoUrl"
              class="video-link"
              @click="onVideoClick(level)"
              :aria-label="`Open video link for ${level.name}`"
            >
              <SquareArrowOutUpRight :size="14" />
            </button>
            <span v-else class="mono">—</span>
          </td>
          <td class="actions-col">
            <button
              class="icon-btn"
              @click="emit('edit', level)"
              :aria-label="`Edit ${level.name}`"
              title="Edit"
            >
              <Pencil :size="15" />
            </button>
            <button
              class="icon-btn icon-btn-danger"
              @click="emit('delete', level.id)"
              :aria-label="`Delete ${level.name}`"
              title="Delete"
            >
              <Trash2 :size="15" />
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table-card {
  padding: 0;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
}

.level-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

th,
td {
  padding: 0.75rem 0.9rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  text-align: left;
  font-size: 0.85rem;
  white-space: nowrap;
}

th:first-child,
td:first-child {
  padding-left: 1.25rem;
}

th:last-child,
td:last-child {
  padding-right: 1.25rem;
}

thead th:first-child {
  border-top-left-radius: var(--radius-lg);
}

thead th:last-child {
  border-top-right-radius: var(--radius-lg);
}

tbody tr:last-child td:first-child {
  border-bottom-left-radius: var(--radius-lg);
}

tbody tr:last-child td:last-child {
  border-bottom-right-radius: var(--radius-lg);
}

tbody tr:last-child td {
  border-bottom: none;
}

thead th {
  position: sticky;
  top: 0;
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: 1;
}

th {
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
  user-select: none;
}

.th-label {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.th-icon {
  opacity: 0.7;
}

th.sortable {
  cursor: pointer;
  transition: color 200ms var(--ease);
}

th.sortable:hover {
  color: var(--accent-cyan);
  text-shadow: 0 0 10px rgba(var(--glow-cyan), 0.5);
}

.indicator {
  color: var(--accent-magenta);
}

.rank-col {
  width: 3rem;
}

.status-col {
  width: 1%;
}

.level-table .list-badge {
  margin-left: 0.5rem;
}

tbody tr {
  transition: background 200ms var(--ease), box-shadow 200ms var(--ease),
    transform 200ms var(--ease);
  border-radius: var(--radius-sm);
  cursor: pointer;
}

tbody tr:not(.empty-row):hover {
  background: rgba(255, 255, 255, 0.045);
  box-shadow: inset 0 0 0 1px rgba(var(--glow-magenta), 0.4),
    0 0 24px -8px rgba(var(--glow-magenta), 0.35);
}

.empty-row {
  cursor: default;
}

.empty-state {
  padding: 2.5rem 1.25rem;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.9rem;
  white-space: normal;
}

.actions-col {
  white-space: nowrap;
}

.actions-col .icon-btn + .icon-btn {
  margin-left: 0.35rem;
}

.bestrun-col {
  white-space: nowrap;
}

.video-col {
  width: 4.5rem;
  text-align: center;
}

/*
 * Between the card breakpoint and 1100px the table only fits in compact form:
 * landscape phones, small tablets and split-screen windows all land here. The
 * tighter rows also keep roughly twice as many levels on a short screen.
 */
@media (max-width: 1100px) {
  th,
  td {
    padding: 0.35rem 0.32rem;
    font-size: 0.78rem;
  }

  th:first-child,
  td:first-child {
    padding-left: 0.6rem;
  }

  th:last-child,
  td:last-child {
    padding-right: 0.6rem;
  }

  th {
    font-size: 0.62rem;
    letter-spacing: 0.03em;
  }

  /* Header glyphs cost ~22px of column width each — the labels carry the meaning. */
  .th-icon {
    display: none;
  }

  .th-label {
    gap: 0.2rem;
  }

  .rank-col {
    width: 2.5rem;
  }

  .medal-icon {
    margin-right: 0.15rem;
  }

  /* Status collapses to its colour-coded icon; the title attribute keeps the label. */
  .status-text {
    display: none;
  }

  .status-badge {
    padding: 0.25rem 0.35rem;
  }

  .name-cell {
    max-width: 6rem;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* The widest numeric cells — a slightly smaller face buys back ~15px. */
  .bestrun-col,
  td.mono {
    font-size: 0.72rem;
  }

  /* Free-text date notes ("two years ago") would otherwise stretch the column. */
  .date-col {
    max-width: 5rem;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .list-badge {
    font-size: 0.55rem;
    padding: 0.1rem 0.35rem;
  }

  .level-table .list-badge {
    margin-left: 0.3rem;
  }

  .pip {
    width: 4px;
    height: 10px;
  }

  .video-col {
    width: 3.4rem;
  }

  .video-thumb {
    width: 44px;
    height: 26px;
  }

  .actions-col .icon-btn + .icon-btn {
    margin-left: 0.2rem;
  }
}

/* Only on a short screen is the 44px touch target too tall to afford. */
@media (orientation: landscape) and (max-height: 500px) {
  .actions-col .icon-btn {
    width: 30px;
    height: 30px;
  }
}
</style>
