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
        var format = element.format;

        if (!format) {
            return new $$compiler$$StringFormat(element.id);
        }

        var formats  = this.formats,
            locales  = this.locales,
            pluralFn = this.pluralFn,
            options;

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

    var $$core$$default = $$core$$MessageFormat;

    // -- MessageFormat --------------------------------------------------------

    function $$core$$MessageFormat(message, locales, formats) {
        // Parse string messages into an AST.
        var ast = typeof message === 'string' ?
                $$core$$MessageFormat.__parse(message) : message;

        if (!(ast && ast.type === 'messageFormatPattern')) {
            throw new TypeError('A message must be provided as a String or AST.');
        }

        // Creates a new object with the specified `formats` merged with the default
        // formats.
        formats = this._mergeFormats($$core$$MessageFormat.formats, formats);

        // Defined first because it's used to build the format pattern.
        $$es5$$defineProperty(this, '_locale',  {value: this._resolveLocale(locales)});

        var pluralFn = $$core$$MessageFormat.__localeData__[this._locale].pluralRuleFunction;

        // Compile the `ast` to a pattern that is highly optimized for repeated
        // `format()` invocations. **Note:** This passes the `locales` set provided
        // to the constructor instead of just the resolved locale.
        var pattern = this._compilePattern(ast, locales, formats, pluralFn);

        // "Bind" `format()` method to `this` so it can be passed by reference like
        // the other `Intl` APIs.
        var messageFormat = this;
        this.format = function (values) {
            return messageFormat._format(pattern, values);
        };
    }

    // Default format options used as the prototype of the `formats` provided to the
    // constructor. These are used when constructing the internal Intl.NumberFormat
    // and Intl.DateTimeFormat instances.
    $$es5$$defineProperty($$core$$MessageFormat, 'formats', {
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
    $$es5$$defineProperty($$core$$MessageFormat, '__localeData__', {value: $$es5$$objCreate(null)});
    $$es5$$defineProperty($$core$$MessageFormat, '__addLocaleData', {value: function (data) {
        if (!(data && data.locale)) {
            throw new Error(
                'Locale data provided to IntlMessageFormat is missing a ' +
                '`locale` property'
            );
        }

        if (!data.pluralRuleFunction) {
            throw new Error(
                'Locale data provided to IntlMessageFormat is missing a ' +
                '`pluralRuleFunction` property'
            );
        }

        // Message format locale data only requires the first part of the tag.
        var locale = data.locale.toLowerCase().split('-')[0];

        $$core$$MessageFormat.__localeData__[locale] = data;
    }});

    // Defines `__parse()` static method as an exposed private.
    $$es5$$defineProperty($$core$$MessageFormat, '__parse', {value: intl$messageformat$parser$$default.parse});

    // Define public `defaultLocale` property which defaults to English, but can be
    // set by the developer.
    $$es5$$defineProperty($$core$$MessageFormat, 'defaultLocale', {
        enumerable: true,
        writable  : true,
        value     : undefined
    });

    $$core$$MessageFormat.prototype.resolvedOptions = function () {
        // TODO: Provide anything else?
        return {
            locale: this._locale
        };
    };

    $$core$$MessageFormat.prototype._compilePattern = function (ast, locales, formats, pluralFn) {
        var compiler = new $$compiler$$default(locales, formats, pluralFn);
        return compiler.compile(ast);
    };

    $$core$$MessageFormat.prototype._format = function (pattern, values) {
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
            if (!(values && $$utils$$hop.call(values, id))) {
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

    $$core$$MessageFormat.prototype._mergeFormats = function (defaults, formats) {
        var mergedFormats = {},
            type, mergedType;

        for (type in defaults) {
            if (!$$utils$$hop.call(defaults, type)) { continue; }

            mergedFormats[type] = mergedType = $$es5$$objCreate(defaults[type]);

            if (formats && $$utils$$hop.call(formats, type)) {
                $$utils$$extend(mergedType, formats[type]);
            }
        }

        return mergedFormats;
    };

    $$core$$MessageFormat.prototype._resolveLocale = function (locales) {
        if (!locales) {
            locales = $$core$$MessageFormat.defaultLocale;
        }

        if (typeof locales === 'string') {
            locales = [locales];
        }

        var localeData = $$core$$MessageFormat.__localeData__;
        var i, len, locale;

        for (i = 0, len = locales.length; i < len; i += 1) {
            // We just need the root part of the langage tag.
            locale = locales[i].split('-')[0].toLowerCase();

            // Validate that the langage tag is structurally valid.
            if (!/[a-z]{2,3}/.test(locale)) {
                throw new Error(
                    'Language tag provided to IntlMessageFormat is not ' +
                    'structrually valid: ' + locale
                );
            }

            // Return the first locale for which we have CLDR data registered.
            if ($$utils$$hop.call(localeData, locale)) {
                return locale;
            }
        }

        throw new Error(
            'No locale data has been added to IntlMessageFormat for: ' +
            locales.join(', ')
        );
    };
    var $$en1$$default = {"locale":"en","pluralRuleFunction":function (n) {var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length;n=Math.floor(n);if(i===1&&v===0)return"one";return"other";}};

    $$core$$default.__addLocaleData($$en1$$default);
    $$core$$default.defaultLocale = 'en';

    var intl$messageformat$$default = $$core$$default;

    // Purposely using the same implementation as the Intl.js `Intl` polyfill.
    // Copyright 2013 Andy Earnshaw, MIT License

    var $$es51$$hop = Object.prototype.hasOwnProperty;
    var $$es51$$toString = Object.prototype.toString;

    var $$es51$$realDefineProp = (function () {
        try { return !!Object.defineProperty({}, 'a', {}); }
        catch (e) { return false; }
    })();

    var $$es51$$es3 = !$$es51$$realDefineProp && !Object.prototype.__defineGetter__;

    var $$es51$$defineProperty = $$es51$$realDefineProp ? Object.defineProperty :
            function (obj, name, desc) {

        if ('get' in desc && obj.__defineGetter__) {
            obj.__defineGetter__(name, desc.get);
        } else if (!$$es51$$hop.call(obj, name) || 'value' in desc) {
            obj[name] = desc.value;
        }
    };

    var $$es51$$objCreate = Object.create || function (proto, props) {
        var obj, k;

        function F() {}
        F.prototype = proto;
        obj = new F();

        for (k in props) {
            if ($$es51$$hop.call(props, k)) {
                $$es51$$defineProperty(obj, k, props[k]);
            }
        }

        return obj;
    };

    var $$es51$$arrIndexOf = Array.prototype.indexOf || function (search, fromIndex) {
        /*jshint validthis:true */
        var arr = this;
        if (!arr.length) {
            return -1;
        }

        for (var i = fromIndex || 0, max = arr.length; i < max; i++) {
            if (arr[i] === search) {
                return i;
            }
        }

        return -1;
    };

    var $$es51$$isArray = Array.isArray || function (obj) {
        return $$es51$$toString.call(obj) === '[object Array]';
    };

    var $$es51$$dateNow = Date.now || function () {
        return new Date().getTime();
    };
    /*
    Copyright (c) 2014, Yahoo! Inc. All rights reserved.
    Copyrights licensed under the New BSD License.
    See the accompanying LICENSE file for terms.
    */

    /* jslint esnext: true */

    var $$diff$$round = Math.round;

    function $$diff$$daysToYears (days) {
        // 400 years have 146097 days (taking into account leap year rules)
        return days * 400 / 146097;
    }

    var $$diff$$default = function (dfrom, dto) {
        // Convert to ms timestamps.
        dfrom = +dfrom;
        dto   = +dto;

        var millisecond = $$diff$$round(dto - dfrom),
            second      = $$diff$$round(millisecond / 1000),
            minute      = $$diff$$round(second / 60),
            hour        = $$diff$$round(minute / 60),
            day         = $$diff$$round(hour / 24),
            week        = $$diff$$round(day / 7);

        var rawYears = $$diff$$daysToYears(day),
            month    = $$diff$$round(rawYears * 12),
            year     = $$diff$$round(rawYears);

        return {
            millisecond: millisecond,
            second     : second,
            minute     : minute,
            hour       : hour,
            day        : day,
            week       : week,
            month      : month,
            year       : year
        };
    };

    var $$core1$$default = $$core1$$RelativeFormat;

    // -----------------------------------------------------------------------------

    var $$core1$$FIELDS = ['second', 'minute', 'hour', 'day', 'month', 'year'];
    var $$core1$$STYLES = ['best fit', 'numeric'];

    // -- RelativeFormat -----------------------------------------------------------

    function $$core1$$RelativeFormat(locales, options) {
        options = options || {};

        // Make a copy of `locales` if it's an array, so that it doesn't change
        // since it's used lazily.
        if ($$es51$$isArray(locales)) {
            locales = locales.concat();
        }

        $$es51$$defineProperty(this, '_locale', {value: this._resolveLocale(locales)});
        $$es51$$defineProperty(this, '_locales', {value: locales});
        $$es51$$defineProperty(this, '_options', {value: {
            style: this._resolveStyle(options.style),
            units: this._isValidUnits(options.units) && options.units
        }});

        $$es51$$defineProperty(this, '_messages', {value: $$es51$$objCreate(null)});

        // "Bind" `format()` method to `this` so it can be passed by reference like
        // the other `Intl` APIs.
        var relativeFormat = this;
        this.format = function format(date) {
            return relativeFormat._format(date);
        };
    }

    // Define internal private properties for dealing with locale data.
    $$es51$$defineProperty($$core1$$RelativeFormat, '__localeData__', {value: $$es51$$objCreate(null)});
    $$es51$$defineProperty($$core1$$RelativeFormat, '__addLocaleData', {value: function (data) {
        if (!(data && data.locale)) {
            throw new Error(
                'Locale data provided to IntlRelativeFormat is missing a ' +
                '`locale` property value'
            );
        }

        if (!data.fields) {
            throw new Error(
                'Locale data provided to IntlRelativeFormat is missing a ' +
                '`fields` property value'
            );
        }

        // Add data to IntlMessageFormat.
        intl$messageformat$$default.__addLocaleData(data);

        // Relative format locale data only requires the first part of the tag.
        var locale = data.locale.toLowerCase().split('-')[0];

        $$core1$$RelativeFormat.__localeData__[locale] = data;
    }});

    // Define public `defaultLocale` property which can be set by the developer, or
    // it will be set when the first RelativeFormat instance is created by leveraging
    // the resolved locale from `Intl`.
    $$es51$$defineProperty($$core1$$RelativeFormat, 'defaultLocale', {
        enumerable: true,
        writable  : true,
        value     : undefined
    });

    // Define public `thresholds` property which can be set by the developer, and
    // defaults to relative time thresholds from moment.js.
    $$es51$$defineProperty($$core1$$RelativeFormat, 'thresholds', {
        enumerable: true,

        value: {
            second: 45,  // seconds to minute
            minute: 45,  // minutes to hour
            hour  : 22,  // hours to day
            day   : 26,  // days to month
            month : 11   // months to year
        }
    });

    $$core1$$RelativeFormat.prototype.resolvedOptions = function () {
        return {
            locale: this._locale,
            style : this._options.style,
            units : this._options.units
        };
    };

    $$core1$$RelativeFormat.prototype._compileMessage = function (units) {
        // `this._locales` is the original set of locales the user specificed to the
        // constructor, while `this._locale` is the resolved root locale.
        var locales        = this._locales;
        var resolvedLocale = this._locale;

        var localeData   = $$core1$$RelativeFormat.__localeData__;
        var field        = localeData[resolvedLocale].fields[units];
        var relativeTime = field.relativeTime;
        var future       = '';
        var past         = '';
        var i;

        for (i in relativeTime.future) {
            if (relativeTime.future.hasOwnProperty(i)) {
                future += ' ' + i + ' {' +
                    relativeTime.future[i].replace('{0}', '#') + '}';
            }
        }

        for (i in relativeTime.past) {
            if (relativeTime.past.hasOwnProperty(i)) {
                past += ' ' + i + ' {' +
                    relativeTime.past[i].replace('{0}', '#') + '}';
            }
        }

        var message = '{when, select, future {{0, plural, ' + future + '}}' +
                                     'past {{0, plural, ' + past + '}}}';

        // Create the synthetic IntlMessageFormat instance using the original
        // locales value specified by the user when constructing the the parent
        // IntlRelativeFormat instance.
        return new intl$messageformat$$default(message, locales);
    };

    $$core1$$RelativeFormat.prototype._format = function (date) {
        var now = $$es51$$dateNow();

        if (date === undefined) {
            date = now;
        }

        // Determine if the `date` is valid, and throw a similar error to what
        // `Intl.DateTimeFormat#format()` would throw.
        if (!isFinite(date)) {
            throw new RangeError(
                'The date value provided to IntlRelativeFormat#format() is not ' +
                'in valid range.'
            );
        }

        var diffReport  = $$diff$$default(now, date);
        var units       = this._options.units || this._selectUnits(diffReport);
        var diffInUnits = diffReport[units];

        if (this._options.style !== 'numeric') {
            var relativeUnits = this._resolveRelativeUnits(diffInUnits, units);
            if (relativeUnits) {
                return relativeUnits;
            }
        }

        return this._resolveMessage(units).format({
            '0' : Math.abs(diffInUnits),
            when: diffInUnits < 0 ? 'past' : 'future'
        });
    };

    $$core1$$RelativeFormat.prototype._isValidUnits = function (units) {
        if (!units || $$es51$$arrIndexOf.call($$core1$$FIELDS, units) >= 0) {
            return true;
        }

        if (typeof units === 'string') {
            var suggestion = /s$/.test(units) && units.substr(0, units.length - 1);
            if (suggestion && $$es51$$arrIndexOf.call($$core1$$FIELDS, suggestion) >= 0) {
                throw new Error(
                    '"' + units + '" is not a valid IntlRelativeFormat `units` ' +
                    'value, did you mean: ' + suggestion
                );
            }
        }

        throw new Error(
            '"' + units + '" is not a valid IntlRelativeFormat `units` value, it ' +
            'must be one of: "' + $$core1$$FIELDS.join('", "') + '"'
        );
    };

    $$core1$$RelativeFormat.prototype._resolveLocale = function (locales) {
        if (!locales) {
            locales = $$core1$$RelativeFormat.defaultLocale;
        }

        if (typeof locales === 'string') {
            locales = [locales];
        }

        var hop        = Object.prototype.hasOwnProperty;
        var localeData = $$core1$$RelativeFormat.__localeData__;
        var i, len, locale;

        for (i = 0, len = locales.length; i < len; i += 1) {
            // We just need the root part of the language tag.
            locale = locales[i].split('-')[0].toLowerCase();

            // Validate that the language tag is structurally valid.
            if (!/[a-z]{2,3}/.test(locale)) {
                throw new Error(
                    'Language tag provided to IntlRelativeFormat is not ' +
                    'structrually valid: ' + locale
                );
            }

            // Return the first locale for which we have CLDR data registered.
            if (hop.call(localeData, locale)) {
                return locale;
            }
        }

        throw new Error(
            'No locale data has been added to IntlRelativeFormat for: ' +
            locales.join(', ')
        );
    };

    $$core1$$RelativeFormat.prototype._resolveMessage = function (units) {
        var messages = this._messages;

        // Create a new synthetic message based on the locale data from CLDR.
        if (!messages[units]) {
            messages[units] = this._compileMessage(units);
        }

        return messages[units];
    };

    $$core1$$RelativeFormat.prototype._resolveRelativeUnits = function (diff, units) {
        var field = $$core1$$RelativeFormat.__localeData__[this._locale].fields[units];

        if (field.relative) {
            return field.relative[diff];
        }
    };

    $$core1$$RelativeFormat.prototype._resolveStyle = function (style) {
        // Default to "best fit" style.
        if (!style) {
            return $$core1$$STYLES[0];
        }

        if ($$es51$$arrIndexOf.call($$core1$$STYLES, style) >= 0) {
            return style;
        }

        throw new Error(
            '"' + style + '" is not a valid IntlRelativeFormat `style` value, it ' +
            'must be one of: "' + $$core1$$STYLES.join('", "') + '"'
        );
    };

    $$core1$$RelativeFormat.prototype._selectUnits = function (diffReport) {
        var i, l, units;

        for (i = 0, l = $$core1$$FIELDS.length; i < l; i += 1) {
            units = $$core1$$FIELDS[i];

            if (Math.abs(diffReport[units]) < $$core1$$RelativeFormat.thresholds[units]) {
                break;
            }
        }

        return units;
    };
    var $$en2$$default = {"locale":"en","pluralRuleFunction":function (n) {var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length;n=Math.floor(n);if(i===1&&v===0)return"one";return"other";},"fields":{"second":{"displayName":"Second","relative":{"0":"now"},"relativeTime":{"future":{"one":"in {0} second","other":"in {0} seconds"},"past":{"one":"{0} second ago","other":"{0} seconds ago"}}},"minute":{"displayName":"Minute","relativeTime":{"future":{"one":"in {0} minute","other":"in {0} minutes"},"past":{"one":"{0} minute ago","other":"{0} minutes ago"}}},"hour":{"displayName":"Hour","relativeTime":{"future":{"one":"in {0} hour","other":"in {0} hours"},"past":{"one":"{0} hour ago","other":"{0} hours ago"}}},"day":{"displayName":"Day","relative":{"0":"today","1":"tomorrow","-1":"yesterday"},"relativeTime":{"future":{"one":"in {0} day","other":"in {0} days"},"past":{"one":"{0} day ago","other":"{0} days ago"}}},"month":{"displayName":"Month","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"one":"in {0} month","other":"in {0} months"},"past":{"one":"{0} month ago","other":"{0} months ago"}}},"year":{"displayName":"Year","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"one":"in {0} year","other":"in {0} years"},"past":{"one":"{0} year ago","other":"{0} years ago"}}}}};

    $$core1$$default.__addLocaleData($$en2$$default);
    $$core1$$default.defaultLocale = 'en';

    var intl$relativeformat$$default = $$core1$$default;
    var $$en$$default = {"locale":"en","pluralRuleFunction":function (n) {var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length;n=Math.floor(n);if(i===1&&v===0)return"one";return"other";},"fields":{"second":{"displayName":"Second","relative":{"0":"now"},"relativeTime":{"future":{"one":"in {0} second","other":"in {0} seconds"},"past":{"one":"{0} second ago","other":"{0} seconds ago"}}},"minute":{"displayName":"Minute","relativeTime":{"future":{"one":"in {0} minute","other":"in {0} minutes"},"past":{"one":"{0} minute ago","other":"{0} minutes ago"}}},"hour":{"displayName":"Hour","relativeTime":{"future":{"one":"in {0} hour","other":"in {0} hours"},"past":{"one":"{0} hour ago","other":"{0} hours ago"}}},"day":{"displayName":"Day","relative":{"0":"today","1":"tomorrow","-1":"yesterday"},"relativeTime":{"future":{"one":"in {0} day","other":"in {0} days"},"past":{"one":"{0} day ago","other":"{0} days ago"}}},"month":{"displayName":"Month","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"one":"in {0} month","other":"in {0} months"},"past":{"one":"{0} month ago","other":"{0} months ago"}}},"year":{"displayName":"Year","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"one":"in {0} year","other":"in {0} years"},"past":{"one":"{0} year ago","other":"{0} years ago"}}}}};
    var $$react$$default = React;

    // Purposely using the same implementation as the Intl.js `Intl` polyfill.
    // Copyright 2013 Andy Earnshaw, MIT License

    var $$es52$$hop = Object.prototype.hasOwnProperty;

    var $$es52$$realDefineProp = (function () {
        try { return !!Object.defineProperty({}, 'a', {}); }
        catch (e) { return false; }
    })();

    var $$es52$$es3 = !$$es52$$realDefineProp && !Object.prototype.__defineGetter__;

    var $$es52$$defineProperty = $$es52$$realDefineProp ? Object.defineProperty :
            function (obj, name, desc) {

        if ('get' in desc && obj.__defineGetter__) {
            obj.__defineGetter__(name, desc.get);
        } else if (!$$es52$$hop.call(obj, name) || 'value' in desc) {
            obj[name] = desc.value;
        }
    };

    var $$es52$$objCreate = Object.create || function (proto, props) {
        var obj, k;

        function F() {}
        F.prototype = proto;
        obj = new F();

        for (k in props) {
            if ($$es52$$hop.call(props, k)) {
                $$es52$$defineProperty(obj, k, props[k]);
            }
        }

        return obj;
    };
    var intl$format$cache$$default = intl$format$cache$$createFormatCache;

    // -----------------------------------------------------------------------------

    function intl$format$cache$$createFormatCache(FormatConstructor) {
        var cache = $$es52$$objCreate(null);

        return function () {
            var args    = Array.prototype.slice.call(arguments);
            var cacheId = intl$format$cache$$getCacheId(args);
            var format  = cacheId && cache[cacheId];

            if (!format) {
                format = $$es52$$objCreate(FormatConstructor.prototype);
                FormatConstructor.apply(format, args);

                if (cacheId) {
                    cache[cacheId] = format;
                }
            }

            return format;
        };
    }

    // -- Utilities ----------------------------------------------------------------

    function intl$format$cache$$getCacheId(inputs) {
        // When JSON is not available in the runtime, we will not create a cache id.
        if (typeof JSON === 'undefined') { return; }

        var cacheId = [];

        var i, len, input;

        for (i = 0, len = inputs.length; i < len; i += 1) {
            input = inputs[i];

            if (input && typeof input === 'object') {
                cacheId.push(intl$format$cache$$orderedProps(input));
            } else {
                cacheId.push(input);
            }
        }

        return JSON.stringify(cacheId);
    }

    function intl$format$cache$$orderedProps(obj) {
        var props = [],
            keys  = [];

        var key, i, len, prop;

        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                keys.push(key);
            }
        }

        var orderedKeys = keys.sort();

        for (i = 0, len = orderedKeys.length; i < len; i += 1) {
            key  = orderedKeys[i];
            prop = {};

            prop[key] = obj[key];
            props[i]  = prop;
        }

        return props;
    }

    // -----------------------------------------------------------------------------

    var $$mixin$$typesSpec = {
        locales: $$react$$default.PropTypes.oneOfType([
            $$react$$default.PropTypes.string,
            $$react$$default.PropTypes.array
        ]),

        formats : $$react$$default.PropTypes.object,
        messages: $$react$$default.PropTypes.object
    };

    function $$mixin$$assertIsDate(date, errMsg) {
        // Determine if the `date` is valid by checking if it is finite, which is
        // the same way that `Intl.DateTimeFormat#format()` checks.
        if (!isFinite(date)) {
            throw new TypeError(errMsg);
        }
    }

    var $$mixin$$default = {
        statics: {
            filterFormatOptions: function (obj, defaults) {
                if (!defaults) { defaults = {}; }

                return (this.formatOptions || []).reduce(function (opts, name) {
                    if (obj.hasOwnProperty(name)) {
                        opts[name] = obj[name];
                    } else if (defaults.hasOwnProperty(name)) {
                        opts[name] = defaults[name];
                    }

                    return opts;
                }, {});
            }
        },

        propsTypes       : $$mixin$$typesSpec,
        contextTypes     : $$mixin$$typesSpec,
        childContextTypes: $$mixin$$typesSpec,

        getNumberFormat  : intl$format$cache$$default(Intl.NumberFormat),
        getDateTimeFormat: intl$format$cache$$default(Intl.DateTimeFormat),
        getMessageFormat : intl$format$cache$$default(intl$messageformat$$default),
        getRelativeFormat: intl$format$cache$$default(intl$relativeformat$$default),

        getChildContext: function () {
            var context = this.context;
            var props   = this.props;

            return {
                locales:  props.locales  || context.locales,
                formats:  props.formats  || context.formats,
                messages: props.messages || context.messages
            };
        },

        formatDate: function (date, options) {
            date = new Date(date);
            $$mixin$$assertIsDate(date, 'A date or timestamp must be provided to formatDate()');
            return this._format('date', date, options);
        },

        formatTime: function (date, options) {
            date = new Date(date);
            $$mixin$$assertIsDate(date, 'A date or timestamp must be provided to formatTime()');
            return this._format('time', date, options);
        },

        formatRelative: function (date, options) {
            date = new Date(date);
            $$mixin$$assertIsDate(date, 'A date or timestamp must be provided to formatRelative()');
            return this._format('relative', date, options);
        },

        formatNumber: function (num, options) {
            return this._format('number', num, options);
        },

        formatMessage: function (message, values) {
            var locales = this.props.locales || this.context.locales;
            var formats = this.props.formats || this.context.formats;

            // When `message` is a function, assume it's an IntlMessageFormat
            // instance's `format()` method passed by reference, and call it. This
            // is possible because its `this` will be pre-bound to the instance.
            if (typeof message === 'function') {
                return message(values);
            }

            if (typeof message === 'string') {
                message = this.getMessageFormat(message, locales, formats);
            }

            return message.format(values);
        },

        getIntlMessage: function (path) {
            var messages  = this.props.messages || this.context.messages;
            var pathParts = path.split('.');

            var message;

            try {
                message = pathParts.reduce(function (obj, pathPart) {
                    return obj[pathPart];
                }, messages);
            } finally {
                if (message === undefined) {
                    throw new ReferenceError('Could not find Intl message: ' + path);
                }
            }

            return message;
        },

        getNamedFormat: function (type, name) {
            var formats = this.props.formats || this.context.formats;
            var format  = null;

            try {
                format = formats[type][name];
            } finally {
                if (!format) {
                    throw new ReferenceError(
                        'No ' + type + ' format named: ' + name
                    );
                }
            }

            return format;
        },

        _format: function (type, value, options) {
            var locales = this.props.locales || this.context.locales;

            if (options && typeof options === 'string') {
                options = this.getNamedFormat(type, options);
            }

            switch(type) {
                case 'date':
                case 'time':
                    return this.getDateTimeFormat(locales, options).format(value);
                case 'number':
                    return this.getNumberFormat(locales, options).format(value);
                case 'relative':
                    return this.getRelativeFormat(locales, options).format(value);
                default:
                    throw new Error('Unrecognized format type: ' + type);
            }
        }
    };

    var $$components$date$$FormattedDate = $$react$$default.createClass({
        displayName: 'FormattedDate',
        mixins     : [$$mixin$$default],

        statics: {
            formatOptions: [
                'localeMatcher', 'timeZone', 'hour12', 'formatMatcher', 'weekday',
                'era', 'year', 'month', 'day', 'hour', 'minute', 'second',
                'timeZoneName'
            ]
        },

        propTypes: {
            format: $$react$$default.PropTypes.string,
            value : $$react$$default.PropTypes.any.isRequired
        },

        render: function () {
            var props    = this.props;
            var value    = props.value;
            var format   = props.format;
            var defaults = format && this.getNamedFormat('date', format);
            var options  = $$components$date$$FormattedDate.filterFormatOptions(props, defaults);

            return $$react$$default.DOM.span(null, this.formatDate(value, options));
        }
    });

    var $$components$date$$default = $$components$date$$FormattedDate;

    var $$components$time$$FormattedTime = $$react$$default.createClass({
        displayName: 'FormattedTime',
        mixins     : [$$mixin$$default],

        statics: {
            formatOptions: [
                'localeMatcher', 'timeZone', 'hour12', 'formatMatcher', 'weekday',
                'era', 'year', 'month', 'day', 'hour', 'minute', 'second',
                'timeZoneName'
            ]
        },

        propTypes: {
            format: $$react$$default.PropTypes.string,
            value : $$react$$default.PropTypes.any.isRequired
        },

        render: function () {
            var props    = this.props;
            var value    = props.value;
            var format   = props.format;
            var defaults = format && this.getNamedFormat('time', format);
            var options  = $$components$time$$FormattedTime.filterFormatOptions(props, defaults);

            return $$react$$default.DOM.span(null, this.formatTime(value, options));
        }
    });

    var $$components$time$$default = $$components$time$$FormattedTime;

    var $$components$relative$$FormattedRelative = $$react$$default.createClass({
        displayName: 'FormattedRelative',
        mixins     : [$$mixin$$default],

        statics: {
            formatOptions: [
                'style', 'units'
            ]
        },

        propTypes: {
            format: $$react$$default.PropTypes.string,
            value : $$react$$default.PropTypes.any.isRequired
        },

        render: function () {
            var props    = this.props;
            var value    = props.value;
            var format   = props.format;
            var defaults = format && this.getNamedFormat('relative', format);
            var options  = $$components$relative$$FormattedRelative.filterFormatOptions(props, defaults);

            return $$react$$default.DOM.span(null, this.formatRelative(value, options));
        }
    });

    var $$components$relative$$default = $$components$relative$$FormattedRelative;

    var $$components$number$$FormattedNumber = $$react$$default.createClass({
        displayName: 'FormattedNumber',
        mixins     : [$$mixin$$default],

        statics: {
            formatOptions: [
                'localeMatcher', 'style', 'currency', 'currencyDisplay',
                'useGrouping', 'minimumIntegerDigits', 'minimumFractionDigits',
                'maximumFractionDigits', 'minimumSignificantDigits',
                'maximumSignificantDigits'
            ]
        },

        propTypes: {
            format: $$react$$default.PropTypes.string,
            value : $$react$$default.PropTypes.any.isRequired
        },

        render: function () {
            var props    = this.props;
            var value    = props.value;
            var format   = props.format;
            var defaults = format && this.getNamedFormat('number', format);
            var options  = $$components$number$$FormattedNumber.filterFormatOptions(props, defaults);

            return $$react$$default.DOM.span(null, this.formatNumber(value, options));
        }
    });

    var $$components$number$$default = $$components$number$$FormattedNumber;

    var $$components$message$$FormattedMessage = $$react$$default.createClass({
        displayName: 'FormattedMessage',
        mixins     : [$$mixin$$default],

        propTypes: {
            tagName: $$react$$default.PropTypes.string,
            message: $$react$$default.PropTypes.string.isRequired
        },

        getDefaultProps: function () {
            return {tagName: 'span'};
        },

        render: function () {
            var props   = this.props;
            var tagName = props.tagName;
            var message = props.message;

            // Creates a token with a random guid that should not be guessable or
            // conflict with other parts of the `message` string.
            var guid       = Math.floor(Math.random() * 0x10000000000).toString(16);
            var tokenRegex = new RegExp('(@__ELEMENT-' + guid + '-\\d+__@)', 'g');
            var elements   = {};

            var generateToken = (function () {
                var counter = 0;
                return function () {
                    return '@__ELEMENT-' + guid + '-' + (counter += 1) + '__@';
                };
            }());

            // Iterates over the `props` to keep track of any React Element values
            // so they can be represented by the `token` as a placeholder when the
            // `message` is formatted. This allows the formatted message to then be
            // broken-up into parts with references to the React Elements inserted
            // back in.
            var values = Object.keys(props).reduce(function (values, name) {
                var value = props[name];
                var token;

                if ($$react$$default.isValidElement(value)) {
                    token           = generateToken();
                    values[name]    = token;
                    elements[token] = value;
                } else {
                    values[name] = value;
                }

                return values;
            }, {});

            // Formats the `message` with the `values`, including the `token`
            // placeholders for React Element values.
            var formattedMessage = this.formatMessage(message, values);

            // Split the message into parts so the React Element values captured
            // above can be inserted back into the rendered message. This
            // approach allows messages to render with React Elements while keeping
            // React's virtual diffing working properly.
            var children = formattedMessage.split(tokenRegex)
                .filter(function (part) {
                    // Ignore empty string parts.
                    return !!part;
                })
                .map(function (part) {
                    // When the `part` is a token, get a ref to the React Element.
                    return elements[part] || part;
                });

            var elementArgs = [tagName, null].concat(children);
            return $$react$$default.createElement.apply(null, elementArgs);
        }
    });

    var $$components$message$$default = $$components$message$$FormattedMessage;
    /* jshint esnext:true */

    /*
    HTML escaping implementation is the same as React's (on purpose.) Therefore, it
    has the following Copyright and Licensing:

    Copyright 2013-2014, Facebook, Inc.
    All rights reserved.

    This source code is licensed under the BSD-style license found in the LICENSE
    file in the root directory of React's source tree.
    */
    var $$$escape$$ESCAPED_CHARS = {
        '&' : '&amp;',
        '>' : '&gt;',
        '<' : '&lt;',
        '"' : '&quot;',
        '\'': '&#x27;'
    };

    var $$$escape$$UNSAFE_CHARS_REGEX = /[&><"']/g;

    var $$$escape$$default = function (str) {
        return ('' + str).replace($$$escape$$UNSAFE_CHARS_REGEX, function (match) {
            return $$$escape$$ESCAPED_CHARS[match];
        });
    };

    var $$components$html$message$$FormattedHTMLMessage = $$react$$default.createClass({
        displayName: 'FormattedHTMLMessage',
        mixins     : [$$mixin$$default],

        propTypes: {
            tagName: $$react$$default.PropTypes.string,
            message: $$react$$default.PropTypes.string.isRequired
        },

        getDefaultProps: function () {
            return {tagName: 'span'};
        },

        render: function () {
            var props   = this.props;
            var tagName = props.tagName;
            var message = props.message;

            // Process all the props before they are used as values when formatting
            // the ICU Message string. Since the formatted message will be injected
            // via `innerHTML`, all String-based values need to be HTML-escaped. Any
            // React Elements that are passed as props will be rendered to a static
            // markup string that is presumed to be safe.
            var values = Object.keys(props).reduce(function (values, name) {
                var value = props[name];

                if (typeof value === 'string') {
                    value = $$$escape$$default(value);
                } else if ($$react$$default.isValidElement(value)) {
                    value = $$react$$default.renderToStaticMarkup(value);
                }

                values[name] = value;
                return values;
            }, {});

            // Since the message presumably has HTML in it, we need to set
            // `innerHTML` in order for it to be rendered and not escaped by React.
            // To be safe, all string prop values were escaped before formatting the
            // message. It is assumed that the message is not UGC, and came from
            // the developer making it more like a template.
            //
            // Note: There's a perf impact of using this component since there's no
            // way for React to do its virtual DOM diffing.
            return $$react$$default.DOM[tagName]({
                dangerouslySetInnerHTML: {
                    __html: this.formatMessage(message, values)
                }
            });
        }
    });

    var $$components$html$message$$default = $$components$html$message$$FormattedHTMLMessage;
    function $$react$intl$$__addLocaleData(data) {
        intl$messageformat$$default.__addLocaleData(data);
        intl$relativeformat$$default.__addLocaleData(data);
    }

    $$react$intl$$__addLocaleData($$en$$default);

    var src$main$$default = {
        IntlMixin           : $$mixin$$default,
        FormattedDate       : $$components$date$$default,
        FormattedTime       : $$components$time$$default,
        FormattedRelative   : $$components$relative$$default,
        FormattedNumber     : $$components$number$$default,
        FormattedMessage    : $$components$message$$default,
        FormattedHTMLMessage: $$components$html$message$$default,

        __addLocaleData: $$react$intl$$__addLocaleData
    };

    // Back-compat for v1.0.0. This adds a `ReactIntlMixin` global that references
    // the mixin directly. This will be deprecated in v2.0.0.
    if (typeof window !== 'undefined') {
        window.ReactIntlMixin     = $$mixin$$default;
        $$mixin$$default.__addLocaleData = $$react$intl$$__addLocaleData;
    }
    this['ReactIntl'] = src$main$$default;
}).call(this);

