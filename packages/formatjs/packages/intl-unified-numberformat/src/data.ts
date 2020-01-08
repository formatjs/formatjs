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
  NotationPattern,
  CurrencySignPattern,
  RawCurrencyData,
  CompactSignPattern,
} from '@formatjs/intl-utils';
import * as unicodeSymbol_ from 'unicode-12.1.0/General_Category/Symbol/regex';

function invariant(
  condition: boolean,
  message: string,
  Err: any = Error
): asserts condition {
  if (!condition) {
    throw new Err(message);
  }
}

const S_UNICODE_REGEX: RegExp =
  (unicodeSymbol_ as any).default || unicodeSymbol_;

// g flag bc this appears twice in accounting pattern
const CURRENCY_SYMBOL_REGEX = /¤/g;
// Instead of doing just replace '{1}' we use global regex
// since this can appear more than once (e.g {1} {number} {1})
const UNIT_1_REGEX = /\{1\}/g;
const UNIT_0_REGEX = /\{0\}/g;

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

function serializeSlotTokens(
  tokens: InternalSlotToken | InternalSlotToken[]
): string {
  if (Array.isArray(tokens)) return tokens.map(t => `{${t}}`).join('');
  return `{${tokens}}`;
}

// Credit: https://github.com/andyearnshaw/Intl.js/blob/master/scripts/utils/reduce.js
// Matches CLDR number patterns, e.g. #,##0.00, #,##,##0.00, #,##0.##, 0, etc.
const NUMBER_PATTERN = /[#0](?:[\.,][#0]+)*/g;
const SCIENTIFIC_POSITIVE_PATTERN = serializeSlotTokens([
  InternalSlotToken.number,
  InternalSlotToken.scientificSeparator,
  InternalSlotToken.scientificExponent,
]);
const SCIENTIFIC_NEGATIVE_PATTERN = serializeSlotTokens([
  InternalSlotToken.minusSign,
  InternalSlotToken.number,
  InternalSlotToken.scientificSeparator,
  InternalSlotToken.scientificExponent,
]);
const DUMMY_POSITIVE_PATTERN = serializeSlotTokens([InternalSlotToken.number]);
const DUMMY_NEGATIVE_PATTERN = serializeSlotTokens([
  InternalSlotToken.minusSign,
  InternalSlotToken.number,
]);
const DUMMY_PATTERN = DUMMY_POSITIVE_PATTERN + ';' + DUMMY_NEGATIVE_PATTERN;
const SCIENTIFIC_PATTERN =
  SCIENTIFIC_POSITIVE_PATTERN + ';' + SCIENTIFIC_NEGATIVE_PATTERN;
/**
 * Turn compact pattern like `0 trillion` to
 * `0 {compactSymbol};-0 {compactSymbol}`.
 * Negative pattern will not be inserted if there already
 * exist one.
 * TODO: Maybe preprocess this
 * @param pattern decimal long/short pattern
 */
function processDecimalCompactSymbol(
  pattern: string,
  slotToken: InternalSlotToken = InternalSlotToken.compactSymbol
): [string, string] {
  const compactUnit = pattern.replace(/0+/, '').trim();
  if (compactUnit) {
    pattern = pattern.replace(compactUnit, serializeSlotTokens(slotToken));
  }
  const negativePattern =
    pattern.indexOf('-') > -1 ? pattern : pattern.replace(/(0+)/, '-$1');
  return [
    pattern.replace(/0+/, '{number}'),
    negativePattern.replace(/0+/, '{number}'),
  ];
}

/**
 * Turn compact pattern like `¤0 trillion` to
 * `¤0 {compactSymbol};-¤0 {compactSymbol}`
 * Negative pattern will not be inserted if there already
 * exist one.
 * TODO: Maybe preprocess this
 * @param pattern currency long/short pattern
 */
function processCurrencyCompactSymbol(
  pattern: string,
  slotToken: InternalSlotToken = InternalSlotToken.compactSymbol
): string {
  const compactUnit = pattern.replace(/[¤0]/g, '').trim();
  if (compactUnit) {
    pattern = pattern.replace(compactUnit, serializeSlotTokens(slotToken));
  }
  const negativePattern = pattern.indexOf('-') > -1 ? pattern : `-${pattern}`;
  return (
    pattern.replace(/0+/, '{number}') +
    ';' +
    negativePattern.replace(/0+/, '{number}')
  );
}

const INSERT_BEFORE_PATTERN_REGEX = /[^\s;(-]¤/;
const INSERT_AFTER_PATTERN_REGEX = /¤[^\s);]/;

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
  insertBetweenChar: string
): string {
  // Check afterCurrency
  if (shouldInsertAfter(currency, pattern)) {
    return pattern.replace(CURRENCY_SYMBOL_REGEX, `¤${insertBetweenChar}`);
  }

  // Check beforeCurrency
  if (shouldInsertBefore(currency, pattern)) {
    return pattern.replace(CURRENCY_SYMBOL_REGEX, `${insertBetweenChar}¤`);
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
  fn?: (s: string) => string
): SignPattern {
  if (!fn) {
    return signPattern;
  }
  return {
    positivePattern: fn(signPattern.positivePattern),
    zeroPattern: fn(signPattern.zeroPattern),
    negativePattern: fn(signPattern.negativePattern),
  };
}

/**
 * Produce positive/negative/zero pattern
 * This also converts {0} into {number}
 * @param patterns
 * @param signDisplay
 */
function produceSignPattern(
  patterns: string,
  signDisplay: keyof SignDisplayPattern
): SignPattern {
  invariant(!!patterns, 'Pattern should have existed');
  let [positivePattern, negativePattern] = patterns.split(';');
  invariant(
    !!negativePattern,
    `negativePattern should have existed but got "${patterns}"`
  );
  let noSignPattern = positivePattern.replace('+', '');
  negativePattern = negativePattern.replace(
    '-',
    serializeSlotTokens(InternalSlotToken.minusSign)
  );

  let alwaysPositivePattern = positivePattern;
  if (negativePattern.indexOf(InternalSlotToken.minusSign) > -1) {
    alwaysPositivePattern = negativePattern.replace(
      InternalSlotToken.minusSign,
      InternalSlotToken.plusSign
    );
  } else if (positivePattern.indexOf('+') > -1) {
    alwaysPositivePattern = positivePattern = positivePattern.replace(
      '+',
      serializeSlotTokens(InternalSlotToken.plusSign)
    );
  } else {
    // In case {0} is in the middle of the pattern
    alwaysPositivePattern = `${serializeSlotTokens(
      InternalSlotToken.plusSign
    )}${noSignPattern}`;
  }

  positivePattern = positivePattern.replace(
    '{0}',
    serializeSlotTokens(InternalSlotToken.number)
  );
  alwaysPositivePattern = alwaysPositivePattern.replace(
    '{0}',
    serializeSlotTokens(InternalSlotToken.number)
  );
  negativePattern = negativePattern.replace(
    '{0}',
    serializeSlotTokens(InternalSlotToken.number)
  );
  noSignPattern = noSignPattern.replace(
    '{0}',
    serializeSlotTokens(InternalSlotToken.number)
  );

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
  abstract produceCompactSignPattern(decimalNum: DecimalFormatNum): SignPattern;
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
    return this.produceCompactSignPattern('1000');
  }
  get '10000'() {
    return this.produceCompactSignPattern('10000');
  }
  get '100000'() {
    return this.produceCompactSignPattern('100000');
  }
  get '1000000'() {
    return this.produceCompactSignPattern('1000000');
  }
  get '10000000'() {
    return this.produceCompactSignPattern('10000000');
  }
  get '100000000'() {
    return this.produceCompactSignPattern('100000000');
  }
  get '1000000000'() {
    return this.produceCompactSignPattern('1000000000');
  }
  get '10000000000'() {
    return this.produceCompactSignPattern('10000000000');
  }
  get '100000000000'() {
    return this.produceCompactSignPattern('100000000000');
  }
  get '1000000000000'() {
    return this.produceCompactSignPattern('1000000000000');
  }
  get '10000000000000'() {
    return this.produceCompactSignPattern('10000000000000');
  }
  get '100000000000000'() {
    return this.produceCompactSignPattern('100000000000000');
  }
}

