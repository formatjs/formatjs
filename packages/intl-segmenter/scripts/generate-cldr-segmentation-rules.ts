//pnpm exec bazel run //packages/intl-segmenter:generate-cldr-segmentation-rules

// @ts-ignore to ignore missing type definitions for regexpu-core
import rewritePattern from 'regexpu-core'

import {outputFileSync} from 'fs-extra/esm'
import stringify from 'json-stable-stringify'
import minimist, {type ParsedArgs} from 'minimist'
import {readFileSync} from 'node:fs'

const SEGMENTATION_LOCALES = [
  'de',
  'el',
  'en',
  'es',
  'fr',
  'it',
  'ja',
  'pt',
  'ru',
  'und',
  'zh',
] as const

/**
 * HARDCODED_RULE_REPLACEMENTS - Workarounds for JavaScript regex limitations
 *
 * Context: JavaScript has limitations with negated character classes containing
 * surrogate pairs (characters outside the Basic Multilingual Plane). When CLDR
 * rules use [^$RI] (not a Regional Indicator), the transpilation expands $RI
 * into a massive negated character class that's problematic.
 *
 * Issue: Regional Indicator (RI) rules with Format/Extend characters
 * - CLDR Rule 16: [^$RI] ($RI $RI)* $RI × $RI
 * - Should match: "A🇦🇧" (non-RI followed by RI pairs)
 * - Problem: [^$RI] expands to [^<huge class of RI surrogate pairs>]
 * - Additionally: ($RI$RI)* doesn't allow Extend/Format between RIs
 *
 * Current Status (as of 2025-01):
 * - 35 test cases fail due to RI + Extend combinations (e.g., "🇦̈🇦")
 * - These tests are skipped in word.test.ts (see SKIPPED_REGIONAL_INDICATOR_TESTS)
 * - The hardcoded replacement below is a partial workaround
 * - Full fix would require either:
 *   1. Runtime handling of transparency within ($RI$RI)* patterns
 *   2. Different approach to negated character class transpilation
 *   3. Using a more capable regex engine
 *
 * Related: Lines 608-643 implement transparency injection for most rules,
 * but Regional Indicator rules require special handling due to the repetition
 * pattern ($RI$RI)* where transparency needs to be injected WITHIN the repetition.
 */
