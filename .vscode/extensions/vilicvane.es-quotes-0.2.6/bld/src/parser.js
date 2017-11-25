"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const range_1 = require("./range");
const parsingRegex = /(\/\*[\s\S]*?(?:\*\/|$)|\/\/.*\r?\n)|(["'])((?:\\(?:\r\n|[^])|(?!\2|\\).)*)(\2)?|\/(?:\\.|\[(?:\\.|[^\]\\\r\n])*\]?|[^\\\/\r\n])+\/|(`)|([()\[\]{}])|([?&|+-]|&&|\|\||<<<?|>>>?)|(\s+)|[^]/g;
const templateStringRegex = /([`}])((?:\\[^]|(?!\$\{)[^`])*)(`|\$\{)?/g; // This comment is to fix highlighting: `
const bracketConsumptionPair = {
    '}': '{',
    ']': '[',
    ')': '('
};
function parse(source) {
    let rangeBuilder = new range_1.RangeBuilder(source);
    let rootStringTargets = [];
    let nestedStringTargetStack = [];
    let currentGroupTarget;
    let currentStringTargets = rootStringTargets;
    let currentBracketStack;
    let isNewGroupTarget;
    let groups;
    let doubleQuotedCount = 0;
    let singleQuotedCount = 0;
    while (groups = parsingRegex.exec(source)) {
        let text = groups[0];
        isNewGroupTarget = false;
        if (groups[1 /* comment */]) {
            // Do nothing.
        }
        else if (groups[2 /* quote */]) {
            let quote = groups[2 /* quote */];
            let body = groups[3 /* stringBody */];
            let range = rangeBuilder.getRange(parsingRegex.lastIndex - text.length, parsingRegex.lastIndex);
            // TODO:
            // if (currentBracketStack && currentBracketStack.length) {
            //     pushNestedTargetStack();
            // }
            let type;
            if (quote === '"') {
                type = 1 /* doubleQuoted */;
                doubleQuotedCount++;
            }
            else {
                type = 0 /* singleQuoted */;
                singleQuotedCount++;
            }
            let target = {
                body,
                range,
                opening: quote,
                closing: quote,
                type
            };
            currentStringTargets.push(target);
        }
        else if (groups[5 /* templateStringQuote */] || (nestedStringTargetStack.length &&
            currentBracketStack.indexOf('{') < 0 &&
            groups[6 /* bracket */] === '}')) {
            if (groups[5 /* templateStringQuote */]) {
                // `abc${123}def`
                // ^
                pushNestedTargetStack();
            }
            else {
                // `abc${123}def`
                //          ^
                popNestedTargetStack();
            }
            templateStringRegex.lastIndex = parsingRegex.lastIndex - groups[0].length;
            // The match below should always success.
            let templateStringGroups = templateStringRegex.exec(source);
            let templateStringText = templateStringGroups[0];
            parsingRegex.lastIndex = templateStringRegex.lastIndex;
            let body = templateStringGroups[2 /* stringBody */];
            let range = rangeBuilder.getRange(templateStringRegex.lastIndex - templateStringText.length, templateStringRegex.lastIndex);
            let openingQuote = templateStringGroups[1 /* quote */];
            let closingQuote = templateStringGroups[3 /* closingQuote */] || '`';
            let target = {
                body,
                range,
                opening: openingQuote,
                closing: closingQuote,
                type: 2 /* template */
            };
            currentStringTargets.push(target);
            if (closingQuote === '${') {
                // `abc${123}def`
                //     ^
                pushNestedTargetStack();
            }
            else {
                // `abc${123}def`
                //              ^
                popNestedTargetStack();
            }
        }
        else if (currentBracketStack) {
            if (groups[6 /* bracket */]) {
                let bracket = groups[6 /* bracket */];
                if (bracket in bracketConsumptionPair) {
                    let bra = bracketConsumptionPair[bracket];
                    if (currentBracketStack.length && bra === currentBracketStack[currentBracketStack.length - 1]) {
                        currentBracketStack.pop();
                    }
                    else {
                        // Otherwise there might be some syntax error, but we don't really care.
                        console.warn(`Mismatched right bracket "${bracket}".`);
                    }
                }
                else {
                    currentBracketStack.push(bracket);
                }
            }
            else if (!currentBracketStack.length && groups[7 /* operator */]) {
                currentGroupTarget.hasLowPriorityOperator = true;
            }
        }
        if (currentGroupTarget) {
            if (groups[8 /* whitespace */]) {
                let range = rangeBuilder.getRange(parsingRegex.lastIndex - text.length, parsingRegex.lastIndex);
                if (currentGroupTarget.whitespacesRangeAtBeginning instanceof vscode_1.Range) {
                    currentGroupTarget.whitespacesRangeAtEnd = range;
                }
                else {
                    currentGroupTarget.whitespacesRangeAtBeginning = range;
                }
            }
            else if (!isNewGroupTarget) {
                if (currentGroupTarget.whitespacesRangeAtBeginning instanceof vscode_1.Range) {
                    let start = rangeBuilder.getPosition(parsingRegex.lastIndex);
                    let range = new vscode_1.Range(start, start);
                    currentGroupTarget.whitespacesRangeAtEnd = range;
                }
                else {
                    let end = rangeBuilder.getPosition(parsingRegex.lastIndex - text.length);
                    let range = new vscode_1.Range(end, end);
                    currentGroupTarget.whitespacesRangeAtBeginning = range;
                }
            }
        }
    }
    finalizeTargets(rootStringTargets);
    return {
        defaultQuote: singleQuotedCount < doubleQuotedCount ? '"' : "'",
        stringTargets: rootStringTargets
    };
    function pushNestedTargetStack() {
        let target = {
            partials: [],
            bracketStack: [],
            hasLowPriorityOperator: false,
            whitespacesRangeAtBeginning: undefined,
            whitespacesRangeAtEnd: undefined
        };
        currentStringTargets.push(target);
        currentGroupTarget = target;
        currentStringTargets = target.partials;
        currentBracketStack = target.bracketStack;
        nestedStringTargetStack.push(target);
        isNewGroupTarget = true;
    }
    function popNestedTargetStack() {
        nestedStringTargetStack.pop();
        let lastIndex = nestedStringTargetStack.length - 1;
        if (lastIndex < 0) {
            currentGroupTarget = undefined;
            currentStringTargets = rootStringTargets;
            currentBracketStack = undefined;
        }
        else {
            let target = nestedStringTargetStack[lastIndex];
            currentGroupTarget = target;
            currentStringTargets = target.partials;
            currentBracketStack = target.bracketStack;
        }
    }
    function finalizeTargets(targets) {
        for (let i = 0; i < targets.length; i++) {
            let target = targets[i];
            if (target.partials) {
                delete target.bracketStack;
                finalizeTargets(target.partials);
            }
        }
    }
}
exports.parse = parse;
function isStringGroupTarget(target) {
    return !!target.partials;
}
exports.isStringGroupTarget = isStringGroupTarget;
function isStringBodyTarget(target) {
    return !target.partials;
}
exports.isStringBodyTarget = isStringBodyTarget;
//# sourceMappingURL=parser.js.map