import seekEOL from "./seekEOL";

export class NamuMark {
    wikiText: string;
    htmlArray: HTMLTag[];
    constructor(wikiText: string, options=undefined) {
        this.wikiText = wikiText;
        this.htmlArray = [];
    }

    parse() {
        if (this.wikiText.startsWith("#redirect")) {
            this.htmlArray.push(new HTMLTag(tagEnum.plain_text, this.wikiText));
        } else {
            for (let pos=0; pos < this.wikiText.length; pos++) {
                const now = this.wikiText[pos]
                if (now == " ") {
                    this.htmlArray.push(...this.listProcessor(this.wikiText, pos, v => pos = v))
                }
            }
        }
        

        return this.arrayToHtmlString();

    }

    listProcessor(wikiText: string, pos: number, setPos: (v: number)=>number) {
        let listArray: HTMLTag[] = [];
        let fullArray: any[] = [];
        let position = pos;
        // EOL 뒤에 텍스트가 있는지 여부
        let loop = true;
        let eol = seekEOL(wikiText, position)
        let text = wikiText.substring(position, eol);
        let indent = 1;
        const indentRegex = /^(\s+)\*|1\.|A\.|a\.|I\.|i\./g;
        while (loop) {
            if (!(indentRegex.test(text))) {
                loop = false;
            }
            for (const match of text.matchAll(indentRegex)) {
                indent = match[1].length
            }
            listArray.push(this.listParser(text, indent))
            position = eol + 1;
            if (eol < wikiText.substring(pos).length) {
                eol = seekEOL(wikiText, position)
                text = wikiText.substring(position, eol);
            }
        }

        for (const [index, element] of listArray.entries()) {
            const indent = element.property.indent
            if (index == 0 && indent != 1) {
                fullArray.push(
                    new HTMLTag(tagEnum.unordered_list_begin, {indent}),
                    new HTMLTag(tagEnum.plain_text_begin, {indent}),
                )
                for(let i=0; i < indent - 1; i++) {
                    fullArray.push(
                        new HTMLTag(tagEnum.unordered_list_begin, {indent}),
                        new HTMLTag(tagEnum.list_begin, {indent}),
                    )
                }
                fullArray.push(element)
                fullArray.push(["locate", indent, indent])
                for(let i=0; i < indent - 1; i++) {
                    fullArray.push(
                        new HTMLTag(tagEnum.list_end, {indent}),
                        ["locate", indent, indent - i - 1],
                        new HTMLTag(tagEnum.unordered_list_end, {indent})
                    )
                }
                fullArray.push(
                    new HTMLTag(tagEnum.plain_text_end, {indent}),
                    ["locate", indent, indent - indent],
                    new HTMLTag(tagEnum.unordered_list_end, {indent})
                )
            }

            // 최상위
            if (indent == 1) {
                fullArray.push(new HTMLTag(tagEnum.unordered_list_begin, {indent}))
                fullArray.push(new HTMLTag(tagEnum.list_begin, {indent}))
                fullArray.push(element)
                // ["locate", indent, indent] => [구별자, 마지막 여백 수, 지금 여백 수]
                fullArray.push(["locate", indent, indent])
                fullArray.push(new HTMLTag(tagEnum.list_end, {indent}))
                fullArray.push(new HTMLTag(tagEnum.unordered_list_end, {indent}))
            } else {
                let lastIndent = (fullArray[fullArray.length - 1] as HTMLTag).property.indent
                let lastLocate = fullArray.findLastIndex(elem => (!(elem instanceof HTMLTag)))
                // 지금 여백 수 > 마지막 여백 수 
                if (indent > lastIndent) {
                    let indentDifference = Math.abs(indent - lastIndent)
                    if (indentDifference == 1) {
                        fullArray.splice(lastLocate, 1, ...[
                            new HTMLTag(tagEnum.unordered_list_begin, {indent}),
                            new HTMLTag(tagEnum.list_begin, {indent}),
                            element,
                            ["locate", indent, indent],
                            new HTMLTag(tagEnum.list_end, {indent}),
                            new HTMLTag(tagEnum.unordered_list_end, {indent})
                        ])
                    } else {
                        let es: any[] = []
                        es.push(
                            new HTMLTag(tagEnum.unordered_list_begin, {indent}),
                            new HTMLTag(tagEnum.plain_text_begin, {indent}),
                        )
                        for(let i=0; i < indentDifference - 1; i++) {
                            es.push(
                                new HTMLTag(tagEnum.unordered_list_begin, {indent}),
                                new HTMLTag(tagEnum.list_begin, {indent}),
                            )
                        }
                        es.push(element)
                        es.push(["locate", indent, indent])
                        for(let i=0; i < indentDifference - 1; i++) {
                            es.push(
                                new HTMLTag(tagEnum.list_end, {indent}),
                                ["locate", indent, indent - i - 1],
                                new HTMLTag(tagEnum.unordered_list_end, {indent})
                            )
                        }
                        es.push(
                            new HTMLTag(tagEnum.plain_text_end, {indent}),
                            ["locate", indent, indent - indentDifference],
                            new HTMLTag(tagEnum.unordered_list_end, {indent})
                        )
                        fullArray.splice(lastLocate, 1, ...es);
                    }
                } else if (indent <= lastIndent) {
                    fullArray.splice(lastLocate, 1, ...[element, ["locate", indent, indent]])
                }
            }
        }
        fullArray = fullArray.filter((v) => v[0] != "locate") as HTMLTag[];
        console.log(position, wikiText[position])
        setPos(position);
        return fullArray
    }

