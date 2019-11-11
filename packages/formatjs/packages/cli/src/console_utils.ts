import chalk from 'chalk';
import readline from 'readline';
import tty from 'tty';

const CLEAR_WHOLE_LINE = 0;

// From:
// https://github.com/yarnpkg/yarn/blob/53d8004229f543f342833310d5af63a4b6e59c8a/src/reporters/console/util.js
export function clearLine(terminal: NodeJS.WriteStream) {
  if (!chalk.supportsColor) {
    if (terminal instanceof tty.WriteStream) {
      // terminal
      if (terminal.columns > 0) {
        terminal.write(`\r${' '.repeat(terminal.columns - 1)}`);
      }
      terminal.write(`\r`);
    }
    // ignore piping to file
  } else {
    readline.clearLine(terminal, CLEAR_WHOLE_LINE);
    readline.cursorTo(terminal, 0);
  }
}

export function warn(message: string): void {
  clearLine(process.stderr);
  process.stderr.write(`${chalk.yellow('warning')} ${message}\n`);
}

export function error(message: string): void {
  clearLine(process.stderr);
  process.stderr.write(`${chalk.red('error')} ${message}\n`);
}

export async function getStdinAsString(): Promise<string> {
  let result = '';
  return new Promise(resolve => {
    process.stdin.setEncoding('utf-8');
    process.stdin.on('readable', () => {
      let chunk;
      while ((chunk = process.stdin.read())) {
        result += chunk;
      }
    });
    process.stdin.on('end', () => {
      resolve(result);
    });
  });
}
