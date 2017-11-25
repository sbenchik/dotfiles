"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
class RangeBuilder {
    constructor(source) {
        let regex = /(.*)(\r?\n|$)/g;
        let indexRanges = [];
        while (true) {
            let groups = regex.exec(source);
            let lineText = groups[1];
            let lineEnding = groups[2];
            let lastIndex = regex.lastIndex - lineEnding.length;
            indexRanges.push({
                start: lastIndex - lineText.length,
                end: lastIndex
            });
            if (!lineEnding.length) {
                break;
            }
        }
        this.indexRanges = indexRanges;
    }
    getPosition(index) {
        let indexRanges = this.indexRanges;
        for (let i = 0; i < indexRanges.length; i++) {
            let indexRange = indexRanges[i];
            if (indexRange.end >= index) {
                if (indexRange.start <= index) {
                    // Within range.
                    return new vscode_1.Position(i, index - indexRange.start);
                }
                else {
                    // End of line?
                    let previousIndexRange = indexRanges[i - 1];
                    return new vscode_1.Position(i, previousIndexRange.end - previousIndexRange.start + 1);
                }
            }
        }
    }
    getRange(startIndex, endIndex) {
        let start = this.getPosition(startIndex);
        let end = this.getPosition(endIndex);
        return new vscode_1.Range(start, end);
    }
}
exports.RangeBuilder = RangeBuilder;
//# sourceMappingURL=range.js.map