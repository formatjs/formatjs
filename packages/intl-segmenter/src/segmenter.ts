import {
  CanonicalizeLocaleList,
  GetOption,
  GetOptionsObject,
  SupportedLocales,
  getInternalSlot,
  getMultiInternalSlots,
  setInternalSlot,
} from '@formatjs/ecma402-abstract'
import {ResolveLocale} from '@formatjs/intl-localematcher'
import {SegmentationRules} from './cldr-segmentation-rules.generated.js'
import {isSurrogate, replaceVariables} from './segmentation-utils.js'

// Cached regex patterns for word character detection
// Note: Unicode property escape regex is created at runtime in try-catch
// to avoid compile-time errors when targeting ES5
const WORD_CHARACTERS_BASIC_REGEX = /\w/

// Lazy-initialized Unicode word character regex (null if not supported)
let WORD_CHARACTERS_UNICODE_REGEX: RegExp | null | undefined = undefined

type SegmentationRule = {
  breaks: boolean
  before?: RegExp
  after?: RegExp
}

type SegmentationRuleRaw = {
  breaks: boolean
  before?: string
  after?: string
}

type SegmentationTypeTypeRaw = {
  variables: Record<string, string>
  segmentRules: Record<string, SegmentationRuleRaw>
  suppressions: ReadonlyArray<string>
}

type SegmentResult =
  | {segment: string; breakingRule?: string; nonBreakingRules?: string[]}
  | undefined

export interface SegmenterOptions {
  localeMatcher?: 'lookup' | 'best fit'
  granularity?: 'word' | 'sentence' | 'grapheme'
}

export interface SegmenterResolvedOptions {
  locale: string
  granularity: NonNullable<SegmenterOptions['granularity']>
}

/**
 * Adds $ to before rules and ^ to after rules for strictness
 * Replaces variables
 * Initializes the RegExp
 *
 * @param rule raw rule string from cldr-segmentation-rules.generated
 * @param variables
 * @param after appends ^ if true and $ if false
 * @returns
 */
const generateRuleRegex = (
  rule: string,
  variables: Record<string, string>,
  after: boolean
) => {
  return new RegExp(
    `${after ? '^' : ''}${replaceVariables(variables, rule)}${after ? '' : '$'}`
  )
}

const prepareLocaleSegmentationRules = (
  segmentationTypeValue: SegmentationTypeTypeRaw
) => {
  const preparedRules: Record<string, SegmentationRule> = {}
  for (const ruleNr of Object.keys(segmentationTypeValue.segmentRules)) {
    const ruleValue = segmentationTypeValue.segmentRules[ruleNr]
    const preparedRule: SegmentationRule = {
      breaks: ruleValue.breaks,
    }

    if ('before' in ruleValue && ruleValue.before) {
      preparedRule.before = generateRuleRegex(
        ruleValue.before,
        segmentationTypeValue.variables,
        false
      )
    }
    if ('after' in ruleValue && ruleValue.after) {
      preparedRule.after = generateRuleRegex(
        ruleValue.after,
        segmentationTypeValue.variables,
        true
      )
    }

    preparedRules[ruleNr] = preparedRule
  }
  return preparedRules
}

const breaksAtResult = (
  breaks: boolean,
  matchingRule: string
): {
  breaks: boolean
  matchingRule: string
} => ({
  breaks,
  matchingRule,
})

export class Segmenter {
  private readonly rules
  private readonly ruleSortedKeys
  private readonly mergedSegmentationTypeValue: SegmentationTypeTypeRaw

