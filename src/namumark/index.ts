import { bracketOpenProcessor, bracketCloseProcessor, textProcessor, titleProcessor } from "./processor";
import seekEOL from "./seekEOL";

export class NamuMark {
    wikiText: string;
    htmlArray: (TextTag|RegularTag|SingularTag|HolderTag)[];
    flags: {
        strong: boolean;
        italic: boolean;
        strike_underbar: boolean;
        strike_wave: boolean;
        underline: boolean;
        superscript: boolean;
        subscript: boolean;
        code: boolean;
        code_multiline: boolean;
        html_escape: boolean;
        is_line_start: boolean;
    };
    textToken: string[];
    bracketStack: (
        | HolderEnum.code_innerbracket
        | HolderEnum.text_sizing
        | HolderEnum.wiki_style
        | HolderEnum.html_bracket
        | HolderEnum.text_color
    )[];
    preset: {
        theme: "DARK" | "LIGHT";
        title: string;
    };
    titleLevel: number[];

    constructor(
        wikiText: string,
        options: {
            theme: "DARK" | "LIGHT";
            title: string;
        } = { theme: "DARK", title: "" }
    ) {
        this.wikiText = wikiText;
        this.htmlArray = [];
        // this.textTokenSyntax = ([] as string[]).concat(...Object.values(this.textToken))
        this.textToken = ["'''", "''", "--", "~~", "__", "^^", ",,"];
        this.bracketStack = [];
        this.flags = {
            strong: false,
            italic: false,
            strike_underbar: false,
            strike_wave: false,
            underline: false,
            superscript: false,
            subscript: false,
            code: false,
            code_multiline: false,
            html_escape: true,
            is_line_start: true,
        };
        this.preset = {
            theme: options.theme,
            title: options.title,
        };
        this.titleLevel = [0, 0, 0, 0, 0, 0];
    }

