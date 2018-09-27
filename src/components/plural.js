/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import withIntl from './withIntl';
import {intlShape, pluralFormatPropTypes} from '../types';
import {invariantIntlContext, shouldIntlComponentUpdate} from '../utils';

class FormattedPlural extends Component {
  static displayName = 'FormattedPlural';

  static propTypes = {
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

  static defaultProps = {
    style: 'cardinal',
  };

  constructor(props) {
    super(props);
    invariantIntlContext(props);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return shouldIntlComponentUpdate(this, nextProps, nextState);
  }

  render() {
    const {formatPlural, textComponent: Text} = this.props.intl;
    const {value, other, children} = this.props;

    let pluralCategory = formatPlural(value, this.props);
    let formattedPlural = this.props[pluralCategory] || other;

    if (typeof children === 'function') {
      return children(formattedPlural);
    }

    return <Text>{formattedPlural}</Text>;
  }
}

export default withIntl(FormattedPlural)
