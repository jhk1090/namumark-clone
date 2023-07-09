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
    underline,
    h1,
    h2,
    h3,
    h4,
    h5,
    h6
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
    H6 = "h6",
    IFRAME = "iframe",
    time = "time",
}

class Tag {}

export class TextTag extends Tag {
    escape: boolean;
    content: string;
    /**
     * @param {string} content 문자열 값
     * @param {boolean} escape 문자열을 이스케이프 할 지 여부
     */
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
                '"': '&quot;',
                "'": '&#039;'
            };

            this.content = this.content.replace(/[&<>"']/g, (m) => map[m]);
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
    /**
     * @param {HolderEnum} holderEnum 표시자 유형
     * @param {string} alt 표시자의 원 문자열
     * @param {{}} property HTML 속성
     */
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
    /**
     * @param {TagEnum} tagEnum 태그 유형
     * @param {Tag[]} children 태그의 자식들
     * @param {{}} property HTML 속성
     */
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
    /**
     * @param {TagEnum} tagEnum 태그 유형
     * @param {{}} property HTML 속성
     */
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

export class HeadingTag extends RegularTag {
    headingLevelThen: number[];

    /**
     * @param {TagEnum} tagEnum 태그 유형
     * @param {Tag[]} children 태그의 자식들
     * @param {number[]} headingLevelThen 저장 당시 headingLevel
     * @param {{}} property HTML 속성
     */
    constructor(tagEnum: TagEnum, children: Tag[], headingLevelThen: number[], property: { [k: string]: any } = {}) {
        super(tagEnum, children, property);
        this.headingLevelThen = headingLevelThen;
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
        
        let topLevel = mark.headingLevel.findIndex((v) => v !== 0);
        let headingHeaderContent = this.headingLevelThen
            .slice(topLevel, this.headingLevelThen.findLastIndex((v) => v !== 0) + 1)
            .join(".");

        const openTag = `<${this.tagEnum}${property}>`
        const closeTag = `</${this.tagEnum}>`
        const headerLink = new RegularTag(TagEnum.A, [new TextTag(headingHeaderContent + ".", true)], {id: "s-" + headingHeaderContent})
        let content: string = "";
        for (const child of this.children) {
            if (child instanceof TextTag) {
                child.escape = false;
                content += child.toString()
                child.escape = true;
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
        const headerContent = new RegularTag(TagEnum.SPAN, [new TextTag(content, false)]/* , {id: content} */)
        return openTag + headerLink.toString(mark) + headerContent.toString(mark) + closeTag;
    }
}