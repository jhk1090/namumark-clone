import { NamuMark } from "./namumark";
import { writeFileSync } from "node:fs";

const text = "==== [[C++]] 구현 ====\n{{{#!syntax cpp\n#include <functional>\n#include <iostream>\n\nusing namespace std;\n\nint increase(int);\nint apply(function<int(int)>, int);\n\nint main(int argc, char **argv)\n{\n\tcout << apply(increase, 9) << endl; // 10\n\n\treturn 0;\n}\n\nint increase(int value)\n{\n\treturn value + 1;\n}\n\nint apply(function<int(int)> fx, int value)\n{\n\treturn fx(value);\n}\n}}}\n\n"
const mark = new NamuMark(text, {theme: "LIGHT", title: "테스트"})
const parsedText = mark.parse()

writeFileSync("./view.html", parsedText)	
