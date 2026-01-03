import {type FormatXMLElementFn} from 'intl-messageformat'
import * as React from 'react'
import {type ResolvedIntlConfig} from './types.js'

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

export type DefaultIntlConfig = Pick<
  ResolvedIntlConfig,
  | 'fallbackOnEmptyString'
  | 'formats'
  | 'messages'
  | 'timeZone'
  | 'textComponent'
  | 'defaultLocale'
  | 'defaultFormats'
  | 'onError'
>

export const DEFAULT_INTL_CONFIG: DefaultIntlConfig = {
  ...CORE_DEFAULT_INTL_CONFIG,
  textComponent: React.Fragment,
}

/**
 * Builds an array of {@link React.ReactNode}s with index-based keys, similar to
 * {@link React.Children.toArray}. However, this function tells React that it
 * was intentional, so they won't produce a bunch of warnings about it.
 *
 * React doesn't recommend doing this because it makes reordering inefficient,
 * but we mostly need this for message chunks, which don't tend to reorder to
 * begin with.
 *
 */
export const toKeyedReactNodeArray: typeof React.Children.toArray =
  children => {
    const childrenArray = React.Children.toArray(children)

    return childrenArray.map((child, index) => {
      // For React elements, wrap in a keyed Fragment
      // This creates a new element with a key rather than trying to add one after creation
      if (React.isValidElement(child)) {
        return <React.Fragment key={index}>{child}</React.Fragment>
      }
      return child
    })
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
    return formatXMLElementFn(toKeyedReactNodeArray(parts)) as any
  }
}

export function shallowEqual<
  T extends Record<string, unknown> = Record<string, unknown>,
>(objA?: T, objB?: T): boolean {
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
