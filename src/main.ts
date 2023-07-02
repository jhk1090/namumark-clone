import { NamuMark } from "./namumark";
import { writeFileSync } from "node:fs";

const mark = new NamuMark("\n{{{+2 {{{#!wiki style=\"background-color: red\"  df\n{{{-2 he}}} llo}}}\n{{{+2")
// const mark = new NamuMark('{{{#!wiki style="color: red"\nhi}}}')
const parsedText = mark.parse()

writeFileSync("./view.html", parsedText)

