/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import withIntl from './withIntl';
import {intlShape, dateTimeFormatPropTypes} from '../types';
import {invariantIntlContext} from '../utils';

class FormattedTime extends PureComponent {
  static displayName = 'FormattedTime';

  static propTypes = {
    ...dateTimeFormatPropTypes,
    intl: intlShape,
    value: PropTypes.any.isRequired,
    format: PropTypes.string,
    children: PropTypes.func,
  };

  constructor(props) {
    super(props);
    invariantIntlContext(props);
  }

  render() {
    const {formatTime, textComponent: Text} = this.props.intl;
    const {value, children} = this.props;

    let formattedTime = formatTime(value, this.props);

    if (typeof children === 'function') {
      return children(formattedTime);
    }

    return <Text>{formattedTime}</Text>;
  }
}

export default withIntl(FormattedTime);
