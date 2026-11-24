import {availableLocales as cldrLocales} from '@formatjs_generated/cldr.supported-locales/default-content.js'
import {ToString} from '#packages/ecma262-abstract/ToString.js'
import {
  floor,
  createFromConstructor,
  nullClassBase,
  setDataProperty,
  TypeErrorConstructor,
} from '#packages/ecma262-abstract/intrinsics.js'
import {CanonicalizeLocaleList} from '#packages/ecma402-abstract/CanonicalizeLocaleList.js'
import {GetOption} from '#packages/ecma402-abstract/GetOption.js'
import {GetOptionsObject} from '#packages/ecma402-abstract/GetOptionsObject.js'
import {SupportedLocales} from '#packages/ecma402-abstract/SupportedLocales.js'
import {ResolveLocale} from '@formatjs/intl-localematcher'
import {SegmentationRules} from '@formatjs_generated/unicode/cldr-segmentation-rules.js'
import {
  isSurrogate,
  replaceVariables,
} from '#packages/intl-segmenter/segmentation-utils.js'

const RegExpConstructor = RegExp
const regexpExec = RegExp.prototype.exec
const apply = Reflect.apply
const create = Object.create
const keys = Object.keys
const sort = Array.prototype.sort
const hasOwn = Function.prototype.call.bind(Object.prototype.hasOwnProperty)
const indexOf = Function.prototype.call.bind(String.prototype.indexOf) as (
  input: string,
  search: string
) => number
const substring = Function.prototype.call.bind(String.prototype.substring) as (
  input: string,
  start: number,
  end?: number
) => string
const trim = Function.prototype.call.bind(String.prototype.trim) as (
  input: string
) => string
const endsWith = Function.prototype.call.bind(String.prototype.endsWith) as (
  input: string,
  ending: string
) => boolean
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
  return new RegExpConstructor(
    `${after ? '^' : ''}${replaceVariables(variables, rule)}${after ? '' : '$'}`
  )
}

