import {debug, writeStderr} from '../console_utils'

/**
 * Flatten nested obj into list of keys, delimited by `.`
 * @param obj
 * @param parentKey
 * @returns
 */
function extractKeys(obj: any, parentKey = ''): string[] {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return []
  }
  return Object.keys(obj)
    .map(k => [parentKey ? `${parentKey}.${k}` : k, ...extractKeys(obj[k], k)])
    .flat()
}

export async function checkMissingKeys(
  translationFilesContents: Record<string, any>,
  sourceLocale: string
): Promise<boolean> {
  debug('Checking translation files:')
  const sourceContent = translationFilesContents[sourceLocale]
  if (!sourceContent) {
    throw new Error(`Missing source ${sourceLocale}.json file`)
  }
  const sourceKeys = extractKeys(sourceContent)
  return Object.entries(translationFilesContents)
    .filter(([locale]) => locale !== sourceLocale)
    .reduce<boolean>((result, [locale, content]) => {
      const localeKeys = new Set(extractKeys(content))

      const missingKeys = new Set(sourceKeys.filter(r => !localeKeys.has(r)))
      // We're being lenient here since only missing keys are currently considered breaking
      if (!missingKeys.size) {
        return result
      }
      writeStderr('---------------------------------\n')
      writeStderr(`Missing translation keys for locale ${locale}:\n`)
      missingKeys.forEach(r => writeStderr(`${r}\n`))

      return false
    }, true)
}
