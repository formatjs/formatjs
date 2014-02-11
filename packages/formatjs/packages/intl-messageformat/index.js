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
