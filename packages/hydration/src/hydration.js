function parseNodes(html) {
    const nodes = [];
    // Match only top-level tags (not nested ones of the same type)
    const re = /<(\w+)([^>]*)>([\s\S]*?)<\/\1>/g;
    let m;
    const r = new RegExp(re.source, 'g');
    while ((m = r.exec(html)) !== null) {
        const tag = m[1];
        const attrStr = m[2];
        const inner = m[3];
        const attrs = {};
        const ar = /(\w[\w-]*)=["']([^"']*)["']/g;
        let am;
        while ((am = ar.exec(attrStr)) !== null) {
            attrs[am[1]] = am[2];
        }
        // Count direct child elements
        const childCount = (inner.match(/<\w[^>]*>/g) || []).length;
        nodes.push({
            tag,
            text: inner.replace(/<[^>]+>/g, '').trim(),
            attrs,
            component: attrs['data-component'],
            childCount,
        });
    }
    return nodes;
}
export function detectHydrationMismatches(serverHTML, clientHTML) {
    const serverNodes = parseNodes(serverHTML);
    const clientNodes = parseNodes(clientHTML);
    const mismatches = [];
    const len = Math.max(serverNodes.length, clientNodes.length);
    for (let i = 0; i < len; i++) {
        const s = serverNodes[i];
        const c = clientNodes[i];
        if (s && !c) {
            mismatches.push({ type: 'extra-node', component: s.component });
            continue;
        }
        if (!s && c) {
            mismatches.push({ type: 'missing-node', component: c.component });
            continue;
        }
        if (s && c) {
            const sChildren = s.childCount ?? 0;
            const cChildren = c.childCount ?? 0;
            if (sChildren > cChildren) {
                mismatches.push({ type: 'extra-node', component: s.component });
                continue;
            }
            if (sChildren < cChildren) {
                mismatches.push({ type: 'missing-node', component: c.component });
                continue;
            }
            if (s.text !== c.text && s.text && c.text) {
                mismatches.push({
                    type: 'text-content',
                    serverValue: s.text,
                    clientValue: c.text,
                    component: s.component || c.component,
                });
            }
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
    return { hasMismatches: mismatches.length > 0, mismatches };
}
export function analyzeLocaleMismatch(input) {
    if (input.context === 'number-format' || /\d{1,3}[.,]\d{3}/.test(input.server)) {
        return { type: 'locale-number-format', fix: 'use-server-locale', serverValue: input.server, clientValue: input.client };
    }
    if (input.context === 'currency' || /[$€£¥]/.test(input.server) || /[$€£¥]/.test(input.client)) {
        return { type: 'locale-currency', fix: 'normalize-currency', serverValue: input.server, clientValue: input.client };
    }
    return { type: 'locale-generic', fix: 'use-server-locale' };
}
export function analyzeDateMismatch(input) {
    if (input.context === 'dynamic-date') {
        return { type: 'dynamic-date', fix: 'wrap-in-useEffect', serverDate: input.server, clientDate: input.client };
    }
    if (input.timezone) {
        const serverDate = new Date(input.server);
        const clientDate = new Date(input.client);
        const diffDays = Math.abs(serverDate.getTime() - clientDate.getTime()) / (24 * 60 * 60 * 1000);
        if (diffDays >= 1) {
            return { type: 'timezone-offset', fix: 'use-utc-dates', serverDate: input.server, clientDate: input.client };
        }
    }
    return { type: 'date-mismatch', fix: 'normalize-date' };
}
export function generateHydrationFix(input) {
    if (input.type === 'dynamic-date' || input.type === 'dynamic-content') {
        return {
            type: 'useEffect',
            description: 'Move dynamic value to client-side useEffect to avoid hydration mismatch',
            code: `const [value, setValue] = useState<string | null>(null)
useEffect(() => {
  setValue(${input.code || 'new Date().toLocaleDateString()'})
}, [])
if (!value) return null`,
        };
    }
    if (input.type === 'intentional') {
        return {
            type: 'suppress',
            description: 'Suppress intentional mismatch warning',
            code: `<div suppressHydrationWarning>
  {/* content that differs between server and client */}
</div>`,
        };
    }
    if (input.type === 'client-only-component') {
        const path = input.importPath || `./${input.component}`;
        return {
            type: 'dynamic-import',
            description: `Load ${input.component} only on client to skip SSR`,
            code: `const ${input.component} = dynamic(() => import('${path}'), {\n  ssr: false,\n  loading: () => <div>Loading...</div>,\n})`,
        };
    }
    return { type: 'unknown', code: '', description: 'No fix available' };
}
export function suggestUseEffect(originalCode, variableName) {
    return `const [${variableName}, set${capitalize(variableName)}] = useState<string | null>(null)
useEffect(() => {
  set${capitalize(variableName)}(${originalCode.trim()})
}, [])`;
}
export function suggestDynamicImport(componentName, importPath) {
    return `const ${componentName} = dynamic(() => import('${importPath}'), {
  ssr: false,
  loading: () => <div>Loading ${componentName}...</div>,
})`;
}
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
//# sourceMappingURL=hydration.js.map