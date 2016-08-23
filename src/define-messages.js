/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

export function defineMessages(messageDescriptors) {
    // This simply returns what's passed-in because it's meant to be a hook for
    // babel-plugin-react-intl.
    return messageDescriptors;
}

export function message(strings, ...values) {
    const defaultMessage = strings.reduce((message, part, i) => {
        return message + part + (values[i] ? `${i}` : '');
    }, '');

    return {
        id: defaultMessage,
        defaultMessage,
        values,
    };
}
