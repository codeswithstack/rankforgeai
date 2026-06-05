export interface LLM {
  complete: (prompt: string | Record<string, unknown>) => Promise<{ text: string }>
}

// ─── AI Meta Generator ────────────────────────────────────────────────────────
export interface TitleInput { content: string; targetKeyword?: string; maxLength?: number }
export interface DescInput { content: string; targetKeyword?: string; maxLength?: number }

export class AIMetaGenerator {
  constructor(private llm: LLM) {}

  async generateTitle(input: TitleInput): Promise<string> {
    const max = input.maxLength ?? 60
    let attempt = 0
    while (attempt < 3) {
      const res = await this.llm.complete({
        task: 'generate-title',
        content: input.content,
        keyword: input.targetKeyword,
        maxLength: max,
      })
      const title = res.text.trim()
      if (title.length <= max) return title
      attempt++
    }
    return ''
  }

  async generateDescription(input: DescInput): Promise<string> {
    const max = input.maxLength ?? 160
    const res = await this.llm.complete({
      task: 'generate-description',
      content: input.content,
      keyword: input.targetKeyword,
      maxLength: max,
    })
    return res.text.trim().slice(0, max)
  }
}

// ─── AI Link Suggester ────────────────────────────────────────────────────────
export interface LinkSuggestion {
  url: string
  anchor: string
  relevanceScore: number
}

export interface LinkSuggestInput {
  currentUrl?: string
  currentContent: string
  availablePages: Array<{ url: string; title: string }>
}

export class AILinkSuggester {
  constructor(private llm: LLM) {}

  async suggestLinks(input: LinkSuggestInput): Promise<LinkSuggestion[]> {
    const pages = input.availablePages.filter(p => p.url !== input.currentUrl)
    const res = await this.llm.complete({
      task: 'suggest-links',
      content: input.currentContent,
      pages,
    })
    try {
      const parsed = JSON.parse(res.text)
      const suggestions: LinkSuggestion[] = Array.isArray(parsed) ? parsed : []
      return suggestions.filter(s => s.url !== input.currentUrl)
    } catch {
      return []
    }
  }
}

// ─── AI Content Analyzer ─────────────────────────────────────────────────────
export interface KeywordCluster {
  topic: string
  keywords: string[]
}

export class AIContentAnalyzer {
  constructor(private llm: LLM) {}

  async clusterKeywords(keywords: string[]): Promise<KeywordCluster[]> {
    const res = await this.llm.complete({ task: 'cluster-keywords', keywords })
    try {
      const parsed = JSON.parse(res.text)
      return parsed.clusters ?? []
    } catch {
      return []
    }
  }

  async findTopicGaps(input: { existingContent: string[]; targetTopic: string }): Promise<string[]> {
    const res = await this.llm.complete({
      task: 'find-gaps',
      existing: input.existingContent,
      target: input.targetTopic,
    })
    try {
      const parsed = JSON.parse(res.text)
      return parsed.gaps ?? []
    } catch {
      return []
    }
  }
}

// ─── AI Fix Generator ─────────────────────────────────────────────────────────
export interface FixResult {
  before: string
  after: string
  description: string
}

export interface PatchResult {
  diff: string
  prDescription: string
}

export class AIFixGenerator {
  constructor(private llm: LLM) {}

  async generateFix(input: {
    issue: { type: string; element: string }
    context?: string
  }): Promise<FixResult> {
    const res = await this.llm.complete({
      task: 'generate-fix',
      issue: input.issue,
      context: input.context,
    })
    const fixedCode = res.text.trim()
    let after = fixedCode
    if (input.issue.type === 'missing-alt') {
      after = input.issue.element.replace(/(\s*\/?>)$/, ` alt="${fixedCode}" />`)
    }
    return {
      before: input.issue.element,
      after,
      description: `AI-generated fix for ${input.issue.type}`,
    }
  }

  async generatePatch(input: {
    file: string
    issues: Array<{ type: string; line?: number }>
  }): Promise<PatchResult> {
    const res = await this.llm.complete({
      task: 'generate-patch',
      file: input.file,
      issues: input.issues,
    })
    return {
      diff: `--- a/${input.file}\n+++ b/${input.file}\n${res.text}`,
      prDescription: `Fix ${input.issues.length} issue(s) in ${input.file}: ${input.issues.map(i => i.type).join(', ')}`,
    }
  }
}

// ─── AI Copilot ───────────────────────────────────────────────────────────────
export interface CopilotResponse {
  explanation: string
  fixSteps: string[]
  component?: string
  file?: string
  line?: number
}

export class AICopilot {
  constructor(private llm: LLM) {}

  async ask(question: string, context: Record<string, unknown> = {}): Promise<CopilotResponse> {
    const res = await this.llm.complete({ task: 'copilot', question, context })

    // Try to parse structured response
    try {
      const parsed = JSON.parse(res.text)
      return {
        explanation: parsed.explanation ?? res.text,
        fixSteps: parsed.fixSteps ?? [],
        component: parsed.component,
        file: parsed.file,
        line: parsed.line,
      }
    } catch {
      return {
        explanation: res.text,
        fixSteps: extractSteps(res.text),
      }
    }
  }
}

function extractSteps(text: string): string[] {
  const lines = text
    .split('\n')
    .filter(l => /^\d+\.|^-|^\*/.test(l.trim()))
    .map(l => l.replace(/^[\d.*-]+\s*/, '').trim())
    .filter(Boolean)
  if (lines.length > 0) return lines
  return text.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean)
}
