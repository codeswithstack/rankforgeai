export interface TaskEntry {
  duration: number
  type?: string
  source?: string
  isComponent?: boolean
}

export interface EventListenerEntry {
  event: string
  isThrottled?: boolean
  isPassive?: boolean
  duration?: number
  handler?: string
}

export interface RerenderEntry {
  component: string
  count?: number
  avgDuration?: number
}

export interface INPProfile {
  tasks?: TaskEntry[]
  eventListeners?: EventListenerEntry[]
  rerenders?: RerenderEntry[]
}

export interface INPIssue {
  type: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  message: string
  element?: unknown
}

export interface INPFix {
  code: string
  description: string
}

const LONG_TASK_THRESHOLD = 50 // ms
const EXCESSIVE_RERENDER_COUNT = 10

export function detectINPIssues(profile: INPProfile): INPIssue[] {
  const issues: INPIssue[] = []

  for (const task of profile.tasks || []) {
    if (task.duration >= LONG_TASK_THRESHOLD) {
      issues.push({
        type: 'long-task',
        severity: task.duration > 200 ? 'critical' : 'high',
        message: `Long task detected: ${task.duration}ms (source: ${task.source || 'unknown'})`,
        element: task,
      })
    }
  }

  for (const listener of profile.eventListeners || []) {
    if (!listener.isThrottled && !listener.isPassive && listener.duration && listener.duration > 100) {
      issues.push({
        type: 'blocking-listener',
        severity: 'high',
        message: `Unthrottled ${listener.event} listener blocking main thread (${listener.duration}ms)`,
        element: listener,
      })
    }
  }

  for (const rerender of profile.rerenders || []) {
    if ((rerender.count || 0) > EXCESSIVE_RERENDER_COUNT) {
      issues.push({
        type: 'excessive-rerenders',
        severity: 'medium',
        message: `${rerender.component} re-renders ${rerender.count} times (avg ${rerender.avgDuration}ms each)`,
        element: rerender,
      })
    }
  }

  return issues
}

export function generateINPFixes(issue: { type: string; element: Record<string, unknown> }): INPFix {
  if (issue.type === 'excessive-rerenders') {
    const component = issue.element.component as string
    return {
      code: `const ${component} = React.memo(function ${component}(props) {\n  // component body\n})`,
      description: `Wrap ${component} with React.memo to prevent unnecessary rerenders`,
    }
  }
  if (issue.type === 'blocking-listener') {
    const event = issue.element.event as string
    if (event === 'scroll') {
      return {
        code: `window.addEventListener('scroll', throttle(onScroll, 100), { passive: true })`,
        description: 'Add throttle and passive flag to scroll listener',
      }
    }
    return {
      code: `element.addEventListener('${event}', throttle(handler, 100), { passive: true })`,
      description: 'Throttle event listener and mark as passive',
    }
  }
  if (issue.type === 'long-task') {
    const source = issue.element.source as string
    return {
      code: `const ${source} = dynamic(() => import('./${source}'), { loading: () => <Skeleton /> })`,
      description: `Lazy load ${source} with dynamic import to reduce main thread work`,
    }
  }
  return { code: '', description: 'Unknown issue type' }
}

export function calculateINPScore(ms: number): number {
  if (ms <= 200) return 100
  if (ms <= 500) return Math.round(100 - ((ms - 200) / 300) * 10) // 200→100, 500→90
  if (ms <= 1000) return Math.round(49 - ((ms - 500) / 500) * 49) // 500→49, 1000→0
  return 0
}
