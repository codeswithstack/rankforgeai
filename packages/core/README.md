# @rankforge-root/core

HTML parser, web crawler, SSR analyzer, and AST inspection for RankForge AI.

## Install
```bash
npm install @rankforge-root/core
```

## Usage
```ts
import { parseHTML, extractMeta, extractHeadings, extractLinks, CrawlEngine, analyzeSSR, SSRAnalyzer, ASTParser } from '@rankforge-root/core'

// Parse HTML
const doc = parseHTML('<html><head><title>My Page</title></head><body><h1>Hi</h1></body></html>')
const meta = extractMeta(doc)       // { title, description, canonical, og, twitter }
const headings = extractHeadings(doc) // [{ level: 1, text: 'Hi' }]
const links = extractLinks(doc, 'https://example.com')

// Crawl a site
const crawler = new CrawlEngine({ baseUrl: 'https://example.com', maxDepth: 3 })
await crawler.crawl({ onPage: (url, page) => console.log(url, page?.status) })

// Detect SSR framework
const result = analyzeSSR(html)
// { isSSR: true, hasContent: true, framework: 'nextjs' }

// Analyze React/Next.js source code
const parser = new ASTParser({ framework: 'nextjs' })
const issues = parser.analyze(sourceCode)
```
