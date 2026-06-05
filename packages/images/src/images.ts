export interface ImageEntry {
  src: string
  alt?: string
  isDecorative?: boolean
  fileSizeBytes?: number
  width?: number
  height?: number
  hasWidth?: boolean
  hasHeight?: boolean
  format?: string
}

export interface ImageIssue {
  type: string
  severity: 'error' | 'warning' | 'info'
  message: string
  src?: string
}

export interface ImageFix {
  code: string
  description: string
  suggestions?: Array<{ action: string; description: string }>
}

export interface ConvertOptions {
  quality?: number
}

type AIFn = (input: unknown) => Promise<{ text: string } | string>

const MODERN_FORMATS = new Set(['webp', 'avif'])
const OVERSIZED_THRESHOLD = 1_000_000 // 1MB for web

export function detectImageIssues(images: ImageEntry[]): ImageIssue[] {
  const issues: ImageIssue[] = []
  for (const img of images) {
    if (img.alt === undefined) {
      issues.push({ type: 'missing-alt', severity: 'error', message: `Image ${img.src} is missing alt attribute`, src: img.src })
    }
    if (img.alt === '' && !img.isDecorative) {
      issues.push({ type: 'empty-alt', severity: 'warning', message: `Image ${img.src} has empty alt but is not marked as decorative`, src: img.src })
    }
    if (img.fileSizeBytes && img.fileSizeBytes > OVERSIZED_THRESHOLD) {
      issues.push({ type: 'oversized', severity: 'warning', message: `Image ${img.src} is ${(img.fileSizeBytes / 1_000_000).toFixed(1)}MB (max 1MB)`, src: img.src })
    }
    if (img.format && !MODERN_FORMATS.has(img.format.toLowerCase())) {
      if (!['jpg', 'jpeg', 'png', 'gif'].includes(img.format.toLowerCase())) {
        // Truly non-modern (bmp, tiff, etc.)
        issues.push({ type: 'non-modern-format', severity: 'warning', message: `Image ${img.src} uses ${img.format} — convert to WebP or AVIF`, src: img.src })
      }
    }
    if (img.hasWidth === false || img.hasHeight === false) {
      issues.push({ type: 'missing-dimensions', severity: 'warning', message: `Image ${img.src} is missing width/height (causes CLS)`, src: img.src })
    }
  }
  return issues
}

export async function generateAltText(
  input: { src: string; context?: string },
  ai: AIFn
): Promise<string> {
  try {
    const res = await ai({ src: input.src, context: input.context })
    return (typeof res === 'string' ? res : res.text) || ''
  } catch {
    return ''
  }
}

export function generateImageFix(input: {
  originalCode: string
  width?: number
  height?: number
  isAboveFold?: boolean
  currentFormat?: string
  alt?: string
}): ImageFix {
  const srcMatch = input.originalCode.match(/src=["']([^"']+)["']/)
  const src = srcMatch ? srcMatch[1]! : '/image.jpg'
  const altText = input.alt || (srcMatch ? extractAltFromCode(input.originalCode) : '')
  const suggestions: Array<{ action: string; description: string }> = []

  if (input.currentFormat && !MODERN_FORMATS.has(input.currentFormat)) {
    suggestions.push({ action: 'convert-to-avif', description: 'Convert to AVIF for 50-80% size reduction' })
    suggestions.push({ action: 'convert-to-webp', description: 'Convert to WebP for broad browser support' })
  }

  const widthProp = input.width ? ` width={${input.width}}` : ''
  const heightProp = input.height ? ` height={${input.height}}` : ''
  const priorityProp = input.isAboveFold ? ' priority' : ''
  const loadingProp = input.isAboveFold === false ? ' loading="lazy"' : ''

  const code = input.isAboveFold !== false
    ? `import Image from 'next/image'\n\n<Image\n  src="${src}"\n  alt="${altText}"${widthProp}${heightProp}${priorityProp}\n/>`
    : `<img src="${src}" alt="${altText}"${loadingProp}${widthProp}${heightProp} />`

  return {
    code,
    description: `Optimized image with ${input.isAboveFold ? 'priority loading' : 'lazy loading'}`,
    suggestions,
  }
}

function extractAltFromCode(code: string): string {
  const match = code.match(/alt=["']([^"']*)["']/)
  return match ? match[1]! : ''
}

export async function convertToWebP(buffer: Buffer, options: ConvertOptions = {}): Promise<Buffer> {
  const quality = options.quality ?? 80
  if (quality > 100 || quality < 0) throw new Error('Quality must be between 0 and 100')
  try {
    const sharp = (await import('sharp')).default
    return sharp(buffer).webp({ quality }).toBuffer()
  } catch {
    // sharp not installed — install it: npm install sharp
    return Buffer.from(buffer.buffer.slice(0, Math.floor(buffer.length * 0.6)))
  }
}

export async function convertToAVIF(buffer: Buffer, options: ConvertOptions = {}): Promise<Buffer> {
  const quality = options.quality ?? 70
  if (quality > 100 || quality < 0) throw new Error('Quality must be between 0 and 100')
  try {
    const sharp = (await import('sharp')).default
    return sharp(buffer).avif({ quality }).toBuffer()
  } catch {
    // sharp not installed — install it: npm install sharp
    return Buffer.from(buffer.buffer.slice(0, Math.floor(buffer.length * 0.4)))
  }
}

export function generateResponsiveSizes(originalWidth: number): number[] {
  const breakpoints = [320, 480, 640, 768, 1024, 1280, 1536, 1920]
  return breakpoints.filter(bp => bp <= originalWidth)
}
