import CurrenciesData from 'cldr-numbers-full/main/en/currencies.json'

export type Currency = typeof currencies[number]

export const currencies = Object.keys(CurrenciesData.main.en.numbers.currencies)
