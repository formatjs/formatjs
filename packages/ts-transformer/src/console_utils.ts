import * as chalkNs from 'chalk'
import {format} from 'util'

const chalk = (chalkNs as any).default ?? chalkNs

const LEVEL_COLORS = {
  debug: chalk.green,
  warn: chalk.yellow,
  error: chalk.red,
}

function label(level: keyof typeof LEVEL_COLORS, message: string) {
  return `[@formatjs/ts-transformer] [${LEVEL_COLORS[level](
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
