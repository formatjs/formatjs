import {invariant} from './utils';

/**
 * https://tc39.es/ecma402/#sec-unicodeextensionvalue
 * @param extension
 * @param key
 */
export function UnicodeExtensionValue(extension: string, key: string) {
  invariant(key.length === 2, 'key must have 2 elements');
  const size = extension.length;
  let searchValue = `-${key}-`;
  let pos = extension.indexOf(searchValue);
  if (pos !== -1) {
    const start = pos + 4;
    let end = start;
    let k = start;
    let done = false;
    while (!done) {
      const e = extension.indexOf('-', k);
      let len;
      if (e === -1) {
        len = size - k;
      } else {
        len = e - k;
      }
      if (len === 2) {
        done = true;
      } else if (e === -1) {
        end = size;
        done = true;
      } else {
        end = e;
        k = e + 1;
      }
    }
    return extension.slice(start, end);
  }
  searchValue = `-${key}`;
  pos = extension.indexOf(searchValue);
  if (pos !== -1 && pos + 3 === size) {
    return '';
  }
  return undefined;
}
