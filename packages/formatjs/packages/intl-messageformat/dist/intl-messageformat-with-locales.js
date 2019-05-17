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

    var intl$messageformat$parser$$default = /*
    * Generated by PEG.js 0.10.0.
    *
    * http://pegjs.org/
    */
    (function() {
      "use strict";

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

      peg$SyntaxError.buildMessage = function(expected, found) {
        var DESCRIBE_EXPECTATION_FNS = {
              literal: function(expectation) {
                return "\"" + literalEscape(expectation.text) + "\"";
              },

              "class": function(expectation) {
                var escapedParts = "",
                    i;

                for (i = 0; i < expectation.parts.length; i++) {
                  escapedParts += expectation.parts[i] instanceof Array
                    ? classEscape(expectation.parts[i][0]) + "-" + classEscape(expectation.parts[i][1])
                    : classEscape(expectation.parts[i]);
                }

                return "[" + (expectation.inverted ? "^" : "") + escapedParts + "]";
              },

              any: function(expectation) {
                return "any character";
              },

              end: function(expectation) {
                return "end of input";
              },

              other: function(expectation) {
                return expectation.description;
              }
            };

        function hex(ch) {
          return ch.charCodeAt(0).toString(16).toUpperCase();
        }

        function literalEscape(s) {
          return s
            .replace(/\\/g, '\\\\')
            .replace(/"/g,  '\\"')
            .replace(/\0/g, '\\0')
            .replace(/\t/g, '\\t')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/[\x00-\x0F]/g,          function(ch) { return '\\x0' + hex(ch); })
            .replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) { return '\\x'  + hex(ch); });
        }

        function classEscape(s) {
          return s
            .replace(/\\/g, '\\\\')
            .replace(/\]/g, '\\]')
            .replace(/\^/g, '\\^')
            .replace(/-/g,  '\\-')
            .replace(/\0/g, '\\0')
            .replace(/\t/g, '\\t')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/[\x00-\x0F]/g,          function(ch) { return '\\x0' + hex(ch); })
            .replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) { return '\\x'  + hex(ch); });
        }

        function describeExpectation(expectation) {
          return DESCRIBE_EXPECTATION_FNS[expectation.type](expectation);
        }

        function describeExpected(expected) {
          var descriptions = new Array(expected.length),
              i, j;

          for (i = 0; i < expected.length; i++) {
            descriptions[i] = describeExpectation(expected[i]);
          }

          descriptions.sort();

          if (descriptions.length > 0) {
            for (i = 1, j = 1; i < descriptions.length; i++) {
              if (descriptions[i - 1] !== descriptions[i]) {
                descriptions[j] = descriptions[i];
                j++;
              }
            }
            descriptions.length = j;
          }

          switch (descriptions.length) {
            case 1:
              return descriptions[0];

            case 2:
              return descriptions[0] + " or " + descriptions[1];

            default:
              return descriptions.slice(0, -1).join(", ")
                + ", or "
                + descriptions[descriptions.length - 1];
          }
        }

        function describeFound(found) {
          return found ? "\"" + literalEscape(found) + "\"" : "end of input";
        }

        return "Expected " + describeExpected(expected) + " but " + describeFound(found) + " found.";
      };

      function peg$parse(input, options) {
        options = options !== void 0 ? options : {};

        var peg$FAILED = {},

            peg$startRuleFunctions = { start: peg$parsestart },
            peg$startRuleFunction  = peg$parsestart,

            peg$c0 = function(elements) {
                    return {
                        type    : 'messageFormatPattern',
                        elements: elements,
                        location: location()
                    };
                },
            peg$c1 = function(chunks) {
                    return chunks.reduce(function (all, chunk) {
                        return all.concat(chunk)
                    }, []).join('')
                },
            peg$c2 = function(messageText) {
                    return {
                        type : 'messageTextElement',
                        value: messageText,
                        location: location()
                    };
                },
            peg$c3 = /^[^ \t\n\r,.+={}#]/,
            peg$c4 = peg$classExpectation([" ", "\t", "\n", "\r", ",", ".", "+", "=", "{", "}", "#"], true, false),
            peg$c5 = "{",
            peg$c6 = peg$literalExpectation("{", false),
            peg$c7 = ",",
            peg$c8 = peg$literalExpectation(",", false),
            peg$c9 = "}",
            peg$c10 = peg$literalExpectation("}", false),
            peg$c11 = function(id, format) {
                    return {
                        type  : 'argumentElement',
                        id    : id,
                        format: format && format[2],
                        location: location()
                    };
                },
            peg$c12 = "number",
            peg$c13 = peg$literalExpectation("number", false),
            peg$c14 = "date",
            peg$c15 = peg$literalExpectation("date", false),
            peg$c16 = "time",
            peg$c17 = peg$literalExpectation("time", false),
            peg$c18 = function(type, style) {
                    return {
                        type : type + 'Format',
                        style: style && style[2],
                        location: location()
                    };
                },
            peg$c19 = "plural",
            peg$c20 = peg$literalExpectation("plural", false),
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
            peg$c23 = peg$literalExpectation("selectordinal", false),
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
            peg$c26 = peg$literalExpectation("select", false),
            peg$c27 = function(options) {
                    return {
                        type   : 'selectFormat',
                        options: options,
                        location: location()
                    };
                },
            peg$c28 = "=",
            peg$c29 = peg$literalExpectation("=", false),
            peg$c30 = function(selector, pattern) {
                    return {
                        type    : 'optionalFormatPattern',
                        selector: selector,
                        value   : pattern,
                        location: location()
                    };
                },
            peg$c31 = "offset:",
            peg$c32 = peg$literalExpectation("offset:", false),
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
            peg$c35 = peg$otherExpectation("whitespace"),
            peg$c36 = /^[ \t\n\r]/,
            peg$c37 = peg$classExpectation([" ", "\t", "\n", "\r"], false, false),
            peg$c38 = peg$otherExpectation("optionalWhitespace"),
            peg$c39 = /^[0-9]/,
            peg$c40 = peg$classExpectation([["0", "9"]], false, false),
            peg$c41 = /^[0-9a-f]/i,
            peg$c42 = peg$classExpectation([["0", "9"], ["a", "f"]], false, true),
            peg$c43 = "0",
            peg$c44 = peg$literalExpectation("0", false),
            peg$c45 = /^[1-9]/,
            peg$c46 = peg$classExpectation([["1", "9"]], false, false),
            peg$c47 = function(digits) {
                return parseInt(digits, 10);
            },
            peg$c48 = /^[^{}\\\0-\x1F\x7F \t\n\r]/,
            peg$c49 = peg$classExpectation(["{", "}", "\\", ["\0", "\x1F"], "\x7F", " ", "\t", "\n", "\r"], true, false),
            peg$c50 = "\\\\",
            peg$c51 = peg$literalExpectation("\\\\", false),
            peg$c52 = function() { return '\\'; },
            peg$c53 = "\\#",
            peg$c54 = peg$literalExpectation("\\#", false),
            peg$c55 = function() { return '\\#'; },
            peg$c56 = "\\{",
            peg$c57 = peg$literalExpectation("\\{", false),
            peg$c58 = function() { return '\u007B'; },
            peg$c59 = "\\}",
            peg$c60 = peg$literalExpectation("\\}", false),
            peg$c61 = function() { return '\u007D'; },
            peg$c62 = "\\u",
            peg$c63 = peg$literalExpectation("\\u", false),
            peg$c64 = function(digits) {
                    return String.fromCharCode(parseInt(digits, 16));
                },
            peg$c65 = function(chars) { return chars.join(''); },

            peg$currPos          = 0,
            peg$savedPos         = 0,
            peg$posDetailsCache  = [{ line: 1, column: 1 }],
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

        function expected(description, location) {
          location = location !== void 0 ? location : peg$computeLocation(peg$savedPos, peg$currPos)

          throw peg$buildStructuredError(
            [peg$otherExpectation(description)],
            input.substring(peg$savedPos, peg$currPos),
            location
          );
        }

        function error(message, location) {
          location = location !== void 0 ? location : peg$computeLocation(peg$savedPos, peg$currPos)

          throw peg$buildSimpleError(message, location);
        }

        function peg$literalExpectation(text, ignoreCase) {
          return { type: "literal", text: text, ignoreCase: ignoreCase };
        }

        function peg$classExpectation(parts, inverted, ignoreCase) {
          return { type: "class", parts: parts, inverted: inverted, ignoreCase: ignoreCase };
        }

        function peg$anyExpectation() {
          return { type: "any" };
        }

        function peg$endExpectation() {
          return { type: "end" };
        }

        function peg$otherExpectation(description) {
          return { type: "other", description: description };
        }

        function peg$computePosDetails(pos) {
          var details = peg$posDetailsCache[pos], p;

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
              column: details.column
            };

            while (p < pos) {
              if (input.charCodeAt(p) === 10) {
                details.line++;
                details.column = 1;
              } else {
                details.column++;
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

        function peg$buildSimpleError(message, location) {
          return new peg$SyntaxError(message, null, null, location);
        }

        function peg$buildStructuredError(expected, found, location) {
          return new peg$SyntaxError(
            peg$SyntaxError.buildMessage(expected, found),
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
          var s0, s1, s2, s3, s4, s5, s6;

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
                  s5 = peg$parsemessageFormatPattern();
                  if (s5 !== peg$FAILED) {
                    if (input.charCodeAt(peg$currPos) === 125) {
                      s6 = peg$c9;
                      peg$currPos++;
                    } else {
                      s6 = peg$FAILED;
                      if (peg$silentFails === 0) { peg$fail(peg$c10); }
                    }
                    if (s6 !== peg$FAILED) {
                      peg$savedPos = s0;
                      s1 = peg$c30(s2, s5);
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
            peg$fail(peg$endExpectation());
          }

          throw peg$buildStructuredError(
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
/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"af"});
IntlMessageFormat.__addLocaleData({"locale":"af-NA","parentLocale":"af"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"agq"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"ak"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"am"});

/* @generated */
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

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"ars"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"as"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"asa"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"ast"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"az"});
IntlMessageFormat.__addLocaleData({"locale":"az-Arab"});
IntlMessageFormat.__addLocaleData({"locale":"az-Cyrl"});
IntlMessageFormat.__addLocaleData({"locale":"az-Latn","parentLocale":"az"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"bas"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"be"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"bem"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"bez"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"bg"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"bh"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"bm"});
IntlMessageFormat.__addLocaleData({"locale":"bm-Nkoo"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"bn"});
IntlMessageFormat.__addLocaleData({"locale":"bn-IN","parentLocale":"bn"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"bo"});
IntlMessageFormat.__addLocaleData({"locale":"bo-IN","parentLocale":"bo"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"br"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"brx"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"bs"});
IntlMessageFormat.__addLocaleData({"locale":"bs-Cyrl"});
IntlMessageFormat.__addLocaleData({"locale":"bs-Latn","parentLocale":"bs"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"ca"});
IntlMessageFormat.__addLocaleData({"locale":"ca-AD","parentLocale":"ca"});
IntlMessageFormat.__addLocaleData({"locale":"ca-ES-VALENCIA","parentLocale":"ca-ES"});
IntlMessageFormat.__addLocaleData({"locale":"ca-ES","parentLocale":"ca"});
IntlMessageFormat.__addLocaleData({"locale":"ca-FR","parentLocale":"ca"});
IntlMessageFormat.__addLocaleData({"locale":"ca-IT","parentLocale":"ca"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"ccp"});
IntlMessageFormat.__addLocaleData({"locale":"ccp-IN","parentLocale":"ccp"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"ce"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"cgg"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"chr"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"ckb"});
IntlMessageFormat.__addLocaleData({"locale":"ckb-IR","parentLocale":"ckb"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"cs"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"cu"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"cy"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"da"});
IntlMessageFormat.__addLocaleData({"locale":"da-GL","parentLocale":"da"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"dav"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"de"});
IntlMessageFormat.__addLocaleData({"locale":"de-AT","parentLocale":"de"});
IntlMessageFormat.__addLocaleData({"locale":"de-BE","parentLocale":"de"});
IntlMessageFormat.__addLocaleData({"locale":"de-CH","parentLocale":"de"});
IntlMessageFormat.__addLocaleData({"locale":"de-IT","parentLocale":"de"});
IntlMessageFormat.__addLocaleData({"locale":"de-LI","parentLocale":"de"});
IntlMessageFormat.__addLocaleData({"locale":"de-LU","parentLocale":"de"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"dje"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"dsb"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"dua"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"dv"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"dyo"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"dz"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"ebu"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"ee"});
IntlMessageFormat.__addLocaleData({"locale":"ee-TG","parentLocale":"ee"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"el"});
IntlMessageFormat.__addLocaleData({"locale":"el-CY","parentLocale":"el"});

/* @generated */
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

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"eo"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"es"});
IntlMessageFormat.__addLocaleData({"locale":"es-419","parentLocale":"es"});
IntlMessageFormat.__addLocaleData({"locale":"es-AR","parentLocale":"es-419"});
IntlMessageFormat.__addLocaleData({"locale":"es-BO","parentLocale":"es-419"});
IntlMessageFormat.__addLocaleData({"locale":"es-BR","parentLocale":"es-419"});
IntlMessageFormat.__addLocaleData({"locale":"es-BZ","parentLocale":"es-419"});
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

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"et"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"eu"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"ewo"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"fa"});
IntlMessageFormat.__addLocaleData({"locale":"fa-AF","parentLocale":"fa"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"ff"});
IntlMessageFormat.__addLocaleData({"locale":"ff-Adlm"});
IntlMessageFormat.__addLocaleData({"locale":"ff-Latn","parentLocale":"ff"});
IntlMessageFormat.__addLocaleData({"locale":"ff-Latn-BF","parentLocale":"ff-Latn"});
IntlMessageFormat.__addLocaleData({"locale":"ff-Latn-CM","parentLocale":"ff-Latn"});
IntlMessageFormat.__addLocaleData({"locale":"ff-Latn-GH","parentLocale":"ff-Latn"});
IntlMessageFormat.__addLocaleData({"locale":"ff-Latn-GM","parentLocale":"ff-Latn"});
IntlMessageFormat.__addLocaleData({"locale":"ff-Latn-GN","parentLocale":"ff-Latn"});
IntlMessageFormat.__addLocaleData({"locale":"ff-Latn-GW","parentLocale":"ff-Latn"});
IntlMessageFormat.__addLocaleData({"locale":"ff-Latn-LR","parentLocale":"ff-Latn"});
IntlMessageFormat.__addLocaleData({"locale":"ff-Latn-MR","parentLocale":"ff-Latn"});
IntlMessageFormat.__addLocaleData({"locale":"ff-Latn-NE","parentLocale":"ff-Latn"});
IntlMessageFormat.__addLocaleData({"locale":"ff-Latn-NG","parentLocale":"ff-Latn"});
IntlMessageFormat.__addLocaleData({"locale":"ff-Latn-SL","parentLocale":"ff-Latn"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"fi"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"fil"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"fo"});
IntlMessageFormat.__addLocaleData({"locale":"fo-DK","parentLocale":"fo"});

