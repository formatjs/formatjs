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
        MessageFormat.__addLocaleData = function () {
            var data = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                data[_i] = arguments[_i];
            }
            data.forEach(function (datum) {
                if (!(datum && datum.locale)) {
                    throw new Error("Locale data provided to IntlMessageFormat is missing a " +
                        "`locale` property");
                }
                MessageFormat.__localeData__[datum.locale.toLowerCase()] = datum;
            });
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
        MessageFormat.defaultLocale = "en";
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
    MessageFormat.__addLocaleData({ "locale": "af" }, { "locale": "af-NA", "parentLocale": "af" }, { "locale": "agq" }, { "locale": "ak" }, { "locale": "am" }, { "locale": "ar" }, { "locale": "ar-AE", "parentLocale": "ar" }, { "locale": "ar-BH", "parentLocale": "ar" }, { "locale": "ar-DJ", "parentLocale": "ar" }, { "locale": "ar-DZ", "parentLocale": "ar" }, { "locale": "ar-EG", "parentLocale": "ar" }, { "locale": "ar-EH", "parentLocale": "ar" }, { "locale": "ar-ER", "parentLocale": "ar" }, { "locale": "ar-IL", "parentLocale": "ar" }, { "locale": "ar-IQ", "parentLocale": "ar" }, { "locale": "ar-JO", "parentLocale": "ar" }, { "locale": "ar-KM", "parentLocale": "ar" }, { "locale": "ar-KW", "parentLocale": "ar" }, { "locale": "ar-LB", "parentLocale": "ar" }, { "locale": "ar-LY", "parentLocale": "ar" }, { "locale": "ar-MA", "parentLocale": "ar" }, { "locale": "ar-MR", "parentLocale": "ar" }, { "locale": "ar-OM", "parentLocale": "ar" }, { "locale": "ar-PS", "parentLocale": "ar" }, { "locale": "ar-QA", "parentLocale": "ar" }, { "locale": "ar-SA", "parentLocale": "ar" }, { "locale": "ar-SD", "parentLocale": "ar" }, { "locale": "ar-SO", "parentLocale": "ar" }, { "locale": "ar-SS", "parentLocale": "ar" }, { "locale": "ar-SY", "parentLocale": "ar" }, { "locale": "ar-TD", "parentLocale": "ar" }, { "locale": "ar-TN", "parentLocale": "ar" }, { "locale": "ar-YE", "parentLocale": "ar" }, { "locale": "ars" }, { "locale": "as" }, { "locale": "asa" }, { "locale": "ast" }, { "locale": "az" }, { "locale": "az-Arab" }, { "locale": "az-Cyrl" }, { "locale": "az-Latn", "parentLocale": "az" }, { "locale": "bas" }, { "locale": "be" }, { "locale": "bem" }, { "locale": "bez" }, { "locale": "bg" }, { "locale": "bh" }, { "locale": "bm" }, { "locale": "bm-Nkoo" }, { "locale": "bn" }, { "locale": "bn-IN", "parentLocale": "bn" }, { "locale": "bo" }, { "locale": "bo-IN", "parentLocale": "bo" }, { "locale": "br" }, { "locale": "brx" }, { "locale": "bs" }, { "locale": "bs-Cyrl" }, { "locale": "bs-Latn", "parentLocale": "bs" }, { "locale": "ca" }, { "locale": "ca-AD", "parentLocale": "ca" }, { "locale": "ca-ES-VALENCIA", "parentLocale": "ca-ES" }, { "locale": "ca-ES", "parentLocale": "ca" }, { "locale": "ca-FR", "parentLocale": "ca" }, { "locale": "ca-IT", "parentLocale": "ca" }, { "locale": "ccp" }, { "locale": "ccp-IN", "parentLocale": "ccp" }, { "locale": "ce" }, { "locale": "cgg" }, { "locale": "chr" }, { "locale": "ckb" }, { "locale": "ckb-IR", "parentLocale": "ckb" }, { "locale": "cs" }, { "locale": "cu" }, { "locale": "cy" }, { "locale": "da" }, { "locale": "da-GL", "parentLocale": "da" }, { "locale": "dav" }, { "locale": "de" }, { "locale": "de-AT", "parentLocale": "de" }, { "locale": "de-BE", "parentLocale": "de" }, { "locale": "de-CH", "parentLocale": "de" }, { "locale": "de-IT", "parentLocale": "de" }, { "locale": "de-LI", "parentLocale": "de" }, { "locale": "de-LU", "parentLocale": "de" }, { "locale": "dje" }, { "locale": "dsb" }, { "locale": "dua" }, { "locale": "dv" }, { "locale": "dyo" }, { "locale": "dz" }, { "locale": "ebu" }, { "locale": "ee" }, { "locale": "ee-TG", "parentLocale": "ee" }, { "locale": "el" }, { "locale": "el-CY", "parentLocale": "el" }, { "locale": "en" }, { "locale": "en-001", "parentLocale": "en" }, { "locale": "en-150", "parentLocale": "en-001" }, { "locale": "en-AG", "parentLocale": "en-001" }, { "locale": "en-AI", "parentLocale": "en-001" }, { "locale": "en-AS", "parentLocale": "en" }, { "locale": "en-AT", "parentLocale": "en-150" }, { "locale": "en-AU", "parentLocale": "en-001" }, { "locale": "en-BB", "parentLocale": "en-001" }, { "locale": "en-BE", "parentLocale": "en-001" }, { "locale": "en-BI", "parentLocale": "en" }, { "locale": "en-BM", "parentLocale": "en-001" }, { "locale": "en-BS", "parentLocale": "en-001" }, { "locale": "en-BW", "parentLocale": "en-001" }, { "locale": "en-BZ", "parentLocale": "en-001" }, { "locale": "en-CA", "parentLocale": "en-001" }, { "locale": "en-CC", "parentLocale": "en-001" }, { "locale": "en-CH", "parentLocale": "en-150" }, { "locale": "en-CK", "parentLocale": "en-001" }, { "locale": "en-CM", "parentLocale": "en-001" }, { "locale": "en-CX", "parentLocale": "en-001" }, { "locale": "en-CY", "parentLocale": "en-001" }, { "locale": "en-DE", "parentLocale": "en-150" }, { "locale": "en-DG", "parentLocale": "en-001" }, { "locale": "en-DK", "parentLocale": "en-150" }, { "locale": "en-DM", "parentLocale": "en-001" }, { "locale": "en-Dsrt" }, { "locale": "en-ER", "parentLocale": "en-001" }, { "locale": "en-FI", "parentLocale": "en-150" }, { "locale": "en-FJ", "parentLocale": "en-001" }, { "locale": "en-FK", "parentLocale": "en-001" }, { "locale": "en-FM", "parentLocale": "en-001" }, { "locale": "en-GB", "parentLocale": "en-001" }, { "locale": "en-GD", "parentLocale": "en-001" }, { "locale": "en-GG", "parentLocale": "en-001" }, { "locale": "en-GH", "parentLocale": "en-001" }, { "locale": "en-GI", "parentLocale": "en-001" }, { "locale": "en-GM", "parentLocale": "en-001" }, { "locale": "en-GU", "parentLocale": "en" }, { "locale": "en-GY", "parentLocale": "en-001" }, { "locale": "en-HK", "parentLocale": "en-001" }, { "locale": "en-IE", "parentLocale": "en-001" }, { "locale": "en-IL", "parentLocale": "en-001" }, { "locale": "en-IM", "parentLocale": "en-001" }, { "locale": "en-IN", "parentLocale": "en-001" }, { "locale": "en-IO", "parentLocale": "en-001" }, { "locale": "en-JE", "parentLocale": "en-001" }, { "locale": "en-JM", "parentLocale": "en-001" }, { "locale": "en-KE", "parentLocale": "en-001" }, { "locale": "en-KI", "parentLocale": "en-001" }, { "locale": "en-KN", "parentLocale": "en-001" }, { "locale": "en-KY", "parentLocale": "en-001" }, { "locale": "en-LC", "parentLocale": "en-001" }, { "locale": "en-LR", "parentLocale": "en-001" }, { "locale": "en-LS", "parentLocale": "en-001" }, { "locale": "en-MG", "parentLocale": "en-001" }, { "locale": "en-MH", "parentLocale": "en" }, { "locale": "en-MO", "parentLocale": "en-001" }, { "locale": "en-MP", "parentLocale": "en" }, { "locale": "en-MS", "parentLocale": "en-001" }, { "locale": "en-MT", "parentLocale": "en-001" }, { "locale": "en-MU", "parentLocale": "en-001" }, { "locale": "en-MW", "parentLocale": "en-001" }, { "locale": "en-MY", "parentLocale": "en-001" }, { "locale": "en-NA", "parentLocale": "en-001" }, { "locale": "en-NF", "parentLocale": "en-001" }, { "locale": "en-NG", "parentLocale": "en-001" }, { "locale": "en-NL", "parentLocale": "en-150" }, { "locale": "en-NR", "parentLocale": "en-001" }, { "locale": "en-NU", "parentLocale": "en-001" }, { "locale": "en-NZ", "parentLocale": "en-001" }, { "locale": "en-PG", "parentLocale": "en-001" }, { "locale": "en-PH", "parentLocale": "en-001" }, { "locale": "en-PK", "parentLocale": "en-001" }, { "locale": "en-PN", "parentLocale": "en-001" }, { "locale": "en-PR", "parentLocale": "en" }, { "locale": "en-PW", "parentLocale": "en-001" }, { "locale": "en-RW", "parentLocale": "en-001" }, { "locale": "en-SB", "parentLocale": "en-001" }, { "locale": "en-SC", "parentLocale": "en-001" }, { "locale": "en-SD", "parentLocale": "en-001" }, { "locale": "en-SE", "parentLocale": "en-150" }, { "locale": "en-SG", "parentLocale": "en-001" }, { "locale": "en-SH", "parentLocale": "en-001" }, { "locale": "en-SI", "parentLocale": "en-150" }, { "locale": "en-SL", "parentLocale": "en-001" }, { "locale": "en-SS", "parentLocale": "en-001" }, { "locale": "en-SX", "parentLocale": "en-001" }, { "locale": "en-SZ", "parentLocale": "en-001" }, { "locale": "en-Shaw" }, { "locale": "en-TC", "parentLocale": "en-001" }, { "locale": "en-TK", "parentLocale": "en-001" }, { "locale": "en-TO", "parentLocale": "en-001" }, { "locale": "en-TT", "parentLocale": "en-001" }, { "locale": "en-TV", "parentLocale": "en-001" }, { "locale": "en-TZ", "parentLocale": "en-001" }, { "locale": "en-UG", "parentLocale": "en-001" }, { "locale": "en-UM", "parentLocale": "en" }, { "locale": "en-US", "parentLocale": "en" }, { "locale": "en-VC", "parentLocale": "en-001" }, { "locale": "en-VG", "parentLocale": "en-001" }, { "locale": "en-VI", "parentLocale": "en" }, { "locale": "en-VU", "parentLocale": "en-001" }, { "locale": "en-WS", "parentLocale": "en-001" }, { "locale": "en-ZA", "parentLocale": "en-001" }, { "locale": "en-ZM", "parentLocale": "en-001" }, { "locale": "en-ZW", "parentLocale": "en-001" }, { "locale": "eo" }, { "locale": "es" }, { "locale": "es-419", "parentLocale": "es" }, { "locale": "es-AR", "parentLocale": "es-419" }, { "locale": "es-BO", "parentLocale": "es-419" }, { "locale": "es-BR", "parentLocale": "es-419" }, { "locale": "es-BZ", "parentLocale": "es-419" }, { "locale": "es-CL", "parentLocale": "es-419" }, { "locale": "es-CO", "parentLocale": "es-419" }, { "locale": "es-CR", "parentLocale": "es-419" }, { "locale": "es-CU", "parentLocale": "es-419" }, { "locale": "es-DO", "parentLocale": "es-419" }, { "locale": "es-EA", "parentLocale": "es" }, { "locale": "es-EC", "parentLocale": "es-419" }, { "locale": "es-GQ", "parentLocale": "es" }, { "locale": "es-GT", "parentLocale": "es-419" }, { "locale": "es-HN", "parentLocale": "es-419" }, { "locale": "es-IC", "parentLocale": "es" }, { "locale": "es-MX", "parentLocale": "es-419" }, { "locale": "es-NI", "parentLocale": "es-419" }, { "locale": "es-PA", "parentLocale": "es-419" }, { "locale": "es-PE", "parentLocale": "es-419" }, { "locale": "es-PH", "parentLocale": "es" }, { "locale": "es-PR", "parentLocale": "es-419" }, { "locale": "es-PY", "parentLocale": "es-419" }, { "locale": "es-SV", "parentLocale": "es-419" }, { "locale": "es-US", "parentLocale": "es-419" }, { "locale": "es-UY", "parentLocale": "es-419" }, { "locale": "es-VE", "parentLocale": "es-419" }, { "locale": "et" }, { "locale": "eu" }, { "locale": "ewo" }, { "locale": "fa" }, { "locale": "fa-AF", "parentLocale": "fa" }, { "locale": "ff" }, { "locale": "ff-Adlm" }, { "locale": "ff-Latn", "parentLocale": "ff" }, { "locale": "ff-Latn-BF", "parentLocale": "ff-Latn" }, { "locale": "ff-Latn-CM", "parentLocale": "ff-Latn" }, { "locale": "ff-Latn-GH", "parentLocale": "ff-Latn" }, { "locale": "ff-Latn-GM", "parentLocale": "ff-Latn" }, { "locale": "ff-Latn-GN", "parentLocale": "ff-Latn" }, { "locale": "ff-Latn-GW", "parentLocale": "ff-Latn" }, { "locale": "ff-Latn-LR", "parentLocale": "ff-Latn" }, { "locale": "ff-Latn-MR", "parentLocale": "ff-Latn" }, { "locale": "ff-Latn-NE", "parentLocale": "ff-Latn" }, { "locale": "ff-Latn-NG", "parentLocale": "ff-Latn" }, { "locale": "ff-Latn-SL", "parentLocale": "ff-Latn" }, { "locale": "fi" }, { "locale": "fil" }, { "locale": "fo" }, { "locale": "fo-DK", "parentLocale": "fo" }, { "locale": "fr" }, { "locale": "fr-BE", "parentLocale": "fr" }, { "locale": "fr-BF", "parentLocale": "fr" }, { "locale": "fr-BI", "parentLocale": "fr" }, { "locale": "fr-BJ", "parentLocale": "fr" }, { "locale": "fr-BL", "parentLocale": "fr" }, { "locale": "fr-CA", "parentLocale": "fr" }, { "locale": "fr-CD", "parentLocale": "fr" }, { "locale": "fr-CF", "parentLocale": "fr" }, { "locale": "fr-CG", "parentLocale": "fr" }, { "locale": "fr-CH", "parentLocale": "fr" }, { "locale": "fr-CI", "parentLocale": "fr" }, { "locale": "fr-CM", "parentLocale": "fr" }, { "locale": "fr-DJ", "parentLocale": "fr" }, { "locale": "fr-DZ", "parentLocale": "fr" }, { "locale": "fr-GA", "parentLocale": "fr" }, { "locale": "fr-GF", "parentLocale": "fr" }, { "locale": "fr-GN", "parentLocale": "fr" }, { "locale": "fr-GP", "parentLocale": "fr" }, { "locale": "fr-GQ", "parentLocale": "fr" }, { "locale": "fr-HT", "parentLocale": "fr" }, { "locale": "fr-KM", "parentLocale": "fr" }, { "locale": "fr-LU", "parentLocale": "fr" }, { "locale": "fr-MA", "parentLocale": "fr" }, { "locale": "fr-MC", "parentLocale": "fr" }, { "locale": "fr-MF", "parentLocale": "fr" }, { "locale": "fr-MG", "parentLocale": "fr" }, { "locale": "fr-ML", "parentLocale": "fr" }, { "locale": "fr-MQ", "parentLocale": "fr" }, { "locale": "fr-MR", "parentLocale": "fr" }, { "locale": "fr-MU", "parentLocale": "fr" }, { "locale": "fr-NC", "parentLocale": "fr" }, { "locale": "fr-NE", "parentLocale": "fr" }, { "locale": "fr-PF", "parentLocale": "fr" }, { "locale": "fr-PM", "parentLocale": "fr" }, { "locale": "fr-RE", "parentLocale": "fr" }, { "locale": "fr-RW", "parentLocale": "fr" }, { "locale": "fr-SC", "parentLocale": "fr" }, { "locale": "fr-SN", "parentLocale": "fr" }, { "locale": "fr-SY", "parentLocale": "fr" }, { "locale": "fr-TD", "parentLocale": "fr" }, { "locale": "fr-TG", "parentLocale": "fr" }, { "locale": "fr-TN", "parentLocale": "fr" }, { "locale": "fr-VU", "parentLocale": "fr" }, { "locale": "fr-WF", "parentLocale": "fr" }, { "locale": "fr-YT", "parentLocale": "fr" }, { "locale": "fur" }, { "locale": "fy" }, { "locale": "ga" }, { "locale": "gd" }, { "locale": "gl" }, { "locale": "gsw" }, { "locale": "gsw-FR", "parentLocale": "gsw" }, { "locale": "gsw-LI", "parentLocale": "gsw" }, { "locale": "gu" }, { "locale": "guw" }, { "locale": "guz" }, { "locale": "gv" }, { "locale": "ha" }, { "locale": "ha-Arab" }, { "locale": "ha-GH", "parentLocale": "ha" }, { "locale": "ha-NE", "parentLocale": "ha" }, { "locale": "haw" }, { "locale": "he" }, { "locale": "hi" }, { "locale": "hr" }, { "locale": "hr-BA", "parentLocale": "hr" }, { "locale": "hsb" }, { "locale": "hu" }, { "locale": "hy" }, { "locale": "ia" }, { "locale": "id" }, { "locale": "ig" }, { "locale": "ii" }, { "locale": "in" }, { "locale": "io" }, { "locale": "is" }, { "locale": "it" }, { "locale": "it-CH", "parentLocale": "it" }, { "locale": "it-SM", "parentLocale": "it" }, { "locale": "it-VA", "parentLocale": "it" }, { "locale": "iu" }, { "locale": "iu-Latn" }, { "locale": "iw" }, { "locale": "ja" }, { "locale": "jbo" }, { "locale": "jgo" }, { "locale": "ji" }, { "locale": "jmc" }, { "locale": "jv" }, { "locale": "jw" }, { "locale": "ka" }, { "locale": "kab" }, { "locale": "kaj" }, { "locale": "kam" }, { "locale": "kcg" }, { "locale": "kde" }, { "locale": "kea" }, { "locale": "khq" }, { "locale": "ki" }, { "locale": "kk" }, { "locale": "kkj" }, { "locale": "kl" }, { "locale": "kln" }, { "locale": "km" }, { "locale": "kn" }, { "locale": "ko" }, { "locale": "ko-KP", "parentLocale": "ko" }, { "locale": "kok" }, { "locale": "ks" }, { "locale": "ksb" }, { "locale": "ksf" }, { "locale": "ksh" }, { "locale": "ku" }, { "locale": "kw" }, { "locale": "ky" }, { "locale": "lag" }, { "locale": "lb" }, { "locale": "lg" }, { "locale": "lkt" }, { "locale": "ln" }, { "locale": "ln-AO", "parentLocale": "ln" }, { "locale": "ln-CF", "parentLocale": "ln" }, { "locale": "ln-CG", "parentLocale": "ln" }, { "locale": "lo" }, { "locale": "lrc" }, { "locale": "lrc-IQ", "parentLocale": "lrc" }, { "locale": "lt" }, { "locale": "lu" }, { "locale": "luo" }, { "locale": "luy" }, { "locale": "lv" }, { "locale": "mas" }, { "locale": "mas-TZ", "parentLocale": "mas" }, { "locale": "mer" }, { "locale": "mfe" }, { "locale": "mg" }, { "locale": "mgh" }, { "locale": "mgo" }, { "locale": "mi" }, { "locale": "mk" }, { "locale": "ml" }, { "locale": "mn" }, { "locale": "mn-Mong" }, { "locale": "mo" }, { "locale": "mr" }, { "locale": "ms" }, { "locale": "ms-Arab" }, { "locale": "ms-BN", "parentLocale": "ms" }, { "locale": "ms-SG", "parentLocale": "ms" }, { "locale": "mt" }, { "locale": "mua" }, { "locale": "my" }, { "locale": "mzn" }, { "locale": "nah" }, { "locale": "naq" }, { "locale": "nb" }, { "locale": "nb-SJ", "parentLocale": "nb" }, { "locale": "nd" }, { "locale": "nds" }, { "locale": "nds-NL", "parentLocale": "nds" }, { "locale": "ne" }, { "locale": "ne-IN", "parentLocale": "ne" }, { "locale": "nl" }, { "locale": "nl-AW", "parentLocale": "nl" }, { "locale": "nl-BE", "parentLocale": "nl" }, { "locale": "nl-BQ", "parentLocale": "nl" }, { "locale": "nl-CW", "parentLocale": "nl" }, { "locale": "nl-SR", "parentLocale": "nl" }, { "locale": "nl-SX", "parentLocale": "nl" }, { "locale": "nmg" }, { "locale": "nn" }, { "locale": "nnh" }, { "locale": "no" }, { "locale": "nqo" }, { "locale": "nr" }, { "locale": "nso" }, { "locale": "nus" }, { "locale": "ny" }, { "locale": "nyn" }, { "locale": "om" }, { "locale": "om-KE", "parentLocale": "om" }, { "locale": "or" }, { "locale": "os" }, { "locale": "os-RU", "parentLocale": "os" }, { "locale": "pa" }, { "locale": "pa-Arab" }, { "locale": "pa-Guru", "parentLocale": "pa" }, { "locale": "pap" }, { "locale": "pl" }, { "locale": "prg" }, { "locale": "ps" }, { "locale": "pt" }, { "locale": "pt-AO", "parentLocale": "pt-PT" }, { "locale": "pt-PT", "parentLocale": "pt" }, { "locale": "pt-CH", "parentLocale": "pt-PT" }, { "locale": "pt-CV", "parentLocale": "pt-PT" }, { "locale": "pt-GQ", "parentLocale": "pt-PT" }, { "locale": "pt-GW", "parentLocale": "pt-PT" }, { "locale": "pt-LU", "parentLocale": "pt-PT" }, { "locale": "pt-MO", "parentLocale": "pt-PT" }, { "locale": "pt-MZ", "parentLocale": "pt-PT" }, { "locale": "pt-ST", "parentLocale": "pt-PT" }, { "locale": "pt-TL", "parentLocale": "pt-PT" }, { "locale": "qu" }, { "locale": "qu-BO", "parentLocale": "qu" }, { "locale": "qu-EC", "parentLocale": "qu" }, { "locale": "rm" }, { "locale": "rn" }, { "locale": "ro" }, { "locale": "ro-MD", "parentLocale": "ro" }, { "locale": "rof" }, { "locale": "ru" }, { "locale": "ru-BY", "parentLocale": "ru" }, { "locale": "ru-KG", "parentLocale": "ru" }, { "locale": "ru-KZ", "parentLocale": "ru" }, { "locale": "ru-MD", "parentLocale": "ru" }, { "locale": "ru-UA", "parentLocale": "ru" }, { "locale": "rw" }, { "locale": "rwk" }, { "locale": "sah" }, { "locale": "saq" }, { "locale": "sbp" }, { "locale": "sc" }, { "locale": "scn" }, { "locale": "sd" }, { "locale": "sdh" }, { "locale": "se" }, { "locale": "se-FI", "parentLocale": "se" }, { "locale": "se-SE", "parentLocale": "se" }, { "locale": "seh" }, { "locale": "ses" }, { "locale": "sg" }, { "locale": "sh" }, { "locale": "shi" }, { "locale": "shi-Latn" }, { "locale": "shi-Tfng", "parentLocale": "shi" }, { "locale": "si" }, { "locale": "sk" }, { "locale": "sl" }, { "locale": "sma" }, { "locale": "smi" }, { "locale": "smj" }, { "locale": "smn" }, { "locale": "sms" }, { "locale": "sn" }, { "locale": "so" }, { "locale": "so-DJ", "parentLocale": "so" }, { "locale": "so-ET", "parentLocale": "so" }, { "locale": "so-KE", "parentLocale": "so" }, { "locale": "sq" }, { "locale": "sq-MK", "parentLocale": "sq" }, { "locale": "sq-XK", "parentLocale": "sq" }, { "locale": "sr" }, { "locale": "sr-Cyrl", "parentLocale": "sr" }, { "locale": "sr-Cyrl-BA", "parentLocale": "sr-Cyrl" }, { "locale": "sr-Cyrl-ME", "parentLocale": "sr-Cyrl" }, { "locale": "sr-Cyrl-XK", "parentLocale": "sr-Cyrl" }, { "locale": "sr-Latn" }, { "locale": "sr-Latn-BA", "parentLocale": "sr-Latn" }, { "locale": "sr-Latn-ME", "parentLocale": "sr-Latn" }, { "locale": "sr-Latn-XK", "parentLocale": "sr-Latn" }, { "locale": "ss" }, { "locale": "ssy" }, { "locale": "st" }, { "locale": "sv" }, { "locale": "sv-AX", "parentLocale": "sv" }, { "locale": "sv-FI", "parentLocale": "sv" }, { "locale": "sw" }, { "locale": "sw-CD", "parentLocale": "sw" }, { "locale": "sw-KE", "parentLocale": "sw" }, { "locale": "sw-UG", "parentLocale": "sw" }, { "locale": "syr" }, { "locale": "ta" }, { "locale": "ta-LK", "parentLocale": "ta" }, { "locale": "ta-MY", "parentLocale": "ta" }, { "locale": "ta-SG", "parentLocale": "ta" }, { "locale": "te" }, { "locale": "teo" }, { "locale": "teo-KE", "parentLocale": "teo" }, { "locale": "tg" }, { "locale": "th" }, { "locale": "ti" }, { "locale": "ti-ER", "parentLocale": "ti" }, { "locale": "tig" }, { "locale": "tk" }, { "locale": "tl" }, { "locale": "tn" }, { "locale": "to" }, { "locale": "tr" }, { "locale": "tr-CY", "parentLocale": "tr" }, { "locale": "ts" }, { "locale": "tt" }, { "locale": "twq" }, { "locale": "tzm" }, { "locale": "ug" }, { "locale": "uk" }, { "locale": "ur" }, { "locale": "ur-IN", "parentLocale": "ur" }, { "locale": "uz" }, { "locale": "uz-Arab" }, { "locale": "uz-Cyrl" }, { "locale": "uz-Latn", "parentLocale": "uz" }, { "locale": "vai" }, { "locale": "vai-Latn" }, { "locale": "vai-Vaii", "parentLocale": "vai" }, { "locale": "ve" }, { "locale": "vi" }, { "locale": "vo" }, { "locale": "vun" }, { "locale": "wa" }, { "locale": "wae" }, { "locale": "wo" }, { "locale": "xh" }, { "locale": "xog" }, { "locale": "yav" }, { "locale": "yi" }, { "locale": "yo" }, { "locale": "yo-BJ", "parentLocale": "yo" }, { "locale": "yue" }, { "locale": "yue-Hans" }, { "locale": "yue-Hant", "parentLocale": "yue" }, { "locale": "zgh" }, { "locale": "zh" }, { "locale": "zh-Hans", "parentLocale": "zh" }, { "locale": "zh-Hans-HK", "parentLocale": "zh-Hans" }, { "locale": "zh-Hans-MO", "parentLocale": "zh-Hans" }, { "locale": "zh-Hans-SG", "parentLocale": "zh-Hans" }, { "locale": "zh-Hant" }, { "locale": "zh-Hant-HK", "parentLocale": "zh-Hant" }, { "locale": "zh-Hant-MO", "parentLocale": "zh-Hant-HK" }, { "locale": "zu" });

    return MessageFormat;

}));
//# sourceMappingURL=intl-messageformat-with-locales.js.map
