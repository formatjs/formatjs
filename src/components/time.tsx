/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import * as React from 'react';
import withIntl from './injectIntl';
import {IntlShape, FormatDateOptions} from '../types';

export interface Props extends FormatDateOptions {
  intl: IntlShape;
  value: number | Date;
  children?(val: string): React.ReactElement | null;
}

const FormattedTime: React.FC<Props> = props => {
  const {
    value,
    children,
    intl: {formatTime, textComponent: Text},
  } = props;

  let formattedTime = formatTime(value, props);

  if (typeof children === 'function') {
    return children(formattedTime);
  }
  if (Text) {
    return <Text>{formattedTime}</Text>;
  }
  // Work around @types/react where React.FC cannot return string
  return formattedTime as any;
};

FormattedTime.displayName = 'FormattedTime';

export default withIntl(FormattedTime);
