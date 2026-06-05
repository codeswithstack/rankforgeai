import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@rankforge/core': resolve(__dirname, 'packages/core/src/index.ts'),
      '@rankforge/meta': resolve(__dirname, 'packages/meta/src/index.ts'),
      '@rankforge/schema': resolve(__dirname, 'packages/schema/src/index.ts'),
      '@rankforge/sitemap': resolve(__dirname, 'packages/sitemap/src/index.ts'),
      '@rankforge/i18n': resolve(__dirname, 'packages/i18n/src/index.ts'),
      '@rankforge/performance': resolve(__dirname, 'packages/performance/src/index.ts'),
      '@rankforge/hydration': resolve(__dirname, 'packages/hydration/src/index.ts'),
      '@rankforge/audit': resolve(__dirname, 'packages/audit/src/index.ts'),
      '@rankforge/images': resolve(__dirname, 'packages/images/src/index.ts'),
      '@rankforge/monitor': resolve(__dirname, 'packages/monitor/src/index.ts'),
      '@rankforge/security': resolve(__dirname, 'packages/security/src/index.ts'),
      '@rankforge/ai': resolve(__dirname, 'packages/ai/src/index.ts'),
      '@rankforge/analytics': resolve(__dirname, 'packages/analytics/src/index.ts'),
      '@rankforge/edge': resolve(__dirname, 'packages/edge/src/index.ts'),
      '@rankforge/cli': resolve(__dirname, 'packages/cli/src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['packages/*/src/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/node_modules/**', '**/dist/**'],
    },
  },
})
