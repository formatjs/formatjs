/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import * as React from 'react';
import withIntl from './injectIntl';
import {MessageDescriptor, IntlShape} from '../types';
import * as shallowEquals_ from 'shallow-equal/objects';
const shallowEquals = shallowEquals_;
import {formatMessage as baseFormatMessage} from '../format';
import {
  invariantIntlContext,
  DEFAULT_INTL_CONFIG,
  createDefaultFormatters,
} from '../utils';

const defaultFormatMessage: IntlShape['formatMessage'] = (
  descriptor,
  values
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
    values
  );
};

export interface Props extends MessageDescriptor {
  intl: IntlShape;
  values?: any;
  tagName?: React.ElementType<any>;
  children?(...nodes: Array<React.ReactNode>): React.ReactNode;
}

export class BaseFormattedMessage extends React.Component<Props> {
  static defaultProps = {
    values: {},
  };

  constructor(props: Props) {
    super(props);
    if (!props.defaultMessage) {
      invariantIntlContext(props);
    }
  }

  shouldComponentUpdate(nextProps: Props) {
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

    let tokenDelimiter: string = '';
    let tokenizedValues: Record<string, string> = {};
    let elements: Record<string, string | React.ReactChild> = {};

    let hasValues = values && Object.keys(values).length > 0;
    if (hasValues) {
      // Creates a token with a random UID that should not be guessable or
      // conflict with other parts of the `message` string.
      let uid = Math.floor(Math.random() * 0x10000000000).toString(16);

      let generateToken = (() => {
        let counter = 0;
        return () => `ELEMENT-${uid}-${(counter += 1)}`;
      })();

      // Splitting with a delimiter to support IE8. When using a regex
      // with a capture group IE8 does not include the capture group in
      // the resulting array.
      tokenDelimiter = `@__${uid}__@`;

      // Iterates over the `props` to keep track of any React Element
      // values so they can be represented by the `token` as a placeholder
      // when the `message` is formatted. This allows the formatted
      // message to then be broken-up into parts with references to the
      // React Elements inserted back in.
      Object.keys(values).forEach(name => {
        let value = values[name];

        if (React.isValidElement(value)) {
          let token = generateToken();
          tokenizedValues[name] = tokenDelimiter + token + tokenDelimiter;
          elements[token] = value;
        } else {
          tokenizedValues[name] = value;
        }
      });
    }

    let descriptor = {id, description, defaultMessage};
    let formattedMessage = formatMessage(descriptor, tokenizedValues || values);

    let nodes: Array<string | React.ReactChild>;

    let hasElements = elements && Object.keys(elements).length > 0;
    if (hasElements) {
      // Split the message into parts so the React Element values captured
      // above can be inserted back into the rendered message. This
      // approach allows messages to render with React Elements while
      // keeping React's virtual diffing working properly.
      nodes = formattedMessage
        .split(tokenDelimiter)
        .filter(part => !!part)
        .map(part => elements[part] || part);
    } else {
      nodes = [formattedMessage];
    }

    if (typeof children === 'function') {
      return children(...nodes);
    }

    // Needs to use `createElement()` instead of JSX, otherwise React will
    // warn about a missing `key` prop with rich-text message formatting.
    return React.createElement(Component, null, ...nodes);
  }
}

export default withIntl(BaseFormattedMessage, {enforceContext: false});
