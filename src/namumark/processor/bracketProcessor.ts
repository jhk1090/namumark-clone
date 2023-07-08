import { NamuMark, D_tagEnum, D_HTMLTag } from "..";
import seekEOL from "../seekEOL";
import hljs from "highlight.js"

export function bracketOpenProcessor(mark: NamuMark, pos: number, setPos: (v: number) => void) {
    if (mark.flags.code == false && mark.flags.html_escape == true) {
        const sizingRegex = /^(\+|-)([1-5])( |\n)/g;
        const wikiStyleRegex = /^#!wiki style="(.+)?"([^\}]+)?\n/g;
        const htmlRegex = /^#!html/g;
        const cssColor =
            "black|gray|grey|silver|white|red|maroon|yellow|olive|lime|green|aqua|cyan|teal|blue|navy|magenta|fuchsia|purple|dimgray|dimgrey|darkgray|darkgrey|lightgray|lightgrey|gainsboro|whitesmoke|brown|darkred|firebrick|indianred|lightcoral|rosybrown|snow|mistyrose|salmon|tomato|darksalmon|coral|orangered|lightsalmon|sienna|seashell|chocolate|saddlebrown|sandybrown|peachpuff|peru|linen|bisque|darkorange|burlywood|anaatiquewhite|tan|navajowhite|blanchedalmond|papayawhip|moccasin|orange|wheat|oldlace|floralwhite|darkgoldenrod|goldenrod|cornsilk|gold|khaki|lemonchiffon|palegoldenrod|darkkhaki|beige|ivory|lightgoldenrodyellow|lightyellow|olivedrab|yellowgreen|darkolivegreen|greenyellow|chartreuse|lawngreen|darkgreen|darkseagreen|forestgreen|honeydew|lightgreen|limegreen|palegreen|seagreen|mediumseagreen|springgreen|mintcream|mediumspringgreen|mediumaquamarine|aquamarine|turquoise|lightseagreen|mediumturquoise|azure|darkcyan|darkslategray|darkslategrey|lightcyan|paleturquoise|darkturquoise|cadetblue|powderblue|lightblue|deepskyblue|skyblue|lightskyblue|steelblue|aliceblue|dodgerblue|lightslategray|lightslategrey|slategray|slategrey|lightsteelblue|comflowerblue|royalblue|darkblue|ghostwhite|lavender|mediumblue|midnightblue|slateblue|darkslateblue|mediumslateblue|mediumpurple|rebeccapurple|blueviolet|indigo|darkorchid|darkviolet|mediumorchid|darkmagenta|plum|thistle|violet|orchid|mediumvioletred|deeppink|hotpink|lavenderblush|palevioletred|crimson|pink|lightpink";
        const hexCode = "(?:[0-9a-fA-F]{3}){1,2}";
        const hexCodeRegex = /(?:[0-9a-fA-F]{3}){1,2}/g;
        const textColorRegex = new RegExp(`^#(${cssColor}|${hexCode})(?:\,#(${cssColor}|${hexCode}))?( |\n)`, "g");
        const hexCodeConvert = (hex: string) => {
            const result = hexCodeRegex.test(hex);
            hexCodeRegex.lastIndex = 0;
            if (result) {
                return "#" + hex
            }
            return hex
        }

        if (sizingRegex.test(mark.wikiText.substring(pos + 3))) {
            sizingRegex.lastIndex = 0;
            let size: string = "";
            let sign: string = "";
            let separator = undefined;
            for (const match of mark.wikiText.substring(pos + 3).matchAll(sizingRegex)) {
                sign = match[1];
                size = match[2];
                separator = match[3];
            }
            if (separator == "\n") {
                separator = "<br/>";
            }
            mark.htmlArray.push(
                new D_HTMLTag(D_tagEnum.text_sizing_begin, { originalText: `{{{${sign}${size}${separator}`, isBracketClosed: false }, undefined, {
                    class: "size" + sign + size,
                })
            );
            mark.bracketStack.push(D_tagEnum.text_sizing_begin);
            setPos(pos + `{{${sign}${size}S`.length);
        } else if (textColorRegex.test(mark.wikiText.substring(pos + 3))) {
            textColorRegex.lastIndex = 0;
            let color1 = undefined;
            let color2 = undefined;
            let separator = undefined;
            for (const match of mark.wikiText.substring(pos + 3).matchAll(textColorRegex)) {
                color1 = match[1];
                color2 = match[2];
                separator = match[3];
            }
            if (separator == "\n") {
                separator = "<br/>";
            }

            let parameter = {};
            //테마에 따른 color style
            if (color2 == undefined && color1 !== undefined) {
                parameter = { style: `color: ${hexCodeConvert(color1)}` };
            }
            if (color2 !== undefined && color1 !== undefined) {
                if (mark.preset.theme == "DARK") {
                    parameter = { style: `color: ${hexCodeConvert(color2)}` };
                } else {
                    parameter = { style: `color: ${hexCodeConvert(color1)}` };
                }
            }

            if (color2 == undefined) {
                mark.htmlArray.push(
                    new D_HTMLTag(
                        D_tagEnum.text_color_begin,
                        { originalText: `{{{#${color1}${separator}`, isBracketClosed: false, color: [color1, color2] },
                        undefined,
                        parameter
                    )
                );
                setPos(pos + `{{#${color1}S`.length);
            } else {
                mark.htmlArray.push(
                    new D_HTMLTag(
                        D_tagEnum.text_color_begin,
                        { originalText: `{{{#${color1},#${color2}${separator}`, isBracketClosed: false, color: [color1, color2] },
                        undefined,
                        parameter
                    )
                );
                setPos(pos + `{{#${color1},#${color2}S`.length);
            }
            mark.bracketStack.push(D_tagEnum.text_color_begin);
            // {{{#fff,#fff
        } else if (htmlRegex.test(mark.wikiText.substring(pos + 3))) {
            htmlRegex.lastIndex = 0;
            mark.htmlArray.push(new D_HTMLTag(D_tagEnum.html_bracket_begin, { originalText: "{{{#!html", isBracketClosed: false }));
            mark.bracketStack.push(D_tagEnum.html_bracket_begin);
            // {{{#!html
            mark.flags.html_escape = false;
            setPos(pos + 8);
        } else if (wikiStyleRegex.test(mark.wikiText.substring(pos + 3))) {
            wikiStyleRegex.lastIndex = 0;
            let style: string = "";
            for (const match of mark.wikiText.substring(pos + 3).matchAll(wikiStyleRegex)) {
                style = match[1];
            }
            mark.htmlArray.push(
                new D_HTMLTag(
                    D_tagEnum.wiki_style_begin,
                    { originalText: "{{{" + mark.wikiText.substring(pos + 3, seekEOL(mark.wikiText, pos + 3) + 1), isBracketClosed: false },
                    undefined,
                    { style }
                )
            );
            mark.bracketStack.push(D_tagEnum.wiki_style_begin);
            setPos(seekEOL(mark.wikiText, pos + 3));
        } else {
            mark.htmlArray.push(new D_HTMLTag(D_tagEnum.code_begin, { originalText: "{{{" }));
            mark.flags.code = true;
            setPos(pos + 2);
        }
        return;
    }

    if (mark.flags.code == true || mark.flags.html_escape == false) {
        mark.htmlArray.push(new D_HTMLTag(D_tagEnum.code_innerbracket_begin, { originalText: "{{{", isBracketClosed: false }));
        mark.bracketStack.push(D_tagEnum.code_innerbracket_begin);
        setPos(pos + 2);
        return;
    }
}

