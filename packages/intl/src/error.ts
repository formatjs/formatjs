import {MessageDescriptor} from './types'

export enum IntlErrorCode {
  FORMAT_ERROR = 'FORMAT_ERROR',
  UNSUPPORTED_FORMATTER = 'UNSUPPORTED_FORMATTER',
  INVALID_CONFIG = 'INVALID_CONFIG',
  MISSING_DATA = 'MISSING_DATA',
  MISSING_TRANSLATION = 'MISSING_TRANSLATION',
}

export class IntlError<
  T extends IntlErrorCode = IntlErrorCode.FORMAT_ERROR
> extends Error {
  public readonly code: T

  constructor(code: T, message: string, exception?: Error | unknown) {
    const err = exception
      ? exception instanceof Error
        ? exception
        : new Error(String(exception))
      : undefined
    super(
      `[@formatjs/intl Error ${code}] ${message} 
${err ? `\n${err.message}\n${err.stack}` : ''}`
    )
    this.code = code
    // @ts-ignore just so we don't need to declare dep on @types/node
    if (typeof Error.captureStackTrace === 'function') {
      // @ts-ignore just so we don't need to declare dep on @types/node
      Error.captureStackTrace(this, IntlError)
    }
  }
}

export class UnsupportedFormatterError extends IntlError<IntlErrorCode.UNSUPPORTED_FORMATTER> {
  constructor(message: string, exception?: Error | unknown) {
    super(IntlErrorCode.UNSUPPORTED_FORMATTER, message, exception)
  }
}

export class InvalidConfigError extends IntlError<IntlErrorCode.INVALID_CONFIG> {
  constructor(message: string, exception?: Error | unknown) {
    super(IntlErrorCode.INVALID_CONFIG, message, exception)
  }
}

export class MissingDataError extends IntlError<IntlErrorCode.MISSING_DATA> {
  constructor(message: string, exception?: Error | unknown) {
    super(IntlErrorCode.MISSING_DATA, message, exception)
  }
}

export class IntlFormatError extends IntlError<IntlErrorCode.FORMAT_ERROR> {
  public readonly descriptor?: MessageDescriptor
  constructor(message: string, locale: string, exception?: Error | unknown) {
    super(
      IntlErrorCode.FORMAT_ERROR,
      `${message} 
Locale: ${locale}
`,
      exception
    )
  }
}

export class MessageFormatError extends IntlFormatError {
  public readonly descriptor?: MessageDescriptor
  constructor(
    message: string,
    locale: string,
    descriptor?: MessageDescriptor,
    exception?: Error | unknown
  ) {
    super(
      `${message} 
MessageID: ${descriptor?.id}
Default Message: ${descriptor?.defaultMessage}
Description: ${descriptor?.description} 
`,
      locale,
      exception
    )
    this.descriptor = descriptor
  }
}

export class MissingTranslationError extends IntlError<IntlErrorCode.MISSING_TRANSLATION> {
  public readonly descriptor?: MessageDescriptor
  constructor(descriptor: MessageDescriptor, locale: string) {
    super(
      IntlErrorCode.MISSING_TRANSLATION,
      `Missing message: "${descriptor.id}" for locale "${locale}", using ${
        descriptor.defaultMessage ? 'default message' : 'id'
      } as fallback.`
    )
    this.descriptor = descriptor
  }
}
