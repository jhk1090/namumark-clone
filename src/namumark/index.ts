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
                // if (elem == HolderEnum.text_sizing) {
                //     const idx = this.htmlArray.findLastIndex(v => v instanceof HolderTag && v.holderEnum === HolderEnum.text_sizing);
                //     const text: string = (this.htmlArray[idx] as HolderTag).alt;
                //     this.htmlArray.splice(idx, 1, new TextTag(text, true));
                // } else if (elem == HolderEnum.text_color) {
                //     const idx = this.htmlArray.findLastIndex(v => v instanceof HolderTag && v.holderEnum === HolderEnum.text_color);
                //     const text: string = (this.htmlArray[idx] as HolderTag).alt;
                //     this.htmlArray.splice(idx, 1, new TextTag(text, true));
                // } else if (elem == HolderEnum.wiki_style) {
                //     const idx = this.htmlArray.findLastIndex(v => v instanceof HolderTag && v.holderEnum === HolderEnum.wiki_style);
                //     const text: string = (this.htmlArray[idx] as HolderTag).alt;
                //     this.htmlArray.splice(idx, 1, new TextTag(text, true));
                // } else if (elem == HolderEnum.code_innerbracket) {
                //     const idx = this.htmlArray.findLastIndex(v => v instanceof HolderTag && v.holderEnum === HolderEnum.code_innerbracket);
                //     const text: string = (this.htmlArray[idx] as HolderTag).alt;
                //     this.htmlArray.splice(idx, 1, new TextTag(text, true));
                // } else if (elem == HolderEnum.html_bracket) {
                //     const idx = this.htmlArray.findLastIndex(v => v instanceof HolderTag && v.holderEnum === HolderEnum.html_bracket);
                //     const text: string = (this.htmlArray[idx] as HolderTag).alt;
                //     this.htmlArray.splice(idx, 1, new TextTag(text, true));
                // }
            }
        }
    }

    // listProcessor(wikiText: string, pos: number, setPos: (v: number)=>number) {
    //     let listArray: HTMLTag[] = [];
    //     let fullArray: any[] = [];
    //     let position = pos;
    //     // EOL 뒤에 텍스트가 있는지 여부
    //     let loop = true;
    //     let eol = seekEOL(wikiText, position)
    //     let text = wikiText.substring(position, eol);
    //     let indent = 1;
    //     const indentRegex = /^(\s+)\*|1\.|A\.|a\.|I\.|i\./;
    //     while (loop) {
    //         if (!(indentRegex.test(text))) {
    //             loop = false;
    //             break;
    //         }

    //         indentRegex.lastIndex = 0;
    //         let matched = text.match(indentRegex) as RegExpMatchArray;
    //         indent = matched[1].length;

    //         listArray.push(this.listParser(text, indent))
    //         position = eol + 1;
    //         if (eol < wikiText.substring(pos).length) {
    //             eol = seekEOL(wikiText, position)
    //             text = wikiText.substring(position, eol);
    //         } else {
    //             loop = false;
    //         }
    //     }

    //     /* TODO
    //     <ul>
    //         <li></li>
    //         <li></li>
    //         <li></li>
    //     </ul>
    //     꼴로 된 트리뷰 구현하기
    //     */
    //     for (const [index, element] of listArray.entries()) {
    //         const indent = element.property.indent
    //         if (index == 0 && indent != 1) {
    //             fullArray.push(
    //                 new HTMLTag(tagEnum.unordered_list_begin, {indent}),
    //                 new HTMLTag(tagEnum.plain_text_begin, {indent}),
    //             )
    //             for(let i=0; i < indent - 1; i++) {
    //                 fullArray.push(
    //                     new HTMLTag(tagEnum.unordered_list_begin, {indent}),
    //                     new HTMLTag(tagEnum.list_begin, {indent}),
    //                 )
    //             }
    //             fullArray.push(element)
    //             fullArray.push(["locate", indent, indent])
    //             for(let i=0; i < indent - 1; i++) {
    //                 fullArray.push(
    //                     new HTMLTag(tagEnum.list_end, {indent}),
    //                     ["locate", indent, indent - i - 1],
    //                     new HTMLTag(tagEnum.unordered_list_end, {indent})
    //                 )
    //             }
    //             fullArray.push(
    //                 new HTMLTag(tagEnum.plain_text_end, {indent}),
    //                 ["locate", indent, indent - indent],
    //                 new HTMLTag(tagEnum.unordered_list_end, {indent})
    //             )
    //         }

    //         // 최상위
    //         if (indent == 1) {
    //             fullArray.push(new HTMLTag(tagEnum.unordered_list_begin, {indent}))
    //             fullArray.push(new HTMLTag(tagEnum.list_begin, {indent}))
    //             fullArray.push(element)
    //             // ["locate", indent, indent] => [구별자, 마지막 여백 수, 지금 여백 수]
    //             fullArray.push(["locate", indent, indent])
    //             fullArray.push(new HTMLTag(tagEnum.list_end, {indent}))
    //             fullArray.push(new HTMLTag(tagEnum.unordered_list_end, {indent}))
    //         } else {
    //             let lastIndent = (fullArray[fullArray.length - 1] as HTMLTag).property.indent
    //             let lastLocate = fullArray.findLastIndex(elem => (!(elem instanceof HTMLTag)))
    //             // 지금 여백 수 > 마지막 여백 수
    //             if (indent > lastIndent) {
    //                 let indentDifference = Math.abs(indent - lastIndent)
    //                 if (indentDifference == 1) {
    //                     fullArray.splice(lastLocate, 1, ...[
    //                         new HTMLTag(tagEnum.unordered_list_begin, {indent}),
    //                         new HTMLTag(tagEnum.list_begin, {indent}),
    //                         element,
    //                         ["locate", indent, indent],
    //                         new HTMLTag(tagEnum.list_end, {indent}),
    //                         new HTMLTag(tagEnum.unordered_list_end, {indent})
    //                     ])
    //                 } else {
    //                     let es: any[] = []
    //                     es.push(
    //                         // new HTMLTag(tagEnum.unordered_list_begin, {indent}),
    //                         new HTMLTag(tagEnum.plain_text_begin, {indent}),
    //                     )
    //                     for(let i=0; i < indentDifference - 1; i++) {
    //                         es.push(
    //                             new HTMLTag(tagEnum.unordered_list_begin, {indent}),
    //                             new HTMLTag(tagEnum.list_begin, {indent}),
    //                         )
    //                     }
    //                     es.push(element)
    //                     es.push(["locate", indent, indent])
    //                     for(let i=0; i < indentDifference - 1; i++) {
    //                         es.push(
    //                             new HTMLTag(tagEnum.list_end, {indent}),
    //                             ["locate", indent, indent - i - 1],
    //                             new HTMLTag(tagEnum.unordered_list_end, {indent})
    //                         )
    //                     }
    //                     es.push(
    //                         // new HTMLTag(tagEnum.plain_text_end, {indent}),
    //                         ["locate", indent, indent - indentDifference],
    //                         new HTMLTag(tagEnum.unordered_list_end, {indent})
    //                     )
    //                     fullArray.splice(lastLocate, 1, ...es);
    //                 }
    //             } else if (indent <= lastIndent) {
    //                 fullArray.splice(lastLocate, 1, ...[element, ["locate", indent, indent]])
    //             }
    //         }
    //     }
    //     fullArray = fullArray.filter((v) => v[0] != "locate") as HTMLTag[];
    //     console.log(position, wikiText[position])
    //     setPos(position - 1);
    //     return fullArray
    // }

    // listParser(text: string, indent: number) {
    //     let tag: HTMLTag;
    //     let matchedRegex = /^(\*|1\.|A\.|a\.|I\.|i\.)([^\n]+)/g
    //     let listPrefix = "";
    //     let listContent = "";
    //     text = text.trim();
    //     for (const match of text.matchAll(matchedRegex)) {
    //         listPrefix = match[1];
    //         listContent = match[2].trim();
    //         break;
    //     }

    //     tag = new HTMLTag(tagEnum.plain_text, {indent}, listContent)

    //     return tag;
    // }

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

