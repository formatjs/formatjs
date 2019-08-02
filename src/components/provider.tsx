/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import * as React from 'react';
import {Provider} from './injectIntl';
import {
  createError,
  DEFAULT_INTL_CONFIG,
  createFormatters,
  invariantIntlContext,
  createIntlCache,
} from '../utils';
import {IntlConfig, IntlShape, Omit, IntlCache} from '../types';
import {
  formatNumber,
  formatRelativeTime,
  formatDate,
  formatTime,
  formatPlural,
  formatHTMLMessage,
  formatMessage,
} from '../format';
import areIntlLocalesSupported from 'intl-locales-supported';
const shallowEquals = require('shallow-equal/objects');

interface State {
  /**
   * Explicit intl cache to prevent memory leaks
   */
  cache: IntlCache;
  /**
   * Intl object we created
   */
  intl?: IntlShape;
  /**
   * list of memoized props we care about.
   * This is important since creating intl is
   * very expensive
   */
  prevProps: OptionalIntlConfig;
}

export type OptionalIntlConfig = Omit<
  IntlConfig,
  keyof typeof DEFAULT_INTL_CONFIG
> &
  Partial<typeof DEFAULT_INTL_CONFIG>;

export default class IntlProvider extends React.PureComponent<
  OptionalIntlConfig,
  State
> {
  static displayName: string = 'IntlProvider';
  static defaultProps = DEFAULT_INTL_CONFIG;
  private cache: IntlCache = createIntlCache();
  state: State = {
    cache: this.cache,
    intl: undefined,
    prevProps: {
      locale: this.props.locale,
    },
  };

  static getDerivedStateFromProps(
    props: OptionalIntlConfig,
    {prevProps, cache}: State
  ) {
    const {
      locale,
      timeZone,
      formats,
      textComponent,
      messages,
      defaultLocale,
      defaultFormats,
      onError,
    } = props;
    const filteredProps: OptionalIntlConfig = {
      locale,
      timeZone,
      formats,
      textComponent,
      messages,
      defaultLocale,
      defaultFormats,
      onError,
    };
    if (!shallowEquals(prevProps, filteredProps)) {
      return {
        intl: createIntl(filteredProps, cache),
        prevProps: filteredProps,
      };
    }
    return null;
  }

  render() {
    invariantIntlContext(this.state.intl);
    return <Provider value={this.state.intl!}>{this.props.children}</Provider>;
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
  const formatters = createFormatters(cache);
  const resolvedConfig = {...DEFAULT_INTL_CONFIG, ...config};
  if (
    !resolvedConfig.locale ||
    !areIntlLocalesSupported(resolvedConfig.locale)
  ) {
    const {locale, defaultLocale, onError} = resolvedConfig;
    if (typeof onError === 'function') {
      onError(
        createError(
          `Missing locale data for locale: "${locale}". ` +
            `Using default locale: "${defaultLocale}" as fallback.`
        )
      );
    }

    // Since there's no registered locale data for `locale`, this will
    // fallback to the `defaultLocale` to make sure things can render.
    // The `messages` are overridden to the `defaultProps` empty object
    // to maintain referential equality across re-renders. It's assumed
    // each <FormattedMessage> contains a `defaultMessage` prop.
    resolvedConfig.locale = resolvedConfig.defaultLocale || 'en';
  }
  return {
    ...resolvedConfig,
    formatters,
    formatNumber: formatNumber.bind(undefined, resolvedConfig, formatters),
    formatRelativeTime: formatRelativeTime.bind(
      undefined,
      resolvedConfig,
      formatters
    ),
    formatDate: formatDate.bind(undefined, resolvedConfig, formatters),
    formatTime: formatTime.bind(undefined, resolvedConfig, formatters),
    formatPlural: formatPlural.bind(undefined, resolvedConfig, formatters),
    formatMessage: formatMessage.bind(undefined, resolvedConfig, formatters),
    formatHTMLMessage: formatHTMLMessage.bind(
      undefined,
      resolvedConfig,
      formatters
    ),
  };
}
