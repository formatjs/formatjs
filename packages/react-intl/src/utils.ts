import {FormatXMLElementFn} from 'intl-messageformat'
import * as React from 'react'
import {ResolvedIntlConfig} from './types'

import {DEFAULT_INTL_CONFIG as CORE_DEFAULT_INTL_CONFIG} from '@formatjs/intl'

export function invariant(
  condition: boolean,
  message: string,
  Err: any = Error
): asserts condition {
  if (!condition) {
    throw new Err(message)
  }
}

export function invariantIntlContext(intl?: any): asserts intl {
  invariant(
    intl,
    '[React Intl] Could not find required `intl` object. ' +
      '<IntlProvider> needs to exist in the component ancestry.'
  )
}

export const DEFAULT_INTL_CONFIG: Pick<
  ResolvedIntlConfig,
  | 'fallbackOnEmptyString'
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
}

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
    return formatXMLElementFn(React.Children.toArray(parts)) as any
  }
}

export function shallowEqual<
  T extends Record<string, unknown> = Record<string, unknown>,
>(objA?: T, objB?: T) {
  if (objA === objB) {
    return true
  }

  if (!objA || !objB) {
    return false
  }

  var aKeys = Object.keys(objA)
  var bKeys = Object.keys(objB)
  var len = aKeys.length

  if (bKeys.length !== len) {
    return false
  }

  for (var i = 0; i < len; i++) {
    var key = aKeys[i]

    if (
      objA[key] !== objB[key] ||
      !Object.prototype.hasOwnProperty.call(objB, key)
    ) {
      return false
    }
  }

  return true
}
