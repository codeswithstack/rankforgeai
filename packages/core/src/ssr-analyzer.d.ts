export type Framework = 'nextjs' | 'nuxt' | 'sveltekit' | 'react' | 'unknown';
export interface SSRAnalysisResult {
    isSSR: boolean;
    hasContent: boolean;
    framework: Framework;
}
export interface HydrationMismatch {
    type: 'text-content' | 'attribute' | 'missing-node' | 'extra-node';
    serverValue?: string;
    clientValue?: string;
    attribute?: string;
    component?: string;
    selector?: string;
}
export interface HydrationResult {
    hasMismatches: boolean;
    mismatches: HydrationMismatch[];
}
export declare function analyzeSSR(html: string): SSRAnalysisResult;
export declare class SSRAnalyzer {
    findHydrationMismatches(serverHTML: string, clientHTML: string): HydrationMismatch[];
    extractNextJsRoutes(files: string[]): string[];
    extractAppRouterRoutes(files: string[]): string[];
}
//# sourceMappingURL=ssr-analyzer.d.ts.map