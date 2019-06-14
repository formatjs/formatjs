/*
HTML escaping is the same as React's
(on purpose.) Therefore, it has the following Copyright and Licensing:

Copyright 2013-2014, Facebook, Inc.
All rights reserved.

This source code is licensed under the BSD-style license found in the LICENSE
file in the root directory of React's source tree.
*/

import * as invariant_ from 'invariant';
// Since rollup cannot deal with namespace being a function,
// this is to interop with TypeScript since `invariant`
// does not export a default
// https://github.com/rollup/rollup/issues/1267
const invariant = invariant_;

const ESCAPED_CHARS: Record<number, string> = {
  38: '&amp;',
  62: '&gt;',
  60: '&lt;',
  34: '&quot;',
  39: '&#x27;',
};

const UNSAFE_CHARS_REGEX = /[&><"']/g;

export function escape(str: string): string {
  return ('' + str).replace(
    UNSAFE_CHARS_REGEX,
    match => ESCAPED_CHARS[match.charCodeAt(0)]
  );
}

export function filterProps<T extends Record<string, any>, K extends string>(
  props: T,
  whitelist: Array<K>,
  defaults: Partial<T> = {}
) {
  return whitelist.reduce(
    (filtered, name) => {
      if (props.hasOwnProperty(name)) {
        filtered[name] = props[name];
      } else if (defaults.hasOwnProperty(name)) {
        filtered[name] = defaults[name]!;
      }

      return filtered;
    },
    {} as Pick<T, K>
  );
}

export function invariantIntlContext({intl}: {intl?: any} = {}) {
  invariant(
    intl,
    '[React Intl] Could not find required `intl` object. ' +
      '<IntlProvider> needs to exist in the component ancestry.'
  );
}

export function createError(message: string, exception?: Error) {
  const eMsg = exception ? `\n${exception}` : '';
  return `[React Intl] ${message}${eMsg}`;
}

export function defaultErrorHandler(error: string) {
  if (process.env.NODE_ENV !== 'production') {
    console.error(error);
  }
}
