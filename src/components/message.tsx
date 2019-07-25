/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import * as React from 'react';
import withIntl from './injectIntl';
import {MessageDescriptor, IntlShape} from '../types';
const shallowEquals = require('shallow-equal/objects');

import {formatMessage as baseFormatMessage} from '../format';
import {
  invariantIntlContext,
  DEFAULT_INTL_CONFIG,
  createDefaultFormatters,
} from '../utils';
import {PrimitiveType, FormatXMLElementFn} from 'intl-messageformat/core';

const defaultFormatMessage = (
  descriptor: MessageDescriptor,
  values?: Record<string, PrimitiveType | FormatXMLElementFn>
) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error(
      '[React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry. Using default message as fallback.'
    );
  }

  return baseFormatMessage(
    {
      ...DEFAULT_INTL_CONFIG,
      locale: 'en',
    },
    createDefaultFormatters(),
    descriptor,
    values as any
  );
};

export interface Props<V extends React.ReactNode = React.ReactNode>
  extends MessageDescriptor {
  intl: IntlShape;
  values?: Record<string, V>;
  tagName?: React.ElementType<any>;
  children?(...nodes: React.ReactNodeArray): React.ReactNode;
}

export class BaseFormattedMessage<
  V extends PrimitiveType | FormatXMLElementFn =
    | PrimitiveType
    | FormatXMLElementFn
> extends React.Component<Props<V>> {
  static defaultProps = {
    values: {},
  };

  constructor(props: Props<V>) {
    super(props);
    if (!props.defaultMessage) {
      invariantIntlContext(props);
    }
  }

  shouldComponentUpdate(nextProps: Props<V>) {
    const {values} = this.props;
    const {values: nextValues} = nextProps;

    if (!shallowEquals(nextValues, values)) {
      return true;
    }

    // Since `values` has already been checked, we know they're not
    // different, so the current `values` are carried over so the shallow
    // equals comparison on the other props isn't affected by the `values`.
    let nextPropsToCheck = {
      ...nextProps,
      values,
    };

    return !shallowEquals(this.props, nextPropsToCheck);
  }

  render() {
    const {
      formatMessage = defaultFormatMessage,
      textComponent: Text = React.Fragment,
    } = this.props.intl || {};

    const {
      id,
      description,
      defaultMessage,
      values,
      tagName: Component = Text,
      children,
    } = this.props;

    const descriptor = {id, description, defaultMessage};
    let nodes: string | React.ReactNodeArray = formatMessage(
      descriptor,
      values
    );

    if (!Array.isArray(nodes)) {
      nodes = [nodes];
    }

    if (typeof children === 'function') {
      return children(...nodes);
    }

    if (Component) {
      // Needs to use `createElement()` instead of JSX, otherwise React will
      // warn about a missing `key` prop with rich-text message formatting.
      return React.createElement(Component, null, ...nodes);
    }
    return nodes;
  }
}

export default withIntl(BaseFormattedMessage, {enforceContext: false});
