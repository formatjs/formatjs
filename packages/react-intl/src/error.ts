import {MessageDescriptor} from './types';

export const enum ReactIntlErrorCode {
  FORMAT_ERROR = 'FORMAT_ERROR',
  UNSUPPORTED_FORMATTER = 'UNSUPPORTED_FORMATTER',
  INVALID_CONFIG = 'INVALID_CONFIG',
  MISSING_DATA = 'MISSING_DATA',
  MISSING_TRANSLATION = 'MISSING_TRANSLATION',
}

export class ReactIntlError<
  T extends ReactIntlErrorCode = ReactIntlErrorCode.FORMAT_ERROR
> extends Error {
  public readonly code: T;

  constructor(code: T, message: string, exception?: Error) {
    super(
      `[React Intl Error ${code}] ${message} 
${exception ? `\n${exception.stack}` : ''}`
    );
    this.code = code;
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, ReactIntlError);
    }
  }
}

export class UnsupportedFormatterError extends ReactIntlError<
  ReactIntlErrorCode.UNSUPPORTED_FORMATTER
> {
  constructor(message: string, exception?: Error) {
    super(ReactIntlErrorCode.UNSUPPORTED_FORMATTER, message, exception);
  }
}

export class InvalidConfigError extends ReactIntlError<
  ReactIntlErrorCode.INVALID_CONFIG
> {
  constructor(message: string, exception?: Error) {
    super(ReactIntlErrorCode.INVALID_CONFIG, message, exception);
  }
}

export class MissingDataError extends ReactIntlError<
  ReactIntlErrorCode.MISSING_DATA
> {
  constructor(message: string, exception?: Error) {
    super(ReactIntlErrorCode.MISSING_DATA, message, exception);
  }
}

export class MessageFormatError extends ReactIntlError<
  ReactIntlErrorCode.FORMAT_ERROR
> {
  public readonly descriptor?: MessageDescriptor;
  constructor(
    message: string,
    locale: string,
    descriptor?: MessageDescriptor,
    exception?: Error
  ) {
    super(
      ReactIntlErrorCode.FORMAT_ERROR,
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

export class MissingTranslationError extends ReactIntlError<
  ReactIntlErrorCode.MISSING_TRANSLATION
> {
  public readonly descriptor?: MessageDescriptor;
  constructor(descriptor: MessageDescriptor, locale: string) {
    super(
      ReactIntlErrorCode.MISSING_TRANSLATION,
      `Missing message: "${descriptor.id}" for locale "${locale}", using ${
        descriptor.defaultMessage ? 'default message' : 'id'
      } as fallback.`
    );
    this.descriptor = descriptor;
  }
}
