/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import React from 'react';
import PropTypes from 'prop-types';
import withIntl from './withIntl';
import {intlShape, dateTimeFormatPropTypes} from '../types';

function FormattedDate(props) {
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
}

FormattedDate.propTypes = {
  ...dateTimeFormatPropTypes,
  intl: intlShape,
  value: PropTypes.any.isRequired,
  format: PropTypes.string,
  children: PropTypes.func,
};

FormattedDate.displayName = 'FormattedDate';

export default withIntl(FormattedDate);
