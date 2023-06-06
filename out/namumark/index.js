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
        let fullArray = [];
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
        for (const [index, element] of listArray.entries()) {
            const indent = element.property.indent;
            if (indent == 1) {
                fullArray.push(element);
            }
            else {
            }
        }
        setPos(position);
    }
    listParser(text, indent) {
        let listArray;
        let matchedRegex = /^(\*|1\.|A\.|a\.|I\.|i\.)([^\n]+)/g;
        let listPrefix = "";
        let listContent = "";
        for (const match of text.substring(1).matchAll(matchedRegex)) {
            console.log(match);
            listPrefix = match[1];
            listContent = match[2].trim();
            break;
        }
        listArray = new HTMLTag(tagEnum.text, { indent }, listContent);
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
    tagEnum[tagEnum["unordered_list"] = 2] = "unordered_list";
    tagEnum[tagEnum["list"] = 3] = "list";
})(tagEnum || (tagEnum = {}));
class HTMLTag {
    tag;
    content;
    property;
    children;
    constructor(tag, property = {}, content = "") {
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
            case tagEnum.unordered_list:
                return "<ul>";
            case tagEnum.list:
                return "<li>";
            default:
                return "";
        }
    }
    toString() {
        let childrenToString = "";
        if (this.children.length != 0)
            childrenToString = this.children.map(v => v.toString()).reduce((prev, cur) => prev + cur);
        return this.tag + this.content + childrenToString + this.tag;
    }
    addChildren(children) {
        this.children.push(children);
        return children;
    }
}
//# sourceMappingURL=index.js.map