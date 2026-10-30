import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { mockCredentialsApi } from './server/mockCredentialsApi.ts'

export default defineConfig({
  plugins: [react(), mockCredentialsApi()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})
