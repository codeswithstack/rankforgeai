# @rankforge/i18n

International SEO — hreflang generation, locale routing, and RTL support.

## Install
```bash
npm install @rankforge/i18n
```

## Usage
```ts
import { generateHreflang, validateHreflang, generateLocaleCanonical, generateRTLMeta, detectUntranslatedPages } from '@rankforge/i18n'

// Generate hreflang tags (auto-adds x-default)
const tags = generateHreflang([
  { locale: 'en', url: 'https://example.com/en', isDefault: true },
  { locale: 'ta', url: 'https://example.com/ta' },
])

// Validate for common mistakes
const issues = validateHreflang(tags)

// Locale-specific canonical URL
const url = generateLocaleCanonical('https://example.com/page', 'fr', { strategy: 'prefix' })
// 'https://example.com/fr/page'

// RTL support (Arabic, Hebrew, Farsi, Urdu...)
const rtl = generateRTLMeta('ar') // { dir: 'rtl', lang: 'ar' }

// Find untranslated pages
const missing = detectUntranslatedPages({ en: ['/home', '/about'], ta: ['/home'] }, ['en', 'ta'])
// { ta: ['/about'] }
```
