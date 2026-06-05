import { describe, it, expect, vi } from 'vitest'
import {
  detectImageIssues,
  generateAltText,
  generateImageFix,
  convertToWebP,
  convertToAVIF,
  generateResponsiveSizes,
  generateImageSitemap,
} from '../images'

describe('Image Optimization', () => {
  describe('detectImageIssues', () => {
    it('detects missing alt text', () => {
      const images = [{ src: '/hero.png', alt: undefined, width: 800, height: 600 }]
      const issues = detectImageIssues(images)
      expect(issues).toContainEqual(expect.objectContaining({ type: 'missing-alt', src: '/hero.png' }))
    })

    it('detects empty alt text on non-decorative image', () => {
      const images = [{ src: '/chart.png', alt: '', isDecorative: false }]
      const issues = detectImageIssues(images)
      expect(issues).toContainEqual(expect.objectContaining({ type: 'empty-alt' }))
    })

    it('accepts empty alt on decorative images', () => {
      const images = [{ src: '/divider.png', alt: '', isDecorative: true }]
      const issues = detectImageIssues(images)
      expect(issues.filter(i => i.type === 'empty-alt')).toHaveLength(0)
    })

    it('detects oversized images', () => {
      const images = [{ src: '/large.jpg', fileSizeBytes: 3_000_000, width: 800, height: 600 }]
      const issues = detectImageIssues(images)
      expect(issues).toContainEqual(expect.objectContaining({ type: 'oversized' }))
    })

    it('detects non-modern format', () => {
      const images = [{ src: '/photo.bmp', format: 'bmp' }]
      const issues = detectImageIssues(images)
      expect(issues).toContainEqual(expect.objectContaining({ type: 'non-modern-format' }))
    })

    it('detects missing width/height (CLS risk)', () => {
      const images = [{ src: '/photo.jpg', hasWidth: false, hasHeight: false }]
      const issues = detectImageIssues(images)
      expect(issues).toContainEqual(expect.objectContaining({ type: 'missing-dimensions' }))
    })

    it('passes for properly optimized images', () => {
      const images = [{ src: '/hero.avif', alt: 'Hero image', format: 'avif', hasWidth: true, hasHeight: true, fileSizeBytes: 100_000 }]
      const issues = detectImageIssues(images)
      expect(issues.filter(i => i.severity === 'error')).toHaveLength(0)
    })
  })

  describe('generateAltText (AI)', () => {
    it('generates alt text from image context', async () => {
      const mockAI = vi.fn().mockResolvedValue('A professional headshot of a smiling woman in a blue blazer')
      const alt = await generateAltText({ src: '/headshot.jpg', context: 'about page' }, mockAI)
      expect(alt).toBeTruthy()
      expect(alt.length).toBeGreaterThan(5)
    })

    it('returns fallback when AI fails', async () => {
      const mockAI = vi.fn().mockRejectedValue(new Error('API error'))
      const alt = await generateAltText({ src: '/image.jpg' }, mockAI)
      expect(alt).toBe('')
    })
  })

  describe('generateImageFix', () => {
    it('converts plain img tag to Next.js Image component', () => {
      const fix = generateImageFix({
        originalCode: `<img src="/hero.png" alt="Hero" />`,
        width: 1920,
        height: 1080,
        isAboveFold: true,
      })
      expect(fix.code).toContain('import Image')
      expect(fix.code).toContain('priority')
      expect(fix.code).toContain('width={1920}')
      expect(fix.code).toContain('height={1080}')
    })

    it('adds lazy loading for below-fold images', () => {
      const fix = generateImageFix({
        originalCode: `<img src="/photo.jpg" alt="Photo" />`,
        isAboveFold: false,
      })
      expect(fix.code).toMatch(/loading="lazy"|lazy/)
    })

    it('suggests AVIF conversion', () => {
      const fix = generateImageFix({
        originalCode: `<img src="/photo.png" />`,
        currentFormat: 'png',
      })
      expect(fix.suggestions).toContainEqual(expect.objectContaining({ action: 'convert-to-avif' }))
    })
  })

  describe('convertToWebP', () => {
    it('returns buffer with reduced size', async () => {
      const mockBuffer = Buffer.alloc(500_000)
      const result = await convertToWebP(mockBuffer, { quality: 80 })
      expect(result).toBeInstanceOf(Buffer)
    })

    it('accepts quality option between 0-100', async () => {
      const buf = Buffer.alloc(100_000)
      await expect(convertToWebP(buf, { quality: 85 })).resolves.toBeDefined()
      await expect(convertToWebP(buf, { quality: 101 })).rejects.toThrow()
    })
  })

  describe('generateResponsiveSizes', () => {
    it('generates standard responsive sizes', () => {
      const sizes = generateResponsiveSizes(1920)
      expect(sizes).toContain(320)
      expect(sizes).toContain(768)
      expect(sizes).toContain(1024)
      expect(sizes).toContain(1920)
    })

    it('does not include sizes larger than original', () => {
      const sizes = generateResponsiveSizes(800)
      expect(sizes.every(s => s <= 800)).toBe(true)
    })
  })
})