    listParser(text: string, indent: number) {
        let tag: HTMLTag;
        let matchedRegex = /^(\*|1\.|A\.|a\.|I\.|i\.)([^\n]+)/g
        let listPrefix = "";
        let listContent = "";
        text = text.trim();
        for (const match of text.matchAll(matchedRegex)) {
            listPrefix = match[1];
            listContent = match[2].trim();
            break;
        }

        tag = new HTMLTag(tagEnum.plain_text, {indent}, listContent)
        
        return tag;
    }

    arrayToHtmlString() {
        const documentStructure = ["<!DOCTYPE html>\n<html>\n<head>\n<meta charset=\"UTF-8\">\n<meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n<title>Document</title>\n<link rel=\"stylesheet\" href=\"viewStyle.css\">\n</head>\n<body>", "</body>\n</html>"]
        let htmlString = "";
        for (const tag of this.htmlArray) {
            console.log(tag);
            htmlString += tag.toString();
        }
        console.log(htmlString)
        return documentStructure[0] + htmlString + documentStructure[1]
    }
}

enum tagEnum {
    text,
    plain_text,
    plain_text_end,
    plain_text_begin,
    unordered_list_begin,
    unordered_list_end,
    list_begin,
    list_end
}

class HTMLTag {
    tag: string;
    content: (string | undefined);
    property: {[k: string]: any};

    constructor(tag: tagEnum, property: {} = {}, content: (string|undefined) = undefined) {
        this.tag = this.caseAssertion(tag);
        this.content = content;
        this.property = property;
    }

    caseAssertion(tag: tagEnum) {
        switch (tag) {
            case tagEnum.text:
                return "";
            case tagEnum.plain_text:
                return "<div>";
            case tagEnum.plain_text_begin:
                return "<div>"
            case tagEnum.plain_text_end:
                return "</div>"
            case tagEnum.unordered_list_begin:
                return "<ul>";
            case tagEnum.unordered_list_end:
                return "</ul>";
            case tagEnum.list_begin:
                return "<li>";
            case tagEnum.list_end:
                return "</li>";
            default:
                return "";
        }
    }

    toString() {
        if (this.content == undefined) {
            return this.tag
        }
        return this.tag + this.content + this.tag
    }
}