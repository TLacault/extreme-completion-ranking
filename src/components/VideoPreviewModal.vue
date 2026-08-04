<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { X } from '@lucide/vue'

defineProps<{
  videoId: string
}>()

const emit = defineEmits<{
  close: []
}>()

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') emit('close')
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="player">
      <button class="close-btn" @click="emit('close')" aria-label="Close video">
        <X :size="18" />
      </button>
      <iframe
        :src="`https://www.youtube.com/embed/${videoId}?autoplay=1`"
        title="YouTube video player"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
      ></iframe>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(6, 4, 15, 0.8);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 41;
  animation: fade-in 200ms var(--ease);
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
}

.player {
  position: relative;
  /*
   * Constrained on both axes: the third term caps width by available height so
   * a 16:9 frame can never overflow a short landscape viewport.
   */
  width: min(880px, 92vw, calc(88dvh * 16 / 9));
  aspect-ratio: 16 / 9;
  background: #000;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--border-strong);
  box-shadow:
    0 20px 60px -12px rgba(0, 0, 0, 0.7),
    0 0 50px rgba(var(--glow-violet), 0.4);
}

.player iframe {
  width: 100%;
  height: 100%;
  border: 0;
}

.close-btn {
  position: absolute;
  top: -0.9rem;
  right: -0.9rem;
  width: 2.1rem;
  height: 2.1rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--accent-magenta);
  color: var(--text);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  transition: box-shadow 200ms var(--ease), transform 200ms var(--ease);
}

.close-btn:hover {
  box-shadow: 0 0 16px rgba(var(--glow-magenta), 0.6);
  transform: scale(1.06);
}

/*
 * The outset position gets clipped once the player spans most of the viewport,
 * so on small screens the button moves inside the frame.
 */
@media (max-width: 699.98px), (orientation: landscape) and (max-height: 500px) {
  .close-btn {
    top: 0.5rem;
    right: 0.5rem;
    width: 2.4rem;
    height: 2.4rem;
    background: rgba(6, 4, 15, 0.7);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }
}
</style>
