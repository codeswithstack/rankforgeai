# @rankforge/analytics

Keyword ranking tracker, indexing stats, crawl coverage, and traffic analytics.

## Install
```bash
npm install @rankforge/analytics
```

## Usage
```ts
import { KeywordTracker, RankingTrends, IndexingStats, CrawlAnalytics, TrafficAnalytics } from '@rankforge/analytics'

// Track keyword rankings over time
const tracker = new KeywordTracker()
tracker.record({ keyword: 'nextjs seo', rank: 5, date: '2024-01-01' })
tracker.record({ keyword: 'nextjs seo', rank: 3, date: '2024-02-01' })
const trend = tracker.getTrend('nextjs seo')
// { direction: 'up', change: 2, from: 5, to: 3 }

// Aggregate ranking stats
const trends = new RankingTrends([{ keyword: 'seo tool', rank: 3 }, { keyword: 'web vitals', rank: 8 }])
trends.averagePosition()    // 5.5
trends.percentageInTop10()  // 100

// Indexing stats
const indexing = new IndexingStats()
indexing.snapshot({ date: '2024-01-01', indexedCount: 450 })
indexing.snapshot({ date: '2024-02-01', indexedCount: 520 })
indexing.getChange() // { direction: 'up', absolute: 70, percentage: 15.5 }
```
