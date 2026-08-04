<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  ChevronDown,
  ExternalLink,
  Film,
  Gamepad2,
  MonitorPlay,
  Play,
  Sparkles,
  Trophy,
  Users,
  Video,
} from '@lucide/vue'
import {
  AREDL_ACCOUNT,
  FALLBACK_YOUTUBE,
  FEATURED_AVATAR,
  FEATURED_CHANNEL_HANDLE,
  FEATURED_CHANNEL_NAME,
  GD_ACCOUNT,
  TWITCH_CONFIG,
  fetchAredlStats,
  fetchFeaturedYoutube,
  type AredlStats,
} from '../services/featuredCreator'
import { matchesPhone } from '../composables/useViewport'

const emit = defineEmits<{ playVideo: [videoId: string] }>()

const EXPANDED_KEY = 'ecr:featuredDetailsExpanded:v1'

const youtube = ref(FALLBACK_YOUTUBE)
const aredlStats = ref<AredlStats | null>(null)
const storedExpanded = localStorage.getItem(EXPANDED_KEY)
// A saved preference always wins; otherwise phones start collapsed so the
// level list is the first thing on screen.
const expanded = ref(storedExpanded === null ? !matchesPhone() : storedExpanded === 'true')

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
  <div class="bento-wrap">
    <button class="identity-bar" :aria-expanded="expanded" @click="toggleExpanded">
      <div class="identity-inner">
        <img class="identity-avatar" :src="FEATURED_AVATAR" :alt="FEATURED_CHANNEL_NAME" />
        <div class="identity-text">
          <p class="eyebrow"><Sparkles :size="11" /> Featured creator</p>
          <h2>{{ FEATURED_CHANNEL_NAME }}</h2>
        </div>
        <ChevronDown class="chevron" :class="{ open: expanded }" :size="18" />
      </div>
    </button>

    <Transition name="details">
      <div v-if="expanded" class="bento-details">
        <div class="bento-main">
          <div class="bento-cell bento-video">
            <div class="bento-video-inner">
              <p class="eyebrow"><Video :size="11" /> YouTube</p>

              <div class="yt-header">
                <img v-if="youtube.avatarUrl" class="yt-avatar" :src="youtube.avatarUrl" :alt="youtube.channelName" />
                <div v-else class="yt-avatar icon-avatar icon-avatar-youtube"><Video :size="18" /></div>
                <div class="yt-identity">
                  <p class="channel-name">{{ youtube.channelName }}</p>
                  <p class="yt-stats">
                    {{ formatCount(youtube.subscriberCount ?? 0) }} subscribers ·
                    {{ formatCount(youtube.viewCount ?? 0) }} views
                  </p>
                </div>
              </div>

              <p class="eyebrow eyebrow-sub"><Film :size="11" /> Latest video</p>

              <div class="video-row">
                <button class="thumb-link" type="button" @click="emit('playVideo', youtube.video.videoId)">
                  <img :src="thumbnailUrl" :alt="youtube.video.title" />
                  <Play class="play-icon" :size="24" />
                </button>

                <div class="yt-text">
                  <p class="video-title">{{ youtube.video.title }}</p>
                  <p v-if="youtube.video.description" class="video-desc">{{ youtube.video.description }}</p>
                  <a class="btn btn-primary watch-btn" :href="videoHref" target="_blank" rel="noopener">
                    <ExternalLink :size="14" />
                    Watch on YouTube
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div class="bento-right">
            <div class="bento-cell bento-twitch">
              <p class="eyebrow"><MonitorPlay :size="11" /> Twitch</p>
              <div class="side-header">
                <div class="side-avatar icon-avatar icon-avatar-twitch"><MonitorPlay :size="16" /></div>
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

            <div class="bento-bottom-row">
              <div class="bento-cell bento-gd">
                <p class="eyebrow"><Gamepad2 :size="11" /> GD account</p>
                <div class="side-header">
                  <div class="side-avatar icon-avatar icon-avatar-gd"><Gamepad2 :size="16" /></div>
                  <p class="side-name">{{ GD_ACCOUNT.ign }}</p>
                </div>
                <dl class="stats-row">
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

              <div class="bento-cell bento-aredl">
                <p class="eyebrow"><Trophy :size="11" /> AREDL account</p>
                <div class="side-header">
                  <div class="side-avatar icon-avatar icon-avatar-aredl"><Trophy :size="16" /></div>
                  <a class="side-name side-name-link" :href="AREDL_ACCOUNT.profileUrl" target="_blank" rel="noopener">
                    {{ AREDL_ACCOUNT.name }}
                    <ExternalLink :size="11" />
                  </a>
                </div>
                <dl class="stats-row">
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

        <p class="invite-line">
          <Users :size="13" />
          <a href="https://github.com/TLacault" target="_blank" rel="noopener">Want to be featured here? Contact me</a>
        </p>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
