/*
Copyright 2014, Yahoo! Inc. All rights reserved.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.
*/

/*
 * IMPORTANT: `TYPE` comes from `types.ts`
 */

{
    function insertLocation () {
        return options && options.captureLocation ? {
            location: location()
        }: {}
    }
}

start
    = message

message = messageElement*

messageElement
    = literalElement
    / argumentElement
    / simpleFormatElement
    / pluralElement
    / selectElement

messageText
    = chunks:(_ chars _)+ {
        return chunks.reduce(function (all, chunk) {
            return all.concat(chunk)
        }, []).join('')
    }
    / $(ws)

literalElement
    = messageText:messageText {
        return {
            type : TYPE.literal,
            value: messageText,
            ...insertLocation()
        };
    }

varName
    = number
    / chars:quoteEscapedChar* { return chars.join(''); }

argumentElement 'argumentElement'
    = '{' _ value:varName _ '}' {
        return {
            type: TYPE.argument,
            value,
            ...insertLocation()
        }
    }

numberSkeletonTokenOption 'numberSkeletonTokenOption'
    = '/' option:numberSkeletonId { return option; }

numberSkeletonToken 'numberSkeletonToken'
    = _ stem:numberSkeletonId options:(numberSkeletonTokenOption*) {
        return {stem: stem, options};
    }

// See also:
// https://github.com/unicode-org/icu/blob/master/docs/userguide/format_parse/numbers/skeletons.md
numberSkeleton = tokens:(numberSkeletonToken+) {
    return {
        type: SKELETON_TYPE.number,
        tokens,
        ...insertLocation()
    }
}

numberArgStyle
    = '::' skeleton:numberSkeleton { return skeleton; }
    / chars

numberFormatElement
    = '{' _ value:varName _ ',' _ type:'number' _ style:(',' _ numberArgStyle)? _ '}' {
        return {
            type    : type === 'number' ? TYPE.number : type === 'date' ? TYPE.date : TYPE.time,
            style   : style && style[2],
            value,
            ...insertLocation()
        };
    }

// Starting with ICU 4.8, an ASCII apostrophe only starts quoted text if it immediately precedes
// a character that requires quoting (that is, "only where needed"), and works the same in
// nested messages as on the top level of the pattern. The new behavior is otherwise compatible.
// TODO: use this rule for message text literal.
quotedString = "'" escapedChar:([\{\}]) quotedChars:$([^'] / "''")+ "'" {
    return escapedChar + quotedChars.replace(`''`, `'`);
}
doubleApostrophes = "''" { return `'`; }
unquotedString = matches:$(!("''" / '{' / '}' / "'{" "'}") .)+ { return matches; }

// See also:
// - http://cldr.unicode.org/translation/date-time-patterns
// - http://www.icu-project.org/apiref/icu4j/com/ibm/icu/text/SimpleDateFormat.html
// Here we implement the ICU >= 4.8 quoting behavior.
dateOrTimeSkeleton
    = parts:(quotedString / doubleApostrophes / unquotedString)+ {
        return {
            type: SKELETON_TYPE.date,
            pattern: parts.join(''),
            ...insertLocation(),
        }
    }

dateOrTimeArgStyle
    = '::' skeleton:dateOrTimeSkeleton { return skeleton; }
    / chars

dateOrTimeFormatElement
    = '{' _ value:varName _ ',' _ type:('date' / 'time') _ style:(',' _ dateOrTimeArgStyle)? _ '}' {
        return {
            type    : type === 'number' ? TYPE.number : type === 'date' ? TYPE.date : TYPE.time,
            style   : style && style[2],
            value,
            ...insertLocation()
        };
    }

simpleFormatElement = numberFormatElement / dateOrTimeFormatElement

pluralElement
    = '{' _ value:varName _ ',' _ pluralType:('plural' / 'selectordinal') _ ',' _ offset:('offset:' _ number)? _ options:pluralOption+ _ '}' {
        return {
            type   : TYPE.plural,
            pluralType: pluralType === 'plural' ? 'cardinal' : 'ordinal',
            value,
            offset : offset ? offset[2] : 0,
            options: options.reduce((all, {id, value, location}) => {
                all[id] = {
                    value,
                    location
                }
                return all
            }, {}),
            ...insertLocation()
        };
    }

selectElement
    = '{' _ value:varName _ ',' _ 'select' _ ',' _ options:selectOption+ _ '}' {
        return {
            type   : TYPE.select,
            value,
            options: options.reduce((all, {id, value, location}) => {
                all[id] = {
                    value,
                    location
                }
                return all
            }, {}),
            ...insertLocation()
        };
    }

pluralRuleSelectValue
    = '=' n:number {
        return `=${n}`
    }
    / 'zero'
    / 'one'
    / 'two'
    / 'few'
    / 'many'
    / 'other'

selectOption
    = _ id:chars _ '{' value:message '}' {
        return {
            id,
            value,
            ...insertLocation()
        }
    }

pluralOption
    = _ id:pluralRuleSelectValue _ '{' value:message '}' {
        return {
            id,
            value,
            ...insertLocation()
        };
    }

// -- Helpers ------------------------------------------------------------------

ws 'whitespace' = [ \t\n\r]+
_ 'optionalWhitespace' = $(ws*)

digit    = [0-9]
hexDigit = [0-9a-f]i

number = digits:digit+ {
    return parseInt(digits.join(''), 10);
}

quoteEscapedChar =
  !("'" / [ \t\n\r,.+={}#]) char:. { return char; }
  / "'" sequence:escape { return sequence; }

apostrophe 'apostrophe' = "'"
escape = [ \t\n\r,.+={}#] / apostrophe

char
    =
    "'" sequence:apostrophe { return sequence; }
    / [^{}\\\0-\x1F\x7f \t\n\r]
    / '\\\\' { return '\\'; }
    / '\\#'  { return '\\#'; }
    / '\\{'  { return '\u007B'; }
    / '\\}'  { return '\u007D'; }
    / '\\u'  digits:$(hexDigit hexDigit hexDigit hexDigit) {
        return String.fromCharCode(parseInt(digits, 16));
    }

chars = chars:char+ { return chars.join(''); }

// Equivalence of \p{Pattern_White_Space}
// See: https://github.com/mathiasbynens/unicode-11.0.0/blob/master/Binary_Property/Pattern_White_Space/regex.js
patternWhiteSpace = [\t-\r \x85\u200E\u200F\u2028\u2029];

numberSkeletonId 'numberSkeletonId' = $(!(patternWhiteSpace / [\'\/{}]) .)+;
