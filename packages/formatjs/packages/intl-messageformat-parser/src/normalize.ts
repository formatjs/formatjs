import {
  MessageFormatElement,
  isPluralElement,
  isLiteralElement,
  LiteralElement
} from './types';
import { parse } from './parser';

const PLURAL_HASHTAG_REGEX = /(^|[^\\])#/g;

/**
 * Whether to convert `#` in plural rule options
 * to `{var, number}`
 * @param el AST Element
 * @param pluralStack current plural stack
 */
export function normalizeHashtagInPlural(els: MessageFormatElement[]) {
  els.forEach(el => {
    // If we're encountering a plural el
    if (!isPluralElement(el)) {
      return;
    }
    // Go down the options and search for # in any literal element
    Object.keys(el.options).forEach(id => {
      const opt = el.options[id];
      // If we got a match, we have to split this
      // and inject a NumberElement in the middle
      let matchingLiteralElIndex = -1;
      let literalEl: LiteralElement | undefined = undefined;
      for (let i = 0; i < opt.value.length; i++) {
        const el = opt.value[i] as LiteralElement;
        if (isLiteralElement(el) && PLURAL_HASHTAG_REGEX.test(el.value)) {
          matchingLiteralElIndex = i;
          literalEl = el;
          break;
        }
      }

      if (literalEl) {
        const newValue = literalEl.value.replace(
          PLURAL_HASHTAG_REGEX,
          `$1{${el.value}, number}`
        );
        const newEls = parse(newValue);
        opt.value.splice(matchingLiteralElIndex, 1, ...newEls);
      }
      normalizeHashtagInPlural(opt.value);
    });
  });
}
