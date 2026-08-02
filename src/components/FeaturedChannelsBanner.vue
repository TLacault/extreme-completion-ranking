<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ChevronDown, ChevronUp, ExternalLink, Gamepad2, MonitorPlay, Play, Trophy, Users } from '@lucide/vue'
import {
  AREDL_ACCOUNT,
  FALLBACK_YOUTUBE,
  FEATURED_CHANNEL_HANDLE,
  GD_ACCOUNT,
  TWITCH_CONFIG,
  fetchAredlStats,
  fetchFeaturedYoutube,
  type AredlStats,
} from '../services/featuredCreator'

const EXPANDED_KEY = 'ecr:featuredBannerExpanded:v1'

const youtube = ref(FALLBACK_YOUTUBE)
const aredlStats = ref<AredlStats | null>(null)
const storedExpanded = localStorage.getItem(EXPANDED_KEY)
const expanded = ref(storedExpanded === null ? true : storedExpanded === 'true')

const videoHref = computed(() => `https://www.youtube.com/watch?v=${youtube.value.video.videoId}`)
const thumbnailUrl = computed(() => `https://img.youtube.com/vi/${youtube.value.video.videoId}/mqdefault.jpg`)

onMounted(async () => {
  const [yt, stats] = await Promise.all([fetchFeaturedYoutube(FEATURED_CHANNEL_HANDLE), fetchAredlStats()])
  if (yt) youtube.value = yt
  aredlStats.value = stats
})

function toggleExpanded(): void {
  expanded.value = !expanded.value
  localStorage.setItem(EXPANDED_KEY, String(expanded.value))
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return String(n)
}
</script>

<template>
  <div class="featured-wrap">
    <div class="featured-banner glass-panel glass-strong">
      <button v-if="!expanded" class="toggle-row" :aria-expanded="expanded" @click="toggleExpanded">
        <span class="toggle-text">
          <Play :size="11" />
          <strong>{{ youtube.channelName }}</strong>
          <span class="toggle-sub">{{ youtube.video.title }}</span>
        </span>
        <ChevronDown :size="16" />
      </button>

      <div v-show="expanded" class="featured-inner">
        <div class="collapse-bar">
          <button class="collapse-btn" aria-expanded="true" aria-label="Collapse featured creator" @click="toggleExpanded">
            <ChevronUp :size="16" />
          </button>
        </div>

        <div class="yt-section">
          <div class="yt-header">
            <img v-if="youtube.avatarUrl" class="yt-avatar" :src="youtube.avatarUrl" :alt="youtube.channelName" />
            <div>
              <p class="eyebrow"><Play :size="11" /> Featured creator</p>
              <h2 class="channel-name">{{ youtube.channelName }}</h2>
              <p v-if="youtube.subscriberCount !== null || youtube.viewCount !== null" class="yt-stats">
                <span v-if="youtube.subscriberCount !== null">{{ formatCount(youtube.subscriberCount) }} subscribers</span>
                <span v-if="youtube.subscriberCount !== null && youtube.viewCount !== null"> · </span>
                <span v-if="youtube.viewCount !== null">{{ formatCount(youtube.viewCount) }} views</span>
              </p>
            </div>
          </div>

          <div class="yt-body">
            <a class="thumb-link" :href="videoHref" target="_blank" rel="noopener">
              <img :src="thumbnailUrl" :alt="youtube.video.title" />
              <Play class="play-icon" :size="28" />
            </a>

            <div class="yt-text">
              <p class="video-title">{{ youtube.video.title }}</p>
              <p v-if="youtube.video.description" class="video-desc">{{ youtube.video.description }}</p>
              <a class="btn btn-primary watch-btn" :href="videoHref" target="_blank" rel="noopener">
                <Play :size="14" />
                Watch latest
              </a>
            </div>
          </div>
        </div>

        <div class="side-sections">
          <div class="side-card">
            <p class="eyebrow"><MonitorPlay :size="11" /> Twitch</p>
            <div class="side-header">
              <img class="side-avatar" :src="TWITCH_CONFIG.avatarUrl" :alt="TWITCH_CONFIG.name" />
              <div>
                <p class="side-name">{{ TWITCH_CONFIG.name }}</p>
                <p class="side-sub">{{ TWITCH_CONFIG.schedule }}</p>
              </div>
            </div>
            <a class="side-link" :href="TWITCH_CONFIG.url" target="_blank" rel="noopener">
              Watch on Twitch
              <ExternalLink :size="12" />
            </a>
          </div>

          <div class="side-card accounts-card">
            <div class="account-col">
              <p class="eyebrow"><Gamepad2 :size="11" /> GD account</p>
              <p class="side-name">{{ GD_ACCOUNT.ign }}</p>
              <dl class="stats-stack">
                <div class="stat">
                  <dt>Extremes</dt>
                  <dd>{{ GD_ACCOUNT.extremes }}</dd>
                </div>
                <div class="stat">
                  <dt>In-game rank</dt>
                  <dd>#{{ GD_ACCOUNT.inGameRank }}</dd>
                </div>
              </dl>
            </div>

            <div class="account-col account-col-divider">
              <p class="eyebrow"><Trophy :size="11" /> AREDL account</p>
              <a class="side-name side-name-link" :href="AREDL_ACCOUNT.profileUrl" target="_blank" rel="noopener">
                {{ AREDL_ACCOUNT.name }}
                <ExternalLink :size="11" />
              </a>
              <dl class="stats-stack">
                <div class="stat">
                  <dt>DL rank</dt>
                  <dd>{{ aredlStats ? `#${aredlStats.rank}` : '—' }}</dd>
                </div>
                <div class="stat">
                  <dt>Points</dt>
                  <dd>{{ aredlStats ? aredlStats.totalPoints.toLocaleString() : '—' }}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>

    <p class="invite-line">
      <Users :size="13" />
      <a href="https://github.com/TLacault" target="_blank" rel="noopener">Want to be featured here? Contact me</a>
    </p>
  </div>
