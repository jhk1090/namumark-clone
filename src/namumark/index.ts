import { bracketOpenProcessor, bracketCloseProcessor, textProcessor, titleProcessor } from "./processor";
import seekEOL from "./seekEOL";
import { TextTag, RegularTag, SingularTag, HolderTag, HolderEnum, TagEnum, TitleTag } from "./parts";

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