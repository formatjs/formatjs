interface SignPattern {
    positivePattern: string
    zeroPattern: string
    negativePattern: string
}

interface NotationPattern {
    standard: SignPattern
    scientific: SignPattern
    compactShort: SignPattern
    compactLong: SignPattern
}

interface SignDisplayPattern {
    auto: NotationPattern
    always: NotationPattern
    never: NotationPattern
    exceptZero: NotationPattern
}

interface CurrencySignPattern {
    standard: SignDisplayPattern
    accounting: SignDisplayPattern
}

interface CurrencyPattern {
    code: CurrencySignPattern
    symbol: CurrencySignPattern
    narrowSymbol: CurrencySignPattern
    name: CurrencySignPattern
}

interface UnitPattern {
    narrow: CurrencyPattern
    short: CurrencyPattern
    long: CurrencyPattern
}

export interface NumberLocalePatternData {
    decimal: Record<string, SignDisplayPattern>
    percent: Record<string, SignDisplayPattern>
    currency: {
        fallback: CurrencyPattern
        [currency: string]: CurrencyPattern
    }
    unit: {
        fallback: UnitPattern
        [unit: string]: UnitPattern
    }
}
export interface NumberLocaleData {
    nu: string[]
    patterns: Record<string, NumberLocalePatternData>
}