import seekEOL from "./seekEOL";

export class NamuMark {
    wikiText: string;
    htmlArray: HTMLTag[];
    flags: {
        strong: boolean,
        italic: boolean,
        strike_underbar: boolean,
        strike_wave: boolean,
        underline: boolean,
        superscript: boolean,
        subscript: boolean,
        bracket: boolean,
        bracket_multiline: boolean
    };
    textToken: string[];
    wt_end: boolean;

    constructor(wikiText: string, options=undefined) {
        this.wikiText = wikiText;
        this.htmlArray = [];
        // this.textTokenSyntax = ([] as string[]).concat(...Object.values(this.textToken))
        this.textToken = ["'''", "''", "--", "~~", "__", "^^", ",,"];
        this.flags = {
            strong: false,
            italic: false,
            strike_underbar: false,
            strike_wave: false,
            underline: false,
            superscript: false,
            subscript: false,
            bracket: false,
            bracket_multiline: false,
        };
    }

    parse() {
        if (this.wikiText.startsWith("#redirect")) {
            this.htmlArray.push(new HTMLTag(tagEnum.plain_text, {}, this.wikiText));
        } else {
            for (let pos=0; pos < this.wikiText.length; pos++) {
                const now = this.wikiText[pos]
                
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

                if (this.textToken.some(text => this.wikiText.substring(pos).startsWith(text)) && this.flags.bracket == false) {
                    this.textProcessor(pos, v => pos = v)
                    continue;
                }

                if (this.wikiText.substring(pos).startsWith("{{{") && this.flags.bracket == false) {
                    this.htmlArray.push(new HTMLTag(tagEnum.bracket_begin, {originalText: "{{{"}))
                    this.flags.bracket = true;
                    pos += 2;
                    continue;
                }

                if (this.wikiText.substring(pos).startsWith("}}}") && this.flags.bracket == true) {
                    this.htmlArray.push(new HTMLTag(tagEnum.bracket_end, {originalText: "}}}"}))
                    this.flags.bracket = false;
                    if (this.flags.bracket_multiline) {
                        this.htmlArray.push(new HTMLTag(tagEnum.bracket_multiline_end));
                        this.flags.bracket_multiline = false;
                    }
                    pos += 2;
                    continue;
                }

                this.htmlArray.push(new HTMLTag(tagEnum.text, {}, now))
            }
        }
        this.textEndlineProcessor(true);
        return this.arrayToHtmlString();

    }

