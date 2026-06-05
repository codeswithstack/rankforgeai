import { gzipSync } from 'zlib'

export interface SitemapURL {
  url: string
  lastmod?: string
  changefreq?: string
  priority?: number
}

export interface ImageEntry {
  loc: string
  title?: string
  caption?: string
  geoLocation?: string
  license?: string
}

export interface ImagePageEntry {
  url: string
  images: ImageEntry[]
  lastmod?: string
}

export interface VideoEntry {
  thumbnailLoc: string
  title: string
  description?: string
  contentLoc?: string
  playerLoc?: string
  duration?: number
  publicationDate?: string
  family_friendly?: boolean
}

export interface VideoPageEntry {
  url: string
  video: VideoEntry
  lastmod?: string
}

export interface NewsEntry {
  publicationName: string
  publicationLanguage: string
  title: string
  publicationDate: string
  genres?: string
  keywords?: string
}

export interface NewsPageEntry {
  url: string
  news: NewsEntry
}

export interface HreflangEntry {
  hreflang: string
  href: string
}

export interface MultilingualPageEntry {
  url: string
  alternates: HreflangEntry[]
  lastmod?: string
}

export interface SitemapIndexEntry {
  loc: string
  lastmod?: string
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: Array<{ type: string; url?: string; message: string }>
}

function xmlHeader(): string {
  return '<?xml version="1.0" encoding="UTF-8"?>\n'
}

function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function generateSitemap(urls: SitemapURL[]): string {
  const entries = urls.map(u => {
    let entry = `  <url>\n    <loc>${escapeXML(u.url)}</loc>\n`
    if (u.lastmod) entry += `    <lastmod>${u.lastmod}</lastmod>\n`
    if (u.changefreq) entry += `    <changefreq>${u.changefreq}</changefreq>\n`
    if (u.priority !== undefined) entry += `    <priority>${u.priority.toFixed(1)}</priority>\n`
    entry += `  </url>`
    return entry
  })
  return (
    xmlHeader() +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries.join('\n') +
    `\n</urlset>`
  )
}

export function generateImageSitemap(pages: ImagePageEntry[]): string {
  const entries = pages.map(p => {
    let entry = `  <url>\n    <loc>${escapeXML(p.url)}</loc>\n`
    for (const img of p.images) {
      entry += `    <image:image>\n`
      entry += `      <image:loc>${escapeXML(img.loc)}</image:loc>\n`
      if (img.title) entry += `      <image:title>${escapeXML(img.title)}</image:title>\n`
      if (img.caption) entry += `      <image:caption>${escapeXML(img.caption)}</image:caption>\n`
      entry += `    </image:image>\n`
    }
    entry += `  </url>`
    return entry
  })
  return (
    xmlHeader() +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n` +
    `        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n` +
    entries.join('\n') +
    `\n</urlset>`
  )
}

export function generateVideoSitemap(pages: VideoPageEntry[]): string {
  const entries = pages.map(p => {
    const v = p.video
    let entry = `  <url>\n    <loc>${escapeXML(p.url)}</loc>\n    <video:video>\n`
    entry += `      <video:thumbnail_loc>${escapeXML(v.thumbnailLoc)}</video:thumbnail_loc>\n`
    entry += `      <video:title>${escapeXML(v.title)}</video:title>\n`
    if (v.description) entry += `      <video:description>${escapeXML(v.description)}</video:description>\n`
    if (v.contentLoc) entry += `      <video:content_loc>${escapeXML(v.contentLoc)}</video:content_loc>\n`
    if (v.duration !== undefined) entry += `      <video:duration>${v.duration}</video:duration>\n`
    entry += `    </video:video>\n  </url>`
    return entry
  })
  return (
    xmlHeader() +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n` +
    `        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n` +
    entries.join('\n') +
    `\n</urlset>`
  )
}

export function generateNewsSitemap(pages: NewsPageEntry[]): string {
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  const entries = pages.map(p => {
    const pubDate = new Date(p.news.publicationDate)
    if (pubDate < twoDaysAgo) {
      throw new Error(`News article is too old for news sitemap: ${p.url}`)
    }
    let entry = `  <url>\n    <loc>${escapeXML(p.url)}</loc>\n    <news:news>\n`
    entry += `      <news:publication>\n`
    entry += `        <news:name>${escapeXML(p.news.publicationName)}</news:name>\n`
    entry += `        <news:language>${p.news.publicationLanguage}</news:language>\n`
    entry += `      </news:publication>\n`
    entry += `      <news:publication_date>${p.news.publicationDate}</news:publication_date>\n`
    entry += `      <news:title>${escapeXML(p.news.title)}</news:title>\n`
    entry += `    </news:news>\n  </url>`
    return entry
  })
  return (
    xmlHeader() +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n` +
    `        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n` +
    entries.join('\n') +
    `\n</urlset>`
  )
}

export function generateMultilingualSitemap(pages: MultilingualPageEntry[]): string {
  const entries = pages.map(p => {
    let entry = `  <url>\n    <loc>${escapeXML(p.url)}</loc>\n`
    for (const alt of p.alternates) {
      entry += `    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${escapeXML(alt.href)}"/>\n`
    }
    entry += `  </url>`
    return entry
  })
  return (
    xmlHeader() +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n` +
    `        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
    entries.join('\n') +
    `\n</urlset>`
  )
}

export function generateSitemapIndex(sitemaps: SitemapIndexEntry[]): string {
  const entries = sitemaps.map(s => {
    let entry = `  <sitemap>\n    <loc>${escapeXML(s.loc)}</loc>\n`
    if (s.lastmod) entry += `    <lastmod>${s.lastmod}</lastmod>\n`
    entry += `  </sitemap>`
    return entry
  })
  return (
    xmlHeader() +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries.join('\n') +
    `\n</sitemapindex>`
  )
}

export function chunkSitemap<T>(urls: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < urls.length; i += size) {
    chunks.push(urls.slice(i, i + size))
  }
  return chunks
}

export async function compressSitemap(xml: string): Promise<Buffer> {
  return Buffer.from(gzipSync(Buffer.from(xml, 'utf-8')))
}

export function validateSitemap(xml: string): ValidationResult {
  const errors: string[] = []
  const warnings: Array<{ type: string; url?: string; message: string }> = []

  if (!xml.startsWith('<?xml')) {
    errors.push('Missing XML declaration')
    return { isValid: false, errors, warnings }
  }

  if (!xml.includes('<urlset') && !xml.includes('<sitemapindex')) {
    errors.push('Missing root element <urlset> or <sitemapindex>')
    return { isValid: false, errors, warnings }
  }

  // Check for unclosed tags
  const openTags = (xml.match(/<[^/!?][^>]*>/g) || []).length
  const closeTags = (xml.match(/<\/[^>]+>/g) || []).length
  const selfClose = (xml.match(/<[^>]+\/>/g) || []).length
  if (openTags - selfClose !== closeTags) {
    errors.push('Malformed XML: unmatched tags')
  }

  // Warn about long URLs
  const urlMatches = xml.match(/<loc>([^<]+)<\/loc>/g) || []
  for (const urlMatch of urlMatches) {
    const url = urlMatch.replace(/<\/?loc>/g, '')
    if (url.length > 2048) {
      warnings.push({ type: 'url-too-long', url, message: `URL exceeds 2048 characters` })
    }
  }

  return { isValid: errors.length === 0, errors, warnings }
}
