import { describe, it, expect } from 'vitest'
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
} from '../schema-generator'

describe('Schema Generator', () => {
  describe('Article Schema', () => {
    it('generates valid Article schema', () => {
      const schema = generateArticleSchema({
        headline: 'How to Improve SEO',
        author: { name: 'John Doe' },
        datePublished: '2024-01-01',
        image: 'https://example.com/img.png',
        url: 'https://example.com/article',
      })
      expect(schema['@type']).toBe('Article')
      expect(schema['@context']).toBe('https://schema.org')
      expect(schema.headline).toBe('How to Improve SEO')
      expect(schema.author.name).toBe('John Doe')
    })

    it('generates BlogPosting schema', () => {
      const schema = generateArticleSchema({
        type: 'BlogPosting',
        headline: 'My Blog Post',
        author: { name: 'Jane' },
        datePublished: '2024-01-01',
      })
      expect(schema['@type']).toBe('BlogPosting')
    })

    it('generates NewsArticle schema', () => {
      const schema = generateArticleSchema({
        type: 'NewsArticle',
        headline: 'Breaking News',
        author: { name: 'Reporter' },
        datePublished: '2024-01-01',
      })
      expect(schema['@type']).toBe('NewsArticle')
    })

    it('includes dateModified when provided', () => {
      const schema = generateArticleSchema({
        headline: 'Test',
        author: { name: 'Author' },
        datePublished: '2024-01-01',
        dateModified: '2024-06-01',
      })
      expect(schema.dateModified).toBe('2024-06-01')
    })
  })

  describe('Product Schema', () => {
    it('generates valid Product schema', () => {
      const schema = generateProductSchema({
        name: 'SEO Tool Pro',
        description: 'Advanced SEO optimization tool',
        price: 99.99,
        currency: 'USD',
        availability: 'InStock',
        image: 'https://example.com/product.png',
      })
      expect(schema['@type']).toBe('Product')
      expect(schema.name).toBe('SEO Tool Pro')
      expect(schema.offers['@type']).toBe('Offer')
      expect(schema.offers.price).toBe(99.99)
      expect(schema.offers.priceCurrency).toBe('USD')
    })

    it('includes review when provided', () => {
      const schema = generateProductSchema({
        name: 'Product',
        price: 10,
        currency: 'USD',
        reviews: [{ author: 'User', ratingValue: 5, reviewBody: 'Great!' }],
      })
      expect(schema.review).toBeDefined()
      expect(schema.review[0].author.name).toBe('User')
    })

    it('includes aggregate rating', () => {
      const schema = generateProductSchema({
        name: 'Product',
        price: 10,
        currency: 'USD',
        aggregateRating: { ratingValue: 4.5, reviewCount: 100 },
      })
      expect(schema.aggregateRating.ratingValue).toBe(4.5)
      expect(schema.aggregateRating.reviewCount).toBe(100)
    })
  })

  describe('FAQ Schema', () => {
    it('generates valid FAQ schema', () => {
      const schema = generateFAQSchema([
        { question: 'What is SEO?', answer: 'Search Engine Optimization' },
        { question: 'Why is SEO important?', answer: 'It drives organic traffic' },
      ])
      expect(schema['@type']).toBe('FAQPage')
      expect(schema.mainEntity).toHaveLength(2)
      expect(schema.mainEntity[0]['@type']).toBe('Question')
      expect(schema.mainEntity[0].acceptedAnswer['@type']).toBe('Answer')
    })

    it('throws when FAQ list is empty', () => {
      expect(() => generateFAQSchema([])).toThrow()
    })
  })

  describe('Breadcrumb Schema', () => {
    it('generates valid BreadcrumbList schema', () => {
      const schema = generateBreadcrumbSchema([
        { name: 'Home', url: 'https://example.com' },
        { name: 'Blog', url: 'https://example.com/blog' },
        { name: 'Post Title', url: 'https://example.com/blog/post' },
      ])
      expect(schema['@type']).toBe('BreadcrumbList')
      expect(schema.itemListElement).toHaveLength(3)
      expect(schema.itemListElement[0].position).toBe(1)
      expect(schema.itemListElement[2].position).toBe(3)
    })

    it('auto-assigns correct position numbers', () => {
      const schema = generateBreadcrumbSchema([
        { name: 'Home', url: 'https://example.com' },
        { name: 'Products', url: 'https://example.com/products' },
      ])
      expect(schema.itemListElement[0].position).toBe(1)
      expect(schema.itemListElement[1].position).toBe(2)
    })
  })

  describe('Organization Schema', () => {
    it('generates valid Organization schema', () => {
      const schema = generateOrganizationSchema({
        name: 'RankForge',
        url: 'https://rankforge.io',
        logo: 'https://rankforge.io/logo.png',
        sameAs: ['https://twitter.com/rankforge'],
      })
      expect(schema['@type']).toBe('Organization')
      expect(schema.name).toBe('RankForge')
      expect(schema.logo).toBeDefined()
    })
  })

  describe('LocalBusiness Schema', () => {
    it('generates valid LocalBusiness schema', () => {
      const schema = generateLocalBusinessSchema({
        name: 'My Shop',
        address: {
          streetAddress: '123 Main St',
          city: 'Springfield',
          postalCode: '12345',
          country: 'US',
        },
        telephone: '+1-555-0000',
        openingHours: 'Mo-Fr 09:00-17:00',
      })
      expect(schema['@type']).toBe('LocalBusiness')
      expect(schema.address['@type']).toBe('PostalAddress')
      expect(schema.address.addressCountry).toBe('US')
    })
  })

  describe('Event Schema', () => {
    it('generates valid Event schema', () => {
      const schema = generateEventSchema({
        name: 'SEO Conference 2024',
        startDate: '2024-09-01T09:00:00',
        endDate: '2024-09-02T17:00:00',
        location: { name: 'Convention Center', address: 'New York, NY' },
        eventStatus: 'EventScheduled',
        eventAttendanceMode: 'OfflineEventAttendanceMode',
      })
      expect(schema['@type']).toBe('Event')
      expect(schema.name).toBe('SEO Conference 2024')
      expect(schema.location['@type']).toBe('Place')
    })

    it('handles online events', () => {
      const schema = generateEventSchema({
        name: 'Online Webinar',
        startDate: '2024-09-01T09:00:00',
        eventAttendanceMode: 'OnlineEventAttendanceMode',
        url: 'https://example.com/event',
      })
      expect(schema.eventAttendanceMode).toContain('OnlineEventAttendanceMode')
    })
  })

  describe('Schema Validation', () => {
    it('validates required fields are present', () => {
      const result = validateSchema({ '@type': 'Article', '@context': 'https://schema.org' })
      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual(expect.objectContaining({ field: 'headline' }))
    })

    it('passes validation for complete schema', () => {
      const schema = generateArticleSchema({
        headline: 'Valid Article',
        author: { name: 'Author' },
        datePublished: '2024-01-01',
        image: 'https://example.com/img.png',
        url: 'https://example.com/article',
      })
      const result = validateSchema(schema)
      expect(result.isValid).toBe(true)
    })

    it('validates date format', () => {
      const result = validateSchema({
        '@type': 'Article',
        '@context': 'https://schema.org',
        headline: 'Test',
        author: { name: 'Author' },
        datePublished: 'not-a-date',
      })
      expect(result.errors).toContainEqual(expect.objectContaining({ field: 'datePublished' }))
    })
  })

  describe('renderSchemaTag', () => {
    it('renders JSON-LD script tag', () => {
      const schema = { '@type': 'Organization', name: 'Test' }
      const tag = renderSchemaTag(schema)
      expect(tag).toContain('<script type="application/ld+json">')
      expect(tag).toContain('</script>')
      expect(tag).toContain('"@type": "Organization"')
    })
  })
})
