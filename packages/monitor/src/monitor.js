export class RUMCollector {
    data = new Map();
    record(entry) {
        if (!this.data.has(entry.url))
            this.data.set(entry.url, new Map());
        const urlMap = this.data.get(entry.url);
        if (!urlMap.has(entry.type))
            urlMap.set(entry.type, []);
        urlMap.get(entry.type).push(entry.value);
    }
    getMetrics(url) {
        const urlMap = this.data.get(url) || new Map();
        const result = {};
        for (const [type, values] of urlMap) {
            result[type] = calcStats(values);
        }
        return result;
    }
}
function calcStats(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    const p = (pct) => sorted[Math.floor((pct / 100) * (n - 1))] ?? sorted[n - 1] ?? 0;
    const avg = sorted.reduce((a, b) => a + b, 0) / n;
    return { count: n, avg, median: p(50), p75: p(75), p95: p(95) };
}
export class AlertEngine {
    thresholds;
    constructor(options) {
        this.thresholds = options.thresholds;
    }
    evaluate(input) {
        const t = this.thresholds[input.metric];
        if (!t)
            return null;
        if (input.value >= t.critical) {
            return { metric: input.metric, value: input.value, severity: 'critical', message: `${input.metric} is ${input.value} (critical threshold: ${t.critical})` };
        }
        if (input.value >= t.warning) {
            return { metric: input.metric, value: input.value, severity: 'warning', message: `${input.metric} is ${input.value} (warning threshold: ${t.warning})` };
        }
        return null;
    }
    evaluateSEO(input) {
        if (input.keyword && input.previousRank !== undefined && input.currentRank !== undefined) {
            const drop = input.currentRank - input.previousRank;
            if (drop >= 5) {
                return {
                    type: 'rank-drop',
                    severity: drop >= 10 ? 'critical' : 'warning',
                    message: `"${input.keyword}" dropped ${drop} positions (${input.previousRank} → ${input.currentRank})`,
                    previousValue: input.previousRank,
                    currentValue: input.currentRank,
                };
            }
        }
        if (input.indexedPages) {
            const { previous, current } = input.indexedPages;
            const changePct = ((current - previous) / previous) * 100;
            if (changePct < -10) {
                return {
                    type: 'indexing-drop',
                    severity: changePct < -20 ? 'critical' : 'warning',
                    message: `Indexed pages dropped ${Math.abs(changePct).toFixed(1)}% (${previous} → ${current})`,
                    previousValue: previous,
                    currentValue: current,
                };
            }
        }
        return null;
    }
}
export class NotificationService {
    config;
    transports = new Map();
    constructor(config) {
        this.config = config;
    }
    setTransport(channel, fn) {
        this.transports.set(channel, fn);
    }
    async notify(notification) {
        const cfg = this.config[notification.channel];
        if (!cfg)
            return;
        const payload = {
            message: notification.message,
            severity: notification.severity,
            ...notification.data,
        };
        const transport = this.transports.get(notification.channel);
        if (transport) {
            if (notification.channel === 'slack') {
                payload.text = `[${notification.severity.toUpperCase()}] ${notification.message}`;
                payload.attachments = [{ color: notification.severity === 'critical' ? 'danger' : 'warning', text: notification.message }];
            }
            else if (notification.channel === 'discord') {
                payload.content = `**[${notification.severity.toUpperCase()}]** ${notification.message}`;
            }
            else if (notification.channel === 'email') {
                payload.to = cfg.to;
                payload.subject = `RankForge Alert: ${notification.severity}`;
            }
            await transport(payload);
            return;
        }
        // Default real HTTP transports
        if (notification.channel === 'slack') {
            const slackCfg = cfg;
            await fetch(slackCfg.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: `[${notification.severity.toUpperCase()}] ${notification.message}`,
                    attachments: [{ color: notification.severity === 'critical' ? 'danger' : 'warning', text: notification.message }],
                }),
            });
        }
        else if (notification.channel === 'discord') {
            const discordCfg = cfg;
            await fetch(discordCfg.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: `**[${notification.severity.toUpperCase()}]** ${notification.message}` }),
            });
        }
        else if (notification.channel === 'webhook') {
            const webhookCfg = cfg;
            await fetch(webhookCfg.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
        }
    }
}
export class Monitor {
    diffCrawls(previous, current) {
        const newPages = [];
        const broken = [];
        const recovered = [];
        const removed = [];
        for (const [url, status] of current) {
            if (!previous.has(url)) {
                newPages.push(url);
            }
            else {
                const prev = previous.get(url);
                if (status.status >= 400 && prev.status < 400)
                    broken.push(url);
                if (status.status < 400 && prev.status >= 400)
                    recovered.push(url);
            }
        }
        for (const url of previous.keys()) {
            if (!current.has(url))
                removed.push(url);
        }
        return { new: newPages, broken, recovered, removed };
    }
}
//# sourceMappingURL=monitor.js.map