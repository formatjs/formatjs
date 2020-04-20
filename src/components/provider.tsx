/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import * as React from 'react'
import {Provider} from './injectIntl'
import {
  DEFAULT_INTL_CONFIG,
  createFormatters,
  invariantIntlContext,
  createIntlCache,
} from '../utils'
import {IntlConfig, IntlShape, Omit, IntlCache} from '../types'
import {formatNumber, formatNumberToParts} from '../formatters/number'
import {formatRelativeTime} from '../formatters/relativeTime'
import {
  formatDate,
  formatTime,
  formatDateToParts,
  formatTimeToParts,
} from '../formatters/dateTime'
import {formatPlural} from '../formatters/plural'
import {formatMessage} from '../formatters/message'
import * as shallowEquals_ from 'shallow-equal/objects'
import {formatList} from '../formatters/list'
import {formatDisplayName} from '../formatters/displayName'
import {ReactIntlError, ReactIntlErrorCode} from '../error'
const shallowEquals: typeof shallowEquals_ =
  (shallowEquals_ as any).default || shallowEquals_

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
  prevConfig: OptionalIntlConfig
}

export type OptionalIntlConfig = Omit<
  IntlConfig,
  keyof typeof DEFAULT_INTL_CONFIG
> &
  Partial<typeof DEFAULT_INTL_CONFIG>

function processIntlConfig<P extends OptionalIntlConfig = OptionalIntlConfig>(
  config: P
): OptionalIntlConfig {
  return {
    locale: config.locale,
    timeZone: config.timeZone,
    formats: config.formats,
    textComponent: config.textComponent,
    messages: config.messages,
    defaultLocale: config.defaultLocale,
    defaultFormats: config.defaultFormats,
    onError: config.onError,
  }
}

/**
 * Create intl object
 * @param config intl config
 * @param cache cache for formatter instances to prevent memory leak
 */
export function createIntl(
  config: OptionalIntlConfig,
  cache?: IntlCache
): IntlShape {
  const formatters = createFormatters(cache)
  const resolvedConfig = {...DEFAULT_INTL_CONFIG, ...config}
  const {locale, defaultLocale, onError} = resolvedConfig
  if (!locale) {
    if (onError) {
      onError(
        new ReactIntlError(
          ReactIntlErrorCode.INVALID_CONFIG,
          `"locale" was not configured, using "${defaultLocale}" as fallback. See https://github.com/formatjs/react-intl/blob/master/docs/API.md#intlshape for more details`
        )
      )
    }
    // Since there's no registered locale data for `locale`, this will
    // fallback to the `defaultLocale` to make sure things can render.
    // The `messages` are overridden to the `defaultProps` empty object
    // to maintain referential equality across re-renders. It's assumed
    // each <FormattedMessage> contains a `defaultMessage` prop.
    resolvedConfig.locale = resolvedConfig.defaultLocale || 'en'
  } else if (!Intl.NumberFormat.supportedLocalesOf(locale).length && onError) {
    onError(
      new ReactIntlError(
        ReactIntlErrorCode.MISSING_DATA,
        `Missing locale data for locale: "${locale}" in Intl.NumberFormat. Using default locale: "${defaultLocale}" as fallback. See https://github.com/formatjs/react-intl/blob/master/docs/Getting-Started.md#runtime-requirements for more details`
      )
    )
  } else if (
    !Intl.DateTimeFormat.supportedLocalesOf(locale).length &&
    onError
  ) {
    onError(
      new ReactIntlError(
        ReactIntlErrorCode.MISSING_DATA,
        `Missing locale data for locale: "${locale}" in Intl.DateTimeFormat. Using default locale: "${defaultLocale}" as fallback. See https://github.com/formatjs/react-intl/blob/master/docs/Getting-Started.md#runtime-requirements for more details`
      )
    )
  }
  return {
    ...resolvedConfig,
    formatters,
    formatNumber: formatNumber.bind(
      null,
      resolvedConfig,
      formatters.getNumberFormat
    ),
    formatNumberToParts: formatNumberToParts.bind(
      null,
      resolvedConfig,
      formatters.getNumberFormat
    ),
    formatRelativeTime: formatRelativeTime.bind(
      null,
      resolvedConfig,
      formatters.getRelativeTimeFormat
    ),
    formatDate: formatDate.bind(
      null,
      resolvedConfig,
      formatters.getDateTimeFormat
    ),
    formatDateToParts: formatDateToParts.bind(
      null,
      resolvedConfig,
      formatters.getDateTimeFormat
    ),
    formatTime: formatTime.bind(
      null,
      resolvedConfig,
      formatters.getDateTimeFormat
    ),
    formatTimeToParts: formatTimeToParts.bind(
      null,
      resolvedConfig,
      formatters.getDateTimeFormat
    ),
    formatPlural: formatPlural.bind(
      null,
      resolvedConfig,
      formatters.getPluralRules
    ),
    formatMessage: formatMessage.bind(null, resolvedConfig, formatters),
    formatList: formatList.bind(null, resolvedConfig, formatters.getListFormat),
    formatDisplayName: formatDisplayName.bind(
      null,
      resolvedConfig,
      formatters.getDisplayNames
    ),
  }
}

export default class IntlProvider extends React.PureComponent<
  OptionalIntlConfig,
  State
> {
  static displayName = 'IntlProvider'
  static defaultProps = DEFAULT_INTL_CONFIG
  private cache: IntlCache = createIntlCache()
  state: State = {
    cache: this.cache,
    intl: createIntl(processIntlConfig(this.props), this.cache),
    prevConfig: processIntlConfig(this.props),
  }

  static getDerivedStateFromProps(
    props: OptionalIntlConfig,
    {prevConfig, cache}: State
  ): Partial<State> | null {
    const config = processIntlConfig(props)
    if (!shallowEquals(prevConfig, config)) {
      return {
        intl: createIntl(config, cache),
        prevConfig: config,
      }
    }
    return null
  }

  render(): JSX.Element {
    invariantIntlContext(this.state.intl)
    return <Provider value={this.state.intl}>{this.props.children}</Provider>
  }
}