</template>

<style scoped>
@property --angle {
  syntax: '<angle>';
  inherits: false;
  initial-value: 0deg;
}

.featured-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.featured-banner {
  position: relative;
  padding: 2px;
  overflow: hidden;
}

.featured-banner::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 2px;
  background: conic-gradient(from var(--angle), var(--accent-magenta), var(--accent-violet), var(--accent-cyan), var(--accent-magenta));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0.45;
  animation: rotate-border 7s linear infinite;
  transition: opacity 400ms var(--ease);
  pointer-events: none;
}

.featured-banner:hover::before {
  opacity: 1;
}

@keyframes rotate-border {
  to {
    --angle: 360deg;
  }
}

.collapse-bar {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  margin: -0.6rem 0 -0.4rem;
}

.collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.8rem;
  height: 1.8rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  color: var(--text-muted);
  transition: color 200ms var(--ease), border-color 200ms var(--ease), box-shadow 200ms var(--ease);
}

.collapse-btn:hover {
  color: var(--accent-cyan);
  border-color: var(--accent-cyan);
  box-shadow: 0 0 12px rgba(var(--glow-cyan), 0.35);
}

.toggle-row {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  background: transparent;
  border: none;
  padding: 0.75rem 1.1rem;
  color: var(--text);
  text-align: left;
}

.toggle-text {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  min-width: 0;
  overflow: hidden;
  font-size: 0.82rem;
}

.toggle-text strong {
  flex-shrink: 0;
  color: var(--accent-cyan);
}

.toggle-sub {
  flex: 1 1 auto;
  min-width: 0;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.eyebrow {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.68rem;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  color: var(--accent-cyan);
  text-shadow: 0 0 12px rgba(var(--glow-cyan), 0.5);
}

.featured-inner {
  position: relative;
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 1.5rem;
  padding: 1.4rem 1.75rem;
  border-radius: calc(var(--radius-lg) - 2px);
}

/* --- YouTube (primary) section --- */

.yt-section {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  min-width: 0;
}

.yt-header {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}

.yt-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--border-strong);
  flex-shrink: 0;
}

