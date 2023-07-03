import { NamuMark } from "./namumark";
import { writeFileSync } from "node:fs";

const text = '=== 텍스트 배경 색상 ===\n{{{#red \'\'\'주의\'\'\'}}}: 정식 문법이 아니며 지원 중단 가능성이 있는 비권장 문법입니다.\n\n{{{ {{{#!html <span style="background-color: #배경색">서술할 내용</span>}}} }}}\n\n아래 표의 예시는 비교를 위하여 원본과 3배본을 함께 서술하였습니다.\n||{{{{{{#!html <span style="background-color: #999">배경색 적용</span>}}}}}}\n글자가 있는 부분(공백 포함)에만 배경색이 적용됩니다.\n||<bgcolor=#ffffff> {{{#!html <span style="background-color: #999">배경색 적용</span>}}} {{{#!html <span style="background-color: #999; font-weight:700; font-size:300%">배경색 적용</span>}}} ||\n[[틀:글배경]], [[틀:글배경b]], [[틀:글배경r]], [[틀:글배경br]]을 이용할 수도 있습니다.\n\n'

const mark = new NamuMark(text)
// const mark = new NamuMark('{{{#!wiki style="color: red"\nhi}}}')
const parsedText = mark.parse()

writeFileSync("./view.html", parsedText)	