export function bracketCloseProcessor(mark: NamuMark, pos: number, setPos: (v: number) => void) {
    // #!html 상태 또는 code bracket 상태의 innerbracket
    if (
        mark.bracketStack.length !== 0 &&
        mark.bracketStack.at(-1) == D_tagEnum.code_innerbracket_begin &&
        (mark.flags.code == true || mark.flags.html_escape == false)
    ) {
        const idx = mark.htmlArray.findLastIndex((v) => v.tagEnum == D_tagEnum.code_innerbracket_begin && v.property.isBracketClosed == false);
        mark.htmlArray[idx].property.isBracketClosed = true;
        mark.htmlArray.push(new D_HTMLTag(D_tagEnum.code_innerbracket_end, { originalText: "}}}" }));
        mark.bracketStack.pop();
        setPos(pos + 2);
        return;
    }

    // #!html 상태 그리고 code bracket이 아닌 경우 #!html bracket 닫기
    if (
        mark.bracketStack.length !== 0 &&
        mark.bracketStack.at(-1) == D_tagEnum.html_bracket_begin &&
        mark.flags.code == false &&
        mark.flags.html_escape == false
    ) {
        const idx = mark.htmlArray.findLastIndex((v) => v.tagEnum == D_tagEnum.html_bracket_begin && v.property.isBracketClosed == false);
        mark.htmlArray[idx].property.isBracketClosed = true;
        mark.htmlArray.push(new D_HTMLTag(D_tagEnum.html_bracket_end, { originalText: "}}}" }));
        mark.bracketStack.pop();
        mark.flags.html_escape = true;
        setPos(pos + 2);
        return;
    }

    // #!html 상태가 아니고 그리고 code bracket이 아닌 경우 text_sizing bracket 닫기
    if (
        mark.bracketStack.length !== 0 &&
        mark.bracketStack.at(-1) == D_tagEnum.text_sizing_begin &&
        mark.flags.code == false &&
        mark.flags.html_escape == true
    ) {
        const idx = mark.htmlArray.findLastIndex((v) => v.tagEnum == D_tagEnum.text_sizing_begin && v.property.isBracketClosed == false);
        mark.htmlArray[idx].property.isBracketClosed = true;
        mark.htmlArray.push(new D_HTMLTag(D_tagEnum.text_sizing_end, { originalText: "}}}" }));
        mark.bracketStack.pop();
        setPos(pos + 2);
        return;
    }

    // #!html 상태가 아니고 그리고 code bracket이 아닌 경우 text_color bracket 닫기
    if (
        mark.bracketStack.length !== 0 &&
        mark.bracketStack.at(-1) == D_tagEnum.text_color_begin &&
        mark.flags.code == false &&
        mark.flags.html_escape == true
    ) {
        const idx = mark.htmlArray.findLastIndex((v) => v.tagEnum == D_tagEnum.text_color_begin && v.property.isBracketClosed == false);
        mark.htmlArray[idx].property.isBracketClosed = true;
        mark.htmlArray.push(new D_HTMLTag(D_tagEnum.text_color_end, { originalText: "}}}" }));
        mark.bracketStack.pop();
        setPos(pos + 2);
        return;
    }

    // #!html 상태가 아니고 그리고 code bracket이 아닌 경우 wiki_style bracket 닫기
    if (
        mark.bracketStack.length !== 0 &&
        mark.bracketStack.at(-1) == D_tagEnum.wiki_style_begin &&
        mark.flags.code == false &&
        mark.flags.html_escape == true
    ) {
        const idx = mark.htmlArray.findLastIndex((v) => v.tagEnum == D_tagEnum.wiki_style_begin && v.property.isBracketClosed == false);
        mark.htmlArray[idx].property.isBracketClosed = true;
        mark.htmlArray.push(new D_HTMLTag(D_tagEnum.wiki_style_end, { originalText: "}}}" }));
        mark.bracketStack.pop();
        setPos(pos + 2);
        return;
    }

    // #!html 상태가 아니고 그리고 code bracket 상태인 경우 code bracket 닫기
    if (mark.flags.code == true && mark.flags.html_escape == true) {
        mark.htmlArray.push(new D_HTMLTag(D_tagEnum.code_end, { originalText: "}}}" }));
        mark.flags.code = false;
        if (mark.flags.code_multiline) {
            mark.htmlArray.push(new D_HTMLTag(D_tagEnum.code_multiline_end));
            mark.flags.code_multiline = false;
        }
        
        const syntaxRegex = /^#!syntax (basic|cpp|csharp|css|erlang|go|java|javascript|json|kotlin|lisp|lua|markdown|objectivec|perl|php|powershell|python|ruby|rust|sh|sql|swift|typescript|xml)(.+)/gs;
        const code_begin_idx = mark.htmlArray.findLastIndex((v) => v.tagEnum == D_tagEnum.code_begin);
        const code_end_idx = mark.htmlArray.findLastIndex((v) => v.tagEnum == D_tagEnum.code_end);
        let code_array = mark.htmlArray.slice(code_begin_idx, code_end_idx + 1);
        code_array.splice(0, 1);
        code_array.splice(-1);
        let code_content: string = "";
        for (const value of code_array) {
            code_content += value.toString(false, false);
        }

        if (syntaxRegex.test(code_content)) {
            syntaxRegex.lastIndex = 0;
            let language = "";
            let content = "";
            let converted = "";
            for (const match of code_content.matchAll(syntaxRegex)) {
                language = match[1]
                content = match[2];
            }
            converted = hljs.highlight(content, {language}).value
            mark.htmlArray.splice(code_begin_idx + 1, code_array.length, new D_HTMLTag(D_tagEnum.text, {toBeEscaped: false}, converted))
            // converted 결과 -> toBeEscaped: true로 시작, htmlArray [code_begin_idx, code_end_idx]
            // TODO
        }

        setPos(pos + 2);
        return;
    }
}