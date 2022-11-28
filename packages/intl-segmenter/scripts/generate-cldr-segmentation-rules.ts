//pnpm exec bazel run //packages/intl-segmenter:generate-cldr-segmentation-rules

// @ts-ignore to ignore missing type definitions for regexpu-core
import rewritePattern from 'regexpu-core'

import minimist from 'minimist'
import {outputFileSync} from 'fs-extra'
import {readFileSync} from 'node:fs'
import path from 'node:path'

const SEGMENTATION_LOCALES = [
  'de',
  // 'el', //not sure how to correctly interpret: "$STerm": "[[$STerm] [\\u003B \\u037E]]"
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

const SEGMENTATION_TYPE_NAME_TO_GRANULARITY = {
  WordBreak: 'word',
  SentenceBreak: 'sentence',
  GraphemeClusterBreak: 'grapheme',
} as const

type Granularity =
  typeof SEGMENTATION_TYPE_NAME_TO_GRANULARITY[keyof typeof SEGMENTATION_TYPE_NAME_TO_GRANULARITY]

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
    rules[locale] = await import(
      `cldr-segments-full/segments/${locale}/suppressions.json`
    )
  }

  return rules as {
    [K in typeof SEGMENTATION_LOCALES[number]]: SegmentationsJson
  }
}

//Utility regexes for UCD file parsing

//splits by ; and trim each
const UCD_LINE_FIELDS_REGEX = /(.+?)\s*;\s*([^\s]+)/

// get the code range in the form of [startCode, endCode]
const UCD_CODE_RANGE_REGEX = /(.+)\.\.(.+)/

