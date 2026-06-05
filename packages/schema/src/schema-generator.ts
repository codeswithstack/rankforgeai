const CONTEXT = 'https://schema.org'

// ─── Article ────────────────────────────────────────────────────────────────
export interface ArticleInput {
  type?: 'Article' | 'BlogPosting' | 'NewsArticle'
  headline: string
  author: { name: string; url?: string }
  datePublished: string
  dateModified?: string
  image?: string
  url?: string
  description?: string
}

export function generateArticleSchema(input: ArticleInput): Record<string, unknown> {
  return {
    '@context': CONTEXT,
    '@type': input.type || 'Article',
    headline: input.headline,
    author: { '@type': 'Person', name: input.author.name, ...(input.author.url ? { url: input.author.url } : {}) },
    datePublished: input.datePublished,
    ...(input.dateModified ? { dateModified: input.dateModified } : {}),
    ...(input.image ? { image: input.image } : {}),
    ...(input.url ? { url: input.url } : {}),
    ...(input.description ? { description: input.description } : {}),
  }
}

// ─── Product ─────────────────────────────────────────────────────────────────
export interface ReviewInput { author: string; ratingValue: number; reviewBody?: string }
export interface ProductInput {
  name: string
  description?: string
  price?: number
  currency?: string
  availability?: string
  image?: string
  reviews?: ReviewInput[]
  aggregateRating?: { ratingValue: number; reviewCount: number }
}

export function generateProductSchema(input: ProductInput): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@context': CONTEXT,
    '@type': 'Product',
    name: input.name,
    ...(input.description ? { description: input.description } : {}),
    ...(input.image ? { image: input.image } : {}),
  }
  if (input.price !== undefined) {
    schema.offers = {
      '@type': 'Offer',
      price: input.price,
      priceCurrency: input.currency || 'USD',
      availability: input.availability ? `https://schema.org/${input.availability}` : 'https://schema.org/InStock',
    }
  }
  if (input.reviews?.length) {
    schema.review = input.reviews.map(r => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.author },
      reviewRating: { '@type': 'Rating', ratingValue: r.ratingValue },
      ...(r.reviewBody ? { reviewBody: r.reviewBody } : {}),
    }))
  }
  if (input.aggregateRating) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: input.aggregateRating.ratingValue,
      reviewCount: input.aggregateRating.reviewCount,
    }
  }
  return schema
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────
export function generateFAQSchema(items: Array<{ question: string; answer: string }>): Record<string, unknown> {
  if (!items.length) throw new Error('FAQ list cannot be empty')
  return {
    '@context': CONTEXT,
    '@type': 'FAQPage',
    mainEntity: items.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  }
}

