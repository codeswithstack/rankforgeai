export type MismatchType = 'text-content' | 'attribute' | 'missing-node' | 'extra-node';
export interface HydrationMismatch {
    type: MismatchType;
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
export interface LocaleMismatch {
    type: string;
    fix: string;
    serverValue?: string;
    clientValue?: string;
}
export interface DateMismatch {
    type: string;
    fix?: string;
    serverDate?: string;
    clientDate?: string;
}
export interface HydrationFix {
    code: string;
    description: string;
    type: string;
}
export declare function detectHydrationMismatches(serverHTML: string, clientHTML: string): HydrationResult;
export declare function analyzeLocaleMismatch(input: {
    server: string;
    client: string;
    context?: string;
}): LocaleMismatch;
export declare function analyzeDateMismatch(input: {
    server: string;
    client: string;
    timezone?: string;
    context?: string;
}): DateMismatch;
export declare function generateHydrationFix(input: {
    type: string;
    component?: string;
    code?: string;
    importPath?: string;
}): HydrationFix;
export declare function suggestUseEffect(originalCode: string, variableName: string): string;
export declare function suggestDynamicImport(componentName: string, importPath: string): string;
//# sourceMappingURL=hydration.d.ts.map