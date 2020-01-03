import {
  UnitData,
  CurrencyData,
  RawNumberData,
  LDMLPluralRule,
  DecimalFormatNum,
  NumberILD,
  InternalSlotToken,
  SignDisplayPattern,
  CurrencyPattern,
  LDMLPluralRuleMap,
  NumberLocalePatternData,
  SignPattern,
  invariant,
  NotationPattern,
  CurrencySignPattern,
  RawCurrencyData,
} from '@formatjs/intl-utils';
import * as unicodeSymbol_ from 'unicode-12.1.0/General_Category/Symbol/regex';
const S_UNICODE_REGEX: RegExp =
  (unicodeSymbol_ as any).default || unicodeSymbol_;

// What is this number?
// Context: https://github.com/tc39/proposal-unified-intl-numberformat/issues/26
// Right now pattern tree does not have room for different compact notation pattern
// per exponent (e.g for zh-TW, 1000 is just {number}, not {number}K).
// This number is chosen so we generate the most general pattern for compact, e.g
// {number}{compactSymbol} or sth like that
const SPECIAL_NUMBER_HACK = '1000';

// g flag bc this appears twice in accounting pattern
const CURRENCY_SYMBOL_REGEX = /¤/g;

function extractDecimalFormatILD(
  data?: Record<DecimalFormatNum, LDMLPluralRuleMap<string>> | undefined
): Record<DecimalFormatNum, LDMLPluralRuleMap<string>> | undefined {
  if (!data) {
    return;
  }
  return (Object.keys(data) as Array<DecimalFormatNum>).reduce((all, num) => {
    const pattern = data[num];

    all[num] = (Object.keys(pattern) as Array<LDMLPluralRule>).reduce(
      (all: LDMLPluralRuleMap<string>, p) => {
        all[p] = (pattern[p] || '')
          .replace(/[¤0]/g, '') // apostrophe-escaped
          .replace(/'(.*?)'/g, '$1')
          .trim();
        return all;
      },
      {
        other: pattern.other
          .replace(/[¤0]/g, '') // apostrophe-escaped
          .replace(/'(.*?)'/g, '$1')
          .trim(),
      }
    );
    return all;
  }, {} as Record<DecimalFormatNum, LDMLPluralRuleMap<string>>);
}

function extractLDMLPluralRuleMap<T extends object, K extends keyof T>(
  m: LDMLPluralRuleMap<T>,
  k: K
): LDMLPluralRuleMap<T[K]> {
  return (Object.keys(m) as Array<LDMLPluralRule>).reduce(
    (all: LDMLPluralRuleMap<T[K]>, rule) => {
      all[rule] = m[rule]![k];
      return all;
    },
    {other: m.other[k]}
  );
}

export function extractILD(
  units: Record<string, UnitData>,
  currencies: Record<string, CurrencyData>,
  numbers: RawNumberData,
  numberingSystem: string
): NumberILD {
  return {
    decimal: {
      compactShort: extractDecimalFormatILD(
        numbers.decimal[numberingSystem].short
      ),
      compactLong: extractDecimalFormatILD(
        numbers.decimal[numberingSystem].long
      ),
    },
    currency: {
      compactShort: extractDecimalFormatILD(
        numbers.currency[numberingSystem].short
      ),
    },
    symbols: numbers.symbols[numberingSystem],
    currencySymbols: Object.keys(currencies).reduce((all, code) => {
      all[code] = {
        currencyName: currencies[code].displayName,
        currencySymbol: currencies[code].symbol,
        currencyNarrowSymbol:
          currencies[code].narrow || currencies[code].symbol,
      };
      return all;
    }, {} as NumberILD['currencySymbols']),
    unitSymbols: Object.keys(units).reduce((all, unit) => {
      all[unit] = {
        unitSymbol: extractLDMLPluralRuleMap(units[unit].short, 'symbol'),
        unitNarrowSymbol: extractLDMLPluralRuleMap(
          units[unit].narrow,
          'symbol'
        ),
        unitName: extractLDMLPluralRuleMap(units[unit].long, 'symbol'),
      };
      return all;
    }, {} as NumberILD['unitSymbols']),
  };
}

