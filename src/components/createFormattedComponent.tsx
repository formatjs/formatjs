import * as React from 'react';
import {invariantIntlContext} from '../utils';
import {IntlShape, FormatDateOptions, FormatNumberOptions} from '../types';
import {Context} from './injectIntl';

enum DisplayName {
  formatDate = 'FormattedDate',
  formatTime = 'FormattedTime',
  formatNumber = 'FormattedNumber',
}

enum DisplayNameParts {
  formatDate = 'FormattedDateParts',
  formatTime = 'FormattedTimeParts',
  formatNumber = 'FormattedNumberParts',
}

type Formatter = {
  formatDate: FormatDateOptions;
  formatTime: FormatDateOptions;
  formatNumber: FormatNumberOptions;
};

export const FormattedNumberParts: React.FC<
  Formatter['formatNumber'] & {
    value: Parameters<IntlShape['formatNumber']>[0];

    children(val: Intl.NumberFormatPart[]): React.ReactElement | null;
  }
> = props => (
  <Context.Consumer>
    {intl => {
      invariantIntlContext(intl);
      const {value, children, ...formatProps} = props;
      return children(intl.formatNumberToParts(value, formatProps));
    }}
  </Context.Consumer>
);
FormattedNumberParts.displayName = 'FormattedNumberParts';

export function createFormattedDateTimePartsComponent<
  Name extends keyof Formatter
>(name: Name) {
  type FormatFn = IntlShape[Name];
  type Props = Formatter[Name] & {
    value: Parameters<FormatFn>[0];
    children(val: Intl.DateTimeFormatPart[]): React.ReactElement | null;
  };

  const ComponentParts: React.FC<Props> = props => (
    <Context.Consumer>
      {intl => {
        invariantIntlContext(intl);
        const {value, children, ...formatProps} = props;
        const date = typeof value === 'string' ? new Date(value || 0) : value;
        const formattedParts: Intl.DateTimeFormatPart[] =
          name === 'formatDate'
            ? intl.formatDateToParts(date, formatProps)
            : intl.formatTimeToParts(date, formatProps);

        return children(formattedParts);
      }}
    </Context.Consumer>
  );
  ComponentParts.displayName = DisplayNameParts[name];
  return ComponentParts;
}

export function createFormattedComponent<Name extends keyof Formatter>(
  name: Name
) {
  type FormatFn = IntlShape[Name];
  type Props = Formatter[Name] & {
    value: Parameters<FormatFn>[0];
    children?(val: string): React.ReactElement | null;
  };

  const Component: React.FC<Props> = props => (
    <Context.Consumer>
      {intl => {
        invariantIntlContext(intl);
        const {value, children, ...formatProps} = props;
        const formattedValue = intl[name](value as any, formatProps);

        if (typeof children === 'function') {
          return children(formattedValue as any);
        }
        const Text = intl.textComponent || React.Fragment;
        return <Text>{formattedValue}</Text>;
      }}
    </Context.Consumer>
  );
  Component.displayName = DisplayName[name];
  return Component;
}
