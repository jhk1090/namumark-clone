import { bracketOpenProcessor, bracketCloseProcessor, textProcessor, headingOpenProcessor, headingCloseProcessor } from "./processor";
import seekEOL from "./seekEOL";
import { TextTag, RegularTag, SingularTag, HolderTag, HolderEnum, TagEnum, HeadingTag } from "./parts";

export class NamuMark {
    wikiText: string;
    htmlArray: (TextTag | RegularTag | SingularTag | HolderTag)[];
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
        heading: boolean;
        heading_attribute: ({
            isFolded: boolean;
            headingLevelAt: number;
        } | undefined);
        html_escape: boolean;
        is_line_start: boolean;
    };
    textToken: string[];
    wikiStack: (HolderEnum.code_innerbracket | HolderEnum.text_sizing | HolderEnum.wiki_style | HolderEnum.html_bracket | HolderEnum.text_color | HolderEnum.h1 | HolderEnum.h2 | HolderEnum.h3 | HolderEnum.h4 | HolderEnum.h5 | HolderEnum.h6)[];
    preset: {
        theme: "DARK" | "LIGHT";
        title: string;
        isIncluded: boolean;
    };
    headingLevel: number[];
    includingDocuments: NamuMark[];

    constructor(
        wikiText: string,
        options: {
            theme: "DARK" | "LIGHT";
            title: string;
            isIncluded: boolean;
        } = { theme: "LIGHT", title: "", isIncluded: false },
        includingDocuments: NamuMark[] = []
    ) {
        this.wikiText = wikiText;
        this.htmlArray = [];
        // this.textTokenSyntax = ([] as string[]).concat(...Object.values(this.textToken))
        this.textToken = ["'''", "''", "--", "~~", "__", "^^", ",,"];
        this.wikiStack = [];
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
            heading: false,
            heading_attribute: undefined,
            html_escape: true,
            is_line_start: true,
        };
        this.preset = {
            theme: options.theme,
            title: options.title,
            isIncluded: options.isIncluded
        };
        this.headingLevel = [0, 0, 0, 0, 0, 0];
        this.includingDocuments = includingDocuments;
    }

    parse() {
        if (this.wikiText.startsWith("#redirect")) {
            this.htmlArray.push(new TextTag(this.wikiText, true));
        } else {
            for (let pos = 0; pos < this.wikiText.length; pos++) {
                const now = this.wikiText[pos];
                const headingStartRegex = /^(?:= |== |=== |==== |===== |====== |=# |==# |===# |====# |=====# |======# )/g;
                const headingEndRegex = /^(?: =| ==| ===| ====| =====| ======| #=| #==| #===| #====| #=====| #======)$/g;
                const anchorWithNoArguments = /^\[(clearfix|date|datetime|목차|tableofcontents|각주|footnote|br|pagecount)\]/g;
                const anchorWithArguments = /^\[(anchor|age|dday|math|youtube|kakaotv|niconicovideo|vimeo|navertv|pagecount)\((.+)\)\]/g;

                if (now == "\n") {
                    this.htmlArray.push(new SingularTag(TagEnum.BR));
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
                        heading: false,
                        heading_attribute: undefined,
                    };
                    continue;
                }

                if (headingStartRegex.test(this.wikiText.substring(pos)) && this.flags.is_line_start && this.flags.code == false && this.flags.heading == false) {
                    headingOpenProcessor(this, pos, v => pos = v);
                    continue;
                }

                if (headingEndRegex.test(this.wikiText.substring(pos, seekEOL(this.wikiText, pos))) && this.flags.code == false && this.flags.heading && this.flags.heading_attribute !== undefined) {
                    headingCloseProcessor(this, pos, v => pos = v);
                    this.flags.is_line_start = true;
                    continue;
                }

                if (anchorWithNoArguments.test(this.wikiText.substring(pos)) && this.flags.code == false) {
                    anchorWithNoArguments.lastIndex = 0;
                    const result = Array.from(this.wikiText.substring(pos).matchAll(anchorWithNoArguments))[0];
                    const anchorFull = result[0];
                    const anchorName = result[1];
                    switch (anchorName) {
                        case "clearfix":
                            this.htmlArray.push(new RegularTag(TagEnum.DIV, [], { style: "clear: both;" }));
                            break;
                        case "date":
                        case "datetime":
                            const now = new Date()
                            this.htmlArray.push(new RegularTag(TagEnum.time, [new TextTag(now.toISOString().replace("T", " ").slice(0, -5) + "+0900", true)], {"date-format": "Y-m-d H:i:sO", datetime: now.toISOString()}))
                            break;
                        case "br":
                            this.htmlArray.push(new SingularTag(TagEnum.BR))
                            break;
                        case "pagecount":
                            this.htmlArray.push(new TextTag("0", true));
                            break;
                        default:
                            this.htmlArray.push(new RegularTag(TagEnum.DIV, [], { id: anchorName }));
                            break;
                    }
                    pos += anchorFull.length - 1;
                    continue;
                }

                if (anchorWithArguments.test(this.wikiText.substring(pos)) && this.flags.code == false) {
                    anchorWithArguments.lastIndex = 0;
                    const result = Array.from(this.wikiText.substring(pos).matchAll(anchorWithArguments))[0];
                    const anchorFull = result[0];
                    const anchorName = result[1];
                    const anchorContent = result[2];
                    switch (anchorName) {
                        case "youtube":
                            this.htmlArray.push(new RegularTag(TagEnum.IFRAME, [], { width: "640", height: "360", src: `https://www.youtube.com/embed/${anchorContent}`, title: "YouTube video player", frameborder: "0", allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share", allowfullscreen: "true"}))
                            break;
                        case "pagecount":
                            this.htmlArray.push(new TextTag("0", true));
                            break;
                        case "anchor":
                            this.htmlArray.push(new RegularTag(TagEnum.A, [], {id: (new TextTag(anchorContent, true)).toString()}))
                            break;
                        default:
                            this.htmlArray.push(new RegularTag(TagEnum.DIV, [new TextTag(anchorContent, true)], {id: anchorName}))
                            break;
                    }
                    pos += anchorFull.length - 1;
                    continue;
                }

                if (this.wikiText.substring(pos).startsWith("##") && this.flags.is_line_start) {
                    pos = seekEOL(this.wikiText, pos);
                    this.flags.is_line_start = true;
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
            const idx = this.htmlArray.findLastIndex((v) => v instanceof HolderTag && v.holderEnum === HolderEnum.strong);
            const text: string = (this.htmlArray[idx] as HolderTag).alt;
            this.htmlArray.splice(idx, 1, new TextTag(text, true));
        }
        if (this.flags.strike_underbar) {
            const idx = this.htmlArray.findLastIndex((v) => v instanceof HolderTag && v.holderEnum === HolderEnum.strike_underbar);
            const text: string = (this.htmlArray[idx] as HolderTag).alt;
            this.htmlArray.splice(idx, 1, new TextTag(text, true));
        }
        if (this.flags.strike_wave) {
            const idx = this.htmlArray.findLastIndex((v) => v instanceof HolderTag && v.holderEnum === HolderEnum.strike_wave);
            const text: string = (this.htmlArray[idx] as HolderTag).alt;
            this.htmlArray.splice(idx, 1, new TextTag(text, true));
        }
        if (this.flags.italic) {
            const idx = this.htmlArray.findLastIndex((v) => v instanceof HolderTag && v.holderEnum === HolderEnum.italic);
            const text: string = (this.htmlArray[idx] as HolderTag).alt;
            this.htmlArray.splice(idx, 1, new TextTag(text, true));
        }
        if (this.flags.underline) {
            const idx = this.htmlArray.findLastIndex((v) => v instanceof HolderTag && v.holderEnum === HolderEnum.underline);
            const text: string = (this.htmlArray[idx] as HolderTag).alt;
            this.htmlArray.splice(idx, 1, new TextTag(text, true));
        }
        if (this.flags.superscript) {
            const idx = this.htmlArray.findLastIndex((v) => v instanceof HolderTag && v.holderEnum === HolderEnum.superscript);
            const text: string = (this.htmlArray[idx] as HolderTag).alt;
            this.htmlArray.splice(idx, 1, new TextTag(text, true));
        }
        if (this.flags.subscript) {
            const idx = this.htmlArray.findLastIndex((v) => v instanceof HolderTag && v.holderEnum === HolderEnum.subscript);
            const text: string = (this.htmlArray[idx] as HolderTag).alt;
            this.htmlArray.splice(idx, 1, new TextTag(text, true));
        }
        // texttoken 처리기 - 줄바꿈 시 그전 문법 모두 무효화 (끝)

        // heading 처리기
        if (this.flags.heading) {
            const idx = this.htmlArray.findLastIndex(v => v instanceof HolderTag && v.property.headingLevelAt !== undefined);
            const text: string = (this.htmlArray[idx] as HolderTag).alt;
            this.htmlArray.splice(idx, 1, new TextTag(text, true));
        }

        // code가 줄바꿈 시 <code> -> <pre><code>로 변환
        if (this.flags.code && !isWikiTextEnd && !this.flags.code_multiline) {
            const idx = this.htmlArray.findLastIndex((v) => v instanceof HolderTag && v.holderEnum === HolderEnum.code);
            this.htmlArray.splice(idx, 0, new HolderTag(HolderEnum.code_multiline, ""));
            this.flags.code_multiline = true;
        }

        // wikiText가 끝났을 때 code 문법 무효화
        if (this.flags.code && isWikiTextEnd) {
            const idx = this.htmlArray.findLastIndex((v) => v instanceof HolderTag && v.holderEnum === HolderEnum.code);
            const text: string = (this.htmlArray[idx] as HolderTag).alt;
            this.htmlArray.splice(idx, 1, new TextTag(text, true));
            if (this.flags.code_multiline) {
                const idx_m = this.htmlArray.findLastIndex((v) => v instanceof HolderTag && v.holderEnum === HolderEnum.code_multiline);
                this.htmlArray.splice(idx_m, 1);
            }
        }

        // wikiText가 끝났을 때 각종 bracket 무효화
        if (isWikiTextEnd) {
            for (const elem of Array.from(this.wikiStack).reverse()) {
                const idx = this.htmlArray.findLastIndex((v) => v instanceof HolderTag && v.holderEnum === elem);
                const text: string = (this.htmlArray[idx] as HolderTag).alt;
                this.htmlArray.splice(idx, 1, new TextTag(text, true));
            }
        }
    }

    arrayToHtmlString() {
        const documentStructure = [
            `<!DOCTYPE html>\n<html>\n<head>\n<meta charset="UTF-8">\n<meta http-equiv="X-UA-Compatible" content="IE=edge">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>Document</title>\n<link rel="stylesheet" href="viewStyle.css">\n</head>\n<body>\n<div id="layer-end">\n<div id="layer-start"><article><h1 id="title">${this.preset.title}</h1><div id="category"></div>`,
            "</article></div></div><script type=\"module\" src=\"https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js\"></script></body>\n</html>",
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