@property --angle {
  syntax: '<angle>';
  inherits: false;
  initial-value: 0deg;
}

.bento-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.eyebrow {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.66rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--accent-cyan);
  text-shadow: 0 0 12px rgba(var(--glow-cyan), 0.5);
}

/* --- Identity bar (always visible, whole thing toggles the bento) --- */

.identity-bar {
  position: relative;
  width: 100%;
  padding: 2px;
  border: none;
  border-radius: var(--radius);
  background: transparent;
  overflow: hidden;
  cursor: pointer;
  text-align: left;
  color: inherit;
}

.identity-bar::before {
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
  opacity: 0.55;
  animation: rotate-border 7s linear infinite;
  transition: opacity 400ms var(--ease);
  pointer-events: none;
}

.identity-bar:hover::before {
  opacity: 1;
}

.identity-inner {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.9rem 0.6rem 1rem;
  border-radius: calc(var(--radius) - 2px);
  background: linear-gradient(155deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.02));
  overflow: hidden;
}

.identity-inner::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 45%;
  background: linear-gradient(100deg, transparent, rgba(255, 255, 255, 0.16), transparent);
  transform: translateX(-160%) skewX(-20deg);
  animation: shimmer-sweep 6s ease-in-out infinite;
  pointer-events: none;
}

@keyframes shimmer-sweep {
  0% {
    transform: translateX(-160%) skewX(-20deg);
  }
  28% {
    transform: translateX(260%) skewX(-20deg);
  }
  28.01%,
  100% {
    transform: translateX(260%) skewX(-20deg);
  }
}

.identity-avatar {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--border-strong);
  flex-shrink: 0;
  box-shadow: 0 0 14px rgba(var(--glow-magenta), 0.35);
}

.identity-text {
  position: relative;
  flex: 1 1 auto;
  min-width: 0;
}

.identity-text h2 {
  margin: 0.1rem 0 0;
  font-family: var(--font-display);
  font-size: 1.05rem;
  letter-spacing: 0.01em;
  background: linear-gradient(120deg, #ffffff, var(--accent-magenta) 60%, var(--accent-violet));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.chevron {
  position: relative;
  flex-shrink: 0;
  color: var(--text-muted);
  transition: transform 220ms var(--ease), color 200ms var(--ease);
}

.chevron.open {
  transform: rotate(180deg);
}

.identity-bar:hover .chevron {
  color: var(--accent-cyan);
}

/* --- Details --- */

.bento-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.bento-main {
  display: flex;
  align-items: stretch;
  gap: 0.75rem;
}

.bento-cell {
  position: relative;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding: 0.7rem 0.9rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: rgba(255, 255, 255, 0.03);
  transition: transform 250ms var(--ease), box-shadow 250ms var(--ease), border-color 250ms var(--ease);
}

.bento-cell:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px -12px rgba(0, 0, 0, 0.55);
}

.bento-right {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.bento-twitch {
  flex: 1;
  border-color: rgba(var(--glow-violet), 0.5);
}

.bento-twitch:hover {
  border-color: var(--accent-violet);
  box-shadow: 0 12px 28px -12px rgba(0, 0, 0, 0.55), 0 0 20px rgba(var(--glow-violet), 0.25);
}

.bento-bottom-row {
  flex: 1;
  display: flex;
  gap: 0.75rem;
}

.bento-gd {
  flex: 1;
  min-width: 0;
  border-color: rgba(var(--glow-lime), 0.5);
}

.bento-gd:hover {
  border-color: var(--accent-lime);
  box-shadow: 0 12px 28px -12px rgba(0, 0, 0, 0.55), 0 0 20px rgba(var(--glow-lime), 0.22);
}

.bento-aredl {
  flex: 1;
  min-width: 0;
  border-color: rgba(var(--glow-cyan), 0.5);
}

.bento-aredl:hover {
  border-color: var(--accent-cyan);
  box-shadow: 0 12px 28px -12px rgba(0, 0, 0, 0.55), 0 0 20px rgba(var(--glow-cyan), 0.22);
}

/* --- Icon avatars (replace real photos everywhere except the identity bar) --- */

.icon-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;
}

