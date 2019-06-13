/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import * as React from 'react';
import * as PropTypes from 'prop-types';
import withIntl from './withIntl';
import {intlShape, pluralFormatPropTypes} from '../types';

function FormattedPlural(props) {
  const {
    value,
    other,
    children,
    intl: {formatPlural, textComponent: Text},
  } = props;

  let pluralCategory = formatPlural(value, props);
  let formattedPlural = props[pluralCategory] || other;

  if (typeof children === 'function') {
    return children(formattedPlural);
  }

  return <Text>{formattedPlural}</Text>;
}

FormattedPlural.propTypes = {
  ...pluralFormatPropTypes,
  intl: intlShape,
  value: PropTypes.any.isRequired,

  other: PropTypes.node.isRequired,
  zero: PropTypes.node,
  one: PropTypes.node,
  two: PropTypes.node,
  few: PropTypes.node,
  many: PropTypes.node,

  children: PropTypes.func,
};

FormattedPlural.defaultProps = {
  type: 'cardinal',
};

FormattedPlural.displayName = 'FormattedPlural';

export default withIntl(FormattedPlural);
