// vite.config.ts
import { defineConfig } from 'vitest/config'
// import vue from '@vitejs/plugin-vue'

export default defineConfig({
    test: {
        include: ['src/**/*.test.{ts,tsx}'],
        environment: 'happy-dom',
        globals: true,
    },
    //   plugins: [vue()],
})