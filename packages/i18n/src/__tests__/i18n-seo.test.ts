import { describe, it, expect } from 'vitest'
import {
  generateHreflang,
  validateHreflang,
  generateLocaleCanonical,
  detectUntranslatedPages,
  detectDuplicateLocales,
  generateRTLMeta,
  generateMultilingualMeta,
  resolveLocaleRoute,
} from '../i18n-seo'

describe('i18n SEO', () => {
  describe('generateHreflang', () => {
    it('generates hreflang link tags', () => {
      const tags = generateHreflang([
        { locale: 'en', url: 'https://example.com/en/page' },
        { locale: 'fr', url: 'https://example.com/fr/page' },
        { locale: 'de', url: 'https://example.com/de/page' },
      ])
      expect(tags).toHaveLength(4) // 3 locales + x-default
      expect(tags).toContainEqual(expect.objectContaining({ hreflang: 'en', href: 'https://example.com/en/page' }))
      expect(tags).toContainEqual(expect.objectContaining({ hreflang: 'x-default' }))
    })

    it('allows explicit x-default override', () => {
      const tags = generateHreflang([
        { locale: 'en', url: 'https://example.com/en/page' },
        { locale: 'fr', url: 'https://example.com/fr/page', isDefault: true },
      ])
      const xDefault = tags.find(t => t.hreflang === 'x-default')
      expect(xDefault?.href).toBe('https://example.com/fr/page')
    })

    it('supports region-specific locales', () => {
      const tags = generateHreflang([
        { locale: 'en-US', url: 'https://example.com/en-us' },
        { locale: 'en-GB', url: 'https://example.com/en-gb' },
      ])
      expect(tags).toContainEqual(expect.objectContaining({ hreflang: 'en-US' }))
      expect(tags).toContainEqual(expect.objectContaining({ hreflang: 'en-GB' }))
    })

    it('generates HTML link tags as string', () => {
      const html = generateHreflang([
        { locale: 'en', url: 'https://example.com/en' },
      ], { format: 'html' })
      expect(html[0]).toContain('<link rel="alternate"')
      expect(html[0]).toContain('hreflang="en"')
    })
  })

  describe('validateHreflang', () => {
    it('detects missing x-default', () => {
      const issues = validateHreflang([
        { hreflang: 'en', href: 'https://example.com/en' },
        { hreflang: 'fr', href: 'https://example.com/fr' },
      ])
      expect(issues).toContainEqual(expect.objectContaining({ type: 'missing-x-default' }))
    })

    it('detects self-referencing missing (page not in its own hreflang)', () => {
      const pageUrl = 'https://example.com/en'
      const hreflang = [
        { hreflang: 'fr', href: 'https://example.com/fr' },
        { hreflang: 'x-default', href: 'https://example.com/en' },
      ]
      const issues = validateHreflang(hreflang, pageUrl)
      expect(issues).toContainEqual(expect.objectContaining({ type: 'missing-self-reference' }))
    })

    it('detects invalid locale codes', () => {
      const issues = validateHreflang([
        { hreflang: 'invalid-locale-code-xyz', href: 'https://example.com' },
      ])
      expect(issues).toContainEqual(expect.objectContaining({ type: 'invalid-locale' }))
    })

    it('detects absolute URL requirement', () => {
      const issues = validateHreflang([
        { hreflang: 'en', href: '/relative-url' },
      ])
      expect(issues).toContainEqual(expect.objectContaining({ type: 'relative-url' }))
    })

    it('passes for valid hreflang set', () => {
      const pageUrl = 'https://example.com/en'
      const issues = validateHreflang([
        { hreflang: 'en', href: 'https://example.com/en' },
        { hreflang: 'fr', href: 'https://example.com/fr' },
        { hreflang: 'x-default', href: 'https://example.com/en' },
      ], pageUrl)
      const errors = issues.filter(i => i.severity === 'error')
      expect(errors).toHaveLength(0)
    })
  })

  describe('generateLocaleCanonical', () => {
    it('generates locale-specific canonical URL', () => {
      const canonical = generateLocaleCanonical('https://example.com/page', 'fr')
      expect(canonical).toBe('https://example.com/fr/page')
    })

    it('handles root path', () => {
      const canonical = generateLocaleCanonical('https://example.com', 'de')
      expect(canonical).toBe('https://example.com/de')
    })

    it('uses subdomain strategy when configured', () => {
      const canonical = generateLocaleCanonical('https://example.com/page', 'fr', { strategy: 'subdomain' })
      expect(canonical).toBe('https://fr.example.com/page')
    })

    it('uses ccTLD strategy when configured', () => {
      const canonical = generateLocaleCanonical('https://example.com/page', 'fr', { strategy: 'ccTLD', ccTLD: 'fr' })
      expect(canonical).toBe('https://example.fr/page')
    })
  })

  describe('detectUntranslatedPages', () => {
    it('detects pages missing translations', () => {
      const sitePages = {
        en: ['/about', '/contact', '/products'],
        fr: ['/about', '/contact'],
        de: ['/about'],
      }
      const results = detectUntranslatedPages(sitePages, ['en', 'fr', 'de'])
      expect(results.fr).toContain('/products')
      expect(results.de).toContain('/contact')
      expect(results.de).toContain('/products')
    })

    it('returns empty when all translations exist', () => {
      const sitePages = {
        en: ['/about'],
        fr: ['/about'],
      }
      const results = detectUntranslatedPages(sitePages, ['en', 'fr'])
      expect(results.en).toHaveLength(0)
      expect(results.fr).toHaveLength(0)
    })
  })

  describe('detectDuplicateLocales', () => {
    it('detects pages with same content across locales', () => {
      const pages = [
        { url: 'https://example.com/en/page', locale: 'en', contentHash: 'abc123' },
        { url: 'https://example.com/fr/page', locale: 'fr', contentHash: 'abc123' },
      ]
      const duplicates = detectDuplicateLocales(pages)
      expect(duplicates).toHaveLength(1)
      expect(duplicates[0].urls).toHaveLength(2)
    })
  })

  describe('RTL support', () => {
    it('generates correct dir attribute for RTL languages', () => {
      const meta = generateRTLMeta('ar')
      expect(meta.dir).toBe('rtl')
      expect(meta.lang).toBe('ar')
    })

    it('generates ltr for standard languages', () => {
      const meta = generateRTLMeta('en')
      expect(meta.dir).toBe('ltr')
    })

    it('handles Hebrew', () => {
      expect(generateRTLMeta('he').dir).toBe('rtl')
    })

    it('handles Persian', () => {
      expect(generateRTLMeta('fa').dir).toBe('rtl')
    })
  })

  describe('resolveLocaleRoute', () => {
    it('resolves locale from URL path', () => {
      expect(resolveLocaleRoute('https://example.com/fr/page', { strategy: 'prefix' })).toBe('fr')
    })

    it('resolves locale from subdomain', () => {
      expect(resolveLocaleRoute('https://fr.example.com/page', { strategy: 'subdomain' })).toBe('fr')
    })

    it('returns null for unknown locale', () => {
      expect(resolveLocaleRoute('https://example.com/page', { strategy: 'prefix' })).toBeNull()
    })
  })
})
