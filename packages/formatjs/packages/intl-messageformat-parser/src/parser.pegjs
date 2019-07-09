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

simpleFormatElement 
    = '{' _ value:varName _ ',' _ type:('number' / 'date' / 'time') _ style:(',' _ chars)? _ '}' {
        return {
            type    : type === 'number' ? TYPE.number : type === 'date' ? TYPE.date : TYPE.time,
            style   : style && style[2],
            value,
            ...insertLocation()
        };
    }

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
    = '=0'
    / '=1'
    / '=2'
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
