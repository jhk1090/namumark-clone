import { NamuMark, tagEnum, HTMLTag } from ".."

export function textProcessor(mark: NamuMark, pos: number, setPos: (v: number) => void) {
    const wikiTextSincePos = mark.wikiText.substring(pos);
    const matchedSyntax = mark.textToken.find((text) => wikiTextSincePos.startsWith(text));
    let tag: tagEnum = tagEnum.holder;
    let posIncrement: number = 0;
    switch (matchedSyntax) {
        case "'''":
            if (mark.flags.strong) {
                tag = tagEnum.strong_end;
                mark.flags.strong = false;
            } else {
                tag = tagEnum.strong_begin;
                mark.flags.strong = true;
            }
            posIncrement = 2;
            break;
        case "''":
            if (mark.flags.italic) {
                tag = tagEnum.italic_end;
                mark.flags.italic = false;
            } else {
                tag = tagEnum.italic_begin;
                mark.flags.italic = true;
            }
            posIncrement = 1;
            break;
        case "--":
            if (mark.flags.strike_underbar) {
                tag = tagEnum.strike_underbar_end;
                mark.flags.strike_underbar = false;
            } else {
                tag = tagEnum.strike_underbar_begin;
                mark.flags.strike_underbar = true;
            }
            posIncrement = 1;
            break;
        case "~~":
            if (mark.flags.strike_wave) {
                tag = tagEnum.strike_wave_end;
                mark.flags.strike_wave = false;
            } else {
                tag = tagEnum.strike_wave_begin;
                mark.flags.strike_wave = true;
            }
            posIncrement = 1;
            break;
        case "__":
            if (mark.flags.underline) {
                tag = tagEnum.underline_end;
                mark.flags.underline = false;
            } else {
                tag = tagEnum.underline_begin;
                mark.flags.underline = true;
            }
            posIncrement = 1;
            break;
        case "^^":
            if (mark.flags.superscript) {
                tag = tagEnum.superscript_end;
                mark.flags.superscript = false;
            } else {
                tag = tagEnum.superscript_begin;
                mark.flags.superscript = true;
            }
            posIncrement = 1;
            break;
        case ",,":
            if (mark.flags.subscript) {
                tag = tagEnum.subscript_end;
                mark.flags.subscript = false;
            } else {
                tag = tagEnum.subscript_begin;
                mark.flags.subscript = true;
            }
            posIncrement = 1;
            break;
        default:
            break;
    }
    mark.htmlArray.push(new HTMLTag(tag, { originalText: matchedSyntax }));
    setPos(pos + posIncrement);
    return;
}