/* @generated */
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

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"fur"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"fy"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"ga"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"gd"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"gl"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"gsw"});
IntlMessageFormat.__addLocaleData({"locale":"gsw-FR","parentLocale":"gsw"});
IntlMessageFormat.__addLocaleData({"locale":"gsw-LI","parentLocale":"gsw"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"gu"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"guw"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"guz"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"gv"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"ha"});
IntlMessageFormat.__addLocaleData({"locale":"ha-Arab"});
IntlMessageFormat.__addLocaleData({"locale":"ha-GH","parentLocale":"ha"});
IntlMessageFormat.__addLocaleData({"locale":"ha-NE","parentLocale":"ha"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"haw"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"he"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"hi"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"hr"});
IntlMessageFormat.__addLocaleData({"locale":"hr-BA","parentLocale":"hr"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"hsb"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"hu"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"hy"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"ia"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"id"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"ig"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"ii"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"in"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"io"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"is"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"it"});
IntlMessageFormat.__addLocaleData({"locale":"it-CH","parentLocale":"it"});
IntlMessageFormat.__addLocaleData({"locale":"it-SM","parentLocale":"it"});
IntlMessageFormat.__addLocaleData({"locale":"it-VA","parentLocale":"it"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"iu"});
IntlMessageFormat.__addLocaleData({"locale":"iu-Latn"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"iw"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"ja"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"jbo"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"jgo"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"ji"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"jmc"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"jv"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"jw"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"ka"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"kab"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"kaj"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"kam"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"kcg"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"kde"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"kea"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"khq"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"ki"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"kk"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"kkj"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"kl"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"kln"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"km"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"kn"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"ko"});
IntlMessageFormat.__addLocaleData({"locale":"ko-KP","parentLocale":"ko"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"kok"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"ks"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"ksb"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"ksf"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"ksh"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"ku"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"kw"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"ky"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"lag"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"lb"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"lg"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"lkt"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"ln"});
IntlMessageFormat.__addLocaleData({"locale":"ln-AO","parentLocale":"ln"});
IntlMessageFormat.__addLocaleData({"locale":"ln-CF","parentLocale":"ln"});
IntlMessageFormat.__addLocaleData({"locale":"ln-CG","parentLocale":"ln"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"lo"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"lrc"});
IntlMessageFormat.__addLocaleData({"locale":"lrc-IQ","parentLocale":"lrc"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"lt"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"lu"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"luo"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"luy"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"lv"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"mas"});
IntlMessageFormat.__addLocaleData({"locale":"mas-TZ","parentLocale":"mas"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"mer"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"mfe"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"mg"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"mgh"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"mgo"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"mi"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"mk"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"ml"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"mn"});
IntlMessageFormat.__addLocaleData({"locale":"mn-Mong"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"mo"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"mr"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"ms"});
IntlMessageFormat.__addLocaleData({"locale":"ms-Arab"});
IntlMessageFormat.__addLocaleData({"locale":"ms-BN","parentLocale":"ms"});
IntlMessageFormat.__addLocaleData({"locale":"ms-SG","parentLocale":"ms"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"mt"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"mua"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"my"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"mzn"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"nah"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"naq"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"nb"});
IntlMessageFormat.__addLocaleData({"locale":"nb-SJ","parentLocale":"nb"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"nd"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"nds"});
IntlMessageFormat.__addLocaleData({"locale":"nds-NL","parentLocale":"nds"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"ne"});
IntlMessageFormat.__addLocaleData({"locale":"ne-IN","parentLocale":"ne"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"nl"});
IntlMessageFormat.__addLocaleData({"locale":"nl-AW","parentLocale":"nl"});
IntlMessageFormat.__addLocaleData({"locale":"nl-BE","parentLocale":"nl"});
IntlMessageFormat.__addLocaleData({"locale":"nl-BQ","parentLocale":"nl"});
IntlMessageFormat.__addLocaleData({"locale":"nl-CW","parentLocale":"nl"});
IntlMessageFormat.__addLocaleData({"locale":"nl-SR","parentLocale":"nl"});
IntlMessageFormat.__addLocaleData({"locale":"nl-SX","parentLocale":"nl"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"nmg"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"nn"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"nnh"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"no"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"nqo"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"nr"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"nso"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"nus"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"ny"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"nyn"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"om"});
IntlMessageFormat.__addLocaleData({"locale":"om-KE","parentLocale":"om"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"or"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"os"});
IntlMessageFormat.__addLocaleData({"locale":"os-RU","parentLocale":"os"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"pa"});
IntlMessageFormat.__addLocaleData({"locale":"pa-Arab"});
IntlMessageFormat.__addLocaleData({"locale":"pa-Guru","parentLocale":"pa"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"pap"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"pl"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"prg"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"ps"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"pt"});
IntlMessageFormat.__addLocaleData({"locale":"pt-AO","parentLocale":"pt-PT"});
IntlMessageFormat.__addLocaleData({"locale":"pt-PT","parentLocale":"pt"});
IntlMessageFormat.__addLocaleData({"locale":"pt-CH","parentLocale":"pt-PT"});
IntlMessageFormat.__addLocaleData({"locale":"pt-CV","parentLocale":"pt-PT"});
IntlMessageFormat.__addLocaleData({"locale":"pt-GQ","parentLocale":"pt-PT"});
IntlMessageFormat.__addLocaleData({"locale":"pt-GW","parentLocale":"pt-PT"});
IntlMessageFormat.__addLocaleData({"locale":"pt-LU","parentLocale":"pt-PT"});
IntlMessageFormat.__addLocaleData({"locale":"pt-MO","parentLocale":"pt-PT"});
IntlMessageFormat.__addLocaleData({"locale":"pt-MZ","parentLocale":"pt-PT"});
IntlMessageFormat.__addLocaleData({"locale":"pt-ST","parentLocale":"pt-PT"});
IntlMessageFormat.__addLocaleData({"locale":"pt-TL","parentLocale":"pt-PT"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"qu"});
IntlMessageFormat.__addLocaleData({"locale":"qu-BO","parentLocale":"qu"});
IntlMessageFormat.__addLocaleData({"locale":"qu-EC","parentLocale":"qu"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"rm"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"rn"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"ro"});
IntlMessageFormat.__addLocaleData({"locale":"ro-MD","parentLocale":"ro"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"rof"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"ru"});
IntlMessageFormat.__addLocaleData({"locale":"ru-BY","parentLocale":"ru"});
IntlMessageFormat.__addLocaleData({"locale":"ru-KG","parentLocale":"ru"});
IntlMessageFormat.__addLocaleData({"locale":"ru-KZ","parentLocale":"ru"});
IntlMessageFormat.__addLocaleData({"locale":"ru-MD","parentLocale":"ru"});
IntlMessageFormat.__addLocaleData({"locale":"ru-UA","parentLocale":"ru"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"rw"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"rwk"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"sah"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"saq"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"sbp"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"sc"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"scn"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"sd"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"sdh"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"se"});
IntlMessageFormat.__addLocaleData({"locale":"se-FI","parentLocale":"se"});
IntlMessageFormat.__addLocaleData({"locale":"se-SE","parentLocale":"se"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"seh"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"ses"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"sg"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"sh"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"shi"});
IntlMessageFormat.__addLocaleData({"locale":"shi-Latn"});
IntlMessageFormat.__addLocaleData({"locale":"shi-Tfng","parentLocale":"shi"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"si"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"sk"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"sl"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"sma"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"smi"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"smj"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"smn"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"sms"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"sn"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"so"});
IntlMessageFormat.__addLocaleData({"locale":"so-DJ","parentLocale":"so"});
IntlMessageFormat.__addLocaleData({"locale":"so-ET","parentLocale":"so"});
IntlMessageFormat.__addLocaleData({"locale":"so-KE","parentLocale":"so"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"sq"});
IntlMessageFormat.__addLocaleData({"locale":"sq-MK","parentLocale":"sq"});
IntlMessageFormat.__addLocaleData({"locale":"sq-XK","parentLocale":"sq"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"sr"});
IntlMessageFormat.__addLocaleData({"locale":"sr-Cyrl","parentLocale":"sr"});
IntlMessageFormat.__addLocaleData({"locale":"sr-Cyrl-BA","parentLocale":"sr-Cyrl"});
IntlMessageFormat.__addLocaleData({"locale":"sr-Cyrl-ME","parentLocale":"sr-Cyrl"});
IntlMessageFormat.__addLocaleData({"locale":"sr-Cyrl-XK","parentLocale":"sr-Cyrl"});
IntlMessageFormat.__addLocaleData({"locale":"sr-Latn"});
IntlMessageFormat.__addLocaleData({"locale":"sr-Latn-BA","parentLocale":"sr-Latn"});
IntlMessageFormat.__addLocaleData({"locale":"sr-Latn-ME","parentLocale":"sr-Latn"});
IntlMessageFormat.__addLocaleData({"locale":"sr-Latn-XK","parentLocale":"sr-Latn"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"ss"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"ssy"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"st"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"sv"});
IntlMessageFormat.__addLocaleData({"locale":"sv-AX","parentLocale":"sv"});
IntlMessageFormat.__addLocaleData({"locale":"sv-FI","parentLocale":"sv"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"sw"});
IntlMessageFormat.__addLocaleData({"locale":"sw-CD","parentLocale":"sw"});
IntlMessageFormat.__addLocaleData({"locale":"sw-KE","parentLocale":"sw"});
IntlMessageFormat.__addLocaleData({"locale":"sw-UG","parentLocale":"sw"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"syr"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"ta"});
IntlMessageFormat.__addLocaleData({"locale":"ta-LK","parentLocale":"ta"});
IntlMessageFormat.__addLocaleData({"locale":"ta-MY","parentLocale":"ta"});
IntlMessageFormat.__addLocaleData({"locale":"ta-SG","parentLocale":"ta"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"te"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"teo"});
IntlMessageFormat.__addLocaleData({"locale":"teo-KE","parentLocale":"teo"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"tg"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"th"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"ti"});
IntlMessageFormat.__addLocaleData({"locale":"ti-ER","parentLocale":"ti"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"tig"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"tk"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"tl"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"tn"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"to"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"tr"});
IntlMessageFormat.__addLocaleData({"locale":"tr-CY","parentLocale":"tr"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"ts"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"tt"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"twq"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"tzm"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"ug"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"uk"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"ur"});
IntlMessageFormat.__addLocaleData({"locale":"ur-IN","parentLocale":"ur"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"uz"});
IntlMessageFormat.__addLocaleData({"locale":"uz-Arab"});
IntlMessageFormat.__addLocaleData({"locale":"uz-Cyrl"});
IntlMessageFormat.__addLocaleData({"locale":"uz-Latn","parentLocale":"uz"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"vai"});
IntlMessageFormat.__addLocaleData({"locale":"vai-Latn"});
IntlMessageFormat.__addLocaleData({"locale":"vai-Vaii","parentLocale":"vai"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"ve"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"vi"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"vo"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"vun"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"wa"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"wae"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"wo"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"xh"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"xog"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"yav"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"yi"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"yo"});
IntlMessageFormat.__addLocaleData({"locale":"yo-BJ","parentLocale":"yo"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"yue"});
IntlMessageFormat.__addLocaleData({"locale":"yue-Hans"});
IntlMessageFormat.__addLocaleData({"locale":"yue-Hant","parentLocale":"yue"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"zgh"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"zh"});
IntlMessageFormat.__addLocaleData({"locale":"zh-Hans","parentLocale":"zh"});
IntlMessageFormat.__addLocaleData({"locale":"zh-Hans-HK","parentLocale":"zh-Hans"});
IntlMessageFormat.__addLocaleData({"locale":"zh-Hans-MO","parentLocale":"zh-Hans"});
IntlMessageFormat.__addLocaleData({"locale":"zh-Hans-SG","parentLocale":"zh-Hans"});
IntlMessageFormat.__addLocaleData({"locale":"zh-Hant"});
IntlMessageFormat.__addLocaleData({"locale":"zh-Hant-HK","parentLocale":"zh-Hant"});
IntlMessageFormat.__addLocaleData({"locale":"zh-Hant-MO","parentLocale":"zh-Hant-HK"});

/* @generated */
IntlMessageFormat.__addLocaleData({"locale":"zu"});

//# sourceMappingURL=intl-messageformat-with-locales.js.map