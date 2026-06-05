export interface SitemapURL {
    url: string;
    lastmod?: string;
    changefreq?: string;
    priority?: number;
}
export interface ImageEntry {
    loc: string;
    title?: string;
    caption?: string;
    geoLocation?: string;
    license?: string;
}
export interface ImagePageEntry {
    url: string;
    images: ImageEntry[];
    lastmod?: string;
}
export interface VideoEntry {
    thumbnailLoc: string;
    title: string;
    description?: string;
    contentLoc?: string;
    playerLoc?: string;
    duration?: number;
    publicationDate?: string;
    family_friendly?: boolean;
}
export interface VideoPageEntry {
    url: string;
    video: VideoEntry;
    lastmod?: string;
}
export interface NewsEntry {
    publicationName: string;
    publicationLanguage: string;
    title: string;
    publicationDate: string;
    genres?: string;
    keywords?: string;
}
export interface NewsPageEntry {
    url: string;
    news: NewsEntry;
}
export interface HreflangEntry {
    hreflang: string;
    href: string;
}
export interface MultilingualPageEntry {
    url: string;
    alternates: HreflangEntry[];
    lastmod?: string;
}
export interface SitemapIndexEntry {
    loc: string;
    lastmod?: string;
}
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: Array<{
        type: string;
        url?: string;
        message: string;
    }>;
}
export declare function generateSitemap(urls: SitemapURL[]): string;
export declare function generateImageSitemap(pages: ImagePageEntry[]): string;
export declare function generateVideoSitemap(pages: VideoPageEntry[]): string;
export declare function generateNewsSitemap(pages: NewsPageEntry[]): string;
export declare function generateMultilingualSitemap(pages: MultilingualPageEntry[]): string;
export declare function generateSitemapIndex(sitemaps: SitemapIndexEntry[]): string;
export declare function chunkSitemap<T>(urls: T[], size: number): T[][];
export declare function compressSitemap(xml: string): Promise<Buffer>;
export declare function validateSitemap(xml: string): ValidationResult;
//# sourceMappingURL=sitemap.d.ts.map