    parse() {
        if (this.wikiText.startsWith("#redirect")) {
            this.htmlArray.push(new TextTag(this.wikiText, true))
        } else {
            for (let pos = 0; pos < this.wikiText.length; pos++) {
                const now = this.wikiText[pos];
                const titleRegex =
                    /^(?:(=) (.+) =|(==) (.+) ==|(===) (.+) ===|(====) (.+) ====|(=====) (.+) =====|(======) (.+) ======|(=#) (.+) #=|(==#) (.+) #==|(===#) (.+) #===|(====#) (.+) #====|(=====#) (.+) #=====|(======#) (.+) #======)$/g;

                if (now == "\n") {
                    this.htmlArray.push(new SingularTag(TagEnum.BR))
                    this.endlineProcessor();
                    this.flags = {
                        ...this.flags,
                        strong: false,
                        italic: false,
                        strike_underbar: false,
                        strike_wave: false,
                        underline: false,
                        superscript: false,
                        subscript: false,
                        is_line_start: true,
                    };
                    continue;
                }

                if (
                    titleRegex.test(this.wikiText.substring(pos, seekEOL(this.wikiText, pos))) &&
                    this.flags.is_line_start &&
                    this.flags.code == false
                ) {
                    titleProcessor(this, pos, (v) => (pos = v));
                    continue;
                }

                if (this.wikiText.substring(pos).startsWith("{{{")) {
                    bracketOpenProcessor(this, pos, (v) => (pos = v));
                    continue;
                }

                if (this.wikiText.substring(pos).startsWith("}}}")) {
                    bracketCloseProcessor(this, pos, (v) => (pos = v));
                    continue;
                }

                if (this.textToken.some((text) => this.wikiText.substring(pos).startsWith(text)) && this.flags.code == false) {
                    textProcessor(this, pos, (v) => (pos = v));
                    continue;
                }

                this.htmlArray.push(new TextTag(now, true));

                this.flags.is_line_start = false;
            }
        }
        this.endlineProcessor(true);
        return this.arrayToHtmlString();
    }

    endlineProcessor(isWikiTextEnd: boolean = false) {
        // texttoken 처리기 - 줄바꿈 시 그전 문법 모두 무효화
        if (this.flags.strong) {
            const idx = this.htmlArray.findLastIndex(v => v instanceof HolderTag && v.holderEnum === HolderEnum.strong);
            const text: string = (this.htmlArray[idx] as HolderTag).alt;
            this.htmlArray.splice(idx, 1, new TextTag(text, true));
        }
        if (this.flags.strike_underbar) {
            const idx = this.htmlArray.findLastIndex(v => v instanceof HolderTag && v.holderEnum === HolderEnum.strike_underbar);
            const text: string = (this.htmlArray[idx] as HolderTag).alt;
            this.htmlArray.splice(idx, 1, new TextTag(text, true));
        }
        if (this.flags.strike_wave) {
            const idx = this.htmlArray.findLastIndex(v => v instanceof HolderTag && v.holderEnum === HolderEnum.strike_wave);
            const text: string = (this.htmlArray[idx] as HolderTag).alt;
            this.htmlArray.splice(idx, 1, new TextTag(text, true));
        }
        if (this.flags.italic) {
            const idx = this.htmlArray.findLastIndex(v => v instanceof HolderTag && v.holderEnum === HolderEnum.italic);
            const text: string = (this.htmlArray[idx] as HolderTag).alt;
            this.htmlArray.splice(idx, 1, new TextTag(text, true));
        }
        if (this.flags.underline) {
            const idx = this.htmlArray.findLastIndex(v => v instanceof HolderTag && v.holderEnum === HolderEnum.underline);
            const text: string = (this.htmlArray[idx] as HolderTag).alt;
            this.htmlArray.splice(idx, 1, new TextTag(text, true));
        }
        if (this.flags.superscript) {
            const idx = this.htmlArray.findLastIndex(v => v instanceof HolderTag && v.holderEnum === HolderEnum.superscript);
            const text: string = (this.htmlArray[idx] as HolderTag).alt;
            this.htmlArray.splice(idx, 1, new TextTag(text, true));
        }
        if (this.flags.subscript) {
            const idx = this.htmlArray.findLastIndex(v => v instanceof HolderTag && v.holderEnum === HolderEnum.subscript);
            const text: string = (this.htmlArray[idx] as HolderTag).alt;
            this.htmlArray.splice(idx, 1, new TextTag(text, true));
        }
        // texttoken 처리기 - 줄바꿈 시 그전 문법 모두 무효화 (끝)

        // code가 줄바꿈 시 <code> -> <pre><code>로 변환
        if (this.flags.code && !isWikiTextEnd && !this.flags.code_multiline) {
            const idx = this.htmlArray.findLastIndex(v => v instanceof HolderTag && v.holderEnum === HolderEnum.code);
            this.htmlArray.splice(idx, 0, new HolderTag(HolderEnum.code_multiline, ""))
            this.flags.code_multiline = true;
        }

        // wikiText가 끝났을 때 code 문법 무효화
        if (this.flags.code && isWikiTextEnd) {
            const idx = this.htmlArray.findLastIndex(v => v instanceof HolderTag && v.holderEnum === HolderEnum.code);
            const text: string = (this.htmlArray[idx] as HolderTag).alt;
            this.htmlArray.splice(idx, 1, new TextTag(text, true));
            if (this.flags.code_multiline) {
                const idx_m = this.htmlArray.findLastIndex(v => v instanceof HolderTag && v.holderEnum === HolderEnum.code_multiline);
                this.htmlArray.splice(idx_m, 1);
            }
        }

        // wikiText가 끝났을 때 각종 bracket 무효화
        if (isWikiTextEnd) {
            for (const elem of Array.from(this.bracketStack).reverse()) {
                const idx = this.htmlArray.findLastIndex(v => v instanceof HolderTag && v.holderEnum === elem);
                const text: string = (this.htmlArray[idx] as HolderTag).alt;
                this.htmlArray.splice(idx, 1, new TextTag(text, true));
            }
        }
    }

    arrayToHtmlString() {
        const documentStructure = [
            '<!DOCTYPE html>\n<html>\n<head>\n<meta charset="UTF-8">\n<meta http-equiv="X-UA-Compatible" content="IE=edge">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>Document</title>\n<link rel="stylesheet" href="viewStyle.css">\n</head>\n<body>',
            "</body>\n</html>",
        ];
        let htmlString = "";
        for (const tag of this.htmlArray) {
            // console.log(tag);
            htmlString += tag.toString(this);
        }
        console.log(htmlString);

        return documentStructure[0] + htmlString + documentStructure[1];
    }
}

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