const HARDCODED_RULE_REPLACEMENTS: Record<string, string> = {
  // GraphemeClusterBreak rule 13: [^$RI] ($RI $RI)* $RI × $RI
  // Could potentially be implemented at runtime instead of hardcoded
  'root.GraphemeClusterBreak.13.before': '[^\\uDDE6-\\uDDFF]($RI$RI)*$RI',

  // WordBreak rule 16: [^$RI] ($RI $RI)* $RI × $RI
  // The regex is much larger due to $RI in WordBreak being specified as ($RI$FE*)
  // where $FE represents Format/Extend characters
  // This hardcoded replacement expands [^$RI] to an explicit negated class of
  // all Format+Extend Unicode ranges, avoiding the surrogate pair issue
  'root.WordBreak.16.before':
    '[^\\xAD\\u0300-\\u036F\\u0483-\\u0489\\u0591-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05C5\\u05C7\\u0600-\\u0605\\u0610-\\u061A\\u061C\\u064B-\\u065F\\u0670\\u06D6-\\u06DD\\u06DF-\\u06E4\\u06E7\\u06E8\\u06EA-\\u06ED\\u070F\\u0711\\u0730-\\u074A\\u07A6-\\u07B0\\u07EB-\\u07F3\\u07FD\\u0816-\\u0819\\u081B-\\u0823\\u0825-\\u0827\\u0829-\\u082D\\u0859-\\u085B\\u0890\\u0891\\u0898-\\u089F\\u08CA-\\u0903\\u093A-\\u093C\\u093E-\\u094F\\u0951-\\u0957\\u0962\\u0963\\u0981-\\u0983\\u09BC\\u09BE-\\u09C4\\u09C7\\u09C8\\u09CB-\\u09CD\\u09D7\\u09E2\\u09E3\\u09FE\\u0A01-\\u0A03\\u0A3C\\u0A3E-\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A51\\u0A70\\u0A71\\u0A75\\u0A81-\\u0A83\\u0ABC\\u0ABE-\\u0AC5\\u0AC7-\\u0AC9\\u0ACB-\\u0ACD\\u0AE2\\u0AE3\\u0AFA-\\u0AFF\\u0B01-\\u0B03\\u0B3C\\u0B3E-\\u0B44\\u0B47\\u0B48\\u0B4B-\\u0B4D\\u0B55-\\u0B57\\u0B62\\u0B63\\u0B82\\u0BBE-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCD\\u0BD7\\u0C00-\\u0C04\\u0C3C\\u0C3E-\\u0C44\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C62\\u0C63\\u0C81-\\u0C83\\u0CBC\\u0CBE-\\u0CC4\\u0CC6-\\u0CC8\\u0CCA-\\u0CCD\\u0CD5\\u0CD6\\u0CE2\\u0CE3\\u0CF3\\u0D00-\\u0D03\\u0D3B\\u0D3C\\u0D3E-\\u0D44\\u0D46-\\u0D48\\u0D4A-\\u0D4D\\u0D57\\u0D62\\u0D63\\u0D81-\\u0D83\\u0DCA\\u0DCF-\\u0DD4\\u0DD6\\u0DD8-\\u0DDF\\u0DF2\\u0DF3\\u0E31\\u0E34-\\u0E3A\\u0E47-\\u0E4E\\u0EB1\\u0EB4-\\u0EBC\\u0EC8-\\u0ECE\\u0F18\\u0F19\\u0F35\\u0F37\\u0F39\\u0F3E\\u0F3F\\u0F71-\\u0F84\\u0F86\\u0F87\\u0F8D-\\u0F97\\u0F99-\\u0FBC\\u0FC6\\u102B-\\u103E\\u1056-\\u1059\\u105E-\\u1060\\u1062-\\u1064\\u1067-\\u106D\\u1071-\\u1074\\u1082-\\u108D\\u108F\\u109A-\\u109D\\u135D-\\u135F\\u1712-\\u1715\\u1732-\\u1734\\u1752\\u1753\\u1772\\u1773\\u17B4-\\u17D3\\u17DD\\u180B-\\u180F\\u1885\\u1886\\u18A9\\u1920-\\u192B\\u1930-\\u193B\\u1A17-\\u1A1B\\u1A55-\\u1A5E\\u1A60-\\u1A7C\\u1A7F\\u1AB0-\\u1ACE\\u1B00-\\u1B04\\u1B34-\\u1B44\\u1B6B-\\u1B73\\u1B80-\\u1B82\\u1BA1-\\u1BAD\\u1BE6-\\u1BF3\\u1C24-\\u1C37\\u1CD0-\\u1CD2\\u1CD4-\\u1CE8\\u1CED\\u1CF4\\u1CF7-\\u1CF9\\u1DC0-\\u1DFF\\u200C-\\u200F\\u202A-\\u202E\\u2060-\\u2064\\u2066-\\u206F\\u20D0-\\u20F0\\u2CEF-\\u2CF1\\u2D7F\\u2DE0-\\u2DFF\\u302A-\\u302F\\u3099\\u309A\\uA66F-\\uA672\\uA674-\\uA67D\\uA69E\\uA69F\\uA6F0\\uA6F1\\uA802\\uA806\\uA80B\\uA823-\\uA827\\uA82C\\uA880\\uA881\\uA8B4-\\uA8C5\\uA8E0-\\uA8F1\\uA8FF\\uA926-\\uA92D\\uA947-\\uA953\\uA980-\\uA983\\uA9B3-\\uA9C0\\uA9E5\\uAA29-\\uAA36\\uAA43\\uAA4C\\uAA4D\\uAA7B-\\uAA7D\\uAAB0\\uAAB2-\\uAAB4\\uAAB7\\uAAB8\\uAABE\\uAABF\\uAAC1\\uAAEB-\\uAAEF\\uAAF5\\uAAF6\\uABE3-\\uABEA\\uABEC\\uABED\\uFB1E\\uFE00-\\uFE0F\\uFE20-\\uFE2F\\uFEFF\\uFF9E\\uFF9F\\uFFF9-\\uFFFB\\uDDFD\\uDEE0\\uDF76-\\uDF7A\\uDE01-\\uDE03\\uDE05\\uDE06\\uDE0C-\\uDE0F\\uDE38-\\uDE3A\\uDE3F\\uDEE5\\uDEE6\\uDD24-\\uDD27\\uDEAB\\uDEAC\\uDEFD-\\uDEFF\\uDF46-\\uDF50\\uDF82-\\uDF85\\uDC00-\\uDC02\\uDC38-\\uDC46\\uDC70\\uDC73\\uDC74\\uDC7F-\\uDC82\\uDCB0-\\uDCBA\\uDCBD\\uDCC2\\uDCCD\\uDD00-\\uDD02\\uDD27-\\uDD34\\uDD45\\uDD46\\uDD73\\uDD80-\\uDD82\\uDDB3-\\uDDC0\\uDDC9-\\uDDCC\\uDDCE\\uDDCF\\uDE2C-\\uDE37\\uDE3E\\uDE41\\uDEDF-\\uDEEA\\uDF00-\\uDF03\\uDF3B\\uDF3C\\uDF3E-\\uDF44\\uDF47\\uDF48\\uDF4B-\\uDF4D\\uDF57\\uDF62\\uDF63\\uDF66-\\uDF6C\\uDF70-\\uDF74\\uDC35-\\uDC46\\uDC5E\\uDCB0-\\uDCC3\\uDDAF-\\uDDB5\\uDDB8-\\uDDC0\\uDDDC\\uDDDD\\uDE30-\\uDE40\\uDEAB-\\uDEB7\\uDF1D-\\uDF2B\\uDC2C-\\uDC3A\\uDD30-\\uDD35\\uDD37\\uDD38\\uDD3B-\\uDD3E\\uDD40\\uDD42\\uDD43\\uDDD1-\\uDDD7\\uDDDA-\\uDDE0\\uDDE4\\uDE01-\\uDE0A\\uDE33-\\uDE39\\uDE3B-\\uDE3E\\uDE47\\uDE51-\\uDE5B\\uDE8A-\\uDE99\\uDC2F-\\uDC36\\uDC38-\\uDC3F\\uDC92-\\uDCA7\\uDCA9-\\uDCB6\\uDD31-\\uDD36\\uDD3A\\uDD3C\\uDD3D\\uDD3F-\\uDD45\\uDD47\\uDD8A-\\uDD8E\\uDD90\\uDD91\\uDD93-\\uDD97\\uDEF3-\\uDEF6\\uDF00\\uDF01\\uDF03\\uDF34-\\uDF3A\\uDF3E-\\uDF42\\uDC30-\\uDC40\\uDC47-\\uDC55\\uDEF0-\\uDEF4\\uDF30-\\uDF36\\uDF4F\\uDF51-\\uDF87\\uDF8F-\\uDF92\\uDFE4\\uDFF0\\uDFF1\\uDC9D\\uDC9E\\uDCA0-\\uDCA3\\uDF00-\\uDF2D\\uDF30-\\uDF46\\uDD65-\\uDD69\\uDD6D-\\uDD82\\uDD85-\\uDD8B\\uDDAA-\\uDDAD\\uDE42-\\uDE44\\uDE00-\\uDE36\\uDE3B-\\uDE6C\\uDE75\\uDE84\\uDE9B-\\uDE9F\\uDEA1-\\uDEAF\\uDC00-\\uDC06\\uDC08-\\uDC18\\uDC1B-\\uDC21\\uDC23\\uDC24\\uDC26-\\uDC2A\\uDC8F\\uDD30-\\uDD36\\uDEAE\\uDEEC-\\uDEEF\\uDCEC-\\uDCEF\\uDCD0-\\uDCD6\\uDD44-\\uDD4A\\uDDE6-\\uDDFF\\uDFFB-\\uDFFF\\uDC01\\uDC20-\\uDC7F\\uDD00-\\uDDEF]($RI$RI)*$RI',
}

