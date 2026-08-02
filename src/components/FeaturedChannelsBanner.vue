<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Play, Users } from "@lucide/vue";
import {
  FALLBACK_VIDEO,
  FEATURED_CHANNEL_HANDLE,
  FEATURED_CHANNEL_NAME,
  fetchLatestVideo,
} from "../services/featuredVideo";

const video = ref(FALLBACK_VIDEO);

onMounted(async () => {
  const latest = await fetchLatestVideo(FEATURED_CHANNEL_HANDLE);
  if (latest) video.value = latest;
});
</script>

<template>
  <div class="featured-banner glass-panel glass-strong">
    <div class="featured-inner">
      <a
        class="thumb-link"
        :href="`https://www.youtube.com/watch?v=${video.videoId}`"
        target="_blank"
        rel="noopener"
      >
        <img
          :src="`https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`"
          :alt="video.title"
        />
        <Play class="play-icon" :size="30" />
      </a>

      <div class="featured-text">
        <p class="eyebrow">Featured creator</p>
        <h2 class="channel-name">{{ FEATURED_CHANNEL_NAME }}</h2>
        <p class="video-title">{{ video.title }}</p>
        <a
          class="btn btn-primary watch-btn"
          :href="`https://www.youtube.com/watch?v=${video.videoId}`"
          target="_blank"
          rel="noopener"
        >
          <Play :size="14" />
          Watch latest
        </a>
      </div>

      <div class="invite-slot">
        <Users :size="15" />
        <a href="https://github.com/TLacault" target="_blank" rel="noopener"
          >Want to be featured here?<br />Contact me</a
        >
      </div>
    </div>
  </div>
</template>

<style scoped>
@property --angle {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}

.featured-banner {
  position: relative;
  padding: 2px;
  overflow: hidden;
}

.featured-banner::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 2px;
  background: conic-gradient(
    from var(--angle),
    var(--accent-magenta),
    var(--accent-violet),
    var(--accent-cyan),
    var(--accent-magenta)
  );
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
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
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.4rem 1.75rem;
  border-radius: calc(var(--radius-lg) - 2px);
  background: linear-gradient(
    155deg,
    rgba(255, 255, 255, 0.06),
    rgba(255, 255, 255, 0.015)
  );
}

.thumb-link {
  position: relative;
  flex-shrink: 0;
  width: 220px;
  aspect-ratio: 16 / 9;
  border-radius: var(--radius);
  overflow: hidden;
  border: 1px solid var(--border-strong);
  box-shadow: 0 0 0 rgba(var(--glow-magenta), 0);
  transition: box-shadow 300ms var(--ease), transform 300ms var(--ease);
}

.thumb-link:hover {
  transform: scale(1.03);
  box-shadow: 0 0 32px rgba(var(--glow-magenta), 0.45),
    0 0 60px rgba(var(--glow-violet), 0.25);
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

.featured-text {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.eyebrow {
  margin: 0;
  font-size: 0.72rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--accent-cyan);
  text-shadow: 0 0 12px rgba(var(--glow-cyan), 0.5);
}

.channel-name {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.5rem;
  letter-spacing: 0.01em;
  background: linear-gradient(
    120deg,
    #ffffff,
    var(--accent-magenta) 60%,
    var(--accent-violet)
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.video-title {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.9rem;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.watch-btn {
  align-self: flex-start;
  margin-top: 0.3rem;
  text-decoration: none;
}

.invite-slot {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.55rem;
  color: var(--text-muted);
  font-size: 0.78rem;
  line-height: 1.4;
  border-left: 1px solid var(--border);
  padding-left: 1.5rem;
  max-width: 150px;
}

.invite-slot a {
  color: var(--text-muted);
  text-decoration: none;
  transition: color 200ms var(--ease);
}

.invite-slot a:hover {
  color: var(--accent-cyan);
}

@media (max-width: 720px) {
  .featured-inner {
    flex-wrap: wrap;
  }

  .thumb-link {
    width: 100%;
  }

  .invite-slot {
    border-left: none;
    padding-left: 0;
    max-width: none;
    border-top: 1px solid var(--border);
    padding-top: 1rem;
    width: 100%;
  }
}
</style>
