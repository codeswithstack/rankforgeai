export interface ImageEntry {
    src: string;
    size?: number;
    width?: number;
    height?: number;
    isAboveFold?: boolean;
    hasPriority?: boolean;
    isLCP?: boolean;
    format?: string;
}
export interface ScriptEntry {
    src: string;
    isAsync?: boolean;
    isDefer?: boolean;
    isInHead?: boolean;
}
export interface StylesheetEntry {
    href: string;
    media?: string;
    hasPreload?: boolean;
}
export interface PageProfile {
    images?: ImageEntry[];
    scripts?: ScriptEntry[];
    stylesheets?: StylesheetEntry[];
    dynamicElements?: unknown[];
}
export interface Issue {
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    message: string;
    element?: unknown;
}
export interface Fix {
    code: string;
    description: string;
    suggestions?: Array<{
        action: string;
        description: string;
    }>;
}
export declare function detectLCPIssues(page: PageProfile): Issue[];
export declare function generateLCPFixes(issue: {
    type: string;
    element: Record<string, unknown>;
}): Fix;
export declare function calculateLCPScore(ms: number): number;
//# sourceMappingURL=lcp.d.ts.map