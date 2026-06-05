export interface ParsedDoc {
    title: string | undefined;
    rawHTML: string;
    querySelector: (selector: string) => Element | null;
    querySelectorAll: (selector: string) => Element[];
}
export interface MetaData {
    title?: string;
    description?: string;
    canonical?: string;
    robots?: string;
    keywords?: string;
    author?: string;
    og: {
        title?: string;
        description?: string;
        image?: string;
        url?: string;
        type?: string;
    };
    twitter: {
        card?: string;
        title?: string;
        description?: string;
        image?: string;
    };
}
export interface Heading {
    level: number;
    text: string;
}
export interface Link {
    href?: string;
    text: string;
    nofollow: boolean;
    type?: 'internal' | 'external';
    rel?: string;
}
interface Element {
    tagName: string;
    textContent: string;
    getAttribute(name: string): string | null;
    querySelectorAll(selector: string): Element[];
}
declare class SimpleDoc {
    readonly rawHTML: string;
    constructor(html: string);
    get title(): string | undefined;
    getAttribute(tag: string, attr: string): string | undefined;
    getMeta(name: string): string | undefined;
    getProperty(property: string): string | undefined;
    getAll(tagPattern: RegExp): RegExpMatchArray[];
    private decodeEntities;
}
export declare function parseHTML(html: string): SimpleDoc;
export declare function extractMeta(doc: SimpleDoc): MetaData;
export declare function extractHeadings(doc: SimpleDoc): Heading[];
export declare function extractLinks(doc: SimpleDoc, baseUrl?: string): Link[];
export {};
//# sourceMappingURL=html-parser.d.ts.map