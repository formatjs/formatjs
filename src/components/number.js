/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import * as React from 'react';
import * as PropTypes from 'prop-types';
import withIntl from './withIntl';
import {intlShape, numberFormatPropTypes} from '../types';

function FormattedNumber(props) {
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
}

FormattedNumber.propTypes = {
  ...numberFormatPropTypes,
  intl: intlShape,
  value: PropTypes.any.isRequired,
  format: PropTypes.string,
  children: PropTypes.func,
};

FormattedNumber.displayName = 'FormattedNumber';

export default withIntl(FormattedNumber);
