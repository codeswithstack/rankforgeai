export function detectCloaking(botHTML, userHTML, options = {}) {
    const tolerance = options.tolerance ?? 0.05;
    const botText = extractText(botHTML);
    const userText = extractText(userHTML);
    if (!botText && !userText)
        return { isCloaking: false, confidence: 0 };
    const similarity = cosineSimilarity(tokenize(botText), tokenize(userText));
    const isCloaking = similarity < (1 - tolerance);
    return {
        isCloaking,
        confidence: isCloaking ? 1 - similarity : 0,
        reason: isCloaking ? `Content similarity is only ${(similarity * 100).toFixed(0)}%` : undefined,
    };
}
export function detectSEOPoisoning(html, options = {}) {
    const issues = [];
    if (html) {
        // Keyword stuffing: same word > 5% of total words
        const text = extractText(html);
        const words = tokenize(text);
        const freq = wordFrequency(words);
        for (const [word, count] of freq) {
            if (word.length >= 3 && count / words.length > 0.05) {
                issues.push({ type: 'keyword-stuffing', severity: 'high', message: `"${word}" appears ${count} times (${((count / words.length) * 100).toFixed(1)}% of content)`, evidence: word });
            }
        }
        // Hidden text: color same as background
        if (/color\s*:\s*white[^;]*;[^}]*background[^:]*:\s*white/i.test(html) ||
            /background[^:]*:\s*white[^;]*;[^}]*color\s*:\s*white/i.test(html)) {
            issues.push({ type: 'hidden-text', severity: 'critical', message: 'White-on-white hidden text detected' });
        }
        // display:none spam
        const hiddenMatches = html.match(/<div[^>]+style=["'][^"']*display\s*:\s*none[^"']*["'][^>]*>([\s\S]{20,}?)<\/div>/gi) || [];
        for (const m of hiddenMatches) {
            const innerText = extractText(m);
            if (innerText.length > 10) {
                issues.push({ type: 'hidden-content', severity: 'high', message: 'Hidden content with display:none detected', evidence: innerText.slice(0, 50) });
            }
        }
    }
    // Doorway pages: many similar URLs
    if (options.pages && options.pages.length >= 10) {
        const titles = options.pages.map(p => p.title);
        const patterns = findRepetitivePatterns(titles);
        if (patterns.length > 0) {
            issues.push({ type: 'doorway-pages', severity: 'critical', message: `${options.pages.length} pages with repetitive title pattern: "${patterns[0]}"` });
        }
    }
    return { isClean: issues.length === 0, issues };
}
const SPAM_KEYWORDS = ['casino', 'pills', 'pharmacy', 'viagra', 'cialis', 'porn', 'malware', 'hack'];
export function detectSpamInjection(html) {
    const spamLinks = [];
    let hasScriptInjection = false;
    // Find hidden links
    const hiddenLinkRe = /<a[^>]+href=["']([^"']+)["'][^>]*(?:style=["'][^"']*(?:display\s*:\s*none|visibility\s*:\s*hidden)[^"']*["'])[^>]*>/gi;
    let m;
    while ((m = hiddenLinkRe.exec(html)) !== null) {
        spamLinks.push(m[1]);
    }
    // Find links with spam keywords in anchor text
    const linkTextRe = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    const ltr = new RegExp(linkTextRe.source, 'gi');
    while ((m = ltr.exec(html)) !== null) {
        const href = m[1];
        const text = extractText(m[2]).toLowerCase();
        if (SPAM_KEYWORDS.some(kw => text.includes(kw))) {
            spamLinks.push(href);
        }
    }
    // Script injection
    if (/document\.write\s*\(/.test(html) || /<script[^>]*>[\s\S]*?eval\s*\(/.test(html)) {
        hasScriptInjection = true;
    }
    return { hasSpam: spamLinks.length > 0 || hasScriptInjection, spamLinks: [...new Set(spamLinks)], hasScriptInjection };
}
export function detectMixedContent(html, pageUrl) {
    const issues = [];
    if (!pageUrl.startsWith('https://'))
        return { issues };
    const checks = [
        { re: /<img[^>]+src=["'](http:\/\/[^"']+)["']/gi, type: 'image', severity: 'warning' },
        { re: /<script[^>]+src=["'](http:\/\/[^"']+)["']/gi, type: 'script', severity: 'error' },
        { re: /<link[^>]+href=["'](http:\/\/[^"']+)["']/gi, type: 'stylesheet', severity: 'error' },
        { re: /<iframe[^>]+src=["'](http:\/\/[^"']+)["']/gi, type: 'iframe', severity: 'warning' },
    ];
    for (const { re, type, severity } of checks) {
        let m;
        const r = new RegExp(re.source, re.flags);
        while ((m = r.exec(html)) !== null) {
            issues.push({ type, url: m[1], severity });
        }
    }
    return { issues };
}
const SUSPICIOUS_TLDS = ['.xyz', '.tk', '.ml', '.ga', '.cf', '.pw', '.top'];
export function detectMaliciousRedirects(redirects) {
    const suspicious = [];
    for (const r of redirects) {
        try {
            const fromHost = new URL(r.from).hostname;
            const toHost = new URL(r.to).hostname;
            if (fromHost === toHost)
                continue;
            const hasSuspiciousTLD = SUSPICIOUS_TLDS.some(tld => toHost.endsWith(tld));
            if (hasSuspiciousTLD) {
                suspicious.push({ from: r.from, to: r.to, reason: `Redirects to suspicious TLD domain: ${toHost}` });
            }
        }
        catch { }
    }
    return { suspicious };
}
const BOT_PATTERNS = [
    { re: /Googlebot/i, type: 'googlebot', name: 'Googlebot' },
    { re: /Bingbot/i, type: 'bingbot', name: 'Bingbot' },
    { re: /Slurp/i, type: 'yahoo', name: 'Yahoo Slurp' },
    { re: /DuckDuckBot/i, type: 'duckduckgo', name: 'DuckDuckBot' },
    { re: /Baiduspider/i, type: 'baidu', name: 'Baiduspider' },
    { re: /SemrushBot/i, type: 'semrush', name: 'SemrushBot' },
    { re: /AhrefsBot/i, type: 'ahrefs', name: 'AhrefsBot' },
    { re: /MJ12bot/i, type: 'majestic', name: 'MJ12bot' },
    { re: /bot|crawler|spider|scraper/i, type: 'generic-bot', name: 'Generic Bot' },
];
export function filterBots(userAgent) {
    for (const { re, type, name } of BOT_PATTERNS) {
        if (re.test(userAgent)) {
            return { isBot: true, botType: type, botName: name };
        }
    }
    return { isBot: false };
}
// ─── Helpers ──────────────────────────────────────────────────────────────────
function extractText(html) {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
function tokenize(text) {
    return text.toLowerCase().split(/\W+/).filter(w => w.length > 2);
}
function wordFrequency(words) {
    const map = new Map();
    for (const w of words)
        map.set(w, (map.get(w) || 0) + 1);
    return map;
}
function cosineSimilarity(a, b) {
    const setA = new Set(a);
    const setB = new Set(b);
    const intersection = [...setA].filter(x => setB.has(x)).length;
    if (!setA.size || !setB.size)
        return 0;
    return intersection / Math.sqrt(setA.size * setB.size);
}
function findRepetitivePatterns(titles) {
    const freq = wordFrequency(titles.join(' ').split(' '));
    return [...freq.entries()]
        .filter(([, count]) => count > titles.length * 0.5)
        .map(([word]) => word);
}
//# sourceMappingURL=security.js.map