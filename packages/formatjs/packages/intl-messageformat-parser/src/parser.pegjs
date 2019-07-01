/*
Copyright 2014, Yahoo! Inc. All rights reserved.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.
*/

/*
Inspired by and derivied from:
messageformat.js https://github.com/SlexAxton/messageformat.js
Copyright 2014 Alex Sexton
Apache License, Version 2.0
*/

start
    = messageFormatPattern

messageFormatPattern
    = elements:messageFormatElement* {
        return {
            type    : 'messageFormatPattern',
            elements: elements,
            location: location()
        };
    }

messageFormatElement
    = messageTextElement
    / argumentElement

messageText
    = chunks:(_ chars _)+ {
        return chunks.reduce(function (all, chunk) {
            return all.concat(chunk)
        }, []).join('')
    }
    / $(ws)

messageTextElement
    = messageText:messageText {
        return {
            type : 'messageTextElement',
            value: messageText,
            location: location()
        };
    }

argument
    = number
    / chars:quoteEscapedChar* { return chars.join(''); }
    
argumentElement
    = '{' _ id:argument _ format:(',' _ elementFormat)? _ '}' {
        return {
            type  : 'argumentElement',
            id    : id,
            format: format && format[2],
            location: location()
        };
    }

elementFormat
    = simpleFormat
    / pluralFormat
    / selectOrdinalFormat
    / selectFormat

simpleFormat
    = type:('number' / 'date' / 'time') _ style:(',' _ chars)? {
        return {
            type : type + 'Format',
            style: style && style[2],
            location: location()
        };
    }

pluralFormat
    = 'plural' _ ',' _ pluralStyle:pluralStyle {
        return {
            type   : pluralStyle.type,
            ordinal: false,
            offset : pluralStyle.offset || 0,
            options: pluralStyle.options,
            location: location()
        };
    }

selectOrdinalFormat
    = 'selectordinal' _ ',' _ pluralStyle:pluralStyle {
        return {
            type   : pluralStyle.type,
            ordinal: true,
            offset : pluralStyle.offset || 0,
            options: pluralStyle.options,
            location: location()
        }
    }

selectFormat
    = 'select' _ ',' _ options:optionalFormatPattern+ {
        return {
            type   : 'selectFormat',
            options: options,
            location: location()
        };
    }

selector
    = $('=' number)
    / chars

optionalFormatPattern
    = _ selector:selector _ '{' pattern:messageFormatPattern '}' {
        return {
            type    : 'optionalFormatPattern',
            selector: selector,
            value   : pattern,
            location: location()
        };
    }

offset
    = 'offset:' _ number:number {
        return number;
    }

pluralStyle
    = offset:offset? _ options:optionalFormatPattern+ {
        return {
            type   : 'pluralFormat',
            offset : offset,
            options: options,
            location: location()
        };
    }

// -- Helpers ------------------------------------------------------------------

ws 'whitespace' = [ \t\n\r]+
_ 'optionalWhitespace' = $(ws*)

digit    = [0-9]
hexDigit = [0-9a-f]i

number = digits:('0' / $([1-9] digit*)) {
    return parseInt(digits, 10);
}

quoteEscapedChar = 
  !("'" / [ \t\n\r,.+={}#]) char:. { return char; }
  / "'" sequence:escape { return sequence; }
 
apostrophe = "'"
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
