'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_languageclient_1 = require("vscode-languageclient");
/**
 * The message type. Copied from vscode protocol
 */
var MessageType;
(function (MessageType) {
    /**
     * An error message.
     */
    MessageType[MessageType["Error"] = 1] = "Error";
    /**
     * A warning message.
     */
    MessageType[MessageType["Warning"] = 2] = "Warning";
    /**
     * An information message.
     */
    MessageType[MessageType["Info"] = 3] = "Info";
    /**
     * A log message.
     */
    MessageType[MessageType["Log"] = 4] = "Log";
})(MessageType = exports.MessageType || (exports.MessageType = {}));
/**
 * A functionality status
 */
var FeatureStatus;
(function (FeatureStatus) {
    /**
     * Disabled.
     */
    FeatureStatus[FeatureStatus["disabled"] = 0] = "disabled";
    /**
     * Enabled manually.
     */
    FeatureStatus[FeatureStatus["interactive"] = 1] = "interactive";
    /**
     * Enabled automatically.
     */
    FeatureStatus[FeatureStatus["automatic"] = 2] = "automatic";
})(FeatureStatus = exports.FeatureStatus || (exports.FeatureStatus = {}));
var StatusNotification;
(function (StatusNotification) {
    StatusNotification.type = new vscode_languageclient_1.NotificationType('language/status');
})(StatusNotification = exports.StatusNotification || (exports.StatusNotification = {}));
var ClassFileContentsRequest;
(function (ClassFileContentsRequest) {
    ClassFileContentsRequest.type = new vscode_languageclient_1.RequestType('java/classFileContents');
})(ClassFileContentsRequest = exports.ClassFileContentsRequest || (exports.ClassFileContentsRequest = {}));
var ProjectConfigurationUpdateRequest;
(function (ProjectConfigurationUpdateRequest) {
    ProjectConfigurationUpdateRequest.type = new vscode_languageclient_1.NotificationType('java/projectConfigurationUpdate');
})(ProjectConfigurationUpdateRequest = exports.ProjectConfigurationUpdateRequest || (exports.ProjectConfigurationUpdateRequest = {}));
var ActionableNotification;
(function (ActionableNotification) {
    ActionableNotification.type = new vscode_languageclient_1.NotificationType('language/actionableNotification');
})(ActionableNotification = exports.ActionableNotification || (exports.ActionableNotification = {}));
//# sourceMappingURL=protocol.js.map