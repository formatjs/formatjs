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
  CompactSignPattern,
} from '@formatjs/intl-utils';
import * as unicodeSymbol_ from 'unicode-12.1.0/General_Category/Symbol/regex';
const S_UNICODE_REGEX: RegExp =
  (unicodeSymbol_ as any).default || unicodeSymbol_;

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
  }, Object.create(null) as Record<DecimalFormatNum, LDMLPluralRuleMap<string>>);
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
    }, Object.create(null) as NumberILD['currencySymbols']),
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
    }, Object.create(null) as NumberILD['unitSymbols']),
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
  private _unit?: string;
  private _currency?: string;
  private currencySign?: keyof CurrencySignPattern;
  constructor(
    units: Record<string, UnitData>,
    currencies: Record<string, CurrencyData>,
    numbers: RawNumberData,
    numberingSystem: string,
    unit?: string,
    currency?: string,
    currencySign?: keyof CurrencySignPattern
  ) {
    this.units = units;
    this.currencies = currencies;
    this.numbers = numbers;
    this.numberingSystem = numberingSystem;
    this._unit = unit;
    this._currency = currency;
    this.currencySign = currencySign;
  }

  // Style
  get decimal() {
    if (!this.decimalPatterns) {
      this.decimalPatterns = new DecimalPatterns(
        this.numbers,
        this.numberingSystem
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

function produceSignPattern(
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

abstract class NotationPatterns implements CompactSignPattern {
  protected decimalNum?: DecimalFormatNum;
  protected notation?: 'compactShort' | 'compactLong';
  abstract produceCompactSignPattern(): SignPattern;
  get compactShort() {
    this.notation = 'compactShort';
    return this as CompactSignPattern;
  }
  get compactLong() {
    this.notation = 'compactLong';
    return this as CompactSignPattern;
  }
  // DecimalFormatNum
  get '1000'() {
    this.decimalNum = '1000';
    return this.produceCompactSignPattern();
  }
  get '10000'() {
    this.decimalNum = '10000';
    return this.produceCompactSignPattern();
  }
  get '100000'() {
    this.decimalNum = '100000';
    return this.produceCompactSignPattern();
  }
  get '1000000'() {
    this.decimalNum = '1000000';
    return this.produceCompactSignPattern();
  }
  get '10000000'() {
    this.decimalNum = '10000000';
    return this.produceCompactSignPattern();
  }
  get '100000000'() {
    this.decimalNum = '100000000';
    return this.produceCompactSignPattern();
  }
  get '1000000000'() {
    this.decimalNum = '1000000000';
    return this.produceCompactSignPattern();
  }
  get '10000000000'() {
    this.decimalNum = '10000000000';
    return this.produceCompactSignPattern();
  }
  get '100000000000'() {
    this.decimalNum = '100000000000';
    return this.produceCompactSignPattern();
  }
  get '1000000000000'() {
    this.decimalNum = '1000000000000';
    return this.produceCompactSignPattern();
  }
  get '10000000000000'() {
    this.decimalNum = '10000000000000';
    return this.produceCompactSignPattern();
  }
  get '100000000000000'() {
    this.decimalNum = '100000000000000';
    return this.produceCompactSignPattern();
  }
}

class UnitPatterns extends NotationPatterns
  implements SignDisplayPattern, NotationPattern {
  private pattern?: string;
  private signPattern?: SignPattern;
  private notationPattern?: SignPattern | CompactSignPattern;
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
    super();
    this.unit = unit;
    this.units = units;
    this.numbers = numbers;
    this.numberingSystem = numberingSystem;
  }

  produceCompactSignPattern() {
    const decimalNum = this.decimalNum || '1000';
    if (!this.notationPattern) {
      this.notationPattern = Object.create(null) as CompactSignPattern;
    }
    const notationPattern = this.notationPattern as CompactSignPattern;
    if (!notationPattern[decimalNum]) {
      invariant(!!this.signPattern, 'Sign Pattern should exist');

      let compactPattern = '';
      if (this.notation === 'compactShort') {
        compactPattern = extractCompactSymbol(
          this.numbers.decimal[this.numberingSystem].short[decimalNum].other,
          InternalSlotToken.compactSymbol
        );
      } else {
        compactPattern = extractCompactSymbol(
          this.numbers.decimal[this.numberingSystem].long[decimalNum].other,
          InternalSlotToken.compactName
        );
      }
      notationPattern[decimalNum] = processSignPattern(
        this.signPattern,
        pattern => pattern.replace('{0}', compactPattern)
      );
    }
    return notationPattern[decimalNum];
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
      this.signPattern = produceSignPattern(this.pattern, 'always');
    }
    return this as NotationPattern;
  }

  get auto() {
    if (!this.signPattern) {
      invariant(!!this.pattern, 'Pattern should have existed');
      this.signPattern = produceSignPattern(this.pattern, 'auto');
    }
    return this as NotationPattern;
  }

  get never() {
    if (!this.signPattern) {
      invariant(!!this.pattern, 'Pattern should have existed');
      this.signPattern = produceSignPattern(this.pattern, 'never');
    }
    return this as NotationPattern;
  }

  get exceptZero() {
    if (!this.signPattern) {
      invariant(!!this.pattern, 'Pattern should have existed');
      this.signPattern = produceSignPattern(this.pattern, 'exceptZero');
    }
    return this as NotationPattern;
  }

  // Notation
  get standard() {
    if (!this.notationPattern) {
      invariant(!!this.signPattern, 'Sign Pattern should exist');
      this.notationPattern = processSignPattern(this.signPattern, pattern =>
        pattern.replace('{0}', `{${InternalSlotToken.number}}`)
      );
    }
    return this.notationPattern as SignPattern;
  }
  get scientific() {
    if (!this.notationPattern) {
      invariant(!!this.signPattern, 'Sign Pattern should exist');
      this.notationPattern = processSignPattern(this.signPattern, pattern =>
        pattern.replace('{0}', SCIENTIFIC_SLOT)
      );
    }
    return this.notationPattern as SignPattern;
  }
}

class DecimalPatterns extends NotationPatterns
  implements SignDisplayPattern, NotationPattern {
  produceCompactSignPattern() {
    if (!this.signPattern) {
      this.signPattern = Object.create(null) as CompactSignPattern;
    }
    const decimalNum = this.decimalNum || '1000';
    const signPattern = this.signPattern as CompactSignPattern;
    if (!signPattern[decimalNum]) {
      invariant(!!this.signDisplay, 'Sign Display should have existed');

      if (this.notation === 'compactLong') {
        signPattern[decimalNum] = produceSignPattern(
          extractCompactSymbol(
            this.numbers.decimal[this.numberingSystem].long[decimalNum].other,
            InternalSlotToken.compactName
          ),
          this.signDisplay
        );
      } else {
        signPattern[decimalNum] = produceSignPattern(
          extractCompactSymbol(
            this.numbers.decimal[this.numberingSystem].short[decimalNum].other,
            InternalSlotToken.compactSymbol
          ),
          this.signDisplay
        );
      }
    }
    return signPattern[decimalNum];
  }
  private signPattern?: SignPattern | CompactSignPattern;
  private signDisplay?: keyof SignDisplayPattern;
  private numbers: RawNumberData;
  private numberingSystem: string;
  constructor(numbers: RawNumberData, numberingSystem: string) {
    super();
    this.numbers = numbers;
    this.numberingSystem = numberingSystem;
  }

  // Sign Display
  get always() {
    this.signDisplay = 'always';
    return this as NotationPattern;
  }

  get auto() {
    this.signDisplay = 'auto';
    return this as NotationPattern;
  }

  get never() {
    this.signDisplay = 'never';
    return this as NotationPattern;
  }

  get exceptZero() {
    this.signDisplay = 'exceptZero';
    return this as NotationPattern;
  }

  // Notation
  get standard() {
    if (!this.signPattern) {
      invariant(!!this.signDisplay, 'Sign Display should have existed');
      this.signPattern = produceSignPattern(
        `{${InternalSlotToken.number}}`,
        this.signDisplay
      );
    }
    return this.signPattern as SignPattern;
  }
  get scientific() {
    if (!this.signPattern) {
      invariant(!!this.signDisplay, 'Sign Display should have existed');
      this.signPattern = produceSignPattern(SCIENTIFIC_SLOT, this.signDisplay);
    }
    return this.signPattern as SignPattern;
  }
}

class PercentPatterns extends NotationPatterns
  implements SignDisplayPattern, NotationPattern {
  produceCompactSignPattern() {
    if (!this.notationPattern) {
      this.notationPattern = Object.create(null) as CompactSignPattern;
    }

    const notationPattern = this.notationPattern as CompactSignPattern;
    const decimalNum = this.decimalNum || '1000';
    if (!notationPattern[decimalNum]) {
      invariant(!!this.signPattern, 'Sign Pattern should have existed');
      if (this.notation === 'compactShort') {
        notationPattern[decimalNum] = processSignPattern(
          this.signPattern,
          pattern =>
            pattern.replace(
              NUMBER_PATTERN,
              extractCompactSymbol(
                this.numbers.decimal[this.numberingSystem].short[decimalNum]
                  .other,
                InternalSlotToken.compactSymbol
              )
            )
        );
      } else {
        notationPattern[decimalNum] = processSignPattern(
          this.signPattern,
          pattern =>
            pattern.replace(
              NUMBER_PATTERN,
              extractCompactSymbol(
                this.numbers.decimal[this.numberingSystem].long[decimalNum]
                  .other,
                InternalSlotToken.compactName
              )
            )
        );
      }
    }
    return notationPattern[decimalNum];
  }
  private pattern?: string;
  private signPattern?: SignPattern;
  private notationPattern?: SignPattern | CompactSignPattern;
  private numbers: RawNumberData;
  private numberingSystem: string;

  constructor(numbers: RawNumberData, numberingSystem: string) {
    super();
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
      this.signPattern = produceSignPattern(this.pattern, 'exceptZero');
    }
    return this as NotationPattern;
  }

  get auto() {
    if (!this.signPattern) {
      invariant(!!this.pattern, 'Pattern should have existed');
      this.signPattern = produceSignPattern(this.pattern, 'exceptZero');
    }
    return this as NotationPattern;
  }

  get never() {
    if (!this.signPattern) {
      invariant(!!this.pattern, 'Pattern should have existed');
      this.signPattern = produceSignPattern(this.pattern, 'exceptZero');
    }
    return this as NotationPattern;
  }

  get exceptZero() {
    if (!this.signPattern) {
      invariant(!!this.pattern, 'Pattern should have existed');
      this.signPattern = produceSignPattern(this.pattern, 'exceptZero');
    }
    return this as NotationPattern;
  }

  // Notation
  get standard() {
    if (!this.notationPattern) {
      invariant(!!this.signPattern, 'Sign Pattern should have existed');
      this.notationPattern = processSignPattern(this.signPattern, pattern =>
        pattern.replace(NUMBER_PATTERN, `{${InternalSlotToken.number}}`)
      );
    }
    return this.notationPattern as SignPattern;
  }
  get scientific() {
    if (!this.notationPattern) {
      invariant(!!this.signPattern, 'Sign Pattern should have existed');
      this.notationPattern = processSignPattern(this.signPattern, pattern =>
        pattern.replace(NUMBER_PATTERN, SCIENTIFIC_SLOT)
      );
    }
    return this.notationPattern as SignPattern;
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

function resolvePatternForCurrencyName(
  numbers: RawNumberData,
  numberingSystem: string,
  notation: keyof NotationPattern,
  decimalNum: DecimalFormatNum
) {
  const pattern = numbers.currency[numberingSystem].unitPattern.replace(
    '{1}',
    `{${InternalSlotToken.currencyName}}`
  );
  // currencySign doesn't matter here but notation does
  switch (notation) {
    case 'compactLong':
      return pattern.replace(
        '{0}',
        extractCompactSymbol(
          numbers.decimal[numberingSystem].long[decimalNum].other,
          InternalSlotToken.compactName
        )
      );
    case 'compactShort':
      return pattern.replace(
        '{0}',
        extractCompactSymbol(
          numbers.decimal[numberingSystem].short[decimalNum].other,
          InternalSlotToken.compactSymbol
        )
      );
    case 'scientific':
      return pattern.replace('{0}', SCIENTIFIC_SLOT);
    case 'standard':
      return pattern.replace('{0}', `{${InternalSlotToken.number}}`);
  }
}

class CurrencyPatterns implements CurrencyPattern, CurrencySignPattern {
  private currency: string;
  private numbers: RawNumberData;
  private numberingSystem: string;
  private currencies: Record<string, CurrencyData>;
  private currencySign: keyof CurrencySignPattern;
  private signDisplayPatterns?: CurrencySignDisplayPatterns;
  private currencyDisplay?: keyof CurrencyPattern;
  private resolvedCurrency?: string;
  constructor(
    currencies: Record<string, CurrencyData>,
    numbers: RawNumberData,
    numberingSystem: string,
    currency: string,
    currencySign: keyof CurrencySignPattern
  ) {
    this.currency = currency;
    this.currencies = currencies;
    this.numbers = numbers;
    this.numberingSystem = numberingSystem;
    this.currencySign = currencySign;
  }
  // CurrencyDisplay
  get code() {
    this.currencyDisplay = 'code';
    this.resolvedCurrency = this.currency;
    return this;
  }

  get symbol() {
    this.currencyDisplay = 'symbol';
    this.resolvedCurrency = this.currencies[this.currency].symbol;
    return this;
  }

  get narrowSymbol() {
    this.currencyDisplay = 'narrowSymbol';
    this.resolvedCurrency = this.currencies[this.currency].narrow;
    return this;
  }

  get name() {
    this.currencyDisplay = 'name';
    this.resolvedCurrency = this.currencies[this.currency].displayName.other;
    return this;
  }

  // CurrencySign
  get accounting() {
    this.currencySign = 'accounting';
    if (!this.signDisplayPatterns) {
      invariant(!!this.currencySign, 'Currency Sign should have existed');
      invariant(!!this.currencyDisplay, 'Currency Display should have existed');
      invariant(!!this.resolvedCurrency, 'Currency should have been resolved');
      this.signDisplayPatterns = new CurrencySignDisplayPatterns(
        this.resolvedCurrency,
        this.numbers,
        this.numberingSystem,
        this.currencySign,
        this.currencyDisplay
      );
    }
    return this.signDisplayPatterns;
  }

  get standard() {
    this.currencySign = 'standard';
    if (!this.signDisplayPatterns) {
      invariant(!!this.currencySign, 'Currency Sign should have existed');
      invariant(!!this.currencyDisplay, 'Currency Display should have existed');
      invariant(!!this.resolvedCurrency, 'Currency should have been resolved');
      this.signDisplayPatterns = new CurrencySignDisplayPatterns(
        this.resolvedCurrency,
        this.numbers,
        this.numberingSystem,
        this.currencySign,
        this.currencyDisplay
      );
    }
    return this.signDisplayPatterns;
  }
}

class CurrencySignDisplayPatterns extends NotationPatterns
  implements SignDisplayPattern, NotationPattern {
  private signDisplay?: keyof SignDisplayPattern;
  private currencySign?: keyof CurrencySignPattern;
  private currencyDisplay?: keyof CurrencyPattern;
  private currency: string;
  private numbers: RawNumberData;
  private numberingSystem: string;
  private notationPatterns?: SignPattern | CompactSignPattern;
  constructor(
    resolvedCurrency: string,
    numbers: RawNumberData,
    numberingSystem: string,
    currencySign: keyof CurrencySignPattern,
    currencyDisplay: keyof CurrencyPattern
  ) {
    super();
    this.currency = resolvedCurrency;
    this.numbers = numbers;
    this.numberingSystem = numberingSystem;
    this.currencySign = currencySign;
    this.currencyDisplay = currencyDisplay;
  }
  // Sign Display
  get always() {
    this.signDisplay = 'always';
    return this as NotationPattern;
  }

  get auto() {
    this.signDisplay = 'auto';
    return this as NotationPattern;
  }

  get never() {
    this.signDisplay = 'never';
    return this as NotationPattern;
  }

  get exceptZero() {
    this.signDisplay = 'exceptZero';
    return this as NotationPattern;
  }

  // Notation
  get standard() {
    if (!this.notationPatterns) {
      invariant(!!this.currencySign, 'Currency sign should exist');
      invariant(!!this.signDisplay, 'Sign display must exist');
      let pattern = '';
      if (this.currencyDisplay === 'name') {
        pattern = resolvePatternForCurrencyName(
          this.numbers,
          this.numberingSystem,
          'standard',
          '1000' // dummy
        );
      } else {
        pattern = resolvePatternForCurrencyCode(
          this.currency,
          this.numbers.currency[this.numberingSystem],
          'standard',
          this.currencySign
        ).replace(CURRENCY_SYMBOL_REGEX, `{${InternalSlotToken.currencyCode}}`);
      }
      this.notationPatterns = produceSignPattern(pattern, this.signDisplay);
    }
    return this.notationPatterns as SignPattern;
  }
  get scientific() {
    if (!this.notationPatterns) {
      invariant(!!this.currencySign, 'Currency sign should exist');
      invariant(!!this.signDisplay, 'Sign display must exist');
      let pattern = '';
      if (this.currencyDisplay === 'name') {
        pattern = resolvePatternForCurrencyName(
          this.numbers,
          this.numberingSystem,
          'scientific',
          '1000' // dummy
        );
      } else {
        pattern = resolvePatternForCurrencyCode(
          this.currency,
          this.numbers.currency[this.numberingSystem],
          'scientific',
          this.currencySign
        ).replace(CURRENCY_SYMBOL_REGEX, `{${InternalSlotToken.currencyCode}}`);
      }
      this.notationPatterns = produceSignPattern(pattern, this.signDisplay);
    }
    return this.notationPatterns as SignPattern;
  }
  produceCompactSignPattern() {
    if (!this.notationPatterns) {
      this.notationPatterns = Object.create(null) as CompactSignPattern;
    }
    const notationPatterns = this.notationPatterns as CompactSignPattern;
    const decimalNum = this.decimalNum || '1000';
    if (!notationPatterns[decimalNum]) {
      invariant(!!this.currencySign, 'Currency sign should exist');
      invariant(!!this.signDisplay, 'Sign display must exist');
      let pattern = '';
      if (this.currencyDisplay === 'name') {
        pattern = resolvePatternForCurrencyName(
          this.numbers,
          this.numberingSystem,
          this.notation as 'compactShort',
          decimalNum
        );
      } else {
        pattern = resolvePatternForCurrencyCode(
          this.currency,
          this.numbers.currency[this.numberingSystem],
          this.notation as 'compactShort',
          this.currencySign
        ).replace(CURRENCY_SYMBOL_REGEX, `{${InternalSlotToken.currencyCode}}`);
      }
      notationPatterns[decimalNum] = produceSignPattern(
        pattern,
        this.signDisplay
      );
    }
    return notationPatterns[decimalNum];
  }
}
