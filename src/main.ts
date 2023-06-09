import { NamuMark } from "./namumark";
import { writeFileSync } from "node:fs";

const mark = new NamuMark("\n * 리스트 1\n  * 리스트 1.1\n * 리스트 2\n  * 리스트 2.1\n   * 리스트 2.1.1\n     * 리스트 2\n  * 리스트 2.1\n   * 리스트 2.1.1\n     * 리스트 2\n  * 리스트 2.1\n   * 리스트 2.1.1\n  * 리스트 2\n  * 리스트 2.1\n   * 리스트 2.1.1")
const parsedText = mark.parse()

writeFileSync("./view.html", parsedText)

