import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { RankForgeCLI } from '../cli'
import { MockFileSystem } from '../test-utils/mock-fs'
import { MockAuditEngine } from '../test-utils/mock-audit'

describe('CLI', () => {
  let cli: RankForgeCLI
  let mockFs: MockFileSystem
  let stdout: string[]
  let stderr: string[]

  beforeEach(() => {
    mockFs = new MockFileSystem()
    stdout = []
    stderr = []
    cli = new RankForgeCLI({
      fs: mockFs,
      stdout: (msg: string) => stdout.push(msg),
      stderr: (msg: string) => stderr.push(msg),
    })
  })

  describe('rankforge init', () => {
    it('creates rankforge.config.ts in project root', async () => {
      await cli.run(['init'])
      expect(mockFs.exists('rankforge.config.ts')).toBe(true)
    })

    it('detects Next.js project automatically', async () => {
      mockFs.write('next.config.js', 'module.exports = {}')
      await cli.run(['init'])
      const config = mockFs.read('rankforge.config.ts')
      expect(config).toContain('framework: "nextjs"')
    })

    it('detects Nuxt.js project automatically', async () => {
      mockFs.write('nuxt.config.ts', 'export default defineNuxtConfig({})')
      await cli.run(['init'])
      const config = mockFs.read('rankforge.config.ts')
      expect(config).toContain('framework: "nuxt"')
    })

    it('does not overwrite existing config without --force', async () => {
      mockFs.write('rankforge.config.ts', 'existing config')
      await cli.run(['init'])
      expect(mockFs.read('rankforge.config.ts')).toBe('existing config')
      expect(stderr.join('')).toContain('already exists')
    })

    it('overwrites existing config with --force flag', async () => {
      mockFs.write('rankforge.config.ts', 'old config')
      await cli.run(['init', '--force'])
      expect(mockFs.read('rankforge.config.ts')).not.toBe('old config')
    })
  })

  describe('rankforge audit', () => {
    it('runs all audit checks and outputs report', async () => {
      const mockAudit = new MockAuditEngine({ seoScore: 85, perfScore: 72 })
      cli.setAuditEngine(mockAudit)
      await cli.run(['audit', '--url', 'https://example.com'])
      const output = stdout.join('\n')
      expect(output).toContain('SEO Score')
      expect(output).toContain('85')
    })

    it('exits with code 1 when score below threshold', async () => {
      const mockAudit = new MockAuditEngine({ seoScore: 40 })
      cli.setAuditEngine(mockAudit)
      let exitCode = 0
      cli.setExitHandler((code) => { exitCode = code })
      await cli.run(['audit', '--url', 'https://example.com', '--min-score', '50'])
      expect(exitCode).toBe(1)
    })

    it('outputs JSON report with --json flag', async () => {
      const mockAudit = new MockAuditEngine({ seoScore: 90 })
      cli.setAuditEngine(mockAudit)
      await cli.run(['audit', '--url', 'https://example.com', '--json'])
      const json = JSON.parse(stdout.join(''))
      expect(json.seoScore).toBe(90)
    })

    it('saves report to file with --output flag', async () => {
      const mockAudit = new MockAuditEngine({ seoScore: 80 })
      cli.setAuditEngine(mockAudit)
      await cli.run(['audit', '--url', 'https://example.com', '--output', 'report.json'])
      expect(mockFs.exists('report.json')).toBe(true)
    })

    it('runs only SEO audit with --only seo', async () => {
      const mockAudit = new MockAuditEngine({})
      cli.setAuditEngine(mockAudit)
      await cli.run(['audit', '--only', 'seo'])
      expect(mockAudit.calledWith).toContain('seo')
      expect(mockAudit.calledWith).not.toContain('performance')
    })
  })

  describe('rankforge fix', () => {
    it('applies auto-fixes for detected issues', async () => {
      mockFs.write('pages/index.tsx', `<img src="/hero.png" />`)
      const mockAudit = new MockAuditEngine({
        issues: [{ type: 'missing-alt', file: 'pages/index.tsx', line: 1 }],
      })
      cli.setAuditEngine(mockAudit)
      await cli.run(['fix'])
      const fixed = mockFs.read('pages/index.tsx')
      expect(fixed).toContain('alt=')
    })

    it('creates backup before applying fixes', async () => {
      mockFs.write('pages/index.tsx', `<img src="/hero.png" />`)
      await cli.run(['fix', '--backup'])
      expect(mockFs.exists('pages/index.tsx.bak')).toBe(true)
    })

    it('shows diff preview with --dry-run', async () => {
      await cli.run(['fix', '--dry-run'])
      const output = stdout.join('\n')
      expect(output).toMatch(/\+|-/)
    })

    it('does not modify files in dry-run mode', async () => {
      mockFs.write('pages/index.tsx', 'original content')
      await cli.run(['fix', '--dry-run'])
      expect(mockFs.read('pages/index.tsx')).toBe('original content')
    })
  })

  describe('rankforge sitemap', () => {
    it('generates sitemap.xml at specified path', async () => {
      mockFs.write('rankforge.config.ts', `export default { baseUrl: 'https://example.com', routes: ['/'] }`)
      await cli.run(['sitemap', '--output', 'public/sitemap.xml'])
      expect(mockFs.exists('public/sitemap.xml')).toBe(true)
      const content = mockFs.read('public/sitemap.xml')
      expect(content).toContain('<urlset')
    })
  })

  describe('rankforge schema', () => {
    it('validates schema on specified page', async () => {
      await cli.run(['schema', '--validate', '--url', 'https://example.com'])
      expect(stdout.join('\n')).toMatch(/valid|invalid/i)
    })
  })

  describe('rankforge optimize', () => {
    it('runs optimization pipeline', async () => {
      await cli.run(['optimize', '--url', 'https://example.com'])
      expect(stdout.join('\n')).toContain('Optimization complete')
    })
  })

  describe('rankforge monitor', () => {
    it('starts monitoring daemon', async () => {
      const startMonitor = vi.fn()
      cli.setMonitorHandler(startMonitor)
      await cli.run(['monitor', '--interval', '300'])
      expect(startMonitor).toHaveBeenCalledWith(expect.objectContaining({ interval: 300 }))
    })
  })

  describe('CLI help and version', () => {
    it('shows help text', async () => {
      await cli.run(['--help'])
      expect(stdout.join('\n')).toContain('Usage:')
      expect(stdout.join('\n')).toContain('Commands:')
    })

    it('shows version', async () => {
      await cli.run(['--version'])
      expect(stdout.join('\n')).toMatch(/\d+\.\d+\.\d+/)
    })
  })
})