  constructor(
    locales: string | string[] | undefined,
    options: SegmenterOptions
  ) {
    if (new.target === undefined) {
      throw TypeError(`Constructor Intl.Segmenter requires 'new'`)
    }
    const requestedLocales = CanonicalizeLocaleList(locales)
    options = GetOptionsObject(options)

    const opt = Object.create(null)
    const matcher = GetOption(
      options,
      'localeMatcher',
      'string',
      ['lookup', 'best fit'],
      'best fit'
    )
    opt.localeMatcher = matcher

    const granularity = GetOption(
      options,
      'granularity',
      'string',
      ['word', 'sentence', 'grapheme'],
      'grapheme'
    ) as keyof typeof SegmentationRules.root
    setSlot(this, 'granularity', granularity)

    //TODO: figure out correct availible locales
    const r = ResolveLocale(
      Segmenter.availableLocales, //availible locales
      requestedLocales,
      opt,
      [], // there is no relevantExtensionKeys
      {},
      () => '' //use only root rules
    )
    setSlot(this, 'locale', r.locale)

    //root rules based on granularity
    this.mergedSegmentationTypeValue = SegmentationRules.root[granularity]

    //merge root rules with locale ones if locale is specified
    if (r.locale.length) {
      const localeOverrides =
        SegmentationRules[r.locale as keyof typeof SegmentationRules]
      if (granularity in localeOverrides) {
        const localeSegmentationTypeValue: SegmentationTypeTypeRaw =
          localeOverrides[granularity as keyof typeof localeOverrides]
        this.mergedSegmentationTypeValue.variables = {
          ...this.mergedSegmentationTypeValue.variables,
          ...localeSegmentationTypeValue.variables,
        }
        this.mergedSegmentationTypeValue.segmentRules = {
          ...this.mergedSegmentationTypeValue.segmentRules,
          ...localeSegmentationTypeValue.segmentRules,
        }
        this.mergedSegmentationTypeValue.suppressions = [
          ...this.mergedSegmentationTypeValue.suppressions,
          ...localeSegmentationTypeValue.suppressions,
        ]
      }
    }

    //prepare rules
    this.rules = prepareLocaleSegmentationRules(
      this.mergedSegmentationTypeValue
    )

    //order rule keys
    this.ruleSortedKeys = Object.keys(this.rules).sort(
      (a, b) => Number(a) - Number(b)
    )
  }

  public breaksAt(
    position: number,
    input: string
  ): ReturnType<typeof breaksAtResult> {
    const ruleSortedKeys = this.ruleSortedKeys
    const rules = this.rules
    const mergedSegmentationTypeValue = this.mergedSegmentationTypeValue

    //artificial rule 0.2
    if (position === 0) {
      return breaksAtResult(true, '0.2')
    }

    if (position === input.length) {
      //rule 0.3
      return breaksAtResult(true, '0.3')
    }

    //artificial rule 0.1: js specific, due to es5 regex not being unicode aware
    //number 0.1 chosen to mimic java implementation, but needs to execute after 0.2 and 0.3 to be inside the string bounds
    if (isSurrogate(input, position)) {
      return breaksAtResult(false, '0.1')
    }

    const stringBeforeBreak = input.substring(0, position)
    const stringAfterBreak = input.substring(position)

    //artificial rule 0.4: handle suppressions
    if ('suppressions' in mergedSegmentationTypeValue) {
      for (const suppressions of mergedSegmentationTypeValue.suppressions) {
        if (stringBeforeBreak.trim().endsWith(suppressions)) {
          return breaksAtResult(false, '0.4')
        }
      }
    }

    // loop through rules and find a match
    for (const ruleKey of ruleSortedKeys) {
      const {before, after, breaks} = rules[ruleKey]
      // for debugging
      // if (ruleKey === '16' && position === 4) {
      //   console.log({before, after, stringBeforeBreak, stringAfterBreak})
      // }
      if (before) {
        if (!before.test(stringBeforeBreak)) {
          //didn't match the before part, therfore skipping
          continue
        }
      }

      if (after) {
        if (!after.test(stringAfterBreak)) {
          //didn't match the after part, therfore skipping
          continue
        }
      }

      return breaksAtResult(breaks, ruleKey)
    }

    //artificial rule 999: if no rule matched is Any ÷ Any so return true
    return breaksAtResult(true, '999')
  }

  segment(input: string): SegmentIterator {
    checkReceiver(this, 'segment')
    return new SegmentIterator(this, input)
  }

  resolvedOptions(): SegmenterResolvedOptions {
    checkReceiver(this, 'resolvedOptions')
    return {
      ...getMultiInternalSlots(
        __INTERNAL_SLOT_MAP__,
        this,
        'locale',
        'granularity'
      ),
    }
  }

  static availableLocales: Set<string> = new Set(
    Object.keys(SegmentationRules).filter(key => key !== 'root')
  )
  static supportedLocalesOf(
    locales?: string | string[],
    options?: Pick<SegmenterOptions, 'localeMatcher'>
  ): string[] {
    return SupportedLocales(
      Segmenter.availableLocales,
      CanonicalizeLocaleList(locales),
      options
    )
  }
  public static readonly polyfilled = true
}

