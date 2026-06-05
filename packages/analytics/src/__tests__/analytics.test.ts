import { describe, it, expect, vi } from 'vitest'
import {
  KeywordTracker,
  RankingTrends,
  IndexingStats,
  CrawlAnalytics,
  TrafficAnalytics,
} from '../analytics'

describe('Analytics', () => {
  describe('KeywordTracker', () => {
    it('tracks keyword ranking over time', () => {
      const tracker = new KeywordTracker()
      tracker.record({ keyword: 'seo tool', rank: 12, date: '2024-01-01' })
      tracker.record({ keyword: 'seo tool', rank: 8, date: '2024-02-01' })
      tracker.record({ keyword: 'seo tool', rank: 5, date: '2024-03-01' })
      const history = tracker.getHistory('seo tool')
      expect(history).toHaveLength(3)
      expect(history[2].rank).toBe(5)
    })

    it('detects ranking improvement', () => {
      const tracker = new KeywordTracker()
      tracker.record({ keyword: 'seo', rank: 20, date: '2024-01-01' })
      tracker.record({ keyword: 'seo', rank: 5, date: '2024-02-01' })
      const trend = tracker.getTrend('seo')
      expect(trend.direction).toBe('up')
      expect(trend.change).toBe(15)
    })

    it('detects ranking decline', () => {
      const tracker = new KeywordTracker()
      tracker.record({ keyword: 'seo', rank: 3, date: '2024-01-01' })
      tracker.record({ keyword: 'seo', rank: 18, date: '2024-02-01' })
      const trend = tracker.getTrend('seo')
      expect(trend.direction).toBe('down')
    })

    it('returns top ranking keywords', () => {
      const tracker = new KeywordTracker()
      tracker.record({ keyword: 'seo tool', rank: 3, date: '2024-01-01' })
      tracker.record({ keyword: 'performance audit', rank: 1, date: '2024-01-01' })
      tracker.record({ keyword: 'web vitals', rank: 8, date: '2024-01-01' })
      const top = tracker.getTopKeywords(2)
      expect(top[0].keyword).toBe('performance audit')
      expect(top[1].keyword).toBe('seo tool')
    })
  })

  describe('RankingTrends', () => {
    it('calculates average position across all keywords', () => {
      const trends = new RankingTrends([
        { keyword: 'a', rank: 4 },
        { keyword: 'b', rank: 8 },
        { keyword: 'c', rank: 12 },
      ])
      expect(trends.averagePosition()).toBe(8)
    })

    it('calculates percentage of keywords in top 10', () => {
      const trends = new RankingTrends([
        { keyword: 'a', rank: 3 },
        { keyword: 'b', rank: 7 },
        { keyword: 'c', rank: 15 },
        { keyword: 'd', rank: 22 },
      ])
      expect(trends.percentageInTop10()).toBe(50)
    })

    it('calculates percentage in top 3', () => {
      const trends = new RankingTrends([
        { keyword: 'a', rank: 1 },
        { keyword: 'b', rank: 3 },
        { keyword: 'c', rank: 5 },
      ])
      expect(trends.percentageInTop3()).toBeCloseTo(66.67, 1)
    })
  })

  describe('IndexingStats', () => {
    it('tracks indexed page count', () => {
      const stats = new IndexingStats()
      stats.snapshot({ date: '2024-01-01', indexedCount: 500 })
      stats.snapshot({ date: '2024-02-01', indexedCount: 520 })
      expect(stats.latest().indexedCount).toBe(520)
    })

    it('detects indexing drop', () => {
      const stats = new IndexingStats()
      stats.snapshot({ date: '2024-01-01', indexedCount: 1000 })
      stats.snapshot({ date: '2024-02-01', indexedCount: 750 })
      const change = stats.getChange()
      expect(change.percentage).toBe(-25)
      expect(change.direction).toBe('down')
    })

    it('detects indexing growth', () => {
      const stats = new IndexingStats()
      stats.snapshot({ date: '2024-01-01', indexedCount: 100 })
      stats.snapshot({ date: '2024-02-01', indexedCount: 150 })
      const change = stats.getChange()
      expect(change.percentage).toBe(50)
      expect(change.direction).toBe('up')
    })
  })

  describe('CrawlAnalytics', () => {
    it('reports crawl coverage percentage', () => {
      const analytics = new CrawlAnalytics({ totalPages: 100, crawledPages: 85 })
      expect(analytics.coverage()).toBe(85)
    })

    it('reports average crawl depth', () => {
      const analytics = new CrawlAnalytics({
        pages: [
          { url: '/a', depth: 0 },
          { url: '/b', depth: 1 },
          { url: '/c', depth: 2 },
          { url: '/d', depth: 3 },
        ],
      })
      expect(analytics.avgDepth()).toBe(1.5)
    })

    it('identifies deepest pages', () => {
      const analytics = new CrawlAnalytics({
        pages: [
          { url: '/shallow', depth: 1 },
          { url: '/deep/page', depth: 6 },
        ],
      })
      const deep = analytics.getDeepPages({ threshold: 5 })
      expect(deep).toContainEqual(expect.objectContaining({ url: '/deep/page' }))
    })
  })

  describe('TrafficAnalytics', () => {
    it('tracks organic traffic over time', () => {
      const analytics = new TrafficAnalytics()
      analytics.record({ date: '2024-01-01', sessions: 1000, source: 'organic' })
      analytics.record({ date: '2024-02-01', sessions: 1200, source: 'organic' })
      const growth = analytics.getGrowth('organic')
      expect(growth).toBe(20)
    })

    it('identifies top landing pages', () => {
      const analytics = new TrafficAnalytics()
      analytics.record({ date: '2024-01-01', sessions: 500, page: '/blog/seo-guide', source: 'organic' })
      analytics.record({ date: '2024-01-01', sessions: 200, page: '/about', source: 'organic' })
      analytics.record({ date: '2024-01-01', sessions: 800, page: '/', source: 'organic' })
      const top = analytics.getTopPages(2)
      expect(top[0].page).toBe('/')
      expect(top[1].page).toBe('/blog/seo-guide')
    })
  })
})
