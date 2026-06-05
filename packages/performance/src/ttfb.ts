export interface DBQuery {
  sql: string
  duration: number
  hasIndex?: boolean
}

export interface ServerProfile {
  ttfb: number
  dbQueryTime?: number
  middlewareTime?: number
  cacheHit?: boolean
  queries?: DBQuery[]
  route?: string
  region?: string
}

export interface TTFBIssue {
  type: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  message: string
  element?: unknown
}

export interface TTFBFix {
  suggestion: string
  code?: string
  description?: string
}

const SLOW_TTFB = 600
const SLOW_DB = 300
const SLOW_MIDDLEWARE = 200

export function detectTTFBIssues(profile: ServerProfile): TTFBIssue[] {
  const issues: TTFBIssue[] = []

  if (profile.ttfb > SLOW_TTFB) {
    issues.push({
      type: 'slow-ttfb',
      severity: profile.ttfb > 1500 ? 'critical' : 'high',
      message: `TTFB is ${profile.ttfb}ms (target: < 600ms)`,
      element: { route: profile.route },
    })
  }

  if (!profile.cacheHit) {
    issues.push({
      type: 'cache-miss',
      severity: 'high',
      message: 'Response not served from cache — add caching layer',
      element: { route: profile.route },
    })
  }

  if (profile.dbQueryTime && profile.dbQueryTime > SLOW_DB) {
    issues.push({
      type: 'slow-db-query',
      severity: 'high',
      message: `DB queries took ${profile.dbQueryTime}ms`,
      element: profile.queries?.[0],
    })
  }

  if (profile.middlewareTime && profile.middlewareTime > SLOW_MIDDLEWARE) {
    issues.push({
      type: 'middleware-bottleneck',
      severity: 'medium',
      message: `Middleware took ${profile.middlewareTime}ms`,
    })
  }

  return issues
}

export function generateTTFBFixes(issue: { type: string; element: Record<string, unknown> }): TTFBFix {
  if (issue.type === 'cache-miss') {
    return {
      suggestion: 'Add Redis cache layer for this route',
      code: `await redis.set('${issue.element.route}', JSON.stringify(data), 'EX', 3600)`,
      description: 'Cache API response in Redis with 1hr TTL',
    }
  }
  if (issue.type === 'slow-ttfb') {
    return {
      suggestion: 'Use edge rendering to serve from CDN closest to user',
      code: `export const runtime = 'edge'`,
      description: 'Deploy this route to the edge for sub-100ms TTFB globally',
    }
  }
  if (issue.type === 'slow-db-query') {
    return {
      suggestion: 'Add a database index on the queried column',
      code: `CREATE INDEX idx_${issue.element.table}_${issue.element.column} ON ${issue.element.table}(${issue.element.column})`,
      description: 'Index will reduce query time from O(n) to O(log n)',
    }
  }
  return { suggestion: 'Profile server-side code to find bottleneck' }
}

export function calculateTTFBScore(ms: number): number {
  if (ms <= 100) return 100
  if (ms <= 300) return Math.round(100 - ((ms - 100) / 200) * 10)
  if (ms <= 800) return Math.round(90 - ((ms - 300) / 500) * 40)
  if (ms <= 1800) return Math.round(50 - ((ms - 800) / 1000) * 50)
  return 0
}
