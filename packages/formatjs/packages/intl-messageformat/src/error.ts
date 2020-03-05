export const enum ErrorCode {
  // When we have a placeholder but no value to format
  MISSING_VALUE,
  // When value supplied is invalid
  INVALID_VALUE,
  // When we need specific Intl API but it's not available
  MISSING_INTL_API,
}

export class FormatError extends Error {
  public readonly code: ErrorCode;
  constructor(msg: string, code: ErrorCode) {
    super(msg);
    this.code = code;
  }
  public toString() {
    return `[formatjs Error: ${this.code}] ${this.message}`;
  }
}

export class InvalidValueError extends FormatError {
  constructor(variableId: string, value: any, options: string[]) {
    super(
      `Invalid values for "${variableId}": "${value}". Options are "${Object.keys(
        options
      ).join('", "')}"`,
      ErrorCode.INVALID_VALUE
    );
  }
}

export class MissingValueError extends FormatError {
  constructor(variableId: string, originalMessage?: string) {
    super(
      `The intl string context variable "${variableId}" was not provided to the string "${originalMessage}"`,
      ErrorCode.MISSING_VALUE
    );
  }
}
