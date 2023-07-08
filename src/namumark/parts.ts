import { NamuMark } from ".";

export enum HolderEnum {
    div,
    text_sizing,
    code,
    code_multiline,
    wiki_style,
    code_innerbracket,
    html_bracket,
    text_color,
    strong,
    strike_underbar,
    strike_wave,
    italic,
    superscript,
    subscript,
    underline
}

export enum TagEnum {
    A = "a",
    SPAN = "span",
    DIV = "div",
    html_bracket = "div",
    text_sizing = "span",
    text_color = "span",
    wiki_style = "div",
    code = "code",
    code_multiline = "pre",
    BR = "br",
    strong = "strong",
    strike = "del",
    italic = "em",
    superscript = "sup",
    subscript = "sub",
    underline = "u",
    H1 = "h1",
    H2 = "h2",
    H3 = "h3",
    H4 = "h4",
    H5 = "h5",
    H6 = "h6"
}

class Tag {}

export class TextTag extends Tag {
    escape: boolean;
    content: string;
    constructor(content: string, escape: boolean) {
        super();
        this.content = content;
        this.escape = escape;
    }
    toString(): string {
        if (this.escape) {
            let map: { [k: string]: string } = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
            };

            if (map[this.content] !== undefined) {
                this.content = map[this.content];
            }
        }

        return this.content;
    }
}

export class HolderTag extends Tag {
    alt: string;
    holderEnum: HolderEnum;
    property: {
        [k: string]: any;
    }
    constructor(holderEnum: HolderEnum, alt: string, property: { [k: string]: any } = {}) {
        super();
        this.holderEnum = holderEnum;
        this.alt = alt;
        this.property = property;
    }
}

export class RegularTag extends Tag {
    tagEnum: TagEnum;
    children: Tag[];
    property: {
        [k: string]: any;
    }
    constructor(tagEnum: TagEnum, children: Tag[], property: { [k: string]: any } = {}) {
        super();
        this.tagEnum = tagEnum;
        this.children = children;
        this.property = property;
    }

    toString(mark: NamuMark): string {
        let property = "";
        if (Object.keys(this.property).length !== 0) {
            for (const pair of Object.entries(this.property)) {
                if (pair[1] == "") continue;
                property += `${pair[0]}=${JSON.stringify(pair[1])}`;
            }
            if (property !== "") {
                property = " " + property;
            }
        }

        const openTag = `<${this.tagEnum}${property}>`
        const closeTag = `</${this.tagEnum}>`
        let content: string = "";
        for (const child of this.children) {
            if (child instanceof TextTag) {
                content += child.toString()
                continue;
            }
            if (child instanceof RegularTag) {
                content += child.toString(mark);
                continue;
            }
            if (child instanceof SingularTag) {
                content += child.toString();
                continue;
            }
        }
        return openTag + content + closeTag;
    }
}

export class SingularTag extends Tag {
    tagEnum: TagEnum;
    property: {
        [k: string]: any;
    }
    constructor(tagEnum: TagEnum, property: { [k: string]: any } = {}) {
        super();
        this.tagEnum = tagEnum;
        this.property = property;
    }

    toString(): string {
        let property = "";
        if (Object.keys(this.property).length !== 0) {
            for (const pair of Object.entries(this.property)) {
                if (pair[1] == "") continue;
                property += `${pair[0]}=${JSON.stringify(pair[1])}`;
            }
            if (property !== "") {
                property = " " + property;
            }
        }

        return `<${this.tagEnum}${property} />`
    }
}

export class TitleTag extends RegularTag {
    titleLevelThen: number[];

    constructor(tagEnum: TagEnum, children: Tag[], titleLevelThen: number[], property: { [k: string]: any } = {}) {
        super(tagEnum, children, property);
        this.titleLevelThen = titleLevelThen;
    }

    toString(mark: NamuMark): string {
        let property = "";
        if (Object.keys(this.property).length !== 0) {
            for (const pair of Object.entries(this.property)) {
                if (pair[1] == "") continue;
                property += `${pair[0]}=${JSON.stringify(pair[1])}`;
            }
            if (property !== "") {
                property = " " + property;
            }
        }
        
        let topLevel = mark.titleLevel.findIndex((v) => v !== 0);
        let titleHeaderContent = this.titleLevelThen
            .slice(topLevel, this.titleLevelThen.findLastIndex((v) => v !== 0) + 1)
            .join(".");

        const openTag = `<${this.tagEnum}${property}>`
        const closeTag = `</${this.tagEnum}>`
        const headerLink = new RegularTag(TagEnum.A, [new TextTag(titleHeaderContent + ".", true)], {id: titleHeaderContent})
        let content: string = "";
        for (const child of this.children) {
            if (child instanceof TextTag) {
                content += child.toString()
                continue;
            }
            if (child instanceof RegularTag) {
                content += child.toString(mark);
                continue;
            }
            if (child instanceof SingularTag) {
                content += child.toString();
                continue;
            }
        }
        const headerContent = new RegularTag(TagEnum.SPAN, [new TextTag(content, true)], {id: content})
        return openTag + headerLink.toString(mark) + headerContent.toString(mark) + closeTag;
    }
}