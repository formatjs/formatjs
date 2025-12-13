import {basename} from 'path'
import {debug} from '../console_utils'
import {checkMissingKeys} from './checkMissingKeys'
import {checkExtraKeys} from './checkExtraKeys'
import {readJSON} from 'fs-extra'
import {checkStructuralEquality} from './checkStructuralEquality'
export interface VerifyOpts {
  sourceLocale: string
  missingKeys: boolean
  extraKeys: boolean
  structuralEquality: boolean
  ignore?: string[]
}

export async function verify(
  files: string[],
  {sourceLocale, missingKeys, extraKeys, structuralEquality}: VerifyOpts
): Promise<void> {
  debug('Checking translation files:')
  files.forEach(fn => debug(fn))

  const translationFilesContents = (
    await Promise.all(
      files.map(async fn => [basename(fn, '.json'), await readJSON(fn)])
    )
  ).reduce<Record<string, object>>((all, [locale, content]) => {
    all[locale] = content
    return all
  }, {})
  debug('Verifying files:', files)

  let exitCode = 0

  if (
    missingKeys &&
    !(await checkMissingKeys(translationFilesContents, sourceLocale))
  ) {
    exitCode = 1
  }

  if (
    extraKeys &&
    !(await checkExtraKeys(translationFilesContents, sourceLocale))
  ) {
    exitCode = 1
  }

  if (
    structuralEquality &&
    !(await checkStructuralEquality(translationFilesContents, sourceLocale))
  ) {
    exitCode = 1
  }

  process.exit(exitCode)
}
