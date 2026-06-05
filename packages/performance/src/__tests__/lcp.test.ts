import { describe, it, expect } from 'vitest'
import { detectLCPIssues, generateLCPFixes, calculateLCPScore } from '../lcp'

describe('LCP Optimization', () => {
  describe('detectLCPIssues', () => {
    it('detects oversized hero image', () => {
      const page = {
        images: [{ src: '/hero.png', size: 2_500_000, width: 1920, height: 1080, isAboveFold: true }],
        scripts: [],
        stylesheets: [],
      }
      const issues = detectLCPIssues(page)
      expect(issues).toContainEqual(expect.objectContaining({ type: 'large-image', severity: 'critical' }))
    })

    it('detects render-blocking scripts', () => {
      const page = {
        images: [],
        scripts: [{ src: '/bundle.js', isAsync: false, isDefer: false, isInHead: true }],
        stylesheets: [],
      }
      const issues = detectLCPIssues(page)
      expect(issues).toContainEqual(expect.objectContaining({ type: 'blocking-script' }))
    })

    it('detects render-blocking CSS', () => {
      const page = {
        images: [],
        scripts: [],
        stylesheets: [{ href: '/styles.css', media: 'all', hasPreload: false }],
      }
      const issues = detectLCPIssues(page)
      expect(issues).toContainEqual(expect.objectContaining({ type: 'blocking-css' }))
    })

    it('does not flag async/defer scripts', () => {
      const page = {
        images: [],
        scripts: [{ src: '/bundle.js', isAsync: true, isDefer: false, isInHead: true }],
        stylesheets: [],
      }
      const issues = detectLCPIssues(page)
      const blockingIssues = issues.filter(i => i.type === 'blocking-script')
      expect(blockingIssues).toHaveLength(0)
    })

    it('detects missing priority on LCP image', () => {
      const page = {
        images: [{ src: '/hero.jpg', isAboveFold: true, hasPriority: false, isLCP: true }],
        scripts: [],
        stylesheets: [],
      }
      const issues = detectLCPIssues(page)
      expect(issues).toContainEqual(expect.objectContaining({ type: 'missing-priority' }))
    })
  })

  describe('generateLCPFixes', () => {
    it('generates image optimization fix', () => {
      const fix = generateLCPFixes({
        type: 'large-image',
        element: { src: '/hero.png', size: 2_000_000 },
      })
      expect(fix.code).toContain('priority')
      expect(fix.code).toContain('avif')
    })

    it('generates preload fix for blocking CSS', () => {
      const fix = generateLCPFixes({
        type: 'blocking-css',
        element: { href: '/styles.css' },
      })
      expect(fix.code).toContain('rel="preload"')
    })

    it('generates async attribute fix for blocking script', () => {
      const fix = generateLCPFixes({
        type: 'blocking-script',
        element: { src: '/bundle.js' },
      })
      expect(fix.code).toContain('async')
    })
  })

  describe('calculateLCPScore', () => {
    it('returns score 100 for LCP < 1.2s', () => {
      expect(calculateLCPScore(1100)).toBe(100)
    })

    it('returns score > 90 for LCP < 2.5s', () => {
      expect(calculateLCPScore(2000)).toBeGreaterThanOrEqual(90)
    })

    it('returns score < 50 for LCP > 4s', () => {
      expect(calculateLCPScore(4100)).toBeLessThan(50)
    })

    it('returns score 0 for LCP > 6s', () => {
      expect(calculateLCPScore(6100)).toBe(0)
    })
  })
})