class DecimalPatterns extends NotationPatterns
  implements SignDisplayPattern, NotationPattern {
  protected signPattern?: SignPattern;
  protected compactSignPattern?: CompactSignPattern;
  protected signDisplay?: keyof SignDisplayPattern;
  protected numbers: RawNumberData;
  protected numberingSystem: string;
  constructor(numbers: RawNumberData, numberingSystem: string) {
    super();
    this.numbers = numbers;
    this.numberingSystem = numberingSystem;
  }

  produceCompactSignPattern(decimalNum: DecimalFormatNum) {
    if (!this.compactSignPattern) {
      this.compactSignPattern = Object.create(null) as CompactSignPattern;
    }
    const signPattern = this.compactSignPattern as CompactSignPattern;
    if (!signPattern[decimalNum]) {
      invariant(!!this.signDisplay, 'Sign Display should have existed');
      if (this.notation === 'compactLong') {
        signPattern[decimalNum] = produceSignPattern(
          processDecimalCompactSymbol(
            this.numbers.decimal[this.numberingSystem].long[decimalNum].other,
            InternalSlotToken.compactName
          ).join(';'),
          this.signDisplay
        );
      } else {
        signPattern[decimalNum] = produceSignPattern(
          processDecimalCompactSymbol(
            this.numbers.decimal[this.numberingSystem].short[decimalNum].other,
            InternalSlotToken.compactSymbol
          ).join(';'),
          this.signDisplay
        );
      }
    }
    return signPattern[decimalNum];
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
      this.signPattern = produceSignPattern(DUMMY_PATTERN, this.signDisplay);
    }
    return this.signPattern as SignPattern;
  }
  get scientific() {
    if (!this.signPattern) {
      invariant(!!this.signDisplay, 'Sign Display should have existed');
      this.signPattern = produceSignPattern(
        SCIENTIFIC_PATTERN,
        this.signDisplay
      );
    }
    return this.signPattern as SignPattern;
  }
}

