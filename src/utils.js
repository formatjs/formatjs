/*
HTML escaping and shallow-equals implementations are the same as React's
(on purpose.) Therefore, it has the following Copyright and Licensing:

Copyright 2013-2014, Facebook, Inc.
All rights reserved.

This source code is licensed under the BSD-style license found in the LICENSE
file in the root directory of React's source tree.
*/

const ESCAPED_CHARS = {
    '&' : '&amp;',
    '>' : '&gt;',
    '<' : '&lt;',
    '"' : '&quot;',
    '\'': '&#x27;',
};

const UNSAFE_CHARS_REGEX = /[&><"']/g;

export function escape(str) {
    return ('' + str).replace(UNSAFE_CHARS_REGEX, (match) => ESCAPED_CHARS[match]);
}

export function shallowEquals(objA, objB) {
    if (objA === objB) {
        return true;
    }

    if (typeof objA !== 'object' || objA === null ||
        typeof objB !== 'object' || objB === null) {
        return false;
    }

    let keysA = Object.keys(objA);
    let keysB = Object.keys(objB);

    if (keysA.length !== keysB.length) {
        return false;
    }

    // Test for A's keys different from B.
    let bHasOwnProperty = Object.prototype.hasOwnProperty.bind(objB);
    for (let i = 0; i < keysA.length; i++) {
        if (!bHasOwnProperty(keysA[i]) || objA[keysA[i]] !== objB[keysA[i]]) {
            return false;
        }
    }

    return true;
}

export function shouldIntlComponentUpdate(instance, nextProps, nextState, nextContext = {}) {
    const context  = instance.context || {};
    const intl     = context.intl || {};
    const nextIntl = nextContext.intl || {};

    return (
        !shallowEquals(nextProps, instance.props) ||
        !shallowEquals(nextState, instance.state) ||
        !shallowEquals(nextIntl, intl)
    );
}
