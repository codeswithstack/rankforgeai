// ─── RUM Collector ────────────────────────────────────────────────────────────
export interface RUMEntry {
  type: 'LCP' | 'CLS' | 'INP' | 'TTFB' | 'FCP'
  value: number
  url: string
  timestamp?: number
}

export interface MetricStats {
  p75: number
  median: number
  p95: number
  count: number
  avg: number
}

export interface PageMetrics {
  LCP?: MetricStats
  CLS?: MetricStats
  INP?: MetricStats
  TTFB?: MetricStats
  FCP?: MetricStats
}

export class RUMCollector {
  private data = new Map<string, Map<string, number[]>>()

  record(entry: RUMEntry): void {
    if (!this.data.has(entry.url)) this.data.set(entry.url, new Map())
    const urlMap = this.data.get(entry.url)!
    if (!urlMap.has(entry.type)) urlMap.set(entry.type, [])
    urlMap.get(entry.type)!.push(entry.value)
  }

  getMetrics(url: string): PageMetrics {
    const urlMap = this.data.get(url) || new Map()
    const result: PageMetrics = {}
    for (const [type, values] of urlMap) {
      result[type as keyof PageMetrics] = calcStats(values)
    }
    return result
  }
}

function calcStats(values: number[]): MetricStats {
  const sorted = [...values].sort((a, b) => a - b)
  const n = sorted.length
  const p = (pct: number) => sorted[Math.floor((pct / 100) * (n - 1))] ?? sorted[n - 1] ?? 0
  const avg = sorted.reduce((a, b) => a + b, 0) / n
  return { count: n, avg, median: p(50), p75: p(75), p95: p(95) }
}

// ─── Alert Engine ─────────────────────────────────────────────────────────────
export interface AlertThresholds {
  LCP?: { warning: number; critical: number }
  CLS?: { warning: number; critical: number }
  INP?: { warning: number; critical: number }
  TTFB?: { warning: number; critical: number }
}

export interface MetricAlert {
  metric: string
  value: number
  severity: 'warning' | 'critical'
  message: string
}

export interface SEOAlert {
  type: string
  severity: 'warning' | 'critical' | 'info'
  message: string
  previousValue?: number
  currentValue?: number
}

export class AlertEngine {
  private thresholds: AlertThresholds

  constructor(options: { thresholds: AlertThresholds }) {
    this.thresholds = options.thresholds
  }

  evaluate(input: { metric: string; value: number }): MetricAlert | null {
    const t = this.thresholds[input.metric as keyof AlertThresholds]
    if (!t) return null
    if (input.value >= t.critical) {
      return { metric: input.metric, value: input.value, severity: 'critical', message: `${input.metric} is ${input.value} (critical threshold: ${t.critical})` }
    }
    if (input.value >= t.warning) {
      return { metric: input.metric, value: input.value, severity: 'warning', message: `${input.metric} is ${input.value} (warning threshold: ${t.warning})` }
    }
    return null
  }

  evaluateSEO(input: {
    keyword?: string; previousRank?: number; currentRank?: number
    indexedPages?: { previous: number; current: number }
  }): SEOAlert | null {
    if (input.keyword && input.previousRank !== undefined && input.currentRank !== undefined) {
      const drop = input.currentRank - input.previousRank
      if (drop >= 5) {
        return {
          type: 'rank-drop',
          severity: drop >= 10 ? 'critical' : 'warning',
          message: `"${input.keyword}" dropped ${drop} positions (${input.previousRank} → ${input.currentRank})`,
          previousValue: input.previousRank,
          currentValue: input.currentRank,
        }
      }
    }
    if (input.indexedPages) {
      const { previous, current } = input.indexedPages
      const changePct = ((current - previous) / previous) * 100
      if (changePct < -10) {
        return {
          type: 'indexing-drop',
          severity: changePct < -20 ? 'critical' : 'warning',
          message: `Indexed pages dropped ${Math.abs(changePct).toFixed(1)}% (${previous} → ${current})`,
          previousValue: previous,
          currentValue: current,
        }
      }
    }
    return null
  }
}

// ─── Notification Service ─────────────────────────────────────────────────────
export interface NotificationConfig {
  slack?: { webhookUrl: string }
  discord?: { webhookUrl: string }
  email?: { to: string; from?: string }
  webhook?: { url: string }
}

export interface Notification {
  channel: 'slack' | 'discord' | 'email' | 'webhook'
  message: string
  severity: 'info' | 'warning' | 'critical'
  data?: Record<string, unknown>
}

type TransportFn = (payload: Record<string, unknown>) => Promise<unknown>

export class NotificationService {
  private config: NotificationConfig
  private transports = new Map<string, TransportFn>()

  constructor(config: NotificationConfig) {
    this.config = config
  }

  setTransport(channel: string, fn: TransportFn): void {
    this.transports.set(channel, fn)
  }

  async notify(notification: Notification): Promise<void> {
    const cfg = this.config[notification.channel]
    if (!cfg) return

    const payload: Record<string, unknown> = {
      message: notification.message,
      severity: notification.severity,
      ...notification.data,
    }

    const transport = this.transports.get(notification.channel)
    if (transport) {
      if (notification.channel === 'slack') {
        payload.text = `[${notification.severity.toUpperCase()}] ${notification.message}`
        payload.attachments = [{ color: notification.severity === 'critical' ? 'danger' : 'warning', text: notification.message }]
      } else if (notification.channel === 'discord') {
        payload.content = `**[${notification.severity.toUpperCase()}]** ${notification.message}`
      } else if (notification.channel === 'email') {
        payload.to = (cfg as { to: string }).to
        payload.subject = `RankForge Alert: ${notification.severity}`
      }
      await transport(payload)
      return
    }

    // Default real HTTP transports
    if (notification.channel === 'slack') {
      const slackCfg = cfg as { webhookUrl: string }
      await fetch(slackCfg.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `[${notification.severity.toUpperCase()}] ${notification.message}`,
          attachments: [{ color: notification.severity === 'critical' ? 'danger' : 'warning', text: notification.message }],
        }),
      })
    } else if (notification.channel === 'discord') {
      const discordCfg = cfg as { webhookUrl: string }
      await fetch(discordCfg.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: `**[${notification.severity.toUpperCase()}]** ${notification.message}` }),
      })
    } else if (notification.channel === 'webhook') {
      const webhookCfg = cfg as { url: string }
      await fetch(webhookCfg.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }
  }
}

// ─── Monitor (Crawl diff) ─────────────────────────────────────────────────────
export interface PageStatus {
  status: number
  lastSeen?: string
}

export interface CrawlDiff {
  new: string[]
  broken: string[]
  recovered: string[]
  removed: string[]
}

export class Monitor {
  diffCrawls(
    previous: Map<string, PageStatus>,
    current: Map<string, PageStatus>
  ): CrawlDiff {
    const newPages: string[] = []
    const broken: string[] = []
    const recovered: string[] = []
    const removed: string[] = []

    for (const [url, status] of current) {
      if (!previous.has(url)) {
        newPages.push(url)
      } else {
        const prev = previous.get(url)!
        if (status.status >= 400 && prev.status < 400) broken.push(url)
        if (status.status < 400 && prev.status >= 400) recovered.push(url)
      }
    }

    for (const url of previous.keys()) {
      if (!current.has(url)) removed.push(url)
    }

    return { new: newPages, broken, recovered, removed }
  }
}
