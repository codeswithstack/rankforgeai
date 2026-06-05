# RankForge AI

AI-powered SEO and web performance optimization toolkit — a Turborepo monorepo with 15 focused packages that work independently or together.

---

## Packages

| Package | Description |
|---|---|
| `@rankforge-root/core` | HTML parser, crawler engine, SSR analyzer, AST inspector |
| `@rankforge-root/meta` | Meta tag generation, validation, SERP preview |
| `@rankforge-root/schema` | JSON-LD schema builders (Article, Product, FAQ, Event, Recipe…) |
| `@rankforge-root/sitemap` | XML sitemap generation — news, image, video, multilingual, compressed |
| `@rankforge-root/i18n` | Hreflang generation, locale routing, RTL meta |
| `@rankforge-root/performance` | LCP, CLS, INP, TTFB — issue detection and scoring |
| `@rankforge-root/hydration` | SSR/CSR hydration mismatch detection and fix suggestions |
| `@rankforge-root/audit` | Full-site SEO audit engine with pluggable fetcher |
| `@rankforge-root/images` | Alt text detection, AI-powered alt generation, WebP/AVIF conversion |
| `@rankforge-root/monitor` | RUM collector, alert engine, Slack/Discord/webhook notifications |
| `@rankforge-root/security` | Cloaking detection, SEO poisoning, spam injection, mixed content |
| `@rankforge-root/ai` | LLM-powered meta, links, content analysis, fix generation, copilot |
| `@rankforge-root/analytics` | Keyword tracking, ranking trends, indexing stats, traffic analytics |
| `@rankforge-root/edge` | Edge-side SEO — meta rewriting, CDN cache headers, geo routing |
| `@rankforge-root/cli` | `rankforge` CLI — init, audit, fix, sitemap, schema, optimize, monitor |

---

## Getting Started

**Requirements:** Node.js 18+, npm 9+

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Build all packages
npm run build

# Type-check
npm run typecheck
```

---

## CLI Usage

```bash
# Initialize in your project
rankforge init

# Audit a URL
rankforge audit --url https://example.com

# Audit with minimum score gate
rankforge audit --url https://example.com --min-score 80

# Output JSON report
rankforge audit --url https://example.com --json --output report.json

# Apply auto-fixes (dry run first)
rankforge fix --dry-run
rankforge fix --backup

# Generate sitemap
rankforge sitemap --output public/sitemap.xml

# Validate structured data
rankforge schema --validate --url https://example.com

# Start monitoring
rankforge monitor --interval 300
```

---

## Example Usage

### Meta Tags

```ts
import { generateMeta, validateMeta } from '@rankforge-root/meta'

const meta = generateMeta({
  title: 'RankForge — AI SEO Toolkit',
  description: 'Automate SEO and performance optimization with AI.',
  url: 'https://example.com',
  image: 'https://example.com/og.png',
})

const issues = validateMeta(meta)
```

### Structured Data

```ts
import { generateArticleSchema, renderSchemaTag } from '@rankforge-root/schema'

const schema = generateArticleSchema({
  headline: 'How to Improve Core Web Vitals',
  author: { name: 'Jane Doe' },
  datePublished: '2024-01-01',
})

console.log(renderSchemaTag(schema))
```

### AI Copilot

```ts
import { AICopilot } from '@rankforge-root/ai'

const copilot = new AICopilot(myLLM)

const response = await copilot.ask('Why is my LCP slow?', {
  metrics: { lcp: 4200 },
})

console.log(response.explanation)
console.log(response.fixSteps)
```

### Performance Scoring

```ts
import { calculateLCPScore, detectLCPIssues } from '@rankforge-root/performance'

const score = calculateLCPScore(2400) // ms → 0-100
const issues = detectLCPIssues({ resources: [...], renderBlockers: [...] })
```

### Hydration Mismatch Detection

```ts
import { detectHydrationMismatches } from '@rankforge-root/hydration'

const result = detectHydrationMismatches(serverHTML, clientHTML)
if (result.hasMismatches) {
  console.log(result.mismatches)
}
```

---

## AI Integration

All AI-powered features accept any LLM via a simple interface:

```ts
interface LLM {
  complete: (prompt: string | object) => Promise<{ text: string }>
}
```

Works with OpenAI, Anthropic, or any local model behind a compatible wrapper.

---

## Repo Structure

```
.
├── packages/
│   ├── core/
│   ├── meta/
│   ├── schema/
│   ├── sitemap/
│   ├── i18n/
│   ├── performance/
│   ├── hydration/
│   ├── audit/
│   ├── images/
│   ├── monitor/
│   ├── security/
│   ├── ai/
│   ├── analytics/
│   ├── edge/
│   └── cli/
├── turbo.json
├── vitest.config.ts
└── tsconfig.base.json
```

---

## Tech Stack

- **Turborepo** — monorepo task orchestration
- **TypeScript** — strict mode across all packages
- **Vitest** — test runner (316 tests, 21 suites)
- **Node.js** — no framework dependencies in core packages

---

## License

MIT
