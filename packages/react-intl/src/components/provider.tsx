/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import {type IntlCache, createIntlCache} from '@formatjs/intl'
import * as React from 'react'
import type {IntlConfig, IntlShape} from '../types.js'
import {
  DEFAULT_INTL_CONFIG,
  invariantIntlContext,
  shallowEqual,
} from '../utils.js'
import {createIntl} from './createIntl.js'
import {Provider} from './context.js'

function processIntlConfig<P extends IntlConfig = IntlConfig>(
  config: P
): IntlConfig {
  return {
    locale: config.locale,
    timeZone: config.timeZone,
    fallbackOnEmptyString: config.fallbackOnEmptyString,
    formats: config.formats,
    textComponent: config.textComponent,
    messages: config.messages,
    defaultLocale: config.defaultLocale,
    defaultFormats: config.defaultFormats,
    onError: config.onError,
    onWarn: config.onWarn,
    wrapRichTextChunksInFragment: config.wrapRichTextChunksInFragment,
    defaultRichTextElements: config.defaultRichTextElements,
  }
}

function IntlProviderImpl(
  props: React.PropsWithChildren<IntlConfig>
): React.JSX.Element {
  const cacheRef = React.useRef<IntlCache>(createIntlCache())
  const prevConfigRef = React.useRef<IntlConfig | undefined>(undefined)
  const intlRef = React.useRef<IntlShape | undefined>(undefined)

  // Filter out undefined values from props so they don't override defaults.
  // React's defaultProps treated `prop={undefined}` as "not provided"; we
  // replicate that behaviour here after converting to a function component.
  const filteredProps: Record<string, unknown> = {}
  for (const key in props) {
    if ((props as any)[key] !== undefined) {
      filteredProps[key] = (props as any)[key]
    }
  }
  const config = processIntlConfig({
    ...DEFAULT_INTL_CONFIG,
    ...filteredProps,
  } as IntlConfig)

  if (!prevConfigRef.current || !shallowEqual(prevConfigRef.current, config)) {
    prevConfigRef.current = config
    intlRef.current = createIntl(config, cacheRef.current)
  }

  invariantIntlContext(intlRef.current)
  return <Provider value={intlRef.current}>{props.children}</Provider>
}

IntlProviderImpl.displayName = 'IntlProvider'

const IntlProvider: React.FC<React.PropsWithChildren<IntlConfig>> =
  IntlProviderImpl
export default IntlProvider
