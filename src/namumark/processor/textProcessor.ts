import { NamuMark, HolderEnum, TagEnum, HolderTag, TextTag, RegularTag, SingularTag } from "..";

export function textProcessor(mark: NamuMark, pos: number, setPos: (v: number) => void) {
    const wikiTextSincePos = mark.wikiText.substring(pos);
    const matchedSyntax: string = mark.textToken.find((text) => wikiTextSincePos.startsWith(text)) as string;
    const endProcessor = (holder: HolderEnum, tag: TagEnum) => {
        const idx = mark.htmlArray.findLastIndex(v =>  v instanceof HolderTag && v.holderEnum == holder);
        const property = (mark.htmlArray[idx] as HolderTag).property
        const children = mark.htmlArray.splice(idx);
        mark.htmlArray.push(new RegularTag(tag, children, property))
    }
    const beginProcessor = (holder: HolderEnum) => {
        mark.htmlArray.push(new HolderTag(holder, matchedSyntax));
    }
    let posIncrement: number = 0;
    switch (matchedSyntax) {
        case "'''":
            if (mark.flags.strong) {
                endProcessor(HolderEnum.strong, TagEnum.strong);
                mark.flags.strong = false;
            } else {
                beginProcessor(HolderEnum.strong)
                mark.flags.strong = true;
            }
            posIncrement = 2;
            break;
        case "''":
            if (mark.flags.italic) {
                endProcessor(HolderEnum.italic, TagEnum.italic)
                mark.flags.italic = false;
            } else {
                beginProcessor(HolderEnum.italic)
                mark.flags.italic = true;
            }
            posIncrement = 1;
            break;
        case "--":
            if (mark.flags.strike_underbar) {
                endProcessor(HolderEnum.strike_underbar, TagEnum.strike)
                mark.flags.strike_underbar = false;
            } else {
                beginProcessor(HolderEnum.strike_underbar)
                mark.flags.strike_underbar = true;
            }
            posIncrement = 1;
            break;
        case "~~":
            if (mark.flags.strike_wave) {
                endProcessor(HolderEnum.strike_wave, TagEnum.strike)
                mark.flags.strike_wave = false;
            } else {
                beginProcessor(HolderEnum.strike_wave)
                mark.flags.strike_wave = true;
            }
            posIncrement = 1;
            break;
        case "__":
            if (mark.flags.underline) {
                endProcessor(HolderEnum.underline, TagEnum.underline)
                mark.flags.underline = false;
            } else {
                beginProcessor(HolderEnum.underline)
                mark.flags.underline = true;
            }
            posIncrement = 1;
            break;
        case "^^":
            if (mark.flags.superscript) {
                endProcessor(HolderEnum.superscript, TagEnum.superscript)
                mark.flags.superscript = false;
            } else {
                beginProcessor(HolderEnum.superscript)
                mark.flags.superscript = true;
            }
            posIncrement = 1;
            break;
        case ",,":
            if (mark.flags.subscript) {
                endProcessor(HolderEnum.subscript, TagEnum.subscript)
                mark.flags.subscript = false;
            } else {
                beginProcessor(HolderEnum.subscript)
                mark.flags.subscript = true;
            }
            posIncrement = 1;
            break;
        default:
            break;
    }
    setPos(pos + posIncrement);
    return;
}