// Credit: https://github.com/andyearnshaw/Intl.js/blob/master/scripts/utils/reduce.js
// Matches CLDR number patterns, e.g. #,##0.00, #,##,##0.00, #,##0.##, 0, etc.
const NUMBER_PATTERN = /[#0](?:[\.,][#0]+)*/g;
const SCIENTIFIC_SLOT = [
  InternalSlotToken.number,
  InternalSlotToken.scientificSeparator,
  InternalSlotToken.scientificExponent,
]
  .map(t => `{${t}}`)
  .join('');

/**
 * Turn compact pattern like `0 trillion` or `¤0 trillion` to
 * `0 {compactSymbol}` or `¤0 {compactSymbol}`
 * @param pattern
 */
function extractCompactSymbol(
  pattern: string,
  slotToken: InternalSlotToken = InternalSlotToken.compactSymbol
): string {
  const compactUnit = pattern
    .replace(/[¤0]/g, '')
    // In case we're processing half-processed things
    .replace(/({\w+})/g, '')
    .trim();
  if (compactUnit) {
    pattern = pattern.replace(compactUnit, `{${slotToken}}`);
  }
  return pattern.replace(/0+/, `{${InternalSlotToken.number}}`);
}

const INSERT_BEFORE_PATTERN_REGEX = /[^\s(]¤/;
const INSERT_AFTER_PATTERN_REGEX = /¤[^\s;]/;

function shouldInsertBefore(currency: string, pattern: string) {
  // surroundingMatch [:digit:] check
  return (
    INSERT_BEFORE_PATTERN_REGEX.test(pattern) &&
    // [:^S:]
    !S_UNICODE_REGEX.test(currency[0])
  );
}

function shouldInsertAfter(currency: string, pattern: string) {
  return (
    INSERT_AFTER_PATTERN_REGEX.test(pattern) &&
    // [:^S:]
    !S_UNICODE_REGEX.test(currency[currency.length - 1])
  );
}

function insertBetween(
  currency: string,
  pattern: string,
  insertBetween: string
): string {
  // Check afterCurrency
  if (shouldInsertAfter(currency, pattern)) {
    return pattern.replace(CURRENCY_SYMBOL_REGEX, `¤${insertBetween}`);
  }

  // Check beforeCurrency
  if (shouldInsertBefore(currency, pattern)) {
    return pattern.replace(CURRENCY_SYMBOL_REGEX, `${insertBetween}¤`);
  }
  return pattern;
}

export class Patterns implements NumberLocalePatternData {
  private units: Record<string, UnitData>;
  private currencies: Record<string, CurrencyData>;
  private numbers: RawNumberData;
  private numberingSystem: string;
  private decimalPatterns?: DecimalPatterns;
  private percentPatterns?: PercentPatterns;
  private unitPatterns?: Record<string, UnitPatterns>;
  private currencyPatterns?: Record<string, CurrencyPatterns>;
  private notation: keyof NotationPattern;
  private _unit?: string;
  private _currency?: string;
  private currencySign?: keyof CurrencySignPattern;
  constructor(
    units: Record<string, UnitData>,
    currencies: Record<string, CurrencyData>,
    numbers: RawNumberData,
    numberingSystem: string,
    notation: 'standard' | 'engineering' | 'scientific' | 'compact',
    compactDisplay: 'short' | 'long',
    unit?: string,
    currency?: string,
    currencySign?: keyof CurrencySignPattern
  ) {
    this.units = units;
    this.currencies = currencies;
    this.numbers = numbers;
    this.numberingSystem = numberingSystem;
    switch (notation) {
      case 'standard':
        this.notation = 'standard';
        break;
      case 'engineering':
      case 'scientific':
        this.notation = 'scientific';
        break;
      case 'compact':
        this.notation =
          compactDisplay === 'long' ? 'compactLong' : 'compactShort';
        break;
    }
    this._unit = unit;
    this._currency = currency;
    this.currencySign = currencySign;
  }

  // Style
  get decimal() {
    if (!this.decimalPatterns) {
      this.decimalPatterns = new DecimalPatterns(
        this.numbers,
        this.numberingSystem,
        this.notation
      );
    }
    return this.decimalPatterns;
  }

  get percent() {
    if (!this.percentPatterns) {
      this.percentPatterns = new PercentPatterns(
        this.numbers,
        this.numberingSystem
      );
    }
    return this.percentPatterns;
  }

  get unit() {
    if (!this.unitPatterns) {
      invariant(!!this._unit, 'unit must be supplied');
      this.unitPatterns = Object.create(null) as Record<string, UnitPatterns>;
      this.unitPatterns[this._unit] = new UnitPatterns(
        this.units,
        this.numbers,
        this.numberingSystem,
        this._unit
      );
    }
    return this.unitPatterns;
  }

  get currency() {
    if (!this.currencyPatterns) {
      invariant(!!this._currency, 'currency must be supplied');
      invariant(!!this.currencySign, 'currencySign must be supplied');
      this.currencyPatterns = Object.create(null) as Record<
        string,
        CurrencyPatterns
      >;
      this.currencyPatterns[this._currency] = new CurrencyPatterns(
        this.currencies,
        this.numbers,
        this.numberingSystem,
        this._currency,
        this.notation,
        this.currencySign
      );
    }
    return this.currencyPatterns;
  }
}

function processSignPattern(
  signPattern: SignPattern,
  fn: (s: string) => string
): SignPattern {
  return {
    positivePattern: fn(signPattern.positivePattern),
    zeroPattern: fn(signPattern.zeroPattern),
    negativePattern: fn(signPattern.negativePattern),
  };
}

function produceSignPattern2(
  patterns: string,
  signDisplay: keyof SignDisplayPattern
): SignPattern {
  invariant(!!patterns, 'Pattern should have existed');
  let [positivePattern, negativePattern] = patterns.split(';');
  if (!negativePattern) {
    negativePattern = `{${InternalSlotToken.minusSign}}${positivePattern}`;
  } else {
    negativePattern = negativePattern.replace(
      '-',
      `{${InternalSlotToken.minusSign}}`
    );
  }

  let alwaysPositivePattern = positivePattern;
  const noSignPattern = positivePattern.replace('+', '');
  if (positivePattern.indexOf('+') > -1) {
    alwaysPositivePattern = positivePattern = positivePattern.replace(
      '+',
      `{${InternalSlotToken.plusSign}}`
    );
  } else {
    alwaysPositivePattern = `{${InternalSlotToken.plusSign}}${positivePattern}`;
  }

  switch (signDisplay) {
    case 'always':
      return {
        positivePattern: alwaysPositivePattern,
        zeroPattern: alwaysPositivePattern,
        negativePattern,
      };
    case 'auto':
      return {
        positivePattern,
        zeroPattern: positivePattern,
        negativePattern,
      };
    case 'exceptZero':
      return {
        positivePattern: alwaysPositivePattern,
        zeroPattern: noSignPattern,
        negativePattern,
      };
    case 'never':
      return {
        positivePattern: noSignPattern,
        zeroPattern: noSignPattern,
        negativePattern: noSignPattern,
      };
  }
}

class UnitPatterns implements SignDisplayPattern, NotationPattern {
  private pattern?: string;
  private signPattern?: SignPattern;
  private notationPattern?: SignPattern;
  private unit: string;
  private units: Record<string, UnitData>;
  private numbers: RawNumberData;
  private numberingSystem: string;
  constructor(
    units: Record<string, UnitData>,
    numbers: RawNumberData,
    numberingSystem: string,
    unit: string
  ) {
    this.unit = unit;
    this.units = units;
    this.numbers = numbers;
    this.numberingSystem = numberingSystem;
  }

  // UnitDisplay
  get narrow() {
    if (!this.pattern) {
      this.pattern = this.units[this.unit].narrow.other.pattern.replace(
        '{1}',
        `{${InternalSlotToken.unitNarrowSymbol}}`
      );
    }
    return this;
  }

  get short() {
    if (!this.pattern) {
      this.pattern = this.units[this.unit].short.other.pattern.replace(
        '{1}',
        `{${InternalSlotToken.unitSymbol}}`
      );
    }
    return this;
  }

  get long() {
    if (!this.pattern) {
      this.pattern = this.units[this.unit].long.other.pattern.replace(
        '{1}',
        `{${InternalSlotToken.unitName}}`
      );
    }
    return this;
  }

  // Sign Display
  get always() {
    if (!this.signPattern) {
      invariant(!!this.pattern, 'Pattern should have existed');
      this.signPattern = produceSignPattern2(this.pattern, 'always');
    }
    return this;
  }

  get auto() {
    if (!this.signPattern) {
      invariant(!!this.pattern, 'Pattern should have existed');
      this.signPattern = produceSignPattern2(this.pattern, 'auto');
    }
    return this;
  }

  get never() {
    if (!this.signPattern) {
      invariant(!!this.pattern, 'Pattern should have existed');
      this.signPattern = produceSignPattern2(this.pattern, 'never');
    }
    return this;
  }

  get exceptZero() {
    if (!this.signPattern) {
      invariant(!!this.pattern, 'Pattern should have existed');
      this.signPattern = produceSignPattern2(this.pattern, 'exceptZero');
    }
    return this;
  }

  // Notation
  get standard() {
    if (!this.notationPattern) {
      invariant(!!this.signPattern, 'Sign Pattern should exist');
      this.notationPattern = processSignPattern(this.signPattern, pattern =>
        pattern.replace('{0}', `{${InternalSlotToken.number}}`)
      );
    }
    return this.notationPattern;
  }
  get scientific() {
    if (!this.notationPattern) {
      invariant(!!this.signPattern, 'Sign Pattern should exist');
      this.notationPattern = processSignPattern(this.signPattern, pattern =>
        pattern.replace('{0}', SCIENTIFIC_SLOT)
      );
    }
    return this.notationPattern;
  }
  get compactShort() {
    if (!this.notationPattern) {
      invariant(!!this.signPattern, 'Sign Pattern should exist');
      const compactShortPattern = extractCompactSymbol(
        this.numbers.decimal[this.numberingSystem].short[SPECIAL_NUMBER_HACK]
          .other,
        InternalSlotToken.compactSymbol
      );
      this.notationPattern = processSignPattern(this.signPattern, pattern =>
        pattern.replace('{0}', compactShortPattern)
      );
    }
    return this.notationPattern;
  }
  get compactLong() {
    if (!this.notationPattern) {
      invariant(!!this.signPattern, 'Sign Pattern should exist');
      const compactLongPattern = extractCompactSymbol(
        this.numbers.decimal[this.numberingSystem].long[SPECIAL_NUMBER_HACK]
          .other,
        InternalSlotToken.compactName
      );
      this.notationPattern = processSignPattern(this.signPattern, pattern =>
        pattern.replace('{0}', compactLongPattern)
      );
    }
    return this.notationPattern;
  }
}

class DecimalPatterns implements SignDisplayPattern, NotationPattern {
  private pattern?: string;
  private signPattern?: SignPattern;
  constructor(
    numbers: RawNumberData,
    numberingSystem: string,
    notation: keyof NotationPattern
  ) {
    switch (notation) {
      case 'standard':
        this.pattern = `{${InternalSlotToken.number}}`;
        break;
      case 'scientific':
        this.pattern = SCIENTIFIC_SLOT;
        break;
      case 'compactShort':
        this.pattern = extractCompactSymbol(
          numbers.decimal[numberingSystem].short[SPECIAL_NUMBER_HACK].other,
          InternalSlotToken.compactSymbol
        );
        break;
      case 'compactLong':
        this.pattern = extractCompactSymbol(
          numbers.decimal[numberingSystem].long[SPECIAL_NUMBER_HACK].other,
          InternalSlotToken.compactName
        );
        break;
    }
  }

  // Sign Display
  get always() {
    if (!this.signPattern) {
      invariant(!!this.pattern, 'Pattern should have existed');
      this.signPattern = produceSignPattern2(this.pattern, 'exceptZero');
    }
    return this;
  }

  get auto() {
    if (!this.signPattern) {
      invariant(!!this.pattern, 'Pattern should have existed');
      this.signPattern = produceSignPattern2(this.pattern, 'exceptZero');
    }
    return this;
  }

  get never() {
    if (!this.signPattern) {
      invariant(!!this.pattern, 'Pattern should have existed');
      this.signPattern = produceSignPattern2(this.pattern, 'exceptZero');
    }
    return this;
  }

  get exceptZero() {
    if (!this.signPattern) {
      invariant(!!this.pattern, 'Pattern should have existed');
      this.signPattern = produceSignPattern2(this.pattern, 'exceptZero');
    }
    return this;
  }

  // Notation
  get standard() {
    invariant(!!this.signPattern, 'Sign Pattern should have existed');
    return this.signPattern;
  }
  get scientific() {
    invariant(!!this.signPattern, 'Sign Pattern should have existed');
    return this.signPattern;
  }
  get compactShort() {
    invariant(!!this.signPattern, 'Sign Pattern should have existed');
    return this.signPattern;
  }
  get compactLong() {
    invariant(!!this.signPattern, 'Sign Pattern should have existed');
    return this.signPattern;
  }
}

class PercentPatterns implements SignDisplayPattern, NotationPattern {
  private pattern?: string;
  private signPattern?: SignPattern;
  private notationPattern?: SignPattern;
  private numbers: RawNumberData;
  private numberingSystem: string;
  constructor(numbers: RawNumberData, numberingSystem: string) {
    this.numbers = numbers;
    this.numberingSystem = numberingSystem;
    this.pattern = numbers.percent[numberingSystem].replace(
      '%',
      `{${InternalSlotToken.percentSign}}`
    );
  }

  // Sign Display
  get always() {
    if (!this.signPattern) {
      invariant(!!this.pattern, 'Pattern should have existed');
      this.signPattern = produceSignPattern2(this.pattern, 'exceptZero');
    }
    return this;
  }

  get auto() {
    if (!this.signPattern) {
      invariant(!!this.pattern, 'Pattern should have existed');
      this.signPattern = produceSignPattern2(this.pattern, 'exceptZero');
    }
    return this;
  }

  get never() {
    if (!this.signPattern) {
      invariant(!!this.pattern, 'Pattern should have existed');
      this.signPattern = produceSignPattern2(this.pattern, 'exceptZero');
    }
    return this;
  }

  get exceptZero() {
    if (!this.signPattern) {
      invariant(!!this.pattern, 'Pattern should have existed');
      this.signPattern = produceSignPattern2(this.pattern, 'exceptZero');
    }
    return this;
  }

  // Notation
  get standard() {
    if (!this.notationPattern) {
      invariant(!!this.signPattern, 'Sign Pattern should have existed');
      this.notationPattern = processSignPattern(this.signPattern, pattern =>
        pattern.replace(NUMBER_PATTERN, `{${InternalSlotToken.number}}`)
      );
    }
    return this.notationPattern;
  }
  get scientific() {
    if (!this.notationPattern) {
      invariant(!!this.signPattern, 'Sign Pattern should have existed');
      this.notationPattern = processSignPattern(this.signPattern, pattern =>
        pattern.replace(NUMBER_PATTERN, SCIENTIFIC_SLOT)
      );
    }
    return this.notationPattern;
  }
  get compactShort() {
    if (!this.notationPattern) {
      invariant(!!this.signPattern, 'Sign Pattern should have existed');
      this.notationPattern = processSignPattern(this.signPattern, pattern =>
        pattern.replace(
          NUMBER_PATTERN,
          extractCompactSymbol(
            this.numbers.decimal[this.numberingSystem].short[
              SPECIAL_NUMBER_HACK
            ].other,
            InternalSlotToken.compactSymbol
          )
        )
      );
    }
    return this.notationPattern;
  }
  get compactLong() {
    if (!this.notationPattern) {
      invariant(!!this.signPattern, 'Sign Pattern should have existed');
      this.notationPattern = processSignPattern(this.signPattern, pattern =>
        pattern.replace(
          NUMBER_PATTERN,
          extractCompactSymbol(
            this.numbers.decimal[this.numberingSystem].long[SPECIAL_NUMBER_HACK]
              .other,
            InternalSlotToken.compactName
          )
        )
      );
    }
    return this.notationPattern;
  }
}

function resolvePatternForCurrencyCode(
  resolvedCurrency: string,
  data: RawCurrencyData,
  notation: keyof NotationPattern,
  currencySign: keyof CurrencySignPattern
): string {
  const shortPattern = data.short;
  const longPattern = ((data as any).long as typeof shortPattern) || data.short;
  let pattern = '';
  // currencySign doesn't matter here but notation does
  switch (notation) {
    case 'compactLong': {
      pattern = longPattern?.[1000].other || data.standard;
      return extractCompactSymbol(
        insertBetween(
          resolvedCurrency,
          pattern,
          data.currencySpacing.beforeInsertBetween
        ),
        InternalSlotToken.compactName
      );
    }
    case 'compactShort':
      pattern = shortPattern?.[1000].other || data.standard;
      return extractCompactSymbol(
        insertBetween(
          resolvedCurrency,
          pattern,
          data.currencySpacing.beforeInsertBetween
        ),
        InternalSlotToken.compactSymbol
      );
    case 'scientific':
      pattern = currencySign === 'accounting' ? data.accounting : data.standard;
      return insertBetween(
        resolvedCurrency,
        pattern,
        data.currencySpacing.beforeInsertBetween
      ).replace(NUMBER_PATTERN, SCIENTIFIC_SLOT);
    case 'standard':
      pattern = currencySign === 'accounting' ? data.accounting : data.standard;
      return insertBetween(
        resolvedCurrency,
        pattern,
        data.currencySpacing.beforeInsertBetween
      ).replace(NUMBER_PATTERN, `{${InternalSlotToken.number}}`);
  }
}

class CurrencyPatterns implements CurrencyPattern, CurrencySignPattern {
  private pattern?: string;
  private currency: string;
  private numbers: RawNumberData;
  private numberingSystem: string;
  private currencies: Record<string, CurrencyData>;
  private notation: keyof NotationPattern;
  private currencySign: keyof CurrencySignPattern;
  private signDisplayPatterns?: CurrencySignDisplayPatterns;
  constructor(
    currencies: Record<string, CurrencyData>,
    numbers: RawNumberData,
    numberingSystem: string,
    currency: string,
    notation: keyof NotationPattern,
    currencySign: keyof CurrencySignPattern
  ) {
    this.currency = currency;
    this.currencies = currencies;
    this.numbers = numbers;
    this.numberingSystem = numberingSystem;
    this.notation = notation;
    this.currencySign = currencySign;
  }
  // CurrencyDisplay
  get code() {
    if (!this.pattern) {
      this.pattern = resolvePatternForCurrencyCode(
        this.currency,
        this.numbers.currency[this.numberingSystem],
        this.notation,
        this.currencySign
      ).replace(CURRENCY_SYMBOL_REGEX, `{${InternalSlotToken.currencyCode}}`);
    }
    return this;
  }

  get symbol() {
    if (!this.pattern) {
      const resolvedCurrency = this.currencies[this.currency].symbol;
      this.pattern = resolvePatternForCurrencyCode(
        resolvedCurrency,
        this.numbers.currency[this.numberingSystem],
        this.notation,
        this.currencySign
      ).replace(CURRENCY_SYMBOL_REGEX, `{${InternalSlotToken.currencySymbol}}`);
    }
    return this;
  }

  get narrowSymbol() {
    if (!this.pattern) {
      const resolvedCurrency = this.currencies[this.currency].narrow;
      this.pattern = resolvePatternForCurrencyCode(
        resolvedCurrency,
        this.numbers.currency[this.numberingSystem],
        this.notation,
        this.currencySign
      ).replace(
        CURRENCY_SYMBOL_REGEX,
        `{${InternalSlotToken.currencyNarrowSymbol}}`
      );
    }
    return this;
  }

  get name() {
    if (!this.pattern) {
      this.pattern = this.numbers.currency[
        this.numberingSystem
      ].unitPattern.replace('{1}', `{${InternalSlotToken.currencyName}}`);
      // currencySign doesn't matter here but notation does
      switch (this.notation) {
        case 'compactLong':
          this.pattern = this.pattern.replace(
            '{0}',
            extractCompactSymbol(
              this.numbers.decimal[this.numberingSystem].long[
                SPECIAL_NUMBER_HACK
              ].other,
              InternalSlotToken.compactName
            )
          );
          break;
        case 'compactShort':
          this.pattern = this.pattern.replace(
            '{0}',
            extractCompactSymbol(
              this.numbers.decimal[this.numberingSystem].short[
                SPECIAL_NUMBER_HACK
              ].other,
              InternalSlotToken.compactSymbol
            )
          );
          break;
        case 'scientific':
          this.pattern = this.pattern.replace(
            '{0}',
            extractCompactSymbol(SCIENTIFIC_SLOT)
          );
          break;
        case 'standard':
          this.pattern = this.pattern.replace(
            '{0}',
            extractCompactSymbol(`{${InternalSlotToken.number}}`)
          );
          break;
      }
      this.pattern = this.pattern.replace(
        CURRENCY_SYMBOL_REGEX,
        `{${InternalSlotToken.currencyName}}`
      );
    }
    return this;
  }

  // CurrencySign
  get accounting() {
    if (!this.signDisplayPatterns) {
      invariant(!!this.pattern, 'Pattern should have existed');
      this.signDisplayPatterns = new CurrencySignDisplayPatterns(this.pattern);
    }
    return this.signDisplayPatterns;
  }

  get standard() {
    if (!this.signDisplayPatterns) {
      invariant(!!this.pattern, 'Pattern should have existed');
      this.signDisplayPatterns = new CurrencySignDisplayPatterns(this.pattern);
    }
    return this.signDisplayPatterns;
  }
}

class CurrencySignDisplayPatterns
  implements SignDisplayPattern, NotationPattern {
  private pattern: string;
  private signPattern?: SignPattern;
  constructor(pattern: string) {
    this.pattern = pattern;
  }
  // Sign Display
  get always() {
    if (!this.signPattern) {
      this.signPattern = produceSignPattern2(this.pattern, 'always');
    }
    return this;
  }

  get auto() {
    if (!this.signPattern) {
      this.signPattern = produceSignPattern2(this.pattern, 'auto');
    }
    return this;
  }

  get never() {
    if (!this.signPattern) {
      this.signPattern = produceSignPattern2(this.pattern, 'never');
    }
    return this;
  }

  get exceptZero() {
    if (!this.signPattern) {
      this.signPattern = produceSignPattern2(this.pattern, 'exceptZero');
    }
    return this;
  }

  // Notation
  get standard() {
    invariant(!!this.signPattern, 'Sign Pattern should exist');
    return this.signPattern;
  }
  get scientific() {
    invariant(!!this.signPattern, 'Sign Pattern should exist');
    return this.signPattern;
  }
  get compactShort() {
    invariant(!!this.signPattern, 'Sign Pattern should exist');
    return this.signPattern;
  }
  get compactLong() {
    invariant(!!this.signPattern, 'Sign Pattern should exist');
    return this.signPattern;
  }
}
