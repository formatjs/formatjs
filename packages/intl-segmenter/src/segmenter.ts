import {SegmentationRules} from './cldr-segmentation-rules.generated'
import {replaceVariables, isSurrogate} from './segmentation-utils'
import {
  GetOption,
  SupportedLocales,
  CanonicalizeLocaleList,
  GetOptionsObject,
  // getInternalSlot,
  setInternalSlot,
  getMultiInternalSlots,
} from '@formatjs/ecma402-abstract'
import {ResolveLocale} from '@formatjs/intl-localematcher'

const {root: rootSegmentationRules, ...localeSegmentationRules} =
  SegmentationRules

//prep the root rules,
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
  surpressions: string[]
}

type SegmentResult =
  | {segment: string; breakingRule?: string; nonBreakingRules?: string[]}
  | undefined

// type SegmenterGranularity = 'word' | 'sentence' | 'grapheme'

export interface SegmenterOptions {
  localeMatcher?: 'lookup' | 'best fit'
  granularity?: 'word' | 'sentence' | 'grapheme'
}

export interface SegmenterResolvedOptions {
  locale: string
  granularity: NonNullable<SegmenterOptions['granularity']>
}

/**
 * Adds $ to before rules and ^ to after rules for strickness
 * Replaces variables
 * Initializes the RegExp
 *
 * @param rule
 * @param variables
 * @param after
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

    const r = ResolveLocale(
      Segmenter.availableLocales, //availible locales
      requestedLocales,
      opt,
      [], // there is no relevantExtensionKeys
      {},
      () => '' //use only root rules
    )

    setSlot(this, 'locale', r.locale)

    // rootSegmentationRules
    // localeSegmentationRules

    //based on locale merge root with locale, else use root
    //prep the rules

    this.mergedSegmentationTypeValue = SegmentationRules.root[granularity]

    //merge with locale
    if (r.locale.length) {
      const localeOverrides =
        localeSegmentationRules[
          r.locale as keyof typeof localeSegmentationRules
        ]
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
        this.mergedSegmentationTypeValue.surpressions = [
          ...this.mergedSegmentationTypeValue.surpressions,
          ...localeSegmentationTypeValue.surpressions,
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

  public breaksAt(position: number, input: string) {
    const ruleSortedKeys = this.ruleSortedKeys
    const rules = this.rules
    const mergedSegmentationTypeValue = this.mergedSegmentationTypeValue

    //todo: add return debug? which rule
    if (position === 0) {
      //rule 0.2
      return true
    }

    if (position === input.length) {
      //rule 0.3
      return true
    }

    //js specific, due to es5 regex not being unicode aware 0.4
    if (isSurrogate(input, position)) {
      return false
    }

    const stringBeforeBreak = input.substring(0, position)
    const stringAfterBreak = input.substring(position)

    //handle surpressions
    if ('surpressions' in mergedSegmentationTypeValue) {
      for (const surpression of mergedSegmentationTypeValue.surpressions) {
        if (stringBeforeBreak.trim().endsWith(surpression)) {
          return false
        }
      }
    }

    // loop through rules and find a match
    for (const ruleKey of ruleSortedKeys) {
      const {before, after, breaks} = rules[ruleKey]
      // if (ruleKey === '12' || ruleKey === '13') {
      //   console.log({before, after, breaks})
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

      //got here, a rule was matched!
      // console.log(`pos: ${position} matched a rule ${ruleKey}`, breaks)

      return breaks
    }

    //all rules checked, none matched
    // console.log(`no rule matched at ${position}`)
    //if no rule matched is Any ÷ Any so return true
    return true
  }

  segment(input: string) {
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

  static availableLocales = new Set(Object.keys(localeSegmentationRules))
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
      throw TypeError(`Input must not be asymbol`)
    }
    this.input = String(input)
  }

  [Symbol.iterator]() {
    return new SegmentIterator(this.segmenter, this.input)
  }

  next() {
    //using only the relevant bit of the string
    let checkString = this.input.substring(this.lastSegmentIndex)

    //loop from the start of the checkString, until exactly length (breaksAt returns break at pos=== lenght)
    for (let position = 1; position <= checkString.length; position++) {
      const brk = this.segmenter.breaksAt(position, checkString)
      if (brk) {
        const segment = checkString.substring(0, position)
        const index = this.lastSegmentIndex
        this.lastSegmentIndex += position
        return {done: false, value: {segment, index, input: this.input}}
      }
    }
    //loop was skipped therfore the segmentation must be done!
    return {done: true, value: undefined}
  }

  containing(positionInput: number) {
    if (typeof positionInput === 'bigint') {
      throw TypeError('Index must not be a BigInt')
    }

    let position = Number(positionInput)

    if (isNaN(position) || !position) {
      position = 0
    }
    if (position < 0 || position >= this.input.length) {
      return undefined
    }
    position = Math.floor(position)

    //find previous break point
    let previousBreakPoint = 0
    if (position === 0) {
      previousBreakPoint = 0
    } else {
      const checkString = this.input
      for (let cursor = position; cursor >= 0; cursor--) {
        const brk = this.segmenter.breaksAt(cursor, checkString)
        if (brk) {
          previousBreakPoint = cursor
          break
        }
      }
    }
    let checkString = this.input.substring(previousBreakPoint)
    //find next break point
    for (let cursor = 1; cursor <= checkString.length; cursor++) {
      const brk = this.segmenter.breaksAt(cursor, checkString)
      if (brk) {
        const segment = checkString.substring(0, cursor)
        return {segment, index: previousBreakPoint, input: this.input}
      }
    }
  }
}

interface SegmenterInternalSlots {
  locale: string
  granularity: NonNullable<SegmenterOptions['granularity']>
}

const __INTERNAL_SLOT_MAP__ = new WeakMap<Segmenter, SegmenterInternalSlots>()

// function getSlot<K extends keyof SegmenterInternalSlots>(
//   instance: Segmenter,
//   key: K
// ): SegmenterInternalSlots[K] {
//   return getInternalSlot(__INTERNAL_SLOT_MAP__, instance, key)
// }

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
  https: Object.defineProperty(Segmenter.prototype.constructor, 'length', {
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
} catch (e) {
  // Meta fix so we're test262-compliant, not important
}
