import {availableLocales as cldrLocales} from '@formatjs_generated/cldr.supported-locales/default-content.js'
import {ToString} from '#packages/ecma262-abstract/ToString.js'
import {CanonicalizeLocaleList} from '#packages/ecma402-abstract/CanonicalizeLocaleList.js'
import {GetOption} from '#packages/ecma402-abstract/GetOption.js'
import {GetOptionsObject} from '#packages/ecma402-abstract/GetOptionsObject.js'
import {SupportedLocales} from '#packages/ecma402-abstract/SupportedLocales.js'
import {setInternalSlot} from '#packages/ecma402-abstract/utils.js'
import {ResolveLocale} from '@formatjs/intl-localematcher'
import {SegmentationRules} from '@formatjs_generated/unicode/cldr-segmentation-rules.js'
import {
  isSurrogate,
  replaceVariables,
} from '#packages/intl-segmenter/segmentation-utils.js'

let wordCharacters: RegExp | undefined

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

type SegmentResult = {
  segment: string
  index: number
  input: string
  isWordLike?: boolean
}

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
): Record<string, SegmentationRule> => {
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

    // DefaultLocale must be a structurally valid, canonical language tag.
    // ECMA-402 §6.2.3 DefaultLocale, return-value definition.
    // https://tc39.es/ecma402/#sec-defaultlocale
    // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locales-currencies-tz.html#L109
    const r = ResolveLocale(
      Segmenter.availableLocales,
      requestedLocales,
      opt,
      [], // there is no relevantExtensionKeys
      {},
      () => 'en'
    )
    setSlot(this, 'locale', r.locale)

    //root rules based on granularity
    const mergedSegmentationTypeValue: SegmentationTypeTypeRaw = {
      ...SegmentationRules.root[granularity],
    }

    // ECMA-402 §19.8.1 steps 5.a and 7 use locale-sensitive boundaries.
    // Regional locales inherit their language's CLDR tailoring.
    // https://tc39.es/ecma402/#sec-findboundary
    // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/segmenter.html#L398-L406
    if (r.locale.length) {
      const localeOverrides =
        SegmentationRules[r.locale as keyof typeof SegmentationRules] ||
        SegmentationRules[
          r.locale.split('-')[0] as keyof typeof SegmentationRules
        ]
      if (localeOverrides && granularity in localeOverrides) {
        const localeSegmentationTypeValue: SegmentationTypeTypeRaw =
          localeOverrides[granularity as keyof typeof localeOverrides]
        mergedSegmentationTypeValue.variables = {
          ...mergedSegmentationTypeValue.variables,
          ...localeSegmentationTypeValue.variables,
        }
        mergedSegmentationTypeValue.segmentRules = {
          ...mergedSegmentationTypeValue.segmentRules,
          ...localeSegmentationTypeValue.segmentRules,
        }
        mergedSegmentationTypeValue.suppressions = [
          ...mergedSegmentationTypeValue.suppressions,
          ...localeSegmentationTypeValue.suppressions,
        ]
      }
    }

    const rules = prepareLocaleSegmentationRules(mergedSegmentationTypeValue)
    const ruleSortedKeys = Object.keys(rules).sort(
      (a, b) => Number(a) - Number(b)
    )
    setSlot(this, 'rules', rules)
    setSlot(this, 'ruleSortedKeys', ruleSortedKeys)
    setSlot(this, 'mergedSegmentationTypeValue', mergedSegmentationTypeValue)
  }

  public breaksAt(
    position: number,
    input: string
  ): ReturnType<typeof breaksAtResult> {
    return findBoundary(readModel(this, 'breaksAt'), position, input)
  }

  segment(input: string): Segments {
    const model = readModel(this, 'segment')
    return new Segments(this, model, ToString(input))
  }

  resolvedOptions(): SegmenterResolvedOptions {
    const {locale, granularity} = readModel(this, 'resolvedOptions')
    return {locale, granularity}
  }

  // ECMA-402 §19.2.3 allows locale coverage backed by root segmentation rules.
  // https://tc39.es/ecma402/#sec-intl.segmenter-internal-slots
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/segmenter.html#L64-L66
  static availableLocales: Set<string> = new Set(cldrLocales)
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

