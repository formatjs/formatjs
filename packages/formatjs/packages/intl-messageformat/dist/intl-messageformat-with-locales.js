(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('intl-messageformat-parser')) :
    typeof define === 'function' && define.amd ? define(['intl-messageformat-parser'], factory) :
    (global = global || self, global.IntlMessageFormat = factory(global.parser));
}(this, function (parser) { 'use strict';

    parser = parser && parser.hasOwnProperty('default') ? parser['default'] : parser;

    /*
    Copyright (c) 2014, Yahoo! Inc. All rights reserved.
    Copyrights licensed under the New BSD License.
    See the accompanying LICENSE file for terms.
    */
    var __extends = (undefined && undefined.__extends) || (function () {
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
    var Compiler = /** @class */ (function () {
        function Compiler(locales, formats) {
            this.locales = [];
            this.formats = {
                number: {},
                date: {},
                time: {}
            };
            this.pluralNumberFormat = null;
            this.currentPlural = null;
            this.pluralStack = [];
            this.locales = locales;
            this.formats = formats;
        }
        Compiler.prototype.compile = function (ast) {
            this.pluralStack = [];
            this.currentPlural = null;
            this.pluralNumberFormat = null;
            return this.compileMessage(ast);
        };
        Compiler.prototype.compileMessage = function (ast) {
            var _this = this;
            if (!(ast && ast.type === "messageFormatPattern")) {
                throw new Error('Message AST is not of type: "messageFormatPattern"');
            }
            var elements = ast.elements;
            var pattern = elements
                .filter(function (el) {
                return el.type === "messageTextElement" || el.type === "argumentElement";
            })
                .map(function (el) {
                return el.type === "messageTextElement"
                    ? _this.compileMessageText(el)
                    : _this.compileArgument(el);
            });
            if (pattern.length !== elements.length) {
                throw new Error("Message element does not have a valid type");
            }
            return pattern;
        };
        Compiler.prototype.compileMessageText = function (element) {
            // When this `element` is part of plural sub-pattern and its value contains
            // an unescaped '#', use a `PluralOffsetString` helper to properly output
            // the number with the correct offset in the string.
            if (this.currentPlural && /(^|[^\\])#/g.test(element.value)) {
                // Create a cache a NumberFormat instance that can be reused for any
                // PluralOffsetString instance in this message.
                if (!this.pluralNumberFormat) {
                    this.pluralNumberFormat = new Intl.NumberFormat(this.locales);
                }
                return new PluralOffsetString(this.currentPlural.id, this.currentPlural.format.offset, this.pluralNumberFormat, element.value);
            }
            // Unescape the escaped '#'s in the message text.
            return element.value.replace(/\\#/g, "#");
        };
        Compiler.prototype.compileArgument = function (element) {
            var format = element.format, id = element.id;
            if (!format) {
                return new StringFormat(id);
            }
            var _a = this, formats = _a.formats, locales = _a.locales;
            switch (format.type) {
                case "numberFormat":
                    return {
                        id: id,
                        format: new Intl.NumberFormat(locales, formats.number[format.style])
                            .format
                    };
                case "dateFormat":
                    return {
                        id: id,
                        format: new Intl.DateTimeFormat(locales, formats.date[format.style])
                            .format
                    };
                case "timeFormat":
                    return {
                        id: id,
                        format: new Intl.DateTimeFormat(locales, formats.time[format.style])
                            .format
                    };
                case "pluralFormat":
                    return new PluralFormat(id, format.ordinal, format.offset, this.compileOptions(element), locales);
                case "selectFormat":
                    return new SelectFormat(id, this.compileOptions(element));
                default:
                    throw new Error("Message element does not have a valid format type");
            }
        };
        Compiler.prototype.compileOptions = function (element) {
            var format = element.format;
            var options = format.options;
            var optionsHash = {};
            // Save the current plural element, if any, then set it to a new value when
            // compiling the options sub-patterns. This conforms the spec's algorithm
            // for handling `"#"` syntax in message text.
            this.pluralStack.push(this.currentPlural);
            this.currentPlural = format.type === "pluralFormat" ? element : null;
            var i, len, option;
            for (i = 0, len = options.length; i < len; i += 1) {
                option = options[i];
                // Compile the sub-pattern and save it under the options's selector.
                optionsHash[option.selector] = this.compileMessage(option.value);
            }
            // Pop the plural stack to put back the original current plural value.
            this.currentPlural = this.pluralStack.pop();
            return optionsHash;
        };
        return Compiler;
    }());
    // -- Compiler Helper Classes --------------------------------------------------
    var Formatter = /** @class */ (function () {
        function Formatter(id) {
            this.id = id;
        }
        return Formatter;
    }());
    var StringFormat = /** @class */ (function (_super) {
        __extends(StringFormat, _super);
        function StringFormat() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        StringFormat.prototype.format = function (value) {
            if (!value && typeof value !== "number") {
                return "";
            }
            return typeof value === "string" ? value : String(value);
        };
        return StringFormat;
    }(Formatter));
    var PluralFormat = /** @class */ (function () {
        function PluralFormat(id, useOrdinal, offset, options, locales) {
            this.id = id;
            this.offset = offset;
            this.options = options;
            this.pluralRules = new Intl.PluralRules(locales, {
                type: useOrdinal ? "ordinal" : "cardinal"
            });
        }
        PluralFormat.prototype.getOption = function (value) {
            var options = this.options;
            var option = options["=" + value] ||
                options[this.pluralRules.select(value - this.offset)];
            return option || options.other;
        };
        return PluralFormat;
    }());
    var PluralOffsetString = /** @class */ (function (_super) {
        __extends(PluralOffsetString, _super);
        function PluralOffsetString(id, offset, numberFormat, string) {
            var _this = _super.call(this, id) || this;
            _this.offset = offset;
            _this.numberFormat = numberFormat;
            _this.string = string;
            return _this;
        }
        PluralOffsetString.prototype.format = function (value) {
            var number = this.numberFormat.format(value - this.offset);
            return this.string
                .replace(/(^|[^\\])#/g, "$1" + number)
                .replace(/\\#/g, "#");
        };
        return PluralOffsetString;
    }(Formatter));
    var SelectFormat = /** @class */ (function () {
        function SelectFormat(id, options) {
            this.id = id;
            this.options = options;
        }
        SelectFormat.prototype.getOption = function (value) {
            var options = this.options;
            return options[value] || options.other;
        };
        return SelectFormat;
    }());
    function isSelectOrPluralFormat(f) {
        return !!f.options;
    }

    /*
    Copyright (c) 2014, Yahoo! Inc. All rights reserved.
    Copyrights licensed under the New BSD License.
    See the accompanying LICENSE file for terms.
    */
    var __extends$1 = (undefined && undefined.__extends) || (function () {
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
    var __assign = (undefined && undefined.__assign) || function () {
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
        __extends$1(FormatError, _super);
        function FormatError(msg, variableId) {
            var _this = _super.call(this, msg) || this;
            _this.variableId = variableId;
            return _this;
        }
        return FormatError;
    }(Error));

    /* @generated */
    MessageFormat.__addLocaleData({ "locale": "af" });
    MessageFormat.__addLocaleData({ "locale": "af-NA", "parentLocale": "af" });
    MessageFormat.__addLocaleData({ "locale": "agq" });
    MessageFormat.__addLocaleData({ "locale": "ak" });
    MessageFormat.__addLocaleData({ "locale": "am" });
    MessageFormat.__addLocaleData({ "locale": "ar" });
    MessageFormat.__addLocaleData({ "locale": "ar-AE", "parentLocale": "ar" });
    MessageFormat.__addLocaleData({ "locale": "ar-BH", "parentLocale": "ar" });
    MessageFormat.__addLocaleData({ "locale": "ar-DJ", "parentLocale": "ar" });
    MessageFormat.__addLocaleData({ "locale": "ar-DZ", "parentLocale": "ar" });
    MessageFormat.__addLocaleData({ "locale": "ar-EG", "parentLocale": "ar" });
    MessageFormat.__addLocaleData({ "locale": "ar-EH", "parentLocale": "ar" });
    MessageFormat.__addLocaleData({ "locale": "ar-ER", "parentLocale": "ar" });
    MessageFormat.__addLocaleData({ "locale": "ar-IL", "parentLocale": "ar" });
    MessageFormat.__addLocaleData({ "locale": "ar-IQ", "parentLocale": "ar" });
    MessageFormat.__addLocaleData({ "locale": "ar-JO", "parentLocale": "ar" });
    MessageFormat.__addLocaleData({ "locale": "ar-KM", "parentLocale": "ar" });
    MessageFormat.__addLocaleData({ "locale": "ar-KW", "parentLocale": "ar" });
    MessageFormat.__addLocaleData({ "locale": "ar-LB", "parentLocale": "ar" });
    MessageFormat.__addLocaleData({ "locale": "ar-LY", "parentLocale": "ar" });
    MessageFormat.__addLocaleData({ "locale": "ar-MA", "parentLocale": "ar" });
    MessageFormat.__addLocaleData({ "locale": "ar-MR", "parentLocale": "ar" });
    MessageFormat.__addLocaleData({ "locale": "ar-OM", "parentLocale": "ar" });
    MessageFormat.__addLocaleData({ "locale": "ar-PS", "parentLocale": "ar" });
    MessageFormat.__addLocaleData({ "locale": "ar-QA", "parentLocale": "ar" });
    MessageFormat.__addLocaleData({ "locale": "ar-SA", "parentLocale": "ar" });
    MessageFormat.__addLocaleData({ "locale": "ar-SD", "parentLocale": "ar" });
    MessageFormat.__addLocaleData({ "locale": "ar-SO", "parentLocale": "ar" });
    MessageFormat.__addLocaleData({ "locale": "ar-SS", "parentLocale": "ar" });
    MessageFormat.__addLocaleData({ "locale": "ar-SY", "parentLocale": "ar" });
    MessageFormat.__addLocaleData({ "locale": "ar-TD", "parentLocale": "ar" });
    MessageFormat.__addLocaleData({ "locale": "ar-TN", "parentLocale": "ar" });
    MessageFormat.__addLocaleData({ "locale": "ar-YE", "parentLocale": "ar" });
    MessageFormat.__addLocaleData({ "locale": "ars" });
    MessageFormat.__addLocaleData({ "locale": "as" });
    MessageFormat.__addLocaleData({ "locale": "asa" });
    MessageFormat.__addLocaleData({ "locale": "ast" });
    MessageFormat.__addLocaleData({ "locale": "az" });
    MessageFormat.__addLocaleData({ "locale": "az-Arab" });
    MessageFormat.__addLocaleData({ "locale": "az-Cyrl" });
    MessageFormat.__addLocaleData({ "locale": "az-Latn", "parentLocale": "az" });
    MessageFormat.__addLocaleData({ "locale": "bas" });
    MessageFormat.__addLocaleData({ "locale": "be" });
    MessageFormat.__addLocaleData({ "locale": "bem" });
    MessageFormat.__addLocaleData({ "locale": "bez" });
    MessageFormat.__addLocaleData({ "locale": "bg" });
    MessageFormat.__addLocaleData({ "locale": "bh" });
    MessageFormat.__addLocaleData({ "locale": "bm" });
    MessageFormat.__addLocaleData({ "locale": "bm-Nkoo" });
    MessageFormat.__addLocaleData({ "locale": "bn" });
    MessageFormat.__addLocaleData({ "locale": "bn-IN", "parentLocale": "bn" });
    MessageFormat.__addLocaleData({ "locale": "bo" });
    MessageFormat.__addLocaleData({ "locale": "bo-IN", "parentLocale": "bo" });
    MessageFormat.__addLocaleData({ "locale": "br" });
    MessageFormat.__addLocaleData({ "locale": "brx" });
    MessageFormat.__addLocaleData({ "locale": "bs" });
    MessageFormat.__addLocaleData({ "locale": "bs-Cyrl" });
    MessageFormat.__addLocaleData({ "locale": "bs-Latn", "parentLocale": "bs" });
    MessageFormat.__addLocaleData({ "locale": "ca" });
    MessageFormat.__addLocaleData({ "locale": "ca-AD", "parentLocale": "ca" });
    MessageFormat.__addLocaleData({ "locale": "ca-ES-VALENCIA", "parentLocale": "ca-ES" });
    MessageFormat.__addLocaleData({ "locale": "ca-ES", "parentLocale": "ca" });
    MessageFormat.__addLocaleData({ "locale": "ca-FR", "parentLocale": "ca" });
    MessageFormat.__addLocaleData({ "locale": "ca-IT", "parentLocale": "ca" });
    MessageFormat.__addLocaleData({ "locale": "ccp" });
    MessageFormat.__addLocaleData({ "locale": "ccp-IN", "parentLocale": "ccp" });
    MessageFormat.__addLocaleData({ "locale": "ce" });
    MessageFormat.__addLocaleData({ "locale": "cgg" });
    MessageFormat.__addLocaleData({ "locale": "chr" });
    MessageFormat.__addLocaleData({ "locale": "ckb" });
    MessageFormat.__addLocaleData({ "locale": "ckb-IR", "parentLocale": "ckb" });
    MessageFormat.__addLocaleData({ "locale": "cs" });
    MessageFormat.__addLocaleData({ "locale": "cu" });
    MessageFormat.__addLocaleData({ "locale": "cy" });
    MessageFormat.__addLocaleData({ "locale": "da" });
    MessageFormat.__addLocaleData({ "locale": "da-GL", "parentLocale": "da" });
    MessageFormat.__addLocaleData({ "locale": "dav" });
    MessageFormat.__addLocaleData({ "locale": "de" });
    MessageFormat.__addLocaleData({ "locale": "de-AT", "parentLocale": "de" });
    MessageFormat.__addLocaleData({ "locale": "de-BE", "parentLocale": "de" });
    MessageFormat.__addLocaleData({ "locale": "de-CH", "parentLocale": "de" });
    MessageFormat.__addLocaleData({ "locale": "de-IT", "parentLocale": "de" });
    MessageFormat.__addLocaleData({ "locale": "de-LI", "parentLocale": "de" });
    MessageFormat.__addLocaleData({ "locale": "de-LU", "parentLocale": "de" });
    MessageFormat.__addLocaleData({ "locale": "dje" });
    MessageFormat.__addLocaleData({ "locale": "dsb" });
    MessageFormat.__addLocaleData({ "locale": "dua" });
    MessageFormat.__addLocaleData({ "locale": "dv" });
    MessageFormat.__addLocaleData({ "locale": "dyo" });
    MessageFormat.__addLocaleData({ "locale": "dz" });
    MessageFormat.__addLocaleData({ "locale": "ebu" });
    MessageFormat.__addLocaleData({ "locale": "ee" });
    MessageFormat.__addLocaleData({ "locale": "ee-TG", "parentLocale": "ee" });
    MessageFormat.__addLocaleData({ "locale": "el" });
    MessageFormat.__addLocaleData({ "locale": "el-CY", "parentLocale": "el" });
    MessageFormat.__addLocaleData({ "locale": "en" });
    MessageFormat.__addLocaleData({ "locale": "en-001", "parentLocale": "en" });
    MessageFormat.__addLocaleData({ "locale": "en-150", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-AG", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-AI", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-AS", "parentLocale": "en" });
    MessageFormat.__addLocaleData({ "locale": "en-AT", "parentLocale": "en-150" });
    MessageFormat.__addLocaleData({ "locale": "en-AU", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-BB", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-BE", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-BI", "parentLocale": "en" });
    MessageFormat.__addLocaleData({ "locale": "en-BM", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-BS", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-BW", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-BZ", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-CA", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-CC", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-CH", "parentLocale": "en-150" });
    MessageFormat.__addLocaleData({ "locale": "en-CK", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-CM", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-CX", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-CY", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-DE", "parentLocale": "en-150" });
    MessageFormat.__addLocaleData({ "locale": "en-DG", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-DK", "parentLocale": "en-150" });
    MessageFormat.__addLocaleData({ "locale": "en-DM", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-Dsrt" });
    MessageFormat.__addLocaleData({ "locale": "en-ER", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-FI", "parentLocale": "en-150" });
    MessageFormat.__addLocaleData({ "locale": "en-FJ", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-FK", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-FM", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-GB", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-GD", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-GG", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-GH", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-GI", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-GM", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-GU", "parentLocale": "en" });
    MessageFormat.__addLocaleData({ "locale": "en-GY", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-HK", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-IE", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-IL", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-IM", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-IN", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-IO", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-JE", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-JM", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-KE", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-KI", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-KN", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-KY", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-LC", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-LR", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-LS", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-MG", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-MH", "parentLocale": "en" });
    MessageFormat.__addLocaleData({ "locale": "en-MO", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-MP", "parentLocale": "en" });
    MessageFormat.__addLocaleData({ "locale": "en-MS", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-MT", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-MU", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-MW", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-MY", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-NA", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-NF", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-NG", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-NL", "parentLocale": "en-150" });
    MessageFormat.__addLocaleData({ "locale": "en-NR", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-NU", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-NZ", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-PG", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-PH", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-PK", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-PN", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-PR", "parentLocale": "en" });
    MessageFormat.__addLocaleData({ "locale": "en-PW", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-RW", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-SB", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-SC", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-SD", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-SE", "parentLocale": "en-150" });
    MessageFormat.__addLocaleData({ "locale": "en-SG", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-SH", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-SI", "parentLocale": "en-150" });
    MessageFormat.__addLocaleData({ "locale": "en-SL", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-SS", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-SX", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-SZ", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-Shaw" });
    MessageFormat.__addLocaleData({ "locale": "en-TC", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-TK", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-TO", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-TT", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-TV", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-TZ", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-UG", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-UM", "parentLocale": "en" });
    MessageFormat.__addLocaleData({ "locale": "en-US", "parentLocale": "en" });
    MessageFormat.__addLocaleData({ "locale": "en-VC", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-VG", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-VI", "parentLocale": "en" });
    MessageFormat.__addLocaleData({ "locale": "en-VU", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-WS", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-ZA", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-ZM", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "en-ZW", "parentLocale": "en-001" });
    MessageFormat.__addLocaleData({ "locale": "eo" });
    MessageFormat.__addLocaleData({ "locale": "es" });
    MessageFormat.__addLocaleData({ "locale": "es-419", "parentLocale": "es" });
    MessageFormat.__addLocaleData({ "locale": "es-AR", "parentLocale": "es-419" });
    MessageFormat.__addLocaleData({ "locale": "es-BO", "parentLocale": "es-419" });
    MessageFormat.__addLocaleData({ "locale": "es-BR", "parentLocale": "es-419" });
    MessageFormat.__addLocaleData({ "locale": "es-BZ", "parentLocale": "es-419" });
    MessageFormat.__addLocaleData({ "locale": "es-CL", "parentLocale": "es-419" });
    MessageFormat.__addLocaleData({ "locale": "es-CO", "parentLocale": "es-419" });
    MessageFormat.__addLocaleData({ "locale": "es-CR", "parentLocale": "es-419" });
    MessageFormat.__addLocaleData({ "locale": "es-CU", "parentLocale": "es-419" });
    MessageFormat.__addLocaleData({ "locale": "es-DO", "parentLocale": "es-419" });
    MessageFormat.__addLocaleData({ "locale": "es-EA", "parentLocale": "es" });
    MessageFormat.__addLocaleData({ "locale": "es-EC", "parentLocale": "es-419" });
    MessageFormat.__addLocaleData({ "locale": "es-GQ", "parentLocale": "es" });
    MessageFormat.__addLocaleData({ "locale": "es-GT", "parentLocale": "es-419" });
    MessageFormat.__addLocaleData({ "locale": "es-HN", "parentLocale": "es-419" });
    MessageFormat.__addLocaleData({ "locale": "es-IC", "parentLocale": "es" });
    MessageFormat.__addLocaleData({ "locale": "es-MX", "parentLocale": "es-419" });
    MessageFormat.__addLocaleData({ "locale": "es-NI", "parentLocale": "es-419" });
    MessageFormat.__addLocaleData({ "locale": "es-PA", "parentLocale": "es-419" });
    MessageFormat.__addLocaleData({ "locale": "es-PE", "parentLocale": "es-419" });
    MessageFormat.__addLocaleData({ "locale": "es-PH", "parentLocale": "es" });
    MessageFormat.__addLocaleData({ "locale": "es-PR", "parentLocale": "es-419" });
    MessageFormat.__addLocaleData({ "locale": "es-PY", "parentLocale": "es-419" });
    MessageFormat.__addLocaleData({ "locale": "es-SV", "parentLocale": "es-419" });
    MessageFormat.__addLocaleData({ "locale": "es-US", "parentLocale": "es-419" });
    MessageFormat.__addLocaleData({ "locale": "es-UY", "parentLocale": "es-419" });
    MessageFormat.__addLocaleData({ "locale": "es-VE", "parentLocale": "es-419" });
    MessageFormat.__addLocaleData({ "locale": "et" });
    MessageFormat.__addLocaleData({ "locale": "eu" });
    MessageFormat.__addLocaleData({ "locale": "ewo" });
    MessageFormat.__addLocaleData({ "locale": "fa" });
    MessageFormat.__addLocaleData({ "locale": "fa-AF", "parentLocale": "fa" });
    MessageFormat.__addLocaleData({ "locale": "ff" });
    MessageFormat.__addLocaleData({ "locale": "ff-Adlm" });
    MessageFormat.__addLocaleData({ "locale": "ff-Latn", "parentLocale": "ff" });
    MessageFormat.__addLocaleData({ "locale": "ff-Latn-BF", "parentLocale": "ff-Latn" });
    MessageFormat.__addLocaleData({ "locale": "ff-Latn-CM", "parentLocale": "ff-Latn" });
    MessageFormat.__addLocaleData({ "locale": "ff-Latn-GH", "parentLocale": "ff-Latn" });
    MessageFormat.__addLocaleData({ "locale": "ff-Latn-GM", "parentLocale": "ff-Latn" });
    MessageFormat.__addLocaleData({ "locale": "ff-Latn-GN", "parentLocale": "ff-Latn" });
    MessageFormat.__addLocaleData({ "locale": "ff-Latn-GW", "parentLocale": "ff-Latn" });
    MessageFormat.__addLocaleData({ "locale": "ff-Latn-LR", "parentLocale": "ff-Latn" });
    MessageFormat.__addLocaleData({ "locale": "ff-Latn-MR", "parentLocale": "ff-Latn" });
    MessageFormat.__addLocaleData({ "locale": "ff-Latn-NE", "parentLocale": "ff-Latn" });
    MessageFormat.__addLocaleData({ "locale": "ff-Latn-NG", "parentLocale": "ff-Latn" });
    MessageFormat.__addLocaleData({ "locale": "ff-Latn-SL", "parentLocale": "ff-Latn" });
    MessageFormat.__addLocaleData({ "locale": "fi" });
    MessageFormat.__addLocaleData({ "locale": "fil" });
    MessageFormat.__addLocaleData({ "locale": "fo" });
    MessageFormat.__addLocaleData({ "locale": "fo-DK", "parentLocale": "fo" });
    MessageFormat.__addLocaleData({ "locale": "fr" });
    MessageFormat.__addLocaleData({ "locale": "fr-BE", "parentLocale": "fr" });
    MessageFormat.__addLocaleData({ "locale": "fr-BF", "parentLocale": "fr" });
    MessageFormat.__addLocaleData({ "locale": "fr-BI", "parentLocale": "fr" });
    MessageFormat.__addLocaleData({ "locale": "fr-BJ", "parentLocale": "fr" });
    MessageFormat.__addLocaleData({ "locale": "fr-BL", "parentLocale": "fr" });
    MessageFormat.__addLocaleData({ "locale": "fr-CA", "parentLocale": "fr" });
    MessageFormat.__addLocaleData({ "locale": "fr-CD", "parentLocale": "fr" });
    MessageFormat.__addLocaleData({ "locale": "fr-CF", "parentLocale": "fr" });
    MessageFormat.__addLocaleData({ "locale": "fr-CG", "parentLocale": "fr" });
    MessageFormat.__addLocaleData({ "locale": "fr-CH", "parentLocale": "fr" });
    MessageFormat.__addLocaleData({ "locale": "fr-CI", "parentLocale": "fr" });
    MessageFormat.__addLocaleData({ "locale": "fr-CM", "parentLocale": "fr" });
    MessageFormat.__addLocaleData({ "locale": "fr-DJ", "parentLocale": "fr" });
    MessageFormat.__addLocaleData({ "locale": "fr-DZ", "parentLocale": "fr" });
    MessageFormat.__addLocaleData({ "locale": "fr-GA", "parentLocale": "fr" });
    MessageFormat.__addLocaleData({ "locale": "fr-GF", "parentLocale": "fr" });
    MessageFormat.__addLocaleData({ "locale": "fr-GN", "parentLocale": "fr" });
    MessageFormat.__addLocaleData({ "locale": "fr-GP", "parentLocale": "fr" });
    MessageFormat.__addLocaleData({ "locale": "fr-GQ", "parentLocale": "fr" });
    MessageFormat.__addLocaleData({ "locale": "fr-HT", "parentLocale": "fr" });
    MessageFormat.__addLocaleData({ "locale": "fr-KM", "parentLocale": "fr" });
    MessageFormat.__addLocaleData({ "locale": "fr-LU", "parentLocale": "fr" });
    MessageFormat.__addLocaleData({ "locale": "fr-MA", "parentLocale": "fr" });
    MessageFormat.__addLocaleData({ "locale": "fr-MC", "parentLocale": "fr" });
    MessageFormat.__addLocaleData({ "locale": "fr-MF", "parentLocale": "fr" });
    MessageFormat.__addLocaleData({ "locale": "fr-MG", "parentLocale": "fr" });
    MessageFormat.__addLocaleData({ "locale": "fr-ML", "parentLocale": "fr" });
    MessageFormat.__addLocaleData({ "locale": "fr-MQ", "parentLocale": "fr" });
    MessageFormat.__addLocaleData({ "locale": "fr-MR", "parentLocale": "fr" });
    MessageFormat.__addLocaleData({ "locale": "fr-MU", "parentLocale": "fr" });
    MessageFormat.__addLocaleData({ "locale": "fr-NC", "parentLocale": "fr" });
    MessageFormat.__addLocaleData({ "locale": "fr-NE", "parentLocale": "fr" });
    MessageFormat.__addLocaleData({ "locale": "fr-PF", "parentLocale": "fr" });
    MessageFormat.__addLocaleData({ "locale": "fr-PM", "parentLocale": "fr" });
    MessageFormat.__addLocaleData({ "locale": "fr-RE", "parentLocale": "fr" });
    MessageFormat.__addLocaleData({ "locale": "fr-RW", "parentLocale": "fr" });
    MessageFormat.__addLocaleData({ "locale": "fr-SC", "parentLocale": "fr" });
    MessageFormat.__addLocaleData({ "locale": "fr-SN", "parentLocale": "fr" });
    MessageFormat.__addLocaleData({ "locale": "fr-SY", "parentLocale": "fr" });
    MessageFormat.__addLocaleData({ "locale": "fr-TD", "parentLocale": "fr" });
    MessageFormat.__addLocaleData({ "locale": "fr-TG", "parentLocale": "fr" });
    MessageFormat.__addLocaleData({ "locale": "fr-TN", "parentLocale": "fr" });
    MessageFormat.__addLocaleData({ "locale": "fr-VU", "parentLocale": "fr" });
    MessageFormat.__addLocaleData({ "locale": "fr-WF", "parentLocale": "fr" });
    MessageFormat.__addLocaleData({ "locale": "fr-YT", "parentLocale": "fr" });
    MessageFormat.__addLocaleData({ "locale": "fur" });
    MessageFormat.__addLocaleData({ "locale": "fy" });
    MessageFormat.__addLocaleData({ "locale": "ga" });
    MessageFormat.__addLocaleData({ "locale": "gd" });
    MessageFormat.__addLocaleData({ "locale": "gl" });
    MessageFormat.__addLocaleData({ "locale": "gsw" });
    MessageFormat.__addLocaleData({ "locale": "gsw-FR", "parentLocale": "gsw" });
    MessageFormat.__addLocaleData({ "locale": "gsw-LI", "parentLocale": "gsw" });
    MessageFormat.__addLocaleData({ "locale": "gu" });
    MessageFormat.__addLocaleData({ "locale": "guw" });
    MessageFormat.__addLocaleData({ "locale": "guz" });
    MessageFormat.__addLocaleData({ "locale": "gv" });
    MessageFormat.__addLocaleData({ "locale": "ha" });
    MessageFormat.__addLocaleData({ "locale": "ha-Arab" });
    MessageFormat.__addLocaleData({ "locale": "ha-GH", "parentLocale": "ha" });
    MessageFormat.__addLocaleData({ "locale": "ha-NE", "parentLocale": "ha" });
    MessageFormat.__addLocaleData({ "locale": "haw" });
    MessageFormat.__addLocaleData({ "locale": "he" });
    MessageFormat.__addLocaleData({ "locale": "hi" });
    MessageFormat.__addLocaleData({ "locale": "hr" });
    MessageFormat.__addLocaleData({ "locale": "hr-BA", "parentLocale": "hr" });
    MessageFormat.__addLocaleData({ "locale": "hsb" });
    MessageFormat.__addLocaleData({ "locale": "hu" });
    MessageFormat.__addLocaleData({ "locale": "hy" });
    MessageFormat.__addLocaleData({ "locale": "ia" });
    MessageFormat.__addLocaleData({ "locale": "id" });
    MessageFormat.__addLocaleData({ "locale": "ig" });
    MessageFormat.__addLocaleData({ "locale": "ii" });
    MessageFormat.__addLocaleData({ "locale": "in" });
    MessageFormat.__addLocaleData({ "locale": "io" });
    MessageFormat.__addLocaleData({ "locale": "is" });
    MessageFormat.__addLocaleData({ "locale": "it" });
    MessageFormat.__addLocaleData({ "locale": "it-CH", "parentLocale": "it" });
    MessageFormat.__addLocaleData({ "locale": "it-SM", "parentLocale": "it" });
    MessageFormat.__addLocaleData({ "locale": "it-VA", "parentLocale": "it" });
    MessageFormat.__addLocaleData({ "locale": "iu" });
    MessageFormat.__addLocaleData({ "locale": "iu-Latn" });
    MessageFormat.__addLocaleData({ "locale": "iw" });
    MessageFormat.__addLocaleData({ "locale": "ja" });
    MessageFormat.__addLocaleData({ "locale": "jbo" });
    MessageFormat.__addLocaleData({ "locale": "jgo" });
    MessageFormat.__addLocaleData({ "locale": "ji" });
    MessageFormat.__addLocaleData({ "locale": "jmc" });
    MessageFormat.__addLocaleData({ "locale": "jv" });
    MessageFormat.__addLocaleData({ "locale": "jw" });
    MessageFormat.__addLocaleData({ "locale": "ka" });
    MessageFormat.__addLocaleData({ "locale": "kab" });
    MessageFormat.__addLocaleData({ "locale": "kaj" });
    MessageFormat.__addLocaleData({ "locale": "kam" });
    MessageFormat.__addLocaleData({ "locale": "kcg" });
    MessageFormat.__addLocaleData({ "locale": "kde" });
    MessageFormat.__addLocaleData({ "locale": "kea" });
    MessageFormat.__addLocaleData({ "locale": "khq" });
    MessageFormat.__addLocaleData({ "locale": "ki" });
    MessageFormat.__addLocaleData({ "locale": "kk" });
    MessageFormat.__addLocaleData({ "locale": "kkj" });
    MessageFormat.__addLocaleData({ "locale": "kl" });
    MessageFormat.__addLocaleData({ "locale": "kln" });
    MessageFormat.__addLocaleData({ "locale": "km" });
    MessageFormat.__addLocaleData({ "locale": "kn" });
    MessageFormat.__addLocaleData({ "locale": "ko" });
    MessageFormat.__addLocaleData({ "locale": "ko-KP", "parentLocale": "ko" });
    MessageFormat.__addLocaleData({ "locale": "kok" });
    MessageFormat.__addLocaleData({ "locale": "ks" });
    MessageFormat.__addLocaleData({ "locale": "ksb" });
    MessageFormat.__addLocaleData({ "locale": "ksf" });
    MessageFormat.__addLocaleData({ "locale": "ksh" });
    MessageFormat.__addLocaleData({ "locale": "ku" });
    MessageFormat.__addLocaleData({ "locale": "kw" });
    MessageFormat.__addLocaleData({ "locale": "ky" });
    MessageFormat.__addLocaleData({ "locale": "lag" });
    MessageFormat.__addLocaleData({ "locale": "lb" });
    MessageFormat.__addLocaleData({ "locale": "lg" });
    MessageFormat.__addLocaleData({ "locale": "lkt" });
    MessageFormat.__addLocaleData({ "locale": "ln" });
    MessageFormat.__addLocaleData({ "locale": "ln-AO", "parentLocale": "ln" });
    MessageFormat.__addLocaleData({ "locale": "ln-CF", "parentLocale": "ln" });
    MessageFormat.__addLocaleData({ "locale": "ln-CG", "parentLocale": "ln" });
    MessageFormat.__addLocaleData({ "locale": "lo" });
    MessageFormat.__addLocaleData({ "locale": "lrc" });
    MessageFormat.__addLocaleData({ "locale": "lrc-IQ", "parentLocale": "lrc" });
    MessageFormat.__addLocaleData({ "locale": "lt" });
    MessageFormat.__addLocaleData({ "locale": "lu" });
    MessageFormat.__addLocaleData({ "locale": "luo" });
    MessageFormat.__addLocaleData({ "locale": "luy" });
    MessageFormat.__addLocaleData({ "locale": "lv" });
    MessageFormat.__addLocaleData({ "locale": "mas" });
    MessageFormat.__addLocaleData({ "locale": "mas-TZ", "parentLocale": "mas" });
    MessageFormat.__addLocaleData({ "locale": "mer" });
    MessageFormat.__addLocaleData({ "locale": "mfe" });
    MessageFormat.__addLocaleData({ "locale": "mg" });
    MessageFormat.__addLocaleData({ "locale": "mgh" });
    MessageFormat.__addLocaleData({ "locale": "mgo" });
    MessageFormat.__addLocaleData({ "locale": "mi" });
    MessageFormat.__addLocaleData({ "locale": "mk" });
    MessageFormat.__addLocaleData({ "locale": "ml" });
    MessageFormat.__addLocaleData({ "locale": "mn" });
    MessageFormat.__addLocaleData({ "locale": "mn-Mong" });
    MessageFormat.__addLocaleData({ "locale": "mo" });
    MessageFormat.__addLocaleData({ "locale": "mr" });
    MessageFormat.__addLocaleData({ "locale": "ms" });
    MessageFormat.__addLocaleData({ "locale": "ms-Arab" });
    MessageFormat.__addLocaleData({ "locale": "ms-BN", "parentLocale": "ms" });
    MessageFormat.__addLocaleData({ "locale": "ms-SG", "parentLocale": "ms" });
    MessageFormat.__addLocaleData({ "locale": "mt" });
    MessageFormat.__addLocaleData({ "locale": "mua" });
    MessageFormat.__addLocaleData({ "locale": "my" });
    MessageFormat.__addLocaleData({ "locale": "mzn" });
    MessageFormat.__addLocaleData({ "locale": "nah" });
    MessageFormat.__addLocaleData({ "locale": "naq" });
    MessageFormat.__addLocaleData({ "locale": "nb" });
    MessageFormat.__addLocaleData({ "locale": "nb-SJ", "parentLocale": "nb" });
    MessageFormat.__addLocaleData({ "locale": "nd" });
    MessageFormat.__addLocaleData({ "locale": "nds" });
    MessageFormat.__addLocaleData({ "locale": "nds-NL", "parentLocale": "nds" });
    MessageFormat.__addLocaleData({ "locale": "ne" });
    MessageFormat.__addLocaleData({ "locale": "ne-IN", "parentLocale": "ne" });
    MessageFormat.__addLocaleData({ "locale": "nl" });
    MessageFormat.__addLocaleData({ "locale": "nl-AW", "parentLocale": "nl" });
    MessageFormat.__addLocaleData({ "locale": "nl-BE", "parentLocale": "nl" });
    MessageFormat.__addLocaleData({ "locale": "nl-BQ", "parentLocale": "nl" });
    MessageFormat.__addLocaleData({ "locale": "nl-CW", "parentLocale": "nl" });
    MessageFormat.__addLocaleData({ "locale": "nl-SR", "parentLocale": "nl" });
    MessageFormat.__addLocaleData({ "locale": "nl-SX", "parentLocale": "nl" });
    MessageFormat.__addLocaleData({ "locale": "nmg" });
    MessageFormat.__addLocaleData({ "locale": "nn" });
    MessageFormat.__addLocaleData({ "locale": "nnh" });
    MessageFormat.__addLocaleData({ "locale": "no" });
    MessageFormat.__addLocaleData({ "locale": "nqo" });
    MessageFormat.__addLocaleData({ "locale": "nr" });
    MessageFormat.__addLocaleData({ "locale": "nso" });
    MessageFormat.__addLocaleData({ "locale": "nus" });
    MessageFormat.__addLocaleData({ "locale": "ny" });
    MessageFormat.__addLocaleData({ "locale": "nyn" });
    MessageFormat.__addLocaleData({ "locale": "om" });
    MessageFormat.__addLocaleData({ "locale": "om-KE", "parentLocale": "om" });
    MessageFormat.__addLocaleData({ "locale": "or" });
    MessageFormat.__addLocaleData({ "locale": "os" });
    MessageFormat.__addLocaleData({ "locale": "os-RU", "parentLocale": "os" });
    MessageFormat.__addLocaleData({ "locale": "pa" });
    MessageFormat.__addLocaleData({ "locale": "pa-Arab" });
    MessageFormat.__addLocaleData({ "locale": "pa-Guru", "parentLocale": "pa" });
    MessageFormat.__addLocaleData({ "locale": "pap" });
    MessageFormat.__addLocaleData({ "locale": "pl" });
    MessageFormat.__addLocaleData({ "locale": "prg" });
    MessageFormat.__addLocaleData({ "locale": "ps" });
    MessageFormat.__addLocaleData({ "locale": "pt" });
    MessageFormat.__addLocaleData({ "locale": "pt-AO", "parentLocale": "pt-PT" });
    MessageFormat.__addLocaleData({ "locale": "pt-PT", "parentLocale": "pt" });
    MessageFormat.__addLocaleData({ "locale": "pt-CH", "parentLocale": "pt-PT" });
    MessageFormat.__addLocaleData({ "locale": "pt-CV", "parentLocale": "pt-PT" });
    MessageFormat.__addLocaleData({ "locale": "pt-GQ", "parentLocale": "pt-PT" });
    MessageFormat.__addLocaleData({ "locale": "pt-GW", "parentLocale": "pt-PT" });
    MessageFormat.__addLocaleData({ "locale": "pt-LU", "parentLocale": "pt-PT" });
    MessageFormat.__addLocaleData({ "locale": "pt-MO", "parentLocale": "pt-PT" });
    MessageFormat.__addLocaleData({ "locale": "pt-MZ", "parentLocale": "pt-PT" });
    MessageFormat.__addLocaleData({ "locale": "pt-ST", "parentLocale": "pt-PT" });
    MessageFormat.__addLocaleData({ "locale": "pt-TL", "parentLocale": "pt-PT" });
    MessageFormat.__addLocaleData({ "locale": "qu" });
    MessageFormat.__addLocaleData({ "locale": "qu-BO", "parentLocale": "qu" });
    MessageFormat.__addLocaleData({ "locale": "qu-EC", "parentLocale": "qu" });
    MessageFormat.__addLocaleData({ "locale": "rm" });
    MessageFormat.__addLocaleData({ "locale": "rn" });
    MessageFormat.__addLocaleData({ "locale": "ro" });
    MessageFormat.__addLocaleData({ "locale": "ro-MD", "parentLocale": "ro" });
    MessageFormat.__addLocaleData({ "locale": "rof" });
    MessageFormat.__addLocaleData({ "locale": "ru" });
    MessageFormat.__addLocaleData({ "locale": "ru-BY", "parentLocale": "ru" });
    MessageFormat.__addLocaleData({ "locale": "ru-KG", "parentLocale": "ru" });
    MessageFormat.__addLocaleData({ "locale": "ru-KZ", "parentLocale": "ru" });
    MessageFormat.__addLocaleData({ "locale": "ru-MD", "parentLocale": "ru" });
    MessageFormat.__addLocaleData({ "locale": "ru-UA", "parentLocale": "ru" });
    MessageFormat.__addLocaleData({ "locale": "rw" });
    MessageFormat.__addLocaleData({ "locale": "rwk" });
    MessageFormat.__addLocaleData({ "locale": "sah" });
    MessageFormat.__addLocaleData({ "locale": "saq" });
    MessageFormat.__addLocaleData({ "locale": "sbp" });
    MessageFormat.__addLocaleData({ "locale": "sc" });
    MessageFormat.__addLocaleData({ "locale": "scn" });
    MessageFormat.__addLocaleData({ "locale": "sd" });
    MessageFormat.__addLocaleData({ "locale": "sdh" });
    MessageFormat.__addLocaleData({ "locale": "se" });
    MessageFormat.__addLocaleData({ "locale": "se-FI", "parentLocale": "se" });
    MessageFormat.__addLocaleData({ "locale": "se-SE", "parentLocale": "se" });
    MessageFormat.__addLocaleData({ "locale": "seh" });
    MessageFormat.__addLocaleData({ "locale": "ses" });
    MessageFormat.__addLocaleData({ "locale": "sg" });
    MessageFormat.__addLocaleData({ "locale": "sh" });
    MessageFormat.__addLocaleData({ "locale": "shi" });
    MessageFormat.__addLocaleData({ "locale": "shi-Latn" });
    MessageFormat.__addLocaleData({ "locale": "shi-Tfng", "parentLocale": "shi" });
    MessageFormat.__addLocaleData({ "locale": "si" });
    MessageFormat.__addLocaleData({ "locale": "sk" });
    MessageFormat.__addLocaleData({ "locale": "sl" });
    MessageFormat.__addLocaleData({ "locale": "sma" });
    MessageFormat.__addLocaleData({ "locale": "smi" });
    MessageFormat.__addLocaleData({ "locale": "smj" });
    MessageFormat.__addLocaleData({ "locale": "smn" });
    MessageFormat.__addLocaleData({ "locale": "sms" });
    MessageFormat.__addLocaleData({ "locale": "sn" });
    MessageFormat.__addLocaleData({ "locale": "so" });
    MessageFormat.__addLocaleData({ "locale": "so-DJ", "parentLocale": "so" });
    MessageFormat.__addLocaleData({ "locale": "so-ET", "parentLocale": "so" });
    MessageFormat.__addLocaleData({ "locale": "so-KE", "parentLocale": "so" });
    MessageFormat.__addLocaleData({ "locale": "sq" });
    MessageFormat.__addLocaleData({ "locale": "sq-MK", "parentLocale": "sq" });
    MessageFormat.__addLocaleData({ "locale": "sq-XK", "parentLocale": "sq" });
    MessageFormat.__addLocaleData({ "locale": "sr" });
    MessageFormat.__addLocaleData({ "locale": "sr-Cyrl", "parentLocale": "sr" });
    MessageFormat.__addLocaleData({ "locale": "sr-Cyrl-BA", "parentLocale": "sr-Cyrl" });
    MessageFormat.__addLocaleData({ "locale": "sr-Cyrl-ME", "parentLocale": "sr-Cyrl" });
    MessageFormat.__addLocaleData({ "locale": "sr-Cyrl-XK", "parentLocale": "sr-Cyrl" });
    MessageFormat.__addLocaleData({ "locale": "sr-Latn" });
    MessageFormat.__addLocaleData({ "locale": "sr-Latn-BA", "parentLocale": "sr-Latn" });
    MessageFormat.__addLocaleData({ "locale": "sr-Latn-ME", "parentLocale": "sr-Latn" });
    MessageFormat.__addLocaleData({ "locale": "sr-Latn-XK", "parentLocale": "sr-Latn" });
    MessageFormat.__addLocaleData({ "locale": "ss" });
    MessageFormat.__addLocaleData({ "locale": "ssy" });
    MessageFormat.__addLocaleData({ "locale": "st" });
    MessageFormat.__addLocaleData({ "locale": "sv" });
    MessageFormat.__addLocaleData({ "locale": "sv-AX", "parentLocale": "sv" });
    MessageFormat.__addLocaleData({ "locale": "sv-FI", "parentLocale": "sv" });
    MessageFormat.__addLocaleData({ "locale": "sw" });
    MessageFormat.__addLocaleData({ "locale": "sw-CD", "parentLocale": "sw" });
    MessageFormat.__addLocaleData({ "locale": "sw-KE", "parentLocale": "sw" });
    MessageFormat.__addLocaleData({ "locale": "sw-UG", "parentLocale": "sw" });
    MessageFormat.__addLocaleData({ "locale": "syr" });
    MessageFormat.__addLocaleData({ "locale": "ta" });
    MessageFormat.__addLocaleData({ "locale": "ta-LK", "parentLocale": "ta" });
    MessageFormat.__addLocaleData({ "locale": "ta-MY", "parentLocale": "ta" });
    MessageFormat.__addLocaleData({ "locale": "ta-SG", "parentLocale": "ta" });
    MessageFormat.__addLocaleData({ "locale": "te" });
    MessageFormat.__addLocaleData({ "locale": "teo" });
    MessageFormat.__addLocaleData({ "locale": "teo-KE", "parentLocale": "teo" });
    MessageFormat.__addLocaleData({ "locale": "tg" });
    MessageFormat.__addLocaleData({ "locale": "th" });
    MessageFormat.__addLocaleData({ "locale": "ti" });
    MessageFormat.__addLocaleData({ "locale": "ti-ER", "parentLocale": "ti" });
    MessageFormat.__addLocaleData({ "locale": "tig" });
    MessageFormat.__addLocaleData({ "locale": "tk" });
    MessageFormat.__addLocaleData({ "locale": "tl" });
    MessageFormat.__addLocaleData({ "locale": "tn" });
    MessageFormat.__addLocaleData({ "locale": "to" });
    MessageFormat.__addLocaleData({ "locale": "tr" });
    MessageFormat.__addLocaleData({ "locale": "tr-CY", "parentLocale": "tr" });
    MessageFormat.__addLocaleData({ "locale": "ts" });
    MessageFormat.__addLocaleData({ "locale": "tt" });
    MessageFormat.__addLocaleData({ "locale": "twq" });
    MessageFormat.__addLocaleData({ "locale": "tzm" });
    MessageFormat.__addLocaleData({ "locale": "ug" });
    MessageFormat.__addLocaleData({ "locale": "uk" });
    MessageFormat.__addLocaleData({ "locale": "ur" });
    MessageFormat.__addLocaleData({ "locale": "ur-IN", "parentLocale": "ur" });
    MessageFormat.__addLocaleData({ "locale": "uz" });
    MessageFormat.__addLocaleData({ "locale": "uz-Arab" });
    MessageFormat.__addLocaleData({ "locale": "uz-Cyrl" });
    MessageFormat.__addLocaleData({ "locale": "uz-Latn", "parentLocale": "uz" });
    MessageFormat.__addLocaleData({ "locale": "vai" });
    MessageFormat.__addLocaleData({ "locale": "vai-Latn" });
    MessageFormat.__addLocaleData({ "locale": "vai-Vaii", "parentLocale": "vai" });
    MessageFormat.__addLocaleData({ "locale": "ve" });
    MessageFormat.__addLocaleData({ "locale": "vi" });
    MessageFormat.__addLocaleData({ "locale": "vo" });
    MessageFormat.__addLocaleData({ "locale": "vun" });
    MessageFormat.__addLocaleData({ "locale": "wa" });
    MessageFormat.__addLocaleData({ "locale": "wae" });
    MessageFormat.__addLocaleData({ "locale": "wo" });
    MessageFormat.__addLocaleData({ "locale": "xh" });
    MessageFormat.__addLocaleData({ "locale": "xog" });
    MessageFormat.__addLocaleData({ "locale": "yav" });
    MessageFormat.__addLocaleData({ "locale": "yi" });
    MessageFormat.__addLocaleData({ "locale": "yo" });
    MessageFormat.__addLocaleData({ "locale": "yo-BJ", "parentLocale": "yo" });
    MessageFormat.__addLocaleData({ "locale": "yue" });
    MessageFormat.__addLocaleData({ "locale": "yue-Hans" });
    MessageFormat.__addLocaleData({ "locale": "yue-Hant", "parentLocale": "yue" });
    MessageFormat.__addLocaleData({ "locale": "zgh" });
    MessageFormat.__addLocaleData({ "locale": "zh" });
    MessageFormat.__addLocaleData({ "locale": "zh-Hans", "parentLocale": "zh" });
    MessageFormat.__addLocaleData({ "locale": "zh-Hans-HK", "parentLocale": "zh-Hans" });
    MessageFormat.__addLocaleData({ "locale": "zh-Hans-MO", "parentLocale": "zh-Hans" });
    MessageFormat.__addLocaleData({ "locale": "zh-Hans-SG", "parentLocale": "zh-Hans" });
    MessageFormat.__addLocaleData({ "locale": "zh-Hant" });
    MessageFormat.__addLocaleData({ "locale": "zh-Hant-HK", "parentLocale": "zh-Hant" });
    MessageFormat.__addLocaleData({ "locale": "zh-Hant-MO", "parentLocale": "zh-Hant-HK" });
    MessageFormat.__addLocaleData({ "locale": "zu" });

    return MessageFormat;

}));
//# sourceMappingURL=intl-messageformat-with-locales.js.map
