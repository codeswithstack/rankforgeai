export interface MetaInput {
    title?: string;
    description?: string;
    url?: string;
    canonical?: string;
    image?: string;
    robots?: string;
    content?: string;
    author?: string;
    keywords?: string[];
}
export interface MetaOutput {
    title?: string;
    description?: string;
    canonical?: string;
    robots: string;
    keywords?: string;
    author?: string;
    og: {
        title?: string;
        description?: string;
        image?: string;
        url?: string;
        type: string;
    };
    twitter: {
        card: string;
        title?: string;
        description?: string;
        image?: string;
    };
}
export interface MetaIssue {
    field: string;
    severity: 'error' | 'warning' | 'info';
    type: string;
    message: string;
}
export interface SERPPreview {
    title: string;
    displayUrl: string;
    snippet: string;
    warnings: Array<{
        type: string;
        message: string;
    }>;
}
export declare function generateMeta(input: MetaInput): MetaOutput;
export declare function validateMeta(input: Partial<MetaInput> & {
    canonical?: string;
}): MetaIssue[];
export declare function truncateTitle(title: string, maxLength: number): string;
export declare function generateSERPPreview(input: {
    title: string;
    description: string;
    url: string;
}): SERPPreview;
//# sourceMappingURL=meta-generator.d.ts.map