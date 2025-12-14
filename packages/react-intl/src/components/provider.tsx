/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import {IntlCache, createIntlCache} from '@formatjs/intl'
import * as React from 'react'
import type {IntlConfig, IntlShape} from '../types.js'
import {
  DEFAULT_INTL_CONFIG,
  DefaultIntlConfig,
  invariantIntlContext,
  shallowEqual,
} from '../utils.js'
import {createIntl} from './createIntl.js'
import {Provider} from './injectIntl.js'

interface State {
  /**
   * Explicit intl cache to prevent memory leaks
   */
  cache: IntlCache
  /**
   * Intl object we created
   */
  intl?: IntlShape
  /**
   * list of memoized config we care about.
   * This is important since creating intl is
   * very expensive
   */
  prevConfig: IntlConfig
}

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

export default class IntlProvider extends React.PureComponent<
  // Exporting children props so it is composable with other HOCs.
  // See: https://github.com/formatjs/formatjs/issues/1697
  React.PropsWithChildren<IntlConfig>,
  State
> {
  static displayName = 'IntlProvider'
  static defaultProps: DefaultIntlConfig = DEFAULT_INTL_CONFIG
  private cache: IntlCache = createIntlCache()
  state: State = {
    cache: this.cache,
    intl: createIntl(processIntlConfig(this.props), this.cache),
    prevConfig: processIntlConfig(this.props),
  }

  static getDerivedStateFromProps(
    props: Readonly<IntlConfig>,
    {prevConfig, cache}: State
  ): Partial<State> | null {
    const config = processIntlConfig(props)
    if (!shallowEqual(prevConfig, config)) {
      return {
        intl: createIntl(config, cache),
        prevConfig: config,
      }
    }
    return null
  }

  render(): React.JSX.Element {
    invariantIntlContext(this.state.intl)
    return <Provider value={this.state.intl}>{this.props.children}</Provider>
  }
}
