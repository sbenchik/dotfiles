"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const parser_1 = require("./parser");
const supportedLanguages = [
    'javascript',
    'javascriptreact',
    'typescript',
    'typescriptreact',
    'vue'
];
function findActiveStringTarget(targets, selection) {
    for (let target of targets) {
        let partials = target.partials;
        if (partials) {
            let foundTarget = findActiveStringTarget(partials, selection);
            if (foundTarget) {
                return foundTarget;
            }
        }
        else {
            if (target.range.contains(selection)) {
                return target;
            }
        }
    }
    return undefined;
}
exports.findActiveStringTarget = findActiveStringTarget;
function findActiveStringTargets(targets, selection) {
    for (let target of targets) {
        let partials = target.partials;
        if (partials) {
            let foundTargets = findActiveStringTargets(partials, selection);
            if (foundTargets) {
                return foundTargets;
            }
        }
        else {
            if (target.range.contains(selection)) {
                return target.type === 2 /* template */ ?
                    targets : [target];
            }
        }
    }
    return undefined;
}
exports.findActiveStringTargets = findActiveStringTargets;
function findActiveStringTargetInEditor(editor) {
    let document = editor.document;
    let language = document.languageId;
    if (supportedLanguages.indexOf(language) < 0) {
        vscode_1.window.showInformationMessage('Language not supported: ' + language);
        return;
    }
    let source = document.getText();
    let selection = editor.selection;
    let result = parser_1.parse(source);
    let stringTargets = result.stringTargets;
    let activeTarget = findActiveStringTarget(stringTargets, selection);
    if (!activeTarget) {
        vscode_1.window.showInformationMessage('No string found at selected range.');
    }
    return {
        defaultQuote: result.defaultQuote,
        target: activeTarget
    };
}
exports.findActiveStringTargetInEditor = findActiveStringTargetInEditor;
function findActiveStringTargetsInEditor(editor) {
    let document = editor.document;
    let language = document.languageId;
    if (supportedLanguages.indexOf(language) < 0) {
        vscode_1.window.showInformationMessage('Language not supported.');
        return;
    }
    let source = document.getText();
    let selection = editor.selection;
    let result = parser_1.parse(source);
    let stringTargets = result.stringTargets;
    let activeTargets = findActiveStringTargets(stringTargets, selection);
    if (!activeTargets) {
        vscode_1.window.showInformationMessage('No string found at selected range.');
    }
    return {
        defaultQuote: result.defaultQuote,
        targets: activeTargets
    };
}
exports.findActiveStringTargetsInEditor = findActiveStringTargetsInEditor;
//# sourceMappingURL=es-quotes.js.map