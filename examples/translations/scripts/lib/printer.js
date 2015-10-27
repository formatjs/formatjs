const ESCAPED_CHARS = {
    '\\' : '\\\\',
    '\\#': '\\#',
    '{'  : '\\{',
    '}'  : '\\}',
};

const ESAPE_CHARS_REGEXP = /\\#|[{}\\]/g;

export default function printICUMessage(ast) {
    return ast.elements.reduce((message, el) => {
        let {format, id, type, value} = el;

        if (type === 'messageTextElement') {
            return message + value.replace(ESAPE_CHARS_REGEXP, (char) => {
                return ESCAPED_CHARS[char];
            });
        }

        if (!format) {
            return message + `{${id}}`;
        }

        let formatType = format.type.replace(/Format$/, '');

        switch (formatType) {
        case 'number':
        case 'date':
        case 'time':
            let style = format.style ? `, ${format.style}` : '';
            return message + `{${id}, ${formatType}${style}}`;

        case 'plural':
        case 'selectOrdinal':
        case 'select':
            let offset = format.offset ? `, offset:${format.offset}` : '';
            let options = format.options.reduce((str, option) => {
                let optionValue = printICUMessage(option.value);
                return str + ` ${option.selector} {${optionValue}}`;
            }, '');
            return message + `{${id}, ${formatType}${offset},${options}}`;
        }
    }, '');
}