//
ReactIntl.__addLocaleData({"locale":"af","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"Sekonde","relative":{"0":"nou"},"relativeTime":{"future":{"one":"Oor {0} sekonde","other":"Oor {0} sekondes"},"past":{"one":"{0} sekonde gelede","other":"{0} sekondes gelede"}}},"minute":{"displayName":"Minuut","relativeTime":{"future":{"one":"Oor {0} minuut","other":"Oor {0} minute"},"past":{"one":"{0} minuut gelede","other":"{0} minute gelede"}}},"hour":{"displayName":"Uur","relativeTime":{"future":{"one":"Oor {0} uur","other":"Oor {0} uur"},"past":{"one":"{0} uur gelede","other":"{0} uur gelede"}}},"day":{"displayName":"Dag","relative":{"0":"vandag","1":"môre","2":"Die dag na môre","-2":"Die dag voor gister","-1":"gister"},"relativeTime":{"future":{"one":"Oor {0} dag","other":"Oor {0} dae"},"past":{"one":"{0} dag gelede","other":"{0} dae gelede"}}},"month":{"displayName":"Maand","relative":{"0":"vandeesmaand","1":"volgende maand","-1":"verlede maand"},"relativeTime":{"future":{"one":"Oor {0} maand","other":"Oor {0} maande"},"past":{"one":"{0} maand gelede","other":"{0} maande gelede"}}},"year":{"displayName":"Jaar","relative":{"0":"hierdie jaar","1":"volgende jaar","-1":"verlede jaar"},"relativeTime":{"future":{"one":"Oor {0} jaar","other":"Oor {0} jaar"},"past":{"one":"{0} jaar gelede","other":"{0} jaar gelede"}}}}});
ReactIntl.__addLocaleData({"locale":"ak","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===Math.floor(n)&&n>=0&&n<=1)return"one";return"other";},"fields":{"second":{"displayName":"Sɛkɛnd","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Sema","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Dɔnhwer","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Da","relative":{"0":"Ndɛ","1":"Ɔkyena","-1":"Ndeda"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Bosome","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Afe","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"am","pluralRuleFunction":function (n) {var i=Math.floor(Math.abs(n));n=Math.floor(n);if(i===0||n===1)return"one";return"other";},"fields":{"second":{"displayName":"ሰከንድ","relative":{"0":"አሁን"},"relativeTime":{"future":{"one":"በ{0} ሰከንድ ውስጥ","other":"በ{0} ሰከንዶች ውስጥ"},"past":{"one":"ከ{0} ሰከንድ በፊት","other":"ከ{0} ሰከንዶች በፊት"}}},"minute":{"displayName":"ደቂቃ","relativeTime":{"future":{"one":"በ{0} ደቂቃ ውስጥ","other":"በ{0} ደቂቃዎች ውስጥ"},"past":{"one":"ከ{0} ደቂቃ በፊት","other":"ከ{0} ደቂቃዎች በፊት"}}},"hour":{"displayName":"ሰዓት","relativeTime":{"future":{"one":"በ{0} ሰዓት ውስጥ","other":"በ{0} ሰዓቶች ውስጥ"},"past":{"one":"ከ{0} ሰዓት በፊት","other":"ከ{0} ሰዓቶች በፊት"}}},"day":{"displayName":"ቀን","relative":{"0":"ዛሬ","1":"ነገ","2":"ከነገ ወዲያ","-2":"ከትናንት ወዲያ","-1":"ትናንት"},"relativeTime":{"future":{"one":"በ{0} ቀን ውስጥ","other":"በ{0} ቀናት ውስጥ"},"past":{"one":"ከ{0} ቀን በፊት","other":"ከ{0} ቀናት በፊት"}}},"month":{"displayName":"ወር","relative":{"0":"በዚህ ወር","1":"የሚቀጥለው ወር","-1":"ያለፈው ወር"},"relativeTime":{"future":{"one":"በ{0} ወር ውስጥ","other":"በ{0} ወራት ውስጥ"},"past":{"one":"ከ{0} ወር በፊት","other":"ከ{0} ወራት በፊት"}}},"year":{"displayName":"ዓመት","relative":{"0":"በዚህ ዓመት","1":"የሚቀጥለው ዓመት","-1":"ያለፈው ዓመት"},"relativeTime":{"future":{"one":"በ{0} ዓመታት ውስጥ","other":"በ{0} ዓመታት ውስጥ"},"past":{"one":"ከ{0} ዓመት በፊት","other":"ከ{0} ዓመታት በፊት"}}}}});
ReactIntl.__addLocaleData({"locale":"ar","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===0)return"zero";if(n===1)return"one";if(n===2)return"two";if(n%100===Math.floor(n%100)&&n%100>=3&&n%100<=10)return"few";if(n%100===Math.floor(n%100)&&n%100>=11&&n%100<=99)return"many";return"other";},"fields":{"second":{"displayName":"الثواني","relative":{"0":"الآن"},"relativeTime":{"future":{"zero":"خلال {0} من الثواني","one":"خلال {0} من الثواني","two":"خلال ثانيتين","few":"خلال {0} ثوانِ","many":"خلال {0} ثانية","other":"خلال {0} من الثواني"},"past":{"zero":"قبل {0} من الثواني","one":"قبل {0} من الثواني","two":"قبل ثانيتين","few":"قبل {0} ثوانِ","many":"قبل {0} ثانية","other":"قبل {0} من الثواني"}}},"minute":{"displayName":"الدقائق","relativeTime":{"future":{"zero":"خلال {0} من الدقائق","one":"خلال {0} من الدقائق","two":"خلال دقيقتين","few":"خلال {0} دقائق","many":"خلال {0} دقيقة","other":"خلال {0} من الدقائق"},"past":{"zero":"قبل {0} من الدقائق","one":"قبل {0} من الدقائق","two":"قبل دقيقتين","few":"قبل {0} دقائق","many":"قبل {0} دقيقة","other":"قبل {0} من الدقائق"}}},"hour":{"displayName":"الساعات","relativeTime":{"future":{"zero":"خلال {0} من الساعات","one":"خلال {0} من الساعات","two":"خلال ساعتين","few":"خلال {0} ساعات","many":"خلال {0} ساعة","other":"خلال {0} من الساعات"},"past":{"zero":"قبل {0} من الساعات","one":"قبل {0} من الساعات","two":"قبل ساعتين","few":"قبل {0} ساعات","many":"قبل {0} ساعة","other":"قبل {0} من الساعات"}}},"day":{"displayName":"يوم","relative":{"0":"اليوم","1":"غدًا","2":"بعد الغد","-2":"أول أمس","-1":"أمس"},"relativeTime":{"future":{"zero":"خلال {0} من الأيام","one":"خلال {0} من الأيام","two":"خلال يومين","few":"خلال {0} أيام","many":"خلال {0} يومًا","other":"خلال {0} من الأيام"},"past":{"zero":"قبل {0} من الأيام","one":"قبل {0} من الأيام","two":"قبل يومين","few":"قبل {0} أيام","many":"قبل {0} يومًا","other":"قبل {0} من الأيام"}}},"month":{"displayName":"الشهر","relative":{"0":"هذا الشهر","1":"الشهر التالي","-1":"الشهر الماضي"},"relativeTime":{"future":{"zero":"خلال {0} من الشهور","one":"خلال {0} من الشهور","two":"خلال شهرين","few":"خلال {0} شهور","many":"خلال {0} شهرًا","other":"خلال {0} من الشهور"},"past":{"zero":"قبل {0} من الشهور","one":"قبل {0} من الشهور","two":"قبل شهرين","few":"قبل {0} أشهر","many":"قبل {0} شهرًا","other":"قبل {0} من الشهور"}}},"year":{"displayName":"السنة","relative":{"0":"هذه السنة","1":"السنة التالية","-1":"السنة الماضية"},"relativeTime":{"future":{"zero":"خلال {0} من السنوات","one":"خلال {0} من السنوات","two":"خلال سنتين","few":"خلال {0} سنوات","many":"خلال {0} سنة","other":"خلال {0} من السنوات"},"past":{"zero":"قبل {0} من السنوات","one":"قبل {0} من السنوات","two":"قبل سنتين","few":"قبل {0} سنوات","many":"قبل {0} سنة","other":"قبل {0} من السنوات"}}}}});
ReactIntl.__addLocaleData({"locale":"as","pluralRuleFunction":function (n) {var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length;n=Math.floor(n);if(i===1&&v===0)return"one";return"other";},"fields":{"second":{"displayName":"ছেকেণ্ড","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"মিনিট","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"ঘণ্টা","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"দিন","relative":{"0":"today","1":"কাইলৈ","2":"পৰহিলৈ","-2":"পৰহি","-1":"কালি"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"মাহ","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"বছৰ","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"asa","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"Thekunde","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Dakika","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Thaa","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Thiku","relative":{"0":"Iyoo","1":"Yavo","-1":"Ighuo"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Mweji","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Mwaka","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"ast","pluralRuleFunction":function (n) {var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length;n=Math.floor(n);if(i===1&&v===0)return"one";return"other";},"fields":{"second":{"displayName":"segundu","relative":{"0":"now"},"relativeTime":{"future":{"one":"En {0} segundu","other":"En {0} segundos"},"past":{"one":"Hai {0} segundu","other":"Hai {0} segundos"}}},"minute":{"displayName":"minutu","relativeTime":{"future":{"one":"En {0} minutu","other":"En {0} minutos"},"past":{"one":"Hai {0} minutu","other":"Hai {0} minutos"}}},"hour":{"displayName":"hora","relativeTime":{"future":{"one":"En {0} hora","other":"En {0} hores"},"past":{"one":"Hai {0} hora","other":"Hai {0} hores"}}},"day":{"displayName":"día","relative":{"0":"güei","1":"mañana","2":"pasao mañana","-3":"antantayeri","-2":"antayeri","-1":"ayeri"},"relativeTime":{"future":{"one":"En {0} dia","other":"En {0} díes"},"past":{"one":"Hai {0} dia","other":"Hai {0} díes"}}},"month":{"displayName":"mes","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"one":"En {0} mes","other":"En {0} meses"},"past":{"one":"Hai {0} mes","other":"Hai {0} meses"}}},"year":{"displayName":"añu","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"one":"En {0} añu","other":"En {0} años"},"past":{"one":"Hai {0} añu","other":"Hai {0} años"}}}}});
ReactIntl.__addLocaleData({"locale":"az","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"saniyə","relative":{"0":"indi"},"relativeTime":{"future":{"one":"{0} saniyə ərzində","other":"{0} saniyə ərzində"},"past":{"one":"{0} saniyə öncə","other":"{0} saniyə öncə"}}},"minute":{"displayName":"dəqiqə","relativeTime":{"future":{"one":"{0} dəqiqə ərzində","other":"{0} dəqiqə ərzində"},"past":{"one":"{0} dəqiqə öncə","other":"{0} dəqiqə öncə"}}},"hour":{"displayName":"saat","relativeTime":{"future":{"one":"{0} saat ərzində","other":"{0} saat ərzində"},"past":{"one":"{0} saat öncə","other":"{0} saat öncə"}}},"day":{"displayName":"bu gün","relative":{"0":"bu gün","1":"sabah","-1":"dünən"},"relativeTime":{"future":{"one":"{0} gün ərində","other":"{0} gün ərində"},"past":{"one":"{0} gün öncə","other":"{0} gün öncə"}}},"month":{"displayName":"ay","relative":{"0":"bu ay","1":"gələn ay","-1":"keçən ay"},"relativeTime":{"future":{"one":"{0} ay ərzində","other":"{0} ay ərzində"},"past":{"one":"{0} ay öncə","other":"{0} ay öncə"}}},"year":{"displayName":"il","relative":{"0":"bu il","1":"gələn il","-1":"keçən il"},"relativeTime":{"future":{"one":"{0} il ərzində","other":"{0} il ərzində"},"past":{"one":"{0} il öncə","other":"{0} il öncə"}}}}});
ReactIntl.__addLocaleData({"locale":"be","pluralRuleFunction":function (n) {n=Math.floor(n);if(n%10===1&&(n%100!==11))return"one";if(n%10===Math.floor(n%10)&&n%10>=2&&n%10<=4&&!(n%100>=12&&n%100<=14))return"few";if(n%10===0||n%10===Math.floor(n%10)&&n%10>=5&&n%10<=9||n%100===Math.floor(n%100)&&n%100>=11&&n%100<=14)return"many";return"other";},"fields":{"second":{"displayName":"секунда","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"хвіліна","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"гадзіна","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"дзень","relative":{"0":"сёння","1":"заўтра","2":"паслязаўтра","-2":"пазаўчора","-1":"учора"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"месяц","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"год","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"bem","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"Sekondi","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Mineti","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Insa","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Ubushiku","relative":{"0":"Lelo","1":"tomorrow","-1":"yesterday"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Umweshi","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Umwaka","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"bez","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"Sekunde","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Dakika","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Saa","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Sihu","relative":{"0":"Neng'u ni","1":"Hilawu","-1":"Igolo"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Mwedzi","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Mwaha","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"bg","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"секунда","relative":{"0":"сега"},"relativeTime":{"future":{"one":"след {0} секунда","other":"след {0} секунди"},"past":{"one":"преди {0} секунда","other":"преди {0} секунди"}}},"minute":{"displayName":"минута","relativeTime":{"future":{"one":"след {0} минута","other":"след {0} минути"},"past":{"one":"преди {0} минута","other":"преди {0} минути"}}},"hour":{"displayName":"час","relativeTime":{"future":{"one":"след {0} час","other":"след {0} часа"},"past":{"one":"преди {0} час","other":"преди {0} часа"}}},"day":{"displayName":"ден","relative":{"0":"днес","1":"утре","2":"вдругиден","-2":"онзи ден","-1":"вчера"},"relativeTime":{"future":{"one":"след {0} дни","other":"след {0} дни"},"past":{"one":"преди {0} ден","other":"преди {0} дни"}}},"month":{"displayName":"месец","relative":{"0":"този месец","1":"следващият месец","-1":"миналият месец"},"relativeTime":{"future":{"one":"след {0} месец","other":"след {0} месеца"},"past":{"one":"преди {0} месец","other":"преди {0} месеца"}}},"year":{"displayName":"година","relative":{"0":"тази година","1":"следващата година","-1":"миналата година"},"relativeTime":{"future":{"one":"след {0} година","other":"след {0} години"},"past":{"one":"преди {0} година","other":"преди {0} години"}}}}});
ReactIntl.__addLocaleData({"locale":"bm","pluralRuleFunction":function (n) {return"other";},"fields":{"second":{"displayName":"sekondi","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"miniti","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"lɛrɛ","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"don","relative":{"0":"bi","1":"sini","-1":"kunu"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"kalo","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"san","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"bn","pluralRuleFunction":function (n) {var i=Math.floor(Math.abs(n));n=Math.floor(n);if(i===0||n===1)return"one";return"other";},"fields":{"second":{"displayName":"সেকেন্ড","relative":{"0":"এখন"},"relativeTime":{"future":{"one":"{0} সেকেন্ডে","other":"{0} সেকেন্ডে"},"past":{"one":"{0} সেকেন্ড পূর্বে","other":"{0} সেকেন্ড পূর্বে"}}},"minute":{"displayName":"মিনিট","relativeTime":{"future":{"one":"{0} মিনিটে","other":"{0} মিনিটে"},"past":{"one":"{0} মিনিট পূর্বে","other":"{0} মিনিট পূর্বে"}}},"hour":{"displayName":"ঘন্টা","relativeTime":{"future":{"one":"{0} ঘন্টায়","other":"{0} ঘন্টায়"},"past":{"one":"{0} ঘন্টা আগে","other":"{0} ঘন্টা আগে"}}},"day":{"displayName":"দিন","relative":{"0":"আজ","1":"আগামীকাল","2":"আগামী পরশু","-2":"গত পরশু","-1":"গতকাল"},"relativeTime":{"future":{"one":"{0} দিনের মধ্যে","other":"{0} দিনের মধ্যে"},"past":{"one":"{0} দিন পূর্বে","other":"{0} দিন পূর্বে"}}},"month":{"displayName":"মাস","relative":{"0":"এই মাস","1":"পরের মাস","-1":"গত মাস"},"relativeTime":{"future":{"one":"{0} মাসে","other":"{0} মাসে"},"past":{"one":"{0} মাস পূর্বে","other":"{0} মাস পূর্বে"}}},"year":{"displayName":"বছর","relative":{"0":"এই বছর","1":"পরের বছর","-1":"গত বছর"},"relativeTime":{"future":{"one":"{0} বছরে","other":"{0} বছরে"},"past":{"one":"{0} বছর পূর্বে","other":"{0} বছর পূর্বে"}}}}});
ReactIntl.__addLocaleData({"locale":"bo","pluralRuleFunction":function (n) {return"other";},"fields":{"second":{"displayName":"སྐར་ཆ།","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"སྐར་མ།","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"ཆུ་ཙོ་","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"ཉིན།","relative":{"0":"དེ་རིང་","1":"སང་ཉིན་","2":"གནངས་ཉིན་ཀ་","-2":"ཁས་ཉིན་ཀ་","-1":"ཁས་ས་"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"ཟླ་བ་","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"ལོ།","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"br","pluralRuleFunction":function (n) {n=Math.floor(n);if(n%10===1&&!(n%100===11||n%100===71||n%100===91))return"one";if(n%10===2&&!(n%100===12||n%100===72||n%100===92))return"two";if(n%10===Math.floor(n%10)&&(n%10>=3&&n%10<=4||n%10===9)&&!(n%100>=10&&n%100<=19||n%100>=70&&n%100<=79||n%100>=90&&n%100<=99))return"few";if((n!==0)&&n%1e6===0)return"many";return"other";},"fields":{"second":{"displayName":"eilenn","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"munut","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"eur","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Day","relative":{"0":"hiziv","1":"warcʼhoazh","-2":"dercʼhent-decʼh","-1":"decʼh"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"miz","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Year","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"brx","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"सेखेन्द","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"मिनिथ","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"रिंगा","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"सान","relative":{"0":"दिनै","1":"गाबोन","-1":"मैया"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"दान","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"बोसोर","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"bs","pluralRuleFunction":function (n) {var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length,f=parseInt(n.toString().replace(/^[^.]*\.?/,""),10);n=Math.floor(n);if(v===0&&i%10===1&&((i%100!==11)||f%10===1&&(f%100!==11)))return"one";if(v===0&&i%10===Math.floor(i%10)&&i%10>=2&&i%10<=4&&(!(i%100>=12&&i%100<=14)||f%10===Math.floor(f%10)&&f%10>=2&&f%10<=4&&!(f%100>=12&&f%100<=14)))return"few";return"other";},"fields":{"second":{"displayName":"sekund","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"minut","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"čas","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"dan","relative":{"0":"danas","1":"sutra","2":"prekosutra","-2":"prekjuče","-1":"juče"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"mesec","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"godina","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"ca","pluralRuleFunction":function (n) {var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length;n=Math.floor(n);if(i===1&&v===0)return"one";return"other";},"fields":{"second":{"displayName":"segon","relative":{"0":"ara"},"relativeTime":{"future":{"one":"D'aquí a {0} segon","other":"D'aquí a {0} segons"},"past":{"one":"Fa {0} segon","other":"Fa {0} segons"}}},"minute":{"displayName":"minut","relativeTime":{"future":{"one":"D'aquí a {0} minut","other":"D'aquí a {0} minuts"},"past":{"one":"Fa {0} minut","other":"Fa {0} minuts"}}},"hour":{"displayName":"hora","relativeTime":{"future":{"one":"D'aquí a {0} hora","other":"D'aquí a {0} hores"},"past":{"one":"Fa {0} hora","other":"Fa {0} hores"}}},"day":{"displayName":"dia","relative":{"0":"avui","1":"demà","2":"demà passat","-2":"abans-d'ahir","-1":"ahir"},"relativeTime":{"future":{"one":"D'aquí a {0} dia","other":"D'aquí a {0} dies"},"past":{"one":"Fa {0} dia","other":"Fa {0} dies"}}},"month":{"displayName":"mes","relative":{"0":"aquest mes","1":"el mes que ve","-1":"el mes passat"},"relativeTime":{"future":{"one":"D'aquí a {0} mes","other":"D'aquí a {0} mesos"},"past":{"one":"Fa {0} mes","other":"Fa {0} mesos"}}},"year":{"displayName":"any","relative":{"0":"enguany","1":"l'any que ve","-1":"l'any passat"},"relativeTime":{"future":{"one":"D'aquí a {0} any","other":"D'aquí a {0} anys"},"past":{"one":"Fa {0} any","other":"Fa {0} anys"}}}}});
ReactIntl.__addLocaleData({"locale":"cgg","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"Obucweka\u002FEsekendi","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Edakiika","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Shaaha","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Eizooba","relative":{"0":"Erizooba","1":"Nyenkyakare","-1":"Nyomwabazyo"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Omwezi","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Omwaka","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"chr","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"ᎠᏎᏢ","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"ᎢᏯᏔᏬᏍᏔᏅ","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"ᏑᏣᎶᏓ","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"ᏏᎦ","relative":{"0":"ᎪᎯ ᎢᎦ","1":"ᏌᎾᎴᎢ","-1":"ᏒᎯ"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"ᏏᏅᏓ","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"ᏑᏕᏘᏴᏓ","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"cs","pluralRuleFunction":function (n) {var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length;n=Math.floor(n);if(i===1&&v===0)return"one";if(i===Math.floor(i)&&i>=2&&i<=4&&v===0)return"few";if((v!==0))return"many";return"other";},"fields":{"second":{"displayName":"Sekunda","relative":{"0":"nyní"},"relativeTime":{"future":{"one":"za {0} sekundu","few":"za {0} sekundy","many":"za {0} sekundy","other":"za {0} sekund"},"past":{"one":"před {0} sekundou","few":"před {0} sekundami","many":"před {0} sekundou","other":"před {0} sekundami"}}},"minute":{"displayName":"Minuta","relativeTime":{"future":{"one":"za {0} minutu","few":"za {0} minuty","many":"za {0} minuty","other":"za {0} minut"},"past":{"one":"před {0} minutou","few":"před {0} minutami","many":"před {0} minutou","other":"před {0} minutami"}}},"hour":{"displayName":"Hodina","relativeTime":{"future":{"one":"za {0} hodinu","few":"za {0} hodiny","many":"za {0} hodiny","other":"za {0} hodin"},"past":{"one":"před {0} hodinou","few":"před {0} hodinami","many":"před {0} hodinou","other":"před {0} hodinami"}}},"day":{"displayName":"Den","relative":{"0":"dnes","1":"zítra","2":"pozítří","-2":"předevčírem","-1":"včera"},"relativeTime":{"future":{"one":"za {0} den","few":"za {0} dny","many":"za {0} dne","other":"za {0} dní"},"past":{"one":"před {0} dnem","few":"před {0} dny","many":"před {0} dnem","other":"před {0} dny"}}},"month":{"displayName":"Měsíc","relative":{"0":"tento měsíc","1":"příští měsíc","-1":"minulý měsíc"},"relativeTime":{"future":{"one":"za {0} měsíc","few":"za {0} měsíce","many":"za {0} měsíce","other":"za {0} měsíců"},"past":{"one":"před {0} měsícem","few":"před {0} měsíci","many":"před {0} měsícem","other":"před {0} měsíci"}}},"year":{"displayName":"Rok","relative":{"0":"tento rok","1":"příští rok","-1":"minulý rok"},"relativeTime":{"future":{"one":"za {0} rok","few":"za {0} roky","many":"za {0} roku","other":"za {0} let"},"past":{"one":"před {0} rokem","few":"před {0} lety","many":"před {0} rokem","other":"před {0} lety"}}}}});
ReactIntl.__addLocaleData({"locale":"cy","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===0)return"zero";if(n===1)return"one";if(n===2)return"two";if(n===3)return"few";if(n===6)return"many";return"other";},"fields":{"second":{"displayName":"Eiliad","relative":{"0":"nawr"},"relativeTime":{"future":{"zero":"Ymhen {0} eiliad","one":"Ymhen eiliad","two":"Ymhen {0} eiliad","few":"Ymhen {0} eiliad","many":"Ymhen {0} eiliad","other":"Ymhen {0} eiliad"},"past":{"zero":"{0} eiliad yn ôl","one":"eiliad yn ôl","two":"{0} eiliad yn ôl","few":"{0} eiliad yn ôl","many":"{0} eiliad yn ôl","other":"{0} eiliad yn ôl"}}},"minute":{"displayName":"Munud","relativeTime":{"future":{"zero":"Ymhen {0} munud","one":"Ymhen munud","two":"Ymhen {0} funud","few":"Ymhen {0} munud","many":"Ymhen {0} munud","other":"Ymhen {0} munud"},"past":{"zero":"{0} munud yn ôl","one":"{0} munud yn ôl","two":"{0} funud yn ôl","few":"{0} munud yn ôl","many":"{0} munud yn ôl","other":"{0} munud yn ôl"}}},"hour":{"displayName":"Awr","relativeTime":{"future":{"zero":"Ymhen {0} awr","one":"Ymhen {0} awr","two":"Ymhen {0} awr","few":"Ymhen {0} awr","many":"Ymhen {0} awr","other":"Ymhen {0} awr"},"past":{"zero":"{0} awr yn ôl","one":"awr yn ôl","two":"{0} awr yn ôl","few":"{0} awr yn ôl","many":"{0} awr yn ôl","other":"{0} awr yn ôl"}}},"day":{"displayName":"Dydd","relative":{"0":"heddiw","1":"yfory","2":"drennydd","-2":"echdoe","-1":"ddoe"},"relativeTime":{"future":{"zero":"Ymhen {0} diwrnod","one":"Ymhen diwrnod","two":"Ymhen deuddydd","few":"Ymhen tridiau","many":"Ymhen {0} diwrnod","other":"Ymhen {0} diwrnod"},"past":{"zero":"{0} diwrnod yn ôl","one":"{0} diwrnod yn ôl","two":"{0} ddiwrnod yn ôl","few":"{0} diwrnod yn ôl","many":"{0} diwrnod yn ôl","other":"{0} diwrnod yn ôl"}}},"month":{"displayName":"Mis","relative":{"0":"y mis hwn","1":"mis nesaf","-1":"mis diwethaf"},"relativeTime":{"future":{"zero":"Ymhen {0} mis","one":"Ymhen mis","two":"Ymhen deufis","few":"Ymhen {0} mis","many":"Ymhen {0} mis","other":"Ymhen {0} mis"},"past":{"zero":"{0} mis yn ôl","one":"{0} mis yn ôl","two":"{0} fis yn ôl","few":"{0} mis yn ôl","many":"{0} mis yn ôl","other":"{0} mis yn ôl"}}},"year":{"displayName":"Blwyddyn","relative":{"0":"eleni","1":"blwyddyn nesaf","-1":"llynedd"},"relativeTime":{"future":{"zero":"Ymhen {0} mlynedd","one":"Ymhen blwyddyn","two":"Ymhen {0} flynedd","few":"Ymhen {0} blynedd","many":"Ymhen {0} blynedd","other":"Ymhen {0} mlynedd"},"past":{"zero":"{0} o flynyddoedd yn ôl","one":"blwyddyn yn ôl","two":"{0} flynedd yn ôl","few":"{0} blynedd yn ôl","many":"{0} blynedd yn ôl","other":"{0} o flynyddoedd yn ôl"}}}}});
ReactIntl.__addLocaleData({"locale":"da","pluralRuleFunction":function (n) {var i=Math.floor(Math.abs(n)),t=parseInt(n.toString().replace(/^[^.]*\.?|0+$/g,""),10);n=Math.floor(n);if(n===1||(t!==0)&&(i===0||i===1))return"one";return"other";},"fields":{"second":{"displayName":"Sekund","relative":{"0":"nu"},"relativeTime":{"future":{"one":"om {0} sekund","other":"om {0} sekunder"},"past":{"one":"for {0} sekund siden","other":"for {0} sekunder siden"}}},"minute":{"displayName":"Minut","relativeTime":{"future":{"one":"om {0} minut","other":"om {0} minutter"},"past":{"one":"for {0} minut siden","other":"for {0} minutter siden"}}},"hour":{"displayName":"Time","relativeTime":{"future":{"one":"om {0} time","other":"om {0} timer"},"past":{"one":"for {0} time siden","other":"for {0} timer siden"}}},"day":{"displayName":"Dag","relative":{"0":"i dag","1":"i morgen","2":"i overmorgen","-2":"i forgårs","-1":"i går"},"relativeTime":{"future":{"one":"om {0} døgn","other":"om {0} døgn"},"past":{"one":"for {0} døgn siden","other":"for {0} døgn siden"}}},"month":{"displayName":"Måned","relative":{"0":"denne måned","1":"næste måned","-1":"sidste måned"},"relativeTime":{"future":{"one":"om {0} måned","other":"om {0} måneder"},"past":{"one":"for {0} måned siden","other":"for {0} måneder siden"}}},"year":{"displayName":"År","relative":{"0":"i år","1":"næste år","-1":"sidste år"},"relativeTime":{"future":{"one":"om {0} år","other":"om {0} år"},"past":{"one":"for {0} år siden","other":"for {0} år siden"}}}}});
ReactIntl.__addLocaleData({"locale":"de","pluralRuleFunction":function (n) {var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length;n=Math.floor(n);if(i===1&&v===0)return"one";return"other";},"fields":{"second":{"displayName":"Sekunde","relative":{"0":"jetzt"},"relativeTime":{"future":{"one":"In {0} Sekunde","other":"In {0} Sekunden"},"past":{"one":"Vor {0} Sekunde","other":"Vor {0} Sekunden"}}},"minute":{"displayName":"Minute","relativeTime":{"future":{"one":"In {0} Minute","other":"In {0} Minuten"},"past":{"one":"Vor {0} Minute","other":"Vor {0} Minuten"}}},"hour":{"displayName":"Stunde","relativeTime":{"future":{"one":"In {0} Stunde","other":"In {0} Stunden"},"past":{"one":"Vor {0} Stunde","other":"Vor {0} Stunden"}}},"day":{"displayName":"Tag","relative":{"0":"Heute","1":"Morgen","2":"Übermorgen","-2":"Vorgestern","-1":"Gestern"},"relativeTime":{"future":{"one":"In {0} Tag","other":"In {0} Tagen"},"past":{"one":"Vor {0} Tag","other":"Vor {0} Tagen"}}},"month":{"displayName":"Monat","relative":{"0":"Dieser Monat","1":"Nächster Monat","-1":"Letzter Monat"},"relativeTime":{"future":{"one":"In {0} Monat","other":"In {0} Monaten"},"past":{"one":"Vor {0} Monat","other":"Vor {0} Monaten"}}},"year":{"displayName":"Jahr","relative":{"0":"Dieses Jahr","1":"Nächstes Jahr","-1":"Letztes Jahr"},"relativeTime":{"future":{"one":"In {0} Jahr","other":"In {0} Jahren"},"past":{"one":"Vor {0} Jahr","other":"Vor {0} Jahren"}}}}});
ReactIntl.__addLocaleData({"locale":"dz","pluralRuleFunction":function (n) {return"other";},"fields":{"second":{"displayName":"སྐར་ཆཱ་","relative":{"0":"now"},"relativeTime":{"future":{"other":"སྐར་ཆ་ {0} ནང་"},"past":{"other":"སྐར་ཆ་ {0} ཧེ་མ་"}}},"minute":{"displayName":"སྐར་མ","relativeTime":{"future":{"other":"སྐར་མ་ {0} ནང་"},"past":{"other":"སྐར་མ་ {0} ཧེ་མ་"}}},"hour":{"displayName":"ཆུ་ཚོད","relativeTime":{"future":{"other":"ཆུ་ཚོད་ {0} ནང་"},"past":{"other":"ཆུ་ཚོད་ {0} ཧེ་མ་"}}},"day":{"displayName":"ཚེས་","relative":{"0":"ད་རིས་","1":"ནངས་པ་","2":"གནངས་ཚེ","-2":"ཁ་ཉིམ","-1":"ཁ་ཙ་"},"relativeTime":{"future":{"other":"ཉིནམ་ {0} ནང་"},"past":{"other":"ཉིནམ་ {0} ཧེ་མ་"}}},"month":{"displayName":"ཟླ་ཝ་","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"ཟླཝ་ {0} ནང་"},"past":{"other":"ཟླཝ་ {0} ཧེ་མ་"}}},"year":{"displayName":"ལོ","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"ལོ་འཁོར་ {0} ནང་"},"past":{"other":"ལོ་འཁོར་ {0} ཧེ་མ་"}}}}});
ReactIntl.__addLocaleData({"locale":"ee","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"sekend","relative":{"0":"fifi"},"relativeTime":{"future":{"one":"le sekend {0} me","other":"le sekend {0} wo me"},"past":{"one":"sekend {0} si va yi","other":"sekend {0} si wo va yi"}}},"minute":{"displayName":"aɖabaƒoƒo","relativeTime":{"future":{"one":"le aɖabaƒoƒo {0} me","other":"le aɖabaƒoƒo {0} wo me"},"past":{"one":"aɖabaƒoƒo {0} si va yi","other":"aɖabaƒoƒo {0} si wo va yi"}}},"hour":{"displayName":"gaƒoƒo","relativeTime":{"future":{"one":"le gaƒoƒo {0} me","other":"le gaƒoƒo {0} wo me"},"past":{"one":"gaƒoƒo {0} si va yi","other":"gaƒoƒo {0} si wo va yi"}}},"day":{"displayName":"ŋkeke","relative":{"0":"egbe","1":"etsɔ si gbɔna","2":"nyitsɔ si gbɔna","-2":"nyitsɔ si va yi","-1":"etsɔ si va yi"},"relativeTime":{"future":{"one":"le ŋkeke {0} me","other":"le ŋkeke {0} wo me"},"past":{"one":"ŋkeke {0} si va yi","other":"ŋkeke {0} si wo va yi"}}},"month":{"displayName":"ɣleti","relative":{"0":"ɣleti sia","1":"ɣleti si gbɔ na","-1":"ɣleti si va yi"},"relativeTime":{"future":{"one":"le ɣleti {0} me","other":"le ɣleti {0} wo me"},"past":{"one":"ɣleti {0} si va yi","other":"ɣleti {0} si wo va yi"}}},"year":{"displayName":"ƒe","relative":{"0":"ƒe sia","1":"ƒe si gbɔ na","-1":"ƒe si va yi"},"relativeTime":{"future":{"one":"le ƒe {0} me","other":"le ƒe {0} wo me"},"past":{"one":"ƒe {0} si va yi","other":"ƒe {0} si wo va yi"}}}}});
ReactIntl.__addLocaleData({"locale":"el","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"Δευτερόλεπτο","relative":{"0":"τώρα"},"relativeTime":{"future":{"one":"Σε {0} δευτερόλεπτο","other":"Σε {0} δευτερόλεπτα"},"past":{"one":"Πριν από {0} δευτερόλεπτο","other":"Πριν από {0} δευτερόλεπτα"}}},"minute":{"displayName":"Λεπτό","relativeTime":{"future":{"one":"Σε {0} λεπτό","other":"Σε {0} λεπτά"},"past":{"one":"Πριν από {0} λεπτό","other":"Πριν από {0} λεπτά"}}},"hour":{"displayName":"Ώρα","relativeTime":{"future":{"one":"Σε {0} ώρα","other":"Σε {0} ώρες"},"past":{"one":"Πριν από {0} ώρα","other":"Πριν από {0} ώρες"}}},"day":{"displayName":"Ημέρα","relative":{"0":"σήμερα","1":"αύριο","2":"μεθαύριο","-2":"προχθές","-1":"χθες"},"relativeTime":{"future":{"one":"Σε {0} ημέρα","other":"Σε {0} ημέρες"},"past":{"one":"Πριν από {0} ημέρα","other":"Πριν από {0} ημέρες"}}},"month":{"displayName":"Μήνας","relative":{"0":"τρέχων μήνας","1":"επόμενος μήνας","-1":"προηγούμενος μήνας"},"relativeTime":{"future":{"one":"Σε {0} μήνα","other":"Σε {0} μήνες"},"past":{"one":"Πριν από {0} μήνα","other":"Πριν από {0} μήνες"}}},"year":{"displayName":"Έτος","relative":{"0":"φέτος","1":"επόμενο έτος","-1":"προηγούμενο έτος"},"relativeTime":{"future":{"one":"Σε {0} έτος","other":"Σε {0} έτη"},"past":{"one":"Πριν από {0} έτος","other":"Πριν από {0} έτη"}}}}});
ReactIntl.__addLocaleData({"locale":"en","pluralRuleFunction":function (n) {var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length;n=Math.floor(n);if(i===1&&v===0)return"one";return"other";},"fields":{"second":{"displayName":"Second","relative":{"0":"now"},"relativeTime":{"future":{"one":"in {0} second","other":"in {0} seconds"},"past":{"one":"{0} second ago","other":"{0} seconds ago"}}},"minute":{"displayName":"Minute","relativeTime":{"future":{"one":"in {0} minute","other":"in {0} minutes"},"past":{"one":"{0} minute ago","other":"{0} minutes ago"}}},"hour":{"displayName":"Hour","relativeTime":{"future":{"one":"in {0} hour","other":"in {0} hours"},"past":{"one":"{0} hour ago","other":"{0} hours ago"}}},"day":{"displayName":"Day","relative":{"0":"today","1":"tomorrow","-1":"yesterday"},"relativeTime":{"future":{"one":"in {0} day","other":"in {0} days"},"past":{"one":"{0} day ago","other":"{0} days ago"}}},"month":{"displayName":"Month","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"one":"in {0} month","other":"in {0} months"},"past":{"one":"{0} month ago","other":"{0} months ago"}}},"year":{"displayName":"Year","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"one":"in {0} year","other":"in {0} years"},"past":{"one":"{0} year ago","other":"{0} years ago"}}}}});
ReactIntl.__addLocaleData({"locale":"eo","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"Second","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Minute","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Hour","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Day","relative":{"0":"today","1":"tomorrow","-1":"yesterday"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Month","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Year","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"es","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"segundo","relative":{"0":"ahora"},"relativeTime":{"future":{"one":"dentro de {0} segundo","other":"dentro de {0} segundos"},"past":{"one":"hace {0} segundo","other":"hace {0} segundos"}}},"minute":{"displayName":"minuto","relativeTime":{"future":{"one":"dentro de {0} minuto","other":"dentro de {0} minutos"},"past":{"one":"hace {0} minuto","other":"hace {0} minutos"}}},"hour":{"displayName":"hora","relativeTime":{"future":{"one":"dentro de {0} hora","other":"dentro de {0} horas"},"past":{"one":"hace {0} hora","other":"hace {0} horas"}}},"day":{"displayName":"día","relative":{"0":"hoy","1":"mañana","2":"pasado mañana","-2":"antes de ayer","-1":"ayer"},"relativeTime":{"future":{"one":"dentro de {0} día","other":"dentro de {0} días"},"past":{"one":"hace {0} día","other":"hace {0} días"}}},"month":{"displayName":"mes","relative":{"0":"este mes","1":"el próximo mes","-1":"el mes pasado"},"relativeTime":{"future":{"one":"dentro de {0} mes","other":"dentro de {0} meses"},"past":{"one":"hace {0} mes","other":"hace {0} meses"}}},"year":{"displayName":"año","relative":{"0":"este año","1":"el próximo año","-1":"el año pasado"},"relativeTime":{"future":{"one":"dentro de {0} año","other":"dentro de {0} años"},"past":{"one":"hace {0} año","other":"hace {0} años"}}}}});
ReactIntl.__addLocaleData({"locale":"et","pluralRuleFunction":function (n) {var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length;n=Math.floor(n);if(i===1&&v===0)return"one";return"other";},"fields":{"second":{"displayName":"sekund","relative":{"0":"nüüd"},"relativeTime":{"future":{"one":"{0} sekundi pärast","other":"{0} sekundi pärast"},"past":{"one":"{0} sekundi eest","other":"{0} sekundi eest"}}},"minute":{"displayName":"minut","relativeTime":{"future":{"one":"{0} minuti pärast","other":"{0} minuti pärast"},"past":{"one":"{0} minuti eest","other":"{0} minuti eest"}}},"hour":{"displayName":"tund","relativeTime":{"future":{"one":"{0} tunni pärast","other":"{0} tunni pärast"},"past":{"one":"{0} tunni eest","other":"{0} tunni eest"}}},"day":{"displayName":"päev","relative":{"0":"täna","1":"homme","2":"ülehomme","-2":"üleeile","-1":"eile"},"relativeTime":{"future":{"one":"{0} päeva pärast","other":"{0} päeva pärast"},"past":{"one":"{0} päeva eest","other":"{0} päeva eest"}}},"month":{"displayName":"kuu","relative":{"0":"käesolev kuu","1":"järgmine kuu","-1":"eelmine kuu"},"relativeTime":{"future":{"one":"{0} kuu pärast","other":"{0} kuu pärast"},"past":{"one":"{0} kuu eest","other":"{0} kuu eest"}}},"year":{"displayName":"aasta","relative":{"0":"käesolev aasta","1":"järgmine aasta","-1":"eelmine aasta"},"relativeTime":{"future":{"one":"{0} aasta pärast","other":"{0} aasta pärast"},"past":{"one":"{0} aasta eest","other":"{0} aasta eest"}}}}});
ReactIntl.__addLocaleData({"locale":"eu","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"Segundoa","relative":{"0":"orain"},"relativeTime":{"future":{"one":"{0} segundo barru","other":"{0} segundo barru"},"past":{"one":"Duela {0} segundo","other":"Duela {0} segundo"}}},"minute":{"displayName":"Minutua","relativeTime":{"future":{"one":"{0} minutu barru","other":"{0} minutu barru"},"past":{"one":"Duela {0} minutu","other":"Duela {0} minutu"}}},"hour":{"displayName":"Ordua","relativeTime":{"future":{"one":"{0} ordu barru","other":"{0} ordu barru"},"past":{"one":"Duela {0} ordu","other":"Duela {0} ordu"}}},"day":{"displayName":"Eguna","relative":{"0":"gaur","1":"bihar","2":"etzi","-2":"herenegun","-1":"atzo"},"relativeTime":{"future":{"one":"{0} egun barru","other":"{0} egun barru"},"past":{"one":"Duela {0} egun","other":"Duela {0} egun"}}},"month":{"displayName":"Hilabetea","relative":{"0":"hilabete hau","1":"hurrengo hilabetea","-1":"aurreko hilabetea"},"relativeTime":{"future":{"one":"{0} hilabete barru","other":"{0} hilabete barru"},"past":{"one":"Duela {0} hilabete","other":"Duela {0} hilabete"}}},"year":{"displayName":"Urtea","relative":{"0":"aurten","1":"hurrengo urtea","-1":"aurreko urtea"},"relativeTime":{"future":{"one":"{0} urte barru","other":"{0} urte barru"},"past":{"one":"Duela {0} urte","other":"Duela {0} urte"}}}}});
ReactIntl.__addLocaleData({"locale":"fa","pluralRuleFunction":function (n) {var i=Math.floor(Math.abs(n));n=Math.floor(n);if(i===0||n===1)return"one";return"other";},"fields":{"second":{"displayName":"ثانیه","relative":{"0":"اکنون"},"relativeTime":{"future":{"one":"{0} ثانیه بعد","other":"{0} ثانیه بعد"},"past":{"one":"{0} ثانیه پیش","other":"{0} ثانیه پیش"}}},"minute":{"displayName":"دقیقه","relativeTime":{"future":{"one":"{0} دقیقه بعد","other":"{0} دقیقه بعد"},"past":{"one":"{0} دقیقه پیش","other":"{0} دقیقه پیش"}}},"hour":{"displayName":"ساعت","relativeTime":{"future":{"one":"{0} ساعت بعد","other":"{0} ساعت بعد"},"past":{"one":"{0} ساعت پیش","other":"{0} ساعت پیش"}}},"day":{"displayName":"روز","relative":{"0":"امروز","1":"فردا","2":"پس‌فردا","-2":"پریروز","-1":"دیروز"},"relativeTime":{"future":{"one":"{0} روز بعد","other":"{0} روز بعد"},"past":{"one":"{0} روز پیش","other":"{0} روز پیش"}}},"month":{"displayName":"ماه","relative":{"0":"این ماه","1":"ماه آینده","-1":"ماه گذشته"},"relativeTime":{"future":{"one":"{0} ماه بعد","other":"{0} ماه بعد"},"past":{"one":"{0} ماه پیش","other":"{0} ماه پیش"}}},"year":{"displayName":"سال","relative":{"0":"امسال","1":"سال آینده","-1":"سال گذشته"},"relativeTime":{"future":{"one":"{0} سال بعد","other":"{0} سال بعد"},"past":{"one":"{0} سال پیش","other":"{0} سال پیش"}}}}});
ReactIntl.__addLocaleData({"locale":"ff","pluralRuleFunction":function (n) {var i=Math.floor(Math.abs(n));n=Math.floor(n);if(i===0||i===1)return"one";return"other";},"fields":{"second":{"displayName":"Majaango","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Hoƴom","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Waktu","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Ñalnde","relative":{"0":"Hannde","1":"Jaŋngo","-1":"Haŋki"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Lewru","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Hitaande","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"fi","pluralRuleFunction":function (n) {var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length;n=Math.floor(n);if(i===1&&v===0)return"one";return"other";},"fields":{"second":{"displayName":"sekunti","relative":{"0":"nyt"},"relativeTime":{"future":{"one":"{0} sekunnin päästä","other":"{0} sekunnin päästä"},"past":{"one":"{0} sekunti sitten","other":"{0} sekuntia sitten"}}},"minute":{"displayName":"minuutti","relativeTime":{"future":{"one":"{0} minuutin päästä","other":"{0} minuutin päästä"},"past":{"one":"{0} minuutti sitten","other":"{0} minuuttia sitten"}}},"hour":{"displayName":"tunti","relativeTime":{"future":{"one":"{0} tunnin päästä","other":"{0} tunnin päästä"},"past":{"one":"{0} tunti sitten","other":"{0} tuntia sitten"}}},"day":{"displayName":"päivä","relative":{"0":"tänään","1":"huomenna","2":"ylihuomenna","-2":"toissapäivänä","-1":"eilen"},"relativeTime":{"future":{"one":"{0} päivän päästä","other":"{0} päivän päästä"},"past":{"one":"{0} päivä sitten","other":"{0} päivää sitten"}}},"month":{"displayName":"kuukausi","relative":{"0":"tässä kuussa","1":"ensi kuussa","-1":"viime kuussa"},"relativeTime":{"future":{"one":"{0} kuukauden päästä","other":"{0} kuukauden päästä"},"past":{"one":"{0} kuukausi sitten","other":"{0} kuukautta sitten"}}},"year":{"displayName":"vuosi","relative":{"0":"tänä vuonna","1":"ensi vuonna","-1":"viime vuonna"},"relativeTime":{"future":{"one":"{0} vuoden päästä","other":"{0} vuoden päästä"},"past":{"one":"{0} vuosi sitten","other":"{0} vuotta sitten"}}}}});
ReactIntl.__addLocaleData({"locale":"fil","pluralRuleFunction":function (n) {var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length,f=parseInt(n.toString().replace(/^[^.]*\.?/,""),10);n=Math.floor(n);if(v===0&&(i===1||i===2||i===3||v===0&&(!(i%10===4||i%10===6||i%10===9)||(v!==0)&&!(f%10===4||f%10===6||f%10===9))))return"one";return"other";},"fields":{"second":{"displayName":"Segundo","relative":{"0":"ngayon"},"relativeTime":{"future":{"one":"Sa loob ng {0} segundo","other":"Sa loob ng {0} segundo"},"past":{"one":"{0} segundo ang nakalipas","other":"{0} segundo ang nakalipas"}}},"minute":{"displayName":"Minuto","relativeTime":{"future":{"one":"Sa loob ng {0} minuto","other":"Sa loob ng {0} minuto"},"past":{"one":"{0} minuto ang nakalipas","other":"{0} minuto ang nakalipas"}}},"hour":{"displayName":"Oras","relativeTime":{"future":{"one":"Sa loob ng {0} oras","other":"Sa loob ng {0} oras"},"past":{"one":"{0} oras ang nakalipas","other":"{0} oras ang nakalipas"}}},"day":{"displayName":"Araw","relative":{"0":"Ngayon","1":"Bukas","2":"Samakalawa","-2":"Araw bago ang kahapon","-1":"Kahapon"},"relativeTime":{"future":{"one":"Sa loob ng {0} araw","other":"Sa loob ng {0} araw"},"past":{"one":"{0} araw ang nakalipas","other":"{0} araw ang nakalipas"}}},"month":{"displayName":"Buwan","relative":{"0":"ngayong buwan","1":"susunod na buwan","-1":"nakaraang buwan"},"relativeTime":{"future":{"one":"Sa loob ng {0} buwan","other":"Sa loob ng {0} buwan"},"past":{"one":"{0} buwan ang nakalipas","other":"{0} buwan ang nakalipas"}}},"year":{"displayName":"Taon","relative":{"0":"ngayong taon","1":"susunod na taon","-1":"nakaraang taon"},"relativeTime":{"future":{"one":"Sa loob ng {0} taon","other":"Sa loob ng {0} taon"},"past":{"one":"{0} taon ang nakalipas","other":"{0} taon ang nakalipas"}}}}});
ReactIntl.__addLocaleData({"locale":"fo","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"sekund","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"mínúta","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"klukkustund","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"dagur","relative":{"0":"í dag","1":"á morgunn","2":"á yfirmorgunn","-2":"í fyrradag","-1":"í gær"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"mánuður","relative":{"0":"henda mánuður","1":"næstu mánuður","-1":"síðstu mánuður"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"ár","relative":{"0":"hetta ár","1":"næstu ár","-1":"síðstu ár"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"fr","pluralRuleFunction":function (n) {var i=Math.floor(Math.abs(n));n=Math.floor(n);if(i===0||i===1)return"one";return"other";},"fields":{"second":{"displayName":"seconde","relative":{"0":"maintenant"},"relativeTime":{"future":{"one":"dans {0} seconde","other":"dans {0} secondes"},"past":{"one":"il y a {0} seconde","other":"il y a {0} secondes"}}},"minute":{"displayName":"minute","relativeTime":{"future":{"one":"dans {0} minute","other":"dans {0} minutes"},"past":{"one":"il y a {0} minute","other":"il y a {0} minutes"}}},"hour":{"displayName":"heure","relativeTime":{"future":{"one":"dans {0} heure","other":"dans {0} heures"},"past":{"one":"il y a {0} heure","other":"il y a {0} heures"}}},"day":{"displayName":"jour","relative":{"0":"aujourd’hui","1":"demain","2":"après-demain","-2":"avant-hier","-1":"hier"},"relativeTime":{"future":{"one":"dans {0} jour","other":"dans {0} jours"},"past":{"one":"il y a {0} jour","other":"il y a {0} jours"}}},"month":{"displayName":"mois","relative":{"0":"ce mois-ci","1":"le mois prochain","-1":"le mois dernier"},"relativeTime":{"future":{"one":"dans {0} mois","other":"dans {0} mois"},"past":{"one":"il y a {0} mois","other":"il y a {0} mois"}}},"year":{"displayName":"année","relative":{"0":"cette année","1":"l’année prochaine","-1":"l’année dernière"},"relativeTime":{"future":{"one":"dans {0} an","other":"dans {0} ans"},"past":{"one":"il y a {0} an","other":"il y a {0} ans"}}}}});
ReactIntl.__addLocaleData({"locale":"fur","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"secont","relative":{"0":"now"},"relativeTime":{"future":{"one":"ca di {0} secont","other":"ca di {0} seconts"},"past":{"one":"{0} secont indaûr","other":"{0} seconts indaûr"}}},"minute":{"displayName":"minût","relativeTime":{"future":{"one":"ca di {0} minût","other":"ca di {0} minûts"},"past":{"one":"{0} minût indaûr","other":"{0} minûts indaûr"}}},"hour":{"displayName":"ore","relativeTime":{"future":{"one":"ca di {0} ore","other":"ca di {0} oris"},"past":{"one":"{0} ore indaûr","other":"{0} oris indaûr"}}},"day":{"displayName":"dì","relative":{"0":"vuê","1":"doman","2":"passantdoman","-2":"îr l'altri","-1":"îr"},"relativeTime":{"future":{"one":"ca di {0} zornade","other":"ca di {0} zornadis"},"past":{"one":"{0} zornade indaûr","other":"{0} zornadis indaûr"}}},"month":{"displayName":"mês","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"one":"ca di {0} mês","other":"ca di {0} mês"},"past":{"one":"{0} mês indaûr","other":"{0} mês indaûr"}}},"year":{"displayName":"an","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"one":"ca di {0} an","other":"ca di {0} agns"},"past":{"one":"{0} an indaûr","other":"{0} agns indaûr"}}}}});
ReactIntl.__addLocaleData({"locale":"fy","pluralRuleFunction":function (n) {var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length;n=Math.floor(n);if(i===1&&v===0)return"one";return"other";},"fields":{"second":{"displayName":"Sekonde","relative":{"0":"nu"},"relativeTime":{"future":{"one":"Oer {0} sekonde","other":"Oer {0} sekonden"},"past":{"one":"{0} sekonde lyn","other":"{0} sekonden lyn"}}},"minute":{"displayName":"Minút","relativeTime":{"future":{"one":"Oer {0} minút","other":"Oer {0} minuten"},"past":{"one":"{0} minút lyn","other":"{0} minuten lyn"}}},"hour":{"displayName":"oere","relativeTime":{"future":{"one":"Oer {0} oere","other":"Oer {0} oere"},"past":{"one":"{0} oere lyn","other":"{0} oere lyn"}}},"day":{"displayName":"dei","relative":{"0":"vandaag","1":"morgen","2":"Oermorgen","-2":"eergisteren","-1":"gisteren"},"relativeTime":{"future":{"one":"Oer {0} dei","other":"Oer {0} deien"},"past":{"one":"{0} dei lyn","other":"{0} deien lyn"}}},"month":{"displayName":"Moanne","relative":{"0":"dizze moanne","1":"folgjende moanne","-1":"foarige moanne"},"relativeTime":{"future":{"one":"Oer {0} moanne","other":"Oer {0} moannen"},"past":{"one":"{0} moanne lyn","other":"{0} moannen lyn"}}},"year":{"displayName":"Jier","relative":{"0":"dit jier","1":"folgjend jier","-1":"foarich jier"},"relativeTime":{"future":{"one":"Oer {0} jier","other":"Oer {0} jier"},"past":{"one":"{0} jier lyn","other":"{0} jier lyn"}}}}});
ReactIntl.__addLocaleData({"locale":"ga","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";if(n===2)return"two";if(n===Math.floor(n)&&n>=3&&n<=6)return"few";if(n===Math.floor(n)&&n>=7&&n<=10)return"many";return"other";},"fields":{"second":{"displayName":"Soicind","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Nóiméad","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Uair","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Lá","relative":{"0":"Inniu","1":"Amárach","2":"Arú amárach","-2":"Arú inné","-1":"Inné"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Mí","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Bliain","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"gd","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1||n===11)return"one";if(n===2||n===12)return"two";if(n===Math.floor(n)&&(n>=3&&n<=10||n>=13&&n<=19))return"few";return"other";},"fields":{"second":{"displayName":"Diog","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Mionaid","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Uair a thìde","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Latha","relative":{"0":"An-diugh","1":"A-màireach","2":"An-earar","-2":"A-bhòin-dè","-1":"An-dè"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Mìos","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Bliadhna","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"gl","pluralRuleFunction":function (n) {var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length;n=Math.floor(n);if(i===1&&v===0)return"one";return"other";},"fields":{"second":{"displayName":"Segundo","relative":{"0":"agora"},"relativeTime":{"future":{"one":"En {0} segundo","other":"En {0} segundos"},"past":{"one":"Hai {0} segundo","other":"Hai {0} segundos"}}},"minute":{"displayName":"Minuto","relativeTime":{"future":{"one":"En {0} minuto","other":"En {0} minutos"},"past":{"one":"Hai {0} minuto","other":"Hai {0} minutos"}}},"hour":{"displayName":"Hora","relativeTime":{"future":{"one":"En {0} hora","other":"En {0} horas"},"past":{"one":"Hai {0} hora","other":"Hai {0} horas"}}},"day":{"displayName":"Día","relative":{"0":"hoxe","1":"mañá","2":"pasadomañá","-2":"antonte","-1":"onte"},"relativeTime":{"future":{"one":"En {0} día","other":"En {0} días"},"past":{"one":"Hai {0} día","other":"Hai {0} días"}}},"month":{"displayName":"Mes","relative":{"0":"este mes","1":"mes seguinte","-1":"mes pasado"},"relativeTime":{"future":{"one":"En {0} mes","other":"En {0} meses"},"past":{"one":"Hai {0} mes","other":"Hai {0} meses"}}},"year":{"displayName":"Ano","relative":{"0":"este ano","1":"seguinte ano","-1":"ano pasado"},"relativeTime":{"future":{"one":"En {0} ano","other":"En {0} anos"},"past":{"one":"Hai {0} ano","other":"Hai {0} anos"}}}}});
ReactIntl.__addLocaleData({"locale":"gsw","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"Sekunde","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Minuute","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Schtund","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Tag","relative":{"0":"hüt","1":"moorn","2":"übermoorn","-2":"vorgeschter","-1":"geschter"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Monet","relative":{"0":"diese Monet","1":"nächste Monet","-1":"letzte Monet"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Jaar","relative":{"0":"diese Jaar","1":"nächste Jaar","-1":"letzte Jaar"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"gu","pluralRuleFunction":function (n) {var i=Math.floor(Math.abs(n));n=Math.floor(n);if(i===0||n===1)return"one";return"other";},"fields":{"second":{"displayName":"સેકન્ડ","relative":{"0":"હમણાં"},"relativeTime":{"future":{"one":"{0} સેકંડમાં","other":"{0} સેકંડમાં"},"past":{"one":"{0} સેકંડ પહેલા","other":"{0} સેકંડ પહેલા"}}},"minute":{"displayName":"મિનિટ","relativeTime":{"future":{"one":"{0} મિનિટમાં","other":"{0} મિનિટમાં"},"past":{"one":"{0} મિનિટ પહેલા","other":"{0} મિનિટ પહેલા"}}},"hour":{"displayName":"કલાક","relativeTime":{"future":{"one":"{0} કલાકમાં","other":"{0} કલાકમાં"},"past":{"one":"{0} કલાક પહેલા","other":"{0} કલાક પહેલા"}}},"day":{"displayName":"દિવસ","relative":{"0":"આજે","1":"આવતીકાલે","2":"પરમદિવસે","-2":"ગયા પરમદિવસે","-1":"ગઈકાલે"},"relativeTime":{"future":{"one":"{0} દિવસમાં","other":"{0} દિવસમાં"},"past":{"one":"{0} દિવસ પહેલા","other":"{0} દિવસ પહેલા"}}},"month":{"displayName":"મહિનો","relative":{"0":"આ મહિને","1":"આવતા મહિને","-1":"ગયા મહિને"},"relativeTime":{"future":{"one":"{0} મહિનામાં","other":"{0} મહિનામાં"},"past":{"one":"{0} મહિના પહેલા","other":"{0} મહિના પહેલા"}}},"year":{"displayName":"વર્ષ","relative":{"0":"આ વર્ષે","1":"આવતા વર્ષે","-1":"ગયા વર્ષે"},"relativeTime":{"future":{"one":"{0} વર્ષમાં","other":"{0} વર્ષમાં"},"past":{"one":"{0} વર્ષ પહેલા","other":"{0} વર્ષ પહેલા"}}}}});
ReactIntl.__addLocaleData({"locale":"gv","pluralRuleFunction":function (n) {var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length;n=Math.floor(n);if(v===0&&i%10===1)return"one";if(v===0&&i%10===2)return"two";if(v===0&&(i%100===0||i%100===20||i%100===40||i%100===60||i%100===80))return"few";if((v!==0))return"many";return"other";},"fields":{"second":{"displayName":"Second","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Minute","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Hour","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Day","relative":{"0":"today","1":"tomorrow","-1":"yesterday"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Month","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Year","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"ha","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"Daƙiƙa","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Minti","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Awa","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Kwana","relative":{"0":"Yau","1":"Gobe","-1":"Jiya"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Wata","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Shekara","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"haw","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"Second","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Minute","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Hour","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Day","relative":{"0":"today","1":"tomorrow","-1":"yesterday"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Month","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Year","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"he","pluralRuleFunction":function (n) {var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length;n=Math.floor(n);if(i===1&&v===0)return"one";if(i===2&&v===0)return"two";if(v===0&&!(n>=0&&n<=10)&&n%10===0)return"many";return"other";},"fields":{"second":{"displayName":"שנייה","relative":{"0":"עכשיו"},"relativeTime":{"future":{"one":"בעוד שנייה {0}","two":"בעוד {0} שניות","many":"בעוד {0} שניות","other":"בעוד {0} שניות"},"past":{"one":"לפני שנייה {0}","two":"לפני {0} שניות","many":"לפני {0} שניות","other":"לפני {0} שניות"}}},"minute":{"displayName":"דקה","relativeTime":{"future":{"one":"בעוד דקה {0}","two":"בעוד {0} דקות","many":"בעוד {0} דקות","other":"בעוד {0} דקות"},"past":{"one":"לפני דקה {0}","two":"לפני {0} דקות","many":"לפני {0} דקות","other":"לפני {0} דקות"}}},"hour":{"displayName":"שעה","relativeTime":{"future":{"one":"בעוד שעה {0}","two":"בעוד {0} שעות","many":"בעוד {0} שעות","other":"בעוד {0} שעות"},"past":{"one":"לפני שעה {0}","two":"לפני {0} שעות","many":"לפני {0} שעות","other":"לפני {0} שעות"}}},"day":{"displayName":"יום","relative":{"0":"היום","1":"מחר","2":"מחרתיים","-2":"שלשום","-1":"אתמול"},"relativeTime":{"future":{"one":"בעוד יום {0}","two":"בעוד {0} ימים","many":"בעוד {0} ימים","other":"בעוד {0} ימים"},"past":{"one":"לפני יום {0}","two":"לפני {0} ימים","many":"לפני {0} ימים","other":"לפני {0} ימים"}}},"month":{"displayName":"חודש","relative":{"0":"החודש","1":"החודש הבא","-1":"החודש שעבר"},"relativeTime":{"future":{"one":"בעוד חודש {0}","two":"בעוד {0} חודשים","many":"בעוד {0} חודשים","other":"בעוד {0} חודשים"},"past":{"one":"לפני חודש {0}","two":"לפני {0} חודשים","many":"לפני {0} חודשים","other":"לפני {0} חודשים"}}},"year":{"displayName":"שנה","relative":{"0":"השנה","1":"השנה הבאה","-1":"השנה שעברה"},"relativeTime":{"future":{"one":"בעוד שנה {0}","two":"בעוד {0} שנים","many":"בעוד {0} שנים","other":"בעוד {0} שנים"},"past":{"one":"לפני שנה {0}","two":"לפני {0} שנים","many":"לפני {0} שנים","other":"לפני {0} שנים"}}}}});
ReactIntl.__addLocaleData({"locale":"hi","pluralRuleFunction":function (n) {var i=Math.floor(Math.abs(n));n=Math.floor(n);if(i===0||n===1)return"one";return"other";},"fields":{"second":{"displayName":"सेकंड","relative":{"0":"अब"},"relativeTime":{"future":{"one":"{0} सेकंड में","other":"{0} सेकंड में"},"past":{"one":"{0} सेकंड पहले","other":"{0} सेकंड पहले"}}},"minute":{"displayName":"मिनट","relativeTime":{"future":{"one":"{0} मिनट में","other":"{0} मिनट में"},"past":{"one":"{0} मिनट पहले","other":"{0} मिनट पहले"}}},"hour":{"displayName":"घंटा","relativeTime":{"future":{"one":"{0} घंटे में","other":"{0} घंटे में"},"past":{"one":"{0} घंटे पहले","other":"{0} घंटे पहले"}}},"day":{"displayName":"दिन","relative":{"0":"आज","1":"आने वाला कल","2":"परसों","-2":"बीता परसों","-1":"बीता कल"},"relativeTime":{"future":{"one":"{0} दिन में","other":"{0} दिन में"},"past":{"one":"{0} दिन पहले","other":"{0} दिन पहले"}}},"month":{"displayName":"माह","relative":{"0":"यह माह","1":"अगला माह","-1":"पिछला माह"},"relativeTime":{"future":{"one":"{0} माह में","other":"{0} माह में"},"past":{"one":"{0} माह पहले","other":"{0} माह पहले"}}},"year":{"displayName":"वर्ष","relative":{"0":"यह वर्ष","1":"अगला वर्ष","-1":"पिछला वर्ष"},"relativeTime":{"future":{"one":"{0} वर्ष में","other":"{0} वर्ष में"},"past":{"one":"{0} वर्ष पहले","other":"{0} वर्ष पहले"}}}}});
ReactIntl.__addLocaleData({"locale":"hr","pluralRuleFunction":function (n) {var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length,f=parseInt(n.toString().replace(/^[^.]*\.?/,""),10);n=Math.floor(n);if(v===0&&i%10===1&&((i%100!==11)||f%10===1&&(f%100!==11)))return"one";if(v===0&&i%10===Math.floor(i%10)&&i%10>=2&&i%10<=4&&(!(i%100>=12&&i%100<=14)||f%10===Math.floor(f%10)&&f%10>=2&&f%10<=4&&!(f%100>=12&&f%100<=14)))return"few";return"other";},"fields":{"second":{"displayName":"Sekunda","relative":{"0":"sada"},"relativeTime":{"future":{"one":"za {0} sekundu","few":"za {0} sekunde","other":"za {0} sekundi"},"past":{"one":"prije {0} sekundu","few":"prije {0} sekunde","other":"prije {0} sekundi"}}},"minute":{"displayName":"Minuta","relativeTime":{"future":{"one":"za {0} minutu","few":"za {0} minute","other":"za {0} minuta"},"past":{"one":"prije {0} minutu","few":"prije {0} minute","other":"prije {0} minuta"}}},"hour":{"displayName":"Sat","relativeTime":{"future":{"one":"za {0} sat","few":"za {0} sata","other":"za {0} sati"},"past":{"one":"prije {0} sat","few":"prije {0} sata","other":"prije {0} sati"}}},"day":{"displayName":"Dan","relative":{"0":"danas","1":"sutra","2":"prekosutra","-2":"prekjučer","-1":"jučer"},"relativeTime":{"future":{"one":"za {0} dan","few":"za {0} dana","other":"za {0} dana"},"past":{"one":"prije {0} dan","few":"prije {0} dana","other":"prije {0} dana"}}},"month":{"displayName":"Mjesec","relative":{"0":"ovaj mjesec","1":"sljedeći mjesec","-1":"prošli mjesec"},"relativeTime":{"future":{"one":"za {0} mjesec","few":"za {0} mjeseca","other":"za {0} mjeseci"},"past":{"one":"prije {0} mjesec","few":"prije {0} mjeseca","other":"prije {0} mjeseci"}}},"year":{"displayName":"Godina","relative":{"0":"ove godine","1":"sljedeće godine","-1":"prošle godine"},"relativeTime":{"future":{"one":"za {0} godinu","few":"za {0} godine","other":"za {0} godina"},"past":{"one":"prije {0} godinu","few":"prije {0} godine","other":"prije {0} godina"}}}}});
ReactIntl.__addLocaleData({"locale":"hu","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"másodperc","relative":{"0":"most"},"relativeTime":{"future":{"one":"{0} másodperc múlva","other":"{0} másodperc múlva"},"past":{"one":"{0} másodperccel ezelőtt","other":"{0} másodperccel ezelőtt"}}},"minute":{"displayName":"perc","relativeTime":{"future":{"one":"{0} perc múlva","other":"{0} perc múlva"},"past":{"one":"{0} perccel ezelőtt","other":"{0} perccel ezelőtt"}}},"hour":{"displayName":"óra","relativeTime":{"future":{"one":"{0} óra múlva","other":"{0} óra múlva"},"past":{"one":"{0} órával ezelőtt","other":"{0} órával ezelőtt"}}},"day":{"displayName":"nap","relative":{"0":"ma","1":"holnap","2":"holnapután","-2":"tegnapelőtt","-1":"tegnap"},"relativeTime":{"future":{"one":"{0} nap múlva","other":"{0} nap múlva"},"past":{"one":"{0} nappal ezelőtt","other":"{0} nappal ezelőtt"}}},"month":{"displayName":"hónap","relative":{"0":"ez a hónap","1":"következő hónap","-1":"előző hónap"},"relativeTime":{"future":{"one":"{0} hónap múlva","other":"{0} hónap múlva"},"past":{"one":"{0} hónappal ezelőtt","other":"{0} hónappal ezelőtt"}}},"year":{"displayName":"év","relative":{"0":"ez az év","1":"következő év","-1":"előző év"},"relativeTime":{"future":{"one":"{0} év múlva","other":"{0} év múlva"},"past":{"one":"{0} évvel ezelőtt","other":"{0} évvel ezelőtt"}}}}});
ReactIntl.__addLocaleData({"locale":"hy","pluralRuleFunction":function (n) {var i=Math.floor(Math.abs(n));n=Math.floor(n);if(i===0||i===1)return"one";return"other";},"fields":{"second":{"displayName":"Վայրկյան","relative":{"0":"այժմ"},"relativeTime":{"future":{"one":"{0} վայրկյան անց","other":"{0} վայրկյան անց"},"past":{"one":"{0} վայրկյան առաջ","other":"{0} վայրկյան առաջ"}}},"minute":{"displayName":"Րոպե","relativeTime":{"future":{"one":"{0} րոպե անց","other":"{0} րոպե անց"},"past":{"one":"{0} րոպե առաջ","other":"{0} րոպե առաջ"}}},"hour":{"displayName":"Ժամ","relativeTime":{"future":{"one":"{0} ժամ անց","other":"{0} ժամ անց"},"past":{"one":"{0} ժամ առաջ","other":"{0} ժամ առաջ"}}},"day":{"displayName":"Օր","relative":{"0":"այսօր","1":"վաղը","2":"վաղը չէ մյուս օրը","-2":"երեկ չէ առաջի օրը","-1":"երեկ"},"relativeTime":{"future":{"one":"{0} օր անց","other":"{0} օր անց"},"past":{"one":"{0} օր առաջ","other":"{0} օր առաջ"}}},"month":{"displayName":"Ամիս","relative":{"0":"այս ամիս","1":"հաջորդ ամիս","-1":"անցյալ ամիս"},"relativeTime":{"future":{"one":"{0} ամիս անց","other":"{0} ամիս անց"},"past":{"one":"{0} ամիս առաջ","other":"{0} ամիս առաջ"}}},"year":{"displayName":"Տարի","relative":{"0":"այս տարի","1":"հաջորդ տարի","-1":"անցյալ տարի"},"relativeTime":{"future":{"one":"{0} տարի անց","other":"{0} տարի անց"},"past":{"one":"{0} տարի առաջ","other":"{0} տարի առաջ"}}}}});
ReactIntl.__addLocaleData({"locale":"id","pluralRuleFunction":function (n) {return"other";},"fields":{"second":{"displayName":"Detik","relative":{"0":"sekarang"},"relativeTime":{"future":{"other":"Dalam {0} detik"},"past":{"other":"{0} detik yang lalu"}}},"minute":{"displayName":"Menit","relativeTime":{"future":{"other":"Dalam {0} menit"},"past":{"other":"{0} menit yang lalu"}}},"hour":{"displayName":"Jam","relativeTime":{"future":{"other":"Dalam {0} jam"},"past":{"other":"{0} jam yang lalu"}}},"day":{"displayName":"Hari","relative":{"0":"hari ini","1":"besok","2":"lusa","-2":"kemarin lusa","-1":"kemarin"},"relativeTime":{"future":{"other":"Dalam {0} hari"},"past":{"other":"{0} hari yang lalu"}}},"month":{"displayName":"Bulan","relative":{"0":"bulan ini","1":"Bulan berikutnya","-1":"bulan lalu"},"relativeTime":{"future":{"other":"Dalam {0} bulan"},"past":{"other":"{0} bulan yang lalu"}}},"year":{"displayName":"Tahun","relative":{"0":"tahun ini","1":"tahun depan","-1":"tahun lalu"},"relativeTime":{"future":{"other":"Dalam {0} tahun"},"past":{"other":"{0} tahun yang lalu"}}}}});
ReactIntl.__addLocaleData({"locale":"ig","pluralRuleFunction":function (n) {return"other";},"fields":{"second":{"displayName":"Nkejinta","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Nkeji","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Elekere","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Ụbọchị","relative":{"0":"Taata","1":"Echi","-1":"Nnyaafụ"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Ọnwa","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Afọ","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"ii","pluralRuleFunction":function (n) {return"other";},"fields":{"second":{"displayName":"ꇙ","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"ꃏ","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"ꄮꈉ","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"ꑍ","relative":{"0":"ꀃꑍ","1":"ꃆꏂꑍ","2":"ꌕꀿꑍ","-2":"ꎴꂿꋍꑍ","-1":"ꀋꅔꉈ"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"ꆪ","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"ꈎ","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"is","pluralRuleFunction":function (n) {var i=Math.floor(Math.abs(n)),t=parseInt(n.toString().replace(/^[^.]*\.?|0+$/g,""),10);n=Math.floor(n);if(t===0&&i%10===1&&((i%100!==11)||(t!==0)))return"one";return"other";},"fields":{"second":{"displayName":"sekúnda","relative":{"0":"núna"},"relativeTime":{"future":{"one":"eftir {0} sekúndu","other":"eftir {0} sekúndur"},"past":{"one":"fyrir {0} sekúndu","other":"fyrir {0} sekúndum"}}},"minute":{"displayName":"mínúta","relativeTime":{"future":{"one":"eftir {0} mínútu","other":"eftir {0} mínútur"},"past":{"one":"fyrir {0} mínútu","other":"fyrir {0} mínútum"}}},"hour":{"displayName":"klukkustund","relativeTime":{"future":{"one":"eftir {0} klukkustund","other":"eftir {0} klukkustundir"},"past":{"one":"fyrir {0} klukkustund","other":"fyrir {0} klukkustundum"}}},"day":{"displayName":"dagur","relative":{"0":"í dag","1":"á morgun","2":"eftir tvo daga","-2":"í fyrradag","-1":"í gær"},"relativeTime":{"future":{"one":"eftir {0} dag","other":"eftir {0} daga"},"past":{"one":"fyrir {0} degi","other":"fyrir {0} dögum"}}},"month":{"displayName":"mánuður","relative":{"0":"í þessum mánuði","1":"í næsta mánuði","-1":"í síðasta mánuði"},"relativeTime":{"future":{"one":"eftir {0} mánuð","other":"eftir {0} mánuði"},"past":{"one":"fyrir {0} mánuði","other":"fyrir {0} mánuðum"}}},"year":{"displayName":"ár","relative":{"0":"á þessu ári","1":"á næsta ári","-1":"á síðasta ári"},"relativeTime":{"future":{"one":"eftir {0} ár","other":"eftir {0} ár"},"past":{"one":"fyrir {0} ári","other":"fyrir {0} árum"}}}}});
ReactIntl.__addLocaleData({"locale":"it","pluralRuleFunction":function (n) {var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length;n=Math.floor(n);if(i===1&&v===0)return"one";return"other";},"fields":{"second":{"displayName":"secondo","relative":{"0":"ora"},"relativeTime":{"future":{"one":"tra {0} secondo","other":"tra {0} secondi"},"past":{"one":"{0} secondo fa","other":"{0} secondi fa"}}},"minute":{"displayName":"minuto","relativeTime":{"future":{"one":"tra {0} minuto","other":"tra {0} minuti"},"past":{"one":"{0} minuto fa","other":"{0} minuti fa"}}},"hour":{"displayName":"ora","relativeTime":{"future":{"one":"tra {0} ora","other":"tra {0} ore"},"past":{"one":"{0} ora fa","other":"{0} ore fa"}}},"day":{"displayName":"giorno","relative":{"0":"oggi","1":"domani","2":"dopodomani","-2":"l'altro ieri","-1":"ieri"},"relativeTime":{"future":{"one":"tra {0} giorno","other":"tra {0} giorni"},"past":{"one":"{0} giorno fa","other":"{0} giorni fa"}}},"month":{"displayName":"mese","relative":{"0":"questo mese","1":"mese prossimo","-1":"mese scorso"},"relativeTime":{"future":{"one":"tra {0} mese","other":"tra {0} mesi"},"past":{"one":"{0} mese fa","other":"{0} mesi fa"}}},"year":{"displayName":"anno","relative":{"0":"quest'anno","1":"anno prossimo","-1":"anno scorso"},"relativeTime":{"future":{"one":"tra {0} anno","other":"tra {0} anni"},"past":{"one":"{0} anno fa","other":"{0} anni fa"}}}}});
ReactIntl.__addLocaleData({"locale":"ja","pluralRuleFunction":function (n) {return"other";},"fields":{"second":{"displayName":"秒","relative":{"0":"今すぐ"},"relativeTime":{"future":{"other":"{0} 秒後"},"past":{"other":"{0} 秒前"}}},"minute":{"displayName":"分","relativeTime":{"future":{"other":"{0} 分後"},"past":{"other":"{0} 分前"}}},"hour":{"displayName":"時","relativeTime":{"future":{"other":"{0} 時間後"},"past":{"other":"{0} 時間前"}}},"day":{"displayName":"日","relative":{"0":"今日","1":"明日","2":"明後日","-2":"一昨日","-1":"昨日"},"relativeTime":{"future":{"other":"{0} 日後"},"past":{"other":"{0} 日前"}}},"month":{"displayName":"月","relative":{"0":"今月","1":"翌月","-1":"先月"},"relativeTime":{"future":{"other":"{0} か月後"},"past":{"other":"{0} か月前"}}},"year":{"displayName":"年","relative":{"0":"今年","1":"翌年","-1":"昨年"},"relativeTime":{"future":{"other":"{0} 年後"},"past":{"other":"{0} 年前"}}}}});
ReactIntl.__addLocaleData({"locale":"jgo","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"Second","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Minute","relativeTime":{"future":{"one":"nǔu {0} minút","other":"nǔu {0} minút"},"past":{"one":"ɛ́ gɛ́ mɔ́ minút {0}","other":"ɛ́ gɛ́ mɔ́ minút {0}"}}},"hour":{"displayName":"Hour","relativeTime":{"future":{"one":"nǔu háwa {0}","other":"nǔu háwa {0}"},"past":{"one":"ɛ́ gɛ mɔ́ {0} háwa","other":"ɛ́ gɛ mɔ́ {0} háwa"}}},"day":{"displayName":"Day","relative":{"0":"lɔꞋɔ","1":"tomorrow","-1":"yesterday"},"relativeTime":{"future":{"one":"Nǔu lɛ́Ꞌ {0}","other":"Nǔu lɛ́Ꞌ {0}"},"past":{"one":"Ɛ́ gɛ́ mɔ́ lɛ́Ꞌ {0}","other":"Ɛ́ gɛ́ mɔ́ lɛ́Ꞌ {0}"}}},"month":{"displayName":"Month","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"one":"Nǔu {0} saŋ","other":"Nǔu {0} saŋ"},"past":{"one":"ɛ́ gɛ́ mɔ́ pɛsaŋ {0}","other":"ɛ́ gɛ́ mɔ́ pɛsaŋ {0}"}}},"year":{"displayName":"Year","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"one":"Nǔu ŋguꞋ {0}","other":"Nǔu ŋguꞋ {0}"},"past":{"one":"Ɛ́gɛ́ mɔ́ ŋguꞋ {0}","other":"Ɛ́gɛ́ mɔ́ ŋguꞋ {0}"}}}}});
ReactIntl.__addLocaleData({"locale":"jmc","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"Sekunde","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Dakyika","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Saa","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Mfiri","relative":{"0":"Inu","1":"Ngama","-1":"Ukou"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Mori","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Maka","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"ka","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"წამი","relative":{"0":"ახლა"},"relativeTime":{"future":{"one":"{0} წამში","other":"{0} წამში"},"past":{"one":"{0} წამის წინ","other":"{0} წამის წინ"}}},"minute":{"displayName":"წუთი","relativeTime":{"future":{"one":"{0} წუთში","other":"{0} წუთში"},"past":{"one":"{0} წუთის წინ","other":"{0} წუთის წინ"}}},"hour":{"displayName":"საათი","relativeTime":{"future":{"one":"{0} საათში","other":"{0} საათში"},"past":{"one":"{0} საათის წინ","other":"{0} საათის წინ"}}},"day":{"displayName":"დღე","relative":{"0":"დღეს","1":"ხვალ","2":"ზეგ","-2":"გუშინწინ","-1":"გუშინ"},"relativeTime":{"future":{"one":"{0} დღეში","other":"{0} დღეში"},"past":{"one":"{0} დღის წინ","other":"{0} დღის წინ"}}},"month":{"displayName":"თვე","relative":{"0":"ამ თვეში","1":"მომავალ თვეს","-1":"გასულ თვეს"},"relativeTime":{"future":{"one":"{0} თვეში","other":"{0} თვეში"},"past":{"one":"{0} თვის წინ","other":"{0} თვის წინ"}}},"year":{"displayName":"წელი","relative":{"0":"ამ წელს","1":"მომავალ წელს","-1":"გასულ წელს"},"relativeTime":{"future":{"one":"{0} წელიწადში","other":"{0} წელიწადში"},"past":{"one":"{0} წლის წინ","other":"{0} წლის წინ"}}}}});
ReactIntl.__addLocaleData({"locale":"kab","pluralRuleFunction":function (n) {var i=Math.floor(Math.abs(n));n=Math.floor(n);if(i===0||i===1)return"one";return"other";},"fields":{"second":{"displayName":"Tasint","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Tamrect","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Tamert","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Ass","relative":{"0":"Ass-a","1":"Azekka","-1":"Iḍelli"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Aggur","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Aseggas","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"kde","pluralRuleFunction":function (n) {return"other";},"fields":{"second":{"displayName":"Sekunde","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Dakika","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Saa","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Lihiku","relative":{"0":"Nelo","1":"Nundu","-1":"Lido"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Mwedi","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Mwaka","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"kea","pluralRuleFunction":function (n) {return"other";},"fields":{"second":{"displayName":"Sigundu","relative":{"0":"now"},"relativeTime":{"future":{"other":"di li {0} sigundu"},"past":{"other":"a ten {0} sigundu"}}},"minute":{"displayName":"Minutu","relativeTime":{"future":{"other":"di li {0} minutu"},"past":{"other":"a ten {0} minutu"}}},"hour":{"displayName":"Ora","relativeTime":{"future":{"other":"di li {0} ora"},"past":{"other":"a ten {0} ora"}}},"day":{"displayName":"Dia","relative":{"0":"Oji","1":"Manha","-1":"Onti"},"relativeTime":{"future":{"other":"di li {0} dia"},"past":{"other":"a ten {0} dia"}}},"month":{"displayName":"Mes","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"di li {0} mes"},"past":{"other":"a ten {0} mes"}}},"year":{"displayName":"Anu","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"di li {0} anu"},"past":{"other":"a ten {0} anu"}}}}});
ReactIntl.__addLocaleData({"locale":"kk","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"секунд","relative":{"0":"қазір"},"relativeTime":{"future":{"one":"{0} секундтан кейін","other":"{0} секундтан кейін"},"past":{"one":"{0} секунд бұрын","other":"{0} секунд бұрын"}}},"minute":{"displayName":"минут","relativeTime":{"future":{"one":"{0} минуттан кейін","other":"{0} минуттан кейін"},"past":{"one":"{0} минут бұрын","other":"{0} минут бұрын"}}},"hour":{"displayName":"сағат","relativeTime":{"future":{"one":"{0} сағаттан кейін","other":"{0} сағаттан кейін"},"past":{"one":"{0} сағат бұрын","other":"{0} сағат бұрын"}}},"day":{"displayName":"күн","relative":{"0":"бүгін","1":"ертең","2":"арғы күні","-2":"алдыңғы күні","-1":"кеше"},"relativeTime":{"future":{"one":"{0} күннен кейін","other":"{0} күннен кейін"},"past":{"one":"{0} күн бұрын","other":"{0} күн бұрын"}}},"month":{"displayName":"ай","relative":{"0":"осы ай","1":"келесі ай","-1":"өткен ай"},"relativeTime":{"future":{"one":"{0} айдан кейін","other":"{0} айдан кейін"},"past":{"one":"{0} ай бұрын","other":"{0} ай бұрын"}}},"year":{"displayName":"жыл","relative":{"0":"биылғы жыл","1":"келесі жыл","-1":"былтырғы жыл"},"relativeTime":{"future":{"one":"{0} жылдан кейін","other":"{0} жылдан кейін"},"past":{"one":"{0} жыл бұрын","other":"{0} жыл бұрын"}}}}});
ReactIntl.__addLocaleData({"locale":"kkj","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"Second","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Minute","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Hour","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Day","relative":{"0":"muka","1":"nɛmɛnɔ","-1":"kwey"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Month","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Year","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"kl","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"sekundi","relative":{"0":"now"},"relativeTime":{"future":{"one":"om {0} sekundi","other":"om {0} sekundi"},"past":{"one":"for {0} sekundi siden","other":"for {0} sekundi siden"}}},"minute":{"displayName":"minutsi","relativeTime":{"future":{"one":"om {0} minutsi","other":"om {0} minutsi"},"past":{"one":"for {0} minutsi siden","other":"for {0} minutsi siden"}}},"hour":{"displayName":"nalunaaquttap-akunnera","relativeTime":{"future":{"one":"om {0} nalunaaquttap-akunnera","other":"om {0} nalunaaquttap-akunnera"},"past":{"one":"for {0} nalunaaquttap-akunnera siden","other":"for {0} nalunaaquttap-akunnera siden"}}},"day":{"displayName":"ulloq","relative":{"0":"ullumi","1":"aqagu","2":"aqaguagu","-2":"ippassaani","-1":"ippassaq"},"relativeTime":{"future":{"one":"om {0} ulloq unnuarlu","other":"om {0} ulloq unnuarlu"},"past":{"one":"for {0} ulloq unnuarlu siden","other":"for {0} ulloq unnuarlu siden"}}},"month":{"displayName":"qaammat","relative":{"0":"manna qaammat","1":"tulleq qaammat","-1":"kingulleq qaammat"},"relativeTime":{"future":{"one":"om {0} qaammat","other":"om {0} qaammat"},"past":{"one":"for {0} qaammat siden","other":"for {0} qaammat siden"}}},"year":{"displayName":"ukioq","relative":{"0":"manna ukioq","1":"tulleq ukioq","-1":"kingulleq ukioq"},"relativeTime":{"future":{"one":"om {0} ukioq","other":"om {0} ukioq"},"past":{"one":"for {0} ukioq siden","other":"for {0} ukioq siden"}}}}});
ReactIntl.__addLocaleData({"locale":"km","pluralRuleFunction":function (n) {return"other";},"fields":{"second":{"displayName":"វិនាទី","relative":{"0":"ឥឡូវ"},"relativeTime":{"future":{"other":"ក្នុង​រយៈពេល {0} វិនាទី"},"past":{"other":"{0} វិនាទី​មុន"}}},"minute":{"displayName":"នាទី","relativeTime":{"future":{"other":"ក្នុង​រយៈពេល {0} នាទី"},"past":{"other":"{0} នាទី​មុន"}}},"hour":{"displayName":"ម៉ោង","relativeTime":{"future":{"other":"ក្នុង​រយៈ​ពេល {0} ម៉ោង"},"past":{"other":"{0} ម៉ោង​មុន"}}},"day":{"displayName":"ថ្ងៃ","relative":{"0":"ថ្ងៃ​នេះ","1":"ថ្ងៃ​ស្អែក","2":"​ខាន​ស្អែក","-2":"ម្សិល​ម៉្ងៃ","-1":"ម្សិលមិញ"},"relativeTime":{"future":{"other":"ក្នុង​រយៈ​ពេល {0} ថ្ងៃ"},"past":{"other":"{0} ថ្ងៃ​មុន"}}},"month":{"displayName":"ខែ","relative":{"0":"ខែ​នេះ","1":"ខែ​ក្រោយ","-1":"ខែ​មុន"},"relativeTime":{"future":{"other":"ក្នុង​រយៈ​ពេល {0} ខែ"},"past":{"other":"{0} ខែមុន"}}},"year":{"displayName":"ឆ្នាំ","relative":{"0":"ឆ្នាំ​នេះ","1":"ឆ្នាំ​ក្រោយ","-1":"ឆ្នាំ​មុន"},"relativeTime":{"future":{"other":"ក្នុង​រយៈ​ពេល {0} ឆ្នាំ"},"past":{"other":"{0} ឆ្នាំ​មុន"}}}}});
ReactIntl.__addLocaleData({"locale":"kn","pluralRuleFunction":function (n) {var i=Math.floor(Math.abs(n));n=Math.floor(n);if(i===0||n===1)return"one";return"other";},"fields":{"second":{"displayName":"ಸೆಕೆಂಡ್","relative":{"0":"ಇದೀಗ"},"relativeTime":{"future":{"one":"{0} ಸೆಕೆಂಡ್‌ಗಳಲ್ಲಿ","other":"{0} ಸೆಕೆಂಡ್‌ಗಳಲ್ಲಿ"},"past":{"one":"{0} ಸೆಕೆಂಡುಗಳ ಹಿಂದೆ","other":"{0} ಸೆಕೆಂಡುಗಳ ಹಿಂದೆ"}}},"minute":{"displayName":"ನಿಮಿಷ","relativeTime":{"future":{"one":"{0} ನಿಮಿಷಗಳಲ್ಲಿ","other":"{0} ನಿಮಿಷಗಳಲ್ಲಿ"},"past":{"one":"{0} ನಿಮಿಷಗಳ ಹಿಂದೆ","other":"{0} ನಿಮಿಷಗಳ ಹಿಂದೆ"}}},"hour":{"displayName":"ಗಂಟೆ","relativeTime":{"future":{"one":"{0} ಗಂಟೆಗಳಲ್ಲಿ","other":"{0} ಗಂಟೆಗಳಲ್ಲಿ"},"past":{"one":"{0} ಗಂಟೆಗಳ ಹಿಂದೆ","other":"{0} ಗಂಟೆಗಳ ಹಿಂದೆ"}}},"day":{"displayName":"ದಿನ","relative":{"0":"ಇಂದು","1":"ನಾಳೆ","2":"ನಾಡಿದ್ದು","-2":"ಮೊನ್ನೆ","-1":"ನಿನ್ನೆ"},"relativeTime":{"future":{"one":"{0} ದಿನಗಳಲ್ಲಿ","other":"{0} ದಿನಗಳಲ್ಲಿ"},"past":{"one":"{0} ದಿನಗಳ ಹಿಂದೆ","other":"{0} ದಿನಗಳ ಹಿಂದೆ"}}},"month":{"displayName":"ತಿಂಗಳು","relative":{"0":"ಈ ತಿಂಗಳು","1":"ಮುಂದಿನ ತಿಂಗಳು","-1":"ಕಳೆದ ತಿಂಗಳು"},"relativeTime":{"future":{"one":"{0} ತಿಂಗಳುಗಳಲ್ಲಿ","other":"{0} ತಿಂಗಳುಗಳಲ್ಲಿ"},"past":{"one":"{0} ತಿಂಗಳುಗಳ ಹಿಂದೆ","other":"{0} ತಿಂಗಳುಗಳ ಹಿಂದೆ"}}},"year":{"displayName":"ವರ್ಷ","relative":{"0":"ಈ ವರ್ಷ","1":"ಮುಂದಿನ ವರ್ಷ","-1":"ಕಳೆದ ವರ್ಷ"},"relativeTime":{"future":{"one":"{0} ವರ್ಷಗಳಲ್ಲಿ","other":"{0} ವರ್ಷಗಳಲ್ಲಿ"},"past":{"one":"{0} ವರ್ಷಗಳ ಹಿಂದೆ","other":"{0} ವರ್ಷಗಳ ಹಿಂದೆ"}}}}});
ReactIntl.__addLocaleData({"locale":"ko","pluralRuleFunction":function (n) {return"other";},"fields":{"second":{"displayName":"초","relative":{"0":"지금"},"relativeTime":{"future":{"other":"{0}초 후"},"past":{"other":"{0}초 전"}}},"minute":{"displayName":"분","relativeTime":{"future":{"other":"{0}분 후"},"past":{"other":"{0}분 전"}}},"hour":{"displayName":"시","relativeTime":{"future":{"other":"{0}시간 후"},"past":{"other":"{0}시간 전"}}},"day":{"displayName":"일","relative":{"0":"오늘","1":"내일","2":"모레","-2":"그저께","-1":"어제"},"relativeTime":{"future":{"other":"{0}일 후"},"past":{"other":"{0}일 전"}}},"month":{"displayName":"월","relative":{"0":"이번 달","1":"다음 달","-1":"지난달"},"relativeTime":{"future":{"other":"{0}개월 후"},"past":{"other":"{0}개월 전"}}},"year":{"displayName":"년","relative":{"0":"올해","1":"내년","-1":"지난해"},"relativeTime":{"future":{"other":"{0}년 후"},"past":{"other":"{0}년 전"}}}}});
ReactIntl.__addLocaleData({"locale":"ks","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"سٮ۪کَنڑ","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"مِنَٹ","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"گٲنٛٹہٕ","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"دۄہ","relative":{"0":"اَز","1":"پگاہ","-1":"راتھ"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"رٮ۪تھ","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"ؤری","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"ksb","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"Sekunde","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Dakika","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Saa","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Siku","relative":{"0":"Evi eo","1":"Keloi","-1":"Ghuo"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Ng'ezi","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Ng'waka","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"ksh","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===0)return"zero";if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"Sekond","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Menutt","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Schtund","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Daach","relative":{"0":"hück","1":"morje","2":"övvermorje","-2":"vörjestere","-1":"jestere"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Mohnd","relative":{"0":"diese Mohnd","1":"nächste Mohnd","-1":"lätzde Mohnd"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Johr","relative":{"0":"diese Johr","1":"nächste Johr","-1":"läz Johr"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"kw","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";if(n===2)return"two";return"other";},"fields":{"second":{"displayName":"Second","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Minute","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Eur","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Dedh","relative":{"0":"today","1":"tomorrow","-1":"yesterday"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Mis","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Bledhen","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"ky","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"секунд","relative":{"0":"азыр"},"relativeTime":{"future":{"one":"{0} секунддан кийин","other":"{0} секунддан кийин"},"past":{"one":"{0} секунд мурун","other":"{0} секунд мурун"}}},"minute":{"displayName":"мүнөт","relativeTime":{"future":{"one":"{0} мүнөттөн кийин","other":"{0} мүнөттөн кийин"},"past":{"one":"{0} мүнөт мурун","other":"{0} мүнөт мурун"}}},"hour":{"displayName":"саат","relativeTime":{"future":{"one":"{0} сааттан кийин","other":"{0} сааттан кийин"},"past":{"one":"{0} саат мурун","other":"{0} саат мурун"}}},"day":{"displayName":"күн","relative":{"0":"бүгүн","1":"эртеӊ","2":"бүрсүгүнү","-2":"мурдагы күнү","-1":"кечээ"},"relativeTime":{"future":{"one":"{0} күндөн кийин","other":"{0} күндөн кийин"},"past":{"one":"{0} күн мурун","other":"{0} күн мурун"}}},"month":{"displayName":"ай","relative":{"0":"бул айда","1":"эмдиги айда","-1":"өткөн айда"},"relativeTime":{"future":{"one":"{0} айдан кийин","other":"{0} айдан кийин"},"past":{"one":"{0} ай мурун","other":"{0} ай мурун"}}},"year":{"displayName":"жыл","relative":{"0":"быйыл","1":"эмдиги жылы","-1":"былтыр"},"relativeTime":{"future":{"one":"{0} жылдан кийин","other":"{0} жылдан кийин"},"past":{"one":"{0} жыл мурун","other":"{0} жыл мурун"}}}}});
ReactIntl.__addLocaleData({"locale":"lag","pluralRuleFunction":function (n) {var i=Math.floor(Math.abs(n));n=Math.floor(n);if(n===0)return"zero";if((i===0||i===1)&&(n!==0))return"one";return"other";},"fields":{"second":{"displayName":"Sekúunde","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Dakíka","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Sáa","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Sikʉ","relative":{"0":"Isikʉ","1":"Lamʉtoondo","-1":"Niijo"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Mweéri","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Mwaáka","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"lg","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"Kasikonda","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Dakiika","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Saawa","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Lunaku","relative":{"0":"Lwaleero","1":"Nkya","-1":"Ggulo"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Mwezi","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Mwaka","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"lkt","pluralRuleFunction":function (n) {return"other";},"fields":{"second":{"displayName":"Okpí","relative":{"0":"now"},"relativeTime":{"future":{"other":"Letáŋhaŋ okpí {0} kiŋháŋ"},"past":{"other":"Hékta okpí {0} k’uŋ héhaŋ"}}},"minute":{"displayName":"Owápȟe oȟʼáŋkȟo","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Owápȟe","relativeTime":{"future":{"other":"Letáŋhaŋ owápȟe {0} kiŋháŋ"},"past":{"other":"Hékta owápȟe {0} kʼuŋ héhaŋ"}}},"day":{"displayName":"Aŋpétu","relative":{"0":"Lé aŋpétu kiŋ","1":"Híŋhaŋni kiŋháŋ","-1":"Lé aŋpétu kiŋ"},"relativeTime":{"future":{"other":"Letáŋhaŋ {0}-čháŋ kiŋháŋ"},"past":{"other":"Hékta {0}-čháŋ k’uŋ héhaŋ"}}},"month":{"displayName":"Wí","relative":{"0":"Lé wí kiŋ","1":"Wí kiŋháŋ","-1":"Wí kʼuŋ héhaŋ"},"relativeTime":{"future":{"other":"Letáŋhaŋ wíyawapi {0} kiŋháŋ"},"past":{"other":"Hékta wíyawapi {0} kʼuŋ héhaŋ"}}},"year":{"displayName":"Ómakȟa","relative":{"0":"Lé ómakȟa kiŋ","1":"Tȟokáta ómakȟa kiŋháŋ","-1":"Ómakȟa kʼuŋ héhaŋ"},"relativeTime":{"future":{"other":"Letáŋhaŋ ómakȟa {0} kiŋháŋ"},"past":{"other":"Hékta ómakȟa {0} kʼuŋ héhaŋ"}}}}});
ReactIntl.__addLocaleData({"locale":"ln","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===Math.floor(n)&&n>=0&&n<=1)return"one";return"other";},"fields":{"second":{"displayName":"Sɛkɔ́ndɛ","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Monúti","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Ngonga","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Mokɔlɔ","relative":{"0":"Lɛlɔ́","1":"Lóbi ekoyâ","-1":"Lóbi elékí"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Sánzá","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Mobú","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"lo","pluralRuleFunction":function (n) {return"other";},"fields":{"second":{"displayName":"ວິນາທີ","relative":{"0":"ຕອນນີ້"},"relativeTime":{"future":{"other":"ໃນອີກ {0} ວິນາທີ"},"past":{"other":"{0} ວິນາທີກ່ອນ"}}},"minute":{"displayName":"ນາທີ","relativeTime":{"future":{"other":"{0} ໃນອີກ 0 ນາທີ"},"past":{"other":"{0} ນາທີກ່ອນ"}}},"hour":{"displayName":"ຊົ່ວໂມງ","relativeTime":{"future":{"other":"ໃນອີກ {0} ຊົ່ວໂມງ"},"past":{"other":"{0} ຊົ່ວໂມງກ່ອນ"}}},"day":{"displayName":"ມື້","relative":{"0":"ມື້ນີ້","1":"ມື້ອື່ນ","2":"ມື້ຮື","-2":"ມື້ກ່ອນ","-1":"ມື້ວານ"},"relativeTime":{"future":{"other":"ໃນອີກ {0} ມື້"},"past":{"other":"{0} ມື້ກ່ອນ"}}},"month":{"displayName":"ເດືອນ","relative":{"0":"ເດືອນນີ້","1":"ເດືອນໜ້າ","-1":"ເດືອນແລ້ວ"},"relativeTime":{"future":{"other":"ໃນອີກ {0} ເດືອນ"},"past":{"other":"{0} ເດືອນກ່ອນ"}}},"year":{"displayName":"ປີ","relative":{"0":"ປີນີ້","1":"ປີໜ້າ","-1":"ປີກາຍ"},"relativeTime":{"future":{"other":"ໃນອີກ {0} ປີ"},"past":{"other":"{0} ປີກ່ອນ"}}}}});
ReactIntl.__addLocaleData({"locale":"lt","pluralRuleFunction":function (n) {var f=parseInt(n.toString().replace(/^[^.]*\.?/,""),10);n=Math.floor(n);if(n%10===1&&!(n%100>=11&&n%100<=19))return"one";if(n%10===Math.floor(n%10)&&n%10>=2&&n%10<=9&&!(n%100>=11&&n%100<=19))return"few";if((f!==0))return"many";return"other";},"fields":{"second":{"displayName":"Sekundė","relative":{"0":"dabar"},"relativeTime":{"future":{"one":"po {0} sekundės","few":"po {0} sekundžių","many":"po {0} sekundės","other":"po {0} sekundžių"},"past":{"one":"prieš {0} sekundę","few":"prieš {0} sekundes","many":"prieš {0} sekundės","other":"prieš {0} sekundžių"}}},"minute":{"displayName":"Minutė","relativeTime":{"future":{"one":"po {0} minutės","few":"po {0} minučių","many":"po {0} minutės","other":"po {0} minučių"},"past":{"one":"prieš {0} minutę","few":"prieš {0} minutes","many":"prieš {0} minutės","other":"prieš {0} minučių"}}},"hour":{"displayName":"Valanda","relativeTime":{"future":{"one":"po {0} valandos","few":"po {0} valandų","many":"po {0} valandos","other":"po {0} valandų"},"past":{"one":"prieš {0} valandą","few":"prieš {0} valandas","many":"prieš {0} valandos","other":"prieš {0} valandų"}}},"day":{"displayName":"Diena","relative":{"0":"šiandien","1":"rytoj","2":"poryt","-2":"užvakar","-1":"vakar"},"relativeTime":{"future":{"one":"po {0} dienos","few":"po {0} dienų","many":"po {0} dienos","other":"po {0} dienų"},"past":{"one":"prieš {0} dieną","few":"prieš {0} dienas","many":"prieš {0} dienos","other":"prieš {0} dienų"}}},"month":{"displayName":"Mėnuo","relative":{"0":"šį mėnesį","1":"kitą mėnesį","-1":"praėjusį mėnesį"},"relativeTime":{"future":{"one":"po {0} mėnesio","few":"po {0} mėnesių","many":"po {0} mėnesio","other":"po {0} mėnesių"},"past":{"one":"prieš {0} mėnesį","few":"prieš {0} mėnesius","many":"prieš {0} mėnesio","other":"prieš {0} mėnesių"}}},"year":{"displayName":"Metai","relative":{"0":"šiais metais","1":"kitais metais","-1":"praėjusiais metais"},"relativeTime":{"future":{"one":"po {0} metų","few":"po {0} metų","many":"po {0} metų","other":"po {0} metų"},"past":{"one":"prieš {0} metus","few":"prieš {0} metus","many":"prieš {0} metų","other":"prieš {0} metų"}}}}});
ReactIntl.__addLocaleData({"locale":"lv","pluralRuleFunction":function (n) {var v=n.toString().replace(/^[^.]*\.?/,"").length,f=parseInt(n.toString().replace(/^[^.]*\.?/,""),10);n=Math.floor(n);if(n%10===0||n%100===Math.floor(n%100)&&n%100>=11&&n%100<=19||v===2&&f%100===Math.floor(f%100)&&f%100>=11&&f%100<=19)return"zero";if(n%10===1&&((n%100!==11)||v===2&&f%10===1&&((f%100!==11)||(v!==2)&&f%10===1)))return"one";return"other";},"fields":{"second":{"displayName":"Sekundes","relative":{"0":"tagad"},"relativeTime":{"future":{"zero":"Pēc {0} sekundēm","one":"Pēc {0} sekundes","other":"Pēc {0} sekundēm"},"past":{"zero":"Pirms {0} sekundēm","one":"Pirms {0} sekundes","other":"Pirms {0} sekundēm"}}},"minute":{"displayName":"Minūtes","relativeTime":{"future":{"zero":"Pēc {0} minūtēm","one":"Pēc {0} minūtes","other":"Pēc {0} minūtēm"},"past":{"zero":"Pirms {0} minūtēm","one":"Pirms {0} minūtes","other":"Pirms {0} minūtēm"}}},"hour":{"displayName":"Stundas","relativeTime":{"future":{"zero":"Pēc {0} stundām","one":"Pēc {0} stundas","other":"Pēc {0} stundām"},"past":{"zero":"Pirms {0} stundām","one":"Pirms {0} stundas","other":"Pirms {0} stundām"}}},"day":{"displayName":"Diena","relative":{"0":"šodien","1":"rīt","2":"parīt","-2":"aizvakar","-1":"vakar"},"relativeTime":{"future":{"zero":"Pēc {0} dienām","one":"Pēc {0} dienas","other":"Pēc {0} dienām"},"past":{"zero":"Pirms {0} dienām","one":"Pirms {0} dienas","other":"Pirms {0} dienām"}}},"month":{"displayName":"Mēnesis","relative":{"0":"šomēnes","1":"nākammēnes","-1":"pagājušajā mēnesī"},"relativeTime":{"future":{"zero":"Pēc {0} mēnešiem","one":"Pēc {0} mēneša","other":"Pēc {0} mēnešiem"},"past":{"zero":"Pirms {0} mēnešiem","one":"Pirms {0} mēneša","other":"Pirms {0} mēnešiem"}}},"year":{"displayName":"Gads","relative":{"0":"šogad","1":"nākamgad","-1":"pagājušajā gadā"},"relativeTime":{"future":{"zero":"Pēc {0} gadiem","one":"Pēc {0} gada","other":"Pēc {0} gadiem"},"past":{"zero":"Pirms {0} gadiem","one":"Pirms {0} gada","other":"Pirms {0} gadiem"}}}}});
ReactIntl.__addLocaleData({"locale":"mas","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"Sekunde","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Oldákikaè","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Ɛ́sáâ","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Ɛnkɔlɔ́ŋ","relative":{"0":"Táatá","1":"Tááisérè","-1":"Ŋolé"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Ɔlápà","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Ɔlárì","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"mg","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===Math.floor(n)&&n>=0&&n<=1)return"one";return"other";},"fields":{"second":{"displayName":"Segondra","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Minitra","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Ora","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Andro","relative":{"0":"Anio","1":"Rahampitso","-1":"Omaly"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Volana","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Taona","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"mgo","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"Second","relative":{"0":"now"},"relativeTime":{"future":{"one":"+{0} s","other":"+{0} s"},"past":{"one":"-{0} s","other":"-{0} s"}}},"minute":{"displayName":"Minute","relativeTime":{"future":{"one":"+{0} min","other":"+{0} min"},"past":{"one":"-{0} min","other":"-{0} min"}}},"hour":{"displayName":"Hour","relativeTime":{"future":{"one":"+{0} h","other":"+{0} h"},"past":{"one":"-{0} h","other":"-{0} h"}}},"day":{"displayName":"anəg","relative":{"0":"tèchɔ̀ŋ","1":"isu","2":"isu ywi","-1":"ikwiri"},"relativeTime":{"future":{"one":"+{0} d","other":"+{0} d"},"past":{"one":"-{0} d","other":"-{0} d"}}},"month":{"displayName":"iməg","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"one":"+{0} m","other":"+{0} m"},"past":{"one":"-{0} m","other":"-{0} m"}}},"year":{"displayName":"fituʼ","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"mk","pluralRuleFunction":function (n) {var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length,f=parseInt(n.toString().replace(/^[^.]*\.?/,""),10);n=Math.floor(n);if(v===0&&(i%10===1||f%10===1))return"one";return"other";},"fields":{"second":{"displayName":"Секунда","relative":{"0":"сега"},"relativeTime":{"future":{"one":"За {0} секунда","other":"За {0} секунди"},"past":{"one":"Пред {0} секунда","other":"Пред {0} секунди"}}},"minute":{"displayName":"Минута","relativeTime":{"future":{"one":"За {0} минута","other":"За {0} минути"},"past":{"one":"Пред {0} минута","other":"Пред {0} минути"}}},"hour":{"displayName":"Час","relativeTime":{"future":{"one":"За {0} час","other":"За {0} часа"},"past":{"one":"Пред {0} час","other":"Пред {0} часа"}}},"day":{"displayName":"ден","relative":{"0":"Денес","1":"утре","2":"задутре","-2":"завчера","-1":"вчера"},"relativeTime":{"future":{"one":"За {0} ден","other":"За {0} дена"},"past":{"one":"Пред {0} ден","other":"Пред {0} дена"}}},"month":{"displayName":"Месец","relative":{"0":"овој месец","1":"следниот месец","-1":"минатиот месец"},"relativeTime":{"future":{"one":"За {0} месец","other":"За {0} месеци"},"past":{"one":"Пред {0} месец","other":"Пред {0} месеци"}}},"year":{"displayName":"година","relative":{"0":"оваа година","1":"следната година","-1":"минатата година"},"relativeTime":{"future":{"one":"За {0} година","other":"За {0} години"},"past":{"one":"Пред {0} година","other":"Пред {0} години"}}}}});
ReactIntl.__addLocaleData({"locale":"ml","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"സെക്കൻറ്","relative":{"0":"ഇപ്പോൾ"},"relativeTime":{"future":{"one":"{0} സെക്കൻഡിൽ","other":"{0} സെക്കൻഡിൽ"},"past":{"one":"{0} സെക്കൻറ് മുമ്പ്","other":"{0} സെക്കൻറ് മുമ്പ്"}}},"minute":{"displayName":"മിനിട്ട്","relativeTime":{"future":{"one":"{0} മിനിറ്റിൽ","other":"{0} മിനിറ്റിനുള്ളിൽ"},"past":{"one":"{0} മിനിറ്റ് മുമ്പ്","other":"{0} മിനിറ്റ് മുമ്പ്"}}},"hour":{"displayName":"മണിക്കൂർ","relativeTime":{"future":{"one":"{0} മണിക്കൂറിൽ","other":"{0} മണിക്കൂറിൽ"},"past":{"one":"{0} മണിക്കൂർ മുമ്പ്","other":"{0} മണിക്കൂർ മുമ്പ്"}}},"day":{"displayName":"ദിവസം","relative":{"0":"ഇന്ന്","1":"നാളെ","2":"മറ്റന്നാൾ","-2":"മിനിഞ്ഞാന്ന്","-1":"ഇന്നലെ"},"relativeTime":{"future":{"one":"{0} ദിവസത്തിൽ","other":"{0} ദിവസത്തിൽ"},"past":{"one":"{0} ദിവസം മുമ്പ്","other":"{0} ദിവസം മുമ്പ്"}}},"month":{"displayName":"മാസം","relative":{"0":"ഈ മാസം","1":"അടുത്ത മാസം","-1":"കഴിഞ്ഞ മാസം"},"relativeTime":{"future":{"one":"{0} മാസത്തിൽ","other":"{0} മാസത്തിൽ"},"past":{"one":"{0} മാസം മുമ്പ്","other":"{0} മാസം മുമ്പ്"}}},"year":{"displayName":"വർഷം","relative":{"0":"ഈ വർ‌ഷം","1":"അടുത്തവർഷം","-1":"കഴിഞ്ഞ വർഷം"},"relativeTime":{"future":{"one":"{0} വർഷത്തിൽ","other":"{0} വർഷത്തിൽ"},"past":{"one":"{0} വർഷം മുമ്പ്","other":"{0} വർഷം മുമ്പ്"}}}}});
ReactIntl.__addLocaleData({"locale":"mn","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"Секунд","relative":{"0":"Одоо"},"relativeTime":{"future":{"one":"{0} секундын дараа","other":"{0} секундын дараа"},"past":{"one":"{0} секундын өмнө","other":"{0} секундын өмнө"}}},"minute":{"displayName":"Минут","relativeTime":{"future":{"one":"{0} минутын дараа","other":"{0} минутын дараа"},"past":{"one":"{0} минутын өмнө","other":"{0} минутын өмнө"}}},"hour":{"displayName":"Цаг","relativeTime":{"future":{"one":"{0} цагийн дараа","other":"{0} цагийн дараа"},"past":{"one":"{0} цагийн өмнө","other":"{0} цагийн өмнө"}}},"day":{"displayName":"Өдөр","relative":{"0":"өнөөдөр","1":"маргааш","2":"Нөгөөдөр","-2":"Уржигдар","-1":"өчигдөр"},"relativeTime":{"future":{"one":"{0} өдрийн дараа","other":"{0} өдрийн дараа"},"past":{"one":"{0} өдрийн өмнө","other":"{0} өдрийн өмнө"}}},"month":{"displayName":"Сар","relative":{"0":"энэ сар","1":"ирэх сар","-1":"өнгөрсөн сар"},"relativeTime":{"future":{"one":"{0} сарын дараа","other":"{0} сарын дараа"},"past":{"one":"{0} сарын өмнө","other":"{0} сарын өмнө"}}},"year":{"displayName":"Жил","relative":{"0":"энэ жил","1":"ирэх жил","-1":"өнгөрсөн жил"},"relativeTime":{"future":{"one":"{0} жилийн дараа","other":"{0} жилийн дараа"},"past":{"one":"{0} жилийн өмнө","other":"{0} жилийн өмнө"}}}}});
ReactIntl.__addLocaleData({"locale":"mr","pluralRuleFunction":function (n) {var i=Math.floor(Math.abs(n));n=Math.floor(n);if(i===0||n===1)return"one";return"other";},"fields":{"second":{"displayName":"सेकंद","relative":{"0":"आत्ता"},"relativeTime":{"future":{"one":"{0} सेकंदामध्ये","other":"{0} सेकंदांमध्ये"},"past":{"one":"{0} सेकंदापूर्वी","other":"{0} सेकंदांपूर्वी"}}},"minute":{"displayName":"मिनिट","relativeTime":{"future":{"one":"{0} मिनिटामध्ये","other":"{0} मिनिटांमध्ये"},"past":{"one":"{0} मिनिटापूर्वी","other":"{0} मिनिटांपूर्वी"}}},"hour":{"displayName":"तास","relativeTime":{"future":{"one":"{0} तासामध्ये","other":"{0} तासांमध्ये"},"past":{"one":"{0} तासापूर्वी","other":"{0} तासांपूर्वी"}}},"day":{"displayName":"दिवस","relative":{"0":"आज","1":"उद्या","-1":"काल"},"relativeTime":{"future":{"one":"{0} दिवसामध्ये","other":"{0} दिवसांमध्ये"},"past":{"one":"{0} दिवसापूर्वी","other":"{0} दिवसांपूर्वी"}}},"month":{"displayName":"महिना","relative":{"0":"हा महिना","1":"पुढील महिना","-1":"मागील महिना"},"relativeTime":{"future":{"one":"{0} महिन्यामध्ये","other":"{0} महिन्यांमध्ये"},"past":{"one":"{0} महिन्यापूर्वी","other":"{0} महिन्यांपूर्वी"}}},"year":{"displayName":"वर्ष","relative":{"0":"हे वर्ष","1":"पुढील वर्ष","-1":"मागील वर्ष"},"relativeTime":{"future":{"one":"{0} वर्षामध्ये","other":"{0} वर्षांमध्ये"},"past":{"one":"{0} वर्षापूर्वी","other":"{0} वर्षांपूर्वी"}}}}});
ReactIntl.__addLocaleData({"locale":"ms","pluralRuleFunction":function (n) {return"other";},"fields":{"second":{"displayName":"Kedua","relative":{"0":"sekarang"},"relativeTime":{"future":{"other":"Dalam {0} saat"},"past":{"other":"{0} saat lalu"}}},"minute":{"displayName":"Minit","relativeTime":{"future":{"other":"Dalam {0} minit"},"past":{"other":"{0} minit lalu"}}},"hour":{"displayName":"Jam","relativeTime":{"future":{"other":"Dalam {0} jam"},"past":{"other":"{0} jam lalu"}}},"day":{"displayName":"Hari","relative":{"0":"Hari ini","1":"Esok","2":"Hari selepas esok","-2":"Hari sebelum semalam","-1":"Semalam"},"relativeTime":{"future":{"other":"Dalam {0} hari"},"past":{"other":"{0} hari lalu"}}},"month":{"displayName":"Bulan","relative":{"0":"bulan ini","1":"bulan depan","-1":"bulan lalu"},"relativeTime":{"future":{"other":"Dalam {0} bulan"},"past":{"other":"{0} bulan lalu"}}},"year":{"displayName":"Tahun","relative":{"0":"tahun ini","1":"tahun depan","-1":"tahun lepas"},"relativeTime":{"future":{"other":"Dalam {0} tahun"},"past":{"other":"{0} tahun lalu"}}}}});
ReactIntl.__addLocaleData({"locale":"mt","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";if(n===0||n%100===Math.floor(n%100)&&n%100>=2&&n%100<=10)return"few";if(n%100===Math.floor(n%100)&&n%100>=11&&n%100<=19)return"many";return"other";},"fields":{"second":{"displayName":"Sekonda","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Minuta","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Siegħa","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Jum","relative":{"0":"Illum","1":"Għada","-1":"Ilbieraħ"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Xahar","relative":{"0":"Dan ix-xahar","1":"Ix-xahar id-dieħel","-1":"Ix-xahar li għadda"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Sena","relative":{"0":"Din is-sena","1":"Is-sena d-dieħla","-1":"Is-sena li għaddiet"},"relativeTime":{"past":{"one":"{0} sena ilu","few":"{0} snin ilu","many":"{0} snin ilu","other":"{0} snin ilu"},"future":{"other":"+{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"my","pluralRuleFunction":function (n) {return"other";},"fields":{"second":{"displayName":"စက္ကန့်","relative":{"0":"ယခု"},"relativeTime":{"future":{"other":"{0}စက္ကန့်အတွင်း"},"past":{"other":"လွန်ခဲ့သော{0}စက္ကန့်"}}},"minute":{"displayName":"မိနစ်","relativeTime":{"future":{"other":"{0}မိနစ်အတွင်း"},"past":{"other":"လွန်ခဲ့သော{0}မိနစ်"}}},"hour":{"displayName":"နာရီ","relativeTime":{"future":{"other":"{0}နာရီအတွင်း"},"past":{"other":"လွန်ခဲ့သော{0}နာရီ"}}},"day":{"displayName":"ရက်","relative":{"0":"ယနေ့","1":"မနက်ဖြန်","2":"သဘက်ခါ","-2":"တနေ့က","-1":"မနေ့က"},"relativeTime":{"future":{"other":"{0}ရက်အတွင်း"},"past":{"other":"လွန်ခဲ့သော{0}ရက်"}}},"month":{"displayName":"လ","relative":{"0":"ယခုလ","1":"နောက်လ","-1":"ယမန်လ"},"relativeTime":{"future":{"other":"{0}လအတွင်း"},"past":{"other":"လွန်ခဲ့သော{0}လ"}}},"year":{"displayName":"နှစ်","relative":{"0":"ယခုနှစ်","1":"နောက်နှစ်","-1":"ယမန်နှစ်"},"relativeTime":{"future":{"other":"{0}နှစ်အတွင်း"},"past":{"other":"လွန်ခဲ့သော{0}နှစ်"}}}}});
ReactIntl.__addLocaleData({"locale":"naq","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";if(n===2)return"two";return"other";},"fields":{"second":{"displayName":"ǀGâub","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Haib","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Iiri","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Tsees","relative":{"0":"Neetsee","1":"tomorrow","-1":"yesterday"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"ǁKhâb","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Kurib","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"nb","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"Sekund","relative":{"0":"nå"},"relativeTime":{"future":{"one":"om {0} sekund","other":"om {0} sekunder"},"past":{"one":"for {0} sekund siden","other":"for {0} sekunder siden"}}},"minute":{"displayName":"Minutt","relativeTime":{"future":{"one":"om {0} minutt","other":"om {0} minutter"},"past":{"one":"for {0} minutt siden","other":"for {0} minutter siden"}}},"hour":{"displayName":"Time","relativeTime":{"future":{"one":"om {0} time","other":"om {0} timer"},"past":{"one":"for {0} time siden","other":"for {0} timer siden"}}},"day":{"displayName":"Dag","relative":{"0":"i dag","1":"i morgen","2":"i overmorgen","-2":"i forgårs","-1":"i går"},"relativeTime":{"future":{"one":"om {0} døgn","other":"om {0} døgn"},"past":{"one":"for {0} døgn siden","other":"for {0} døgn siden"}}},"month":{"displayName":"Måned","relative":{"0":"Denne måneden","1":"Neste måned","-1":"Sist måned"},"relativeTime":{"future":{"one":"om {0} måned","other":"om {0} måneder"},"past":{"one":"for {0} måned siden","other":"for {0} måneder siden"}}},"year":{"displayName":"År","relative":{"0":"Dette året","1":"Neste år","-1":"I fjor"},"relativeTime":{"future":{"one":"om {0} år","other":"om {0} år"},"past":{"one":"for {0} år siden","other":"for {0} år siden"}}}}});
ReactIntl.__addLocaleData({"locale":"nd","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"Isekendi","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Umuzuzu","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Ihola","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Ilanga","relative":{"0":"Lamuhla","1":"Kusasa","-1":"Izolo"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Inyangacale","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Umnyaka","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"ne","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"दोस्रो","relative":{"0":"अब"},"relativeTime":{"future":{"one":"{0} सेकेण्डमा","other":"{0} सेकेण्डमा"},"past":{"one":"{0} सेकेण्ड पहिले","other":"{0} सेकेण्ड पहिले"}}},"minute":{"displayName":"मिनेट","relativeTime":{"future":{"one":"{0} मिनेटमा","other":"{0} मिनेटमा"},"past":{"one":"{0} मिनेट पहिले","other":"{0} मिनेट पहिले"}}},"hour":{"displayName":"घण्टा","relativeTime":{"future":{"one":"{0} घण्टामा","other":"{0} घण्टामा"},"past":{"one":"{0} घण्टा पहिले","other":"{0} घण्टा पहिले"}}},"day":{"displayName":"बार","relative":{"0":"आज","1":"भोली","-2":"अस्ति","-1":"हिजो"},"relativeTime":{"future":{"one":"{0} दिनमा","other":"{0} दिनमा"},"past":{"one":"{0} दिन पहिले","other":"{0} दिन पहिले"}}},"month":{"displayName":"महिना","relative":{"0":"यो महिना","1":"अर्को महिना","-1":"गएको महिना"},"relativeTime":{"future":{"one":"{0} महिनामा","other":"{0} महिनामा"},"past":{"one":"{0} महिना पहिले","other":"{0} महिना पहिले"}}},"year":{"displayName":"बर्ष","relative":{"0":"यो वर्ष","1":"अर्को वर्ष","-1":"पहिलो वर्ष"},"relativeTime":{"future":{"one":"{0} वर्षमा","other":"{0} वर्षमा"},"past":{"one":"{0} वर्ष अघि","other":"{0} वर्ष अघि"}}}}});
ReactIntl.__addLocaleData({"locale":"nl","pluralRuleFunction":function (n) {var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length;n=Math.floor(n);if(i===1&&v===0)return"one";return"other";},"fields":{"second":{"displayName":"Seconde","relative":{"0":"nu"},"relativeTime":{"future":{"one":"Over {0} seconde","other":"Over {0} seconden"},"past":{"one":"{0} seconde geleden","other":"{0} seconden geleden"}}},"minute":{"displayName":"Minuut","relativeTime":{"future":{"one":"Over {0} minuut","other":"Over {0} minuten"},"past":{"one":"{0} minuut geleden","other":"{0} minuten geleden"}}},"hour":{"displayName":"Uur","relativeTime":{"future":{"one":"Over {0} uur","other":"Over {0} uur"},"past":{"one":"{0} uur geleden","other":"{0} uur geleden"}}},"day":{"displayName":"Dag","relative":{"0":"vandaag","1":"morgen","2":"overmorgen","-2":"eergisteren","-1":"gisteren"},"relativeTime":{"future":{"one":"Over {0} dag","other":"Over {0} dagen"},"past":{"one":"{0} dag geleden","other":"{0} dagen geleden"}}},"month":{"displayName":"Maand","relative":{"0":"deze maand","1":"volgende maand","-1":"vorige maand"},"relativeTime":{"future":{"one":"Over {0} maand","other":"Over {0} maanden"},"past":{"one":"{0} maand geleden","other":"{0} maanden geleden"}}},"year":{"displayName":"Jaar","relative":{"0":"dit jaar","1":"volgend jaar","-1":"vorig jaar"},"relativeTime":{"future":{"one":"Over {0} jaar","other":"Over {0} jaar"},"past":{"one":"{0} jaar geleden","other":"{0} jaar geleden"}}}}});
ReactIntl.__addLocaleData({"locale":"nn","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"sekund","relative":{"0":"now"},"relativeTime":{"future":{"one":"om {0} sekund","other":"om {0} sekunder"},"past":{"one":"for {0} sekund siden","other":"for {0} sekunder siden"}}},"minute":{"displayName":"minutt","relativeTime":{"future":{"one":"om {0} minutt","other":"om {0} minutter"},"past":{"one":"for {0} minutt siden","other":"for {0} minutter siden"}}},"hour":{"displayName":"time","relativeTime":{"future":{"one":"om {0} time","other":"om {0} timer"},"past":{"one":"for {0} time siden","other":"for {0} timer siden"}}},"day":{"displayName":"dag","relative":{"0":"i dag","1":"i morgon","2":"i overmorgon","-2":"i forgårs","-1":"i går"},"relativeTime":{"future":{"one":"om {0} døgn","other":"om {0} døgn"},"past":{"one":"for {0} døgn siden","other":"for {0} døgn siden"}}},"month":{"displayName":"månad","relative":{"0":"denne månad","1":"neste månad","-1":"forrige månad"},"relativeTime":{"future":{"one":"om {0} måned","other":"om {0} måneder"},"past":{"one":"for {0} måned siden","other":"for {0} måneder siden"}}},"year":{"displayName":"år","relative":{"0":"dette år","1":"neste år","-1":"i fjor"},"relativeTime":{"future":{"one":"om {0} år","other":"om {0} år"},"past":{"one":"for {0} år siden","other":"for {0} år siden"}}}}});
ReactIntl.__addLocaleData({"locale":"nnh","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"Second","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Minute","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"fʉ̀ʼ nèm","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"lyɛ̌ʼ","relative":{"0":"lyɛ̌ʼɔɔn","1":"jǔɔ gẅie à ne ntóo","-1":"jǔɔ gẅie à ka tɔ̌g"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Month","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"ngùʼ","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"nr","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"Second","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Minute","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Hour","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Day","relative":{"0":"today","1":"tomorrow","-1":"yesterday"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Month","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Year","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"nso","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===Math.floor(n)&&n>=0&&n<=1)return"one";return"other";},"fields":{"second":{"displayName":"Second","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Minute","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Hour","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Day","relative":{"0":"today","1":"tomorrow","-1":"yesterday"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Month","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Year","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"nyn","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"Obucweka\u002FEsekendi","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Edakiika","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Shaaha","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Eizooba","relative":{"0":"Erizooba","1":"Nyenkyakare","-1":"Nyomwabazyo"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Omwezi","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Omwaka","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"om","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"Second","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Minute","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Hour","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Day","relative":{"0":"today","1":"tomorrow","-1":"yesterday"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Month","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Year","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"or","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"Second","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Minute","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Hour","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Day","relative":{"0":"today","1":"tomorrow","-1":"yesterday"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Month","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Year","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"os","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"Секунд","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Минут","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Сахат","relativeTime":{"future":{"one":"{0} сахаты фӕстӕ","other":"{0} сахаты фӕстӕ"},"past":{"one":"{0} сахаты размӕ","other":"{0} сахаты размӕ"}}},"day":{"displayName":"Бон","relative":{"0":"Абон","1":"Сом","2":"Иннӕбон","-2":"Ӕндӕрӕбон","-1":"Знон"},"relativeTime":{"future":{"one":"{0} боны фӕстӕ","other":"{0} боны фӕстӕ"},"past":{"one":"{0} бон раздӕр","other":"{0} боны размӕ"}}},"month":{"displayName":"Мӕй","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Аз","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"pa","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===Math.floor(n)&&n>=0&&n<=1)return"one";return"other";},"fields":{"second":{"displayName":"ਸਕਿੰਟ","relative":{"0":"ਹੁਣ"},"relativeTime":{"future":{"one":"{0} ਸਕਿੰਟ ਵਿਚ","other":"{0} ਸਕਿੰਟ ਵਿਚ"},"past":{"one":"{0} ਸਕਿੰਟ ਪਹਿਲਾਂ","other":"{0} ਸਕਿੰਟ ਪਹਿਲਾਂ"}}},"minute":{"displayName":"ਮਿੰਟ","relativeTime":{"future":{"one":"{0} ਮਿੰਟ ਵਿਚ","other":"{0} ਮਿੰਟ ਵਿਚ"},"past":{"one":"{0} ਮਿੰਟ ਪਹਿਲਾਂ","other":"{0} ਮਿੰਟ ਪਹਿਲਾਂ"}}},"hour":{"displayName":"ਘੰਟਾ","relativeTime":{"future":{"one":"{0} ਘੰਟੇ ਵਿਚ","other":"{0} ਘੰਟੇ ਵਿਚ"},"past":{"one":"{0} ਘੰਟਾ ਪਹਿਲਾਂ","other":"{0} ਘੰਟੇ ਪਹਿਲਾਂ"}}},"day":{"displayName":"ਦਿਨ","relative":{"0":"ਅੱਜ","1":"ਭਲਕੇ","-1":"ਲੰਘਿਆ ਕੱਲ"},"relativeTime":{"future":{"one":"{0} ਦਿਨ ਵਿਚ","other":"{0} ਦਿਨਾਂ ਵਿਚ"},"past":{"one":"{0} ਦਿਨ ਪਹਿਲਾਂ","other":"{0} ਦਿਨ ਪਹਿਲਾਂ"}}},"month":{"displayName":"ਮਹੀਨਾ","relative":{"0":"ਇਹ ਮਹੀਨਾ","1":"ਅਗਲਾ ਮਹੀਨਾ","-1":"ਪਿਛਲਾ ਮਹੀਨਾ"},"relativeTime":{"future":{"one":"{0} ਮਹੀਨੇ ਵਿਚ","other":"{0} ਮਹੀਨੇ ਵਿਚ"},"past":{"one":"{0} ਮਹੀਨੇ ਪਹਿਲਾਂ","other":"{0} ਮਹੀਨੇ ਪਹਿਲਾਂ"}}},"year":{"displayName":"ਸਾਲ","relative":{"0":"ਇਹ ਸਾਲ","1":"ਅਗਲਾ ਸਾਲ","-1":"ਪਿਛਲਾ ਸਾਲ"},"relativeTime":{"future":{"one":"{0} ਸਾਲ ਵਿਚ","other":"{0} ਸਾਲ ਵਿਚ"},"past":{"one":"{0} ਸਾਲ ਪਹਿਲਾਂ","other":"{0} ਸਾਲ ਪਹਿਲਾਂ"}}}}});
ReactIntl.__addLocaleData({"locale":"pl","pluralRuleFunction":function (n) {var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length;n=Math.floor(n);if(i===1&&v===0)return"one";if(v===0&&i%10===Math.floor(i%10)&&i%10>=2&&i%10<=4&&!(i%100>=12&&i%100<=14))return"few";if(v===0&&(i!==1)&&(i%10===Math.floor(i%10)&&i%10>=0&&i%10<=1||v===0&&(i%10===Math.floor(i%10)&&i%10>=5&&i%10<=9||v===0&&i%100===Math.floor(i%100)&&i%100>=12&&i%100<=14)))return"many";return"other";},"fields":{"second":{"displayName":"sekunda","relative":{"0":"teraz"},"relativeTime":{"future":{"one":"Za {0} sekundę","few":"Za {0} sekundy","many":"Za {0} sekund","other":"Za {0} sekundy"},"past":{"one":"{0} sekundę temu","few":"{0} sekundy temu","many":"{0} sekund temu","other":"{0} sekundy temu"}}},"minute":{"displayName":"minuta","relativeTime":{"future":{"one":"Za {0} minutę","few":"Za {0} minuty","many":"Za {0} minut","other":"Za {0} minuty"},"past":{"one":"{0} minutę temu","few":"{0} minuty temu","many":"{0} minut temu","other":"{0} minuty temu"}}},"hour":{"displayName":"godzina","relativeTime":{"future":{"one":"Za {0} godzinę","few":"Za {0} godziny","many":"Za {0} godzin","other":"Za {0} godziny"},"past":{"one":"{0} godzinę temu","few":"{0} godziny temu","many":"{0} godzin temu","other":"{0} godziny temu"}}},"day":{"displayName":"dzień","relative":{"0":"dzisiaj","1":"jutro","2":"pojutrze","-2":"przedwczoraj","-1":"wczoraj"},"relativeTime":{"future":{"one":"Za {0} dzień","few":"Za {0} dni","many":"Za {0} dni","other":"Za {0} dnia"},"past":{"one":"{0} dzień temu","few":"{0} dni temu","many":"{0} dni temu","other":"{0} dnia temu"}}},"month":{"displayName":"miesiąc","relative":{"0":"w tym miesiącu","1":"w przyszłym miesiącu","-1":"w zeszłym miesiącu"},"relativeTime":{"future":{"one":"Za {0} miesiąc","few":"Za {0} miesiące","many":"Za {0} miesięcy","other":"Za {0} miesiąca"},"past":{"one":"{0} miesiąc temu","few":"{0} miesiące temu","many":"{0} miesięcy temu","other":"{0} miesiąca temu"}}},"year":{"displayName":"rok","relative":{"0":"w tym roku","1":"w przyszłym roku","-1":"w zeszłym roku"},"relativeTime":{"future":{"one":"Za {0} rok","few":"Za {0} lata","many":"Za {0} lat","other":"Za {0} roku"},"past":{"one":"{0} rok temu","few":"{0} lata temu","many":"{0} lat temu","other":"{0} roku temu"}}}}});
ReactIntl.__addLocaleData({"locale":"ps","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"Second","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Minute","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Hour","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Day","relative":{"0":"today","1":"tomorrow","-1":"yesterday"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Month","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Year","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"pt","pluralRuleFunction":function (n) {var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length,t=parseInt(n.toString().replace(/^[^.]*\.?|0+$/g,""),10);n=Math.floor(n);if(i===1&&(v===0||i===0&&t===1))return"one";return"other";},"fields":{"second":{"displayName":"Segundo","relative":{"0":"agora"},"relativeTime":{"future":{"one":"Dentro de {0} segundo","other":"Dentro de {0} segundos"},"past":{"one":"Há {0} segundo","other":"Há {0} segundos"}}},"minute":{"displayName":"Minuto","relativeTime":{"future":{"one":"Dentro de {0} minuto","other":"Dentro de {0} minutos"},"past":{"one":"Há {0} minuto","other":"Há {0} minutos"}}},"hour":{"displayName":"Hora","relativeTime":{"future":{"one":"Dentro de {0} hora","other":"Dentro de {0} horas"},"past":{"one":"Há {0} hora","other":"Há {0} horas"}}},"day":{"displayName":"Dia","relative":{"0":"hoje","1":"amanhã","2":"depois de amanhã","-2":"anteontem","-1":"ontem"},"relativeTime":{"future":{"one":"Dentro de {0} dia","other":"Dentro de {0} dias"},"past":{"one":"Há {0} dia","other":"Há {0} dias"}}},"month":{"displayName":"Mês","relative":{"0":"este mês","1":"próximo mês","-1":"mês passado"},"relativeTime":{"future":{"one":"Dentro de {0} mês","other":"Dentro de {0} meses"},"past":{"one":"Há {0} mês","other":"Há {0} meses"}}},"year":{"displayName":"Ano","relative":{"0":"este ano","1":"próximo ano","-1":"ano passado"},"relativeTime":{"future":{"one":"Dentro de {0} ano","other":"Dentro de {0} anos"},"past":{"one":"Há {0} ano","other":"Há {0} anos"}}}}});
ReactIntl.__addLocaleData({"locale":"rm","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"secunda","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"minuta","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"ura","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Tag","relative":{"0":"oz","1":"damaun","2":"puschmaun","-2":"stersas","-1":"ier"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"mais","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"onn","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"ro","pluralRuleFunction":function (n) {var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length;n=Math.floor(n);if(i===1&&v===0)return"one";if((v!==0)||n===0||(n!==1)&&n%100===Math.floor(n%100)&&n%100>=1&&n%100<=19)return"few";return"other";},"fields":{"second":{"displayName":"secundă","relative":{"0":"acum"},"relativeTime":{"future":{"one":"Peste {0} secundă","few":"Peste {0} secunde","other":"Peste {0} de secunde"},"past":{"one":"Acum {0} secundă","few":"Acum {0} secunde","other":"Acum {0} de secunde"}}},"minute":{"displayName":"minut","relativeTime":{"future":{"one":"Peste {0} minut","few":"Peste {0} minute","other":"Peste {0} de minute"},"past":{"one":"Acum {0} minut","few":"Acum {0} minute","other":"Acum {0} de minute"}}},"hour":{"displayName":"oră","relativeTime":{"future":{"one":"Peste {0} oră","few":"Peste {0} ore","other":"Peste {0} de ore"},"past":{"one":"Acum {0} oră","few":"Acum {0} ore","other":"Acum {0} de ore"}}},"day":{"displayName":"zi","relative":{"0":"azi","1":"mâine","2":"poimâine","-2":"alaltăieri","-1":"ieri"},"relativeTime":{"future":{"one":"Peste {0} zi","few":"Peste {0} zile","other":"Peste {0} de zile"},"past":{"one":"Acum {0} zi","few":"Acum {0} zile","other":"Acum {0} de zile"}}},"month":{"displayName":"lună","relative":{"0":"luna aceasta","1":"luna viitoare","-1":"luna trecută"},"relativeTime":{"future":{"one":"Peste {0} lună","few":"Peste {0} luni","other":"Peste {0} de luni"},"past":{"one":"Acum {0} lună","few":"Acum {0} luni","other":"Acum {0} de luni"}}},"year":{"displayName":"an","relative":{"0":"anul acesta","1":"anul viitor","-1":"anul trecut"},"relativeTime":{"future":{"one":"Peste {0} an","few":"Peste {0} ani","other":"Peste {0} de ani"},"past":{"one":"Acum {0} an","few":"Acum {0} ani","other":"Acum {0} de ani"}}}}});
ReactIntl.__addLocaleData({"locale":"rof","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"Sekunde","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Dakika","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Isaa","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Mfiri","relative":{"0":"Linu","1":"Ng'ama","-1":"Hiyo"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Mweri","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Muaka","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"ru","pluralRuleFunction":function (n) {var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length;n=Math.floor(n);if(v===0&&i%10===1&&(i%100!==11))return"one";if(v===0&&i%10===Math.floor(i%10)&&i%10>=2&&i%10<=4&&!(i%100>=12&&i%100<=14))return"few";if(v===0&&(i%10===0||v===0&&(i%10===Math.floor(i%10)&&i%10>=5&&i%10<=9||v===0&&i%100===Math.floor(i%100)&&i%100>=11&&i%100<=14)))return"many";return"other";},"fields":{"second":{"displayName":"Секунда","relative":{"0":"сейчас"},"relativeTime":{"future":{"one":"Через {0} секунду","few":"Через {0} секунды","many":"Через {0} секунд","other":"Через {0} секунды"},"past":{"one":"{0} секунду назад","few":"{0} секунды назад","many":"{0} секунд назад","other":"{0} секунды назад"}}},"minute":{"displayName":"Минута","relativeTime":{"future":{"one":"Через {0} минуту","few":"Через {0} минуты","many":"Через {0} минут","other":"Через {0} минуты"},"past":{"one":"{0} минуту назад","few":"{0} минуты назад","many":"{0} минут назад","other":"{0} минуты назад"}}},"hour":{"displayName":"Час","relativeTime":{"future":{"one":"Через {0} час","few":"Через {0} часа","many":"Через {0} часов","other":"Через {0} часа"},"past":{"one":"{0} час назад","few":"{0} часа назад","many":"{0} часов назад","other":"{0} часа назад"}}},"day":{"displayName":"День","relative":{"0":"сегодня","1":"завтра","2":"послезавтра","-2":"позавчера","-1":"вчера"},"relativeTime":{"future":{"one":"Через {0} день","few":"Через {0} дня","many":"Через {0} дней","other":"Через {0} дня"},"past":{"one":"{0} день назад","few":"{0} дня назад","many":"{0} дней назад","other":"{0} дня назад"}}},"month":{"displayName":"Месяц","relative":{"0":"в этом месяце","1":"в следующем месяце","-1":"в прошлом месяце"},"relativeTime":{"future":{"one":"Через {0} месяц","few":"Через {0} месяца","many":"Через {0} месяцев","other":"Через {0} месяца"},"past":{"one":"{0} месяц назад","few":"{0} месяца назад","many":"{0} месяцев назад","other":"{0} месяца назад"}}},"year":{"displayName":"Год","relative":{"0":"в этому году","1":"в следующем году","-1":"в прошлом году"},"relativeTime":{"future":{"one":"Через {0} год","few":"Через {0} года","many":"Через {0} лет","other":"Через {0} года"},"past":{"one":"{0} год назад","few":"{0} года назад","many":"{0} лет назад","other":"{0} года назад"}}}}});
ReactIntl.__addLocaleData({"locale":"rwk","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"Sekunde","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Dakyika","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Saa","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Mfiri","relative":{"0":"Inu","1":"Ngama","-1":"Ukou"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Mori","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Maka","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"sah","pluralRuleFunction":function (n) {return"other";},"fields":{"second":{"displayName":"Сөкүүндэ","relative":{"0":"now"},"relativeTime":{"future":{"other":"{0} сөкүүндэннэн"},"past":{"other":"{0} сөкүүндэ ынараа өттүгэр"}}},"minute":{"displayName":"Мүнүүтэ","relativeTime":{"future":{"other":"{0} мүнүүтэннэн"},"past":{"other":"{0} мүнүүтэ ынараа өттүгэр"}}},"hour":{"displayName":"Чаас","relativeTime":{"future":{"other":"{0} чааһынан"},"past":{"other":"{0} чаас ынараа өттүгэр"}}},"day":{"displayName":"Күн","relative":{"0":"Бүгүн","1":"Сарсын","2":"Өйүүн","-2":"Иллэрээ күн","-1":"Бэҕэһээ"},"relativeTime":{"future":{"other":"{0} күнүнэн"},"past":{"other":"{0} күн ынараа өттүгэр"}}},"month":{"displayName":"Ый","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"{0} ыйынан"},"past":{"other":"{0} ый ынараа өттүгэр"}}},"year":{"displayName":"Сыл","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"{0} сылынан"},"past":{"other":"{0} сыл ынараа өттүгэр"}}}}});
ReactIntl.__addLocaleData({"locale":"saq","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"Isekondi","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Idakika","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Saai","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Mpari","relative":{"0":"Duo","1":"Taisere","-1":"Ng'ole"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Lapa","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Lari","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"se","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";if(n===2)return"two";return"other";},"fields":{"second":{"displayName":"sekunda","relative":{"0":"now"},"relativeTime":{"future":{"one":"{0} sekunda maŋŋilit","two":"{0} sekundda maŋŋilit","other":"{0} sekundda maŋŋilit"},"past":{"one":"{0} sekunda árat","two":"{0} sekundda árat","other":"{0} sekundda árat"}}},"minute":{"displayName":"minuhtta","relativeTime":{"future":{"one":"{0} minuhta maŋŋilit","two":"{0} minuhtta maŋŋilit","other":"{0} minuhtta maŋŋilit"},"past":{"one":"{0} minuhta árat","two":"{0} minuhtta árat","other":"{0} minuhtta árat"}}},"hour":{"displayName":"diibmu","relativeTime":{"future":{"one":"{0} diibmu maŋŋilit","two":"{0} diibmur maŋŋilit","other":"{0} diibmur maŋŋilit"},"past":{"one":"{0} diibmu árat","two":"{0} diibmur árat","other":"{0} diibmur árat"}}},"day":{"displayName":"beaivi","relative":{"0":"odne","1":"ihttin","2":"paijeelittáá","-2":"oovdebpeivvi","-1":"ikte"},"relativeTime":{"future":{"one":"{0} jándor maŋŋilit","two":"{0} jándor amaŋŋilit","other":"{0} jándora maŋŋilit"},"past":{"one":"{0} jándor árat","two":"{0} jándora árat","other":"{0} jándora árat"}}},"month":{"displayName":"mánnu","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"one":"{0} mánotbadji maŋŋilit","two":"{0} mánotbadji maŋŋilit","other":"{0} mánotbadji maŋŋilit"},"past":{"one":"{0} mánotbadji árat","two":"{0} mánotbadji árat","other":"{0} mánotbadji árat"}}},"year":{"displayName":"jáhki","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"one":"{0} jahki maŋŋilit","two":"{0} jahkki maŋŋilit","other":"{0} jahkki maŋŋilit"},"past":{"one":"{0} jahki árat","two":"{0} jahkki árat","other":"{0} jahkki árat"}}}}});
ReactIntl.__addLocaleData({"locale":"seh","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"Segundo","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Minuto","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Hora","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Ntsiku","relative":{"0":"Lero","1":"Manguana","-1":"Zuro"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Mwezi","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Chaka","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"ses","pluralRuleFunction":function (n) {return"other";},"fields":{"second":{"displayName":"Miti","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Miniti","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Guuru","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Zaari","relative":{"0":"Hõo","1":"Suba","-1":"Bi"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Handu","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Jiiri","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"sg","pluralRuleFunction":function (n) {return"other";},"fields":{"second":{"displayName":"Nzîna ngbonga","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Ndurü ngbonga","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Ngbonga","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Lâ","relative":{"0":"Lâsô","1":"Kêkerêke","-1":"Bîrï"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Nze","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Ngû","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"shi","pluralRuleFunction":function (n) {var i=Math.floor(Math.abs(n));n=Math.floor(n);if(i===0||n===1)return"one";if(n===Math.floor(n)&&n>=2&&n<=10)return"few";return"other";},"fields":{"second":{"displayName":"ⵜⴰⵙⵉⵏⵜ","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"ⵜⵓⵙⴷⵉⴷⵜ","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"ⵜⴰⵙⵔⴰⴳⵜ","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"ⴰⵙⵙ","relative":{"0":"ⴰⵙⵙⴰ","1":"ⴰⵙⴽⴽⴰ","-1":"ⵉⴹⵍⵍⵉ"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"ⴰⵢⵢⵓⵔ","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"ⴰⵙⴳⴳⵯⴰⵙ","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"si","pluralRuleFunction":function (n) {var i=Math.floor(Math.abs(n)),f=parseInt(n.toString().replace(/^[^.]*\.?/,""),10);n=Math.floor(n);if(n===0||n===1||i===0&&f===1)return"one";return"other";},"fields":{"second":{"displayName":"තත්පරය","relative":{"0":"දැන්"},"relativeTime":{"future":{"one":"තත්පර {0} කින්","other":"තත්පර {0} කින්"},"past":{"one":"තත්පර {0}කට පෙර","other":"තත්පර {0}කට පෙර"}}},"minute":{"displayName":"මිනිත්තුව","relativeTime":{"future":{"one":"මිනිත්තු {0} කින්","other":"මිනිත්තු {0} කින්"},"past":{"one":"මිනිත්තු {0}ට පෙර","other":"මිනිත්තු {0}ට පෙර"}}},"hour":{"displayName":"පැය","relativeTime":{"future":{"one":"පැය {0} කින්","other":"පැය {0} කින්"},"past":{"one":"පැය {0}ට පෙර","other":"පැය {0}ට පෙර"}}},"day":{"displayName":"දිනය","relative":{"0":"අද","1":"හෙට","2":"අනිද්දා","-2":"පෙරේදා","-1":"ඊයෙ"},"relativeTime":{"future":{"one":"දින {0}න්","other":"දින {0}න්"},"past":{"one":"දින {0} ට පෙර","other":"දින {0} ට පෙර"}}},"month":{"displayName":"මාසය","relative":{"0":"මෙම මාසය","1":"ඊළඟ මාසය","-1":"පසුගිය මාසය"},"relativeTime":{"future":{"one":"මාස {0}කින්","other":"මාස {0}කින්"},"past":{"one":"මාස {0}කට පෙර","other":"මාස {0}කට පෙර"}}},"year":{"displayName":"වර්ෂය","relative":{"0":"මෙම වසර","1":"ඊළඟ වසර","-1":"පසුගිය වසර"},"relativeTime":{"future":{"one":"වසර {0} කින්","other":"වසර {0} කින්"},"past":{"one":"වසර {0}ට පෙර","other":"වසර {0}ට පෙර"}}}}});
ReactIntl.__addLocaleData({"locale":"sk","pluralRuleFunction":function (n) {var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length;n=Math.floor(n);if(i===1&&v===0)return"one";if(i===Math.floor(i)&&i>=2&&i<=4&&v===0)return"few";if((v!==0))return"many";return"other";},"fields":{"second":{"displayName":"Sekunda","relative":{"0":"teraz"},"relativeTime":{"future":{"one":"O {0} sekundu","few":"O {0} sekundy","many":"O {0} sekundy","other":"O {0} sekúnd"},"past":{"one":"Pred {0} sekundou","few":"Pred {0} sekundami","many":"Pred {0} sekundami","other":"Pred {0} sekundami"}}},"minute":{"displayName":"Minúta","relativeTime":{"future":{"one":"O {0} minútu","few":"O {0} minúty","many":"O {0} minúty","other":"O {0} minút"},"past":{"one":"Pred {0} minútou","few":"Pred {0} minútami","many":"Pred {0} minútami","other":"Pred {0} minútami"}}},"hour":{"displayName":"Hodina","relativeTime":{"future":{"one":"O {0} hodinu","few":"O {0} hodiny","many":"O {0} hodiny","other":"O {0} hodín"},"past":{"one":"Pred {0} hodinou","few":"Pred {0} hodinami","many":"Pred {0} hodinami","other":"Pred {0} hodinami"}}},"day":{"displayName":"Deň","relative":{"0":"Dnes","1":"Zajtra","2":"Pozajtra","-2":"Predvčerom","-1":"Včera"},"relativeTime":{"future":{"one":"O {0} deň","few":"O {0} dni","many":"O {0} dňa","other":"O {0} dní"},"past":{"one":"Pred {0} dňom","few":"Pred {0} dňami","many":"Pred {0} dňami","other":"Pred {0} dňami"}}},"month":{"displayName":"Mesiac","relative":{"0":"Tento mesiac","1":"Budúci mesiac","-1":"Posledný mesiac"},"relativeTime":{"future":{"one":"O {0} mesiac","few":"O {0} mesiace","many":"O {0} mesiaca","other":"O {0} mesiacov"},"past":{"one":"Pred {0} mesiacom","few":"Pred {0} mesiacmi","many":"Pred {0} mesiacmi","other":"Pred {0} mesiacmi"}}},"year":{"displayName":"Rok","relative":{"0":"Tento rok","1":"Budúci rok","-1":"Minulý rok"},"relativeTime":{"future":{"one":"O {0} rok","few":"O {0} roky","many":"O {0} roka","other":"O {0} rokov"},"past":{"one":"Pred {0} rokom","few":"Pred {0} rokmi","many":"Pred {0} rokmi","other":"Pred {0} rokmi"}}}}});
ReactIntl.__addLocaleData({"locale":"sl","pluralRuleFunction":function (n) {var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length;n=Math.floor(n);if(v===0&&i%100===1)return"one";if(v===0&&i%100===2)return"two";if(v===0&&(i%100===Math.floor(i%100)&&i%100>=3&&i%100<=4||(v!==0)))return"few";return"other";},"fields":{"second":{"displayName":"Sekunda","relative":{"0":"zdaj"},"relativeTime":{"future":{"one":"Čez {0} sekundo","two":"Čez {0} sekundi","few":"Čez {0} sekunde","other":"Čez {0} sekundi"},"past":{"one":"Pred {0} sekundo","two":"Pred {0} sekundama","few":"Pred {0} sekundami","other":"Pred {0} sekundami"}}},"minute":{"displayName":"Minuta","relativeTime":{"future":{"one":"Čez {0} min.","two":"Čez {0} min.","few":"Čez {0} min.","other":"Čez {0} min."},"past":{"one":"Pred {0} min.","two":"Pred {0} min.","few":"Pred {0} min.","other":"Pred {0} min."}}},"hour":{"displayName":"Ura","relativeTime":{"future":{"one":"Čez {0} h","two":"Čez {0} h","few":"Čez {0} h","other":"Čez {0} h"},"past":{"one":"Pred {0} h","two":"Pred {0} h","few":"Pred {0} h","other":"Pred {0} h"}}},"day":{"displayName":"Dan","relative":{"0":"Danes","1":"Jutri","2":"Pojutrišnjem","-2":"Predvčerajšnjim","-1":"Včeraj"},"relativeTime":{"future":{"one":"Čez {0} dan","two":"Čez {0} dni","few":"Čez {0} dni","other":"Čez {0} dni"},"past":{"one":"Pred {0} dnevom","two":"Pred {0} dnevoma","few":"Pred {0} dnevi","other":"Pred {0} dnevi"}}},"month":{"displayName":"Mesec","relative":{"0":"Ta mesec","1":"Naslednji mesec","-1":"Prejšnji mesec"},"relativeTime":{"future":{"one":"Čez {0} mesec","two":"Čez {0} meseca","few":"Čez {0} mesece","other":"Čez {0} mesecev"},"past":{"one":"Pred {0} mesecem","two":"Pred {0} meseci","few":"Pred {0} meseci","other":"Pred {0} meseci"}}},"year":{"displayName":"Leto","relative":{"0":"Letos","1":"Naslednje leto","-1":"Lani"},"relativeTime":{"future":{"one":"Čez {0} leto","two":"Čez {0} leti","few":"Čez {0} leta","other":"Čez {0} let"},"past":{"one":"Pred {0} letom","two":"Pred {0} leti","few":"Pred {0} leti","other":"Pred {0} leti"}}}}});
ReactIntl.__addLocaleData({"locale":"sn","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"Sekondi","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Mineti","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Awa","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Zuva","relative":{"0":"Nhasi","1":"Mangwana","-1":"Nezuro"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Mwedzi","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Gore","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"so","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"Il biriqsi","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Daqiiqad","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Saacad","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Maalin","relative":{"0":"Maanta","1":"Berri","-1":"Shalay"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Bil","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Sanad","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"sq","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"sekondë","relative":{"0":"tani"},"relativeTime":{"future":{"one":"pas {0} sekonde","other":"pas {0} sekondash"},"past":{"one":"para {0} sekonde","other":"para {0} sekondash"}}},"minute":{"displayName":"minutë","relativeTime":{"future":{"one":"pas {0} minute","other":"pas {0} minutash"},"past":{"one":"para {0} minute","other":"para {0} minutash"}}},"hour":{"displayName":"orë","relativeTime":{"future":{"one":"pas {0} ore","other":"pas {0} orësh"},"past":{"one":"para {0} ore","other":"para {0} orësh"}}},"day":{"displayName":"ditë","relative":{"0":"sot","1":"nesër","-1":"dje"},"relativeTime":{"future":{"one":"pas {0} dite","other":"pas {0} ditësh"},"past":{"one":"para {0} dite","other":"para {0} ditësh"}}},"month":{"displayName":"muaj","relative":{"0":"këtë muaj","1":"muajin e ardhshëm","-1":"muajin e kaluar"},"relativeTime":{"future":{"one":"pas {0} muaji","other":"pas {0} muajsh"},"past":{"one":"para {0} muaji","other":"para {0} muajsh"}}},"year":{"displayName":"vit","relative":{"0":"këtë vit","1":"vitin e ardhshëm","-1":"vitin e kaluar"},"relativeTime":{"future":{"one":"pas {0} viti","other":"pas {0} vjetësh"},"past":{"one":"para {0} viti","other":"para {0} vjetësh"}}}}});
ReactIntl.__addLocaleData({"locale":"sr","pluralRuleFunction":function (n) {var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length,f=parseInt(n.toString().replace(/^[^.]*\.?/,""),10);n=Math.floor(n);if(v===0&&i%10===1&&((i%100!==11)||f%10===1&&(f%100!==11)))return"one";if(v===0&&i%10===Math.floor(i%10)&&i%10>=2&&i%10<=4&&(!(i%100>=12&&i%100<=14)||f%10===Math.floor(f%10)&&f%10>=2&&f%10<=4&&!(f%100>=12&&f%100<=14)))return"few";return"other";},"fields":{"second":{"displayName":"секунд","relative":{"0":"сада"},"relativeTime":{"future":{"one":"за {0} секунду","few":"за {0} секунде","other":"за {0} секунди"},"past":{"one":"пре {0} секунде","few":"пре {0} секунде","other":"пре {0} секунди"}}},"minute":{"displayName":"минут","relativeTime":{"future":{"one":"за {0} минут","few":"за {0} минута","other":"за {0} минута"},"past":{"one":"пре {0} минута","few":"пре {0} минута","other":"пре {0} минута"}}},"hour":{"displayName":"час","relativeTime":{"future":{"one":"за {0} сат","few":"за {0} сата","other":"за {0} сати"},"past":{"one":"пре {0} сата","few":"пре {0} сата","other":"пре {0} сати"}}},"day":{"displayName":"дан","relative":{"0":"данас","1":"сутра","2":"прекосутра","-2":"прекјуче","-1":"јуче"},"relativeTime":{"future":{"one":"за {0} дан","few":"за {0} дана","other":"за {0} дана"},"past":{"one":"пре {0} дана","few":"пре {0} дана","other":"пре {0} дана"}}},"month":{"displayName":"месец","relative":{"0":"Овог месеца","1":"Следећег месеца","-1":"Прошлог месеца"},"relativeTime":{"future":{"one":"за {0} месец","few":"за {0} месеца","other":"за {0} месеци"},"past":{"one":"пре {0} месеца","few":"пре {0} месеца","other":"пре {0} месеци"}}},"year":{"displayName":"година","relative":{"0":"Ове године","1":"Следеће године","-1":"Прошле године"},"relativeTime":{"future":{"one":"за {0} годину","few":"за {0} године","other":"за {0} година"},"past":{"one":"пре {0} године","few":"пре {0} године","other":"пре {0} година"}}}}});
ReactIntl.__addLocaleData({"locale":"ss","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"Second","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Minute","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Hour","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Day","relative":{"0":"today","1":"tomorrow","-1":"yesterday"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Month","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Year","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"ssy","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"Second","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Minute","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Hour","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Day","relative":{"0":"today","1":"tomorrow","-1":"yesterday"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Month","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Year","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"st","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"Second","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Minute","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Hour","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Day","relative":{"0":"today","1":"tomorrow","-1":"yesterday"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Month","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Year","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"sv","pluralRuleFunction":function (n) {var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length;n=Math.floor(n);if(i===1&&v===0)return"one";return"other";},"fields":{"second":{"displayName":"Sekund","relative":{"0":"nu"},"relativeTime":{"future":{"one":"om {0} sekund","other":"om {0} sekunder"},"past":{"one":"för {0} sekund sedan","other":"för {0} sekunder sedan"}}},"minute":{"displayName":"Minut","relativeTime":{"future":{"one":"om {0} minut","other":"om {0} minuter"},"past":{"one":"för {0} minut sedan","other":"för {0} minuter sedan"}}},"hour":{"displayName":"timme","relativeTime":{"future":{"one":"om {0} timme","other":"om {0} timmar"},"past":{"one":"för {0} timme sedan","other":"för {0} timmar sedan"}}},"day":{"displayName":"Dag","relative":{"0":"i dag","1":"i morgon","2":"i övermorgon","-2":"i förrgår","-1":"i går"},"relativeTime":{"future":{"one":"om {0} dag","other":"om {0} dagar"},"past":{"one":"för {0} dag sedan","other":"för {0} dagar sedan"}}},"month":{"displayName":"Månad","relative":{"0":"denna månad","1":"nästa månad","-1":"förra månaden"},"relativeTime":{"future":{"one":"om {0} månad","other":"om {0} månader"},"past":{"one":"för {0} månad sedan","other":"för {0} månader sedan"}}},"year":{"displayName":"År","relative":{"0":"i år","1":"nästa år","-1":"i fjol"},"relativeTime":{"future":{"one":"om {0} år","other":"om {0} år"},"past":{"one":"för {0} år sedan","other":"för {0} år sedan"}}}}});
ReactIntl.__addLocaleData({"locale":"sw","pluralRuleFunction":function (n) {var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length;n=Math.floor(n);if(i===1&&v===0)return"one";return"other";},"fields":{"second":{"displayName":"Sekunde","relative":{"0":"sasa"},"relativeTime":{"future":{"one":"Baada ya sekunde {0}","other":"Baada ya sekunde {0}"},"past":{"one":"Sekunde {0} iliyopita","other":"Sekunde {0} zilizopita"}}},"minute":{"displayName":"Dakika","relativeTime":{"future":{"one":"Baada ya dakika {0}","other":"Baada ya dakika {0}"},"past":{"one":"Dakika {0} iliyopita","other":"Dakika {0} zilizopita"}}},"hour":{"displayName":"Saa","relativeTime":{"future":{"one":"Baada ya saa {0}","other":"Baada ya saa {0}"},"past":{"one":"Saa {0} iliyopita","other":"Saa {0} zilizopita"}}},"day":{"displayName":"Siku","relative":{"0":"leo","1":"kesho","2":"kesho kutwa","-2":"juzi","-1":"jana"},"relativeTime":{"future":{"one":"Baada ya siku {0}","other":"Baada ya siku {0}"},"past":{"one":"Siku {0} iliyopita","other":"Siku {0} zilizopita"}}},"month":{"displayName":"Mwezi","relative":{"0":"mwezi huu","1":"mwezi ujao","-1":"mwezi uliopita"},"relativeTime":{"future":{"one":"Baada ya mwezi {0}","other":"Baada ya miezi {0}"},"past":{"one":"Miezi {0} iliyopita","other":"Miezi {0} iliyopita"}}},"year":{"displayName":"Mwaka","relative":{"0":"mwaka huu","1":"mwaka ujao","-1":"mwaka uliopita"},"relativeTime":{"future":{"one":"Baada ya mwaka {0}","other":"Baada ya miaka {0}"},"past":{"one":"Mwaka {0} uliopita","other":"Miaka {0} iliyopita"}}}}});
ReactIntl.__addLocaleData({"locale":"ta","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"வினாடி","relative":{"0":"இப்போது"},"relativeTime":{"future":{"one":"{0} வினாடியில்","other":"{0} விநாடிகளில்"},"past":{"one":"{0} வினாடிக்கு முன்","other":"{0} வினாடிக்கு முன்"}}},"minute":{"displayName":"நிமிடம்","relativeTime":{"future":{"one":"{0} நிமிடத்தில்","other":"{0} நிமிடங்களில்"},"past":{"one":"{0} நிமிடத்திற்கு முன்","other":"{0} நிமிடங்களுக்கு முன்"}}},"hour":{"displayName":"மணி","relativeTime":{"future":{"one":"{0} மணிநேரத்தில்","other":"{0} மணிநேரத்தில்"},"past":{"one":"{0} மணிநேரம் முன்","other":"{0} மணிநேரம் முன்"}}},"day":{"displayName":"நாள்","relative":{"0":"இன்று","1":"நாளை","2":"நாளை மறுநாள்","-2":"நேற்று முன் தினம்","-1":"நேற்று"},"relativeTime":{"future":{"one":"{0} நாளில்","other":"{0} நாட்களில்"},"past":{"one":"{0} நாளுக்கு முன்","other":"{0} நாட்களுக்கு முன்"}}},"month":{"displayName":"மாதம்","relative":{"0":"இந்த மாதம்","1":"அடுத்த மாதம்","-1":"கடந்த மாதம்"},"relativeTime":{"future":{"one":"{0} மாதத்தில்","other":"{0} மாதங்களில்"},"past":{"one":"{0} மாதத்துக்கு முன்","other":"{0} மாதங்களுக்கு முன்"}}},"year":{"displayName":"ஆண்டு","relative":{"0":"இந்த ஆண்டு","1":"அடுத்த ஆண்டு","-1":"கடந்த ஆண்டு"},"relativeTime":{"future":{"one":"{0} ஆண்டில்","other":"{0} ஆண்டுகளில்"},"past":{"one":"{0} ஆண்டிற்கு முன்","other":"{0} ஆண்டுகளுக்கு முன்"}}}}});
ReactIntl.__addLocaleData({"locale":"te","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"క్షణం","relative":{"0":"ప్రస్తుతం"},"relativeTime":{"future":{"one":"{0} సెకన్‌లో","other":"{0} సెకన్లలో"},"past":{"one":"{0} సెకను క్రితం","other":"{0} సెకన్ల క్రితం"}}},"minute":{"displayName":"నిమిషము","relativeTime":{"future":{"one":"{0} నిమిషంలో","other":"{0} నిమిషాల్లో"},"past":{"one":"{0} నిమిషం క్రితం","other":"{0} నిమిషాల క్రితం"}}},"hour":{"displayName":"గంట","relativeTime":{"future":{"one":"{0} గంటలో","other":"{0} గంటల్లో"},"past":{"one":"{0} గంట క్రితం","other":"{0} గంటల క్రితం"}}},"day":{"displayName":"దినం","relative":{"0":"ఈ రోజు","1":"రేపు","2":"ఎల్లుండి","-2":"మొన్న","-1":"నిన్న"},"relativeTime":{"future":{"one":"{0} రోజులో","other":"{0} రోజుల్లో"},"past":{"one":"{0} రోజు క్రితం","other":"{0} రోజుల క్రితం"}}},"month":{"displayName":"నెల","relative":{"0":"ఈ నెల","1":"తదుపరి నెల","-1":"గత నెల"},"relativeTime":{"future":{"one":"{0} నెలలో","other":"{0} నెలల్లో"},"past":{"one":"{0} నెల క్రితం","other":"{0} నెలల క్రితం"}}},"year":{"displayName":"సంవత్సరం","relative":{"0":"ఈ సంవత్సరం","1":"తదుపరి సంవత్సరం","-1":"గత సంవత్సరం"},"relativeTime":{"future":{"one":"{0} సంవత్సరంలో","other":"{0} సంవత్సరాల్లో"},"past":{"one":"{0} సంవత్సరం క్రితం","other":"{0} సంవత్సరాల క్రితం"}}}}});
ReactIntl.__addLocaleData({"locale":"teo","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"Isekonde","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Idakika","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Esaa","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Aparan","relative":{"0":"Lolo","1":"Moi","-1":"Jaan"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Elap","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Ekan","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"th","pluralRuleFunction":function (n) {return"other";},"fields":{"second":{"displayName":"วินาที","relative":{"0":"ขณะนี้"},"relativeTime":{"future":{"other":"ในอีก {0} วินาที"},"past":{"other":"{0} วินาทีที่ผ่านมา"}}},"minute":{"displayName":"นาที","relativeTime":{"future":{"other":"ในอีก {0} นาที"},"past":{"other":"{0} นาทีที่ผ่านมา"}}},"hour":{"displayName":"ชั่วโมง","relativeTime":{"future":{"other":"ในอีก {0} ชั่วโมง"},"past":{"other":"{0} ชั่วโมงที่ผ่านมา"}}},"day":{"displayName":"วัน","relative":{"0":"วันนี้","1":"พรุ่งนี้","2":"มะรืนนี้","-2":"เมื่อวานซืน","-1":"เมื่อวาน"},"relativeTime":{"future":{"other":"ในอีก {0} วัน"},"past":{"other":"{0} วันที่ผ่านมา"}}},"month":{"displayName":"เดือน","relative":{"0":"เดือนนี้","1":"เดือนหน้า","-1":"เดือนที่แล้ว"},"relativeTime":{"future":{"other":"ในอีก {0} เดือน"},"past":{"other":"{0} เดือนที่ผ่านมา"}}},"year":{"displayName":"ปี","relative":{"0":"ปีนี้","1":"ปีหน้า","-1":"ปีที่แล้ว"},"relativeTime":{"future":{"other":"ในอีก {0} ปี"},"past":{"other":"{0} ปีที่แล้ว"}}}}});
ReactIntl.__addLocaleData({"locale":"ti","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===Math.floor(n)&&n>=0&&n<=1)return"one";return"other";},"fields":{"second":{"displayName":"Second","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Minute","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Hour","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Day","relative":{"0":"today","1":"tomorrow","-1":"yesterday"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Month","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Year","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"tig","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"Second","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Minute","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Hour","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Day","relative":{"0":"today","1":"tomorrow","-1":"yesterday"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Month","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Year","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"tn","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"Second","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Minute","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Hour","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Day","relative":{"0":"today","1":"tomorrow","-1":"yesterday"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Month","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Year","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"to","pluralRuleFunction":function (n) {return"other";},"fields":{"second":{"displayName":"sekoni","relative":{"0":"taimiʻni"},"relativeTime":{"future":{"other":"ʻi he sekoni ʻe {0}"},"past":{"other":"sekoni ʻe {0} kuoʻosi"}}},"minute":{"displayName":"miniti","relativeTime":{"future":{"other":"ʻi he miniti ʻe {0}"},"past":{"other":"miniti ʻe {0} kuoʻosi"}}},"hour":{"displayName":"houa","relativeTime":{"future":{"other":"ʻi he houa ʻe {0}"},"past":{"other":"houa ʻe {0} kuoʻosi"}}},"day":{"displayName":"ʻaho","relative":{"0":"ʻaho⸍ni","1":"ʻapongipongi","2":"ʻahepongipongi","-2":"ʻaneheafi","-1":"ʻaneafi"},"relativeTime":{"future":{"other":"ʻi he ʻaho ʻe {0}"},"past":{"other":"ʻaho ʻe {0} kuoʻosi"}}},"month":{"displayName":"māhina","relative":{"0":"māhina⸍ni","1":"māhina kahaʻu","-1":"māhina kuoʻosi"},"relativeTime":{"future":{"other":"ʻi he māhina ʻe {0}"},"past":{"other":"māhina ʻe {0} kuoʻosi"}}},"year":{"displayName":"taʻu","relative":{"0":"taʻu⸍ni","1":"taʻu kahaʻu","-1":"taʻu kuoʻosi"},"relativeTime":{"future":{"other":"ʻi he taʻu ʻe {0}"},"past":{"other":"taʻu ʻe {0} kuo hili"}}}}});
ReactIntl.__addLocaleData({"locale":"tr","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"Saniye","relative":{"0":"şimdi"},"relativeTime":{"future":{"one":"{0} saniye sonra","other":"{0} saniye sonra"},"past":{"one":"{0} saniye önce","other":"{0} saniye önce"}}},"minute":{"displayName":"Dakika","relativeTime":{"future":{"one":"{0} dakika sonra","other":"{0} dakika sonra"},"past":{"one":"{0} dakika önce","other":"{0} dakika önce"}}},"hour":{"displayName":"Saat","relativeTime":{"future":{"one":"{0} saat sonra","other":"{0} saat sonra"},"past":{"one":"{0} saat önce","other":"{0} saat önce"}}},"day":{"displayName":"Gün","relative":{"0":"bugün","1":"yarın","2":"öbür gün","-2":"evvelsi gün","-1":"dün"},"relativeTime":{"future":{"one":"{0} gün sonra","other":"{0} gün sonra"},"past":{"one":"{0} gün önce","other":"{0} gün önce"}}},"month":{"displayName":"Ay","relative":{"0":"bu ay","1":"gelecek ay","-1":"geçen ay"},"relativeTime":{"future":{"one":"{0} ay sonra","other":"{0} ay sonra"},"past":{"one":"{0} ay önce","other":"{0} ay önce"}}},"year":{"displayName":"Yıl","relative":{"0":"bu yıl","1":"gelecek yıl","-1":"geçen yıl"},"relativeTime":{"future":{"one":"{0} yıl sonra","other":"{0} yıl sonra"},"past":{"one":"{0} yıl önce","other":"{0} yıl önce"}}}}});
ReactIntl.__addLocaleData({"locale":"ts","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"Second","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Minute","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Hour","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Day","relative":{"0":"today","1":"tomorrow","-1":"yesterday"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Month","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Year","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"tzm","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===Math.floor(n)&&n>=0&&n<=1||n===Math.floor(n)&&n>=11&&n<=99)return"one";return"other";},"fields":{"second":{"displayName":"Tusnat","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Tusdat","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Tasragt","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Ass","relative":{"0":"Assa","1":"Asekka","-1":"Assenaṭ"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Ayur","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Asseggas","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"ug","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"سېكۇنت","relative":{"0":"now"},"relativeTime":{"future":{"one":"{0} سېكۇنتتىن كېيىن","other":"{0} سېكۇنتتىن كېيىن"},"past":{"one":"{0} سېكۇنت ئىلگىرى","other":"{0} سېكۇنت ئىلگىرى"}}},"minute":{"displayName":"مىنۇت","relativeTime":{"future":{"one":"{0} مىنۇتتىن كېيىن","other":"{0} مىنۇتتىن كېيىن"},"past":{"one":"{0} مىنۇت ئىلگىرى","other":"{0} مىنۇت ئىلگىرى"}}},"hour":{"displayName":"سائەت","relativeTime":{"future":{"one":"{0} سائەتتىن كېيىن","other":"{0} سائەتتىن كېيىن"},"past":{"one":"{0} سائەت ئىلگىرى","other":"{0} سائەت ئىلگىرى"}}},"day":{"displayName":"كۈن","relative":{"0":"بۈگۈن","1":"ئەتە","-1":"تۈنۈگۈن"},"relativeTime":{"future":{"one":"{0} كۈندىن كېيىن","other":"{0} كۈندىن كېيىن"},"past":{"one":"{0} كۈن ئىلگىرى","other":"{0} كۈن ئىلگىرى"}}},"month":{"displayName":"ئاي","relative":{"0":"بۇ ئاي","1":"كېلەر ئاي","-1":"ئۆتكەن ئاي"},"relativeTime":{"future":{"one":"{0} ئايدىن كېيىن","other":"{0} ئايدىن كېيىن"},"past":{"one":"{0} ئاي ئىلگىرى","other":"{0} ئاي ئىلگىرى"}}},"year":{"displayName":"يىل","relative":{"0":"بۇ يىل","1":"كېلەر يىل","-1":"ئۆتكەن يىل"},"relativeTime":{"future":{"one":"{0} يىلدىن كېيىن","other":"{0} يىلدىن كېيىن"},"past":{"one":"{0} يىل ئىلگىرى","other":"{0} يىل ئىلگىرى"}}}}});
ReactIntl.__addLocaleData({"locale":"uk","pluralRuleFunction":function (n) {var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length;n=Math.floor(n);if(v===0&&i%10===1&&(i%100!==11))return"one";if(v===0&&i%10===Math.floor(i%10)&&i%10>=2&&i%10<=4&&!(i%100>=12&&i%100<=14))return"few";if(v===0&&(i%10===0||v===0&&(i%10===Math.floor(i%10)&&i%10>=5&&i%10<=9||v===0&&i%100===Math.floor(i%100)&&i%100>=11&&i%100<=14)))return"many";return"other";},"fields":{"second":{"displayName":"Секунда","relative":{"0":"зараз"},"relativeTime":{"future":{"one":"Через {0} секунду","few":"Через {0} секунди","many":"Через {0} секунд","other":"Через {0} секунди"},"past":{"one":"{0} секунду тому","few":"{0} секунди тому","many":"{0} секунд тому","other":"{0} секунди тому"}}},"minute":{"displayName":"Хвилина","relativeTime":{"future":{"one":"Через {0} хвилину","few":"Через {0} хвилини","many":"Через {0} хвилин","other":"Через {0} хвилини"},"past":{"one":"{0} хвилину тому","few":"{0} хвилини тому","many":"{0} хвилин тому","other":"{0} хвилини тому"}}},"hour":{"displayName":"Година","relativeTime":{"future":{"one":"Через {0} годину","few":"Через {0} години","many":"Через {0} годин","other":"Через {0} години"},"past":{"one":"{0} годину тому","few":"{0} години тому","many":"{0} годин тому","other":"{0} години тому"}}},"day":{"displayName":"День","relative":{"0":"сьогодні","1":"завтра","2":"післязавтра","-2":"позавчора","-1":"учора"},"relativeTime":{"future":{"one":"Через {0} день","few":"Через {0} дні","many":"Через {0} днів","other":"Через {0} дня"},"past":{"one":"{0} день тому","few":"{0} дні тому","many":"{0} днів тому","other":"{0} дня тому"}}},"month":{"displayName":"Місяць","relative":{"0":"цього місяця","1":"наступного місяця","-1":"минулого місяця"},"relativeTime":{"future":{"one":"Через {0} місяць","few":"Через {0} місяці","many":"Через {0} місяців","other":"Через {0} місяця"},"past":{"one":"{0} місяць тому","few":"{0} місяці тому","many":"{0} місяців тому","other":"{0} місяця тому"}}},"year":{"displayName":"Рік","relative":{"0":"цього року","1":"наступного року","-1":"минулого року"},"relativeTime":{"future":{"one":"Через {0} рік","few":"Через {0} роки","many":"Через {0} років","other":"Через {0} року"},"past":{"one":"{0} рік тому","few":"{0} роки тому","many":"{0} років тому","other":"{0} року тому"}}}}});
ReactIntl.__addLocaleData({"locale":"ur","pluralRuleFunction":function (n) {var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length;n=Math.floor(n);if(i===1&&v===0)return"one";return"other";},"fields":{"second":{"displayName":"سیکنڈ","relative":{"0":"اب"},"relativeTime":{"future":{"one":"{0} سیکنڈ میں","other":"{0} سیکنڈ میں"},"past":{"one":"{0} سیکنڈ پہلے","other":"{0} سیکنڈ پہلے"}}},"minute":{"displayName":"منٹ","relativeTime":{"future":{"one":"{0} منٹ میں","other":"{0} منٹ میں"},"past":{"one":"{0} منٹ پہلے","other":"{0} منٹ پہلے"}}},"hour":{"displayName":"گھنٹہ","relativeTime":{"future":{"one":"{0} گھنٹہ میں","other":"{0} گھنٹے میں"},"past":{"one":"{0} گھنٹہ پہلے","other":"{0} گھنٹے پہلے"}}},"day":{"displayName":"دن","relative":{"0":"آج","1":"آئندہ کل","2":"آنے والا پرسوں","-2":"گزشتہ پرسوں","-1":"گزشتہ کل"},"relativeTime":{"future":{"one":"{0} دن میں","other":"{0} دن میں"},"past":{"one":"{0} دن پہلے","other":"{0} دن پہلے"}}},"month":{"displayName":"مہینہ","relative":{"0":"اس مہینہ","1":"اگلے مہینہ","-1":"پچھلے مہینہ"},"relativeTime":{"future":{"one":"{0} مہینہ میں","other":"{0} مہینے میں"},"past":{"one":"{0} مہینہ پہلے","other":"{0} مہینے پہلے"}}},"year":{"displayName":"سال","relative":{"0":"اس سال","1":"اگلے سال","-1":"پچھلے سال"},"relativeTime":{"future":{"one":"{0} سال میں","other":"{0} سال میں"},"past":{"one":"{0} سال پہلے","other":"{0} سال پہلے"}}}}});
ReactIntl.__addLocaleData({"locale":"uz","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"Soniya","relative":{"0":"hozir"},"relativeTime":{"future":{"one":"{0} soniyadan soʻng","other":"{0} soniyadan soʻng"},"past":{"one":"{0} soniya oldin","other":"{0} soniya oldin"}}},"minute":{"displayName":"Daqiqa","relativeTime":{"future":{"one":"{0} daqiqadan soʻng","other":"{0} daqiqadan soʻng"},"past":{"one":"{0} daqiqa oldin","other":"{0} daqiqa oldin"}}},"hour":{"displayName":"Soat","relativeTime":{"future":{"one":"{0} soatdan soʻng","other":"{0} soatdan soʻng"},"past":{"one":"{0} soat oldin","other":"{0} soat oldin"}}},"day":{"displayName":"Kun","relative":{"0":"bugun","1":"ertaga","-1":"kecha"},"relativeTime":{"future":{"one":"{0} kundan soʻng","other":"{0} kundan soʻng"},"past":{"one":"{0} kun oldin","other":"{0} kun oldin"}}},"month":{"displayName":"Oy","relative":{"0":"bu oy","1":"keyingi oy","-1":"oʻtgan oy"},"relativeTime":{"future":{"one":"{0} oydan soʻng","other":"{0} oydan soʻng"},"past":{"one":"{0} oy avval","other":"{0} oy avval"}}},"year":{"displayName":"Yil","relative":{"0":"bu yil","1":"keyingi yil","-1":"oʻtgan yil"},"relativeTime":{"future":{"one":"{0} yildan soʻng","other":"{0} yildan soʻng"},"past":{"one":"{0} yil avval","other":"{0} yil avval"}}}}});
ReactIntl.__addLocaleData({"locale":"ve","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"Second","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Minute","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Hour","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Day","relative":{"0":"today","1":"tomorrow","-1":"yesterday"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Month","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Year","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"vi","pluralRuleFunction":function (n) {return"other";},"fields":{"second":{"displayName":"Giây","relative":{"0":"bây giờ"},"relativeTime":{"future":{"other":"Trong {0} giây nữa"},"past":{"other":"{0} giây trước"}}},"minute":{"displayName":"Phút","relativeTime":{"future":{"other":"Trong {0} phút nữa"},"past":{"other":"{0} phút trước"}}},"hour":{"displayName":"Giờ","relativeTime":{"future":{"other":"Trong {0} giờ nữa"},"past":{"other":"{0} giờ trước"}}},"day":{"displayName":"Ngày","relative":{"0":"Hôm nay","1":"Ngày mai","2":"Ngày kia","-2":"Hôm kia","-1":"Hôm qua"},"relativeTime":{"future":{"other":"Trong {0} ngày nữa"},"past":{"other":"{0} ngày trước"}}},"month":{"displayName":"Tháng","relative":{"0":"tháng này","1":"tháng sau","-1":"tháng trước"},"relativeTime":{"future":{"other":"Trong {0} tháng nữa"},"past":{"other":"{0} tháng trước"}}},"year":{"displayName":"Năm","relative":{"0":"năm nay","1":"năm sau","-1":"năm ngoái"},"relativeTime":{"future":{"other":"Trong {0} năm nữa"},"past":{"other":"{0} năm trước"}}}}});
ReactIntl.__addLocaleData({"locale":"vo","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"sekun","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"minut","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"düp","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Tag","relative":{"0":"adelo","1":"odelo","2":"udelo","-2":"edelo","-1":"ädelo"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"mul","relative":{"0":"amulo","1":"omulo","-1":"ämulo"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"yel","relative":{"0":"ayelo","1":"oyelo","-1":"äyelo"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"vun","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"Sekunde","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Dakyika","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Saa","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Mfiri","relative":{"0":"Inu","1":"Ngama","-1":"Ukou"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Mori","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Maka","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"wae","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"Sekunda","relative":{"0":"now"},"relativeTime":{"future":{"one":"i {0} sekund","other":"i {0} sekunde"},"past":{"one":"vor {0} sekund","other":"vor {0} sekunde"}}},"minute":{"displayName":"Mínütta","relativeTime":{"future":{"one":"i {0} minüta","other":"i {0} minüte"},"past":{"one":"vor {0} minüta","other":"vor {0} minüte"}}},"hour":{"displayName":"Schtund","relativeTime":{"future":{"one":"i {0} stund","other":"i {0} stunde"},"past":{"one":"vor {0} stund","other":"vor {0} stunde"}}},"day":{"displayName":"Tag","relative":{"0":"Hitte","1":"Móre","2":"Ubermóre","-2":"Vorgešter","-1":"Gešter"},"relativeTime":{"future":{"one":"i {0} tag","other":"i {0} täg"},"past":{"one":"vor {0} tag","other":"vor {0} täg"}}},"month":{"displayName":"Mánet","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"one":"I {0} mánet","other":"I {0} mánet"},"past":{"one":"vor {0} mánet","other":"vor {0} mánet"}}},"year":{"displayName":"Jár","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"one":"I {0} jár","other":"I {0} jár"},"past":{"one":"vor {0} jár","other":"cor {0} jár"}}}}});
ReactIntl.__addLocaleData({"locale":"xh","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"Second","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Minute","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Hour","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Day","relative":{"0":"today","1":"tomorrow","-1":"yesterday"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Month","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Year","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"xog","pluralRuleFunction":function (n) {n=Math.floor(n);if(n===1)return"one";return"other";},"fields":{"second":{"displayName":"Obutikitiki","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Edakiika","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"Essawa","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Olunaku","relative":{"0":"Olwaleelo (leelo)","1":"Enkyo","-1":"Edho"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Omwezi","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Omwaka","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"yo","pluralRuleFunction":function (n) {return"other";},"fields":{"second":{"displayName":"Ìsẹ́jú Ààyá","relative":{"0":"now"},"relativeTime":{"future":{"other":"+{0} s"},"past":{"other":"-{0} s"}}},"minute":{"displayName":"Ìsẹ́jú","relativeTime":{"future":{"other":"+{0} min"},"past":{"other":"-{0} min"}}},"hour":{"displayName":"wákàtí","relativeTime":{"future":{"other":"+{0} h"},"past":{"other":"-{0} h"}}},"day":{"displayName":"Ọjọ́","relative":{"0":"Òní","1":"Ọ̀la","2":"òtúùnla","-2":"íjẹta","-1":"Àná"},"relativeTime":{"future":{"other":"+{0} d"},"past":{"other":"-{0} d"}}},"month":{"displayName":"Osù","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"other":"+{0} m"},"past":{"other":"-{0} m"}}},"year":{"displayName":"Ọdún","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"other":"+{0} y"},"past":{"other":"-{0} y"}}}}});
ReactIntl.__addLocaleData({"locale":"zh","pluralRuleFunction":function (n) {return"other";},"fields":{"second":{"displayName":"秒钟","relative":{"0":"现在"},"relativeTime":{"future":{"other":"{0}秒钟后"},"past":{"other":"{0}秒钟前"}}},"minute":{"displayName":"分钟","relativeTime":{"future":{"other":"{0}分钟后"},"past":{"other":"{0}分钟前"}}},"hour":{"displayName":"小时","relativeTime":{"future":{"other":"{0}小时后"},"past":{"other":"{0}小时前"}}},"day":{"displayName":"日","relative":{"0":"今天","1":"明天","2":"后天","-2":"前天","-1":"昨天"},"relativeTime":{"future":{"other":"{0}天后"},"past":{"other":"{0}天前"}}},"month":{"displayName":"月","relative":{"0":"本月","1":"下个月","-1":"上个月"},"relativeTime":{"future":{"other":"{0}个月后"},"past":{"other":"{0}个月前"}}},"year":{"displayName":"年","relative":{"0":"今年","1":"明年","-1":"去年"},"relativeTime":{"future":{"other":"{0}年后"},"past":{"other":"{0}年前"}}}}});
ReactIntl.__addLocaleData({"locale":"zu","pluralRuleFunction":function (n) {var i=Math.floor(Math.abs(n));n=Math.floor(n);if(i===0||n===1)return"one";return"other";},"fields":{"second":{"displayName":"Isekhondi","relative":{"0":"manje"},"relativeTime":{"future":{"one":"Kusekhondi elingu-{0}","other":"Kumasekhondi angu-{0}"},"past":{"one":"isekhondi elingu-{0} eledlule","other":"amasekhondi angu-{0} adlule"}}},"minute":{"displayName":"Iminithi","relativeTime":{"future":{"one":"Kumunithi engu-{0}","other":"Emaminithini angu-{0}"},"past":{"one":"eminithini elingu-{0} eledlule","other":"amaminithi angu-{0} adlule"}}},"hour":{"displayName":"Ihora","relativeTime":{"future":{"one":"Ehoreni elingu-{0}","other":"Emahoreni angu-{0}"},"past":{"one":"ehoreni eligu-{0} eledluli","other":"emahoreni angu-{0} edlule"}}},"day":{"displayName":"Usuku","relative":{"0":"namhlanje","1":"kusasa","2":"Usuku olulandela olakusasa","-2":"Usuku olwandulela olwayizolo","-1":"izolo"},"relativeTime":{"future":{"one":"Osukwini olungu-{0}","other":"Ezinsukwini ezingu-{0}"},"past":{"one":"osukwini olungu-{0} olwedlule","other":"ezinsukwini ezingu-{0} ezedlule."}}},"month":{"displayName":"Inyanga","relative":{"0":"le nyanga","1":"inyanga ezayo","-1":"inyanga edlule"},"relativeTime":{"future":{"one":"Enyangeni engu-{0}","other":"Ezinyangeni ezingu-{0}"},"past":{"one":"enyangeni engu-{0} eyedlule","other":"ezinyangeni ezingu-{0} ezedlule"}}},"year":{"displayName":"Unyaka","relative":{"0":"kulo nyaka","1":"unyaka ozayo","-1":"onyakeni odlule"},"relativeTime":{"future":{"one":"Onyakeni ongu-{0}","other":"Eminyakeni engu-{0}"},"past":{"one":"enyakeni ongu-{0} owedlule","other":"iminyaka engu-{0} eyedlule"}}}}});
//# sourceMappingURL=react-intl-with-locales.js.map