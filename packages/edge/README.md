# @rankforge-root/edge

Edge-side SEO — meta rewriting, CDN cache headers, and geo-based routing.

## Install
```bash
npm install @rankforge-root/edge
```

## Usage
```ts
import { EdgeSEOOptimizer, generateCDNCacheHeaders, detectGeoSEO, analyzeEdgeRendering } from '@rankforge-root/edge'

// Rewrite meta tags at the CDN edge
const optimizer = new EdgeSEOOptimizer()
const html = optimizer.rewriteMetaTags({
  html: pageHTML,
  geo: { country: 'IN', language: 'ta' },
  translations: { ta: { title: 'வரவேற்கிறோம்' } },
})

// Inject hreflang at the edge
const withHreflang = optimizer.injectHreflang({ html, locales: [...] })

// CDN cache headers
const headers = generateCDNCacheHeaders({ pageType: 'blog', ttl: 3600, swr: 86400, cdn: 'cloudflare' })
// { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400', ... }

// Geo SEO analysis
const result = detectGeoSEO({ targetRegions: ['US', 'IN'], hasHreflang: false })
// { issues: [{ type: 'missing-hreflang' }], suggestions: [...] }
```
