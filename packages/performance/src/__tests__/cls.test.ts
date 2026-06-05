import { describe, it, expect } from 'vitest'
import { detectCLSIssues, generateCLSFixes, calculateCLSScore } from '../cls'

describe('CLS Optimization', () => {
  describe('detectCLSIssues', () => {
    it('detects images without dimensions', () => {
      const page = {
        images: [{ src: '/photo.jpg', hasWidth: false, hasHeight: false }],
        fonts: [],
        ads: [],
      }
      const issues = detectCLSIssues(page)
      expect(issues).toContainEqual(expect.objectContaining({ type: 'missing-dimensions', element: 'img' }))
    })

    it('does not flag images with both dimensions set', () => {
      const page = {
        images: [{ src: '/photo.jpg', hasWidth: true, hasHeight: true }],
        fonts: [],
        ads: [],
      }
      const issues = detectCLSIssues(page)
      const dimIssues = issues.filter(i => i.type === 'missing-dimensions')
      expect(dimIssues).toHaveLength(0)
    })

    it('detects font swap layout shift', () => {
      const page = {
        images: [],
        fonts: [{ family: 'CustomFont', display: 'swap', hasPreload: false }],
        ads: [],
      }
      const issues = detectCLSIssues(page)
      expect(issues).toContainEqual(expect.objectContaining({ type: 'font-swap-shift' }))
    })

    it('detects dynamic content insertion above viewport', () => {
      const page = {
        images: [],
        fonts: [],
        dynamicElements: [{ position: 'top', insertedAfterLoad: true }],
      }
      const issues = detectCLSIssues(page)
      expect(issues).toContainEqual(expect.objectContaining({ type: 'dynamic-insertion' }))
    })

    it('detects missing aspect-ratio on iframes', () => {
      const page = {
        iframes: [{ src: 'https://youtube.com/embed/xyz', hasAspectRatio: false }],
      }
      const issues = detectCLSIssues(page)
      expect(issues).toContainEqual(expect.objectContaining({ type: 'missing-aspect-ratio' }))
    })
  })

  describe('generateCLSFixes', () => {
    it('adds width and height to image', () => {
      const fix = generateCLSFixes({
        type: 'missing-dimensions',
        element: { tag: 'img', src: '/photo.jpg', naturalWidth: 800, naturalHeight: 600 },
      })
      expect(fix.code).toContain('width={800}')
      expect(fix.code).toContain('height={600}')
    })

    it('adds skeleton loader for dynamic content', () => {
      const fix = generateCLSFixes({
        type: 'dynamic-insertion',
        element: { selector: '.banner', estimatedHeight: 80 },
      })
      expect(fix.code).toContain('min-height')
    })

    it('generates font preload fix', () => {
      const fix = generateCLSFixes({
        type: 'font-swap-shift',
        element: { family: 'Roboto', src: '/fonts/roboto.woff2' },
      })
      expect(fix.code).toContain('preload')
      expect(fix.code).toContain('font/woff2')
    })
  })

  describe('calculateCLSScore', () => {
    it('returns score 100 for CLS = 0', () => {
      expect(calculateCLSScore(0)).toBe(100)
    })

    it('returns score > 95 for CLS < 0.1', () => {
      expect(calculateCLSScore(0.05)).toBeGreaterThanOrEqual(95)
    })

    it('returns score < 50 for CLS > 0.25', () => {
      expect(calculateCLSScore(0.3)).toBeLessThan(50)
    })
  })
})
