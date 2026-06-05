import { describe, it, expect } from 'vitest'
import {
  detectCloaking,
  detectSEOPoisoning,
  detectSpamInjection,
  detectMixedContent,
  detectMaliciousRedirects,
  filterBots,
} from '../security'

describe('Security', () => {
  describe('detectCloaking', () => {
    it('detects different content served to Googlebot vs users', () => {
      const googlebotHTML = `<html><body><h1>Buy Cheap Drugs</h1></body></html>`
      const userHTML = `<html><body><h1>Welcome to our store</h1></body></html>`
      const result = detectCloaking(googlebotHTML, userHTML)
      expect(result.isCloaking).toBe(true)
      expect(result.confidence).toBeGreaterThan(0.8)
    })

    it('returns no cloaking for identical content', () => {
      const html = `<html><body><h1>Same content</h1></body></html>`
      const result = detectCloaking(html, html)
      expect(result.isCloaking).toBe(false)
    })

    it('allows minor differences (e.g., personalization)', () => {
      const botHTML = `<html><body><h1>Product Page</h1><p>Description</p></body></html>`
      const userHTML = `<html><body><h1>Product Page</h1><p>Description</p><div class="recommendation">...</div></body></html>`
      const result = detectCloaking(botHTML, userHTML, { tolerance: 0.1 })
      expect(result.isCloaking).toBe(false)
    })
  })

  describe('detectSEOPoisoning', () => {
    it('detects keyword stuffing', () => {
      const html = `<html><body><p>${'seo seo seo seo '.repeat(50)}</p></body></html>`
      const result = detectSEOPoisoning(html)
      expect(result.issues).toContainEqual(expect.objectContaining({ type: 'keyword-stuffing' }))
    })

    it('detects hidden text (white on white)', () => {
      const html = `<html><body><span style="color:white;background:white">hidden keywords</span></body></html>`
      const result = detectSEOPoisoning(html)
      expect(result.issues).toContainEqual(expect.objectContaining({ type: 'hidden-text' }))
    })

    it('detects display:none spam', () => {
      const html = `<html><body><div style="display:none">buy cheap pills online pharmacy</div></body></html>`
      const result = detectSEOPoisoning(html)
      expect(result.issues).toContainEqual(expect.objectContaining({ type: 'hidden-content' }))
    })

    it('detects doorway pages pattern', () => {
      const pages = Array.from({ length: 20 }, (_, i) => ({
        url: `https://example.com/city-${i}-dentist`,
        title: `Best Dentist in City ${i}`,
        content: `Looking for a dentist in City ${i}? We are the best dentist in City ${i}.`,
      }))
      const result = detectSEOPoisoning(null, { pages })
      expect(result.issues).toContainEqual(expect.objectContaining({ type: 'doorway-pages' }))
    })
  })

  describe('detectSpamInjection', () => {
    it('detects injected spam links', () => {
      const html = `<html><body>
        <p>Normal content</p>
        <a href="https://casino-spam.com" style="display:none">casino</a>
        <a href="https://pharma-spam.com" style="visibility:hidden">pills</a>
      </body></html>`
      const result = detectSpamInjection(html)
      expect(result.hasSpam).toBe(true)
      expect(result.spamLinks.length).toBeGreaterThan(0)
    })

    it('detects script injection attempts', () => {
      const html = `<html><body><script>document.write('<a href="http://malware.com">click</a>')</script></body></html>`
      const result = detectSpamInjection(html)
      expect(result.hasScriptInjection).toBe(true)
    })

    it('returns clean for normal content', () => {
      const html = `<html><body><p>Normal page content with legitimate links.</p><a href="/about">About</a></body></html>`
      const result = detectSpamInjection(html)
      expect(result.hasSpam).toBe(false)
    })
  })

  describe('detectMixedContent', () => {
    it('detects HTTP images on HTTPS page', () => {
      const html = `<html><body><img src="http://cdn.example.com/img.jpg"/></body></html>`
      const result = detectMixedContent(html, 'https://example.com')
      expect(result.issues).toContainEqual(expect.objectContaining({ type: 'image', url: 'http://cdn.example.com/img.jpg' }))
    })

    it('detects HTTP scripts on HTTPS page', () => {
      const html = `<html><head><script src="http://cdn.example.com/lib.js"></script></head></html>`
      const result = detectMixedContent(html, 'https://example.com')
      expect(result.issues).toContainEqual(expect.objectContaining({ type: 'script', severity: 'error' }))
    })

    it('passes for fully HTTPS page', () => {
      const html = `<html><head><script src="https://cdn.example.com/lib.js"></script></head><body><img src="https://cdn.example.com/img.jpg"/></body></html>`
      const result = detectMixedContent(html, 'https://example.com')
      expect(result.issues).toHaveLength(0)
    })

    it('ignores relative URLs', () => {
      const html = `<html><body><img src="/img.jpg"/></body></html>`
      const result = detectMixedContent(html, 'https://example.com')
      expect(result.issues).toHaveLength(0)
    })
  })

  describe('detectMaliciousRedirects', () => {
    it('detects redirect to suspicious domain', () => {
      const redirects = [
        { from: 'https://example.com/', to: 'https://malware-site.xyz/', status: 301 },
      ]
      const result = detectMaliciousRedirects(redirects)
      expect(result.suspicious.length).toBeGreaterThan(0)
    })

    it('allows legitimate redirects', () => {
      const redirects = [
        { from: 'https://example.com/old', to: 'https://example.com/new', status: 301 },
      ]
      const result = detectMaliciousRedirects(redirects)
      expect(result.suspicious).toHaveLength(0)
    })
  })

  describe('filterBots', () => {
    it('identifies Googlebot by User-Agent', () => {
      const ua = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
      const result = filterBots(ua)
      expect(result.isBot).toBe(true)
      expect(result.botType).toBe('googlebot')
    })

    it('identifies human browser traffic', () => {
      const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      const result = filterBots(ua)
      expect(result.isBot).toBe(false)
    })

    it('identifies suspicious bot patterns', () => {
      const ua = 'SemrushBot/7~bl'
      const result = filterBots(ua)
      expect(result.isBot).toBe(true)
    })
  })
})
