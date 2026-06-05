# RankForge AI — Gaps, Problems & Missing Features

## Critical Gaps in Vision Document

### 1. Authentication & Multi-Tenancy
- No auth system defined (OAuth, JWT, API keys)
- No RBAC (role-based access control) for team dashboards
- No multi-tenant isolation for agency use cases
- No white-label support mentioned

### 2. AI Cost Control
- No rate limiting on AI API calls (OpenAI can be expensive)
- No caching strategy for AI responses (same content re-analyzed every run)
- No AI model fallback chain (OpenAI → Ollama local model)
- No token budget per workspace/plan

### 3. Self-Healing Rollback
- No rollback mechanism if AI-generated fix breaks the build
- No conflict resolution when multiple fixes affect the same file
- No dry-run gate before applying auto-patches to production code
- No CI/CD integration to validate fix before merging PR

### 4. Real-Time Pipeline
- No WebSocket/SSE strategy for live monitoring data
- No event streaming architecture for RUM data collection
- No queue system defined for crawl jobs (Redis/BullMQ)

### 5. Missing SEO Features
- **404 management** — detect, track and suggest redirects for broken pages
- **Redirect chain detection** — flag chains > 2 hops
- **Canonical chain detection** — canonical pointing to another canonical
- **JavaScript SEO** — detecting content only visible after JS execution
- **Mobile-first indexing checks** — viewport meta, tap targets, font sizes
- **Core Web Vitals lab vs field data comparison**
- **A/B testing for meta tags** — test two title variants, compare CTR
- **Content freshness** — flag stale pages with old lastmod dates
- **Internal link equity analysis** — PageRank-style internal link scoring
- **Page speed budget** — set budgets, alert on violations
- **Competitor gap analysis** — compare keyword coverage vs competitors
- **Search Console API integration** — pull real impressions/clicks data
- **GA4 integration** — correlate performance metrics with traffic

### 6. Missing Technical Infrastructure
- No error reporting system (Sentry, Datadog, etc.)
- No structured logging strategy
- No tracing/observability (OpenTelemetry)
- No database schema defined for storing audit history
- No API rate limiting (protect audit endpoints from abuse)
- No package versioning strategy (changesets, semantic versioning)
- No browser compatibility matrix defined
- No TypeScript strict mode enforcement mentioned
- No testing framework specified in vision (Vitest recommended)

### 7. VSCode Extension Gaps
- No Language Server Protocol (LSP) integration for real-time hints
- No inline fix application (code actions)
- No schema validation in JSON/JS files

### 8. GitHub Action Gaps
- No PR comment format defined for audit results
- No badge generation for README
- No diff comparison (this PR vs main branch score)
- No custom ignore rules (suppress known false positives)

---

## Design Problems

### Problem 1: Crawl Engine — No Distributed Architecture
Single-process crawler will fail on large sites (100k+ pages).
**Fix:** Design crawler as a distributed job queue from day one (BullMQ + Redis workers).

### Problem 2: AI Fix Generator — No Hallucination Guard
LLM-generated patches can introduce new bugs.
**Fix:** Every AI fix must pass:
1. TypeScript type check
2. ESLint
3. Unit tests (if they exist)
Before being offered to the user.

### Problem 3: Hydration Analyzer — Server HTML Unavailable at Runtime
You can't diff server vs client HTML in production without special tooling.
**Fix:** Capture server HTML during SSR render and inject into `__RANKFORGE_SSR_HTML__` data attribute (dev mode only).

### Problem 4: Real User Monitoring — Privacy Compliance
RUM collects user behavior data.
**Fix:** Need GDPR/CCPA compliance built in — consent management, data anonymization, opt-out support.

### Problem 5: Schema Generator — No Google Rich Results Test Integration
Generated schemas aren't validated against Google's actual requirements.
**Fix:** Integrate with Google Rich Results Test API (or re-implement their validation rules locally).

### Problem 6: Sitemap — No Incremental Generation Strategy
Regenerating the full sitemap on every deploy is slow for large sites.
**Fix:** Track page changes and only regenerate affected sitemap chunks.

### Problem 7: i18n — No Translation Quality Detection
Detects *missing* translations but not *low quality* ones (e.g., machine-translated content that's identical to English).
**Fix:** Add content similarity scoring between locale pages.

### Problem 8: Performance Package — No Budget Enforcement
Scores are calculated but there's no way to set budgets and block deploys.
**Fix:** Add `rankforge.config.ts` budget declarations that integrate with the GitHub Action.

---

## Test Coverage Summary

| Package | Test File | Key Scenarios Covered |
|---|---|---|
| core | html-parser.test.ts | parse, extractMeta, extractHeadings, extractLinks |
| core | crawler.test.ts | init, URL normalization, depth, orphan detection, robots.txt |
| core | ssr-analyzer.test.ts | SSR detection, hydration mismatches, route extraction |
| core | ast-parser.test.ts | JSX analysis, img detection, window SSR guard |
| meta | meta-generator.test.ts | generate, validate, truncate, SERP preview |
| schema | schema-generator.test.ts | Article, Product, FAQ, Breadcrumb, Org, Event, validate, render |
| sitemap | sitemap.test.ts | generate, image, video, news, multilingual, index, chunk, gzip, validate |
| i18n | i18n-seo.test.ts | hreflang, validate, canonical, untranslated, duplicates, RTL |
| performance | lcp.test.ts | detect issues, generate fixes, score calculation |
| performance | cls.test.ts | detect issues, generate fixes, score calculation |
| performance | inp.test.ts | detect issues, generate fixes, score calculation |
| performance | ttfb.test.ts | detect issues, generate fixes, score calculation |
| hydration | hydration.test.ts | mismatch detection, locale/date issues, fix generation |
| audit | audit.test.ts | SEO/technical/performance/security audits, scoring, export |
| images | images.test.ts | issue detection, AI alt text, fix generation, format conversion |
| monitor | monitor.test.ts | RUM, alerts, notifications (Slack/Discord/email/webhook), crawl diff |
| security | security.test.ts | cloaking, SEO poisoning, spam injection, mixed content, bot filter |
| ai | ai.test.ts | meta gen, link suggestions, content analysis, fix gen, copilot |
| analytics | analytics.test.ts | keyword tracking, trends, indexing stats, crawl/traffic analytics |
| edge | edge.test.ts | geo rewrite, hreflang injection, CDN headers, edge rendering |
| cli | cli.test.ts | init, audit, fix, sitemap, schema, optimize, monitor, help |
