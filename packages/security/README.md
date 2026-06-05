# @rankforge/security

SEO security toolkit — cloaking detection, spam injection, poisoning, and bot filtering.

## Install
```bash
npm install @rankforge/security
```

## Usage
```ts
import { detectCloaking, detectSEOPoisoning, detectSpamInjection, filterBots, detectMixedContent } from '@rankforge/security'

// Cloaking: different content for bots vs users
const result = detectCloaking(botHTML, userHTML)
// { isCloaking: true, confidence: 0.85, reason: 'Content similarity is only 15%' }

// SEO poisoning: keyword stuffing, hidden text
const poisoning = detectSEOPoisoning(html)
// { isClean: false, issues: [{ type: 'keyword-stuffing', severity: 'high' }] }

// Spam injection (hacked sites)
const spam = detectSpamInjection(html)
// { hasSpam: true, spamLinks: [...], hasScriptInjection: false }

// Bot detection for middleware
const bot = filterBots(request.headers['user-agent'])
// { isBot: true, botType: 'googlebot', botName: 'Googlebot' }
```
