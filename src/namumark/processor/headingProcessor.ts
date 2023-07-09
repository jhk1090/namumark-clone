import { NamuMark } from "..";
import { TextTag, RegularTag, SingularTag, HolderTag, HolderEnum, TagEnum, HeadingTag } from "../parts";
import seekEOL from "../seekEOL";

export function headingOpenProcessor(mark: NamuMark, pos: number, setPos: (v: number) => void) {
    const headingStartRegex = /^(?:= |== |=== |==== |===== |====== |=# |==# |===# |====# |=====# |======# )/g;
    headingStartRegex.lastIndex = 0;
    const result = Array.from(mark.wikiText.substring(pos).matchAll(headingStartRegex))[0];
    const token = result[0];
    const isFolded = token.endsWith("# ");
    let headingType: HolderEnum = HolderEnum.h1;
    let headingLevelAt: number = 0;
    switch (token) {
        case "= ":
        case "=# ":
            headingType = HolderEnum.h1;
            headingLevelAt = 0;
            break;
        case "== ":
        case "==# ":
            headingType = HolderEnum.h2;
            headingLevelAt = 1;
            break;
        case "=== ":
        case "===# ":
            headingType = HolderEnum.h3;
            headingLevelAt = 2;
            break;
        case "==== ":
        case "====# ":
            headingType = HolderEnum.h4;
            headingLevelAt = 3;
            break;
        case "===== ":
        case "=====# ":
            headingType = HolderEnum.h5;
            headingLevelAt = 4;
            break;
        case "====== ":
        case "======# ":
            headingType = HolderEnum.h6;
            headingLevelAt = 5;
            break;
        default:
            break;
    }
    mark.htmlArray.push(new HolderTag(headingType, token, { headingLevelAt: headingLevelAt}));
    mark.flags.heading = true;
    mark.flags.heading_attribute = {
        headingLevelAt: headingLevelAt,
        isFolded: isFolded
    }
    setPos(pos + token.length - 1);
}

export function headingCloseProcessor(mark: NamuMark, pos: number, setPos: (v: number) => void) {
    const headingEndRegex = /^(?: =| ==| ===| ====| =====| ======| #=| #==| #===| #====| #=====| #======)$/g;
    headingEndRegex.lastIndex = 0;

    const result = Array.from(mark.wikiText.substring(pos,seekEOL(mark.wikiText, pos)).matchAll(headingEndRegex))[0];
    const token = result[0];
    const isFolded = token.startsWith(" #");
    let headingType: TagEnum = TagEnum.H1;
    let headingLevelThen: number[] = [];
    let headingLevelAt: number = 0;
    
    switch (token) {
        case " =":
        case " #=":
            headingType = TagEnum.H1;
            mark.headingLevel[0] += 1;
            headingLevelAt = 0;
            break;
        case " ==":
        case " #==":
            headingType = TagEnum.H2;
            mark.headingLevel[1] += 1;
            headingLevelAt = 1;
            break;
        case " ===":
        case " #===":
            headingType = TagEnum.H3;
            mark.headingLevel[2] += 1;
            headingLevelAt = 2;
            break;
        case " ====":
        case " #====":
            headingType = TagEnum.H4;
            mark.headingLevel[3] += 1;
            headingLevelAt = 3;
            break;
        case " =====":
        case " #=====":
            headingType = TagEnum.H5;
            mark.headingLevel[4] += 1;
            headingLevelAt = 4;
            break;
        case " ======":
        case " #======":
            headingType = TagEnum.H6;
            mark.headingLevel[5] += 1;
            headingLevelAt = 5;
            break;
        default:
            break;
    }
    if (mark.flags.heading_attribute !== undefined && mark.flags.heading_attribute.headingLevelAt == headingLevelAt && mark.flags.heading_attribute.isFolded == isFolded) {
        const idx = mark.htmlArray.findLastIndex(v => v instanceof HolderTag && v.property.headingLevelAt == headingLevelAt);
        mark.htmlArray.splice(idx, 1)
        const children = mark.htmlArray.splice(idx);
        mark.headingLevel.fill(0, headingLevelAt + 1);
        headingLevelThen = Array.from(mark.headingLevel);
        mark.htmlArray.push(new HeadingTag(headingType, children, headingLevelThen, {isFolded: isFolded, class: "heading"}));
    } else {
        const idx = mark.htmlArray.findLastIndex(v => v instanceof HolderTag && v.property.headingLevelAt !== undefined);
        const text: string = (mark.htmlArray[idx] as HolderTag).alt;
        mark.htmlArray.splice(idx, 1, new TextTag(text, true));
        mark.htmlArray.push(new TextTag(token, true));
    }
    mark.flags.heading = false;
    mark.flags.heading_attribute = undefined;
    setPos(seekEOL(mark.wikiText, pos));
}

