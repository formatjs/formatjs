import {IntlConfig} from './types';
import * as React from 'react';
import {FormatXMLElementFn} from 'intl-messageformat';
import {invariant} from '@formatjs/ecma402-abstract';

import {DEFAULT_INTL_CONFIG as CORE_DEFAULT_INTL_CONFIG} from '@formatjs/intl';

export function invariantIntlContext(intl?: any): asserts intl {
  invariant(
    intl,
    '[React Intl] Could not find required `intl` object. ' +
      '<IntlProvider> needs to exist in the component ancestry.'
  );
}

export const DEFAULT_INTL_CONFIG: Pick<
  IntlConfig,
  | 'formats'
  | 'messages'
  | 'timeZone'
  | 'textComponent'
  | 'defaultLocale'
  | 'defaultFormats'
  | 'onError'
> = {
  ...CORE_DEFAULT_INTL_CONFIG,
  textComponent: React.Fragment,
};

/**
 * Takes a `formatXMLElementFn`, and composes it in function, which passes
 * argument `parts` through, assigning unique key to each part, to prevent
 * "Each child in a list should have a unique "key"" React error.
 * @param formatXMLElementFn
 */
export function assignUniqueKeysToParts(
  formatXMLElementFn: FormatXMLElementFn<React.ReactNode>
): FormatXMLElementFn<React.ReactNode> {
  return function (parts: any) {
    // eslint-disable-next-line prefer-rest-params
    return formatXMLElementFn(React.Children.toArray(parts)) as any;
  };
}
