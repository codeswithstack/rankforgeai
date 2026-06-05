// ─── Edge SEO Optimizer ───────────────────────────────────────────────────────
export interface HreflangTag {
  hreflang: string
  href: string
}

export class EdgeSEOOptimizer {
  rewriteMetaTags(input: {
    html: string
    geo: { country: string; language: string }
    translations?: Record<string, { title?: string; description?: string }>
  }): string {
    let html = input.html
    const translation = input.translations?.[input.geo.country]
    if (!translation) return html

    if (translation.title) {
      html = html.replace(/<title[^>]*>([^<]*)<\/title>/i, `<title>${translation.title}</title>`)
    }
    if (translation.description) {
      html = html.replace(
        /(<meta[^>]+name=["']description["'][^>]+content=["'])([^"']+)(["'])/i,
        `$1${translation.description}$3`
      )
    }
    return html
  }

  injectHreflang(input: { html: string; locales: HreflangTag[] }): string {
    const tags = input.locales
      .map(l => `<link rel="alternate" hreflang="${l.hreflang}" href="${l.href}"/>`)
      .join('\n')
    return input.html.replace(/<\/head>/i, `${tags}\n</head>`)
  }

  getCanonicalHeaders(url: string): Record<string, string> {
    return { 'Link': `<${url}>; rel="canonical"` }
  }
}

// ─── Geo SEO Detection ────────────────────────────────────────────────────────
export interface GeoSEOIssue {
  type: string
  severity: 'error' | 'warning'
  message: string
}

export interface GeoSEOSuggestion {
  type: string
  message: string
}

export interface GeoSEOResult {
  issues: GeoSEOIssue[]
  suggestions: GeoSEOSuggestion[]
}

export function detectGeoSEO(input: {
  targetRegions: string[]
  hasHreflang?: boolean
  hasGeoMeta?: boolean
  serverRegion?: string
  hasCDN?: boolean
}): GeoSEOResult {
  const issues: GeoSEOIssue[] = []
  const suggestions: GeoSEOSuggestion[] = []

  if (input.targetRegions.length > 1 && !input.hasHreflang) {
    issues.push({ type: 'missing-hreflang', severity: 'error', message: 'Multi-region site missing hreflang annotations' })
  }

  if (input.targetRegions.length > 2 && !input.hasCDN) {
    suggestions.push({ type: 'add-cdn', message: `Site targets ${input.targetRegions.length} regions but has no CDN — add edge delivery for better TTFB globally` })
  }

  return { issues, suggestions }
}

// ─── CDN Cache Headers ────────────────────────────────────────────────────────
export type PageType = 'static' | 'personalized' | 'blog' | 'api' | 'dynamic'
export type CDNProvider = 'cloudflare' | 'fastly' | 'vercel' | 'cloudfront'

export function generateCDNCacheHeaders(input: {
  pageType: PageType
  ttl?: number
  swr?: number
  cdn?: CDNProvider
}): Record<string, string> {
  const headers: Record<string, string> = {}

  if (input.pageType === 'personalized') {
    headers['Cache-Control'] = 'private, no-store'
    return headers
  }

  if (input.pageType === 'api') {
    headers['Cache-Control'] = 'no-cache, no-store'
    return headers
  }

  const ttl = input.ttl ?? 3600
  const parts: string[] = ['public', `max-age=${ttl}`]

  if (input.swr) {
    parts.push(`stale-while-revalidate=${input.swr}`)
  }

  headers['Cache-Control'] = parts.join(', ')

  if (input.cdn === 'cloudflare') {
    headers['CDN-Cache-Control'] = `public, max-age=${ttl}`
  } else if (input.cdn === 'fastly') {
    headers['Surrogate-Control'] = `max-age=${ttl}`
  }

  return headers
}

// ─── Edge Rendering Analysis ──────────────────────────────────────────────────
export interface EdgePage {
  path: string
  renderMode?: 'SSR' | 'SSG' | 'ISR' | 'CSR'
  revalidate?: number
  avgUpdateFrequency?: string
}

export interface EdgeRenderingResult {
  isrPages: EdgePage[]
  suggestions: Array<{ type: string; page: string; message: string }>
}

export function analyzeEdgeRendering(config: {
  framework: string
  pages: EdgePage[]
}): EdgeRenderingResult {
  const isrPages = config.pages.filter(p => p.revalidate !== undefined && p.revalidate > 0)
  const suggestions: Array<{ type: string; page: string; message: string }> = []

  for (const page of config.pages) {
    if (page.renderMode === 'SSR' && page.avgUpdateFrequency === 'hourly') {
      suggestions.push({
        type: 'use-isr',
        page: page.path,
        message: `${page.path} updates hourly — use ISR with revalidate=3600 instead of full SSR for better performance`,
      })
    }
    if (page.renderMode === 'CSR') {
      suggestions.push({
        type: 'use-ssr',
        page: page.path,
        message: `${page.path} is client-side rendered — switch to SSR or SSG for better SEO`,
      })
    }
  }

  return { isrPages, suggestions }
}
