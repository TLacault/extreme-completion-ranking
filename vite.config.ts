/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/extreme-tracker/',
  plugins: [vue()],
  test: {
    environment: 'jsdom',
  },
})
