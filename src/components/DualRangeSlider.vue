<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    minValue: number | null
    maxValue: number | null
    min?: number
    max?: number
    step?: number
  }>(),
  { min: 0, max: 100, step: 1 },
)

const emit = defineEmits<{
  'update:minValue': [value: number | null]
  'update:maxValue': [value: number | null]
}>()

const THUMB_SIZE = 16

const effectiveMin = computed(() => props.minValue ?? props.min)
const effectiveMax = computed(() => props.maxValue ?? props.max)

function setMin(raw: string): void {
  if (raw === '') {
    emit('update:minValue', null)
    return
  }
  const value = Math.min(Number(raw), effectiveMax.value)
  emit('update:minValue', value)
}

function setMax(raw: string): void {
  if (raw === '') {
    emit('update:maxValue', null)
    return
  }
  const value = Math.max(Number(raw), effectiveMin.value)
  emit('update:maxValue', value)
}

const minFraction = computed(() => (effectiveMin.value - props.min) / (props.max - props.min))
const maxFraction = computed(() => (effectiveMax.value - props.min) / (props.max - props.min))

const fillLeftStyle = computed(
  () => `calc(${THUMB_SIZE / 2}px + (100% - ${THUMB_SIZE}px) * ${minFraction.value})`,
)
const fillWidthStyle = computed(
  () => `calc((100% - ${THUMB_SIZE}px) * ${maxFraction.value - minFraction.value})`,
)
</script>

<template>
  <div class="dual-range">
    <input
      class="range-number"
      type="number"
      :min="min"
      :max="max"
      :value="minValue ?? ''"
      placeholder="min"
      @input="setMin(($event.target as HTMLInputElement).value)"
    />
    <div class="dual-track">
      <div class="dual-track-bg"></div>
      <div class="dual-track-fill" :style="{ left: fillLeftStyle, width: fillWidthStyle }"></div>
      <input
        class="dual-thumb"
        type="range"
        :min="min"
        :max="max"
        :step="step"
        :value="effectiveMin"
        @input="setMin(($event.target as HTMLInputElement).value)"
      />
      <input
        class="dual-thumb"
        type="range"
        :min="min"
        :max="max"
        :step="step"
        :value="effectiveMax"
        @input="setMax(($event.target as HTMLInputElement).value)"
      />
    </div>
    <input
      class="range-number"
      type="number"
      :min="min"
      :max="max"
      :value="maxValue ?? ''"
      placeholder="max"
      @input="setMax(($event.target as HTMLInputElement).value)"
    />
  </div>
</template>

<style scoped>
.dual-range {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.range-number {
  width: 4rem;
  flex-shrink: 0;
}

.dual-track {
  position: relative;
  flex: 1;
  height: 20px;
}

.dual-track-bg {
  position: absolute;
  top: 50%;
  left: 8px;
  right: 8px;
  height: 6px;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  box-shadow: inset 0 0 0 1px var(--border);
}

.dual-track-fill {
  position: absolute;
  top: 50%;
  height: 6px;
  transform: translateY(-50%);
  background: linear-gradient(90deg, var(--accent-violet), var(--accent-magenta));
  border-radius: 999px;
}

.dual-thumb {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 20px;
  margin: 0;
  background: transparent;
  pointer-events: none;
  -webkit-appearance: none;
  appearance: none;
}

.dual-thumb::-webkit-slider-runnable-track {
  background: transparent;
}

.dual-thumb::-webkit-slider-thumb {
  pointer-events: auto;
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  margin-top: 2px;
  border-radius: 50%;
  background: var(--accent-lime);
  box-shadow: 0 0 8px rgba(var(--glow-lime), 0.8);
  cursor: pointer;
  border: none;
}

.dual-thumb::-moz-range-track {
  background: transparent;
}

.dual-thumb::-moz-range-thumb {
  pointer-events: auto;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--accent-lime);
  box-shadow: 0 0 8px rgba(var(--glow-lime), 0.8);
  cursor: pointer;
  border: none;
}
</style>
