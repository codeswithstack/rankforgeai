export interface HreflangInput {
    locale: string;
    url: string;
    isDefault?: boolean;
}
export interface HreflangTag {
    hreflang: string;
    href: string;
}
export interface HreflangOptions {
    format?: 'object' | 'html';
}
export interface HreflangIssue {
    type: string;
    severity: 'error' | 'warning';
    message: string;
}
export type CanonicalStrategy = 'prefix' | 'subdomain' | 'ccTLD';
export interface CanonicalOptions {
    strategy?: CanonicalStrategy;
    ccTLD?: string;
}
export interface RTLMeta {
    dir: 'rtl' | 'ltr';
    lang: string;
}
export interface MultilingualMeta {
    lang: string;
    dir: 'rtl' | 'ltr';
    title?: string;
    description?: string;
}
export declare function generateHreflang(locales: HreflangInput[], options?: HreflangOptions): HreflangTag[] | string[];
export declare function validateHreflang(tags: HreflangTag[], pageUrl?: string): HreflangIssue[];
export declare function generateLocaleCanonical(url: string, locale: string, options?: CanonicalOptions): string;
export declare function detectUntranslatedPages(sitePages: Record<string, string[]>, locales: string[]): Record<string, string[]>;
export declare function detectDuplicateLocales(pages: Array<{
    url: string;
    locale: string;
    contentHash: string;
}>): Array<{
    urls: string[];
    contentHash: string;
}>;
export declare function generateRTLMeta(locale: string): RTLMeta;
export declare function generateMultilingualMeta(locale: string, data?: {
    title?: string;
    description?: string;
}): MultilingualMeta;
export declare function resolveLocaleRoute(url: string, options: {
    strategy: CanonicalStrategy;
}): string | null;
//# sourceMappingURL=i18n-seo.d.ts.map