# @rankforge/schema

JSON-LD structured data builders for rich search results.

## Install
```bash
npm install @rankforge/schema
```

## Usage
```ts
import { generateArticleSchema, generateFAQSchema, generateProductSchema, renderSchemaTag, validateSchema } from '@rankforge/schema'

const schema = generateArticleSchema({
  headline: 'How to Improve Core Web Vitals',
  author: { name: 'Jane Doe' },
  datePublished: '2024-01-15',
})

// Validate
const result = validateSchema(schema) // { isValid: true, errors: [], warnings: [] }

// Render as <script> tag
console.log(renderSchemaTag(schema))
// <script type="application/ld+json">...</script>
```

Supports: Article, BlogPosting, NewsArticle, Product, FAQ, Breadcrumb, Organization, LocalBusiness, Event, Recipe.
