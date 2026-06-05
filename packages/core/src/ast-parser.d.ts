export interface ASTIssue {
    type: string;
    message: string;
    line?: number;
    column?: number;
    severity: 'error' | 'warning' | 'info';
}
export interface ASTOptions {
    framework?: 'nextjs' | 'nuxt' | 'sveltekit' | 'react';
}
export interface AnalyzeContext {
    aboveFoldComponents?: string[];
}
export interface MetaTagResult {
    title?: string;
    description?: string;
    isDynamic?: boolean;
    openGraph?: Record<string, string>;
}
export declare class ASTParser {
    private options;
    constructor(options?: ASTOptions);
    analyze(code: string, context?: AnalyzeContext): ASTIssue[];
}
export declare function extractReactMetaTags(code: string): MetaTagResult | null;
export interface ImagePropIssue {
    type: 'missing-alt' | 'missing-dimensions' | 'use-next-image';
    message: string;
    line?: number;
    src?: string;
}
export declare function detectMissingImageProps(code: string): ImagePropIssue[];
//# sourceMappingURL=ast-parser.d.ts.map