function findBoundary(
  model: SegmenterInternalSlots,
  position: number,
  input: string
): ReturnType<typeof breaksAtResult> {
  const {ruleSortedKeys, rules, mergedSegmentationTypeValue} = model

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

    // Abbreviations cannot suppress mandatory paragraph boundaries (SB4).
    if (breaks && ruleKey !== '4') {
      for (const suppression of mergedSegmentationTypeValue.suppressions) {
        if (stringBeforeBreak.trim().endsWith(suppression)) {
          return breaksAtResult(false, '0.4')
        }
      }
    }
    return breaksAtResult(breaks, ruleKey)
  }

  //artificial rule 999: if no rule matched is Any ÷ Any so return true
  return breaksAtResult(true, '999')
}

function isSegmentWordLike(segment: string): boolean {
  wordCharacters ??= new RegExp(SegmentationRules.root.word.wordCharacters)
  return wordCharacters.test(segment)
}

const createSegmentDataObject = (
  model: SegmenterInternalSlots,
  segment: string,
  index: number,
  input: string
): SegmentResult => {
  return model.granularity === 'word'
    ? {segment, index, input, isWordLike: isSegmentWordLike(segment)}
    : {segment, index, input}
}

type SegmentState = {
  segmenter: Segmenter
  model: SegmenterInternalSlots
  input: string
}
type CursorState = SegmentState & {lastSegmentIndex: number}
const segmentStates = new WeakMap<object, SegmentState>()
const cursorStates = new WeakMap<object, CursorState>()
const readSegments = segmentStates.get.bind(segmentStates)
const writeSegments = segmentStates.set.bind(segmentStates)
const readCursor = cursorStates.get.bind(cursorStates)
const writeCursor = cursorStates.set.bind(cursorStates)
function requireState<T>(
  read: (receiver: object) => T | undefined,
  receiver: object
): T {
  const state = read(receiver)
  if (!state) throw new TypeError('Incompatible Segmenter receiver')
  return state
}
// Segments creates independent iterators; iterators retain their own position.
// ECMA-402 §19.5.2.2 %IntlSegmentsPrototype% [ %Symbol.iterator% ], step 5.
// https://tc39.es/ecma402/#sec-%intlsegmentsprototype%-%symbol.iterator%
// https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/segmenter.html#L230
class Segments implements Iterable<SegmentResult> {
  constructor(
    segmenter: Segmenter,
    model: SegmenterInternalSlots,
    input: string
  ) {
    writeSegments(this, {segmenter, model, input})
  }

  [Symbol.iterator](): SegmentIterator {
    const {segmenter, model, input} = requireState(readSegments, this)
    return new SegmentIterator(segmenter, model, input)
  }

  containing(positionInput: number):
    | {
        segment: string
        index: number
        input: string
        isWordLike?: boolean
      }
    | undefined {
    // ECMA-402 §19.5.2.1 containing, step 6: ToIntegerOrInfinity uses ToNumber.
    // https://tc39.es/ecma402/#sec-%intlsegmentsprototype%.containing
    // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/segmenter.html#L214
    // Unary + rejects BigInt after object coercion and preserves thrown errors.
    // ECMA-262 §7.1.4 ToNumber, steps 2, 8–10.
    // https://tc39.es/ecma262/#sec-tonumber
    // https://github.com/tc39/ecma262/blob/dcf59856a8184792a9e42f0ffb7dc064094a5dcc/spec.html#L5183-L5191
    const {model, input} = requireState(readSegments, this)
    let position = +positionInput

    //https://tc39.es/ecma262/#sec-tointegerorinfinity
    // 2. If number is NaN, +0𝔽, or -0𝔽, return 0.
    if (isNaN(position) || !position) {
      position = 0
    }
    // 5. Let integer be floor(abs(ℝ(number))).
    // 6. If number < -0𝔽, set integer to -integer.
    position = Math.floor(Math.abs(position)) * (position < 0 ? -1 : 1)

    if (position < 0 || position >= input.length) {
      return undefined
    }

    //find previous break point
    let previousBreakPoint = 0
    if (position === 0) {
      previousBreakPoint = 0
    } else {
      const checkString = input
      for (let cursor = position; cursor >= 0; cursor--) {
        const {breaks} = findBoundary(model, cursor, checkString)
        if (breaks) {
          previousBreakPoint = cursor
          break
        }
      }
    }
    let checkString = input.substring(previousBreakPoint)
    //find next break point
    for (let cursor = 1; cursor <= checkString.length; cursor++) {
      const {breaks} = findBoundary(model, cursor, checkString)
      if (breaks) {
        const segment = checkString.substring(0, cursor)
        return createSegmentDataObject(
          model,
          segment,
          previousBreakPoint,
          input
        )
      }
    }
  }
}

