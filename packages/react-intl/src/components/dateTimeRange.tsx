import * as React from 'react';
import {Context} from './injectIntl';
import {FormatDateOptions} from '@formatjs/intl';
import {invariantIntlContext} from '../utils';
import {DateTimeFormat} from '@formatjs/ecma402-abstract';

interface Props extends FormatDateOptions {
  from: Parameters<DateTimeFormat['formatRange']>[0];
  to: Parameters<DateTimeFormat['formatRange']>[1];
  children?(value: React.ReactNode): React.ReactElement | null;
}

const FormattedDateTimeRange: React.FC<Props> = props => (
  <Context.Consumer>
    {(intl): React.ReactElement | null => {
      invariantIntlContext(intl);
      const {from, to, children, ...formatProps} = props;
      // TODO: fix TS type definition for localeMatcher upstream
      const formattedValue = intl.formatDateTimeRange(from, to, formatProps);

      if (typeof children === 'function') {
        return children(formattedValue as any);
      }
      const Text = intl.textComponent || React.Fragment;
      return <Text>{formattedValue}</Text>;
    }}
  </Context.Consumer>
);

FormattedDateTimeRange.displayName = 'FormattedDateTimeRange';
export default FormattedDateTimeRange;
