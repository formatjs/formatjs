import {format, styleText} from 'node:util'

type LogLevel = 'debug' | 'warn' | 'error'

const LEVEL_COLORS: Record<LogLevel, 'green' | 'yellow' | 'red'> = {
  debug: 'green',
  warn: 'yellow',
  error: 'red',
}

function label(level: LogLevel, message: string) {
  return `[@formatjs/ts-transformer] [${styleText(
    LEVEL_COLORS[level],
    level.toUpperCase()
  )}] ${message}`
}

export async function debug(message: string, ...args: any[]): Promise<void> {
  if (process.env.LOG_LEVEL !== 'debug') {
    return
  }
  console.error(format(label('debug', message), ...args))
  console.error('\n')
}

export function warn(message: string, ...args: any[]): void {
  console.error(format(label('warn', message), ...args))
  console.error('\n')
}

export function error(message: string, ...args: any[]): void {
  console.error(format(label('error', message), ...args))
  console.error('\n')
}
