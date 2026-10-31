import {basename} from 'path'
import {verifyXcstringsWithNative} from '#packages/cli-lib/native.js'
import {debug, writeStderr} from '#packages/cli-lib/console_utils.js'
import {checkJavaPrintfStructure} from '#packages/cli-lib/verify/checkJavaPrintfStructure.js'
import {checkMissingKeys} from '#packages/cli-lib/verify/checkMissingKeys.js'
import {checkExtraKeys} from '#packages/cli-lib/verify/checkExtraKeys.js'
import {readJSON} from 'fs-extra/esm'
import {checkStructuralEquality} from '#packages/cli-lib/verify/checkStructuralEquality.js'
export interface VerifyOpts {
  sourceLocale?: string
  missingKeys: boolean
  extraKeys: boolean
  structuralEquality: boolean
  messageSyntax?: 'icu' | 'java-printf' | 'apple-printf'
  ignore?: string[]
  /**
   * Whether to follow symbolic links when traversing directories.
   * Defaults to true for compatibility with pnpm symlinked node_modules.
   */
  followLinks?: boolean
}

export async function verify(
  files: string[],
  {
    sourceLocale,
    missingKeys = false,
    extraKeys = false,
    structuralEquality = false,
    messageSyntax = 'icu',
  }: VerifyOpts
): Promise<void> {
  debug('Checking translation files:')
  files.forEach(fn => debug(fn))

  if (messageSyntax === 'apple-printf') {
    const catalogs = Object.fromEntries(
      await Promise.all(files.map(async file => [file, await readJSON(file)]))
    )
    const issues = verifyXcstringsWithNative(
      catalogs,
      sourceLocale,
      missingKeys,
      structuralEquality
    )
    for (const issue of issues) {
      writeStderr(`${issue.locale}: ${issue.messageId}: ${issue.error}\n`)
    }
    process.exit(issues.length ? 1 : 0)
  }
  if (!sourceLocale)
    throw new Error('--source-locale is required for verify command')

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
    !(await (
      messageSyntax === 'java-printf'
        ? checkJavaPrintfStructure
        : checkStructuralEquality
    )(translationFilesContents, sourceLocale))
  ) {
    exitCode = 1
  }

  process.exit(exitCode)
}
