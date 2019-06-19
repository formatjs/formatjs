/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import * as React from 'react';
import withIntl from './injectIntl';
import {IntlShape, FormatRelativeTimeOptions} from '../types';
import {FormattableUnit} from '@formatjs/intl-relativetimeformat';

export interface Props extends FormatRelativeTimeOptions {
  intl: IntlShape;
  value: number;
  unit: FormattableUnit;
  children?(val: string): React.ReactElement | null;
}

const FormattedRelativeTime: React.FC<Props> = props => {
  const {
    value,
    children,
    unit,
    intl: {formatRelativeTime, textComponent: Text},
  } = props;

  let formattedTime = formatRelativeTime(value, unit, props);

  if (typeof children === 'function') {
    return children(formattedTime);
  }

  return <Text>{formattedTime}</Text>;
};

FormattedRelativeTime.displayName = 'FormattedRelativeTime';

export default withIntl(FormattedRelativeTime);