const prepareLocaleSegmentationRules = (
  segmentationTypeValue: SegmentationTypeTypeRaw
): Record<string, SegmentationRule> => {
  const preparedRules: Record<string, SegmentationRule> = create(null)
  const ruleNumbers = keys(segmentationTypeValue.segmentRules)
  for (let i = 0; i < ruleNumbers.length; i++) {
    const ruleNr = ruleNumbers[i]
    const ruleValue = segmentationTypeValue.segmentRules[ruleNr]
    const preparedRule: SegmentationRule = {
      breaks: ruleValue.breaks,
      before: undefined,
      after: undefined,
    }

    if (hasOwn(ruleValue, 'before') && ruleValue.before) {
      preparedRule.before = generateRuleRegex(
        ruleValue.before,
        segmentationTypeValue.variables,
        false
      )
    }
    if (hasOwn(ruleValue, 'after') && ruleValue.after) {
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

// ECMA-402 §19.2.1 https://tc39.es/ecma402/#sec-intl.segmenter.prototype
// ECMA-402 §19.3.1 https://tc39.es/ecma402/#sec-intl.segmenter.prototype.constructor
export class Segmenter extends nullClassBase {
  // ECMA-402 §19.1.1: resolve locale before reading granularity.
  // https://tc39.es/ecma402/#sec-intl.segmenter
  // @ts-expect-error TS2377: extends null and returns its own receiver.
  // oxlint-disable-next-line constructor-super -- The constructor returns its allocated receiver.
  constructor(locales?: string | string[], options?: SegmenterOptions) {
    const receiver = createFromConstructor(new.target, Segmenter.prototype)
    const requestedLocales = CanonicalizeLocaleList(locales)
    options = GetOptionsObject(options)

    const opt = create(null)
    const matcher = GetOption(
      options,
      'localeMatcher',
      'string',
      ['lookup', 'best fit'],
      'best fit'
    )
    opt.localeMatcher = matcher

    // DefaultLocale must be a structurally valid, canonical language tag.
    // ECMA-402 §6.2.3 DefaultLocale, return-value definition.
    // https://tc39.es/ecma402/#sec-defaultlocale
    const r = ResolveLocale(
      Segmenter.availableLocales,
      requestedLocales,
      opt,
      [], // there is no relevantExtensionKeys
      undefined,
      () => 'en',
      'hostDefaultWithLocaleData'
    )
    const granularity = GetOption(
      options,
      'granularity',
      'string',
      ['grapheme', 'word', 'sentence'],
      'grapheme'
    )
    // Rule data is private, including when an option getter changes prototypes.
    // ECMA-402 §19.1.1 steps 7–9 and §19.8.1 steps 3–4.
    // https://tc39.es/ecma402/#sec-intl.segmenter
    const mergedSegmentationTypeValue: SegmentationTypeTypeRaw = {
      ...SegmentationRules.root[granularity],
    }

    // ECMA-402 §19.8.1 steps 5.a and 7 use locale-sensitive boundaries.
    // Regional locales inherit their language's CLDR tailoring.
    // https://tc39.es/ecma402/#sec-findboundary
    const dataLocale = r.dataLocale
    const separator = indexOf(dataLocale, '-')
    const language =
      separator < 0 ? dataLocale : substring(dataLocale, 0, separator)
    const localeKey = hasOwn(SegmentationRules, dataLocale)
      ? dataLocale
      : language
    if (hasOwn(SegmentationRules, localeKey)) {
      const localeOverrides =
        SegmentationRules[localeKey as keyof typeof SegmentationRules]
      if (hasOwn(localeOverrides, granularity)) {
        const localeRules: SegmentationTypeTypeRaw =
          localeOverrides[granularity as keyof typeof localeOverrides]
        mergedSegmentationTypeValue.variables = {
          ...mergedSegmentationTypeValue.variables,
          ...localeRules.variables,
        }
        mergedSegmentationTypeValue.segmentRules = {
          ...mergedSegmentationTypeValue.segmentRules,
          ...localeRules.segmentRules,
        }
        const base = mergedSegmentationTypeValue.suppressions
        const extra = localeRules.suppressions
        const suppressions: string[] = []
        for (let i = 0; i < base.length; i++) {
          setDataProperty(suppressions, i, base[i])
        }
        for (let i = 0; i < extra.length; i++) {
          setDataProperty(suppressions, base.length + i, extra[i])
        }
        mergedSegmentationTypeValue.suppressions = suppressions
      }
    }

    const rules = prepareLocaleSegmentationRules(mergedSegmentationTypeValue)
    const ruleSortedKeys = keys(rules)
    apply(sort, ruleSortedKeys, [(a: string, b: string) => +a - +b])
    writeModelSlot(receiver, {
      locale: r.locale,
      granularity,
      rules,
      ruleSortedKeys,
      mergedSegmentationTypeValue,
    })
    return receiver
  }

  public breaksAt(
    position: number,
    input: string
  ): ReturnType<typeof breaksAtResult> {
    return findBoundary(readModel(this, 'breaksAt'), position, input)
  }

  // ECMA-402 §19.3.3: require the slot, then convert the input to a String.
  // https://tc39.es/ecma402/#sec-intl.segmenter.prototype.segment
  segment(input: string): Segments {
    const model = readModel(this, 'segment')
    return new Segments(this, model, ToString(input))
  }

  // ECMA-402 §19.3.2: return fresh own properties in table order.
  // https://tc39.es/ecma402/#sec-intl.segmenter.prototype.resolvedoptions
  resolvedOptions(): SegmenterResolvedOptions {
    const {locale, granularity} = readModel(this, 'resolvedOptions')
    return {locale, granularity}
  }

  // ECMA-402 §19.2.3 allows locale coverage backed by root segmentation rules.
  // https://tc39.es/ecma402/#sec-intl.segmenter-internal-slots
  static availableLocales: Set<string> = new Set(cldrLocales)
  // ECMA-402 §19.2.2: canonicalize before filtering requested locales.
  // https://tc39.es/ecma402/#sec-intl.segmenter.supportedlocalesof
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

// ECMA-402 §19.8.1 steps 5.a and 7. Test one UTF-16 boundary against UAX #29
// and CLDR tailoring. The caller chooses the search direction.
// https://tc39.es/ecma402/#sec-findboundary
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

  // The boundary search is internal. Use captured operations on primitive
  // strings and private regexps without reading public prototype methods.
  const stringBeforeBreak = substring(input, 0, position)
  const stringAfterBreak = substring(input, position)

  // loop through rules and find a match
  for (let i = 0; i < ruleSortedKeys.length; i++) {
    const ruleKey = ruleSortedKeys[i]
    const {before, after, breaks} = rules[ruleKey]
    if (before && apply(regexpExec, before, [stringBeforeBreak]) === null)
      continue
    if (after && apply(regexpExec, after, [stringAfterBreak]) === null) continue

    // Abbreviations cannot suppress mandatory paragraph boundaries (SB4).
    const {suppressions} = mergedSegmentationTypeValue
    if (breaks && ruleKey !== '4' && suppressions.length) {
      const textBeforeBreak = trim(stringBeforeBreak)
      for (let i = 0; i < suppressions.length; i++) {
        const suppression = suppressions[i]
        // The abbreviation must be a whole word: `S.` suppresses the break in
        // `S. Smith`, but not after `AWS.`.
        if (
          endsWith(textBeforeBreak, suppression) &&
          !endsWithWordCharacter(
            substring(
              textBeforeBreak,
              0,
              textBeforeBreak.length - suppression.length
            )
          )
        ) {
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
  wordCharacters ??= new RegExpConstructor(
    SegmentationRules.root.word.wordCharacters
  )
  return apply(regexpExec, wordCharacters, [segment]) !== null
}

function endsWithWordCharacter(text: string): boolean {
  // The last two code units hold the last code point, whether or not it is
  // a surrogate pair.
  const last = text.length - 1
  if (last < 0) return false
  return isSegmentWordLike(
    substring(text, isSurrogate(text, last) ? last - 1 : last)
  )
}

// ECMA-402 §19.7.1: create a fresh record with UTF-16 index and word status.
// https://tc39.es/ecma402/#sec-createsegmentdataobject
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

// ECMA-402 §19.5.3 https://tc39.es/ecma402/#sec-properties-of-segments-instances
type SegmentState = {
  segmenter: Segmenter
  model: SegmenterInternalSlots
  input: string
}
// ECMA-402 §19.6.3 https://tc39.es/ecma402/#sec-properties-of-segment-iterator-instances
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
  if (!state) throw new TypeErrorConstructor('Incompatible Segmenter receiver')
  return state
}
// Segments creates independent iterators; iterators retain their own position.
// ECMA-402 §19.5.2.2 %IntlSegmentsPrototype% [ %Symbol.iterator% ], step 5.
// https://tc39.es/ecma402/#sec-%intlsegmentsprototype%-%symbol.iterator%
class Segments implements Iterable<SegmentResult> {
  // ECMA-402 §19.5.1 https://tc39.es/ecma402/#sec-createsegmentsobject
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

  containing(positionInput?: number):
    | {
        segment: string
        index: number
        input: string
        isWordLike?: boolean
      }
    | undefined {
    // ECMA-402 §19.5.2.1 containing, step 6: ToIntegerOrInfinity uses ToNumber.
    // https://tc39.es/ecma402/#sec-%intlsegmentsprototype%.containing
    // Unary + rejects BigInt after object coercion and preserves thrown errors.
    // ECMA-262 §7.1.4 ToNumber, steps 2, 8–10.
    // https://tc39.es/ecma262/#sec-tonumber
    const {model, input} = requireState(readSegments, this)
    // ECMA-262 ToIntegerOrInfinity. Undefined becomes NaN before rounding.
    // https://tc39.es/ecma262/#sec-tointegerorinfinity
    const number = +(positionInput as number)
    const position = !number ? 0 : number < 0 ? -floor(-number) : floor(number)

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
    const checkString = substring(input, previousBreakPoint)
    //find next break point
    for (let cursor = 1; cursor <= checkString.length; cursor++) {
      const {breaks} = findBoundary(model, cursor, checkString)
      if (breaks) {
        const segment = substring(checkString, 0, cursor)
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

  // ECMA-402 §19.6.1 https://tc39.es/ecma402/#sec-createsegmentiterator
  constructor(
    segmenter: Segmenter,
    model: SegmenterInternalSlots,
    input: string
  ) {
    writeCursor(this, {segmenter, model, input, lastSegmentIndex: 0})
  }

  // ECMA-402 §19.6.2.1: advance the cursor and return a fresh iterator result.
  // https://tc39.es/ecma402/#sec-%intlsegmentiteratorprototype%.next
  next(): IteratorResult<SegmentResult> {
    const state = requireState(readCursor, this)
    //using only the relevant bit of the string
    const checkString = substring(state.input, state.lastSegmentIndex)

    //loop from the start of the checkString, until exactly length (breaksAt returns break at pos=== lenght)
    for (let position = 1; position <= checkString.length; position++) {
      const {breaks} = findBoundary(state.model, position, checkString)
      if (breaks) {
        const segment = substring(checkString, 0, position)
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

// ECMA-402 §19.5.2 inherits %Object.prototype% and exposes only the segment methods.
// https://tc39.es/ecma402/#sec-%intlsegmentsprototype%-object
Reflect.deleteProperty(Segments.prototype, 'constructor')
Reflect.deleteProperty(SegmentIterator.prototype, 'constructor')

// ECMA-402 §19.6.2 uses %Iterator.prototype%. Get it from a generator's
// prototype chain without calling a replaceable array iterator.
// https://tc39.es/ecma402/#sec-%intlsegmentiteratorprototype%-object
// ECMA-262 §27.8.1 https://tc39.es/ecma262/#sec-properties-of-generator-prototype
const generatorPrototype = Object.getPrototypeOf(function* () {}.prototype)
Object.setPrototypeOf(
  SegmentIterator.prototype,
  Object.getPrototypeOf(generatorPrototype)
)
// ECMA-402 §19.6.2.2 https://tc39.es/ecma402/#sec-%intlsegmentiteratorprototype%.%symbol.tostringtag%
Object.defineProperty(SegmentIterator.prototype, Symbol.toStringTag, {
  value: 'Segmenter String Iterator',
  configurable: true,
})

export type {Segments, SegmentIterator}

// ECMA-402 §19.4 https://tc39.es/ecma402/#sec-properties-of-intl-segmenter-instances
interface SegmenterInternalSlots {
  locale: string
  granularity: NonNullable<SegmenterOptions['granularity']>
  rules: ReturnType<typeof prepareLocaleSegmentationRules>
  ruleSortedKeys: string[]
  mergedSegmentationTypeValue: SegmentationTypeTypeRaw
}

const __INTERNAL_SLOT_MAP__ = new WeakMap<Segmenter, SegmenterInternalSlots>()

const readModelSlot = __INTERNAL_SLOT_MAP__.get.bind(__INTERNAL_SLOT_MAP__)
const writeModelSlot = __INTERNAL_SLOT_MAP__.set.bind(__INTERNAL_SLOT_MAP__)

function readModel(
  receiver: unknown,
  methodName: string
): SegmenterInternalSlots {
  const model = readModelSlot(receiver as Segmenter)
  if (!model) {
    throw new TypeErrorConstructor(
      `Method Intl.Segmenter.prototype.${methodName} called on incompatible receiver`
    )
  }
  return model
}

Object.setPrototypeOf(Segmenter.prototype, Object.prototype)

try {
  // ECMA-402 §19.3.4 https://tc39.es/ecma402/#sec-intl.segmenter.prototype-%symbol.tostringtag%
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