class PercentPatterns extends DecimalPatterns
  implements SignDisplayPattern, NotationPattern {
  private generateStandardOrScientificPattern(isScientific?: boolean) {
    invariant(!!this.signDisplay, 'Sign Display should have existed');
    let pattern = this.numbers.percent[this.numberingSystem]
      .replace(/%/g, serializeSlotTokens(InternalSlotToken.percentSign))
      .replace(
        NUMBER_PATTERN,
        isScientific
          ? SCIENTIFIC_POSITIVE_PATTERN
          : serializeSlotTokens(InternalSlotToken.number)
      );
    let negativePattern: string;

    if (pattern.indexOf(';') < 0) {
      negativePattern = `${serializeSlotTokens(
        InternalSlotToken.minusSign
      )}${pattern}`;
      pattern += ';' + negativePattern;
    }
    return produceSignPattern(pattern, this.signDisplay);
  }

  // Notation
  get standard() {
    if (!this.signPattern) {
      this.signPattern = this.generateStandardOrScientificPattern();
    }
    return this.signPattern as SignPattern;
  }
  get scientific() {
    if (!this.signPattern) {
      this.signPattern = this.generateStandardOrScientificPattern(true);
    }
    return this.signPattern as SignPattern;
  }
}

class UnitPatterns extends NotationPatterns
  implements SignDisplayPattern, NotationPattern {
  private pattern?: string;
  private signPattern?: SignPattern;
  private compactSignPattern?: CompactSignPattern;
  private unit: string;
  private units: Record<string, UnitData>;
  private numbers: RawNumberData;
  private numberingSystem: string;
  private signDisplay?: keyof SignDisplayPattern;

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

  private generateStandardOrScientificPattern(isScientific?: boolean) {
    invariant(!!this.signDisplay, 'Sign Display should have existed');
    invariant(!!this.pattern, 'Pattern must exist');
    let {pattern} = this;
    let negativePattern: string;

    if (pattern.indexOf(';') < 0) {
      negativePattern = pattern.replace('{0}', '-{0}');
      pattern += ';' + negativePattern;
    }
    pattern = pattern.replace(
      UNIT_0_REGEX,
      isScientific
        ? SCIENTIFIC_POSITIVE_PATTERN
        : serializeSlotTokens(InternalSlotToken.number)
    );
    return produceSignPattern(pattern, this.signDisplay);
  }

  produceCompactSignPattern(decimalNum: DecimalFormatNum) {
    if (!this.compactSignPattern) {
      this.compactSignPattern = Object.create(null) as CompactSignPattern;
    }
    const compactSignPatterns = this.compactSignPattern as CompactSignPattern;
    if (!compactSignPatterns[decimalNum]) {
      invariant(!!this.pattern, 'Pattern should exist');
      invariant(!!this.signDisplay, 'Sign Display should exist');
      let {pattern} = this;
      let compactPattern: [string, string];
      if (this.notation === 'compactShort') {
        compactPattern = processDecimalCompactSymbol(
          this.numbers.decimal[this.numberingSystem].short[decimalNum].other,
          InternalSlotToken.compactSymbol
        );
      } else {
        compactPattern = processDecimalCompactSymbol(
          this.numbers.decimal[this.numberingSystem].long[decimalNum].other,
          InternalSlotToken.compactName
        );
      }
      pattern =
        pattern.replace('{0}', compactPattern[0]) +
        ';' +
        pattern.replace('{0}', compactPattern[1]);
      compactSignPatterns[decimalNum] = produceSignPattern(
        pattern,
        this.signDisplay
      );
    }
    return compactSignPatterns[decimalNum];
  }

  // UnitDisplay
  get narrow() {
    if (!this.pattern) {
      this.pattern = this.units[this.unit].narrow.other.pattern.replace(
        UNIT_1_REGEX,
        serializeSlotTokens(InternalSlotToken.unitNarrowSymbol)
      );
    }
    return this;
  }

  get short() {
    if (!this.pattern) {
      this.pattern = this.units[this.unit].short.other.pattern.replace(
        UNIT_1_REGEX,
        serializeSlotTokens(InternalSlotToken.unitSymbol)
      );
    }
    return this;
  }

  get long() {
    if (!this.pattern) {
      this.pattern = this.units[this.unit].long.other.pattern.replace(
        UNIT_1_REGEX,
        serializeSlotTokens(InternalSlotToken.unitName)
      );
    }
    return this;
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
      this.signPattern = this.generateStandardOrScientificPattern();
    }
    return this.signPattern as SignPattern;
  }
  get scientific() {
    if (!this.signPattern) {
      this.signPattern = this.generateStandardOrScientificPattern(true);
    }
    return this.signPattern as SignPattern;
  }
}

