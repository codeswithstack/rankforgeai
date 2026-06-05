export class AIMetaGenerator {
    llm;
    constructor(llm) {
        this.llm = llm;
    }
    async generateTitle(input) {
        const max = input.maxLength ?? 60;
        let attempt = 0;
        while (attempt < 3) {
            const res = await this.llm.complete({
                task: 'generate-title',
                content: input.content,
                keyword: input.targetKeyword,
                maxLength: max,
            });
            const title = res.text.trim();
            if (title.length <= max)
                return title;
            attempt++;
        }
        return '';
    }
    async generateDescription(input) {
        const max = input.maxLength ?? 160;
        const res = await this.llm.complete({
            task: 'generate-description',
            content: input.content,
            keyword: input.targetKeyword,
            maxLength: max,
        });
        return res.text.trim().slice(0, max);
    }
}
export class AILinkSuggester {
    llm;
    constructor(llm) {
        this.llm = llm;
    }
    async suggestLinks(input) {
        const pages = input.availablePages.filter(p => p.url !== input.currentUrl);
        const res = await this.llm.complete({
            task: 'suggest-links',
            content: input.currentContent,
            pages,
        });
        try {
            const parsed = JSON.parse(res.text);
            const suggestions = Array.isArray(parsed) ? parsed : [];
            return suggestions.filter(s => s.url !== input.currentUrl);
        }
        catch {
            return [];
        }
    }
}
export class AIContentAnalyzer {
    llm;
    constructor(llm) {
        this.llm = llm;
    }
    async clusterKeywords(keywords) {
        const res = await this.llm.complete({ task: 'cluster-keywords', keywords });
        try {
            const parsed = JSON.parse(res.text);
            return parsed.clusters ?? [];
        }
        catch {
            return [];
        }
    }
    async findTopicGaps(input) {
        const res = await this.llm.complete({
            task: 'find-gaps',
            existing: input.existingContent,
            target: input.targetTopic,
        });
        try {
            const parsed = JSON.parse(res.text);
            return parsed.gaps ?? [];
        }
        catch {
            return [];
        }
    }
}
export class AIFixGenerator {
    llm;
    constructor(llm) {
        this.llm = llm;
    }
    async generateFix(input) {
        const res = await this.llm.complete({
            task: 'generate-fix',
            issue: input.issue,
            context: input.context,
        });
        const fixedCode = res.text.trim();
        let after = fixedCode;
        if (input.issue.type === 'missing-alt') {
            after = input.issue.element.replace(/(\s*\/?>)$/, ` alt="${fixedCode}" />`);
        }
        return {
            before: input.issue.element,
            after,
            description: `AI-generated fix for ${input.issue.type}`,
        };
    }
    async generatePatch(input) {
        const res = await this.llm.complete({
            task: 'generate-patch',
            file: input.file,
            issues: input.issues,
        });
        return {
            diff: `--- a/${input.file}\n+++ b/${input.file}\n${res.text}`,
            prDescription: `Fix ${input.issues.length} issue(s) in ${input.file}: ${input.issues.map(i => i.type).join(', ')}`,
        };
    }
}
export class AICopilot {
    llm;
    constructor(llm) {
        this.llm = llm;
    }
    async ask(question, context = {}) {
        const res = await this.llm.complete({ task: 'copilot', question, context });
        // Try to parse structured response
        try {
            const parsed = JSON.parse(res.text);
            return {
                explanation: parsed.explanation ?? res.text,
                fixSteps: parsed.fixSteps ?? [],
                component: parsed.component,
                file: parsed.file,
                line: parsed.line,
            };
        }
        catch {
            return {
                explanation: res.text,
                fixSteps: extractSteps(res.text),
            };
        }
    }
}
function extractSteps(text) {
    const lines = text
        .split('\n')
        .filter(l => /^\d+\.|^-|^\*/.test(l.trim()))
        .map(l => l.replace(/^[\d.*-]+\s*/, '').trim())
        .filter(Boolean);
    if (lines.length > 0)
        return lines;
    return text.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
}
//# sourceMappingURL=ai.js.map