.channel-name {
  margin: 0.15rem 0 0;
  font-family: var(--font-display);
  font-size: 1.35rem;
  letter-spacing: 0.01em;
  background: linear-gradient(120deg, #ffffff, var(--accent-magenta) 60%, var(--accent-violet));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.yt-stats {
  margin: 0.15rem 0 0;
  font-size: 0.78rem;
  color: var(--text-muted);
}

.yt-body {
  display: flex;
  gap: 1.25rem;
  align-items: center;
  padding-top: 0.85rem;
  border-top: 1px solid var(--border);
}

.thumb-link {
  position: relative;
  flex-shrink: 0;
  width: 190px;
  aspect-ratio: 16 / 9;
  border-radius: var(--radius);
  overflow: hidden;
  border: 1px solid var(--border-strong);
  box-shadow: 0 0 0 rgba(var(--glow-magenta), 0);
  transition: box-shadow 300ms var(--ease), transform 300ms var(--ease);
}

.thumb-link:hover {
  transform: scale(1.03);
  box-shadow: 0 0 32px rgba(var(--glow-magenta), 0.45), 0 0 60px rgba(var(--glow-violet), 0.25);
}

.thumb-link img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.play-icon {
  position: absolute;
  inset: 0;
  margin: auto;
  color: #fff;
  filter: drop-shadow(0 0 10px rgba(0, 0, 0, 0.85));
  opacity: 0.9;
  transition: opacity 250ms var(--ease), transform 250ms var(--ease);
}

.thumb-link:hover .play-icon {
  opacity: 1;
  transform: scale(1.12);
}

.yt-text {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.video-title {
  margin: 0;
  color: var(--text);
  font-size: 0.9rem;
  font-weight: 600;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.video-desc {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.78rem;
  line-height: 1.4;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.watch-btn {
  align-self: flex-start;
  margin-top: 0.2rem;
  text-decoration: none;
}

/* --- Side sections (Twitch / GD account / AREDL account) --- */

.side-sections {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  min-width: 0;
}

.side-card {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: rgba(255, 255, 255, 0.03);
}

.side-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.side-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--border-strong);
  flex-shrink: 0;
}

.side-name {
  margin: 0;
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--text);
}

.side-name-link {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  text-decoration: none;
  width: fit-content;
}

.side-name-link:hover {
  color: var(--accent-cyan);
}

.side-sub {
  margin: 0.1rem 0 0;
  font-size: 0.76rem;
  color: var(--text-muted);
}

.side-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--accent-cyan);
  font-size: 0.78rem;
  text-decoration: none;
  width: fit-content;
}

.side-link:hover {
  text-shadow: 0 0 10px rgba(var(--glow-cyan), 0.5);
}

.accounts-card {
  flex-direction: row;
}

.account-col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.account-col-divider {
  border-left: 1px solid var(--border);
  padding-left: 0.85rem;
}

.stats-stack {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.stat dt {
  font-size: 0.64rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.stat dd {
  margin: 0.05rem 0 0;
  font-family: var(--font-mono);
  font-size: 0.85rem;
  color: var(--accent-lime);
}

/* --- Invite line --- */

.invite-line {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0 0.35rem;
  color: var(--text-muted);
  font-size: 0.78rem;
}

.invite-line a {
  color: var(--text-muted);
  text-decoration: none;
  transition: color 200ms var(--ease);
}

.invite-line a:hover {
  color: var(--accent-cyan);
}

@media (max-width: 860px) {
  .featured-inner {
    grid-template-columns: 1fr;
  }

  .yt-body {
    flex-wrap: wrap;
  }

  .thumb-link {
    width: 100%;
  }
}

@media (max-width: 520px) {
  .accounts-card {
    flex-direction: column;
  }

  .account-col-divider {
    border-left: none;
    padding-left: 0;
    border-top: 1px solid var(--border);
    padding-top: 0.6rem;
  }
}
</style>