    textEndlineProcessor(isWikiTextEnd: boolean = false) {
        if (this.flags.strong) {
            const idx = this.htmlArray.findLastIndex(v => v.tagEnum == tagEnum.strong_begin);
            const text = this.htmlArray[idx].property.originalText
            this.htmlArray.splice(idx, 1, new HTMLTag(tagEnum.text, {}, text))
        }
        if (this.flags.strike_underbar) {
            const idx = this.htmlArray.findLastIndex(v => v.tagEnum == tagEnum.strike_underbar_begin);
            const text = this.htmlArray[idx].property.originalText
            this.htmlArray.splice(idx, 1, new HTMLTag(tagEnum.text, {}, text))
        }
        if (this.flags.strike_wave) {
            const idx = this.htmlArray.findLastIndex(v => v.tagEnum == tagEnum.strike_wave_begin);
            const text = this.htmlArray[idx].property.originalText
            this.htmlArray.splice(idx, 1, new HTMLTag(tagEnum.text, {}, text))
        }
        if (this.flags.italic) {
            const idx = this.htmlArray.findLastIndex(v => v.tagEnum == tagEnum.italic_begin);
            const text = this.htmlArray[idx].property.originalText
            this.htmlArray.splice(idx, 1, new HTMLTag(tagEnum.text, {}, text))
        }
        if (this.flags.underline) {
            const idx = this.htmlArray.findLastIndex(v => v.tagEnum == tagEnum.underline_begin);
            const text = this.htmlArray[idx].property.originalText
            this.htmlArray.splice(idx, 1, new HTMLTag(tagEnum.text, {}, text))
        }
        if (this.flags.superscript) {
            const idx = this.htmlArray.findLastIndex(v => v.tagEnum == tagEnum.superscript_begin);
            const text = this.htmlArray[idx].property.originalText
            this.htmlArray.splice(idx, 1, new HTMLTag(tagEnum.text, {}, text))
        }
        if (this.flags.subscript) {
            const idx = this.htmlArray.findLastIndex(v => v.tagEnum == tagEnum.subscript_begin);
            const text = this.htmlArray[idx].property.originalText
            this.htmlArray.splice(idx, 1, new HTMLTag(tagEnum.text, {}, text))
        }
        if (this.flags.bracket && !isWikiTextEnd && !this.flags.bracket_multiline) {
            const idx = this.htmlArray.findLastIndex(v => v.tagEnum == tagEnum.bracket_begin);
            const text = this.htmlArray[idx]
            this.htmlArray.splice(idx, 1, new HTMLTag(tagEnum.bracket_multiline_begin), text)
            this.flags.bracket_multiline = true;
        }
        if (this.flags.bracket && isWikiTextEnd) {
            const idx_code = this.htmlArray.findLastIndex(v => v.tagEnum == tagEnum.bracket_begin);
            const text = this.htmlArray[idx_code].property.originalText
            this.htmlArray.splice(idx_code, 1, new HTMLTag(tagEnum.text, {}, text))
            if (this.flags.bracket_multiline) {
                const idx_pre = this.htmlArray.findLastIndex(v => v.tagEnum == tagEnum.bracket_multiline_begin);
                this.htmlArray.splice(idx_pre, 1)
            }
        }
    }
    textProcessor(pos: number, setPos: (v: number) => void) {
        const wikiTextSincePos = this.wikiText.substring(pos)
        const matchedSyntax = this.textToken.find(text => wikiTextSincePos.startsWith(text))
        let tag: tagEnum = tagEnum.holder;
        let posIncrement: number = 0;
        switch (matchedSyntax) {
            case "'''":
                if (this.flags.strong) {
                    tag = tagEnum.strong_end
                    this.flags.strong = false;
                } else {
                    tag = tagEnum.strong_begin
                    this.flags.strong = true;
                }
                posIncrement = 2
                break;
            case "''":
                if (this.flags.italic) {
                    tag = tagEnum.italic_end
                    this.flags.italic = false;
                } else {
                    tag = tagEnum.italic_begin
                    this.flags.italic = true;
                }
                posIncrement = 1
                break;
            case "--":
                if (this.flags.strike_underbar) {
                    tag = tagEnum.strike_underbar_end
                    this.flags.strike_underbar = false;
                } else {
                    tag = tagEnum.strike_underbar_begin
                    this.flags.strike_underbar = true;
                }
                posIncrement = 1
                break;
            case "~~":
                if (this.flags.strike_wave) {
                    tag = tagEnum.strike_wave_end
                    this.flags.strike_wave = false;
                } else {
                    tag = tagEnum.strike_wave_begin
                    this.flags.strike_wave = true;
                }
                posIncrement = 1
                break;
            case "__":
                if (this.flags.underline) {
                    tag = tagEnum.underline_end
                    this.flags.underline = false;
                } else {
                    tag = tagEnum.underline_begin
                    this.flags.underline = true;
                }
                posIncrement = 1
                break;
            case "^^":
                if (this.flags.superscript) {
                    tag = tagEnum.superscript_end
                    this.flags.superscript = false;
                } else {
                    tag = tagEnum.superscript_begin
                    this.flags.superscript = true;
                }
                posIncrement = 1
                break;
            case ",,":
                if (this.flags.subscript) {
                    tag = tagEnum.subscript_end
                    this.flags.subscript = false;
                } else {
                    tag = tagEnum.subscript_begin
                    this.flags.subscript = true;
                }
                posIncrement = 1
                break;
            default:
                break;
        }
        this.htmlArray.push(new HTMLTag(tag, {originalText: matchedSyntax}))
        setPos(pos + posIncrement)
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
        const documentStructure = ["<!DOCTYPE html>\n<html>\n<head>\n<meta charset=\"UTF-8\">\n<meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n<title>Document</title>\n<link rel=\"stylesheet\" href=\"viewStyle.css\">\n</head>\n<body>", "</body>\n</html>"]
        let htmlString = "";
        for (const tag of this.htmlArray) {
            // console.log(tag);
            htmlString += tag.toString();
        }
        console.log(htmlString)
        
        return documentStructure[0] + htmlString + documentStructure[1]
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
    bracket_begin,
    bracket_end,
    bracket_multiline_begin,
    bracket_multiline_end,
    br
}

class HTMLTag {
    tag: string[];
    tagEnum: tagEnum;
    content: (string | undefined);
    property: {[k: string]: any};

    constructor(tag: tagEnum, property: {} = {}, content: (string|undefined) = undefined) {
        this.tag = this.caseAssertion(tag);
        this.tagEnum = tag;
        this.content = content;
        this.property = property;
    }

    caseAssertion(tag: tagEnum) {
        switch (tag) {
            case tagEnum.holder:
                return [""];
            case tagEnum.text:
                return ["", ""];
            case tagEnum.plain_text:
                return ["<div>", "</div>"];
            case tagEnum.plain_text_begin:
                return ["<div>"];
            case tagEnum.plain_text_end:
                return ["</div>"]
            case tagEnum.unordered_list_begin:
                return ["<ul>"]
            case tagEnum.unordered_list_end:
                return ["</ul>"]
            case tagEnum.strong_begin:
                return ["<strong>"]
            case tagEnum.strong_end:
                return ["</strong>"]
            case tagEnum.strike_underbar_begin:
                return ["<del>"]
            case tagEnum.strike_underbar_end:
                return ["</del>"]
            case tagEnum.strike_wave_begin:
                return ["<del>"]
            case tagEnum.strike_wave_end:
                return ["</del>"]
            case tagEnum.italic_begin:
                return ["<em>"]
            case tagEnum.italic_end:
                return ["</em>"]
            case tagEnum.superscript_begin:
                return ["<sup>"]
            case tagEnum.superscript_end:
                return ["</sup>"]
            case tagEnum.subscript_begin:
                return ["<sub>"]
            case tagEnum.subscript_end:
                return ["</sub>"]
            case tagEnum.underline_begin:
                return ["<u>"]
            case tagEnum.underline_end:
                return ["</u>"]
            case tagEnum.list_begin:
                return ["<li>"]
            case tagEnum.list_end:
                return ["</li>"]
            case tagEnum.bracket_begin:
                return ["<code>"]
            case tagEnum.bracket_end:
                return ["</code>"]
            case tagEnum.bracket_multiline_begin:
                return ["<pre>"]
            case tagEnum.bracket_multiline_end:
                return ["</pre>"]
            case tagEnum.br:
                return ["<br/>"]
            default:
                return ["", ""];
        }
    }

    toString() {
        if (this.content == undefined) {
            return this.tag[0]
        } else {
            return this.tag[0] + this.content + this.tag[1]
        }
    }
}