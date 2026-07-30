<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  export: []
  import: [text: string]
  reset: []
}>()

const fileInput = ref<HTMLInputElement | null>(null)

function triggerImport(): void {
  fileInput.value?.click()
}

function onFileChange(event: Event): void {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => emit('import', String(reader.result))
  reader.readAsText(file)
  ;(event.target as HTMLInputElement).value = ''
}

function onReset(): void {
  if (confirm('Reset your list back to the original seed data? Your current entries will be lost.')) {
    emit('reset')
  }
}
</script>

<template>
  <div class="toolbar">
    <button class="btn" @click="emit('export')">Export JSON</button>
    <button class="btn" @click="triggerImport">Import JSON</button>
    <input ref="fileInput" type="file" accept="application/json" class="hidden-input" @change="onFileChange" />
    <button class="btn btn-danger" @click="onReset">Reset to seed</button>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  gap: 0.6rem;
}

.hidden-input {
  display: none;
}
</style>