function resolvePatternForCurrencyCode(
  resolvedCurrency: string,
  data: RawCurrencyData,
  notation: keyof NotationPattern,
  currencySign: keyof CurrencySignPattern,
  decimalNum: DecimalFormatNum
): string {
  const shortPattern = data.short;
  const longPattern = ((data as any).long as typeof shortPattern) || data.short;
  let pattern = '';
  switch (notation) {
    case 'compactLong': {
      pattern =
        longPattern?.[decimalNum].other ||
        shortPattern?.[decimalNum].other ||
        data.standard;
      return processCurrencyCompactSymbol(
        insertBetween(
          resolvedCurrency,
          pattern,
          data.currencySpacing.beforeInsertBetween
        ),
        InternalSlotToken.compactName
      );
    }
    case 'compactShort':
      pattern = shortPattern?.[decimalNum].other || data.standard;
      return processCurrencyCompactSymbol(
        insertBetween(
          resolvedCurrency,
          pattern,
          data.currencySpacing.beforeInsertBetween
        ),
        InternalSlotToken.compactSymbol
      );
    case 'scientific':
      pattern = currencySign === 'accounting' ? data.accounting : data.standard;
      pattern = insertBetween(
        resolvedCurrency,
        pattern,
        data.currencySpacing.beforeInsertBetween
      );
      if (pattern.indexOf(';') < 0) {
        pattern += ';' + `-${pattern}`;
      }
      return pattern.replace(NUMBER_PATTERN, SCIENTIFIC_POSITIVE_PATTERN);
    case 'standard':
      pattern = currencySign === 'accounting' ? data.accounting : data.standard;
      pattern = insertBetween(
        resolvedCurrency,
        pattern,
        data.currencySpacing.beforeInsertBetween
      );
      if (pattern.indexOf(';') < 0) {
        pattern += ';' + `-${pattern}`;
      }
      return pattern.replace(
        NUMBER_PATTERN,
        serializeSlotTokens(InternalSlotToken.number)
      );
  }
}

