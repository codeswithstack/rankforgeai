export interface TaskEntry {
    duration: number;
    type?: string;
    source?: string;
    isComponent?: boolean;
}
export interface EventListenerEntry {
    event: string;
    isThrottled?: boolean;
    isPassive?: boolean;
    duration?: number;
    handler?: string;
}
export interface RerenderEntry {
    component: string;
    count?: number;
    avgDuration?: number;
}
export interface INPProfile {
    tasks?: TaskEntry[];
    eventListeners?: EventListenerEntry[];
    rerenders?: RerenderEntry[];
}
export interface INPIssue {
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    message: string;
    element?: unknown;
}
export interface INPFix {
    code: string;
    description: string;
}
export declare function detectINPIssues(profile: INPProfile): INPIssue[];
export declare function generateINPFixes(issue: {
    type: string;
    element: Record<string, unknown>;
}): INPFix;
export declare function calculateINPScore(ms: number): number;
//# sourceMappingURL=inp.d.ts.map