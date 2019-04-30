/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import withIntl from './withIntl';
import {intlShape, numberFormatPropTypes} from '../types';
import {invariantIntlContext, shouldIntlComponentUpdate} from '../utils';

class FormattedNumber extends Component {
  static displayName = 'FormattedNumber';

  static propTypes = {
    ...numberFormatPropTypes,
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
    const {formatNumber, textComponent: Text} = this.props.intl;
    const {value, children} = this.props;

    let formattedNumber = formatNumber(value, this.props);

    if (typeof children === 'function') {
      return children(formattedNumber);
    }

    return <Text>{formattedNumber}</Text>;
  }
}

export default withIntl(FormattedNumber)
