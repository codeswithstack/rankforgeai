import { describe, it, expect, vi } from 'vitest'
import {
  AIMetaGenerator,
  AILinkSuggester,
  AIContentAnalyzer,
  AIFixGenerator,
  AICopilot,
} from '../ai'

describe('AI Engine', () => {
  const mockLLM = {
    complete: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('AIMetaGenerator', () => {
    it('generates SEO title from content', async () => {
      mockLLM.complete.mockResolvedValue({ text: 'How to Master SEO in 2024: A Complete Guide' })
      const gen = new AIMetaGenerator(mockLLM)
      const title = await gen.generateTitle({
        content: 'This article covers all aspects of SEO optimization including on-page, off-page and technical SEO.',
        targetKeyword: 'SEO guide',
      })
      expect(title).toBeTruthy()
      expect(title.length).toBeLessThanOrEqual(60)
    })

    it('generates meta description', async () => {
      mockLLM.complete.mockResolvedValue({ text: 'Learn everything about SEO optimization with our comprehensive guide. Covers on-page, off-page, and technical SEO.' })
      const gen = new AIMetaGenerator(mockLLM)
      const desc = await gen.generateDescription({
        content: 'Full article content here...',
        targetKeyword: 'SEO',
      })
      expect(desc).toBeTruthy()
      expect(desc.length).toBeLessThanOrEqual(160)
    })

    it('retries when generated title is too long', async () => {
      mockLLM.complete
        .mockResolvedValueOnce({ text: 'A'.repeat(80) })
        .mockResolvedValueOnce({ text: 'Perfect SEO Title Under Sixty Characters' })
      const gen = new AIMetaGenerator(mockLLM)
      const title = await gen.generateTitle({ content: 'content', targetKeyword: 'seo' })
      expect(title.length).toBeLessThanOrEqual(60)
      expect(mockLLM.complete).toHaveBeenCalledTimes(2)
    })

    it('includes target keyword in generated title', async () => {
      mockLLM.complete.mockResolvedValue({ text: 'Best TypeScript Practices for 2024' })
      const gen = new AIMetaGenerator(mockLLM)
      const title = await gen.generateTitle({ content: 'content', targetKeyword: 'TypeScript' })
      expect(title.toLowerCase()).toContain('typescript')
    })
  })

  describe('AILinkSuggester', () => {
    it('suggests internal links based on content similarity', async () => {
      mockLLM.complete.mockResolvedValue({
        text: JSON.stringify([
          { url: '/blog/seo-basics', anchor: 'SEO basics', relevanceScore: 0.92 },
          { url: '/blog/meta-tags', anchor: 'meta tags', relevanceScore: 0.85 },
        ]),
      })
      const suggester = new AILinkSuggester(mockLLM)
      const suggestions = await suggester.suggestLinks({
        currentContent: 'This article talks about optimizing your website for search engines.',
        availablePages: [
          { url: '/blog/seo-basics', title: 'SEO Basics' },
          { url: '/blog/meta-tags', title: 'Meta Tags Guide' },
        ],
      })
      expect(suggestions).toHaveLength(2)
      expect(suggestions[0].relevanceScore).toBeGreaterThan(0.8)
    })

    it('does not suggest links to current page', async () => {
      mockLLM.complete.mockResolvedValue({ text: JSON.stringify([]) })
      const suggester = new AILinkSuggester(mockLLM)
      const suggestions = await suggester.suggestLinks({
        currentUrl: '/blog/seo-guide',
        currentContent: 'SEO guide content',
        availablePages: [{ url: '/blog/seo-guide', title: 'Current Page' }],
      })
      expect(suggestions.filter(s => s.url === '/blog/seo-guide')).toHaveLength(0)
    })
  })

  describe('AIContentAnalyzer', () => {
    it('clusters keywords by topic', async () => {
      mockLLM.complete.mockResolvedValue({
        text: JSON.stringify({
          clusters: [
            { topic: 'Technical SEO', keywords: ['crawling', 'indexing', 'robots.txt'] },
            { topic: 'On-Page SEO', keywords: ['meta tags', 'h1', 'content'] },
          ],
        }),
      })
      const analyzer = new AIContentAnalyzer(mockLLM)
      const clusters = await analyzer.clusterKeywords(['crawling', 'indexing', 'meta tags', 'h1', 'robots.txt', 'content'])
      expect(clusters).toHaveLength(2)
      expect(clusters[0].keywords.length).toBeGreaterThan(0)
    })

    it('identifies topic gaps', async () => {
      mockLLM.complete.mockResolvedValue({
        text: JSON.stringify({
          gaps: ['link building', 'page speed', 'mobile SEO'],
        }),
      })
      const analyzer = new AIContentAnalyzer(mockLLM)
      const gaps = await analyzer.findTopicGaps({
        existingContent: ['on-page seo', 'technical seo'],
        targetTopic: 'complete SEO guide',
      })
      expect(gaps).toContain('link building')
    })
  })

  describe('AIFixGenerator', () => {
    it('generates patch for missing alt text', async () => {
      mockLLM.complete.mockResolvedValue({ text: 'A developer working on a laptop in a modern office' })
      const fixer = new AIFixGenerator(mockLLM)
      const fix = await fixer.generateFix({
        issue: { type: 'missing-alt', element: '<img src="/dev.jpg"/>' },
        context: 'team page',
      })
      expect(fix.before).toContain('<img src="/dev.jpg"/>')
      expect(fix.after).toContain('alt=')
    })

    it('generates PR-ready patch', async () => {
      mockLLM.complete.mockResolvedValue({ text: `<Image src="/hero.avif" priority width={1920} height={1080} alt="Hero" />` })
      const fixer = new AIFixGenerator(mockLLM)
      const patch = await fixer.generatePatch({
        file: 'app/page.tsx',
        issues: [{ type: 'large-image', line: 12 }],
      })
      expect(patch.diff).toBeDefined()
      expect(patch.prDescription).toBeDefined()
    })
  })

  describe('AICopilot', () => {
    it('explains slow LCP root cause', async () => {
      mockLLM.complete.mockResolvedValue({
        text: 'Your LCP is slow because the hero image (hero.png, 2.4MB) has no priority attribute and is not preloaded. Adding the priority prop to your Next.js Image component will trigger early preloading.',
      })
      const copilot = new AICopilot(mockLLM)
      const response = await copilot.ask('Why is my LCP slow?', {
        metrics: { lcp: 4200 },
        issues: [{ type: 'large-image', src: '/hero.png', size: 2_400_000 }],
      })
      expect(response.explanation).toBeTruthy()
      expect(response.fixSteps.length).toBeGreaterThan(0)
    })

    it('identifies exact component causing issue', async () => {
      mockLLM.complete.mockResolvedValue({
        text: JSON.stringify({
          component: 'HeroSection',
          file: 'components/HeroSection.tsx',
          line: 15,
          explanation: 'The img tag on line 15 is missing width/height attributes',
        }),
      })
      const copilot = new AICopilot(mockLLM)
      const response = await copilot.ask('What component is causing CLS?', {
        issues: [{ type: 'missing-dimensions', selector: '.hero img' }],
        componentTree: ['App > Layout > HeroSection'],
      })
      expect(response.component).toBeDefined()
    })
  })
})