/**
 * Determines if a segment is word-like according to Unicode Word Break rules.
 *
 * A segment is considered word-like if it contains alphabetic characters,
 * numbers, or ideographs. Segments containing only whitespace, punctuation,
 * or symbols are not word-like.
 *
 * Per Unicode Word Break (UAX #29) and native Intl.Segmenter implementations,
 * this matches segments that contain characters from word character classes:
 * ALetter, Hebrew_Letter, Numeric, Katakana, Hiragana, and Ideographic.
 *
 * @param segment - The text segment to check
 * @param matchingRule - The word break rule that created this segment
 * @returns true if the segment is word-like
 */
function isSegmentWordLike(segment: string, matchingRule: string): boolean {
  // Primary check: Does the segment contain word characters?
  // Word-like segments contain letters (including ideographs), numbers,
  // or connecting characters like apostrophes within words
  //
  // Regex matches:
  // - Letters: \p{L} (all Unicode letters)
  // - Numbers: \p{N} (all Unicode numbers)
  // - Marks: \p{M} (combining marks, typically part of letters)
  //
  // Note: Using Unicode property escapes which work in modern JS engines
  // and are necessary for proper internationalization

  // Lazy-initialize Unicode regex on first use
  if (WORD_CHARACTERS_UNICODE_REGEX === undefined) {
    try {
      // Create Unicode property escape regex at runtime to avoid compile-time TS1501 error
      WORD_CHARACTERS_UNICODE_REGEX = new RegExp('[\\p{L}\\p{N}\\p{M}]', 'u')
    } catch {
      // Environment doesn't support Unicode property escapes
      WORD_CHARACTERS_UNICODE_REGEX = null
    }
  }

  let hasWordCharacters: boolean
  if (WORD_CHARACTERS_UNICODE_REGEX) {
    // Check if segment contains word characters using Unicode property escapes
    // This matches the behavior of native Intl.Segmenter in Chrome/Firefox
    hasWordCharacters = WORD_CHARACTERS_UNICODE_REGEX.test(segment)
  } else {
    // Fallback for environments without Unicode property escapes
    // Match basic word characters: letters, numbers, underscores
    hasWordCharacters = WORD_CHARACTERS_BASIC_REGEX.test(segment)
  }

  // If segment contains word characters, it's word-like
  if (hasWordCharacters) {
    return true
  }

  // If no word characters, check if it's definitely not word-like via rules
  // Non-word-like rules per Unicode Word Break specification (UAX #29):
  // https://unicode.org/reports/tr29/#Word_Boundaries
  //
  // WB3a (3.1): Break before newlines (sot ÷ (Newline | CR | LF))
  // WB3b (3.2): Break after newlines ((Newline | CR | LF) ÷ eot)
  // WB3d (3.4): Keep horizontal whitespace together (WSegSpace × WSegSpace)
  //
  // These rules specifically identify non-word segments like line breaks and whitespace
  const definitelyNotWordLikeRules = ['3.1', '3.2', '3.4']

  if (definitelyNotWordLikeRules.includes(matchingRule)) {
    return false
  }

  // For segments without word characters and not matching specific non-word rules,
  // return false (e.g., punctuation, symbols, whitespace via rule 999)
  return false
}

