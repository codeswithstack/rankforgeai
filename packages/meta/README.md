# @rankforge-root/meta

Meta tag generation, validation, and SERP preview.

## Install
```bash
npm install @rankforge-root/meta
```

## Usage
```ts
import { generateMeta, validateMeta, truncateTitle, generateSERPPreview } from '@rankforge-root/meta'

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
