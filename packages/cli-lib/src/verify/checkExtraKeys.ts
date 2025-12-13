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

export async function checkExtraKeys(
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

      const extraKeys = new Set(
        Array.from(localeKeys).filter(k => !sourceKeys.includes(k))
      )

      if (!extraKeys.size) {
        return result
      }

      writeStderr('---------------------------------\n')
      writeStderr(`Extra translation keys for locale ${locale}:\n`)
      extraKeys.forEach(r => writeStderr(`${r}\n`))

      return false
    }, true)
}
