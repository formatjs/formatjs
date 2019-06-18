/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import * as React from 'react';
import withIntl from './injectIntl';
import {IntlShape, FormatNumberOptions} from '../types';

interface Props extends FormatNumberOptions {
  value: number;
  intl: IntlShape;
  children?(value: string): React.ReactElement | null;
}

const FormattedNumber: React.FC<Props> = props => {
  const {
    value,
    children,
    intl: {formatNumber, textComponent: Text},
  } = props;

  let formattedNumber = formatNumber(value, props);

  if (typeof children === 'function') {
    return children(formattedNumber);
  }

  return <Text>{formattedNumber}</Text>;
};

FormattedNumber.displayName = 'FormattedNumber';

export default withIntl(FormattedNumber);
