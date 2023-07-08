import { NamuMark, D_tagEnum, D_HTMLTag } from ".."

export function textProcessor(mark: NamuMark, pos: number, setPos: (v: number) => void) {
    const wikiTextSincePos = mark.wikiText.substring(pos);
    const matchedSyntax = mark.textToken.find((text) => wikiTextSincePos.startsWith(text));
    let tag: D_tagEnum = D_tagEnum.holder;
    let posIncrement: number = 0;
    switch (matchedSyntax) {
        case "'''":
            if (mark.flags.strong) {
                tag = D_tagEnum.strong_end;
                mark.flags.strong = false;
            } else {
                tag = D_tagEnum.strong_begin;
                mark.flags.strong = true;
            }
            posIncrement = 2;
            break;
        case "''":
            if (mark.flags.italic) {
                tag = D_tagEnum.italic_end;
                mark.flags.italic = false;
            } else {
                tag = D_tagEnum.italic_begin;
                mark.flags.italic = true;
            }
            posIncrement = 1;
            break;
        case "--":
            if (mark.flags.strike_underbar) {
                tag = D_tagEnum.strike_underbar_end;
                mark.flags.strike_underbar = false;
            } else {
                tag = D_tagEnum.strike_underbar_begin;
                mark.flags.strike_underbar = true;
            }
            posIncrement = 1;
            break;
        case "~~":
            if (mark.flags.strike_wave) {
                tag = D_tagEnum.strike_wave_end;
                mark.flags.strike_wave = false;
            } else {
                tag = D_tagEnum.strike_wave_begin;
                mark.flags.strike_wave = true;
            }
            posIncrement = 1;
            break;
        case "__":
            if (mark.flags.underline) {
                tag = D_tagEnum.underline_end;
                mark.flags.underline = false;
            } else {
                tag = D_tagEnum.underline_begin;
                mark.flags.underline = true;
            }
            posIncrement = 1;
            break;
        case "^^":
            if (mark.flags.superscript) {
                tag = D_tagEnum.superscript_end;
                mark.flags.superscript = false;
            } else {
                tag = D_tagEnum.superscript_begin;
                mark.flags.superscript = true;
            }
            posIncrement = 1;
            break;
        case ",,":
            if (mark.flags.subscript) {
                tag = D_tagEnum.subscript_end;
                mark.flags.subscript = false;
            } else {
                tag = D_tagEnum.subscript_begin;
                mark.flags.subscript = true;
            }
            posIncrement = 1;
            break;
        default:
            break;
    }
    mark.htmlArray.push(new D_HTMLTag(tag, { originalText: matchedSyntax }));
    setPos(pos + posIncrement);
    return;
}