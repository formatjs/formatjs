/*
Copyright (c) 2014, Yahoo! Inc. All rights reserved.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.
*/
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
/* jslint esnext: true */
import Compiler, { isSelectOrPluralFormat } from "./compiler";
import parser from "intl-messageformat-parser";
// -- MessageFormat --------------------------------------------------------
var MessageFormat = /** @class */ (function () {
    function MessageFormat(message, locales, overrideFormats) {
        var _this = this;
        // "Bind" `format()` method to `this` so it can be passed by reference like
        // the other `Intl` APIs.
        this.format = function (values) {
            try {
                return _this._format(_this.pattern, values);
            }
            catch (e) {
                if (e.variableId) {
                    throw new Error("The intl string context variable '" +
                        e.variableId +
                        "'" +
                        " was not provided to the string '" +
                        _this.message +
                        "'");
                }
                else {
                    throw e;
                }
            }
        };
        // Parse string messages into an AST.
        var ast = typeof message === "string" ? MessageFormat.__parse(message) : message;
        if (!(ast && ast.type === "messageFormatPattern")) {
            throw new TypeError("A message must be provided as a String or AST.");
        }
        // Creates a new object with the specified `formats` merged with the default
        // formats.
        var formats = mergeConfigs(MessageFormat.formats, overrideFormats);
        // Defined first because it's used to build the format pattern.
        this._locale = this._resolveLocale(locales || []);
        // Compile the `ast` to a pattern that is highly optimized for repeated
        // `format()` invocations. **Note:** This passes the `locales` set provided
        // to the constructor instead of just the resolved locale.
        this.pattern = this._compilePattern(ast, locales || [], formats);
        this.message = message;
    }
    MessageFormat.__addLocaleData = function (data) {
        if (!(data && data.locale)) {
            throw new Error("Locale data provided to IntlMessageFormat is missing a " +
                "`locale` property");
        }
        MessageFormat.__localeData__[data.locale.toLowerCase()] = data;
    };
    MessageFormat.prototype.resolvedOptions = function () {
        return { locale: this._locale };
    };
    MessageFormat.prototype._resolveLocale = function (locales) {
        if (typeof locales === "string") {
            locales = [locales];
        }
        // Create a copy of the array so we can push on the default locale.
        locales = (locales || []).concat(MessageFormat.defaultLocale);
        var localeData = MessageFormat.__localeData__;
        var i, len, localeParts, data;
        // Using the set of locales + the default locale, we look for the first one
        // which that has been registered. When data does not exist for a locale, we
        // traverse its ancestors to find something that's been registered within
        // its hierarchy of locales. Since we lack the proper `parentLocale` data
        // here, we must take a naive approach to traversal.
        for (i = 0, len = locales.length; i < len; i += 1) {
            localeParts = locales[i].toLowerCase().split("-");
            while (localeParts.length) {
                data = localeData[localeParts.join("-")];
                if (data) {
                    // Return the normalized locale string; e.g., we return "en-US",
                    // instead of "en-us".
                    return data.locale;
                }
                localeParts.pop();
            }
        }
        var defaultLocale = locales.pop();
        throw new Error("No locale data has been added to IntlMessageFormat for: " +
            locales.join(", ") +
            ", or the default locale: " +
            defaultLocale);
    };
    MessageFormat.prototype._compilePattern = function (ast, locales, formats) {
        var compiler = new Compiler(locales, formats);
        return compiler.compile(ast);
    };
    MessageFormat.prototype._format = function (pattern, values) {
        var result = "", i, len, part, id, value;
        for (i = 0, len = pattern.length; i < len; i += 1) {
            part = pattern[i];
            // Exist early for string parts.
            if (typeof part === "string") {
                result += part;
                continue;
            }
            id = part.id;
            // Enforce that all required values are provided by the caller.
            if (!(values && id in values)) {
                throw new FormatError("A value must be provided for: " + id, id);
            }
            value = values[id];
            // Recursively format plural and select parts' option — which can be a
            // nested pattern structure. The choosing of the option to use is
            // abstracted-by and delegated-to the part helper object.
            if (isSelectOrPluralFormat(part)) {
                result += this._format(part.getOption(value), values);
            }
            else {
                result += part.format(value);
            }
        }
        return result;
    };
    MessageFormat.defaultLocale = 'en';
    MessageFormat.__localeData__ = {};
    // Default format options used as the prototype of the `formats` provided to the
    // constructor. These are used when constructing the internal Intl.NumberFormat
    // and Intl.DateTimeFormat instances.
    MessageFormat.formats = {
        number: {
            currency: {
                style: "currency"
            },
            percent: {
                style: "percent"
            }
        },
        date: {
            short: {
                month: "numeric",
                day: "numeric",
                year: "2-digit"
            },
            medium: {
                month: "short",
                day: "numeric",
                year: "numeric"
            },
            long: {
                month: "long",
                day: "numeric",
                year: "numeric"
            },
            full: {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric"
            }
        },
        time: {
            short: {
                hour: "numeric",
                minute: "numeric"
            },
            medium: {
                hour: "numeric",
                minute: "numeric",
                second: "numeric"
            },
            long: {
                hour: "numeric",
                minute: "numeric",
                second: "numeric",
                timeZoneName: "short"
            },
            full: {
                hour: "numeric",
                minute: "numeric",
                second: "numeric",
                timeZoneName: "short"
            }
        }
    };
    MessageFormat.__parse = parser.parse;
    return MessageFormat;
}());
export default MessageFormat;
function mergeConfig(c1, c2) {
    if (!c2) {
        return c1;
    }
    return __assign({}, (c1 || {}), (c2 || {}), Object.keys(c1).reduce(function (all, k) {
        all[k] = __assign({}, c1[k], (c2[k] || {}));
        return all;
    }, {}));
}
function mergeConfigs(defaultConfig, configs) {
    if (!configs) {
        return defaultConfig;
    }
    return __assign({}, defaultConfig, { date: mergeConfig(defaultConfig.date, configs.date) });
}
var FormatError = /** @class */ (function (_super) {
    __extends(FormatError, _super);
    function FormatError(msg, variableId) {
        var _this = _super.call(this, msg) || this;
        _this.variableId = variableId;
        return _this;
    }
    return FormatError;
}(Error));
//# sourceMappingURL=core.js.map