.icon-avatar-youtube {
  background: rgba(var(--glow-magenta), 0.15);
  color: var(--accent-magenta);
}

.icon-avatar-twitch {
  background: rgba(var(--glow-violet), 0.15);
  color: var(--accent-violet);
}

.icon-avatar-gd {
  background: rgba(var(--glow-lime), 0.15);
  color: var(--accent-lime);
}

.icon-avatar-aredl {
  background: rgba(var(--glow-cyan), 0.15);
  color: var(--accent-cyan);
}

/* --- Video hero cell (signature) --- */

.bento-video {
  flex: 1.5 1 0;
  padding: 2px;
  overflow: hidden;
  border: none;
  background: transparent;
}

.bento-video::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 2px;
  background: var(--accent-red);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0.5;
  transition: opacity 400ms var(--ease);
  pointer-events: none;
}

.bento-video:hover::before {
  opacity: 1;
}

@keyframes rotate-border {
  to {
    --angle: 360deg;
  }
}

.bento-video-inner {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding: 0.85rem;
  border-radius: calc(var(--radius) - 2px);
  background: linear-gradient(155deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.015));
}

.eyebrow-sub {
  margin-top: 0.15rem;
}

.yt-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.yt-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--border-strong);
  flex-shrink: 0;
}

.yt-identity {
  min-width: 0;
  flex: 1 1 auto;
}

.channel-name {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.05rem;
  letter-spacing: 0.01em;
  background: linear-gradient(120deg, #ffffff, var(--accent-magenta) 60%, var(--accent-violet));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.yt-stats {
  margin: 0.1rem 0 0;
  font-size: 0.76rem;
  color: var(--text-muted);
}

.video-row {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.thumb-link {
  position: relative;
  flex-shrink: 0;
  width: 45%;
  max-width: 190px;
  aspect-ratio: 16 / 9;
  border-radius: var(--radius-sm);
  overflow: hidden;
  border: 1px solid var(--border-strong);
  box-shadow: 0 0 0 rgba(var(--glow-magenta), 0);
  transition: box-shadow 300ms var(--ease), transform 300ms var(--ease);
  padding: 0;
  background: #000;
  cursor: pointer;
}

.thumb-link:hover {
  transform: scale(1.02);
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
  font-size: 0.88rem;
  font-weight: 600;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
}

.video-desc {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.74rem;
  line-height: 1.4;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.watch-btn {
  align-self: flex-start;
  margin-top: auto;
  text-decoration: none;
}

/* --- Twitch / GD / AREDL cell content --- */

.side-header {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.side-avatar {
  width: 32px;
  height: 32px;
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
  margin-top: auto;
}

.side-link:hover {
  text-shadow: 0 0 10px rgba(var(--glow-cyan), 0.5);
}

.stats-row {
  margin: 0;
  margin-top: auto;
  display: flex;
  gap: 1.2rem;
}

.stat dt {
  font-size: 0.62rem;
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
  .bento-main {
    flex-direction: column;
  }

  /*
   * Stacking moves the flex basis onto the block axis, so the 0 basis that
   * shares width side-by-side would instead ask for zero height. The video
   * cell clips its own overflow, which zeroes its automatic minimum size too,
   * leaving nothing to hold it open. Stacked cells size to their content.
   */
  .bento-video,
  .bento-right {
    flex: 0 0 auto;
  }
}

@media (max-width: 699.98px) {
  .video-row {
    flex-wrap: wrap;
  }

  .thumb-link {
    width: 100%;
    max-width: none;
  }

  .bento-bottom-row {
    flex-direction: column;
  }

  .identity-bar {
    min-height: 44px;
  }

  .bento-video-inner {
    padding: 0.7rem;
  }
}

/* Landscape phone: keep the bento side-by-side but compress vertical padding. */
@media (orientation: landscape) and (max-height: 500px) {
  .bento-video-inner {
    padding: 0.6rem;
  }

  .video-desc {
    display: none;
  }

  .yt-avatar {
    width: 32px;
    height: 32px;
  }
}

/* --- Show/hide transition for the details section --- */

.details-enter-active,
.details-leave-active {
  transition: opacity 300ms var(--ease), transform 300ms var(--ease);
}

.details-enter-from,
.details-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
