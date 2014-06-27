(function (global) {
    /*
    Copyright (c) 2014, Yahoo! Inc. All rights reserved.
    Copyrights licensed under the New BSD License.
    See the accompanying LICENSE file for terms.
    */
    
    (function (root, factory) {
        'use strict';
    
        var Intl          = root.Intl || root.IntlPolyfill,
            MessageFormat = factory(Intl);
    
        // register in -all- the module systems (at once)
        if (typeof define === 'function' && define.amd) {
            define(MessageFormat);
        }
    
        if (typeof module === 'object' && typeof module.exports === 'object') {
            module.exports = MessageFormat;
        }
    
        if (root) {
            root.IntlMessageFormat = MessageFormat;
        }
    
    })(typeof global !== 'undefined' ? global : this, function (Intl) {
        'use strict';
    
        if (!Intl) {
            throw new ReferenceError ('Intl must be available');
        }
    
        // -- ES5 Built-ins --------------------------------------------------------
    
        // Purposely using the same implementation as the Intl.js `Intl` polyfill.
        // Copyright 2013 Andy Earnshaw, MIT License
    
        // Used for proto-less objects which won't have this method.
        var hop = Object.prototype.hasOwnProperty;
    
        var realDefineProp = (function () {
            try { return !!Object.defineProperty({}, 'a', {}); }
            catch (e) { return false; }
        })();
    
        var es3 = !realDefineProp && !Object.prototype.__defineGetter__;
    
        var defineProperty = realDefineProp ? Object.defineProperty :
                function (obj, name, desc) {
    
            if ('get' in desc && obj.__defineGetter__) {
                obj.__defineGetter__(name, desc.get);
            } else if (!hop.call(obj, name) || 'value' in desc) {
                obj[name] = desc.value;
            }
        };
    
        var objCreate = Object.create || function (proto, props) {
            var obj, k;
    
            function F() {}
            F.prototype = proto;
            obj = new F();
    
            for (k in props) {
                if (hop.call(props, k)) {
                    defineProperty(obj, k, props[k]);
                }
            }
    
            return obj;
        };
    
        var fnBind = Function.prototype.bind || function (thisObj) {
            var fn   = this,
                args = [].slice.call(arguments, 1);
    
            return function () {
                fn.apply(thisObj, args.concat([].slice.call(arguments)));
            };
        };
    
        // -- MessageFormat --------------------------------------------------------
    
        function MessageFormat(pattern, locales, formats) {
            // Parse string messages into a tokenized JSON structure for traversal.
            if (typeof pattern === 'string') {
                pattern = MessageFormat.__parse(pattern);
            }
    
            if (!(pattern && typeof pattern.length === 'number')) {
                throw new TypeError('A pattern must be provided as a String or Array.');
            }
    
            // Creates a new object with the specified `formats` merged with the
            // default formats.
            formats = this._mergeFormats(MessageFormat.FORMATS, formats);
    
            // Defined first because it's used to build the format pattern.
            defineProperty(this, '_locale',  {value: this._resolveLocale(locales)});
    
            // Define the `pattern` property, a compiled pattern that is highly
            // optimized for repeated `format()` invocations. **Note:** This passes
            // the `locales` set provided to the constructor instead of just the
            // resolved locale.
            pattern = this._compilePattern(pattern, locales, formats);
            defineProperty(this, '_pattern', {value: pattern});
    
            // Bind `format()` method to `this` so it can be passed by reference
            // like the other `Intl` APIs.
            this.format = fnBind.call(this.format, this);
        }
    
        // Default format options used as the prototype of the `formats` provided to
        // the constructor. These are used when constructing the internal
        // Intl.NumberFormat and Intl.DateTimeFormat instances.
        defineProperty(MessageFormat, 'FORMATS', {
            enumerable: true,
    
            value: {
                number: {
                    'currency': {
                        style: 'currency'
                    },
    
                    'percent': {
                        style: 'percent'
                    }
                },
    
                date: {
                    'short': {
                        month: 'numeric',
                        day  : 'numeric',
                        year : '2-digit'
                    },
    
                    'medium': {
                        month: 'short',
                        day  : 'numeric',
                        year : 'numeric'
                    },
    
                    'long': {
                        month: 'long',
                        day  : 'numeric',
                        year : 'numeric'
                    },
    
                    'full': {
                        weekday: 'long',
                        month  : 'long',
                        day    : 'numeric',
                        year   : 'numeric'
                    }
                },
    
                time: {
                    'short': {
                        hour  : 'numeric',
                        minute: 'numeric'
                    },
    
                    'medium':  {
                        hour  : 'numeric',
                        minute: 'numeric',
                        second: 'numeric'
                    },
    
                    'long': {
                        hour        : 'numeric',
                        minute      : 'numeric',
                        second      : 'numeric',
                        timeZoneName: 'short'
                    },
    
                    'full': {
                        hour        : 'numeric',
                        minute      : 'numeric',
                        second      : 'numeric',
                        timeZoneName: 'short'
                    }
                }
            }
        });
    
        // Define internal private properties for dealing with locale data.
        defineProperty(MessageFormat, '__availableLocales__', {value: []});
        defineProperty(MessageFormat, '__localeData__', {value: objCreate(null)});
        defineProperty(MessageFormat, '__addLocaleData', {value: function (data) {
            if (!(data && data.locale)) {
                throw new Error('Object passed does not identify itself with a valid language tag');
            }
    
            if (!data.messageformat) {
                throw new Error('Object passed does not contain locale data for IntlMessageFormat');
            }
    
            var availableLocales = MessageFormat.__availableLocales__,
                localeData       = MessageFormat.__localeData__;
    
            // Message format locale data only requires the first part of the tag.
            var locale = data.locale.toLowerCase().split('-')[0];
    
            availableLocales.push(locale);
            localeData[locale] = data.messageformat;
    
            if (MessageFormat.defaultLocale === undefined) {
                MessageFormat.defaultLocale = locale;
            }
        }});
    
        // Defines `__parse()` static method as an exposed private.
        defineProperty(MessageFormat, '__parse', {value: parse});
    
        // Define public `defaultLocale` property which is set when the first bundle
        // of locale data is added.
        defineProperty(MessageFormat, 'defaultLocale', {
            enumerable: true,
            writable  : true
        });
    
        MessageFormat.prototype.format = function (values) {
            return this._format(this._pattern, values);
        };
    
        MessageFormat.prototype.resolvedOptions = function () {
            // TODO: Provide anything else?
            return {
                locale: this._locale
            };
        };
    
        MessageFormat.prototype._compilePattern = function (pattern, locales, formats) {
            // Wrap string patterns with an array for iteration control flow.
            if (typeof pattern === 'string') {
                pattern = [pattern];
            }
    
            var locale        = this._locale,
                localeData    = MessageFormat.__localeData__,
                formatPattern = [],
                i, len, part, type, valueName, format, pluralFunction, options,
                key, optionsParts, option;
    
            for (i = 0, len = pattern.length; i < len; i += 1) {
                part = pattern[i];
    
                // Checks if string part is a simple string, or if it has a
                // tokenized place-holder that needs to be substituted.
                if (typeof part === 'string') {
                    formatPattern.push(createStringPart(part));
                    continue;
                }
    
                type      = part.type;
                valueName = part.valueName;
                options   = part.options;
    
                // Handles plural and select parts' options by building format
                // patterns for each option.
                if (options) {
                    optionsParts = {};
    
                    for (key in options) {
                        if (!hop.call(options, key)) { continue; }
    
                        option = options[key];
    
                        // Early exit and special handling for plural options with a
                        // "${#}" token. These options will have this token replaced
                        // with NumberFormat wrap with optional prefix and suffix.
                        if (type === 'plural' && typeof option === 'string' &&
                                option.indexOf('${#}') >= 0) {
    
                            option = option.match(/(.*)\${#}(.*)/);
    
                            optionsParts[key] = [
                                option[1], // prefix
                                {
                                    valueName: valueName,
                                    format   : new Intl.NumberFormat(locales).format
                                },
                                option[2]  // suffix
                            ];
    
                            continue;
                        }
    
                        // Recursively compiles a format pattern for the option.
                        optionsParts[key] = this._compilePattern(option,
                                locales, formats);
                    }
                }
    
                // Create a specialized format part for each type. This creates a
                // common interface for the `format()` method and encapsulates the
                // relevant data need for each type of formatting.
                switch (type) {
                    case 'date':
                        format = formats.date[part.format];
                        formatPattern.push({
                            valueName: valueName,
                            format   : new Intl.DateTimeFormat(locales, format).format
                        });
                        break;
    
                    case 'time':
                        format = formats.time[part.format];
                        formatPattern.push({
                            valueName: valueName,
                            format   : new Intl.DateTimeFormat(locales, format).format
                        });
                        break;
    
                    case 'number':
                        format = formats.number[part.format];
                        formatPattern.push({
                            valueName: valueName,
                            format   : new Intl.NumberFormat(locales, format).format
                        });
                        break;
    
                    case 'plural':
                        pluralFunction = localeData[locale].pluralFunction;
                        formatPattern.push(new PluralPart(valueName, optionsParts,
                                pluralFunction));
                        break;
    
                    case 'select':
                        formatPattern.push(new SelectPart(valueName, optionsParts));
                        break;
    
                    default:
                        throw new Error('Message pattern part at index ' + i + ' does not have a valid type');
                }
            }
    
            return formatPattern;
        };
    
        MessageFormat.prototype._format = function (pattern, values) {
            var result = '',
                i, len, part, valueName, value, options;
    
            for (i = 0, len = pattern.length; i < len; i += 1) {
                part = pattern[i];
    
                // Exist early for string parts.
                if (typeof part === 'string') {
                    result += part;
                    continue;
                }
    
                valueName = part.valueName;
    
                // Enforce that all required values are provided by the caller.
                if (!(values && hop.call(values, valueName))) {
                    throw new Error('A value must be provided for: ' + valueName);
                }
    
                value   = values[valueName];
                options = part.options;
    
                // Recursively format plural and select parts' option — which can be
                // a nested pattern structure. The choosing of the option to use is
                // abstracted-by and delegated-to the part helper object.
                if (options) {
                    result += this._format(part.getOption(value), values);
                } else {
                    result += part.format(value);
                }
            }
    
            return result;
        };
    
        MessageFormat.prototype._mergeFormats = function (defaults, formats) {
            var mergedFormats = {},
                type, mergedType;
    
            for (type in defaults) {
                if (!hop.call(defaults, type)) { continue; }
    
                mergedFormats[type] = mergedType = objCreate(defaults[type]);
    
                if (formats && hop.call(formats, type)) {
                    extend(mergedType, formats[type]);
                }
            }
    
            return mergedFormats;
        };
    
        MessageFormat.prototype._resolveLocale = function (locales) {
            var availableLocales = MessageFormat.__availableLocales__,
                locale, parts, i, len;
    
            if (availableLocales.length === 0) {
                throw new Error('No locale data has been provided for IntlMessageFormat yet');
            }
    
            if (typeof locales === 'string') {
                locales = [locales];
            }
    
            if (locales && locales.length) {
                for (i = 0, len = locales.length; i < len; i += 1) {
                    locale = locales[i].toLowerCase().split('-')[0];
    
                    // Make sure the first part of the locale that we care about is
                    // structurally valid.
                    if (!/[a-z]{2,3}/i.test(locale)) {
                        throw new RangeError('"' + locales[i] + '" is not a structurally valid language tag');
                    }
    
                    if (availableLocales.indexOf(locale) >= 0) {
                        break;
                    }
                }
            }
    
            return locale || MessageFormat.defaultLocale;
        };
    
        // -- MessageFormat Helpers ------------------------------------------------
    
        var RE_PARSED_TOKEN = /^\${([-\w]+)}$/;
    
        function createStringPart(str) {
            var token = str.match(RE_PARSED_TOKEN);
            return token ? new StringPart(token[1]) : str;
        }
    
        function StringPart(valueName) {
            this.valueName = valueName;
        }
    
        StringPart.prototype.format = function (value) {
            if (!value) {
                return '';
            }
    
            return typeof value === 'string' ? value : String(value);
        };
    
        function SelectPart(valueName, options) {
            this.valueName = valueName;
            this.options   = options;
        }
    
        SelectPart.prototype.getOption = function (value) {
            var options = this.options;
            return options[value] || options.other;
        };
    
        function PluralPart(valueName, options, pluralFunction) {
            this.valueName      = valueName;
            this.options        = options;
            this.pluralFunction = pluralFunction;
        }
    
        PluralPart.prototype.getOption = function (value) {
            var options = this.options,
                option  = this.pluralFunction(value);
    
            return options[option] || options.other;
        };
    
        // -- MessageFormat Parser -------------------------------------------------
        // Copied from: https://github.com/yahoo/locator-lang
    
        // `type` (required): The name of the message format type.
        // `regex` (required): The regex used to check if this formatter can parse the message.
        // `parse` (required): The main parse method which is given the full message.
        // `tokenParser` (optional): Used to parse the remaining tokens of a message (what remains after the variable and the format type).
        // `postParser` (optional): Used to format the output before returning from the main `parse` method.
        // `outputFormatter` (optional): Used to format the fully parsed string returned from the base case of the recursive parser.
        var FORMATTERS = [
            {
                type: 'string',
                regex: /^{\s*([-\w]+)\s*}$/,
                parse: formatElementParser,
                postParser: function (parsed) {
                    return '${' + parsed.valueName + '}';
                }
            },
            {
                type: 'select',
                regex: /^{\s*([-\w]+)\s*,\s*select\s*,\s*(.*)\s*}$/,
                parse: formatElementParser,
                tokenParser: pairedOptionsParser
            },
            {
                type: 'plural',
                regex: /^{\s*([-\w]+)\s*,\s*plural\s*,\s*(.*)\s*}$/,
                parse: formatElementParser,
                tokenParser: pairedOptionsParser,
                outputFormatter: function (str) {
                    return str.replace(/#/g, '${#}');
                }
            },
            {
                type: 'time',
                regex: /^{\s*([-\w]+)\s*,\s*time(?:,(.*))?\s*}$/,
                parse: formatElementParser,
                tokenParser: formatOptionParser,
                postParser: function (parsed) {
                    parsed.format = parsed.format || 'medium';
                    return parsed;
                }
            },
            {
                type: 'date',
                regex: /^{\s*([-\w]+)\s*,\s*date(?:,(.*))?\s*}$/,
                parse: formatElementParser,
                tokenParser: formatOptionParser,
                postParser: function (parsed) {
                    parsed.format = parsed.format || 'medium';
                    return parsed;
                }
            },
            {
                type: 'number',
                regex: /^{\s*([-\w]+)\s*,\s*number(?:,(.*))?\s*}$/,
                parse: formatElementParser,
                tokenParser: formatOptionParser
            },
            {
                type: 'custom',
                regex: /^{\s*([-\w]+)\s*,\s*([a-zA-Z]*)(?:,(.*))?\s*}$/,
                parse: formatElementParser,
                tokenParser:formatOptionParser
            }
        ];
    
        /**
         Tokenizes a MessageFormat pattern.
         @method tokenize
         @param {String} pattern A pattern
         @param {Boolean} trim Whether or not the tokens should be trimmed of whitespace
         @return {Array} Tokens
         **/
        function tokenize (pattern, trim) {
            var bracketRE   = /[{}]/g,
                tokens      = [],
                balance     = 0,
                startIndex  = 0,
                endIndex,
                substr,
                match,
                i,
                len;
    
    
            match = bracketRE.exec(pattern);
    
            while (match) {
                // Keep track of balanced brackets
                balance += match[0] === '{' ? 1 : -1;
    
                // Imbalanced brackets detected (e.g. "}hello{", "{hello}}")
                if (balance < 0) {
                    throw new Error('Imbalanced bracket detected at index ' +
                        match.index + ' for message "' + pattern + '"');
                }
    
                // Tokenize a pair of balanced brackets
                if (balance === 0) {
                    endIndex = match.index + 1;
    
                    tokens.push(
                        pattern.slice(startIndex, endIndex)
                    );
    
                    startIndex = endIndex;
                }
    
                // Tokenize any text that comes before the first opening bracket
                if (balance === 1 && startIndex !== match.index) {
                    substr = pattern.slice(startIndex, match.index);
                    if (substr.indexOf('{') === -1) {
                        tokens.push(substr);
                        startIndex = match.index;
                    }
                }
    
                match = bracketRE.exec(pattern);
            }
    
            // Imbalanced brackets detected (e.g. "{{hello}")
            if (balance !== 0) {
                throw new Error('Brackets were not properly closed: ' + pattern);
            }
    
            // Tokenize any remaining non-empty string
            if (startIndex !== pattern.length) {
                tokens.push(
                    pattern.slice(startIndex)
                );
            }
    
            if (trim) {
                for (i = 0, len = tokens.length; i < len; i++) {
                    tokens[i] = tokens[i].replace(/^\s+|\s+$/gm, '');
                }
            }
    
            return tokens;
        }
    
        /**
         Gets the content of the format element by peeling off the outermost pair of
         brackets.
         @method getFormatElementContent
         @param {String} formatElement Format element
         @return {String} Contents of format element
         **/
        function getFormatElementContent (formatElement) {
            return formatElement.replace(/^\{\s*/,'').replace(/\s*\}$/, '');
        }
    
        /**
         Checks if the pattern contains a format element.
         @method containsFormatElement
         @param {String} pattern Pattern
         @return {Boolean} Whether or not the pattern contains a format element
         **/
        function containsFormatElement (pattern) {
            return pattern.indexOf('{') >= 0;
        }
    
        /**
         Parses a list of tokens into paired options where the key is the option name
         and the value is the pattern.
         @method pairedOptionsParser
         @param {Object} parsed Parsed object
         @param {Array} tokens Remaining tokens that come after the value name and the
             format id
         @return {Object} Parsed object with added options
         **/
        function pairedOptionsParser (parsed, tokens) {
            var hasDefault,
                value,
                name,
                l,
                i;
    
            parsed.options  = {};
    
            if (tokens.length % 2) {
                throw new Error('Options must come in pairs: ' + tokens.join(', '));
            }
    
            for (i = 0, l = tokens.length; i < l; i += 2) {
                name  = tokens[i];
                value = tokens[i + 1];
    
                parsed.options[name] = value;
    
                hasDefault = hasDefault || name === 'other';
            }
    
            if (!hasDefault) {
                throw new Error('Options must include default "other" option: ' + tokens.join(', '));
            }
    
            return parsed;
        }
    
        function formatOptionParser (parsed, tokens) {
            parsed.format = tokens[0];
            return parsed;
        }
    
        /**
         Parses a format element. Format elements are surrounded by curly braces, and
         contain at least a value name.
         @method formatElementParser
         @param {String} formatElement A format element
         @param {Object} match The result of a String.match() that has at least the
             value name at index 1 and a subformat at index 2
         @return {Object} Parsed object
         **/
        function formatElementParser (formatElement, match, formatter) {
            var parsed = {
                    type: formatter.type,
                    valueName: match[1]
                },
                tokens = match[2] && tokenize(match[2], true);
    
            // If there are any additional tokens to parse, it should be done here
            if (formatter.tokenParser && tokens) {
                parsed = formatter.tokenParser(parsed, tokens);
            }
    
            // Any final modifications to the parsed output should be done here
            if (formatter.postParser) {
                parsed = formatter.postParser(parsed);
            }
    
            return parsed;
        }
    
        /**
         For each formatter, test it on the token in order. Exit early on first
         token matched.
         @method parseToken
         @param {Array} tokens
         @param {Number} index
         @return {String|Object} Parsed token or original token
         */
        function parseToken (tokens, index) {
            var i, len;
    
            for (i = 0, len = FORMATTERS.length; i < len; i++) {
                if (parseFormatTokens(FORMATTERS[i], tokens, index)) {
                    return tokens[index];
                }
            }
    
            return tokens[index];
        }
    
        /**
         Attempts to parse a token at the given index with the provided formatter.
         If the token fails the `formatter.regex`, `false` is returned. Otherwise,
         the token is parsed with `formatter.parse`. Then if the token contains
         options due to the parsing process, it has each option processed. Then it
         returns `true` alerting the caller the token was parsed.
    
         @method parseFormatTokens
         @param {Object} formatter
         @param {Array} tokens
         @param {Number} tokenIndex
         @return {Boolean}
         */
        function parseFormatTokens (formatter, tokens, tokenIndex) {
            var token = tokens[tokenIndex],
                match = token.match(formatter.regex),
                parsedToken,
                parsedKeys = [],
                key,
                i, len;
    
            if (match) {
                parsedToken = formatter.parse(token, match, formatter);
                tokens[tokenIndex] = parsedToken;
    
                // if we have options, each option must be parsed
                if (parsedToken && parsedToken.options && typeof parsedToken.options === 'object') {
                    for (key in parsedToken.options) {
                        if (parsedToken.options.hasOwnProperty(key)) {
                            parsedKeys.push(key);
                        }
                    }
                }
    
                for (i = 0, len = parsedKeys.length; i < len; i++) {
                    parseFormatOptions(parsedToken, parsedKeys[i], formatter);
                }
    
                return true;
            }
    
            return !!match;
        }
    
        /**
         @method parseFormatOptions
         @param {Object}
         */
        function parseFormatOptions (parsedToken, key, formatter) {
            var value = parsedToken.options && parsedToken.options[key];
            value = getFormatElementContent(value);
            parsedToken.options[key] = parse(value, formatter.outputFormatter);
        }
    
        /**
         Parses a pattern that may contain nested format elements.
         @method parse
         @param {String} pattern A pattern
         @return {Object|Array} Parsed output
         **/
        function parse (pattern, outputFormatter) {
    
            var tokens,
                i, len;
    
            // base case (plain string)
            if (!containsFormatElement(pattern)) {
                // Final chance to format the string before the parser spits it out
                return outputFormatter ? outputFormatter(pattern) : [pattern];
            }
    
            tokens = tokenize(pattern);
    
            for (i = 0, len = tokens.length; i < len; i++) {
                if (tokens[i].charAt(0) === '{') { // tokens must start with a {
                    tokens[i] = parseToken(tokens, i);
                }
            }
    
            return tokens;
        }
    
        // -- Utilities ------------------------------------------------------------
    
        function extend(obj) {
            var sources = Array.prototype.slice.call(arguments, 1),
                i, len, source, key;
    
            for (i = 0, len = sources.length; i < len; i += 1) {
                source = sources[i];
                if (!source) { continue; }
    
                for (key in source) {
                    if (source.hasOwnProperty(key)) {
                        obj[key] = source[key];
                    }
                }
            }
    
            return obj;
        }
    
        return MessageFormat;
    });
    (function(global) {
    var IntlMessageFormat = global.IntlMessageFormat;
    var funcs = [
    function (n) {  },
    function (n) { n=Math.floor(n);if(n===1)return"one";return"other"; },
    function (n) { n=Math.floor(n);if(n>=0&&n<=1)return"one";return"other"; },
    function (n) { var i=Math.floor(Math.abs(n));n=Math.floor(n);if(i===0||n===1)return"one";return"other"; },
    function (n) { n=Math.floor(n);if(n===0)return"zero";if(n===1)return"one";if(n===2)return"two";if(n%100>=3&&n%100<=10)return"few";if(n%100>=11&&n%100<=99)return"many";return"other"; },
    function (n) { n=Math.floor(n);if(n%10===1&&(n%100!==11))return"one";if(n%10>=2&&n%10<=4&&!(n%100>=12&&n%100<=14))return"few";if(n%10===0||n%10>=5&&n%10<=9||n%100>=11&&n%100<=14)return"many";return"other"; },
    function (n) { return"other"; },
    function (n) { n=Math.floor(n);if(n%10===1&&!(n%100===11||n%100===71||n%100===91))return"one";if(n%10===2&&!(n%100===12||n%100===72||n%100===92))return"two";if((n%10>=3&&n%10<=4||n%10===9)&&!(n%100>=10&&n%100<=19||n%100>=70&&n%100<=79||n%100>=90&&n%100<=99))return"few";if((n!==0)&&n%1e6===0)return"many";return"other"; },
    function (n) { var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length,f=parseInt(n.toString().replace(/^[^.]*\.?/,""),10);n=Math.floor(n);if(v===0&&i%10===1&&((i%100!==11)||f%10===1&&(f%100!==11)))return"one";if(v===0&&i%10>=2&&i%10<=4&&(!(i%100>=12&&i%100<=14)||f%10>=2&&f%10<=4&&!(f%100>=12&&f%100<=14)))return"few";return"other"; },
    function (n) { var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length;n=Math.floor(n);if(i===1&&v===0)return"one";return"other"; },
    function (n) { var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length;n=Math.floor(n);if(i===1&&v===0)return"one";if(i>=2&&i<=4&&v===0)return"few";if((v!==0))return"many";return"other"; },
    function (n) { n=Math.floor(n);if(n===0)return"zero";if(n===1)return"one";if(n===2)return"two";if(n===3)return"few";if(n===6)return"many";return"other"; },
    function (n) { var i=Math.floor(Math.abs(n)),t=parseInt(n.toString().replace(/^[^.]*\.?|0+$/g,""),10);n=Math.floor(n);if(n===1||(t!==0)&&(i===0||i===1))return"one";return"other"; },
    function (n) { var i=Math.floor(Math.abs(n));n=Math.floor(n);if(i===0||i===1)return"one";return"other"; },
    function (n) { var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length;n=Math.floor(n);if(i>=0&&i<=1&&v===0)return"one";return"other"; },
    function (n) { n=Math.floor(n);if(n===1)return"one";if(n===2)return"two";if(n>=3&&n<=6)return"few";if(n>=7&&n<=10)return"many";return"other"; },
    function (n) { n=Math.floor(n);if(n===1||n===11)return"one";if(n===2||n===12)return"two";if(n>=3&&n<=10||n>=13&&n<=19)return"few";return"other"; },
    function (n) { n=Math.floor(n);if(n%10===1)return"one";if(n%10===2)return"two";if(n%100===0||n%100===20||n%100===40||n%100===60)return"few";return"other"; },
    function (n) { var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length;n=Math.floor(n);if(i===1&&v===0)return"one";if(i===2&&v===0)return"two";if(v===0&&!(n>=0&&n<=10)&&n%10===0)return"many";return"other"; },
    function (n) { var i=Math.floor(Math.abs(n)),t=parseInt(n.toString().replace(/^[^.]*\.?|0+$/g,""),10);n=Math.floor(n);if(t===0&&i%10===1&&((i%100!==11)||(t!==0)))return"one";return"other"; },
    function (n) { n=Math.floor(n);if(n===0)return"zero";if(n===1)return"one";return"other"; },
    function (n) { n=Math.floor(n);if(n===1)return"one";if(n===2)return"two";return"other"; },
    function (n) { var i=Math.floor(Math.abs(n));n=Math.floor(n);if(n===0)return"zero";if((i===0||i===1)&&(n!==0))return"one";return"other"; },
    function (n) { var f=parseInt(n.toString().replace(/^[^.]*\.?/,""),10);n=Math.floor(n);if(n%10===1&&!(n%100>=11&&n%100<=19))return"one";if(n%10>=2&&n%10<=9&&!(n%100>=11&&n%100<=19))return"few";if((f!==0))return"many";return"other"; },
    function (n) { var v=n.toString().replace(/^[^.]*\.?/,"").length,f=parseInt(n.toString().replace(/^[^.]*\.?/,""),10);n=Math.floor(n);if(n%10===0||n%100>=11&&n%100<=19||v===2&&f%100>=11&&f%100<=19)return"zero";if(n%10===1&&((n%100!==11)||v===2&&f%10===1&&((f%100!==11)||(v!==2)&&f%10===1)))return"one";return"other"; },
    function (n) { var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length,f=parseInt(n.toString().replace(/^[^.]*\.?/,""),10);n=Math.floor(n);if(v===0&&(i%10===1||f%10===1))return"one";return"other"; },
    function (n) { n=Math.floor(n);if(n===1)return"one";if(n===0||n%100>=2&&n%100<=10)return"few";if(n%100>=11&&n%100<=19)return"many";return"other"; },
    function (n) { var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length;n=Math.floor(n);if(i===1&&v===0)return"one";if(v===0&&i%10>=2&&i%10<=4&&!(i%100>=12&&i%100<=14))return"few";if(v===0&&(i!==1)&&(i%10>=0&&i%10<=1||v===0&&(i%10>=5&&i%10<=9||v===0&&i%100>=12&&i%100<=14)))return"many";return"other"; },
    function (n) { var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length,t=parseInt(n.toString().replace(/^[^.]*\.?|0+$/g,""),10);n=Math.floor(n);if(i===1&&(v===0||i===0&&t===1))return"one";return"other"; },
    function (n) { var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length;n=Math.floor(n);if(i===1&&v===0)return"one";if((v!==0)||n===0||(n!==1)&&n%100>=1&&n%100<=19)return"few";return"other"; },
    function (n) { var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length;n=Math.floor(n);if(v===0&&i%10===1&&(i%100!==11))return"one";if(v===0&&(i%10===0||v===0&&(i%10>=5&&i%10<=9||v===0&&i%100>=11&&i%100<=14)))return"many";return"other"; },
    function (n) { var i=Math.floor(Math.abs(n));n=Math.floor(n);if(i===0||n===1)return"one";if(n>=2&&n<=10)return"few";return"other"; },
    function (n) { var i=Math.floor(Math.abs(n)),f=parseInt(n.toString().replace(/^[^.]*\.?/,""),10);n=Math.floor(n);if(n===0||n===1||i===0&&f===1)return"one";return"other"; },
    function (n) { var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length;n=Math.floor(n);if(v===0&&i%100===1)return"one";if(v===0&&i%100===2)return"two";if(v===0&&(i%100>=3&&i%100<=4||(v!==0)))return"few";return"other"; },
    function (n) { n=Math.floor(n);if(n>=0&&n<=1||n>=11&&n<=99)return"one";return"other"; },
    function (n) { var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length;n=Math.floor(n);if(v===0&&i%10===1&&(i%100!==11))return"one";if(v===0&&i%10>=2&&i%10<=4&&!(i%100>=12&&i%100<=14))return"few";if(v===0&&(i%10===0||v===0&&(i%10>=5&&i%10<=9||v===0&&i%100>=11&&i%100<=14)))return"many";return"other"; }
    ];
    IntlMessageFormat.__addLocaleData({locale:"aa", messageformat:{pluralFunction:funcs[0]}});
    IntlMessageFormat.__addLocaleData({locale:"af", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"agq", messageformat:{pluralFunction:funcs[0]}});
    IntlMessageFormat.__addLocaleData({locale:"ak", messageformat:{pluralFunction:funcs[2]}});
    IntlMessageFormat.__addLocaleData({locale:"am", messageformat:{pluralFunction:funcs[3]}});
    IntlMessageFormat.__addLocaleData({locale:"ar", messageformat:{pluralFunction:funcs[4]}});
    IntlMessageFormat.__addLocaleData({locale:"as", messageformat:{pluralFunction:funcs[0]}});
    IntlMessageFormat.__addLocaleData({locale:"asa", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"ast", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"az", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"bas", messageformat:{pluralFunction:funcs[0]}});
    IntlMessageFormat.__addLocaleData({locale:"be", messageformat:{pluralFunction:funcs[5]}});
    IntlMessageFormat.__addLocaleData({locale:"bem", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"bez", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"bg", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"bm", messageformat:{pluralFunction:funcs[6]}});
    IntlMessageFormat.__addLocaleData({locale:"bn", messageformat:{pluralFunction:funcs[3]}});
    IntlMessageFormat.__addLocaleData({locale:"bo", messageformat:{pluralFunction:funcs[6]}});
    IntlMessageFormat.__addLocaleData({locale:"br", messageformat:{pluralFunction:funcs[7]}});
    IntlMessageFormat.__addLocaleData({locale:"brx", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"bs", messageformat:{pluralFunction:funcs[8]}});
    IntlMessageFormat.__addLocaleData({locale:"byn", messageformat:{pluralFunction:funcs[0]}});
    IntlMessageFormat.__addLocaleData({locale:"ca", messageformat:{pluralFunction:funcs[9]}});
    IntlMessageFormat.__addLocaleData({locale:"cgg", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"chr", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"cs", messageformat:{pluralFunction:funcs[10]}});
    IntlMessageFormat.__addLocaleData({locale:"cy", messageformat:{pluralFunction:funcs[11]}});
    IntlMessageFormat.__addLocaleData({locale:"da", messageformat:{pluralFunction:funcs[12]}});
    IntlMessageFormat.__addLocaleData({locale:"dav", messageformat:{pluralFunction:funcs[0]}});
    IntlMessageFormat.__addLocaleData({locale:"de", messageformat:{pluralFunction:funcs[9]}});
    IntlMessageFormat.__addLocaleData({locale:"dje", messageformat:{pluralFunction:funcs[0]}});
    IntlMessageFormat.__addLocaleData({locale:"dua", messageformat:{pluralFunction:funcs[0]}});
    IntlMessageFormat.__addLocaleData({locale:"dyo", messageformat:{pluralFunction:funcs[0]}});
    IntlMessageFormat.__addLocaleData({locale:"dz", messageformat:{pluralFunction:funcs[6]}});
    IntlMessageFormat.__addLocaleData({locale:"ebu", messageformat:{pluralFunction:funcs[0]}});
    IntlMessageFormat.__addLocaleData({locale:"ee", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"el", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"en", messageformat:{pluralFunction:funcs[9]}});
    IntlMessageFormat.__addLocaleData({locale:"eo", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"es", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"et", messageformat:{pluralFunction:funcs[9]}});
    IntlMessageFormat.__addLocaleData({locale:"eu", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"ewo", messageformat:{pluralFunction:funcs[0]}});
    IntlMessageFormat.__addLocaleData({locale:"fa", messageformat:{pluralFunction:funcs[3]}});
    IntlMessageFormat.__addLocaleData({locale:"ff", messageformat:{pluralFunction:funcs[13]}});
    IntlMessageFormat.__addLocaleData({locale:"fi", messageformat:{pluralFunction:funcs[14]}});
    IntlMessageFormat.__addLocaleData({locale:"fil", messageformat:{pluralFunction:funcs[14]}});
    IntlMessageFormat.__addLocaleData({locale:"fo", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"fr", messageformat:{pluralFunction:funcs[13]}});
    IntlMessageFormat.__addLocaleData({locale:"fur", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"ga", messageformat:{pluralFunction:funcs[15]}});
    IntlMessageFormat.__addLocaleData({locale:"gd", messageformat:{pluralFunction:funcs[16]}});
    IntlMessageFormat.__addLocaleData({locale:"gl", messageformat:{pluralFunction:funcs[9]}});
    IntlMessageFormat.__addLocaleData({locale:"gsw", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"gu", messageformat:{pluralFunction:funcs[3]}});
    IntlMessageFormat.__addLocaleData({locale:"guz", messageformat:{pluralFunction:funcs[0]}});
    IntlMessageFormat.__addLocaleData({locale:"gv", messageformat:{pluralFunction:funcs[17]}});
    IntlMessageFormat.__addLocaleData({locale:"ha", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"haw", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"he", messageformat:{pluralFunction:funcs[18]}});
    IntlMessageFormat.__addLocaleData({locale:"hi", messageformat:{pluralFunction:funcs[3]}});
    IntlMessageFormat.__addLocaleData({locale:"hr", messageformat:{pluralFunction:funcs[8]}});
    IntlMessageFormat.__addLocaleData({locale:"hu", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"hy", messageformat:{pluralFunction:funcs[13]}});
    IntlMessageFormat.__addLocaleData({locale:"ia", messageformat:{pluralFunction:funcs[0]}});
    IntlMessageFormat.__addLocaleData({locale:"id", messageformat:{pluralFunction:funcs[6]}});
    IntlMessageFormat.__addLocaleData({locale:"ig", messageformat:{pluralFunction:funcs[6]}});
    IntlMessageFormat.__addLocaleData({locale:"ii", messageformat:{pluralFunction:funcs[6]}});
    IntlMessageFormat.__addLocaleData({locale:"is", messageformat:{pluralFunction:funcs[19]}});
    IntlMessageFormat.__addLocaleData({locale:"it", messageformat:{pluralFunction:funcs[9]}});
    IntlMessageFormat.__addLocaleData({locale:"ja", messageformat:{pluralFunction:funcs[6]}});
    IntlMessageFormat.__addLocaleData({locale:"jgo", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"jmc", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"ka", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"kab", messageformat:{pluralFunction:funcs[13]}});
    IntlMessageFormat.__addLocaleData({locale:"kam", messageformat:{pluralFunction:funcs[0]}});
    IntlMessageFormat.__addLocaleData({locale:"kde", messageformat:{pluralFunction:funcs[6]}});
    IntlMessageFormat.__addLocaleData({locale:"kea", messageformat:{pluralFunction:funcs[6]}});
    IntlMessageFormat.__addLocaleData({locale:"khq", messageformat:{pluralFunction:funcs[0]}});
    IntlMessageFormat.__addLocaleData({locale:"ki", messageformat:{pluralFunction:funcs[0]}});
    IntlMessageFormat.__addLocaleData({locale:"kk", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"kkj", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"kl", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"kln", messageformat:{pluralFunction:funcs[0]}});
    IntlMessageFormat.__addLocaleData({locale:"km", messageformat:{pluralFunction:funcs[6]}});
    IntlMessageFormat.__addLocaleData({locale:"kn", messageformat:{pluralFunction:funcs[3]}});
    IntlMessageFormat.__addLocaleData({locale:"ko", messageformat:{pluralFunction:funcs[6]}});
    IntlMessageFormat.__addLocaleData({locale:"kok", messageformat:{pluralFunction:funcs[0]}});
    IntlMessageFormat.__addLocaleData({locale:"ks", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"ksb", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"ksf", messageformat:{pluralFunction:funcs[0]}});
    IntlMessageFormat.__addLocaleData({locale:"ksh", messageformat:{pluralFunction:funcs[20]}});
    IntlMessageFormat.__addLocaleData({locale:"kw", messageformat:{pluralFunction:funcs[21]}});
    IntlMessageFormat.__addLocaleData({locale:"ky", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"lag", messageformat:{pluralFunction:funcs[22]}});
    IntlMessageFormat.__addLocaleData({locale:"lg", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"lkt", messageformat:{pluralFunction:funcs[6]}});
    IntlMessageFormat.__addLocaleData({locale:"ln", messageformat:{pluralFunction:funcs[2]}});
    IntlMessageFormat.__addLocaleData({locale:"lo", messageformat:{pluralFunction:funcs[6]}});
    IntlMessageFormat.__addLocaleData({locale:"lt", messageformat:{pluralFunction:funcs[23]}});
    IntlMessageFormat.__addLocaleData({locale:"lu", messageformat:{pluralFunction:funcs[0]}});
    IntlMessageFormat.__addLocaleData({locale:"luo", messageformat:{pluralFunction:funcs[0]}});
    IntlMessageFormat.__addLocaleData({locale:"luy", messageformat:{pluralFunction:funcs[0]}});
    IntlMessageFormat.__addLocaleData({locale:"lv", messageformat:{pluralFunction:funcs[24]}});
    IntlMessageFormat.__addLocaleData({locale:"mas", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"mer", messageformat:{pluralFunction:funcs[0]}});
    IntlMessageFormat.__addLocaleData({locale:"mfe", messageformat:{pluralFunction:funcs[0]}});
    IntlMessageFormat.__addLocaleData({locale:"mg", messageformat:{pluralFunction:funcs[2]}});
    IntlMessageFormat.__addLocaleData({locale:"mgh", messageformat:{pluralFunction:funcs[0]}});
    IntlMessageFormat.__addLocaleData({locale:"mgo", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"mk", messageformat:{pluralFunction:funcs[25]}});
    IntlMessageFormat.__addLocaleData({locale:"ml", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"mn", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"mr", messageformat:{pluralFunction:funcs[3]}});
    IntlMessageFormat.__addLocaleData({locale:"ms", messageformat:{pluralFunction:funcs[6]}});
    IntlMessageFormat.__addLocaleData({locale:"mt", messageformat:{pluralFunction:funcs[26]}});
    IntlMessageFormat.__addLocaleData({locale:"mua", messageformat:{pluralFunction:funcs[0]}});
    IntlMessageFormat.__addLocaleData({locale:"my", messageformat:{pluralFunction:funcs[6]}});
    IntlMessageFormat.__addLocaleData({locale:"naq", messageformat:{pluralFunction:funcs[21]}});
    IntlMessageFormat.__addLocaleData({locale:"nb", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"nd", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"ne", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"nl", messageformat:{pluralFunction:funcs[9]}});
    IntlMessageFormat.__addLocaleData({locale:"nmg", messageformat:{pluralFunction:funcs[0]}});
    IntlMessageFormat.__addLocaleData({locale:"nn", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"nnh", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"nr", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"nso", messageformat:{pluralFunction:funcs[2]}});
    IntlMessageFormat.__addLocaleData({locale:"nus", messageformat:{pluralFunction:funcs[0]}});
    IntlMessageFormat.__addLocaleData({locale:"nyn", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"om", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"or", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"os", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"pa", messageformat:{pluralFunction:funcs[2]}});
    IntlMessageFormat.__addLocaleData({locale:"pl", messageformat:{pluralFunction:funcs[27]}});
    IntlMessageFormat.__addLocaleData({locale:"ps", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"pt", messageformat:{pluralFunction:funcs[28]}});
    IntlMessageFormat.__addLocaleData({locale:"rm", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"rn", messageformat:{pluralFunction:funcs[0]}});
    IntlMessageFormat.__addLocaleData({locale:"ro", messageformat:{pluralFunction:funcs[29]}});
    IntlMessageFormat.__addLocaleData({locale:"rof", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"ru", messageformat:{pluralFunction:funcs[30]}});
    IntlMessageFormat.__addLocaleData({locale:"rw", messageformat:{pluralFunction:funcs[0]}});
    IntlMessageFormat.__addLocaleData({locale:"rwk", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"sah", messageformat:{pluralFunction:funcs[6]}});
    IntlMessageFormat.__addLocaleData({locale:"saq", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"sbp", messageformat:{pluralFunction:funcs[0]}});
    IntlMessageFormat.__addLocaleData({locale:"se", messageformat:{pluralFunction:funcs[21]}});
    IntlMessageFormat.__addLocaleData({locale:"seh", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"ses", messageformat:{pluralFunction:funcs[6]}});
    IntlMessageFormat.__addLocaleData({locale:"sg", messageformat:{pluralFunction:funcs[6]}});
    IntlMessageFormat.__addLocaleData({locale:"shi", messageformat:{pluralFunction:funcs[31]}});
    IntlMessageFormat.__addLocaleData({locale:"si", messageformat:{pluralFunction:funcs[32]}});
    IntlMessageFormat.__addLocaleData({locale:"sk", messageformat:{pluralFunction:funcs[10]}});
    IntlMessageFormat.__addLocaleData({locale:"sl", messageformat:{pluralFunction:funcs[33]}});
    IntlMessageFormat.__addLocaleData({locale:"sn", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"so", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"sq", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"sr", messageformat:{pluralFunction:funcs[8]}});
    IntlMessageFormat.__addLocaleData({locale:"ss", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"ssy", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"st", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"sv", messageformat:{pluralFunction:funcs[9]}});
    IntlMessageFormat.__addLocaleData({locale:"sw", messageformat:{pluralFunction:funcs[9]}});
    IntlMessageFormat.__addLocaleData({locale:"swc", messageformat:{pluralFunction:funcs[0]}});
    IntlMessageFormat.__addLocaleData({locale:"ta", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"te", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"teo", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"tg", messageformat:{pluralFunction:funcs[0]}});
    IntlMessageFormat.__addLocaleData({locale:"th", messageformat:{pluralFunction:funcs[6]}});
    IntlMessageFormat.__addLocaleData({locale:"ti", messageformat:{pluralFunction:funcs[2]}});
    IntlMessageFormat.__addLocaleData({locale:"tig", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"tn", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"to", messageformat:{pluralFunction:funcs[6]}});
    IntlMessageFormat.__addLocaleData({locale:"tr", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"ts", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"twq", messageformat:{pluralFunction:funcs[0]}});
    IntlMessageFormat.__addLocaleData({locale:"tzm", messageformat:{pluralFunction:funcs[34]}});
    IntlMessageFormat.__addLocaleData({locale:"uk", messageformat:{pluralFunction:funcs[35]}});
    IntlMessageFormat.__addLocaleData({locale:"ur", messageformat:{pluralFunction:funcs[9]}});
    IntlMessageFormat.__addLocaleData({locale:"uz", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"vai", messageformat:{pluralFunction:funcs[0]}});
    IntlMessageFormat.__addLocaleData({locale:"ve", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"vi", messageformat:{pluralFunction:funcs[6]}});
    IntlMessageFormat.__addLocaleData({locale:"vo", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"vun", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"wae", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"wal", messageformat:{pluralFunction:funcs[0]}});
    IntlMessageFormat.__addLocaleData({locale:"xh", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"xog", messageformat:{pluralFunction:funcs[1]}});
    IntlMessageFormat.__addLocaleData({locale:"yav", messageformat:{pluralFunction:funcs[0]}});
    IntlMessageFormat.__addLocaleData({locale:"yo", messageformat:{pluralFunction:funcs[6]}});
    IntlMessageFormat.__addLocaleData({locale:"zgh", messageformat:{pluralFunction:funcs[0]}});
    IntlMessageFormat.__addLocaleData({locale:"zh", messageformat:{pluralFunction:funcs[6]}});
    IntlMessageFormat.__addLocaleData({locale:"zu", messageformat:{pluralFunction:funcs[3]}});
    })(typeof global !== "undefined" ? global : this);
    
    /* jslint -W040, node: true */
    
    'use strict';
    
    // IntlMessageFormat and Intl are dependencies of this package. The built-in
    // `Intl` is preferred, but when not available it looks for the polyfill.
    var Intl              = global.Intl || global.IntlPolyfill,
        IntlMessageFormat = global.IntlMessageFormat,
        // Cache to hold NumberFormat and DateTimeFormat instances for reuse.
        formatsCache = {
            number: {},
            date  : {}
        },
        isArray = Array.isArray,
        isObject = function (o) {
            return (typeof o === 'object' && !isArray(o));
        },
        isFunction = function (fn) {
            return (typeof fn === 'function');
        };
    
    if (!Intl) {
        throw new ReferenceError('Intl must be available.');
    }
    
    if (!IntlMessageFormat) {
        throw new ReferenceError('IntlMessageFormat must be available.');
    }
    
    function intlDate(date, formatOptions) {
        var locales = this.props.locales || this.context.locales,
            formats = this.props.formats || this.context.formats;
    
        date = new Date(date);
    
        // Determine if the `date` is valid.
        if (!(date && date.getTime())) {
            throw new TypeError('A date must be provided.');
        }
    
        if (formatOptions) {
            if (typeof formatOptions === 'string') {
                try {
                    formatOptions = formats.date[formatOptions];
                } catch (e) {
                    throw new ReferenceError('Invalid date formatter: `' + formatOptions + '`.');
                }
            }
    
            formatOptions = extend({}, formatOptions);
        }
    
        return getFormat('date', locales, formatOptions).format(date);
    }
    
    function intlNumber(num, formatOptions) {
        var locales = this.props.locales || this.context.locales,
            formats = this.props.formats || this.context.formats;
    
        if (typeof num !== 'number') {
            throw new TypeError('A number must be provided.');
        }
    
        if (formatOptions) {
            if (typeof formatOptions === 'string') {
                try {
                    formatOptions = formats.number[formatOptions];
                } catch (e) {
                    throw new ReferenceError('Invalid number formatter: `' + formatOptions + '`.');
                }
            }
    
            formatOptions = extend({}, formatOptions);
        }
    
        return getFormat('number', locales, formatOptions).format(num);
    }
    
    function intlMessage(message, values) {
        var locales = this.props.locales || this.context.locales,
            formats = this.props.formats || this.context.formats;
    
        // When `message` is a function, assume it's an IntlMessageFormat
        // instance's `format()` method passed by reference, and call it.
        // This is possible because its `this` will be pre-bound to the
        // instance.
        if (isFunction(message)) {
            return message(values);
        }
    
        // Assume that an object with a `format()` method is already an
        // IntlMessageFormat instance, and use it; otherwise create a new
        // one.
        if (!isFunction(message.format)) {
            message = new IntlMessageFormat(message, locales, formats);
        }
    
        return message.format(values);
    }
    
    // -- Utilities ------------------------------------------------------------
    
    function getFormat(type, locales, options) {
        var orderedOptions, option, key, i, len, id, format;
    
        // When JSON is available in the environment, use it build a cache-id
        // to reuse formats for increased performance.
        if (global.JSON) {
            // Order the keys in `options` to create a serialized semantic
            // representation which is reproducible.
            if (options) {
                orderedOptions = [];
    
                for (key in options) {
                    if (options.hasOwnProperty(key)) {
                        orderedOptions.push(key);
                    }
                }
    
                orderedOptions.sort();
    
                for (i = 0, len = orderedOptions.length; i < len; i += 1) {
                    key    = orderedOptions[i];
                    option = {};
    
                    option[key] = options[key];
                    orderedOptions[i] = option;
                }
            }
    
            id = global.JSON.stringify([locales, orderedOptions]);
        }
    
        // Check for a cached format instance, and use it.
        format = formatsCache[type][id];
        if (format) { return format; }
    
        switch (type) {
            case 'number':
                format = new Intl.NumberFormat(locales, options);
                break;
            case 'date':
                format = new Intl.DateTimeFormat(locales, options);
                break;
        }
    
        // Cache format for reuse.
        if (id) {
            formatsCache[type][id] = format;
        }
    
        return format;
    }
    
    function extend(obj) {
        var sources = Array.prototype.slice.call(arguments, 1),
            i, len, source, key;
    
        for (i = 0, len = sources.length; i < len; i += 1) {
            source = sources[i];
            if (!source) { continue; }
    
            for (key in source) {
                if (source.hasOwnProperty(key)) {
                    obj[key] = source[key];
                }
            }
        }
    
        return obj;
    }
    
    // -- exports---------------------------------------------------------------
    
    global.ReactIntlMixin = {
        contextTypes: {
            locales: function(context) {
                if (context.locales && !isArray(context.locales)) {
                    console.warn('Invalid `context.locales` value, it should be an array!');
                }
            },
            formats: function(context) {
                if (context.formats && !isObject(context.formats)) {
                    console.warn('Invalid `context.formats` value, it should be an object!');
                }
            }
        },
        childContextTypes: {
            locales: function(context) {
                if (context.locales && !isArray(context.locales)) {
                    console.warn('Invalid `locales` value in getChildContext(), it should be an array!');
                }
            },
            formats: function(context) {
                if (context.formats && !isObject(context.formats)) {
                    console.warn('Invalid `formats` value in getChildContext(), it should be an object!');
                }
            }
        },
        propsTypes: {
            locales: function(props) {
                if (props.locales && !isArray(props.locales)) {
                    console.warn('Invalid `props.locales` value, it should be an array!');
                }
            },
            formats: function(props) {
                if (props.formats && !isObject(props.formats)) {
                    console.warn('Invalid `props.formats` value, it should be an object!');
                }
            }
        },
        getChildContext: function () {
            var childContext = Object.create(this.context);
            if (this.props.locales) {
                childContext.locales = this.props.locales;
            }
            if (this.props.formats) {
                childContext.formats = this.props.formats;
            }
            return childContext;
        },
        intlDate   : intlDate,
        intlNumber : intlNumber,
        intlMessage: intlMessage
    };
    
})(window);