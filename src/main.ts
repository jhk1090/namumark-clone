import { NamuMark } from "./namumark";
import { writeFileSync } from "node:fs";

const mark = new NamuMark("\n{{{+2 {{{-2 he}}}llo}}}\n{{{+2 ")
const parsedText = mark.parse()

writeFileSync("./view.html", parsedText)

