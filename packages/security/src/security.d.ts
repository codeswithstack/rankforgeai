export interface CloakingResult {
    isCloaking: boolean;
    confidence: number;
    reason?: string;
}
export declare function detectCloaking(botHTML: string, userHTML: string, options?: {
    tolerance?: number;
}): CloakingResult;
export interface PoisoningIssue {
    type: string;
    severity: 'critical' | 'high' | 'medium';
    message: string;
    evidence?: string;
}
export interface PoisoningResult {
    isClean: boolean;
    issues: PoisoningIssue[];
}
export declare function detectSEOPoisoning(html: string | null, options?: {
    pages?: Array<{
        url: string;
        title: string;
        content: string;
    }>;
}): PoisoningResult;
export interface SpamResult {
    hasSpam: boolean;
    spamLinks: string[];
    hasScriptInjection: boolean;
}
export declare function detectSpamInjection(html: string): SpamResult;
export interface MixedContentIssue {
    type: 'image' | 'script' | 'stylesheet' | 'iframe' | 'other';
    url: string;
    severity: 'error' | 'warning';
}
export interface MixedContentResult {
    issues: MixedContentIssue[];
}
export declare function detectMixedContent(html: string, pageUrl: string): MixedContentResult;
export interface RedirectIssue {
    from: string;
    to: string;
    reason: string;
}
export interface RedirectResult {
    suspicious: RedirectIssue[];
}
export declare function detectMaliciousRedirects(redirects: Array<{
    from: string;
    to: string;
    status: number;
}>): RedirectResult;
export interface BotResult {
    isBot: boolean;
    botType?: string;
    botName?: string;
}
export declare function filterBots(userAgent: string): BotResult;
//# sourceMappingURL=security.d.ts.map