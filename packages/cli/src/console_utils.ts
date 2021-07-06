import {supportsColor, green, red, yellow} from 'chalk'
import readline from 'readline'
import tty from 'tty'
import {format} from 'util'

const CLEAR_WHOLE_LINE = 0

// From:
// https://github.com/yarnpkg/yarn/blob/53d8004229f543f342833310d5af63a4b6e59c8a/src/reporters/console/util.js
export function clearLine(terminal: NodeJS.WriteStream) {
  if (!supportsColor) {
    if (terminal instanceof tty.WriteStream) {
      // terminal
      if (terminal.columns > 0) {
        terminal.write(`\r${' '.repeat(terminal.columns - 1)}`)
      }
      terminal.write(`\r`)
    }
    // ignore piping to file
  } else {
    readline.clearLine(terminal, CLEAR_WHOLE_LINE)
    readline.cursorTo(terminal, 0)
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

export function debug(message: string, ...args: any[]): void {
  if (process.env.LOG_LEVEL !== 'debug') {
    return
  }
  clearLine(process.stderr)
  process.stderr.write(format(label('debug', message), ...args))
  process.stderr.write('\n')
}

export function warn(message: string, ...args: any[]): void {
  clearLine(process.stderr)
  process.stderr.write(format(label('warn', message), ...args))
  process.stderr.write('\n')
}

export function error(message: string, ...args: any[]): void {
  clearLine(process.stderr)
  process.stderr.write(format(label('error', message), ...args))
  process.stderr.write('\n')
}

export async function getStdinAsString(): Promise<string> {
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
