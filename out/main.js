"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const namumark_1 = require("./namumark");
const node_fs_1 = require("node:fs");
const mark = new namumark_1.NamuMark("  * hi\n * no");
const parsedText = mark.parse();
(0, node_fs_1.writeFileSync)("./view.html", parsedText);
//# sourceMappingURL=main.js.map