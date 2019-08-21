import * as React from 'react';
import {invariantIntlContext} from '../utils';
import {IntlShape, FormatDateOptions, FormatNumberOptions} from '../types';
import {Context} from './injectIntl';
import {formatDateFactory, formatTimeFactory} from '../formatters/dateTime';
import {formatNumberFactory} from '../formatters/number';
// Since rollup cannot deal with namespace being a function,
// this is to interop with TypeScript since `invariant`
// does not export a default
// https://github.com/rollup/rollup/issues/1267
import * as invariant_ from 'invariant';
const invariant: typeof invariant_ = (invariant_ as any).default || invariant_;

enum DisplayName {
  formatDate = 'FormattedDate',
  formatTime = 'FormattedTime',
  formatNumber = 'FormattedNumber',
}

type Formatter = {
  formatDate: FormatDateOptions;
  formatTime: FormatDateOptions;
  formatNumber: FormatNumberOptions;
};

export default function createFormattedComponent<Name extends keyof Formatter>(
  name: Name
) {
  type Options = Formatter[Name];
  type FormatFn = IntlShape[Name];
  type Props = Options & {
    shouldFormatToParts?: boolean;
    value: Parameters<FormatFn>[0];
    children?: (val: string) => React.ReactElement | null;
  };

  const Component: React.FC<Props> = props => (
    <Context.Consumer>
      {intl => {
        invariantIntlContext(intl);
        let formattedParts;
        if (props.shouldFormatToParts) {
          if (name === 'formatDate') {
            formattedParts = formatDateFactory(
              intl,
              intl.formatters.getDateTimeFormat
            )(props.value, props);
          } else if (name === 'formatTime') {
            formattedParts = formatTimeFactory(
              intl,
              intl.formatters.getDateTimeFormat
            )(props.value, props);
          } else {
            formattedParts = formatNumberFactory(
              intl,
              intl.formatters.getNumberFormat
            )(props.value as number, props);
          }
          invariant(
            typeof props.children === 'function',
            'render props must be a function when `shouldFormatToParts` is `true`'
          );
          return props.children!(formattedParts);
        }
        const formattedValue = intl[name](props.value as any, props);

        if (typeof props.children === 'function') {
          return props.children(formattedValue);
        }
        const Text = intl.textComponent || React.Fragment;
        return <Text>{formattedValue}</Text>;
      }}
    </Context.Consumer>
  );
  Component.displayName = DisplayName[name];
  return Component;
}
