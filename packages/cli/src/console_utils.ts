import {supportsColor, green, red, yellow} from 'chalk'
import readline from 'readline'
import {format, promisify} from 'util'

const CLEAR_WHOLE_LINE = 0

export const writeStderr = promisify(process.stderr.write).bind(process.stderr)
export const writeStdout = promisify(process.stdout.write).bind(process.stdout)

const nativeClearLine = promisify(readline.clearLine).bind(readline)
const nativeCursorTo = promisify(readline.cursorTo).bind(readline)

// From:
// https://github.com/yarnpkg/yarn/blob/53d8004229f543f342833310d5af63a4b6e59c8a/src/reporters/console/util.js
export async function clearLine(terminal: typeof process['stderr']) {
  if (!supportsColor) {
    if (terminal.isTTY) {
      // terminal
      if (terminal.columns > 0) {
        await writeStderr(`\r${' '.repeat(terminal.columns - 1)}`)
      }
      await writeStderr(`\r`)
    }
    // ignore piping to file
  } else {
    await nativeClearLine(terminal, CLEAR_WHOLE_LINE)
    await nativeCursorTo(terminal, 0, undefined)
  }
}

const LEVEL_COLORS = {
  debug: green,
  warn: yellow,
  error: red,
}

function label(level: keyof typeof LEVEL_COLORS, message: string) {
  return `[@formatjs/cli] [${LEVEL_COLORS[level](
    level.toUpperCase()
  )}] ${message}`
}

export async function debug(message: string, ...args: any[]) {
  if (process.env.LOG_LEVEL !== 'debug') {
    return
  }
  await clearLine(process.stderr)
  await writeStderr(format(label('debug', message), ...args))
  await writeStderr('\n')
}

export async function warn(message: string, ...args: any[]) {
  await clearLine(process.stderr)
  await writeStderr(format(label('warn', message), ...args))
  await writeStderr('\n')
}

export async function error(message: string, ...args: any[]) {
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
