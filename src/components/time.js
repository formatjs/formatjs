/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import * as React from 'react';
import * as PropTypes from 'prop-types';
import withIntl from './withIntl';
import {intlShape, dateTimeFormatPropTypes} from '../types';

function FormattedTime(props) {
  const {
    value,
    children,
    intl: {formatTime, textComponent: Text},
  } = props;

  let formattedTime = formatTime(value, props);

  if (typeof children === 'function') {
    return children(formattedTime);
  }

  return <Text>{formattedTime}</Text>;
}

FormattedTime.propTypes = {
  ...dateTimeFormatPropTypes,
  intl: intlShape,
  value: PropTypes.any.isRequired,
  format: PropTypes.string,
  children: PropTypes.func,
};

FormattedTime.displayName = 'FormattedTime';

export default withIntl(FormattedTime);
