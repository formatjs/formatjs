import * as React from 'react';
import {invariantIntlContext} from '../utils';
import {IntlShape, FormatDateOptions, FormatNumberOptions} from '../types';
import {Context} from './injectIntl';

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
    value: Parameters<FormatFn>[0];
    children?: (val: string) => React.ReactElement | null;
  };

  const Component: React.FC<Props> = props => (
    <Context.Consumer>
      {intl => {
        invariantIntlContext(intl);

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