enum D_tagEnum {
    holder,
    text,
    plain_text,
    plain_text_end,
    plain_text_begin,
    strong_begin,
    strong_end,
    strike_underbar_begin,
    strike_underbar_end,
    strike_wave_begin,
    strike_wave_end,
    underline_begin,
    underline_end,
    italic_begin,
    italic_end,
    superscript_begin,
    superscript_end,
    subscript_begin,
    subscript_end,
    code_begin,
    code_end,
    code_multiline_begin,
    code_multiline_end,
    text_sizing_begin,
    text_sizing_end,
    wiki_style_begin,
    wiki_style_end,
    code_innerbracket_begin,
    code_innerbracket_end,
    html_bracket_begin,
    html_bracket_end,
    br,
    text_color_begin,
    text_color_end,
    h1,
    h2,
    h3,
    h4,
    h5,
    h6,
}

class D_HTMLTag {
    tag: string[];
    tagEnum: D_tagEnum;
    content: string | undefined;
    parameter: {
        [k: string]: string;
    };
    property: {
        originalText?: string;
        toBeEscaped?: boolean;
        isBracketClosed?: boolean;
        isFolded?: boolean;
        titleLevelThen?: number[] | undefined;
        titleLevelAt?: number | undefined;
    };

    constructor(
        tag: D_tagEnum,
        property: {} = {},
        content: string | undefined = undefined,
        parameter: {
            [k: string]: string;
        } = { style: "" }
    ) {
        this.tag = this.caseAssertion(tag);
        this.tagEnum = tag;
        this.content = content;
        this.property = property;
        this.parameter = parameter;
    }

