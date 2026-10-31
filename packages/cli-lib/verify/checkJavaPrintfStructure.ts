import {verifyJavaPrintfWithNative} from '#packages/cli-lib/native.js'
import {writeStderr} from '#packages/cli-lib/console_utils.js'

export async function checkJavaPrintfStructure(
  catalogs: Record<string, unknown>,
  sourceLocale: string
): Promise<boolean> {
  const issues = verifyJavaPrintfWithNative(catalogs, sourceLocale)
  for (const issue of issues) {
    writeStderr(`${issue.locale}: ${issue.messageId}: ${issue.error}\n`)
  }
  return issues.length === 0
}
