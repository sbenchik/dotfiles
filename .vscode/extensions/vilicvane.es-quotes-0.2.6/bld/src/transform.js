"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function transformSingleToDouble(body) {
    let factorsRegex = /(\\')|(")|\\[^]/g;
    return body.replace(factorsRegex, /* /$single-to-double-factors/ */ (text, escapedQuote, unescapedQuote) => {
        if (escapedQuote) {
            return "'";
        }
        else if (unescapedQuote) {
            return '\\"';
        }
        else {
            return text;
        }
    });
}
function transformDoubleToSingle(body) {
    let factorsRegex = /(\\")|(')|\\[^]/g;
    return body.replace(factorsRegex, /* /$double-to-single-factors/ */ (text, escapedQuote, unescapedQuote) => {
        if (escapedQuote) {
            return '"';
        }
        else if (unescapedQuote) {
            return "\\'";
        }
        else {
            return text;
        }
    });
}
function transformNormalToTemplate(body) {
    let factorsRegex = /(\\["'])|(`)|(\$\{)|(\\n\\\r?\n)|\\[^]/g;
    return body.replace(factorsRegex, /* /$normal-to-template-factors/ */ (text, escapedQuote, unescapedQuote, unescapedPartialClosing, endOfLine) => {
        if (escapedQuote) {
            return escapedQuote.slice(1);
        }
        else if (unescapedQuote) {
            return '\\' + unescapedQuote;
        }
        else if (unescapedPartialClosing) {
            return '\\' + unescapedPartialClosing;
        }
        else if (endOfLine) {
            return '\n';
        }
        else {
            return text;
        }
    });
}
function transformTemplateToNormal(body, type) {
    let factorsRegex = /(\\`)|(\\\$\\?\{|\$\\\{)|(["'])|(\r?\n)|\\(?:\r\n|[^])/g; // fix highlight: `
    return body.replace(factorsRegex, /* /$template-to-normal-factors/ */ (text, escapedQuote, escapedPartialClosing, unescapedQuote, endOfLine) => {
        if (escapedQuote) {
            return '`';
        }
        else if (escapedPartialClosing) {
            return '${';
        }
        else if (unescapedQuote) {
            if (unescapedQuote === '"') {
                if (type === 1 /* doubleQuoted */) {
                    return '\\"';
                }
            }
            else {
                if (type === 0 /* singleQuoted */) {
                    return "\\'";
                }
            }
            return unescapedQuote;
        }
        else if (endOfLine) {
            return '\\n\\' + endOfLine;
        }
        else {
            return text;
        }
    });
}
function transform(body, fromType, toType, first = true, last = true) {
    if (fromType === toType) {
        // do nothing.
    }
    else if (fromType === 2 /* template */) {
        // template to normal.
        body = transformTemplateToNormal(body, toType);
    }
    else if (toType === 2 /* template */) {
        // normal to template.
        body = transformNormalToTemplate(body);
    }
    else if (fromType === 1 /* doubleQuoted */) {
        // double to single.
        body = transformDoubleToSingle(body);
    }
    else {
        // single to double.
        body = transformSingleToDouble(body);
    }
    return wrapLiteral(body, toType, first, last);
}
exports.transform = transform;
function wrapLiteral(body, type, first = true, last = true) {
    switch (type) {
        case 0 /* singleQuoted */:
            return `'${body}'`;
        case 1 /* doubleQuoted */:
            return `"${body}"`;
        case 2 /* template */:
            let opening = first ? '`' : '}';
            let closing = last ? '`' : '${';
            return opening + body + closing;
    }
}
exports.wrapLiteral = wrapLiteral;
//# sourceMappingURL=transform.js.map