/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import type {
  FormatXMLElementFn,
  Options as IntlMessageFormatOptions,
  PrimitiveType,
} from 'intl-messageformat'
import * as React from 'react'

import {MessageDescriptor} from '@formatjs/intl'
import {shallowEqual} from '../utils'
import useIntl from './useIntl'

export interface Props<
  V extends Record<string, any> = Record<
    string,
    React.ReactNode | PrimitiveType | FormatXMLElementFn<React.ReactNode>
  >,
> extends MessageDescriptor {
  values?: V
  tagName?: React.ElementType<any>
  children?(nodes: React.ReactNode[]): React.ReactNode | null
  ignoreTag?: IntlMessageFormatOptions['ignoreTag']
}

function areEqual(prevProps: Props, nextProps: Props): boolean {
  const {values, ...otherProps} = prevProps
  const {values: nextValues, ...nextOtherProps} = nextProps
  return (
    shallowEqual(nextValues, values) &&
    shallowEqual(otherProps as any, nextOtherProps)
  )
}

function FormattedMessage(props: Props) {
  const intl = useIntl()
  const {formatMessage, textComponent: Text = React.Fragment} = intl
  const {
    id,
    description,
    defaultMessage,
    values,
    children,
    tagName: Component = Text,
    ignoreTag,
  } = props

  const descriptor = {id, description, defaultMessage}
  const nodes = formatMessage(descriptor, values, {
    ignoreTag,
  })

  if (typeof children === 'function') {
    return children(nodes)
  }

  if (Component) {
    return <Component>{nodes}</Component>
  }
  return <>{nodes}</>
}
FormattedMessage.displayName = 'FormattedMessage'

const MemoizedFormattedMessage: React.ComponentType<Props> = React.memo<Props>(
  FormattedMessage,
  areEqual
)
MemoizedFormattedMessage.displayName = 'MemoizedFormattedMessage'

export default MemoizedFormattedMessage
