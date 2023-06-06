"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NamuMark = void 0;
const seekEOL_1 = require("./seekEOL");
class NamuMark {
    wikiText;
    htmlArray;
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
                    this.listProcessor(this.wikiText, pos, v => pos = v);
                }
                if (this.wikiText.substring(pos, pos + 1) == "\n") {
                    pos++;
                    continue;
                }
            }
        }
        return this.arrayToHtmlString();
    }
    listProcessor(wikiText, pos, setPos) {
        let listArray = [];
        let position = pos;
        let loop = true;
        let eol = (0, seekEOL_1.default)(wikiText, position);
        let text = wikiText.substring(position, eol);
        let indent = 1;
        const indentRegex = /^(\s+)\*|1\.|A\.|a\.|I\.|i\./;
        while (loop) {
            if (!indentRegex.test(text)) {
                loop = false;
            }
            for (const match of text.matchAll(indentRegex)) {
                indent = match[1].length;
            }
            listArray.push(this.listParser(wikiText, indent));
            if (eol < wikiText.substring(pos).length) {
                position = eol + 2;
                eol = (0, seekEOL_1.default)(wikiText, position);
                text = wikiText.substring(position, eol);
            }
        }
        setPos(position);
    }
    listParser(text, indent) {
        let listArray = [];
        let matchedRegex = /^(\*|1\.|A\.|a\.|I\.|i\.)([^\n]+)/g;
        let listPrefix = "";
        let listContent = "";
        for (const match of text.substring(1).matchAll(matchedRegex)) {
            console.log(match);
            listPrefix = match[1];
            listContent = match[2].trim();
            break;
        }
        listArray.push(new HTMLTag(tagEnum.unordered_list_start, undefined, { indent }));
        listArray.push(new HTMLTag(tagEnum.list_start, undefined, { indent }));
        listArray.push(new HTMLTag(tagEnum.text, listContent, { indent }));
        listArray.push(new HTMLTag(tagEnum.list_end, undefined, { indent }));
        listArray.push(new HTMLTag(tagEnum.unordered_list_end, undefined, { indent }));
        return listArray;
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
    tagEnum[tagEnum["unordered_list_start"] = 2] = "unordered_list_start";
    tagEnum[tagEnum["unordered_list_end"] = 3] = "unordered_list_end";
    tagEnum[tagEnum["list_start"] = 4] = "list_start";
    tagEnum[tagEnum["list_end"] = 5] = "list_end";
})(tagEnum || (tagEnum = {}));
class HTMLTag {
    tag;
    content;
    property;
    constructor(tag, content = undefined, property = {}) {
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
            case tagEnum.unordered_list_start:
                return "<ul>";
            case tagEnum.unordered_list_end:
                return "</ul>";
            case tagEnum.list_start:
                return "<li>";
            case tagEnum.list_end:
                return "</li>";
            default:
                return "";
        }
    }
    toString() {
        if (this.content == undefined)
            return this.tag;
        else
            return this.tag + this.content + this.tag;
    }
}
//# sourceMappingURL=index.js.map