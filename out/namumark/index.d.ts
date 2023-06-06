export declare class NamuMark {
    wikiText: string;
    htmlArray: HTMLTag[];
    constructor(wikiText: string, options?: undefined);
    parse(): string;
    listProcessor(wikiText: string, pos: number, setPos: (v: number) => number): void;
    listParser(text: string, indent: number): HTMLTag[];
    arrayToHtmlString(): string;
}
declare enum tagEnum {
    text = 0,
    plain_text = 1,
    unordered_list_start = 2,
    unordered_list_end = 3,
    list_start = 4,
    list_end = 5
}
declare class HTMLTag {
    tag: string;
    content: (string | undefined);
    property: {};
    constructor(tag: tagEnum, content?: (string | undefined), property?: {});
    caseAssertion(tag: tagEnum): "" | "<div>" | "<ul>" | "</ul>" | "<li>" | "</li>";
    toString(): string;
}
export {};
