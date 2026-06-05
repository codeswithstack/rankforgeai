import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@rankforge-root/core': resolve(__dirname, 'packages/core/src/index.ts'),
      '@rankforge-root/meta': resolve(__dirname, 'packages/meta/src/index.ts'),
      '@rankforge-root/schema': resolve(__dirname, 'packages/schema/src/index.ts'),
      '@rankforge-root/sitemap': resolve(__dirname, 'packages/sitemap/src/index.ts'),
      '@rankforge-root/i18n': resolve(__dirname, 'packages/i18n/src/index.ts'),
      '@rankforge-root/performance': resolve(__dirname, 'packages/performance/src/index.ts'),
      '@rankforge-root/hydration': resolve(__dirname, 'packages/hydration/src/index.ts'),
      '@rankforge-root/audit': resolve(__dirname, 'packages/audit/src/index.ts'),
      '@rankforge-root/images': resolve(__dirname, 'packages/images/src/index.ts'),
      '@rankforge-root/monitor': resolve(__dirname, 'packages/monitor/src/index.ts'),
      '@rankforge-root/security': resolve(__dirname, 'packages/security/src/index.ts'),
      '@rankforge-root/ai': resolve(__dirname, 'packages/ai/src/index.ts'),
      '@rankforge-root/analytics': resolve(__dirname, 'packages/analytics/src/index.ts'),
      '@rankforge-root/edge': resolve(__dirname, 'packages/edge/src/index.ts'),
      '@rankforge-root/cli': resolve(__dirname, 'packages/cli/src/index.ts'),
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
