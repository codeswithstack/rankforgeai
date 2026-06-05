# rankforge

AI-powered SEO and web performance optimization — all 15 packages in one.

## Install
```bash
npm install rankforge
```

## Usage

Import by namespace — no name collisions:

```ts
import { Core, Meta, Schema, Sitemap, I18n, Performance, Hydration, Audit, Images, Monitor, Security, AI, Analytics, Edge, CLI } from 'rankforge'

// Parse HTML
const doc = Core.parseHTML(html)
const meta = Meta.generateMeta({ title: 'My Page', url: 'https://example.com' })

// Generate schema
const schema = Schema.generateArticleSchema({ headline: 'My Article', author: { name: 'Jane' }, datePublished: '2024-01-01' })

// Score performance
const score = Performance.calculateLCPScore(2400) // 94

// Detect security issues
const cloaking = Security.detectCloaking(botHTML, userHTML)
const bot = Security.filterBots(request.headers['user-agent'])

// AI copilot
const copilot = new AI.AICopilot(myLLM)
const response = await copilot.ask('Why is my LCP slow?', { metrics: { lcp: 4200 } })

// CDN cache headers
const headers = Edge.generateCDNCacheHeaders({ pageType: 'blog', ttl: 3600 })
```

See the individual packages for full API docs:

| Namespace | Package |
|---|---|
| `Core` | [@rankforge/core](../core) |
| `Meta` | [@rankforge/meta](../meta) |
| `Schema` | [@rankforge/schema](../schema) |
| `Sitemap` | [@rankforge/sitemap](../sitemap) |
| `I18n` | [@rankforge/i18n](../i18n) |
| `Performance` | [@rankforge/performance](../performance) |
| `Hydration` | [@rankforge/hydration](../hydration) |
| `Audit` | [@rankforge/audit](../audit) |
| `Images` | [@rankforge/images](../images) |
| `Monitor` | [@rankforge/monitor](../monitor) |
| `Security` | [@rankforge/security](../security) |
| `AI` | [@rankforge/ai](../ai) |
| `Analytics` | [@rankforge/analytics](../analytics) |
| `Edge` | [@rankforge/edge](../edge) |
| `CLI` | [@rankforge/cli](../cli) |
