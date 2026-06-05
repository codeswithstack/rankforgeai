# @rankforge/performance

Core Web Vitals detection and scoring — LCP, CLS, INP, and TTFB.

## Install
```bash
npm install @rankforge/performance
```

## Usage
```ts
import {
  detectLCPIssues, calculateLCPScore,
  detectCLSIssues, calculateCLSScore,
  detectINPIssues, calculateINPScore,
  detectTTFBIssues, calculateTTFBScore,
} from '@rankforge/performance'

// Detect issues
const lcpIssues = detectLCPIssues({
  images: [{ src: '/hero.jpg', isAboveFold: true, hasPriority: false, size: 2_500_000 }],
})

// Score (0–100)
calculateLCPScore(1200)   // 100 (good)
calculateLCPScore(3000)   // ~65 (needs improvement)
calculateLCPScore(5000)   // 25  (poor)

calculateCLSScore(0)      // 100
calculateINPScore(150)    // 100
calculateTTFBScore(80)    // 100
```
