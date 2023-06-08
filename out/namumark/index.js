"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NamuMark = void 0;
const seekEOL_1 = require("./seekEOL");
class NamuMark {
    constructor(wikiText, options = undefined) {
        this.wikiText = wikiText;
        this.htmlArray = [];
    }
    parse() {
        if (this.wikiText.startsWith("#redirect")) {
            this.htmlArray.push(new HTMLTag(tagEnum.plain_text, this.wikiText));
        }
        else {
            for (let pos = 0; pos < this.wikiText.length; pos++) {
                const now = this.wikiText[pos];
                if (now == " ") {
                    this.htmlArray.push(...this.listProcessor(this.wikiText, pos, v => pos = v));
                }
            }
        }
        return this.arrayToHtmlString();
    }
    listProcessor(wikiText, pos, setPos) {
        let listArray = [];
        let fullArray = [];
        let position = pos;
        // EOL 뒤에 텍스트가 있는지 여부
        let loop = true;
        let eol = (0, seekEOL_1.default)(wikiText, position);
        let text = wikiText.substring(position, eol);
        let indent = 1;
        const indentRegex = /^(\s+)\*|1\.|A\.|a\.|I\.|i\./g;
        while (loop) {
            if (!(indentRegex.test(text))) {
                loop = false;
            }
            for (const match of text.matchAll(indentRegex)) {
                indent = match[1].length;
            }
            listArray.push(this.listParser(text, indent));
            position = eol + 1;
            if (eol < wikiText.substring(pos).length) {
                eol = (0, seekEOL_1.default)(wikiText, position);
                text = wikiText.substring(position, eol);
            }
        }
        for (const [index, element] of listArray.entries()) {
            const indent = element.property.indent;
            if (index == 0 && indent != 1) {
                fullArray.push(new HTMLTag(tagEnum.unordered_list_begin, { indent }), new HTMLTag(tagEnum.plain_text_begin, { indent }));
                for (let i = 0; i < indent - 1; i++) {
                    fullArray.push(new HTMLTag(tagEnum.unordered_list_begin, { indent }), new HTMLTag(tagEnum.list_begin, { indent }));
                }
                fullArray.push(element);
                fullArray.push(["locate", indent, indent]);
                for (let i = 0; i < indent - 1; i++) {
                    fullArray.push(new HTMLTag(tagEnum.list_end, { indent }), ["locate", indent, indent - i - 1], new HTMLTag(tagEnum.unordered_list_end, { indent }));
                }
                fullArray.push(new HTMLTag(tagEnum.plain_text_end, { indent }), ["locate", indent, indent - indent], new HTMLTag(tagEnum.unordered_list_end, { indent }));
            }
            // 최상위
            if (indent == 1) {
                fullArray.push(new HTMLTag(tagEnum.unordered_list_begin, { indent }));
                fullArray.push(new HTMLTag(tagEnum.list_begin, { indent }));
                fullArray.push(element);
                // ["locate", indent, indent] => [구별자, 마지막 여백 수, 지금 여백 수]
                fullArray.push(["locate", indent, indent]);
                fullArray.push(new HTMLTag(tagEnum.list_end, { indent }));
                fullArray.push(new HTMLTag(tagEnum.unordered_list_end, { indent }));
            }
            else {
                let lastIndent = fullArray[fullArray.length - 1].property.indent;
                let lastLocate = fullArray.findLastIndex(elem => (!(elem instanceof HTMLTag)));
                // 지금 여백 수 > 마지막 여백 수 
                if (indent > lastIndent) {
                    let indentDifference = Math.abs(indent - lastIndent);
                    if (indentDifference == 1) {
                        fullArray.splice(lastLocate, 1, ...[
                            new HTMLTag(tagEnum.unordered_list_begin, { indent }),
                            new HTMLTag(tagEnum.list_begin, { indent }),
                            element,
                            ["locate", indent, indent],
                            new HTMLTag(tagEnum.list_end, { indent }),
                            new HTMLTag(tagEnum.unordered_list_end, { indent })
                        ]);
                    }
                    else {
                        let es = [];
                        es.push(new HTMLTag(tagEnum.unordered_list_begin, { indent }), new HTMLTag(tagEnum.plain_text_begin, { indent }));
                        for (let i = 0; i < indentDifference - 1; i++) {
                            es.push(new HTMLTag(tagEnum.unordered_list_begin, { indent }), new HTMLTag(tagEnum.list_begin, { indent }));
                        }
                        es.push(element);
                        es.push(["locate", indent, indent]);
                        for (let i = 0; i < indentDifference - 1; i++) {
                            es.push(new HTMLTag(tagEnum.list_end, { indent }), ["locate", indent, indent - i - 1], new HTMLTag(tagEnum.unordered_list_end, { indent }));
                        }
                        es.push(new HTMLTag(tagEnum.plain_text_end, { indent }), ["locate", indent, indent - indentDifference], new HTMLTag(tagEnum.unordered_list_end, { indent }));
                        fullArray.splice(lastLocate, 1, ...es);
                    }
                }
                else if (indent <= lastIndent) {
                    fullArray.splice(lastLocate, 1, ...[element, ["locate", indent, indent]]);
                }
            }
        }
        fullArray = fullArray.filter((v) => v[0] != "locate");
        console.log(position, wikiText[position]);
        setPos(position);
        return fullArray;
    }
    listParser(text, indent) {
        let tag;
        let matchedRegex = /^(\*|1\.|A\.|a\.|I\.|i\.)([^\n]+)/g;
        let listPrefix = "";
        let listContent = "";
        text = text.trim();
        for (const match of text.matchAll(matchedRegex)) {
            listPrefix = match[1];
            listContent = match[2].trim();
            break;
        }
        tag = new HTMLTag(tagEnum.plain_text, { indent }, listContent);
        return tag;
    }
    arrayToHtmlString() {
        const documentStructure = ["<!DOCTYPE html>\n<html>\n<head>\n<meta charset=\"UTF-8\">\n<meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n<title>Document</title>\n<link rel=\"stylesheet\" href=\"viewStyle.css\">\n</head>\n<body>", "</body>\n</html>"];
        let htmlString = "";
        for (const tag of this.htmlArray) {
            console.log(tag);
            htmlString += tag.toString();
        }
        console.log(htmlString);
        return documentStructure[0] + htmlString + documentStructure[1];
    }
}
exports.NamuMark = NamuMark;
var tagEnum;
(function (tagEnum) {
    tagEnum[tagEnum["text"] = 0] = "text";
    tagEnum[tagEnum["plain_text"] = 1] = "plain_text";
    tagEnum[tagEnum["plain_text_end"] = 2] = "plain_text_end";
    tagEnum[tagEnum["plain_text_begin"] = 3] = "plain_text_begin";
    tagEnum[tagEnum["unordered_list_begin"] = 4] = "unordered_list_begin";
    tagEnum[tagEnum["unordered_list_end"] = 5] = "unordered_list_end";
    tagEnum[tagEnum["list_begin"] = 6] = "list_begin";
    tagEnum[tagEnum["list_end"] = 7] = "list_end";
})(tagEnum || (tagEnum = {}));
class HTMLTag {
    constructor(tag, property = {}, content = undefined) {
        this.tag = this.caseAssertion(tag);
        this.content = content;
        this.property = property;
    }
    caseAssertion(tag) {
        switch (tag) {
            case tagEnum.text:
                return "";
            case tagEnum.plain_text:
                return "<div>";
            case tagEnum.plain_text_begin:
                return "<div>";
            case tagEnum.plain_text_end:
                return "</div>";
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
            return this.tag;
        }
        return this.tag + this.content + this.tag;
    }
}
//# sourceMappingURL=index.js.map