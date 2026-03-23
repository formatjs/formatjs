import {resolve} from 'path'
import {Runfiles} from '@bazel/runfiles'

/**
 * Resolves the path to the Rust CLI binary.
 *
 * This utility handles two scenarios:
 * 1. Snapshot update mode: Binary is copied to packages/unplugin directory via copy_file rule
 * 2. Normal test mode: Binary is available via Bazel runfiles
 *
 * @param dirname - The import.meta.dirname of the test file
 * @returns The path to the Rust binary, or undefined if not found
 */
export function resolveRustBinaryPath(dirname: string): string | undefined {
  // Try to find Rust binary:
  // 1. Check parent directory (packages/unplugin/formatjs_cli, for snapshot update mode)
  const localRustBin = resolve(dirname, '../formatjs_cli')
  if (require('fs').existsSync(localRustBin)) {
    return localRustBin
  }

  // 2. Use runfiles (for normal Bazel test mode)
  try {
    const runfiles = new Runfiles()
    return runfiles.resolveWorkspaceRelative('crates/formatjs_cli/formatjs_cli')
  } catch {
    console.warn('Rust CLI not available, conformance tests will be skipped')
    return undefined
  }
}
