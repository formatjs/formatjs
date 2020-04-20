/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import * as React from 'react'
import {PrimitiveType, FormatXMLElementFn} from 'intl-messageformat'
import {Context} from './injectIntl'
import {MessageDescriptor} from '../types'
import {formatMessage} from '../formatters/message'
import {
  invariantIntlContext,
  DEFAULT_INTL_CONFIG,
  createFormatters,
} from '../utils'
import * as shallowEquals_ from 'shallow-equal/objects'
const shallowEquals: typeof shallowEquals_ =
  (shallowEquals_ as any).default || shallowEquals_

function defaultFormatMessage<T = React.ReactNode>(
  descriptor: MessageDescriptor,
  values?: Record<
    string,
    PrimitiveType | React.ReactElement | FormatXMLElementFn<T, T>
  >
): string {
  if (process.env.NODE_ENV !== 'production') {
    console.error(
      '[React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry. Using default message as fallback.'
    )
  }

  return formatMessage(
    {
      ...DEFAULT_INTL_CONFIG,
      locale: 'en',
    },
    createFormatters(),
    descriptor,
    values as any
  )
}

export interface Props<
  V extends Record<string, any> = Record<string, React.ReactNode>
> extends MessageDescriptor {
  values?: V
  tagName?: React.ElementType<any>
  children?(...nodes: React.ReactNodeArray): React.ReactNode
}

class FormattedMessage<
  V extends Record<string, any> = Record<
    string,
    | PrimitiveType
    | React.ReactElement
    | FormatXMLElementFn<React.ReactNode, React.ReactNode>
  >
> extends React.Component<Props<V>> {
  static displayName = 'FormattedMessage'
  static defaultProps = {
    values: {},
  }

  shouldComponentUpdate(nextProps: Props<V>): boolean {
    const {values, ...otherProps} = this.props
    const {values: nextValues, ...nextOtherProps} = nextProps
    return (
      !shallowEquals(nextValues, values) ||
      !shallowEquals(otherProps, nextOtherProps)
    )
  }

  render(): JSX.Element {
    return (
      <Context.Consumer>
        {(intl): React.ReactNode => {
          if (!this.props.defaultMessage) {
            invariantIntlContext(intl)
          }

          const {
            formatMessage = defaultFormatMessage,
            textComponent: Text = React.Fragment,
          } = intl || {}
          const {
            id,
            description,
            defaultMessage,
            values,
            children,
            tagName: Component = Text,
          } = this.props

          const descriptor = {id, description, defaultMessage}
          let nodes: string | React.ReactNodeArray = formatMessage(
            descriptor,
            values
          )

          if (!Array.isArray(nodes)) {
            nodes = [nodes]
          }

          if (typeof children === 'function') {
            return children(...nodes)
          }

          if (Component) {
            // Needs to use `createElement()` instead of JSX, otherwise React will
            // warn about a missing `key` prop with rich-text message formatting.
            return React.createElement(Component, null, ...nodes)
          }
          return nodes
        }}
      </Context.Consumer>
    )
  }
}

export default FormattedMessage
