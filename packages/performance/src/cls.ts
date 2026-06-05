export interface CLSImageEntry {
  src: string
  hasWidth?: boolean
  hasHeight?: boolean
  naturalWidth?: number
  naturalHeight?: number
}

export interface FontEntry {
  family: string
  display?: string
  hasPreload?: boolean
  src?: string
}

export interface IframeEntry {
  src: string
  hasAspectRatio?: boolean
}

export interface CLSPageProfile {
  images?: CLSImageEntry[]
  fonts?: FontEntry[]
  dynamicElements?: Array<{ position?: string; insertedAfterLoad?: boolean; selector?: string; estimatedHeight?: number }>
  iframes?: IframeEntry[]
  ads?: unknown[]
}

export interface CLSIssue {
  type: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  message: string
  element?: string
  src?: string
}

export interface CLSFix {
  code: string
  description: string
}

export function detectCLSIssues(page: CLSPageProfile): CLSIssue[] {
  const issues: CLSIssue[] = []

  for (const img of page.images || []) {
    if (!img.hasWidth || !img.hasHeight) {
      issues.push({
        type: 'missing-dimensions',
        severity: 'high',
        message: `Image ${img.src} is missing width/height (causes layout shift)`,
        element: 'img',
        src: img.src,
      })
    }
  }

  for (const font of page.fonts || []) {
    if (font.display === 'swap' && !font.hasPreload) {
      issues.push({
        type: 'font-swap-shift',
        severity: 'medium',
        message: `Font ${font.family} uses font-display:swap without preload — causes FOUT layout shift`,
      })
    }
  }

  for (const el of page.dynamicElements || []) {
    if (el.insertedAfterLoad && el.position === 'top') {
      issues.push({
        type: 'dynamic-insertion',
        severity: 'high',
        message: 'Dynamic content inserted above viewport after load causes CLS',
        element: el.selector,
      })
    }
  }

  for (const iframe of page.iframes || []) {
    if (!iframe.hasAspectRatio) {
      issues.push({
        type: 'missing-aspect-ratio',
        severity: 'medium',
        message: `iframe ${iframe.src} has no aspect-ratio — causes layout shift while loading`,
      })
    }
  }

  return issues
}

export function generateCLSFixes(issue: { type: string; element: Record<string, unknown> }): CLSFix {
  if (issue.type === 'missing-dimensions') {
    const w = issue.element.naturalWidth || 800
    const h = issue.element.naturalHeight || 600
    return {
      code: `<img src="${issue.element.src}" alt="${issue.element.alt || ''}" width={${w}} height={${h}} />`,
      description: `Add width=${w} height=${h} to prevent layout shift`,
    }
  }
  if (issue.type === 'dynamic-insertion') {
    const h = issue.element.estimatedHeight || 80
    return {
      code: `.banner { min-height: ${h}px; }`,
      description: 'Reserve layout space to prevent shift when content loads',
    }
  }
  if (issue.type === 'font-swap-shift') {
    const src = issue.element.src as string || '/fonts/font.woff2'
    return {
      code: `<link rel="preload" href="${src}" as="font" type="font/woff2" crossOrigin="anonymous"/>`,
      description: 'Preload font to eliminate FOUT layout shift',
    }
  }
  return { code: '', description: 'Unknown issue type' }
}

export function calculateCLSScore(cls: number): number {
  if (cls === 0) return 100
  if (cls < 0.1) return Math.round(100 - (cls / 0.1) * 5)
  if (cls < 0.25) return Math.round(95 - ((cls - 0.1) / 0.15) * 45)
  return Math.round(50 - ((cls - 0.25) / 0.25) * 50)
}
