(function() {
    "use strict";
    var $$utils$$hop = Object.prototype.hasOwnProperty;

    function $$utils$$extend(obj) {
      var sources = Array.prototype.slice.call(arguments, 1),
        i,
        len,
        source,
        key;

      for (i = 0, len = sources.length; i < len; i += 1) {
        source = sources[i];
        if (!source) {
          continue;
        }

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

    var $$es5$$realDefineProp = (function() {
      try {
        return !!Object.defineProperty({}, "a", {});
      } catch (e) {
        return false;
      }
    })();

    var $$es5$$es3 = !$$es5$$realDefineProp && !Object.prototype.__defineGetter__;

    var $$es5$$defineProperty = $$es5$$realDefineProp
      ? Object.defineProperty
      : function(obj, name, desc) {
          if ("get" in desc && obj.__defineGetter__) {
            obj.__defineGetter__(name, desc.get);
          } else if (!$$utils$$hop.call(obj, name) || "value" in desc) {
            obj[name] = desc.value;
          }
        };

    var $$es5$$objCreate =
      Object.create ||
      function(proto, props) {
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

    function $$compiler$$Compiler(locales, formats) {
      this.locales = locales;
      this.formats = formats;
    }

    $$compiler$$Compiler.prototype.compile = function(ast) {
      this.pluralStack = [];
      this.currentPlural = null;
      this.pluralNumberFormat = null;

      return this.compileMessage(ast);
    };

    $$compiler$$Compiler.prototype.compileMessage = function(ast) {
      if (!(ast && ast.type === "messageFormatPattern")) {
        throw new Error('Message AST is not of type: "messageFormatPattern"');
      }

      var elements = ast.elements,
        pattern = [];

      var i, len, element;

      for (i = 0, len = elements.length; i < len; i += 1) {
        element = elements[i];

        switch (element.type) {
          case "messageTextElement":
            pattern.push(this.compileMessageText(element));
            break;

          case "argumentElement":
            pattern.push(this.compileArgument(element));
            break;

          default:
            throw new Error("Message element does not have a valid type");
        }
      }

      return pattern;
    };

    $$compiler$$Compiler.prototype.compileMessageText = function(element) {
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
          element.value
        );
      }

      // Unescape the escaped '#'s in the message text.
      return element.value.replace(/\\#/g, "#");
    };

    $$compiler$$Compiler.prototype.compileArgument = function(element) {
      var format = element.format;

      if (!format) {
        return new $$compiler$$StringFormat(element.id);
      }

      var formats = this.formats,
        locales = this.locales,
        options;

      switch (format.type) {
        case "numberFormat":
          options = formats.number[format.style];
          return {
            id: element.id,
            format: new Intl.NumberFormat(locales, options).format
          };

        case "dateFormat":
          options = formats.date[format.style];
          return {
            id: element.id,
            format: new Intl.DateTimeFormat(locales, options).format
          };

        case "timeFormat":
          options = formats.time[format.style];
          return {
            id: element.id,
            format: new Intl.DateTimeFormat(locales, options).format
          };

        case "pluralFormat":
          options = this.compileOptions(element);
          return new $$compiler$$PluralFormat(
            element.id,
            format.ordinal,
            format.offset,
            options,
            locales
          );

        case "selectFormat":
          options = this.compileOptions(element);
          return new $$compiler$$SelectFormat(element.id, options);

        default:
          throw new Error("Message element does not have a valid format type");
      }
    };

    $$compiler$$Compiler.prototype.compileOptions = function(element) {
      var format = element.format,
        options = format.options,
        optionsHash = {};

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

    // -- Compiler Helper Classes --------------------------------------------------

    function $$compiler$$StringFormat(id) {
      this.id = id;
    }

    $$compiler$$StringFormat.prototype.format = function(value) {
      if (!value && typeof value !== "number") {
        return "";
      }

      return typeof value === "string" ? value : String(value);
    };

    function $$compiler$$PluralFormat(id, useOrdinal, offset, options, locales) {
      this.id = id;
      this.useOrdinal = useOrdinal;
      this.offset = offset;
      this.options = options;
      this.pluralRules = new Intl.PluralRules(locales, {
        type: useOrdinal ? "ordinal" : "cardinal"
      });
    }

    $$compiler$$PluralFormat.prototype.getOption = function(value) {
      var options = this.options;

      var option =
        options["=" + value] ||
        options[this.pluralRules.select(value - this.offset)];

      return option || options.other;
    };

    function $$compiler$$PluralOffsetString(id, offset, numberFormat, string) {
      this.id = id;
      this.offset = offset;
      this.numberFormat = numberFormat;
      this.string = string;
    }

    $$compiler$$PluralOffsetString.prototype.format = function(value) {
      var number = this.numberFormat.format(value - this.offset);

      return this.string.replace(/(^|[^\\])#/g, "$1" + number).replace(/\\#/g, "#");
    };

    function $$compiler$$SelectFormat(id, options) {
      this.id = id;
      this.options = options;
    }

    $$compiler$$SelectFormat.prototype.getOption = function(value) {
      var options = this.options;
      return options[value] || options.other;
    };

    var intl$messageformat$parser$$default = (function() {
      "use strict";

      /*
       * Generated by PEG.js 0.9.0.
       *
       * http://pegjs.org/
       */

      function peg$subclass(child, parent) {
        function ctor() { this.constructor = child; }
        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
      }

      function peg$SyntaxError(message, expected, found, location) {
        this.message  = message;
        this.expected = expected;
        this.found    = found;
        this.location = location;
        this.name     = "SyntaxError";

        if (typeof Error.captureStackTrace === "function") {
          Error.captureStackTrace(this, peg$SyntaxError);
        }
      }

      peg$subclass(peg$SyntaxError, Error);

      function peg$parse(input) {
        var options = arguments.length > 1 ? arguments[1] : {},
            parser  = this,

            peg$FAILED = {},

            peg$startRuleFunctions = { start: peg$parsestart },
            peg$startRuleFunction  = peg$parsestart,

            peg$c0 = function(elements) {
                    return {
                        type    : 'messageFormatPattern',
                        elements: elements,
                        location: location()
                    };
                },
            peg$c1 = function(text) {
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
            peg$c2 = function(messageText) {
                    return {
                        type : 'messageTextElement',
                        value: messageText,
                        location: location()
                    };
                },
            peg$c3 = /^[^ \t\n\r,.+={}#]/,
            peg$c4 = { type: "class", value: "[^ \\t\\n\\r,.+={}#]", description: "[^ \\t\\n\\r,.+={}#]" },
            peg$c5 = "{",
            peg$c6 = { type: "literal", value: "{", description: "\"{\"" },
            peg$c7 = ",",
            peg$c8 = { type: "literal", value: ",", description: "\",\"" },
            peg$c9 = "}",
            peg$c10 = { type: "literal", value: "}", description: "\"}\"" },
            peg$c11 = function(id, format) {
                    return {
                        type  : 'argumentElement',
                        id    : id,
                        format: format && format[2],
                        location: location()
                    };
                },
            peg$c12 = "number",
            peg$c13 = { type: "literal", value: "number", description: "\"number\"" },
            peg$c14 = "date",
            peg$c15 = { type: "literal", value: "date", description: "\"date\"" },
            peg$c16 = "time",
            peg$c17 = { type: "literal", value: "time", description: "\"time\"" },
            peg$c18 = function(type, style) {
                    return {
                        type : type + 'Format',
                        style: style && style[2],
                        location: location()
                    };
                },
            peg$c19 = "plural",
            peg$c20 = { type: "literal", value: "plural", description: "\"plural\"" },
            peg$c21 = function(pluralStyle) {
                    return {
                        type   : pluralStyle.type,
                        ordinal: false,
                        offset : pluralStyle.offset || 0,
                        options: pluralStyle.options,
                        location: location()
                    };
                },
            peg$c22 = "selectordinal",
            peg$c23 = { type: "literal", value: "selectordinal", description: "\"selectordinal\"" },
            peg$c24 = function(pluralStyle) {
                    return {
                        type   : pluralStyle.type,
                        ordinal: true,
                        offset : pluralStyle.offset || 0,
                        options: pluralStyle.options,
                        location: location()
                    }
                },
            peg$c25 = "select",
            peg$c26 = { type: "literal", value: "select", description: "\"select\"" },
            peg$c27 = function(options) {
                    return {
                        type   : 'selectFormat',
                        options: options,
                        location: location()
                    };
                },
            peg$c28 = "=",
            peg$c29 = { type: "literal", value: "=", description: "\"=\"" },
            peg$c30 = function(selector, pattern) {
                    return {
                        type    : 'optionalFormatPattern',
                        selector: selector,
                        value   : pattern,
                        location: location()
                    };
                },
            peg$c31 = "offset:",
            peg$c32 = { type: "literal", value: "offset:", description: "\"offset:\"" },
            peg$c33 = function(number) {
                    return number;
                },
            peg$c34 = function(offset, options) {
                    return {
                        type   : 'pluralFormat',
                        offset : offset,
                        options: options,
                        location: location()
                    };
                },
            peg$c35 = { type: "other", description: "whitespace" },
            peg$c36 = /^[ \t\n\r]/,
            peg$c37 = { type: "class", value: "[ \\t\\n\\r]", description: "[ \\t\\n\\r]" },
            peg$c38 = { type: "other", description: "optionalWhitespace" },
            peg$c39 = /^[0-9]/,
            peg$c40 = { type: "class", value: "[0-9]", description: "[0-9]" },
            peg$c41 = /^[0-9a-f]/i,
            peg$c42 = { type: "class", value: "[0-9a-f]i", description: "[0-9a-f]i" },
            peg$c43 = "0",
            peg$c44 = { type: "literal", value: "0", description: "\"0\"" },
            peg$c45 = /^[1-9]/,
            peg$c46 = { type: "class", value: "[1-9]", description: "[1-9]" },
            peg$c47 = function(digits) {
                return parseInt(digits, 10);
            },
            peg$c48 = /^[^{}\\\0-\x1F \t\n\r]/,
            peg$c49 = { type: "class", value: "[^{}\\\\\\0-\\x1F\\x7f \\t\\n\\r]", description: "[^{}\\\\\\0-\\x1F\\x7f \\t\\n\\r]" },
            peg$c50 = "\\\\",
            peg$c51 = { type: "literal", value: "\\\\", description: "\"\\\\\\\\\"" },
            peg$c52 = function() { return '\\'; },
            peg$c53 = "\\#",
            peg$c54 = { type: "literal", value: "\\#", description: "\"\\\\#\"" },
            peg$c55 = function() { return '\\#'; },
            peg$c56 = "\\{",
            peg$c57 = { type: "literal", value: "\\{", description: "\"\\\\{\"" },
            peg$c58 = function() { return '\u007B'; },
            peg$c59 = "\\}",
            peg$c60 = { type: "literal", value: "\\}", description: "\"\\\\}\"" },
            peg$c61 = function() { return '\u007D'; },
            peg$c62 = "\\u",
            peg$c63 = { type: "literal", value: "\\u", description: "\"\\\\u\"" },
            peg$c64 = function(digits) {
                    return String.fromCharCode(parseInt(digits, 16));
                },
            peg$c65 = function(chars) { return chars.join(''); },

            peg$currPos          = 0,
            peg$savedPos         = 0,
            peg$posDetailsCache  = [{ line: 1, column: 1, seenCR: false }],
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
          return input.substring(peg$savedPos, peg$currPos);
        }

        function location() {
          return peg$computeLocation(peg$savedPos, peg$currPos);
        }

        function expected(description) {
          throw peg$buildException(
            null,
            [{ type: "other", description: description }],
            input.substring(peg$savedPos, peg$currPos),
            peg$computeLocation(peg$savedPos, peg$currPos)
          );
        }

        function error(message) {
          throw peg$buildException(
            message,
            null,
            input.substring(peg$savedPos, peg$currPos),
            peg$computeLocation(peg$savedPos, peg$currPos)
          );
        }

        function peg$computePosDetails(pos) {
          var details = peg$posDetailsCache[pos],
              p, ch;

          if (details) {
            return details;
          } else {
            p = pos - 1;
            while (!peg$posDetailsCache[p]) {
              p--;
            }

            details = peg$posDetailsCache[p];
            details = {
              line:   details.line,
              column: details.column,
              seenCR: details.seenCR
            };

            while (p < pos) {
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

              p++;
            }

            peg$posDetailsCache[pos] = details;
            return details;
          }
        }

        function peg$computeLocation(startPos, endPos) {
          var startPosDetails = peg$computePosDetails(startPos),
              endPosDetails   = peg$computePosDetails(endPos);

          return {
            start: {
              offset: startPos,
              line:   startPosDetails.line,
              column: startPosDetails.column
            },
            end: {
              offset: endPos,
              line:   endPosDetails.line,
              column: endPosDetails.column
            }
          };
        }

        function peg$fail(expected) {
          if (peg$currPos < peg$maxFailPos) { return; }

          if (peg$currPos > peg$maxFailPos) {
            peg$maxFailPos = peg$currPos;
            peg$maxFailExpected = [];
          }

          peg$maxFailExpected.push(expected);
        }

        function peg$buildException(message, expected, found, location) {
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
                .replace(/[\u0100-\u0FFF]/g,         function(ch) { return '\\u0' + hex(ch); })
                .replace(/[\u1000-\uFFFF]/g,         function(ch) { return '\\u'  + hex(ch); });
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

          if (expected !== null) {
            cleanupExpected(expected);
          }

          return new peg$SyntaxError(
            message !== null ? message : buildMessage(expected, found),
            expected,
            found,
            location
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
            peg$savedPos = s0;
            s1 = peg$c0(s1);
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
                s2 = peg$FAILED;
              }
            } else {
              peg$currPos = s2;
              s2 = peg$FAILED;
            }
          } else {
            peg$currPos = s2;
            s2 = peg$FAILED;
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
                    s2 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s2;
                  s2 = peg$FAILED;
                }
              } else {
                peg$currPos = s2;
                s2 = peg$FAILED;
              }
            }
          } else {
            s1 = peg$FAILED;
          }
          if (s1 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c1(s1);
          }
          s0 = s1;
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            s1 = peg$parsews();
            if (s1 !== peg$FAILED) {
              s0 = input.substring(s0, peg$currPos);
            } else {
              s0 = s1;
            }
          }

          return s0;
        }

        function peg$parsemessageTextElement() {
          var s0, s1;

          s0 = peg$currPos;
          s1 = peg$parsemessageText();
          if (s1 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c2(s1);
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
            if (peg$c3.test(input.charAt(peg$currPos))) {
              s2 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c4); }
            }
            if (s2 !== peg$FAILED) {
              while (s2 !== peg$FAILED) {
                s1.push(s2);
                if (peg$c3.test(input.charAt(peg$currPos))) {
                  s2 = input.charAt(peg$currPos);
                  peg$currPos++;
                } else {
                  s2 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c4); }
                }
              }
            } else {
              s1 = peg$FAILED;
            }
            if (s1 !== peg$FAILED) {
              s0 = input.substring(s0, peg$currPos);
            } else {
              s0 = s1;
            }
          }

          return s0;
        }

        function peg$parseargumentElement() {
          var s0, s1, s2, s3, s4, s5, s6, s7, s8;

          s0 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 123) {
            s1 = peg$c5;
            peg$currPos++;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c6); }
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
                    s6 = peg$c7;
                    peg$currPos++;
                  } else {
                    s6 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c8); }
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
                        s5 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s5;
                      s5 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s5;
                    s5 = peg$FAILED;
                  }
                  if (s5 === peg$FAILED) {
                    s5 = null;
                  }
                  if (s5 !== peg$FAILED) {
                    s6 = peg$parse_();
                    if (s6 !== peg$FAILED) {
                      if (input.charCodeAt(peg$currPos) === 125) {
                        s7 = peg$c9;
                        peg$currPos++;
                      } else {
                        s7 = peg$FAILED;
                        if (peg$silentFails === 0) { peg$fail(peg$c10); }
                      }
                      if (s7 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s1 = peg$c11(s3, s5);
                        s0 = s1;
                      } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }

          return s0;
        }

        function peg$parseelementFormat() {
          var s0;

          s0 = peg$parsesimpleFormat();
          if (s0 === peg$FAILED) {
            s0 = peg$parsepluralFormat();
            if (s0 === peg$FAILED) {
              s0 = peg$parseselectOrdinalFormat();
              if (s0 === peg$FAILED) {
                s0 = peg$parseselectFormat();
              }
            }
          }

          return s0;
        }

        function peg$parsesimpleFormat() {
          var s0, s1, s2, s3, s4, s5, s6;

          s0 = peg$currPos;
          if (input.substr(peg$currPos, 6) === peg$c12) {
            s1 = peg$c12;
            peg$currPos += 6;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c13); }
          }
          if (s1 === peg$FAILED) {
            if (input.substr(peg$currPos, 4) === peg$c14) {
              s1 = peg$c14;
              peg$currPos += 4;
            } else {
              s1 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c15); }
            }
            if (s1 === peg$FAILED) {
              if (input.substr(peg$currPos, 4) === peg$c16) {
                s1 = peg$c16;
                peg$currPos += 4;
              } else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c17); }
              }
            }
          }
          if (s1 !== peg$FAILED) {
            s2 = peg$parse_();
            if (s2 !== peg$FAILED) {
              s3 = peg$currPos;
              if (input.charCodeAt(peg$currPos) === 44) {
                s4 = peg$c7;
                peg$currPos++;
              } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c8); }
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
                    s3 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s3;
                  s3 = peg$FAILED;
                }
              } else {
                peg$currPos = s3;
                s3 = peg$FAILED;
              }
              if (s3 === peg$FAILED) {
                s3 = null;
              }
              if (s3 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c18(s1, s3);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }

          return s0;
        }

        function peg$parsepluralFormat() {
          var s0, s1, s2, s3, s4, s5;

          s0 = peg$currPos;
          if (input.substr(peg$currPos, 6) === peg$c19) {
            s1 = peg$c19;
            peg$currPos += 6;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c20); }
          }
          if (s1 !== peg$FAILED) {
            s2 = peg$parse_();
            if (s2 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 44) {
                s3 = peg$c7;
                peg$currPos++;
              } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c8); }
              }
              if (s3 !== peg$FAILED) {
                s4 = peg$parse_();
                if (s4 !== peg$FAILED) {
                  s5 = peg$parsepluralStyle();
                  if (s5 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c21(s5);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }

          return s0;
        }

        function peg$parseselectOrdinalFormat() {
          var s0, s1, s2, s3, s4, s5;

          s0 = peg$currPos;
          if (input.substr(peg$currPos, 13) === peg$c22) {
            s1 = peg$c22;
            peg$currPos += 13;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c23); }
          }
          if (s1 !== peg$FAILED) {
            s2 = peg$parse_();
            if (s2 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 44) {
                s3 = peg$c7;
                peg$currPos++;
              } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c8); }
              }
              if (s3 !== peg$FAILED) {
                s4 = peg$parse_();
                if (s4 !== peg$FAILED) {
                  s5 = peg$parsepluralStyle();
                  if (s5 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c24(s5);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
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
                s3 = peg$c7;
                peg$currPos++;
              } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c8); }
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
                    s5 = peg$FAILED;
                  }
                  if (s5 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c27(s5);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
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
              s1 = peg$FAILED;
            }
          } else {
            peg$currPos = s1;
            s1 = peg$FAILED;
          }
          if (s1 !== peg$FAILED) {
            s0 = input.substring(s0, peg$currPos);
          } else {
            s0 = s1;
          }
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
                  s4 = peg$c5;
                  peg$currPos++;
                } else {
                  s4 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c6); }
                }
                if (s4 !== peg$FAILED) {
                  s5 = peg$parse_();
                  if (s5 !== peg$FAILED) {
                    s6 = peg$parsemessageFormatPattern();
                    if (s6 !== peg$FAILED) {
                      s7 = peg$parse_();
                      if (s7 !== peg$FAILED) {
                        if (input.charCodeAt(peg$currPos) === 125) {
                          s8 = peg$c9;
                          peg$currPos++;
                        } else {
                          s8 = peg$FAILED;
                          if (peg$silentFails === 0) { peg$fail(peg$c10); }
                        }
                        if (s8 !== peg$FAILED) {
                          peg$savedPos = s0;
                          s1 = peg$c30(s2, s6);
                          s0 = s1;
                        } else {
                          peg$currPos = s0;
                          s0 = peg$FAILED;
                        }
                      } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
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
                peg$savedPos = s0;
                s1 = peg$c33(s3);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }

          return s0;
        }

        function peg$parsepluralStyle() {
          var s0, s1, s2, s3, s4;

          s0 = peg$currPos;
          s1 = peg$parseoffset();
          if (s1 === peg$FAILED) {
            s1 = null;
          }
          if (s1 !== peg$FAILED) {
            s2 = peg$parse_();
            if (s2 !== peg$FAILED) {
              s3 = [];
              s4 = peg$parseoptionalFormatPattern();
              if (s4 !== peg$FAILED) {
                while (s4 !== peg$FAILED) {
                  s3.push(s4);
                  s4 = peg$parseoptionalFormatPattern();
                }
              } else {
                s3 = peg$FAILED;
              }
              if (s3 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c34(s1, s3);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }

          return s0;
        }

        function peg$parsews() {
          var s0, s1;

          peg$silentFails++;
          s0 = [];
          if (peg$c36.test(input.charAt(peg$currPos))) {
            s1 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c37); }
          }
          if (s1 !== peg$FAILED) {
            while (s1 !== peg$FAILED) {
              s0.push(s1);
              if (peg$c36.test(input.charAt(peg$currPos))) {
                s1 = input.charAt(peg$currPos);
                peg$currPos++;
              } else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c37); }
              }
            }
          } else {
            s0 = peg$FAILED;
          }
          peg$silentFails--;
          if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c35); }
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
            s0 = input.substring(s0, peg$currPos);
          } else {
            s0 = s1;
          }
          peg$silentFails--;
          if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c38); }
          }

          return s0;
        }

        function peg$parsedigit() {
          var s0;

          if (peg$c39.test(input.charAt(peg$currPos))) {
            s0 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c40); }
          }

          return s0;
        }

        function peg$parsehexDigit() {
          var s0;

          if (peg$c41.test(input.charAt(peg$currPos))) {
            s0 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c42); }
          }

          return s0;
        }

        function peg$parsenumber() {
          var s0, s1, s2, s3, s4, s5;

          s0 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 48) {
            s1 = peg$c43;
            peg$currPos++;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c44); }
          }
          if (s1 === peg$FAILED) {
            s1 = peg$currPos;
            s2 = peg$currPos;
            if (peg$c45.test(input.charAt(peg$currPos))) {
              s3 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c46); }
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
                s2 = peg$FAILED;
              }
            } else {
              peg$currPos = s2;
              s2 = peg$FAILED;
            }
            if (s2 !== peg$FAILED) {
              s1 = input.substring(s1, peg$currPos);
            } else {
              s1 = s2;
            }
          }
          if (s1 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c47(s1);
          }
          s0 = s1;

          return s0;
        }

        function peg$parsechar() {
          var s0, s1, s2, s3, s4, s5, s6, s7;

          if (peg$c48.test(input.charAt(peg$currPos))) {
            s0 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c49); }
          }
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            if (input.substr(peg$currPos, 2) === peg$c50) {
              s1 = peg$c50;
              peg$currPos += 2;
            } else {
              s1 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c51); }
            }
            if (s1 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c52();
            }
            s0 = s1;
            if (s0 === peg$FAILED) {
              s0 = peg$currPos;
              if (input.substr(peg$currPos, 2) === peg$c53) {
                s1 = peg$c53;
                peg$currPos += 2;
              } else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c54); }
              }
              if (s1 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c55();
              }
              s0 = s1;
              if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                if (input.substr(peg$currPos, 2) === peg$c56) {
                  s1 = peg$c56;
                  peg$currPos += 2;
                } else {
                  s1 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c57); }
                }
                if (s1 !== peg$FAILED) {
                  peg$savedPos = s0;
                  s1 = peg$c58();
                }
                s0 = s1;
                if (s0 === peg$FAILED) {
                  s0 = peg$currPos;
                  if (input.substr(peg$currPos, 2) === peg$c59) {
                    s1 = peg$c59;
                    peg$currPos += 2;
                  } else {
                    s1 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c60); }
                  }
                  if (s1 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c61();
                  }
                  s0 = s1;
                  if (s0 === peg$FAILED) {
                    s0 = peg$currPos;
                    if (input.substr(peg$currPos, 2) === peg$c62) {
                      s1 = peg$c62;
                      peg$currPos += 2;
                    } else {
                      s1 = peg$FAILED;
                      if (peg$silentFails === 0) { peg$fail(peg$c63); }
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
                              s3 = peg$FAILED;
                            }
                          } else {
                            peg$currPos = s3;
                            s3 = peg$FAILED;
                          }
                        } else {
                          peg$currPos = s3;
                          s3 = peg$FAILED;
                        }
                      } else {
                        peg$currPos = s3;
                        s3 = peg$FAILED;
                      }
                      if (s3 !== peg$FAILED) {
                        s2 = input.substring(s2, peg$currPos);
                      } else {
                        s2 = s3;
                      }
                      if (s2 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s1 = peg$c64(s2);
                        s0 = s1;
                      } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
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
            s1 = peg$FAILED;
          }
          if (s1 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c65(s1);
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

          throw peg$buildException(
            null,
            peg$maxFailExpected,
            peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) : null,
            peg$maxFailPos < input.length
              ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1)
              : peg$computeLocation(peg$maxFailPos, peg$maxFailPos)
          );
        }
      }

      return {
        SyntaxError: peg$SyntaxError,
        parse:       peg$parse
      };
    })();

    var $$core$$default = $$core$$MessageFormat;

    // -- MessageFormat --------------------------------------------------------

    function $$core$$MessageFormat(message, locales, formats) {
      // Parse string messages into an AST.
      var ast =
        typeof message === "string" ? $$core$$MessageFormat.__parse(message) : message;

      if (!(ast && ast.type === "messageFormatPattern")) {
        throw new TypeError("A message must be provided as a String or AST.");
      }

      // Creates a new object with the specified `formats` merged with the default
      // formats.
      formats = this._mergeFormats($$core$$MessageFormat.formats, formats);

      // Defined first because it's used to build the format pattern.
      $$es5$$defineProperty(this, "_locale", { value: this._resolveLocale(locales) });

      // Compile the `ast` to a pattern that is highly optimized for repeated
      // `format()` invocations. **Note:** This passes the `locales` set provided
      // to the constructor instead of just the resolved locale.
      var pattern = this._compilePattern(ast, locales, formats);

      // "Bind" `format()` method to `this` so it can be passed by reference like
      // the other `Intl` APIs.
      var messageFormat = this;
      this.format = function(values) {
        try {
          return messageFormat._format(pattern, values);
        } catch (e) {
          if (e.variableId) {
            throw new Error(
              "The intl string context variable '" +
                e.variableId +
                "'" +
                " was not provided to the string '" +
                message +
                "'"
            );
          } else {
            throw e;
          }
        }
      };
    }

    // Default format options used as the prototype of the `formats` provided to the
    // constructor. These are used when constructing the internal Intl.NumberFormat
    // and Intl.DateTimeFormat instances.
    $$es5$$defineProperty($$core$$MessageFormat, "formats", {
      enumerable: true,

      value: {
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
      }
    });

    // Define internal private properties for dealing with locale data.
    $$es5$$defineProperty($$core$$MessageFormat, "__localeData__", { value: $$es5$$objCreate(null) });
    $$es5$$defineProperty($$core$$MessageFormat, "__addLocaleData", {
      value: function(data) {
        if (!(data && data.locale)) {
          throw new Error(
            "Locale data provided to IntlMessageFormat is missing a " +
              "`locale` property"
          );
        }

        $$core$$MessageFormat.__localeData__[data.locale.toLowerCase()] = data;
      }
    });

    // Defines `__parse()` static method as an exposed private.
    $$es5$$defineProperty($$core$$MessageFormat, "__parse", { value: intl$messageformat$parser$$default.parse });

    // Define public `defaultLocale` property which defaults to English, but can be
    // set by the developer.
    $$es5$$defineProperty($$core$$MessageFormat, "defaultLocale", {
      enumerable: true,
      writable: true,
      value: undefined
    });

    $$core$$MessageFormat.prototype.resolvedOptions = function() {
      // TODO: Provide anything else?
      return {
        locale: this._locale
      };
    };

    $$core$$MessageFormat.prototype._compilePattern = function(ast, locales, formats) {
      var compiler = new $$compiler$$default(locales, formats);
      return compiler.compile(ast);
    };

    $$core$$MessageFormat.prototype._format = function(pattern, values) {
      var result = "",
        i,
        len,
        part,
        id,
        value,
        err;

      for (i = 0, len = pattern.length; i < len; i += 1) {
        part = pattern[i];

        // Exist early for string parts.
        if (typeof part === "string") {
          result += part;
          continue;
        }

        id = part.id;

        // Enforce that all required values are provided by the caller.
        if (!(values && $$utils$$hop.call(values, id))) {
          err = new Error("A value must be provided for: " + id);
          err.variableId = id;
          throw err;
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

    $$core$$MessageFormat.prototype._mergeFormats = function(defaults, formats) {
      var mergedFormats = {},
        type,
        mergedType;

      for (type in defaults) {
        if (!$$utils$$hop.call(defaults, type)) {
          continue;
        }

        mergedFormats[type] = mergedType = $$es5$$objCreate(defaults[type]);

        if (formats && $$utils$$hop.call(formats, type)) {
          $$utils$$extend(mergedType, formats[type]);
        }
      }

      return mergedFormats;
    };

    $$core$$MessageFormat.prototype._resolveLocale = function(locales) {
      if (typeof locales === "string") {
        locales = [locales];
      }

      // Create a copy of the array so we can push on the default locale.
      locales = (locales || []).concat($$core$$MessageFormat.defaultLocale);

      var localeData = $$core$$MessageFormat.__localeData__;
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
      throw new Error(
        "No locale data has been added to IntlMessageFormat for: " +
          locales.join(", ") +
          ", or the default locale: " +
          defaultLocale
      );
    };
    var $$en$$default = {"locale":"en"};

    $$core$$default.__addLocaleData($$en$$default);
    $$core$$default.defaultLocale = "en";

    var src$main$$default = $$core$$default;
    this['IntlMessageFormat'] = src$main$$default;
}).call(this);

//
IntlMessageFormat.__addLocaleData({"locale":"af"});
IntlMessageFormat.__addLocaleData({"locale":"af-NA","parentLocale":"af"});

IntlMessageFormat.__addLocaleData({"locale":"agq"});

IntlMessageFormat.__addLocaleData({"locale":"ak"});

IntlMessageFormat.__addLocaleData({"locale":"am"});

IntlMessageFormat.__addLocaleData({"locale":"ar"});
IntlMessageFormat.__addLocaleData({"locale":"ar-AE","parentLocale":"ar"});
IntlMessageFormat.__addLocaleData({"locale":"ar-BH","parentLocale":"ar"});
IntlMessageFormat.__addLocaleData({"locale":"ar-DJ","parentLocale":"ar"});
IntlMessageFormat.__addLocaleData({"locale":"ar-DZ","parentLocale":"ar"});
IntlMessageFormat.__addLocaleData({"locale":"ar-EG","parentLocale":"ar"});
IntlMessageFormat.__addLocaleData({"locale":"ar-EH","parentLocale":"ar"});
IntlMessageFormat.__addLocaleData({"locale":"ar-ER","parentLocale":"ar"});
IntlMessageFormat.__addLocaleData({"locale":"ar-IL","parentLocale":"ar"});
IntlMessageFormat.__addLocaleData({"locale":"ar-IQ","parentLocale":"ar"});
IntlMessageFormat.__addLocaleData({"locale":"ar-JO","parentLocale":"ar"});
IntlMessageFormat.__addLocaleData({"locale":"ar-KM","parentLocale":"ar"});
IntlMessageFormat.__addLocaleData({"locale":"ar-KW","parentLocale":"ar"});
IntlMessageFormat.__addLocaleData({"locale":"ar-LB","parentLocale":"ar"});
IntlMessageFormat.__addLocaleData({"locale":"ar-LY","parentLocale":"ar"});
IntlMessageFormat.__addLocaleData({"locale":"ar-MA","parentLocale":"ar"});
IntlMessageFormat.__addLocaleData({"locale":"ar-MR","parentLocale":"ar"});
IntlMessageFormat.__addLocaleData({"locale":"ar-OM","parentLocale":"ar"});
IntlMessageFormat.__addLocaleData({"locale":"ar-PS","parentLocale":"ar"});
IntlMessageFormat.__addLocaleData({"locale":"ar-QA","parentLocale":"ar"});
IntlMessageFormat.__addLocaleData({"locale":"ar-SA","parentLocale":"ar"});
IntlMessageFormat.__addLocaleData({"locale":"ar-SD","parentLocale":"ar"});
IntlMessageFormat.__addLocaleData({"locale":"ar-SO","parentLocale":"ar"});
IntlMessageFormat.__addLocaleData({"locale":"ar-SS","parentLocale":"ar"});
IntlMessageFormat.__addLocaleData({"locale":"ar-SY","parentLocale":"ar"});
IntlMessageFormat.__addLocaleData({"locale":"ar-TD","parentLocale":"ar"});
IntlMessageFormat.__addLocaleData({"locale":"ar-TN","parentLocale":"ar"});
IntlMessageFormat.__addLocaleData({"locale":"ar-YE","parentLocale":"ar"});

IntlMessageFormat.__addLocaleData({"locale":"as"});

IntlMessageFormat.__addLocaleData({"locale":"asa"});

IntlMessageFormat.__addLocaleData({"locale":"ast"});

IntlMessageFormat.__addLocaleData({"locale":"az"});
IntlMessageFormat.__addLocaleData({"locale":"az-Arab"});
IntlMessageFormat.__addLocaleData({"locale":"az-Cyrl"});
IntlMessageFormat.__addLocaleData({"locale":"az-Latn","parentLocale":"az"});

IntlMessageFormat.__addLocaleData({"locale":"bas"});

IntlMessageFormat.__addLocaleData({"locale":"be"});

IntlMessageFormat.__addLocaleData({"locale":"bem"});

IntlMessageFormat.__addLocaleData({"locale":"bez"});

IntlMessageFormat.__addLocaleData({"locale":"bg"});

IntlMessageFormat.__addLocaleData({"locale":"bh"});

IntlMessageFormat.__addLocaleData({"locale":"bm"});
IntlMessageFormat.__addLocaleData({"locale":"bm-Nkoo"});

IntlMessageFormat.__addLocaleData({"locale":"bn"});
IntlMessageFormat.__addLocaleData({"locale":"bn-IN","parentLocale":"bn"});

IntlMessageFormat.__addLocaleData({"locale":"bo"});
IntlMessageFormat.__addLocaleData({"locale":"bo-IN","parentLocale":"bo"});

IntlMessageFormat.__addLocaleData({"locale":"br"});

IntlMessageFormat.__addLocaleData({"locale":"brx"});

IntlMessageFormat.__addLocaleData({"locale":"bs"});
IntlMessageFormat.__addLocaleData({"locale":"bs-Cyrl"});
IntlMessageFormat.__addLocaleData({"locale":"bs-Latn","parentLocale":"bs"});

IntlMessageFormat.__addLocaleData({"locale":"ca"});
IntlMessageFormat.__addLocaleData({"locale":"ca-AD","parentLocale":"ca"});
IntlMessageFormat.__addLocaleData({"locale":"ca-ES-VALENCIA","parentLocale":"ca-ES"});
IntlMessageFormat.__addLocaleData({"locale":"ca-ES","parentLocale":"ca"});
IntlMessageFormat.__addLocaleData({"locale":"ca-FR","parentLocale":"ca"});
IntlMessageFormat.__addLocaleData({"locale":"ca-IT","parentLocale":"ca"});

IntlMessageFormat.__addLocaleData({"locale":"ce"});

IntlMessageFormat.__addLocaleData({"locale":"cgg"});

IntlMessageFormat.__addLocaleData({"locale":"chr"});

IntlMessageFormat.__addLocaleData({"locale":"ckb"});
IntlMessageFormat.__addLocaleData({"locale":"ckb-IR","parentLocale":"ckb"});

IntlMessageFormat.__addLocaleData({"locale":"cs"});

IntlMessageFormat.__addLocaleData({"locale":"cu"});

IntlMessageFormat.__addLocaleData({"locale":"cy"});

IntlMessageFormat.__addLocaleData({"locale":"da"});
IntlMessageFormat.__addLocaleData({"locale":"da-GL","parentLocale":"da"});

IntlMessageFormat.__addLocaleData({"locale":"dav"});

IntlMessageFormat.__addLocaleData({"locale":"de"});
IntlMessageFormat.__addLocaleData({"locale":"de-AT","parentLocale":"de"});
IntlMessageFormat.__addLocaleData({"locale":"de-BE","parentLocale":"de"});
IntlMessageFormat.__addLocaleData({"locale":"de-CH","parentLocale":"de"});
IntlMessageFormat.__addLocaleData({"locale":"de-LI","parentLocale":"de"});
IntlMessageFormat.__addLocaleData({"locale":"de-LU","parentLocale":"de"});

IntlMessageFormat.__addLocaleData({"locale":"dje"});

IntlMessageFormat.__addLocaleData({"locale":"dsb"});

IntlMessageFormat.__addLocaleData({"locale":"dua"});

IntlMessageFormat.__addLocaleData({"locale":"dv"});

IntlMessageFormat.__addLocaleData({"locale":"dyo"});

IntlMessageFormat.__addLocaleData({"locale":"dz"});

IntlMessageFormat.__addLocaleData({"locale":"ebu"});

IntlMessageFormat.__addLocaleData({"locale":"ee"});
IntlMessageFormat.__addLocaleData({"locale":"ee-TG","parentLocale":"ee"});

IntlMessageFormat.__addLocaleData({"locale":"el"});
IntlMessageFormat.__addLocaleData({"locale":"el-CY","parentLocale":"el"});

IntlMessageFormat.__addLocaleData({"locale":"en"});
IntlMessageFormat.__addLocaleData({"locale":"en-001","parentLocale":"en"});
IntlMessageFormat.__addLocaleData({"locale":"en-150","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-AG","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-AI","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-AS","parentLocale":"en"});
IntlMessageFormat.__addLocaleData({"locale":"en-AT","parentLocale":"en-150"});
IntlMessageFormat.__addLocaleData({"locale":"en-AU","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-BB","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-BE","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-BI","parentLocale":"en"});
IntlMessageFormat.__addLocaleData({"locale":"en-BM","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-BS","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-BW","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-BZ","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-CA","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-CC","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-CH","parentLocale":"en-150"});
IntlMessageFormat.__addLocaleData({"locale":"en-CK","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-CM","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-CX","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-CY","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-DE","parentLocale":"en-150"});
IntlMessageFormat.__addLocaleData({"locale":"en-DG","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-DK","parentLocale":"en-150"});
IntlMessageFormat.__addLocaleData({"locale":"en-DM","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-Dsrt"});
IntlMessageFormat.__addLocaleData({"locale":"en-ER","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-FI","parentLocale":"en-150"});
IntlMessageFormat.__addLocaleData({"locale":"en-FJ","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-FK","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-FM","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-GB","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-GD","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-GG","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-GH","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-GI","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-GM","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-GU","parentLocale":"en"});
IntlMessageFormat.__addLocaleData({"locale":"en-GY","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-HK","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-IE","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-IL","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-IM","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-IN","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-IO","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-JE","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-JM","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-KE","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-KI","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-KN","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-KY","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-LC","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-LR","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-LS","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-MG","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-MH","parentLocale":"en"});
IntlMessageFormat.__addLocaleData({"locale":"en-MO","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-MP","parentLocale":"en"});
IntlMessageFormat.__addLocaleData({"locale":"en-MS","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-MT","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-MU","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-MW","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-MY","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-NA","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-NF","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-NG","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-NL","parentLocale":"en-150"});
IntlMessageFormat.__addLocaleData({"locale":"en-NR","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-NU","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-NZ","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-PG","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-PH","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-PK","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-PN","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-PR","parentLocale":"en"});
IntlMessageFormat.__addLocaleData({"locale":"en-PW","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-RW","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-SB","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-SC","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-SD","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-SE","parentLocale":"en-150"});
IntlMessageFormat.__addLocaleData({"locale":"en-SG","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-SH","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-SI","parentLocale":"en-150"});
IntlMessageFormat.__addLocaleData({"locale":"en-SL","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-SS","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-SX","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-SZ","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-Shaw"});
IntlMessageFormat.__addLocaleData({"locale":"en-TC","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-TK","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-TO","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-TT","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-TV","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-TZ","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-UG","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-UM","parentLocale":"en"});
IntlMessageFormat.__addLocaleData({"locale":"en-US","parentLocale":"en"});
IntlMessageFormat.__addLocaleData({"locale":"en-VC","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-VG","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-VI","parentLocale":"en"});
IntlMessageFormat.__addLocaleData({"locale":"en-VU","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-WS","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-ZA","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-ZM","parentLocale":"en-001"});
IntlMessageFormat.__addLocaleData({"locale":"en-ZW","parentLocale":"en-001"});

IntlMessageFormat.__addLocaleData({"locale":"eo"});

IntlMessageFormat.__addLocaleData({"locale":"es"});
IntlMessageFormat.__addLocaleData({"locale":"es-419","parentLocale":"es"});
IntlMessageFormat.__addLocaleData({"locale":"es-AR","parentLocale":"es-419"});
IntlMessageFormat.__addLocaleData({"locale":"es-BO","parentLocale":"es-419"});
IntlMessageFormat.__addLocaleData({"locale":"es-CL","parentLocale":"es-419"});
IntlMessageFormat.__addLocaleData({"locale":"es-CO","parentLocale":"es-419"});
IntlMessageFormat.__addLocaleData({"locale":"es-CR","parentLocale":"es-419"});
IntlMessageFormat.__addLocaleData({"locale":"es-CU","parentLocale":"es-419"});
IntlMessageFormat.__addLocaleData({"locale":"es-DO","parentLocale":"es-419"});
IntlMessageFormat.__addLocaleData({"locale":"es-EA","parentLocale":"es"});
IntlMessageFormat.__addLocaleData({"locale":"es-EC","parentLocale":"es-419"});
IntlMessageFormat.__addLocaleData({"locale":"es-GQ","parentLocale":"es"});
IntlMessageFormat.__addLocaleData({"locale":"es-GT","parentLocale":"es-419"});
IntlMessageFormat.__addLocaleData({"locale":"es-HN","parentLocale":"es-419"});
IntlMessageFormat.__addLocaleData({"locale":"es-IC","parentLocale":"es"});
IntlMessageFormat.__addLocaleData({"locale":"es-MX","parentLocale":"es-419"});
IntlMessageFormat.__addLocaleData({"locale":"es-NI","parentLocale":"es-419"});
IntlMessageFormat.__addLocaleData({"locale":"es-PA","parentLocale":"es-419"});
IntlMessageFormat.__addLocaleData({"locale":"es-PE","parentLocale":"es-419"});
IntlMessageFormat.__addLocaleData({"locale":"es-PH","parentLocale":"es"});
IntlMessageFormat.__addLocaleData({"locale":"es-PR","parentLocale":"es-419"});
IntlMessageFormat.__addLocaleData({"locale":"es-PY","parentLocale":"es-419"});
IntlMessageFormat.__addLocaleData({"locale":"es-SV","parentLocale":"es-419"});
IntlMessageFormat.__addLocaleData({"locale":"es-US","parentLocale":"es-419"});
IntlMessageFormat.__addLocaleData({"locale":"es-UY","parentLocale":"es-419"});
IntlMessageFormat.__addLocaleData({"locale":"es-VE","parentLocale":"es-419"});

IntlMessageFormat.__addLocaleData({"locale":"et"});

IntlMessageFormat.__addLocaleData({"locale":"eu"});

IntlMessageFormat.__addLocaleData({"locale":"ewo"});

IntlMessageFormat.__addLocaleData({"locale":"fa"});
IntlMessageFormat.__addLocaleData({"locale":"fa-AF","parentLocale":"fa"});

IntlMessageFormat.__addLocaleData({"locale":"ff"});
IntlMessageFormat.__addLocaleData({"locale":"ff-CM","parentLocale":"ff"});
IntlMessageFormat.__addLocaleData({"locale":"ff-GN","parentLocale":"ff"});
IntlMessageFormat.__addLocaleData({"locale":"ff-MR","parentLocale":"ff"});

IntlMessageFormat.__addLocaleData({"locale":"fi"});

IntlMessageFormat.__addLocaleData({"locale":"fil"});

IntlMessageFormat.__addLocaleData({"locale":"fo"});
IntlMessageFormat.__addLocaleData({"locale":"fo-DK","parentLocale":"fo"});

IntlMessageFormat.__addLocaleData({"locale":"fr"});
IntlMessageFormat.__addLocaleData({"locale":"fr-BE","parentLocale":"fr"});
IntlMessageFormat.__addLocaleData({"locale":"fr-BF","parentLocale":"fr"});
IntlMessageFormat.__addLocaleData({"locale":"fr-BI","parentLocale":"fr"});
IntlMessageFormat.__addLocaleData({"locale":"fr-BJ","parentLocale":"fr"});
IntlMessageFormat.__addLocaleData({"locale":"fr-BL","parentLocale":"fr"});
IntlMessageFormat.__addLocaleData({"locale":"fr-CA","parentLocale":"fr"});
IntlMessageFormat.__addLocaleData({"locale":"fr-CD","parentLocale":"fr"});
IntlMessageFormat.__addLocaleData({"locale":"fr-CF","parentLocale":"fr"});
IntlMessageFormat.__addLocaleData({"locale":"fr-CG","parentLocale":"fr"});
IntlMessageFormat.__addLocaleData({"locale":"fr-CH","parentLocale":"fr"});
IntlMessageFormat.__addLocaleData({"locale":"fr-CI","parentLocale":"fr"});
IntlMessageFormat.__addLocaleData({"locale":"fr-CM","parentLocale":"fr"});
IntlMessageFormat.__addLocaleData({"locale":"fr-DJ","parentLocale":"fr"});
IntlMessageFormat.__addLocaleData({"locale":"fr-DZ","parentLocale":"fr"});
IntlMessageFormat.__addLocaleData({"locale":"fr-GA","parentLocale":"fr"});
IntlMessageFormat.__addLocaleData({"locale":"fr-GF","parentLocale":"fr"});
IntlMessageFormat.__addLocaleData({"locale":"fr-GN","parentLocale":"fr"});
IntlMessageFormat.__addLocaleData({"locale":"fr-GP","parentLocale":"fr"});
IntlMessageFormat.__addLocaleData({"locale":"fr-GQ","parentLocale":"fr"});
IntlMessageFormat.__addLocaleData({"locale":"fr-HT","parentLocale":"fr"});
IntlMessageFormat.__addLocaleData({"locale":"fr-KM","parentLocale":"fr"});
IntlMessageFormat.__addLocaleData({"locale":"fr-LU","parentLocale":"fr"});
IntlMessageFormat.__addLocaleData({"locale":"fr-MA","parentLocale":"fr"});
IntlMessageFormat.__addLocaleData({"locale":"fr-MC","parentLocale":"fr"});
IntlMessageFormat.__addLocaleData({"locale":"fr-MF","parentLocale":"fr"});
IntlMessageFormat.__addLocaleData({"locale":"fr-MG","parentLocale":"fr"});
IntlMessageFormat.__addLocaleData({"locale":"fr-ML","parentLocale":"fr"});
IntlMessageFormat.__addLocaleData({"locale":"fr-MQ","parentLocale":"fr"});
IntlMessageFormat.__addLocaleData({"locale":"fr-MR","parentLocale":"fr"});
IntlMessageFormat.__addLocaleData({"locale":"fr-MU","parentLocale":"fr"});
IntlMessageFormat.__addLocaleData({"locale":"fr-NC","parentLocale":"fr"});
IntlMessageFormat.__addLocaleData({"locale":"fr-NE","parentLocale":"fr"});
IntlMessageFormat.__addLocaleData({"locale":"fr-PF","parentLocale":"fr"});
IntlMessageFormat.__addLocaleData({"locale":"fr-PM","parentLocale":"fr"});
IntlMessageFormat.__addLocaleData({"locale":"fr-RE","parentLocale":"fr"});
IntlMessageFormat.__addLocaleData({"locale":"fr-RW","parentLocale":"fr"});
IntlMessageFormat.__addLocaleData({"locale":"fr-SC","parentLocale":"fr"});
IntlMessageFormat.__addLocaleData({"locale":"fr-SN","parentLocale":"fr"});
IntlMessageFormat.__addLocaleData({"locale":"fr-SY","parentLocale":"fr"});
IntlMessageFormat.__addLocaleData({"locale":"fr-TD","parentLocale":"fr"});
IntlMessageFormat.__addLocaleData({"locale":"fr-TG","parentLocale":"fr"});
IntlMessageFormat.__addLocaleData({"locale":"fr-TN","parentLocale":"fr"});
IntlMessageFormat.__addLocaleData({"locale":"fr-VU","parentLocale":"fr"});
IntlMessageFormat.__addLocaleData({"locale":"fr-WF","parentLocale":"fr"});
IntlMessageFormat.__addLocaleData({"locale":"fr-YT","parentLocale":"fr"});

IntlMessageFormat.__addLocaleData({"locale":"fur"});

IntlMessageFormat.__addLocaleData({"locale":"fy"});

IntlMessageFormat.__addLocaleData({"locale":"ga"});

IntlMessageFormat.__addLocaleData({"locale":"gd"});

IntlMessageFormat.__addLocaleData({"locale":"gl"});

IntlMessageFormat.__addLocaleData({"locale":"gsw"});
IntlMessageFormat.__addLocaleData({"locale":"gsw-FR","parentLocale":"gsw"});
IntlMessageFormat.__addLocaleData({"locale":"gsw-LI","parentLocale":"gsw"});

IntlMessageFormat.__addLocaleData({"locale":"gu"});

IntlMessageFormat.__addLocaleData({"locale":"guw"});

IntlMessageFormat.__addLocaleData({"locale":"guz"});

IntlMessageFormat.__addLocaleData({"locale":"gv"});

IntlMessageFormat.__addLocaleData({"locale":"ha"});
IntlMessageFormat.__addLocaleData({"locale":"ha-Arab"});
IntlMessageFormat.__addLocaleData({"locale":"ha-GH","parentLocale":"ha"});
IntlMessageFormat.__addLocaleData({"locale":"ha-NE","parentLocale":"ha"});

IntlMessageFormat.__addLocaleData({"locale":"haw"});

IntlMessageFormat.__addLocaleData({"locale":"he"});

IntlMessageFormat.__addLocaleData({"locale":"hi"});

IntlMessageFormat.__addLocaleData({"locale":"hr"});
IntlMessageFormat.__addLocaleData({"locale":"hr-BA","parentLocale":"hr"});

IntlMessageFormat.__addLocaleData({"locale":"hsb"});

IntlMessageFormat.__addLocaleData({"locale":"hu"});

IntlMessageFormat.__addLocaleData({"locale":"hy"});

IntlMessageFormat.__addLocaleData({"locale":"id"});

IntlMessageFormat.__addLocaleData({"locale":"ig"});

IntlMessageFormat.__addLocaleData({"locale":"ii"});

IntlMessageFormat.__addLocaleData({"locale":"in"});

IntlMessageFormat.__addLocaleData({"locale":"is"});

IntlMessageFormat.__addLocaleData({"locale":"it"});
IntlMessageFormat.__addLocaleData({"locale":"it-CH","parentLocale":"it"});
IntlMessageFormat.__addLocaleData({"locale":"it-SM","parentLocale":"it"});

IntlMessageFormat.__addLocaleData({"locale":"iu"});
IntlMessageFormat.__addLocaleData({"locale":"iu-Latn"});

IntlMessageFormat.__addLocaleData({"locale":"iw"});

IntlMessageFormat.__addLocaleData({"locale":"ja"});

IntlMessageFormat.__addLocaleData({"locale":"jbo"});

IntlMessageFormat.__addLocaleData({"locale":"jgo"});

IntlMessageFormat.__addLocaleData({"locale":"ji"});

IntlMessageFormat.__addLocaleData({"locale":"jmc"});

IntlMessageFormat.__addLocaleData({"locale":"jv"});

IntlMessageFormat.__addLocaleData({"locale":"jw"});

IntlMessageFormat.__addLocaleData({"locale":"ka"});

IntlMessageFormat.__addLocaleData({"locale":"kab"});

IntlMessageFormat.__addLocaleData({"locale":"kaj"});

IntlMessageFormat.__addLocaleData({"locale":"kam"});

IntlMessageFormat.__addLocaleData({"locale":"kcg"});

IntlMessageFormat.__addLocaleData({"locale":"kde"});

IntlMessageFormat.__addLocaleData({"locale":"kea"});

IntlMessageFormat.__addLocaleData({"locale":"khq"});

IntlMessageFormat.__addLocaleData({"locale":"ki"});

IntlMessageFormat.__addLocaleData({"locale":"kk"});

IntlMessageFormat.__addLocaleData({"locale":"kkj"});

IntlMessageFormat.__addLocaleData({"locale":"kl"});

IntlMessageFormat.__addLocaleData({"locale":"kln"});

IntlMessageFormat.__addLocaleData({"locale":"km"});

IntlMessageFormat.__addLocaleData({"locale":"kn"});

IntlMessageFormat.__addLocaleData({"locale":"ko"});
IntlMessageFormat.__addLocaleData({"locale":"ko-KP","parentLocale":"ko"});

IntlMessageFormat.__addLocaleData({"locale":"kok"});

IntlMessageFormat.__addLocaleData({"locale":"ks"});

IntlMessageFormat.__addLocaleData({"locale":"ksb"});

IntlMessageFormat.__addLocaleData({"locale":"ksf"});

IntlMessageFormat.__addLocaleData({"locale":"ksh"});

IntlMessageFormat.__addLocaleData({"locale":"ku"});

IntlMessageFormat.__addLocaleData({"locale":"kw"});

IntlMessageFormat.__addLocaleData({"locale":"ky"});

IntlMessageFormat.__addLocaleData({"locale":"lag"});

IntlMessageFormat.__addLocaleData({"locale":"lb"});

IntlMessageFormat.__addLocaleData({"locale":"lg"});

IntlMessageFormat.__addLocaleData({"locale":"lkt"});

IntlMessageFormat.__addLocaleData({"locale":"ln"});
IntlMessageFormat.__addLocaleData({"locale":"ln-AO","parentLocale":"ln"});
IntlMessageFormat.__addLocaleData({"locale":"ln-CF","parentLocale":"ln"});
IntlMessageFormat.__addLocaleData({"locale":"ln-CG","parentLocale":"ln"});

IntlMessageFormat.__addLocaleData({"locale":"lo"});

IntlMessageFormat.__addLocaleData({"locale":"lrc"});
IntlMessageFormat.__addLocaleData({"locale":"lrc-IQ","parentLocale":"lrc"});

IntlMessageFormat.__addLocaleData({"locale":"lt"});

IntlMessageFormat.__addLocaleData({"locale":"lu"});

IntlMessageFormat.__addLocaleData({"locale":"luo"});

IntlMessageFormat.__addLocaleData({"locale":"luy"});

IntlMessageFormat.__addLocaleData({"locale":"lv"});

IntlMessageFormat.__addLocaleData({"locale":"mas"});
IntlMessageFormat.__addLocaleData({"locale":"mas-TZ","parentLocale":"mas"});

IntlMessageFormat.__addLocaleData({"locale":"mer"});

IntlMessageFormat.__addLocaleData({"locale":"mfe"});

IntlMessageFormat.__addLocaleData({"locale":"mg"});

IntlMessageFormat.__addLocaleData({"locale":"mgh"});

IntlMessageFormat.__addLocaleData({"locale":"mgo"});

IntlMessageFormat.__addLocaleData({"locale":"mk"});

IntlMessageFormat.__addLocaleData({"locale":"ml"});

IntlMessageFormat.__addLocaleData({"locale":"mn"});
IntlMessageFormat.__addLocaleData({"locale":"mn-Mong"});

IntlMessageFormat.__addLocaleData({"locale":"mo"});

IntlMessageFormat.__addLocaleData({"locale":"mr"});

IntlMessageFormat.__addLocaleData({"locale":"ms"});
IntlMessageFormat.__addLocaleData({"locale":"ms-Arab"});
IntlMessageFormat.__addLocaleData({"locale":"ms-BN","parentLocale":"ms"});
IntlMessageFormat.__addLocaleData({"locale":"ms-SG","parentLocale":"ms"});

IntlMessageFormat.__addLocaleData({"locale":"mt"});

IntlMessageFormat.__addLocaleData({"locale":"mua"});

IntlMessageFormat.__addLocaleData({"locale":"my"});

IntlMessageFormat.__addLocaleData({"locale":"mzn"});

IntlMessageFormat.__addLocaleData({"locale":"nah"});

IntlMessageFormat.__addLocaleData({"locale":"naq"});

IntlMessageFormat.__addLocaleData({"locale":"nb"});
IntlMessageFormat.__addLocaleData({"locale":"nb-SJ","parentLocale":"nb"});

IntlMessageFormat.__addLocaleData({"locale":"nd"});

IntlMessageFormat.__addLocaleData({"locale":"ne"});
IntlMessageFormat.__addLocaleData({"locale":"ne-IN","parentLocale":"ne"});

IntlMessageFormat.__addLocaleData({"locale":"nl"});
IntlMessageFormat.__addLocaleData({"locale":"nl-AW","parentLocale":"nl"});
IntlMessageFormat.__addLocaleData({"locale":"nl-BE","parentLocale":"nl"});
IntlMessageFormat.__addLocaleData({"locale":"nl-BQ","parentLocale":"nl"});
IntlMessageFormat.__addLocaleData({"locale":"nl-CW","parentLocale":"nl"});
IntlMessageFormat.__addLocaleData({"locale":"nl-SR","parentLocale":"nl"});
IntlMessageFormat.__addLocaleData({"locale":"nl-SX","parentLocale":"nl"});

IntlMessageFormat.__addLocaleData({"locale":"nmg"});

IntlMessageFormat.__addLocaleData({"locale":"nn"});

IntlMessageFormat.__addLocaleData({"locale":"nnh"});

IntlMessageFormat.__addLocaleData({"locale":"no"});

IntlMessageFormat.__addLocaleData({"locale":"nqo"});

IntlMessageFormat.__addLocaleData({"locale":"nr"});

IntlMessageFormat.__addLocaleData({"locale":"nso"});

IntlMessageFormat.__addLocaleData({"locale":"nus"});

IntlMessageFormat.__addLocaleData({"locale":"ny"});

IntlMessageFormat.__addLocaleData({"locale":"nyn"});

IntlMessageFormat.__addLocaleData({"locale":"om"});
IntlMessageFormat.__addLocaleData({"locale":"om-KE","parentLocale":"om"});

IntlMessageFormat.__addLocaleData({"locale":"or"});

IntlMessageFormat.__addLocaleData({"locale":"os"});
IntlMessageFormat.__addLocaleData({"locale":"os-RU","parentLocale":"os"});

IntlMessageFormat.__addLocaleData({"locale":"pa"});
IntlMessageFormat.__addLocaleData({"locale":"pa-Arab"});
IntlMessageFormat.__addLocaleData({"locale":"pa-Guru","parentLocale":"pa"});

IntlMessageFormat.__addLocaleData({"locale":"pap"});

IntlMessageFormat.__addLocaleData({"locale":"pl"});

IntlMessageFormat.__addLocaleData({"locale":"prg"});

IntlMessageFormat.__addLocaleData({"locale":"ps"});

IntlMessageFormat.__addLocaleData({"locale":"pt"});
IntlMessageFormat.__addLocaleData({"locale":"pt-AO","parentLocale":"pt-PT"});
IntlMessageFormat.__addLocaleData({"locale":"pt-PT","parentLocale":"pt"});
IntlMessageFormat.__addLocaleData({"locale":"pt-CV","parentLocale":"pt-PT"});
IntlMessageFormat.__addLocaleData({"locale":"pt-GW","parentLocale":"pt-PT"});
IntlMessageFormat.__addLocaleData({"locale":"pt-MO","parentLocale":"pt-PT"});
IntlMessageFormat.__addLocaleData({"locale":"pt-MZ","parentLocale":"pt-PT"});
IntlMessageFormat.__addLocaleData({"locale":"pt-ST","parentLocale":"pt-PT"});
IntlMessageFormat.__addLocaleData({"locale":"pt-TL","parentLocale":"pt-PT"});

IntlMessageFormat.__addLocaleData({"locale":"qu"});
IntlMessageFormat.__addLocaleData({"locale":"qu-BO","parentLocale":"qu"});
IntlMessageFormat.__addLocaleData({"locale":"qu-EC","parentLocale":"qu"});

IntlMessageFormat.__addLocaleData({"locale":"rm"});

IntlMessageFormat.__addLocaleData({"locale":"rn"});

IntlMessageFormat.__addLocaleData({"locale":"ro"});
IntlMessageFormat.__addLocaleData({"locale":"ro-MD","parentLocale":"ro"});

IntlMessageFormat.__addLocaleData({"locale":"rof"});

IntlMessageFormat.__addLocaleData({"locale":"ru"});
IntlMessageFormat.__addLocaleData({"locale":"ru-BY","parentLocale":"ru"});
IntlMessageFormat.__addLocaleData({"locale":"ru-KG","parentLocale":"ru"});
IntlMessageFormat.__addLocaleData({"locale":"ru-KZ","parentLocale":"ru"});
IntlMessageFormat.__addLocaleData({"locale":"ru-MD","parentLocale":"ru"});
IntlMessageFormat.__addLocaleData({"locale":"ru-UA","parentLocale":"ru"});

IntlMessageFormat.__addLocaleData({"locale":"rw"});

IntlMessageFormat.__addLocaleData({"locale":"rwk"});

IntlMessageFormat.__addLocaleData({"locale":"sah"});

IntlMessageFormat.__addLocaleData({"locale":"saq"});

IntlMessageFormat.__addLocaleData({"locale":"sbp"});

IntlMessageFormat.__addLocaleData({"locale":"sdh"});

IntlMessageFormat.__addLocaleData({"locale":"se"});
IntlMessageFormat.__addLocaleData({"locale":"se-FI","parentLocale":"se"});
IntlMessageFormat.__addLocaleData({"locale":"se-SE","parentLocale":"se"});

IntlMessageFormat.__addLocaleData({"locale":"seh"});

IntlMessageFormat.__addLocaleData({"locale":"ses"});

IntlMessageFormat.__addLocaleData({"locale":"sg"});

IntlMessageFormat.__addLocaleData({"locale":"sh"});

IntlMessageFormat.__addLocaleData({"locale":"shi"});
IntlMessageFormat.__addLocaleData({"locale":"shi-Latn"});
IntlMessageFormat.__addLocaleData({"locale":"shi-Tfng","parentLocale":"shi"});

IntlMessageFormat.__addLocaleData({"locale":"si"});

IntlMessageFormat.__addLocaleData({"locale":"sk"});

IntlMessageFormat.__addLocaleData({"locale":"sl"});

IntlMessageFormat.__addLocaleData({"locale":"sma"});

IntlMessageFormat.__addLocaleData({"locale":"smi"});

IntlMessageFormat.__addLocaleData({"locale":"smj"});

IntlMessageFormat.__addLocaleData({"locale":"smn"});

IntlMessageFormat.__addLocaleData({"locale":"sms"});

IntlMessageFormat.__addLocaleData({"locale":"sn"});

IntlMessageFormat.__addLocaleData({"locale":"so"});
IntlMessageFormat.__addLocaleData({"locale":"so-DJ","parentLocale":"so"});
IntlMessageFormat.__addLocaleData({"locale":"so-ET","parentLocale":"so"});
IntlMessageFormat.__addLocaleData({"locale":"so-KE","parentLocale":"so"});

IntlMessageFormat.__addLocaleData({"locale":"sq"});
IntlMessageFormat.__addLocaleData({"locale":"sq-MK","parentLocale":"sq"});
IntlMessageFormat.__addLocaleData({"locale":"sq-XK","parentLocale":"sq"});

IntlMessageFormat.__addLocaleData({"locale":"sr"});
IntlMessageFormat.__addLocaleData({"locale":"sr-Cyrl","parentLocale":"sr"});
IntlMessageFormat.__addLocaleData({"locale":"sr-Cyrl-BA","parentLocale":"sr-Cyrl"});
IntlMessageFormat.__addLocaleData({"locale":"sr-Cyrl-ME","parentLocale":"sr-Cyrl"});
IntlMessageFormat.__addLocaleData({"locale":"sr-Cyrl-XK","parentLocale":"sr-Cyrl"});
IntlMessageFormat.__addLocaleData({"locale":"sr-Latn"});
IntlMessageFormat.__addLocaleData({"locale":"sr-Latn-BA","parentLocale":"sr-Latn"});
IntlMessageFormat.__addLocaleData({"locale":"sr-Latn-ME","parentLocale":"sr-Latn"});
IntlMessageFormat.__addLocaleData({"locale":"sr-Latn-XK","parentLocale":"sr-Latn"});

IntlMessageFormat.__addLocaleData({"locale":"ss"});

IntlMessageFormat.__addLocaleData({"locale":"ssy"});

IntlMessageFormat.__addLocaleData({"locale":"st"});

IntlMessageFormat.__addLocaleData({"locale":"sv"});
IntlMessageFormat.__addLocaleData({"locale":"sv-AX","parentLocale":"sv"});
IntlMessageFormat.__addLocaleData({"locale":"sv-FI","parentLocale":"sv"});

IntlMessageFormat.__addLocaleData({"locale":"sw"});
IntlMessageFormat.__addLocaleData({"locale":"sw-CD","parentLocale":"sw"});
IntlMessageFormat.__addLocaleData({"locale":"sw-KE","parentLocale":"sw"});
IntlMessageFormat.__addLocaleData({"locale":"sw-UG","parentLocale":"sw"});

IntlMessageFormat.__addLocaleData({"locale":"syr"});

IntlMessageFormat.__addLocaleData({"locale":"ta"});
IntlMessageFormat.__addLocaleData({"locale":"ta-LK","parentLocale":"ta"});
IntlMessageFormat.__addLocaleData({"locale":"ta-MY","parentLocale":"ta"});
IntlMessageFormat.__addLocaleData({"locale":"ta-SG","parentLocale":"ta"});

IntlMessageFormat.__addLocaleData({"locale":"te"});

IntlMessageFormat.__addLocaleData({"locale":"teo"});
IntlMessageFormat.__addLocaleData({"locale":"teo-KE","parentLocale":"teo"});

IntlMessageFormat.__addLocaleData({"locale":"th"});

IntlMessageFormat.__addLocaleData({"locale":"ti"});
IntlMessageFormat.__addLocaleData({"locale":"ti-ER","parentLocale":"ti"});

IntlMessageFormat.__addLocaleData({"locale":"tig"});

IntlMessageFormat.__addLocaleData({"locale":"tk"});

IntlMessageFormat.__addLocaleData({"locale":"tl"});

IntlMessageFormat.__addLocaleData({"locale":"tn"});

IntlMessageFormat.__addLocaleData({"locale":"to"});

IntlMessageFormat.__addLocaleData({"locale":"tr"});
IntlMessageFormat.__addLocaleData({"locale":"tr-CY","parentLocale":"tr"});

IntlMessageFormat.__addLocaleData({"locale":"ts"});

IntlMessageFormat.__addLocaleData({"locale":"twq"});

IntlMessageFormat.__addLocaleData({"locale":"tzm"});

IntlMessageFormat.__addLocaleData({"locale":"ug"});

IntlMessageFormat.__addLocaleData({"locale":"uk"});

IntlMessageFormat.__addLocaleData({"locale":"ur"});
IntlMessageFormat.__addLocaleData({"locale":"ur-IN","parentLocale":"ur"});

IntlMessageFormat.__addLocaleData({"locale":"uz"});
IntlMessageFormat.__addLocaleData({"locale":"uz-Arab"});
IntlMessageFormat.__addLocaleData({"locale":"uz-Cyrl"});
IntlMessageFormat.__addLocaleData({"locale":"uz-Latn","parentLocale":"uz"});

IntlMessageFormat.__addLocaleData({"locale":"vai"});
IntlMessageFormat.__addLocaleData({"locale":"vai-Latn"});
IntlMessageFormat.__addLocaleData({"locale":"vai-Vaii","parentLocale":"vai"});

IntlMessageFormat.__addLocaleData({"locale":"ve"});

IntlMessageFormat.__addLocaleData({"locale":"vi"});

IntlMessageFormat.__addLocaleData({"locale":"vo"});

IntlMessageFormat.__addLocaleData({"locale":"vun"});

IntlMessageFormat.__addLocaleData({"locale":"wa"});

IntlMessageFormat.__addLocaleData({"locale":"wae"});

IntlMessageFormat.__addLocaleData({"locale":"wo"});

IntlMessageFormat.__addLocaleData({"locale":"xh"});

IntlMessageFormat.__addLocaleData({"locale":"xog"});

IntlMessageFormat.__addLocaleData({"locale":"yav"});

IntlMessageFormat.__addLocaleData({"locale":"yi"});

IntlMessageFormat.__addLocaleData({"locale":"yo"});
IntlMessageFormat.__addLocaleData({"locale":"yo-BJ","parentLocale":"yo"});

IntlMessageFormat.__addLocaleData({"locale":"zgh"});

IntlMessageFormat.__addLocaleData({"locale":"zh"});
IntlMessageFormat.__addLocaleData({"locale":"zh-Hans","parentLocale":"zh"});
IntlMessageFormat.__addLocaleData({"locale":"zh-Hans-HK","parentLocale":"zh-Hans"});
IntlMessageFormat.__addLocaleData({"locale":"zh-Hans-MO","parentLocale":"zh-Hans"});
IntlMessageFormat.__addLocaleData({"locale":"zh-Hans-SG","parentLocale":"zh-Hans"});
IntlMessageFormat.__addLocaleData({"locale":"zh-Hant"});
IntlMessageFormat.__addLocaleData({"locale":"zh-Hant-HK","parentLocale":"zh-Hant"});
IntlMessageFormat.__addLocaleData({"locale":"zh-Hant-MO","parentLocale":"zh-Hant-HK"});

IntlMessageFormat.__addLocaleData({"locale":"zu"});

//# sourceMappingURL=intl-messageformat-with-locales.js.map