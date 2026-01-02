import {readFileSync} from 'fs'
import {join, dirname} from 'path'
import {fileURLToPath} from 'url'
import type {NumberFormatOptions} from '@formatjs/ecma402-abstract'
import type {NumberSkeletonToken} from '@formatjs/icu-skeleton-parser'
// @ts-ignore - WASM module is generated at build time
import wasmInit, {
  parse as wasmParse,
} from './wasm/formatjs_icu_messageformat_parser_wasm.js'

// Type definitions
export interface ExtendedNumberFormatOptions extends NumberFormatOptions {
  scale?: number
}

export enum TYPE {
  literal = 0,
  argument = 1,
  number = 2,
  date = 3,
  time = 4,
  select = 5,
  plural = 6,
  pound = 7,
  tag = 8,
}

export enum SKELETON_TYPE {
  number = 0,
  dateTime = 1,
}

export interface LocationDetails {
  offset: number
  line: number
  column: number
}

export interface Location {
  start: LocationDetails
  end: LocationDetails
}

export interface BaseElement<T extends TYPE> {
  type: T
  value: string
  location?: Location
}

export type LiteralElement = BaseElement<TYPE.literal>
export type ArgumentElement = BaseElement<TYPE.argument>

export interface TagElement extends BaseElement<TYPE.tag> {
  children: MessageFormatElement[]
}

export interface SimpleFormatElement<
  T extends TYPE,
  S extends Skeleton,
> extends BaseElement<T> {
  style?: string | S | null
}

export type NumberElement = SimpleFormatElement<TYPE.number, NumberSkeleton>
export type DateElement = SimpleFormatElement<TYPE.date, DateTimeSkeleton>
export type TimeElement = SimpleFormatElement<TYPE.time, DateTimeSkeleton>

export type ValidPluralRule =
  | 'zero'
  | 'one'
  | 'two'
  | 'few'
  | 'many'
  | 'other'
  | string

export interface PluralOrSelectOption {
  value: MessageFormatElement[]
  location?: Location
}

export interface SelectElement extends BaseElement<TYPE.select> {
  options: Record<string, PluralOrSelectOption>
}

export interface PluralElement extends BaseElement<TYPE.plural> {
  options: Record<ValidPluralRule, PluralOrSelectOption>
  offset: number
  pluralType: Intl.PluralRulesOptions['type']
}

export interface PoundElement {
  type: TYPE.pound
  location?: Location
}

export type MessageFormatElement =
  | ArgumentElement
  | DateElement
  | LiteralElement
  | NumberElement
  | PluralElement
  | PoundElement
  | SelectElement
  | TagElement
  | TimeElement

export interface NumberSkeleton {
  type: SKELETON_TYPE.number
  tokens: NumberSkeletonToken[]
  location?: Location
  parsedOptions: ExtendedNumberFormatOptions
}

export interface DateTimeSkeleton {
  type: SKELETON_TYPE.dateTime
  pattern: string
  location?: Location
  parsedOptions: Intl.DateTimeFormatOptions
}

export type Skeleton = NumberSkeleton | DateTimeSkeleton

export interface ParserOptions {
  ignoreTag?: boolean
  requiresOtherClause?: boolean
  shouldParseSkeletons?: boolean
  captureLocation?: boolean
  locale?: string
}

// Module initialization
const __dirname = dirname(fileURLToPath(import.meta.url))
let initialized = false

async function ensureInitialized(): Promise<void> {
  if (!initialized) {
    // Read the WASM file and initialize the module
    const wasmPath = join(
      __dirname,
      'wasm/formatjs_icu_messageformat_parser_wasm_bg.wasm'
    )
    const wasmBytes = readFileSync(wasmPath)
    await wasmInit(wasmBytes)
    initialized = true
  }
}

/**
 * Parse an ICU MessageFormat string into an AST
 * @param input - The ICU MessageFormat string to parse
 * @param options - Parser options
 * @returns Promise resolving to the parsed AST
 */
export async function parse(
  input: string,
  options?: ParserOptions
): Promise<MessageFormatElement[]> {
  await ensureInitialized()
  const optionsJson = options ? JSON.stringify(options) : undefined
  const jsonString = wasmParse(input, optionsJson)
  return JSON.parse(jsonString)
}
