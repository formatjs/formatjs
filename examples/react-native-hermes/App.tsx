import React from 'react'
import {Text, View} from 'react-native'
import NativeIntlModule from './specs/NativeIntlModule'

const installed = NativeIntlModule.install()

function check(name: string, run: () => boolean): [string, boolean] {
  try {
    return [name, run()]
  } catch {
    return [name, false]
  }
}

const results = [
  check(
    'Hermes',
    () => typeof Reflect.get(globalThis, 'HermesInternal') === 'object'
  ),
  check('native install', () => installed),
  check(
    'getCanonicalLocales',
    () => Intl.getCanonicalLocales('en-us')[0] === 'en-US'
  ),
  check('supportedValuesOf', () =>
    Intl.supportedValuesOf('calendar').includes('gregory')
  ),
  check('Locale', () => new Intl.Locale('en-US').language === 'en'),
  check('PluralRules', () => new Intl.PluralRules('en').select(1) === 'one'),
  check(
    'ListFormat',
    () => new Intl.ListFormat('en').format(['A', 'B']) === 'A and B'
  ),
  check(
    'DisplayNames',
    () => new Intl.DisplayNames('en', {type: 'language'}).of('fr') === 'French'
  ),
  check(
    'Segmenter',
    () =>
      [...new Intl.Segmenter('en', {granularity: 'grapheme'}).segment('A🙂')]
        .length === 2
  ),
  check('Collator', () => new Intl.Collator('en').compare('a', 'b') < 0),
  check(
    'NumberFormat',
    () => new Intl.NumberFormat('en-US').format(1234.5) === '1,234.5'
  ),
  check(
    'RelativeTimeFormat',
    () =>
      new Intl.RelativeTimeFormat('en', {numeric: 'auto'}).format(-1, 'day') ===
      'yesterday'
  ),
  check(
    'DateTimeFormat',
    () =>
      new Intl.DateTimeFormat('en-US', {
        timeZone: 'UTC',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date('2024-01-02T00:00:00Z')) === '01/02/2024'
  ),
  check(
    'DurationFormat',
    () =>
      new Intl.DurationFormat('en', {style: 'digital'}).format({
        hours: 1,
        minutes: 2,
        seconds: 3,
      }) === '1:02:03'
  ),
]

export default function App() {
  return (
    <View style={{flex: 1, padding: 16, backgroundColor: '#fff'}}>
      {results.map(([name, passed]) => (
        <Text key={name} style={{fontSize: 16, paddingVertical: 5}}>
          {name}: {passed ? 'PASS' : 'FAIL'}
        </Text>
      ))}
    </View>
  )
}
