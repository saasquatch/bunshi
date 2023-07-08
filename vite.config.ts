// vite.config.ts
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        include: ['src/**/*.test.{ts,tsx}'],
        environment: 'happy-dom',
        globals: true,
    },
    plugins: [vue()],
})