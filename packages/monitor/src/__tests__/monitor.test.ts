import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Monitor, RUMCollector, AlertEngine, NotificationService } from '../monitor'

describe('Monitor', () => {
  describe('RUMCollector', () => {
    let rum: RUMCollector

    beforeEach(() => {
      rum = new RUMCollector()
    })

    it('records LCP measurement', () => {
      rum.record({ type: 'LCP', value: 2100, url: 'https://example.com/' })
      const data = rum.getMetrics('https://example.com/')
      expect(data.LCP.p75).toBeDefined()
    })

    it('records CLS measurement', () => {
      rum.record({ type: 'CLS', value: 0.08, url: 'https://example.com/' })
      const data = rum.getMetrics('https://example.com/')
      expect(data.CLS.p75).toBeDefined()
    })

    it('calculates p75 correctly', () => {
      for (let i = 1; i <= 100; i++) {
        rum.record({ type: 'LCP', value: i * 10, url: 'https://example.com/' })
      }
      const data = rum.getMetrics('https://example.com/')
      expect(data.LCP.p75).toBe(750)
    })

    it('aggregates metrics per URL', () => {
      rum.record({ type: 'LCP', value: 1000, url: 'https://example.com/page1' })
      rum.record({ type: 'LCP', value: 2000, url: 'https://example.com/page2' })
      const page1 = rum.getMetrics('https://example.com/page1')
      const page2 = rum.getMetrics('https://example.com/page2')
      expect(page1.LCP.median).not.toBe(page2.LCP.median)
    })
  })

  describe('AlertEngine', () => {
    let alerts: AlertEngine

    beforeEach(() => {
      alerts = new AlertEngine({
        thresholds: {
          LCP: { warning: 2500, critical: 4000 },
          CLS: { warning: 0.1, critical: 0.25 },
          INP: { warning: 200, critical: 500 },
        },
      })
    })

    it('triggers warning alert when LCP exceeds warning threshold', () => {
      const alert = alerts.evaluate({ metric: 'LCP', value: 3000 })
      expect(alert?.severity).toBe('warning')
    })

    it('triggers critical alert when LCP exceeds critical threshold', () => {
      const alert = alerts.evaluate({ metric: 'LCP', value: 5000 })
      expect(alert?.severity).toBe('critical')
    })

    it('returns null when metric is within bounds', () => {
      const alert = alerts.evaluate({ metric: 'LCP', value: 1500 })
      expect(alert).toBeNull()
    })

    it('detects SEO regression (rank drop)', () => {
      const alert = alerts.evaluateSEO({
        keyword: 'seo tool',
        previousRank: 3,
        currentRank: 15,
      })
      expect(alert?.type).toBe('rank-drop')
      expect(alert?.severity).toBe('critical')
    })

    it('detects indexing drop', () => {
      const alert = alerts.evaluateSEO({
        indexedPages: { previous: 1000, current: 800 },
      })
      expect(alert?.type).toBe('indexing-drop')
    })
  })

  describe('NotificationService', () => {
    it('sends Slack notification', async () => {
      const send = vi.fn().mockResolvedValue({ ok: true })
      const service = new NotificationService({ slack: { webhookUrl: 'https://hooks.slack.com/test' } })
      service.setTransport('slack', send)
      await service.notify({
        channel: 'slack',
        message: 'LCP degraded to 4.2s on /homepage',
        severity: 'critical',
      })
      expect(send).toHaveBeenCalledOnce()
    })

    it('sends Discord notification', async () => {
      const send = vi.fn().mockResolvedValue({})
      const service = new NotificationService({ discord: { webhookUrl: 'https://discord.com/api/webhooks/test' } })
      service.setTransport('discord', send)
      await service.notify({ channel: 'discord', message: 'Alert', severity: 'warning' })
      expect(send).toHaveBeenCalledOnce()
    })

    it('sends email notification', async () => {
      const send = vi.fn().mockResolvedValue({})
      const service = new NotificationService({ email: { to: 'team@example.com' } })
      service.setTransport('email', send)
      await service.notify({ channel: 'email', message: 'Alert', severity: 'warning' })
      expect(send).toHaveBeenCalledOnce()
    })

    it('calls webhook with correct payload', async () => {
      const send = vi.fn().mockResolvedValue({})
      const service = new NotificationService({ webhook: { url: 'https://api.example.com/webhook' } })
      service.setTransport('webhook', send)
      await service.notify({ channel: 'webhook', message: 'Alert', severity: 'info', data: { url: '/page' } })
      expect(send).toHaveBeenCalledWith(expect.objectContaining({ message: 'Alert' }))
    })

    it('silently skips unconfigured channels', async () => {
      const service = new NotificationService({})
      await expect(service.notify({ channel: 'slack', message: 'Test', severity: 'info' })).resolves.not.toThrow()
    })
  })

  describe('Crawl Monitor', () => {
    it('detects newly broken pages since last crawl', () => {
      const monitor = new Monitor()
      const previous = new Map([
        ['https://example.com/a', { status: 200 }],
        ['https://example.com/b', { status: 200 }],
      ])
      const current = new Map([
        ['https://example.com/a', { status: 200 }],
        ['https://example.com/b', { status: 404 }],
      ])
      const changes = monitor.diffCrawls(previous, current)
      expect(changes.broken).toContain('https://example.com/b')
      expect(changes.broken).not.toContain('https://example.com/a')
    })

    it('detects newly discovered pages', () => {
      const monitor = new Monitor()
      const previous = new Map([['https://example.com/', { status: 200 }]])
      const current = new Map([
        ['https://example.com/', { status: 200 }],
        ['https://example.com/new-page', { status: 200 }],
      ])
      const changes = monitor.diffCrawls(previous, current)
      expect(changes.new).toContain('https://example.com/new-page')
    })
  })
})
