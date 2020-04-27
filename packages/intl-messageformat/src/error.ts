export const enum ErrorCode {
  // When we have a placeholder but no value to format
  MISSING_VALUE = 'MISSING_VALUE',
  // When value supplied is invalid
  INVALID_VALUE = 'INVALID_VALUE',
  // When we need specific Intl API but it's not available
  MISSING_INTL_API = 'MISSING_INTL_API',
}

export class FormatError extends Error {
  public readonly code: ErrorCode;
  /**
   * Original message we're trying to format
   * `undefined` if we're only dealing w/ AST
   *
   * @type {(string | undefined)}
   * @memberof FormatError
   */
  public readonly originalMessage: string | undefined;
  constructor(msg: string, code: ErrorCode, originalMessage?: string) {
    super(msg);
    this.code = code;
    this.originalMessage = originalMessage;
  }
  public toString() {
    return `[formatjs Error: ${this.code}] ${this.message}`;
  }
}

export class InvalidValueError extends FormatError {
  constructor(
    variableId: string,
    value: any,
    options: string[],
    originalMessage?: string
  ) {
    super(
      `Invalid values for "${variableId}": "${value}". Options are "${Object.keys(
        options
      ).join('", "')}"`,
      ErrorCode.INVALID_VALUE,
      originalMessage
    );
  }
}

export class InvalidValueTypeError extends FormatError {
  constructor(value: any, type: string, originalMessage?: string) {
    super(
      `Value for "${value}" must be of type ${type}`,
      ErrorCode.INVALID_VALUE,
      originalMessage
    );
  }
}

export class MissingValueError extends FormatError {
  constructor(variableId: string, originalMessage?: string) {
    super(
      `The intl string context variable "${variableId}" was not provided to the string "${originalMessage}"`,
      ErrorCode.MISSING_VALUE,
      originalMessage
    );
  }
}
