'use strict';
var vscode = require('vscode');
function activate(context) {
    var disposable1 = vscode.commands.registerTextEditorCommand('extension.embraceParenthesis', function (textEditor, edit) { doSurround(textEditor, edit, '(', ')'); });
    var disposable2 = vscode.commands.registerTextEditorCommand('extension.embraceSquareBrackets', function (textEditor, edit) { doSurround(textEditor, edit, '[', ']'); });
    var disposable3 = vscode.commands.registerTextEditorCommand('extension.embraceCurlyBrackets', function (textEditor, edit) { doSurround(textEditor, edit, '{', '}'); });
    var disposable4 = vscode.commands.registerTextEditorCommand('extension.embraceAngleBrackets', function (textEditor, edit) { doSurround(textEditor, edit, '<', '>'); });
    var disposable5 = vscode.commands.registerTextEditorCommand('extension.embraceSingleQuotes', function (textEditor, edit) { doSurround(textEditor, edit, '\'', '\''); });
    var disposable6 = vscode.commands.registerTextEditorCommand('extension.embraceDoubleQuotes', function (textEditor, edit) { doSurround(textEditor, edit, '\"', '\"'); });
    context.subscriptions.push(disposable1);
    context.subscriptions.push(disposable2);
    context.subscriptions.push(disposable3);
    context.subscriptions.push(disposable4);
    context.subscriptions.push(disposable5);
    context.subscriptions.push(disposable6);
}
exports.activate = activate;
function deactivate() {
}
exports.deactivate = deactivate;
function doSurround(textEditor, edit, insBefore, insAfter) {
    var document = textEditor.document;
    var newSelections = [];
    textEditor.edit(function (editBuilder) {
        textEditor.selections.forEach(function (selection) {
            var adjust = selection.start.line == selection.end.line ? 1 : 0;
            editBuilder.insert(selection.start, insBefore);
            editBuilder.insert(selection.end, insAfter);
            newSelections.push(new vscode.Selection(selection.start.translate(0, 1), selection.end.translate(0, adjust)));
        });
    }).then(function () {
        textEditor.selections;
        textEditor.selections = newSelections;
    });
}
//# sourceMappingURL=extension.js.map