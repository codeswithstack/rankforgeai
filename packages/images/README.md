# @rankforge/images

Image SEO analysis, AI-powered alt text generation, and WebP/AVIF conversion.

## Install
```bash
npm install @rankforge/images

# For real image conversion (optional)
npm install sharp
```

## Usage
```ts
import { detectImageIssues, generateAltText, generateImageFix, convertToWebP, generateResponsiveSizes } from '@rankforge/images'

// Detect issues
const issues = detectImageIssues([
  { src: '/hero.jpg', alt: undefined },          // missing-alt
  { src: '/photo.jpg', fileSizeBytes: 3_000_000 }, // oversized
  { src: '/icon.jpg', hasWidth: false },           // missing-dimensions (CLS)
])

// AI-generated alt text
const alt = await generateAltText({ src: '/team/jane.jpg', context: 'About page' }, myAI)

// Generate optimized Next.js Image code
const fix = generateImageFix({ originalCode: '<img src="/hero.jpg" />', width: 1920, height: 1080, isAboveFold: true })

// Convert format (requires sharp)
const webp = await convertToWebP(buffer, { quality: 85 })

// Responsive srcset sizes
const sizes = generateResponsiveSizes(1920) // [320, 480, 640, 768, 1024, 1280, 1536, 1920]
```
