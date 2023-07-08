import { NamuMark } from "./namumark";
import { writeFileSync } from "node:fs";

const text = ""
const mark = new NamuMark(text, {theme: "LIGHT", title: "테스트"})
const parsedText = mark.parse()

writeFileSync("./view.html", parsedText)