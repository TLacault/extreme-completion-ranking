<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ExternalLink, Gamepad2, MonitorPlay, Play, Users } from '@lucide/vue'
import {
  FALLBACK_YOUTUBE,
  FEATURED_CHANNEL_HANDLE,
  GD_ACCOUNT,
  TWITCH_CONFIG,
  fetchFeaturedYoutube,
  fetchGdStats,
  type GdStats,
} from '../services/featuredCreator'

const youtube = ref(FALLBACK_YOUTUBE)
const gdStats = ref<GdStats | null>(null)

const videoHref = computed(() => `https://www.youtube.com/watch?v=${youtube.value.video.videoId}`)
const thumbnailUrl = computed(() => `https://img.youtube.com/vi/${youtube.value.video.videoId}/mqdefault.jpg`)

onMounted(async () => {
  const [yt, stats] = await Promise.all([fetchFeaturedYoutube(FEATURED_CHANNEL_HANDLE), fetchGdStats()])
  if (yt) youtube.value = yt
  gdStats.value = stats
})
</script>

<template>
  <div class="featured-wrap">
    <div class="featured-banner glass-panel glass-strong">
      <div class="featured-inner">
        <div class="yt-section">
          <div class="yt-header">
            <img v-if="youtube.avatarUrl" class="yt-avatar" :src="youtube.avatarUrl" :alt="youtube.channelName" />
            <div>
              <p class="eyebrow"><Play :size="11" /> Featured creator</p>
              <h2 class="channel-name">{{ youtube.channelName }}</h2>
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

          <div class="side-card">
            <p class="eyebrow"><Gamepad2 :size="11" /> GD account</p>
            <p class="side-name">{{ GD_ACCOUNT.ign }}</p>
            <dl class="gd-stats">
              <div class="gd-stat">
                <dt>Points</dt>
                <dd>{{ gdStats ? gdStats.totalPoints.toLocaleString() : '—' }}</dd>
              </div>
              <div class="gd-stat">
                <dt>DL rank</dt>
                <dd>{{ gdStats ? `#${gdStats.rank}` : '—' }}</dd>
              </div>
              <div class="gd-stat">
                <dt>In-game rank</dt>
                <dd>#{{ GD_ACCOUNT.inGameRank }}</dd>
              </div>
              <div class="gd-stat">
                <dt>Extremes</dt>
                <dd>{{ gdStats ? gdStats.extremes : '—' }}</dd>
              </div>
            </dl>
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

.featured-inner {
  position: relative;
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 1.5rem;
  padding: 1.4rem 1.75rem;
  border-radius: calc(var(--radius-lg) - 2px);
  background: linear-gradient(155deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.015));
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
  width: 40px;
  height: 40px;
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

.yt-body {
  display: flex;
  gap: 1.25rem;
  align-items: center;
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

/* --- Side sections (Twitch / GD account) --- */

.side-sections {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 0;
}

.side-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0.85rem 1rem;
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

.gd-stats {
  margin: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem 0.75rem;
}

.gd-stat dt {
  font-size: 0.64rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.gd-stat dd {
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

  .side-sections {
    flex-direction: row;
  }

  .side-card {
    flex: 1 1 0;
  }
}

@media (max-width: 560px) {
  .side-sections {
    flex-direction: column;
  }
}
</style>
