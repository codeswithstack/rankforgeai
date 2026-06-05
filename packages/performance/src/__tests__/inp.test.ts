import { describe, it, expect } from 'vitest'
import { detectINPIssues, generateINPFixes, calculateINPScore } from '../inp'

describe('INP Optimization', () => {
  describe('detectINPIssues', () => {
    it('detects long tasks blocking main thread', () => {
      const profile = {
        tasks: [{ duration: 300, type: 'script', source: 'analytics.js' }],
        eventListeners: [],
        rerenders: [],
      }
      const issues = detectINPIssues(profile)
      expect(issues).toContainEqual(expect.objectContaining({ type: 'long-task' }))
    })

    it('does not flag tasks under 50ms', () => {
      const profile = {
        tasks: [{ duration: 40, type: 'script' }],
        eventListeners: [],
        rerenders: [],
      }
      const issues = detectINPIssues(profile)
      expect(issues.filter(i => i.type === 'long-task')).toHaveLength(0)
    })

    it('detects blocking event listeners', () => {
      const profile = {
        tasks: [],
        eventListeners: [
          { event: 'scroll', isThrottled: false, isPassive: false, duration: 200 },
        ],
        rerenders: [],
      }
      const issues = detectINPIssues(profile)
      expect(issues).toContainEqual(expect.objectContaining({ type: 'blocking-listener' }))
    })

    it('detects excessive rerenders', () => {
      const profile = {
        tasks: [],
        eventListeners: [],
        rerenders: [{ component: 'HeavyList', count: 15, avgDuration: 40 }],
      }
      const issues = detectINPIssues(profile)
      expect(issues).toContainEqual(expect.objectContaining({ type: 'excessive-rerenders' }))
    })
  })

  describe('generateINPFixes', () => {
    it('suggests memoization for excessive rerenders', () => {
      const fix = generateINPFixes({
        type: 'excessive-rerenders',
        element: { component: 'HeavyList' },
      })
      expect(fix.code).toContain('memo')
    })

    it('suggests throttle for scroll listener', () => {
      const fix = generateINPFixes({
        type: 'blocking-listener',
        element: { event: 'scroll', handler: 'onScroll' },
      })
      expect(fix.code).toMatch(/throttle|passive/)
    })

    it('suggests dynamic import for heavy component', () => {
      const fix = generateINPFixes({
        type: 'long-task',
        element: { source: 'HeavyChart', isComponent: true },
      })
      expect(fix.code).toContain('dynamic')
    })
  })

  describe('calculateINPScore', () => {
    it('returns 100 for INP < 200ms', () => {
      expect(calculateINPScore(150)).toBe(100)
    })

    it('returns > 90 for INP < 500ms', () => {
      expect(calculateINPScore(400)).toBeGreaterThanOrEqual(90)
    })

    it('returns < 50 for INP > 500ms', () => {
      expect(calculateINPScore(600)).toBeLessThan(50)
    })
  })
})
