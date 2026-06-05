# RankForge AI — Complete Usage Guide

All 15 packages with real examples.

---

## Table of Contents

1. [@rankforge/core](#1-rankforgecore)
2. [@rankforge/meta](#2-rankforgemeta)
3. [@rankforge/schema](#3-rankforgeschema)
4. [@rankforge/sitemap](#4-rankforgesitemap)
5. [@rankforge/i18n](#5-rankforgei18n)
6. [@rankforge/performance](#6-rankforgeperformance)
7. [@rankforge/hydration](#7-rankforgehydration)
8. [@rankforge/audit](#8-rankforgeaudit)
9. [@rankforge/images](#9-rankforgeimages)
10. [@rankforge/monitor](#10-rankforgemonitor)
11. [@rankforge/security](#11-rankforgesecurity)
12. [@rankforge/ai](#12-rankforgeai)
13. [@rankforge/analytics](#13-rankforgeanalytics)
14. [@rankforge/edge](#14-rankforgeedge)
15. [@rankforge/cli](#15-rankforgecli)
16. [Full pipeline example](#16-full-pipeline-example)

---

## 1. @rankforge/core

Parse HTML, crawl sites, detect SSR, and analyze React/Next.js source code.

### HTML Parsing

```ts
import { parseHTML, extractMeta, extractHeadings, extractLinks } from '@rankforge/core'

const html = `
  <html>
    <head>
      <title>My Page</title>
      <meta name="description" content="Great content here" />
      <link rel="canonical" href="https://example.com/page" />
    </head>
    <body>
      <h1>Welcome</h1>
      <h2>Section One</h2>
      <a href="/about">About us</a>
      <a href="https://external.com" rel="nofollow">External</a>
    </body>
  </html>
`

const doc = parseHTML(html)

const meta = extractMeta(doc)
// { title: 'My Page', description: 'Great content here', canonical: 'https://example.com/page', og: {...} }

const headings = extractHeadings(doc)
// [{ level: 1, text: 'Welcome' }, { level: 2, text: 'Section One' }]

const links = extractLinks(doc, 'https://example.com')
// [
//   { href: '/about', text: 'About us', nofollow: false, type: 'internal' },
//   { href: 'https://external.com', text: 'External', nofollow: true, type: 'external' },
// ]
```

### Crawling a Website

```ts
import { CrawlEngine } from '@rankforge/core'

const crawler = new CrawlEngine({
  baseUrl: 'https://example.com',
  maxDepth: 3,
  concurrency: 5,
  respectRobots: true,
})

// Plug in your own fetcher (fetch, axios, etc.)
crawler.setFetcher(async (url) => {
  const res = await fetch(url)
  return { html: await res.text(), status: res.status }
})

await crawler.crawl({
  onPage: (url, page) => {
    console.log(`Crawled: ${url} (${page?.status})`)
  },
  onError: (url, err) => {
    console.error(`Failed: ${url}`, err.message)
  },
})

// Find orphan pages (no inbound links)
const linkMap = new Map([
  ['https://example.com/', ['https://example.com/about']],
  ['https://example.com/about', []],
  ['https://example.com/hidden', []],  // orphan
])
const orphans = crawler.detectOrphanPages(linkMap)
// ['https://example.com/hidden']

// Detect duplicate content
const pages = [
  { url: 'https://example.com/page-1', contentHash: 'abc123' },
  { url: 'https://example.com/page-2', contentHash: 'abc123' },  // duplicate!
]
const dupes = crawler.detectDuplicateContent(pages)
// [{ urls: ['https://example.com/page-1', 'https://example.com/page-2'], contentHash: 'abc123' }]
```

### SSR Detection

```ts
import { analyzeSSR, SSRAnalyzer } from '@rankforge/core'

const result = analyzeSSR(html)
// { isSSR: true, hasContent: true, framework: 'nextjs' }

// Detect hydration mismatches between server and client renders
const analyzer = new SSRAnalyzer()
const mismatches = analyzer.findHydrationMismatches(serverHTML, clientHTML)
// [{ type: 'text-content', serverValue: 'Jan 1', clientValue: 'Jun 15' }]

// Extract file-system routes
const routes = analyzer.extractNextJsRoutes([
  'pages/index.tsx',
  'pages/blog/[slug].tsx',
  'pages/about.tsx',
])
// ['/', '/blog/:slug', '/about']

const appRoutes = analyzer.extractAppRouterRoutes([
  'app/page.tsx',
  'app/blog/[slug]/page.tsx',
])
// ['/', '/blog/:slug']
```

### AST / Source Code Analysis

```ts
import { ASTParser, extractReactMetaTags, detectMissingImageProps } from '@rankforge/core'

const parser = new ASTParser({ framework: 'nextjs' })

const issues = parser.analyze(`
  import Image from 'next/image'

  export default function Hero() {
    return <img src="/hero.png" />  // should use next/image
  }
`)
// [{ type: 'use-next-image', severity: 'warning', message: '...' }]

const meta = extractReactMetaTags(`
  export const metadata = {
    title: 'My App',
    description: 'Best app',
  }
`)
// { title: 'My App', description: 'Best app', isDynamic: false }

const imgIssues = detectMissingImageProps(`
  <img src="/profile.jpg" />
`)
// [{ type: 'missing-alt', message: 'Image is missing alt attribute', src: '/profile.jpg' }]
```

---

## 2. @rankforge/meta

Generate, validate, and preview meta tags.

```ts
import { generateMeta, validateMeta, truncateTitle, generateSERPPreview } from '@rankforge/meta'

// Generate complete meta tag data
const meta = generateMeta({
  title: 'RankForge AI — SEO & Performance Toolkit',
  description: 'Automate your SEO audits and fixes with AI-powered tools.',
  url: 'https://example.com/rankforge',
  image: 'https://example.com/og-image.png',
  author: 'Jane Doe',
  keywords: ['SEO', 'performance', 'AI'],
  robots: 'index,follow',
})
// {
//   title: 'RankForge AI — SEO & Performance Toolkit',
//   description: 'Automate your SEO audits...',
//   canonical: 'https://example.com/rankforge',
//   robots: 'index,follow',
//   keywords: 'SEO, performance, AI',
//   og: { title: '...', image: '...', url: '...', type: 'website' },
//   twitter: { card: 'summary_large_image', title: '...', image: '...' },
// }

// Validate — catches errors before going live
const issues = validateMeta({ title: 'Hi', description: 'Short' })
// [
//   { field: 'title', severity: 'warning', type: 'too-short', message: 'Title is too short (2 chars)' },
//   { field: 'description', severity: 'warning', type: 'too-short', message: 'Description is too short (5 chars)' },
//   { field: 'og:image', severity: 'warning', type: 'missing', message: 'og:image is recommended' },
// ]

// Truncate a long title cleanly at a word boundary
const short = truncateTitle('This Is A Very Long Page Title That Exceeds Sixty Characters Limit', 60)
// 'This Is A Very Long Page Title That Exceeds Sixty ...'

// Preview how it looks in Google search results
const serp = generateSERPPreview({
  title: 'RankForge AI',
  description: 'AI-powered SEO toolkit for modern web apps.',
  url: 'https://example.com/features/seo',
})
// {
//   title: 'RankForge AI',
//   displayUrl: 'example.com › features › seo',
//   snippet: 'AI-powered SEO toolkit for modern web apps.',
//   warnings: [],
// }
```

---

## 3. @rankforge/schema

Generate JSON-LD structured data for rich search results.

```ts
import {
  generateArticleSchema,
  generateProductSchema,
  generateFAQSchema,
  generateBreadcrumbSchema,
  generateOrganizationSchema,
  generateLocalBusinessSchema,
  generateEventSchema,
  generateRecipeSchema,
  validateSchema,
  renderSchemaTag,
} from '@rankforge/schema'

// Article / Blog Post
const article = generateArticleSchema({
  type: 'BlogPosting',
  headline: 'How to Improve Core Web Vitals in Next.js',
  author: { name: 'Jane Doe', url: 'https://example.com/jane' },
  datePublished: '2024-01-15',
  dateModified: '2024-06-01',
  image: 'https://example.com/images/cwv.png',
  url: 'https://example.com/blog/core-web-vitals',
})

// Product with reviews
const product = generateProductSchema({
  name: 'RankForge Pro',
  description: 'AI-powered SEO platform',
  price: 49,
  currency: 'USD',
  availability: 'InStock',
  aggregateRating: { ratingValue: 4.8, reviewCount: 127 },
})

// FAQ (shows accordion in Google)
const faq = generateFAQSchema([
  { question: 'What is LCP?', answer: 'Largest Contentful Paint measures load performance.' },
  { question: 'What is CLS?', answer: 'Cumulative Layout Shift measures visual stability.' },
])

// Breadcrumb
const breadcrumb = generateBreadcrumbSchema([
  { name: 'Home', url: 'https://example.com' },
  { name: 'Blog', url: 'https://example.com/blog' },
  { name: 'Core Web Vitals', url: 'https://example.com/blog/cwv' },
])

// Local Business
const business = generateLocalBusinessSchema({
  name: 'RankForge Agency',
  address: {
    streetAddress: '123 Main St',
    addressLocality: 'Chennai',
    addressCountry: 'IN',
  },
  telephone: '+91-9876543210',
  openingHours: 'Mo-Fr 09:00-18:00',
})

// Event
const event = generateEventSchema({
  name: 'SEO Summit 2024',
  startDate: '2024-09-15T10:00:00',
  endDate: '2024-09-15T18:00:00',
  location: { name: 'Chennai Trade Centre', address: 'Chennai, India' },
  eventAttendanceMode: 'OfflineEventAttendanceMode',
})

// Recipe
const recipe = generateRecipeSchema({
  name: 'Chocolate Cake',
  prepTime: 'PT30M',
  cookTime: 'PT1H',
  ingredients: ['2 cups flour', '1 cup sugar', '½ cup cocoa'],
  instructions: ['Mix dry ingredients', 'Add wet ingredients', 'Bake at 350°F'],
  author: { name: 'Chef Raja' },
})

// Validate before publishing
const validation = validateSchema(article)
// { isValid: true, errors: [], warnings: [] }

// Render as <script> tag to inject in <head>
const tag = renderSchemaTag(article)
// <script type="application/ld+json">{ "@context": "https://schema.org", ... }</script>
```

---

## 4. @rankforge/sitemap

Generate all sitemap variants — standard, images, videos, news, multilingual, and index.

```ts
import {
  generateSitemap,
  generateImageSitemap,
  generateVideoSitemap,
  generateNewsSitemap,
  generateMultilingualSitemap,
  generateSitemapIndex,
  chunkSitemap,
  compressSitemap,
  validateSitemap,
} from '@rankforge/sitemap'

// Standard sitemap
const xml = generateSitemap([
  { url: 'https://example.com/', changefreq: 'daily', priority: 1.0 },
  { url: 'https://example.com/blog', changefreq: 'weekly', priority: 0.8 },
  { url: 'https://example.com/about', changefreq: 'monthly', priority: 0.5 },
])

// Image sitemap
const imageSitemap = generateImageSitemap([
  {
    url: 'https://example.com/gallery',
    images: [
      { loc: 'https://example.com/images/photo1.jpg', title: 'Office Photo' },
      { loc: 'https://example.com/images/photo2.jpg', caption: 'Team meeting' },
    ],
  },
])

// Video sitemap
const videoSitemap = generateVideoSitemap([
  {
    url: 'https://example.com/videos/demo',
    video: {
      thumbnailLoc: 'https://example.com/thumb.jpg',
      title: 'Product Demo',
      description: 'See RankForge in action',
      contentLoc: 'https://example.com/demo.mp4',
      duration: 180,
    },
  },
])

// News sitemap (Google News — published within 2 days)
const newsSitemap = generateNewsSitemap([
  {
    url: 'https://example.com/news/launch',
    news: {
      publicationName: 'RankForge Blog',
      publicationLanguage: 'en',
      title: 'RankForge AI Launches Today',
      publicationDate: new Date().toISOString(),
    },
  },
])

// Multilingual sitemap with hreflang
const multiSitemap = generateMultilingualSitemap([
  {
    url: 'https://example.com/en/page',
    alternates: [
      { hreflang: 'en', href: 'https://example.com/en/page' },
      { hreflang: 'ta', href: 'https://example.com/ta/page' },
      { hreflang: 'x-default', href: 'https://example.com/en/page' },
    ],
  },
])

// Split large sitemaps (Google limit: 50,000 URLs per file)
const allUrls = Array.from({ length: 60000 }, (_, i) => ({
  url: `https://example.com/product/${i}`,
}))
const chunks = chunkSitemap(allUrls, 50000)
// [[...50000 urls...], [...10000 urls...]]

// Sitemap index pointing to the chunks
const index = generateSitemapIndex([
  { loc: 'https://example.com/sitemap-1.xml', lastmod: '2024-01-01' },
  { loc: 'https://example.com/sitemap-2.xml', lastmod: '2024-01-01' },
])

// Compress for faster delivery
const gzipped = await compressSitemap(xml)
// Buffer (gzip) — serve with Content-Encoding: gzip

// Validate existing sitemap
const result = validateSitemap(xml)
// { isValid: true, errors: [], warnings: [] }
```

---

## 5. @rankforge/i18n

Hreflang tags, locale routing, RTL support, and missing translation detection.

```ts
import {
  generateHreflang,
  validateHreflang,
  generateLocaleCanonical,
  detectUntranslatedPages,
  detectDuplicateLocales,
  generateRTLMeta,
  resolveLocaleRoute,
} from '@rankforge/i18n'

// Generate hreflang tags for a multilingual page
const tags = generateHreflang([
  { locale: 'en', url: 'https://example.com/en/page', isDefault: true },
  { locale: 'ta', url: 'https://example.com/ta/page' },
  { locale: 'fr', url: 'https://example.com/fr/page' },
])
// [
//   { hreflang: 'en', href: 'https://example.com/en/page' },
//   { hreflang: 'ta', href: 'https://example.com/ta/page' },
//   { hreflang: 'fr', href: 'https://example.com/fr/page' },
//   { hreflang: 'x-default', href: 'https://example.com/en/page' },
// ]

// Validate for common mistakes
const issues = validateHreflang(tags, 'https://example.com/en/page')
// checks: missing x-default, self-reference, invalid locale, relative URLs

// Generate locale-specific canonical URLs
const prefixUrl = generateLocaleCanonical('https://example.com/page', 'fr', { strategy: 'prefix' })
// 'https://example.com/fr/page'

const subdomainUrl = generateLocaleCanonical('https://example.com/page', 'fr', { strategy: 'subdomain' })
// 'https://fr.example.com/page'

// Find pages not yet translated
const sitePages = {
  en: ['/home', '/about', '/blog', '/contact'],
  ta: ['/home', '/about'],  // missing /blog and /contact
}
const missing = detectUntranslatedPages(sitePages, ['en', 'ta'])
// { ta: ['/blog', '/contact'] }

// RTL language support (Arabic, Hebrew, Farsi, Urdu...)
const rtlMeta = generateRTLMeta('ar')
// { dir: 'rtl', lang: 'ar' }

const ltrMeta = generateRTLMeta('en')
// { dir: 'ltr', lang: 'en' }
```

---

## 6. @rankforge/performance

Detect and score LCP, CLS, INP, and TTFB issues.

```ts
import {
  detectLCPIssues, generateLCPFixes, calculateLCPScore,
  detectCLSIssues, generateCLSFixes, calculateCLSScore,
  detectINPIssues, generateINPFixes, calculateINPScore,
  detectTTFBIssues, generateTTFBFixes, calculateTTFBScore,
} from '@rankforge/performance'

// ── LCP (Largest Contentful Paint) ───────────────────────────────────────────

const lcpIssues = detectLCPIssues({
  images: [
    { src: '/hero.jpg', isAboveFold: true, hasPriority: false, size: 2_500_000, format: 'jpg' },
  ],
  scripts: [
    { src: '/analytics.js', isAsync: false, isDefer: false, isInHead: true },
  ],
})
// [
//   { type: 'large-image', severity: 'critical', message: 'Hero image is 2.4MB...' },
//   { type: 'missing-priority', severity: 'high', message: 'Above-fold image missing priority...' },
//   { type: 'render-blocking-script', severity: 'high', message: '...' },
// ]

const lcpFix = generateLCPFixes({ type: 'large-image', element: { src: '/hero.jpg' } })
// { code: '<Image src="/hero.jpg" priority width={1920} ... />', description: '...' }

calculateLCPScore(1200)  // 100 (good — under 2500ms)
calculateLCPScore(3000)  // ~60 (needs improvement)
calculateLCPScore(5000)  // 0  (poor)

// ── CLS (Cumulative Layout Shift) ────────────────────────────────────────────

const clsIssues = detectCLSIssues({
  images: [
    { src: '/banner.jpg', hasWidth: false, hasHeight: false },  // causes layout shift
  ],
  fonts: [
    { family: 'CustomFont', display: 'auto', hasPreload: false },
  ],
  ads: [{ type: 'banner' }],
})

calculateCLSScore(0.05)  // 100 (good)
calculateCLSScore(0.15)  // ~50 (needs improvement)
calculateCLSScore(0.30)  // 0   (poor)

// ── INP (Interaction to Next Paint) ──────────────────────────────────────────

const inpIssues = detectINPIssues({
  tasks: [
    { duration: 300, source: 'HeavyComponent', type: 'script' },
  ],
  eventListeners: [
    { event: 'scroll', isThrottled: false, isPassive: false, duration: 150 },
  ],
  rerenders: [
    { component: 'ProductList', count: 25, avgDuration: 12 },
  ],
})

const inpFix = generateINPFixes({ type: 'excessive-rerenders', element: { component: 'ProductList' } })
// { code: 'const ProductList = React.memo(...)', description: 'Wrap with React.memo' }

calculateINPScore(150)   // 100 (good)
calculateINPScore(400)   // ~97 (good)
calculateINPScore(600)   // ~39 (poor)

// ── TTFB (Time to First Byte) ────────────────────────────────────────────────

const ttfbIssues = detectTTFBIssues({
  ttfb: 900,
  dbQueryTime: 600,
  cacheHit: false,
  queries: [
    { sql: 'SELECT * FROM products', duration: 400, hasIndex: false },
  ],
})

calculateTTFBScore(200)   // 100
calculateTTFBScore(600)   // ~50
calculateTTFBScore(1500)  // 0
```

---

## 7. @rankforge/hydration

Detect and fix SSR/CSR hydration mismatches in React/Next.js apps.

```ts
import {
  detectHydrationMismatches,
  analyzeLocaleMismatch,
  analyzeDateMismatch,
  generateHydrationFix,
  suggestUseEffect,
  suggestDynamicImport,
} from '@rankforge/hydration'

// Compare server-rendered HTML vs client-rendered HTML
const result = detectHydrationMismatches(
  `<div class="server">Hello Server</div>`,
  `<div class="client">Hello Client</div>`,
)
// {
//   hasMismatches: true,
//   mismatches: [
//     { type: 'attribute', attribute: 'class', serverValue: 'server', clientValue: 'client' },
//   ],
// }

// Detect extra nodes (server has more children than client)
const nodeResult = detectHydrationMismatches(
  `<ul><li>A</li><li>B</li></ul>`,
  `<ul><li>A</li></ul>`,
)
// { hasMismatches: true, mismatches: [{ type: 'extra-node' }] }

// Analyze locale-specific mismatches
const localeMismatch = analyzeLocaleMismatch({
  server: '1,234.56',
  client: '1.234,56',  // different locale number format
  context: 'number-format',
})
// { type: 'locale-number-format', fix: 'use-server-locale' }

// Analyze date mismatches (timezone issues)
const dateMismatch = analyzeDateMismatch({
  server: '2024-01-01',
  client: '2024-01-02',  // different because of UTC offset
  timezone: 'Asia/Kolkata',
})
// { type: 'timezone-offset', fix: 'use-utc-dates' }

// Generate fix code
const fix = generateHydrationFix({ type: 'dynamic-date', code: 'new Date().toLocaleDateString()' })
// {
//   type: 'useEffect',
//   description: 'Move dynamic value to client-side useEffect',
//   code: `const [value, setValue] = useState(null)\nuseEffect(() => { setValue(...) }, [])`,
// }

// Suggest useEffect wrapper
const code = suggestUseEffect('new Date().toLocaleDateString()', 'formattedDate')
// const [formattedDate, setFormattedDate] = useState(null)
// useEffect(() => { setFormattedDate(new Date().toLocaleDateString()) }, [])

// Suggest dynamic import for client-only component
const dynImport = suggestDynamicImport('MapWidget', './components/MapWidget')
// const MapWidget = dynamic(() => import('./components/MapWidget'), { ssr: false, loading: () => <div>Loading...</div> })
```

---

## 8. @rankforge/audit

Full-site SEO audit engine with pluggable HTTP fetcher.

```ts
import { runAudit, AuditEngine } from '@rankforge/audit'

// Quick single-page audit
const report = await runAudit({
  url: 'https://example.com/page',
  html: `
    <html>
      <head>
        <title>My Page</title>
        <meta name="description" content="Good description here for SEO purposes." />
        <link rel="canonical" href="https://example.com/page" />
      </head>
      <body>
        <h1>Welcome</h1>
        <img src="/hero.jpg" />
      </body>
    </html>
  `,
  metrics: { lcp: 2200, cls: 0.04, inp: 180, ttfb: 250 },
})
// {
//   seo: [{ rule: 'title', severity: 'pass', message: 'Title found' }, ...],
//   performance: [{ metric: 'LCP', value: 2200, status: 'good', score: 90 }],
//   security: [...],
//   technical: [...],
//   score: 88,
// }

// Full-site audit engine with custom fetcher
const engine = new AuditEngine()

engine.setFetcher(async (url) => {
  const res = await fetch(url)
  return { status: res.status, body: await res.text() }
})

// Audit multiple pages at once
const multiReport = await engine.auditMultiplePages([
  { url: 'https://example.com/', html: homeHTML },
  { url: 'https://example.com/about', html: aboutHTML },
])

// Check robots.txt
const robotsIssues = await engine.auditRobotsTxt('https://example.com')
// [{ rule: 'sitemap-missing', severity: 'warning', message: 'No Sitemap declared in robots.txt' }]

// Check sitemap accessibility
const sitemapIssues = await engine.auditSitemap('https://example.com')

// Find broken links
const linkIssues = await engine.auditLinks([
  'https://example.com/existing-page',
  'https://example.com/deleted-page',  // 404
])

// Detect redirect chains (bad for SEO)
const redirectIssues = await engine.auditRedirectChain([
  { from: 'https://example.com/old', to: 'https://example.com/temp', status: 301 },
  { from: 'https://example.com/temp', to: 'https://example.com/final', status: 301 },
])

const score = engine.calculateOverallScore(multiReport)
// 82

const jsonReport = engine.exportReport({ format: 'json' })
```

---

## 9. @rankforge/images

Detect image issues, generate alt text with AI, and convert formats.

```ts
import {
  detectImageIssues,
  generateAltText,
  generateImageFix,
  convertToWebP,
  convertToAVIF,
  generateResponsiveSizes,
} from '@rankforge/images'

// Detect all image issues on a page
const issues = detectImageIssues([
  { src: '/hero.jpg', alt: undefined },                         // missing-alt (error)
  { src: '/logo.png', alt: '', isDecorative: false },          // empty-alt (warning)
  { src: '/banner.jpg', fileSizeBytes: 3_000_000 },            // oversized (warning)
  { src: '/icon.bmp', format: 'bmp' },                        // non-modern-format (warning)
  { src: '/photo.jpg', hasWidth: false, hasHeight: false },    // missing-dimensions (CLS)
])

// Generate alt text using AI
const myAI = async (input) => {
  const response = await fetch('/api/ai', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return response.json()  // { text: '...' }
}

const altText = await generateAltText(
  { src: '/team/jane.jpg', context: 'About page, leadership team' },
  myAI,
)
// 'A professional headshot of a woman in a business suit smiling at the camera'

// Generate optimized image code
const fix = generateImageFix({
  originalCode: `<img src="/hero.jpg" alt="Hero" />`,
  width: 1920,
  height: 1080,
  isAboveFold: true,
  currentFormat: 'jpg',
})
// {
//   code: `import Image from 'next/image'\n<Image src="/hero.jpg" alt="Hero" width={1920} height={1080} priority />`,
//   suggestions: [
//     { action: 'convert-to-avif', description: 'Convert to AVIF for 50-80% size reduction' },
//     { action: 'convert-to-webp', description: 'Convert to WebP for broad browser support' },
//   ],
// }

// Convert image buffers
const imageBuffer = await fs.readFile('./photo.jpg')
const webpBuffer = await convertToWebP(imageBuffer, { quality: 85 })
const avifBuffer = await convertToAVIF(imageBuffer, { quality: 70 })

// Get responsive breakpoints for srcset
const sizes = generateResponsiveSizes(1920)
// [320, 480, 640, 768, 1024, 1280, 1536, 1920]
```

---

## 10. @rankforge/monitor

Real User Monitoring, alerting, and notifications.

```ts
import { RUMCollector, AlertEngine, NotificationService, Monitor } from '@rankforge/monitor'

// ── RUM Collector ─────────────────────────────────────────────────────────────
const rum = new RUMCollector()

// Record metrics as they come in from your frontend
rum.record({ type: 'LCP', value: 2400, url: 'https://example.com/', timestamp: Date.now() })
rum.record({ type: 'LCP', value: 1800, url: 'https://example.com/', timestamp: Date.now() })
rum.record({ type: 'CLS', value: 0.08, url: 'https://example.com/', timestamp: Date.now() })
rum.record({ type: 'INP', value: 220, url: 'https://example.com/', timestamp: Date.now() })

// Get aggregated stats for a URL
const metrics = rum.getMetrics('https://example.com/')
// {
//   LCP: { p75: 2400, median: 2100, p95: 2400, avg: 2100, count: 2 },
//   CLS: { p75: 0.08, median: 0.08, p95: 0.08, avg: 0.08, count: 1 },
// }

// ── Alert Engine ──────────────────────────────────────────────────────────────
const alerts = new AlertEngine({
  thresholds: {
    LCP: { warning: 2500, critical: 4000 },
    CLS: { warning: 0.1, critical: 0.25 },
    INP: { warning: 200, critical: 500 },
    TTFB: { warning: 800, critical: 1800 },
  },
})

const lcpAlert = alerts.evaluate({ metric: 'LCP', value: 4500 })
// { metric: 'LCP', value: 4500, severity: 'critical', message: 'LCP exceeded critical threshold' }

const seoAlert = alerts.evaluateSEO({
  keyword: 'best seo tool',
  previousRank: 3,
  currentRank: 12,
})
// { type: 'rank-drop', severity: 'warning', message: 'Keyword dropped 9 positions' }

// ── Notifications ─────────────────────────────────────────────────────────────
const notif = new NotificationService({
  slack: { webhookUrl: 'https://hooks.slack.com/...' },
  discord: { webhookUrl: 'https://discord.com/api/webhooks/...' },
})

// Swap transport for testing (no real HTTP calls)
notif.setTransport('slack', async (payload) => {
  console.log('Would send to Slack:', payload)
})

await notif.notify({
  channel: 'slack',
  message: 'LCP regression detected on homepage',
  severity: 'critical',
  data: { url: 'https://example.com/', lcp: 4500 },
})

// ── Crawl Diffing ─────────────────────────────────────────────────────────────
const monitor = new Monitor()

const previousCrawl = new Map([
  ['https://example.com/', { status: 200 }],
  ['https://example.com/old-page', { status: 200 }],
])

const currentCrawl = new Map([
  ['https://example.com/', { status: 200 }],
  ['https://example.com/new-page', { status: 200 }],
  ['https://example.com/broken', { status: 404 }],
])

const diff = monitor.diffCrawls(previousCrawl, currentCrawl)
// {
//   new: ['https://example.com/new-page'],
//   broken: ['https://example.com/broken'],
//   recovered: [],
//   removed: ['https://example.com/old-page'],
// }
```

---

## 11. @rankforge/security

Detect cloaking, SEO poisoning, spam, mixed content, and malicious redirects.

```ts
import {
  detectCloaking,
  detectSEOPoisoning,
  detectSpamInjection,
  detectMixedContent,
  detectMaliciousRedirects,
  filterBots,
} from '@rankforge/security'

// Cloaking: serving different content to bots vs users
const cloaking = detectCloaking(
  `<html><body>Buy cheap pills here! Best prices!</body></html>`,  // bot sees
  `<html><body>Welcome to our health blog.</body></html>`,         // user sees
  { tolerance: 0.05 },
)
// { isCloaking: true, confidence: 0.85, reason: 'Content similarity is only 15%' }

// SEO Poisoning
const poisoning = detectSEOPoisoning(`
  <html>
    <body>
      seo seo seo seo seo seo seo seo seo seo seo seo seo seo seo
      <div style="color: white; background: white;">hidden spam text</div>
    </body>
  </html>
`)
// {
//   isClean: false,
//   issues: [
//     { type: 'keyword-stuffing', severity: 'high', message: '"seo" appears 15 times (35% of content)' },
//     { type: 'hidden-text', severity: 'critical', message: 'White-on-white hidden text detected' },
//   ],
// }

// Spam / Hack injection
const spam = detectSpamInjection(`
  <html>
    <body>
      <a href="https://casino-spam.com" style="display:none">casino</a>
      <script>eval(atob('maliciousCode'))</script>
    </body>
  </html>
`)
// { hasSpam: true, spamLinks: ['https://casino-spam.com'], hasScriptInjection: true }

// Mixed content (HTTP resources on HTTPS page)
const mixed = detectMixedContent(html, 'https://example.com')
// { issues: [{ type: 'script', url: 'http://cdn.example.com/app.js', severity: 'error' }] }

// Malicious redirects (suspicious TLDs)
const redirects = detectMaliciousRedirects([
  { from: 'https://example.com/promo', to: 'https://scam-site.xyz/offer', status: 301 },
])
// { suspicious: [{ from: '...', to: '...', reason: 'Redirects to suspicious TLD domain: scam-site.xyz' }] }

// Bot detection (use in middleware)
const bot = filterBots('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)')
// { isBot: true, botType: 'googlebot', botName: 'Googlebot' }

const human = filterBots('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0')
// { isBot: false }
```

---

## 12. @rankforge/ai

LLM-powered meta generation, link suggestions, keyword clustering, fix generation, and copilot.

### Setting Up Your LLM

```ts
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

// Implement the LLM interface
const llm = {
  async complete(prompt) {
    const msg = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 1024,
      messages: [{ role: 'user', content: JSON.stringify(prompt) }],
    })
    return { text: msg.content[0].type === 'text' ? msg.content[0].text : '' }
  },
}
```

### All AI Features

```ts
import {
  AIMetaGenerator,
  AILinkSuggester,
  AIContentAnalyzer,
  AIFixGenerator,
  AICopilot,
} from '@rankforge/ai'

// ── Meta Generation ───────────────────────────────────────────────────────────
const metaGen = new AIMetaGenerator(llm)

const title = await metaGen.generateTitle({
  content: 'This article explains how to improve Core Web Vitals in Next.js apps.',
  targetKeyword: 'core web vitals nextjs',
  maxLength: 60,
})
// 'Improve Core Web Vitals in Next.js — Complete Guide'

const description = await metaGen.generateDescription({
  content: 'Long article content here...',
  targetKeyword: 'core web vitals nextjs',
  maxLength: 160,
})

// ── Internal Link Suggestions ─────────────────────────────────────────────────
const linker = new AILinkSuggester(llm)

const suggestions = await linker.suggestLinks({
  currentUrl: 'https://example.com/blog/lcp',
  currentContent: 'In this article we cover LCP optimization techniques...',
  availablePages: [
    { url: 'https://example.com/blog/cls', title: 'CLS Guide' },
    { url: 'https://example.com/blog/inp', title: 'INP Guide' },
    { url: 'https://example.com/pricing', title: 'Pricing' },
  ],
})
// [
//   { url: 'https://example.com/blog/cls', anchor: 'layout stability', relevanceScore: 0.9 },
//   { url: 'https://example.com/blog/inp', anchor: 'interaction performance', relevanceScore: 0.85 },
// ]

// ── Content Analysis ──────────────────────────────────────────────────────────
const analyzer = new AIContentAnalyzer(llm)

const clusters = await analyzer.clusterKeywords([
  'core web vitals', 'lcp optimization', 'cls fix',
  'next.js performance', 'react hydration', 'server components',
  'seo audit', 'meta tags', 'structured data',
])
// [
//   { topic: 'Web Performance', keywords: ['core web vitals', 'lcp optimization', 'cls fix'] },
//   { topic: 'Next.js', keywords: ['next.js performance', 'react hydration', 'server components'] },
//   { topic: 'SEO', keywords: ['seo audit', 'meta tags', 'structured data'] },
// ]

const gaps = await analyzer.findTopicGaps({
  existingContent: ['LCP Guide', 'CLS Guide', 'INP Guide'],
  targetTopic: 'Core Web Vitals',
})
// ['TTFB optimization', 'FCP improvement', 'Performance budgets']

// ── Fix Generation ────────────────────────────────────────────────────────────
const fixer = new AIFixGenerator(llm)

const fix = await fixer.generateFix({
  issue: { type: 'missing-alt', element: '<img src="/team/john.jpg" />' },
  context: 'About page — team member photo',
})
// {
//   before: '<img src="/team/john.jpg" />',
//   after: '<img src="/team/john.jpg" alt="John, Senior Engineer at RankForge" />',
//   description: 'AI-generated fix for missing-alt',
// }

const patch = await fixer.generatePatch({
  file: 'app/page.tsx',
  issues: [
    { type: 'missing-alt', line: 12 },
    { type: 'use-next-image', line: 15 },
  ],
})
// { diff: '--- a/app/page.tsx\n+++ b/app/page.tsx\n...', prDescription: 'Fix 2 issues in app/page.tsx' }

// ── AI Copilot ────────────────────────────────────────────────────────────────
const copilot = new AICopilot(llm)

const response = await copilot.ask('Why is my LCP slow?', {
  metrics: { lcp: 4200, cls: 0.02, inp: 180 },
  url: 'https://example.com/',
})
// {
//   explanation: 'Your LCP is slow because the hero image (2.4MB) has no priority attribute...',
//   fixSteps: [
//     'Add the priority prop to your Next.js Image component for the hero image.',
//     'Compress the image from 2.4MB to under 200KB using AVIF format.',
//     'Add <link rel="preload"> in the <head> for critical images.',
//   ],
//   component: 'HeroSection',
//   file: 'components/HeroSection.tsx',
//   line: 15,
// }
```

---

## 13. @rankforge/analytics

Track keyword rankings, indexing stats, crawl coverage, and traffic.

```ts
import {
  KeywordTracker,
  RankingTrends,
  IndexingStats,
  CrawlAnalytics,
  TrafficAnalytics,
} from '@rankforge/analytics'

// ── Keyword Tracking ──────────────────────────────────────────────────────────
const tracker = new KeywordTracker()

tracker.record({ keyword: 'nextjs seo', rank: 5, date: '2024-01-01', url: '/blog/nextjs-seo' })
tracker.record({ keyword: 'nextjs seo', rank: 3, date: '2024-02-01', url: '/blog/nextjs-seo' })
tracker.record({ keyword: 'core web vitals', rank: 8, date: '2024-01-01' })

const history = tracker.getHistory('nextjs seo')
// [{ keyword: 'nextjs seo', rank: 5, date: '2024-01-01' }, { rank: 3, date: '2024-02-01' }]

const trend = tracker.getTrend('nextjs seo')
// { direction: 'up', change: 2, from: 5, to: 3 }

const topKeywords = tracker.getTopKeywords(5)
// sorted by latest rank

// ── Ranking Trends ────────────────────────────────────────────────────────────
const trends = new RankingTrends([
  { keyword: 'nextjs seo', rank: 3 },
  { keyword: 'react performance', rank: 7 },
  { keyword: 'core web vitals', rank: 1 },
  { keyword: 'seo audit tool', rank: 15 },
])

trends.averagePosition()    // 6.5
trends.percentageInTop10()  // 75 (3 out of 4 in top 10)
trends.percentageInTop3()   // 25 (1 out of 4 in top 3)

// ── Indexing Stats ────────────────────────────────────────────────────────────
const indexing = new IndexingStats()

indexing.snapshot({ date: '2024-01-01', indexedCount: 450 })
indexing.snapshot({ date: '2024-02-01', indexedCount: 520 })

const change = indexing.getChange()
// { direction: 'up', absolute: 70, percentage: 15.5, from: 450, to: 520 }

// ── Crawl Analytics ───────────────────────────────────────────────────────────
const crawl = new CrawlAnalytics({
  totalPages: 500,
  crawledPages: 480,
  pages: [
    { url: '/home', depth: 1 },
    { url: '/blog/post-1', depth: 2 },
    { url: '/blog/category/tech/post/deep', depth: 7 },
  ],
})

crawl.coverage()                         // 96 (%)
crawl.avgDepth()                         // 3.3
crawl.getDeepPages({ threshold: 5 })    // [{ url: '/blog/category/tech/post/deep', depth: 7 }]

// ── Traffic Analytics ─────────────────────────────────────────────────────────
const traffic = new TrafficAnalytics()

traffic.record({ date: '2024-01-01', sessions: 1000, source: 'organic', page: '/blog/cwv' })
traffic.record({ date: '2024-02-01', sessions: 1350, source: 'organic', page: '/blog/cwv' })

traffic.getGrowth('organic')   // 35 (%)
traffic.getTopPages(3)         // [{ page: '/blog/cwv', sessions: 2350 }]
```

---

## 14. @rankforge/edge

Edge-side SEO — meta rewriting, CDN caching, and geo-based routing.

```ts
import {
  EdgeSEOOptimizer,
  detectGeoSEO,
  generateCDNCacheHeaders,
  analyzeEdgeRendering,
} from '@rankforge/edge'

// ── Edge Meta Rewriting ───────────────────────────────────────────────────────
const optimizer = new EdgeSEOOptimizer()

// Rewrite meta tags at the CDN edge based on visitor's geo
const localizedHTML = optimizer.rewriteMetaTags({
  html: '<html><head><title>Welcome</title></head><body>...</body></html>',
  geo: { country: 'IN', language: 'ta' },
  translations: {
    ta: { title: 'வரவேற்கிறோம்', description: 'சிறந்த SEO கருவி' },
  },
})

// Inject hreflang at the edge (no origin round-trip)
const withHreflang = optimizer.injectHreflang({
  html: '<html><head></head><body>...</body></html>',
  locales: [
    { hreflang: 'en', href: 'https://example.com/en/page' },
    { hreflang: 'ta', href: 'https://example.com/ta/page' },
    { hreflang: 'x-default', href: 'https://example.com/en/page' },
  ],
})

// Add canonical header (Link: <url>; rel="canonical")
const headers = optimizer.getCanonicalHeaders('https://example.com/page')
// { 'Link': '<https://example.com/page>; rel="canonical"' }

// ── Geo SEO Analysis ──────────────────────────────────────────────────────────
const geoResult = detectGeoSEO({
  targetRegions: ['US', 'IN', 'GB'],
  hasHreflang: false,
  serverRegion: 'us-east-1',
  hasCDN: true,
})
// {
//   issues: [{ type: 'missing-hreflang', severity: 'error', message: 'No hreflang tags found...' }],
//   suggestions: [{ type: 'add-cdn', message: 'Add edge nodes near IN and GB' }],
// }

// ── CDN Cache Headers ─────────────────────────────────────────────────────────
// Static page: cache forever
const staticHeaders = generateCDNCacheHeaders({ pageType: 'static', ttl: 31536000 })
// { 'Cache-Control': 'public, max-age=31536000, immutable', 'CDN-Cache-Control': '...' }

// Blog post: SWR (serve stale while revalidating)
const blogHeaders = generateCDNCacheHeaders({ pageType: 'blog', ttl: 3600, swr: 86400 })
// { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' }

// API: no cache
const apiHeaders = generateCDNCacheHeaders({ pageType: 'api' })
// { 'Cache-Control': 'no-store' }

// Cloudflare-specific headers
const cfHeaders = generateCDNCacheHeaders({ pageType: 'static', cdn: 'cloudflare' })
// { 'Cache-Control': '...', 'CF-Cache-Status': 'HIT', 'Cloudflare-CDN-Cache-Control': '...' }

// ── Edge Rendering Analysis ───────────────────────────────────────────────────
const rendering = analyzeEdgeRendering({
  framework: 'nextjs',
  pages: [
    { path: '/home', renderMode: 'SSG' },
    { path: '/dashboard', renderMode: 'SSR' },
    { path: '/blog/[slug]', renderMode: 'SSR', avgUpdateFrequency: 'hourly' },
  ],
})
// {
//   isrPages: [{ path: '/blog/[slug]', ... }],
//   suggestions: [
//     { type: 'use-isr', page: '/blog/[slug]', message: 'Switch to ISR with revalidate: 3600' },
//   ],
// }
```

---

## 15. @rankforge/cli

The `rankforge` command-line tool — also usable as a Node.js module.

### Terminal

```bash
# Set up your project
rankforge init

# Audit with a score threshold
rankforge audit --url https://example.com --min-score 80

# Audit only SEO (skip performance)
rankforge audit --url https://example.com --only seo

# Save JSON report to file
rankforge audit --url https://example.com --json --output report.json

# Preview what fixes would be applied
rankforge fix --dry-run

# Apply fixes with backup
rankforge fix --backup

# Generate sitemap
rankforge sitemap --output public/sitemap.xml

# Validate schema markup
rankforge schema --validate --url https://example.com

# Run full optimization
rankforge optimize --url https://example.com

# Start monitoring daemon (checks every 5 minutes)
rankforge monitor --interval 300
```

### Programmatic API

```ts
import { RankForgeCLI, MockFileSystem } from '@rankforge/cli'

// Use with a real file system
const cli = new RankForgeCLI()
await cli.run(['audit', '--url', 'https://example.com', '--json'])

// Use in tests with an in-memory file system
const mockFs = new MockFileSystem()
mockFs.write('next.config.js', 'module.exports = {}')

const output: string[] = []
const cli = new RankForgeCLI({
  fs: mockFs,
  stdout: (msg) => output.push(msg),
  stderr: (msg) => console.error(msg),
})

await cli.run(['init'])
// output: ['✓ Created rankforge.config.ts (detected: nextjs)']

const config = mockFs.read('rankforge.config.ts')
// contains: framework: "nextjs"

// Capture exit codes for CI pipelines
let exitCode = 0
cli.setExitHandler((code) => { exitCode = code })
await cli.run(['audit', '--url', 'https://example.com', '--min-score', '90'])
// exitCode = 1 if score < 90
```

---

## 16. Full Pipeline Example

All packages working together in a complete SEO audit + fix workflow.

```ts
import { parseHTML, extractMeta, extractLinks, analyzeSSR } from '@rankforge/core'
import { validateMeta } from '@rankforge/meta'
import { detectImageIssues, generateAltText } from '@rankforge/images'
import { runAudit } from '@rankforge/audit'
import { detectLCPIssues, calculateLCPScore } from '@rankforge/performance'
import { detectHydrationMismatches } from '@rankforge/hydration'
import { detectSEOPoisoning, filterBots } from '@rankforge/security'
import { generateSitemap } from '@rankforge/sitemap'
import { generateHreflang } from '@rankforge/i18n'
import { RUMCollector, AlertEngine, NotificationService } from '@rankforge/monitor'
import { KeywordTracker } from '@rankforge/analytics'
import { generateCDNCacheHeaders } from '@rankforge/edge'
import { AICopilot, AIFixGenerator } from '@rankforge/ai'

async function auditPage(url: string, html: string, llm: LLM) {
  // 1. Block bots from affecting metrics
  const userAgent = request.headers['user-agent'] || ''
  const botCheck = filterBots(userAgent)
  if (botCheck.isBot) {
    console.log(`Bot detected: ${botCheck.botName}`)
  }

  // 2. Parse the page
  const doc = parseHTML(html)
  const meta = extractMeta(doc)
  const links = extractLinks(doc, url)

  // 3. Validate meta tags
  const metaIssues = validateMeta(meta)
  if (metaIssues.some(i => i.severity === 'error')) {
    console.warn('Critical meta issues:', metaIssues.filter(i => i.severity === 'error'))
  }

  // 4. Detect SSR framework
  const ssrResult = analyzeSSR(html)
  console.log(`Framework: ${ssrResult.framework}, SSR: ${ssrResult.isSSR}`)

  // 5. Check for security issues
  const poisoning = detectSEOPoisoning(html)
  if (!poisoning.isClean) {
    console.error('SEO poisoning detected:', poisoning.issues)
    return  // stop processing compromised pages
  }

  // 6. Run full audit
  const report = await runAudit({
    url,
    html,
    metrics: await getRealMetrics(url),  // your metrics source
  })

  // 7. AI-powered analysis for top issues
  const copilot = new AICopilot(llm)
  const topIssue = report.performance[0]
  if (topIssue) {
    const advice = await copilot.ask(`How do I fix ${topIssue.metric}?`, {
      metric: topIssue.metric,
      value: topIssue.value,
      url,
    })
    console.log('Fix steps:', advice.fixSteps)
  }

  // 8. AI fix generation for code issues
  const fixer = new AIFixGenerator(llm)
  for (const seoIssue of report.seo.filter(i => i.severity === 'error')) {
    const fix = await fixer.generateFix({
      issue: { type: seoIssue.rule, element: '' },
      context: url,
    })
    console.log(`Fix for ${seoIssue.rule}:`, fix.after)
  }

  return report
}

async function generateSiteAssets(baseUrl: string, locales: string[]) {
  // 9. Multilingual sitemap
  const pages = ['/home', '/about', '/blog']
  const sitemap = generateSitemap(
    pages.map(path => ({ url: `${baseUrl}${path}`, changefreq: 'weekly', priority: 0.8 }))
  )

  // 10. Hreflang for each page
  for (const path of pages) {
    const hreflangTags = generateHreflang(
      locales.map((locale, i) => ({
        locale,
        url: `${baseUrl}/${locale}${path}`,
        isDefault: i === 0,
      }))
    )
    console.log(`Hreflang for ${path}:`, hreflangTags)
  }

  return sitemap
}

function setupMonitoring() {
  // 11. RUM + Alerts + Notifications
  const rum = new RUMCollector()
  const alerts = new AlertEngine({
    thresholds: {
      LCP: { warning: 2500, critical: 4000 },
      CLS: { warning: 0.1, critical: 0.25 },
    },
  })
  const notif = new NotificationService({
    slack: { webhookUrl: process.env.SLACK_WEBHOOK! },
  })

  return {
    // Call this from your frontend RUM script
    recordMetric: async (entry: RUMEntry) => {
      rum.record(entry)
      const alert = alerts.evaluate({ metric: entry.type, value: entry.value })
      if (alert) {
        await notif.notify({
          channel: 'slack',
          message: alert.message,
          severity: alert.severity,
          data: { url: entry.url, metric: alert.metric, value: alert.value },
        })
      }
    },
    getStats: (url: string) => rum.getMetrics(url),
  }
}

// 12. Edge middleware (Vercel / Cloudflare Worker)
export function middleware(request: Request) {
  const pageType = request.url.includes('/api/') ? 'api'
    : request.url.includes('/blog/') ? 'blog'
    : 'static'

  const cacheHeaders = generateCDNCacheHeaders({
    pageType,
    cdn: 'cloudflare',
    ttl: pageType === 'static' ? 86400 : 3600,
  })

  return new Response(null, { headers: cacheHeaders })
}
```

---

## Installing Individual Packages

Since this is a monorepo, each package can be used independently once published:

```bash
# Install only what you need
npm install @rankforge/core @rankforge/meta @rankforge/audit

# Or install everything
npm install @rankforge/ai @rankforge/analytics @rankforge/audit \
  @rankforge/cli @rankforge/core @rankforge/edge @rankforge/hydration \
  @rankforge/i18n @rankforge/images @rankforge/meta @rankforge/monitor \
  @rankforge/performance @rankforge/schema @rankforge/security @rankforge/sitemap
```
