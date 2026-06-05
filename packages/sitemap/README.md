# @rankforge/sitemap

XML sitemap generation — standard, image, video, news, multilingual, and index sitemaps.

## Install
```bash
npm install @rankforge/sitemap
```

## Usage
```ts
import { generateSitemap, generateImageSitemap, generateNewsSitemap, compressSitemap, validateSitemap } from '@rankforge/sitemap'

const xml = generateSitemap([
  { url: 'https://example.com/', changefreq: 'daily', priority: 1.0 },
  { url: 'https://example.com/blog', changefreq: 'weekly', priority: 0.8 },
])

// Compress for faster delivery (gzip)
const gzipped = await compressSitemap(xml)

// Validate
const result = validateSitemap(xml) // { isValid: true, errors: [], warnings: [] }
```

Supports: standard, image, video, news, multilingual (hreflang), sitemap index, chunking, gzip compression.
