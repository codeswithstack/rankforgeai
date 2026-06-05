// ─── Keyword Tracker ──────────────────────────────────────────────────────────
export interface RankEntry {
  keyword: string
  rank: number
  date: string
  url?: string
}

export interface TrendResult {
  direction: 'up' | 'down' | 'stable'
  change: number
  from: number
  to: number
}

export class KeywordTracker {
  private history = new Map<string, RankEntry[]>()

  record(entry: RankEntry): void {
    const entries = this.history.get(entry.keyword) || []
    entries.push(entry)
    entries.sort((a, b) => a.date.localeCompare(b.date))
    this.history.set(entry.keyword, entries)
  }

  getHistory(keyword: string): RankEntry[] {
    return this.history.get(keyword) || []
  }

  getTrend(keyword: string): TrendResult {
    const entries = this.getHistory(keyword)
    if (entries.length < 2) return { direction: 'stable', change: 0, from: 0, to: 0 }
    const from = entries[0]!.rank
    const to = entries[entries.length - 1]!.rank
    const change = from - to // positive = improved (lower rank number = better)
    return {
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      change: Math.abs(change),
      from,
      to,
    }
  }

  getTopKeywords(n: number): RankEntry[] {
    const latest = new Map<string, RankEntry>()
    for (const [keyword, entries] of this.history) {
      const last = entries[entries.length - 1]
      if (last) latest.set(keyword, last)
    }
    return [...latest.values()]
      .sort((a, b) => a.rank - b.rank)
      .slice(0, n)
  }
}

// ─── Ranking Trends ───────────────────────────────────────────────────────────
export class RankingTrends {
  constructor(private keywords: Array<{ keyword: string; rank: number }>) {}

  averagePosition(): number {
    if (!this.keywords.length) return 0
    return this.keywords.reduce((sum, k) => sum + k.rank, 0) / this.keywords.length
  }

  percentageInTop10(): number {
    if (!this.keywords.length) return 0
    return (this.keywords.filter(k => k.rank <= 10).length / this.keywords.length) * 100
  }

  percentageInTop3(): number {
    if (!this.keywords.length) return 0
    return (this.keywords.filter(k => k.rank <= 3).length / this.keywords.length) * 100
  }
}

// ─── Indexing Stats ───────────────────────────────────────────────────────────
export interface IndexSnapshot {
  date: string
  indexedCount: number
}

export interface IndexChange {
  percentage: number
  direction: 'up' | 'down' | 'stable'
  absolute: number
  from: number
  to: number
}

export class IndexingStats {
  private snapshots: IndexSnapshot[] = []

  snapshot(s: IndexSnapshot): void {
    this.snapshots.push(s)
    this.snapshots.sort((a, b) => a.date.localeCompare(b.date))
  }

  latest(): IndexSnapshot {
    return this.snapshots[this.snapshots.length - 1]!
  }

  getChange(): IndexChange {
    if (this.snapshots.length < 2) return { percentage: 0, direction: 'stable', absolute: 0, from: 0, to: 0 }
    const from = this.snapshots[0]!.indexedCount
    const to = this.snapshots[this.snapshots.length - 1]!.indexedCount
    const absolute = to - from
    const percentage = ((to - from) / from) * 100
    return {
      percentage,
      direction: percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'stable',
      absolute,
      from,
      to,
    }
  }
}

// ─── Crawl Analytics ─────────────────────────────────────────────────────────
export interface CrawlPage {
  url: string
  depth: number
  status?: number
}

export interface CrawlAnalyticsInput {
  totalPages?: number
  crawledPages?: number
  pages?: CrawlPage[]
}

export class CrawlAnalytics {
  private input: CrawlAnalyticsInput

  constructor(input: CrawlAnalyticsInput) {
    this.input = input
  }

  coverage(): number {
    const { totalPages, crawledPages } = this.input
    if (!totalPages || !crawledPages) return 0
    return (crawledPages / totalPages) * 100
  }

  avgDepth(): number {
    const pages = this.input.pages
    if (!pages || !pages.length) return 0
    return pages.reduce((sum, p) => sum + p.depth, 0) / pages.length
  }

  getDeepPages(options: { threshold: number }): CrawlPage[] {
    return (this.input.pages || []).filter(p => p.depth > options.threshold)
  }
}

// ─── Traffic Analytics ────────────────────────────────────────────────────────
export interface TrafficEntry {
  date: string
  sessions: number
  source: string
  page?: string
}

export class TrafficAnalytics {
  private entries: TrafficEntry[] = []

  record(entry: TrafficEntry): void {
    this.entries.push(entry)
  }

  getGrowth(source: string): number {
    const filtered = this.entries
      .filter(e => e.source === source)
      .sort((a, b) => a.date.localeCompare(b.date))
    if (filtered.length < 2) return 0
    const first = filtered[0]!.sessions
    const last = filtered[filtered.length - 1]!.sessions
    if (!first) return 0
    return ((last - first) / first) * 100
  }

  getTopPages(n: number): Array<{ page: string; sessions: number }> {
    const pageMap = new Map<string, number>()
    for (const e of this.entries) {
      if (!e.page) continue
      pageMap.set(e.page, (pageMap.get(e.page) || 0) + e.sessions)
    }
    return [...pageMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([page, sessions]) => ({ page, sessions }))
  }
}
