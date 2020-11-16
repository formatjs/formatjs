import {MessageDescriptor} from './types';

export const enum IntlErrorCode {
  FORMAT_ERROR = 'FORMAT_ERROR',
  UNSUPPORTED_FORMATTER = 'UNSUPPORTED_FORMATTER',
  INVALID_CONFIG = 'INVALID_CONFIG',
  MISSING_DATA = 'MISSING_DATA',
  MISSING_TRANSLATION = 'MISSING_TRANSLATION',
}

export class IntlError<
  T extends IntlErrorCode = IntlErrorCode.FORMAT_ERROR
> extends Error {
  public readonly code: T;

  constructor(code: T, message: string, exception?: Error) {
    super(
      `[@formatjs/intl Error ${code}] ${message} 
${exception ? `\n${exception.message}\n${exception.stack}` : ''}`
    );
    this.code = code;
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, IntlError);
    }
  }
}

export class UnsupportedFormatterError extends IntlError<
  IntlErrorCode.UNSUPPORTED_FORMATTER
> {
  constructor(message: string, exception?: Error) {
    super(IntlErrorCode.UNSUPPORTED_FORMATTER, message, exception);
  }
}

export class InvalidConfigError extends IntlError<
  IntlErrorCode.INVALID_CONFIG
> {
  constructor(message: string, exception?: Error) {
    super(IntlErrorCode.INVALID_CONFIG, message, exception);
  }
}

export class MissingDataError extends IntlError<IntlErrorCode.MISSING_DATA> {
  constructor(message: string, exception?: Error) {
    super(IntlErrorCode.MISSING_DATA, message, exception);
  }
}

export class MessageFormatError extends IntlError<IntlErrorCode.FORMAT_ERROR> {
  public readonly descriptor?: MessageDescriptor;
  constructor(
    message: string,
    locale: string,
    descriptor?: MessageDescriptor,
    exception?: Error
  ) {
    super(
      IntlErrorCode.FORMAT_ERROR,
      `${message} 
Locale: ${locale}
MessageID: ${descriptor?.id}
Default Message: ${descriptor?.defaultMessage}
Description: ${descriptor?.description} 
`,
      exception
    );
    this.descriptor = descriptor;
  }
}

export class MissingTranslationError extends IntlError<
  IntlErrorCode.MISSING_TRANSLATION
> {
  public readonly descriptor?: MessageDescriptor;
  constructor(descriptor: MessageDescriptor, locale: string) {
    super(
      IntlErrorCode.MISSING_TRANSLATION,
      `Missing message: "${descriptor.id}" for locale "${locale}", using ${
        descriptor.defaultMessage ? 'default message' : 'id'
      } as fallback.`
    );
    this.descriptor = descriptor;
  }
}
