export interface ImageEntry {
    src: string;
    alt?: string;
    isDecorative?: boolean;
    fileSizeBytes?: number;
    width?: number;
    height?: number;
    hasWidth?: boolean;
    hasHeight?: boolean;
    format?: string;
}
export interface ImageIssue {
    type: string;
    severity: 'error' | 'warning' | 'info';
    message: string;
    src?: string;
}
export interface ImageFix {
    code: string;
    description: string;
    suggestions?: Array<{
        action: string;
        description: string;
    }>;
}
export interface ConvertOptions {
    quality?: number;
}
type AIFn = (input: unknown) => Promise<{
    text: string;
} | string>;
export declare function detectImageIssues(images: ImageEntry[]): ImageIssue[];
export declare function generateAltText(input: {
    src: string;
    context?: string;
}, ai: AIFn): Promise<string>;
export declare function generateImageFix(input: {
    originalCode: string;
    width?: number;
    height?: number;
    isAboveFold?: boolean;
    currentFormat?: string;
    alt?: string;
}): ImageFix;
export declare function convertToWebP(buffer: Buffer, options?: ConvertOptions): Promise<Buffer>;
export declare function convertToAVIF(buffer: Buffer, options?: ConvertOptions): Promise<Buffer>;
export declare function generateResponsiveSizes(originalWidth: number): number[];
export {};
//# sourceMappingURL=images.d.ts.map