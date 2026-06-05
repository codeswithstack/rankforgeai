# @rankforge/cli

Command-line interface for RankForge AI.

## Install
```bash
npm install -g @rankforge/cli
```

## Commands

```bash
# Initialize in your project
rankforge init

# Audit a URL
rankforge audit --url https://example.com

# Audit with minimum score gate (exits 1 if below threshold)
rankforge audit --url https://example.com --min-score 80

# Audit only SEO
rankforge audit --url https://example.com --only seo

# Save JSON report
rankforge audit --url https://example.com --json --output report.json

# Preview fixes without applying
rankforge fix --dry-run

# Apply fixes with backup
rankforge fix --backup

# Generate sitemap
rankforge sitemap --output public/sitemap.xml

# Validate schema markup
rankforge schema --validate --url https://example.com

# Start monitoring daemon
rankforge monitor --interval 300
```

## Programmatic API

```ts
import { RankForgeCLI, MockFileSystem } from '@rankforge/cli'

const cli = new RankForgeCLI()
await cli.run(['audit', '--url', 'https://example.com', '--json'])
```
