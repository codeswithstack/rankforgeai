export interface CLSImageEntry {
    src: string;
    hasWidth?: boolean;
    hasHeight?: boolean;
    naturalWidth?: number;
    naturalHeight?: number;
}
export interface FontEntry {
    family: string;
    display?: string;
    hasPreload?: boolean;
    src?: string;
}
export interface IframeEntry {
    src: string;
    hasAspectRatio?: boolean;
}
export interface CLSPageProfile {
    images?: CLSImageEntry[];
    fonts?: FontEntry[];
    dynamicElements?: Array<{
        position?: string;
        insertedAfterLoad?: boolean;
        selector?: string;
        estimatedHeight?: number;
    }>;
    iframes?: IframeEntry[];
    ads?: unknown[];
}
export interface CLSIssue {
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    message: string;
    element?: string;
    src?: string;
}
export interface CLSFix {
    code: string;
    description: string;
}
export declare function detectCLSIssues(page: CLSPageProfile): CLSIssue[];
export declare function generateCLSFixes(issue: {
    type: string;
    element: Record<string, unknown>;
}): CLSFix;
export declare function calculateCLSScore(cls: number): number;
//# sourceMappingURL=cls.d.ts.map