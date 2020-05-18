import {MessageDescriptor} from './types';

export const enum ReactIntlErrorCode {
  FORMAT_ERROR = 'FORMAT_ERROR',
  UNSUPPORTED_FORMATTER = 'UNSUPPORTED_FORMATTER',
  INVALID_CONFIG = 'INVALID_CONFIG',
  MISSING_DATA = 'MISSING_DATA',
  MISSING_TRANSLATION = 'MISSING_TRANSLATION',
}

export class ReactIntlError extends Error {
  public readonly code: ReactIntlErrorCode;

  constructor(code: ReactIntlErrorCode, message: string, exception?: Error) {
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

export class MessageFormatError extends ReactIntlError {
  public readonly descriptor?: MessageDescriptor;
  constructor(
    message: string,
    locale: string,
    descriptor: MessageDescriptor,
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

export class MissingTranslationError extends ReactIntlError {
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
