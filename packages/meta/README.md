# @rankforge/meta

Meta tag generation, validation, and SERP preview.

## Install
```bash
npm install @rankforge/meta
```

## Usage
```ts
import { generateMeta, validateMeta, truncateTitle, generateSERPPreview } from '@rankforge/meta'

const meta = generateMeta({
  title: 'My Page Title',
  description: 'A great page description for SEO.',
  url: 'https://example.com/page',
  image: 'https://example.com/og.png',
})
// { title, description, canonical, robots, og: {...}, twitter: {...} }

const issues = validateMeta({ title: 'Hi' })
// [{ field: 'title', severity: 'warning', type: 'too-short' }]

const serp = generateSERPPreview({ title: 'My Page', description: '...', url: 'https://example.com/page' })
// { title, displayUrl: 'example.com › page', snippet, warnings }
```
