// Lightweight HTML parser using regex-based extraction (no DOM dependency needed)
class SimpleDoc {
    rawHTML;
    constructor(html) {
        this.rawHTML = html;
    }
    get title() {
        const match = this.rawHTML.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        return match ? this.decodeEntities(match[1].trim()) : undefined;
    }
    getAttribute(tag, attr) {
        const re = new RegExp(`<${tag}[^>]+${attr}\\s*=\\s*["']([^"']*?)["']`, 'i');
        const m = this.rawHTML.match(re);
        return m ? m[1] : undefined;
    }
    getMeta(name) {
        const patterns = [
            new RegExp(`<meta[^>]+name\\s*=\\s*["']${name}["'][^>]+content\\s*=\\s*["']([^"']*?)["']`, 'i'),
            new RegExp(`<meta[^>]+content\\s*=\\s*["']([^"']*?)["'][^>]+name\\s*=\\s*["']${name}["']`, 'i'),
        ];
        for (const re of patterns) {
            const m = this.rawHTML.match(re);
            if (m)
                return m[1];
        }
        return undefined;
    }
    getProperty(property) {
        const patterns = [
            new RegExp(`<meta[^>]+property\\s*=\\s*["']${property}["'][^>]+content\\s*=\\s*["']([^"']*?)["']`, 'i'),
            new RegExp(`<meta[^>]+content\\s*=\\s*["']([^"']*?)["'][^>]+property\\s*=\\s*["']${property}["']`, 'i'),
        ];
        for (const re of patterns) {
            const m = this.rawHTML.match(re);
            if (m)
                return m[1];
        }
        return undefined;
    }
    getAll(tagPattern) {
        const results = [];
        let m;
        const re = new RegExp(tagPattern.source, tagPattern.flags.includes('g') ? tagPattern.flags : tagPattern.flags + 'g');
        while ((m = re.exec(this.rawHTML)) !== null) {
            results.push(m);
        }
        return results;
    }
    decodeEntities(str) {
        return str
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");
    }
}
export function parseHTML(html) {
    return new SimpleDoc(html);
}
export function extractMeta(doc) {
    return {
        title: doc.title,
        description: doc.getMeta('description'),
        canonical: (() => {
            const m = doc.rawHTML.match(/<link[^>]+rel\s*=\s*["']canonical["'][^>]+href\s*=\s*["']([^"']+)["']/i)
                || doc.rawHTML.match(/<link[^>]+href\s*=\s*["']([^"']+)["'][^>]+rel\s*=\s*["']canonical["']/i);
            return m ? m[1] : undefined;
        })(),
        robots: doc.getMeta('robots'),
        keywords: doc.getMeta('keywords'),
        author: doc.getMeta('author'),
        og: {
            title: doc.getProperty('og:title'),
            description: doc.getProperty('og:description'),
            image: doc.getProperty('og:image'),
            url: doc.getProperty('og:url'),
            type: doc.getProperty('og:type'),
        },
        twitter: {
            card: doc.getMeta('twitter:card'),
            title: doc.getMeta('twitter:title'),
            description: doc.getMeta('twitter:description'),
            image: doc.getMeta('twitter:image'),
        },
    };
}
export function extractHeadings(doc) {
    const headings = [];
    const re = /<h([1-6])[^>]*>([\s\S]*?)<\/h[1-6]>/gi;
    let m;
    const html = doc.rawHTML;
    const regex = new RegExp(re.source, 'gi');
    while ((m = regex.exec(html)) !== null) {
        const level = parseInt(m[1], 10);
        const text = m[2].replace(/<[^>]+>/g, '').trim();
        headings.push({ level, text });
    }
    return headings;
}
export function extractLinks(doc, baseUrl) {
    const links = [];
    const re = /<a([^>]*)>([\s\S]*?)<\/a>/gi;
    let m;
    const regex = new RegExp(re.source, 'gi');
    while ((m = regex.exec(doc.rawHTML)) !== null) {
        const attrs = m[1];
        const text = m[2].replace(/<[^>]+>/g, '').trim();
        const hrefMatch = attrs.match(/href\s*=\s*["']([^"']*)["']/);
        const relMatch = attrs.match(/rel\s*=\s*["']([^"']*)["']/);
        const href = hrefMatch ? hrefMatch[1] : undefined;
        const rel = relMatch ? relMatch[1] : undefined;
        const nofollow = rel ? rel.includes('nofollow') : false;
        let type;
        if (href && baseUrl) {
            try {
                const base = new URL(baseUrl);
                if (href.startsWith('/') || href.startsWith(base.origin)) {
                    type = 'internal';
                }
                else if (href.startsWith('http')) {
                    const linkUrl = new URL(href);
                    type = linkUrl.hostname === base.hostname ? 'internal' : 'external';
                }
            }
            catch { }
        }
        links.push({ href, text, nofollow, type, rel });
    }
    return links;
}
//# sourceMappingURL=html-parser.js.map