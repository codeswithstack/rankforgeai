export interface MetaInput {
  title?: string
  description?: string
  url?: string
  canonical?: string
  image?: string
  robots?: string
  content?: string
  author?: string
  keywords?: string[]
}

export interface MetaOutput {
  title?: string
  description?: string
  canonical?: string
  robots: string
  keywords?: string
  author?: string
  og: { title?: string; description?: string; image?: string; url?: string; type: string }
  twitter: { card: string; title?: string; description?: string; image?: string }
}

export interface MetaIssue {
  field: string
  severity: 'error' | 'warning' | 'info'
  type: string
  message: string
}

export interface SERPPreview {
  title: string
  displayUrl: string
  snippet: string
  warnings: Array<{ type: string; message: string }>
}

export function generateMeta(input: MetaInput): MetaOutput {
  const description = input.description || (input.content ? autoDescription(input.content) : undefined)

  return {
    title: input.title,
    description,
    canonical: input.canonical || input.url,
    robots: input.robots || 'index,follow',
    keywords: input.keywords?.join(', '),
    author: input.author,
    og: {
      title: input.title,
      description,
      image: input.image,
      url: input.url,
      type: 'website',
    },
    twitter: {
      card: input.image ? 'summary_large_image' : 'summary',
      title: input.title,
      description,
      image: input.image,
    },
  }
}

function autoDescription(content: string): string {
  const clean = content.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
  const sentences = clean.match(/[^.!?]+[.!?]+/g) || []
  let desc = ''
  for (const s of sentences) {
    if ((desc + s).length <= 160) desc += s
    else break
  }
  return desc.trim() || clean.slice(0, 155) + '...'
}

export function validateMeta(input: Partial<MetaInput> & { canonical?: string }): MetaIssue[] {
  const issues: MetaIssue[] = []

  if (!input.title) {
    issues.push({ field: 'title', severity: 'error', type: 'missing', message: 'Title tag is required' })
  } else {
    if (input.title.length > 60) {
      issues.push({ field: 'title', severity: 'warning', type: 'too-long', message: `Title is ${input.title.length} chars, max 60` })
    }
    if (input.title.length < 10) {
      issues.push({ field: 'title', severity: 'warning', type: 'too-short', message: `Title is too short (${input.title.length} chars)` })
    }
  }

  if (!input.description) {
    issues.push({ field: 'description', severity: 'warning', type: 'missing', message: 'Meta description is recommended' })
  } else {
    if (input.description.length > 160) {
      issues.push({ field: 'description', severity: 'warning', type: 'too-long', message: `Description is ${input.description.length} chars, max 160` })
    }
    if (input.description.length < 50) {
      issues.push({ field: 'description', severity: 'warning', type: 'too-short', message: `Description is too short (${input.description.length} chars)` })
    }
  }

  if (!input.url && !input.canonical) {
    issues.push({ field: 'canonical', severity: 'warning', type: 'missing', message: 'Canonical URL is recommended' })
  }

  if (!input.image) {
    issues.push({ field: 'og:image', severity: 'warning', type: 'missing', message: 'og:image is recommended for social sharing' })
  }

  return issues
}

export function truncateTitle(title: string, maxLength: number): string {
  if (title.length <= maxLength) return title
  const ellipsis = '...'
  const limit = maxLength - ellipsis.length
  const truncated = title.slice(0, limit)
  const lastSpace = truncated.lastIndexOf(' ')
  if (lastSpace > limit * 0.7) {
    // keep the trailing space so ellipsis doesn't immediately follow a word char
    return truncated.slice(0, lastSpace + 1) + ellipsis
  }
  return truncated + ellipsis
}

export function generateSERPPreview(input: { title: string; description: string; url: string }): SERPPreview {
  const warnings: Array<{ type: string; message: string }> = []
  const url = new URL(input.url)
  const path = url.pathname.slice(1).replace(/\//g, ' › ')
  const displayUrl = path ? `${url.hostname} › ${path}` : url.hostname

  if (input.title.length > 60) {
    warnings.push({ type: 'title-truncation', message: `Title may be truncated in SERP (${input.title.length} chars)` })
  }
  if (input.description.length > 160) {
    warnings.push({ type: 'description-truncation', message: `Description may be truncated (${input.description.length} chars)` })
  }

  return {
    title: input.title,
    displayUrl,
    snippet: input.description.slice(0, 160),
    warnings,
  }
}
