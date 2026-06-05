export interface CrawlOptions {
    baseUrl: string;
    maxDepth?: number;
    concurrency?: number;
    respectRobots?: boolean;
    userAgent?: string;
}
export interface CrawledPage {
    url: string;
    status: number;
    html?: string;
    depth?: number;
}
export interface OrphanResult {
    urls: string[];
}
export interface DuplicateContentResult {
    urls: string[];
    contentHash: string;
}
export interface CrawlCallbacks {
    onPage?: (url: string, page?: CrawledPage) => void;
    onError?: (url: string, error: Error) => void;
}
type Fetcher = (url: string) => Promise<{
    html: string;
    status: number;
}>;
export declare class CrawlEngine {
    readonly options: Required<CrawlOptions>;
    private visited;
    private fetcher;
    private robotsRules;
    private crawlDelay;
    constructor(options: CrawlOptions);
    private isValidUrl;
    setFetcher(fn: Fetcher): void;
    normalizeUrl(url: string): string;
    resolveUrl(path: string): string;
    isInScope(url: string): boolean;
    shouldCrawl(url: string): boolean;
    crawlUrl(url: string): Promise<CrawledPage | null>;
    crawl(callbacks?: CrawlCallbacks): Promise<void>;
    detectOrphanPages(linkMap: Map<string, string[]>): string[];
    detectDuplicateContent(pages: Array<{
        url: string;
        contentHash: string;
    }>): DuplicateContentResult[];
    setRobotsTxt(content: string): void;
    isAllowedByRobots(url: string): boolean;
    getCrawlDelay(): number;
}
export {};
//# sourceMappingURL=crawler.d.ts.map