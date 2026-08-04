<script setup lang="ts">
import { computed } from "vue";
import { Pencil, Play, SquareArrowOutUpRight, Trash2 } from "@lucide/vue";
import type { Level } from "../types";
import type { ColumnVisibility } from "../composables/useLevels";
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

const props = defineProps<{
  levels: Level[];
  columnVisibility: ColumnVisibility;
}>();

const emit = defineEmits<{
  edit: [level: Level];
  delete: [id: string];
  playVideo: [videoId: string];
}>();

/** True when a card would show no detail rows at all, so the divider is dropped. */
const hasDetailRows = computed(
  () =>
    props.columnVisibility.aredlRank ||
    props.columnVisibility.dlRank ||
    props.columnVisibility.attempts ||
    props.columnVisibility.date ||
    props.columnVisibility.enjoyment ||
    props.columnVisibility.bestRun,
);

function onVideoClick(level: Level): void {
  const videoId = getYoutubeVideoId(level.videoUrl);
  if (videoId) {
    emit("playVideo", videoId);
  } else {
    window.open(level.videoUrl, "_blank", "noopener");
  }
}
</script>

<template>
  <div class="card-list">
    <p v-if="levels.length === 0" class="empty-state glass-panel">
      No levels yet — tap "Add level" to start your list.
    </p>

    <article v-for="(level, index) in levels" :key="level.id" class="level-card glass-panel">
      <header class="card-head">
        <span class="card-rank mono">
          <component
            v-if="rankMedal(index + 1)"
            :is="rankMedal(index + 1)!.icon"
            :size="16"
            :class="['medal-icon', rankMedal(index + 1)!.className]"
          />
          {{ index + 1 }}
        </span>
        <h3 class="card-name">{{ level.name }}</h3>
      </header>

      <p v-if="level.creator" class="card-creator">by {{ level.creator }}</p>

      <span
        v-if="columnVisibility.status"
        :class="['status-badge', statusBadge(level).className]"
      >
        <component :is="statusBadge(level).icon" :size="12" />
        {{ statusBadge(level).label }}
      </span>

      <dl v-if="hasDetailRows" class="card-rows">
        <div v-if="columnVisibility.aredlRank" class="card-row">
          <dt>AREDL</dt>
          <dd class="mono">{{ level.aredlRank ?? "—" }}</dd>
        </div>
        <div v-if="columnVisibility.dlRank" class="card-row">
          <dt>DL</dt>
          <dd class="mono">
            {{ level.dlRank ?? "—" }}
            <span
              v-if="listBadge(level.dlRank)"
              :class="['list-badge', listBadge(level.dlRank)!.className]"
            >
              {{ listBadge(level.dlRank)!.label }}
            </span>
          </dd>
        </div>
        <div v-if="columnVisibility.attempts" class="card-row">
          <dt>Attempts</dt>
          <dd class="mono" :class="heatClass(level.attempts)">{{ attemptsLabel(level) }}</dd>
        </div>
        <div v-if="columnVisibility.date" class="card-row">
          <dt>Date</dt>
          <dd class="mono">{{ dateLabel(level) }}</dd>
        </div>
        <div v-if="columnVisibility.enjoyment" class="card-row">
          <dt>Enjoyment</dt>
          <dd>
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
          </dd>
        </div>
        <div v-if="columnVisibility.bestRun" class="card-row">
          <dt>Best run</dt>
          <dd class="mono">{{ bestRunLabel(level) }}</dd>
        </div>
      </dl>

      <footer class="card-foot">
        <button
          v-if="columnVisibility.video && level.videoUrl && getYoutubeVideoId(level.videoUrl)"
          class="video-thumb"
          @click="onVideoClick(level)"
          :aria-label="`Play video for ${level.name}`"
        >
          <img
            :src="`https://img.youtube.com/vi/${getYoutubeVideoId(level.videoUrl)}/mqdefault.jpg`"
            alt=""
          />
          <span class="play-icon"><Play :size="14" fill="currentColor" /></span>
        </button>
        <button
          v-else-if="columnVisibility.video && level.videoUrl"
          class="video-link"
          @click="onVideoClick(level)"
          :aria-label="`Open video link for ${level.name}`"
        >
          <SquareArrowOutUpRight :size="14" />
        </button>
        <span v-else class="foot-spacer"></span>

        <span class="foot-actions">
          <button class="icon-btn" @click="emit('edit', level)" :aria-label="`Edit ${level.name}`">
            <Pencil :size="16" />
          </button>
          <button
            class="icon-btn icon-btn-danger"
            @click="emit('delete', level.id)"
            :aria-label="`Delete ${level.name}`"
          >
            <Trash2 :size="16" />
          </button>
        </span>
      </footer>
    </article>
  </div>
</template>

<style scoped>
.card-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.empty-state {
  margin: 0;
  padding: 2.5rem 1.25rem;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.level-card {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding: 0.9rem 1rem;
  border-radius: var(--radius);
}

.card-head {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  min-width: 0;
}

.card-rank {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  font-size: 0.95rem;
  color: var(--text-muted);
}

.card-name {
  margin: 0;
  min-width: 0;
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.25;
  /* Long level names wrap rather than overflow the card. */
  overflow-wrap: anywhere;
}

.card-creator {
  margin: -0.3rem 0 0;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.status-badge {
  align-self: flex-start;
}

.card-rows {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin: 0.15rem 0 0;
  padding-top: 0.6rem;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
}

.card-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.card-row dt {
  font-size: 0.72rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.card-row dd {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  text-align: right;
}

.card-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 0.15rem;
  padding-top: 0.6rem;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
}

.foot-spacer {
  flex: 1;
}

.foot-actions {
  display: inline-flex;
  gap: 0.5rem;
  margin-left: auto;
}
</style>
