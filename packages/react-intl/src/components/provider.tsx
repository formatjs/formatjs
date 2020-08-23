/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import * as React from 'react';
import {Provider} from './injectIntl';
import {
  DEFAULT_INTL_CONFIG,
  invariantIntlContext,
  assignUniqueKeysToParts,
} from '../utils';
import {IntlConfig, IntlShape} from '../types';
import {
  formatMessage as coreFormatMessage,
  IntlCache,
  createIntl as coreCreateIntl,
  CreateIntlFn,
  createIntlCache,
} from '@formatjs/intl';

import * as shallowEquals_ from 'shallow-equal/objects';
import {
  PrimitiveType,
  FormatXMLElementFn,
  isFormatXMLElementFn,
} from 'intl-messageformat';
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
    wrapRichTextChunksInFragment: config.wrapRichTextChunksInFragment,
    defaultRichTextElements: config.defaultRichTextElements,
  };
}

function assignUniqueKeysToFormatXMLElementFnArgument<
  T extends Record<
    string,
    | PrimitiveType
    | React.ReactNode
    | FormatXMLElementFn<React.ReactNode, React.ReactNode>
  > = Record<
    string,
    | PrimitiveType
    | React.ReactNode
    | FormatXMLElementFn<React.ReactNode, React.ReactNode>
  >
>(values?: T): T | undefined {
  if (!values) {
    return values;
  }
  return Object.keys(values).reduce((acc: T, k) => {
    const v = values[k];
    (acc as any)[k] = isFormatXMLElementFn<React.ReactNode>(v)
      ? assignUniqueKeysToParts(v)
      : v;
    return acc;
  }, {} as T);
}

const formatMessage: typeof coreFormatMessage = (
  config,
  formatters,
  descriptor,
  rawValues
) => {
  const values = assignUniqueKeysToFormatXMLElementFnArgument(rawValues);
  const chunks = coreFormatMessage(
    config,
    formatters,
    descriptor,
    values as any
  );
  if (Array.isArray(chunks)) {
    return React.Children.toArray(chunks);
  }
  return chunks as any;
};

/**
 * Create intl object
 * @param config intl config
 * @param cache cache for formatter instances to prevent memory leak
 */
export const createIntl: CreateIntlFn<React.ReactNode> = (
  {defaultRichTextElements: rawDefaultRichTextElements, ...config},
  cache
) => {
  const defaultRichTextElements = assignUniqueKeysToFormatXMLElementFnArgument(
    rawDefaultRichTextElements
  );
  const coreIntl = coreCreateIntl<React.ReactNode>(
    {
      ...DEFAULT_INTL_CONFIG,
      ...config,
    },
    cache
  );

  return {
    ...coreIntl,
    formatMessage: formatMessage.bind(
      null,
      {
        locale: coreIntl.locale,
        timeZone: coreIntl.timeZone,
        formats: coreIntl.formats,
        defaultLocale: coreIntl.defaultLocale,
        defaultFormats: coreIntl.defaultFormats,
        messages: coreIntl.messages,
        onError: coreIntl.onError,
        defaultRichTextElements,
      },
      coreIntl.formatters
    ),
  };
};

export default class IntlProvider extends React.PureComponent<
  // Exporting children props so it is composable with other HOCs.
  // See: https://github.com/formatjs/formatjs/issues/1697
  React.PropsWithChildren<OptionalIntlConfig>,
  State
> {
  static displayName = 'IntlProvider';
  static defaultProps = DEFAULT_INTL_CONFIG;
  private cache: IntlCache = createIntlCache();
  state: State = {
    cache: this.cache,
    intl: createIntl(processIntlConfig(this.props), this.cache),
    prevConfig: processIntlConfig(this.props),
  };

  static getDerivedStateFromProps(
    props: OptionalIntlConfig,
    {prevConfig, cache}: State
  ): Partial<State> | null {
    const config = processIntlConfig(props);
    if (!shallowEquals(prevConfig, config)) {
      return {
        intl: createIntl(config, cache),
        prevConfig: config,
      };
    }
    return null;
  }

  render(): JSX.Element {
    invariantIntlContext(this.state.intl);
    return <Provider value={this.state.intl}>{this.props.children}</Provider>;
  }
}
