# @rankforge-root/ai

AI-powered SEO — meta generation, link suggestions, content analysis, fix generation, and copilot.

## Install
```bash
npm install @rankforge-root/ai
```

## Setup

Works with any LLM via a simple interface:

```ts
import Anthropic from '@anthropic-ai/sdk'

const llm = {
  async complete(prompt) {
    const msg = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 1024,
      messages: [{ role: 'user', content: JSON.stringify(prompt) }],
    })
    return { text: msg.content[0].text }
  },
}
```

## Usage
```ts
import { AIMetaGenerator, AILinkSuggester, AIContentAnalyzer, AIFixGenerator, AICopilot } from '@rankforge-root/ai'

// Generate meta tags
const gen = new AIMetaGenerator(llm)
const title = await gen.generateTitle({ content: articleText, targetKeyword: 'core web vitals', maxLength: 60 })

// Fix code issues
const fixer = new AIFixGenerator(llm)
const fix = await fixer.generateFix({ issue: { type: 'missing-alt', element: '<img src="/hero.jpg"/>' } })
// { before: '...', after: '<img src="/hero.jpg" alt="..." />', description: '...' }

// Ask the copilot
const copilot = new AICopilot(llm)
const response = await copilot.ask('Why is my LCP slow?', { metrics: { lcp: 4200 } })
// { explanation: '...', fixSteps: ['...', '...'] }
```
