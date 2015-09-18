/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import {parse} from 'intl-messageformat-parser';

export default function (message) {
    let ast = parse(message);
    return printICUMessage(ast);
}

function printICUMessage(ast) {
    let printedNodes = ast.elements.map((node) => {
        if (node.type === 'messageTextElement') {
            return node.value;
        }

        if (!node.format) {
            return `{${node.id}}`;
        }

        switch (getArgumentType(node.format.type)) {
        case 'number':
        case 'date':
        case 'time':
            return printSimpleFormatASTNode(node);

        case 'plural':
        case 'selectordinal':
        case 'select':
            return printOptionalFormatASTNode(node);
        }
    });

    return printedNodes.join('');
}

function getArgumentType(astType) {
    return astType.replace(/Format$/, '').toLowerCase();
}

function printSimpleFormatASTNode(node) {
    let {id, format} = node;
    let argumentType = getArgumentType(format.type);
    let style = format.style ? `, ${format.style}` : '';

    return `{${id}, ${argumentType}${style}}`;
}

function printOptionalFormatASTNode(node) {
    let {id, format} = node;
    let argumentType = getArgumentType(format.type);
    let offset = format.offset ? `, offset:${format.offset}` : '';

    let options = format.options.map((option) => {
        let optionValue = printICUMessage(option.value);
        return ` ${option.selector} {${optionValue}}`;
    });

    return `{${id}, ${argumentType}${offset},${options.join('')}}`;
}
