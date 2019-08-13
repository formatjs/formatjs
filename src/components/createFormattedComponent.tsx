import * as React from 'react';
import {invariantIntlContext} from '../utils';
import {IntlShape, FormatDateOptions, FormatNumberOptions} from '../types';
import {Context} from './injectIntl';

type FormatFunctionName = 'formatDate' | 'formatTime' | 'formatNumber';
type FormatOptions<T> = T extends 'formatDate'
  ? FormatDateOptions
  : T extends 'formatTime'
  ? FormatDateOptions
  : FormatNumberOptions;

const displayNames: {
  formatDate: 'FormattedDate';
  formatTime: 'FormattedTime';
  formatNumber: 'FormattedNumber';
} = {
  formatDate: 'FormattedDate',
  formatTime: 'FormattedTime',
  formatNumber: 'FormattedNumber',
};

export default function createFormattedComponent<T extends FormatFunctionName>(
  type: T
) {
  type FormatFn = IntlShape[T];
  type Props = FormatOptions<T> & {
    value: Parameters<FormatFn>[0];
    children?: (val: string) => React.ReactElement | null;
  };

  const Component = (props: Props) => (
    <Context.Consumer>
      {intl => {
        invariantIntlContext(intl);

        const {value, children} = props;
        const {[type]: formatFn, textComponent: Text} = intl;
        const formattedValue = formatFn(value as any, props);

        if (typeof children === 'function') {
          return children(formattedValue);
        }
        if (Text) {
          return <Text>{formattedValue}</Text>;
        }
        // Work around @types/react where React.FC cannot return string
        return <>{formattedValue as any}</>;
      }}
    </Context.Consumer>
  );
  Component.displayName = displayNames[type];
  return Component;
}
