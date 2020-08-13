---
id: upgrade-guide-4x
title: Upgrade Guide (v3 -> v4)
---

## Breaking API Changes

- All tags specified must have corresponding values and will throw error if it's missing, e.g:

```tsx
new IntlMessageFormat('a<b>strong</b>').format({
  b: (...chunks) => <strong>{chunks}</strong>,
});
```

- We don't allow formatting self-closing tags because we already use ICU `{placeholder}` syntax for that.
- XML/HTML tags are escaped using apostrophe just like other ICU constructs.
- Remove dependency on DOMParser and restrictions on void element like `<link>`. This effectively means you don't need to polyfill DOMParser in Node anymore.
- `FormattedHTMLMessage` & `intl.formatHTMLMessage` have been removed since `FormattedMessage` now fully supports embedded HTML tag.

## Why are we doing those changes?

- `FormattedHTMLMessage` & `intl.formatHTMLMessage` were originally created when React was fairly new. These components helped ease migration over from raw HTML to JSX. Given that current popularity of React right now and the fact that `FormattedMessage` allow rendering embedded HTML tag, this is no longer needed.
- Initially during the 1st iteration of embedded HTML support, we allow any tag that doesn’t have a corresponding formatter to be rendered as raw HTML. We’ve received feedbacks internally that allowing embedded HTML tag to be rendered as-is without sanitization is a XSS security risk. Therefore, in order to allow raw HTML tag you have to opt-in by escaping them using apostrophe. We will update our linter to check for this as well.

## Migrating off embedded HTML in messages

In order to restore the old behavior of `FormattedHTMLMessage` & `intl.formatHTMLMessage`, we suggest you use the rich text format feature as below:

Old way:

```ts
intl.formatHTMLMessage('This is a <a href="foo">link</a>');
```

New way:

```tsx
intl.formatMessage('This is a <a>link</a>', {
  a: (...chunks) => sanitizeHTML(`<a href="foo">${chunks.join('')}</a>`),
});
```

This forces developers to always sanitize their rendered HTML & chunks, thus minimizing XSS.
