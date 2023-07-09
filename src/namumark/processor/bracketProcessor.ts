import { NamuMark } from "..";
import { TextTag, RegularTag, SingularTag, HolderTag, HolderEnum, TagEnum, HeadingTag } from "../parts";
import seekEOL from "../seekEOL";
import hljs from "highlight.js"

export function bracketOpenProcessor(mark: NamuMark, pos: number, setPos: (v: number) => void) {
    if (mark.flags.code == false && mark.flags.html_escape == true) {
        const sizingRegex = /^(\+|-)([1-5])( |\n)/g;
        const wikiStyleRegex = /^#!wiki([^\}]+)?style="(.+)?"([^\}]+)?\n/g;
        const wikiRegex = /^#!wiki([^\}]+)?\n/g;
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
                return "#" + hex;
            }
            return hex;
        };

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

            mark.htmlArray.push(new HolderTag(HolderEnum.text_sizing, `{{{${sign}${size}${separator}`, { class: `size${sign}${size}` }));
            mark.wikiStack.push(HolderEnum.text_sizing);
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
                mark.htmlArray.push(new HolderTag(HolderEnum.text_color, `{{{#${color1}${separator}`, parameter));
                setPos(pos + `{{#${color1}S`.length);
            } else {
                mark.htmlArray.push(new HolderTag(HolderEnum.text_color, `{{{#${color1},#${color2}${separator}`, parameter));
                setPos(pos + `{{#${color1},#${color2}S`.length);
            }
            mark.wikiStack.push(HolderEnum.text_color);
            // {{{#fff,#fff
        } else if (htmlRegex.test(mark.wikiText.substring(pos + 3))) {
            htmlRegex.lastIndex = 0;
            mark.htmlArray.push(new HolderTag(HolderEnum.html_bracket, "{{{#!html"))
            mark.wikiStack.push(HolderEnum.html_bracket);
            // {{{#!html
            mark.flags.html_escape = false;
            setPos(pos + 8);
        } else if (wikiRegex.test(mark.wikiText.substring(pos + 3))) {
            wikiRegex.lastIndex = 0;
            mark.htmlArray.push(
                new HolderTag(HolderEnum.wiki_style, `{{{${mark.wikiText.substring(pos + 3, seekEOL(mark.wikiText, pos + 3) + 1)}`)
            );
            mark.wikiStack.push(HolderEnum.wiki_style);
            setPos(seekEOL(mark.wikiText, pos + 3));
        } else if (wikiStyleRegex.test(mark.wikiText.substring(pos + 3))) {
            wikiStyleRegex.lastIndex = 0;
            let style: string = "";
            for (const match of mark.wikiText.substring(pos + 3).matchAll(wikiStyleRegex)) {
                style = match[2];
            }
            mark.htmlArray.push(
                new HolderTag(HolderEnum.wiki_style, `{{{${mark.wikiText.substring(pos + 3, seekEOL(mark.wikiText, pos + 3) + 1)}`, { style })
            );
            mark.wikiStack.push(HolderEnum.wiki_style);
            setPos(seekEOL(mark.wikiText, pos + 3));
        } else {
            mark.htmlArray.push(new HolderTag(HolderEnum.code, "{{{"));
            mark.flags.code = true;
            setPos(pos + 2);
        }
        return;
    }

    if (mark.flags.code == true || mark.flags.html_escape == false) {
        mark.htmlArray.push(new HolderTag(HolderEnum.code_innerbracket, "{{{"));
        mark.wikiStack.push(HolderEnum.code_innerbracket);
        setPos(pos + 2);
        return;
    }
}

