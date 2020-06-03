/*
Copyright 2014, Yahoo! Inc. All rights reserved.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.
*/

/*
 * IMPORTANT: `TYPE` comes from `types.ts`
 */

{
    const messageCtx = ['root'];

    function isNestedMessageText() {
        return messageCtx.length > 1;
    }

    function isInPluralOption() {
        return messageCtx[messageCtx.length - 1] === 'plural';
    }

    function insertLocation() {
        return options && options.captureLocation ? {
            location: location()
        }: {}
    }

    function ignoreTag() {
        return options && options.ignoreTag;
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
    / tagElement
    // Note: this is only possible when immediately in plural argument's option.
    / poundElement

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

poundElement = '#' {
    return {
        type: TYPE.pound,
        ...insertLocation()
    };
}

tagElement 'tagElement'
    = 
    // Special case for self-closing. We treat it as regular text
    value:('<' validTag _ '/>') { 
        return {
            type: TYPE.literal,
            value: value.join(''),
            ...insertLocation()
        }
    }
    / open:openingTag children:message close:closingTag {
        if (open !== close) {
           error(`Mismatch tag "${open}" !== "${close}"`, location()) 
        }
        return {
            type: TYPE.tag,
            value: open,
            children,
            ...insertLocation()
        }
    }

openingTag = '<' &{ messageCtx.push('openingTag'); return true; } tag:validTag '>' &{ messageCtx.pop(); return true; } {
    return tag
}

closingTag = '</' &{ messageCtx.push('closingTag'); return true; } tag:validTag '>' &{ messageCtx.pop(); return true; } {
    return tag
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
    = $(!(whiteSpace / [\'\/{}]) .)+

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
    / &{ messageCtx.push('numberArgStyle'); return true; } style:messageText {
          messageCtx.pop();
          return style.replace(/\s*$/, '');
      }

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
    / &{ messageCtx.push('dateOrTimeArgStyle'); return true; } style:messageText {
          messageCtx.pop();
          return style.replace(/\s*$/, '');
      }

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
            options: options.reduce((all, {id, value, location: optionLocation}) => {
                if (id in all) {
                    error(`Duplicate option "${id}" in plural element: "${text()}"`, location())
                }
                all[id] = {
                    value,
                    location: optionLocation
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
            options: options.reduce((all, {id, value, location: optionLocation}) => {
                if (id in all) {
                    error(`Duplicate option "${id}" in select element: "${text()}"`, location())
                }
                all[id] = {
                    value,
                    location: optionLocation
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
    = _ id:argName _ '{' &{ messageCtx.push('select'); return true; } value:message '}' {
        messageCtx.pop();
        return {
            id,
            value,
            ...insertLocation()
        }
    }

pluralOption
    = _ id:pluralRuleSelectValue _ '{' &{ messageCtx.push('plural'); return true; } value:message '}' {
        messageCtx.pop();
        return {
            id,
            value,
            ...insertLocation()
        };
    }

// -- Helpers ------------------------------------------------------------------

// Equivalence of \p{White_Space}
// See: https://github.com/mathiasbynens/unicode-12.1.0/blob/master/Binary_Property/White_Space/regex.js
whiteSpace 'whitespace' = [\t-\r \x85\xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]
// Equivalence of \p{Pattern_Syntax}
// See: https://github.com/mathiasbynens/unicode-11.0.0/blob/master/Binary_Property/Pattern_Syntax/regex.js
patternSyntax 'syntax pattern' = [!-\/:-@\[-\^`\{-~\xA1-\xA7\xA9\xAB\xAC\xAE\xB0\xB1\xB6\xBB\xBF\xD7\xF7\u2010-\u2027\u2030-\u203E\u2041-\u2053\u2055-\u205E\u2190-\u245F\u2500-\u2775\u2794-\u2BFF\u2E00-\u2E7F\u3001-\u3003\u3008-\u3020\u3030\uFD3E\uFD3F\uFE45\uFE46]

_ 'optional whitespace' = $(whiteSpace*)

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
quotedString = "'" escapedChar:escapedChar quotedChars:$("''" / [^'])* "'"? {
    return escapedChar + quotedChars.replace(`''`, `'`);
}

unquotedString = $(x:. &{
    return (
        (ignoreTag() || x !== '<') &&
        x !== '{' &&
        !(isInPluralOption() && x === '#') &&
        !(isNestedMessageText() && x === '}') &&
        !(!ignoreTag() && isNestedMessageText() && x === '>')
    );
} / '\n')

escapedChar = $(x:. &{
    return x === '<' || x === '>' || x === '{' || x === '}' || (isInPluralOption() && x === '#');
})

argNameOrNumber 'argNameOrNumber' = $(argNumber / argName)
validTag 'validTag' = $(argNumber / tagName)
argNumber 'argNumber' = '0' { return 0 }
    / digits:([1-9][0-9]*) {
        return parseInt(digits.join(''), 10);
    }
argName 'argName' = $((!(whiteSpace / patternSyntax).)+)
tagName 'tagName' = $(('-' / (!(whiteSpace / patternSyntax).))+) 