//only valid lines: non-empty and lines not starting with #
const UCD_LINE_SPLIT_REGEX = /^[^#^\r^\n]+\s/gm

/**
 * Extracts codepoints and codepoint ranges for each property value name: `{[propertyName: string]: <u_flag_regex_compatible_code_range: string>}`
 * @param filePath path to the UCD text file
 * @returns
 */
const parseUCDTextFile = (filePath: string) => {
  const GraphemeClusterBreakText = readFileSync(filePath, 'utf-8')

  const regexResult = GraphemeClusterBreakText.match(UCD_LINE_SPLIT_REGEX) || []

  return regexResult.reduce((result, current) => {
    const lineFieldsMatch = current.match(UCD_LINE_FIELDS_REGEX)
    if (!lineFieldsMatch) {
      throw new Error(
        `Failed to parse line ${current} didn't match UCD_LINE_FIELDS_REGEX`
      )
    }

    const [_, rawCodes, propertyValueName] = lineFieldsMatch

    if (!(propertyValueName in result)) {
      result[propertyValueName] = '' //regenerate()
    }

    const rangeResult = rawCodes.match(UCD_CODE_RANGE_REGEX)
    if (rangeResult) {
      result[
        propertyValueName
      ] += `\\u{${rangeResult[1]}}-\\u{${rangeResult[2]}}`
    } else {
      result[propertyValueName] += `\\u{${rawCodes}}`
    }

    return result
  }, {} as Record<string, string>)
}

/**
 * Creates a map of regex replacements for regex properties that regexpu-core can not handle
 * NOTES:
 * property value aliases and property aliases are used based on what is found in CLDR files, this might cause a parse failure if CLDR files are updated and use a different aliases.
 * If this is an issue `PropertyValueAliases.txt` and `PropertyAliases.txt` could be used to generate replacements for all possible aliases
 *
 */
const generateRegexForUnsupportedProperties = () => {
  const regexReplacements: Record<string, string> = {}

  const GraphemeClusterBreak = parseUCDTextFile(
    path.resolve(__dirname, '../unicodeFiles/GraphemeBreakProperty.txt')
  )

  const WordBreak = parseUCDTextFile(
    path.resolve(__dirname, '../unicodeFiles/WordBreakProperty.txt')
  )

  const SentenceBreak = parseUCDTextFile(
    path.resolve(__dirname, '../unicodeFiles/SentenceBreakProperty.txt')
  )

  const IndicSyllabicCategory = parseUCDTextFile(
    path.resolve(__dirname, '../unicodeFiles/IndicSyllabicCategory.txt')
  )

  const DerivedCombiningClass = parseUCDTextFile(
    path.resolve(__dirname, '../unicodeFiles/DerivedCombiningClass.txt')
  )

  const EastAsianWidth = parseUCDTextFile(
    path.resolve(__dirname, '../unicodeFiles/DerivedEastAsianWidth.txt')
  )

  // Collect regex replacements that regexpu-core can not rewrite

  // Replace all of the \p{Grapheme_Cluster_Break=*}
  for (const [key, value] of Object.entries(GraphemeClusterBreak)) {
    regexReplacements[`\\p{Grapheme_Cluster_Break=${key}}`] = value.toString()
  }

  // Replace all of the \p{Word_Break=*}
  for (const [key, value] of Object.entries(WordBreak)) {
    regexReplacements[`\\p{Word_Break=${key}}`] = value.toString()
  }

  for (const [key, value] of Object.entries(SentenceBreak)) {
    regexReplacements[`\\p{Sentence_Break=${key}}`] = value.toString()
  }

  // replace all east asian width (using ea alias)
  for (const [key, value] of Object.entries(EastAsianWidth)) {
    regexReplacements[`\\p{ea=${key}}`] = value.toString()
  }

  // Replace all of the \p{Indic_Syllabic_Category=*}
  for (const [key, value] of Object.entries(IndicSyllabicCategory)) {
    regexReplacements[`\\p{Indic_Syllabic_Category=${key}}`] = value.toString()
  }

  //only `ccc=0` is ever used from the CombiningClass
  regexReplacements['\\p{ccc=0}'] = `${DerivedCombiningClass['0'].toString()}`

  // There is no sc= in front Gujr and Hiragana, the Unicode regex recognizes it but regexpu-core does not.
  regexReplacements['\\p{Hiragana}'] = '\\p{sc=Hiragana}'
  regexReplacements['\\p{Gujr}'] = '\\p{sc=Gujr}'

  return regexReplacements
}

const regexReplacements = generateRegexForUnsupportedProperties()

/**
 * Transforms the regex used in CLDRs into regexpu-core compatible regex leaving variables in place
 *
 * ie: `[\\\\p{Extended_Pictographic} & \\\\p{gc=Cn}]` will be transformed into `[\\p{Extended_Pictographic}&&[\\u....\\u]]` where \\u is a list or range of codepoints
 *
 * @param unicodeRegex regex used in CLDR inside variables, not compatible with js or regexpu-core
 * @returns
 */
const transformCLDRVariablesRegex = (unicodeRegex: string) => {
  let jsCompatibleRegex = ''

  //replace all spaces in the regex (js interprets spaces in regex as literal, but unicode regex seems to be ignoring it)
  jsCompatibleRegex = unicodeRegex.replaceAll(/\u0020/gm, '')

  //property escapes in cldr-json are unnecessarily double quoted
  jsCompatibleRegex = jsCompatibleRegex.replaceAll('\\\\p', '\\p')

  //change unicode regex set operands to javascript format (https://github.com/tc39/proposal-regexp-v-flag)
  jsCompatibleRegex = jsCompatibleRegex.replaceAll(/-/gm, '--')
  jsCompatibleRegex = jsCompatibleRegex.replaceAll(/\&/gm, '&&')

  //handles the strange case of multiple consecutive properties treated as a single group when performing set operations
  //example:
  //  `\\\\p{Gujr}\\\\p{sc=Telu}\\\\p{sc=Mlym}\\\\p{sc=Orya}\\\\p{sc=Beng}\\\\p{sc=Deva}&\\\\p{Indic_Syllabic_Category=Virama}`
  // needs to become
  //  `[\\\\p{Gujr}\\\\p{sc=Telu}\\\\p{sc=Mlym}\\\\p{sc=Orya}\\\\p{sc=Beng}\\\\p{sc=Deva}]&\\\\p{Indic_Syllabic_Category=Virama}`
  jsCompatibleRegex = jsCompatibleRegex.replaceAll(
    /\\p\{[^&\-]+?\}(\\p\{[^&\-]+?\})+/gm,
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

const hardcodedRuleReplacments: Record<string, string> = {
  //Because of: https://github.com/mathiasbynens/regexpu-core/issues/72
  //could be implemented on the runtime
  'root.GraphemeClusterBreak.13.before':
    '(?:(?!\\uD83C[\\uDDE6-\\uDDFF])[^\\uDDE6-\\uDDFF])((?:\\uD83C[\\uDDE6-\\uDDFF])(?:\\uD83C[\\uDDE6-\\uDDFF]))*(?:\\uD83C[\\uDDE6-\\uDDFF])',

  //This is only partially fixes the word break, there is still 1 failing test (see L385)
  'root.WordBreak.16.before':
    '(?:(?!\\uD83C[\\uDDE6-\\uDDFF])[^\\uDDE6-\\uDDFF])((?:\\uD83C[\\uDDE6-\\uDDFF])(?:\\uD83C[\\uDDE6-\\uDDFF]))*(?:\\uD83C[\\uDDE6-\\uDDFF])',
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
            let variableRegex = transformCLDRVariablesRegex(variableValue)

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
        //replace negated character class to negative lookahead inside noncapturing group (doesn't work correctly, needs fixing)
        //somewhat hacky way to transform the rule regex, can't use regexpu because we need to preserve the varialbes
        //TODO: needs fixing
        let fixedRuleString = ruleString.replace(
          /(\[\^)(.+)(\])/gm,
          '(?:(?!$2))'
        )

        //replaces character class to a non capturing group and adding | between variables - so is compatible with regexpu output on variables
        //example:
        //   `[$Format $Extend]` where $Format and $Extend are variables in a format of (?:...)
        //to
        //   `(?:$Format|$Format)`
        fixedRuleString = fixedRuleString.replace(
          //find character classes, so [<contents>]
          /(\[)(.+)(\])/gm,
          (_, _p1, p2) => {
            //find variables and add | inbwtween - it will not work if the rule has hardcoded codepoints, but they don't and shouldn't
            const addedOrSigns = p2.replace(/(.)(\s?)(\$)/g, '$1|$3')
            return `(?:${addedOrSigns})`
          }
        )

        let breaks = true
        let relationPosition = fixedRuleString.indexOf('\u00F7')
        if (relationPosition < 0) {
          relationPosition = fixedRuleString.indexOf('\u00D7')
          if (relationPosition < 0) {
            throw new Error(
              `Couldn't find, \u00F7, or \u00D7 in the rule ${language}:${segmentationTypeName}:${ruleNr}`
            )
          }
          breaks = false
        }

        segmentRules[ruleNr] = {breaks}

        //fix the regex
        let before = fixedRuleString.substring(0, relationPosition).trim()
        if (before) {
          const hardcodedReplacementKey: string = `${language}.${segmentationTypeName}.${ruleNr}.before`
          if (hardcodedReplacementKey in hardcodedRuleReplacments) {
            segmentRules[ruleNr].before =
              hardcodedRuleReplacments[hardcodedReplacementKey]
          } else {
            //remove spaces, they are not necessary
            segmentRules[ruleNr].before = before.replaceAll(/\u0020/gm, '')
          }
        }

        const after = fixedRuleString.substring(relationPosition + 1).trim()
        if (after) {
          const hardcodedReplacementKey: string = `${language}.${segmentationTypeName}.${ruleNr}.after`
          if (hardcodedReplacementKey in hardcodedRuleReplacments) {
            segmentRules[ruleNr].after =
              hardcodedRuleReplacments[hardcodedReplacementKey]
          } else {
            //remove spaces, they are not necessary
            segmentRules[ruleNr].after = after.replaceAll(/\u0020/gm, '')
          }
        }
      }
    }

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

async function main(args: minimist.ParsedArgs) {
  const {out} = args
  //root rules (needed to be separate for the context Variables)
  const {und: rootSegmentation, ...localeSegmentations} =
    await cldrSegmentationRules()

  //locale rules
  const {
    currentContexVariables: rootContextVariables,
    segmentations: remappedRootSegmentation,
  } = remapSegmentationJson(rootSegmentation)

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
      rootContextVariables
    )
    remappedLocaleSegmentations[language] = segmentations
  }

  outputFileSync(
    out,
    `/* @generated */
    // prettier-ignore
    export const SegmentationRules = ${JSON.stringify(
      remappedLocaleSegmentations,
      null,
      4
    )}

    `
  )
}

if (require.main === module) {
  main(minimist(process.argv))
}
