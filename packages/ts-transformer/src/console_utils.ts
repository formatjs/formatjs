import {green, red, yellow} from 'chalk'
import {format} from 'util'

const LEVEL_COLORS = {
  debug: green,
  warn: yellow,
  error: red,
}

function label(level: keyof typeof LEVEL_COLORS, message: string) {
  return `[@formatjs/ts-transformer] [${LEVEL_COLORS[level](
    level.toUpperCase()
  )}] ${message}`
}

export function debug(message: string, ...args: any[]): void {
  if (process.env.LOG_LEVEL !== 'debug') {
    return
  }
  process.stderr.write(format(label('debug', message), ...args))
  process.stderr.write('\n')
}

export function warn(message: string, ...args: any[]): void {
  process.stderr.write(format(label('warn', message), ...args))
  process.stderr.write('\n')
}

export function error(message: string, ...args: any[]): void {
  process.stderr.write(format(label('error', message), ...args))
  process.stderr.write('\n')
}
