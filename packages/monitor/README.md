# @rankforge/monitor

Real User Monitoring, performance alerting, and multi-channel notifications.

## Install
```bash
npm install @rankforge/monitor
```

## Usage
```ts
import { RUMCollector, AlertEngine, NotificationService, Monitor } from '@rankforge/monitor'

// Collect RUM data
const rum = new RUMCollector()
rum.record({ type: 'LCP', value: 2400, url: 'https://example.com' })
const stats = rum.getMetrics('https://example.com')
// { LCP: { p75: 2400, median: 2400, p95: 2400, avg: 2400, count: 1 } }

// Alert on threshold breaches
const alerts = new AlertEngine({ thresholds: { LCP: { warning: 2500, critical: 4000 } } })
const alert = alerts.evaluate({ metric: 'LCP', value: 5000 })
// { severity: 'critical', message: 'LCP is 5000 (critical threshold: 4000)' }

// Send notifications (Slack, Discord, webhook)
const notif = new NotificationService({ slack: { webhookUrl: 'https://hooks.slack.com/...' } })
await notif.notify({ channel: 'slack', message: 'LCP regression!', severity: 'critical' })

// Crawl diff — find new, broken, recovered, removed pages
const diff = new Monitor().diffCrawls(previousCrawl, currentCrawl)
```
