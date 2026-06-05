import { describe, it, expect } from 'vitest'
import { parseHTML, extractMeta, extractHeadings, extractLinks } from '../html-parser'

describe('HTML Parser', () => {
  describe('parseHTML', () => {
    it('parses valid HTML document', () => {
      const html = `<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Hello</h1></body></html>`
      const doc = parseHTML(html)
      expect(doc).toBeDefined()
      expect(doc.title).toBe('Test')
    })

    it('handles malformed HTML gracefully', () => {
      const html = `<html><head><title>Broken`
      expect(() => parseHTML(html)).not.toThrow()
    })

    it('handles empty string', () => {
      expect(() => parseHTML('')).not.toThrow()
    })

    it('handles HTML with special characters', () => {
      const html = `<title>Test & Demo "Page" <Site></title>`
      const doc = parseHTML(html)
      expect(doc).toBeDefined()
    })
  })

  describe('extractMeta', () => {
    it('extracts title tag', () => {
      const html = `<html><head><title>My Page Title</title></head></html>`
      const meta = extractMeta(parseHTML(html))
      expect(meta.title).toBe('My Page Title')
    })

    it('extracts meta description', () => {
      const html = `<html><head><meta name="description" content="Page description here"/></head></html>`
      const meta = extractMeta(parseHTML(html))
      expect(meta.description).toBe('Page description here')
    })

    it('extracts canonical URL', () => {
      const html = `<html><head><link rel="canonical" href="https://example.com/page"/></head></html>`
      const meta = extractMeta(parseHTML(html))
      expect(meta.canonical).toBe('https://example.com/page')
    })

    it('extracts robots meta', () => {
      const html = `<html><head><meta name="robots" content="noindex,nofollow"/></head></html>`
      const meta = extractMeta(parseHTML(html))
      expect(meta.robots).toBe('noindex,nofollow')
    })

    it('extracts Open Graph tags', () => {
      const html = `<html><head>
        <meta property="og:title" content="OG Title"/>
        <meta property="og:description" content="OG Desc"/>
        <meta property="og:image" content="https://example.com/img.png"/>
        <meta property="og:url" content="https://example.com/page"/>
      </head></html>`
      const meta = extractMeta(parseHTML(html))
      expect(meta.og.title).toBe('OG Title')
      expect(meta.og.description).toBe('OG Desc')
      expect(meta.og.image).toBe('https://example.com/img.png')
      expect(meta.og.url).toBe('https://example.com/page')
    })

    it('returns empty object when no meta tags found', () => {
      const html = `<html><head></head><body></body></html>`
      const meta = extractMeta(parseHTML(html))
      expect(meta.title).toBeUndefined()
      expect(meta.description).toBeUndefined()
    })
  })

  describe('extractHeadings', () => {
    it('extracts all heading levels', () => {
      const html = `<html><body>
        <h1>Main Heading</h1>
        <h2>Sub Heading</h2>
        <h3>Sub Sub Heading</h3>
      </body></html>`
      const headings = extractHeadings(parseHTML(html))
      expect(headings).toHaveLength(3)
      expect(headings[0]).toEqual({ level: 1, text: 'Main Heading' })
      expect(headings[1]).toEqual({ level: 2, text: 'Sub Heading' })
      expect(headings[2]).toEqual({ level: 3, text: 'Sub Sub Heading' })
    })

    it('detects missing H1', () => {
      const html = `<html><body><h2>Only H2</h2></body></html>`
      const headings = extractHeadings(parseHTML(html))
      const h1 = headings.filter(h => h.level === 1)
      expect(h1).toHaveLength(0)
    })

    it('detects multiple H1 tags', () => {
      const html = `<html><body><h1>First H1</h1><h1>Second H1</h1></body></html>`
      const headings = extractHeadings(parseHTML(html))
      const h1s = headings.filter(h => h.level === 1)
      expect(h1s).toHaveLength(2)
    })

    it('returns empty array when no headings', () => {
      const html = `<html><body><p>No headings</p></body></html>`
      const headings = extractHeadings(parseHTML(html))
      expect(headings).toHaveLength(0)
    })
  })

  describe('extractLinks', () => {
    it('extracts all anchor links', () => {
      const html = `<html><body>
        <a href="https://example.com">External</a>
        <a href="/internal">Internal</a>
      </body></html>`
      const links = extractLinks(parseHTML(html))
      expect(links).toHaveLength(2)
    })

    it('classifies internal vs external links', () => {
      const html = `<html><body>
        <a href="https://external.com">Ext</a>
        <a href="/page">Int</a>
      </body></html>`
      const links = extractLinks(parseHTML(html), 'https://mysite.com')
      const external = links.filter(l => l.type === 'external')
      const internal = links.filter(l => l.type === 'internal')
      expect(external).toHaveLength(1)
      expect(internal).toHaveLength(1)
    })

    it('detects nofollow links', () => {
      const html = `<html><body><a href="https://example.com" rel="nofollow">NF</a></body></html>`
      const links = extractLinks(parseHTML(html))
      expect(links[0].nofollow).toBe(true)
    })

    it('handles links with no href', () => {
      const html = `<html><body><a>No href</a></body></html>`
      const links = extractLinks(parseHTML(html))
      expect(links[0].href).toBeUndefined()
    })
  })
})
