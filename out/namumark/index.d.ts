export declare class NamuMark {
    wikiText: string;
    htmlArray: HTMLTag[];
    constructor(wikiText: string, options?: undefined);
    parse(): string;
    listProcessor(wikiText: string, pos: number, setPos: (v: number) => number): void;
    listParser(text: string, indent: number): HTMLTag;
    arrayToHtmlString(): string;
}
declare enum tagEnum {
    text = 0,
    plain_text = 1,
    unordered_list = 2,
    list = 3
}
declare class HTMLTag {
    tag: string;
    content: string;
    property: {
        [k: string]: any;
    };
    children: HTMLTag[];
    constructor(tag: tagEnum, property?: {}, content?: string);
    caseAssertion(tag: tagEnum): "" | "<div>" | "<ul>" | "<li>";
    toString(): string;
    addChildren(children: HTMLTag): HTMLTag;
}
export {};
