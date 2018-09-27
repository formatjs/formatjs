/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import withIntl from './withIntl';
import {intlShape, dateTimeFormatPropTypes} from '../types';
import {invariantIntlContext, shouldIntlComponentUpdate} from '../utils';

class FormattedDate extends Component {
  static displayName = 'FormattedDate';

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

  shouldComponentUpdate(nextProps, nextState) {
    return shouldIntlComponentUpdate(this, nextProps, nextState);
  }

  render() {
    const {formatDate, textComponent: Text} = this.props.intl;
    const {value, children} = this.props;

    let formattedDate = formatDate(value, this.props);

    if (typeof children === 'function') {
      return children(formattedDate);
    }

    return <Text>{formattedDate}</Text>;
  }
}

export default withIntl(FormattedDate)
