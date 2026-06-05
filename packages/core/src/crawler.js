export class CrawlEngine {
    options;
    visited = new Set();
    fetcher;
    robotsRules = [];
    crawlDelay = 0;
    constructor(options) {
        if (!this.isValidUrl(options.baseUrl)) {
            throw new Error(`Invalid base URL: ${options.baseUrl}`);
        }
        this.options = {
            maxDepth: 5,
            concurrency: 3,
            respectRobots: true,
            userAgent: 'RankForgeBot/1.0',
            ...options,
        };
        const ua = this.options.userAgent;
        this.fetcher = async (url) => {
            const res = await fetch(url, { headers: { 'User-Agent': ua } });
            return { html: await res.text(), status: res.status };
        };
    }
    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        }
        catch {
            return false;
        }
    }
    setFetcher(fn) {
        this.fetcher = fn;
    }
    normalizeUrl(url) {
        try {
            const u = new URL(url);
            u.hash = '';
            let path = u.pathname;
            if (path.endsWith('/') && path.length > 1)
                path = path.slice(0, -1);
            u.pathname = path;
            return u.toString();
        }
        catch {
            return url;
        }
    }
    resolveUrl(path) {
        const base = new URL(this.options.baseUrl);
        return new URL(path, base).toString();
    }
    isInScope(url) {
        try {
            const u = new URL(url);
            const base = new URL(this.options.baseUrl);
            return u.hostname === base.hostname;
        }
        catch {
            return false;
        }
    }
    shouldCrawl(url) {
        const nonHTML = /\.(pdf|png|jpg|jpeg|gif|svg|webp|avif|ico|css|js|json|xml|zip|mp4|mp3|woff|woff2|ttf|eot)(\?.*)?$/i;
        try {
            const u = new URL(url);
            return !nonHTML.test(u.pathname);
        }
        catch {
            return false;
        }
    }
    async crawlUrl(url) {
        const normalized = this.normalizeUrl(url);
        if (this.visited.has(normalized))
            return null;
        this.visited.add(normalized);
        const result = await this.fetcher(normalized);
        return { url: normalized, ...result };
    }
    async crawl(callbacks = {}) {
        const queue = [
            { url: this.normalizeUrl(this.options.baseUrl), depth: 0 },
        ];
        while (queue.length > 0) {
            const item = queue.shift();
            if (item.depth > this.options.maxDepth)
                continue;
            const page = await this.crawlUrl(item.url);
            if (page && callbacks.onPage) {
                callbacks.onPage(page.url, page);
            }
        }
    }
    detectOrphanPages(linkMap) {
        const allPages = Array.from(linkMap.keys());
        const linkedPages = new Set();
        for (const [from, links] of linkMap) {
            for (const link of links) {
                if (link !== from)
                    linkedPages.add(link);
            }
        }
        return allPages.filter(page => {
            const isRoot = page === this.normalizeUrl(this.options.baseUrl);
            return !isRoot && !linkedPages.has(page);
        });
    }
    detectDuplicateContent(pages) {
        const hashMap = new Map();
        for (const page of pages) {
            const existing = hashMap.get(page.contentHash) || [];
            existing.push(page.url);
            hashMap.set(page.contentHash, existing);
        }
        const results = [];
        for (const [hash, urls] of hashMap) {
            if (urls.length > 1) {
                results.push({ urls, contentHash: hash });
            }
        }
        return results;
    }
    setRobotsTxt(content) {
        this.robotsRules = [];
        this.crawlDelay = 0;
        const lines = content.split('\n').map(l => l.trim());
        let inRelevantBlock = false;
        for (const line of lines) {
            if (line.toLowerCase().startsWith('user-agent:')) {
                const agent = line.slice(11).trim();
                inRelevantBlock = agent === '*' || agent.toLowerCase() === 'rankforgebot';
            }
            else if (inRelevantBlock) {
                if (line.toLowerCase().startsWith('disallow:')) {
                    const path = line.slice(9).trim();
                    if (path) {
                        const escaped = path.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
                        this.robotsRules.push({ pattern: new RegExp(`^${escaped}`), allow: false });
                    }
                }
                else if (line.toLowerCase().startsWith('allow:')) {
                    const path = line.slice(6).trim();
                    if (path) {
                        const escaped = path.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
                        this.robotsRules.push({ pattern: new RegExp(`^${escaped}`), allow: true });
                    }
                }
                else if (line.toLowerCase().startsWith('crawl-delay:')) {
                    this.crawlDelay = parseFloat(line.slice(12).trim()) * 1000;
                }
            }
        }
    }
    isAllowedByRobots(url) {
        try {
            const path = new URL(url).pathname;
            for (const rule of [...this.robotsRules].reverse()) {
                if (rule.pattern.test(path))
                    return rule.allow;
            }
            return true;
        }
        catch {
            return true;
        }
    }
    getCrawlDelay() {
        return this.crawlDelay;
    }
}
//# sourceMappingURL=crawler.js.map