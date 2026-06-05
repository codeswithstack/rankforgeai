# @rankforge-root/hydration

SSR/CSR hydration mismatch detection and fix suggestions for React and Next.js.

## Install
```bash
npm install @rankforge-root/hydration
```

## Usage
```ts
import { detectHydrationMismatches, generateHydrationFix, suggestUseEffect, suggestDynamicImport } from '@rankforge-root/hydration'

// Detect mismatches between server and client HTML
const result = detectHydrationMismatches(serverHTML, clientHTML)
// { hasMismatches: true, mismatches: [{ type: 'text-content', serverValue: '...', clientValue: '...' }] }

// Generate fix code
const fix = generateHydrationFix({ type: 'dynamic-date', code: 'new Date().toLocaleDateString()' })
// { type: 'useEffect', code: 'const [value, setValue] = useState(null)...' }

// Suggest dynamic import for client-only components
const code = suggestDynamicImport('MapWidget', './components/MapWidget')
// const MapWidget = dynamic(() => import('./components/MapWidget'), { ssr: false })
```
