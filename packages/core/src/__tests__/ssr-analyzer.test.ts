import { describe, it, expect } from 'vitest'
import { SSRAnalyzer, analyzeSSR } from '../ssr-analyzer'

describe('SSRAnalyzer', () => {
  describe('SSR validation', () => {
    it('detects fully server-rendered page', () => {
      const html = `<html><head><title>SSR Page</title></head><body><h1>Content</h1></body></html>`
      const result = analyzeSSR(html)
      expect(result.isSSR).toBe(true)
      expect(result.hasContent).toBe(true)
    })

    it('detects client-side only page (empty body)', () => {
      const html = `<html><head><title>CSR Page</title></head><body><div id="root"></div></body></html>`
      const result = analyzeSSR(html)
      expect(result.isSSR).toBe(false)
      expect(result.hasContent).toBe(false)
    })

    it('detects Next.js data injection', () => {
      const html = `<html><body><script id="__NEXT_DATA__" type="application/json">{"props":{}}</script></body></html>`
      const result = analyzeSSR(html)
      expect(result.framework).toBe('nextjs')
    })

    it('detects Nuxt.js data injection', () => {
      const html = `<html><body><script>window.__NUXT__={}</script></body></html>`
      const result = analyzeSSR(html)
      expect(result.framework).toBe('nuxt')
    })

    it('detects SvelteKit rendered page', () => {
      const html = `<html><body data-sveltekit-preload-data="hover"></body></html>`
      const result = analyzeSSR(html)
      expect(result.framework).toBe('sveltekit')
    })
  })

  describe('hydration mismatch analysis', () => {
    it('detects text content mismatch', () => {
      const serverHTML = `<div>Server Time: 2024-01-01</div>`
      const clientHTML = `<div>Server Time: 2024-06-15</div>`
      const analyzer = new SSRAnalyzer()
      const mismatches = analyzer.findHydrationMismatches(serverHTML, clientHTML)
      expect(mismatches.length).toBeGreaterThan(0)
      expect(mismatches[0].type).toBe('text-content')
    })

    it('detects attribute mismatch', () => {
      const serverHTML = `<div class="server-class">Content</div>`
      const clientHTML = `<div class="client-class">Content</div>`
      const analyzer = new SSRAnalyzer()
      const mismatches = analyzer.findHydrationMismatches(serverHTML, clientHTML)
      expect(mismatches[0].type).toBe('attribute')
    })

    it('detects extra client-side elements', () => {
      const serverHTML = `<ul><li>Item 1</li></ul>`
      const clientHTML = `<ul><li>Item 1</li><li>Item 2</li></ul>`
      const analyzer = new SSRAnalyzer()
      const mismatches = analyzer.findHydrationMismatches(serverHTML, clientHTML)
      expect(mismatches[0].type).toBe('missing-node')
    })

    it('returns no mismatches for identical HTML', () => {
      const html = `<div class="test"><p>Same content</p></div>`
      const analyzer = new SSRAnalyzer()
      const mismatches = analyzer.findHydrationMismatches(html, html)
      expect(mismatches).toHaveLength(0)
    })
  })

  describe('route analysis', () => {
    it('extracts routes from Next.js pages directory', () => {
      const analyzer = new SSRAnalyzer()
      const files = [
        'pages/index.tsx',
        'pages/about.tsx',
        'pages/blog/[slug].tsx',
        'pages/products/[id]/reviews.tsx',
      ]
      const routes = analyzer.extractNextJsRoutes(files)
      expect(routes).toContain('/')
      expect(routes).toContain('/about')
      expect(routes).toContain('/blog/:slug')
      expect(routes).toContain('/products/:id/reviews')
    })

    it('extracts routes from App Router structure', () => {
      const analyzer = new SSRAnalyzer()
      const files = ['app/page.tsx', 'app/about/page.tsx', 'app/blog/[slug]/page.tsx']
      const routes = analyzer.extractAppRouterRoutes(files)
      expect(routes).toContain('/')
      expect(routes).toContain('/about')
      expect(routes).toContain('/blog/:slug')
    })
  })
})