export function bracketCloseProcessor(mark: NamuMark, pos: number, setPos: (v: number) => void) {
    // #!html 상태 또는 code bracket 상태의 innerbracket
    if (
        mark.wikiStack.length !== 0 &&
        mark.wikiStack.at(-1) == HolderEnum.code_innerbracket &&
        (mark.flags.code == true || mark.flags.html_escape == false)
    ) {
        const idx = mark.htmlArray.findLastIndex((v) => v instanceof HolderTag && v.holderEnum == HolderEnum.code_innerbracket);
        mark.htmlArray[idx] = new TextTag("{{{", false);
        mark.htmlArray.push(new TextTag("}}}", false));
        mark.wikiStack.pop();
        setPos(pos + 2);
        return;
    }

    // #!html 상태 그리고 code bracket이 아닌 경우 #!html bracket 닫기
    if (
        mark.wikiStack.length !== 0 &&
        mark.wikiStack.at(-1) == HolderEnum.html_bracket &&
        mark.flags.code == false &&
        mark.flags.html_escape == false
    ) {
        const idx = mark.htmlArray.findLastIndex((v) => v instanceof HolderTag && v.holderEnum == HolderEnum.html_bracket)
        const property = (mark.htmlArray[idx] as HolderTag).property
        mark.htmlArray.splice(idx, 1)
        const children: TextTag[] = mark.htmlArray.splice(idx) as TextTag[]
        for (const child of children) {
            child.escape = false;
        }
        mark.htmlArray.push(new RegularTag(TagEnum.html_bracket, children, property));
        mark.wikiStack.pop();
        mark.flags.html_escape = true;
        setPos(pos + 2);
        return;
    }

    // #!html 상태가 아니고 그리고 code bracket이 아닌 경우 text_sizing bracket 닫기
    if (
        mark.wikiStack.length !== 0 &&
        mark.wikiStack.at(-1) == HolderEnum.text_sizing &&
        mark.flags.code == false &&
        mark.flags.html_escape == true
    ) {
        const idx = mark.htmlArray.findLastIndex((v) => v instanceof HolderTag && v.holderEnum == HolderEnum.text_sizing);
        const property = (mark.htmlArray[idx] as HolderTag).property
        mark.htmlArray.splice(idx, 1)
        const children = mark.htmlArray.splice(idx);
        mark.htmlArray.push(new RegularTag(TagEnum.text_sizing, children, property));
        mark.wikiStack.pop();
        setPos(pos + 2);
        return;
    }

    // #!html 상태가 아니고 그리고 code bracket이 아닌 경우 text_color bracket 닫기
    if (
        mark.wikiStack.length !== 0 &&
        mark.wikiStack.at(-1) == HolderEnum.text_color &&
        mark.flags.code == false &&
        mark.flags.html_escape == true
    ) {
        const idx = mark.htmlArray.findLastIndex((v) => v instanceof HolderTag && v.holderEnum == HolderEnum.text_color);
        const property = (mark.htmlArray[idx] as HolderTag).property
        mark.htmlArray.splice(idx, 1)
        const children = mark.htmlArray.splice(idx);
        mark.htmlArray.push(new RegularTag(TagEnum.text_color, children, property));
        mark.wikiStack.pop();
        setPos(pos + 2);
        return;
    }

    // #!html 상태가 아니고 그리고 code bracket이 아닌 경우 wiki_style bracket 닫기
    if (
        mark.wikiStack.length !== 0 &&
        mark.wikiStack.at(-1) == HolderEnum.wiki_style &&
        mark.flags.code == false &&
        mark.flags.html_escape == true
    ) {
        const idx = mark.htmlArray.findLastIndex((v) => v instanceof HolderTag && v.holderEnum == HolderEnum.wiki_style);
        const property = (mark.htmlArray[idx] as HolderTag).property
        mark.htmlArray.splice(idx, 1)
        const children = mark.htmlArray.splice(idx);
        if (property !== undefined)
            mark.htmlArray.push(new RegularTag(TagEnum.wiki_style, children, property));
        else
            mark.htmlArray.push(new RegularTag(TagEnum.wiki_style, children));
        mark.wikiStack.pop();
        setPos(pos + 2);
        return;
    }

    // #!html 상태가 아니고 그리고 code bracket 상태인 경우 code bracket 닫기
    if (mark.flags.code == true && mark.flags.html_escape == true) {
        const idx = mark.htmlArray.findLastIndex((v) => v instanceof HolderTag && v.holderEnum == HolderEnum.code);
        const property = (mark.htmlArray[idx] as HolderTag).property
        let children = [];
        if (mark.flags.code_multiline) {
            mark.htmlArray.splice(idx - 1, 2)
            children = mark.htmlArray.splice(idx - 1);
        } else {
            mark.htmlArray.splice(idx, 1)
            children = mark.htmlArray.splice(idx);
        }
        let tag: RegularTag = new RegularTag(TagEnum.code, children, property);
        if (mark.flags.code_multiline) {
            tag = new RegularTag(TagEnum.code_multiline, [tag]);
            mark.flags.code_multiline = false;
        }
        mark.htmlArray.push(tag);
        mark.flags.code = false;
        
        const syntaxRegex = /^#!syntax (basic|cpp|csharp|css|erlang|go|java|javascript|json|kotlin|lisp|lua|markdown|objectivec|perl|php|powershell|python|ruby|rust|sh|sql|swift|typescript|xml)(.+)/gs;
        let code_content: string = "";
        for (const child of children) {
            if (child instanceof TextTag) {
                child.escape = false;
                code_content += child.toString();
                child.escape = true;
            }
            if (child instanceof SingularTag && child.tagEnum == TagEnum.BR) {
                code_content += "\n";
            }
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
            let newtag = new RegularTag(TagEnum.code, [new TextTag(converted, false)], property)
            if (tag.tagEnum == TagEnum.code_multiline) {
                mark.htmlArray.splice(-1, 1, new RegularTag(TagEnum.code_multiline, [newtag]))
            } else {
                mark.htmlArray.splice(-1, 1, newtag);
            }
            // converted 결과 -> toBeEscaped: true로 시작, htmlArray [code_begin_idx, code_end_idx]
            // TODO
        }

        setPos(pos + 2);
        return;
    }
}