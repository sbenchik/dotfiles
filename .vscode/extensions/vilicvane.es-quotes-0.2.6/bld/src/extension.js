"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const parser_1 = require("./parser");
const es_quotes_1 = require("./es-quotes");
const transform_1 = require("./transform");
const CONFIG_DEFAULT_QUOTE = 'esQuotes.defaultQuote';
const quotesCycle = [
    0 /* singleQuoted */,
    1 /* doubleQuoted */,
    2 /* template */
];
function activate() {
    let config = vscode_1.workspace.getConfiguration();
    vscode_1.commands.registerTextEditorCommand('esQuotes.transformToTemplateString', (editor, edit) => {
        let result = es_quotes_1.findActiveStringTargetInEditor(editor);
        let activeTarget = result.target;
        if (!activeTarget) {
            return;
        }
        if (activeTarget.type === 2 /* template */) {
            vscode_1.window.showInformationMessage('The string at selected range is already a template string.');
            return;
        }
        let value = transform_1.transform(activeTarget.body, activeTarget.type, 2 /* template */);
        edit.replace(activeTarget.range, value);
    });
    vscode_1.commands.registerTextEditorCommand('esQuotes.transformToNormalString', (editor, edit) => {
        let result = es_quotes_1.findActiveStringTargetsInEditor(editor);
        let activeTargets = result.targets;
        if (!activeTargets) {
            return;
        }
        let firstTarget = activeTargets[0];
        if (parser_1.isStringBodyTarget(firstTarget) && firstTarget.type !== 2 /* template */) {
            vscode_1.window.showInformationMessage('The string at selected range is already a normal string.');
            return;
        }
        let quote = config.get(CONFIG_DEFAULT_QUOTE);
        if (!/^["']$/.test(quote)) {
            quote = result.defaultQuote;
        }
        let type = quote === '"' ? 1 /* doubleQuoted */ : 0 /* singleQuoted */;
        let editInfos = [];
        let hasNonEmptyStringBody = false;
        for (let i = 0; i < activeTargets.length; i++) {
            let target = activeTargets[i];
            if (parser_1.isStringBodyTarget(target)) {
                if (target.body && !hasNonEmptyStringBody) {
                    hasNonEmptyStringBody = true;
                }
                let value = target.body && transform_1.transform(target.body, 2 /* template */, type);
                if (i > 0) {
                    value = value && ' + ' + value;
                    let previousTarget = activeTargets[i - 1];
                    if (parser_1.isStringGroupTarget(previousTarget)) {
                        if (previousTarget.hasLowPriorityOperator) {
                            value = ')' + value;
                        }
                        if (previousTarget.whitespacesRangeAtEnd && !previousTarget.whitespacesRangeAtEnd.isEmpty) {
                            target.range = new vscode_1.Range(previousTarget.whitespacesRangeAtEnd.start, target.range.end);
                        }
                    }
                }
                if (i < activeTargets.length - 1) {
                    value = value && value + ' + ';
                    let nextTarget = activeTargets[i + 1];
                    if (parser_1.isStringGroupTarget(nextTarget)) {
                        if (nextTarget.hasLowPriorityOperator) {
                            value += '(';
                        }
                        if (nextTarget.whitespacesRangeAtBeginning && !nextTarget.whitespacesRangeAtBeginning.isEmpty) {
                            target.range = new vscode_1.Range(target.range.start, nextTarget.whitespacesRangeAtBeginning.end);
                        }
                    }
                }
                editInfos.push({
                    range: target.range,
                    value
                });
            }
        }
        if (!hasNonEmptyStringBody) {
            let firstEditInfo = editInfos[0];
            let value = quote + quote;
            if (activeTargets.length > 1) {
                value += ' + ' + firstEditInfo.value;
            }
            firstEditInfo.value = value;
        }
        editor
            .edit(edit => {
            for (let editInfo of editInfos) {
                edit.replace(editInfo.range, editInfo.value);
            }
        })
            .then(undefined, reason => {
            console.error(reason);
            vscode_1.window.showInformationMessage('Failed to transform selected template string.');
        });
    });
    vscode_1.commands.registerTextEditorCommand('esQuotes.transformBetweenSingleDoubleQuotes', (editor, edit) => {
        let result = es_quotes_1.findActiveStringTargetInEditor(editor);
        let activeTarget = result.target;
        if (!activeTarget) {
            return;
        }
        if (activeTarget.type === 2 /* template */) {
            vscode_1.window.showInformationMessage('The string at selected range is a template string.');
            return;
        }
        let type = activeTarget.type === 1 /* doubleQuoted */ ? 0 /* singleQuoted */ : 1 /* doubleQuoted */;
        let value = transform_1.transform(activeTarget.body, activeTarget.type, type);
        edit.replace(activeTarget.range, value);
    });
    vscode_1.commands.registerTextEditorCommand('esQuotes.transformBetweenQuotes', (editor, edit) => {
        let result = es_quotes_1.findActiveStringTargetInEditor(editor);
        let activeTarget = result.target;
        if (!activeTarget) {
            return;
        }
        const nextTypeIndex = (quotesCycle.indexOf(activeTarget.type) + 1) % quotesCycle.length;
        let type = quotesCycle[nextTypeIndex];
        let value = transform_1.transform(activeTarget.body, activeTarget.type, type);
        edit.replace(activeTarget.range, value);
    });
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map