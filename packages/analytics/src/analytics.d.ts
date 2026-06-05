export interface RankEntry {
    keyword: string;
    rank: number;
    date: string;
    url?: string;
}
export interface TrendResult {
    direction: 'up' | 'down' | 'stable';
    change: number;
    from: number;
    to: number;
}
export declare class KeywordTracker {
    private history;
    record(entry: RankEntry): void;
    getHistory(keyword: string): RankEntry[];
    getTrend(keyword: string): TrendResult;
    getTopKeywords(n: number): RankEntry[];
}
export declare class RankingTrends {
    private keywords;
    constructor(keywords: Array<{
        keyword: string;
        rank: number;
    }>);
    averagePosition(): number;
    percentageInTop10(): number;
    percentageInTop3(): number;
}
export interface IndexSnapshot {
    date: string;
    indexedCount: number;
}
export interface IndexChange {
    percentage: number;
    direction: 'up' | 'down' | 'stable';
    absolute: number;
    from: number;
    to: number;
}
export declare class IndexingStats {
    private snapshots;
    snapshot(s: IndexSnapshot): void;
    latest(): IndexSnapshot;
    getChange(): IndexChange;
}
export interface CrawlPage {
    url: string;
    depth: number;
    status?: number;
}
export interface CrawlAnalyticsInput {
    totalPages?: number;
    crawledPages?: number;
    pages?: CrawlPage[];
}
export declare class CrawlAnalytics {
    private input;
    constructor(input: CrawlAnalyticsInput);
    coverage(): number;
    avgDepth(): number;
    getDeepPages(options: {
        threshold: number;
    }): CrawlPage[];
}
export interface TrafficEntry {
    date: string;
    sessions: number;
    source: string;
    page?: string;
}
export declare class TrafficAnalytics {
    private entries;
    record(entry: TrafficEntry): void;
    getGrowth(source: string): number;
    getTopPages(n: number): Array<{
        page: string;
        sessions: number;
    }>;
}
//# sourceMappingURL=analytics.d.ts.map