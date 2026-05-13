import {describe, expect, it} from 'vitest'
import {
  parseCollationRules,
  parseLDMLCollations,
} from '#packages/intl-collator/scripts/parse-ldml-collation.js'

describe('LDML collation parser', () => {
  it('parses settings, resets, and relations', () => {
    expect(
      parseCollationRules(`
        [normalization on]
        [numericOrdering true]
        &[before 1] a
        < b << c <<< d = e
      `)
    ).toEqual([
      {type: 'normalization', value: 'on'},
      {type: 'numericOrdering', value: 'true'},
      {type: 'reset', before: 1, value: 'a'},
      {type: 'relation', strength: 'primary', value: 'b'},
      {type: 'relation', strength: 'secondary', value: 'c'},
      {type: 'relation', strength: 'tertiary', value: 'd'},
      {type: 'relation', strength: 'identical', value: 'e'},
    ])
  })

  it('parses expansion and prefix relations', () => {
    expect(parseCollationRules('& ae < a|e / x')).toEqual([
      {type: 'reset', value: 'ae'},
      {
        type: 'relation',
        strength: 'primary',
        prefix: 'a',
        value: 'e',
        expansion: 'x',
      },
    ])
  })

  it('parses reorder settings as token lists', () => {
    expect(parseCollationRules('[reorder Latn Grek digit]')).toEqual([
      {type: 'reorder', value: ['Latn', 'Grek', 'digit']},
    ])
  })

  it('parses LDML collation XML records', () => {
    expect(
      parseLDMLCollations(
        'de',
        `
        <collations>
          <collation type="standard">
            <cr><![CDATA[
              & ae < ä
            ]]></cr>
          </collation>
          <collation type="search">
            <alias source="locale" path="../collation[@type='standard']"/>
          </collation>
        </collations>
      `
      )
    ).toEqual([
      {
        locale: 'de',
        type: 'standard',
        rules: [
          {type: 'reset', value: 'ae'},
          {type: 'relation', strength: 'primary', value: 'ä'},
        ],
      },
      {
        locale: 'de',
        type: 'search',
        rules: [],
        alias: "../collation[@type='standard']",
      },
    ])
  })

  it('parses single-quoted XML attributes', () => {
    expect(
      parseLDMLCollations(
        'zh',
        `<collations><collation type='pinyin'><cr>&amp; a &lt; b</cr></collation></collations>`
      )
    ).toEqual([
      {
        locale: 'zh',
        type: 'pinyin',
        rules: [
          {type: 'reset', value: 'a'},
          {type: 'relation', strength: 'primary', value: 'b'},
        ],
      },
    ])
  })

  it('expands starred relations and ignores rule comments', () => {
    expect(
      parseCollationRules(`
        &a
        <*bc # group comment
        <<d
      `)
    ).toEqual([
      {type: 'reset', value: 'a'},
      {type: 'relation', strength: 'primary', value: 'b'},
      {type: 'relation', strength: 'primary', value: 'c'},
      {type: 'relation', strength: 'secondary', value: 'd'},
    ])
  })
})
