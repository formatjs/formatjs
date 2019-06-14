/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import * as React from 'react';
import withIntl, {Provider, WrappedComponentProps} from './withIntl';
import IntlMessageFormat from 'intl-messageformat';
import IntlRelativeFormat from 'intl-relativeformat';
import memoizeIntlConstructor from 'intl-format-cache';
import * as invariant_ from 'invariant';
// Since rollup cannot deal with namespace being a function,
// this is to interop with TypeScript since `invariant`
// does not export a default
// https://github.com/rollup/rollup/issues/1267
const invariant = invariant_;
import {createError, filterProps, DEFAULT_INTL_CONFIG} from '../utils';
import {IntlConfig, IntlShape, IntlFormatters} from '../types';
import {formatters} from '../format';
import areIntlLocalesSupported from 'intl-locales-supported';
import * as shallowEquals_ from 'shallow-equal/objects';
const shallowEquals = shallowEquals_;

const intlConfigPropNames: Array<keyof IntlConfig> = [
  'locale',
  'timeZone',
  'formats',
  'messages',
  'textComponent',

  'defaultLocale',
  'defaultFormats',

  'onError',
];
const intlFormatPropNames: Array<keyof IntlFormatters> = [
  'formatDate',
  'formatTime',
  'formatRelative',
  'formatNumber',
  'formatPlural',
  'formatMessage',
  'formatHTMLMessage',
];

function getConfig(filteredProps: OptionalIntlConfig): IntlConfig {
  let config: IntlConfig = {
    ...DEFAULT_INTL_CONFIG,
    ...filteredProps,
  };

  // Apply default props. This must be applied last after the props have
  // been resolved and inherited from any <IntlProvider> in the ancestry.
  // This matches how React resolves `defaultProps`.
  for (const propName in DEFAULT_INTL_CONFIG) {
    if (config[propName as 'timeZone'] === undefined) {
      config[propName as 'timeZone'] =
        DEFAULT_INTL_CONFIG[propName as 'timeZone'];
    }
  }

  if (!config.locale || !areIntlLocalesSupported(config.locale)) {
    const {locale, defaultLocale, defaultFormats, onError} = config;
    if (typeof onError === 'function')
      onError(
        createError(
          `Missing locale data for locale: "${locale}". ` +
            `Using default locale: "${defaultLocale}" as fallback.`
        )
      );

    // Since there's no registered locale data for `locale`, this will
    // fallback to the `defaultLocale` to make sure things can render.
    // The `messages` are overridden to the `defaultProps` empty object
    // to maintain referential equality across re-renders. It's assumed
    // each <FormattedMessage> contains a `defaultMessage` prop.
    config = {
      ...config,
      locale: defaultLocale,
      formats: defaultFormats,
      messages: DEFAULT_INTL_CONFIG.messages,
    };
  }

  return config;
}

function getBoundFormatFns(config: IntlConfig, state: State) {
  const formatterState = {...state.context.formatters, now: state.context.now};

  return intlFormatPropNames.reduce(
    (boundFormatFns: IntlFormatters, name) => {
      boundFormatFns[name] = (formatters[name] as any).bind(
        undefined,
        config,
        formatterState
      );
      return boundFormatFns;
    },
    {} as any
  ) as IntlFormatters;
}

interface InternalProps {
  children: React.ElementType<any>;
  initialNow?: number;
}

type Props = IntlConfig & WrappedComponentProps & InternalProps;

interface State {
  context: IntlShape;
  filteredProps?: IntlConfig;
}

type OptionalIntlConfig = Omit<IntlConfig, keyof typeof DEFAULT_INTL_CONFIG> &
  Partial<typeof DEFAULT_INTL_CONFIG>;

type ResolvedProps = WrappedComponentProps & InternalProps & OptionalIntlConfig;

class IntlProvider extends React.PureComponent<ResolvedProps, State> {
  private _didDisplay?: boolean;
  constructor(props: ResolvedProps) {
    super(props);

    invariant(
      typeof Intl !== 'undefined',
      '[React Intl] The `Intl` APIs must be available in the runtime, ' +
        'and do not appear to be built-in. An `Intl` polyfill should be loaded.\n' +
        'See: http://formatjs.io/guides/runtime-environments/'
    );

    const {intl: intlContext} = props;

    // Used to stabilize time when performing an initial rendering so that
    // all relative times use the same reference "now" time.
    let initialNow: number;
    if (isFinite(props.initialNow || Infinity)) {
      initialNow = Number(props.initialNow);
    } else {
      // When an `initialNow` isn't provided via `props`, look to see an
      // <IntlProvider> exists in the ancestry and call its `now()`
      // function to propagate its value for "now".
      initialNow = intlContext ? intlContext.now() : Date.now();
    }

    // Creating `Intl*` formatters is expensive. If there's a parent
    // `<IntlProvider>`, then its formatters will be used. Otherwise, this
    // memoize the `Intl*` constructors and cache them for the lifecycle of
    // this IntlProvider instance.
    const {
      formatters = {
        getDateTimeFormat: memoizeIntlConstructor(Intl.DateTimeFormat),
        getNumberFormat: memoizeIntlConstructor(Intl.NumberFormat),
        getMessageFormat: memoizeIntlConstructor(IntlMessageFormat),
        getRelativeFormat: memoizeIntlConstructor(IntlRelativeFormat),
        getPluralRules: memoizeIntlConstructor(Intl.PluralRules),
      },
    } = intlContext || {};

    this.state = {
      context: {
        ...intlContext!,
        formatters,

        // Wrapper to provide stable "now" time for initial render.
        now: () => {
          return this._didDisplay ? Date.now() : initialNow;
        },
      },
    };
  }

  static getDerivedStateFromProps(nextProps: ResolvedProps, prevState: State) {
    const {intl: intlContext} = nextProps;

    // Build a whitelisted config object from `props`, defaults, and
    // `props.intl`, if an <IntlProvider> exists in the ancestry.
    const filteredProps = filterProps(
      nextProps,
      intlConfigPropNames,
      intlContext || {}
    );

    if (!shallowEquals(filteredProps, prevState.filteredProps)) {
      const config = getConfig(filteredProps);
      const boundFormatFns = getBoundFormatFns(config, prevState);

      return {
        filteredProps,
        context: {
          ...prevState.context,
          ...config,
          ...boundFormatFns,
        },
      };
    }

    return null;
  }

  getContext() {
    return this.state.context;
  }

  componentDidMount() {
    this._didDisplay = true;
  }

  render() {
    return (
      <Provider value={this.getContext()}>
        {React.Children.only(this.props.children)}
      </Provider>
    );
  }
}

export default withIntl(IntlProvider, {enforceContext: false}); // to be able to inherit values from parent providers
