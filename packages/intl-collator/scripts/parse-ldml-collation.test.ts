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
        < b << c <<< d <<<< f = e
      `)
    ).toEqual([
      {type: 'normalization', value: 'on'},
      {type: 'numericOrdering', value: 'true'},
      {type: 'reset', before: 1, value: 'a'},
      {type: 'relation', strength: 'primary', value: 'b'},
      {type: 'relation', strength: 'secondary', value: 'c'},
      {type: 'relation', strength: 'tertiary', value: 'd'},
      {type: 'relation', strength: 'quaternary', value: 'f'},
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

  it('reads suppressContractions sets with literal and escaped ranges', () => {
    expect(
      parseCollationRules(
        String.raw`[suppressContractions [เ-ไ \u19B5-\u19B7 \U00020000]] & a < b`
      )
    ).toEqual([
      {
        type: 'suppressContractions',
        value: [
          0xe40, 0xe41, 0xe42, 0xe43, 0xe44, 0x19b5, 0x19b6, 0x19b7, 0x20000,
        ],
      },
      {type: 'reset', value: 'a'},
      {type: 'relation', strength: 'primary', value: 'b'},
    ])
  })

  it('unescapes rule text and preserves quoted whitespace and delimiters', () => {
    expect(
      parseCollationRules(
        String.raw`&'\u0020' = '\u3000' &x < '\u007C'|'\u002F'/\U00020000`
      )
    ).toEqual([
      {type: 'reset', value: ' '},
      {type: 'relation', strength: 'identical', value: '\u3000'},
      {type: 'reset', value: 'x'},
      {
        type: 'relation',
        strength: 'primary',
        prefix: '|',
        value: '/',
        expansion: '𠀀',
      },
    ])
  })

  it('expands starred ranges and preserves a quoted hyphen', () => {
    expect(
      parseCollationRules("&a <*b-d'-'x-z")
        .slice(1)
        .map(rule => rule.value)
    ).toEqual(['b', 'c', 'd', '-', 'x', 'y', 'z'])
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

  it('keeps imports after relations and reads bracketed logical resets', () => {
    expect(
      parseCollationRules(`
        &ヽ<*㍾㍽
        [import ja-u-co-private-kana]
        &[last regular]<*亜唖
        &'['=［
        &'#'=＃ # comment with an apostrophe '
        &''=＇
      `)
    ).toEqual([
      {type: 'reset', value: 'ヽ'},
      {type: 'relation', strength: 'primary', value: '㍾'},
      {type: 'relation', strength: 'primary', value: '㍽'},
      {type: 'import', value: 'ja-u-co-private-kana'},
      {type: 'reset', value: '[last regular]'},
      {type: 'relation', strength: 'primary', value: '亜'},
      {type: 'relation', strength: 'primary', value: '唖'},
      {type: 'reset', value: '['},
      {type: 'relation', strength: 'identical', value: '［'},
      {type: 'reset', value: '#'},
      {type: 'relation', strength: 'identical', value: '＃'},
      {type: 'reset', value: "'"},
      {type: 'relation', strength: 'identical', value: '＇'},
    ])
  })
})
