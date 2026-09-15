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

import type {
  UntypedMessageDescriptor,
  TypedMessageDescriptor,
  MessageValues,
  TypedMessageArguments,
} from '@formatjs/intl'
import {shallowEqual} from '#packages/react-intl/utils.js'
import useIntl from '#packages/react-intl/components/useIntl.js'

export interface Props<
  V extends Record<string, any> = Record<
    string,
    React.ReactNode | PrimitiveType | FormatXMLElementFn<React.ReactNode>
  >,
>
  extends UntypedMessageDescriptor, MessagePresentationProps {
  values?: V
}

interface MessagePresentationProps {
  tagName?: React.ElementType<any>
  children?(nodes: React.ReactNode[]): React.ReactNode | null
  ignoreTag?: IntlMessageFormatOptions['ignoreTag']
}

export type TypedProps<V extends MessageValues> = TypedMessageDescriptor<V> &
  MessagePresentationProps &
  ([] extends TypedMessageArguments<V, React.ReactNode>
    ? {values?: TypedMessageArguments<NoInfer<V>, React.ReactNode>[0]}
    : {values: TypedMessageArguments<NoInfer<V>, React.ReactNode>[0]})

export interface FormattedMessageComponent {
  <V extends MessageValues>(props: TypedProps<V>): React.ReactNode
  (
    props: (
      | UntypedMessageDescriptor
      | TypedMessageDescriptor<Record<string, never>>
    ) &
      MessagePresentationProps & {values?: never}
  ): React.ReactNode
  (props: Props): React.ReactNode
  displayName?: string
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
    return children(Array.isArray(nodes) ? nodes : [nodes])
  }

  if (Component) {
    return <Component>{nodes}</Component>
  }
  return <>{nodes}</>
}
FormattedMessage.displayName = 'FormattedMessage'

// React.memo preserves runtime behavior; expose both checked and legacy signatures.
const MemoizedFormattedMessage: FormattedMessageComponent = React.memo<Props>(
  FormattedMessage,
  areEqual
) as FormattedMessageComponent
MemoizedFormattedMessage.displayName = 'MemoizedFormattedMessage'

export default MemoizedFormattedMessage
