export interface AuditInput {
    html: string;
    url: string;
    metrics?: {
        lcp?: number;
        cls?: number;
        inp?: number;
        ttfb?: number;
    };
}
export interface SEOIssue {
    rule: string;
    severity: 'error' | 'warning' | 'pass' | 'info';
    message: string;
    score?: number;
    url?: string;
}
export interface PerformanceIssue {
    metric: string;
    value?: number;
    status: 'good' | 'needs-improvement' | 'poor';
    score?: number;
}
export interface SecurityIssue {
    rule: string;
    severity: 'error' | 'warning' | 'pass';
    message: string;
    url?: string;
}
export interface TechnicalIssue {
    rule: string;
    severity: 'error' | 'warning' | 'pass';
    message: string;
    url?: string;
}
export interface AuditReport {
    seo: SEOIssue[];
    performance: PerformanceIssue[];
    security: SecurityIssue[];
    technical: TechnicalIssue[];
    score?: number;
}
type Fetcher = (url: string) => Promise<{
    status: number;
    body?: string;
}>;
export declare class AuditEngine {
    private fetcher;
    private report;
    constructor();
    setFetcher(fn: Fetcher): void;
    auditMultiplePages(pages: Array<{
        url: string;
        html: string;
    }>): Promise<AuditReport>;
    auditRobotsTxt(baseUrl: string): Promise<TechnicalIssue[]>;
    auditSitemap(baseUrl: string): Promise<TechnicalIssue[]>;
    auditLinks(links: string[]): Promise<TechnicalIssue[]>;
    auditRedirectChain(redirects: Array<{
        from: string;
        to: string;
        status: number;
    }>): Promise<TechnicalIssue[]>;
    calculateOverallScore(report: AuditReport): number;
    exportReport(_options?: {
        format: 'json' | 'html';
    }): string;
}
export declare function runAudit(input: AuditInput): Promise<AuditReport>;
export {};
//# sourceMappingURL=audit.d.ts.map