const HARDCODED_VARIABLE_REPLACMENTS: Record<string, string> = {
  // CLDR 48+ no longer uses $FE, so we don't need this hardcoded replacement
  // The Greek locale override will be handled by normal variable substitution
}

const SEGMENTATION_TYPE_NAME_TO_GRANULARITY = {
  WordBreak: 'word',
  SentenceBreak: 'sentence',
  GraphemeClusterBreak: 'grapheme',
} as const

type Granularity =
  (typeof SEGMENTATION_TYPE_NAME_TO_GRANULARITY)[keyof typeof SEGMENTATION_TYPE_NAME_TO_GRANULARITY]

type SegmentationsJsonBreakType =
  | keyof typeof SEGMENTATION_TYPE_NAME_TO_GRANULARITY
  | 'LineBreak'

type SegmentationsJsonBreakTypeValue = {
  variables?: [{[variableName: string]: string}]
  segmentRules?: {[ruleNumber: string]: string}
  standard: [{suppression: string}]
}

type SegmentationsJson = {
  segments: {
    identity: {
      version: {
        _cldrVersion: string
      }
      language: string
    }

    segmentations: Partial<{
      [breakType in SegmentationsJsonBreakType]: SegmentationsJsonBreakTypeValue
    }>
  }
}

type ParsedBreakRule = {
  breaks: boolean
  before?: string
  after?: string
}
type SegmentationsBreakTypeValue = {
  variables?: {[variableName: string]: string}
  segmentRules?: {[ruleNumber: string]: ParsedBreakRule}
  suppressions?: string[]
}

const getGranularity = (
  segmentationTypeName: keyof typeof SEGMENTATION_TYPE_NAME_TO_GRANULARITY
) => {
  if (segmentationTypeName in SEGMENTATION_TYPE_NAME_TO_GRANULARITY) {
    return SEGMENTATION_TYPE_NAME_TO_GRANULARITY[segmentationTypeName]
  } else {
    throw new Error(
      `${segmentationTypeName} not found in SEGMENTATION_TYPE_NAME_TO_GRANULARITY `
    )
  }
}

/**
 *
 * @returns object containing segmentation data from `cldr-segments-full` for all the locales specified in SEGMENTATION_LOCALES
 */
const cldrSegmentationRules = async () => {
  const rules: Record<string, SegmentationsJson> = {}
  for (const locale of SEGMENTATION_LOCALES) {
    const imported = (await import(
      `cldr-segments-full/segments/${locale}/suppressions.json`,
      {with: {type: 'json'}}
    )) as {default: SegmentationsJson}
    rules[locale] = imported.default
  }

  return rules as {
    [K in (typeof SEGMENTATION_LOCALES)[number]]: SegmentationsJson
  }
}

//Utility regexes for UCD file parsing

