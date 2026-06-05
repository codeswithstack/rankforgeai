export interface DBQuery {
    sql: string;
    duration: number;
    hasIndex?: boolean;
}
export interface ServerProfile {
    ttfb: number;
    dbQueryTime?: number;
    middlewareTime?: number;
    cacheHit?: boolean;
    queries?: DBQuery[];
    route?: string;
    region?: string;
}
export interface TTFBIssue {
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    message: string;
    element?: unknown;
}
export interface TTFBFix {
    suggestion: string;
    code?: string;
    description?: string;
}
export declare function detectTTFBIssues(profile: ServerProfile): TTFBIssue[];
export declare function generateTTFBFixes(issue: {
    type: string;
    element: Record<string, unknown>;
}): TTFBFix;
export declare function calculateTTFBScore(ms: number): number;
//# sourceMappingURL=ttfb.d.ts.map