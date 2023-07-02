import seekEOL from "./seekEOL";

export class NamuMark {
    wikiText: string;
    htmlArray: HTMLTag[];
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
    };
    textToken: string[];
    bracketQueue: tagEnum[];

    constructor(wikiText: string, options = undefined) {
        this.wikiText = wikiText;
        this.htmlArray = [];
        // this.textTokenSyntax = ([] as string[]).concat(...Object.values(this.textToken))
        this.textToken = ["'''", "''", "--", "~~", "__", "^^", ",,"];
        this.bracketQueue = [];
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
        };
    }

    parse() {
        if (this.wikiText.startsWith("#redirect")) {
            this.htmlArray.push(new HTMLTag(tagEnum.plain_text, {}, this.wikiText));
        } else {
            for (let pos = 0; pos < this.wikiText.length; pos++) {
                const now = this.wikiText[pos];

                if (now == "\n") {
                    this.htmlArray.push(new HTMLTag(tagEnum.br));
                    this.textEndlineProcessor();
                    this.flags = {
                        ...this.flags,
                        strong: false,
                        italic: false,
                        strike_underbar: false,
                        strike_wave: false,
                        underline: false,
                        superscript: false,
                        subscript: false,
                    };
                    continue;
                }

                if (this.textToken.some((text) => this.wikiText.substring(pos).startsWith(text)) && this.flags.code == false) {
                    this.textProcessor(pos, (v) => (pos = v));
                    continue;
                }

                if (this.wikiText.substring(pos).startsWith("{{{") && this.flags.code == false) {
                    const sizingRegexWithSpace = /^(\+|-)([1-5]) /g;
                    const sizingRegexWithNewline = /^(\+|-)([1-5])\n/g;
                    const wikiStyleRegex = /^#!wiki style="(.+)?"([^\}]+)?\n/g
                    
                    if (sizingRegexWithSpace.test(this.wikiText.substring(pos + 3))) {
                        sizingRegexWithSpace.lastIndex = 0;
                        let size: string = "";
                        let sign: string = "";
                        for (const match of this.wikiText.substring(pos + 3).matchAll(sizingRegexWithSpace)) {
                            sign = match[1];
                            size = match[2];
                        }
                        this.htmlArray.push(
                            new HTMLTag(tagEnum.text_sizing_begin, { originalText: "{{{" + this.wikiText.substring(pos + 3, pos + 6), isClosed: false }, undefined, {
                                class: "size" + sign + size,
                            })
                        );
                        this.bracketQueue.push(tagEnum.text_sizing_begin)
                        // this.flags.text_sizing += 1;
                        // {{{+2 \n
                        pos += 5;
                        continue;
                    } else if (sizingRegexWithNewline.test(this.wikiText.substring(pos + 3))) {
                        sizingRegexWithNewline.lastIndex = 0;
                        let size: string = "";
                        let sign: string = "";
                        for (const match of this.wikiText.substring(pos + 3).matchAll(sizingRegexWithSpace)) {
                            sign = match[1];
                            size = match[2];
                        }
                        this.htmlArray.push(
                            new HTMLTag(tagEnum.text_sizing_begin, { originalText: "{{{" + this.wikiText.substring(pos + 3, pos + 5), isClosed: false }, undefined, {
                                class: "size" + sign + size,
                            })
                        );
                        this.bracketQueue.push(tagEnum.text_sizing_begin)
                        // this.flags.text_sizing += 1;
                        // {{{+2\n
                        pos += 4;
                        continue;
                    } else if (wikiStyleRegex.test(this.wikiText.substring(pos + 3))) {
                        wikiStyleRegex.lastIndex = 0;
                        let style: string = "";
                        for (const match of this.wikiText.substring(pos + 3).matchAll(wikiStyleRegex)) {
                            style = match[1];
                        }
                        this.htmlArray.push(
                            new HTMLTag(tagEnum.wiki_style_begin, { originalText: "{{{" + this.wikiText.substring(pos + 3, seekEOL(this.wikiText, pos + 3) + 1), isClosed: false }, undefined, {style})
                        )
                        this.bracketQueue.push(tagEnum.wiki_style_begin)
                        pos = seekEOL(this.wikiText, pos + 3);
                        continue;
                    } else {
                        this.htmlArray.push(new HTMLTag(tagEnum.code_begin, { originalText: "{{{" }));
                        this.flags.code = true;
                        pos += 2;
                        continue;
                    }
                }

                if (this.wikiText.substring(pos).startsWith("}}}") && this.bracketQueue.length !== 0 && this.bracketQueue.at(-1) == tagEnum.text_sizing_begin && this.flags.code == false) {
                    const idx = this.htmlArray.findLastIndex((v) => v.tagEnum == tagEnum.text_sizing_begin && v.property.isClosed == false);
                    this.htmlArray[idx].property.isClosed = true;
                    this.htmlArray.push(new HTMLTag(tagEnum.text_sizing_end, { originalText: "}}}" }));
                    this.bracketQueue.pop();
                    pos += 2;
                    continue;
                }

                if (this.wikiText.substring(pos).startsWith("}}}") && this.bracketQueue.length !== 0 && this.bracketQueue.at(-1) == tagEnum.wiki_style_begin && this.flags.code == false) {
                    const idx = this.htmlArray.findLastIndex((v) => v.tagEnum == tagEnum.wiki_style_begin && v.property.isClosed == false);
                    this.htmlArray[idx].property.isClosed = true;
                    this.htmlArray.push(new HTMLTag(tagEnum.wiki_style_end, { originalText: "}}}" }));
                    this.bracketQueue.pop();
                    pos += 2;
                    continue;
                }

                if (this.wikiText.substring(pos).startsWith("}}}") && this.flags.code == true) {
                    this.htmlArray.push(new HTMLTag(tagEnum.code_end, { originalText: "}}}" }));
                    this.flags.code = false;
                    if (this.flags.code_multiline) {
                        this.htmlArray.push(new HTMLTag(tagEnum.code_multiline_end));
                        this.flags.code_multiline = false;
                    }
                    pos += 2;
                    continue;
                }

                this.htmlArray.push(new HTMLTag(tagEnum.text, {}, now));
            }
        }
        this.textEndlineProcessor(true);
        return this.arrayToHtmlString();
    }

    textEndlineProcessor(isWikiTextEnd: boolean = false) {
        if (this.flags.strong) {
            const idx = this.htmlArray.findLastIndex((v) => v.tagEnum == tagEnum.strong_begin);
            const text = this.htmlArray[idx].property.originalText;
            this.htmlArray.splice(idx, 1, new HTMLTag(tagEnum.text, {}, text));
        }
        if (this.flags.strike_underbar) {
            const idx = this.htmlArray.findLastIndex((v) => v.tagEnum == tagEnum.strike_underbar_begin);
            const text = this.htmlArray[idx].property.originalText;
            this.htmlArray.splice(idx, 1, new HTMLTag(tagEnum.text, {}, text));
        }
        if (this.flags.strike_wave) {
            const idx = this.htmlArray.findLastIndex((v) => v.tagEnum == tagEnum.strike_wave_begin);
            const text = this.htmlArray[idx].property.originalText;
            this.htmlArray.splice(idx, 1, new HTMLTag(tagEnum.text, {}, text));
        }
        if (this.flags.italic) {
            const idx = this.htmlArray.findLastIndex((v) => v.tagEnum == tagEnum.italic_begin);
            const text = this.htmlArray[idx].property.originalText;
            this.htmlArray.splice(idx, 1, new HTMLTag(tagEnum.text, {}, text));
        }
        if (this.flags.underline) {
            const idx = this.htmlArray.findLastIndex((v) => v.tagEnum == tagEnum.underline_begin);
            const text = this.htmlArray[idx].property.originalText;
            this.htmlArray.splice(idx, 1, new HTMLTag(tagEnum.text, {}, text));
        }
        if (this.flags.superscript) {
            const idx = this.htmlArray.findLastIndex((v) => v.tagEnum == tagEnum.superscript_begin);
            const text = this.htmlArray[idx].property.originalText;
            this.htmlArray.splice(idx, 1, new HTMLTag(tagEnum.text, {}, text));
        }
        if (this.flags.subscript) {
            const idx = this.htmlArray.findLastIndex((v) => v.tagEnum == tagEnum.subscript_begin);
            const text = this.htmlArray[idx].property.originalText;
            this.htmlArray.splice(idx, 1, new HTMLTag(tagEnum.text, {}, text));
        }
        if (this.flags.code && !isWikiTextEnd && !this.flags.code_multiline) {
            const idx = this.htmlArray.findLastIndex((v) => v.tagEnum == tagEnum.code_begin);
            const text = this.htmlArray[idx];
            this.htmlArray.splice(idx, 1, new HTMLTag(tagEnum.code_multiline_begin), text);
            this.flags.code_multiline = true;
        }
        if (this.flags.code && isWikiTextEnd) {
            const idx_code = this.htmlArray.findLastIndex((v) => v.tagEnum == tagEnum.code_begin);
            const text = this.htmlArray[idx_code].property.originalText;
            this.htmlArray.splice(idx_code, 1, new HTMLTag(tagEnum.text, {}, text));
            if (this.flags.code_multiline) {
                const idx_pre = this.htmlArray.findLastIndex((v) => v.tagEnum == tagEnum.code_multiline_begin);
                this.htmlArray.splice(idx_pre, 1);
            }
        }

        if (isWikiTextEnd) {
            for (const queue of Array.from(this.bracketQueue).reverse()) {
                if (queue == tagEnum.text_sizing_begin) {
                    const idx = this.htmlArray.findLastIndex(v => v.tagEnum == tagEnum.text_sizing_begin && v.property.isClosed == false);
                    const text = this.htmlArray[idx].property.originalText;
                    this.htmlArray.splice(idx, 1, new HTMLTag(tagEnum.text, {}, text));        
                } else if (queue == tagEnum.wiki_style_begin) {
                    const idx = this.htmlArray.findLastIndex(v => v.tagEnum == tagEnum.wiki_style_begin && v.property.isClosed == false);
                    const text = this.htmlArray[idx].property.originalText;
                    this.htmlArray.splice(idx, 1, new HTMLTag(tagEnum.text, {}, text));
                }
            }
        }
    }
    textProcessor(pos: number, setPos: (v: number) => void) {
        const wikiTextSincePos = this.wikiText.substring(pos);
        const matchedSyntax = this.textToken.find((text) => wikiTextSincePos.startsWith(text));
        let tag: tagEnum = tagEnum.holder;
        let posIncrement: number = 0;
        switch (matchedSyntax) {
            case "'''":
                if (this.flags.strong) {
                    tag = tagEnum.strong_end;
                    this.flags.strong = false;
                } else {
                    tag = tagEnum.strong_begin;
                    this.flags.strong = true;
                }
                posIncrement = 2;
                break;
            case "''":
                if (this.flags.italic) {
                    tag = tagEnum.italic_end;
                    this.flags.italic = false;
                } else {
                    tag = tagEnum.italic_begin;
                    this.flags.italic = true;
                }
                posIncrement = 1;
                break;
            case "--":
                if (this.flags.strike_underbar) {
                    tag = tagEnum.strike_underbar_end;
                    this.flags.strike_underbar = false;
                } else {
                    tag = tagEnum.strike_underbar_begin;
                    this.flags.strike_underbar = true;
                }
                posIncrement = 1;
                break;
            case "~~":
                if (this.flags.strike_wave) {
                    tag = tagEnum.strike_wave_end;
                    this.flags.strike_wave = false;
                } else {
                    tag = tagEnum.strike_wave_begin;
                    this.flags.strike_wave = true;
                }
                posIncrement = 1;
                break;
            case "__":
                if (this.flags.underline) {
                    tag = tagEnum.underline_end;
                    this.flags.underline = false;
                } else {
                    tag = tagEnum.underline_begin;
                    this.flags.underline = true;
                }
                posIncrement = 1;
                break;
            case "^^":
                if (this.flags.superscript) {
                    tag = tagEnum.superscript_end;
                    this.flags.superscript = false;
                } else {
                    tag = tagEnum.superscript_begin;
                    this.flags.superscript = true;
                }
                posIncrement = 1;
                break;
            case ",,":
                if (this.flags.subscript) {
                    tag = tagEnum.subscript_end;
                    this.flags.subscript = false;
                } else {
                    tag = tagEnum.subscript_begin;
                    this.flags.subscript = true;
                }
                posIncrement = 1;
                break;
            default:
                break;
        }
        this.htmlArray.push(new HTMLTag(tag, { originalText: matchedSyntax }));
        setPos(pos + posIncrement);
        return;
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
            htmlString += tag.toString();
        }
        console.log(htmlString);

        return documentStructure[0] + htmlString + documentStructure[1];
    }
}