    caseAssertion(tag: D_tagEnum) {
        switch (tag) {
            case D_tagEnum.holder:
                return [""];
            case D_tagEnum.text:
                return ["", ""];
            case D_tagEnum.plain_text:
                return ["<div@>", "</div>"];
            case D_tagEnum.plain_text_begin:
                return ["<div@>"];
            case D_tagEnum.plain_text_end:
                return ["</div>"];
            case D_tagEnum.strong_begin:
                return ["<strong@>"];
            case D_tagEnum.strong_end:
                return ["</strong>"];
            case D_tagEnum.strike_underbar_begin:
                return ["<del@>"];
            case D_tagEnum.strike_underbar_end:
                return ["</del>"];
            case D_tagEnum.strike_wave_begin:
                return ["<del@>"];
            case D_tagEnum.strike_wave_end:
                return ["</del>"];
            case D_tagEnum.italic_begin:
                return ["<em@>"];
            case D_tagEnum.italic_end:
                return ["</em>"];
            case D_tagEnum.superscript_begin:
                return ["<sup@>"];
            case D_tagEnum.superscript_end:
                return ["</sup>"];
            case D_tagEnum.subscript_begin:
                return ["<sub@>"];
            case D_tagEnum.subscript_end:
                return ["</sub>"];
            case D_tagEnum.underline_begin:
                return ["<u@>"];
            case D_tagEnum.underline_end:
                return ["</u>"];
            case D_tagEnum.code_begin:
                return ["<code@>"];
            case D_tagEnum.code_end:
                return ["</code>"];
            case D_tagEnum.code_multiline_begin:
                return ["<pre@>"];
            case D_tagEnum.code_multiline_end:
                return ["</pre>"];
            case D_tagEnum.text_sizing_begin:
                return ["<span@>"];
            case D_tagEnum.text_sizing_end:
                return ["</span>"];
            case D_tagEnum.wiki_style_begin:
                return ["<div@>"];
            case D_tagEnum.wiki_style_end:
                return ["</div>"];
            case D_tagEnum.code_innerbracket_begin:
                return ["{{{"];
            case D_tagEnum.code_innerbracket_end:
                return ["}}}"];
            case D_tagEnum.html_bracket_begin:
                return ["<div@>"];
            case D_tagEnum.html_bracket_end:
                return ["</div>"];
            case D_tagEnum.br:
                return ["<br@/>"];
            case D_tagEnum.text_color_begin:
                return ["<span@>"];
            case D_tagEnum.text_color_end:
                return ["</span>"];
            case D_tagEnum.h1:
                return ["<h1@>", "</h1>"];
            case D_tagEnum.h2:
                return ["<h2@>", "</h2>"];
            case D_tagEnum.h3:
                return ["<h3@>", "</h3>"];
            case D_tagEnum.h4:
                return ["<h4@>", "</h4>"];
            case D_tagEnum.h5:
                return ["<h5@>", "</h5>"];
            case D_tagEnum.h6:
                return ["<h6@>", "</h6>"];
            default:
                return ["", ""];
        }
    }

    toString(forceEscaped: boolean = true, isNewlineReplaced: boolean = true, titleLevel: number[] = []) {
        let parameter = "";
        for (const pair of Object.entries(this.parameter)) {
            if (pair[1] == "") continue;
            parameter += `${pair[0]}="${pair[1]}"`;
        }
        if (parameter != "") {
            parameter = " " + parameter;
        }
        if (this.tag[0].lastIndexOf("@") !== -1) {
            let tagArray = this.tag[0].split("");
            tagArray[this.tag[0].lastIndexOf("@")] = parameter;
            this.tag[0] = tagArray.join("");
        }
        if (this.property.toBeEscaped && this.content !== undefined && forceEscaped) {
            let map: { [k: string]: string } = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
            };

            if (map[this.content] != undefined) {
                this.content = map[this.content];
            }
        }
        if (this.property.titleLevelThen !== undefined && this.property.titleLevelAt !== undefined && this.content !== undefined) {
            let topLevel = titleLevel.findIndex((v) => v !== 0);
            let titleHeaderContent = this.property.titleLevelThen
                .slice(topLevel, this.property.titleLevelThen.findLastIndex((v) => v !== 0) + 1)
                .join(".");
            return (
                this.tag[0] +
                `<a id="${titleHeaderContent}">${titleHeaderContent + "."}</a><span id=\"${this.content}\">` +
                this.content +
                "</span>" +
                this.tag[1]
            );
        }

        // br 태그 방지용
        if (this.tagEnum == D_tagEnum.br && !isNewlineReplaced) {
            return "\n";
        }

        if (this.content == undefined) {
            return this.tag[0];
        } else {
            return this.tag[0] + this.content + this.tag[1];
        }
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
        }
        const headerContent = new RegularTag(TagEnum.SPAN, [new TextTag(content, true)], {id: content})
        return openTag + headerLink.toString(mark) + headerContent.toString(mark) + closeTag;
    }
}