/**
 * Resolve pattern for currency name
 * TODO: CurrencySign doesn't matter here (accounting or standard).
 * When it comes to using `name`, it's `-1 Australian Dollars`
 * instead of `(1 Australian Dollar)`
 * @param numbers
 * @param numberingSystem
 * @param notation
 * @param decimalNum
 */
function resolvePatternForCurrencyName(
  numbers: RawNumberData,
  numberingSystem: string,
  notation: keyof NotationPattern,
  decimalNum: DecimalFormatNum
) {
  const pattern = numbers.currency[numberingSystem].unitPattern.replace(
    UNIT_1_REGEX,
    serializeSlotTokens(InternalSlotToken.currencyName)
  );
  let numberPattern: [string, string];
  // currencySign doesn't matter here but notation does
  switch (notation) {
    case 'compactLong':
      numberPattern = processDecimalCompactSymbol(
        numbers.decimal[numberingSystem].long[decimalNum].other,
        InternalSlotToken.compactName
      );
      break;
    case 'compactShort':
      numberPattern = processDecimalCompactSymbol(
        numbers.decimal[numberingSystem].short[decimalNum].other,
        InternalSlotToken.compactSymbol
      );
      break;
    case 'scientific':
      numberPattern = [
        SCIENTIFIC_POSITIVE_PATTERN,
        SCIENTIFIC_NEGATIVE_PATTERN,
      ];
      break;
    case 'standard':
      numberPattern = [DUMMY_POSITIVE_PATTERN, DUMMY_NEGATIVE_PATTERN];
      break;
  }
  return (
    pattern.replace('{0}', numberPattern[0]) +
    ';' +
    pattern.replace('{0}', numberPattern[1])
  );
}

class CurrencyPatterns implements CurrencyPattern, CurrencySignPattern {
  private currency: string;
  private numbers: RawNumberData;
  private numberingSystem: string;
  private currencies: Record<string, CurrencyData>;
  private currencySign: keyof CurrencySignPattern;
  private signDisplayPatterns?: CurrencySignDisplayPatterns;
  private currencySlotToken?: InternalSlotToken;
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
    this.currencySlotToken = InternalSlotToken.currencyCode;
    this.resolvedCurrency = this.currency;
    return this;
  }

  get symbol() {
    this.currencySlotToken = InternalSlotToken.currencySymbol;
    this.resolvedCurrency = this.currencies[this.currency].symbol;
    return this;
  }

  get narrowSymbol() {
    this.currencySlotToken = InternalSlotToken.currencyNarrowSymbol;
    this.resolvedCurrency = this.currencies[this.currency].narrow;
    return this;
  }

  get name() {
    this.currencySlotToken = InternalSlotToken.currencyName;
    this.resolvedCurrency = this.currencies[this.currency].displayName.other;
    return this;
  }

  // CurrencySign
  get accounting() {
    this.currencySign = 'accounting';
    if (!this.signDisplayPatterns) {
      invariant(!!this.currencySign, 'Currency Sign should have existed');
      invariant(
        !!this.currencySlotToken,
        'Currency Slot Token should have existed'
      );
      invariant(!!this.resolvedCurrency, 'Currency should have been resolved');
      this.signDisplayPatterns = new CurrencySignDisplayPatterns(
        this.resolvedCurrency,
        this.numbers,
        this.numberingSystem,
        this.currencySign,
        this.currencySlotToken
      );
    }
    return this.signDisplayPatterns;
  }

  get standard() {
    this.currencySign = 'standard';
    if (!this.signDisplayPatterns) {
      invariant(!!this.currencySign, 'Currency Sign should have existed');
      invariant(
        !!this.currencySlotToken,
        'Currency Display should have existed'
      );
      invariant(!!this.resolvedCurrency, 'Currency should have been resolved');
      this.signDisplayPatterns = new CurrencySignDisplayPatterns(
        this.resolvedCurrency,
        this.numbers,
        this.numberingSystem,
        this.currencySign,
        this.currencySlotToken
      );
    }
    return this.signDisplayPatterns;
  }
}

