import * as React from 'react';
import {invariantIntlContext} from '../utils';
import {IntlShape, FormatDateOptions, FormatNumberOptions} from '../types';
import {Context} from './injectIntl';

const displayNames: {
  formatDate: 'FormattedDate';
  formatTime: 'FormattedTime';
  formatNumber: 'FormattedNumber';
} = {
  formatDate: 'FormattedDate',
  formatTime: 'FormattedTime',
  formatNumber: 'FormattedNumber',
};

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
    value: Parameters<FormatFn>[0];
    children?: (val: string) => React.ReactElement | null;
  };

  const Component = (props: Props) => (
    <Context.Consumer>
      {intl => {
        invariantIntlContext(intl);

        const formattedValue = intl[name](props.value as any, props);

        if (typeof props.children === 'function') {
          return props.children(formattedValue);
        }
        if (intl.textComponent) {
          return <intl.textComponent>{formattedValue}</intl.textComponent>;
        }
        // Work around @types/react where React.FC cannot return string
        return <>{formattedValue}</>;
      }}
    </Context.Consumer>
  );
  Component.displayName = displayNames[name];
  return Component;
}
