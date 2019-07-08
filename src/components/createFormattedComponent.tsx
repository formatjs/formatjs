import * as React from 'react';
import {IntlShape, FormatDateOptions, FormatNumberOptions} from '../types';
import withIntl from './injectIntl';

export default function createFormattedComponent<
  T extends 'formatDate' | 'formatTime' | 'formatNumber'
>(type: T) {
  type FormatOptions<T> = T extends 'formatDate'
    ? FormatDateOptions
    : T extends 'formatTime'
    ? FormatDateOptions
    : FormatNumberOptions;
  type FormatFn = IntlShape[T];
  type Props = FormatOptions<T> & {
    value: Parameters<FormatFn>[0];
    intl: IntlShape;
    children?(val: string): React.ReactElement | null;
  };
  const Component: React.FC<Props> = props => {
    const {
      value,
      children,
      intl: {[type]: formatFn, textComponent: Text},
    } = props;

    let formattedValue = formatFn(value as any, props);

    if (typeof children === 'function') {
      return children(formattedValue);
    }
    if (Text) {
      return <Text>{formattedValue}</Text>;
    }
    // Work around @types/react where React.FC cannot return string
    return formattedValue as any;
  };
  Component.displayName =
    type === 'formatDate'
      ? 'FormattedDate'
      : type === 'formatTime'
      ? 'FormattedTime'
      : 'FormattedNumber';
  return {
    BaseComponent: Component,
    Component: withIntl(Component),
  };
}
