import { describe, it, expect } from 'vitest'
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
} from '../sitemap'

describe('Sitemap Generator', () => {
  const baseUrls = [
    { url: 'https://example.com/', lastmod: '2024-01-01', changefreq: 'daily', priority: 1.0 },
    { url: 'https://example.com/about', lastmod: '2024-01-01', changefreq: 'monthly', priority: 0.8 },
    { url: 'https://example.com/blog', lastmod: '2024-06-01', changefreq: 'weekly', priority: 0.9 },
  ]

  describe('generateSitemap', () => {
    it('generates valid XML sitemap', () => {
      const xml = generateSitemap(baseUrls)
      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
      expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
      expect(xml).toContain('<url>')
      expect(xml).toContain('<loc>https://example.com/</loc>')
      expect(xml).toContain('</urlset>')
    })

    it('includes lastmod when provided', () => {
      const xml = generateSitemap(baseUrls)
      expect(xml).toContain('<lastmod>2024-01-01</lastmod>')
    })

    it('includes changefreq when provided', () => {
      const xml = generateSitemap(baseUrls)
      expect(xml).toContain('<changefreq>daily</changefreq>')
    })

    it('includes priority when provided', () => {
      const xml = generateSitemap(baseUrls)
      expect(xml).toContain('<priority>1.0</priority>')
    })

    it('generates sitemap with 50000+ URLs', () => {
      const bigList = Array.from({ length: 50001 }, (_, i) => ({
        url: `https://example.com/page-${i}`,
      }))
      expect(() => generateSitemap(bigList)).not.toThrow()
    })

    it('omits optional fields when not provided', () => {
      const xml = generateSitemap([{ url: 'https://example.com/' }])
      expect(xml).not.toContain('<lastmod>')
      expect(xml).not.toContain('<changefreq>')
    })
  })

  describe('generateImageSitemap', () => {
    it('generates image sitemap with image namespace', () => {
      const xml = generateImageSitemap([
        {
          url: 'https://example.com/gallery',
          images: [
            { loc: 'https://example.com/img1.jpg', title: 'Image 1', caption: 'Caption 1' },
            { loc: 'https://example.com/img2.jpg', title: 'Image 2' },
          ],
        },
      ])
      expect(xml).toContain('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"')
      expect(xml).toContain('<image:image>')
      expect(xml).toContain('<image:loc>https://example.com/img1.jpg</image:loc>')
      expect(xml).toContain('<image:title>Image 1</image:title>')
      expect(xml).toContain('<image:caption>Caption 1</image:caption>')
    })
  })

  describe('generateVideoSitemap', () => {
    it('generates video sitemap with video namespace', () => {
      const xml = generateVideoSitemap([
        {
          url: 'https://example.com/video',
          video: {
            thumbnailLoc: 'https://example.com/thumb.jpg',
            title: 'My Video',
            description: 'Video description',
            contentLoc: 'https://example.com/video.mp4',
            duration: 300,
          },
        },
      ])
      expect(xml).toContain('xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"')
      expect(xml).toContain('<video:title>My Video</video:title>')
      expect(xml).toContain('<video:duration>300</video:duration>')
    })
  })

  describe('generateNewsSitemap', () => {
    it('generates news sitemap', () => {
      const xml = generateNewsSitemap([
        {
          url: 'https://example.com/news/article',
          news: {
            publicationName: 'Example News',
            publicationLanguage: 'en',
            title: 'Breaking News Article',
            publicationDate: new Date().toISOString(),
          },
        },
      ])
      expect(xml).toContain('xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"')
      expect(xml).toContain('<news:title>Breaking News Article</news:title>')
    })

    it('rejects news articles older than 2 days', () => {
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 3)
      expect(() => generateNewsSitemap([{
        url: 'https://example.com/old',
        news: {
          publicationName: 'News',
          publicationLanguage: 'en',
          title: 'Old Article',
          publicationDate: oldDate.toISOString(),
        },
      }])).toThrow(/too old/)
    })
  })

  describe('generateMultilingualSitemap', () => {
    it('generates sitemap with hreflang alternate links', () => {
      const xml = generateMultilingualSitemap([
        {
          url: 'https://example.com/en/page',
          alternates: [
            { hreflang: 'en', href: 'https://example.com/en/page' },
            { hreflang: 'fr', href: 'https://example.com/fr/page' },
            { hreflang: 'x-default', href: 'https://example.com/en/page' },
          ],
        },
      ])
      expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"')
      expect(xml).toContain('xhtml:link')
      expect(xml).toContain('hreflang="en"')
      expect(xml).toContain('hreflang="fr"')
      expect(xml).toContain('hreflang="x-default"')
    })
  })

  describe('generateSitemapIndex', () => {
    it('generates sitemap index file', () => {
      const xml = generateSitemapIndex([
        { loc: 'https://example.com/sitemap-1.xml', lastmod: '2024-01-01' },
        { loc: 'https://example.com/sitemap-2.xml', lastmod: '2024-01-01' },
      ])
      expect(xml).toContain('<sitemapindex')
      expect(xml).toContain('<sitemap>')
      expect(xml).toContain('<loc>https://example.com/sitemap-1.xml</loc>')
    })
  })

  describe('chunkSitemap', () => {
    it('splits large URL list into chunks of 50000', () => {
      const urls = Array.from({ length: 120000 }, (_, i) => ({ url: `https://example.com/p${i}` }))
      const chunks = chunkSitemap(urls, 50000)
      expect(chunks).toHaveLength(3)
      expect(chunks[0]).toHaveLength(50000)
      expect(chunks[2]).toHaveLength(20000)
    })
  })

  describe('compressSitemap', () => {
    it('returns gzipped buffer', async () => {
      const xml = generateSitemap(baseUrls)
      const compressed = await compressSitemap(xml)
      expect(compressed).toBeInstanceOf(Buffer)
      expect(compressed.length).toBeLessThan(Buffer.byteLength(xml))
    })
  })

  describe('validateSitemap', () => {
    it('passes validation for valid sitemap', () => {
      const xml = generateSitemap(baseUrls)
      const result = validateSitemap(xml)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('fails validation for malformed XML', () => {
      const result = validateSitemap('<broken xml')
      expect(result.isValid).toBe(false)
    })

    it('warns about URLs exceeding 2048 chars', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(2050)
      const xml = generateSitemap([{ url: longUrl }])
      const result = validateSitemap(xml)
      expect(result.warnings).toContainEqual(expect.objectContaining({ type: 'url-too-long' }))
    })
  })
})
