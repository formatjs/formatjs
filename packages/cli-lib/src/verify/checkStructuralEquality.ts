import {
  isStructurallySame,
  MessageFormatElement,
  parse,
} from '@formatjs/icu-messageformat-parser'
import {debug, writeStderr} from '../console_utils.js'
import {error} from 'console'

/**
 * Flatten nested obj into list of keys, delimited by `.`
 * @param obj
 * @param parentKey
 * @returns
 */
function flatten(obj: any, parentKey = ''): Record<string, string> {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return {}
  }
  return Object.keys(obj).reduce<Record<string, string>>((all, k) => {
    const value = obj[k]
    const key = parentKey ? `${parentKey}.${k}` : k
    if (typeof value === 'object') {
      Object.assign(all, flatten(value, key))
    } else {
      all[key] = value
    }
    return all
  }, {})
}

export async function checkStructuralEquality(
  translationFilesContents: Record<string, any>,
  sourceLocale: string
): Promise<boolean> {
  debug('Checking translation files:')
  const sourceContent = translationFilesContents[sourceLocale]
  if (!sourceContent) {
    throw new Error(`Missing source ${sourceLocale}.json file`)
  }
  const sourceMessages = Object.entries(flatten(sourceContent)).reduce<
    Record<string, MessageFormatElement[]>
  >((all, [key, value]) => {
    try {
      all[key] = parse(value)
    } catch (e) {
      error('Error parsing message', key, value, e)
    }
    return all
  }, {})
  return Object.entries(translationFilesContents)
    .filter(([locale]) => locale !== sourceLocale)
    .reduce<boolean>((result, [locale, content]) => {
      const localeMessages = flatten(content)

      const problematicKeys = Object.keys(sourceMessages)
        .map(k => {
          if (!localeMessages[k]) {
            return {key: k, success: true}
          }
          const sourceMessage = sourceMessages[k]
          try {
            const localeMessage = parse(localeMessages[k])
            return {
              key: k,
              ...isStructurallySame(sourceMessage, localeMessage),
            }
          } catch (e) {
            return {
              key: k,
              success: false,
              error: e instanceof Error ? e : new Error(String(e)),
            }
          }
        })
        .filter(s => !s.success)

      if (!problematicKeys.length) {
        return result
      }

      writeStderr('---------------------------------\n')
      writeStderr(
        `These translation keys for locale ${locale} are structurally different from ${sourceLocale}:\n`
      )
      problematicKeys.forEach(({key, error}) =>
        writeStderr(`${key}: ${error?.message}\n`)
      )

      return false
    }, true)
}
