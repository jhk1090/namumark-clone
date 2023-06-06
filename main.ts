import { NamuMark } from "./namumark";
import { writeFileSync } from "node:fs";

const mark = new NamuMark(" * hi\n  * hi")
const parsedText = mark.parse()
writeFileSync("./view.html", parsedText)


