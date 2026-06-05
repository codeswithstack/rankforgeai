export interface RUMEntry {
    type: 'LCP' | 'CLS' | 'INP' | 'TTFB' | 'FCP';
    value: number;
    url: string;
    timestamp?: number;
}
export interface MetricStats {
    p75: number;
    median: number;
    p95: number;
    count: number;
    avg: number;
}
export interface PageMetrics {
    LCP?: MetricStats;
    CLS?: MetricStats;
    INP?: MetricStats;
    TTFB?: MetricStats;
    FCP?: MetricStats;
}
export declare class RUMCollector {
    private data;
    record(entry: RUMEntry): void;
    getMetrics(url: string): PageMetrics;
}
export interface AlertThresholds {
    LCP?: {
        warning: number;
        critical: number;
    };
    CLS?: {
        warning: number;
        critical: number;
    };
    INP?: {
        warning: number;
        critical: number;
    };
    TTFB?: {
        warning: number;
        critical: number;
    };
}
export interface MetricAlert {
    metric: string;
    value: number;
    severity: 'warning' | 'critical';
    message: string;
}
export interface SEOAlert {
    type: string;
    severity: 'warning' | 'critical' | 'info';
    message: string;
    previousValue?: number;
    currentValue?: number;
}
export declare class AlertEngine {
    private thresholds;
    constructor(options: {
        thresholds: AlertThresholds;
    });
    evaluate(input: {
        metric: string;
        value: number;
    }): MetricAlert | null;
    evaluateSEO(input: {
        keyword?: string;
        previousRank?: number;
        currentRank?: number;
        indexedPages?: {
            previous: number;
            current: number;
        };
    }): SEOAlert | null;
}
export interface NotificationConfig {
    slack?: {
        webhookUrl: string;
    };
    discord?: {
        webhookUrl: string;
    };
    email?: {
        to: string;
        from?: string;
    };
    webhook?: {
        url: string;
    };
}
export interface Notification {
    channel: 'slack' | 'discord' | 'email' | 'webhook';
    message: string;
    severity: 'info' | 'warning' | 'critical';
    data?: Record<string, unknown>;
}
type TransportFn = (payload: Record<string, unknown>) => Promise<unknown>;
export declare class NotificationService {
    private config;
    private transports;
    constructor(config: NotificationConfig);
    setTransport(channel: string, fn: TransportFn): void;
    notify(notification: Notification): Promise<void>;
}
export interface PageStatus {
    status: number;
    lastSeen?: string;
}
export interface CrawlDiff {
    new: string[];
    broken: string[];
    recovered: string[];
    removed: string[];
}
export declare class Monitor {
    diffCrawls(previous: Map<string, PageStatus>, current: Map<string, PageStatus>): CrawlDiff;
}
export {};
//# sourceMappingURL=monitor.d.ts.map