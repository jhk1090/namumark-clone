"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function seekEOL(text, offset = 0) {
    return text.indexOf('\n', offset) == -1 ? text.length : text.indexOf('\n', offset);
}
exports.default = seekEOL;
//# sourceMappingURL=seekEOL.js.map