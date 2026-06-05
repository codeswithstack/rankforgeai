export interface LLM {
    complete: (prompt: string | Record<string, unknown>) => Promise<{
        text: string;
    }>;
}
export interface TitleInput {
    content: string;
    targetKeyword?: string;
    maxLength?: number;
}
export interface DescInput {
    content: string;
    targetKeyword?: string;
    maxLength?: number;
}
export declare class AIMetaGenerator {
    private llm;
    constructor(llm: LLM);
    generateTitle(input: TitleInput): Promise<string>;
    generateDescription(input: DescInput): Promise<string>;
}
export interface LinkSuggestion {
    url: string;
    anchor: string;
    relevanceScore: number;
}
export interface LinkSuggestInput {
    currentUrl?: string;
    currentContent: string;
    availablePages: Array<{
        url: string;
        title: string;
    }>;
}
export declare class AILinkSuggester {
    private llm;
    constructor(llm: LLM);
    suggestLinks(input: LinkSuggestInput): Promise<LinkSuggestion[]>;
}
export interface KeywordCluster {
    topic: string;
    keywords: string[];
}
export declare class AIContentAnalyzer {
    private llm;
    constructor(llm: LLM);
    clusterKeywords(keywords: string[]): Promise<KeywordCluster[]>;
    findTopicGaps(input: {
        existingContent: string[];
        targetTopic: string;
    }): Promise<string[]>;
}
export interface FixResult {
    before: string;
    after: string;
    description: string;
}
export interface PatchResult {
    diff: string;
    prDescription: string;
}
export declare class AIFixGenerator {
    private llm;
    constructor(llm: LLM);
    generateFix(input: {
        issue: {
            type: string;
            element: string;
        };
        context?: string;
    }): Promise<FixResult>;
    generatePatch(input: {
        file: string;
        issues: Array<{
            type: string;
            line?: number;
        }>;
    }): Promise<PatchResult>;
}
export interface CopilotResponse {
    explanation: string;
    fixSteps: string[];
    component?: string;
    file?: string;
    line?: number;
}
export declare class AICopilot {
    private llm;
    constructor(llm: LLM);
    ask(question: string, context?: Record<string, unknown>): Promise<CopilotResponse>;
}
//# sourceMappingURL=ai.d.ts.map