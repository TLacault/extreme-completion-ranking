<script setup lang="ts">
import {
  Award,
  Calendar,
  ChevronDown,
  ChevronUp,
  CircleCheck,
  Crown,
  Flame,
  Gamepad2,
  Hash,
  Heart,
  Hourglass,
  ListTodo,
  Medal,
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
import type { Level, LevelStatus } from "../types";
import { bestRunRange, levelStatus, type SortKey, type SortDir } from "../composables/useLevels";
import { getYoutubeVideoId } from "../utils/youtube";

const props = defineProps<{
  levels: Level[];
  sortKey: SortKey;
  sortDir: SortDir;
  showStatusColumn: boolean;
}>();

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

function heatClass(attempts: number | null): string {
  if (attempts === null) return "";
  if (attempts >= 10000) return "heat-3";
  if (attempts >= 5000) return "heat-2";
  if (attempts >= 2000) return "heat-1";
  return "";
}

function sortIndicator(key: SortKey): LucideIcon | null {
  if (props.sortKey !== key) return null;
  return props.sortDir === "asc" ? ChevronUp : ChevronDown;
}

const MEDALS: Record<number, { icon: LucideIcon; className: string }> = {
  1: { icon: Crown, className: "medal-gold" },
  2: { icon: Medal, className: "medal-silver" },
  3: { icon: Medal, className: "medal-bronze" },
};

function rankMedal(position: number) {
  return MEDALS[position] ?? null;
}

const LIST_TIERS: { max: number; label: string; className: string }[] = [
  { max: 75, label: "Main", className: "badge-main" },
  { max: 150, label: "Extended", className: "badge-extended" },
  { max: Infinity, label: "Legacy", className: "badge-legacy" },
];

function listBadge(dlRank: number | null) {
  if (dlRank === null) return null;
  return LIST_TIERS.find((tier) => dlRank <= tier.max) ?? null;
}

const STATUS_BADGES: Record<LevelStatus, { label: string; icon: LucideIcon; className: string }> = {
  completed: { label: "Completed", icon: CircleCheck, className: "status-completed" },
  in_progress: { label: "Current", icon: Hourglass, className: "status-in-progress" },
  planned: { label: "Planned", icon: ListTodo, className: "status-planned" },
};

function statusBadge(level: Level) {
  return STATUS_BADGES[levelStatus(level)];
}

function bestRunLabel(level: Level): string {
  if (levelStatus(level) === "completed") return "100%";
  const { min, max } = bestRunRange(level);
  if (min === 0) return `${min}% - ${max}%`;
  const mid = Math.round((min + max) / 2);
  return `${min}% - ${max}% (${mid}%)`;
}

const VIOLET: [number, number, number] = [123, 47, 247];
const MAGENTA: [number, number, number] = [255, 61, 154];
const LIME: [number, number, number] = [198, 255, 61];

function mixColor(
  c1: [number, number, number],
  c2: [number, number, number],
  t: number,
): string {
  const r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
  const g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
  const b = Math.round(c1[2] + (c2[2] - c1[2]) * t);
  return `${r}, ${g}, ${b}`;
}

function pipColor(pip: number): string {
  const t = (pip - 1) / 9;
  return t <= 0.5
    ? mixColor(VIOLET, MAGENTA, t / 0.5)
    : mixColor(MAGENTA, LIME, (t - 0.5) / 0.5);
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
          <th v-if="showStatusColumn" class="status-col">
            <span class="th-label">
              <CircleCheck :size="13" class="th-icon" />
              Status
            </span>
          </th>
          <th
            v-for="col in columns"
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
          <th class="bestrun-col">
            <span class="th-label">
              <Target :size="13" class="th-icon" />
              Best Run
            </span>
          </th>
          <th class="video-col">
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
          <td :colspan="columns.length + 4 + (showStatusColumn ? 1 : 0)" class="empty-state">
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
          <td v-if="showStatusColumn" class="status-col">
            <span :class="['status-badge', statusBadge(level).className]">
              <component :is="statusBadge(level).icon" :size="12" />
              {{ statusBadge(level).label }}
            </span>
          </td>
          <td>{{ level.name }}</td>
          <td class="mono">{{ level.aredlRank ?? "—" }}</td>
          <td class="mono">
            {{ level.dlRank ?? "—" }}
            <span
              v-if="listBadge(level.dlRank)"
              :class="['list-badge', listBadge(level.dlRank)!.className]"
            >
              {{ listBadge(level.dlRank)!.label }}
            </span>
          </td>
          <td class="mono" :class="heatClass(level.attempts)">
            {{
              level.attempts !== null
                ? level.attempts.toLocaleString()
                : level.attemptsNote || "—"
            }}
          </td>
          <td class="mono">{{ level.date ?? (level.dateNote || "—") }}</td>
          <td>
            <span class="enjoyment-meter" v-if="level.enjoyment !== null">
              <span
                v-for="pip in 10"
                :key="pip"
                class="pip"
                :class="{ lit: pip <= level.enjoyment }"
                :style="
                  pip <= level.enjoyment
                    ? {
                        background: `rgb(${pipColor(pip)})`,
                        boxShadow: `0 0 4px rgba(${pipColor(pip)}, 0.7)`,
                      }
                    : {}
                "
              ></span>
            </span>
            <span v-else class="mono">—</span>
          </td>
          <td class="mono bestrun-col">{{ bestRunLabel(level) }}</td>
          <td class="video-col">
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

.mono {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}

.medal-icon {
  vertical-align: -2px;
  margin-right: 0.3rem;
}

.medal-gold {
  color: #ffd75e;
  filter: drop-shadow(0 0 6px rgba(255, 215, 94, 0.7));
}

.medal-silver {
  color: #d8d8e2;
  filter: drop-shadow(0 0 6px rgba(216, 216, 226, 0.55));
}

.medal-bronze {
  color: #e0985a;
  filter: drop-shadow(0 0 6px rgba(224, 152, 90, 0.6));
}

.rank-col {
  width: 3rem;
}

.list-badge {
  display: inline-block;
  margin-left: 0.5rem;
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  font-family: var(--font-body);
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  vertical-align: middle;
}

.badge-main {
  color: #1a0e2e;
  background: linear-gradient(120deg, var(--accent-lime), var(--accent-cyan));
  box-shadow: 0 0 10px rgba(var(--glow-lime), 0.5);
}

.badge-extended {
  color: var(--accent-cyan);
  background: rgba(var(--glow-cyan), 0.14);
  border: 1px solid rgba(var(--glow-cyan), 0.4);
}

.badge-legacy {
  color: #f0b374;
  background: rgba(224, 152, 90, 0.16);
  border: 1px solid rgba(224, 152, 90, 0.45);
  box-shadow: 0 0 8px rgba(224, 152, 90, 0.25);
}

.status-col {
  width: 1%;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
  font-family: var(--font-body);
  font-size: 0.68rem;
  font-weight: 600;
  white-space: nowrap;
}

.status-completed {
  color: #34d399;
  background: rgba(52, 211, 153, 0.14);
  border: 1px solid rgba(52, 211, 153, 0.4);
  box-shadow: 0 0 8px rgba(52, 211, 153, 0.25);
}

.status-in-progress {
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.14);
  border: 1px solid rgba(251, 191, 36, 0.4);
  box-shadow: 0 0 8px rgba(251, 191, 36, 0.25);
}

.status-planned {
  color: #c4b5fd;
  background: rgba(196, 181, 253, 0.12);
  border: 1px solid rgba(196, 181, 253, 0.35);
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

.bestrun-col {
  white-space: nowrap;
}

.video-col {
  width: 4.5rem;
  text-align: center;
}

.video-thumb {
  position: relative;
  width: 64px;
  height: 36px;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: none;
  transition: border-color 200ms var(--ease), box-shadow 200ms var(--ease);
}

.video-thumb:hover {
  border-color: var(--accent-magenta);
  box-shadow: 0 0 14px rgba(var(--glow-magenta), 0.45);
}

.video-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.video-thumb .play-icon {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.8);
  background: rgba(10, 6, 18, 0.15);
}

.video-thumb:hover .play-icon {
  color: var(--accent-magenta);
}

.video-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--accent-cyan);
  width: 28px;
  height: 28px;
  transition: border-color 200ms var(--ease), box-shadow 200ms var(--ease);
}

.video-link:hover {
  border-color: var(--accent-cyan);
  box-shadow: 0 0 12px rgba(var(--glow-cyan), 0.45);
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  margin-right: 0.35rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  transition: border-color 200ms var(--ease), box-shadow 200ms var(--ease),
    color 200ms var(--ease);
}

.icon-btn:hover {
  color: var(--accent-cyan);
  border-color: var(--accent-cyan);
  box-shadow: 0 0 12px rgba(var(--glow-cyan), 0.4);
}

.icon-btn-danger:hover {
  color: var(--danger);
  border-color: rgba(var(--glow-danger), 0.6);
  box-shadow: 0 0 12px rgba(var(--glow-danger), 0.4);
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
</style>
