export function analyzeSSR(html) {
    const framework = detectFramework(html);
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const bodyContent = bodyMatch ? bodyMatch[1] : '';
    const textContent = bodyContent.replace(/<[^>]+>/g, '').trim();
    const hasContent = textContent.length > 3;
    // CSR pattern: only a root div with no meaningful content
    const csrPattern = /<body[^>]*>\s*<div[^>]*id=["']root["'][^>]*>\s*<\/div>\s*<\/body>/i;
    const isCSR = csrPattern.test(html);
    return {
        isSSR: !isCSR && hasContent,
        hasContent,
        framework,
    };
}
function detectFramework(html) {
    if (html.includes('__NEXT_DATA__'))
        return 'nextjs';
    if (html.includes('__NUXT__') || html.includes('window.__NUXT__'))
        return 'nuxt';
    if (html.includes('data-sveltekit-preload-data') || html.includes('sveltekit'))
        return 'sveltekit';
    return 'unknown';
}
function parseSimpleDOM(html) {
    const nodes = [];
    const elementRe = /<(\w+)([^>]*)>([\s\S]*?)<\/\1>/g;
    let m;
    while ((m = elementRe.exec(html)) !== null) {
        const tag = m[1];
        const attrStr = m[2];
        const inner = m[3];
        const attrs = {};
        const attrRe = /(\w[\w-]*)=["']([^"']*)["']/g;
        let am;
        while ((am = attrRe.exec(attrStr)) !== null) {
            attrs[am[1]] = am[2];
        }
        const childCount = (inner.match(/<\w[^>]*>/g) || []).length;
        nodes.push({
            tag,
            text: inner.replace(/<[^>]+>/g, '').trim(),
            attrs,
            children: [],
            component: attrs['data-component'],
            childCount,
        });
    }
    return nodes;
}
export class SSRAnalyzer {
    findHydrationMismatches(serverHTML, clientHTML) {
        const mismatches = [];
        const serverNodes = parseSimpleDOM(serverHTML);
        const clientNodes = parseSimpleDOM(clientHTML);
        const len = Math.max(serverNodes.length, clientNodes.length);
        for (let i = 0; i < len; i++) {
            const s = serverNodes[i];
            const c = clientNodes[i];
            if (!s && c) {
                mismatches.push({ type: 'missing-node', component: c.component });
                continue;
            }
            if (s && !c) {
                mismatches.push({ type: 'extra-node', component: s.component });
                continue;
            }
            if (s && c) {
                // Child count mismatch takes priority over text comparison
                if (s.childCount > c.childCount) {
                    mismatches.push({ type: 'extra-node', component: s.component });
                    continue;
                }
                if (s.childCount < c.childCount) {
                    mismatches.push({ type: 'missing-node', component: c.component });
                    continue;
                }
                // Text mismatch
                if (s.text !== c.text && s.text && c.text) {
                    mismatches.push({
                        type: 'text-content',
                        serverValue: s.text,
                        clientValue: c.text,
                        component: s.component || c.component,
                    });
                }
                // Attribute mismatch
                const allAttrs = new Set([...Object.keys(s.attrs), ...Object.keys(c.attrs)]);
                for (const attr of allAttrs) {
                    if (attr === 'data-component')
                        continue;
                    if (s.attrs[attr] !== c.attrs[attr]) {
                        mismatches.push({
                            type: 'attribute',
                            attribute: attr,
                            serverValue: s.attrs[attr],
                            clientValue: c.attrs[attr],
                            component: s.component,
                        });
                    }
                }
            }
        }
        return mismatches;
    }
    extractNextJsRoutes(files) {
        return files.map(file => {
            let route = file
                .replace(/^pages/, '')
                .replace(/\.(tsx|ts|jsx|js)$/, '')
                .replace(/\/index$/, '')
                .replace(/\[([^\]]+)\]/g, ':$1');
            if (route === '')
                route = '/';
            return route || '/';
        });
    }
    extractAppRouterRoutes(files) {
        return files.map(file => {
            let route = file
                .replace(/^app/, '')
                .replace(/\/page\.(tsx|ts|jsx|js)$/, '')
                .replace(/\[([^\]]+)\]/g, ':$1');
            if (route === '')
                route = '/';
            return route || '/';
        });
    }
}
//# sourceMappingURL=ssr-analyzer.js.map