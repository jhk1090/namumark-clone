import { NamuMark, HolderEnum, TagEnum, HolderTag, TextTag, RegularTag, SingularTag, TitleTag } from "..";
import seekEOL from "../seekEOL";

export function titleProcessor(mark: NamuMark, pos: number, setPos: (v: number) => void) {
    const titleRegex = /^(?:(=) (.+) =|(==) (.+) ==|(===) (.+) ===|(====) (.+) ====|(=====) (.+) =====|(======) (.+) ======|(=#) (.+) #=|(==#) (.+) #==|(===#) (.+) #===|(====#) (.+) #====|(=====#) (.+) #=====|(======#) (.+) #======)$/g

    titleRegex.lastIndex = 0;
    const result = Array.from(mark.wikiText.substring(pos, seekEOL(mark.wikiText, pos)).matchAll(titleRegex))[0].filter(v => v !== undefined);
    const titleToken = result[1];
    const content = result[2];

    const isFolded = titleToken.endsWith("#")
    let titleType: TagEnum = TagEnum.H1;
    let titleLevelThen: number[] = [];
    let titleLevelAt: number = 0;
    switch (titleToken) {
        case "=":
        case "=#":
            titleType = TagEnum.H1;
            mark.titleLevel[0] += 1;
            titleLevelAt = 0;
            break;
        case "==":
        case "==#":
            titleType = TagEnum.H2;
            mark.titleLevel[1] += 1;
            titleLevelAt = 1;
            break;
        case "===":
        case "===#":
            titleType = TagEnum.H3;
            mark.titleLevel[2] += 1;
            titleLevelAt = 2;
            break;
        case "====":
        case "====#":
            titleType = TagEnum.H4;
            mark.titleLevel[3] += 1;
            titleLevelAt = 3;
            break;
        case "=====":
        case "=====#":
            titleType = TagEnum.H5;
            mark.titleLevel[4] += 1;
            titleLevelAt = 4;
            break;
        case "======":
        case "======#":
            titleType = TagEnum.H6;
            mark.titleLevel[5] += 1;
            titleLevelAt = 5;
            break;
        default:
            break;
    }
    mark.titleLevel.fill(0, titleLevelAt + 1); // title 밑에부분 초기화
    titleLevelThen = Array.from(mark.titleLevel)
    mark.htmlArray.push(new TitleTag(titleType, [new TextTag(content, true)], titleLevelThen, { isFolded: isFolded }))
    setPos(pos + mark.wikiText.substring(pos, seekEOL(mark.wikiText, pos)).length);
}