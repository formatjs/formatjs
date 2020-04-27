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
  plural,
  /**
   * Only possible within plural argument.
   * This is the `#` symbol that will be substituted with the count.
   */
  pound,
  /**
   * XML-like tag
   */
  tag,
}

export const enum SKELETON_TYPE {
  number,
  dateTime,
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
export interface TagElement {
  type: TYPE.tag;
  value: string;
  children: MessageFormatElement[];
  location?: Location;
}

export interface SimpleFormatElement<T extends TYPE, S extends Skeleton>
  extends BaseElement<T> {
  style?: string | S | null;
}

export type NumberElement = SimpleFormatElement<TYPE.number, NumberSkeleton>;
export type DateElement = SimpleFormatElement<TYPE.date, DateTimeSkeleton>;
export type TimeElement = SimpleFormatElement<TYPE.time, DateTimeSkeleton>;

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

export interface PoundElement {
  type: TYPE.pound;
  location?: Location;
}

export type MessageFormatElement =
  | LiteralElement
  | ArgumentElement
  | NumberElement
  | DateElement
  | TimeElement
  | SelectElement
  | PluralElement
  | TagElement
  | PoundElement;

export interface NumberSkeletonToken {
  stem: string;
  options: string[];
}

export interface NumberSkeleton {
  type: SKELETON_TYPE.number;
  tokens: NumberSkeletonToken[];
  location?: Location;
}

export interface DateTimeSkeleton {
  type: SKELETON_TYPE.dateTime;
  pattern: string;
  location?: Location;
}

export type Skeleton = NumberSkeleton | DateTimeSkeleton;

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
export function isPoundElement(el: MessageFormatElement): el is PoundElement {
  return el.type === TYPE.pound;
}
export function isTagElement(el: MessageFormatElement): el is TagElement {
  return el.type === TYPE.tag;
}
export function isNumberSkeleton(
  el: NumberElement['style'] | Skeleton
): el is NumberSkeleton {
  return !!(el && typeof el === 'object' && el.type === SKELETON_TYPE.number);
}
export function isDateTimeSkeleton(
  el?: DateElement['style'] | TimeElement['style'] | Skeleton
): el is DateTimeSkeleton {
  return !!(el && typeof el === 'object' && el.type === SKELETON_TYPE.dateTime);
}

export function createLiteralElement(value: string): LiteralElement {
  return {
    type: TYPE.literal,
    value,
  };
}

export function createNumberElement(
  value: string,
  style?: string | null
): NumberElement {
  return {
    type: TYPE.number,
    value,
    style,
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