const createSegmentDataObject = (
  segmenter: Segmenter,
  segment: string,
  index: number,
  input: string,
  matchingRule: string
) => {
  const returnValue: {
    segment: string
    index: number
    input: string
    isWordLike?: boolean
  } = {
    segment,
    index,
    input,
  }
  if (getSlot(segmenter, 'granularity') === 'word') {
    returnValue.isWordLike = isSegmentWordLike(segment, matchingRule)
  }
  return returnValue
}
class SegmentIterator
  implements Iterable<SegmentResult>, Iterator<SegmentResult>
{
  private readonly segmenter
  private lastSegmentIndex
  private input
  constructor(segmenter: Segmenter, input: string) {
    this.segmenter = segmenter
    this.lastSegmentIndex = 0
    if (typeof input == 'symbol') {
      throw TypeError(`Input must not be a symbol`)
    }
    this.input = String(input)
  }

  [Symbol.iterator](): SegmentIterator {
    return new SegmentIterator(this.segmenter, this.input)
  }

  next():
    | {
        done: boolean
        value: {
          segment: string
          index: number
          input: string
          isWordLike?: boolean
        }
      }
    | {
        done: boolean
        value: undefined
      } {
    //using only the relevant bit of the string
    let checkString = this.input.substring(this.lastSegmentIndex)

    //loop from the start of the checkString, until exactly length (breaksAt returns break at pos=== lenght)
    for (let position = 1; position <= checkString.length; position++) {
      const {breaks, matchingRule} = this.segmenter.breaksAt(
        position,
        checkString
      )
      if (breaks) {
        const segment = checkString.substring(0, position)
        const index = this.lastSegmentIndex
        this.lastSegmentIndex += position

        return {
          done: false,
          value: createSegmentDataObject(
            this.segmenter,
            segment,
            index,
            this.input,
            matchingRule
          ),
        }
      }
    }
    //no segment was found by the loop, therefore the segmentation is done
    return {done: true, value: undefined}
  }

  containing(positionInput: number):
    | {
        segment: string
        index: number
        input: string
        isWordLike?: boolean
      }
    | undefined {
    if (typeof positionInput === 'bigint') {
      throw TypeError('Index must not be a BigInt')
    }

    let position = Number(positionInput)

    //https://tc39.es/ecma262/#sec-tointegerorinfinity
    // 2. If number is NaN, +0𝔽, or -0𝔽, return 0.
    if (isNaN(position) || !position) {
      position = 0
    }
    // 5. Let integer be floor(abs(ℝ(number))).
    // 6. If number < -0𝔽, set integer to -integer.
    position = Math.floor(Math.abs(position)) * (position < 0 ? -1 : 1)

    if (position < 0 || position >= this.input.length) {
      return undefined
    }

    //find previous break point
    let previousBreakPoint = 0
    if (position === 0) {
      previousBreakPoint = 0
    } else {
      const checkString = this.input
      for (let cursor = position; cursor >= 0; cursor--) {
        const {breaks} = this.segmenter.breaksAt(cursor, checkString)
        if (breaks) {
          previousBreakPoint = cursor
          break
        }
      }
    }
    let checkString = this.input.substring(previousBreakPoint)
    //find next break point
    for (let cursor = 1; cursor <= checkString.length; cursor++) {
      const {breaks, matchingRule} = this.segmenter.breaksAt(
        cursor,
        checkString
      )
      if (breaks) {
        const segment = checkString.substring(0, cursor)
        return createSegmentDataObject(
          this.segmenter,
          segment,
          previousBreakPoint,
          this.input,
          matchingRule
        )
      }
    }
  }
}

export type {SegmentIterator}

interface SegmenterInternalSlots {
  locale: string
  granularity: NonNullable<SegmenterOptions['granularity']>
}

const __INTERNAL_SLOT_MAP__ = new WeakMap<Segmenter, SegmenterInternalSlots>()

function getSlot<K extends keyof SegmenterInternalSlots>(
  instance: Segmenter,
  key: K
): SegmenterInternalSlots[K] {
  return getInternalSlot(__INTERNAL_SLOT_MAP__, instance, key)
}

function setSlot<K extends keyof SegmenterInternalSlots>(
  instance: Segmenter,
  key: K,
  value: SegmenterInternalSlots[K]
): void {
  setInternalSlot(__INTERNAL_SLOT_MAP__, instance, key, value)
}

function checkReceiver(receiver: unknown, methodName: string) {
  if (!(receiver instanceof Segmenter)) {
    throw TypeError(
      `Method Intl.Segmenter.prototype.${methodName} called on incompatible receiver`
    )
  }
}

try {
  // IE11 does not have Symbol
  if (typeof Symbol !== 'undefined') {
    Object.defineProperty(Segmenter.prototype, Symbol.toStringTag, {
      value: 'Intl.Segmenter',
      writable: false,
      enumerable: false,
      configurable: true,
    })
  }

  //github.com/tc39/test262/blob/main/test/intl402/Segmenter/constructor/length.js
  Object.defineProperty(Segmenter.prototype.constructor, 'length', {
    value: 0,
    writable: false,
    enumerable: false,
    configurable: true,
  })
  // https://github.com/tc39/test262/blob/main/test/intl402/Segmenter/constructor/supportedLocalesOf/length.js
  Object.defineProperty(Segmenter.supportedLocalesOf, 'length', {
    value: 1,
    writable: false,
    enumerable: false,
    configurable: true,
  })
} catch {
  // Meta fix so we're test262-compliant, not important
}
