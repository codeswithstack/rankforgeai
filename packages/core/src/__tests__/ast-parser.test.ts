import { describe, it, expect } from 'vitest'
import { ASTParser, extractReactMetaTags, detectMissingImageProps } from '../ast-parser'

describe('AST Parser', () => {
  describe('React/JSX analysis', () => {
    it('detects plain img tag instead of Next.js Image', () => {
      const code = `
        export default function Hero() {
          return <img src="/hero.png" alt="hero" />
        }
      `
      const parser = new ASTParser({ framework: 'nextjs' })
      const issues = parser.analyze(code)
      expect(issues).toContainEqual(expect.objectContaining({ type: 'use-next-image', line: 3 }))
    })

    it('does not flag correct Next.js Image usage', () => {
      const code = `
        import Image from 'next/image'
        export default function Hero() {
          return <Image src="/hero.png" alt="hero" width={800} height={600} />
        }
      `
      const parser = new ASTParser({ framework: 'nextjs' })
      const issues = parser.analyze(code)
      expect(issues.filter(i => i.type === 'use-next-image')).toHaveLength(0)
    })

    it('detects missing priority on above-fold image', () => {
      const code = `
        import Image from 'next/image'
        export default function Hero() {
          return <Image src="/hero.png" alt="hero" width={1920} height={1080} />
        }
      `
      const parser = new ASTParser({ framework: 'nextjs' })
      const issues = parser.analyze(code, { aboveFoldComponents: ['Hero'] })
      expect(issues).toContainEqual(expect.objectContaining({ type: 'missing-priority' }))
    })

    it('detects window usage without useEffect guard', () => {
      const code = `
        export default function Component() {
          const width = window.innerWidth
          return <div>{width}</div>
        }
      `
      const parser = new ASTParser({ framework: 'nextjs' })
      const issues = parser.analyze(code)
      expect(issues).toContainEqual(expect.objectContaining({ type: 'ssr-unsafe-window' }))
    })

    it('does not flag window inside useEffect', () => {
      const code = `
        import { useEffect, useState } from 'react'
        export default function Component() {
          const [width, setWidth] = useState(0)
          useEffect(() => { setWidth(window.innerWidth) }, [])
          return <div>{width}</div>
        }
      `
      const parser = new ASTParser({ framework: 'nextjs' })
      const issues = parser.analyze(code)
      expect(issues.filter(i => i.type === 'ssr-unsafe-window')).toHaveLength(0)
    })
  })

  describe('extractReactMetaTags', () => {
    it('extracts metadata export from Next.js App Router', () => {
      const code = `
        export const metadata = {
          title: 'My Page',
          description: 'Page description',
        }
        export default function Page() { return <main/> }
      `
      const meta = extractReactMetaTags(code)
      expect(meta.title).toBe('My Page')
      expect(meta.description).toBe('Page description')
    })

    it('extracts dynamic metadata function', () => {
      const code = `
        export async function generateMetadata({ params }) {
          return { title: params.slug }
        }
      `
      const meta = extractReactMetaTags(code)
      expect(meta.isDynamic).toBe(true)
    })

    it('returns null when no metadata found', () => {
      const code = `export default function Page() { return <div/> }`
      const meta = extractReactMetaTags(code)
      expect(meta).toBeNull()
    })
  })

  describe('detectMissingImageProps', () => {
    it('finds all images missing alt in JSX', () => {
      const code = `
        function Gallery() {
          return (
            <div>
              <img src="/a.jpg" />
              <img src="/b.jpg" alt="B" />
              <img src="/c.jpg" />
            </div>
          )
        }
      `
      const issues = detectMissingImageProps(code)
      expect(issues.filter(i => i.type === 'missing-alt')).toHaveLength(2)
    })

    it('finds images missing width/height', () => {
      const code = `<img src="/photo.jpg" alt="Photo" />`
      const issues = detectMissingImageProps(code)
      expect(issues).toContainEqual(expect.objectContaining({ type: 'missing-dimensions' }))
    })
  })
})
