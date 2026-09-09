import {expect, it} from 'vitest'
import {
  NumberDataResolver,
  type NumberPathPart,
} from '#packages/intl-numberformat/scripts/number-data.js'

const part = (
  name: string,
  attributes?: Record<string, string>
): NumberPathPart => ({name, attributes})
const symbols = (system: string, name: string) => [
  part('symbols', {numberSystem: system}),
  part(name),
]
const parent = (locale: string) =>
  locale === 'root' ? undefined : locale === 'en-GB' ? 'en' : 'root'
const xml = (numbers: string) => `<ldml><numbers>${numbers}</numbers></ldml>`

it('restarts root aliases at the requested locale and keeps explicit overrides', () => {
  const resolver = new NumberDataResolver(
    new Map([
      [
        'root',
        xml(`<symbols numberSystem="latn"><decimal>.</decimal><group>,</group></symbols>
      <symbols numberSystem="adlm"><alias source="locale" path="../symbols[@numberSystem='latn']"/></symbols>`),
      ],
      [
        'en',
        xml('<symbols numberSystem="adlm"><decimal>!</decimal></symbols>'),
      ],
      ['en-GB', xml('<symbols numberSystem="latn"><group>:</group></symbols>')],
    ]),
    parent
  )
  expect(resolver.get('en-GB', symbols('adlm', 'decimal'))).toBe('!')
  expect(resolver.get('en-GB', symbols('adlm', 'group'))).toBe(':')
  expect(resolver.get('en', symbols('adlm', 'group'))).toBe(',')
})

it('preserves XML entities and whitespace while inheriting marker values', () => {
  const resolver = new NumberDataResolver(
    new Map([
      [
        'root',
        xml(
          '<symbols numberSystem="latn"><group>&#160;</group><decimal>&amp;</decimal></symbols>'
        ),
      ],
      [
        'en',
        xml(
          '<symbols numberSystem="latn"><group>↑↑↑</group><decimal> </decimal></symbols>'
        ),
      ],
    ]),
    parent
  )
  expect(resolver.get('en', symbols('latn', 'group'))).toBe('\u00a0')
  expect(resolver.get('en', symbols('latn', 'decimal'))).toBe(' ')
  expect(resolver.get('root', symbols('latn', 'decimal'))).toBe('&')
})

it('uses count=other in the child before the parent count-specific value', () => {
  const resolver = new NumberDataResolver(
    new Map([
      [
        'root',
        xml(
          '<currencyFormats numberSystem="latn"><unitPattern count="one">parent one</unitPattern></currencyFormats>'
        ),
      ],
      [
        'en',
        xml(
          '<currencyFormats numberSystem="latn"><unitPattern count="other">child other</unitPattern></currencyFormats>'
        ),
      ],
    ]),
    parent
  )
  expect(
    resolver.get('en', [
      part('currencyFormats', {numberSystem: 'latn'}),
      part('unitPattern', {count: 'one'}),
    ])
  ).toBe('child other')
})

it('resolves nested accounting aliases without losing the remaining path', () => {
  const resolver = new NumberDataResolver(
    new Map([
      [
        'root',
        xml(`<currencyFormats numberSystem="arab"><currencyFormatLength>
      <currencyFormat type="accounting"><alias source="locale" path="../currencyFormat[@type='standard']"/></currencyFormat>
      <currencyFormat type="standard"><pattern>root</pattern></currencyFormat>
    </currencyFormatLength></currencyFormats>`),
      ],
      [
        'en',
        xml(
          '<currencyFormats numberSystem="arab"><currencyFormatLength><currencyFormat type="standard"><pattern>child</pattern></currencyFormat></currencyFormatLength></currencyFormats>'
        ),
      ],
    ]),
    parent
  )
  expect(
    resolver.get('en', [
      part('currencyFormats', {numberSystem: 'arab'}),
      part('currencyFormatLength'),
      part('currencyFormat', {type: 'accounting'}),
      part('pattern'),
    ])
  ).toBe('child')
})

it('rejects cyclic aliases and unsupported alias syntax', () => {
  const cycle = new NumberDataResolver(
    new Map([
      [
        'root',
        xml(
          `<symbols numberSystem="latn"><alias source="locale" path="../symbols[@numberSystem='latn']"/></symbols>`
        ),
      ],
    ]),
    parent
  )
  expect(() => cycle.get('en', symbols('latn', 'decimal'))).toThrow(
    'Cyclic number-data alias'
  )
  const unknown = new NumberDataResolver(
    new Map([
      [
        'root',
        xml(
          '<symbols numberSystem="latn"><alias source="locale" path="//other"/></symbols>'
        ),
      ],
    ]),
    parent
  )
  expect(() => unknown.get('en', symbols('latn', 'decimal'))).toThrow(
    'Unsupported number-data alias path'
  )
})

it('inherits past unconfirmed and provisional values, retaining contributed data', () => {
  const resolver = new NumberDataResolver(
    new Map([
      [
        'root',
        xml(
          '<symbols numberSystem="latn"><decimal>.</decimal><group>,</group><plusSign>+</plusSign></symbols>'
        ),
      ],
      [
        'en',
        xml(
          '<symbols numberSystem="latn"><decimal draft="unconfirmed">!</decimal><group draft="provisional">?</group><plusSign draft="contributed">plus</plusSign></symbols>'
        ),
      ],
    ]),
    parent
  )
  expect(resolver.get('en', symbols('latn', 'decimal'))).toBe('.')
  expect(resolver.get('en', symbols('latn', 'group'))).toBe(',')
  expect(resolver.get('en', symbols('latn', 'plusSign'))).toBe('plus')
})

it('shares Latin data only when every numeric section aliases Latin without overrides', () => {
  const sections = [
    'symbols',
    'decimalFormats',
    'percentFormats',
    'currencyFormats',
    'miscPatterns',
  ]
  const root = sections
    .map(
      name =>
        `<${name} numberSystem="adlm"><alias source="locale" path="../${name}[@numberSystem='latn']"/></${name}>`
    )
    .join('')
  const resolver = new NumberDataResolver(
    new Map([
      ['root', xml(root)],
      [
        'en',
        xml('<symbols numberSystem="adlm"><decimal>!</decimal></symbols>'),
      ],
    ]),
    parent
  )
  expect(resolver.usesLatinData('fr', 'adlm')).toBe(true)
  expect(resolver.usesLatinData('en-GB', 'adlm')).toBe(false)
  expect(resolver.usesLatinData('fr', 'arab')).toBe(false)
})
