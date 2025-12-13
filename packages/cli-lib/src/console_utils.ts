import * as chalkNs from 'chalk'
import {
  clearLine as nativeClearLine,
  cursorTo as nativeCursorTo,
} from 'readline'
import {format, promisify} from 'util'

const chalk = (chalkNs as any).default ?? chalkNs

const CLEAR_WHOLE_LINE = 0

export const writeStderr: (arg1: string | Uint8Array) => Promise<void> =
  promisify(process.stderr.write).bind(process.stderr)
export const writeStdout: (arg1: string | Uint8Array) => Promise<void> =
  promisify(process.stdout.write).bind(process.stdout)

// From:
// https://github.com/yarnpkg/yarn/blob/53d8004229f543f342833310d5af63a4b6e59c8a/src/reporters/console/util.js
export async function clearLine(
  terminal: (typeof process)['stderr']
): Promise<void> {
  if (!chalk.supportsColor) {
    if (terminal.isTTY) {
      // terminal
      if (terminal.columns > 0) {
        await writeStderr(`\r${' '.repeat(terminal.columns - 1)}`)
      }
      await writeStderr(`\r`)
    }
    // ignore piping to file
  } else {
    nativeClearLine(terminal, CLEAR_WHOLE_LINE)
    nativeCursorTo(terminal, 0, undefined)
  }
}

const LEVEL_COLORS = {
  debug: chalk.green,
  warn: chalk.yellow,
  error: chalk.red,
}

function label(level: keyof typeof LEVEL_COLORS, message: string) {
  return `[@formatjs/cli] [${LEVEL_COLORS[level](
    level.toUpperCase()
  )}] ${message}`
}

export async function debug(message: string, ...args: any[]): Promise<void> {
  if (process.env.LOG_LEVEL !== 'debug') {
    return
  }
  await clearLine(process.stderr)
  await writeStderr(format(label('debug', message), ...args))
  await writeStderr('\n')
}

export async function warn(message: string, ...args: any[]): Promise<void> {
  await clearLine(process.stderr)
  await writeStderr(format(label('warn', message), ...args))
  await writeStderr('\n')
}

export async function error(message: string, ...args: any[]): Promise<void> {
  await clearLine(process.stderr)
  await writeStderr(format(label('error', message), ...args))
  await writeStderr('\n')
}

export function getStdinAsString(): Promise<string> {
  let result = ''
  return new Promise(resolve => {
    process.stdin.setEncoding('utf-8')
    process.stdin.on('readable', () => {
      let chunk
      while ((chunk = process.stdin.read())) {
        result += chunk
      }
    })
    process.stdin.on('end', () => {
      resolve(result)
    })
  })
}
