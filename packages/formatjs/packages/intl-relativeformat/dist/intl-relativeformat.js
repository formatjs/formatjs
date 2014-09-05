(function() {
    "use strict";
    var $$utils$$hop = Object.prototype.hasOwnProperty;

    function $$utils$$extend(obj) {
        var sources = Array.prototype.slice.call(arguments, 1),
            i, len, source, key;

        for (i = 0, len = sources.length; i < len; i += 1) {
            source = sources[i];
            if (!source) { continue; }

            for (key in source) {
                if ($$utils$$hop.call(source, key)) {
                    obj[key] = source[key];
                }
            }
        }

        return obj;
    }

    // Purposely using the same implementation as the Intl.js `Intl` polyfill.
    // Copyright 2013 Andy Earnshaw, MIT License

    var $$es5$$realDefineProp = (function () {
        try { return !!Object.defineProperty({}, 'a', {}); }
        catch (e) { return false; }
    })();

    var $$es5$$es3 = !$$es5$$realDefineProp && !Object.prototype.__defineGetter__;

    var $$es5$$defineProperty = $$es5$$realDefineProp ? Object.defineProperty :
            function (obj, name, desc) {

        if ('get' in desc && obj.__defineGetter__) {
            obj.__defineGetter__(name, desc.get);
        } else if (!$$utils$$hop.call(obj, name) || 'value' in desc) {
            obj[name] = desc.value;
        }
    };

    var $$es5$$objCreate = Object.create || function (proto, props) {
        var obj, k;

        function F() {}
        F.prototype = proto;
        obj = new F();

        for (k in props) {
            if ($$utils$$hop.call(props, k)) {
                $$es5$$defineProperty(obj, k, props[k]);
            }
        }

        return obj;
    };

    var $$es5$$fnBind = Function.prototype.bind || function (thisObj) {
        var fn   = this,
            args = [].slice.call(arguments, 1);

        return function () {
            fn.apply(thisObj, args.concat([].slice.call(arguments)));
        };
    };
    var $$utils1$$hop = Object.prototype.hasOwnProperty;

    function $$utils1$$extend(obj) {
        var sources = Array.prototype.slice.call(arguments, 1),
            i, len, source, key;

        for (i = 0, len = sources.length; i < len; i += 1) {
            source = sources[i];
            if (!source) { continue; }

            for (key in source) {
                if ($$utils1$$hop.call(source, key)) {
                    obj[key] = source[key];
                }
            }
        }

        return obj;
    }

    // Purposely using the same implementation as the Intl.js `Intl` polyfill.
    // Copyright 2013 Andy Earnshaw, MIT License

    var $$es51$$realDefineProp = (function () {
        try { return !!Object.defineProperty({}, 'a', {}); }
        catch (e) { return false; }
    })();

    var $$es51$$es3 = !$$es51$$realDefineProp && !Object.prototype.__defineGetter__;

    var $$es51$$defineProperty = $$es51$$realDefineProp ? Object.defineProperty :
            function (obj, name, desc) {

        if ('get' in desc && obj.__defineGetter__) {
            obj.__defineGetter__(name, desc.get);
        } else if (!$$utils1$$hop.call(obj, name) || 'value' in desc) {
            obj[name] = desc.value;
        }
    };

    var $$es51$$objCreate = Object.create || function (proto, props) {
        var obj, k;

        function F() {}
        F.prototype = proto;
        obj = new F();

        for (k in props) {
            if ($$utils1$$hop.call(props, k)) {
                $$es51$$defineProperty(obj, k, props[k]);
            }
        }

        return obj;
    };

    var $$es51$$fnBind = Function.prototype.bind || function (thisObj) {
        var fn   = this,
            args = [].slice.call(arguments, 1);

        return function () {
            fn.apply(thisObj, args.concat([].slice.call(arguments)));
        };
    };
    var $$compiler$$default = $$compiler$$Compiler;

    function $$compiler$$Compiler(locales, formats, pluralFn) {
        this.locales  = locales;
        this.formats  = formats;
        this.pluralFn = pluralFn;
    }

    $$compiler$$Compiler.prototype.compile = function (ast) {
        this.pluralStack        = [];
        this.currentPlural      = null;
        this.pluralNumberFormat = null;

        return this.compileMessage(ast);
    };

    $$compiler$$Compiler.prototype.compileMessage = function (ast) {
        if (!(ast && ast.type === 'messageFormatPattern')) {
            throw new Error('Message AST is not of type: "messageFormatPattern"');
        }

        var elements = ast.elements,
            pattern  = [];

        var i, len, element;

        for (i = 0, len = elements.length; i < len; i += 1) {
            element = elements[i];

            switch (element.type) {
                case 'messageTextElement':
                    pattern.push(this.compileMessageText(element));
                    break;

                case 'argumentElement':
                    pattern.push(this.compileArgument(element));
                    break;

                default:
                    throw new Error('Message element does not have a valid type');
            }
        }

        return pattern;
    };

    $$compiler$$Compiler.prototype.compileMessageText = function (element) {
        // When this `element` is part of plural sub-pattern and its value contains
        // an unescaped '#', use a `PluralOffsetString` helper to properly output
        // the number with the correct offset in the string.
        if (this.currentPlural && /(^|[^\\])#/g.test(element.value)) {
            // Create a cache a NumberFormat instance that can be reused for any
            // PluralOffsetString instance in this message.
            if (!this.pluralNumberFormat) {
                this.pluralNumberFormat = new Intl.NumberFormat(this.locales);
            }

            return new $$compiler$$PluralOffsetString(
                    this.currentPlural.id,
                    this.currentPlural.format.offset,
                    this.pluralNumberFormat,
                    element.value);
        }

        // Unescape the escaped '#'s in the message text.
        return element.value.replace(/\\#/g, '#');
    };

    $$compiler$$Compiler.prototype.compileArgument = function (element) {
        var format   = element.format,
            formats  = this.formats,
            locales  = this.locales,
            pluralFn = this.pluralFn,
            options;

        if (!format) {
            return new $$compiler$$StringFormat(element.id);
        }

        switch (format.type) {
            case 'numberFormat':
                options = formats.number[format.style];
                return {
                    id    : element.id,
                    format: new Intl.NumberFormat(locales, options).format
                };

            case 'dateFormat':
                options = formats.date[format.style];
                return {
                    id    : element.id,
                    format: new Intl.DateTimeFormat(locales, options).format
                };

            case 'timeFormat':
                options = formats.time[format.style];
                return {
                    id    : element.id,
                    format: new Intl.DateTimeFormat(locales, options).format
                };

            case 'pluralFormat':
                options = this.compileOptions(element);
                return new $$compiler$$PluralFormat(element.id, format.offset, options, pluralFn);

            case 'selectFormat':
                options = this.compileOptions(element);
                return new $$compiler$$SelectFormat(element.id, options);

            default:
                throw new Error('Message element does not have a valid format type');
        }
    };

    $$compiler$$Compiler.prototype.compileOptions = function (element) {
        var format      = element.format,
            options     = format.options,
            optionsHash = {};

        // Save the current plural element, if any, then set it to a new value when
        // compiling the options sub-patterns. This conform's the spec's algorithm
        // for handling `"#"` synax in message text.
        this.pluralStack.push(this.currentPlural);
        this.currentPlural = format.type === 'pluralFormat' ? element : null;

        var i, len, option;

        for (i = 0, len = options.length; i < len; i += 1) {
            option = options[i];

            // Compile the sub-pattern and save it under the options's selector.
            optionsHash[option.selector] = this.compileMessage(option.value);
        }

        // Pop the plural stack to put back the original currnet plural value.
        this.currentPlural = this.pluralStack.pop();

        return optionsHash;
    };

    // -- Compiler Helper Classes --------------------------------------------------

    function $$compiler$$StringFormat(id) {
        this.id = id;
    }

    $$compiler$$StringFormat.prototype.format = function (value) {
        if (!value) {
            return '';
        }

        return typeof value === 'string' ? value : String(value);
    };

    function $$compiler$$PluralFormat(id, offset, options, pluralFn) {
        this.id       = id;
        this.offset   = offset;
        this.options  = options;
        this.pluralFn = pluralFn;
    }

    $$compiler$$PluralFormat.prototype.getOption = function (value) {
        var options = this.options;

        var option = options['=' + value] ||
                options[this.pluralFn(value - this.offset)];

        return option || options.other;
    };

    function $$compiler$$PluralOffsetString(id, offset, numberFormat, string) {
        this.id           = id;
        this.offset       = offset;
        this.numberFormat = numberFormat;
        this.string       = string;
    }

    $$compiler$$PluralOffsetString.prototype.format = function (value) {
        var number = this.numberFormat.format(value - this.offset);

        return this.string
                .replace(/(^|[^\\])#/g, '$1' + number)
                .replace(/\\#/g, '#');
    };

    function $$compiler$$SelectFormat(id, options) {
        this.id      = id;
        this.options = options;
    }

    $$compiler$$SelectFormat.prototype.getOption = function (value) {
        var options = this.options;
        return options[value] || options.other;
    };

    var intl$messageformat$parser$$default = (function() {
      /*
       * Generated by PEG.js 0.8.0.
       *
       * http://pegjs.majda.cz/
       */

      function peg$subclass(child, parent) {
        function ctor() { this.constructor = child; }
        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
      }

      function SyntaxError(message, expected, found, offset, line, column) {
        this.message  = message;
        this.expected = expected;
        this.found    = found;
        this.offset   = offset;
        this.line     = line;
        this.column   = column;

        this.name     = "SyntaxError";
      }

      peg$subclass(SyntaxError, Error);

      function parse(input) {
        var options = arguments.length > 1 ? arguments[1] : {},

            peg$FAILED = {},

            peg$startRuleFunctions = { start: peg$parsestart },
            peg$startRuleFunction  = peg$parsestart,

            peg$c0 = [],
            peg$c1 = function(elements) {
                    return {
                        type    : 'messageFormatPattern',
                        elements: elements
                    };
                },
            peg$c2 = peg$FAILED,
            peg$c3 = function(text) {
                    var string = '',
                        i, j, outerLen, inner, innerLen;

                    for (i = 0, outerLen = text.length; i < outerLen; i += 1) {
                        inner = text[i];

                        for (j = 0, innerLen = inner.length; j < innerLen; j += 1) {
                            string += inner[j];
                        }
                    }

                    return string;
                },
            peg$c4 = function(messageText) {
                    return {
                        type : 'messageTextElement',
                        value: messageText
                    };
                },
            peg$c5 = /^[^ \t\n\r,.+={}#]/,
            peg$c6 = { type: "class", value: "[^ \\t\\n\\r,.+={}#]", description: "[^ \\t\\n\\r,.+={}#]" },
            peg$c7 = "{",
            peg$c8 = { type: "literal", value: "{", description: "\"{\"" },
            peg$c9 = null,
            peg$c10 = ",",
            peg$c11 = { type: "literal", value: ",", description: "\",\"" },
            peg$c12 = "}",
            peg$c13 = { type: "literal", value: "}", description: "\"}\"" },
            peg$c14 = function(id, format) {
                    return {
                        type  : 'argumentElement',
                        id    : id,
                        format: format && format[2]
                    };
                },
            peg$c15 = "number",
            peg$c16 = { type: "literal", value: "number", description: "\"number\"" },
            peg$c17 = "date",
            peg$c18 = { type: "literal", value: "date", description: "\"date\"" },
            peg$c19 = "time",
            peg$c20 = { type: "literal", value: "time", description: "\"time\"" },
            peg$c21 = function(type, style) {
                    return {
                        type : type + 'Format',
                        style: style && style[2]
                    };
                },
            peg$c22 = "plural",
            peg$c23 = { type: "literal", value: "plural", description: "\"plural\"" },
            peg$c24 = function(offset, options) {
                    return {
                        type   : 'pluralFormat',
                        offset : offset || 0,
                        options: options
                    }
                },
            peg$c25 = "select",
            peg$c26 = { type: "literal", value: "select", description: "\"select\"" },
            peg$c27 = function(options) {
                    return {
                        type   : 'selectFormat',
                        options: options
                    }
                },
            peg$c28 = "=",
            peg$c29 = { type: "literal", value: "=", description: "\"=\"" },
            peg$c30 = function(selector, pattern) {
                    return {
                        type    : 'optionalFormatPattern',
                        selector: selector,
                        value   : pattern
                    };
                },
            peg$c31 = "offset:",
            peg$c32 = { type: "literal", value: "offset:", description: "\"offset:\"" },
            peg$c33 = function(number) {
                    return number;
                },
            peg$c34 = { type: "other", description: "whitespace" },
            peg$c35 = /^[ \t\n\r]/,
            peg$c36 = { type: "class", value: "[ \\t\\n\\r]", description: "[ \\t\\n\\r]" },
            peg$c37 = { type: "other", description: "optionalWhitespace" },
            peg$c38 = /^[0-9]/,
            peg$c39 = { type: "class", value: "[0-9]", description: "[0-9]" },
            peg$c40 = /^[0-9a-f]/i,
            peg$c41 = { type: "class", value: "[0-9a-f]i", description: "[0-9a-f]i" },
            peg$c42 = "0",
            peg$c43 = { type: "literal", value: "0", description: "\"0\"" },
            peg$c44 = /^[1-9]/,
            peg$c45 = { type: "class", value: "[1-9]", description: "[1-9]" },
            peg$c46 = function(digits) {
                return parseInt(digits, 10);
            },
            peg$c47 = /^[^{}\\\0-\x1F \t\n\r]/,
            peg$c48 = { type: "class", value: "[^{}\\\\\\0-\\x1F \\t\\n\\r]", description: "[^{}\\\\\\0-\\x1F \\t\\n\\r]" },
            peg$c49 = "\\#",
            peg$c50 = { type: "literal", value: "\\#", description: "\"\\\\#\"" },
            peg$c51 = function() { return '\\#'; },
            peg$c52 = "\\{",
            peg$c53 = { type: "literal", value: "\\{", description: "\"\\\\{\"" },
            peg$c54 = function() { return '\u007B'; },
            peg$c55 = "\\}",
            peg$c56 = { type: "literal", value: "\\}", description: "\"\\\\}\"" },
            peg$c57 = function() { return '\u007D'; },
            peg$c58 = "\\u",
            peg$c59 = { type: "literal", value: "\\u", description: "\"\\\\u\"" },
            peg$c60 = function(digits) {
                    return String.fromCharCode(parseInt(digits, 16));
                },
            peg$c61 = function(chars) { return chars.join(''); },

            peg$currPos          = 0,
            peg$reportedPos      = 0,
            peg$cachedPos        = 0,
            peg$cachedPosDetails = { line: 1, column: 1, seenCR: false },
            peg$maxFailPos       = 0,
            peg$maxFailExpected  = [],
            peg$silentFails      = 0,

            peg$result;

        if ("startRule" in options) {
          if (!(options.startRule in peg$startRuleFunctions)) {
            throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
          }

          peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
        }

        function text() {
          return input.substring(peg$reportedPos, peg$currPos);
        }

        function offset() {
          return peg$reportedPos;
        }

        function line() {
          return peg$computePosDetails(peg$reportedPos).line;
        }

        function column() {
          return peg$computePosDetails(peg$reportedPos).column;
        }

        function expected(description) {
          throw peg$buildException(
            null,
            [{ type: "other", description: description }],
            peg$reportedPos
          );
        }

        function error(message) {
          throw peg$buildException(message, null, peg$reportedPos);
        }

        function peg$computePosDetails(pos) {
          function advance(details, startPos, endPos) {
            var p, ch;

            for (p = startPos; p < endPos; p++) {
              ch = input.charAt(p);
              if (ch === "\n") {
                if (!details.seenCR) { details.line++; }
                details.column = 1;
                details.seenCR = false;
              } else if (ch === "\r" || ch === "\u2028" || ch === "\u2029") {
                details.line++;
                details.column = 1;
                details.seenCR = true;
              } else {
                details.column++;
                details.seenCR = false;
              }
            }
          }

          if (peg$cachedPos !== pos) {
            if (peg$cachedPos > pos) {
              peg$cachedPos = 0;
              peg$cachedPosDetails = { line: 1, column: 1, seenCR: false };
            }
            advance(peg$cachedPosDetails, peg$cachedPos, pos);
            peg$cachedPos = pos;
          }

          return peg$cachedPosDetails;
        }

        function peg$fail(expected) {
          if (peg$currPos < peg$maxFailPos) { return; }

          if (peg$currPos > peg$maxFailPos) {
            peg$maxFailPos = peg$currPos;
            peg$maxFailExpected = [];
          }

          peg$maxFailExpected.push(expected);
        }

        function peg$buildException(message, expected, pos) {
          function cleanupExpected(expected) {
            var i = 1;

            expected.sort(function(a, b) {
              if (a.description < b.description) {
                return -1;
              } else if (a.description > b.description) {
                return 1;
              } else {
                return 0;
              }
            });

            while (i < expected.length) {
              if (expected[i - 1] === expected[i]) {
                expected.splice(i, 1);
              } else {
                i++;
              }
            }
          }

          function buildMessage(expected, found) {
            function stringEscape(s) {
              function hex(ch) { return ch.charCodeAt(0).toString(16).toUpperCase(); }

              return s
                .replace(/\\/g,   '\\\\')
                .replace(/"/g,    '\\"')
                .replace(/\x08/g, '\\b')
                .replace(/\t/g,   '\\t')
                .replace(/\n/g,   '\\n')
                .replace(/\f/g,   '\\f')
                .replace(/\r/g,   '\\r')
                .replace(/[\x00-\x07\x0B\x0E\x0F]/g, function(ch) { return '\\x0' + hex(ch); })
                .replace(/[\x10-\x1F\x80-\xFF]/g,    function(ch) { return '\\x'  + hex(ch); })
                .replace(/[\u0180-\u0FFF]/g,         function(ch) { return '\\u0' + hex(ch); })
                .replace(/[\u1080-\uFFFF]/g,         function(ch) { return '\\u'  + hex(ch); });
            }

            var expectedDescs = new Array(expected.length),
                expectedDesc, foundDesc, i;

            for (i = 0; i < expected.length; i++) {
              expectedDescs[i] = expected[i].description;
            }

            expectedDesc = expected.length > 1
              ? expectedDescs.slice(0, -1).join(", ")
                  + " or "
                  + expectedDescs[expected.length - 1]
              : expectedDescs[0];

            foundDesc = found ? "\"" + stringEscape(found) + "\"" : "end of input";

            return "Expected " + expectedDesc + " but " + foundDesc + " found.";
          }

          var posDetails = peg$computePosDetails(pos),
              found      = pos < input.length ? input.charAt(pos) : null;

          if (expected !== null) {
            cleanupExpected(expected);
          }

          return new SyntaxError(
            message !== null ? message : buildMessage(expected, found),
            expected,
            found,
            pos,
            posDetails.line,
            posDetails.column
          );
        }

        function peg$parsestart() {
          var s0;

          s0 = peg$parsemessageFormatPattern();

          return s0;
        }

        function peg$parsemessageFormatPattern() {
          var s0, s1, s2;

          s0 = peg$currPos;
          s1 = [];
          s2 = peg$parsemessageFormatElement();
          while (s2 !== peg$FAILED) {
            s1.push(s2);
            s2 = peg$parsemessageFormatElement();
          }
          if (s1 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c1(s1);
          }
          s0 = s1;

          return s0;
        }

        function peg$parsemessageFormatElement() {
          var s0;

          s0 = peg$parsemessageTextElement();
          if (s0 === peg$FAILED) {
            s0 = peg$parseargumentElement();
          }

          return s0;
        }

        function peg$parsemessageText() {
          var s0, s1, s2, s3, s4, s5;

          s0 = peg$currPos;
          s1 = [];
          s2 = peg$currPos;
          s3 = peg$parse_();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsechars();
            if (s4 !== peg$FAILED) {
              s5 = peg$parse_();
              if (s5 !== peg$FAILED) {
                s3 = [s3, s4, s5];
                s2 = s3;
              } else {
                peg$currPos = s2;
                s2 = peg$c2;
              }
            } else {
              peg$currPos = s2;
              s2 = peg$c2;
            }
          } else {
            peg$currPos = s2;
            s2 = peg$c2;
          }
          if (s2 !== peg$FAILED) {
            while (s2 !== peg$FAILED) {
              s1.push(s2);
              s2 = peg$currPos;
              s3 = peg$parse_();
              if (s3 !== peg$FAILED) {
                s4 = peg$parsechars();
                if (s4 !== peg$FAILED) {
                  s5 = peg$parse_();
                  if (s5 !== peg$FAILED) {
                    s3 = [s3, s4, s5];
                    s2 = s3;
                  } else {
                    peg$currPos = s2;
                    s2 = peg$c2;
                  }
                } else {
                  peg$currPos = s2;
                  s2 = peg$c2;
                }
              } else {
                peg$currPos = s2;
                s2 = peg$c2;
              }
            }
          } else {
            s1 = peg$c2;
          }
          if (s1 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c3(s1);
          }
          s0 = s1;
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            s1 = peg$parsews();
            if (s1 !== peg$FAILED) {
              s1 = input.substring(s0, peg$currPos);
            }
            s0 = s1;
          }

          return s0;
        }

        function peg$parsemessageTextElement() {
          var s0, s1;

          s0 = peg$currPos;
          s1 = peg$parsemessageText();
          if (s1 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c4(s1);
          }
          s0 = s1;

          return s0;
        }

        function peg$parseargument() {
          var s0, s1, s2;

          s0 = peg$parsenumber();
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            s1 = [];
            if (peg$c5.test(input.charAt(peg$currPos))) {
              s2 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c6); }
            }
            if (s2 !== peg$FAILED) {
              while (s2 !== peg$FAILED) {
                s1.push(s2);
                if (peg$c5.test(input.charAt(peg$currPos))) {
                  s2 = input.charAt(peg$currPos);
                  peg$currPos++;
                } else {
                  s2 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c6); }
                }
              }
            } else {
              s1 = peg$c2;
            }
            if (s1 !== peg$FAILED) {
              s1 = input.substring(s0, peg$currPos);
            }
            s0 = s1;
          }

          return s0;
        }

        function peg$parseargumentElement() {
          var s0, s1, s2, s3, s4, s5, s6, s7, s8;

          s0 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 123) {
            s1 = peg$c7;
            peg$currPos++;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c8); }
          }
          if (s1 !== peg$FAILED) {
            s2 = peg$parse_();
            if (s2 !== peg$FAILED) {
              s3 = peg$parseargument();
              if (s3 !== peg$FAILED) {
                s4 = peg$parse_();
                if (s4 !== peg$FAILED) {
                  s5 = peg$currPos;
                  if (input.charCodeAt(peg$currPos) === 44) {
                    s6 = peg$c10;
                    peg$currPos++;
                  } else {
                    s6 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c11); }
                  }
                  if (s6 !== peg$FAILED) {
                    s7 = peg$parse_();
                    if (s7 !== peg$FAILED) {
                      s8 = peg$parseelementFormat();
                      if (s8 !== peg$FAILED) {
                        s6 = [s6, s7, s8];
                        s5 = s6;
                      } else {
                        peg$currPos = s5;
                        s5 = peg$c2;
                      }
                    } else {
                      peg$currPos = s5;
                      s5 = peg$c2;
                    }
                  } else {
                    peg$currPos = s5;
                    s5 = peg$c2;
                  }
                  if (s5 === peg$FAILED) {
                    s5 = peg$c9;
                  }
                  if (s5 !== peg$FAILED) {
                    s6 = peg$parse_();
                    if (s6 !== peg$FAILED) {
                      if (input.charCodeAt(peg$currPos) === 125) {
                        s7 = peg$c12;
                        peg$currPos++;
                      } else {
                        s7 = peg$FAILED;
                        if (peg$silentFails === 0) { peg$fail(peg$c13); }
                      }
                      if (s7 !== peg$FAILED) {
                        peg$reportedPos = s0;
                        s1 = peg$c14(s3, s5);
                        s0 = s1;
                      } else {
                        peg$currPos = s0;
                        s0 = peg$c2;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$c2;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c2;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c2;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c2;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c2;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c2;
          }

          return s0;
        }

        function peg$parseelementFormat() {
          var s0;

          s0 = peg$parsesimpleFormat();
          if (s0 === peg$FAILED) {
            s0 = peg$parsepluralFormat();
            if (s0 === peg$FAILED) {
              s0 = peg$parseselectFormat();
            }
          }

          return s0;
        }

        function peg$parsesimpleFormat() {
          var s0, s1, s2, s3, s4, s5, s6;

          s0 = peg$currPos;
          if (input.substr(peg$currPos, 6) === peg$c15) {
            s1 = peg$c15;
            peg$currPos += 6;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c16); }
          }
          if (s1 === peg$FAILED) {
            if (input.substr(peg$currPos, 4) === peg$c17) {
              s1 = peg$c17;
              peg$currPos += 4;
            } else {
              s1 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c18); }
            }
            if (s1 === peg$FAILED) {
              if (input.substr(peg$currPos, 4) === peg$c19) {
                s1 = peg$c19;
                peg$currPos += 4;
              } else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c20); }
              }
            }
          }
          if (s1 !== peg$FAILED) {
            s2 = peg$parse_();
            if (s2 !== peg$FAILED) {
              s3 = peg$currPos;
              if (input.charCodeAt(peg$currPos) === 44) {
                s4 = peg$c10;
                peg$currPos++;
              } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c11); }
              }
              if (s4 !== peg$FAILED) {
                s5 = peg$parse_();
                if (s5 !== peg$FAILED) {
                  s6 = peg$parsechars();
                  if (s6 !== peg$FAILED) {
                    s4 = [s4, s5, s6];
                    s3 = s4;
                  } else {
                    peg$currPos = s3;
                    s3 = peg$c2;
                  }
                } else {
                  peg$currPos = s3;
                  s3 = peg$c2;
                }
              } else {
                peg$currPos = s3;
                s3 = peg$c2;
              }
              if (s3 === peg$FAILED) {
                s3 = peg$c9;
              }
              if (s3 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c21(s1, s3);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c2;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c2;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c2;
          }

          return s0;
        }

        function peg$parsepluralFormat() {
          var s0, s1, s2, s3, s4, s5, s6, s7, s8;

          s0 = peg$currPos;
          if (input.substr(peg$currPos, 6) === peg$c22) {
            s1 = peg$c22;
            peg$currPos += 6;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c23); }
          }
          if (s1 !== peg$FAILED) {
            s2 = peg$parse_();
            if (s2 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 44) {
                s3 = peg$c10;
                peg$currPos++;
              } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c11); }
              }
              if (s3 !== peg$FAILED) {
                s4 = peg$parse_();
                if (s4 !== peg$FAILED) {
                  s5 = peg$parseoffset();
                  if (s5 === peg$FAILED) {
                    s5 = peg$c9;
                  }
                  if (s5 !== peg$FAILED) {
                    s6 = peg$parse_();
                    if (s6 !== peg$FAILED) {
                      s7 = [];
                      s8 = peg$parseoptionalFormatPattern();
                      if (s8 !== peg$FAILED) {
                        while (s8 !== peg$FAILED) {
                          s7.push(s8);
                          s8 = peg$parseoptionalFormatPattern();
                        }
                      } else {
                        s7 = peg$c2;
                      }
                      if (s7 !== peg$FAILED) {
                        peg$reportedPos = s0;
                        s1 = peg$c24(s5, s7);
                        s0 = s1;
                      } else {
                        peg$currPos = s0;
                        s0 = peg$c2;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$c2;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c2;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c2;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c2;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c2;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c2;
          }

          return s0;
        }

        function peg$parseselectFormat() {
          var s0, s1, s2, s3, s4, s5, s6;

          s0 = peg$currPos;
          if (input.substr(peg$currPos, 6) === peg$c25) {
            s1 = peg$c25;
            peg$currPos += 6;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c26); }
          }
          if (s1 !== peg$FAILED) {
            s2 = peg$parse_();
            if (s2 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 44) {
                s3 = peg$c10;
                peg$currPos++;
              } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c11); }
              }
              if (s3 !== peg$FAILED) {
                s4 = peg$parse_();
                if (s4 !== peg$FAILED) {
                  s5 = [];
                  s6 = peg$parseoptionalFormatPattern();
                  if (s6 !== peg$FAILED) {
                    while (s6 !== peg$FAILED) {
                      s5.push(s6);
                      s6 = peg$parseoptionalFormatPattern();
                    }
                  } else {
                    s5 = peg$c2;
                  }
                  if (s5 !== peg$FAILED) {
                    peg$reportedPos = s0;
                    s1 = peg$c27(s5);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c2;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c2;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c2;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c2;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c2;
          }

          return s0;
        }

        function peg$parseselector() {
          var s0, s1, s2, s3;

          s0 = peg$currPos;
          s1 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 61) {
            s2 = peg$c28;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c29); }
          }
          if (s2 !== peg$FAILED) {
            s3 = peg$parsenumber();
            if (s3 !== peg$FAILED) {
              s2 = [s2, s3];
              s1 = s2;
            } else {
              peg$currPos = s1;
              s1 = peg$c2;
            }
          } else {
            peg$currPos = s1;
            s1 = peg$c2;
          }
          if (s1 !== peg$FAILED) {
            s1 = input.substring(s0, peg$currPos);
          }
          s0 = s1;
          if (s0 === peg$FAILED) {
            s0 = peg$parsechars();
          }

          return s0;
        }

        function peg$parseoptionalFormatPattern() {
          var s0, s1, s2, s3, s4, s5, s6, s7, s8;

          s0 = peg$currPos;
          s1 = peg$parse_();
          if (s1 !== peg$FAILED) {
            s2 = peg$parseselector();
            if (s2 !== peg$FAILED) {
              s3 = peg$parse_();
              if (s3 !== peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 123) {
                  s4 = peg$c7;
                  peg$currPos++;
                } else {
                  s4 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c8); }
                }
                if (s4 !== peg$FAILED) {
                  s5 = peg$parse_();
                  if (s5 !== peg$FAILED) {
                    s6 = peg$parsemessageFormatPattern();
                    if (s6 !== peg$FAILED) {
                      s7 = peg$parse_();
                      if (s7 !== peg$FAILED) {
                        if (input.charCodeAt(peg$currPos) === 125) {
                          s8 = peg$c12;
                          peg$currPos++;
                        } else {
                          s8 = peg$FAILED;
                          if (peg$silentFails === 0) { peg$fail(peg$c13); }
                        }
                        if (s8 !== peg$FAILED) {
                          peg$reportedPos = s0;
                          s1 = peg$c30(s2, s6);
                          s0 = s1;
                        } else {
                          peg$currPos = s0;
                          s0 = peg$c2;
                        }
                      } else {
                        peg$currPos = s0;
                        s0 = peg$c2;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$c2;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c2;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c2;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c2;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c2;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c2;
          }

          return s0;
        }

        function peg$parseoffset() {
          var s0, s1, s2, s3;

          s0 = peg$currPos;
          if (input.substr(peg$currPos, 7) === peg$c31) {
            s1 = peg$c31;
            peg$currPos += 7;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c32); }
          }
          if (s1 !== peg$FAILED) {
            s2 = peg$parse_();
            if (s2 !== peg$FAILED) {
              s3 = peg$parsenumber();
              if (s3 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c33(s3);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c2;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c2;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c2;
          }

          return s0;
        }

        function peg$parsews() {
          var s0, s1;

          peg$silentFails++;
          s0 = [];
          if (peg$c35.test(input.charAt(peg$currPos))) {
            s1 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c36); }
          }
          if (s1 !== peg$FAILED) {
            while (s1 !== peg$FAILED) {
              s0.push(s1);
              if (peg$c35.test(input.charAt(peg$currPos))) {
                s1 = input.charAt(peg$currPos);
                peg$currPos++;
              } else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c36); }
              }
            }
          } else {
            s0 = peg$c2;
          }
          peg$silentFails--;
          if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c34); }
          }

          return s0;
        }

        function peg$parse_() {
          var s0, s1, s2;

          peg$silentFails++;
          s0 = peg$currPos;
          s1 = [];
          s2 = peg$parsews();
          while (s2 !== peg$FAILED) {
            s1.push(s2);
            s2 = peg$parsews();
          }
          if (s1 !== peg$FAILED) {
            s1 = input.substring(s0, peg$currPos);
          }
          s0 = s1;
          peg$silentFails--;
          if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c37); }
          }

          return s0;
        }

        function peg$parsedigit() {
          var s0;

          if (peg$c38.test(input.charAt(peg$currPos))) {
            s0 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c39); }
          }

          return s0;
        }

        function peg$parsehexDigit() {
          var s0;

          if (peg$c40.test(input.charAt(peg$currPos))) {
            s0 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c41); }
          }

          return s0;
        }

        function peg$parsenumber() {
          var s0, s1, s2, s3, s4, s5;

          s0 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 48) {
            s1 = peg$c42;
            peg$currPos++;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c43); }
          }
          if (s1 === peg$FAILED) {
            s1 = peg$currPos;
            s2 = peg$currPos;
            if (peg$c44.test(input.charAt(peg$currPos))) {
              s3 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c45); }
            }
            if (s3 !== peg$FAILED) {
              s4 = [];
              s5 = peg$parsedigit();
              while (s5 !== peg$FAILED) {
                s4.push(s5);
                s5 = peg$parsedigit();
              }
              if (s4 !== peg$FAILED) {
                s3 = [s3, s4];
                s2 = s3;
              } else {
                peg$currPos = s2;
                s2 = peg$c2;
              }
            } else {
              peg$currPos = s2;
              s2 = peg$c2;
            }
            if (s2 !== peg$FAILED) {
              s2 = input.substring(s1, peg$currPos);
            }
            s1 = s2;
          }
          if (s1 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c46(s1);
          }
          s0 = s1;

          return s0;
        }

        function peg$parsechar() {
          var s0, s1, s2, s3, s4, s5, s6, s7;

          if (peg$c47.test(input.charAt(peg$currPos))) {
            s0 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c48); }
          }
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            if (input.substr(peg$currPos, 2) === peg$c49) {
              s1 = peg$c49;
              peg$currPos += 2;
            } else {
              s1 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c50); }
            }
            if (s1 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c51();
            }
            s0 = s1;
            if (s0 === peg$FAILED) {
              s0 = peg$currPos;
              if (input.substr(peg$currPos, 2) === peg$c52) {
                s1 = peg$c52;
                peg$currPos += 2;
              } else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c53); }
              }
              if (s1 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c54();
              }
              s0 = s1;
              if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                if (input.substr(peg$currPos, 2) === peg$c55) {
                  s1 = peg$c55;
                  peg$currPos += 2;
                } else {
                  s1 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c56); }
                }
                if (s1 !== peg$FAILED) {
                  peg$reportedPos = s0;
                  s1 = peg$c57();
                }
                s0 = s1;
                if (s0 === peg$FAILED) {
                  s0 = peg$currPos;
                  if (input.substr(peg$currPos, 2) === peg$c58) {
                    s1 = peg$c58;
                    peg$currPos += 2;
                  } else {
                    s1 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c59); }
                  }
                  if (s1 !== peg$FAILED) {
                    s2 = peg$currPos;
                    s3 = peg$currPos;
                    s4 = peg$parsehexDigit();
                    if (s4 !== peg$FAILED) {
                      s5 = peg$parsehexDigit();
                      if (s5 !== peg$FAILED) {
                        s6 = peg$parsehexDigit();
                        if (s6 !== peg$FAILED) {
                          s7 = peg$parsehexDigit();
                          if (s7 !== peg$FAILED) {
                            s4 = [s4, s5, s6, s7];
                            s3 = s4;
                          } else {
                            peg$currPos = s3;
                            s3 = peg$c2;
                          }
                        } else {
                          peg$currPos = s3;
                          s3 = peg$c2;
                        }
                      } else {
                        peg$currPos = s3;
                        s3 = peg$c2;
                      }
                    } else {
                      peg$currPos = s3;
                      s3 = peg$c2;
                    }
                    if (s3 !== peg$FAILED) {
                      s3 = input.substring(s2, peg$currPos);
                    }
                    s2 = s3;
                    if (s2 !== peg$FAILED) {
                      peg$reportedPos = s0;
                      s1 = peg$c60(s2);
                      s0 = s1;
                    } else {
                      peg$currPos = s0;
                      s0 = peg$c2;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c2;
                  }
                }
              }
            }
          }

          return s0;
        }

        function peg$parsechars() {
          var s0, s1, s2;

          s0 = peg$currPos;
          s1 = [];
          s2 = peg$parsechar();
          if (s2 !== peg$FAILED) {
            while (s2 !== peg$FAILED) {
              s1.push(s2);
              s2 = peg$parsechar();
            }
          } else {
            s1 = peg$c2;
          }
          if (s1 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c61(s1);
          }
          s0 = s1;

          return s0;
        }

        peg$result = peg$startRuleFunction();

        if (peg$result !== peg$FAILED && peg$currPos === input.length) {
          return peg$result;
        } else {
          if (peg$result !== peg$FAILED && peg$currPos < input.length) {
            peg$fail({ type: "end", description: "end of input" });
          }

          throw peg$buildException(null, peg$maxFailExpected, peg$maxFailPos);
        }
      }

      return {
        SyntaxError: SyntaxError,
        parse:       parse
      };
    })();

    var $$core1$$default = $$core1$$MessageFormat;

    // -- MessageFormat --------------------------------------------------------

    function $$core1$$MessageFormat(message, locales, formats) {
        // Parse string messages into an AST.
        var ast = typeof message === 'string' ?
                $$core1$$MessageFormat.__parse(message) : message;

        if (!(ast && ast.type === 'messageFormatPattern')) {
            throw new TypeError('A message must be provided as a String or AST.');
        }

        // Creates a new object with the specified `formats` merged with the default
        // formats.
        formats = this._mergeFormats($$core1$$MessageFormat.FORMATS, formats);

        // Defined first because it's used to build the format pattern.
        $$es51$$defineProperty(this, '_locale',  {value: this._resolveLocale(locales)});

        var pluralFn = $$core1$$MessageFormat.__localeData__[this._locale].pluralFunction;

        // Define the `pattern` property, a compiled pattern that is highly
        // optimized for repeated `format()` invocations. **Note:** This passes the
        // `locales` set provided to the constructor instead of just the resolved
        // locale.
        var pattern = this._compilePattern(ast, locales, formats, pluralFn);
        $$es51$$defineProperty(this, '_pattern', {value: pattern});

        // Bind `format()` method to `this` so it can be passed by reference like
        // the other `Intl` APIs.
        this.format = $$es51$$fnBind.call(this.format, this);
    }

    // Default format options used as the prototype of the `formats` provided to the
    // constructor. These are used when constructing the internal Intl.NumberFormat
    // and Intl.DateTimeFormat instances.
    $$es51$$defineProperty($$core1$$MessageFormat, 'FORMATS', {
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
    $$es51$$defineProperty($$core1$$MessageFormat, '__availableLocales__', {value: []});
    $$es51$$defineProperty($$core1$$MessageFormat, '__localeData__', {value: $$es51$$objCreate(null)});
    $$es51$$defineProperty($$core1$$MessageFormat, '__addLocaleData', {value: function (data) {
        if (!(data && data.locale)) {
            throw new Error('Object passed does not identify itself with a valid language tag');
        }

        if (!data.messageformat) {
            throw new Error('Object passed does not contain locale data for IntlMessageFormat');
        }

        var availableLocales = $$core1$$MessageFormat.__availableLocales__,
            localeData       = $$core1$$MessageFormat.__localeData__;

        // Message format locale data only requires the first part of the tag.
        var locale = data.locale.toLowerCase().split('-')[0];

        availableLocales.push(locale);
        localeData[locale] = data.messageformat;
    }});

    // Defines `__parse()` static method as an exposed private.
    $$es51$$defineProperty($$core1$$MessageFormat, '__parse', {value: intl$messageformat$parser$$default.parse});

    // Define public `defaultLocale` property which can be set by the developer, or
    // it will be set when the first MessageFormat instance is created by leveraging
    // the resolved locale from `Intl`.
    $$es51$$defineProperty($$core1$$MessageFormat, 'defaultLocale', {
        enumerable: true,
        writable  : true,
        value     : undefined
    });

    $$es51$$defineProperty($$core1$$MessageFormat, '__getDefaultLocale', {value: function () {
        if (!$$core1$$MessageFormat.defaultLocale) {
            // Leverage the locale-resolving capabilities of `Intl` to determine
            // what the default locale should be.
            $$core1$$MessageFormat.defaultLocale =
                    new Intl.NumberFormat().resolvedOptions().locale;
        }

        return $$core1$$MessageFormat.defaultLocale;
    }});

    $$core1$$MessageFormat.prototype.format = function (values) {
        return this._format(this._pattern, values);
    };

    $$core1$$MessageFormat.prototype.resolvedOptions = function () {
        // TODO: Provide anything else?
        return {
            locale: this._locale
        };
    };

    $$core1$$MessageFormat.prototype._compilePattern = function (ast, locales, formats, pluralFn) {
        var compiler = new $$compiler$$default(locales, formats, pluralFn);
        return compiler.compile(ast);
    };

    $$core1$$MessageFormat.prototype._format = function (pattern, values) {
        var result = '',
            i, len, part, id, value;

        for (i = 0, len = pattern.length; i < len; i += 1) {
            part = pattern[i];

            // Exist early for string parts.
            if (typeof part === 'string') {
                result += part;
                continue;
            }

            id = part.id;

            // Enforce that all required values are provided by the caller.
            if (!(values && $$utils1$$hop.call(values, id))) {
                throw new Error('A value must be provided for: ' + id);
            }

            value = values[id];

            // Recursively format plural and select parts' option — which can be a
            // nested pattern structure. The choosing of the option to use is
            // abstracted-by and delegated-to the part helper object.
            if (part.options) {
                result += this._format(part.getOption(value), values);
            } else {
                result += part.format(value);
            }
        }

        return result;
    };

    $$core1$$MessageFormat.prototype._mergeFormats = function (defaults, formats) {
        var mergedFormats = {},
            type, mergedType;

        for (type in defaults) {
            if (!$$utils1$$hop.call(defaults, type)) { continue; }

            mergedFormats[type] = mergedType = $$es51$$objCreate(defaults[type]);

            if (formats && $$utils1$$hop.call(formats, type)) {
                $$utils1$$extend(mergedType, formats[type]);
            }
        }

        return mergedFormats;
    };

    $$core1$$MessageFormat.prototype._resolveLocale = function (locales) {
        var availableLocales = $$core1$$MessageFormat.__availableLocales__,
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

        return locale || $$core1$$MessageFormat.__getDefaultLocale().split('-')[0];
    };
    var intl$messageformat$$default = $$core1$$default;

    var intl$messageformat$$funcs = [
    function (n) {  },
    function (n) { n=Math.floor(n);if(n===1)return"one";return"other"; },
    function (n) { n=Math.floor(n);if(n>=0&&n<=1)return"one";return"other"; },
    function (n) { var i=Math.floor(Math.abs(n));n=Math.floor(n);if(i===0||n===1)return"one";return"other"; },
    function (n) { n=Math.floor(n);if(n===0)return"zero";if(n===1)return"one";if(n===2)return"two";if(n%100>=3&&n%100<=10)return"few";if(n%100>=11&&n%100<=99)return"many";return"other"; },
    function (n) { var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length;n=Math.floor(n);if(i===1&&v===0)return"one";return"other"; },
    function (n) { n=Math.floor(n);if(n%10===1&&(n%100!==11))return"one";if(n%10>=2&&n%10<=4&&!(n%100>=12&&n%100<=14))return"few";if(n%10===0||n%10>=5&&n%10<=9||n%100>=11&&n%100<=14)return"many";return"other"; },
    function (n) { return"other"; },
    function (n) { n=Math.floor(n);if(n%10===1&&!(n%100===11||n%100===71||n%100===91))return"one";if(n%10===2&&!(n%100===12||n%100===72||n%100===92))return"two";if((n%10>=3&&n%10<=4||n%10===9)&&!(n%100>=10&&n%100<=19||n%100>=70&&n%100<=79||n%100>=90&&n%100<=99))return"few";if((n!==0)&&n%1e6===0)return"many";return"other"; },
    function (n) { var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length,f=parseInt(n.toString().replace(/^[^.]*\.?/,""),10);n=Math.floor(n);if(v===0&&i%10===1&&((i%100!==11)||f%10===1&&(f%100!==11)))return"one";if(v===0&&i%10>=2&&i%10<=4&&(!(i%100>=12&&i%100<=14)||f%10>=2&&f%10<=4&&!(f%100>=12&&f%100<=14)))return"few";return"other"; },
    function (n) { var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length;n=Math.floor(n);if(i===1&&v===0)return"one";if(i>=2&&i<=4&&v===0)return"few";if((v!==0))return"many";return"other"; },
    function (n) { n=Math.floor(n);if(n===0)return"zero";if(n===1)return"one";if(n===2)return"two";if(n===3)return"few";if(n===6)return"many";return"other"; },
    function (n) { var i=Math.floor(Math.abs(n)),t=parseInt(n.toString().replace(/^[^.]*\.?|0+$/g,""),10);n=Math.floor(n);if(n===1||(t!==0)&&(i===0||i===1))return"one";return"other"; },
    function (n) { var i=Math.floor(Math.abs(n));n=Math.floor(n);if(i===0||i===1)return"one";return"other"; },
    function (n) { var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length,f=parseInt(n.toString().replace(/^[^.]*\.?/,""),10);n=Math.floor(n);if(v===0&&(i===1||i===2||i===3||v===0&&(!(i%10===4||i%10===6||i%10===9)||(v!==0)&&!(f%10===4||f%10===6||f%10===9))))return"one";return"other"; },
    function (n) { n=Math.floor(n);if(n===1)return"one";if(n===2)return"two";if(n>=3&&n<=6)return"few";if(n>=7&&n<=10)return"many";return"other"; },
    function (n) { n=Math.floor(n);if(n===1||n===11)return"one";if(n===2||n===12)return"two";if(n>=3&&n<=10||n>=13&&n<=19)return"few";return"other"; },
    function (n) { var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length;n=Math.floor(n);if(v===0&&i%10===1)return"one";if(v===0&&i%10===2)return"two";if(v===0&&(i%100===0||i%100===20||i%100===40||i%100===60||i%100===80))return"few";if((v!==0))return"many";return"other"; },
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
    function (n) { var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length;n=Math.floor(n);if(v===0&&i%10===1&&(i%100!==11))return"one";if(v===0&&i%10>=2&&i%10<=4&&!(i%100>=12&&i%100<=14))return"few";if(v===0&&(i%10===0||v===0&&(i%10>=5&&i%10<=9||v===0&&i%100>=11&&i%100<=14)))return"many";return"other"; },
    function (n) { var i=Math.floor(Math.abs(n));n=Math.floor(n);if(i===0||n===1)return"one";if(n>=2&&n<=10)return"few";return"other"; },
    function (n) { var i=Math.floor(Math.abs(n)),f=parseInt(n.toString().replace(/^[^.]*\.?/,""),10);n=Math.floor(n);if(n===0||n===1||i===0&&f===1)return"one";return"other"; },
    function (n) { var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length;n=Math.floor(n);if(v===0&&i%100===1)return"one";if(v===0&&i%100===2)return"two";if(v===0&&(i%100>=3&&i%100<=4||(v!==0)))return"few";return"other"; },
    function (n) { n=Math.floor(n);if(n>=0&&n<=1||n>=11&&n<=99)return"one";return"other"; }
    ];
    $$core1$$default.__addLocaleData({locale:"aa", messageformat:{pluralFunction:intl$messageformat$$funcs[0]}});
    $$core1$$default.__addLocaleData({locale:"af", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"agq", messageformat:{pluralFunction:intl$messageformat$$funcs[0]}});
    $$core1$$default.__addLocaleData({locale:"ak", messageformat:{pluralFunction:intl$messageformat$$funcs[2]}});
    $$core1$$default.__addLocaleData({locale:"am", messageformat:{pluralFunction:intl$messageformat$$funcs[3]}});
    $$core1$$default.__addLocaleData({locale:"ar", messageformat:{pluralFunction:intl$messageformat$$funcs[4]}});
    $$core1$$default.__addLocaleData({locale:"as", messageformat:{pluralFunction:intl$messageformat$$funcs[5]}});
    $$core1$$default.__addLocaleData({locale:"asa", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"ast", messageformat:{pluralFunction:intl$messageformat$$funcs[5]}});
    $$core1$$default.__addLocaleData({locale:"az", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"bas", messageformat:{pluralFunction:intl$messageformat$$funcs[0]}});
    $$core1$$default.__addLocaleData({locale:"be", messageformat:{pluralFunction:intl$messageformat$$funcs[6]}});
    $$core1$$default.__addLocaleData({locale:"bem", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"bez", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"bg", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"bm", messageformat:{pluralFunction:intl$messageformat$$funcs[7]}});
    $$core1$$default.__addLocaleData({locale:"bn", messageformat:{pluralFunction:intl$messageformat$$funcs[3]}});
    $$core1$$default.__addLocaleData({locale:"bo", messageformat:{pluralFunction:intl$messageformat$$funcs[7]}});
    $$core1$$default.__addLocaleData({locale:"br", messageformat:{pluralFunction:intl$messageformat$$funcs[8]}});
    $$core1$$default.__addLocaleData({locale:"brx", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"bs", messageformat:{pluralFunction:intl$messageformat$$funcs[9]}});
    $$core1$$default.__addLocaleData({locale:"byn", messageformat:{pluralFunction:intl$messageformat$$funcs[0]}});
    $$core1$$default.__addLocaleData({locale:"ca", messageformat:{pluralFunction:intl$messageformat$$funcs[5]}});
    $$core1$$default.__addLocaleData({locale:"cgg", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"chr", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"cs", messageformat:{pluralFunction:intl$messageformat$$funcs[10]}});
    $$core1$$default.__addLocaleData({locale:"cy", messageformat:{pluralFunction:intl$messageformat$$funcs[11]}});
    $$core1$$default.__addLocaleData({locale:"da", messageformat:{pluralFunction:intl$messageformat$$funcs[12]}});
    $$core1$$default.__addLocaleData({locale:"dav", messageformat:{pluralFunction:intl$messageformat$$funcs[0]}});
    $$core1$$default.__addLocaleData({locale:"de", messageformat:{pluralFunction:intl$messageformat$$funcs[5]}});
    $$core1$$default.__addLocaleData({locale:"dje", messageformat:{pluralFunction:intl$messageformat$$funcs[0]}});
    $$core1$$default.__addLocaleData({locale:"dua", messageformat:{pluralFunction:intl$messageformat$$funcs[0]}});
    $$core1$$default.__addLocaleData({locale:"dyo", messageformat:{pluralFunction:intl$messageformat$$funcs[0]}});
    $$core1$$default.__addLocaleData({locale:"dz", messageformat:{pluralFunction:intl$messageformat$$funcs[7]}});
    $$core1$$default.__addLocaleData({locale:"ebu", messageformat:{pluralFunction:intl$messageformat$$funcs[0]}});
    $$core1$$default.__addLocaleData({locale:"ee", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"el", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"en", messageformat:{pluralFunction:intl$messageformat$$funcs[5]}});
    $$core1$$default.__addLocaleData({locale:"eo", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"es", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"et", messageformat:{pluralFunction:intl$messageformat$$funcs[5]}});
    $$core1$$default.__addLocaleData({locale:"eu", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"ewo", messageformat:{pluralFunction:intl$messageformat$$funcs[0]}});
    $$core1$$default.__addLocaleData({locale:"fa", messageformat:{pluralFunction:intl$messageformat$$funcs[3]}});
    $$core1$$default.__addLocaleData({locale:"ff", messageformat:{pluralFunction:intl$messageformat$$funcs[13]}});
    $$core1$$default.__addLocaleData({locale:"fi", messageformat:{pluralFunction:intl$messageformat$$funcs[5]}});
    $$core1$$default.__addLocaleData({locale:"fil", messageformat:{pluralFunction:intl$messageformat$$funcs[14]}});
    $$core1$$default.__addLocaleData({locale:"fo", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"fr", messageformat:{pluralFunction:intl$messageformat$$funcs[13]}});
    $$core1$$default.__addLocaleData({locale:"fur", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"fy", messageformat:{pluralFunction:intl$messageformat$$funcs[5]}});
    $$core1$$default.__addLocaleData({locale:"ga", messageformat:{pluralFunction:intl$messageformat$$funcs[15]}});
    $$core1$$default.__addLocaleData({locale:"gd", messageformat:{pluralFunction:intl$messageformat$$funcs[16]}});
    $$core1$$default.__addLocaleData({locale:"gl", messageformat:{pluralFunction:intl$messageformat$$funcs[5]}});
    $$core1$$default.__addLocaleData({locale:"gsw", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"gu", messageformat:{pluralFunction:intl$messageformat$$funcs[3]}});
    $$core1$$default.__addLocaleData({locale:"guz", messageformat:{pluralFunction:intl$messageformat$$funcs[0]}});
    $$core1$$default.__addLocaleData({locale:"gv", messageformat:{pluralFunction:intl$messageformat$$funcs[17]}});
    $$core1$$default.__addLocaleData({locale:"ha", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"haw", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"he", messageformat:{pluralFunction:intl$messageformat$$funcs[18]}});
    $$core1$$default.__addLocaleData({locale:"hi", messageformat:{pluralFunction:intl$messageformat$$funcs[3]}});
    $$core1$$default.__addLocaleData({locale:"hr", messageformat:{pluralFunction:intl$messageformat$$funcs[9]}});
    $$core1$$default.__addLocaleData({locale:"hu", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"hy", messageformat:{pluralFunction:intl$messageformat$$funcs[13]}});
    $$core1$$default.__addLocaleData({locale:"ia", messageformat:{pluralFunction:intl$messageformat$$funcs[0]}});
    $$core1$$default.__addLocaleData({locale:"id", messageformat:{pluralFunction:intl$messageformat$$funcs[7]}});
    $$core1$$default.__addLocaleData({locale:"ig", messageformat:{pluralFunction:intl$messageformat$$funcs[7]}});
    $$core1$$default.__addLocaleData({locale:"ii", messageformat:{pluralFunction:intl$messageformat$$funcs[7]}});
    $$core1$$default.__addLocaleData({locale:"is", messageformat:{pluralFunction:intl$messageformat$$funcs[19]}});
    $$core1$$default.__addLocaleData({locale:"it", messageformat:{pluralFunction:intl$messageformat$$funcs[5]}});
    $$core1$$default.__addLocaleData({locale:"ja", messageformat:{pluralFunction:intl$messageformat$$funcs[7]}});
    $$core1$$default.__addLocaleData({locale:"jgo", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"jmc", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"ka", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"kab", messageformat:{pluralFunction:intl$messageformat$$funcs[13]}});
    $$core1$$default.__addLocaleData({locale:"kam", messageformat:{pluralFunction:intl$messageformat$$funcs[0]}});
    $$core1$$default.__addLocaleData({locale:"kde", messageformat:{pluralFunction:intl$messageformat$$funcs[7]}});
    $$core1$$default.__addLocaleData({locale:"kea", messageformat:{pluralFunction:intl$messageformat$$funcs[7]}});
    $$core1$$default.__addLocaleData({locale:"khq", messageformat:{pluralFunction:intl$messageformat$$funcs[0]}});
    $$core1$$default.__addLocaleData({locale:"ki", messageformat:{pluralFunction:intl$messageformat$$funcs[0]}});
    $$core1$$default.__addLocaleData({locale:"kk", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"kkj", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"kl", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"kln", messageformat:{pluralFunction:intl$messageformat$$funcs[0]}});
    $$core1$$default.__addLocaleData({locale:"km", messageformat:{pluralFunction:intl$messageformat$$funcs[7]}});
    $$core1$$default.__addLocaleData({locale:"kn", messageformat:{pluralFunction:intl$messageformat$$funcs[3]}});
    $$core1$$default.__addLocaleData({locale:"ko", messageformat:{pluralFunction:intl$messageformat$$funcs[7]}});
    $$core1$$default.__addLocaleData({locale:"kok", messageformat:{pluralFunction:intl$messageformat$$funcs[0]}});
    $$core1$$default.__addLocaleData({locale:"ks", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"ksb", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"ksf", messageformat:{pluralFunction:intl$messageformat$$funcs[0]}});
    $$core1$$default.__addLocaleData({locale:"ksh", messageformat:{pluralFunction:intl$messageformat$$funcs[20]}});
    $$core1$$default.__addLocaleData({locale:"kw", messageformat:{pluralFunction:intl$messageformat$$funcs[21]}});
    $$core1$$default.__addLocaleData({locale:"ky", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"lag", messageformat:{pluralFunction:intl$messageformat$$funcs[22]}});
    $$core1$$default.__addLocaleData({locale:"lg", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"lkt", messageformat:{pluralFunction:intl$messageformat$$funcs[7]}});
    $$core1$$default.__addLocaleData({locale:"ln", messageformat:{pluralFunction:intl$messageformat$$funcs[2]}});
    $$core1$$default.__addLocaleData({locale:"lo", messageformat:{pluralFunction:intl$messageformat$$funcs[7]}});
    $$core1$$default.__addLocaleData({locale:"lt", messageformat:{pluralFunction:intl$messageformat$$funcs[23]}});
    $$core1$$default.__addLocaleData({locale:"lu", messageformat:{pluralFunction:intl$messageformat$$funcs[0]}});
    $$core1$$default.__addLocaleData({locale:"luo", messageformat:{pluralFunction:intl$messageformat$$funcs[0]}});
    $$core1$$default.__addLocaleData({locale:"luy", messageformat:{pluralFunction:intl$messageformat$$funcs[0]}});
    $$core1$$default.__addLocaleData({locale:"lv", messageformat:{pluralFunction:intl$messageformat$$funcs[24]}});
    $$core1$$default.__addLocaleData({locale:"mas", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"mer", messageformat:{pluralFunction:intl$messageformat$$funcs[0]}});
    $$core1$$default.__addLocaleData({locale:"mfe", messageformat:{pluralFunction:intl$messageformat$$funcs[0]}});
    $$core1$$default.__addLocaleData({locale:"mg", messageformat:{pluralFunction:intl$messageformat$$funcs[2]}});
    $$core1$$default.__addLocaleData({locale:"mgh", messageformat:{pluralFunction:intl$messageformat$$funcs[0]}});
    $$core1$$default.__addLocaleData({locale:"mgo", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"mk", messageformat:{pluralFunction:intl$messageformat$$funcs[25]}});
    $$core1$$default.__addLocaleData({locale:"ml", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"mn", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"mr", messageformat:{pluralFunction:intl$messageformat$$funcs[3]}});
    $$core1$$default.__addLocaleData({locale:"ms", messageformat:{pluralFunction:intl$messageformat$$funcs[7]}});
    $$core1$$default.__addLocaleData({locale:"mt", messageformat:{pluralFunction:intl$messageformat$$funcs[26]}});
    $$core1$$default.__addLocaleData({locale:"mua", messageformat:{pluralFunction:intl$messageformat$$funcs[0]}});
    $$core1$$default.__addLocaleData({locale:"my", messageformat:{pluralFunction:intl$messageformat$$funcs[7]}});
    $$core1$$default.__addLocaleData({locale:"naq", messageformat:{pluralFunction:intl$messageformat$$funcs[21]}});
    $$core1$$default.__addLocaleData({locale:"nb", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"nd", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"ne", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"nl", messageformat:{pluralFunction:intl$messageformat$$funcs[5]}});
    $$core1$$default.__addLocaleData({locale:"nmg", messageformat:{pluralFunction:intl$messageformat$$funcs[0]}});
    $$core1$$default.__addLocaleData({locale:"nn", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"nnh", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"nr", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"nso", messageformat:{pluralFunction:intl$messageformat$$funcs[2]}});
    $$core1$$default.__addLocaleData({locale:"nus", messageformat:{pluralFunction:intl$messageformat$$funcs[0]}});
    $$core1$$default.__addLocaleData({locale:"nyn", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"om", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"or", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"os", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"pa", messageformat:{pluralFunction:intl$messageformat$$funcs[2]}});
    $$core1$$default.__addLocaleData({locale:"pl", messageformat:{pluralFunction:intl$messageformat$$funcs[27]}});
    $$core1$$default.__addLocaleData({locale:"ps", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"pt", messageformat:{pluralFunction:intl$messageformat$$funcs[28]}});
    $$core1$$default.__addLocaleData({locale:"rm", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"rn", messageformat:{pluralFunction:intl$messageformat$$funcs[0]}});
    $$core1$$default.__addLocaleData({locale:"ro", messageformat:{pluralFunction:intl$messageformat$$funcs[29]}});
    $$core1$$default.__addLocaleData({locale:"rof", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"ru", messageformat:{pluralFunction:intl$messageformat$$funcs[30]}});
    $$core1$$default.__addLocaleData({locale:"rw", messageformat:{pluralFunction:intl$messageformat$$funcs[0]}});
    $$core1$$default.__addLocaleData({locale:"rwk", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"sah", messageformat:{pluralFunction:intl$messageformat$$funcs[7]}});
    $$core1$$default.__addLocaleData({locale:"saq", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"sbp", messageformat:{pluralFunction:intl$messageformat$$funcs[0]}});
    $$core1$$default.__addLocaleData({locale:"se", messageformat:{pluralFunction:intl$messageformat$$funcs[21]}});
    $$core1$$default.__addLocaleData({locale:"seh", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"ses", messageformat:{pluralFunction:intl$messageformat$$funcs[7]}});
    $$core1$$default.__addLocaleData({locale:"sg", messageformat:{pluralFunction:intl$messageformat$$funcs[7]}});
    $$core1$$default.__addLocaleData({locale:"shi", messageformat:{pluralFunction:intl$messageformat$$funcs[31]}});
    $$core1$$default.__addLocaleData({locale:"si", messageformat:{pluralFunction:intl$messageformat$$funcs[32]}});
    $$core1$$default.__addLocaleData({locale:"sk", messageformat:{pluralFunction:intl$messageformat$$funcs[10]}});
    $$core1$$default.__addLocaleData({locale:"sl", messageformat:{pluralFunction:intl$messageformat$$funcs[33]}});
    $$core1$$default.__addLocaleData({locale:"sn", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"so", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"sq", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"sr", messageformat:{pluralFunction:intl$messageformat$$funcs[9]}});
    $$core1$$default.__addLocaleData({locale:"ss", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"ssy", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"st", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"sv", messageformat:{pluralFunction:intl$messageformat$$funcs[5]}});
    $$core1$$default.__addLocaleData({locale:"sw", messageformat:{pluralFunction:intl$messageformat$$funcs[5]}});
    $$core1$$default.__addLocaleData({locale:"swc", messageformat:{pluralFunction:intl$messageformat$$funcs[0]}});
    $$core1$$default.__addLocaleData({locale:"ta", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"te", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"teo", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"tg", messageformat:{pluralFunction:intl$messageformat$$funcs[0]}});
    $$core1$$default.__addLocaleData({locale:"th", messageformat:{pluralFunction:intl$messageformat$$funcs[7]}});
    $$core1$$default.__addLocaleData({locale:"ti", messageformat:{pluralFunction:intl$messageformat$$funcs[2]}});
    $$core1$$default.__addLocaleData({locale:"tig", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"tn", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"to", messageformat:{pluralFunction:intl$messageformat$$funcs[7]}});
    $$core1$$default.__addLocaleData({locale:"tr", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"ts", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"twq", messageformat:{pluralFunction:intl$messageformat$$funcs[0]}});
    $$core1$$default.__addLocaleData({locale:"tzm", messageformat:{pluralFunction:intl$messageformat$$funcs[34]}});
    $$core1$$default.__addLocaleData({locale:"ug", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"uk", messageformat:{pluralFunction:intl$messageformat$$funcs[30]}});
    $$core1$$default.__addLocaleData({locale:"ur", messageformat:{pluralFunction:intl$messageformat$$funcs[5]}});
    $$core1$$default.__addLocaleData({locale:"uz", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"vai", messageformat:{pluralFunction:intl$messageformat$$funcs[0]}});
    $$core1$$default.__addLocaleData({locale:"ve", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"vi", messageformat:{pluralFunction:intl$messageformat$$funcs[7]}});
    $$core1$$default.__addLocaleData({locale:"vo", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"vun", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"wae", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"wal", messageformat:{pluralFunction:intl$messageformat$$funcs[0]}});
    $$core1$$default.__addLocaleData({locale:"xh", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"xog", messageformat:{pluralFunction:intl$messageformat$$funcs[1]}});
    $$core1$$default.__addLocaleData({locale:"yav", messageformat:{pluralFunction:intl$messageformat$$funcs[0]}});
    $$core1$$default.__addLocaleData({locale:"yo", messageformat:{pluralFunction:intl$messageformat$$funcs[7]}});
    $$core1$$default.__addLocaleData({locale:"zgh", messageformat:{pluralFunction:intl$messageformat$$funcs[0]}});
    $$core1$$default.__addLocaleData({locale:"zh", messageformat:{pluralFunction:intl$messageformat$$funcs[7]}});
    $$core1$$default.__addLocaleData({locale:"zu", messageformat:{pluralFunction:intl$messageformat$$funcs[3]}});

    function $$diff$$absRound(number) {
        return Math[number < 0 ? 'ceil' : 'floor'](number);
    }

    function $$diff$$daysToYears (days) {
        // 400 years have 146097 days (taking into account leap year rules)
        return days * 400 / 146097;
    }

    var $$diff$$default = function (dfrom, dto) {
        var round = Math.round,
            duration = $$diff$$absRound(dto.getTime() - dfrom.getTime()),
            ms = Math.abs(duration),
            ss = round(ms / 1000),
            mm = round(ss / 60),
            hh = round(mm / 60),
            dd = round(hh / 24),
            ww = round(dd / 7);

        return {
            duration: duration,
            week: ww,
            day: dd,
            hour: hh,
            minute: mm,
            second: ss,
            millisecond: ms,
            year: round((mm + $$diff$$daysToYears(dd) * 12) / 12),
            month: round(mm + $$diff$$daysToYears(dd) * 12),
        };
    };

    var $$core$$default = $$core$$RelativeFormat;

    // default relative time thresholds from moment.js to align with it
    var $$core$$thresholds = {
        second: 45,  // seconds to minute
        minute: 45,  // minutes to hour
        hour: 22,  // hours to day
        day: 26,  // days to month
        month: 11   // months to year
    };

    var $$core$$priority = ['second', 'minute', 'hour', 'day', 'month', 'year'];

    // -- RelativeFormat --------------------------------------------------------

    function $$core$$RelativeFormat(locales, options) {
        $$es5$$defineProperty(this, '_locale',  {value: this._resolveLocale(locales)});
        $$es5$$defineProperty(this, '_options', {value: options || {}});
        $$es5$$defineProperty(this, '_messages', {value: $$es5$$objCreate(null)});

        // Bind `format()` method to `this` so it can be passed by reference like
        // the other `Intl` APIs.
        this.format = $$es5$$fnBind.call(this.format, this);
    }

    // Define internal private properties for dealing with locale data.
    $$es5$$defineProperty($$core$$RelativeFormat, '__availableLocales__', {value: []});
    $$es5$$defineProperty($$core$$RelativeFormat, '__localeData__', {value: $$es5$$objCreate(null)});
    $$es5$$defineProperty($$core$$RelativeFormat, '__addLocaleData', {value: function (data) {
        if (!(data && data.locale)) {
            throw new Error('Object passed does not identify itself with a valid language tag');
        }

        if (!data.relativeTime) {
            throw new Error('Object passed does not contain locale data for IntlRelativeFormat');
        }

        var availableLocales = $$core$$RelativeFormat.__availableLocales__,
            localeData       = $$core$$RelativeFormat.__localeData__;

        // Message format locale data only requires the first part of the tag.
        var locale = data.locale.toLowerCase().split('-')[0];

        availableLocales.push(locale);
        localeData[locale] = data.relativeTime;
    }});

    // Define public `defaultLocale` property which can be set by the developer, or
    // it will be set when the first RelativeFormat instance is created by leveraging
    // the resolved locale from `Intl`.
    $$es5$$defineProperty($$core$$RelativeFormat, 'defaultLocale', {
        enumerable: true,
        writable  : true,
        value     : undefined
    });

    $$es5$$defineProperty($$core$$RelativeFormat, '__getDefaultLocale', {value: function () {
        if (!$$core$$RelativeFormat.defaultLocale) {
            // Leverage the locale-resolving capabilities of `Intl` to determine
            // what the default locale should be.
            $$core$$RelativeFormat.defaultLocale =
                    new Intl.NumberFormat().resolvedOptions().locale;
        }

        return $$core$$RelativeFormat.defaultLocale;
    }});

    $$core$$RelativeFormat.prototype.format = function (date) {
        date = new Date(date);

        // Determine if the `date` is valid.
        if (!(date && date.getTime())) {
            throw new TypeError('A date must be provided.');
        }

        var d = $$diff$$default(new Date(), date),
            key, msg, i, l;

        for (i = 0, l = $$core$$priority.length; i < l; i++) {
            key = $$core$$priority[i];
            if (d[key] < $$core$$thresholds[key]) {
                break;
            }
        }

        msg = this._resolveMessage(key);
        return msg.format({
            0: d[key],
            when: d.duration < 0 ? 'past' : 'future'
        });
    };

    $$core$$RelativeFormat.prototype.resolvedOptions = function () {
        // TODO: Provide anything else?
        return {
            locale: this._locale
        };
    };

    $$core$$RelativeFormat.prototype._resolveMessage = function (key) {
        var messages = this._messages,
            data, i, future = '', past = '';

        if (!messages[key]) {
            // creating a new synthetic message based on the locale data from CLDR
            data = $$core$$RelativeFormat.__localeData__[this._locale];
            for (i in data[key].future) {
                if (data[key].future.hasOwnProperty(i)) {
                    future += ' ' + i + ' {' + data[key].future[i] + '}';
                }
            }
            for (i in data[key].past) {
                if (data[key].past.hasOwnProperty(i)) {
                    past += ' ' + i + ' {' + data[key].past[i] + '}';
                }
            }
            messages[key] = new intl$messageformat$$default(
                '{when, select, future {{0, plural, ' + future + '}} past {{0, plural, ' + past   + '}}}',
                this._locale
            );
        }
        return messages[key];
    };

    $$core$$RelativeFormat.prototype._resolveLocale = function (locales) {
        var availableLocales = $$core$$RelativeFormat.__availableLocales__,
            locale, parts, i, len;

        if (availableLocales.length === 0) {
            throw new Error('No locale data has been provided for IntlRelativeFormat yet');
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

        return locale || $$core$$RelativeFormat.__getDefaultLocale().split('-')[0];
    };
    var src$full$$default = $$core$$default;

    var src$full$$h = ["-# s",
        "+# s",
        "-# min",
        "+# min",
        "-# h",
        "+# h",
        "-# d",
        "+# d",
        "-# m",
        "+# m",
        "-# y",
        "+# y",
        "# sekonde gelede",
        "# sekondes gelede",
        "Oor # sekonde",
        "Oor # sekondes",
        "# minuut gelede",
        "# minute gelede",
        "Oor # minuut",
        "Oor # minute",
        "# uur gelede",
        "Oor # uur",
        "# dag gelede",
        "# dae gelede",
        "Oor # dag",
        "Oor # dae",
        "# maand gelede",
        "# maande gelede",
        "Oor # maand",
        "Oor # maande",
        "# jaar gelede",
        "Oor # jaar",
        "ከ# ሰከንድ በፊት",
        "ከ# ሰከንዶች በፊት",
        "በ# ሰከንድ ውስጥ",
        "በ# ሰከንዶች ውስጥ",
        "ከ# ደቂቃ በፊት",
        "ከ# ደቂቃዎች በፊት",
        "በ# ደቂቃ ውስጥ",
        "በ# ደቂቃዎች ውስጥ",
        "ከ# ሰዓት በፊት",
        "ከ# ሰዓቶች በፊት",
        "በ# ሰዓት ውስጥ",
        "በ# ሰዓቶች ውስጥ",
        "ከ# ቀን በፊት",
        "ከ# ቀናት በፊት",
        "በ# ቀን ውስጥ",
        "በ# ቀናት ውስጥ",
        "ከ# ወር በፊት",
        "ከ# ወራት በፊት",
        "በ# ወር ውስጥ",
        "በ# ወራት ውስጥ",
        "ከ# ዓመት በፊት",
        "ከ# ዓመታት በፊት",
        "በ# ዓመታት ውስጥ",
        "قبل # من الثواني",
        "قبل ثانيتين",
        "قبل # ثوانِ",
        "قبل # ثانية",
        "خلال # من الثواني",
        "خلال ثانيتين",
        "خلال # ثوانِ",
        "خلال # ثانية",
        "قبل # من الدقائق",
        "قبل دقيقتين",
        "قبل # دقائق",
        "قبل # دقيقة",
        "خلال # من الدقائق",
        "خلال دقيقتين",
        "خلال # دقائق",
        "خلال # دقيقة",
        "قبل # من الساعات",
        "قبل ساعتين",
        "قبل # ساعات",
        "قبل # ساعة",
        "خلال # من الساعات",
        "خلال ساعتين",
        "خلال # ساعات",
        "خلال # ساعة",
        "قبل # من الأيام",
        "قبل يومين",
        "قبل # أيام",
        "قبل # يومًا",
        "خلال # من الأيام",
        "خلال يومين",
        "خلال # أيام",
        "خلال # يومًا",
        "قبل # من الشهور",
        "قبل شهرين",
        "قبل # أشهر",
        "قبل # شهرًا",
        "خلال # من الشهور",
        "خلال شهرين",
        "خلال # شهور",
        "خلال # شهرًا",
        "قبل # من السنوات",
        "قبل سنتين",
        "قبل # سنوات",
        "قبل # سنة",
        "خلال # من السنوات",
        "خلال سنتين",
        "خلال # سنوات",
        "خلال # سنة",
        "Hai # segundu",
        "Hai # segundos",
        "En # segundu",
        "En # segundos",
        "Hai # minutu",
        "Hai # minutos",
        "En # minutu",
        "En # minutos",
        "Hai # hora",
        "Hai # hores",
        "En # hora",
        "En # hores",
        "Hai # dia",
        "Hai # díes",
        "En # dia",
        "En # díes",
        "Hai # mes",
        "Hai # meses",
        "En # mes",
        "En # meses",
        "Hai # añu",
        "Hai # años",
        "En # añu",
        "En # años",
        "# saniyə öncə",
        "# saniyə ərzində",
        "# dəqiqə öncə",
        "# dəqiqə ərzində",
        "# saat öncə",
        "# saat ərzində",
        "# gün öncə",
        "# gün ərində",
        "# ay öncə",
        "# ay ərzində",
        "# il öncə",
        "# il ərzində",
        "преди # секунда",
        "преди # секунди",
        "след # секунда",
        "след # секунди",
        "преди # минута",
        "преди # минути",
        "след # минута",
        "след # минути",
        "преди # час",
        "преди # часа",
        "след # час",
        "след # часа",
        "преди # ден",
        "преди # дни",
        "след # дни",
        "преди # месец",
        "преди # месеца",
        "след # месец",
        "след # месеца",
        "преди # година",
        "преди # години",
        "след # година",
        "след # години",
        "# সেকেন্ড পূর্বে",
        "# সেকেন্ডে",
        "# মিনিট পূর্বে",
        "# মিনিটে",
        "# ঘন্টা আগে",
        "# ঘন্টায়",
        "# দিন পূর্বে",
        "# দিনের মধ্যে",
        "# মাস পূর্বে",
        "# মাসে",
        "# বছর পূর্বে",
        "# বছরে",
        "Fa # segon",
        "Fa # segons",
        "D'aquí a # segon",
        "D'aquí a # segons",
        "Fa # minut",
        "Fa # minuts",
        "D'aquí a # minut",
        "D'aquí a # minuts",
        "Fa # hora",
        "Fa # hores",
        "D'aquí a # hora",
        "D'aquí a # hores",
        "Fa # dia",
        "Fa # dies",
        "D'aquí a # dia",
        "D'aquí a # dies",
        "Fa # mes",
        "Fa # mesos",
        "D'aquí a # mes",
        "D'aquí a # mesos",
        "Fa # any",
        "Fa # anys",
        "D'aquí a # any",
        "D'aquí a # anys",
        "před # sekundou",
        "před # sekundami",
        "za # sekundu",
        "za # sekundy",
        "za # sekund",
        "před # minutou",
        "před # minutami",
        "za # minutu",
        "za # minuty",
        "za # minut",
        "před # hodinou",
        "před # hodinami",
        "za # hodinu",
        "za # hodiny",
        "za # hodin",
        "před # dnem",
        "před # dny",
        "za # den",
        "za # dny",
        "za # dne",
        "za # dní",
        "před # měsícem",
        "před # měsíci",
        "za # měsíc",
        "za # měsíce",
        "za # měsíců",
        "před # rokem",
        "před # lety",
        "za # rok",
        "za # roky",
        "za # roku",
        "za # let",
        "# eiliad yn ôl",
        "eiliad yn ôl",
        "Ymhen # eiliad",
        "Ymhen eiliad",
        "# munud yn ôl",
        "# funud yn ôl",
        "Ymhen # munud",
        "Ymhen munud",
        "Ymhen # funud",
        "# awr yn ôl",
        "awr yn ôl",
        "Ymhen # awr",
        "# diwrnod yn ôl",
        "# ddiwrnod yn ôl",
        "Ymhen # diwrnod",
        "Ymhen diwrnod",
        "Ymhen deuddydd",
        "Ymhen tridiau",
        "# mis yn ôl",
        "# fis yn ôl",
        "Ymhen # mis",
        "Ymhen mis",
        "Ymhen deufis",
        "# o flynyddoedd yn ôl",
        "blwyddyn yn ôl",
        "# flynedd yn ôl",
        "# blynedd yn ôl",
        "Ymhen # mlynedd",
        "Ymhen blwyddyn",
        "Ymhen # flynedd",
        "Ymhen # blynedd",
        "for # sekund siden",
        "for # sekunder siden",
        "om # sekund",
        "om # sekunder",
        "for # minut siden",
        "for # minutter siden",
        "om # minut",
        "om # minutter",
        "for # time siden",
        "for # timer siden",
        "om # time",
        "om # timer",
        "for # døgn siden",
        "om # døgn",
        "for # måned siden",
        "for # måneder siden",
        "om # måned",
        "om # måneder",
        "for # år siden",
        "om # år",
        "Vor # Sekunde",
        "Vor # Sekunden",
        "In # Sekunde",
        "In # Sekunden",
        "Vor # Minute",
        "Vor # Minuten",
        "In # Minute",
        "In # Minuten",
        "Vor # Stunde",
        "Vor # Stunden",
        "In # Stunde",
        "In # Stunden",
        "Vor # Tag",
        "Vor # Tagen",
        "In # Tag",
        "In # Tagen",
        "Vor # Monat",
        "Vor # Monaten",
        "In # Monat",
        "In # Monaten",
        "Vor # Jahr",
        "Vor # Jahren",
        "In # Jahr",
        "In # Jahren",
        "སྐར་ཆ་ # ཧེ་མ་",
        "སྐར་ཆ་ # ནང་",
        "སྐར་མ་ # ཧེ་མ་",
        "སྐར་མ་ # ནང་",
        "ཆུ་ཚོད་ # ཧེ་མ་",
        "ཆུ་ཚོད་ # ནང་",
        "ཉིནམ་ # ཧེ་མ་",
        "ཉིནམ་ # ནང་",
        "ཟླཝ་ # ཧེ་མ་",
        "ཟླཝ་ # ནང་",
        "ལོ་འཁོར་ # ཧེ་མ་",
        "ལོ་འཁོར་ # ནང་",
        "sekend # si va yi",
        "sekend # si wo va yi",
        "le sekend # me",
        "le sekend # wo me",
        "aɖabaƒoƒo # si va yi",
        "aɖabaƒoƒo # si wo va yi",
        "le aɖabaƒoƒo # me",
        "le aɖabaƒoƒo # wo me",
        "gaƒoƒo # si va yi",
        "gaƒoƒo # si wo va yi",
        "le gaƒoƒo # me",
        "le gaƒoƒo # wo me",
        "ŋkeke # si va yi",
        "ŋkeke # si wo va yi",
        "le ŋkeke # me",
        "le ŋkeke # wo me",
        "ɣleti # si va yi",
        "ɣleti # si wo va yi",
        "le ɣleti # me",
        "le ɣleti # wo me",
        "ƒe # si va yi",
        "ƒe # si wo va yi",
        "le ƒe # me",
        "le ƒe # wo me",
        "Πριν από # δευτερόλεπτο",
        "Πριν από # δευτερόλεπτα",
        "Σε # δευτερόλεπτο",
        "Σε # δευτερόλεπτα",
        "Πριν από # λεπτό",
        "Πριν από # λεπτά",
        "Σε # λεπτό",
        "Σε # λεπτά",
        "Πριν από # ώρα",
        "Πριν από # ώρες",
        "Σε # ώρα",
        "Σε # ώρες",
        "Πριν από # ημέρα",
        "Πριν από # ημέρες",
        "Σε # ημέρα",
        "Σε # ημέρες",
        "Πριν από # μήνα",
        "Πριν από # μήνες",
        "Σε # μήνα",
        "Σε # μήνες",
        "Πριν από # έτος",
        "Πριν από # έτη",
        "Σε # έτος",
        "Σε # έτη",
        "# second ago",
        "# seconds ago",
        "in # second",
        "in # seconds",
        "# minute ago",
        "# minutes ago",
        "in # minute",
        "in # minutes",
        "# hour ago",
        "# hours ago",
        "in # hour",
        "in # hours",
        "# day ago",
        "# days ago",
        "in # day",
        "in # days",
        "# month ago",
        "# months ago",
        "in # month",
        "in # months",
        "# year ago",
        "# years ago",
        "in # year",
        "in # years",
        "hace # segundo",
        "hace # segundos",
        "dentro de # segundo",
        "dentro de # segundos",
        "hace # minuto",
        "hace # minutos",
        "dentro de # minuto",
        "dentro de # minutos",
        "hace # hora",
        "hace # horas",
        "dentro de # hora",
        "dentro de # horas",
        "hace # día",
        "hace # días",
        "dentro de # día",
        "dentro de # días",
        "hace # mes",
        "hace # meses",
        "dentro de # mes",
        "dentro de # meses",
        "hace # año",
        "hace # años",
        "dentro de # año",
        "dentro de # años",
        "# sekundi eest",
        "# sekundi pärast",
        "# minuti eest",
        "# minuti pärast",
        "# tunni eest",
        "# tunni pärast",
        "# päeva eest",
        "# päeva pärast",
        "# kuu eest",
        "# kuu pärast",
        "# aasta eest",
        "# aasta pärast",
        "Duela # segundo",
        "# segundo barru",
        "Duela # minutu",
        "# minutu barru",
        "Duela # ordu",
        "# ordu barru",
        "Duela # egun",
        "# egun barru",
        "Duela # hilabete",
        "# hilabete barru",
        "Duela # urte",
        "# urte barru",
        "# ثانیه پیش",
        "# ثانیه بعد",
        "# دقیقه پیش",
        "# دقیقه بعد",
        "# ساعت پیش",
        "# ساعت بعد",
        "# روز پیش",
        "# روز بعد",
        "# ماه پیش",
        "# ماه بعد",
        "# سال پیش",
        "# سال بعد",
        "# sekunti sitten",
        "# sekuntia sitten",
        "# sekunnin päästä",
        "# minuutti sitten",
        "# minuuttia sitten",
        "# minuutin päästä",
        "# tunti sitten",
        "# tuntia sitten",
        "# tunnin päästä",
        "# päivä sitten",
        "# päivää sitten",
        "# päivän päästä",
        "# kuukausi sitten",
        "# kuukautta sitten",
        "# kuukauden päästä",
        "# vuosi sitten",
        "# vuotta sitten",
        "# vuoden päästä",
        "# segundo ang nakalipas",
        "Sa loob ng # segundo",
        "# minuto ang nakalipas",
        "Sa loob ng # minuto",
        "# oras ang nakalipas",
        "Sa loob ng # oras",
        "# araw ang nakalipas",
        "Sa loob ng # araw",
        "# buwan ang nakalipas",
        "Sa loob ng # buwan",
        "# taon ang nakalipas",
        "Sa loob ng # taon",
        "il y a # seconde",
        "il y a # secondes",
        "dans # seconde",
        "dans # secondes",
        "il y a # minute",
        "il y a # minutes",
        "dans # minute",
        "dans # minutes",
        "il y a # heure",
        "il y a # heures",
        "dans # heure",
        "dans # heures",
        "il y a # jour",
        "il y a # jours",
        "dans # jour",
        "dans # jours",
        "il y a # mois",
        "dans # mois",
        "il y a # an",
        "il y a # ans",
        "dans # an",
        "dans # ans",
        "# secont indaûr",
        "# seconts indaûr",
        "ca di # secont",
        "ca di # seconts",
        "# minût indaûr",
        "# minûts indaûr",
        "ca di # minût",
        "ca di # minûts",
        "# ore indaûr",
        "# oris indaûr",
        "ca di # ore",
        "ca di # oris",
        "# zornade indaûr",
        "# zornadis indaûr",
        "ca di # zornade",
        "ca di # zornadis",
        "# mês indaûr",
        "ca di # mês",
        "# an indaûr",
        "# agns indaûr",
        "ca di # an",
        "ca di # agns",
        "# sekonde lyn",
        "# sekonden lyn",
        "Oer # sekonde",
        "Oer # sekonden",
        "# minút lyn",
        "# minuten lyn",
        "Oer # minút",
        "Oer # minuten",
        "# oere lyn",
        "Oer # oere",
        "# dei lyn",
        "# deien lyn",
        "Oer # dei",
        "Oer # deien",
        "# moanne lyn",
        "# moannen lyn",
        "Oer # moanne",
        "Oer # moannen",
        "# jier lyn",
        "Oer # jier",
        "Hai # segundo",
        "En # segundo",
        "Hai # minuto",
        "En # minuto",
        "Hai # horas",
        "En # horas",
        "Hai # día",
        "Hai # días",
        "En # día",
        "En # días",
        "Hai # ano",
        "Hai # anos",
        "En # ano",
        "En # anos",
        "# સેકંડ પહેલા",
        "# સેકંડમાં",
        "# મિનિટ પહેલા",
        "# મિનિટમાં",
        "# કલાક પહેલા",
        "# કલાકમાં",
        "# દિવસ પહેલા",
        "# દિવસમાં",
        "# મહિના પહેલા",
        "# મહિનામાં",
        "# વર્ષ પહેલા",
        "# વર્ષમાં",
        "לפני שנייה #",
        "לפני # שניות",
        "בעוד שנייה #",
        "בעוד # שניות",
        "לפני דקה #",
        "לפני # דקות",
        "בעוד דקה #",
        "בעוד # דקות",
        "לפני שעה #",
        "לפני # שעות",
        "בעוד שעה #",
        "בעוד # שעות",
        "לפני יום #",
        "לפני # ימים",
        "בעוד יום #",
        "בעוד # ימים",
        "לפני חודש #",
        "לפני # חודשים",
        "בעוד חודש #",
        "בעוד # חודשים",
        "לפני שנה #",
        "לפני # שנים",
        "בעוד שנה #",
        "בעוד # שנים",
        "# सेकंड पहले",
        "# सेकंड में",
        "# मिनट पहले",
        "# मिनट में",
        "# घंटे पहले",
        "# घंटे में",
        "# दिन पहले",
        "# दिन में",
        "# माह पहले",
        "# माह में",
        "# वर्ष पहले",
        "# वर्ष में",
        "prije # sekundu",
        "prije # sekunde",
        "prije # sekundi",
        "za # sekunde",
        "za # sekundi",
        "prije # minutu",
        "prije # minute",
        "prije # minuta",
        "za # minute",
        "za # minuta",
        "prije # sat",
        "prije # sata",
        "prije # sati",
        "za # sat",
        "za # sata",
        "za # sati",
        "prije # dan",
        "prije # dana",
        "za # dan",
        "za # dana",
        "prije # mjesec",
        "prije # mjeseca",
        "prije # mjeseci",
        "za # mjesec",
        "za # mjeseca",
        "za # mjeseci",
        "prije # godinu",
        "prije # godine",
        "prije # godina",
        "za # godinu",
        "za # godine",
        "za # godina",
        "# másodperccel ezelőtt",
        "# másodperc múlva",
        "# perccel ezelőtt",
        "# perc múlva",
        "# órával ezelőtt",
        "# óra múlva",
        "# nappal ezelőtt",
        "# nap múlva",
        "# hónappal ezelőtt",
        "# hónap múlva",
        "# évvel ezelőtt",
        "# év múlva",
        "# վայրկյան առաջ",
        "# վայրկյան անց",
        "# րոպե առաջ",
        "# րոպե անց",
        "# ժամ առաջ",
        "# ժամ անց",
        "# օր առաջ",
        "# օր անց",
        "# ամիս առաջ",
        "# ամիս անց",
        "# տարի առաջ",
        "# տարի անց",
        "# detik yang lalu",
        "Dalam # detik",
        "# menit yang lalu",
        "Dalam # menit",
        "# jam yang lalu",
        "Dalam # jam",
        "# hari yang lalu",
        "Dalam # hari",
        "# bulan yang lalu",
        "Dalam # bulan",
        "# tahun yang lalu",
        "Dalam # tahun",
        "fyrir # sekúndu",
        "fyrir # sekúndum",
        "eftir # sekúndu",
        "eftir # sekúndur",
        "fyrir # mínútu",
        "fyrir # mínútum",
        "eftir # mínútu",
        "eftir # mínútur",
        "fyrir # klukkustund",
        "fyrir # klukkustundum",
        "eftir # klukkustund",
        "eftir # klukkustundir",
        "fyrir # degi",
        "fyrir # dögum",
        "eftir # dag",
        "eftir # daga",
        "fyrir # mánuði",
        "fyrir # mánuðum",
        "eftir # mánuð",
        "eftir # mánuði",
        "fyrir # ári",
        "fyrir # árum",
        "eftir # ár",
        "# secondo fa",
        "# secondi fa",
        "tra # secondo",
        "tra # secondi",
        "# minuto fa",
        "# minuti fa",
        "tra # minuto",
        "tra # minuti",
        "# ora fa",
        "# ore fa",
        "tra # ora",
        "tra # ore",
        "# giorno fa",
        "# giorni fa",
        "tra # giorno",
        "tra # giorni",
        "# mese fa",
        "# mesi fa",
        "tra # mese",
        "tra # mesi",
        "# anno fa",
        "# anni fa",
        "tra # anno",
        "tra # anni",
        "# 秒前",
        "# 秒後",
        "# 分前",
        "# 分後",
        "# 時間前",
        "# 時間後",
        "# 日前",
        "# 日後",
        "# か月前",
        "# か月後",
        "# 年前",
        "# 年後",
        "ɛ́ gɛ́ mɔ́ minút #",
        "nǔu # minút",
        "ɛ́ gɛ mɔ́ # háwa",
        "nǔu háwa #",
        "Ɛ́ gɛ́ mɔ́ lɛ́Ꞌ #",
        "Nǔu lɛ́Ꞌ #",
        "ɛ́ gɛ́ mɔ́ pɛsaŋ #",
        "Nǔu # saŋ",
        "Ɛ́gɛ́ mɔ́ ŋguꞋ #",
        "Nǔu ŋguꞋ #",
        "# წამის წინ",
        "# წამში",
        "# წუთის წინ",
        "# წუთში",
        "# საათის წინ",
        "# საათში",
        "# დღის წინ",
        "# დღეში",
        "# თვის წინ",
        "# თვეში",
        "# წლის წინ",
        "# წელიწადში",
        "a ten # sigundu",
        "di li # sigundu",
        "a ten # minutu",
        "di li # minutu",
        "a ten # ora",
        "di li # ora",
        "a ten # dia",
        "di li # dia",
        "a ten # mes",
        "di li # mes",
        "a ten # anu",
        "di li # anu",
        "# секунд бұрын",
        "# секундтан кейін",
        "# минут бұрын",
        "# минуттан кейін",
        "# сағат бұрын",
        "# сағаттан кейін",
        "# күн бұрын",
        "# күннен кейін",
        "# ай бұрын",
        "# айдан кейін",
        "# жыл бұрын",
        "# жылдан кейін",
        "for # sekundi siden",
        "om # sekundi",
        "for # minutsi siden",
        "om # minutsi",
        "for # nalunaaquttap-akunnera siden",
        "om # nalunaaquttap-akunnera",
        "for # ulloq unnuarlu siden",
        "om # ulloq unnuarlu",
        "for # qaammat siden",
        "om # qaammat",
        "for # ukioq siden",
        "om # ukioq",
        "# វិនាទី​មុន",
        "ក្នុង​រយៈពេល # វិនាទី",
        "# នាទី​មុន",
        "ក្នុង​រយៈពេល # នាទី",
        "# ម៉ោង​មុន",
        "ក្នុង​រយៈ​ពេល # ម៉ោង",
        "# ថ្ងៃ​មុន",
        "ក្នុង​រយៈ​ពេល # ថ្ងៃ",
        "# ខែមុន",
        "ក្នុង​រយៈ​ពេល # ខែ",
        "# ឆ្នាំ​មុន",
        "ក្នុង​រយៈ​ពេល # ឆ្នាំ",
        "# ಸೆಕೆಂಡುಗಳ ಹಿಂದೆ",
        "# ಸೆಕೆಂಡ್‌ಗಳಲ್ಲಿ",
        "# ನಿಮಿಷಗಳ ಹಿಂದೆ",
        "# ನಿಮಿಷಗಳಲ್ಲಿ",
        "# ಗಂಟೆಗಳ ಹಿಂದೆ",
        "# ಗಂಟೆಗಳಲ್ಲಿ",
        "# ದಿನಗಳ ಹಿಂದೆ",
        "# ದಿನಗಳಲ್ಲಿ",
        "# ತಿಂಗಳುಗಳ ಹಿಂದೆ",
        "# ತಿಂಗಳುಗಳಲ್ಲಿ",
        "# ವರ್ಷಗಳ ಹಿಂದೆ",
        "# ವರ್ಷಗಳಲ್ಲಿ",
        "#초 전",
        "#초 후",
        "#분 전",
        "#분 후",
        "#시간 전",
        "#시간 후",
        "#일 전",
        "#일 후",
        "#개월 전",
        "#개월 후",
        "#년 전",
        "#년 후",
        "# секунд мурун",
        "# секунддан кийин",
        "# мүнөт мурун",
        "# мүнөттөн кийин",
        "# саат мурун",
        "# сааттан кийин",
        "# күн мурун",
        "# күндөн кийин",
        "# ай мурун",
        "# айдан кийин",
        "# жыл мурун",
        "# жылдан кийин",
        "Hékta okpí # k’uŋ héhaŋ",
        "Letáŋhaŋ okpí # kiŋháŋ",
        "Hékta owápȟe # kʼuŋ héhaŋ",
        "Letáŋhaŋ owápȟe # kiŋháŋ",
        "Hékta #-čháŋ k’uŋ héhaŋ",
        "Letáŋhaŋ #-čháŋ kiŋháŋ",
        "Hékta wíyawapi # kʼuŋ héhaŋ",
        "Letáŋhaŋ wíyawapi # kiŋháŋ",
        "Hékta ómakȟa # kʼuŋ héhaŋ",
        "Letáŋhaŋ ómakȟa # kiŋháŋ",
        "# ວິນາທີກ່ອນ",
        "ໃນອີກ # ວິນາທີ",
        "# ນາທີກ່ອນ",
        "# ໃນອີກ 0 ນາທີ",
        "# ຊົ່ວໂມງກ່ອນ",
        "ໃນອີກ # ຊົ່ວໂມງ",
        "# ມື້ກ່ອນ",
        "ໃນອີກ # ມື້",
        "# ເດືອນກ່ອນ",
        "ໃນອີກ # ເດືອນ",
        "# ປີກ່ອນ",
        "ໃນອີກ # ປີ",
        "prieš # sekundę",
        "prieš # sekundes",
        "prieš # sekundės",
        "prieš # sekundžių",
        "po # sekundės",
        "po # sekundžių",
        "prieš # minutę",
        "prieš # minutes",
        "prieš # minutės",
        "prieš # minučių",
        "po # minutės",
        "po # minučių",
        "prieš # valandą",
        "prieš # valandas",
        "prieš # valandos",
        "prieš # valandų",
        "po # valandos",
        "po # valandų",
        "prieš # dieną",
        "prieš # dienas",
        "prieš # dienos",
        "prieš # dienų",
        "po # dienos",
        "po # dienų",
        "prieš # mėnesį",
        "prieš # mėnesius",
        "prieš # mėnesio",
        "prieš # mėnesių",
        "po # mėnesio",
        "po # mėnesių",
        "prieš # metus",
        "prieš # metų",
        "po # metų",
        "Pirms # sekundēm",
        "Pirms # sekundes",
        "Pēc # sekundēm",
        "Pēc # sekundes",
        "Pirms # minūtēm",
        "Pirms # minūtes",
        "Pēc # minūtēm",
        "Pēc # minūtes",
        "Pirms # stundām",
        "Pirms # stundas",
        "Pēc # stundām",
        "Pēc # stundas",
        "Pirms # dienām",
        "Pirms # dienas",
        "Pēc # dienām",
        "Pēc # dienas",
        "Pirms # mēnešiem",
        "Pirms # mēneša",
        "Pēc # mēnešiem",
        "Pēc # mēneša",
        "Pirms # gadiem",
        "Pirms # gada",
        "Pēc # gadiem",
        "Pēc # gada",
        "Пред # секунда",
        "Пред # секунди",
        "За # секунда",
        "За # секунди",
        "Пред # минута",
        "Пред # минути",
        "За # минута",
        "За # минути",
        "Пред # час",
        "Пред # часа",
        "За # час",
        "За # часа",
        "Пред # ден",
        "Пред # дена",
        "За # ден",
        "За # дена",
        "Пред # месец",
        "Пред # месеци",
        "За # месец",
        "За # месеци",
        "Пред # година",
        "Пред # години",
        "За # година",
        "За # години",
        "# സെക്കൻറ് മുമ്പ്",
        "# സെക്കൻഡിൽ",
        "# മിനിറ്റ് മുമ്പ്",
        "# മിനിറ്റിൽ",
        "# മിനിറ്റിനുള്ളിൽ",
        "# മണിക്കൂർ മുമ്പ്",
        "# മണിക്കൂറിൽ",
        "# ദിവസം മുമ്പ്",
        "# ദിവസത്തിൽ",
        "# മാസം മുമ്പ്",
        "# മാസത്തിൽ",
        "# വർഷം മുമ്പ്",
        "# വർഷത്തിൽ",
        "# секундын өмнө",
        "# секундын дараа",
        "# минутын өмнө",
        "# минутын дараа",
        "# цагийн өмнө",
        "# цагийн дараа",
        "# өдрийн өмнө",
        "# өдрийн дараа",
        "# сарын өмнө",
        "# сарын дараа",
        "# жилийн өмнө",
        "# жилийн дараа",
        "# सेकंदापूर्वी",
        "# सेकंदांपूर्वी",
        "# सेकंदामध्ये",
        "# सेकंदांमध्ये",
        "# मिनिटापूर्वी",
        "# मिनिटांपूर्वी",
        "# मिनिटामध्ये",
        "# मिनिटांमध्ये",
        "# तासापूर्वी",
        "# तासांपूर्वी",
        "# तासामध्ये",
        "# तासांमध्ये",
        "# दिवसापूर्वी",
        "# दिवसांपूर्वी",
        "# दिवसामध्ये",
        "# दिवसांमध्ये",
        "# महिन्यापूर्वी",
        "# महिन्यांपूर्वी",
        "# महिन्यामध्ये",
        "# महिन्यांमध्ये",
        "# वर्षापूर्वी",
        "# वर्षांपूर्वी",
        "# वर्षामध्ये",
        "# वर्षांमध्ये",
        "# saat lalu",
        "Dalam # saat",
        "# minit lalu",
        "Dalam # minit",
        "# jam lalu",
        "# hari lalu",
        "# bulan lalu",
        "# tahun lalu",
        "# sena ilu",
        "# snin ilu",
        "လွန်ခဲ့သော#စက္ကန့်",
        "#စက္ကန့်အတွင်း",
        "လွန်ခဲ့သော#မိနစ်",
        "#မိနစ်အတွင်း",
        "လွန်ခဲ့သော#နာရီ",
        "#နာရီအတွင်း",
        "လွန်ခဲ့သော#ရက်",
        "#ရက်အတွင်း",
        "လွန်ခဲ့သော#လ",
        "#လအတွင်း",
        "လွန်ခဲ့သော#နှစ်",
        "#နှစ်အတွင်း",
        "for # minutt siden",
        "om # minutt",
        "# सेकेण्ड पहिले",
        "# सेकेण्डमा",
        "# मिनेट पहिले",
        "# मिनेटमा",
        "# घण्टा पहिले",
        "# घण्टामा",
        "# दिन पहिले",
        "# दिनमा",
        "# महिना पहिले",
        "# महिनामा",
        "# वर्ष अघि",
        "# वर्षमा",
        "# seconde geleden",
        "# seconden geleden",
        "Over # seconde",
        "Over # seconden",
        "# minuut geleden",
        "# minuten geleden",
        "Over # minuut",
        "Over # minuten",
        "# uur geleden",
        "Over # uur",
        "# dag geleden",
        "# dagen geleden",
        "Over # dag",
        "Over # dagen",
        "# maand geleden",
        "# maanden geleden",
        "Over # maand",
        "Over # maanden",
        "# jaar geleden",
        "Over # jaar",
        "# сахаты размӕ",
        "# сахаты фӕстӕ",
        "# бон раздӕр",
        "# боны размӕ",
        "# боны фӕстӕ",
        "# ਸਕਿੰਟ ਪਹਿਲਾਂ",
        "# ਸਕਿੰਟ ਵਿਚ",
        "# ਮਿੰਟ ਪਹਿਲਾਂ",
        "# ਮਿੰਟ ਵਿਚ",
        "# ਘੰਟਾ ਪਹਿਲਾਂ",
        "# ਘੰਟੇ ਪਹਿਲਾਂ",
        "# ਘੰਟੇ ਵਿਚ",
        "# ਦਿਨ ਪਹਿਲਾਂ",
        "# ਦਿਨ ਵਿਚ",
        "# ਦਿਨਾਂ ਵਿਚ",
        "# ਮਹੀਨੇ ਪਹਿਲਾਂ",
        "# ਮਹੀਨੇ ਵਿਚ",
        "# ਸਾਲ ਪਹਿਲਾਂ",
        "# ਸਾਲ ਵਿਚ",
        "# sekundę temu",
        "# sekundy temu",
        "# sekund temu",
        "Za # sekundę",
        "Za # sekundy",
        "Za # sekund",
        "# minutę temu",
        "# minuty temu",
        "# minut temu",
        "Za # minutę",
        "Za # minuty",
        "Za # minut",
        "# godzinę temu",
        "# godziny temu",
        "# godzin temu",
        "Za # godzinę",
        "Za # godziny",
        "Za # godzin",
        "# dzień temu",
        "# dni temu",
        "# dnia temu",
        "Za # dzień",
        "Za # dni",
        "Za # dnia",
        "# miesiąc temu",
        "# miesiące temu",
        "# miesięcy temu",
        "# miesiąca temu",
        "Za # miesiąc",
        "Za # miesiące",
        "Za # miesięcy",
        "Za # miesiąca",
        "# rok temu",
        "# lata temu",
        "# lat temu",
        "# roku temu",
        "Za # rok",
        "Za # lata",
        "Za # lat",
        "Za # roku",
        "Há # segundo",
        "Há # segundos",
        "Dentro de # segundo",
        "Dentro de # segundos",
        "Há # minuto",
        "Há # minutos",
        "Dentro de # minuto",
        "Dentro de # minutos",
        "Há # hora",
        "Há # horas",
        "Dentro de # hora",
        "Dentro de # horas",
        "Há # dia",
        "Há # dias",
        "Dentro de # dia",
        "Dentro de # dias",
        "Há # mês",
        "Há # meses",
        "Dentro de # mês",
        "Dentro de # meses",
        "Há # ano",
        "Há # anos",
        "Dentro de # ano",
        "Dentro de # anos",
        "Acum # secundă",
        "Acum # secunde",
        "Acum # de secunde",
        "Peste # secundă",
        "Peste # secunde",
        "Peste # de secunde",
        "Acum # minut",
        "Acum # minute",
        "Acum # de minute",
        "Peste # minut",
        "Peste # minute",
        "Peste # de minute",
        "Acum # oră",
        "Acum # ore",
        "Acum # de ore",
        "Peste # oră",
        "Peste # ore",
        "Peste # de ore",
        "Acum # zi",
        "Acum # zile",
        "Acum # de zile",
        "Peste # zi",
        "Peste # zile",
        "Peste # de zile",
        "Acum # lună",
        "Acum # luni",
        "Acum # de luni",
        "Peste # lună",
        "Peste # luni",
        "Peste # de luni",
        "Acum # an",
        "Acum # ani",
        "Acum # de ani",
        "Peste # an",
        "Peste # ani",
        "Peste # de ani",
        "# секунду назад",
        "# секунды назад",
        "# секунд назад",
        "Через # секунду",
        "Через # секунды",
        "Через # секунд",
        "# минуту назад",
        "# минуты назад",
        "# минут назад",
        "Через # минуту",
        "Через # минуты",
        "Через # минут",
        "# час назад",
        "# часа назад",
        "# часов назад",
        "Через # час",
        "Через # часа",
        "Через # часов",
        "# день назад",
        "# дня назад",
        "# дней назад",
        "Через # день",
        "Через # дня",
        "Через # дней",
        "# месяц назад",
        "# месяца назад",
        "# месяцев назад",
        "Через # месяц",
        "Через # месяца",
        "Через # месяцев",
        "# год назад",
        "# года назад",
        "# лет назад",
        "Через # год",
        "Через # года",
        "Через # лет",
        "# сөкүүндэ ынараа өттүгэр",
        "# сөкүүндэннэн",
        "# мүнүүтэ ынараа өттүгэр",
        "# мүнүүтэннэн",
        "# чаас ынараа өттүгэр",
        "# чааһынан",
        "# күн ынараа өттүгэр",
        "# күнүнэн",
        "# ый ынараа өттүгэр",
        "# ыйынан",
        "# сыл ынараа өттүгэр",
        "# сылынан",
        "# sekunda árat",
        "# sekundda árat",
        "# sekunda maŋŋilit",
        "# sekundda maŋŋilit",
        "# minuhta árat",
        "# minuhtta árat",
        "# minuhta maŋŋilit",
        "# minuhtta maŋŋilit",
        "# diibmu árat",
        "# diibmur árat",
        "# diibmu maŋŋilit",
        "# diibmur maŋŋilit",
        "# jándor árat",
        "# jándora árat",
        "# jándor maŋŋilit",
        "# jándor amaŋŋilit",
        "# jándora maŋŋilit",
        "# mánotbadji árat",
        "# mánotbadji maŋŋilit",
        "# jahki árat",
        "# jahkki árat",
        "# jahki maŋŋilit",
        "# jahkki maŋŋilit",
        "තත්පර #කට පෙර",
        "තත්පර # කින්",
        "මිනිත්තු #ට පෙර",
        "මිනිත්තු # කින්",
        "පැය #ට පෙර",
        "පැය # කින්",
        "දින # ට පෙර",
        "දින #න්",
        "මාස #කට පෙර",
        "මාස #කින්",
        "වසර #ට පෙර",
        "වසර # කින්",
        "Pred # sekundou",
        "Pred # sekundami",
        "O # sekundu",
        "O # sekundy",
        "O # sekúnd",
        "Pred # minútou",
        "Pred # minútami",
        "O # minútu",
        "O # minúty",
        "O # minút",
        "Pred # hodinou",
        "Pred # hodinami",
        "O # hodinu",
        "O # hodiny",
        "O # hodín",
        "Pred # dňom",
        "Pred # dňami",
        "O # deň",
        "O # dni",
        "O # dňa",
        "O # dní",
        "Pred # mesiacom",
        "Pred # mesiacmi",
        "O # mesiac",
        "O # mesiace",
        "O # mesiaca",
        "O # mesiacov",
        "Pred # rokom",
        "Pred # rokmi",
        "O # rok",
        "O # roky",
        "O # roka",
        "O # rokov",
        "Pred # sekundo",
        "Pred # sekundama",
        "Čez # sekundo",
        "Čez # sekundi",
        "Čez # sekunde",
        "Pred # min.",
        "Čez # min.",
        "Pred # h",
        "Čez # h",
        "Pred # dnevom",
        "Pred # dnevoma",
        "Pred # dnevi",
        "Čez # dan",
        "Čez # dni",
        "Pred # mesecem",
        "Pred # meseci",
        "Čez # mesec",
        "Čez # meseca",
        "Čez # mesece",
        "Čez # mesecev",
        "Pred # letom",
        "Pred # leti",
        "Čez # leto",
        "Čez # leti",
        "Čez # leta",
        "Čez # let",
        "para # sekonde",
        "para # sekondash",
        "pas # sekonde",
        "pas # sekondash",
        "para # minute",
        "para # minutash",
        "pas # minute",
        "pas # minutash",
        "para # ore",
        "para # orësh",
        "pas # ore",
        "pas # orësh",
        "para # dite",
        "para # ditësh",
        "pas # dite",
        "pas # ditësh",
        "para # muaji",
        "para # muajsh",
        "pas # muaji",
        "pas # muajsh",
        "para # viti",
        "para # vjetësh",
        "pas # viti",
        "pas # vjetësh",
        "пре # секунде",
        "пре # секунди",
        "за # секунду",
        "за # секунде",
        "за # секунди",
        "пре # минута",
        "за # минут",
        "за # минута",
        "пре # сата",
        "пре # сати",
        "за # сат",
        "за # сата",
        "за # сати",
        "пре # дана",
        "за # дан",
        "за # дана",
        "пре # месеца",
        "пре # месеци",
        "за # месец",
        "за # месеца",
        "за # месеци",
        "пре # године",
        "пре # година",
        "за # годину",
        "за # године",
        "за # година",
        "för # sekund sedan",
        "för # sekunder sedan",
        "för # minut sedan",
        "för # minuter sedan",
        "om # minuter",
        "för # timme sedan",
        "för # timmar sedan",
        "om # timme",
        "om # timmar",
        "för # dag sedan",
        "för # dagar sedan",
        "om # dag",
        "om # dagar",
        "för # månad sedan",
        "för # månader sedan",
        "om # månad",
        "om # månader",
        "för # år sedan",
        "Sekunde # iliyopita",
        "Sekunde # zilizopita",
        "Baada ya sekunde #",
        "Dakika # iliyopita",
        "Dakika # zilizopita",
        "Baada ya dakika #",
        "Saa # iliyopita",
        "Saa # zilizopita",
        "Baada ya saa #",
        "Siku # iliyopita",
        "Siku # zilizopita",
        "Baada ya siku #",
        "Miezi # iliyopita",
        "Baada ya mwezi #",
        "Baada ya miezi #",
        "Mwaka # uliopita",
        "Miaka # iliyopita",
        "Baada ya mwaka #",
        "Baada ya miaka #",
        "# வினாடிக்கு முன்",
        "# வினாடியில்",
        "# விநாடிகளில்",
        "# நிமிடத்திற்கு முன்",
        "# நிமிடங்களுக்கு முன்",
        "# நிமிடத்தில்",
        "# நிமிடங்களில்",
        "# மணிநேரம் முன்",
        "# மணிநேரத்தில்",
        "# நாளுக்கு முன்",
        "# நாட்களுக்கு முன்",
        "# நாளில்",
        "# நாட்களில்",
        "# மாதத்துக்கு முன்",
        "# மாதங்களுக்கு முன்",
        "# மாதத்தில்",
        "# மாதங்களில்",
        "# ஆண்டிற்கு முன்",
        "# ஆண்டுகளுக்கு முன்",
        "# ஆண்டில்",
        "# ஆண்டுகளில்",
        "# సెకను క్రితం",
        "# సెకన్ల క్రితం",
        "# సెకన్‌లో",
        "# సెకన్లలో",
        "# నిమిషం క్రితం",
        "# నిమిషాల క్రితం",
        "# నిమిషంలో",
        "# నిమిషాల్లో",
        "# గంట క్రితం",
        "# గంటల క్రితం",
        "# గంటలో",
        "# గంటల్లో",
        "# రోజు క్రితం",
        "# రోజుల క్రితం",
        "# రోజులో",
        "# రోజుల్లో",
        "# నెల క్రితం",
        "# నెలల క్రితం",
        "# నెలలో",
        "# నెలల్లో",
        "# సంవత్సరం క్రితం",
        "# సంవత్సరాల క్రితం",
        "# సంవత్సరంలో",
        "# సంవత్సరాల్లో",
        "# วินาทีที่ผ่านมา",
        "ในอีก # วินาที",
        "# นาทีที่ผ่านมา",
        "ในอีก # นาที",
        "# ชั่วโมงที่ผ่านมา",
        "ในอีก # ชั่วโมง",
        "# วันที่ผ่านมา",
        "ในอีก # วัน",
        "# เดือนที่ผ่านมา",
        "ในอีก # เดือน",
        "# ปีที่แล้ว",
        "ในอีก # ปี",
        "sekoni ʻe # kuoʻosi",
        "ʻi he sekoni ʻe #",
        "miniti ʻe # kuoʻosi",
        "ʻi he miniti ʻe #",
        "houa ʻe # kuoʻosi",
        "ʻi he houa ʻe #",
        "ʻaho ʻe # kuoʻosi",
        "ʻi he ʻaho ʻe #",
        "māhina ʻe # kuoʻosi",
        "ʻi he māhina ʻe #",
        "taʻu ʻe # kuo hili",
        "ʻi he taʻu ʻe #",
        "# saniye önce",
        "# saniye sonra",
        "# dakika önce",
        "# dakika sonra",
        "# saat önce",
        "# saat sonra",
        "# gün önce",
        "# gün sonra",
        "# ay önce",
        "# ay sonra",
        "# yıl önce",
        "# yıl sonra",
        "# سېكۇنت ئىلگىرى",
        "# سېكۇنتتىن كېيىن",
        "# مىنۇت ئىلگىرى",
        "# مىنۇتتىن كېيىن",
        "# سائەت ئىلگىرى",
        "# سائەتتىن كېيىن",
        "# كۈن ئىلگىرى",
        "# كۈندىن كېيىن",
        "# ئاي ئىلگىرى",
        "# ئايدىن كېيىن",
        "# يىل ئىلگىرى",
        "# يىلدىن كېيىن",
        "# секунду тому",
        "# секунди тому",
        "# секунд тому",
        "Через # секунди",
        "# хвилину тому",
        "# хвилини тому",
        "# хвилин тому",
        "Через # хвилину",
        "Через # хвилини",
        "Через # хвилин",
        "# годину тому",
        "# години тому",
        "# годин тому",
        "Через # годину",
        "Через # години",
        "Через # годин",
        "# день тому",
        "# дні тому",
        "# днів тому",
        "# дня тому",
        "Через # дні",
        "Через # днів",
        "# місяць тому",
        "# місяці тому",
        "# місяців тому",
        "# місяця тому",
        "Через # місяць",
        "Через # місяці",
        "Через # місяців",
        "Через # місяця",
        "# рік тому",
        "# роки тому",
        "# років тому",
        "# року тому",
        "Через # рік",
        "Через # роки",
        "Через # років",
        "Через # року",
        "# سیکنڈ پہلے",
        "# سیکنڈ میں",
        "# منٹ پہلے",
        "# منٹ میں",
        "# گھنٹہ پہلے",
        "# گھنٹے پہلے",
        "# گھنٹہ میں",
        "# گھنٹے میں",
        "# دن پہلے",
        "# دن میں",
        "# مہینہ پہلے",
        "# مہینے پہلے",
        "# مہینہ میں",
        "# مہینے میں",
        "# سال پہلے",
        "# سال میں",
        "# soniya oldin",
        "# soniyadan soʻng",
        "# daqiqa oldin",
        "# daqiqadan soʻng",
        "# soat oldin",
        "# soatdan soʻng",
        "# kun oldin",
        "# kundan soʻng",
        "# oy avval",
        "# oydan soʻng",
        "# yil avval",
        "# yildan soʻng",
        "# giây trước",
        "Trong # giây nữa",
        "# phút trước",
        "Trong # phút nữa",
        "# giờ trước",
        "Trong # giờ nữa",
        "# ngày trước",
        "Trong # ngày nữa",
        "# tháng trước",
        "Trong # tháng nữa",
        "# năm trước",
        "Trong # năm nữa",
        "vor # sekund",
        "vor # sekunde",
        "i # sekund",
        "i # sekunde",
        "vor # minüta",
        "vor # minüte",
        "i # minüta",
        "i # minüte",
        "vor # stund",
        "vor # stunde",
        "i # stund",
        "i # stunde",
        "vor # tag",
        "vor # täg",
        "i # tag",
        "i # täg",
        "vor # mánet",
        "I # mánet",
        "vor # jár",
        "cor # jár",
        "I # jár",
        "#秒钟前",
        "#秒钟后",
        "#分钟前",
        "#分钟后",
        "#小时前",
        "#小时后",
        "#天前",
        "#天后",
        "#个月前",
        "#个月后",
        "#年前",
        "#年后",
        "isekhondi elingu-# eledlule",
        "amasekhondi angu-# adlule",
        "Kusekhondi elingu-#",
        "Kumasekhondi angu-#",
        "eminithini elingu-# eledlule",
        "amaminithi angu-# adlule",
        "Kumunithi engu-#",
        "Emaminithini angu-#",
        "ehoreni eligu-# eledluli",
        "emahoreni angu-# edlule",
        "Ehoreni elingu-#",
        "Emahoreni angu-#",
        "osukwini olungu-# olwedlule",
        "ezinsukwini ezingu-# ezedlule.",
        "Osukwini olungu-#",
        "Ezinsukwini ezingu-#",
        "enyangeni engu-# eyedlule",
        "ezinyangeni ezingu-# ezedlule",
        "Enyangeni engu-#",
        "Ezinyangeni ezingu-#",
        "enyakeni ongu-# owedlule",
        "iminyaka engu-# eyedlule",
        "Onyakeni ongu-#",
        "Eminyakeni engu-#"];
    $$core$$default.__addLocaleData({locale:"aa", relativeTime:{"second":{"past":{"other":src$full$$h[0]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"af", relativeTime:{"second":{"past":{"one":src$full$$h[12],"other":src$full$$h[13]},"future":{"one":src$full$$h[14],"other":src$full$$h[15]}},"minute":{"past":{"one":src$full$$h[16],"other":src$full$$h[17]},"future":{"one":src$full$$h[18],"other":src$full$$h[19]}},"hour":{"past":{"one":src$full$$h[20],"other":src$full$$h[20]},"future":{"one":src$full$$h[21],"other":src$full$$h[21]}},"day":{"past":{"one":src$full$$h[22],"other":src$full$$h[23]},"future":{"one":src$full$$h[24],"other":src$full$$h[25]}},"month":{"past":{"one":src$full$$h[26],"other":src$full$$h[27]},"future":{"one":src$full$$h[28],"other":src$full$$h[29]}},"year":{"past":{"one":src$full$$h[30],"other":src$full$$h[30]},"future":{"one":src$full$$h[31],"other":src$full$$h[31]}}}});
    $$core$$default.__addLocaleData({locale:"agq", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"ak", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"am", relativeTime:{"second":{"past":{"one":src$full$$h[32],"other":src$full$$h[33]},"future":{"one":src$full$$h[34],"other":src$full$$h[35]}},"minute":{"past":{"one":src$full$$h[36],"other":src$full$$h[37]},"future":{"one":src$full$$h[38],"other":src$full$$h[39]}},"hour":{"past":{"one":src$full$$h[40],"other":src$full$$h[41]},"future":{"one":src$full$$h[42],"other":src$full$$h[43]}},"day":{"past":{"one":src$full$$h[44],"other":src$full$$h[45]},"future":{"one":src$full$$h[46],"other":src$full$$h[47]}},"month":{"past":{"one":src$full$$h[48],"other":src$full$$h[49]},"future":{"one":src$full$$h[50],"other":src$full$$h[51]}},"year":{"past":{"one":src$full$$h[52],"other":src$full$$h[53]},"future":{"one":src$full$$h[54],"other":src$full$$h[54]}}}});
    $$core$$default.__addLocaleData({locale:"ar", relativeTime:{"second":{"past":{"zero":src$full$$h[55],"one":src$full$$h[55],"two":src$full$$h[56],"few":src$full$$h[57],"many":src$full$$h[58],"other":src$full$$h[55]},"future":{"zero":src$full$$h[59],"one":src$full$$h[59],"two":src$full$$h[60],"few":src$full$$h[61],"many":src$full$$h[62],"other":src$full$$h[59]}},"minute":{"past":{"zero":src$full$$h[63],"one":src$full$$h[63],"two":src$full$$h[64],"few":src$full$$h[65],"many":src$full$$h[66],"other":src$full$$h[63]},"future":{"zero":src$full$$h[67],"one":src$full$$h[67],"two":src$full$$h[68],"few":src$full$$h[69],"many":src$full$$h[70],"other":src$full$$h[67]}},"hour":{"past":{"zero":src$full$$h[71],"one":src$full$$h[71],"two":src$full$$h[72],"few":src$full$$h[73],"many":src$full$$h[74],"other":src$full$$h[71]},"future":{"zero":src$full$$h[75],"one":src$full$$h[75],"two":src$full$$h[76],"few":src$full$$h[77],"many":src$full$$h[78],"other":src$full$$h[75]}},"day":{"past":{"zero":src$full$$h[79],"one":src$full$$h[79],"two":src$full$$h[80],"few":src$full$$h[81],"many":src$full$$h[82],"other":src$full$$h[79]},"future":{"zero":src$full$$h[83],"one":src$full$$h[83],"two":src$full$$h[84],"few":src$full$$h[85],"many":src$full$$h[86],"other":src$full$$h[83]}},"month":{"past":{"zero":src$full$$h[87],"one":src$full$$h[87],"two":src$full$$h[88],"few":src$full$$h[89],"many":src$full$$h[90],"other":src$full$$h[87]},"future":{"zero":src$full$$h[91],"one":src$full$$h[91],"two":src$full$$h[92],"few":src$full$$h[93],"many":src$full$$h[94],"other":src$full$$h[91]}},"year":{"past":{"zero":src$full$$h[95],"one":src$full$$h[95],"two":src$full$$h[96],"few":src$full$$h[97],"many":src$full$$h[98],"other":src$full$$h[95]},"future":{"zero":src$full$$h[99],"one":src$full$$h[99],"two":src$full$$h[100],"few":src$full$$h[101],"many":src$full$$h[102],"other":src$full$$h[99]}}}});
    $$core$$default.__addLocaleData({locale:"as", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"asa", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"ast", relativeTime:{"second":{"past":{"one":src$full$$h[103],"other":src$full$$h[104]},"future":{"one":src$full$$h[105],"other":src$full$$h[106]}},"minute":{"past":{"one":src$full$$h[107],"other":src$full$$h[108]},"future":{"one":src$full$$h[109],"other":src$full$$h[110]}},"hour":{"past":{"one":src$full$$h[111],"other":src$full$$h[112]},"future":{"one":src$full$$h[113],"other":src$full$$h[114]}},"day":{"past":{"one":src$full$$h[115],"other":src$full$$h[116]},"future":{"one":src$full$$h[117],"other":src$full$$h[118]}},"month":{"past":{"one":src$full$$h[119],"other":src$full$$h[120]},"future":{"one":src$full$$h[121],"other":src$full$$h[122]}},"year":{"past":{"one":src$full$$h[123],"other":src$full$$h[124]},"future":{"one":src$full$$h[125],"other":src$full$$h[126]}}}});
    $$core$$default.__addLocaleData({locale:"az", relativeTime:{"second":{"past":{"one":src$full$$h[127],"other":src$full$$h[127]},"future":{"one":src$full$$h[128],"other":src$full$$h[128]}},"minute":{"past":{"one":src$full$$h[129],"other":src$full$$h[129]},"future":{"one":src$full$$h[130],"other":src$full$$h[130]}},"hour":{"past":{"one":src$full$$h[131],"other":src$full$$h[131]},"future":{"one":src$full$$h[132],"other":src$full$$h[132]}},"day":{"past":{"one":src$full$$h[133],"other":src$full$$h[133]},"future":{"one":src$full$$h[134],"other":src$full$$h[134]}},"month":{"past":{"one":src$full$$h[135],"other":src$full$$h[135]},"future":{"one":src$full$$h[136],"other":src$full$$h[136]}},"year":{"past":{"one":src$full$$h[137],"other":src$full$$h[137]},"future":{"one":src$full$$h[138],"other":src$full$$h[138]}}}});
    $$core$$default.__addLocaleData({locale:"bas", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"be", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"bem", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"bez", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"bg", relativeTime:{"second":{"past":{"one":src$full$$h[139],"other":src$full$$h[140]},"future":{"one":src$full$$h[141],"other":src$full$$h[142]}},"minute":{"past":{"one":src$full$$h[143],"other":src$full$$h[144]},"future":{"one":src$full$$h[145],"other":src$full$$h[146]}},"hour":{"past":{"one":src$full$$h[147],"other":src$full$$h[148]},"future":{"one":src$full$$h[149],"other":src$full$$h[150]}},"day":{"past":{"one":src$full$$h[151],"other":src$full$$h[152]},"future":{"one":src$full$$h[153],"other":src$full$$h[153]}},"month":{"past":{"one":src$full$$h[154],"other":src$full$$h[155]},"future":{"one":src$full$$h[156],"other":src$full$$h[157]}},"year":{"past":{"one":src$full$$h[158],"other":src$full$$h[159]},"future":{"one":src$full$$h[160],"other":src$full$$h[161]}}}});
    $$core$$default.__addLocaleData({locale:"bm", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"bn", relativeTime:{"second":{"past":{"one":src$full$$h[162],"other":src$full$$h[162]},"future":{"one":src$full$$h[163],"other":src$full$$h[163]}},"minute":{"past":{"one":src$full$$h[164],"other":src$full$$h[164]},"future":{"one":src$full$$h[165],"other":src$full$$h[165]}},"hour":{"past":{"one":src$full$$h[166],"other":src$full$$h[166]},"future":{"one":src$full$$h[167],"other":src$full$$h[167]}},"day":{"past":{"one":src$full$$h[168],"other":src$full$$h[168]},"future":{"one":src$full$$h[169],"other":src$full$$h[169]}},"month":{"past":{"one":src$full$$h[170],"other":src$full$$h[170]},"future":{"one":src$full$$h[171],"other":src$full$$h[171]}},"year":{"past":{"one":src$full$$h[172],"other":src$full$$h[172]},"future":{"one":src$full$$h[173],"other":src$full$$h[173]}}}});
    $$core$$default.__addLocaleData({locale:"bo", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"br", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"brx", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"bs", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"byn", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"ca", relativeTime:{"second":{"past":{"one":src$full$$h[174],"other":src$full$$h[175]},"future":{"one":src$full$$h[176],"other":src$full$$h[177]}},"minute":{"past":{"one":src$full$$h[178],"other":src$full$$h[179]},"future":{"one":src$full$$h[180],"other":src$full$$h[181]}},"hour":{"past":{"one":src$full$$h[182],"other":src$full$$h[183]},"future":{"one":src$full$$h[184],"other":src$full$$h[185]}},"day":{"past":{"one":src$full$$h[186],"other":src$full$$h[187]},"future":{"one":src$full$$h[188],"other":src$full$$h[189]}},"month":{"past":{"one":src$full$$h[190],"other":src$full$$h[191]},"future":{"one":src$full$$h[192],"other":src$full$$h[193]}},"year":{"past":{"one":src$full$$h[194],"other":src$full$$h[195]},"future":{"one":src$full$$h[196],"other":src$full$$h[197]}}}});
    $$core$$default.__addLocaleData({locale:"cgg", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"chr", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"cs", relativeTime:{"second":{"past":{"one":src$full$$h[198],"few":src$full$$h[199],"many":src$full$$h[198],"other":src$full$$h[199]},"future":{"one":src$full$$h[200],"few":src$full$$h[201],"many":src$full$$h[201],"other":src$full$$h[202]}},"minute":{"past":{"one":src$full$$h[203],"few":src$full$$h[204],"many":src$full$$h[203],"other":src$full$$h[204]},"future":{"one":src$full$$h[205],"few":src$full$$h[206],"many":src$full$$h[206],"other":src$full$$h[207]}},"hour":{"past":{"one":src$full$$h[208],"few":src$full$$h[209],"many":src$full$$h[208],"other":src$full$$h[209]},"future":{"one":src$full$$h[210],"few":src$full$$h[211],"many":src$full$$h[211],"other":src$full$$h[212]}},"day":{"past":{"one":src$full$$h[213],"few":src$full$$h[214],"many":src$full$$h[213],"other":src$full$$h[214]},"future":{"one":src$full$$h[215],"few":src$full$$h[216],"many":src$full$$h[217],"other":src$full$$h[218]}},"month":{"past":{"one":src$full$$h[219],"few":src$full$$h[220],"many":src$full$$h[219],"other":src$full$$h[220]},"future":{"one":src$full$$h[221],"few":src$full$$h[222],"many":src$full$$h[222],"other":src$full$$h[223]}},"year":{"past":{"one":src$full$$h[224],"few":src$full$$h[225],"many":src$full$$h[224],"other":src$full$$h[225]},"future":{"one":src$full$$h[226],"few":src$full$$h[227],"many":src$full$$h[228],"other":src$full$$h[229]}}}});
    $$core$$default.__addLocaleData({locale:"cy", relativeTime:{"second":{"past":{"zero":src$full$$h[230],"one":src$full$$h[231],"two":src$full$$h[230],"few":src$full$$h[230],"many":src$full$$h[230],"other":src$full$$h[230]},"future":{"zero":src$full$$h[232],"one":src$full$$h[233],"two":src$full$$h[232],"few":src$full$$h[232],"many":src$full$$h[232],"other":src$full$$h[232]}},"minute":{"past":{"zero":src$full$$h[234],"one":src$full$$h[234],"two":src$full$$h[235],"few":src$full$$h[234],"many":src$full$$h[234],"other":src$full$$h[234]},"future":{"zero":src$full$$h[236],"one":src$full$$h[237],"two":src$full$$h[238],"few":src$full$$h[236],"many":src$full$$h[236],"other":src$full$$h[236]}},"hour":{"past":{"zero":src$full$$h[239],"one":src$full$$h[240],"two":src$full$$h[239],"few":src$full$$h[239],"many":src$full$$h[239],"other":src$full$$h[239]},"future":{"zero":src$full$$h[241],"one":src$full$$h[241],"two":src$full$$h[241],"few":src$full$$h[241],"many":src$full$$h[241],"other":src$full$$h[241]}},"day":{"past":{"zero":src$full$$h[242],"one":src$full$$h[242],"two":src$full$$h[243],"few":src$full$$h[242],"many":src$full$$h[242],"other":src$full$$h[242]},"future":{"zero":src$full$$h[244],"one":src$full$$h[245],"two":src$full$$h[246],"few":src$full$$h[247],"many":src$full$$h[244],"other":src$full$$h[244]}},"month":{"past":{"zero":src$full$$h[248],"one":src$full$$h[248],"two":src$full$$h[249],"few":src$full$$h[248],"many":src$full$$h[248],"other":src$full$$h[248]},"future":{"zero":src$full$$h[250],"one":src$full$$h[251],"two":src$full$$h[252],"few":src$full$$h[250],"many":src$full$$h[250],"other":src$full$$h[250]}},"year":{"past":{"zero":src$full$$h[253],"one":src$full$$h[254],"two":src$full$$h[255],"few":src$full$$h[256],"many":src$full$$h[256],"other":src$full$$h[253]},"future":{"zero":src$full$$h[257],"one":src$full$$h[258],"two":src$full$$h[259],"few":src$full$$h[260],"many":src$full$$h[260],"other":src$full$$h[257]}}}});
    $$core$$default.__addLocaleData({locale:"da", relativeTime:{"second":{"past":{"one":src$full$$h[261],"other":src$full$$h[262]},"future":{"one":src$full$$h[263],"other":src$full$$h[264]}},"minute":{"past":{"one":src$full$$h[265],"other":src$full$$h[266]},"future":{"one":src$full$$h[267],"other":src$full$$h[268]}},"hour":{"past":{"one":src$full$$h[269],"other":src$full$$h[270]},"future":{"one":src$full$$h[271],"other":src$full$$h[272]}},"day":{"past":{"one":src$full$$h[273],"other":src$full$$h[273]},"future":{"one":src$full$$h[274],"other":src$full$$h[274]}},"month":{"past":{"one":src$full$$h[275],"other":src$full$$h[276]},"future":{"one":src$full$$h[277],"other":src$full$$h[278]}},"year":{"past":{"one":src$full$$h[279],"other":src$full$$h[279]},"future":{"one":src$full$$h[280],"other":src$full$$h[280]}}}});
    $$core$$default.__addLocaleData({locale:"dav", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"de", relativeTime:{"second":{"past":{"one":src$full$$h[281],"other":src$full$$h[282]},"future":{"one":src$full$$h[283],"other":src$full$$h[284]}},"minute":{"past":{"one":src$full$$h[285],"other":src$full$$h[286]},"future":{"one":src$full$$h[287],"other":src$full$$h[288]}},"hour":{"past":{"one":src$full$$h[289],"other":src$full$$h[290]},"future":{"one":src$full$$h[291],"other":src$full$$h[292]}},"day":{"past":{"one":src$full$$h[293],"other":src$full$$h[294]},"future":{"one":src$full$$h[295],"other":src$full$$h[296]}},"month":{"past":{"one":src$full$$h[297],"other":src$full$$h[298]},"future":{"one":src$full$$h[299],"other":src$full$$h[300]}},"year":{"past":{"one":src$full$$h[301],"other":src$full$$h[302]},"future":{"one":src$full$$h[303],"other":src$full$$h[304]}}}});
    $$core$$default.__addLocaleData({locale:"dje", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"dua", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"dyo", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"dz", relativeTime:{"second":{"past":{"other":src$full$$h[305]},"future":{"other":src$full$$h[306]}},"minute":{"past":{"other":src$full$$h[307]},"future":{"other":src$full$$h[308]}},"hour":{"past":{"other":src$full$$h[309]},"future":{"other":src$full$$h[310]}},"day":{"past":{"other":src$full$$h[311]},"future":{"other":src$full$$h[312]}},"month":{"past":{"other":src$full$$h[313]},"future":{"other":src$full$$h[314]}},"year":{"past":{"other":src$full$$h[315]},"future":{"other":src$full$$h[316]}}}});
    $$core$$default.__addLocaleData({locale:"ebu", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"ee", relativeTime:{"second":{"past":{"one":src$full$$h[317],"other":src$full$$h[318]},"future":{"one":src$full$$h[319],"other":src$full$$h[320]}},"minute":{"past":{"one":src$full$$h[321],"other":src$full$$h[322]},"future":{"one":src$full$$h[323],"other":src$full$$h[324]}},"hour":{"past":{"one":src$full$$h[325],"other":src$full$$h[326]},"future":{"one":src$full$$h[327],"other":src$full$$h[328]}},"day":{"past":{"one":src$full$$h[329],"other":src$full$$h[330]},"future":{"one":src$full$$h[331],"other":src$full$$h[332]}},"month":{"past":{"one":src$full$$h[333],"other":src$full$$h[334]},"future":{"one":src$full$$h[335],"other":src$full$$h[336]}},"year":{"past":{"one":src$full$$h[337],"other":src$full$$h[338]},"future":{"one":src$full$$h[339],"other":src$full$$h[340]}}}});
    $$core$$default.__addLocaleData({locale:"el", relativeTime:{"second":{"past":{"one":src$full$$h[341],"other":src$full$$h[342]},"future":{"one":src$full$$h[343],"other":src$full$$h[344]}},"minute":{"past":{"one":src$full$$h[345],"other":src$full$$h[346]},"future":{"one":src$full$$h[347],"other":src$full$$h[348]}},"hour":{"past":{"one":src$full$$h[349],"other":src$full$$h[350]},"future":{"one":src$full$$h[351],"other":src$full$$h[352]}},"day":{"past":{"one":src$full$$h[353],"other":src$full$$h[354]},"future":{"one":src$full$$h[355],"other":src$full$$h[356]}},"month":{"past":{"one":src$full$$h[357],"other":src$full$$h[358]},"future":{"one":src$full$$h[359],"other":src$full$$h[360]}},"year":{"past":{"one":src$full$$h[361],"other":src$full$$h[362]},"future":{"one":src$full$$h[363],"other":src$full$$h[364]}}}});
    $$core$$default.__addLocaleData({locale:"en", relativeTime:{"second":{"past":{"one":src$full$$h[365],"other":src$full$$h[366]},"future":{"one":src$full$$h[367],"other":src$full$$h[368]}},"minute":{"past":{"one":src$full$$h[369],"other":src$full$$h[370]},"future":{"one":src$full$$h[371],"other":src$full$$h[372]}},"hour":{"past":{"one":src$full$$h[373],"other":src$full$$h[374]},"future":{"one":src$full$$h[375],"other":src$full$$h[376]}},"day":{"past":{"one":src$full$$h[377],"other":src$full$$h[378]},"future":{"one":src$full$$h[379],"other":src$full$$h[380]}},"month":{"past":{"one":src$full$$h[381],"other":src$full$$h[382]},"future":{"one":src$full$$h[383],"other":src$full$$h[384]}},"year":{"past":{"one":src$full$$h[385],"other":src$full$$h[386]},"future":{"one":src$full$$h[387],"other":src$full$$h[388]}}}});
    $$core$$default.__addLocaleData({locale:"eo", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"es", relativeTime:{"second":{"past":{"one":src$full$$h[389],"other":src$full$$h[390]},"future":{"one":src$full$$h[391],"other":src$full$$h[392]}},"minute":{"past":{"one":src$full$$h[393],"other":src$full$$h[394]},"future":{"one":src$full$$h[395],"other":src$full$$h[396]}},"hour":{"past":{"one":src$full$$h[397],"other":src$full$$h[398]},"future":{"one":src$full$$h[399],"other":src$full$$h[400]}},"day":{"past":{"one":src$full$$h[401],"other":src$full$$h[402]},"future":{"one":src$full$$h[403],"other":src$full$$h[404]}},"month":{"past":{"one":src$full$$h[405],"other":src$full$$h[406]},"future":{"one":src$full$$h[407],"other":src$full$$h[408]}},"year":{"past":{"one":src$full$$h[409],"other":src$full$$h[410]},"future":{"one":src$full$$h[411],"other":src$full$$h[412]}}}});
    $$core$$default.__addLocaleData({locale:"et", relativeTime:{"second":{"past":{"one":src$full$$h[413],"other":src$full$$h[413]},"future":{"one":src$full$$h[414],"other":src$full$$h[414]}},"minute":{"past":{"one":src$full$$h[415],"other":src$full$$h[415]},"future":{"one":src$full$$h[416],"other":src$full$$h[416]}},"hour":{"past":{"one":src$full$$h[417],"other":src$full$$h[417]},"future":{"one":src$full$$h[418],"other":src$full$$h[418]}},"day":{"past":{"one":src$full$$h[419],"other":src$full$$h[419]},"future":{"one":src$full$$h[420],"other":src$full$$h[420]}},"month":{"past":{"one":src$full$$h[421],"other":src$full$$h[421]},"future":{"one":src$full$$h[422],"other":src$full$$h[422]}},"year":{"past":{"one":src$full$$h[423],"other":src$full$$h[423]},"future":{"one":src$full$$h[424],"other":src$full$$h[424]}}}});
    $$core$$default.__addLocaleData({locale:"eu", relativeTime:{"second":{"past":{"one":src$full$$h[425],"other":src$full$$h[425]},"future":{"one":src$full$$h[426],"other":src$full$$h[426]}},"minute":{"past":{"one":src$full$$h[427],"other":src$full$$h[427]},"future":{"one":src$full$$h[428],"other":src$full$$h[428]}},"hour":{"past":{"one":src$full$$h[429],"other":src$full$$h[429]},"future":{"one":src$full$$h[430],"other":src$full$$h[430]}},"day":{"past":{"one":src$full$$h[431],"other":src$full$$h[431]},"future":{"one":src$full$$h[432],"other":src$full$$h[432]}},"month":{"past":{"one":src$full$$h[433],"other":src$full$$h[433]},"future":{"one":src$full$$h[434],"other":src$full$$h[434]}},"year":{"past":{"one":src$full$$h[435],"other":src$full$$h[435]},"future":{"one":src$full$$h[436],"other":src$full$$h[436]}}}});
    $$core$$default.__addLocaleData({locale:"ewo", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"fa", relativeTime:{"second":{"past":{"one":src$full$$h[437],"other":src$full$$h[437]},"future":{"one":src$full$$h[438],"other":src$full$$h[438]}},"minute":{"past":{"one":src$full$$h[439],"other":src$full$$h[439]},"future":{"one":src$full$$h[440],"other":src$full$$h[440]}},"hour":{"past":{"one":src$full$$h[441],"other":src$full$$h[441]},"future":{"one":src$full$$h[442],"other":src$full$$h[442]}},"day":{"past":{"one":src$full$$h[443],"other":src$full$$h[443]},"future":{"one":src$full$$h[444],"other":src$full$$h[444]}},"month":{"past":{"one":src$full$$h[445],"other":src$full$$h[445]},"future":{"one":src$full$$h[446],"other":src$full$$h[446]}},"year":{"past":{"one":src$full$$h[447],"other":src$full$$h[447]},"future":{"one":src$full$$h[448],"other":src$full$$h[448]}}}});
    $$core$$default.__addLocaleData({locale:"ff", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"fi", relativeTime:{"second":{"past":{"one":src$full$$h[449],"other":src$full$$h[450]},"future":{"one":src$full$$h[451],"other":src$full$$h[451]}},"minute":{"past":{"one":src$full$$h[452],"other":src$full$$h[453]},"future":{"one":src$full$$h[454],"other":src$full$$h[454]}},"hour":{"past":{"one":src$full$$h[455],"other":src$full$$h[456]},"future":{"one":src$full$$h[457],"other":src$full$$h[457]}},"day":{"past":{"one":src$full$$h[458],"other":src$full$$h[459]},"future":{"one":src$full$$h[460],"other":src$full$$h[460]}},"month":{"past":{"one":src$full$$h[461],"other":src$full$$h[462]},"future":{"one":src$full$$h[463],"other":src$full$$h[463]}},"year":{"past":{"one":src$full$$h[464],"other":src$full$$h[465]},"future":{"one":src$full$$h[466],"other":src$full$$h[466]}}}});
    $$core$$default.__addLocaleData({locale:"fil", relativeTime:{"second":{"past":{"one":src$full$$h[467],"other":src$full$$h[467]},"future":{"one":src$full$$h[468],"other":src$full$$h[468]}},"minute":{"past":{"one":src$full$$h[469],"other":src$full$$h[469]},"future":{"one":src$full$$h[470],"other":src$full$$h[470]}},"hour":{"past":{"one":src$full$$h[471],"other":src$full$$h[471]},"future":{"one":src$full$$h[472],"other":src$full$$h[472]}},"day":{"past":{"one":src$full$$h[473],"other":src$full$$h[473]},"future":{"one":src$full$$h[474],"other":src$full$$h[474]}},"month":{"past":{"one":src$full$$h[475],"other":src$full$$h[475]},"future":{"one":src$full$$h[476],"other":src$full$$h[476]}},"year":{"past":{"one":src$full$$h[477],"other":src$full$$h[477]},"future":{"one":src$full$$h[478],"other":src$full$$h[478]}}}});
    $$core$$default.__addLocaleData({locale:"fo", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"fr", relativeTime:{"second":{"past":{"one":src$full$$h[479],"other":src$full$$h[480]},"future":{"one":src$full$$h[481],"other":src$full$$h[482]}},"minute":{"past":{"one":src$full$$h[483],"other":src$full$$h[484]},"future":{"one":src$full$$h[485],"other":src$full$$h[486]}},"hour":{"past":{"one":src$full$$h[487],"other":src$full$$h[488]},"future":{"one":src$full$$h[489],"other":src$full$$h[490]}},"day":{"past":{"one":src$full$$h[491],"other":src$full$$h[492]},"future":{"one":src$full$$h[493],"other":src$full$$h[494]}},"month":{"past":{"one":src$full$$h[495],"other":src$full$$h[495]},"future":{"one":src$full$$h[496],"other":src$full$$h[496]}},"year":{"past":{"one":src$full$$h[497],"other":src$full$$h[498]},"future":{"one":src$full$$h[499],"other":src$full$$h[500]}}}});
    $$core$$default.__addLocaleData({locale:"fur", relativeTime:{"second":{"past":{"one":src$full$$h[501],"other":src$full$$h[502]},"future":{"one":src$full$$h[503],"other":src$full$$h[504]}},"minute":{"past":{"one":src$full$$h[505],"other":src$full$$h[506]},"future":{"one":src$full$$h[507],"other":src$full$$h[508]}},"hour":{"past":{"one":src$full$$h[509],"other":src$full$$h[510]},"future":{"one":src$full$$h[511],"other":src$full$$h[512]}},"day":{"past":{"one":src$full$$h[513],"other":src$full$$h[514]},"future":{"one":src$full$$h[515],"other":src$full$$h[516]}},"month":{"past":{"one":src$full$$h[517],"other":src$full$$h[517]},"future":{"one":src$full$$h[518],"other":src$full$$h[518]}},"year":{"past":{"one":src$full$$h[519],"other":src$full$$h[520]},"future":{"one":src$full$$h[521],"other":src$full$$h[522]}}}});
    $$core$$default.__addLocaleData({locale:"fy", relativeTime:{"second":{"past":{"one":src$full$$h[523],"other":src$full$$h[524]},"future":{"one":src$full$$h[525],"other":src$full$$h[526]}},"minute":{"past":{"one":src$full$$h[527],"other":src$full$$h[528]},"future":{"one":src$full$$h[529],"other":src$full$$h[530]}},"hour":{"past":{"one":src$full$$h[531],"other":src$full$$h[531]},"future":{"one":src$full$$h[532],"other":src$full$$h[532]}},"day":{"past":{"one":src$full$$h[533],"other":src$full$$h[534]},"future":{"one":src$full$$h[535],"other":src$full$$h[536]}},"month":{"past":{"one":src$full$$h[537],"other":src$full$$h[538]},"future":{"one":src$full$$h[539],"other":src$full$$h[540]}},"year":{"past":{"one":src$full$$h[541],"other":src$full$$h[541]},"future":{"one":src$full$$h[542],"other":src$full$$h[542]}}}});
    $$core$$default.__addLocaleData({locale:"ga", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"gd", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"gl", relativeTime:{"second":{"past":{"one":src$full$$h[543],"other":src$full$$h[104]},"future":{"one":src$full$$h[544],"other":src$full$$h[106]}},"minute":{"past":{"one":src$full$$h[545],"other":src$full$$h[108]},"future":{"one":src$full$$h[546],"other":src$full$$h[110]}},"hour":{"past":{"one":src$full$$h[111],"other":src$full$$h[547]},"future":{"one":src$full$$h[113],"other":src$full$$h[548]}},"day":{"past":{"one":src$full$$h[549],"other":src$full$$h[550]},"future":{"one":src$full$$h[551],"other":src$full$$h[552]}},"month":{"past":{"one":src$full$$h[119],"other":src$full$$h[120]},"future":{"one":src$full$$h[121],"other":src$full$$h[122]}},"year":{"past":{"one":src$full$$h[553],"other":src$full$$h[554]},"future":{"one":src$full$$h[555],"other":src$full$$h[556]}}}});
    $$core$$default.__addLocaleData({locale:"gsw", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"gu", relativeTime:{"second":{"past":{"one":src$full$$h[557],"other":src$full$$h[557]},"future":{"one":src$full$$h[558],"other":src$full$$h[558]}},"minute":{"past":{"one":src$full$$h[559],"other":src$full$$h[559]},"future":{"one":src$full$$h[560],"other":src$full$$h[560]}},"hour":{"past":{"one":src$full$$h[561],"other":src$full$$h[561]},"future":{"one":src$full$$h[562],"other":src$full$$h[562]}},"day":{"past":{"one":src$full$$h[563],"other":src$full$$h[563]},"future":{"one":src$full$$h[564],"other":src$full$$h[564]}},"month":{"past":{"one":src$full$$h[565],"other":src$full$$h[565]},"future":{"one":src$full$$h[566],"other":src$full$$h[566]}},"year":{"past":{"one":src$full$$h[567],"other":src$full$$h[567]},"future":{"one":src$full$$h[568],"other":src$full$$h[568]}}}});
    $$core$$default.__addLocaleData({locale:"guz", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"gv", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"ha", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"haw", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"he", relativeTime:{"second":{"past":{"one":src$full$$h[569],"two":src$full$$h[570],"many":src$full$$h[570],"other":src$full$$h[570]},"future":{"one":src$full$$h[571],"two":src$full$$h[572],"many":src$full$$h[572],"other":src$full$$h[572]}},"minute":{"past":{"one":src$full$$h[573],"two":src$full$$h[574],"many":src$full$$h[574],"other":src$full$$h[574]},"future":{"one":src$full$$h[575],"two":src$full$$h[576],"many":src$full$$h[576],"other":src$full$$h[576]}},"hour":{"past":{"one":src$full$$h[577],"two":src$full$$h[578],"many":src$full$$h[578],"other":src$full$$h[578]},"future":{"one":src$full$$h[579],"two":src$full$$h[580],"many":src$full$$h[580],"other":src$full$$h[580]}},"day":{"past":{"one":src$full$$h[581],"two":src$full$$h[582],"many":src$full$$h[582],"other":src$full$$h[582]},"future":{"one":src$full$$h[583],"two":src$full$$h[584],"many":src$full$$h[584],"other":src$full$$h[584]}},"month":{"past":{"one":src$full$$h[585],"two":src$full$$h[586],"many":src$full$$h[586],"other":src$full$$h[586]},"future":{"one":src$full$$h[587],"two":src$full$$h[588],"many":src$full$$h[588],"other":src$full$$h[588]}},"year":{"past":{"one":src$full$$h[589],"two":src$full$$h[590],"many":src$full$$h[590],"other":src$full$$h[590]},"future":{"one":src$full$$h[591],"two":src$full$$h[592],"many":src$full$$h[592],"other":src$full$$h[592]}}}});
    $$core$$default.__addLocaleData({locale:"hi", relativeTime:{"second":{"past":{"one":src$full$$h[593],"other":src$full$$h[593]},"future":{"one":src$full$$h[594],"other":src$full$$h[594]}},"minute":{"past":{"one":src$full$$h[595],"other":src$full$$h[595]},"future":{"one":src$full$$h[596],"other":src$full$$h[596]}},"hour":{"past":{"one":src$full$$h[597],"other":src$full$$h[597]},"future":{"one":src$full$$h[598],"other":src$full$$h[598]}},"day":{"past":{"one":src$full$$h[599],"other":src$full$$h[599]},"future":{"one":src$full$$h[600],"other":src$full$$h[600]}},"month":{"past":{"one":src$full$$h[601],"other":src$full$$h[601]},"future":{"one":src$full$$h[602],"other":src$full$$h[602]}},"year":{"past":{"one":src$full$$h[603],"other":src$full$$h[603]},"future":{"one":src$full$$h[604],"other":src$full$$h[604]}}}});
    $$core$$default.__addLocaleData({locale:"hr", relativeTime:{"second":{"past":{"one":src$full$$h[605],"few":src$full$$h[606],"other":src$full$$h[607]},"future":{"one":src$full$$h[200],"few":src$full$$h[608],"other":src$full$$h[609]}},"minute":{"past":{"one":src$full$$h[610],"few":src$full$$h[611],"other":src$full$$h[612]},"future":{"one":src$full$$h[205],"few":src$full$$h[613],"other":src$full$$h[614]}},"hour":{"past":{"one":src$full$$h[615],"few":src$full$$h[616],"other":src$full$$h[617]},"future":{"one":src$full$$h[618],"few":src$full$$h[619],"other":src$full$$h[620]}},"day":{"past":{"one":src$full$$h[621],"few":src$full$$h[622],"other":src$full$$h[622]},"future":{"one":src$full$$h[623],"few":src$full$$h[624],"other":src$full$$h[624]}},"month":{"past":{"one":src$full$$h[625],"few":src$full$$h[626],"other":src$full$$h[627]},"future":{"one":src$full$$h[628],"few":src$full$$h[629],"other":src$full$$h[630]}},"year":{"past":{"one":src$full$$h[631],"few":src$full$$h[632],"other":src$full$$h[633]},"future":{"one":src$full$$h[634],"few":src$full$$h[635],"other":src$full$$h[636]}}}});
    $$core$$default.__addLocaleData({locale:"hu", relativeTime:{"second":{"past":{"one":src$full$$h[637],"other":src$full$$h[637]},"future":{"one":src$full$$h[638],"other":src$full$$h[638]}},"minute":{"past":{"one":src$full$$h[639],"other":src$full$$h[639]},"future":{"one":src$full$$h[640],"other":src$full$$h[640]}},"hour":{"past":{"one":src$full$$h[641],"other":src$full$$h[641]},"future":{"one":src$full$$h[642],"other":src$full$$h[642]}},"day":{"past":{"one":src$full$$h[643],"other":src$full$$h[643]},"future":{"one":src$full$$h[644],"other":src$full$$h[644]}},"month":{"past":{"one":src$full$$h[645],"other":src$full$$h[645]},"future":{"one":src$full$$h[646],"other":src$full$$h[646]}},"year":{"past":{"one":src$full$$h[647],"other":src$full$$h[647]},"future":{"one":src$full$$h[648],"other":src$full$$h[648]}}}});
    $$core$$default.__addLocaleData({locale:"hy", relativeTime:{"second":{"past":{"one":src$full$$h[649],"other":src$full$$h[649]},"future":{"one":src$full$$h[650],"other":src$full$$h[650]}},"minute":{"past":{"one":src$full$$h[651],"other":src$full$$h[651]},"future":{"one":src$full$$h[652],"other":src$full$$h[652]}},"hour":{"past":{"one":src$full$$h[653],"other":src$full$$h[653]},"future":{"one":src$full$$h[654],"other":src$full$$h[654]}},"day":{"past":{"one":src$full$$h[655],"other":src$full$$h[655]},"future":{"one":src$full$$h[656],"other":src$full$$h[656]}},"month":{"past":{"one":src$full$$h[657],"other":src$full$$h[657]},"future":{"one":src$full$$h[658],"other":src$full$$h[658]}},"year":{"past":{"one":src$full$$h[659],"other":src$full$$h[659]},"future":{"one":src$full$$h[660],"other":src$full$$h[660]}}}});
    $$core$$default.__addLocaleData({locale:"ia", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"id", relativeTime:{"second":{"past":{"other":src$full$$h[661]},"future":{"other":src$full$$h[662]}},"minute":{"past":{"other":src$full$$h[663]},"future":{"other":src$full$$h[664]}},"hour":{"past":{"other":src$full$$h[665]},"future":{"other":src$full$$h[666]}},"day":{"past":{"other":src$full$$h[667]},"future":{"other":src$full$$h[668]}},"month":{"past":{"other":src$full$$h[669]},"future":{"other":src$full$$h[670]}},"year":{"past":{"other":src$full$$h[671]},"future":{"other":src$full$$h[672]}}}});
    $$core$$default.__addLocaleData({locale:"ig", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"ii", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"is", relativeTime:{"second":{"past":{"one":src$full$$h[673],"other":src$full$$h[674]},"future":{"one":src$full$$h[675],"other":src$full$$h[676]}},"minute":{"past":{"one":src$full$$h[677],"other":src$full$$h[678]},"future":{"one":src$full$$h[679],"other":src$full$$h[680]}},"hour":{"past":{"one":src$full$$h[681],"other":src$full$$h[682]},"future":{"one":src$full$$h[683],"other":src$full$$h[684]}},"day":{"past":{"one":src$full$$h[685],"other":src$full$$h[686]},"future":{"one":src$full$$h[687],"other":src$full$$h[688]}},"month":{"past":{"one":src$full$$h[689],"other":src$full$$h[690]},"future":{"one":src$full$$h[691],"other":src$full$$h[692]}},"year":{"past":{"one":src$full$$h[693],"other":src$full$$h[694]},"future":{"one":src$full$$h[695],"other":src$full$$h[695]}}}});
    $$core$$default.__addLocaleData({locale:"it", relativeTime:{"second":{"past":{"one":src$full$$h[696],"other":src$full$$h[697]},"future":{"one":src$full$$h[698],"other":src$full$$h[699]}},"minute":{"past":{"one":src$full$$h[700],"other":src$full$$h[701]},"future":{"one":src$full$$h[702],"other":src$full$$h[703]}},"hour":{"past":{"one":src$full$$h[704],"other":src$full$$h[705]},"future":{"one":src$full$$h[706],"other":src$full$$h[707]}},"day":{"past":{"one":src$full$$h[708],"other":src$full$$h[709]},"future":{"one":src$full$$h[710],"other":src$full$$h[711]}},"month":{"past":{"one":src$full$$h[712],"other":src$full$$h[713]},"future":{"one":src$full$$h[714],"other":src$full$$h[715]}},"year":{"past":{"one":src$full$$h[716],"other":src$full$$h[717]},"future":{"one":src$full$$h[718],"other":src$full$$h[719]}}}});
    $$core$$default.__addLocaleData({locale:"ja", relativeTime:{"second":{"past":{"other":src$full$$h[720]},"future":{"other":src$full$$h[721]}},"minute":{"past":{"other":src$full$$h[722]},"future":{"other":src$full$$h[723]}},"hour":{"past":{"other":src$full$$h[724]},"future":{"other":src$full$$h[725]}},"day":{"past":{"other":src$full$$h[726]},"future":{"other":src$full$$h[727]}},"month":{"past":{"other":src$full$$h[728]},"future":{"other":src$full$$h[729]}},"year":{"past":{"other":src$full$$h[730]},"future":{"other":src$full$$h[731]}}}});
    $$core$$default.__addLocaleData({locale:"jgo", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"one":src$full$$h[732],"other":src$full$$h[732]},"future":{"one":src$full$$h[733],"other":src$full$$h[733]}},"hour":{"past":{"one":src$full$$h[734],"other":src$full$$h[734]},"future":{"one":src$full$$h[735],"other":src$full$$h[735]}},"day":{"past":{"one":src$full$$h[736],"other":src$full$$h[736]},"future":{"one":src$full$$h[737],"other":src$full$$h[737]}},"month":{"past":{"one":src$full$$h[738],"other":src$full$$h[738]},"future":{"one":src$full$$h[739],"other":src$full$$h[739]}},"year":{"past":{"one":src$full$$h[740],"other":src$full$$h[740]},"future":{"one":src$full$$h[741],"other":src$full$$h[741]}}}});
    $$core$$default.__addLocaleData({locale:"jmc", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"ka", relativeTime:{"second":{"past":{"one":src$full$$h[742],"other":src$full$$h[742]},"future":{"one":src$full$$h[743],"other":src$full$$h[743]}},"minute":{"past":{"one":src$full$$h[744],"other":src$full$$h[744]},"future":{"one":src$full$$h[745],"other":src$full$$h[745]}},"hour":{"past":{"one":src$full$$h[746],"other":src$full$$h[746]},"future":{"one":src$full$$h[747],"other":src$full$$h[747]}},"day":{"past":{"one":src$full$$h[748],"other":src$full$$h[748]},"future":{"one":src$full$$h[749],"other":src$full$$h[749]}},"month":{"past":{"one":src$full$$h[750],"other":src$full$$h[750]},"future":{"one":src$full$$h[751],"other":src$full$$h[751]}},"year":{"past":{"one":src$full$$h[752],"other":src$full$$h[752]},"future":{"one":src$full$$h[753],"other":src$full$$h[753]}}}});
    $$core$$default.__addLocaleData({locale:"kab", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"kam", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"kde", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"kea", relativeTime:{"second":{"past":{"other":src$full$$h[754]},"future":{"other":src$full$$h[755]}},"minute":{"past":{"other":src$full$$h[756]},"future":{"other":src$full$$h[757]}},"hour":{"past":{"other":src$full$$h[758]},"future":{"other":src$full$$h[759]}},"day":{"past":{"other":src$full$$h[760]},"future":{"other":src$full$$h[761]}},"month":{"past":{"other":src$full$$h[762]},"future":{"other":src$full$$h[763]}},"year":{"past":{"other":src$full$$h[764]},"future":{"other":src$full$$h[765]}}}});
    $$core$$default.__addLocaleData({locale:"khq", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"ki", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"kk", relativeTime:{"second":{"past":{"one":src$full$$h[766],"other":src$full$$h[766]},"future":{"one":src$full$$h[767],"other":src$full$$h[767]}},"minute":{"past":{"one":src$full$$h[768],"other":src$full$$h[768]},"future":{"one":src$full$$h[769],"other":src$full$$h[769]}},"hour":{"past":{"one":src$full$$h[770],"other":src$full$$h[770]},"future":{"one":src$full$$h[771],"other":src$full$$h[771]}},"day":{"past":{"one":src$full$$h[772],"other":src$full$$h[772]},"future":{"one":src$full$$h[773],"other":src$full$$h[773]}},"month":{"past":{"one":src$full$$h[774],"other":src$full$$h[774]},"future":{"one":src$full$$h[775],"other":src$full$$h[775]}},"year":{"past":{"one":src$full$$h[776],"other":src$full$$h[776]},"future":{"one":src$full$$h[777],"other":src$full$$h[777]}}}});
    $$core$$default.__addLocaleData({locale:"kkj", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"kl", relativeTime:{"second":{"past":{"one":src$full$$h[778],"other":src$full$$h[778]},"future":{"one":src$full$$h[779],"other":src$full$$h[779]}},"minute":{"past":{"one":src$full$$h[780],"other":src$full$$h[780]},"future":{"one":src$full$$h[781],"other":src$full$$h[781]}},"hour":{"past":{"one":src$full$$h[782],"other":src$full$$h[782]},"future":{"one":src$full$$h[783],"other":src$full$$h[783]}},"day":{"past":{"one":src$full$$h[784],"other":src$full$$h[784]},"future":{"one":src$full$$h[785],"other":src$full$$h[785]}},"month":{"past":{"one":src$full$$h[786],"other":src$full$$h[786]},"future":{"one":src$full$$h[787],"other":src$full$$h[787]}},"year":{"past":{"one":src$full$$h[788],"other":src$full$$h[788]},"future":{"one":src$full$$h[789],"other":src$full$$h[789]}}}});
    $$core$$default.__addLocaleData({locale:"kln", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"km", relativeTime:{"second":{"past":{"other":src$full$$h[790]},"future":{"other":src$full$$h[791]}},"minute":{"past":{"other":src$full$$h[792]},"future":{"other":src$full$$h[793]}},"hour":{"past":{"other":src$full$$h[794]},"future":{"other":src$full$$h[795]}},"day":{"past":{"other":src$full$$h[796]},"future":{"other":src$full$$h[797]}},"month":{"past":{"other":src$full$$h[798]},"future":{"other":src$full$$h[799]}},"year":{"past":{"other":src$full$$h[800]},"future":{"other":src$full$$h[801]}}}});
    $$core$$default.__addLocaleData({locale:"kn", relativeTime:{"second":{"past":{"one":src$full$$h[802],"other":src$full$$h[802]},"future":{"one":src$full$$h[803],"other":src$full$$h[803]}},"minute":{"past":{"one":src$full$$h[804],"other":src$full$$h[804]},"future":{"one":src$full$$h[805],"other":src$full$$h[805]}},"hour":{"past":{"one":src$full$$h[806],"other":src$full$$h[806]},"future":{"one":src$full$$h[807],"other":src$full$$h[807]}},"day":{"past":{"one":src$full$$h[808],"other":src$full$$h[808]},"future":{"one":src$full$$h[809],"other":src$full$$h[809]}},"month":{"past":{"one":src$full$$h[810],"other":src$full$$h[810]},"future":{"one":src$full$$h[811],"other":src$full$$h[811]}},"year":{"past":{"one":src$full$$h[812],"other":src$full$$h[812]},"future":{"one":src$full$$h[813],"other":src$full$$h[813]}}}});
    $$core$$default.__addLocaleData({locale:"ko", relativeTime:{"second":{"past":{"other":src$full$$h[814]},"future":{"other":src$full$$h[815]}},"minute":{"past":{"other":src$full$$h[816]},"future":{"other":src$full$$h[817]}},"hour":{"past":{"other":src$full$$h[818]},"future":{"other":src$full$$h[819]}},"day":{"past":{"other":src$full$$h[820]},"future":{"other":src$full$$h[821]}},"month":{"past":{"other":src$full$$h[822]},"future":{"other":src$full$$h[823]}},"year":{"past":{"other":src$full$$h[824]},"future":{"other":src$full$$h[825]}}}});
    $$core$$default.__addLocaleData({locale:"kok", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"ks", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"ksb", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"ksf", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"ksh", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"kw", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"ky", relativeTime:{"second":{"past":{"one":src$full$$h[826],"other":src$full$$h[826]},"future":{"one":src$full$$h[827],"other":src$full$$h[827]}},"minute":{"past":{"one":src$full$$h[828],"other":src$full$$h[828]},"future":{"one":src$full$$h[829],"other":src$full$$h[829]}},"hour":{"past":{"one":src$full$$h[830],"other":src$full$$h[830]},"future":{"one":src$full$$h[831],"other":src$full$$h[831]}},"day":{"past":{"one":src$full$$h[832],"other":src$full$$h[832]},"future":{"one":src$full$$h[833],"other":src$full$$h[833]}},"month":{"past":{"one":src$full$$h[834],"other":src$full$$h[834]},"future":{"one":src$full$$h[835],"other":src$full$$h[835]}},"year":{"past":{"one":src$full$$h[836],"other":src$full$$h[836]},"future":{"one":src$full$$h[837],"other":src$full$$h[837]}}}});
    $$core$$default.__addLocaleData({locale:"lag", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"lg", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"lkt", relativeTime:{"second":{"past":{"other":src$full$$h[838]},"future":{"other":src$full$$h[839]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[840]},"future":{"other":src$full$$h[841]}},"day":{"past":{"other":src$full$$h[842]},"future":{"other":src$full$$h[843]}},"month":{"past":{"other":src$full$$h[844]},"future":{"other":src$full$$h[845]}},"year":{"past":{"other":src$full$$h[846]},"future":{"other":src$full$$h[847]}}}});
    $$core$$default.__addLocaleData({locale:"ln", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"lo", relativeTime:{"second":{"past":{"other":src$full$$h[848]},"future":{"other":src$full$$h[849]}},"minute":{"past":{"other":src$full$$h[850]},"future":{"other":src$full$$h[851]}},"hour":{"past":{"other":src$full$$h[852]},"future":{"other":src$full$$h[853]}},"day":{"past":{"other":src$full$$h[854]},"future":{"other":src$full$$h[855]}},"month":{"past":{"other":src$full$$h[856]},"future":{"other":src$full$$h[857]}},"year":{"past":{"other":src$full$$h[858]},"future":{"other":src$full$$h[859]}}}});
    $$core$$default.__addLocaleData({locale:"lt", relativeTime:{"second":{"past":{"one":src$full$$h[860],"few":src$full$$h[861],"many":src$full$$h[862],"other":src$full$$h[863]},"future":{"one":src$full$$h[864],"few":src$full$$h[865],"many":src$full$$h[864],"other":src$full$$h[865]}},"minute":{"past":{"one":src$full$$h[866],"few":src$full$$h[867],"many":src$full$$h[868],"other":src$full$$h[869]},"future":{"one":src$full$$h[870],"few":src$full$$h[871],"many":src$full$$h[870],"other":src$full$$h[871]}},"hour":{"past":{"one":src$full$$h[872],"few":src$full$$h[873],"many":src$full$$h[874],"other":src$full$$h[875]},"future":{"one":src$full$$h[876],"few":src$full$$h[877],"many":src$full$$h[876],"other":src$full$$h[877]}},"day":{"past":{"one":src$full$$h[878],"few":src$full$$h[879],"many":src$full$$h[880],"other":src$full$$h[881]},"future":{"one":src$full$$h[882],"few":src$full$$h[883],"many":src$full$$h[882],"other":src$full$$h[883]}},"month":{"past":{"one":src$full$$h[884],"few":src$full$$h[885],"many":src$full$$h[886],"other":src$full$$h[887]},"future":{"one":src$full$$h[888],"few":src$full$$h[889],"many":src$full$$h[888],"other":src$full$$h[889]}},"year":{"past":{"one":src$full$$h[890],"few":src$full$$h[890],"many":src$full$$h[891],"other":src$full$$h[891]},"future":{"one":src$full$$h[892],"few":src$full$$h[892],"many":src$full$$h[892],"other":src$full$$h[892]}}}});
    $$core$$default.__addLocaleData({locale:"lu", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"luo", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"luy", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"lv", relativeTime:{"second":{"past":{"zero":src$full$$h[893],"one":src$full$$h[894],"other":src$full$$h[893]},"future":{"zero":src$full$$h[895],"one":src$full$$h[896],"other":src$full$$h[895]}},"minute":{"past":{"zero":src$full$$h[897],"one":src$full$$h[898],"other":src$full$$h[897]},"future":{"zero":src$full$$h[899],"one":src$full$$h[900],"other":src$full$$h[899]}},"hour":{"past":{"zero":src$full$$h[901],"one":src$full$$h[902],"other":src$full$$h[901]},"future":{"zero":src$full$$h[903],"one":src$full$$h[904],"other":src$full$$h[903]}},"day":{"past":{"zero":src$full$$h[905],"one":src$full$$h[906],"other":src$full$$h[905]},"future":{"zero":src$full$$h[907],"one":src$full$$h[908],"other":src$full$$h[907]}},"month":{"past":{"zero":src$full$$h[909],"one":src$full$$h[910],"other":src$full$$h[909]},"future":{"zero":src$full$$h[911],"one":src$full$$h[912],"other":src$full$$h[911]}},"year":{"past":{"zero":src$full$$h[913],"one":src$full$$h[914],"other":src$full$$h[913]},"future":{"zero":src$full$$h[915],"one":src$full$$h[916],"other":src$full$$h[915]}}}});
    $$core$$default.__addLocaleData({locale:"mas", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"mer", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"mfe", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"mg", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"mgh", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"mgo", relativeTime:{"second":{"past":{"one":src$full$$h[32],"other":src$full$$h[32]},"future":{"one":src$full$$h[1],"other":src$full$$h[1]}},"minute":{"past":{"one":src$full$$h[2],"other":src$full$$h[2]},"future":{"one":src$full$$h[3],"other":src$full$$h[3]}},"hour":{"past":{"one":src$full$$h[4],"other":src$full$$h[4]},"future":{"one":src$full$$h[5],"other":src$full$$h[5]}},"day":{"past":{"one":src$full$$h[6],"other":src$full$$h[6]},"future":{"one":src$full$$h[7],"other":src$full$$h[7]}},"month":{"past":{"one":src$full$$h[8],"other":src$full$$h[8]},"future":{"one":src$full$$h[9],"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"mk", relativeTime:{"second":{"past":{"one":src$full$$h[917],"other":src$full$$h[918]},"future":{"one":src$full$$h[919],"other":src$full$$h[920]}},"minute":{"past":{"one":src$full$$h[921],"other":src$full$$h[922]},"future":{"one":src$full$$h[923],"other":src$full$$h[924]}},"hour":{"past":{"one":src$full$$h[925],"other":src$full$$h[926]},"future":{"one":src$full$$h[927],"other":src$full$$h[928]}},"day":{"past":{"one":src$full$$h[929],"other":src$full$$h[930]},"future":{"one":src$full$$h[931],"other":src$full$$h[932]}},"month":{"past":{"one":src$full$$h[933],"other":src$full$$h[934]},"future":{"one":src$full$$h[935],"other":src$full$$h[936]}},"year":{"past":{"one":src$full$$h[937],"other":src$full$$h[938]},"future":{"one":src$full$$h[939],"other":src$full$$h[940]}}}});
    $$core$$default.__addLocaleData({locale:"ml", relativeTime:{"second":{"past":{"one":src$full$$h[941],"other":src$full$$h[941]},"future":{"one":src$full$$h[942],"other":src$full$$h[942]}},"minute":{"past":{"one":src$full$$h[943],"other":src$full$$h[943]},"future":{"one":src$full$$h[944],"other":src$full$$h[945]}},"hour":{"past":{"one":src$full$$h[946],"other":src$full$$h[946]},"future":{"one":src$full$$h[947],"other":src$full$$h[947]}},"day":{"past":{"one":src$full$$h[948],"other":src$full$$h[948]},"future":{"one":src$full$$h[949],"other":src$full$$h[949]}},"month":{"past":{"one":src$full$$h[950],"other":src$full$$h[950]},"future":{"one":src$full$$h[951],"other":src$full$$h[951]}},"year":{"past":{"one":src$full$$h[952],"other":src$full$$h[952]},"future":{"one":src$full$$h[953],"other":src$full$$h[953]}}}});
    $$core$$default.__addLocaleData({locale:"mn", relativeTime:{"second":{"past":{"one":src$full$$h[954],"other":src$full$$h[954]},"future":{"one":src$full$$h[955],"other":src$full$$h[955]}},"minute":{"past":{"one":src$full$$h[956],"other":src$full$$h[956]},"future":{"one":src$full$$h[957],"other":src$full$$h[957]}},"hour":{"past":{"one":src$full$$h[958],"other":src$full$$h[958]},"future":{"one":src$full$$h[959],"other":src$full$$h[959]}},"day":{"past":{"one":src$full$$h[960],"other":src$full$$h[960]},"future":{"one":src$full$$h[961],"other":src$full$$h[961]}},"month":{"past":{"one":src$full$$h[962],"other":src$full$$h[962]},"future":{"one":src$full$$h[963],"other":src$full$$h[963]}},"year":{"past":{"one":src$full$$h[964],"other":src$full$$h[964]},"future":{"one":src$full$$h[965],"other":src$full$$h[965]}}}});
    $$core$$default.__addLocaleData({locale:"mr", relativeTime:{"second":{"past":{"one":src$full$$h[966],"other":src$full$$h[967]},"future":{"one":src$full$$h[968],"other":src$full$$h[969]}},"minute":{"past":{"one":src$full$$h[970],"other":src$full$$h[971]},"future":{"one":src$full$$h[972],"other":src$full$$h[973]}},"hour":{"past":{"one":src$full$$h[974],"other":src$full$$h[975]},"future":{"one":src$full$$h[976],"other":src$full$$h[977]}},"day":{"past":{"one":src$full$$h[978],"other":src$full$$h[979]},"future":{"one":src$full$$h[980],"other":src$full$$h[981]}},"month":{"past":{"one":src$full$$h[982],"other":src$full$$h[983]},"future":{"one":src$full$$h[984],"other":src$full$$h[985]}},"year":{"past":{"one":src$full$$h[986],"other":src$full$$h[987]},"future":{"one":src$full$$h[988],"other":src$full$$h[989]}}}});
    $$core$$default.__addLocaleData({locale:"ms", relativeTime:{"second":{"past":{"other":src$full$$h[990]},"future":{"other":src$full$$h[991]}},"minute":{"past":{"other":src$full$$h[992]},"future":{"other":src$full$$h[993]}},"hour":{"past":{"other":src$full$$h[994]},"future":{"other":src$full$$h[666]}},"day":{"past":{"other":src$full$$h[995]},"future":{"other":src$full$$h[668]}},"month":{"past":{"other":src$full$$h[996]},"future":{"other":src$full$$h[670]}},"year":{"past":{"other":src$full$$h[997]},"future":{"other":src$full$$h[672]}}}});
    $$core$$default.__addLocaleData({locale:"mt", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"one":src$full$$h[998],"few":src$full$$h[999],"many":src$full$$h[999],"other":src$full$$h[999]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"mua", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"my", relativeTime:{"second":{"past":{"other":src$full$$h[1000]},"future":{"other":src$full$$h[1001]}},"minute":{"past":{"other":src$full$$h[1002]},"future":{"other":src$full$$h[1003]}},"hour":{"past":{"other":src$full$$h[1004]},"future":{"other":src$full$$h[1005]}},"day":{"past":{"other":src$full$$h[1006]},"future":{"other":src$full$$h[1007]}},"month":{"past":{"other":src$full$$h[1008]},"future":{"other":src$full$$h[1009]}},"year":{"past":{"other":src$full$$h[1010]},"future":{"other":src$full$$h[1011]}}}});
    $$core$$default.__addLocaleData({locale:"naq", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"nb", relativeTime:{"second":{"past":{"one":src$full$$h[261],"other":src$full$$h[262]},"future":{"one":src$full$$h[263],"other":src$full$$h[264]}},"minute":{"past":{"one":src$full$$h[1012],"other":src$full$$h[266]},"future":{"one":src$full$$h[1013],"other":src$full$$h[268]}},"hour":{"past":{"one":src$full$$h[269],"other":src$full$$h[270]},"future":{"one":src$full$$h[271],"other":src$full$$h[272]}},"day":{"past":{"one":src$full$$h[273],"other":src$full$$h[273]},"future":{"one":src$full$$h[274],"other":src$full$$h[274]}},"month":{"past":{"one":src$full$$h[275],"other":src$full$$h[276]},"future":{"one":src$full$$h[277],"other":src$full$$h[278]}},"year":{"past":{"one":src$full$$h[279],"other":src$full$$h[279]},"future":{"one":src$full$$h[280],"other":src$full$$h[280]}}}});
    $$core$$default.__addLocaleData({locale:"nd", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"ne", relativeTime:{"second":{"past":{"one":src$full$$h[1014],"other":src$full$$h[1014]},"future":{"one":src$full$$h[1015],"other":src$full$$h[1015]}},"minute":{"past":{"one":src$full$$h[1016],"other":src$full$$h[1016]},"future":{"one":src$full$$h[1017],"other":src$full$$h[1017]}},"hour":{"past":{"one":src$full$$h[1018],"other":src$full$$h[1018]},"future":{"one":src$full$$h[1019],"other":src$full$$h[1019]}},"day":{"past":{"one":src$full$$h[1020],"other":src$full$$h[1020]},"future":{"one":src$full$$h[1021],"other":src$full$$h[1021]}},"month":{"past":{"one":src$full$$h[1022],"other":src$full$$h[1022]},"future":{"one":src$full$$h[1023],"other":src$full$$h[1023]}},"year":{"past":{"one":src$full$$h[1024],"other":src$full$$h[1024]},"future":{"one":src$full$$h[1025],"other":src$full$$h[1025]}}}});
    $$core$$default.__addLocaleData({locale:"nl", relativeTime:{"second":{"past":{"one":src$full$$h[1026],"other":src$full$$h[1027]},"future":{"one":src$full$$h[1028],"other":src$full$$h[1029]}},"minute":{"past":{"one":src$full$$h[1030],"other":src$full$$h[1031]},"future":{"one":src$full$$h[1032],"other":src$full$$h[1033]}},"hour":{"past":{"one":src$full$$h[1034],"other":src$full$$h[1034]},"future":{"one":src$full$$h[1035],"other":src$full$$h[1035]}},"day":{"past":{"one":src$full$$h[1036],"other":src$full$$h[1037]},"future":{"one":src$full$$h[1038],"other":src$full$$h[1039]}},"month":{"past":{"one":src$full$$h[1040],"other":src$full$$h[1041]},"future":{"one":src$full$$h[1042],"other":src$full$$h[1043]}},"year":{"past":{"one":src$full$$h[1044],"other":src$full$$h[1044]},"future":{"one":src$full$$h[1045],"other":src$full$$h[1045]}}}});
    $$core$$default.__addLocaleData({locale:"nmg", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"nn", relativeTime:{"second":{"past":{"one":src$full$$h[261],"other":src$full$$h[262]},"future":{"one":src$full$$h[263],"other":src$full$$h[264]}},"minute":{"past":{"one":src$full$$h[1012],"other":src$full$$h[266]},"future":{"one":src$full$$h[1013],"other":src$full$$h[268]}},"hour":{"past":{"one":src$full$$h[269],"other":src$full$$h[270]},"future":{"one":src$full$$h[271],"other":src$full$$h[272]}},"day":{"past":{"one":src$full$$h[273],"other":src$full$$h[273]},"future":{"one":src$full$$h[274],"other":src$full$$h[274]}},"month":{"past":{"one":src$full$$h[275],"other":src$full$$h[276]},"future":{"one":src$full$$h[277],"other":src$full$$h[278]}},"year":{"past":{"one":src$full$$h[279],"other":src$full$$h[279]},"future":{"one":src$full$$h[280],"other":src$full$$h[280]}}}});
    $$core$$default.__addLocaleData({locale:"nnh", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"nr", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"nso", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"nus", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"nyn", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"om", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"or", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"os", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"one":src$full$$h[1046],"other":src$full$$h[1046]},"future":{"one":src$full$$h[1047],"other":src$full$$h[1047]}},"day":{"past":{"one":src$full$$h[1048],"other":src$full$$h[1049]},"future":{"one":src$full$$h[1050],"other":src$full$$h[1050]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"pa", relativeTime:{"second":{"past":{"one":src$full$$h[1051],"other":src$full$$h[1051]},"future":{"one":src$full$$h[1052],"other":src$full$$h[1052]}},"minute":{"past":{"one":src$full$$h[1053],"other":src$full$$h[1053]},"future":{"one":src$full$$h[1054],"other":src$full$$h[1054]}},"hour":{"past":{"one":src$full$$h[1055],"other":src$full$$h[1056]},"future":{"one":src$full$$h[1057],"other":src$full$$h[1057]}},"day":{"past":{"one":src$full$$h[1058],"other":src$full$$h[1058]},"future":{"one":src$full$$h[1059],"other":src$full$$h[1060]}},"month":{"past":{"one":src$full$$h[1061],"other":src$full$$h[1061]},"future":{"one":src$full$$h[1062],"other":src$full$$h[1062]}},"year":{"past":{"one":src$full$$h[1063],"other":src$full$$h[1063]},"future":{"one":src$full$$h[1064],"other":src$full$$h[1064]}}}});
    $$core$$default.__addLocaleData({locale:"pl", relativeTime:{"second":{"past":{"one":src$full$$h[1065],"few":src$full$$h[1066],"many":src$full$$h[1067],"other":src$full$$h[1066]},"future":{"one":src$full$$h[1068],"few":src$full$$h[1069],"many":src$full$$h[1070],"other":src$full$$h[1069]}},"minute":{"past":{"one":src$full$$h[1071],"few":src$full$$h[1072],"many":src$full$$h[1073],"other":src$full$$h[1072]},"future":{"one":src$full$$h[1074],"few":src$full$$h[1075],"many":src$full$$h[1076],"other":src$full$$h[1075]}},"hour":{"past":{"one":src$full$$h[1077],"few":src$full$$h[1078],"many":src$full$$h[1079],"other":src$full$$h[1078]},"future":{"one":src$full$$h[1080],"few":src$full$$h[1081],"many":src$full$$h[1082],"other":src$full$$h[1081]}},"day":{"past":{"one":src$full$$h[1083],"few":src$full$$h[1084],"many":src$full$$h[1084],"other":src$full$$h[1085]},"future":{"one":src$full$$h[1086],"few":src$full$$h[1087],"many":src$full$$h[1087],"other":src$full$$h[1088]}},"month":{"past":{"one":src$full$$h[1089],"few":src$full$$h[1090],"many":src$full$$h[1091],"other":src$full$$h[1092]},"future":{"one":src$full$$h[1093],"few":src$full$$h[1094],"many":src$full$$h[1095],"other":src$full$$h[1096]}},"year":{"past":{"one":src$full$$h[1097],"few":src$full$$h[1098],"many":src$full$$h[1099],"other":src$full$$h[1100]},"future":{"one":src$full$$h[1101],"few":src$full$$h[1102],"many":src$full$$h[1103],"other":src$full$$h[1104]}}}});
    $$core$$default.__addLocaleData({locale:"ps", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"pt", relativeTime:{"second":{"past":{"one":src$full$$h[1105],"other":src$full$$h[1106]},"future":{"one":src$full$$h[1107],"other":src$full$$h[1108]}},"minute":{"past":{"one":src$full$$h[1109],"other":src$full$$h[1110]},"future":{"one":src$full$$h[1111],"other":src$full$$h[1112]}},"hour":{"past":{"one":src$full$$h[1113],"other":src$full$$h[1114]},"future":{"one":src$full$$h[1115],"other":src$full$$h[1116]}},"day":{"past":{"one":src$full$$h[1117],"other":src$full$$h[1118]},"future":{"one":src$full$$h[1119],"other":src$full$$h[1120]}},"month":{"past":{"one":src$full$$h[1121],"other":src$full$$h[1122]},"future":{"one":src$full$$h[1123],"other":src$full$$h[1124]}},"year":{"past":{"one":src$full$$h[1125],"other":src$full$$h[1126]},"future":{"one":src$full$$h[1127],"other":src$full$$h[1128]}}}});
    $$core$$default.__addLocaleData({locale:"rm", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"rn", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"ro", relativeTime:{"second":{"past":{"one":src$full$$h[1129],"few":src$full$$h[1130],"other":src$full$$h[1131]},"future":{"one":src$full$$h[1132],"few":src$full$$h[1133],"other":src$full$$h[1134]}},"minute":{"past":{"one":src$full$$h[1135],"few":src$full$$h[1136],"other":src$full$$h[1137]},"future":{"one":src$full$$h[1138],"few":src$full$$h[1139],"other":src$full$$h[1140]}},"hour":{"past":{"one":src$full$$h[1141],"few":src$full$$h[1142],"other":src$full$$h[1143]},"future":{"one":src$full$$h[1144],"few":src$full$$h[1145],"other":src$full$$h[1146]}},"day":{"past":{"one":src$full$$h[1147],"few":src$full$$h[1148],"other":src$full$$h[1149]},"future":{"one":src$full$$h[1150],"few":src$full$$h[1151],"other":src$full$$h[1152]}},"month":{"past":{"one":src$full$$h[1153],"few":src$full$$h[1154],"other":src$full$$h[1155]},"future":{"one":src$full$$h[1156],"few":src$full$$h[1157],"other":src$full$$h[1158]}},"year":{"past":{"one":src$full$$h[1159],"few":src$full$$h[1160],"other":src$full$$h[1161]},"future":{"one":src$full$$h[1162],"few":src$full$$h[1163],"other":src$full$$h[1164]}}}});
    $$core$$default.__addLocaleData({locale:"rof", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"ru", relativeTime:{"second":{"past":{"one":src$full$$h[1165],"few":src$full$$h[1166],"many":src$full$$h[1167],"other":src$full$$h[1166]},"future":{"one":src$full$$h[1168],"few":src$full$$h[1169],"many":src$full$$h[1170],"other":src$full$$h[1169]}},"minute":{"past":{"one":src$full$$h[1171],"few":src$full$$h[1172],"many":src$full$$h[1173],"other":src$full$$h[1172]},"future":{"one":src$full$$h[1174],"few":src$full$$h[1175],"many":src$full$$h[1176],"other":src$full$$h[1175]}},"hour":{"past":{"one":src$full$$h[1177],"few":src$full$$h[1178],"many":src$full$$h[1179],"other":src$full$$h[1178]},"future":{"one":src$full$$h[1180],"few":src$full$$h[1181],"many":src$full$$h[1182],"other":src$full$$h[1181]}},"day":{"past":{"one":src$full$$h[1183],"few":src$full$$h[1184],"many":src$full$$h[1185],"other":src$full$$h[1184]},"future":{"one":src$full$$h[1186],"few":src$full$$h[1187],"many":src$full$$h[1188],"other":src$full$$h[1187]}},"month":{"past":{"one":src$full$$h[1189],"few":src$full$$h[1190],"many":src$full$$h[1191],"other":src$full$$h[1190]},"future":{"one":src$full$$h[1192],"few":src$full$$h[1193],"many":src$full$$h[1194],"other":src$full$$h[1193]}},"year":{"past":{"one":src$full$$h[1195],"few":src$full$$h[1196],"many":src$full$$h[1197],"other":src$full$$h[1196]},"future":{"one":src$full$$h[1198],"few":src$full$$h[1199],"many":src$full$$h[1200],"other":src$full$$h[1199]}}}});
    $$core$$default.__addLocaleData({locale:"rw", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"rwk", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"sah", relativeTime:{"second":{"past":{"other":src$full$$h[1201]},"future":{"other":src$full$$h[1202]}},"minute":{"past":{"other":src$full$$h[1203]},"future":{"other":src$full$$h[1204]}},"hour":{"past":{"other":src$full$$h[1205]},"future":{"other":src$full$$h[1206]}},"day":{"past":{"other":src$full$$h[1207]},"future":{"other":src$full$$h[1208]}},"month":{"past":{"other":src$full$$h[1209]},"future":{"other":src$full$$h[1210]}},"year":{"past":{"other":src$full$$h[1211]},"future":{"other":src$full$$h[1212]}}}});
    $$core$$default.__addLocaleData({locale:"saq", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"sbp", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"se", relativeTime:{"second":{"past":{"one":src$full$$h[1213],"two":src$full$$h[1214],"other":src$full$$h[1214]},"future":{"one":src$full$$h[1215],"two":src$full$$h[1216],"other":src$full$$h[1216]}},"minute":{"past":{"one":src$full$$h[1217],"two":src$full$$h[1218],"other":src$full$$h[1218]},"future":{"one":src$full$$h[1219],"two":src$full$$h[1220],"other":src$full$$h[1220]}},"hour":{"past":{"one":src$full$$h[1221],"two":src$full$$h[1222],"other":src$full$$h[1222]},"future":{"one":src$full$$h[1223],"two":src$full$$h[1224],"other":src$full$$h[1224]}},"day":{"past":{"one":src$full$$h[1225],"two":src$full$$h[1226],"other":src$full$$h[1226]},"future":{"one":src$full$$h[1227],"two":src$full$$h[1228],"other":src$full$$h[1229]}},"month":{"past":{"one":src$full$$h[1230],"two":src$full$$h[1230],"other":src$full$$h[1230]},"future":{"one":src$full$$h[1231],"two":src$full$$h[1231],"other":src$full$$h[1231]}},"year":{"past":{"one":src$full$$h[1232],"two":src$full$$h[1233],"other":src$full$$h[1233]},"future":{"one":src$full$$h[1234],"two":src$full$$h[1235],"other":src$full$$h[1235]}}}});
    $$core$$default.__addLocaleData({locale:"seh", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"ses", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"sg", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"shi", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"si", relativeTime:{"second":{"past":{"one":src$full$$h[1236],"other":src$full$$h[1236]},"future":{"one":src$full$$h[1237],"other":src$full$$h[1237]}},"minute":{"past":{"one":src$full$$h[1238],"other":src$full$$h[1238]},"future":{"one":src$full$$h[1239],"other":src$full$$h[1239]}},"hour":{"past":{"one":src$full$$h[1240],"other":src$full$$h[1240]},"future":{"one":src$full$$h[1241],"other":src$full$$h[1241]}},"day":{"past":{"one":src$full$$h[1242],"other":src$full$$h[1242]},"future":{"one":src$full$$h[1243],"other":src$full$$h[1243]}},"month":{"past":{"one":src$full$$h[1244],"other":src$full$$h[1244]},"future":{"one":src$full$$h[1245],"other":src$full$$h[1245]}},"year":{"past":{"one":src$full$$h[1246],"other":src$full$$h[1246]},"future":{"one":src$full$$h[1247],"other":src$full$$h[1247]}}}});
    $$core$$default.__addLocaleData({locale:"sk", relativeTime:{"second":{"past":{"one":src$full$$h[1248],"few":src$full$$h[1249],"many":src$full$$h[1249],"other":src$full$$h[1249]},"future":{"one":src$full$$h[1250],"few":src$full$$h[1251],"many":src$full$$h[1251],"other":src$full$$h[1252]}},"minute":{"past":{"one":src$full$$h[1253],"few":src$full$$h[1254],"many":src$full$$h[1254],"other":src$full$$h[1254]},"future":{"one":src$full$$h[1255],"few":src$full$$h[1256],"many":src$full$$h[1256],"other":src$full$$h[1257]}},"hour":{"past":{"one":src$full$$h[1258],"few":src$full$$h[1259],"many":src$full$$h[1259],"other":src$full$$h[1259]},"future":{"one":src$full$$h[1260],"few":src$full$$h[1261],"many":src$full$$h[1261],"other":src$full$$h[1262]}},"day":{"past":{"one":src$full$$h[1263],"few":src$full$$h[1264],"many":src$full$$h[1264],"other":src$full$$h[1264]},"future":{"one":src$full$$h[1265],"few":src$full$$h[1266],"many":src$full$$h[1267],"other":src$full$$h[1268]}},"month":{"past":{"one":src$full$$h[1269],"few":src$full$$h[1270],"many":src$full$$h[1270],"other":src$full$$h[1270]},"future":{"one":src$full$$h[1271],"few":src$full$$h[1272],"many":src$full$$h[1273],"other":src$full$$h[1274]}},"year":{"past":{"one":src$full$$h[1275],"few":src$full$$h[1276],"many":src$full$$h[1276],"other":src$full$$h[1276]},"future":{"one":src$full$$h[1277],"few":src$full$$h[1278],"many":src$full$$h[1279],"other":src$full$$h[1280]}}}});
    $$core$$default.__addLocaleData({locale:"sl", relativeTime:{"second":{"past":{"one":src$full$$h[1281],"two":src$full$$h[1282],"few":src$full$$h[1249],"other":src$full$$h[1249]},"future":{"one":src$full$$h[1283],"two":src$full$$h[1284],"few":src$full$$h[1285],"other":src$full$$h[1284]}},"minute":{"past":{"one":src$full$$h[1286],"two":src$full$$h[1286],"few":src$full$$h[1286],"other":src$full$$h[1286]},"future":{"one":src$full$$h[1287],"two":src$full$$h[1287],"few":src$full$$h[1287],"other":src$full$$h[1287]}},"hour":{"past":{"one":src$full$$h[1288],"two":src$full$$h[1288],"few":src$full$$h[1288],"other":src$full$$h[1288]},"future":{"one":src$full$$h[1289],"two":src$full$$h[1289],"few":src$full$$h[1289],"other":src$full$$h[1289]}},"day":{"past":{"one":src$full$$h[1290],"two":src$full$$h[1291],"few":src$full$$h[1292],"other":src$full$$h[1292]},"future":{"one":src$full$$h[1293],"two":src$full$$h[1294],"few":src$full$$h[1294],"other":src$full$$h[1294]}},"month":{"past":{"one":src$full$$h[1295],"two":src$full$$h[1296],"few":src$full$$h[1296],"other":src$full$$h[1296]},"future":{"one":src$full$$h[1297],"two":src$full$$h[1298],"few":src$full$$h[1299],"other":src$full$$h[1300]}},"year":{"past":{"one":src$full$$h[1301],"two":src$full$$h[1302],"few":src$full$$h[1302],"other":src$full$$h[1302]},"future":{"one":src$full$$h[1303],"two":src$full$$h[1304],"few":src$full$$h[1305],"other":src$full$$h[1306]}}}});
    $$core$$default.__addLocaleData({locale:"sn", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"so", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"sq", relativeTime:{"second":{"past":{"one":src$full$$h[1307],"other":src$full$$h[1308]},"future":{"one":src$full$$h[1309],"other":src$full$$h[1310]}},"minute":{"past":{"one":src$full$$h[1311],"other":src$full$$h[1312]},"future":{"one":src$full$$h[1313],"other":src$full$$h[1314]}},"hour":{"past":{"one":src$full$$h[1315],"other":src$full$$h[1316]},"future":{"one":src$full$$h[1317],"other":src$full$$h[1318]}},"day":{"past":{"one":src$full$$h[1319],"other":src$full$$h[1320]},"future":{"one":src$full$$h[1321],"other":src$full$$h[1322]}},"month":{"past":{"one":src$full$$h[1323],"other":src$full$$h[1324]},"future":{"one":src$full$$h[1325],"other":src$full$$h[1326]}},"year":{"past":{"one":src$full$$h[1327],"other":src$full$$h[1328]},"future":{"one":src$full$$h[1329],"other":src$full$$h[1330]}}}});
    $$core$$default.__addLocaleData({locale:"sr", relativeTime:{"second":{"past":{"one":src$full$$h[1331],"few":src$full$$h[1331],"other":src$full$$h[1332]},"future":{"one":src$full$$h[1333],"few":src$full$$h[1334],"other":src$full$$h[1335]}},"minute":{"past":{"one":src$full$$h[1336],"few":src$full$$h[1336],"other":src$full$$h[1336]},"future":{"one":src$full$$h[1337],"few":src$full$$h[1338],"other":src$full$$h[1338]}},"hour":{"past":{"one":src$full$$h[1339],"few":src$full$$h[1339],"other":src$full$$h[1340]},"future":{"one":src$full$$h[1341],"few":src$full$$h[1342],"other":src$full$$h[1343]}},"day":{"past":{"one":src$full$$h[1344],"few":src$full$$h[1344],"other":src$full$$h[1344]},"future":{"one":src$full$$h[1345],"few":src$full$$h[1346],"other":src$full$$h[1346]}},"month":{"past":{"one":src$full$$h[1347],"few":src$full$$h[1347],"other":src$full$$h[1348]},"future":{"one":src$full$$h[1349],"few":src$full$$h[1350],"other":src$full$$h[1351]}},"year":{"past":{"one":src$full$$h[1352],"few":src$full$$h[1352],"other":src$full$$h[1353]},"future":{"one":src$full$$h[1354],"few":src$full$$h[1355],"other":src$full$$h[1356]}}}});
    $$core$$default.__addLocaleData({locale:"ss", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"ssy", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"st", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"sv", relativeTime:{"second":{"past":{"one":src$full$$h[1357],"other":src$full$$h[1358]},"future":{"one":src$full$$h[263],"other":src$full$$h[264]}},"minute":{"past":{"one":src$full$$h[1359],"other":src$full$$h[1360]},"future":{"one":src$full$$h[267],"other":src$full$$h[1361]}},"hour":{"past":{"one":src$full$$h[1362],"other":src$full$$h[1363]},"future":{"one":src$full$$h[1364],"other":src$full$$h[1365]}},"day":{"past":{"one":src$full$$h[1366],"other":src$full$$h[1367]},"future":{"one":src$full$$h[1368],"other":src$full$$h[1369]}},"month":{"past":{"one":src$full$$h[1370],"other":src$full$$h[1371]},"future":{"one":src$full$$h[1372],"other":src$full$$h[1373]}},"year":{"past":{"one":src$full$$h[1374],"other":src$full$$h[1374]},"future":{"one":src$full$$h[280],"other":src$full$$h[280]}}}});
    $$core$$default.__addLocaleData({locale:"sw", relativeTime:{"second":{"past":{"one":src$full$$h[1375],"other":src$full$$h[1376]},"future":{"one":src$full$$h[1377],"other":src$full$$h[1377]}},"minute":{"past":{"one":src$full$$h[1378],"other":src$full$$h[1379]},"future":{"one":src$full$$h[1380],"other":src$full$$h[1380]}},"hour":{"past":{"one":src$full$$h[1381],"other":src$full$$h[1382]},"future":{"one":src$full$$h[1383],"other":src$full$$h[1383]}},"day":{"past":{"one":src$full$$h[1384],"other":src$full$$h[1385]},"future":{"one":src$full$$h[1386],"other":src$full$$h[1386]}},"month":{"past":{"one":src$full$$h[1387],"other":src$full$$h[1387]},"future":{"one":src$full$$h[1388],"other":src$full$$h[1389]}},"year":{"past":{"one":src$full$$h[1390],"other":src$full$$h[1391]},"future":{"one":src$full$$h[1392],"other":src$full$$h[1393]}}}});
    $$core$$default.__addLocaleData({locale:"swc", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"ta", relativeTime:{"second":{"past":{"one":src$full$$h[1394],"other":src$full$$h[1394]},"future":{"one":src$full$$h[1395],"other":src$full$$h[1396]}},"minute":{"past":{"one":src$full$$h[1397],"other":src$full$$h[1398]},"future":{"one":src$full$$h[1399],"other":src$full$$h[1400]}},"hour":{"past":{"one":src$full$$h[1401],"other":src$full$$h[1401]},"future":{"one":src$full$$h[1402],"other":src$full$$h[1402]}},"day":{"past":{"one":src$full$$h[1403],"other":src$full$$h[1404]},"future":{"one":src$full$$h[1405],"other":src$full$$h[1406]}},"month":{"past":{"one":src$full$$h[1407],"other":src$full$$h[1408]},"future":{"one":src$full$$h[1409],"other":src$full$$h[1410]}},"year":{"past":{"one":src$full$$h[1411],"other":src$full$$h[1412]},"future":{"one":src$full$$h[1413],"other":src$full$$h[1414]}}}});
    $$core$$default.__addLocaleData({locale:"te", relativeTime:{"second":{"past":{"one":src$full$$h[1415],"other":src$full$$h[1416]},"future":{"one":src$full$$h[1417],"other":src$full$$h[1418]}},"minute":{"past":{"one":src$full$$h[1419],"other":src$full$$h[1420]},"future":{"one":src$full$$h[1421],"other":src$full$$h[1422]}},"hour":{"past":{"one":src$full$$h[1423],"other":src$full$$h[1424]},"future":{"one":src$full$$h[1425],"other":src$full$$h[1426]}},"day":{"past":{"one":src$full$$h[1427],"other":src$full$$h[1428]},"future":{"one":src$full$$h[1429],"other":src$full$$h[1430]}},"month":{"past":{"one":src$full$$h[1431],"other":src$full$$h[1432]},"future":{"one":src$full$$h[1433],"other":src$full$$h[1434]}},"year":{"past":{"one":src$full$$h[1435],"other":src$full$$h[1436]},"future":{"one":src$full$$h[1437],"other":src$full$$h[1438]}}}});
    $$core$$default.__addLocaleData({locale:"teo", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"tg", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"th", relativeTime:{"second":{"past":{"other":src$full$$h[1439]},"future":{"other":src$full$$h[1440]}},"minute":{"past":{"other":src$full$$h[1441]},"future":{"other":src$full$$h[1442]}},"hour":{"past":{"other":src$full$$h[1443]},"future":{"other":src$full$$h[1444]}},"day":{"past":{"other":src$full$$h[1445]},"future":{"other":src$full$$h[1446]}},"month":{"past":{"other":src$full$$h[1447]},"future":{"other":src$full$$h[1448]}},"year":{"past":{"other":src$full$$h[1449]},"future":{"other":src$full$$h[1450]}}}});
    $$core$$default.__addLocaleData({locale:"ti", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"tig", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"tn", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"to", relativeTime:{"second":{"past":{"other":src$full$$h[1451]},"future":{"other":src$full$$h[1452]}},"minute":{"past":{"other":src$full$$h[1453]},"future":{"other":src$full$$h[1454]}},"hour":{"past":{"other":src$full$$h[1455]},"future":{"other":src$full$$h[1456]}},"day":{"past":{"other":src$full$$h[1457]},"future":{"other":src$full$$h[1458]}},"month":{"past":{"other":src$full$$h[1459]},"future":{"other":src$full$$h[1460]}},"year":{"past":{"other":src$full$$h[1461]},"future":{"other":src$full$$h[1462]}}}});
    $$core$$default.__addLocaleData({locale:"tr", relativeTime:{"second":{"past":{"one":src$full$$h[1463],"other":src$full$$h[1463]},"future":{"one":src$full$$h[1464],"other":src$full$$h[1464]}},"minute":{"past":{"one":src$full$$h[1465],"other":src$full$$h[1465]},"future":{"one":src$full$$h[1466],"other":src$full$$h[1466]}},"hour":{"past":{"one":src$full$$h[1467],"other":src$full$$h[1467]},"future":{"one":src$full$$h[1468],"other":src$full$$h[1468]}},"day":{"past":{"one":src$full$$h[1469],"other":src$full$$h[1469]},"future":{"one":src$full$$h[1470],"other":src$full$$h[1470]}},"month":{"past":{"one":src$full$$h[1471],"other":src$full$$h[1471]},"future":{"one":src$full$$h[1472],"other":src$full$$h[1472]}},"year":{"past":{"one":src$full$$h[1473],"other":src$full$$h[1473]},"future":{"one":src$full$$h[1474],"other":src$full$$h[1474]}}}});
    $$core$$default.__addLocaleData({locale:"ts", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"twq", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"tzm", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"ug", relativeTime:{"second":{"past":{"one":src$full$$h[1475],"other":src$full$$h[1475]},"future":{"one":src$full$$h[1476],"other":src$full$$h[1476]}},"minute":{"past":{"one":src$full$$h[1477],"other":src$full$$h[1477]},"future":{"one":src$full$$h[1478],"other":src$full$$h[1478]}},"hour":{"past":{"one":src$full$$h[1479],"other":src$full$$h[1479]},"future":{"one":src$full$$h[1480],"other":src$full$$h[1480]}},"day":{"past":{"one":src$full$$h[1481],"other":src$full$$h[1481]},"future":{"one":src$full$$h[1482],"other":src$full$$h[1482]}},"month":{"past":{"one":src$full$$h[1483],"other":src$full$$h[1483]},"future":{"one":src$full$$h[1484],"other":src$full$$h[1484]}},"year":{"past":{"one":src$full$$h[1485],"other":src$full$$h[1485]},"future":{"one":src$full$$h[1486],"other":src$full$$h[1486]}}}});
    $$core$$default.__addLocaleData({locale:"uk", relativeTime:{"second":{"past":{"one":src$full$$h[1487],"few":src$full$$h[1488],"many":src$full$$h[1489],"other":src$full$$h[1488]},"future":{"one":src$full$$h[1168],"few":src$full$$h[1490],"many":src$full$$h[1170],"other":src$full$$h[1490]}},"minute":{"past":{"one":src$full$$h[1491],"few":src$full$$h[1492],"many":src$full$$h[1493],"other":src$full$$h[1492]},"future":{"one":src$full$$h[1494],"few":src$full$$h[1495],"many":src$full$$h[1496],"other":src$full$$h[1495]}},"hour":{"past":{"one":src$full$$h[1497],"few":src$full$$h[1498],"many":src$full$$h[1499],"other":src$full$$h[1498]},"future":{"one":src$full$$h[1500],"few":src$full$$h[1501],"many":src$full$$h[1502],"other":src$full$$h[1501]}},"day":{"past":{"one":src$full$$h[1503],"few":src$full$$h[1504],"many":src$full$$h[1505],"other":src$full$$h[1506]},"future":{"one":src$full$$h[1186],"few":src$full$$h[1507],"many":src$full$$h[1508],"other":src$full$$h[1187]}},"month":{"past":{"one":src$full$$h[1509],"few":src$full$$h[1510],"many":src$full$$h[1511],"other":src$full$$h[1512]},"future":{"one":src$full$$h[1513],"few":src$full$$h[1514],"many":src$full$$h[1515],"other":src$full$$h[1516]}},"year":{"past":{"one":src$full$$h[1517],"few":src$full$$h[1518],"many":src$full$$h[1519],"other":src$full$$h[1520]},"future":{"one":src$full$$h[1521],"few":src$full$$h[1522],"many":src$full$$h[1523],"other":src$full$$h[1524]}}}});
    $$core$$default.__addLocaleData({locale:"ur", relativeTime:{"second":{"past":{"one":src$full$$h[1525],"other":src$full$$h[1525]},"future":{"one":src$full$$h[1526],"other":src$full$$h[1526]}},"minute":{"past":{"one":src$full$$h[1527],"other":src$full$$h[1527]},"future":{"one":src$full$$h[1528],"other":src$full$$h[1528]}},"hour":{"past":{"one":src$full$$h[1529],"other":src$full$$h[1530]},"future":{"one":src$full$$h[1531],"other":src$full$$h[1532]}},"day":{"past":{"one":src$full$$h[1533],"other":src$full$$h[1533]},"future":{"one":src$full$$h[1534],"other":src$full$$h[1534]}},"month":{"past":{"one":src$full$$h[1535],"other":src$full$$h[1536]},"future":{"one":src$full$$h[1537],"other":src$full$$h[1538]}},"year":{"past":{"one":src$full$$h[1539],"other":src$full$$h[1539]},"future":{"one":src$full$$h[1540],"other":src$full$$h[1540]}}}});
    $$core$$default.__addLocaleData({locale:"uz", relativeTime:{"second":{"past":{"one":src$full$$h[1541],"other":src$full$$h[1541]},"future":{"one":src$full$$h[1542],"other":src$full$$h[1542]}},"minute":{"past":{"one":src$full$$h[1543],"other":src$full$$h[1543]},"future":{"one":src$full$$h[1544],"other":src$full$$h[1544]}},"hour":{"past":{"one":src$full$$h[1545],"other":src$full$$h[1545]},"future":{"one":src$full$$h[1546],"other":src$full$$h[1546]}},"day":{"past":{"one":src$full$$h[1547],"other":src$full$$h[1547]},"future":{"one":src$full$$h[1548],"other":src$full$$h[1548]}},"month":{"past":{"one":src$full$$h[1549],"other":src$full$$h[1549]},"future":{"one":src$full$$h[1550],"other":src$full$$h[1550]}},"year":{"past":{"one":src$full$$h[1551],"other":src$full$$h[1551]},"future":{"one":src$full$$h[1552],"other":src$full$$h[1552]}}}});
    $$core$$default.__addLocaleData({locale:"vai", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"ve", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"vi", relativeTime:{"second":{"past":{"other":src$full$$h[1553]},"future":{"other":src$full$$h[1554]}},"minute":{"past":{"other":src$full$$h[1555]},"future":{"other":src$full$$h[1556]}},"hour":{"past":{"other":src$full$$h[1557]},"future":{"other":src$full$$h[1558]}},"day":{"past":{"other":src$full$$h[1559]},"future":{"other":src$full$$h[1560]}},"month":{"past":{"other":src$full$$h[1561]},"future":{"other":src$full$$h[1562]}},"year":{"past":{"other":src$full$$h[1563]},"future":{"other":src$full$$h[1564]}}}});
    $$core$$default.__addLocaleData({locale:"vo", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"vun", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"wae", relativeTime:{"second":{"past":{"one":src$full$$h[1565],"other":src$full$$h[1566]},"future":{"one":src$full$$h[1567],"other":src$full$$h[1568]}},"minute":{"past":{"one":src$full$$h[1569],"other":src$full$$h[1570]},"future":{"one":src$full$$h[1571],"other":src$full$$h[1572]}},"hour":{"past":{"one":src$full$$h[1573],"other":src$full$$h[1574]},"future":{"one":src$full$$h[1575],"other":src$full$$h[1576]}},"day":{"past":{"one":src$full$$h[1577],"other":src$full$$h[1578]},"future":{"one":src$full$$h[1579],"other":src$full$$h[1580]}},"month":{"past":{"one":src$full$$h[1581],"other":src$full$$h[1581]},"future":{"one":src$full$$h[1582],"other":src$full$$h[1582]}},"year":{"past":{"one":src$full$$h[1583],"other":src$full$$h[1584]},"future":{"one":src$full$$h[1585],"other":src$full$$h[1585]}}}});
    $$core$$default.__addLocaleData({locale:"wal", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"xh", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"xog", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"yav", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"yo", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"zgh", relativeTime:{"second":{"past":{"other":src$full$$h[32]},"future":{"other":src$full$$h[1]}},"minute":{"past":{"other":src$full$$h[2]},"future":{"other":src$full$$h[3]}},"hour":{"past":{"other":src$full$$h[4]},"future":{"other":src$full$$h[5]}},"day":{"past":{"other":src$full$$h[6]},"future":{"other":src$full$$h[7]}},"month":{"past":{"other":src$full$$h[8]},"future":{"other":src$full$$h[9]}},"year":{"past":{"other":src$full$$h[10]},"future":{"other":src$full$$h[11]}}}});
    $$core$$default.__addLocaleData({locale:"zh", relativeTime:{"second":{"past":{"other":src$full$$h[1586]},"future":{"other":src$full$$h[1587]}},"minute":{"past":{"other":src$full$$h[1588]},"future":{"other":src$full$$h[1589]}},"hour":{"past":{"other":src$full$$h[1590]},"future":{"other":src$full$$h[1591]}},"day":{"past":{"other":src$full$$h[1592]},"future":{"other":src$full$$h[1593]}},"month":{"past":{"other":src$full$$h[1594]},"future":{"other":src$full$$h[1595]}},"year":{"past":{"other":src$full$$h[1596]},"future":{"other":src$full$$h[1597]}}}});
    $$core$$default.__addLocaleData({locale:"zu", relativeTime:{"second":{"past":{"one":src$full$$h[1598],"other":src$full$$h[1599]},"future":{"one":src$full$$h[1600],"other":src$full$$h[1601]}},"minute":{"past":{"one":src$full$$h[1602],"other":src$full$$h[1603]},"future":{"one":src$full$$h[1604],"other":src$full$$h[1605]}},"hour":{"past":{"one":src$full$$h[1606],"other":src$full$$h[1607]},"future":{"one":src$full$$h[1608],"other":src$full$$h[1609]}},"day":{"past":{"one":src$full$$h[1610],"other":src$full$$h[1611]},"future":{"one":src$full$$h[1612],"other":src$full$$h[1613]}},"month":{"past":{"one":src$full$$h[1614],"other":src$full$$h[1615]},"future":{"one":src$full$$h[1616],"other":src$full$$h[1617]}},"year":{"past":{"one":src$full$$h[1618],"other":src$full$$h[1619]},"future":{"one":src$full$$h[1620],"other":src$full$$h[1621]}}}});
    this['IntlRelativeFormat'] = src$full$$default;
}).call(this);

//# sourceMappingURL=intl-relativeformat.js.map