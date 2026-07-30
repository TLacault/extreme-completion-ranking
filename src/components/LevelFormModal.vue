<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { Level } from '../types'

const props = defineProps<{
  level: Level | null
}>()

const emit = defineEmits<{
  save: [payload: Omit<Level, 'id' | 'rank'>]
  close: []
}>()

function blankForm(): Omit<Level, 'id' | 'rank'> {
  return {
    name: '',
    aredlRank: null,
    dlRank: null,
    attempts: null,
    attemptsNote: '',
    date: null,
    dateNote: '',
    enjoyment: null,
    creator: '',
    videoUrl: '',
    levelId: '',
    notes: '',
  }
}

const form = reactive(props.level ? { ...props.level } : blankForm())

watch(
  () => props.level,
  (level) => {
    Object.assign(form, level ? { ...level } : blankForm())
  },
)

function toNullableNumber(value: string): number | null {
  return value === '' ? null : Number(value)
}

function onSubmit(): void {
  if (!form.name.trim()) return
  const { id: _id, rank: _rank, ...payload } = form as Level
  emit('save', payload)
}
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="modal">
      <h2>{{ level ? 'Edit level' : 'Add level' }}</h2>
      <form @submit.prevent="onSubmit">
        <label>
          Name *
          <input v-model="form.name" type="text" required />
        </label>
        <label>
          Creator
          <input v-model="form.creator" type="text" />
        </label>
        <div class="row">
          <label>
            AREDL rank
            <input
              :value="form.aredlRank ?? ''"
              @input="form.aredlRank = toNullableNumber(($event.target as HTMLInputElement).value)"
              type="number"
            />
          </label>
          <label>
            DL rank
            <input
              :value="form.dlRank ?? ''"
              @input="form.dlRank = toNullableNumber(($event.target as HTMLInputElement).value)"
              type="number"
            />
          </label>
        </div>
        <div class="row">
          <label>
            Attempts
            <input
              :value="form.attempts ?? ''"
              @input="form.attempts = toNullableNumber(($event.target as HTMLInputElement).value)"
              type="number"
            />
          </label>
          <label>
            Attempts note
            <input v-model="form.attemptsNote" type="text" placeholder="e.g. lost, prolly 5k+" />
          </label>
        </div>
        <div class="row">
          <label>
            Date
            <input v-model="form.date" type="date" />
          </label>
          <label>
            Date note
            <input v-model="form.dateNote" type="text" placeholder="e.g. il y a 2 ans" />
          </label>
        </div>
        <label>
          Enjoyment (0-10)
          <input
            :value="form.enjoyment ?? ''"
            @input="form.enjoyment = toNullableNumber(($event.target as HTMLInputElement).value)"
            type="number"
            min="0"
            max="10"
          />
        </label>
        <label>
          Video URL
          <input v-model="form.videoUrl" type="text" />
        </label>
        <label>
          Level ID
          <input v-model="form.levelId" type="text" />
        </label>
        <label>
          Notes
          <textarea v-model="form.notes" rows="3"></textarea>
        </label>
        <div class="actions">
          <button type="button" class="btn" @click="emit('close')">Cancel</button>
          <button type="submit" class="btn btn-primary">Save</button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 6, 18, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.modal {
  background: var(--surface-raised);
  border-top: 3px solid var(--accent-violet);
  border-radius: var(--radius);
  padding: 1.5rem;
  width: min(520px, 90vw);
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 0 32px rgba(123, 47, 247, 0.35);
}

.modal h2 {
  font-family: var(--font-display);
  margin-top: 0;
}

form {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

label {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: 0.8rem;
  color: var(--text-muted);
}

input,
textarea {
  padding: 0.4rem 0.6rem;
  font-size: 0.9rem;
  color: var(--text);
}

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.8rem;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  margin-top: 0.5rem;
}
</style>
