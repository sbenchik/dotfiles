/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_languageserver_1 = require("vscode-languageserver");
const vscode_uri_1 = require("vscode-uri");
const path = require("path");
var Is;
(function (Is) {
    const toString = Object.prototype.toString;
    function boolean(value) {
        return value === true || value === false;
    }
    Is.boolean = boolean;
    function string(value) {
        return toString.call(value) === '[object String]';
    }
    Is.string = string;
})(Is || (Is = {}));
var CommandIds;
(function (CommandIds) {
    CommandIds.applySingleFix = 'eslint.applySingleFix';
    CommandIds.applySameFixes = 'eslint.applySameFixes';
    CommandIds.applyAllFixes = 'eslint.applyAllFixes';
    CommandIds.applyAutoFix = 'eslint.applyAutoFix';
})(CommandIds || (CommandIds = {}));
var Status;
(function (Status) {
    Status[Status["ok"] = 1] = "ok";
    Status[Status["warn"] = 2] = "warn";
    Status[Status["error"] = 3] = "error";
})(Status || (Status = {}));
var StatusNotification;
(function (StatusNotification) {
    StatusNotification.type = new vscode_languageserver_1.NotificationType('eslint/status');
})(StatusNotification || (StatusNotification = {}));
var NoConfigRequest;
(function (NoConfigRequest) {
    NoConfigRequest.type = new vscode_languageserver_1.RequestType('eslint/noConfig');
})(NoConfigRequest || (NoConfigRequest = {}));
var NoESLintLibraryRequest;
(function (NoESLintLibraryRequest) {
    NoESLintLibraryRequest.type = new vscode_languageserver_1.RequestType('eslint/noLibrary');
})(NoESLintLibraryRequest || (NoESLintLibraryRequest = {}));
var DirectoryItem;
(function (DirectoryItem) {
    function is(item) {
        let candidate = item;
        return candidate && Is.string(candidate.directory) && (Is.boolean(candidate.changeProcessCWD) || candidate.changeProcessCWD === void 0);
    }
    DirectoryItem.is = is;
})(DirectoryItem || (DirectoryItem = {}));
function makeDiagnostic(problem) {
    let message = (problem.ruleId != null)
        ? `${problem.message} (${problem.ruleId})`
        : `${problem.message}`;
    let startLine = Math.max(0, problem.line - 1);
    let startChar = Math.max(0, problem.column - 1);
    let endLine = problem.endLine != null ? Math.max(0, problem.endLine - 1) : startLine;
    let endChar = problem.endColumn != null ? Math.max(0, problem.endColumn - 1) : startChar;
    return {
        message: message,
        severity: convertSeverity(problem.severity),
        source: 'eslint',
        range: {
            start: { line: startLine, character: startChar },
            end: { line: endLine, character: endChar }
        },
        code: problem.ruleId
    };
}
function computeKey(diagnostic) {
    let range = diagnostic.range;
    return `[${range.start.line},${range.start.character},${range.end.line},${range.end.character}]-${diagnostic.code}`;
}
let codeActions = new Map();
function recordCodeAction(document, diagnostic, problem) {
    if (!problem.fix || !problem.ruleId) {
        return;
    }
    let uri = document.uri;
    let edits = codeActions.get(uri);
    if (!edits) {
        edits = new Map();
        codeActions.set(uri, edits);
    }
    edits.set(computeKey(diagnostic), { label: `Fix this ${problem.ruleId} problem`, documentVersion: document.version, ruleId: problem.ruleId, edit: problem.fix });
}
function convertSeverity(severity) {
    switch (severity) {
        // Eslint 1 is warning
        case 1:
            return vscode_languageserver_1.DiagnosticSeverity.Warning;
        case 2:
            return vscode_languageserver_1.DiagnosticSeverity.Error;
        default:
            return vscode_languageserver_1.DiagnosticSeverity.Error;
    }
}
/**
 * Check if the path follows this pattern: `\\hostname\sharename`.
 *
 * @see https://msdn.microsoft.com/en-us/library/gg465305.aspx
 * @return A boolean indication if the path is a UNC path, on none-windows
 * always false.
 */
