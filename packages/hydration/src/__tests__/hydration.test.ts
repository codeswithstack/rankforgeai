import { describe, it, expect } from 'vitest'
import {
  detectHydrationMismatches,
  generateHydrationFix,
  analyzeLocaleMismatch,
  analyzeDateMismatch,
  suggestUseEffect,
  suggestDynamicImport,
} from '../hydration'

describe('Hydration', () => {
  describe('detectHydrationMismatches', () => {
    it('detects text node mismatch', () => {
      const result = detectHydrationMismatches(
        '<span>Server value</span>',
        '<span>Client value</span>'
      )
      expect(result.hasMismatches).toBe(true)
      expect(result.mismatches[0].type).toBe('text-content')
    })

    it('detects attribute mismatch', () => {
      const result = detectHydrationMismatches(
        '<div class="dark-mode">Content</div>',
        '<div class="light-mode">Content</div>'
      )
      expect(result.mismatches[0].type).toBe('attribute')
      expect(result.mismatches[0].attribute).toBe('class')
    })

    it('detects missing child node', () => {
      const result = detectHydrationMismatches(
        '<ul><li>A</li><li>B</li></ul>',
        '<ul><li>A</li></ul>'
      )
      expect(result.mismatches[0].type).toBe('extra-node')
    })

    it('returns no mismatches for identical HTML', () => {
      const html = '<div><p>Same</p></div>'
      const result = detectHydrationMismatches(html, html)
      expect(result.hasMismatches).toBe(false)
    })

    it('identifies component causing the mismatch', () => {
      const result = detectHydrationMismatches(
        '<div data-component="DateDisplay">2024-01-01</div>',
        '<div data-component="DateDisplay">2024-06-15</div>'
      )
      expect(result.mismatches[0].component).toBe('DateDisplay')
    })
  })

  describe('analyzeLocaleMismatch', () => {
    it('detects locale-dependent number formatting mismatch', () => {
      const mismatch = analyzeLocaleMismatch({
        server: '1,234.56',
        client: '1.234,56',
        context: 'number-format',
      })
      expect(mismatch.type).toBe('locale-number-format')
      expect(mismatch.fix).toBe('use-server-locale')
    })

    it('detects currency formatting mismatch', () => {
      const mismatch = analyzeLocaleMismatch({
        server: '$100',
        client: '€100',
        context: 'currency',
      })
      expect(mismatch.type).toBe('locale-currency')
    })
  })

  describe('analyzeDateMismatch', () => {
    it('detects timezone-caused date mismatch', () => {
      const mismatch = analyzeDateMismatch({
        server: '2024-01-01',
        client: '2023-12-31',
        timezone: 'America/New_York',
      })
      expect(mismatch.type).toBe('timezone-offset')
      expect(mismatch.fix).toBeDefined()
    })

    it('detects relative date mismatch (new Date())', () => {
      const serverDate = new Date('2024-01-01').toISOString()
      const clientDate = new Date().toISOString()
      const mismatch = analyzeDateMismatch({
        server: serverDate,
        client: clientDate,
        context: 'dynamic-date',
      })
      expect(mismatch.type).toBe('dynamic-date')
    })
  })

  describe('generateHydrationFix', () => {
    it('generates useEffect migration for dynamic content', () => {
      const fix = generateHydrationFix({
        type: 'dynamic-date',
        component: 'DateDisplay',
        code: 'const date = new Date().toLocaleDateString()',
      })
      expect(fix.code).toContain('useEffect')
      expect(fix.code).toContain('useState')
    })

    it('generates suppressHydrationWarning for intentional mismatches', () => {
      const fix = generateHydrationFix({
        type: 'intentional',
        component: 'ClientOnlyWidget',
      })
      expect(fix.code).toContain('suppressHydrationWarning')
    })

    it('generates dynamic import for client-only component', () => {
      const fix = generateHydrationFix({
        type: 'client-only-component',
        component: 'Map',
        importPath: './Map',
      })
      expect(fix.code).toContain('dynamic')
      expect(fix.code).toContain('ssr: false')
    })
  })

  describe('suggestUseEffect', () => {
    it('wraps state initialization in useEffect', () => {
      const original = `const value = window.localStorage.getItem('key')`
      const fixed = suggestUseEffect(original, 'value')
      expect(fixed).toContain('useEffect')
      expect(fixed).toContain('useState')
      expect(fixed).toContain('null')
    })
  })

  describe('suggestDynamicImport', () => {
    it('generates Next.js dynamic import snippet', () => {
      const snippet = suggestDynamicImport('HeavyChart', './HeavyChart')
      expect(snippet).toContain("import('./HeavyChart')")
      expect(snippet).toContain('ssr: false')
    })
  })
})
