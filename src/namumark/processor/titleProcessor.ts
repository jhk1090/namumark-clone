import { NamuMark, D_tagEnum, D_HTMLTag } from ".."
import seekEOL from "../seekEOL";

export function titleProcessor(mark: NamuMark, pos: number, setPos: (v: number) => void) {
    const titleRegex = /^(?:(=) (.+) =|(==) (.+) ==|(===) (.+) ===|(====) (.+) ====|(=====) (.+) =====|(======) (.+) ======|(=#) (.+) #=|(==#) (.+) #==|(===#) (.+) #===|(====#) (.+) #====|(=====#) (.+) #=====|(======#) (.+) #======)$/g

    titleRegex.lastIndex = 0;
    const result = Array.from(mark.wikiText.substring(pos, seekEOL(mark.wikiText, pos)).matchAll(titleRegex))[0].filter(v => v !== undefined);
    const titleToken = result[1];
    const content = result[2];

    const isFolded = titleToken.endsWith("#")
    let titleType: D_tagEnum = D_tagEnum.holder;
    let titleLevelThen: number[] = [];
    let titleLevelAt: number = 0;
    switch (titleToken) {
        case "=":
        case "=#":
            titleType = D_tagEnum.h1;
            mark.titleLevel[0] += 1;
            titleLevelAt = 0
            break;
        case "==":
        case "==#":
            titleType = D_tagEnum.h2;
            mark.titleLevel[1] += 1;
            titleLevelAt = 1
            break;
        case "===":
        case "===#":
            titleType = D_tagEnum.h3;
            mark.titleLevel[2] += 1;
            titleLevelAt = 2
            break;
        case "====":
        case "====#":
            titleType = D_tagEnum.h4;
            mark.titleLevel[3] += 1;
            titleLevelAt = 3
            break;
        case "=====":
        case "=====#":
            titleType = D_tagEnum.h5;
            mark.titleLevel[4] += 1;
            titleLevelAt = 4
            break;
        case "======":
        case "======#":
            titleType = D_tagEnum.h6;
            mark.titleLevel[5] += 1;
            titleLevelAt = 5
            break;
        default:
            break;
    }
    mark.titleLevel.fill(0, titleLevelAt + 1); // title 밑에부분 초기화
    titleLevelThen = Array.from(mark.titleLevel)
    mark.htmlArray.push(new D_HTMLTag(titleType, { isFolded, titleLevelThen, titleLevelAt }, content, { isFolded: JSON.stringify(isFolded) }))
    setPos(pos + mark.wikiText.substring(pos, seekEOL(mark.wikiText, pos)).length);
}