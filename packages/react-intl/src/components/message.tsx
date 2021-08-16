/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import * as React from 'react'
import type {Options as IntlMessageFormatOptions} from 'intl-messageformat'

import {MessageDescriptor} from '@formatjs/intl'
import useIntl from './useIntl'
import {shallowEqual} from '../utils'

export interface Props<
  V extends Record<string, any> = Record<string, React.ReactNode>
> extends MessageDescriptor {
  values?: V
  tagName?: React.ElementType<any>
  children?(nodes: React.ReactNodeArray): React.ReactElement | null
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
  let nodes: React.ReactNode = formatMessage(descriptor, values, {
    ignoreTag,
  })

  if (typeof children === 'function') {
    return children(Array.isArray(nodes) ? nodes : [nodes])
  }

  if (Component) {
    return <Component>{React.Children.toArray(nodes)}</Component>
  }
  return <>{nodes}</>
}
FormattedMessage.displayName = 'FormattedMessage'

const MemoizedFormattedMessage = React.memo<Props>(FormattedMessage, areEqual)
MemoizedFormattedMessage.displayName = 'MemoizedFormattedMessage'

export default MemoizedFormattedMessage
