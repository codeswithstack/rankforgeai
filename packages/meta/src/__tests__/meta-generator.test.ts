import { describe, it, expect } from 'vitest'
import { generateMeta, validateMeta, truncateTitle, generateSERPPreview } from '../meta-generator'

describe('Meta Generator', () => {
  describe('generateMeta', () => {
    it('generates complete meta tags from page data', () => {
      const meta = generateMeta({
        title: 'My Page',
        description: 'This is a description of my page.',
        url: 'https://example.com/page',
        image: 'https://example.com/img.png',
      })
      expect(meta.title).toBe('My Page')
      expect(meta.description).toBe('This is a description of my page.')
      expect(meta.canonical).toBe('https://example.com/page')
      expect(meta.og.title).toBe('My Page')
      expect(meta.og.image).toBe('https://example.com/img.png')
    })

    it('auto-generates description from content when not provided', () => {
      const meta = generateMeta({
        title: 'Page',
        content: 'This is the main content of the page. It has multiple sentences.',
        url: 'https://example.com',
      })
      expect(meta.description).toBeDefined()
      expect(meta.description!.length).toBeGreaterThan(0)
    })

    it('includes twitter card tags', () => {
      const meta = generateMeta({
        title: 'Test',
        url: 'https://example.com',
        image: 'https://example.com/img.png',
      })
      expect(meta.twitter.card).toBe('summary_large_image')
      expect(meta.twitter.title).toBe('Test')
    })

    it('sets robots to index,follow by default', () => {
      const meta = generateMeta({ title: 'Test', url: 'https://example.com' })
      expect(meta.robots).toBe('index,follow')
    })

    it('allows overriding robots directive', () => {
      const meta = generateMeta({
        title: 'Test',
        url: 'https://example.com',
        robots: 'noindex',
      })
      expect(meta.robots).toBe('noindex')
    })
  })

  describe('validateMeta', () => {
    it('flags missing title', () => {
      const issues = validateMeta({ description: 'desc', url: 'https://example.com' })
      expect(issues).toContainEqual(expect.objectContaining({ field: 'title', severity: 'error' }))
    })

    it('flags title too long (>60 chars)', () => {
      const longTitle = 'A'.repeat(61)
      const issues = validateMeta({ title: longTitle, url: 'https://example.com' })
      expect(issues).toContainEqual(expect.objectContaining({ field: 'title', type: 'too-long' }))
    })

    it('flags title too short (<10 chars)', () => {
      const issues = validateMeta({ title: 'Hi', url: 'https://example.com' })
      expect(issues).toContainEqual(expect.objectContaining({ field: 'title', type: 'too-short' }))
    })

    it('flags missing description', () => {
      const issues = validateMeta({ title: 'Valid Title', url: 'https://example.com' })
      expect(issues).toContainEqual(expect.objectContaining({ field: 'description', severity: 'warning' }))
    })

    it('flags description too long (>160 chars)', () => {
      const longDesc = 'A'.repeat(161)
      const issues = validateMeta({ title: 'Title', description: longDesc, url: 'https://example.com' })
      expect(issues).toContainEqual(expect.objectContaining({ field: 'description', type: 'too-long' }))
    })

    it('flags description too short (<50 chars)', () => {
      const issues = validateMeta({ title: 'Title', description: 'Short', url: 'https://example.com' })
      expect(issues).toContainEqual(expect.objectContaining({ field: 'description', type: 'too-short' }))
    })

    it('flags missing canonical', () => {
      const issues = validateMeta({ title: 'Title', description: 'A valid description that is long enough to pass' })
      expect(issues).toContainEqual(expect.objectContaining({ field: 'canonical', severity: 'warning' }))
    })

    it('flags missing og:image', () => {
      const issues = validateMeta({ title: 'Title', url: 'https://example.com' })
      expect(issues).toContainEqual(expect.objectContaining({ field: 'og:image', severity: 'warning' }))
    })

    it('passes with all valid fields', () => {
      const issues = validateMeta({
        title: 'Valid Page Title Here',
        description: 'A valid description that is at least 50 characters long for testing purposes.',
        url: 'https://example.com/page',
        canonical: 'https://example.com/page',
        image: 'https://example.com/img.png',
      })
      const errors = issues.filter(i => i.severity === 'error')
      expect(errors).toHaveLength(0)
    })
  })

  describe('truncateTitle', () => {
    it('truncates title at 60 chars with ellipsis', () => {
      const long = 'This is a very long title that exceeds sixty characters limit'
      const truncated = truncateTitle(long, 60)
      expect(truncated.length).toBeLessThanOrEqual(60)
      expect(truncated.endsWith('...')).toBe(true)
    })

    it('does not truncate short titles', () => {
      const short = 'Short Title'
      expect(truncateTitle(short, 60)).toBe('Short Title')
    })

    it('truncates at word boundary when possible', () => {
      const title = 'Hello World This Is A Long Title That Needs Truncating Now'
      const truncated = truncateTitle(title, 30)
      expect(truncated).not.toMatch(/\S\.\.\.$/)
    })
  })

  describe('generateSERPPreview', () => {
    it('generates SERP preview object', () => {
      const preview = generateSERPPreview({
        title: 'Best SEO Tool 2024',
        description: 'Discover the most powerful SEO optimization platform.',
        url: 'https://example.com/seo-tools',
      })
      expect(preview.displayUrl).toBe('example.com › seo-tools')
      expect(preview.title).toBe('Best SEO Tool 2024')
      expect(preview.snippet).toBeDefined()
    })

    it('marks CTR risk when title is too long', () => {
      const preview = generateSERPPreview({
        title: 'A'.repeat(65),
        description: 'Valid description',
        url: 'https://example.com',
      })
      expect(preview.warnings).toContainEqual(expect.objectContaining({ type: 'title-truncation' }))
    })
  })
})
