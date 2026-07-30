<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

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
      <button class="close-btn" @click="emit('close')" aria-label="Close video">&times;</button>
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
  background: rgba(10, 6, 18, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
}

.player {
  position: relative;
  width: min(880px, 92vw);
  aspect-ratio: 16 / 9;
  background: #000;
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: 0 0 40px rgba(123, 47, 247, 0.45);
}

.player iframe {
  width: 100%;
  height: 100%;
  border: 0;
}

.close-btn {
  position: absolute;
  top: -0.5rem;
  right: -0.5rem;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: var(--surface-raised);
  border: 1px solid var(--accent-magenta);
  color: var(--text);
  font-size: 1.2rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.close-btn:hover {
  box-shadow: 0 0 12px rgba(255, 61, 154, 0.6);
}
</style>
