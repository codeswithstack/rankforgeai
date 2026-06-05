import { describe, it, expect } from 'vitest'
import {
  EdgeSEOOptimizer,
  detectGeoSEO,
  generateCDNCacheHeaders,
  analyzeEdgeRendering,
} from '../edge'

describe('Edge Optimization', () => {
  describe('EdgeSEOOptimizer', () => {
    it('rewrites meta tags at edge based on geo', () => {
      const optimizer = new EdgeSEOOptimizer()
      const result = optimizer.rewriteMetaTags({
        html: '<html><head><title>Our Services</title></head></html>',
        geo: { country: 'FR', language: 'fr' },
        translations: { FR: { title: 'Nos Services' } },
      })
      expect(result).toContain('Nos Services')
    })

    it('injects hreflang at edge for missing tags', () => {
      const optimizer = new EdgeSEOOptimizer()
      const result = optimizer.injectHreflang({
        html: '<html><head><title>Page</title></head></html>',
        locales: [
          { hreflang: 'en', href: 'https://example.com/en' },
          { hreflang: 'fr', href: 'https://example.com/fr' },
        ],
      })
      expect(result).toContain('hreflang="en"')
      expect(result).toContain('hreflang="fr"')
    })

    it('adds canonical header at edge', () => {
      const optimizer = new EdgeSEOOptimizer()
      const headers = optimizer.getCanonicalHeaders('https://example.com/page')
      expect(headers['Link']).toContain('rel="canonical"')
      expect(headers['Link']).toContain('https://example.com/page')
    })
  })

  describe('detectGeoSEO', () => {
    it('detects missing geo targeting for multi-region site', () => {
      const result = detectGeoSEO({
        targetRegions: ['US', 'UK', 'AU'],
        hasHreflang: false,
        hasGeoMeta: false,
      })
      expect(result.issues).toContainEqual(expect.objectContaining({ type: 'missing-hreflang' }))
    })

    it('suggests CDN configuration for edge delivery', () => {
      const result = detectGeoSEO({
        targetRegions: ['US', 'EU', 'APAC'],
        serverRegion: 'us-east-1',
        hasCDN: false,
      })
      expect(result.suggestions).toContainEqual(expect.objectContaining({ type: 'add-cdn' }))
    })
  })

  describe('generateCDNCacheHeaders', () => {
    it('generates appropriate cache headers for static pages', () => {
      const headers = generateCDNCacheHeaders({ pageType: 'static', ttl: 3600 })
      expect(headers['Cache-Control']).toContain('max-age=3600')
      expect(headers['Cache-Control']).toContain('public')
    })

    it('generates no-store for personalized pages', () => {
      const headers = generateCDNCacheHeaders({ pageType: 'personalized' })
      expect(headers['Cache-Control']).toContain('no-store')
    })

    it('generates stale-while-revalidate for blog pages', () => {
      const headers = generateCDNCacheHeaders({ pageType: 'blog', ttl: 3600, swr: 86400 })
      expect(headers['Cache-Control']).toContain('stale-while-revalidate=86400')
    })

    it('sets CDN-specific headers for Cloudflare', () => {
      const headers = generateCDNCacheHeaders({ pageType: 'static', ttl: 3600, cdn: 'cloudflare' })
      expect(headers['CDN-Cache-Control']).toBeDefined()
    })
  })

  describe('analyzeEdgeRendering', () => {
    it('detects ISR configuration in Next.js', () => {
      const config = {
        framework: 'nextjs',
        pages: [
          { path: '/blog/[slug]', revalidate: 60 },
          { path: '/products', revalidate: 0 },
        ],
      }
      const result = analyzeEdgeRendering(config)
      expect(result.isrPages).toHaveLength(1)
    })

    it('suggests ISR for frequently updated pages', () => {
      const config = {
        framework: 'nextjs',
        pages: [{ path: '/news', renderMode: 'SSR', avgUpdateFrequency: 'hourly' }],
      }
      const result = analyzeEdgeRendering(config)
      expect(result.suggestions).toContainEqual(expect.objectContaining({ type: 'use-isr' }))
    })
  })
})
