export class AuditEngine {
    fetcher;
    report = { seo: [], performance: [], security: [], technical: [] };
    constructor() {
        this.fetcher = async (url) => {
            const res = await fetch(url);
            return { status: res.status, body: await res.text() };
        };
    }
    setFetcher(fn) {
        this.fetcher = fn;
    }
    async auditMultiplePages(pages) {
        const titleMap = new Map();
        const descMap = new Map();
        for (const page of pages) {
            const titleMatch = page.html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
            const descMatch = page.html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
            const title = titleMatch ? titleMatch[1].trim() : undefined;
            const desc = descMatch ? descMatch[1] : undefined;
            if (title) {
                const urls = titleMap.get(title) || [];
                urls.push(page.url);
                titleMap.set(title, urls);
            }
            if (desc) {
                const urls = descMap.get(desc) || [];
                urls.push(page.url);
                descMap.set(desc, urls);
            }
        }
        const report = { seo: [], performance: [], security: [], technical: [] };
        for (const [title, urls] of titleMap) {
            if (urls.length > 1) {
                report.seo.push({
                    rule: 'duplicate-title',
                    severity: 'warning',
                    message: `Duplicate title "${title}" found on ${urls.length} pages`,
                });
            }
        }
        return report;
    }
    async auditRobotsTxt(baseUrl) {
        const robotsUrl = new URL('/robots.txt', baseUrl).toString();
        const issues = [];
        if (!this.fetcher)
            return issues;
        const res = await this.fetcher(robotsUrl);
        if (res.status === 404) {
            issues.push({ rule: 'robots-not-found', severity: 'error', message: 'robots.txt not found (404)' });
        }
        else {
            issues.push({ rule: 'robots-found', severity: 'pass', message: 'robots.txt is accessible' });
        }
        return issues;
    }
    async auditSitemap(baseUrl) {
        const sitemapUrl = new URL('/sitemap.xml', baseUrl).toString();
        const issues = [];
        if (!this.fetcher)
            return issues;
        const res = await this.fetcher(sitemapUrl);
        if (res.status === 200) {
            issues.push({ rule: 'sitemap-found', severity: 'pass', message: 'sitemap.xml is accessible' });
        }
        else {
            issues.push({ rule: 'sitemap-not-found', severity: 'warning', message: 'sitemap.xml not found' });
        }
        return issues;
    }
    async auditLinks(links) {
        const issues = [];
        if (!this.fetcher)
            return issues;
        for (const link of links) {
            const res = await this.fetcher(link);
            if (res.status === 404) {
                issues.push({ rule: 'broken-link', severity: 'error', message: `Broken link: ${link} returns 404`, url: link });
            }
        }
        return issues;
    }
    async auditRedirectChain(redirects) {
        const issues = [];
        // Build chain map
        const chainMap = new Map();
        for (const r of redirects) {
            chainMap.set(r.from, r.to);
        }
        for (const r of redirects) {
            let current = r.from;
            let hops = 0;
            const visited = new Set();
            while (chainMap.has(current) && !visited.has(current)) {
                visited.add(current);
                current = chainMap.get(current);
                hops++;
            }
            if (hops >= 3) {
                issues.push({
                    rule: 'redirect-chain',
                    severity: 'warning',
                    message: `Redirect chain of ${hops} hops starting from ${r.from}`,
                    url: r.from,
                });
                break;
            }
        }
        return issues;
    }
    calculateOverallScore(report) {
        const allIssues = [...report.seo, ...report.security, ...report.technical];
        const seoScores = report.seo.filter(i => i.score !== undefined).map(i => i.score);
        const perfScores = report.performance.filter(p => p.score !== undefined).map(p => p.score);
        const allScores = [...seoScores, ...perfScores];
        if (!allScores.length) {
            const errors = allIssues.filter(i => i.severity === 'error').length;
            return Math.max(0, 100 - errors * 15);
        }
        return Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);
    }
    exportReport(_options = { format: 'json' }) {
        return JSON.stringify(this.report, null, 2);
    }
}
export async function runAudit(input) {
    const report = { seo: [], performance: [], security: [], technical: [] };
    const html = input.html;
    const url = input.url;
    // ── SEO checks ──────────────────────────────────────────────────────────────
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (!titleMatch) {
        report.seo.push({ rule: 'missing-title', severity: 'error', message: 'Missing <title> tag', score: 0 });
    }
    // Multiple H1
    const h1Matches = (html.match(/<h1[^>]*>/gi) || []);
    if (h1Matches.length === 0) {
        report.seo.push({ rule: 'missing-h1', severity: 'error', message: 'No H1 heading found', score: 0 });
    }
    else if (h1Matches.length > 1) {
        report.seo.push({ rule: 'multiple-h1', severity: 'warning', message: `${h1Matches.length} H1 tags found (should be 1)`, score: 5 });
    }
    else {
        report.seo.push({ rule: 'has-h1', severity: 'pass', message: 'H1 tag found', score: 10 });
    }
    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
        || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
    if (!descMatch) {
        report.seo.push({ rule: 'missing-description', severity: 'warning', message: 'Missing meta description', score: 3 });
    }
    // Canonical cross-domain
    const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
    if (canonicalMatch) {
        try {
            const canonicalHost = new URL(canonicalMatch[1]).hostname;
            const pageHost = new URL(url).hostname;
            if (canonicalHost !== pageHost) {
                report.seo.push({
                    rule: 'canonical-cross-domain',
                    severity: 'error',
                    message: `Canonical points to different domain: ${canonicalMatch[1]}`,
                });
            }
        }
        catch { }
    }
    // ── Performance checks ───────────────────────────────────────────────────────
    if (input.metrics) {
        const { lcp, cls, inp, ttfb } = input.metrics;
        if (lcp !== undefined) {
            report.performance.push({
                metric: 'LCP',
                value: lcp,
                status: lcp <= 2500 ? 'good' : lcp <= 4000 ? 'needs-improvement' : 'poor',
                score: lcp <= 2500 ? 25 : lcp <= 4000 ? 15 : 5,
            });
        }
        if (cls !== undefined) {
            report.performance.push({
                metric: 'CLS',
                value: cls,
                status: cls <= 0.1 ? 'good' : cls <= 0.25 ? 'needs-improvement' : 'poor',
                score: cls <= 0.1 ? 25 : cls <= 0.25 ? 15 : 5,
            });
        }
        if (inp !== undefined) {
            report.performance.push({
                metric: 'INP',
                value: inp,
                status: inp <= 200 ? 'good' : inp <= 500 ? 'needs-improvement' : 'poor',
                score: inp <= 200 ? 25 : 15,
            });
        }
        if (ttfb !== undefined) {
            report.performance.push({
                metric: 'TTFB',
                value: ttfb,
                status: ttfb <= 800 ? 'good' : ttfb <= 1800 ? 'needs-improvement' : 'poor',
                score: ttfb <= 800 ? 25 : 15,
            });
        }
    }
    // ── Security checks ──────────────────────────────────────────────────────────
    if (!url.startsWith('https://')) {
        report.security.push({ rule: 'not-https', severity: 'error', message: 'Page is not served over HTTPS' });
    }
    const mixedContentRe = /(?:src|href)=["']http:\/\/[^"']+["']/gi;
    const mixedMatches = html.match(mixedContentRe) || [];
    for (const match of mixedMatches) {
        report.security.push({ rule: 'mixed-content', severity: 'error', message: `Mixed content detected: ${match}` });
    }
    return report;
}
//# sourceMappingURL=audit.js.map