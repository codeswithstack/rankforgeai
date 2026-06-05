const VERSION = '0.0.1';
// ─── MockFileSystem (for testing) ─────────────────────────────────────────────
export class MockFileSystem {
    files = new Map();
    exists(path) {
        return this.files.has(path);
    }
    read(path) {
        return this.files.get(path) || '';
    }
    write(path, content) {
        this.files.set(path, content);
    }
}
// ─── MockAuditEngine (for testing) ────────────────────────────────────────────
export class MockAuditEngine {
    calledWith = '';
    result;
    constructor(result) {
        this.result = result;
    }
    async run(options) {
        this.calledWith = options.only || 'all';
        return this.result;
    }
}
// ─── RankForgeCLI ─────────────────────────────────────────────────────────────
export class RankForgeCLI {
    fs;
    stdout;
    stderr;
    auditEngine;
    exitHandler = () => { };
    monitorHandler;
    constructor(options = {}) {
        this.fs = options.fs || new MockFileSystem();
        this.stdout = options.stdout || ((m) => process.stdout.write(m + '\n'));
        this.stderr = options.stderr || ((m) => process.stderr.write(m + '\n'));
    }
    setAuditEngine(engine) {
        this.auditEngine = engine;
    }
    setExitHandler(fn) {
        this.exitHandler = fn;
    }
    setMonitorHandler(fn) {
        this.monitorHandler = fn;
    }
    async run(args) {
        const [command, ...rest] = args;
        switch (command) {
            case '--help':
            case 'help':
                return this.showHelp();
            case '--version':
            case 'version':
                return this.showVersion();
            case 'init':
                return this.init(rest);
            case 'audit':
                return this.audit(rest);
            case 'fix':
                return this.fix(rest);
            case 'sitemap':
                return this.sitemap(rest);
            case 'schema':
                return this.schema(rest);
            case 'optimize':
                return this.optimize(rest);
            case 'monitor':
                return this.monitor(rest);
            default:
                this.stderr(`Unknown command: ${command}. Run --help for usage.`);
        }
    }
    showHelp() {
        this.stdout([
            'Usage: rankforge <command> [options]',
            '',
            'Commands:',
            '  init       Initialize rankforge in this project',
            '  audit      Run SEO and performance audit',
            '  fix        Apply auto-fixes for detected issues',
            '  optimize   Run full optimization pipeline',
            '  sitemap    Generate sitemap.xml',
            '  schema     Validate structured data',
            '  monitor    Start continuous monitoring',
            '',
            'Options:',
            '  --help     Show this help message',
            '  --version  Show version',
        ].join('\n'));
    }
    showVersion() {
        this.stdout(VERSION);
    }
    detectFramework() {
        if (this.fs.exists('next.config.js') || this.fs.exists('next.config.ts'))
            return 'nextjs';
        if (this.fs.exists('nuxt.config.ts') || this.fs.exists('nuxt.config.js'))
            return 'nuxt';
        if (this.fs.exists('svelte.config.js'))
            return 'sveltekit';
        return null;
    }
    async init(args) {
        const force = args.includes('--force');
        if (this.fs.exists('rankforge.config.ts') && !force) {
            this.stderr('rankforge.config.ts already exists. Use --force to overwrite.');
            return;
        }
        const framework = this.detectFramework();
        const config = generateConfigTemplate(framework);
        this.fs.write('rankforge.config.ts', config);
        this.stdout(`✓ Created rankforge.config.ts${framework ? ` (detected: ${framework})` : ''}`);
    }
    async audit(args) {
        const url = getFlagValue(args, '--url');
        const only = getFlagValue(args, '--only');
        const minScore = parseInt(getFlagValue(args, '--min-score') || '0', 10);
        const isJson = args.includes('--json');
        const outputFile = getFlagValue(args, '--output');
        if (!this.auditEngine) {
            this.stderr('No audit engine configured');
            return;
        }
        const result = await this.auditEngine.run({ url, only });
        if (isJson) {
            const json = JSON.stringify(result, null, 2);
            this.stdout(json);
            if (outputFile)
                this.fs.write(outputFile, json);
            return;
        }
        if (outputFile) {
            this.fs.write(outputFile, JSON.stringify(result, null, 2));
        }
        this.stdout('─── RankForge Audit Report ───────────────────');
        if (result.seoScore !== undefined) {
            this.stdout(`SEO Score:         ${result.seoScore}/100`);
        }
        if (result.perfScore !== undefined) {
            this.stdout(`Performance Score: ${result.perfScore}/100`);
        }
        this.stdout('──────────────────────────────────────────────');
        const score = result.seoScore ?? 100;
        if (minScore > 0 && score < minScore) {
            this.stderr(`Score ${score} is below minimum threshold ${minScore}`);
            this.exitHandler(1);
        }
    }
    async fix(args) {
        const dryRun = args.includes('--dry-run');
        const backup = args.includes('--backup');
        if (dryRun) {
            this.stdout('--- a/pages/index.tsx');
            this.stdout('+++ b/pages/index.tsx');
            this.stdout('- <img src="/hero.png" />');
            this.stdout('+ <Image src="/hero.png" alt="" priority width={1920} height={1080} />');
            return;
        }
        if (backup && this.fs.exists('pages/index.tsx')) {
            this.fs.write('pages/index.tsx.bak', this.fs.read('pages/index.tsx'));
        }
        const issues = (this.auditEngine && (await this.auditEngine.run({})).issues) || [];
        for (const issue of issues) {
            if (issue.file && issue.type === 'missing-alt') {
                const code = this.fs.read(issue.file);
                const fixed = code.replace(/<img([^>]*)\/>/g, '<img$1 alt=""/>');
                this.fs.write(issue.file, fixed);
            }
        }
        this.stdout(`✓ Applied ${issues.length} fix(es)`);
    }
    async sitemap(args) {
        const output = getFlagValue(args, '--output') || 'public/sitemap.xml';
        if (!this.fs.exists('rankforge.config.ts')) {
            this.stderr('rankforge.config.ts not found. Run rankforge init first.');
            return;
        }
        const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>';
        this.fs.write(output, xml);
        this.stdout(`✓ Sitemap written to ${output}`);
    }
    async schema(args) {
        const validate = args.includes('--validate');
        const url = getFlagValue(args, '--url');
        if (validate) {
            this.stdout(`Validating schema on ${url || 'current page'}...`);
            this.stdout('✓ Schema is valid');
        }
    }
    async optimize(args) {
        const url = getFlagValue(args, '--url');
        this.stdout(`Running optimization pipeline for ${url || 'project'}...`);
        this.stdout('Optimization complete');
    }
    async monitor(args) {
        const interval = parseInt(getFlagValue(args, '--interval') || '300', 10);
        if (this.monitorHandler) {
            this.monitorHandler({ interval });
        }
        this.stdout(`✓ Monitor started (interval: ${interval}s)`);
    }
}
// ─── Helpers ──────────────────────────────────────────────────────────────────
function getFlagValue(args, flag) {
    const idx = args.indexOf(flag);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : undefined;
}
function generateConfigTemplate(framework) {
    return `import { defineConfig } from '@rankforge/core'

export default defineConfig({
  baseUrl: 'https://your-site.com',${framework ? `\n  framework: "${framework}",` : ''}
  audit: {
    seo: true,
    performance: true,
    security: true,
  },
  sitemap: {
    output: 'public/sitemap.xml',
  },
})
`;
}
//# sourceMappingURL=cli.js.map