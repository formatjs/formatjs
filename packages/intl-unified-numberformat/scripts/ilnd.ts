import * as minimist from 'minimist';
import {outputFileSync} from 'fs-extra';

function generateContinuousILND(startChar: string): string[] {
  const startCharCode = startChar.charCodeAt(0);
  const arr = new Array<string>(10);
  for (let i = 0; i < 10; i++) {
    arr[i] = String.fromCharCode(startCharCode + i);
  }
  return arr;
}

function main(args: Record<string, string>) {
  // https://tc39.es/proposal-unified-intl-numberformat/section11/numberformat_proposed_out.html#table-numbering-system-digits
  const ILND: Record<string, string[]> = (function () {
    return {
      arab: generateContinuousILND('\u0660'),
      arabext: generateContinuousILND('\u06f0'),
      bali: generateContinuousILND('\u1b50'),
      beng: generateContinuousILND('\u09e6'),
      deva: generateContinuousILND('\u0966'),
      fullwide: generateContinuousILND('\uff10'),
      gujr: generateContinuousILND('\u0ae6'),
      guru: generateContinuousILND('\u0a66'),
      khmr: generateContinuousILND('\u17e0'),
      knda: generateContinuousILND('\u0ce6'),
      laoo: generateContinuousILND('\u0ed0'),
      latn: generateContinuousILND('\u0030'),
      limb: generateContinuousILND('\u1946'),
      mlym: generateContinuousILND('\u0d66'),
      mong: generateContinuousILND('\u1810'),
      mymr: generateContinuousILND('\u1040'),
      orya: generateContinuousILND('\u0b66'),
      tamldec: generateContinuousILND('\u0be6'),
      telu: generateContinuousILND('\u0c66'),
      thai: generateContinuousILND('\u0e50'),
      tibt: generateContinuousILND('\u0f20'),
      hanidec: [
        '\u3007',
        '\u4e00',
        '\u4e8c',
        '\u4e09',
        '\u56db',
        '\u4e94',
        '\u516d',
        '\u4e03',
        '\u516b',
        '\u4e5d',
      ],
    };
  })();

  outputFileSync(args.out, `export default ${JSON.stringify(ILND)}`);
}

if (require.main === module) {
  main(minimist(process.argv));
}