enum tagEnum {
    holder,
    text,
    plain_text,
    plain_text_end,
    plain_text_begin,
    unordered_list_begin,
    unordered_list_end,
    list_begin,
    list_end,
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
    br,
}

class HTMLTag {
    tag: string[];
    tagEnum: tagEnum;
    content: string | undefined;
    parameter: {
        [k: string]: string;
    };
    property: { [k: string]: any };

    constructor(
        tag: tagEnum,
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

    caseAssertion(tag: tagEnum) {
        switch (tag) {
            case tagEnum.holder:
                return [""];
            case tagEnum.text:
                return ["", ""];
            case tagEnum.plain_text:
                return ["<div@>", "</div>"];
            case tagEnum.plain_text_begin:
                return ["<div@>"];
            case tagEnum.plain_text_end:
                return ["</div>"];
            case tagEnum.unordered_list_begin:
                return ["<ul@>"];
            case tagEnum.unordered_list_end:
                return ["</ul>"];
            case tagEnum.strong_begin:
                return ["<strong@>"];
            case tagEnum.strong_end:
                return ["</strong>"];
            case tagEnum.strike_underbar_begin:
                return ["<del@>"];
            case tagEnum.strike_underbar_end:
                return ["</del>"];
            case tagEnum.strike_wave_begin:
                return ["<del@>"];
            case tagEnum.strike_wave_end:
                return ["</del>"];
            case tagEnum.italic_begin:
                return ["<em@>"];
            case tagEnum.italic_end:
                return ["</em>"];
            case tagEnum.superscript_begin:
                return ["<sup@>"];
            case tagEnum.superscript_end:
                return ["</sup>"];
            case tagEnum.subscript_begin:
                return ["<sub@>"];
            case tagEnum.subscript_end:
                return ["</sub>"];
            case tagEnum.underline_begin:
                return ["<u@>"];
            case tagEnum.underline_end:
                return ["</u>"];
            case tagEnum.list_begin:
                return ["<li@>"];
            case tagEnum.list_end:
                return ["</li>"];
            case tagEnum.code_begin:
                return ["<code@>"];
            case tagEnum.code_end:
                return ["</code>"];
            case tagEnum.code_multiline_begin:
                return ["<pre@>"];
            case tagEnum.code_multiline_end:
                return ["</pre>"];
            case tagEnum.text_sizing_begin:
                return ["<span@>"];
            case tagEnum.text_sizing_end:
                return ["</span>"];
            case tagEnum.wiki_style_begin:
                return ["<div@>"]
            case tagEnum.wiki_style_end:
                return ["</div>"]
            case tagEnum.br:
                return ["<br@/>"];
            default:
                return ["", ""];
        }
    }

    toString() {
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
        if (this.content == undefined) {
            return this.tag[0];
        } else {
            return this.tag[0] + this.content + this.tag[1];
        }
    }
}
