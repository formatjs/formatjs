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
    = parts:(doubleApostrophes / quotedString / unquotedString)+ {
        return parts.join('');
    }

literalElement
    = messageText:messageText {
        return {
            type : TYPE.literal,
            value: messageText,
            ...insertLocation()
        };
    }

argumentElement 'argumentElement'
    = '{' _ value:argNameOrNumber _ '}' {
        return {
            type: TYPE.argument,
            value,
            ...insertLocation()
        }
    }

numberSkeletonId 'numberSkeletonId'
    = $(!(patternWhiteSpace / [\'\/{}]) .)+

numberSkeletonTokenOption 'numberSkeletonTokenOption'
    = '/' option:numberSkeletonId { return option; }

numberSkeletonToken 'numberSkeletonToken'
    = _ stem:numberSkeletonId options:(numberSkeletonTokenOption*) {
        return {stem: stem, options};
    }

// See also:
// https://github.com/unicode-org/icu/blob/master/docs/userguide/format_parse/numbers/skeletons.md
numberSkeleton
    = tokens:(numberSkeletonToken+) {
        return {
            type: SKELETON_TYPE.number,
            tokens,
            ...insertLocation()
        }
    }

numberArgStyle
    = '::' skeleton:numberSkeleton { return skeleton; }
    / style:messageText { return style.replace(/\s*$/, ''); }

numberFormatElement
    = '{' _ value:argNameOrNumber _ ',' _ type:'number' _ style:(',' _ numberArgStyle)? _ '}' {
        return {
            type    : type === 'number' ? TYPE.number : type === 'date' ? TYPE.date : TYPE.time,
            style   : style && style[2],
            value,
            ...insertLocation()
        };
    }

dateTimeSkeletonLiteral = "'" (doubleApostrophes / [^'])+ "'" / (doubleApostrophes / [^a-zA-Z'{}])+
dateTimeSkeletonPattern = [a-zA-Z]+

// See also:
// - http://www.unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table
// - http://cldr.unicode.org/translation/date-time-patterns
// - http://www.icu-project.org/apiref/icu4j/com/ibm/icu/text/SimpleDateFormat.html
dateTimeSkeleton
    = pattern:$(dateTimeSkeletonLiteral / dateTimeSkeletonPattern)+ {
        return {
            type: SKELETON_TYPE.dateTime,
            pattern,
            ...insertLocation(),
        }
    }

dateOrTimeArgStyle
    = '::' skeleton:dateTimeSkeleton { return skeleton; }
    / style:messageText { return style.replace(/\s*$/, ''); }

dateOrTimeFormatElement
    = '{' _ value:argNameOrNumber _ ',' _ type:('date' / 'time') _ style:(',' _ dateOrTimeArgStyle)? _ '}' {
        return {
            type    : type === 'number' ? TYPE.number : type === 'date' ? TYPE.date : TYPE.time,
            style   : style && style[2],
            value,
            ...insertLocation()
        };
    }

simpleFormatElement
    = numberFormatElement / dateOrTimeFormatElement

pluralElement
    = '{' _ value:argNameOrNumber _ ',' _ pluralType:('plural' / 'selectordinal') _ ',' _ offset:('offset:' _ number)? _ options:pluralOption+ _ '}' {
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
    = '{' _ value:argNameOrNumber _ ',' _ 'select' _ ',' _ options:selectOption+ _ '}' {
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
    = $('=' number) 
    / argName

selectOption
    = _ id:argName _ '{' value:message '}' {
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

// Equivalence of \p{Pattern_White_Space}
// See: https://github.com/mathiasbynens/unicode-11.0.0/blob/master/Binary_Property/Pattern_White_Space/regex.js
patternWhiteSpace 'whitespace pattern' = [\t-\r \x85\u200E\u200F\u2028\u2029]
// Equivalence of \p{Pattern_Syntax}
// See: https://github.com/mathiasbynens/unicode-11.0.0/blob/master/Binary_Property/Pattern_Syntax/regex.js
patternSyntax 'syntax pattern' = [!-\/:-@\[-\^`\{-~\xA1-\xA7\xA9\xAB\xAC\xAE\xB0\xB1\xB6\xBB\xBF\xD7\xF7\u2010-\u2027\u2030-\u203E\u2041-\u2053\u2055-\u205E\u2190-\u245F\u2500-\u2775\u2794-\u2BFF\u2E00-\u2E7F\u3001-\u3003\u3008-\u3020\u3030\uFD3E\uFD3F\uFE45\uFE46]

_ 'optional whitespace' = $(patternWhiteSpace*)

number 'number' = negative:'-'? num:argNumber {
    return num 
        ? negative 
            ? -num 
            : num 
        : 0
}

apostrophe 'apostrophe' = "'"
doubleApostrophes 'double apostrophes' = "''" { return `'`; }
// Starting with ICU 4.8, an ASCII apostrophe only starts quoted text if it immediately precedes
// a character that requires quoting (that is, "only where needed"), and works the same in
// nested messages as on the top level of the pattern. The new behavior is otherwise compatible.
quotedString = "'" escapedChar:([{}]) quotedChars:$("''" / [^'])* "'" {
    return escapedChar + quotedChars.replace(`''`, `'`);
}
unquotedString = $([^{}]);

argNameOrNumber 'argNameOrNumber' = $(argNumber / argName)
argNumber 'argNumber' = '0' { return 0 }
    / digits:([1-9][0-9]*) {
        return parseInt(digits.join(''), 10);
    } 
argName 'argName' = $((!(patternWhiteSpace / patternSyntax) .)+)
