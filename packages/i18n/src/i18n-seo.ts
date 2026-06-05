export interface HreflangInput {
  locale: string
  url: string
  isDefault?: boolean
}

export interface HreflangTag {
  hreflang: string
  href: string
}

export interface HreflangOptions {
  format?: 'object' | 'html'
}

export interface HreflangIssue {
  type: string
  severity: 'error' | 'warning'
  message: string
}

export type CanonicalStrategy = 'prefix' | 'subdomain' | 'ccTLD'

export interface CanonicalOptions {
  strategy?: CanonicalStrategy
  ccTLD?: string
}

export interface RTLMeta {
  dir: 'rtl' | 'ltr'
  lang: string
}

export interface MultilingualMeta {
  lang: string
  dir: 'rtl' | 'ltr'
  title?: string
  description?: string
}

const RTL_LOCALES = new Set(['ar', 'he', 'fa', 'ur', 'yi', 'dv', 'ps', 'sd', 'ug'])

const VALID_LOCALE_RE = /^[a-z]{2,3}(-[A-Z]{2,3})?$/

export function generateHreflang(
  locales: HreflangInput[],
  options: HreflangOptions = {}
): HreflangTag[] | string[] {
  const tags: HreflangTag[] = locales.map(l => ({ hreflang: l.locale, href: l.url }))

  // Add x-default
  const defaultLocale = locales.find(l => l.isDefault) || locales[0]
  if (defaultLocale) {
    tags.push({ hreflang: 'x-default', href: defaultLocale.url })
  }

  if (options.format === 'html') {
    return tags.map(t => `<link rel="alternate" hreflang="${t.hreflang}" href="${t.href}"/>`)
  }

  return tags
}

export function validateHreflang(tags: HreflangTag[], pageUrl?: string): HreflangIssue[] {
  const issues: HreflangIssue[] = []

  // Check x-default
  if (!tags.find(t => t.hreflang === 'x-default')) {
    issues.push({ type: 'missing-x-default', severity: 'warning', message: 'x-default hreflang is missing' })
  }

  // Check self-reference
  if (pageUrl) {
    const hasSelf = tags.some(t => t.href === pageUrl && t.hreflang !== 'x-default')
    if (!hasSelf) {
      issues.push({ type: 'missing-self-reference', severity: 'error', message: 'Page must include itself in its own hreflang annotations' })
    }
  }

  // Validate locale codes
  for (const tag of tags) {
    if (tag.hreflang === 'x-default') continue
    if (!VALID_LOCALE_RE.test(tag.hreflang)) {
      issues.push({ type: 'invalid-locale', severity: 'error', message: `Invalid locale code: ${tag.hreflang}` })
    }
  }

  // Check absolute URLs
  for (const tag of tags) {
    if (!tag.href.startsWith('http://') && !tag.href.startsWith('https://')) {
      issues.push({ type: 'relative-url', severity: 'error', message: `hreflang href must be absolute URL: ${tag.href}` })
    }
  }

  return issues
}

export function generateLocaleCanonical(url: string, locale: string, options: CanonicalOptions = {}): string {
  const strategy = options.strategy || 'prefix'
  const u = new URL(url)

  if (strategy === 'subdomain') {
    return `${u.protocol}//${locale}.${u.host}${u.pathname}`
  }

  if (strategy === 'ccTLD' && options.ccTLD) {
    const hostParts = u.hostname.split('.')
    hostParts[hostParts.length - 1] = options.ccTLD
    return `${u.protocol}//${hostParts.join('.')}${u.pathname}`
  }

  // prefix strategy
  const path = u.pathname === '/' ? `/${locale}` : `/${locale}${u.pathname}`
  return `${u.protocol}//${u.host}${path}`
}

export function detectUntranslatedPages(
  sitePages: Record<string, string[]>,
  locales: string[]
): Record<string, string[]> {
  const result: Record<string, string[]> = {}
  const masterList = new Set(Object.values(sitePages).flat())

  for (const locale of locales) {
    const localePages = new Set(sitePages[locale] || [])
    result[locale] = [...masterList].filter(page => !localePages.has(page))
  }

  return result
}

export function detectDuplicateLocales(
  pages: Array<{ url: string; locale: string; contentHash: string }>
): Array<{ urls: string[]; contentHash: string }> {
  const hashMap = new Map<string, string[]>()
  for (const page of pages) {
    const existing = hashMap.get(page.contentHash) || []
    existing.push(page.url)
    hashMap.set(page.contentHash, existing)
  }
  return Array.from(hashMap.entries())
    .filter(([, urls]) => urls.length > 1)
    .map(([hash, urls]) => ({ contentHash: hash, urls }))
}

export function generateRTLMeta(locale: string): RTLMeta {
  const lang = locale.split('-')[0]!
  return {
    dir: RTL_LOCALES.has(lang) ? 'rtl' : 'ltr',
    lang: locale,
  }
}

export function generateMultilingualMeta(
  locale: string,
  data: { title?: string; description?: string } = {}
): MultilingualMeta {
  const lang = locale.split('-')[0]!
  return {
    lang: locale,
    dir: RTL_LOCALES.has(lang) ? 'rtl' : 'ltr',
    ...data,
  }
}

export function resolveLocaleRoute(
  url: string,
  options: { strategy: CanonicalStrategy }
): string | null {
  try {
    const u = new URL(url)

    if (options.strategy === 'subdomain') {
      const parts = u.hostname.split('.')
      if (parts.length > 2) {
        const sub = parts[0]!
        if (VALID_LOCALE_RE.test(sub)) return sub
      }
      return null
    }

    if (options.strategy === 'prefix') {
      const match = u.pathname.match(/^\/([a-z]{2}(?:-[A-Z]{2})?)(?:\/|$)/)
      return match ? match[1]! : null
    }
  } catch {}
  return null
}
