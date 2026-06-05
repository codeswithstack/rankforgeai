export interface FS {
    exists(path: string): boolean;
    read(path: string): string;
    write(path: string, content: string): void;
}
export interface CLIOptions {
    fs?: FS;
    stdout?: (msg: string) => void;
    stderr?: (msg: string) => void;
}
export interface AuditEngine {
    run(options: {
        url?: string;
        only?: string;
    }): Promise<AuditResult>;
    calledWith?: string;
}
export interface AuditResult {
    seoScore?: number;
    perfScore?: number;
    issues?: Array<{
        type: string;
        file?: string;
        line?: number;
    }>;
    [key: string]: unknown;
}
export declare class MockFileSystem implements FS {
    private files;
    exists(path: string): boolean;
    read(path: string): string;
    write(path: string, content: string): void;
}
export declare class MockAuditEngine implements AuditEngine {
    calledWith: string;
    private result;
    constructor(result: AuditResult);
    run(options: {
        url?: string;
        only?: string;
    }): Promise<AuditResult>;
}
export declare class RankForgeCLI {
    private fs;
    private stdout;
    private stderr;
    private auditEngine?;
    private exitHandler;
    private monitorHandler?;
    constructor(options?: CLIOptions);
    setAuditEngine(engine: AuditEngine): void;
    setExitHandler(fn: (code: number) => void): void;
    setMonitorHandler(fn: (opts: Record<string, unknown>) => void): void;
    run(args: string[]): Promise<void>;
    private showHelp;
    private showVersion;
    private detectFramework;
    private init;
    private audit;
    private fix;
    private sitemap;
    private schema;
    private optimize;
    private monitor;
}
//# sourceMappingURL=cli.d.ts.map