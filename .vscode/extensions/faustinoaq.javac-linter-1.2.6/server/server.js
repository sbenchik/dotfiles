/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var vscode_languageserver_1 = require("vscode-languageserver");
// Create a connection for the server. The connection uses Node's IPC as a transport
var connection = vscode_languageserver_1.createConnection(new vscode_languageserver_1.IPCMessageReader(process), new vscode_languageserver_1.IPCMessageWriter(process));
// Create a simple text document manager. The text document manager
// supports full document sync only
var documents = new vscode_languageserver_1.TextDocuments();
// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);
// After the server has started the client sends an initilize request. The server receives
// in the passed params the rootPath of the workspace plus the client capabilites. 
var workspaceRoot;
connection.onInitialize(function (params) {
    workspaceRoot = params.rootPath;
    return {
        capabilities: {
            // Tell the client that the server works in FULL text document sync mode
            textDocumentSync: documents.syncKind
            // Tell the client that the server support code complete
            // completionProvider: {
            // 	resolveProvider: true
            // }
        }
    };
});
// Limit the amount of processes executed at same time
var Javac = (function () {
    function Javac() {
    }
    Javac.limit = function () {
        return 3;
    };
    return Javac;
}());
Javac.processes = 0;
// hold the maxNumberOfProblems setting
var maxNumberOfProblems;
var classpath;
var enable;
var javac;
// The settings have changed. Is send on server activation
// as well.
connection.onDidChangeConfiguration(function (change) {
    var settings = change.settings;
    maxNumberOfProblems = settings["javac-linter"].maxNumberOfProblems || 20;
    classpath = settings["javac-linter"].classpath;
    if (classpath.length == 0) {
        classpath = [workspaceRoot];
    }
    enable = settings["javac-linter"].enable;
    javac = settings["javac-linter"].javac || 'javac';
    // Revalidate any open text documents
    documents.all().forEach(validateJavaCode);
});
function convertUriToPath(uri) {
    return decodeURI(uri.replace("file://", ""));
}
function validateJavaCode(javaCode) {
    if (Javac.processes < Javac.limit()) {
        Javac.processes += 1;
        var exec_1 = require('child_process').exec;
        // First check if javac exist then validate sources
        exec_1("\"" + javac + "\" -version", function (err, stderr, stdout) {
            if ((stdout.split(' ')[0] == 'javac')) {
                var diagnostics_1 = [];
                var os = require('os');
                var cp = classpath.join(":");
                var filepath = convertUriToPath(javaCode.uri);
                if (os.platform() == 'win32') {
                    cp = classpath.join(";");
                    filepath = filepath.substr(1).replace(/%3A/g, ':').replace(/\//g, '\\');
                }
                var cmd = "\"" + javac + "\" -Xlint:unchecked -g -d \"" + classpath[0] + "\" -cp \"" + cp + "\" \"" + filepath + "\"";
                console.log(cmd);
                exec_1(cmd, function (err, stderr, stdout) {
                    if (stdout) {
                        console.log(stdout);
                        var firstMsg = stdout.split(':')[1].trim();
                        if (firstMsg == "directory not found" ||
                            firstMsg == "invalid flag") {
                            console.error(firstMsg);
                            return;
                        }
                        var errors = stdout.split(filepath);
                        var lines = [];
                        var problemsCount = 0;
                        errors.forEach(function (element) {
                            lines.push(element.split('\n'));
                        });
                        lines.every(function (element) {
                            if (element.length > 2) {
                                problemsCount++;
                                if (problemsCount > maxNumberOfProblems) {
                                    return false;
                                }
                                var firstLine = element[0].split(':');
                                var line = parseInt(firstLine[1]) - 1;
                                var severity = firstLine[2].trim();
                                var column = element[2].length - 1;
                                var message = firstLine[3].trim();
                                diagnostics_1.push({
                                    severity: severity == "error" ? 1 /* Error */ : 2 /* Warning */,
                                    range: {
                                        start: { line: line, character: column },
                                        end: { line: line, character: column }
                                    },
                                    message: message,
                                    source: 'javac'
                                });
                            }
                            return true;
                        });
                    }
                    // Send the computed diagnostics to VSCode.
                    connection.sendDiagnostics({ uri: javaCode.uri, diagnostics: diagnostics_1 });
                    Javac.processes -= 1;
                });
            }
            else {
                console.log("javac is not avaliable, check javac-linter on settings.json");
            }
        });
    }
}
// Check Java code when file is opened
connection.onDidOpenTextDocument(function (change) {
    if (enable) {
        validateJavaCode(change.textDocument);
    }
});
connection.onDidChangeWatchedFiles(function (change) {
    if (enable) {
        // Remove duplicates files in changes
        var changes = change.changes.filter(function (item, pos, self) {
            return self.indexOf(item) == pos;
        });
        changes.forEach(validateJavaCode);
    }
});
/*

TODO: completions

// This handler provides the initial list of the completion items.
connection.onCompletion((textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
    // The pass parameter contains the position of the text document in
    // which code complete got requested. For the example we ignore this
    // info and always provide the same completion items.
    return [
        {
            label: 'TypeScript',
            kind: CompletionItemKind.Text,
            data: 1
        },
        {
            label: 'JavaScript',
            kind: CompletionItemKind.Text,
            data: 2
        }
    ]
});

// This handler resolve additional information for the item selected in
// the completion list.
connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
    if (item.data === 1) {
        item.detail = 'TypeScript details',
        item.documentation = 'TypeScript documentation'
    } else if (item.data === 2) {
        item.detail = 'JavaScript details',
        item.documentation = 'JavaScript documentation'
    }
    return item;
});
*/
/*
connection.onDidOpenTextDocument((params) => {
    // A text document got opened in VSCode.
    // params.uri uniquely identifies the document. For documents store on disk this is a file URI.
    // params.text the initial full content of the document.
    connection.console.log(`${params.uri} opened.`);
});

connection.onDidChangeTextDocument((params) => {
    // The content of a text document did change in VSCode.
    // params.uri uniquely identifies the document.
    // params.contentChanges describe the content changes to the document.
    connection.console.log(`${params.uri} changed: ${JSON.stringify(params.contentChanges)}`);
});

connection.onDidCloseTextDocument((params) => {
    // A text document got closed in VSCode.
    // params.uri uniquely identifies the document.
    connection.console.log(`${params.uri} closed.`);
});
*/
// Listen on the connection
connection.listen();
//# sourceMappingURL=server.js.map