// ─── Breadcrumb ───────────────────────────────────────────────────────────────
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>): Record<string, unknown> {
  return {
    '@context': CONTEXT,
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

// ─── Organization ─────────────────────────────────────────────────────────────
export function generateOrganizationSchema(input: {
  name: string; url: string; logo?: string; sameAs?: string[]; description?: string
}): Record<string, unknown> {
  return {
    '@context': CONTEXT,
    '@type': 'Organization',
    name: input.name,
    url: input.url,
    ...(input.logo ? { logo: { '@type': 'ImageObject', url: input.logo } } : {}),
    ...(input.sameAs?.length ? { sameAs: input.sameAs } : {}),
    ...(input.description ? { description: input.description } : {}),
  }
}

// ─── LocalBusiness ────────────────────────────────────────────────────────────
export function generateLocalBusinessSchema(input: {
  name: string
  address: { streetAddress: string; city: string; postalCode: string; country: string; region?: string }
  telephone?: string
  openingHours?: string
  url?: string
}): Record<string, unknown> {
  return {
    '@context': CONTEXT,
    '@type': 'LocalBusiness',
    name: input.name,
    address: {
      '@type': 'PostalAddress',
      streetAddress: input.address.streetAddress,
      addressLocality: input.address.city,
      postalCode: input.address.postalCode,
      addressCountry: input.address.country,
      ...(input.address.region ? { addressRegion: input.address.region } : {}),
    },
    ...(input.telephone ? { telephone: input.telephone } : {}),
    ...(input.openingHours ? { openingHours: input.openingHours } : {}),
    ...(input.url ? { url: input.url } : {}),
  }
}

// ─── Event ────────────────────────────────────────────────────────────────────
export function generateEventSchema(input: {
  name: string
  startDate: string
  endDate?: string
  location?: { name: string; address: string }
  url?: string
  eventStatus?: string
  eventAttendanceMode?: string
  description?: string
}): Record<string, unknown> {
  return {
    '@context': CONTEXT,
    '@type': 'Event',
    name: input.name,
    startDate: input.startDate,
    ...(input.endDate ? { endDate: input.endDate } : {}),
    ...(input.location ? {
      location: {
        '@type': 'Place',
        name: input.location.name,
        address: input.location.address,
      },
    } : {}),
    ...(input.url ? { url: input.url } : {}),
    ...(input.eventStatus ? { eventStatus: `https://schema.org/${input.eventStatus}` } : {}),
    ...(input.eventAttendanceMode ? { eventAttendanceMode: `https://schema.org/${input.eventAttendanceMode}` } : {}),
    ...(input.description ? { description: input.description } : {}),
  }
}

// ─── Recipe ───────────────────────────────────────────────────────────────────
export function generateRecipeSchema(input: {
  name: string; description?: string; image?: string
  prepTime?: string; cookTime?: string; totalTime?: string
  recipeYield?: string; ingredients?: string[]; instructions?: string[]
  author?: { name: string }; datePublished?: string
}): Record<string, unknown> {
  return {
    '@context': CONTEXT,
    '@type': 'Recipe',
    name: input.name,
    ...(input.description ? { description: input.description } : {}),
    ...(input.image ? { image: input.image } : {}),
    ...(input.prepTime ? { prepTime: input.prepTime } : {}),
    ...(input.cookTime ? { cookTime: input.cookTime } : {}),
    ...(input.totalTime ? { totalTime: input.totalTime } : {}),
    ...(input.recipeYield ? { recipeYield: input.recipeYield } : {}),
    ...(input.ingredients ? { recipeIngredient: input.ingredients } : {}),
    ...(input.instructions ? {
      recipeInstructions: input.instructions.map((step, i) => ({
        '@type': 'HowToStep', position: i + 1, text: step,
      })),
    } : {}),
    ...(input.author ? { author: { '@type': 'Person', name: input.author.name } } : {}),
    ...(input.datePublished ? { datePublished: input.datePublished } : {}),
  }
}

// ─── Validate ─────────────────────────────────────────────────────────────────
export interface ValidationResult {
  isValid: boolean
  errors: Array<{ field: string; message: string }>
  warnings: Array<{ field: string; message: string }>
}

const requiredFields: Record<string, string[]> = {
  Article: ['headline', 'author', 'datePublished'],
  BlogPosting: ['headline', 'author', 'datePublished'],
  NewsArticle: ['headline', 'author', 'datePublished'],
  Product: ['name'],
  FAQPage: ['mainEntity'],
  BreadcrumbList: ['itemListElement'],
  Event: ['name', 'startDate'],
  Recipe: ['name'],
  Organization: ['name', 'url'],
  LocalBusiness: ['name', 'address'],
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(T[\d:+Z.-]+)?$/

export function validateSchema(schema: Record<string, unknown>): ValidationResult {
  const errors: Array<{ field: string; message: string }> = []
  const warnings: Array<{ field: string; message: string }> = []

  const type = schema['@type'] as string | undefined
  if (!type) {
    errors.push({ field: '@type', message: '@type is required' })
    return { isValid: false, errors, warnings }
  }

  const required = requiredFields[type] || []
  for (const field of required) {
    if (!schema[field]) {
      errors.push({ field, message: `${field} is required for ${type}` })
    }
  }

  // Validate date fields
  for (const dateField of ['datePublished', 'dateModified', 'startDate', 'endDate']) {
    const val = schema[dateField]
    if (val && typeof val === 'string' && !ISO_DATE_RE.test(val)) {
      errors.push({ field: dateField, message: `${dateField} must be ISO 8601 format` })
    }
  }

  return { isValid: errors.length === 0, errors, warnings }
}

// ─── Render ───────────────────────────────────────────────────────────────────
export function renderSchemaTag(schema: Record<string, unknown>): string {
  return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`
}
