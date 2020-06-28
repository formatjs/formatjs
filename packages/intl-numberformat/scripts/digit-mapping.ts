import * as minimist from 'minimist';
import {outputJSONSync} from 'fs-extra';

// Generate an array of 10 characters with consecutive codepoint, starting from `starCharCode`.
function generateDigitChars(startCharCode: number): string[] {
  const arr = new Array<string>(10);
  for (let i = 0; i < 10; i++) {
    arr[i] = String.fromCharCode(startCharCode + i);
  }
  return arr;
}

// https://tc39.es/ecma402/#table-numbering-system-digits
const digitMapping: Record<string, string[]> = {
  arab: generateDigitChars(0x660),
  arabext: generateDigitChars(0x6f0),
  bali: generateDigitChars(0xb50),
  beng: generateDigitChars(0x9e6),
  deva: generateDigitChars(0x966),
  fullwide: generateDigitChars(0xf10),
  gujr: generateDigitChars(0xae6),
  guru: generateDigitChars(0xa66),
  khmr: generateDigitChars(0x7e0),
  knda: generateDigitChars(0xce6),
  laoo: generateDigitChars(0xed0),
  // There is NO need to generate latn since it is already the default!
  // latn: generateDigitChars(0x030),
  limb: generateDigitChars(0x946),
  mlym: generateDigitChars(0xd66),
  mong: generateDigitChars(0x810),
  mymr: generateDigitChars(0x040),
  orya: generateDigitChars(0xb66),
  tamldec: generateDigitChars(0xbe6),
  telu: generateDigitChars(0xc66),
  thai: generateDigitChars(0xe50),
  tibt: generateDigitChars(0xf20),
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

function main(args: minimist.ParsedArgs) {
  const {out} = args;
  outputJSONSync(out, digitMapping);
}

if (require.main === module) {
  main(minimist(process.argv));
}
