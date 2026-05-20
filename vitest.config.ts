import { defineConfig } from 'vitest/config'

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react'
  },
  test: {
    globals: true,
    css: true,
    environment: 'jsdom',
    exclude: ['node_modules', 'tests/e2e']
  }
})
