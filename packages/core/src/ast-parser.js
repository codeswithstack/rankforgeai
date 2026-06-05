export class ASTParser {
    options;
    constructor(options = {}) {
        this.options = options;
    }
    analyze(code, context = {}) {
        const issues = [];
        const lines = code.split('\n');
        lines.forEach((line, idx) => {
            const lineNum = idx + 1;
            // Detect plain <img> tag (not inside a comment)
            if (/<img\s/i.test(line) && !line.trim().startsWith('//') && !line.trim().startsWith('*')) {
                if (this.options.framework === 'nextjs') {
                    const hasNextImage = code.includes("from 'next/image'") || code.includes('from "next/image"');
                    // Only flag if this is NOT already using Next Image
                    if (!line.includes('<Image') && !line.includes('next/image')) {
                        issues.push({
                            type: 'use-next-image',
                            message: 'Use next/image instead of plain <img> for automatic optimization',
                            line: lineNum,
                            severity: 'warning',
                        });
                    }
                }
            }
            // Detect Next.js Image without priority in above-fold component
            if (/<Image\s[^>]*src/.test(line) && this.options.framework === 'nextjs') {
                const componentName = extractComponentName(code);
                if (context.aboveFoldComponents?.includes(componentName) &&
                    !line.includes('priority') &&
                    !code.slice(0, code.indexOf(line)).includes('priority')) {
                    // Check entire Image tag for priority
                    const imageTagMatch = code.match(/<Image[\s\S]*?(?:\/>|>)/);
                    if (imageTagMatch && !imageTagMatch[0].includes('priority')) {
                        issues.push({
                            type: 'missing-priority',
                            message: 'Above-fold image should have priority prop to improve LCP',
                            line: lineNum,
                            severity: 'warning',
                        });
                    }
                }
            }
            // Detect window usage outside useEffect
            if (/\bwindow\b/.test(line) && !line.trim().startsWith('//')) {
                const isInsideUseEffect = isInUseEffect(code, idx);
                if (!isInsideUseEffect) {
                    issues.push({
                        type: 'ssr-unsafe-window',
                        message: 'window is not available during SSR. Wrap in useEffect or check typeof window !== "undefined"',
                        line: lineNum,
                        severity: 'error',
                    });
                }
            }
        });
        return issues;
    }
}
function extractComponentName(code) {
    const m = code.match(/(?:export default function|function|const)\s+(\w+)/);
    return m ? m[1] : '';
}
function isInUseEffect(code, lineIndex) {
    const lines = code.split('\n');
    let depth = 0;
    let inUseEffect = false;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/useEffect\s*\(/.test(line)) {
            inUseEffect = true;
            depth = 0;
        }
        if (inUseEffect) {
            depth += (line.match(/\{/g) || []).length;
            depth -= (line.match(/\}/g) || []).length;
            if (i === lineIndex)
                return true;
            if (depth <= 0 && i > 0)
                inUseEffect = false;
        }
    }
    return false;
}
export function extractReactMetaTags(code) {
    // Static metadata export
    const staticMatch = code.match(/export\s+const\s+metadata\s*=\s*\{([\s\S]*?)\}/);
    if (staticMatch) {
        const block = staticMatch[1];
        const title = extractStringValue(block, 'title');
        const description = extractStringValue(block, 'description');
        return { title, description, isDynamic: false };
    }
    // Dynamic generateMetadata function
    if (/export\s+(?:async\s+)?function\s+generateMetadata/.test(code)) {
        return { isDynamic: true };
    }
    return null;
}
function extractStringValue(code, key) {
    const re = new RegExp(`${key}\\s*:\\s*['"\`]([^'"\`]+)['"\`]`);
    const m = code.match(re);
    return m ? m[1] : undefined;
}
export function detectMissingImageProps(code) {
    const issues = [];
    const lines = code.split('\n');
    lines.forEach((line, idx) => {
        if (!/<img\s/i.test(line))
            return;
        const lineNum = idx + 1;
        const srcMatch = line.match(/src\s*=\s*["']([^"']+)["']/);
        const src = srcMatch ? srcMatch[1] : undefined;
        if (!line.includes('alt=')) {
            issues.push({ type: 'missing-alt', message: 'img tag is missing alt attribute', line: lineNum, src });
        }
        if (!line.includes('width=') || !line.includes('height=')) {
            issues.push({ type: 'missing-dimensions', message: 'img tag is missing width/height (CLS risk)', line: lineNum, src });
        }
    });
    return issues;
}
//# sourceMappingURL=ast-parser.js.map