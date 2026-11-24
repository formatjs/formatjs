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

const WORD_BREAK_TRANSPARENT = '(?:$Extend|$Format|$ZWJ)'
const LONE_LEAD_SURROGATE = '[\\uD800-\\uDBFF](?![\\uDC00-\\uDFFF])'
const LONE_TRAIL_SURROGATE = '(?:^|[^\\uD800-\\uDBFF])[\\uDC00-\\uDFFF]'
const NON_RI_EXCEPT_LONE_TRAIL = rewritePattern(
  '[^\\p{Regional_Indicator}\\uDC00-\\uDFFF]',
  'u',
  {unicodePropertyEscapes: 'transform', unicodeFlag: 'transform'}
)

// Negated RI classes must preserve surrogate-pair matching in non-Unicode regexes.
const HARDCODED_RULE_REPLACEMENTS: Record<string, string> = {
  // GB13 matches a non-RI code point before the run.
  // https://www.unicode.org/reports/tr29/#GB13
  'root.GraphemeClusterBreak.13.before': `(?:${NON_RI_EXCEPT_LONE_TRAIL}|${LONE_TRAIL_SURROGATE})($RI$RI)*$RI`,

  // WB4 makes Extend, Format, and ZWJ transparent for RI parity in WB15–16.
  // A lone trail surrogate match consumes preceding context. Apply the
  // transparency check to ordinary code points only.
  // https://www.unicode.org/reports/tr29/#WB4
  // https://www.unicode.org/reports/tr29/#WB15
  // https://www.unicode.org/reports/tr29/#WB16
  'root.WordBreak.15.before': `^${WORD_BREAK_TRANSPARENT}*($RI$RI)*$RI`,
  'root.WordBreak.16.before':
    `(?:(?!${WORD_BREAK_TRANSPARENT})${NON_RI_EXCEPT_LONE_TRAIL}|${LONE_TRAIL_SURROGATE})` +
    `${WORD_BREAK_TRANSPARENT}*($RI$RI)*$RI`,
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
  wordCharacters?: string
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
        let fixedRuleString =
          segmentationTypeName === 'SentenceBreak'
            ? ruleString
            : ruleString.replace(/(\[\^)(.+)(\])/gm, '(?:(?!$2))')

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
            const addedOrSigns =
              segmentationTypeName === 'SentenceBreak'
                ? (p2.match(/\$[A-Za-z_][A-Za-z_0-9]*/g) || []).join('|')
                : p2.replace(/(.)(\s?)(\$)/g, '$1|$3')
            if (negation === '^') {
              // Negated character class: [^$Var] becomes (?:(?!$Var).)
              // This matches any character that is not matched by the variable
              return segmentationTypeName === 'SentenceBreak'
                ? `(?:(?!(?:${addedOrSigns}))[\\s\\S])`
                : `(?:(?!${addedOrSigns}).)`
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

          // UAX #29 WB4 and SB5 attach ignored characters to the previous
          // code point, including lone surrogates in ECMAScript strings.
          // https://www.unicode.org/reports/tr29/#WB4
          // https://www.unicode.org/reports/tr29/#SB5
          const anyCharPattern =
            '(?:[\\0-\\uD7FF\\uE000-\\uFFFF]|[\\uD800-\\uDBFF][\\uDC00-\\uDFFF])'
          const ordinaryCharacter =
            excludeParts.length > 0
              ? `(?:(?!(?:${excludeParts.join('|')}))${anyCharPattern})`
              : anyCharPattern
          const beforePattern = `(?:${ordinaryCharacter}|${LONE_LEAD_SURROGATE}|${LONE_TRAIL_SURROGATE})`

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

        // Ignore Format/Extend inside repetitions and between context classes,
        // while preserving mandatory line/paragraph rules and attachment rules.
        for (const [ruleNr, rule] of Object.entries(segmentRules)) {
          if (segmentationTypeName === 'SentenceBreak') {
            if (ruleNr === '3' || ruleNr === '4' || ruleNr === '5') continue
          } else if (
            rule.breaks ||
            ruleNr === '4' ||
            ruleNr === '3' ||
            ruleNr.startsWith('3.')
          ) {
            continue
          }
          for (const side of ['before', 'after'] as const) {
            rule[side] = rule[side]?.replace(
              /\$[A-Za-z_][A-Za-z_0-9]*/g,
              variable =>
                ['$Extend', '$Format', '$ZWJ', '$ParaSep'].includes(variable)
                  ? variable
                  : `(?:${variable}${exfmStarPattern})`
            )
          }
        }
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

  const wordProperties = parseUCDTextFile(
    unicodeFiles.find(file => file.includes('WordBreakProperty'))!
  )
  const coreProperties = parseUCDTextFile(
    unicodeFiles.find(file => file.includes('DerivedCoreProperties'))!
  )
  const ignored = `[${wordProperties.Extend}${wordProperties.Format}${wordProperties.ZWJ}]`
  const bases = `[${coreProperties.Alphabetic}${wordProperties.ALetter}${wordProperties.Hebrew_Letter}${wordProperties.Numeric}${wordProperties.Katakana}]`
  const extenders = `[${wordProperties.ExtendNumLet}]`
  if (!remappedRootSegmentation.word) throw new Error('Missing root word rules')
  // Pin classification to Unicode data, including letterlike symbols; marks
  // alone are not words. ICU word rule 13a recognizes repeated extenders.
  remappedRootSegmentation.word.wordCharacters = rewritePattern(
    `(?:(?!${ignored})${bases}|${extenders}${ignored}*${extenders})`,
    'u',
    {unicodeFlag: 'transform'}
  )

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
