import { NamuMark } from "./namumark";
import { writeFileSync } from "node:fs";

const mark = new NamuMark("  * hi\n * no")
const parsedText = mark.parse()
writeFileSync("./view.html", parsedText)
