import { describe, it, expect, vi } from 'vitest'
import { detectTTFBIssues, generateTTFBFixes, calculateTTFBScore } from '../ttfb'

describe('TTFB Optimization', () => {
  describe('detectTTFBIssues', () => {
    it('detects slow TTFB from server', () => {
      const serverProfile = {
        ttfb: 900,
        dbQueryTime: 50,
        middlewareTime: 20,
        cacheHit: false,
      }
      const issues = detectTTFBIssues(serverProfile)
      expect(issues).toContainEqual(expect.objectContaining({ type: 'slow-ttfb' }))
    })

    it('detects cache miss', () => {
      const serverProfile = {
        ttfb: 600,
        dbQueryTime: 300,
        middlewareTime: 20,
        cacheHit: false,
      }
      const issues = detectTTFBIssues(serverProfile)
      expect(issues).toContainEqual(expect.objectContaining({ type: 'cache-miss' }))
    })

    it('detects slow database query', () => {
      const serverProfile = {
        ttfb: 700,
        dbQueryTime: 600,
        middlewareTime: 20,
        cacheHit: false,
        queries: [{ sql: 'SELECT *', duration: 600, hasIndex: false }],
      }
      const issues = detectTTFBIssues(serverProfile)
      expect(issues).toContainEqual(expect.objectContaining({ type: 'slow-db-query' }))
    })

    it('detects middleware bottleneck', () => {
      const serverProfile = {
        ttfb: 500,
        dbQueryTime: 50,
        middlewareTime: 400,
        cacheHit: true,
      }
      const issues = detectTTFBIssues(serverProfile)
      expect(issues).toContainEqual(expect.objectContaining({ type: 'middleware-bottleneck' }))
    })

    it('passes for fast TTFB with cache hit', () => {
      const serverProfile = {
        ttfb: 100,
        dbQueryTime: 20,
        middlewareTime: 10,
        cacheHit: true,
      }
      const issues = detectTTFBIssues(serverProfile)
      expect(issues.filter(i => i.severity === 'critical')).toHaveLength(0)
    })
  })

  describe('generateTTFBFixes', () => {
    it('suggests Redis caching for cache miss', () => {
      const fix = generateTTFBFixes({
        type: 'cache-miss',
        element: { route: '/api/products' },
      })
      expect(fix.suggestion).toMatch(/cache|redis/i)
    })

    it('suggests edge rendering for slow TTFB', () => {
      const fix = generateTTFBFixes({
        type: 'slow-ttfb',
        element: { route: '/page', region: 'us-east' },
      })
      expect(fix.suggestion).toMatch(/edge|cdn/i)
    })

    it('suggests DB index for slow query', () => {
      const fix = generateTTFBFixes({
        type: 'slow-db-query',
        element: { table: 'products', column: 'category' },
      })
      expect(fix.suggestion).toMatch(/index/i)
    })
  })

  describe('calculateTTFBScore', () => {
    it('returns 100 for TTFB < 100ms', () => {
      expect(calculateTTFBScore(80)).toBe(100)
    })

    it('returns > 90 for TTFB < 300ms', () => {
      expect(calculateTTFBScore(200)).toBeGreaterThanOrEqual(90)
    })

    it('returns < 50 for TTFB > 800ms', () => {
      expect(calculateTTFBScore(900)).toBeLessThan(50)
    })
  })
})