class CurrencySignDisplayPatterns extends NotationPatterns
  implements SignDisplayPattern, NotationPattern {
  private signDisplay?: keyof SignDisplayPattern;
  private currencySign?: keyof CurrencySignPattern;
  private currencySlotToken: InternalSlotToken;
  private currency: string;
  private numbers: RawNumberData;
  private numberingSystem: string;
  private signPattern?: SignPattern;
  private compactSignPattern?: CompactSignPattern;
  constructor(
    resolvedCurrency: string,
    numbers: RawNumberData,
    numberingSystem: string,
    currencySign: keyof CurrencySignPattern,
    currencySlotToken: InternalSlotToken
  ) {
    super();
    this.currency = resolvedCurrency;
    this.numbers = numbers;
    this.numberingSystem = numberingSystem;
    this.currencySign = currencySign;
    this.currencySlotToken = currencySlotToken;
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
  // Standard currency sign
  get standard() {
    if (!this.signPattern) {
      invariant(!!this.currencySign, 'Currency sign should exist');
      invariant(!!this.signDisplay, 'Sign display must exist');

      let pattern = '';
      // name -> standard -> standard
      // name -> accounting -> standard
      if (this.currencySlotToken === InternalSlotToken.currencyName) {
        pattern = resolvePatternForCurrencyName(
          this.numbers,
          this.numberingSystem,
          'standard',
          '1000' // dummy
        );
      }
      // code -> standard -> standard
      // code -> accounting -> standard
      // symbol -> standard -> standard
      // symbol -> accounting -> standard
      // narrowSymbol -> standard -> standard
      // narrowSymbol -> accounting -> standard
      else {
        pattern = resolvePatternForCurrencyCode(
          this.currency,
          this.numbers.currency[this.numberingSystem],
          'standard',
          this.currencySign,
          '1000' // dummy
        ).replace(
          CURRENCY_SYMBOL_REGEX,
          serializeSlotTokens(this.currencySlotToken)
        );
      }
      this.signPattern = produceSignPattern(pattern, this.signDisplay);
    }
    return this.signPattern as SignPattern;
  }
  get scientific() {
    if (!this.signPattern) {
      invariant(!!this.currencySign, 'Currency sign should exist');
      invariant(!!this.signDisplay, 'Sign display must exist');

      let pattern = '';
      // name -> standard -> scientific
      // name -> accounting -> scientific
      if (this.currencySlotToken === InternalSlotToken.currencyName) {
        pattern = resolvePatternForCurrencyName(
          this.numbers,
          this.numberingSystem,
          'scientific',
          '1000' // dummy
        );
      }
      // code -> standard -> scientific
      // code -> accounting -> scientific
      // symbol -> standard -> scientific
      // symbol -> accounting -> scientific
      // narrowSymbol -> standard -> scientific
      // narrowSymbol -> accounting -> scientific
      else {
        pattern = resolvePatternForCurrencyCode(
          this.currency,
          this.numbers.currency[this.numberingSystem],
          'scientific',
          this.currencySign,
          '1000' // dummy
        ).replace(
          CURRENCY_SYMBOL_REGEX,
          serializeSlotTokens(this.currencySlotToken)
        );
      }
      this.signPattern = produceSignPattern(pattern, this.signDisplay);
    }
    return this.signPattern as SignPattern;
  }
  produceCompactSignPattern(decimalNum: DecimalFormatNum) {
    if (!this.compactSignPattern) {
      this.compactSignPattern = Object.create(null) as CompactSignPattern;
    }
    const compactSignPatterns = this.compactSignPattern as CompactSignPattern;
    if (!compactSignPatterns[decimalNum]) {
      invariant(!!this.currencySign, 'Currency sign should exist');
      invariant(!!this.signDisplay, 'Sign display must exist');

      let pattern = '';
      // name -> standard -> compact -> compactLong
      // name -> accounting -> compact -> compactShort
      if (this.currencySlotToken === InternalSlotToken.currencyName) {
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
          this.currencySign,
          decimalNum
        ).replace(
          CURRENCY_SYMBOL_REGEX,
          serializeSlotTokens(this.currencySlotToken)
        );
      }
      compactSignPatterns[decimalNum] = processSignPattern(
        produceSignPattern(pattern, this.signDisplay),
        pattern => pattern.replace(/0+/, '{number}')
      );
    }
    return compactSignPatterns[decimalNum];
  }
}
