export class EdgeSEOOptimizer {
    rewriteMetaTags(input) {
        let html = input.html;
        const translation = input.translations?.[input.geo.country];
        if (!translation)
            return html;
        if (translation.title) {
            html = html.replace(/<title[^>]*>([^<]*)<\/title>/i, `<title>${translation.title}</title>`);
        }
        if (translation.description) {
            html = html.replace(/(<meta[^>]+name=["']description["'][^>]+content=["'])([^"']+)(["'])/i, `$1${translation.description}$3`);
        }
        return html;
    }
    injectHreflang(input) {
        const tags = input.locales
            .map(l => `<link rel="alternate" hreflang="${l.hreflang}" href="${l.href}"/>`)
            .join('\n');
        return input.html.replace(/<\/head>/i, `${tags}\n</head>`);
    }
    getCanonicalHeaders(url) {
        return { 'Link': `<${url}>; rel="canonical"` };
    }
}
export function detectGeoSEO(input) {
    const issues = [];
    const suggestions = [];
    if (input.targetRegions.length > 1 && !input.hasHreflang) {
        issues.push({ type: 'missing-hreflang', severity: 'error', message: 'Multi-region site missing hreflang annotations' });
    }
    if (input.targetRegions.length > 2 && !input.hasCDN) {
        suggestions.push({ type: 'add-cdn', message: `Site targets ${input.targetRegions.length} regions but has no CDN — add edge delivery for better TTFB globally` });
    }
    return { issues, suggestions };
}
export function generateCDNCacheHeaders(input) {
    const headers = {};
    if (input.pageType === 'personalized') {
        headers['Cache-Control'] = 'private, no-store';
        return headers;
    }
    if (input.pageType === 'api') {
        headers['Cache-Control'] = 'no-cache, no-store';
        return headers;
    }
    const ttl = input.ttl ?? 3600;
    const parts = ['public', `max-age=${ttl}`];
    if (input.swr) {
        parts.push(`stale-while-revalidate=${input.swr}`);
    }
    headers['Cache-Control'] = parts.join(', ');
    if (input.cdn === 'cloudflare') {
        headers['CDN-Cache-Control'] = `public, max-age=${ttl}`;
    }
    else if (input.cdn === 'fastly') {
        headers['Surrogate-Control'] = `max-age=${ttl}`;
    }
    return headers;
}
export function analyzeEdgeRendering(config) {
    const isrPages = config.pages.filter(p => p.revalidate !== undefined && p.revalidate > 0);
    const suggestions = [];
    for (const page of config.pages) {
        if (page.renderMode === 'SSR' && page.avgUpdateFrequency === 'hourly') {
            suggestions.push({
                type: 'use-isr',
                page: page.path,
                message: `${page.path} updates hourly — use ISR with revalidate=3600 instead of full SSR for better performance`,
            });
        }
        if (page.renderMode === 'CSR') {
            suggestions.push({
                type: 'use-ssr',
                page: page.path,
                message: `${page.path} is client-side rendered — switch to SSR or SSG for better SEO`,
            });
        }
    }
    return { isrPages, suggestions };
}
//# sourceMappingURL=edge.js.map