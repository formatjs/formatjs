export enum TYPE {
  /**
   * Raw text
   */
  literal,
  /**
   * Variable w/o any format, e.g `var` in `this is a {var}`
   */
  argument,
  /**
   * Variable w/ number format
   */
  number,
  /**
   * Variable w/ date format
   */
  date,
  /**
   * Variable w/ time format
   */
  time,
  /**
   * Variable w/ select format
   */
  select,
  /**
   * Variable w/ plural format
   */
  plural
}

export interface LocationDetails {
  offset: number;
  line: number;
  column: number;
}
export interface Location {
  start: LocationDetails;
  end: LocationDetails;
}

export interface BaseElement<T extends TYPE> {
  type: T;
  value: string;
  location?: Location;
}

export type LiteralElement = BaseElement<TYPE.literal>;
export type ArgumentElement = BaseElement<TYPE.argument>;

export interface SimpleFormatElement<T extends TYPE> extends BaseElement<T> {
  style?: string;
}

export type NumberElement = SimpleFormatElement<TYPE.number>;
export type DateElement = SimpleFormatElement<TYPE.date>;
export type TimeElement = SimpleFormatElement<TYPE.time>;

export interface SelectOption {
  id: string;
  value: MessageFormatElement[];
  location?: Location;
}

export type ValidPluralRule =
  | 'zero'
  | 'one'
  | 'two'
  | 'few'
  | 'many'
  | 'other'
  | string;

export interface PluralOrSelectOption {
  value: MessageFormatElement[];
  location?: Location;
}

export interface SelectElement extends BaseElement<TYPE.select> {
  options: Record<string, PluralOrSelectOption>;
}

export interface PluralElement extends BaseElement<TYPE.plural> {
  options: Record<ValidPluralRule, PluralOrSelectOption>;
  offset: number;
  pluralType: Intl.PluralRulesOptions['type'];
}

export type MessageFormatElement =
  | LiteralElement
  | ArgumentElement
  | NumberElement
  | DateElement
  | TimeElement
  | SelectElement
  | PluralElement;

/**
 * Type Guards
 */
export function isLiteralElement(
  el: MessageFormatElement
): el is LiteralElement {
  return el.type === TYPE.literal;
}
export function isArgumentElement(
  el: MessageFormatElement
): el is ArgumentElement {
  return el.type === TYPE.argument;
}
export function isNumberElement(el: MessageFormatElement): el is NumberElement {
  return el.type === TYPE.number;
}
export function isDateElement(el: MessageFormatElement): el is DateElement {
  return el.type === TYPE.date;
}
export function isTimeElement(el: MessageFormatElement): el is TimeElement {
  return el.type === TYPE.time;
}
export function isSelectElement(el: MessageFormatElement): el is SelectElement {
  return el.type === TYPE.select;
}
export function isPluralElement(el: MessageFormatElement): el is PluralElement {
  return el.type === TYPE.plural;
}

export function createLiteralElement(value: string): LiteralElement {
  return {
    type: TYPE.literal,
    value
  };
}

export function createNumberElement(
  value: string,
  style?: string
): NumberElement {
  return {
    type: TYPE.number,
    value,
    style
  };
}

export interface Options {
  /**
   * Whether to convert `#` in plural rule options
   * to `{var, number}`
   * Default is true
   */
  normalizeHashtagInPlural?: boolean;
  /**
   * Capture location info in AST
   * Default is false
   */
  captureLocation?: boolean;
}
