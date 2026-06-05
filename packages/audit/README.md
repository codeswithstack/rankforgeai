# @rankforge/audit

Full-site SEO audit engine with pluggable HTTP fetcher.

## Install
```bash
npm install @rankforge/audit
```

## Usage
```ts
import { runAudit, AuditEngine } from '@rankforge/audit'

// Quick single-page audit
const report = await runAudit({
  url: 'https://example.com',
  html: pageHTML,
  metrics: { lcp: 2200, cls: 0.04, inp: 180, ttfb: 250 },
})
// { seo: [...], performance: [...], security: [...], technical: [...], score: 88 }

// Full engine with custom fetcher
const engine = new AuditEngine()
engine.setFetcher(async (url) => {
  const res = await fetch(url)
  return { status: res.status, body: await res.text() }
})

await engine.auditRobotsTxt('https://example.com')
await engine.auditSitemap('https://example.com')
await engine.auditLinks(['https://example.com/page1', 'https://example.com/page2'])
```
