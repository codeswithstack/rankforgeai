const IMAGE_SIZE_THRESHOLD = 500_000; // 500KB
export function detectLCPIssues(page) {
    const issues = [];
    for (const img of page.images || []) {
        if (img.size && img.size > IMAGE_SIZE_THRESHOLD) {
            issues.push({
                type: 'large-image',
                severity: 'critical',
                message: `Image ${img.src} is ${(img.size / 1_000_000).toFixed(1)}MB — optimize it`,
                element: img,
            });
        }
        if (img.isLCP && img.hasPriority === false) {
            issues.push({
                type: 'missing-priority',
                severity: 'high',
                message: `LCP image ${img.src} is missing priority attribute`,
                element: img,
            });
        }
        if (img.isAboveFold && img.hasPriority === false && img.isLCP !== false) {
            // Flag missing priority on above fold images that might be LCP
            if (!issues.find(i => i.type === 'missing-priority' && i.element?.src === img.src)) {
                issues.push({
                    type: 'missing-priority',
                    severity: 'high',
                    message: `Above-fold image ${img.src} should have priority`,
                    element: img,
                });
            }
        }
    }
    for (const script of page.scripts || []) {
        if (!script.isAsync && !script.isDefer && script.isInHead !== false) {
            issues.push({
                type: 'blocking-script',
                severity: 'high',
                message: `Render-blocking script: ${script.src}`,
                element: script,
            });
        }
    }
    for (const css of page.stylesheets || []) {
        if (!css.hasPreload) {
            issues.push({
                type: 'blocking-css',
                severity: 'medium',
                message: `Render-blocking stylesheet: ${css.href}`,
                element: css,
            });
        }
    }
    return issues;
}
export function generateLCPFixes(issue) {
    if (issue.type === 'large-image') {
        const src = String(issue.element.src || '').replace(/\.(png|jpg|jpeg)$/, '.avif');
        return {
            code: `<Image src="${src}" priority width={1920} height={1080} alt="" />`,
            description: 'Convert to AVIF and add priority loading',
            suggestions: [{ action: 'convert-to-avif', description: 'Convert image to AVIF format for 50-80% size reduction' }],
        };
    }
    if (issue.type === 'blocking-css') {
        const href = issue.element.href;
        return {
            code: `<link rel="preload" href="${href}" as="style" onLoad="this.onload=null;this.rel='stylesheet'"/>`,
            description: 'Preload critical CSS to remove render blocking',
        };
    }
    if (issue.type === 'blocking-script') {
        const src = issue.element.src;
        return {
            code: `<script src="${src}" async></script>`,
            description: 'Add async attribute to remove render blocking',
        };
    }
    if (issue.type === 'missing-priority') {
        const src = issue.element.src;
        return {
            code: `<Image src="${src}" priority alt="" />`,
            description: 'Add priority prop to trigger early preloading',
        };
    }
    return { code: '', description: 'Unknown issue type' };
}
export function calculateLCPScore(ms) {
    if (ms <= 1200)
        return 100;
    if (ms <= 2500)
        return Math.round(100 - ((ms - 1200) / (2500 - 1200)) * 10);
    if (ms <= 4000)
        return Math.round(90 - ((ms - 2500) / (4000 - 2500)) * 40);
    if (ms <= 6000)
        return Math.round(50 - ((ms - 4000) / (6000 - 4000)) * 50);
    return 0;
}
//# sourceMappingURL=lcp.js.map