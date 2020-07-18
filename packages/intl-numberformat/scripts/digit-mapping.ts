import * as minimist from 'minimist';
import {outputJSONSync} from 'fs-extra';

// Generate an array of 10 characters with consecutive codepoint, starting from `starCharCode`.
function generateDigitChars(startCharCode: number): string[] {
  const arr = new Array<string>(10);
  for (let i = 0; i < 10; i++) {
    arr[i] = String.fromCodePoint(startCharCode + i);
  }
  return arr;
}

// https://tc39.es/ecma402/#table-numbering-system-digits
const digitMapping: Record<string, string[]> = {
  adlm: generateDigitChars(0x1e950),
  ahom: generateDigitChars(0x11730),
  arab: generateDigitChars(0x660),
  arabext: generateDigitChars(0x6f0),
  bali: generateDigitChars(0x1b50),
  beng: generateDigitChars(0x9e6),
  bhks: generateDigitChars(0x11c50),
  brah: generateDigitChars(0x11066),
  cakm: generateDigitChars(0x11136),
  cham: generateDigitChars(0xaa50),
  deva: generateDigitChars(0x966),
  diak: generateDigitChars(0x11950),
  fullwide: generateDigitChars(0xff10),
  gong: generateDigitChars(0x11da0),
  gonm: generateDigitChars(0x11d50),
  gujr: generateDigitChars(0xae6),
  guru: generateDigitChars(0xa66),
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
  hmng: generateDigitChars(0x16b50),
  hmnp: generateDigitChars(0x1e140),
  java: generateDigitChars(0xa9d0),
  kali: generateDigitChars(0xa900),
  khmr: generateDigitChars(0x17e0),
  knda: generateDigitChars(0xce6),
  lana: generateDigitChars(0x1a80),
  lanatham: generateDigitChars(0x1a90),
  laoo: generateDigitChars(0xed0),
  lepc: generateDigitChars(0x1a90),
  limb: generateDigitChars(0x1946),
  mathbold: generateDigitChars(0x1d7ce),
  mathdbl: generateDigitChars(0x1d7d8),
  mathmono: generateDigitChars(0x1d7f6),
  mathsanb: generateDigitChars(0x1d7ec),
  mathsans: generateDigitChars(0x1d7e2),
  mlym: generateDigitChars(0xd66),
  modi: generateDigitChars(0x11650),
  mong: generateDigitChars(0x1810),
  mroo: generateDigitChars(0x16a60),
  mtei: generateDigitChars(0xabf0),
  mymr: generateDigitChars(0x1040),
  mymrshan: generateDigitChars(0x1090),
  mymrtlng: generateDigitChars(0xa9f0),
  newa: generateDigitChars(0x11450),
  nkoo: generateDigitChars(0x07c0),
  olck: generateDigitChars(0x1c50),
  orya: generateDigitChars(0xb66),
  osma: generateDigitChars(0x104a0),
  rohg: generateDigitChars(0x10d30),
  saur: generateDigitChars(0xa8d0),
  segment: generateDigitChars(0x1fbf0),
  shrd: generateDigitChars(0x111d0),
  sind: generateDigitChars(0x112f0),
  sinh: generateDigitChars(0x0de6),
  sora: generateDigitChars(0x110f0),
  sund: generateDigitChars(0x1bb0),
  takr: generateDigitChars(0x116c0),
  talu: generateDigitChars(0x19d0),
  tamldec: generateDigitChars(0xbe6),
  telu: generateDigitChars(0xc66),
  thai: generateDigitChars(0xe50),
  tibt: generateDigitChars(0xf20),
  tirh: generateDigitChars(0x114d0),
  vaii: generateDigitChars(0x1620),
  wara: generateDigitChars(0x118e0),
  wcho: generateDigitChars(0x1e2f0),
};

function main(args: minimist.ParsedArgs) {
  const {out} = args;
  outputJSONSync(out, digitMapping);
}

if (require.main === module) {
  main(minimist(process.argv));
}