class SegmentIterator
  implements Iterable<SegmentResult>, Iterator<SegmentResult>
{
  declare [Symbol.iterator]: () => SegmentIterator

  constructor(
    segmenter: Segmenter,
    model: SegmenterInternalSlots,
    input: string
  ) {
    writeCursor(this, {segmenter, model, input, lastSegmentIndex: 0})
  }

  next(): IteratorResult<SegmentResult> {
    const state = requireState(readCursor, this)
    //using only the relevant bit of the string
    let checkString = state.input.substring(state.lastSegmentIndex)

    //loop from the start of the checkString, until exactly length (breaksAt returns break at pos=== lenght)
    for (let position = 1; position <= checkString.length; position++) {
      const {breaks} = findBoundary(state.model, position, checkString)
      if (breaks) {
        const segment = checkString.substring(0, position)
        const index = state.lastSegmentIndex
        state.lastSegmentIndex += position

        return {
          value: createSegmentDataObject(
            state.model,
            segment,
            index,
            state.input
          ),
          done: false,
        }
      }
    }
    //no segment was found by the loop, therefore the segmentation is done
    return {value: undefined, done: true}
  }
}

Reflect.deleteProperty(Segments.prototype, 'constructor')
Reflect.deleteProperty(SegmentIterator.prototype, 'constructor')

// %IntlSegmentIteratorPrototype% inherits the standard iterator prototype.
// ECMA-402 §19.6.2 The %IntlSegmentIteratorPrototype% Object, third bullet.
// https://tc39.es/ecma402/#sec-%intlsegmentiteratorprototype%-object
// https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/segmenter.html#L279
Object.setPrototypeOf(
  SegmentIterator.prototype,
  Object.getPrototypeOf(Object.getPrototypeOf([][Symbol.iterator]()))
)
Object.defineProperty(SegmentIterator.prototype, Symbol.toStringTag, {
  value: 'Segmenter String Iterator',
  configurable: true,
})

export type {Segments, SegmentIterator}

interface SegmenterInternalSlots {
  locale: string
  granularity: NonNullable<SegmenterOptions['granularity']>
  rules: ReturnType<typeof prepareLocaleSegmentationRules>
  ruleSortedKeys: string[]
  mergedSegmentationTypeValue: SegmentationTypeTypeRaw
}

const __INTERNAL_SLOT_MAP__ = new WeakMap<Segmenter, SegmenterInternalSlots>()

const readModelSlot = __INTERNAL_SLOT_MAP__.get.bind(__INTERNAL_SLOT_MAP__)

function setSlot<K extends keyof SegmenterInternalSlots>(
  instance: Segmenter,
  key: K,
  value: SegmenterInternalSlots[K]
): void {
  setInternalSlot(__INTERNAL_SLOT_MAP__, instance, key, value)
}

function readModel(
  receiver: unknown,
  methodName: string
): SegmenterInternalSlots {
  const model = readModelSlot(receiver as Segmenter)
  if (!model) {
    throw TypeError(
      `Method Intl.Segmenter.prototype.${methodName} called on incompatible receiver`
    )
  }
  return model
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
