/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
import {
  type ResolvedIntlConfig as CoreResolvedIntlConfig,
  type Formatters,
  type IntlFormatters,
  type MessageTextOutput,
  type UntypedMessageDescriptor,
  type RegisteredMessageId,
  type RegisteredMessageValues,
  type UnregisteredMessageDescriptor,
  type TypedMessageDescriptor,
  type TypedMessageArguments,
  type MessageValues,
  type MessageValuesOf,
} from '@formatjs/intl'
import {
  type FormatXMLElementFn,
  type Options as IntlMessageFormatOptions,
  type PrimitiveType,
} from 'intl-messageformat'
import * as React from 'react'
import type {DEFAULT_INTL_CONFIG} from '#packages/react-intl/utils.js'
export type IntlConfig = Omit<
  ResolvedIntlConfig,
  keyof typeof DEFAULT_INTL_CONFIG
> &
  Partial<typeof DEFAULT_INTL_CONFIG>

export interface ResolvedIntlConfig extends CoreResolvedIntlConfig<React.ReactNode> {
  textComponent?: React.ComponentType | keyof React.JSX.IntrinsicElements
  wrapRichTextChunksInFragment?: boolean
}

export interface IntlShape
  extends ResolvedIntlConfig, IntlFormatters<React.ReactNode> {
  formatMessage<
    V extends MessageValues = never,
    T extends React.ReactNode = React.ReactNode,
  >(
    this: void,
    descriptor: [V] extends [never] ? never : UntypedMessageDescriptor,
    ...args: TypedMessageArguments<NoInfer<V>, string, T>
  ): MessageTextOutput
  formatMessage<
    V extends MessageValues = never,
    T extends React.ReactNode = React.ReactNode,
  >(
    this: void,
    descriptor: [V] extends [never] ? never : UntypedMessageDescriptor,
    ...args: TypedMessageArguments<NoInfer<V>, T>
  ): string | T | Array<string | T>
  formatMessage<D extends TypedMessageDescriptor<MessageValues>>(
    this: void,
    descriptor: D,
    ...args: TypedMessageArguments<
      MessageValuesOf<NoInfer<D>>,
      string,
      React.ReactNode
    >
  ): MessageTextOutput
  formatMessage<D extends TypedMessageDescriptor<MessageValues>>(
    this: void,
    descriptor: D,
    ...args: TypedMessageArguments<MessageValuesOf<NoInfer<D>>, React.ReactNode>
  ): React.ReactNode
  formatMessage<const K extends RegisteredMessageId>(
    this: void,
    descriptor: UntypedMessageDescriptor & {id: K},
    ...args: TypedMessageArguments<
      RegisteredMessageValues<NoInfer<K>>,
      string,
      React.ReactNode
    >
  ): MessageTextOutput
  formatMessage<const K extends RegisteredMessageId>(
    this: void,
    descriptor: UntypedMessageDescriptor & {id: K},
    ...args: TypedMessageArguments<
      RegisteredMessageValues<NoInfer<K>>,
      React.ReactNode
    >
  ): string | React.ReactNode | Array<string | React.ReactNode>
  formatMessage<
    V = never,
    const D extends UntypedMessageDescriptor = UntypedMessageDescriptor,
  >(
    this: void,
    descriptor: [V] extends [never]
      ? D & UnregisteredMessageDescriptor<NoInfer<D>>
      : never,
    values?: Record<string, PrimitiveType | FormatXMLElementFn<string, string>>,
    opts?: IntlMessageFormatOptions
  ): MessageTextOutput
  formatMessage<
    V = never,
    const D extends UntypedMessageDescriptor = UntypedMessageDescriptor,
  >(
    this: void,
    descriptor: [V] extends [never]
      ? D & UnregisteredMessageDescriptor<NoInfer<D>>
      : never,
    values?: Record<
      string,
      | React.ReactNode
      | PrimitiveType
      | FormatXMLElementFn<string, React.ReactNode>
    >,
    opts?: IntlMessageFormatOptions
  ): Array<React.ReactNode>

  $t: IntlShape['formatMessage']

  formatters: Formatters
}
