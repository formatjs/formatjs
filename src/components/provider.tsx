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
import areIntlLocalesSupported from 'intl-locales-supported';
import {formatNumberFactory} from '../formatters/number';
import {formatRelativeTimeFactory} from '../formatters/relativeTime';
import {formatDateFactory, formatTimeFactory} from '../formatters/dateTime';
import {formatPluralFactory} from '../formatters/plural';
import {formatMessage, formatHTMLMessage} from '../formatters/message';
import * as shallowEquals_ from 'shallow-equal/objects';
const shallowEquals: typeof shallowEquals_ =
  (shallowEquals_ as any).default || shallowEquals_;

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
   * list of memoized config we care about.
   * This is important since creating intl is
   * very expensive
   */
  prevConfig: OptionalIntlConfig;
}

export type OptionalIntlConfig = Omit<
  IntlConfig,
  keyof typeof DEFAULT_INTL_CONFIG
> &
  Partial<typeof DEFAULT_INTL_CONFIG>;

function filterIntlConfig<P extends OptionalIntlConfig = OptionalIntlConfig>(
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
  };
}

export default class IntlProvider extends React.PureComponent<
  OptionalIntlConfig,
  State
> {
  static displayName: string = 'IntlProvider';
  static defaultProps = DEFAULT_INTL_CONFIG;
  private cache: IntlCache = createIntlCache();
  state: State = {
    cache: this.cache,
    intl: createIntl(filterIntlConfig(this.props), this.cache),
    prevConfig: filterIntlConfig(this.props),
  };

  static getDerivedStateFromProps(
    props: OptionalIntlConfig,
    {prevConfig, cache}: State
  ): Partial<State> | null {
    const config = filterIntlConfig(props);
    if (!shallowEquals(prevConfig, config)) {
      return {
        intl: createIntl(config, cache),
        prevConfig: config,
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
    formatNumber: formatNumberFactory(
      resolvedConfig,
      formatters.getNumberFormat
    ),
    formatRelativeTime: formatRelativeTimeFactory(
      resolvedConfig,
      formatters.getRelativeTimeFormat
    ),
    formatDate: formatDateFactory(resolvedConfig, formatters.getDateTimeFormat),
    formatTime: formatTimeFactory(resolvedConfig, formatters.getDateTimeFormat),
    formatPlural: formatPluralFactory(
      resolvedConfig,
      formatters.getPluralRules
    ),
    formatMessage: formatMessage.bind(null, resolvedConfig, formatters),
    formatHTMLMessage: formatHTMLMessage.bind(null, resolvedConfig, formatters),
  };
}
