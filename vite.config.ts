/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/extreme-completion-ranking/',
  plugins: [vue()],
  test: {
    environment: 'jsdom',
  },
})
