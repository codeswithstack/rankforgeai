export interface HreflangTag {
    hreflang: string;
    href: string;
}
export declare class EdgeSEOOptimizer {
    rewriteMetaTags(input: {
        html: string;
        geo: {
            country: string;
            language: string;
        };
        translations?: Record<string, {
            title?: string;
            description?: string;
        }>;
    }): string;
    injectHreflang(input: {
        html: string;
        locales: HreflangTag[];
    }): string;
    getCanonicalHeaders(url: string): Record<string, string>;
}
export interface GeoSEOIssue {
    type: string;
    severity: 'error' | 'warning';
    message: string;
}
export interface GeoSEOSuggestion {
    type: string;
    message: string;
}
export interface GeoSEOResult {
    issues: GeoSEOIssue[];
    suggestions: GeoSEOSuggestion[];
}
export declare function detectGeoSEO(input: {
    targetRegions: string[];
    hasHreflang?: boolean;
    hasGeoMeta?: boolean;
    serverRegion?: string;
    hasCDN?: boolean;
}): GeoSEOResult;
export type PageType = 'static' | 'personalized' | 'blog' | 'api' | 'dynamic';
export type CDNProvider = 'cloudflare' | 'fastly' | 'vercel' | 'cloudfront';
export declare function generateCDNCacheHeaders(input: {
    pageType: PageType;
    ttl?: number;
    swr?: number;
    cdn?: CDNProvider;
}): Record<string, string>;
export interface EdgePage {
    path: string;
    renderMode?: 'SSR' | 'SSG' | 'ISR' | 'CSR';
    revalidate?: number;
    avgUpdateFrequency?: string;
}
export interface EdgeRenderingResult {
    isrPages: EdgePage[];
    suggestions: Array<{
        type: string;
        page: string;
        message: string;
    }>;
}
export declare function analyzeEdgeRendering(config: {
    framework: string;
    pages: EdgePage[];
}): EdgeRenderingResult;
//# sourceMappingURL=edge.d.ts.map