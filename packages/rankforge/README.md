# rankforgeai

AI-powered SEO and web performance optimization — all 15 packages in one.

## Install
```bash
npm install rankforgeai
```

## Usage

Import by namespace — no name collisions:

```ts
import { Core, Meta, AI } from 'rankforgeai'

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
| `Core` | [@rankforge-root/core](../core) |
| `Meta` | [@rankforge-root/meta](../meta) |
| `Schema` | [@rankforge-root/schema](../schema) |
| `Sitemap` | [@rankforge-root/sitemap](../sitemap) |
| `I18n` | [@rankforge-root/i18n](../i18n) |
| `Performance` | [@rankforge-root/performance](../performance) |
| `Hydration` | [@rankforge-root/hydration](../hydration) |
| `Audit` | [@rankforge-root/audit](../audit) |
| `Images` | [@rankforge-root/images](../images) |
| `Monitor` | [@rankforge-root/monitor](../monitor) |
| `Security` | [@rankforge-root/security](../security) |
| `AI` | [@rankforge-root/ai](../ai) |
| `Analytics` | [@rankforge-root/analytics](../analytics) |
| `Edge` | [@rankforge-root/edge](../edge) |
| `CLI` | [@rankforge-root/cli](../cli) |
