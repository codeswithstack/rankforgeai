export class KeywordTracker {
    history = new Map();
    record(entry) {
        const entries = this.history.get(entry.keyword) || [];
        entries.push(entry);
        entries.sort((a, b) => a.date.localeCompare(b.date));
        this.history.set(entry.keyword, entries);
    }
    getHistory(keyword) {
        return this.history.get(keyword) || [];
    }
    getTrend(keyword) {
        const entries = this.getHistory(keyword);
        if (entries.length < 2)
            return { direction: 'stable', change: 0, from: 0, to: 0 };
        const from = entries[0].rank;
        const to = entries[entries.length - 1].rank;
        const change = from - to; // positive = improved (lower rank number = better)
        return {
            direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
            change: Math.abs(change),
            from,
            to,
        };
    }
    getTopKeywords(n) {
        const latest = new Map();
        for (const [keyword, entries] of this.history) {
            const last = entries[entries.length - 1];
            if (last)
                latest.set(keyword, last);
        }
        return [...latest.values()]
            .sort((a, b) => a.rank - b.rank)
            .slice(0, n);
    }
}
// ─── Ranking Trends ───────────────────────────────────────────────────────────
export class RankingTrends {
    keywords;
    constructor(keywords) {
        this.keywords = keywords;
    }
    averagePosition() {
        if (!this.keywords.length)
            return 0;
        return this.keywords.reduce((sum, k) => sum + k.rank, 0) / this.keywords.length;
    }
    percentageInTop10() {
        if (!this.keywords.length)
            return 0;
        return (this.keywords.filter(k => k.rank <= 10).length / this.keywords.length) * 100;
    }
    percentageInTop3() {
        if (!this.keywords.length)
            return 0;
        return (this.keywords.filter(k => k.rank <= 3).length / this.keywords.length) * 100;
    }
}
export class IndexingStats {
    snapshots = [];
    snapshot(s) {
        this.snapshots.push(s);
        this.snapshots.sort((a, b) => a.date.localeCompare(b.date));
    }
    latest() {
        return this.snapshots[this.snapshots.length - 1];
    }
    getChange() {
        if (this.snapshots.length < 2)
            return { percentage: 0, direction: 'stable', absolute: 0, from: 0, to: 0 };
        const from = this.snapshots[0].indexedCount;
        const to = this.snapshots[this.snapshots.length - 1].indexedCount;
        const absolute = to - from;
        const percentage = ((to - from) / from) * 100;
        return {
            percentage,
            direction: percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'stable',
            absolute,
            from,
            to,
        };
    }
}
export class CrawlAnalytics {
    input;
    constructor(input) {
        this.input = input;
    }
    coverage() {
        const { totalPages, crawledPages } = this.input;
        if (!totalPages || !crawledPages)
            return 0;
        return (crawledPages / totalPages) * 100;
    }
    avgDepth() {
        const pages = this.input.pages;
        if (!pages || !pages.length)
            return 0;
        return pages.reduce((sum, p) => sum + p.depth, 0) / pages.length;
    }
    getDeepPages(options) {
        return (this.input.pages || []).filter(p => p.depth > options.threshold);
    }
}
export class TrafficAnalytics {
    entries = [];
    record(entry) {
        this.entries.push(entry);
    }
    getGrowth(source) {
        const filtered = this.entries
            .filter(e => e.source === source)
            .sort((a, b) => a.date.localeCompare(b.date));
        if (filtered.length < 2)
            return 0;
        const first = filtered[0].sessions;
        const last = filtered[filtered.length - 1].sessions;
        if (!first)
            return 0;
        return ((last - first) / first) * 100;
    }
    getTopPages(n) {
        const pageMap = new Map();
        for (const e of this.entries) {
            if (!e.page)
                continue;
            pageMap.set(e.page, (pageMap.get(e.page) || 0) + e.sessions);
        }
        return [...pageMap.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, n)
            .map(([page, sessions]) => ({ page, sessions }));
    }
}
//# sourceMappingURL=analytics.js.map