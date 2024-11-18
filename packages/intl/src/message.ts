import {CustomFormats, Formatters, MessageDescriptor, OnErrorFn} from './types'

import {MessageFormatElement, TYPE} from '@formatjs/icu-messageformat-parser'
import {
  FormatXMLElementFn,
  IntlMessageFormat,
  Formatters as IntlMessageFormatFormatters,
  Options,
  PrimitiveType,
} from 'intl-messageformat'
import {MessageFormatError, MissingTranslationError} from './error'
import {invariant} from './utils'

function setTimeZoneInOptions(
  opts: Record<string, Intl.DateTimeFormatOptions>,
  timeZone: string
): Record<string, Intl.DateTimeFormatOptions> {
  return Object.keys(opts).reduce(
    (all: Record<string, Intl.DateTimeFormatOptions>, k) => {
      all[k] = {
        timeZone,
        ...opts[k],
      }
      return all
    },
    {}
  )
}

function deepMergeOptions(
  opts1: Record<string, Intl.DateTimeFormatOptions>,
  opts2: Record<string, Intl.DateTimeFormatOptions>
): Record<string, Intl.DateTimeFormatOptions> {
  const keys = Object.keys({...opts1, ...opts2})
  return keys.reduce((all: Record<string, Intl.DateTimeFormatOptions>, k) => {
    all[k] = {
      ...(opts1[k] || {}),
      ...(opts2[k] || {}),
    }
    return all
  }, {})
}

function deepMergeFormatsAndSetTimeZone(
  f1: CustomFormats,
  timeZone?: string
): CustomFormats {
  if (!timeZone) {
    return f1
  }
  const mfFormats = IntlMessageFormat.formats
  return {
    ...mfFormats,
    ...f1,
    date: deepMergeOptions(
      setTimeZoneInOptions(mfFormats.date, timeZone),
      setTimeZoneInOptions(f1.date || {}, timeZone)
    ),
    time: deepMergeOptions(
      setTimeZoneInOptions(mfFormats.time, timeZone),
      setTimeZoneInOptions(f1.time || {}, timeZone)
    ),
  }
}

export type FormatMessageFn<T> = (
  {
    locale,
    formats,
    messages,
    defaultLocale,
    defaultFormats,
    fallbackOnEmptyString,
    onError,
    timeZone,
    defaultRichTextElements,
  }: {
    locale: string
    timeZone?: string
    formats: CustomFormats
    messages: Record<string, string> | Record<string, MessageFormatElement[]>
    defaultLocale: string
    defaultFormats: CustomFormats
    defaultRichTextElements?: Record<string, FormatXMLElementFn<T>>
    fallbackOnEmptyString?: boolean
    onError: OnErrorFn
  },
  state: IntlMessageFormatFormatters & Pick<Formatters, 'getMessageFormat'>,
  messageDescriptor: MessageDescriptor,
  values?: Record<string, PrimitiveType | T | FormatXMLElementFn<T>>,
  opts?: Options
) => T extends string ? string : Array<T | string> | string | T

export const formatMessage: FormatMessageFn<any> = (
  {
    locale,
    formats,
    messages,
    defaultLocale,
    defaultFormats,
    fallbackOnEmptyString,
    onError,
    timeZone,
    defaultRichTextElements,
  },
  state,
  messageDescriptor = {id: ''},
  values,
  opts
) => {
  const {id: msgId, defaultMessage} = messageDescriptor

  // `id` is a required field of a Message Descriptor.
  invariant(
    !!msgId,
    `[@formatjs/intl] An \`id\` must be provided to format a message. You can either:
1. Configure your build toolchain with [babel-plugin-formatjs](https://formatjs.github.io/docs/tooling/babel-plugin)
or [@formatjs/ts-transformer](https://formatjs.github.io/docs/tooling/ts-transformer) OR
2. Configure your \`eslint\` config to include [eslint-plugin-formatjs](https://formatjs.github.io/docs/tooling/linter#enforce-id)
to autofix this issue`
  )
  const id = String(msgId)
  const message =
    // In case messages is Object.create(null)
    // e.g import('foo.json') from webpack)
    // See https://github.com/formatjs/formatjs/issues/1914
    messages &&
    Object.prototype.hasOwnProperty.call(messages, id) &&
    messages[id]

  // IMPORTANT: Hot path if `message` is AST with a single literal node
  if (
    Array.isArray(message) &&
    message.length === 1 &&
    message[0].type === TYPE.literal
  ) {
    return message[0].value
  }

  // IMPORTANT: Hot path straight lookup for performance
  if (
    !values &&
    message &&
    typeof message === 'string' &&
    !defaultRichTextElements
  ) {
    return message.replace(/'\{(.*?)\}'/gi, `{$1}`)
  }
  values = {
    ...defaultRichTextElements,
    ...(values || {}),
  }
  formats = deepMergeFormatsAndSetTimeZone(formats, timeZone)
  defaultFormats = deepMergeFormatsAndSetTimeZone(defaultFormats, timeZone)

  if (!message) {
    if (fallbackOnEmptyString === false && message === '') {
      return message
    }

    if (
      !defaultMessage ||
      (locale && locale.toLowerCase() !== defaultLocale.toLowerCase())
    ) {
      // This prevents warnings from littering the console in development
      // when no `messages` are passed into the <IntlProvider> for the
      // default locale.
      onError(new MissingTranslationError(messageDescriptor, locale))
    }
    if (defaultMessage) {
      try {
        const formatter = state.getMessageFormat(
          defaultMessage,
          defaultLocale,
          defaultFormats,
          opts
        )

        return formatter.format(values)
      } catch (e) {
        onError(
          new MessageFormatError(
            `Error formatting default message for: "${id}", rendering default message verbatim`,
            locale,
            messageDescriptor,
            e
          )
        )
        return typeof defaultMessage === 'string' ? defaultMessage : id
      }
    }
    return id
  }

  // We have the translated message
  try {
    const formatter = state.getMessageFormat(message, locale, formats, {
      formatters: state,
      ...(opts || {}),
    })

    return formatter.format<any>(values)
  } catch (e) {
    onError(
      new MessageFormatError(
        `Error formatting message: "${id}", using ${
          defaultMessage ? 'default message' : 'id'
        } as fallback.`,
        locale,
        messageDescriptor,
        e
      )
    )
  }

  if (defaultMessage) {
    try {
      const formatter = state.getMessageFormat(
        defaultMessage,
        defaultLocale,
        defaultFormats,
        opts
      )

      return formatter.format(values)
    } catch (e) {
      onError(
        new MessageFormatError(
          `Error formatting the default message for: "${id}", rendering message verbatim`,
          locale,
          messageDescriptor,
          e
        )
      )
    }
  }

  if (typeof message === 'string') {
    return message
  }
  if (typeof defaultMessage === 'string') {
    return defaultMessage
  }
  return id
}
