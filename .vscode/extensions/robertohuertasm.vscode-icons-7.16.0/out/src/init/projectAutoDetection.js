"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const models = require("../models");
const settings_1 = require("../settings");
const utils_1 = require("../utils");
class ProjectAutoDetection {
    static detectProject(findFiles, config) {
        if (config.projectDetection.disableDetect) {
            return Promise.resolve([]);
        }
        return findFiles('**/package.json', '**/node_modules/**')
            .then(results => results, rej => [rej]);
    }
    static checkForAngularProject(preset, ngIconsDisabled, isNgProject, i18nManager) {
        // NOTE: User setting (preset) bypasses detection in the following cases:
        // 1. Preset is set to 'false' and icons are not present in the manifest file
        // 2. Preset is set to 'true' and icons are present in the manifest file
        // For this cases PAD will not display a message
        const bypass = (preset != null) && ((!preset && ngIconsDisabled) || (preset && !ngIconsDisabled));
        // We need to mandatory check the following:
        // 1. The project related icons are present in the manifest file
        // 2. It's a detectable project
        // 3. The preset (when it's defined)
        const enableIcons = ngIconsDisabled && (isNgProject || (preset === true));
        const disableIcons = !ngIconsDisabled && (!isNgProject || (preset === false));
        if (bypass || (!enableIcons && !disableIcons)) {
            return { apply: false };
        }
        const langResourceKey = enableIcons
            ? models.LangResourceKeys.ngDetected
            : models.LangResourceKeys.nonNgDetected;
        const message = i18nManager.getMessage(langResourceKey);
        return { apply: true, message, value: enableIcons || !disableIcons };
    }
    static iconsDisabled(name, isFile = true) {
        const iconManifest = this._getIconManifest();
        const iconsJson = iconManifest && utils_1.parseJSON(iconManifest);
        return !iconsJson || !Reflect.ownKeys(iconsJson.iconDefinitions)
            .filter(key => key.toString().startsWith(`_${isFile ? 'f' : 'fd'}_${name}`)).length;
    }
    static folderIconsDisabled(func) {
        const iconManifest = this._getIconManifest();
        const iconsJson = iconManifest && utils_1.parseJSON(iconManifest);
        return !iconsJson || !func(iconsJson);
    }
    static getProjectInfo(results, name) {
        let projectInfo = null;
        results.some(result => {
            const content = fs.readFileSync(result.fsPath, 'utf8');
            const projectJson = utils_1.parseJSON(content);
            projectInfo = this.getInfo(projectJson, name);
            return !!projectInfo;
        });
        return projectInfo;
    }
    static applyDetection(i18nManager, projectDetectionResult, autoReload, applyCustomizationFn, showCustomizationMessageFn, reloadFn) {
        return new Promise(resolve => {
            if (autoReload) {
                applyCustomizationFn(projectDetectionResult);
                reloadFn();
            }
            else {
                showCustomizationMessageFn(projectDetectionResult.message, [{ title: i18nManager.getMessage(models.LangResourceKeys.reload) },
                    { title: i18nManager.getMessage(models.LangResourceKeys.autoReload) },
                    { title: i18nManager.getMessage(models.LangResourceKeys.disableDetect) }], applyCustomizationFn, projectDetectionResult);
            }
            resolve();
        });
    }
    static getInfo(projectJson, name) {
        if (!projectJson) {
            return null;
        }
        const getInfoFn = (key) => {
            const depExists = projectJson.dependencies && !!projectJson.dependencies[key];
            if (depExists) {
                return { name, version: projectJson.dependencies[key] };
            }
            const devDepExists = projectJson.devDependencies && !!projectJson.devDependencies[key];
            if (devDepExists) {
                return { name, version: projectJson.devDependencies[key] };
            }
            return null;
        };
        switch (name) {
            case models.Projects.angular:
                return getInfoFn('@angular/core');
            default:
                return null;
        }
    }
    static _getIconManifest() {
        const manifestFilePath = path.join(__dirname, '..', settings_1.extensionSettings.iconJsonFileName);
        try {
            return fs.readFileSync(manifestFilePath, 'utf8');
        }
        catch (err) {
            return null;
        }
    }
}
exports.ProjectAutoDetection = ProjectAutoDetection;
//# sourceMappingURL=projectAutoDetection.js.map