function isUNC(path) {
    if (process.platform !== 'win32') {
        // UNC is a windows concept
        return false;
    }
    if (!path || path.length < 5) {
        // at least \\a\b
        return false;
    }
    let code = path.charCodeAt(0);
    if (code !== 92 /* Backslash */) {
        return false;
    }
    code = path.charCodeAt(1);
    if (code !== 92 /* Backslash */) {
        return false;
    }
    let pos = 2;
    let start = pos;
    for (; pos < path.length; pos++) {
        code = path.charCodeAt(pos);
        if (code === 92 /* Backslash */) {
            break;
        }
    }
    if (start === pos) {
        return false;
    }
    code = path.charCodeAt(pos + 1);
    if (isNaN(code) || code === 92 /* Backslash */) {
        return false;
    }
    return true;
}
function getFilePath(documentOrUri) {
    if (!documentOrUri) {
        return undefined;
    }
    let uri = Is.string(documentOrUri) ? vscode_uri_1.default.parse(documentOrUri) : vscode_uri_1.default.parse(documentOrUri.uri);
    if (uri.scheme !== 'file') {
        return undefined;
    }
    return uri.fsPath;
}
const exitCalled = new vscode_languageserver_1.NotificationType('eslint/exitCalled');
const nodeExit = process.exit;
process.exit = (code) => {
    let stack = new Error('stack');
    connection.sendNotification(exitCalled, [code ? code : 0, stack.stack]);
    setTimeout(() => {
        nodeExit(code);
    }, 1000);
};
let connection = vscode_languageserver_1.createConnection(vscode_languageserver_1.ProposedFeatures.all);
let documents = new vscode_languageserver_1.TextDocuments();
let _globalNpmPath;
function globalNpmPath() {
    if (_globalNpmPath === void 0) {
        _globalNpmPath = vscode_languageserver_1.Files.resolveGlobalNodePath(trace);
        if (_globalNpmPath === void 0) {
            _globalNpmPath = null;
        }
    }
    if (_globalNpmPath === null) {
        return undefined;
    }
    return _globalNpmPath;
}
let _globalYarnPath;
function globalYarnPath() {
    if (_globalYarnPath === void 0) {
        _globalYarnPath = vscode_languageserver_1.Files.resolveGlobalYarnPath(trace);
        if (_globalYarnPath === void 0) {
            _globalYarnPath = null;
        }
    }
    if (_globalYarnPath === null) {
        return undefined;
    }
    return _globalYarnPath;
}
let path2Library = new Map();
let document2Settings = new Map();
function resolveSettings(document) {
    let uri = document.uri;
    let resultPromise = document2Settings.get(uri);
    if (resultPromise) {
        return resultPromise;
    }
    resultPromise = connection.workspace.getConfiguration({ scopeUri: uri, section: '' }).then((settings) => {
        if (settings.packageManager === 'npm') {
            settings.resolvedGlobalPackageManagerPath = globalNpmPath();
        }
        else if (settings.packageManager === 'yarn') {
            settings.resolvedGlobalPackageManagerPath = globalYarnPath();
        }
        let uri = vscode_uri_1.default.parse(document.uri);
        let promise;
        if (uri.scheme === 'file') {
            let file = uri.fsPath;
            let directory = path.dirname(file);
            if (settings.nodePath) {
                let nodePath = settings.nodePath;
                if (!path.isAbsolute(nodePath) && settings.workspaceFolder !== void 0) {
                    let uri = vscode_uri_1.default.parse(settings.workspaceFolder.uri);
                    if (uri.scheme === 'file') {
                        nodePath = path.join(uri.fsPath, nodePath);
                    }
                }
                promise = vscode_languageserver_1.Files.resolve('eslint', nodePath, nodePath, trace).then(undefined, () => {
                    return vscode_languageserver_1.Files.resolve('eslint', settings.resolvedGlobalPackageManagerPath, directory, trace);
                });
            }
            else {
                promise = vscode_languageserver_1.Files.resolve('eslint', settings.resolvedGlobalPackageManagerPath, directory, trace);
            }
        }
        else {
            promise = vscode_languageserver_1.Files.resolve('eslint', settings.resolvedGlobalPackageManagerPath, settings.workspaceFolder ? settings.workspaceFolder.uri : undefined, trace);
        }
        return promise.then((path) => {
            let library = path2Library.get(path);
            if (!library) {
                library = require(path);
                if (!library.CLIEngine) {
                    settings.validate = false;
                    connection.console.error(`The eslint library loaded from ${path} doesn\'t export a CLIEngine. You need at least eslint@1.0.0`);
                }
                else {
                    connection.console.info(`ESLint library loaded from: ${path}`);
                    settings.library = library;
                }
                path2Library.set(path, library);
            }
            else {
                settings.library = library;
            }
            return settings;
        }, () => {
            settings.validate = false;
            connection.sendRequest(NoESLintLibraryRequest.type, { source: { uri: document.uri } });
            return settings;
        });
    });
    document2Settings.set(uri, resultPromise);
    return resultPromise;
}
var Request;
(function (Request) {
    function is(value) {
        let candidate = value;
        return candidate && !!candidate.token && !!candidate.resolve && !!candidate.reject;
    }
    Request.is = is;
})(Request || (Request = {}));
var Thenable;
(function (Thenable) {
    function is(value) {
        let candidate = value;
        return candidate && typeof candidate.then === 'function';
    }
    Thenable.is = is;
})(Thenable || (Thenable = {}));
class BufferedMessageQueue {
    constructor(connection) {
        this.connection = connection;
        this.queue = [];
        this.requestHandlers = new Map();
        this.notificationHandlers = new Map();
    }
    registerRequest(type, handler, versionProvider) {
        this.connection.onRequest(type, (params, token) => {
            return new Promise((resolve, reject) => {
                this.queue.push({
                    method: type.method,
                    params: params,
                    documentVersion: versionProvider ? versionProvider(params) : undefined,
                    resolve: resolve,
                    reject: reject,
                    token: token
                });
                this.trigger();
            });
        });
        this.requestHandlers.set(type.method, { handler, versionProvider });
    }
    registerNotification(type, handler, versionProvider) {
        connection.onNotification(type, (params) => {
            this.queue.push({
                method: type.method,
                params: params,
                documentVersion: versionProvider ? versionProvider(params) : undefined,
            });
            this.trigger();
        });
        this.notificationHandlers.set(type.method, { handler, versionProvider });
    }
    addNotificationMessage(type, params, version) {
        this.queue.push({
            method: type.method,
            params,
            documentVersion: version
        });
        this.trigger();
    }
    onNotification(type, handler, versionProvider) {
        this.notificationHandlers.set(type.method, { handler, versionProvider });
    }
    trigger() {
        if (this.timer || this.queue.length === 0) {
            return;
        }
        this.timer = setImmediate(() => {
            this.timer = undefined;
            this.processQueue();
        });
    }
    processQueue() {
        let message = this.queue.shift();
        if (!message) {
            return;
        }
        if (Request.is(message)) {
            let requestMessage = message;
            if (requestMessage.token.isCancellationRequested) {
                requestMessage.reject(new vscode_languageserver_1.ResponseError(vscode_languageserver_1.ErrorCodes.RequestCancelled, 'Request got cancelled'));
                return;
            }
            let elem = this.requestHandlers.get(requestMessage.method);
            if (elem.versionProvider && requestMessage.documentVersion !== void 0 && requestMessage.documentVersion !== elem.versionProvider(requestMessage.params)) {
                requestMessage.reject(new vscode_languageserver_1.ResponseError(vscode_languageserver_1.ErrorCodes.RequestCancelled, 'Request got cancelled'));
                return;
            }
            let result = elem.handler(requestMessage.params, requestMessage.token);
            if (Thenable.is(result)) {
                result.then((value) => {
                    requestMessage.resolve(value);
                }, (error) => {
                    requestMessage.reject(error);
                });
            }
            else {
                requestMessage.resolve(result);
            }
        }
        else {
            let notificationMessage = message;
            let elem = this.notificationHandlers.get(notificationMessage.method);
            if (elem.versionProvider && notificationMessage.documentVersion !== void 0 && notificationMessage.documentVersion !== elem.versionProvider(notificationMessage.params)) {
                return;
            }
            elem.handler(notificationMessage.params);
        }
        this.trigger();
    }
}
let messageQueue = new BufferedMessageQueue(connection);
var ValidateNotification;
(function (ValidateNotification) {
    ValidateNotification.type = new vscode_languageserver_1.NotificationType('eslint/validate');
})(ValidateNotification || (ValidateNotification = {}));
messageQueue.onNotification(ValidateNotification.type, (document) => {
    validateSingle(document, true);
}, (document) => {
    return document.version;
});
// The documents manager listen for text document create, change
// and close on the connection
documents.listen(connection);
documents.onDidOpen((event) => {
    resolveSettings(event.document).then((settings) => {
        if (!settings.validate) {
            return;
        }
        if (settings.run === 'onSave') {
            messageQueue.addNotificationMessage(ValidateNotification.type, event.document, event.document.version);
        }
    });
});
// A text document has changed. Validate the document according the run setting.
documents.onDidChangeContent((event) => {
    resolveSettings(event.document).then((settings) => {
        if (!settings.validate || settings.run !== 'onType') {
            return;
        }
        messageQueue.addNotificationMessage(ValidateNotification.type, event.document, event.document.version);
    });
});
function getFixes(textDocument) {
    let uri = textDocument.uri;
    let edits = codeActions.get(uri);
    function createTextEdit(editInfo) {
        return vscode_languageserver_1.TextEdit.replace(vscode_languageserver_1.Range.create(textDocument.positionAt(editInfo.edit.range[0]), textDocument.positionAt(editInfo.edit.range[1])), editInfo.edit.text || '');
    }
    if (edits) {
        let fixes = new Fixes(edits);
        if (fixes.isEmpty() || textDocument.version !== fixes.getDocumentVersion()) {
            return [];
        }
        return fixes.getOverlapFree().map(createTextEdit);
    }
    return [];
}
documents.onWillSaveWaitUntil((event) => {
    if (event.reason === vscode_languageserver_1.TextDocumentSaveReason.AfterDelay) {
        return [];
    }
    let document = event.document;
    return resolveSettings(document).then((settings) => {
        if (!settings.autoFixOnSave) {
            return [];
        }
        // If we validate on save and want to apply fixes on will save
        // we need to validate the file.
        if (settings.run === 'onSave') {
            // Do not queue this since we want to get the fixes as fast as possible.
            return validateSingle(document, false).then(() => getFixes(document));
        }
        else {
            return getFixes(document);
        }
    });
});
// A text document has been saved. Validate the document according the run setting.
documents.onDidSave((event) => {
    resolveSettings(event.document).then((settings) => {
        if (!settings.validate || settings.run !== 'onSave') {
            return;
        }
        messageQueue.addNotificationMessage(ValidateNotification.type, event.document, event.document.version);
    });
});
documents.onDidClose((event) => {
    resolveSettings(event.document).then((settings) => {
        let uri = event.document.uri;
        document2Settings.delete(uri);
        codeActions.delete(uri);
        if (settings.validate) {
            connection.sendDiagnostics({ uri: uri, diagnostics: [] });
        }
    });
});
function environmentChanged() {
    document2Settings.clear();
    for (let document of documents.all()) {
        messageQueue.addNotificationMessage(ValidateNotification.type, document, document.version);
    }
}
function trace(message, verbose) {
    connection.tracer.log(message, verbose);
}
connection.onInitialize((_params) => {
    return {
        capabilities: {
            textDocumentSync: {
                openClose: true,
                change: vscode_languageserver_1.TextDocumentSyncKind.Full,
                willSaveWaitUntil: true,
                save: {
                    includeText: false
                }
            },
            codeActionProvider: true,
            executeCommandProvider: {
                commands: [CommandIds.applySingleFix, CommandIds.applySameFixes, CommandIds.applyAllFixes, CommandIds.applyAutoFix]
            }
        }
    };
});
connection.onInitialized(() => {
    connection.client.register(vscode_languageserver_1.DidChangeConfigurationNotification.type, undefined);
    connection.client.register(vscode_languageserver_1.Proposed.DidChangeWorkspaceFoldersNotification.type, undefined);
});
messageQueue.registerNotification(vscode_languageserver_1.DidChangeConfigurationNotification.type, (_params) => {
    environmentChanged();
});
messageQueue.registerNotification(vscode_languageserver_1.Proposed.DidChangeWorkspaceFoldersNotification.type, (_params) => {
    environmentChanged();
});
const singleErrorHandlers = [
    tryHandleNoConfig,
    tryHandleConfigError,
    tryHandleMissingModule,
    showErrorMessage
];
function validateSingle(document, publishDiagnostics = true) {
    // We validate document in a queue but open / close documents directly. So we need to deal with the
    // fact that a document might be gone from the server.
    if (!documents.get(document.uri)) {
        return Promise.resolve(undefined);
    }
    return resolveSettings(document).then((settings) => {
        if (!settings.validate) {
            return;
        }
        try {
            validate(document, settings, publishDiagnostics);
            connection.sendNotification(StatusNotification.type, { state: Status.ok });
        }
        catch (err) {
            let status = undefined;
            for (let handler of singleErrorHandlers) {
                status = handler(err, document, settings.library);
                if (status) {
                    break;
                }
            }
            status = status || Status.error;
            connection.sendNotification(StatusNotification.type, { state: status });
        }
    });
}
function validateMany(documents) {
    documents.forEach(document => {
        messageQueue.addNotificationMessage(ValidateNotification.type, document, document.version);
    });
}
function getMessage(err, document) {
    let result = null;
    if (typeof err.message === 'string' || err.message instanceof String) {
        result = err.message;
        result = result.replace(/\r?\n/g, ' ');
        if (/^CLI: /.test(result)) {
            result = result.substr(5);
        }
    }
    else {
        result = `An unknown error occured while validating document: ${document.uri}`;
    }
    return result;
}
function validate(document, settings, publishDiagnostics = true) {
    let newOptions = Object.assign(Object.create(null), settings.options);
    let content = document.getText();
    let uri = document.uri;
    let file = getFilePath(document);
    let cwd = process.cwd();
    try {
        if (file) {
            if (settings.workingDirectory) {
                newOptions.cwd = settings.workingDirectory.directory;
                if (settings.workingDirectory.changeProcessCWD) {
                    process.chdir(settings.workingDirectory.directory);
                }
            }
            else if (settings.workspaceFolder) {
                let workspaceFolderUri = vscode_uri_1.default.parse(settings.workspaceFolder.uri);
                if (workspaceFolderUri.scheme === 'file') {
                    newOptions.cwd = workspaceFolderUri.fsPath;
                    process.chdir(workspaceFolderUri.fsPath);
                }
            }
            else if (!settings.workspaceFolder && !isUNC(file)) {
                let directory = path.dirname(file);
                if (directory) {
                    if (path.isAbsolute(directory)) {
                        newOptions.cwd = directory;
                    }
                }
            }
        }
        let cli = new settings.library.CLIEngine(newOptions);
        // Clean previously computed code actions.
        codeActions.delete(uri);
        let report = cli.executeOnText(content, file);
        let diagnostics = [];
        if (report && report.results && Array.isArray(report.results) && report.results.length > 0) {
            let docReport = report.results[0];
            if (docReport.messages && Array.isArray(docReport.messages)) {
                docReport.messages.forEach((problem) => {
                    if (problem) {
                        let diagnostic = makeDiagnostic(problem);
                        diagnostics.push(diagnostic);
                        if (settings.autoFix) {
                            recordCodeAction(document, diagnostic, problem);
                        }
                    }
                });
            }
        }
        if (publishDiagnostics) {
            connection.sendDiagnostics({ uri, diagnostics });
        }
    }
    finally {
        if (cwd !== process.cwd()) {
            process.chdir(cwd);
        }
    }
}
let noConfigReported = new Map();
function isNoConfigFoundError(error) {
    let candidate = error;
    return candidate.messageTemplate === 'no-config-found' || candidate.message === 'No ESLint configuration found.';
}
function tryHandleNoConfig(error, document, library) {
    if (!isNoConfigFoundError(error)) {
        return undefined;
    }
    if (!noConfigReported.has(document.uri)) {
        connection.sendRequest(NoConfigRequest.type, {
            message: getMessage(error, document),
            document: {
                uri: document.uri
            }
        })
            .then(undefined, () => { });
        noConfigReported.set(document.uri, library);
    }
    return Status.warn;
}
let configErrorReported = new Map();
function tryHandleConfigError(error, document, library) {
    if (!error.message) {
        return undefined;
    }
    function handleFileName(filename) {
        if (!configErrorReported.has(filename)) {
            connection.console.error(getMessage(error, document));
            if (!documents.get(vscode_uri_1.default.file(filename).toString())) {
                connection.window.showInformationMessage(getMessage(error, document));
            }
            configErrorReported.set(filename, library);
        }
        return Status.warn;
    }
    let matches = /Cannot read config file:\s+(.*)\nError:\s+(.*)/.exec(error.message);
    if (matches && matches.length === 3) {
        return handleFileName(matches[1]);
    }
    matches = /(.*):\n\s*Configuration for rule \"(.*)\" is /.exec(error.message);
    if (matches && matches.length === 3) {
        return handleFileName(matches[1]);
    }
    matches = /Cannot find module '([^']*)'\nReferenced from:\s+(.*)/.exec(error.message);
    if (matches && matches.length === 3) {
        return handleFileName(matches[2]);
    }
    return undefined;
}
let missingModuleReported = new Map();
function tryHandleMissingModule(error, document, library) {
    if (!error.message) {
        return undefined;
    }
    function handleMissingModule(plugin, module, error) {
        if (!missingModuleReported.has(plugin)) {
            let fsPath = getFilePath(document);
            missingModuleReported.set(plugin, library);
            if (error.messageTemplate === 'plugin-missing') {
                connection.console.error([
                    '',
                    `${error.message.toString()}`,
                    `Happened while validating ${fsPath ? fsPath : document.uri}`,
                    `This can happen for a couple of reasons:`,
                    `1. The plugin name is spelled incorrectly in an ESLint configuration file (e.g. .eslintrc).`,
                    `2. If ESLint is installed globally, then make sure ${module} is installed globally as well.`,
                    `3. If ESLint is installed locally, then ${module} isn't installed correctly.`,
                    '',
                    `Consider running eslint --debug ${fsPath ? fsPath : document.uri} from a terminal to obtain a trace about the configuration files used.`
                ].join('\n'));
            }
            else {
                connection.console.error([
                    `${error.message.toString()}`,
                    `Happend while validating ${fsPath ? fsPath : document.uri}`
                ].join('\n'));
            }
        }
        return Status.warn;
    }
    let matches = /Failed to load plugin (.*): Cannot find module (.*)/.exec(error.message);
    if (matches && matches.length === 3) {
        return handleMissingModule(matches[1], matches[2], error);
    }
    return undefined;
}
function showErrorMessage(error, document) {
    connection.window.showErrorMessage(getMessage(error, document));
    return Status.error;
}
messageQueue.registerNotification(vscode_languageserver_1.DidChangeWatchedFilesNotification.type, (params) => {
    // A .eslintrc has change. No smartness here.
    // Simply revalidate all file.
    noConfigReported = Object.create(null);
    missingModuleReported = Object.create(null);
    params.changes.forEach((change) => {
        let fsPath = getFilePath(change.uri);
        if (!fsPath || isUNC(fsPath)) {
            return;
        }
        let dirname = path.dirname(fsPath);
        if (dirname) {
            let library = configErrorReported.get(fsPath);
            if (library) {
                let cli = new library.CLIEngine({});
                try {
                    cli.executeOnText("", path.join(dirname, "___test___.js"));
                    configErrorReported.delete(fsPath);
                }
                catch (error) {
                }
            }
        }
    });
    validateMany(documents.all());
});
class Fixes {
    constructor(edits) {
        this.edits = edits;
    }
    static overlaps(lastEdit, newEdit) {
        return !!lastEdit && lastEdit.edit.range[1] > newEdit.edit.range[0];
    }
    isEmpty() {
        return this.edits.size === 0;
    }
    getDocumentVersion() {
        if (this.isEmpty()) {
            throw new Error('No edits recorded.');
        }
        return this.edits.values().next().value.documentVersion;
    }
    getScoped(diagnostics) {
        let result = [];
        for (let diagnostic of diagnostics) {
            let key = computeKey(diagnostic);
            let editInfo = this.edits.get(key);
            if (editInfo) {
                result.push(editInfo);
            }
        }
        return result;
    }
    getAllSorted() {
        let result = [];
        this.edits.forEach((value) => result.push(value));
        return result.sort((a, b) => {
            let d = a.edit.range[0] - b.edit.range[0];
            if (d !== 0) {
                return d;
            }
            if (a.edit.range[1] === 0) {
                return -1;
            }
            if (b.edit.range[1] === 0) {
                return 1;
            }
            return a.edit.range[1] - b.edit.range[1];
        });
    }
    getOverlapFree() {
        let sorted = this.getAllSorted();
        if (sorted.length <= 1) {
            return sorted;
        }
        let result = [];
        let last = sorted[0];
        result.push(last);
        for (let i = 1; i < sorted.length; i++) {
            let current = sorted[i];
            if (!Fixes.overlaps(last, current)) {
                result.push(current);
                last = current;
            }
        }
        return result;
    }
}
let commands;
messageQueue.registerRequest(vscode_languageserver_1.CodeActionRequest.type, (params) => {
    commands = new Map();
    let result = [];
    let uri = params.textDocument.uri;
    let edits = codeActions.get(uri);
    if (!edits) {
        return result;
    }
    let fixes = new Fixes(edits);
    if (fixes.isEmpty()) {
        return result;
    }
    let textDocument = documents.get(uri);
    let documentVersion = -1;
    let ruleId;
    function createTextEdit(editInfo) {
        return vscode_languageserver_1.TextEdit.replace(vscode_languageserver_1.Range.create(textDocument.positionAt(editInfo.edit.range[0]), textDocument.positionAt(editInfo.edit.range[1])), editInfo.edit.text || '');
    }
    function getLastEdit(array) {
        let length = array.length;
        if (length === 0) {
            return undefined;
        }
        return array[length - 1];
    }
    for (let editInfo of fixes.getScoped(params.context.diagnostics)) {
        documentVersion = editInfo.documentVersion;
        ruleId = editInfo.ruleId;
        let workspaceChange = new vscode_languageserver_1.WorkspaceChange();
        workspaceChange.getTextEditChange({ uri, version: documentVersion }).add(createTextEdit(editInfo));
        commands.set(CommandIds.applySingleFix, workspaceChange);
        result.push(vscode_languageserver_1.Command.create(editInfo.label, CommandIds.applySingleFix));
    }
    ;
    if (result.length > 0) {
        let same = [];
        let all = [];
        for (let editInfo of fixes.getAllSorted()) {
            if (documentVersion === -1) {
                documentVersion = editInfo.documentVersion;
            }
            if (editInfo.ruleId === ruleId && !Fixes.overlaps(getLastEdit(same), editInfo)) {
                same.push(editInfo);
            }
            if (!Fixes.overlaps(getLastEdit(all), editInfo)) {
                all.push(editInfo);
            }
        }
        if (same.length > 1) {
            let sameFixes = new vscode_languageserver_1.WorkspaceChange();
            let sameTextChange = sameFixes.getTextEditChange({ uri, version: documentVersion });
            same.map(createTextEdit).forEach(edit => sameTextChange.add(edit));
            commands.set(CommandIds.applySameFixes, sameFixes);
            result.push(vscode_languageserver_1.Command.create(`Fix all ${ruleId} problems`, CommandIds.applySameFixes));
        }
        if (all.length > 1) {
            let allFixes = new vscode_languageserver_1.WorkspaceChange();
            let allTextChange = allFixes.getTextEditChange({ uri, version: documentVersion });
            all.map(createTextEdit).forEach(edit => allTextChange.add(edit));
            commands.set(CommandIds.applyAllFixes, allFixes);
            result.push(vscode_languageserver_1.Command.create(`Fix all auto-fixable problems`, CommandIds.applyAllFixes));
        }
    }
    return result;
}, (params) => {
    let document = documents.get(params.textDocument.uri);
    return document ? document.version : undefined;
});
function computeAllFixes(identifier) {
    let uri = identifier.uri;
    let textDocument = documents.get(uri);
    if (!textDocument || identifier.version !== textDocument.version) {
        return undefined;
    }
    let edits = codeActions.get(uri);
    function createTextEdit(editInfo) {
        return vscode_languageserver_1.TextEdit.replace(vscode_languageserver_1.Range.create(textDocument.positionAt(editInfo.edit.range[0]), textDocument.positionAt(editInfo.edit.range[1])), editInfo.edit.text || '');
    }
    if (edits) {
        let fixes = new Fixes(edits);
        if (!fixes.isEmpty()) {
            return fixes.getOverlapFree().map(createTextEdit);
        }
    }
    return undefined;
}
;
messageQueue.registerRequest(vscode_languageserver_1.ExecuteCommandRequest.type, (params) => {
    let workspaceChange;
    if (params.command === CommandIds.applyAutoFix) {
        let identifier = params.arguments[0];
        let edits = computeAllFixes(identifier);
        if (edits) {
            workspaceChange = new vscode_languageserver_1.WorkspaceChange();
            let textChange = workspaceChange.getTextEditChange(identifier);
            edits.forEach(edit => textChange.add(edit));
        }
    }
    else {
        workspaceChange = commands.get(params.command);
    }
    if (!workspaceChange) {
        return {};
    }
    return connection.workspace.applyEdit(workspaceChange.edit).then((response) => {
        if (!response.applied) {
            connection.console.error(`Failed to apply command: ${params.command}`);
        }
        return {};
    }, () => {
        connection.console.error(`Failed to apply command: ${params.command}`);
    });
}, (params) => {
    if (params.command === CommandIds.applyAutoFix) {
        let identifier = params.arguments[0];
        return identifier.version;
    }
    else {
        return undefined;
    }
});
connection.tracer.
    connection.listen();
//# sourceMappingURL=server.js.map