/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import * as React from 'react';
import withIntl from './injectIntl';
import {FormatDateOptions, IntlShape} from '../types';

interface Props extends FormatDateOptions {
  value: Date | number;
  intl: IntlShape;
  children?(val: string): React.ReactElement | null;
}

const FormattedDate: React.FC<Props> = props => {
  const {
    value,
    children,
    intl: {formatDate, textComponent: Text},
  } = props;

  let formattedDate = formatDate(value, props);

  if (typeof children === 'function') {
    return children(formattedDate);
  }

  return <Text>{formattedDate}</Text>;
};

FormattedDate.displayName = 'FormattedDate';

export default withIntl(FormattedDate);