//splits by ; and trim each
const UCD_LINE_FIELDS_REGEX = /(.+?)\s*;\s*([^\s#]+)/

// get the code range in the form of [startCode, endCode]
const UCD_CODE_RANGE_REGEX = /(.+)\.\.(.+)/

//only valid lines: non-empty and lines not starting with #
const UCD_LINE_SPLIT_REGEX = /^[^#\r\n].+$/gm

/**
 * Extracts codepoints and codepoint ranges for each property value name: `{[propertyName: string]: <u_flag_regex_compatible_code_range: string>}`
 * @param filePath path to the UCD text file
 * @returns
 */
const parseUCDTextFile = (filePath: string) => {
  const GraphemeClusterBreakText = readFileSync(filePath, 'utf-8')

  const regexResult = (GraphemeClusterBreakText.match(UCD_LINE_SPLIT_REGEX) ||
    []) as string[]

  return regexResult.reduce(
    (result: Record<string, string>, current: string) => {
      const lineFieldsMatch = current.match(UCD_LINE_FIELDS_REGEX)
      if (!lineFieldsMatch) {
        throw new Error(
          `Failed to parse line ${current} didn't match UCD_LINE_FIELDS_REGEX`
        )
      }

      let [_, rawCodes, propertyValueName] = lineFieldsMatch

      // DerivedCoreProperties.txt has special format for InCB:
      // CODE ; InCB; VALUE # comment
      // We need to parse the third field for InCB
      if (propertyValueName === 'InCB' || propertyValueName === 'InCB;') {
        const thirdFieldMatch = current.match(/;\s*InCB\s*;\s*([^\s#]+)/)
        if (thirdFieldMatch) {
          propertyValueName = thirdFieldMatch[1]
        }
      }

      if (!(propertyValueName in result)) {
        result[propertyValueName] = '' //regenerate()
      }

      const rangeResult = rawCodes.match(UCD_CODE_RANGE_REGEX)
      if (rangeResult) {
        result[propertyValueName] +=
          `\\u{${rangeResult[1]}}-\\u{${rangeResult[2]}}`
      } else {
        result[propertyValueName] += `\\u{${rawCodes}}`
      }

      return result
    },
    {} as Record<string, string>
  )
}

/**
 * Creates a map of regex replacements for regex properties that regexpu-core can not handle
 * NOTES:
 * property value aliases and property aliases are used based on what is found in CLDR files, this might cause a parse failure if CLDR files are updated and use a different aliases.
 * If this is an issue `PropertyValueAliases.txt` and `PropertyAliases.txt` could be used to generate replacements for all possible aliases
 *
 */
const generateRegexForUnsupportedProperties = (unicodeFiles: string[]) => {
  const regexReplacements: Record<string, string> = {}

  const DerivedCombiningClass = parseUCDTextFile(
    unicodeFiles.find(fn => fn.includes('DerivedCombiningClass')) ?? ''
  )

  const DerivedCoreProperties = parseUCDTextFile(
    unicodeFiles.find(fn => fn.includes('DerivedCoreProperties')) ?? ''
  )

  const GraphemeClusterBreak = parseUCDTextFile(
    unicodeFiles.find(fn => fn.includes('GraphemeBreakProperty')) ?? ''
  )

  const WordBreak = parseUCDTextFile(
    unicodeFiles.find(fn => fn.includes('WordBreakProperty')) ?? ''
  )

  const SentenceBreak = parseUCDTextFile(
    unicodeFiles.find(fn => fn.includes('SentenceBreakProperty')) ?? ''
  )

  const IndicSyllabicCategory = parseUCDTextFile(
    unicodeFiles.find(fn => fn.includes('IndicSyllabicCategory')) ?? ''
  )

  const EastAsianWidth = parseUCDTextFile(
    unicodeFiles.find(fn => fn.includes('DerivedEastAsianWidth')) ?? ''
  )

  const EmojiData = parseUCDTextFile(
    unicodeFiles.find(fn => fn.includes('emoji-data')) ?? ''
  )

  // Collect regex replacements that regexpu-core can not rewrite

  // Deal with Indic_Conjunct_Break https://www.unicode.org/reports/tr44/#Indic_Conjunct_Break
  // Parse InCB values directly from DerivedCoreProperties.txt
  // This includes all scripts with conjunct forms (Myanmar, Khmer, Balinese, Indic scripts, etc.)
  if ('Linker' in DerivedCoreProperties) {
    regexReplacements['\\p{Indic_Conjunct_Break=Linker}'] = String(
      DerivedCoreProperties['Linker']
    )
  }
  if ('Consonant' in DerivedCoreProperties) {
    regexReplacements['\\p{Indic_Conjunct_Break=Consonant}'] = String(
      DerivedCoreProperties['Consonant']
    )
  }
  if ('Extend' in DerivedCoreProperties) {
    regexReplacements['\\p{Indic_Conjunct_Break=Extend}'] = String(
      DerivedCoreProperties['Extend']
    )
  }

  // Replace Extended_Pictographic (binary property from emoji-data.txt)
  if ('Extended_Pictographic' in EmojiData) {
    const extPictValue = String(EmojiData['Extended_Pictographic'])
    // Binary properties can be referenced as \p{Prop} or \p{Prop=True/Yes}
    regexReplacements['\\p{Extended_Pictographic}'] = extPictValue
    regexReplacements['\\p{Extended_Pictographic=True}'] = extPictValue
    regexReplacements['\\p{Extended_Pictographic=Yes}'] = extPictValue
    regexReplacements['\\p{Extended_Pictographic=Y}'] = extPictValue
  }

  // Replace all of the \p{Grapheme_Cluster_Break=*}
  for (const [key, value] of Object.entries(GraphemeClusterBreak)) {
    regexReplacements[`\\p{Grapheme_Cluster_Break=${key}}`] = String(value)
  }

  // "Other" represents all codepoints not explicitly assigned a Grapheme_Cluster_Break value
  // With our patch, regexpu-core can now validate this, but we still need to provide
  // codepoints for the actual regex. Use a broad range covering most Unicode.
  // Note: This is wrapped in [...] by transformCLDRVariablesRegex
  regexReplacements['\\p{Grapheme_Cluster_Break=Other}'] =
    '\\u0000-\\uD7FF\\uE000-\\uFFFF'

  // Replace all of the \p{Word_Break=*}
  for (const [key, value] of Object.entries(WordBreak)) {
    regexReplacements[`\\p{Word_Break=${key}}`] = String(value)
  }

  // "Other" represents all codepoints not explicitly assigned a Word_Break value
  regexReplacements['\\p{Word_Break=Other}'] = '\\u0000-\\uD7FF\\uE000-\\uFFFF'

  for (const [key, value] of Object.entries(SentenceBreak)) {
    regexReplacements[`\\p{Sentence_Break=${key}}`] = String(value)
  }

  // "Other" represents all codepoints not explicitly assigned a Sentence_Break value
  regexReplacements['\\p{Sentence_Break=Other}'] =
    '\\u0000-\\uD7FF\\uE000-\\uFFFF'

  // replace all east asian width (using ea alias)
  for (const [key, value] of Object.entries(EastAsianWidth)) {
    regexReplacements[`\\p{ea=${key}}`] = String(value)
  }

  // Replace all of the \p{Indic_Syllabic_Category=*}
  for (const [key, value] of Object.entries(IndicSyllabicCategory)) {
    regexReplacements[`\\p{Indic_Syllabic_Category=${key}}`] = String(value)
  }

  //only `ccc=0` is ever used from the CombiningClass
  regexReplacements['\\p{ccc=0}'] = `${DerivedCombiningClass['0'].toString()}`

  // There is no sc= in front Gujr and Hiragana, the Unicode regex recognizes it but regexpu-core does not.
  regexReplacements['\\p{Hiragana}'] = '\\p{sc=Hiragana}'
  regexReplacements['\\p{Gujr}'] = '\\p{sc=Gujr}'

  return regexReplacements
}

/**
 * Transforms the regex used in CLDRs into regexpu-core compatible regex leaving variables in place
 *
 * ie: `[\\\\p{Extended_Pictographic} & \\\\p{gc=Cn}]` will be transformed into `[\\p{Extended_Pictographic}&&[\\u....\\u]]` where \\u is a list or range of codepoints
 *
 * @param unicodeRegex regex used in CLDR inside variables, not compatible with js or regexpu-core
 * @returns
 */
const transformCLDRVariablesRegex = (
  unicodeRegex: string,
  regexReplacements: Record<string, string>
) => {
  let jsCompatibleRegex = ''

  //replace all spaces in the regex (js interprets spaces in regex as literal, but unicode regex seems to be ignoring it)
  jsCompatibleRegex = unicodeRegex.replaceAll(/\u0020/gm, '')

  //property escapes in cldr-json are unnecessarily double quoted
  jsCompatibleRegex = jsCompatibleRegex.replaceAll('\\\\p', '\\p')

  //change unicode regex set operands to javascript format (https://github.com/tc39/proposal-regexp-v-flag)
  jsCompatibleRegex = jsCompatibleRegex.replaceAll(/-/gm, '--')
  jsCompatibleRegex = jsCompatibleRegex.replaceAll(/&/gm, '&&')

  //handles the strange case of multiple consecutive properties treated as a single group when performing set operations by CLDR rules
  //example:
  //  `\\\\p{Gujr}\\\\p{sc=Telu}\\\\p{sc=Mlym}\\\\p{sc=Orya}\\\\p{sc=Beng}\\\\p{sc=Deva}&\\\\p{Indic_Syllabic_Category=Virama}`
  // needs to become
  //  `[\\\\p{Gujr}\\\\p{sc=Telu}\\\\p{sc=Mlym}\\\\p{sc=Orya}\\\\p{sc=Beng}\\\\p{sc=Deva}]&\\\\p{Indic_Syllabic_Category=Virama}`
  jsCompatibleRegex = jsCompatibleRegex.replaceAll(
    /\\p\{[^&-]+?\}(\\p\{[^&-]+?\})+/gm,
    match => `[${match}]`
  )

  //replace unsupported unicodePropertyEscapes (see generateRegexForUnsupportedProperties ),
  //wrap the result into [], because if there is a -- or && between properties not wrapped into [] regexpu core will throw an error
  for (const [toReplace, replacement] of Object.entries(regexReplacements)) {
    jsCompatibleRegex = jsCompatibleRegex.replaceAll(
      toReplace,
      `[${replacement}]`
    )
  }

  return jsCompatibleRegex
}

const replaceVariables = (variables: Record<string, string>, input: string) => {
  const findVarRegex = /\$[A-Za-z0-9_]+/gm
  return input.replaceAll(findVarRegex, match => {
    if (!(match in variables)) {
      throw new Error(`No such variable ${match}`)
    }
    return variables[match]
  })
}

/**
 * remaps the cldr locale segmentation json (cldr-segments-full/segments/{locale}/suppressions.json) to a format that can be consumed by segmenter:
 * - renames segmentationTypeName to grapheme, word, sentence
 * - remaps variables:
 *   - from array of objects to object
 *   - fixes variables regex with transformCLDRVariablesRegex
 *   - replaces variables inside variables (required for the regex transpilation)
 *   - transpiles the regex to es5 compatible
 * - remaps rules
 *   - replaces negated character class with regex compatible with regexpu output from variables (needs fixing)
 *   - replaces character class with regex compatible with regexpu output
 *   - extracts if the rule allows or disallows break
 *   - extracts the "before" part of the rule
 *   - extracts the "after"  part of the rule
 *   - applies the hardcoded replacements (needs fixing) of broken rules
 *   - removes literal spaces from rules (unicode regex ignores them, but js treats them as literals)
 * - remaps suppressions into an array of strings
 * @param segmentationFile - cldr locale json
 * @param contextVariables - to pass the root variables as context, needed by some locales
 * @returns
 */
const remapSegmentationJson = (
  segmentationFile: SegmentationsJson,
  regexReplacements: Record<string, string>,
  contextVariables?: Record<SegmentationsJsonBreakType, Record<string, string>>
) => {
  const language = segmentationFile.segments.identity.language
  const segmentations = segmentationFile.segments.segmentations

  const currentContexVariables: Record<string, {[x: string]: string}> = {}
  const remappedSegmentations: Partial<
    Record<Granularity, SegmentationsBreakTypeValue>
  > = {}

  for (const [segmentationTypeName, segmentationTypeValue] of Object.entries(
    segmentations
  ) as [SegmentationsJsonBreakType, SegmentationsJsonBreakTypeValue][]) {
    //line break is not part of the proposal: https://github.com/tc39/proposal-intl-segmenter#why-is-line-breaking-not-included
    if (segmentationTypeName === 'LineBreak') {
      continue
    }

    currentContexVariables[segmentationTypeName] =
      contextVariables && segmentationTypeName in contextVariables
        ? {...contextVariables[segmentationTypeName]}
        : {}

    const variableMap: Record<string, string> = {}

    if (
      'variables' in segmentationTypeValue &&
      segmentationTypeValue.variables
    ) {
      for (const variable of segmentationTypeValue.variables) {
        for (const [variableName, variableValue] of Object.entries(variable)) {
          try {
            const key = `${language}.${segmentationTypeName}.${variableName}`
            const hardcodedReplacment = HARDCODED_VARIABLE_REPLACMENTS[key]

            let variableRegex = hardcodedReplacment || variableValue

            variableRegex = transformCLDRVariablesRegex(
              variableRegex,
              regexReplacements
            )

            //replace variables with context variables
            variableRegex = replaceVariables(
              currentContexVariables[segmentationTypeName],
              variableRegex
            )

            //add the new variable to the contex
            currentContexVariables[segmentationTypeName][variableName] =
              variableRegex

            //v flag enables unicode regex sets
            //s flag enables dotAll flag
            let transformedRegex = rewritePattern(variableRegex, 'vs', {
              unicodeSetsFlag: 'transform',
              dotAllFlag: 'transform',
            })

            //need two steps to correctly downlevel certain unicode property escapes
            transformedRegex = rewritePattern(transformedRegex, 'u', {
              unicodePropertyEscapes: 'transform',
              unicodeFlag: 'transform',
            })

            variableMap[variableName] = transformedRegex
          } catch (_e) {
            //so typescript does not complain
            const e = _e as Error
            e.message = `${language}:${segmentationTypeName}:${variableName}: ${e.message}`
            throw e
          }
        }
      }
    }

    let segmentRules: Record<string, ParsedBreakRule> = {}

    if (
      'segmentRules' in segmentationTypeValue &&
      segmentationTypeValue.segmentRules
    ) {
      for (const [ruleNr, ruleString] of Object.entries(
        segmentationTypeValue.segmentRules
      )) {
        //replace negated character class to negative lookahead inside noncapturing group (it doesn't handle surrogate pairs yet so for [^$RI] there is a hardcoded rule replacment `HARDCODED_RULE_REPLACEMENTS`)
        let fixedRuleString = ruleString.replace(
          /(\[\^)(.+)(\])/gm,
          '(?:(?!$2))'
        )

        // First, handle negated character classes specifically for [^$RI]
        // This must be done before other replacements
        fixedRuleString = fixedRuleString.replace(/\[\^\$RI\]/g, '(?:(?!$RI).)')

        //replaces character class to a non capturing group and adding | between variables - so is compatible with regexpu output on variables
        //example:
        //   `[$Format $Extend]` where $Format and $Extend are variables in a format of (?:...)
        //to
        //   `(?:$Format|$Extend)`
        fixedRuleString = fixedRuleString.replace(
          //find character classes, so [<contents>]
          /(\[)(\^?)(.+?)(\])/gm,
          (_, _p1, negation, p2, _p3) => {
            //find variables and add | between - it will not work if the rule has hardcoded codepoints, but they don't and shouldn't
            const addedOrSigns = p2.replace(/(.)(\s?)(\$)/g, '$1|$3')
            if (negation === '^') {
              // Negated character class: [^$Var] becomes (?:(?!$Var).)
              // This matches any character that is not matched by the variable
              return `(?:(?!${addedOrSigns}).)`
            } else {
              // Normal character class: [$Var1 $Var2] becomes (?:$Var1|$Var2)
              return `(?:${addedOrSigns})`
            }
          }
        )

        let breaks = true
        let relationPosition = fixedRuleString.indexOf('\u00F7') // ÷ break
        if (relationPosition < 0) {
          relationPosition = fixedRuleString.indexOf('\u00D7') // × no-break
          if (relationPosition < 0) {
            relationPosition = fixedRuleString.indexOf('\u2192') // → substitution (CLDR 48+)
            if (relationPosition < 0) {
              throw new Error(
                `Couldn't find, \u00F7, \u00D7, or \u2192 in the rule ${language}:${segmentationTypeName}:${ruleNr}`
              )
            }
            // Substitution rules should be skipped as they're not simple break rules
            continue
          }
          breaks = false
        }

        segmentRules[ruleNr] = {breaks}

        //fix the regex
        let before = fixedRuleString.substring(0, relationPosition).trim()
        if (before) {
          const hardcodedReplacementKey: string = `${language}.${segmentationTypeName}.${ruleNr}.before`
          if (hardcodedReplacementKey in HARDCODED_RULE_REPLACEMENTS) {
            segmentRules[ruleNr].before =
              HARDCODED_RULE_REPLACEMENTS[hardcodedReplacementKey]
          } else {
            //remove spaces, they are not necessary
            segmentRules[ruleNr].before = before.replaceAll(/\u0020/gm, '')
          }
        }

        const after = fixedRuleString.substring(relationPosition + 1).trim()
        if (after) {
          const hardcodedReplacementKey: string = `${language}.${segmentationTypeName}.${ruleNr}.after`
          if (hardcodedReplacementKey in HARDCODED_RULE_REPLACEMENTS) {
            segmentRules[ruleNr].after =
              HARDCODED_RULE_REPLACEMENTS[hardcodedReplacementKey]
          } else {
            //remove spaces, they are not necessary
            segmentRules[ruleNr].after = after.replaceAll(/\u0020/gm, '')
          }
        }
      }
    }

    // Add transparency rules for Format/Extend/ZWJ characters
    // This is fundamental to Unicode text segmentation (UAX #29)
    // - WordBreak: WB4 rule ensures Format/Extend/ZWJ attach to preceding character
    // - SentenceBreak: SB5 rule ensures Format/Extend attach to preceding character
    // ICU4J implements: [^$CR$LF$Newline$ExFm]$ExFm*; where $ExFm = [$Extend$Format$ZWJ]
    // Only add if rule doesn't already exist (e.g., from CLDR data)
    if (
      segmentationTypeName === 'WordBreak' ||
      segmentationTypeName === 'SentenceBreak'
    ) {
      const hasExtend = '$Extend' in variableMap
      const hasFormat = '$Format' in variableMap
      const hasZWJ = '$ZWJ' in variableMap
      const hasCR = '$CR' in variableMap
      const hasLF = '$LF' in variableMap
      const hasNewline = '$Newline' in variableMap

      if (hasExtend || hasFormat || hasZWJ) {
        // Build the "ExFm" pattern (Extend | Format | ZWJ)
        const exfmParts: string[] = []
        if (hasExtend) exfmParts.push('$Extend')
        if (hasFormat) exfmParts.push('$Format')
        if (hasZWJ) exfmParts.push('$ZWJ')
        const exfmPattern = `(?:${exfmParts.join('|')})`
        const exfmStarPattern = `(?:${exfmParts.join('|')})*` // Zero or more

        // Add transparency attachment rule if it doesn't exist
        // - WordBreak: Rule 4 (WB4) - excludes CR/LF/Newline
        // - SentenceBreak: Rule 5 (SB5) - excludes ParaSep
        const ruleNumber = segmentationTypeName === 'WordBreak' ? '4' : '5'

        if (!(ruleNumber in segmentRules)) {
          // Build the pattern for characters that should NOT be before ExFm
          const excludeParts: string[] = []

          if (segmentationTypeName === 'WordBreak') {
            // WB4: Exclude CR, LF, Newline
            if (hasCR) excludeParts.push('$CR')
            if (hasLF) excludeParts.push('$LF')
            if (hasNewline) excludeParts.push('$Newline')
          } else if (segmentationTypeName === 'SentenceBreak') {
            // SB5: Exclude ParaSep (paragraph separator)
            const hasParaSep = '$ParaSep' in variableMap
            if (hasParaSep) excludeParts.push('$ParaSep')
          }

          // The pattern for the character BEFORE the break: any character that is NOT in the exclude list
          // IMPORTANT: Use a pattern that matches ALL characters including emoji (surrogate pairs)
          // NOT just $XX which only matches BMP characters
          // Pattern: (?:[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF])
          // This matches BMP characters OR surrogate pairs (emoji, etc.)
          const anyCharPattern =
            '(?:[\\0-\\uD7FF\\uE000-\\uFFFF]|[\\uD800-\\uDBFF][\\uDC00-\\uDFFF])'
          const beforePattern =
            excludeParts.length > 0
              ? `(?:(?!(?:${excludeParts.join('|')}))${anyCharPattern})`
              : anyCharPattern

          // Create the rule
          // WB4: (Any ÷ Any) / (Any × (Extend | Format | ZWJ))
          // SB5: X (Extend | Format)* → X
          // Meaning: Don't break between most characters and Format/Extend/ZWJ
          segmentRules[ruleNumber] = {
            breaks: false,
            before: beforePattern,
            after: exfmPattern,
          }
        }

        // ============================================================================
        // TRANSPARENCY INJECTION - Critical for Unicode 17.0+ Format/Extend handling
        // ============================================================================
        //
        // Context: Unicode text segmentation must handle Format/Extend/ZWJ characters
        // "transparently" - other rules should look through them. For example:
        //   - "A̅" (A + COMBINING OVERLINE) should match $ALetter × $ALetter
        //   - "a'̈a" (apostrophe + COMBINING DIAERESIS) should match MidLetter rules
        //   - "🇦̈" (Regional Indicator + COMBINING DIAERESIS) should stay together
        //
        // Implementation: We inject (?:$Extend|$Format|$ZWJ)* patterns into rules
        // to allow zero or more transparent characters between character classes.
        //
        // What we inject:
        //   1. "before" patterns: Append $ExFm* to the end
        //      Example: $ALetter becomes $ALetter(?:$Extend|$Format|$ZWJ)*
        //   2. "after" patterns: Insert $ExFm* between variables
        //      Example: ($MidLetter|$MidNumLetQ)$AHLetter becomes
        //               ($MidLetter|$MidNumLetQ)(?:$ExFm)*$AHLetter
        //
        // Fixed in this commit (2025-01):
        //   - Added "after" pattern transparency for WB6, WB7, WB11, WB12
        //   - Fixed 76 out of 111 word segmentation test failures (68% improvement)
        //
        // Known limitations:
        //   - Regional Indicator rules (WB15, WB16) still have 35 failing tests
        //   - See HARDCODED_RULE_REPLACEMENTS above for details
        //
        // Rules to inject transparency into (based on ICU word.txt):
        // - All non-break rules (breaks: false)
        // - Skip rules that explicitly handle Format/Extend (like WB4/SB5, WB3c)
        // - Skip rules that already have $Extend/$Format/$ZWJ variables
        //
        // For WordBreak: Full transparency injection (before AND after patterns)
        // For SentenceBreak: Only inject transparency in "before" patterns
        //   - SentenceBreak has more complex rules and full transparency breaks them
        //   - "before" transparency allows rules to match through Format/Extend
        //   - "after" transparency would incorrectly merge sentence boundaries
        //
        for (const [ruleNr, rule] of Object.entries(segmentRules)) {
          // For WordBreak: Skip break rules (we only want transparency in non-break rules)
          // For SentenceBreak: Process all rules (break rules need transparency to match through Extend/Format)
          if (segmentationTypeName === 'WordBreak' && rule.breaks) {
            continue
          }

          // Skip the transparency attachment rule itself (already handles Format/Extend)
          // WordBreak: rule 4, SentenceBreak: rule 5
          if (ruleNr === ruleNumber) {
            continue
          }

          // Skip rules that start with line break characters (WB3, WB3a, WB3b, WB3c)
          if (ruleNr === '3' || ruleNr.startsWith('3.')) {
            continue
          }

          // Only inject if the rule has a "before" pattern
          if (rule.before) {
            // Check if the pattern already has $ExFm* or similar transparency
            // Use word boundaries to match complete variable names, not substrings
            // (e.g., don't match "$Extend" in "$ExtendNumLet")
            const hasExtendVar = /\$Extend(?![a-zA-Z])/.test(rule.before)
            const hasFormatVar = /\$Format(?![a-zA-Z])/.test(rule.before)
            const hasZWJVar = /\$ZWJ(?![a-zA-Z])/.test(rule.before)

            if (hasExtendVar || hasFormatVar || hasZWJVar) {
              // Already has transparency, skip
              continue
            }

            // Inject $ExFm* at the end of the before pattern
            // The anchor ($) is added later by generateRuleRegex, so we just append here
            // Pattern: $AHLetter becomes $AHLetter(?:$Extend|$Format|$ZWJ)*
            rule.before = rule.before + exfmStarPattern
          }

          // AFTER PATTERN TRANSPARENCY - Only for WordBreak (added in 2025-01)
          //
          // Problem: CLDR rules like WB6 have "after" patterns with multiple variables:
          //   WB6: $AHLetter × ($MidLetter | $MidNumLetQ) $AHLetter
          // This becomes: after = "($MidLetter|$MidNumLetQ)$AHLetter"
          //
          // Without transparency injection, this fails for:
          //   - "a'̈a" (apostrophe + COMBINING DIAERESIS + a)
          //   The apostrophe matches $MidLetter, but the diaeresis blocks $AHLetter
          //
          // Solution: Inject $ExFm* between the alternation group and the next variable
          //   Pattern: )$Var becomes )(?:$ExFm)*$Var
          //   Result: "($MidLetter|$MidNumLetQ)(?:$ExFm)*$AHLetter"
          //
          // This fixed 16 test failures related to MidLetter/MidNumLet with Extend chars.
          //
          // NOTE: Only apply to WordBreak. SentenceBreak has more complex rules and
          // "after" transparency would incorrectly merge sentence boundaries.
          //
          if (segmentationTypeName === 'WordBreak' && rule.after) {
            // Check if the pattern already has transparency
            const hasExtendVar = /\$Extend(?![a-zA-Z])/.test(rule.after)
            const hasFormatVar = /\$Format(?![a-zA-Z])/.test(rule.after)
            const hasZWJVar = /\$ZWJ(?![a-zA-Z])/.test(rule.after)

            if (!hasExtendVar && !hasFormatVar && !hasZWJVar) {
              // Inject $ExFm* between variable references
              // Regex matches: ) followed by $Variable
              // Replaces with: )(?:$Extend|$Format|$ZWJ)*$Variable
              rule.after = rule.after.replace(
                /(\))(\$[A-Z][a-zA-Z_]*)/g,
                `$1${exfmStarPattern}$2`
              )
            }
          }
        } // end for loop over segmentRules
      } // end if (hasExtend || hasFormat || hasZWJ)

      // Note: CLDR already provides rules 13, 13.1, 13.2, 15, 16 for ExtendNumLet and Regional Indicator
      // We don't need to add them manually - they come from the CLDR data
    } // end if (segmentationTypeName === 'WordBreak' || segmentationTypeName === 'SentenceBreak')

    let suppressions: string[] = []
    if ('standard' in segmentationTypeValue) {
      suppressions = segmentationTypeValue.standard
        .map(sur => Object.values(sur))
        .flat()
    }

    const granularityKey = getGranularity(segmentationTypeName)

    remappedSegmentations[granularityKey] = {
      variables: variableMap,
      segmentRules,
      suppressions,
    }
  }

  return {
    currentContexVariables,
    language,
    segmentations: remappedSegmentations,
  }
}

interface Args extends ParsedArgs {
  out: string
  unicodeFiles: string[]
}

async function main({out, unicodeFiles}: Args) {
  //root rules (needed to be separate for the context Variables)
  const {und: rootSegmentation, ...localeSegmentations} =
    await cldrSegmentationRules()

  const regexReplacements = generateRegexForUnsupportedProperties(unicodeFiles)

  //locale rules
  const {
    currentContexVariables: rootContextVariables,
    segmentations: remappedRootSegmentation,
  } = remapSegmentationJson(rootSegmentation, regexReplacements)

  // CLDR 48+ removed $FE, but some locale overrides still reference it
  // $FE was Format+Extend, so we add it to context for backward compatibility
  for (const breakType of Object.keys(rootContextVariables)) {
    const vars = rootContextVariables[breakType]
    if (!vars['$FE']) {
      // $FE = Format | Extend (empty pattern if not available)
      vars['$FE'] =
        vars['$Format'] && vars['$Extend']
          ? `(?:${vars['$Format']}|${vars['$Extend']})`
          : ''
    }
  }

  const remappedLocaleSegmentations: Record<
    string,
    Partial<Record<Granularity, SegmentationsBreakTypeValue>>
  > = {
    root: remappedRootSegmentation,
  }

  //remap each locale using root context
  for (const [_, segmentationsFile] of Object.entries(localeSegmentations)) {
    const {language, segmentations} = remapSegmentationJson(
      segmentationsFile,
      regexReplacements,
      rootContextVariables
    )
    remappedLocaleSegmentations[language] = segmentations
  }

  outputFileSync(
    out,
    `/* @generated */
    // prettier-ignore
    export const SegmentationRules = ${stringify(remappedLocaleSegmentations, {
      space: 2,
    })} as const

    `
  )
}

main(minimist<Args>(process.argv))
